'use strict';

const { randomUUID } = require('node:crypto');
const { signPayload, signPayloadDualSign, SIGNATURE_HEADER, TIMESTAMP_HEADER } = require('./signing.cjs');
const { assertUrlIsPublic } = require('./ssrf-guard.cjs');
const { runDispatchGates, handleGateBlock } = require('./dispatch-gates.cjs');

const MAX_ATTEMPTS = 24;
const BASE_DELAY_SECONDS = 5;
const MAX_DELAY_SECONDS = 24 * 60 * 60;

const STATUS = {
  PENDING: 'pending',
  RETRYING: 'retrying',
  DELIVERED: 'delivered',
  FAILED: 'failed',
};

function computeBackoffSeconds(attempt) {
  if (attempt <= 0) return BASE_DELAY_SECONDS;
  const delay = BASE_DELAY_SECONDS * Math.pow(2, Math.min(attempt, 15));
  return Math.min(delay, MAX_DELAY_SECONDS);
}

function createInMemoryQueue() {
  const queue = [];
  return {
    async push(delivery_id) {
      queue.push(delivery_id);
    },
    drain() {
      const ids = [...queue];
      queue.length = 0;
      return ids;
    },
    size() {
      return queue.length;
    },
  };
}

function createInMemoryDeliveryStore() {
  const rows = new Map();
  return {
    async insert(row) {
      rows.set(row.id, row);
      return row;
    },
    async findById(id) {
      return rows.get(id) || null;
    },
    async update(id, patch) {
      const row = rows.get(id);
      if (!row) return null;
      const next = { ...row, ...patch, updated_at: new Date().toISOString() };
      rows.set(id, next);
      return next;
    },
    async listByTenant(tenant_id) {
      return [...rows.values()].filter((r) => r.tenant_id === tenant_id);
    },
  };
}

async function enqueueDelivery(deliveries, queue, input) {
  if (!input || !input.subscription) throw new Error('subscription is required');
  if (!input.event) throw new Error('event is required');
  const now = new Date().toISOString();
  const row = {
    id: `whdel_${randomUUID()}`,
    subscription_id: input.subscription.id,
    tenant_id: input.subscription.tenant_id,
    event: input.event,
    payload: input.payload ?? {},
    attempt: 0,
    status: STATUS.PENDING,
    response_code: null,
    last_error: null,
    next_retry_at: null,
    created_at: now,
    updated_at: now,
  };
  await deliveries.insert(row);
  await queue.push(row.id);
  return row;
}

async function processDelivery(
  deliveries,
  subscriptions,
  delivery_id,
  {
    fetch: fetchImpl = globalThis.fetch,
    now = () => Date.now(),
    lookup,
    // Phase 203-07 Task 2: dispatch-gates dependencies. `redis` is the Upstash handle (or a
    // pre-built limiter for tests); `planTier` resolves the D-13 ceiling when the subscription
    // row doesn't carry it inline yet. Both are optional — defaults fall through to 'free'
    // (fail-closed to lowest cap) and Upstash `Redis.fromEnv()`.
    redis,
    planTier,
  } = {},
) {
  const delivery = await deliveries.findById(delivery_id);
  if (!delivery) return { delivered: false, reason: 'not_found' };

  const subscription = await subscriptions.findById(delivery.tenant_id, delivery.subscription_id);
  if (!subscription) {
    await deliveries.update(delivery_id, { status: STATUS.FAILED, last_error: 'subscription_missing' });
    return { delivered: false, reason: 'subscription_missing' };
  }

  // Phase 203-07 Task 2: dispatch-gates indirection (T-203-07-06 mitigation).
  // SINGLE pre-fetch indirection point — Plan 203-08 will extend dispatch-gates.cjs to add a
  // breaker gate; delivery.cjs MUST NOT grow additional pre-fetch branches.
  const resolvedPlanTier = planTier || subscription.plan_tier || 'free';
  const gate = await runDispatchGates({
    subId: subscription.id,
    tenantId: subscription.tenant_id,
    eventId: delivery.event,
    planTier: resolvedPlanTier,
    subscription,
    redis,
  });
  if (gate.status !== 'allowed') {
    return await handleGateBlock({ gate, deliveryId: delivery_id, deliveries, now: now() });
  }

  // Phase 203-02 Task 1: dispatch-time SSRF re-check (DNS-rebinding defense).
  // Only reject when the URL resolves to a KNOWN private IP at dispatch time;
  // if DNS lookup itself errors (ENOTFOUND etc) we fall through to fetch so
  // the normal retry path handles transient DNS issues. This also keeps the
  // guard off the hot path when the URL short-circuits as a private literal
  // (which throws a private_ip / invalid_scheme / https_required error).
  try {
    await assertUrlIsPublic(subscription.url, lookup ? { lookup } : undefined);
  } catch (ssrfErr) {
    const msg = String(ssrfErr?.message || '');
    const isSsrfReject =
      msg === 'private_ip' ||
      msg.startsWith('private_ip:') ||
      msg === 'https_required' ||
      msg === 'invalid_scheme';
    if (isSsrfReject) {
      const reason = `ssrf_blocked:${msg}`;
      await deliveries.update(delivery_id, {
        status: STATUS.FAILED,
        last_error: reason,
        dlq_reason: reason,
        dlq_at: new Date().toISOString(),
        next_retry_at: null,
      });
      return { delivered: false, status: STATUS.FAILED, reason: 'ssrf_blocked' };
    }
    // Non-SSRF failure (DNS ENOTFOUND etc) — fall through; fetch will retry.
  }

  const attempt = delivery.attempt + 1;
  const body = JSON.stringify({ id: delivery.id, event: delivery.event, payload: delivery.payload });

  // Phase 203-05 Task 1: outbound dual-sign (D-10). When subscription.secret_v2 is present the
  // dispatch carries BOTH X-Markos-Signature-V1 (current secret) and X-Markos-Signature-V2
  // (new secret) headers with a SHARED X-Markos-Timestamp. Subscribers verify either during
  // the 30-day grace window. Backwards-compatible X-Markos-Signature header is preserved so
  // pre-203 subscribers keep working (byte-for-byte identical to prior signPayload output).
  const { signature, timestamp } = signPayload(subscription.secret, body, now);
  const { headers: dualHeaders } = signPayloadDualSign(
    subscription.secret,
    subscription.secret_v2 || null,
    body,
    now,
  );

  const outboundHeaders = {
    'content-type': 'application/json',
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: timestamp,
    ...dualHeaders,
    'x-markos-event': String(delivery.event || ''),
    'x-markos-attempt': String(attempt),
  };
  // Phase 203-05 Task 1 — D-06: replay deliveries carry x-markos-replayed-from so subscribers
  // can diff the replay against their own logs. Header intentionally lower-case (HTTP/2 norm).
  if (delivery.replayed_from) {
    outboundHeaders['x-markos-replayed-from'] = String(delivery.replayed_from);
  }

  try {
    const response = await fetchImpl(subscription.url, {
      method: 'POST',
      headers: outboundHeaders,
      body,
    });

    if (response.ok) {
      await deliveries.update(delivery_id, {
        attempt,
        status: STATUS.DELIVERED,
        response_code: response.status,
        last_error: null,
        next_retry_at: null,
      });
      return { delivered: true, status: response.status, attempt };
    }

    return await scheduleRetry(deliveries, delivery_id, attempt, response.status, `http_${response.status}`, now);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return await scheduleRetry(deliveries, delivery_id, attempt, null, message, now);
  }
}

async function scheduleRetry(deliveries, delivery_id, attempt, response_code, last_error, now) {
  if (attempt >= MAX_ATTEMPTS) {
    await deliveries.update(delivery_id, {
      attempt,
      status: STATUS.FAILED,
      response_code,
      last_error,
      next_retry_at: null,
    });
    return { delivered: false, attempt, status: STATUS.FAILED, last_error };
  }

  const next_retry_at = new Date(now() + computeBackoffSeconds(attempt) * 1000).toISOString();
  await deliveries.update(delivery_id, {
    attempt,
    status: STATUS.RETRYING,
    response_code,
    last_error,
    next_retry_at,
  });
  return { delivered: false, attempt, status: STATUS.RETRYING, next_retry_at, last_error };
}

module.exports = {
  MAX_ATTEMPTS,
  BASE_DELAY_SECONDS,
  MAX_DELAY_SECONDS,
  STATUS,
  computeBackoffSeconds,
  createInMemoryQueue,
  createInMemoryDeliveryStore,
  enqueueDelivery,
  processDelivery,
};
