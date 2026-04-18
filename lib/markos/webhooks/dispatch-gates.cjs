'use strict';

// Phase 203 Plan 07 Task 2 — Dispatch-Gates Indirection Module.
//
// CONTRACT: This module is the SINGLE pre-fetch indirection point for dispatch-gate checks.
// All future pre-fetch policies (breaker, quota, tenant-freeze, …) MUST be added INSIDE
// runDispatchGates — delivery.cjs MUST NOT grow additional pre-fetch branches. Plan 203-08
// extends this module additively by prepending a BREAKER gate as the FIRST gate.
//
// T-203-07-06 mitigation: the single-insertion-point invariant is enforced at the acceptance-
// criteria layer (grep "checkWebhookRateLimit" lib/markos/webhooks/delivery.cjs = 0 after
// this plan; dispatch-gates.cjs is the only consumer of checkWebhookRateLimit in the hot path).
//
// handleGateBlock transitions the delivery to 'retrying' with next_attempt_at = now +
// retryAfterSec. Gate blocks are TRANSIENT (not DLQ events) and MUST NOT increment the
// 24-attempt counter — only real HTTP 5xx / timeout / thrown fetch errors do that.

const { checkWebhookRateLimit } = require('./rate-limit.cjs');

async function runDispatchGates({ subId, tenantId, eventId, planTier, subscription, redis }) {
  // GATE: breaker (Plan 203-08 extends here as FIRST gate). Add the breaker check ABOVE
  // the rate-limit gate so an open circuit short-circuits before touching Upstash.

  // GATE: rate-limit (Plan 203-07 — D-13 per-sub cap).
  // When `redis` is not supplied AND no UPSTASH env is configured, skip the gate rather than
  // crash. This preserves the 200-03 delivery suite (tests that don't pass redis) and allows
  // local/CI runs without Upstash credentials. Production consumers (api/webhooks/queues/
  // deliver.js) pass `redis` explicitly, so the gate fires there.
  if (redis === undefined && !process.env.UPSTASH_REDIS_REST_URL) {
    return { status: 'allowed' };
  }

  const rate = await checkWebhookRateLimit(redis, { subscription, plan_tier: planTier });
  if (!rate.ok) {
    return {
      status: 'rate_limited',
      retryAfterSec: rate.retry_after,
      limit: rate.limit,
      reason: rate.reason || 'sub_rps',
    };
  }

  return { status: 'allowed' };
}

async function handleGateBlock({ gate, deliveryId, deliveries, now }) {
  const t = typeof now === 'number' ? now : Date.now();
  const secs = Math.max(1, Number(gate?.retryAfterSec) || 1);
  await deliveries.update(deliveryId, {
    status: 'retrying',
    next_attempt_at: new Date(t + secs * 1000).toISOString(),
    updated_at: new Date(t).toISOString(),
    // attempt intentionally NOT set — gate blocks are transient, not real dispatch attempts.
  });
  return {
    delivered: false,
    status: gate?.status || 'rate_limited',
    retry_after: secs,
  };
}

module.exports = {
  runDispatchGates,
  handleGateBlock,
};
