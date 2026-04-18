'use strict';

// Phase 203 Plan 04 Task 2:
// POST /api/tenant/webhooks/subscriptions/{sub_id}/deliveries/{delivery_id}/replay
//
// Tenant-admin triggered single-delivery replay. Mirrors the 202-09 tenant-scope guard
// pattern (api/tenant/mcp/sessions/revoke.js) verbatim:
//   1. Method gate (POST only; 405 else)
//   2. Header auth (x-markos-user-id + x-markos-tenant-id; 401 if missing)
//   3. SELECT subscription.tenant_id; 403 cross_tenant_forbidden if mismatched
//   4. Delegate to replay.cjs replaySingle
//   5. Map typed errors → HTTP codes (not_found → 404, not_failed → 409,
//      cross_subscription → 400, cross_tenant_forbidden → 403, else → 500)

const { writeJson } = require('../../../../../../../lib/markos/crm/api.cjs');
const { replaySingle } = require('../../../../../../../lib/markos/webhooks/replay.cjs');

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
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
  const { getWebhookStores } = require('../../../../../../../lib/markos/webhooks/store.cjs');
  // The store holds the service-role client at _supaClient — we expose via getWebhookStores().
  // For production, callers pass { supabase } or we fall back to session helper.
  const { getSupabase: real } = require('../../../../../../../lib/markos/auth/session.ts');
  return real();
}

function getQueue(deps) {
  if (deps && deps.queue) return deps.queue;
  const { getWebhookStores } = require('../../../../../../../lib/markos/webhooks/store.cjs');
  return getWebhookStores().queue;
}

module.exports = async function handler(req, res) { return handleReplaySingle(req, res); };
module.exports.handleReplaySingle = handleReplaySingle;

async function handleReplaySingle(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const { sub_id, delivery_id } = req.query || {};
  if (!sub_id || !delivery_id) return writeJson(res, 400, { error: 'missing_params' });

  // Drain body (POST convention — may be empty) so req.on('end') fires before we return.
  await readJson(req);

  const supabase = getSupabase(deps);

  // Subscription-scope tenant guard (T-203-04-02) — SELECT before delegating.
  const { data: sub, error: subErr } = await supabase
    .from('markos_webhook_subscriptions')
    .select('id, tenant_id')
    .eq('id', sub_id)
    .maybeSingle();
  if (subErr) return writeJson(res, 500, { error: 'replay_failed' });
  if (!sub) return writeJson(res, 404, { error: 'subscription_not_found' });
  if (sub.tenant_id !== tenant_id) return writeJson(res, 403, { error: 'cross_tenant_forbidden' });

  const queue = getQueue(deps);

  try {
    const result = await replaySingle(supabase, queue, {
      tenant_id,
      subscription_id: sub_id,
      delivery_id,
      actor_id: user_id,
      deps: {
        enqueueAuditStaging: deps.enqueueAuditStaging,
        actor_role: req.headers['x-markos-actor-role'] || 'owner',
      },
    });
    return writeJson(res, 200, { ok: true, original_id: result.original_id, new_id: result.new_id });
  } catch (err) {
    const code = err && err.message ? err.message : 'replay_failed';
    if (code === 'not_found') return writeJson(res, 404, { error: 'not_found' });
    if (code === 'cross_tenant_forbidden') return writeJson(res, 403, { error: 'cross_tenant_forbidden' });
    if (code === 'cross_subscription') return writeJson(res, 400, { error: 'cross_subscription' });
    if (code === 'not_failed') return writeJson(res, 409, { error: 'not_failed' });
    return writeJson(res, 500, { error: 'replay_failed' });
  }
}
