'use strict';

// Phase 203 Plan 07 — Per-subscription webhook rate-limit (D-13).
// Plan-tier defaults: Free 10rps / Team 60rps / Enterprise 300rps.
// Per-sub override may ONLY LOWER the plan ceiling (never raise).
// Shares `@upstash/ratelimit` + `@upstash/redis` with 202-04 MCP pipeline (no new deps).
//
// T-203-07-01 mitigation: resolvePerSubRps applies Math.min(override, ceiling) so override
// can only lower the cap. Subscribe-time validation in api/webhooks/subscribe.js hardens this
// with a 400 rps_override_exceeds_plan rejection before the row is persisted.
// T-203-07-04 mitigation: unknown plan_tier falls through to 'free' (fail-closed to lowest cap).
// T-203-07-02 mitigation: per-sub sliding-window backed by Upstash Redis survives Fluid Compute
// instance turnover (RESEARCH §Pattern 4 / §Pitfall 1).

const PLAN_TIER_RPS = Object.freeze({ free: 10, team: 60, enterprise: 300 });

function resolvePerSubRps({ plan_tier, rps_override }) {
  // Unknown plan_tier → fall through to free (lowest cap). T-203-07-04 fail-closed.
  const ceiling = Object.prototype.hasOwnProperty.call(PLAN_TIER_RPS, plan_tier)
    ? PLAN_TIER_RPS[plan_tier]
    : PLAN_TIER_RPS.free;
  if (rps_override === null || rps_override === undefined) return ceiling;
  if (typeof rps_override !== 'number' || !Number.isFinite(rps_override) || rps_override < 1) {
    throw new Error('invalid_rps_override');
  }
  // D-13: override can ONLY lower the plan-tier ceiling.
  return Math.min(rps_override, ceiling);
}

// Upstash limiter cache keyed on (sub_id, resolved_rps). Unlike 202-04 which has a single
// global limiter pair, webhook per-sub rates vary per subscription because rps_override
// differs. Memoize per-(sub_id, resolved_rps) tuple so the Upstash slidingWindow state
// stays consistent across calls, but flipping a subscription's rps_override doesn't require
// a process restart.
const _limiterCache = new Map();
const _LIMITER_CACHE_MAX = 1024; // hard cap to avoid unbounded growth per serverless instance

function getLimiter(overrideRedis, resolved_rps, sub_id) {
  // Test injection: pass a pre-built object with `.limit(key)` directly.
  if (overrideRedis && typeof overrideRedis.limit === 'function') return overrideRedis;
  const key = `${sub_id}:${resolved_rps}`;
  if (_limiterCache.has(key)) return _limiterCache.get(key);
  const { Redis } = require('@upstash/redis');
  const { Ratelimit } = require('@upstash/ratelimit');
  const redis = overrideRedis || Redis.fromEnv();
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(resolved_rps, '1 s'),
    prefix: 'rl:webhook:sub',
  });
  if (_limiterCache.size >= _LIMITER_CACHE_MAX) {
    // Drop oldest entry — serverless instances are short-lived; bounded cache is safe.
    const firstKey = _limiterCache.keys().next().value;
    if (firstKey !== undefined) _limiterCache.delete(firstKey);
  }
  _limiterCache.set(key, limiter);
  return limiter;
}

async function checkWebhookRateLimit(redisOrLimiter, { subscription, plan_tier }) {
  if (!subscription || !subscription.id) {
    throw new Error('checkWebhookRateLimit: subscription.id required');
  }
  const resolved = resolvePerSubRps({
    plan_tier,
    rps_override: subscription.rps_override == null ? null : subscription.rps_override,
  });
  const limiter = getLimiter(redisOrLimiter, resolved, subscription.id);
  const r = await limiter.limit(subscription.id);
  if (!r || !r.success) {
    const reset = (r && r.reset) || Date.now();
    const retry_after = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return {
      ok: false,
      reason: 'sub_rps',
      retry_after,
      limit: resolved,
      error_429: Object.assign(new Error('rate_limited'), {
        http: 429,
        headers: { 'Retry-After': String(retry_after) },
        body: {
          error: 'rate_limited',
          sub_id: subscription.id,
          retry_after,
          limit: resolved,
        },
      }),
    };
  }
  return { ok: true, limit: resolved, remaining: r.remaining };
}

// Shared envelope builder for handlers that want to emit the 429 without routing through
// the error_429 carried on the checkWebhookRateLimit failure return.
function buildRateLimitedEnvelope({ retry_after, limit, sub_id }) {
  return {
    http: 429,
    headers: { 'Retry-After': String(retry_after) },
    body: { error: 'rate_limited', sub_id, retry_after, limit },
  };
}

function _resetLimiterCacheForTests() {
  _limiterCache.clear();
}

module.exports = {
  PLAN_TIER_RPS,
  resolvePerSubRps,
  checkWebhookRateLimit,
  buildRateLimitedEnvelope,
  _resetLimiterCacheForTests,
};
