'use strict';

// Phase 203 Plan 04 Task 2:
// POST /api/tenant/webhooks/subscriptions/{sub_id}/dlq/replay
//
// Tenant-admin triggered BATCH replay from DLQ. Body shape: { delivery_ids: string[] }
// BATCH_CAP = 100 enforced at handler + library layers (defense-in-depth).
// Vercel Queues idempotencyKey keyed on (original_id, 5-min bucket) so rapid re-clicks
// across instances cannot double-dispatch (RESEARCH §Pitfall 7, T-203-04-04).
//
// Mirrors the 202-09 pattern (api/tenant/mcp/sessions/revoke.js) for the tenant-scope guard.

const { writeJson } = require('../../../../../../lib/markos/crm/api.cjs');
const { replayBatch } = require('../../../../../../lib/markos/webhooks/replay.cjs');

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
  const { getSupabase: real } = require('../../../../../../lib/markos/auth/session.ts');
  return real();
}

function getQueue(deps) {
  if (deps && deps.queue) return deps.queue;
  const { getWebhookStores } = require('../../../../../../lib/markos/webhooks/store.cjs');
  return getWebhookStores().queue;
}

module.exports = async function handler(req, res) { return handleReplayBatch(req, res); };
module.exports.handleReplayBatch = handleReplayBatch;

async function handleReplayBatch(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const { sub_id } = req.query || {};
  if (!sub_id) return writeJson(res, 400, { error: 'missing_params' });

  const body = await readJson(req);
  const delivery_ids = body && Array.isArray(body.delivery_ids) ? body.delivery_ids : null;
  if (!delivery_ids || delivery_ids.length === 0) {
    return writeJson(res, 400, { error: 'empty_batch' });
  }
  if (delivery_ids.length > 100) {
    return writeJson(res, 400, { error: 'batch_too_large' });
  }

  const supabase = getSupabase(deps);

  // Subscription-scope tenant guard (T-203-04-02).
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
    const result = await replayBatch(supabase, queue, {
      tenant_id,
      subscription_id: sub_id,
      delivery_ids,
      actor_id: user_id,
      deps: {
        enqueueAuditStaging: deps.enqueueAuditStaging,
        actor_role: req.headers['x-markos-actor-role'] || 'owner',
        now: deps.now,
      },
    });
    return writeJson(res, 200, {
      ok: true,
      batch_id: result.batch_id,
      count: result.count,
      replayed: result.replayed,
      skipped: result.skipped,
    });
  } catch (err) {
    const code = err && err.message ? err.message : 'replay_failed';
    if (code === 'batch_too_large') return writeJson(res, 400, { error: 'batch_too_large' });
    return writeJson(res, 500, { error: 'replay_failed' });
  }
}
