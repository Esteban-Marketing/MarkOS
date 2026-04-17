'use strict';

const { randomUUID } = require('node:crypto');
const { signPayload, SIGNATURE_HEADER, TIMESTAMP_HEADER } = require('./signing.cjs');

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
  } = {},
) {
  const delivery = await deliveries.findById(delivery_id);
  if (!delivery) return { delivered: false, reason: 'not_found' };

  const subscription = await subscriptions.findById(delivery.tenant_id, delivery.subscription_id);
  if (!subscription) {
    await deliveries.update(delivery_id, { status: STATUS.FAILED, last_error: 'subscription_missing' });
    return { delivered: false, reason: 'subscription_missing' };
  }

  const attempt = delivery.attempt + 1;
  const body = JSON.stringify({ id: delivery.id, event: delivery.event, payload: delivery.payload });
  const { signature, timestamp } = signPayload(subscription.secret, body, now);

  try {
    const response = await fetchImpl(subscription.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [SIGNATURE_HEADER]: signature,
        [TIMESTAMP_HEADER]: timestamp,
      },
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
