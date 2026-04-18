'use strict';

// Phase 203 Plan 09 Task 1:
// POST /api/tenant/webhooks/subscriptions/{sub_id}/update
//
// Surface 2 Settings-tab save. Mutates { url, events, rps_override } with
// defense-in-depth:
//   - Cross-tenant guard (T-203-09-01): SELECT + tenant_id compare → 403
//   - SSRF re-check on URL change (T-203-09-03): assertUrlIsPublic; 400 on block
//   - rps_override ceiling check (T-203-09-04): Math.min(override, ceiling); 400 on raise
//   - Audit emit (T-203-09-06): source_domain='webhooks', action='subscription.updated'
//   - Secret columns never read/echoed (T-203-09-02): explicit SELECT list
//
// Pattern mirrors api/tenant/webhooks/subscriptions/[sub_id]/rotate.js auth gate.

const { writeJson } = require('../../../../../lib/markos/crm/api.cjs');
const { assertUrlIsPublic } = require('../../../../../lib/markos/webhooks/ssrf-guard.cjs');
const { PLAN_TIER_RPS } = require('../../../../../lib/markos/webhooks/rate-limit.cjs');
const { enqueueAuditStaging } = require('../../../../../lib/markos/audit/writer.cjs');

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  return new Promise((resolve) => {
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../../lib/markos/auth/session.ts');
  return real();
}

async function resolvePlanTier(supabase, org_id) {
  if (!org_id) return 'free';
  try {
    const { data: org } = await supabase
      .from('markos_orgs')
      .select('plan_tier')
      .eq('id', org_id)
      .maybeSingle();
    return (org && org.plan_tier) || 'free';
  } catch {
    return 'free';
  }
}

function validateRpsOverride(rawOverride, plan_tier) {
  if (rawOverride === null || rawOverride === undefined) return { value: null };
  if (typeof rawOverride !== 'number' || !Number.isFinite(rawOverride) || rawOverride < 1) {
    return { error: { code: 'invalid_rps_override' } };
  }
  const ceiling = Object.prototype.hasOwnProperty.call(PLAN_TIER_RPS, plan_tier)
    ? PLAN_TIER_RPS[plan_tier]
    : PLAN_TIER_RPS.free;
  if (rawOverride > ceiling) {
    return { error: { code: 'rps_override_exceeds_plan', ceiling } };
  }
  return { value: rawOverride };
}

module.exports = async function handler(req, res) { return handleUpdate(req, res); };
module.exports.handleUpdate = handleUpdate;

async function handleUpdate(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  const org_id = req.headers['x-markos-org-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const { sub_id } = req.query || {};
  if (!sub_id) return writeJson(res, 400, { error: 'missing_params' });

  const body = await readJson(req);

  const supabase = getSupabase(deps);

  // Cross-tenant guard (T-203-09-01).
  const { data: sub, error: selErr } = await supabase
    .from('markos_webhook_subscriptions')
    .select('id, tenant_id, url, events, rps_override, active')
    .eq('id', sub_id)
    .maybeSingle();
  if (selErr) return writeJson(res, 500, { error: 'db_error' });
  if (!sub) return writeJson(res, 404, { error: 'subscription_not_found' });
  if (sub.tenant_id !== tenant_id) return writeJson(res, 403, { error: 'cross_tenant_forbidden' });

  const updates = {};

  // URL change → SSRF re-check (T-203-09-03 — mitigation re-run on mutation).
  if (Object.prototype.hasOwnProperty.call(body, 'url') && body.url !== sub.url) {
    if (typeof body.url !== 'string' || body.url.length === 0) {
      return writeJson(res, 400, { error: 'invalid_url' });
    }
    try {
      await assertUrlIsPublic(body.url);
    } catch (err) {
      const msg = (err && err.message) || 'invalid_url';
      // assertUrlIsPublic emits category-prefixed errors (private_ip:loopback, etc.).
      const category = String(msg).split(':')[0] || 'invalid_url';
      const mapped = ['private_ip', 'https_required', 'invalid_scheme'].includes(category)
        ? category
        : 'invalid_url';
      return writeJson(res, 400, { error: mapped });
    }
    updates.url = body.url;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'events')) {
    if (!Array.isArray(body.events)) return writeJson(res, 400, { error: 'invalid_events' });
    updates.events = body.events;
  }

  // rps_override (T-203-09-04 ceiling re-check).
  if (Object.prototype.hasOwnProperty.call(body, 'rps_override')) {
    const plan_tier = await resolvePlanTier(supabase, org_id);
    const v = validateRpsOverride(body.rps_override, plan_tier);
    if (v.error) {
      const errBody = { error: v.error.code };
      if (v.error.ceiling !== undefined) errBody.ceiling = v.error.ceiling;
      return writeJson(res, 400, errBody);
    }
    updates.rps_override = v.value;
  }

  if (Object.keys(updates).length === 0) {
    return writeJson(res, 200, { ok: true, subscription: sub });
  }

  updates.updated_at = new Date().toISOString();

  const { data: updated, error: updErr } = await supabase
    .from('markos_webhook_subscriptions')
    .update(updates)
    .eq('id', sub_id)
    .eq('tenant_id', tenant_id)
    .select('id, tenant_id, url, events, active, rps_override, updated_at, rotation_state, grace_ends_at')
    .maybeSingle();
  if (updErr) return writeJson(res, 500, { error: 'db_error' });

  // T-203-09-06: audit trail for every subscription mutation.
  try {
    await enqueueAuditStaging(supabase, {
      tenant_id,
      org_id: org_id || null,
      source_domain: 'webhooks',
      action: 'subscription.updated',
      actor_id: user_id,
      actor_role: 'tenant_admin',
      payload: {
        subscription_id: sub_id,
        fields_changed: Object.keys(updates).filter((k) => k !== 'updated_at'),
      },
    });
  } catch {
    // Audit failure must never block the save — the user sees a success toast;
    // the hash-chained audit batch writer's retry picks up next drain cycle.
  }

  return writeJson(res, 200, { ok: true, subscription: updated || sub });
}
