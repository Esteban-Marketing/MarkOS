'use strict';

// Phase 203 Plan 05 Task 2:
// POST /api/tenant/webhooks/subscriptions/{sub_id}/rotate/rollback
//
// Tenant-admin rollback during grace window (D-12). Mirrors 202-09 tenant-scope guard.
// The RPC enforces past-grace rejection — handler merely maps typed errors to HTTP codes.

const { writeJson } = require('../../../../../../lib/markos/crm/api.cjs');
const { rollbackRotation } = require('../../../../../../lib/markos/webhooks/rotation.cjs');

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

module.exports = async function handler(req, res) { return handleRollback(req, res); };
module.exports.handleRollback = handleRollback;

async function handleRollback(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const { sub_id } = req.query || {};
  if (!sub_id) return writeJson(res, 400, { error: 'missing_params' });

  await readJson(req);

  const supabase = getSupabase(deps);

  // Subscription-scope tenant guard.
  const { data: sub, error: subErr } = await supabase
    .from('markos_webhook_subscriptions')
    .select('id, tenant_id')
    .eq('id', sub_id)
    .maybeSingle();
  if (subErr) return writeJson(res, 500, { error: 'rollback_failed' });
  if (!sub) return writeJson(res, 404, { error: 'subscription_not_found' });
  if (sub.tenant_id !== tenant_id) return writeJson(res, 403, { error: 'cross_tenant_forbidden' });

  try {
    await rollbackRotation(supabase, {
      tenant_id,
      subscription_id: sub_id,
      actor_id: user_id,
    });
    return writeJson(res, 200, { ok: true });
  } catch (err) {
    const code = err && err.message ? err.message : 'rollback_failed';
    if (code === 'past_grace') return writeJson(res, 409, { error: 'past_grace' });
    if (code === 'rotation_not_active') return writeJson(res, 409, { error: 'rotation_not_active' });
    return writeJson(res, 500, { error: 'rollback_failed' });
  }
}
