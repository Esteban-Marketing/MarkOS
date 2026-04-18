'use strict';

// Phase 203 Plan 01 Task 2 — Vercel Queues push-mode consumer.
// Topic: markos-webhook-delivery (queue/v2beta). Registered in vercel.ts.
//
// Pitfall 5 (RESEARCH §Pitfall 5): queue/v2beta trigger rename is expected when Vercel exits
// beta. Smoke test in Plan 203-10 alerts on regression; see deferred-items.md.
// T-203-01-01 mitigation: asyncHandler asserts `message.delivery_id` truthy and throws on miss
// → queue retries → after 24 attempts retry callback returns { acknowledge: true } so messages
// never silent-drop without the delivery row's audit trail catching the failure.
// T-203-01-03 mitigation: visibilityTimeoutSeconds=120 bounds slow-subscriber hangs; the
// retry cap matches engine.cjs MAX_ATTEMPTS=24 so behavior is uniform across push + pull paths.

const { handleCallback } = require('@vercel/queue');
const { processDelivery } = require('../../../lib/markos/webhooks/delivery.cjs');
const { getWebhookStores } = require('../../../lib/markos/webhooks/store.cjs');

// Safe-require observability shims. Plan 203-10 will ship real modules; until then these
// degrade to no-ops so the consumer never crashes on module-load.
let emitLogLine = () => {};
let captureToolError = () => {};
try {
  // eslint-disable-next-line global-require
  ({ emitLogLine } = require('../../../lib/markos/webhooks/log-drain.cjs'));
} catch { /* Plan 203-10 target — safe no-op until then */ }
try {
  // eslint-disable-next-line global-require
  ({ captureToolError } = require('../../../lib/markos/webhooks/sentry.cjs'));
} catch { /* Plan 203-10 target — safe no-op until then */ }

async function asyncHandler(message, metadata) {
  const delivery_id = message?.delivery_id;
  if (!delivery_id) {
    // Throw → queue will retry; after 24 attempts the retry callback ACKs so this never
    // loops forever. We intentionally don't ACK silently here — missing delivery_id is
    // a correctness bug that should surface in logs + retries.
    throw new Error('missing_delivery_id');
  }

  const { deliveries, subscriptions } = getWebhookStores();
  const started = Date.now();
  let result;
  try {
    result = await processDelivery(deliveries, subscriptions, delivery_id);
    return result;
  } catch (err) {
    captureToolError(err, { req_id: metadata?.messageId, delivery_id });
    throw err; // let Vercel Queues retry per `retry` callback below
  } finally {
    const status = result?.delivered ? 'delivered' : (result?.status || 'unknown');
    emitLogLine({
      domain: 'webhook',
      req_id: metadata?.messageId,
      delivery_id,
      delivery_count: metadata?.deliveryCount,
      duration_ms: Date.now() - started,
      status,
    });
  }
}

function retry(_err, metadata) {
  // Bounded retry: after 24 attempts (engine.cjs MAX_ATTEMPTS parity), ack → app-level DLQ
  // via markos_webhook_deliveries.status='failed'. Vercel Queues has no native DLQ; the DLQ
  // pane (Plan 203-09) reads from Supabase rows.
  if (metadata?.deliveryCount > 24) return { acknowledge: true };
  // Reuse engine.cjs computeBackoffSeconds shape: 5 * 2^min(count,15), capped at 86400s (24h).
  const count = metadata?.deliveryCount ?? 1;
  const delay = Math.min(86400, 5 * Math.pow(2, Math.min(count, 15)));
  return { afterSeconds: delay };
}

const options = { visibilityTimeoutSeconds: 120, retry };

module.exports = handleCallback(asyncHandler, options);

// Expose internals for unit tests (matches Phase 202 plan 202-05 pattern).
module.exports.__internals = { asyncHandler, retry, options };
