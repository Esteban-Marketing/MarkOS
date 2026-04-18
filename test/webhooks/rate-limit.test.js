'use strict';

// Phase 203 Plan 07 Task 1: rate-limit library (D-13).
// Tests behaviors 1a..1j from the plan.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PLAN_TIER_RPS,
  resolvePerSubRps,
  checkWebhookRateLimit,
  buildRateLimitedEnvelope,
} = require('../../lib/markos/webhooks/rate-limit.cjs');

function mockLimiter(results) {
  let i = 0;
  return {
    async limit(_id) {
      const r = results[Math.min(i, results.length - 1)];
      i += 1;
      return r;
    },
  };
}

// 1a — PLAN_TIER_RPS exports D-13 locked numbers.
test('Plan 203-07 1a: PLAN_TIER_RPS exports { free: 10, team: 60, enterprise: 300 }', () => {
  assert.equal(PLAN_TIER_RPS.free, 10);
  assert.equal(PLAN_TIER_RPS.team, 60);
  assert.equal(PLAN_TIER_RPS.enterprise, 300);
});

// 1b/1c/1d — plan-tier defaults (null override).
test('Plan 203-07 1b: resolvePerSubRps(free, null) → 10', () => {
  assert.equal(resolvePerSubRps({ plan_tier: 'free', rps_override: null }), 10);
});

test('Plan 203-07 1c: resolvePerSubRps(team, null) → 60', () => {
  assert.equal(resolvePerSubRps({ plan_tier: 'team', rps_override: null }), 60);
});

test('Plan 203-07 1d: resolvePerSubRps(enterprise, null) → 300', () => {
  assert.equal(resolvePerSubRps({ plan_tier: 'enterprise', rps_override: null }), 300);
});

// 1e — override lowers.
test('Plan 203-07 1e: resolvePerSubRps(team, 30) → 30 (override lowers)', () => {
  assert.equal(resolvePerSubRps({ plan_tier: 'team', rps_override: 30 }), 30);
});

// 1f — override cannot raise; caps to ceiling.
test('Plan 203-07 1f: resolvePerSubRps(team, 120) → 60 (cap not raise)', () => {
  assert.equal(resolvePerSubRps({ plan_tier: 'team', rps_override: 120 }), 60);
});

// 1g — unknown tier falls through to free (T-203-07-04 fail-closed).
test('Plan 203-07 1g: resolvePerSubRps(unknown, null) → 10 (defaults to free)', () => {
  assert.equal(resolvePerSubRps({ plan_tier: 'unknown_tier', rps_override: null }), 10);
});

// 1h — checkWebhookRateLimit success path (ok=true).
test('Plan 203-07 1h: checkWebhookRateLimit ok=true on limiter success', async () => {
  const limiter = mockLimiter([{ success: true, remaining: 59, reset: Date.now() + 1000 }]);
  const r = await checkWebhookRateLimit(limiter, {
    subscription: { id: 'whsub_1', rps_override: null },
    plan_tier: 'team',
  });
  assert.equal(r.ok, true);
  assert.equal(r.limit, 60);
  assert.equal(r.remaining, 59);
});

// 1i — checkWebhookRateLimit breach → ok=false with retry_after and error_429.
test('Plan 203-07 1i: checkWebhookRateLimit breach → ok=false with retry_after', async () => {
  const resetAt = Date.now() + 2_500;
  const limiter = mockLimiter([{ success: false, reset: resetAt, remaining: 0 }]);
  const r = await checkWebhookRateLimit(limiter, {
    subscription: { id: 'whsub_1', rps_override: null },
    plan_tier: 'team',
  });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'sub_rps');
  assert.equal(r.limit, 60);
  assert.ok(r.retry_after >= 1);
  // error_429 carries HTTP 429 + Retry-After header + structured body
  assert.equal(r.error_429.http, 429);
  assert.ok(r.error_429.headers['Retry-After']);
  assert.equal(r.error_429.body.error, 'rate_limited');
  assert.equal(r.error_429.body.sub_id, 'whsub_1');
  assert.equal(r.error_429.body.limit, 60);
});

// 1j — buildRateLimitedEnvelope returns the correct shape.
test('Plan 203-07 1j: buildRateLimitedEnvelope returns { http, headers, body }', () => {
  const env = buildRateLimitedEnvelope({ retry_after: 7, limit: 60, sub_id: 'whsub_x' });
  assert.equal(env.http, 429);
  assert.equal(env.headers['Retry-After'], '7');
  assert.equal(env.body.error, 'rate_limited');
  assert.equal(env.body.sub_id, 'whsub_x');
  assert.equal(env.body.retry_after, 7);
  assert.equal(env.body.limit, 60);
});

// Additional: resolvePerSubRps with override applied at ceiling uses override (equal).
test('Plan 203-07 extra: resolvePerSubRps(team, 60) → 60 (override=ceiling)', () => {
  assert.equal(resolvePerSubRps({ plan_tier: 'team', rps_override: 60 }), 60);
});

// Additional: override <1 or non-number throws invalid_rps_override.
test('Plan 203-07 extra: resolvePerSubRps(team, 0) throws invalid_rps_override', () => {
  assert.throws(
    () => resolvePerSubRps({ plan_tier: 'team', rps_override: 0 }),
    /invalid_rps_override/,
  );
});

test('Plan 203-07 extra: resolvePerSubRps(team, "30") throws invalid_rps_override', () => {
  assert.throws(
    () => resolvePerSubRps({ plan_tier: 'team', rps_override: '30' }),
    /invalid_rps_override/,
  );
});

// checkWebhookRateLimit respects rps_override (drops to override).
test('Plan 203-07 extra: checkWebhookRateLimit uses rps_override (30 under team=60)', async () => {
  const limiter = mockLimiter([{ success: true, remaining: 29, reset: Date.now() + 1000 }]);
  const r = await checkWebhookRateLimit(limiter, {
    subscription: { id: 'whsub_x', rps_override: 30 },
    plan_tier: 'team',
  });
  assert.equal(r.ok, true);
  assert.equal(r.limit, 30);
});
