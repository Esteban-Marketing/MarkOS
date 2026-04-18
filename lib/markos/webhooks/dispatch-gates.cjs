'use strict';

// Phase 203 Plan 07 Task 2 — Dispatch-Gates Indirection Module.
// Phase 203 Plan 08 Task 2 — Circuit-breaker gate inserted as FIRST gate (D-14 + D-15).
//
// CONTRACT: This module is the SINGLE pre-fetch indirection point for dispatch-gate checks.
// All future pre-fetch policies (quota, tenant-freeze, …) MUST be added INSIDE
// runDispatchGates — delivery.cjs MUST NOT grow additional pre-fetch branches.
//
// Gate order: breaker (Plan 203-08) → rate-limit (Plan 203-07). Breaker runs FIRST so an
// open circuit short-circuits before touching Upstash rate-limit state. Rate-limit stays
// in place as the SECOND gate and fires for both closed and half-open breaker states
// (half-open probes still respect per-sub RPS).
//
// T-203-07-06 mitigation: the single-insertion-point invariant is enforced at the
// acceptance-criteria layer (`grep "canDispatch" lib/markos/webhooks/delivery.cjs = 0` +
// `grep "checkWebhookRateLimit" lib/markos/webhooks/delivery.cjs = 0`). dispatch-gates.cjs
// is the sole consumer of both gate primitives in the hot path.
//
// T-203-08-06 mitigation: Plan 203-08 does NOT edit delivery.cjs. recordOutcome +
// classifyOutcome are exported by breaker.cjs for Plan 203-10 to invoke inside its own
// observability wrapper around the fetch() call — single-owner-per-file-per-wave contract.
//
// handleGateBlock transitions the delivery to 'retrying' with next_attempt_at = now +
// retryAfterSec. Gate blocks are TRANSIENT (not DLQ events) and MUST NOT increment the
// 24-attempt counter — only real HTTP 5xx / timeout / thrown fetch errors do that.

const { checkWebhookRateLimit } = require('./rate-limit.cjs');
const { canDispatch } = require('./breaker.cjs');

async function runDispatchGates({ subId, tenantId, eventId, planTier, subscription, redis }) {
  // Fall-through gate when no redis + no Upstash env (200-03 test compatibility + CI without
  // Upstash credentials). Production consumers pass `redis` explicitly from the queue
  // consumer; breaker + rate-limit both require redis to function.
  if (redis === undefined && !process.env.UPSTASH_REDIS_REST_URL) {
    return { status: 'allowed' };
  }

  // GATE 1: breaker (Plan 203-08 — D-14 trip threshold, D-15 half-open backoff).
  // On state=open, short-circuits all downstream gates so an open circuit never burns
  // Upstash rate-limit quota or advances the fetch path.
  const brk = await canDispatch(redis, subId);
  if (!brk.can_dispatch) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil(((brk.probe_at || Date.now()) - Date.now()) / 1000),
    );
    return {
      status: 'breaker_open',
      retryAfterSec,
      reason: 'breaker_open',
      breaker: { state: brk.state, trips: brk.trips, probe_at: brk.probe_at },
    };
  }

  // GATE 2: rate-limit (Plan 203-07 — D-13 per-sub cap).
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
