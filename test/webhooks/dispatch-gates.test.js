'use strict';

// Phase 203 Plan 07 Task 2: dispatch-gates scaffold + handleGateBlock.
// Tests behaviors 2a, 2b, 2e from the plan. Behaviors 2c/2d/2f live in delivery.test.js.
// Behaviors 2g/2h (F-100 contract shape) live in openapi-build.test.js + here.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  runDispatchGates,
  handleGateBlock,
} = require('../../lib/markos/webhooks/dispatch-gates.cjs');

function mockLimiter(results) {
  let i = 0;
  return {
    async limit() {
      const r = results[Math.min(i, results.length - 1)];
      i += 1;
      return r;
    },
  };
}

// 2a — runDispatchGates with rate-limit ok:true → { status: 'allowed' }
test('Plan 203-07 2a: runDispatchGates returns { status: "allowed" } when rate-limit ok', async () => {
  const limiter = mockLimiter([{ success: true, remaining: 59, reset: Date.now() + 1000 }]);
  const out = await runDispatchGates({
    subId: 'whsub_1',
    tenantId: 't-1',
    eventId: 'evt_1',
    planTier: 'team',
    subscription: { id: 'whsub_1', rps_override: null },
    redis: limiter,
  });
  assert.equal(out.status, 'allowed');
});

// 2b — runDispatchGates with rate-limit ok:false → { status: 'rate_limited', retryAfterSec, limit, reason }
test('Plan 203-07 2b: runDispatchGates returns rate_limited envelope on limit breach', async () => {
  const limiter = mockLimiter([{ success: false, reset: Date.now() + 5_000, remaining: 0 }]);
  const out = await runDispatchGates({
    subId: 'whsub_1',
    tenantId: 't-1',
    eventId: 'evt_1',
    planTier: 'team',
    subscription: { id: 'whsub_1', rps_override: null },
    redis: limiter,
  });
  assert.equal(out.status, 'rate_limited');
  assert.equal(out.limit, 60);
  assert.equal(out.reason, 'sub_rps');
  assert.ok(out.retryAfterSec >= 1);
});

// 2e — handleGateBlock schedules retry, does NOT increment attempt
test('Plan 203-07 2e: handleGateBlock writes status=retrying + next_attempt_at (does not increment attempt)', async () => {
  const calls = [];
  const deliveries = {
    async update(id, patch) {
      calls.push({ id, patch });
      return { id, ...patch };
    },
  };
  const result = await handleGateBlock({
    gate: { status: 'rate_limited', retryAfterSec: 5, limit: 60, reason: 'sub_rps' },
    deliveryId: 'whdel_abc',
    deliveries,
    now: 1_700_000_000_000,
  });
  assert.equal(result.delivered, false);
  assert.equal(result.status, 'rate_limited');
  assert.equal(result.retry_after, 5);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, 'whdel_abc');
  assert.equal(calls[0].patch.status, 'retrying');
  assert.equal(calls[0].patch.next_attempt_at, new Date(1_700_000_000_000 + 5_000).toISOString());
  // CRITICAL: attempt counter must NOT be in the patch (transient block, not a real attempt).
  assert.equal(calls[0].patch.attempt, undefined);
  assert.ok(calls[0].patch.updated_at);
});

// 2e' — handleGateBlock clamps retryAfterSec to ≥1
test('Plan 203-07 2e clamp: handleGateBlock clamps retryAfterSec < 1 up to 1', async () => {
  const calls = [];
  const deliveries = {
    async update(id, patch) {
      calls.push({ id, patch });
      return { id, ...patch };
    },
  };
  const result = await handleGateBlock({
    gate: { status: 'rate_limited', retryAfterSec: 0, reason: 'sub_rps' },
    deliveryId: 'whdel_x',
    deliveries,
    now: 1_700_000_000_000,
  });
  assert.equal(result.retry_after, 1);
  assert.equal(calls[0].patch.next_attempt_at, new Date(1_700_000_000_000 + 1_000).toISOString());
});

// 2g/2h — F-100 contract declarative shape
test('Plan 203-07 2g: F-100 YAML contract declares breaker + rate-limit read surface', () => {
  const yamlPath = path.resolve(__dirname, '..', '..', 'contracts', 'F-100-webhook-breaker-v1.yaml');
  assert.ok(fs.existsSync(yamlPath), `expected ${yamlPath} to exist`);
  const src = fs.readFileSync(yamlPath, 'utf8');
  assert.match(src, /F-100/);
  assert.match(src, /RateLimitState/);
  assert.match(src, /BreakerState/);
  // All 3 breaker states declared somewhere in the file.
  assert.match(src, /closed/);
  assert.match(src, /half-open/);
  assert.match(src, /open/);
});

test('Plan 203-07 2h: F-100 documents the 429 rate_limited envelope', () => {
  const yamlPath = path.resolve(__dirname, '..', '..', 'contracts', 'F-100-webhook-breaker-v1.yaml');
  const src = fs.readFileSync(yamlPath, 'utf8');
  assert.match(src, /rate_limited/);
  assert.match(src, /rps_override_exceeds_plan/);
});
