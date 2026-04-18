'use strict';

// Phase 203 Plan 01 Task 2 — Vercel Queues push-mode client adapter.
// Replaces the in-memory `createInMemoryQueue().drain()` pull pattern with a real
// cross-instance durable queue (markos-webhook-delivery topic). The consumer lives in
// api/webhooks/queues/deliver.js and is registered in vercel.ts.
//
// Pitfall 1 (RESEARCH §Pitfall 1): Vercel Queues persists the queue across Fluid Compute
// instance turnover — the prior in-memory queue lost data silently. This adapter closes
// that hole for 203 and every downstream plan (D-16 gate).
// Pitfall 5 (RESEARCH §Pitfall 5): queue/v2beta trigger is beta and may be renamed when
// Vercel exits beta. Smoke test in Plan 203-10 will alert on regression; see deferred-items.md.

function createVercelQueueClient({ topic, deps = {} } = {}) {
  if (!topic) throw new Error('store-vercel-queue.createVercelQueueClient: topic required');

  // Lazily resolve the send function at first push so test harnesses that inject deps.send
  // never import the real @vercel/queue (avoids beta-SDK churn in CI).
  let sendFn = deps.send || null;
  function resolveSend() {
    if (sendFn) return sendFn;
    // eslint-disable-next-line global-require
    const { send } = require('@vercel/queue');
    sendFn = send;
    return sendFn;
  }

  return {
    async push(delivery_id, options = {}) {
      if (!delivery_id) {
        throw new Error('store-vercel-queue.push: delivery_id required');
      }
      const send = resolveSend();
      const opts = options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined;
      return send(topic, { delivery_id }, opts);
    },
  };
}

module.exports = { createVercelQueueClient };
