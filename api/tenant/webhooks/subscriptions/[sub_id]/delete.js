'use strict';

// Phase 203 Plan 09 Task 1:
// POST /api/tenant/webhooks/subscriptions/{sub_id}/delete
//
// Surface 2 Danger-zone delete. Soft-deletes the subscription + cancels in-flight
// deliveries. Audit row preserved forever per UI-SPEC §S2 Danger-zone copy:
// "Any in-flight deliveries are cancelled. Historical delivery records are retained
// for audit. This cannot be undone."
//
// Flow:
//   1. Method gate (POST; 405 else)
//   2. Header auth (x-markos-user-id + x-markos-tenant-id; 401 if missing)
//   3. Cross-tenant guard (T-203-09-01): SELECT + tenant_id compare → 403
//   4. UPDATE markos_webhook_deliveries SET status='cancelled' + dlq_reason='subscription_deleted'
//      WHERE subscription_id=X AND status IN ('pending','retrying')
//   5. UPDATE markos_webhook_subscriptions SET active=false WHERE id=X AND tenant_id=Y
//   6. Audit emit (T-203-09-06): source_domain='webhooks', action='subscription.deleted'

const { writeJson } = require('../../../../../lib/markos/crm/api.cjs');
const { enqueueAuditStaging } = require('../../../../../lib/markos/audit/writer.cjs');

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../../lib/markos/auth/session.ts');
  return real();
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  return new Promise((resolve) => {
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) { return handleDelete(req, res); };
module.exports.handleDelete = handleDelete;

async function handleDelete(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  const org_id = req.headers['x-markos-org-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const { sub_id } = req.query || {};
  if (!sub_id) return writeJson(res, 400, { error: 'missing_params' });

  await readJson(req);

  const supabase = getSupabase(deps);

  // T-203-09-01 — cross-tenant guard before any mutation.
  const { data: sub, error: selErr } = await supabase
    .from('markos_webhook_subscriptions')
    .select('id, tenant_id, active')
    .eq('id', sub_id)
    .maybeSingle();
  if (selErr) return writeJson(res, 500, { error: 'db_error' });
  if (!sub) return writeJson(res, 404, { error: 'subscription_not_found' });
  if (sub.tenant_id !== tenant_id) return writeJson(res, 403, { error: 'cross_tenant_forbidden' });

  const nowIso = new Date().toISOString();

  // Cancel in-flight deliveries (T-203-09-05 is the accepted disposition — but
  // per UI-SPEC we must mark existing pending/retrying rows cancelled so they
  // never fire post-delete).
  const { error: cancelErr } = await supabase
    .from('markos_webhook_deliveries')
    .update({
      status: 'cancelled',
      dlq_reason: 'subscription_deleted',
      updated_at: nowIso,
    })
    .eq('subscription_id', sub_id)
    .in('status', ['pending', 'retrying']);
  if (cancelErr) return writeJson(res, 500, { error: 'db_error' });

  // Soft-delete the subscription (preserves the audit row + historical deliveries).
  const { error: deactivateErr } = await supabase
    .from('markos_webhook_subscriptions')
    .update({ active: false, updated_at: nowIso })
    .eq('id', sub_id)
    .eq('tenant_id', tenant_id);
  if (deactivateErr) return writeJson(res, 500, { error: 'db_error' });

  // T-203-09-06 — audit emit. Hash-chained via markos_audit_log writer.
  try {
    await enqueueAuditStaging(supabase, {
      tenant_id,
      org_id: org_id || null,
      source_domain: 'webhooks',
      action: 'subscription.deleted',
      actor_id: user_id,
      actor_role: 'tenant_admin',
      payload: {
        subscription_id: sub_id,
        deleted_at: nowIso,
      },
    });
  } catch { /* audit failure must not block delete (pattern per Plan 203-03) */ }

  return writeJson(res, 200, { ok: true });
}
