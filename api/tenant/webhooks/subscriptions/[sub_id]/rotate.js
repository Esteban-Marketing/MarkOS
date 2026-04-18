'use strict';

// Phase 203 Plan 05 Task 2:
// POST /api/tenant/webhooks/subscriptions/{sub_id}/rotate
//
// Tenant-admin triggered signing-secret rotation (D-09). Mirrors the 202-09 tenant-scope
// guard pattern (api/tenant/mcp/sessions/revoke.js) and adds per-tenant rate-limiting:
// Upstash sliding-window 1 call / 5 min / tenant prevents rotation-rollback timing abuse
// (T-203-05-02 / RESEARCH §Threat Patterns "Rotation rollback abuse").
//
// Flow:
//   1. Method gate (POST; 405 else)
//   2. Header auth (x-markos-user-id + x-markos-tenant-id; 401 if missing)
//   3. SELECT subscription.tenant_id; 403 cross_tenant_forbidden on mismatch
//   4. Rate-limit gate (1/5min/tenant; 429 rate_limited on fail)
//   5. Delegate to rotation.cjs startRotation
//   6. Map typed errors → HTTP (rotation_already_active → 409; else 500)

const { writeJson } = require('../../../../../lib/markos/crm/api.cjs');
const { startRotation } = require('../../../../../lib/markos/webhooks/rotation.cjs');

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
  const { getSupabase: real } = require('../../../../../lib/markos/auth/session.ts');
  return real();
}

// Lazy build the Upstash rate-limit client so tests can inject a mock limiter via deps.limiter
// (matches the lib/markos/mcp/rate-limit.cjs injection pattern). Prefix 'rl:webhook:rotate' is
// disjoint from 'rl:mcp:session' / 'rl:mcp:tenant' so counters never collide.
function getLimiter(deps) {
  if (deps && deps.limiter) return deps.limiter;
  const { Redis } = require('@upstash/redis');
  const { Ratelimit } = require('@upstash/ratelimit');
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1, '5 m'),
    prefix: 'rl:webhook:rotate',
  });
}

module.exports = async function handler(req, res) { return handleRotate(req, res); };
module.exports.handleRotate = handleRotate;

async function handleRotate(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const { sub_id } = req.query || {};
  if (!sub_id) return writeJson(res, 400, { error: 'missing_params' });

  await readJson(req);

  const supabase = getSupabase(deps);

  // Subscription-scope tenant guard (T-203-05-01) — SELECT before delegate.
  const { data: sub, error: subErr } = await supabase
    .from('markos_webhook_subscriptions')
    .select('id, tenant_id')
    .eq('id', sub_id)
    .maybeSingle();
  if (subErr) return writeJson(res, 500, { error: 'rotate_failed' });
  if (!sub) return writeJson(res, 404, { error: 'subscription_not_found' });
  if (sub.tenant_id !== tenant_id) return writeJson(res, 403, { error: 'cross_tenant_forbidden' });

  // Rate-limit: 1 rotate per 5 minutes per tenant (T-203-05-02 anti-timing-probe).
  const limiter = getLimiter(deps);
  const rl = await limiter.limit(tenant_id);
  if (!rl.success) {
    const resetMs = rl.reset || (Date.now() + 300_000);
    const retry_after = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
    res.setHeader ? res.setHeader('Retry-After', String(retry_after)) : null;
    return writeJson(res, 429, { error: 'rate_limited', retry_after });
  }

  try {
    const result = await startRotation(supabase, {
      tenant_id,
      subscription_id: sub_id,
      actor_id: user_id,
    });
    return writeJson(res, 200, { ok: true, rotation_id: result.rotation_id, grace_ends_at: result.grace_ends_at });
  } catch (err) {
    const code = err && err.message ? err.message : 'rotate_failed';
    if (code === 'rotation_already_active') return writeJson(res, 409, { error: 'rotation_already_active' });
    return writeJson(res, 500, { error: 'rotate_failed' });
  }
}
