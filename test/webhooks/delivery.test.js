'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_ATTEMPTS,
  STATUS,
  computeBackoffSeconds,
  createInMemoryQueue,
  createInMemoryDeliveryStore,
  enqueueDelivery,
  processDelivery,
} = require('../../lib/markos/webhooks/delivery.cjs');
const { createInMemoryStore, subscribe } = require('../../lib/markos/webhooks/engine.cjs');
const { verifySignature, SIGNATURE_HEADER, TIMESTAMP_HEADER } = require('../../lib/markos/webhooks/signing.cjs');

function mockFetch(responses) {
  const calls = [];
  let i = 0;
  const impl = async (url, init) => {
    calls.push({ url, init });
    const next = responses[Math.min(i, responses.length - 1)];
    i += 1;
    if (typeof next === 'function') return next({ url, init });
    if (next instanceof Error) throw next;
    return next;
  };
  impl.calls = calls;
  return impl;
}

function buildOkResponse(status = 200) {
  return { ok: true, status };
}
function buildBadResponse(status = 500) {
  return { ok: false, status };
}

test('computeBackoffSeconds grows exponentially and caps at 24h', () => {
  assert.equal(computeBackoffSeconds(1), 10);
  assert.equal(computeBackoffSeconds(2), 20);
  assert.equal(computeBackoffSeconds(3), 40);
  assert.ok(computeBackoffSeconds(20) <= 24 * 60 * 60);
  assert.ok(computeBackoffSeconds(24) <= 24 * 60 * 60);
});

test('enqueueDelivery inserts pending row and pushes id to queue', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();

  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['approval.created'],
    secret: 'fixed-secret',
  });

  const row = await enqueueDelivery(deliveries, queue, {
    subscription,
    event: 'approval.created',
    payload: { id: 'ap_1' },
  });

  assert.match(row.id, /^whdel_/);
  assert.equal(row.status, STATUS.PENDING);
  assert.equal(row.attempt, 0);
  assert.equal(queue.size(), 1);
  assert.deepEqual(queue.drain(), [row.id]);
});

test('processDelivery: 2xx response marks delivered, records attempt + status', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['campaign.launched'],
    secret: 'secret',
  });
  const row = await enqueueDelivery(deliveries, queue, {
    subscription,
    event: 'campaign.launched',
    payload: { id: 'c_1' },
  });
  const fetchImpl = mockFetch([buildOkResponse(202)]);

  const result = await processDelivery(deliveries, subs, row.id, { fetch: fetchImpl, now: () => 1_700_000_000_000 });
  assert.equal(result.delivered, true);
  assert.equal(result.status, 202);
  const stored = await deliveries.findById(row.id);
  assert.equal(stored.status, STATUS.DELIVERED);
  assert.equal(stored.attempt, 1);
  assert.equal(stored.response_code, 202);
});

test('processDelivery: outgoing request carries valid signature headers', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['approval.created'],
    secret: 'shh',
  });
  const row = await enqueueDelivery(deliveries, queue, {
    subscription,
    event: 'approval.created',
    payload: { id: 'ap_99' },
  });
  const now = () => 1_700_000_000_000;
  const fetchImpl = mockFetch([buildOkResponse()]);
  await processDelivery(deliveries, subs, row.id, { fetch: fetchImpl, now });

  const { init } = fetchImpl.calls[0];
  const signature = init.headers[SIGNATURE_HEADER];
  const timestamp = init.headers[TIMESTAMP_HEADER];
  assert.ok(signature);
  assert.ok(timestamp);
  assert.equal(verifySignature('shh', init.body, signature, timestamp, { now }), true);
});

test('processDelivery: non-2xx schedules retry with backoff, increments attempt', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['execution.failed'],
    secret: 's',
  });
  const row = await enqueueDelivery(deliveries, queue, { subscription, event: 'execution.failed', payload: {} });
  const fetchImpl = mockFetch([buildBadResponse(503)]);

  const result = await processDelivery(deliveries, subs, row.id, { fetch: fetchImpl, now: () => 1_700_000_000_000 });
  assert.equal(result.delivered, false);
  assert.equal(result.status, STATUS.RETRYING);
  const stored = await deliveries.findById(row.id);
  assert.equal(stored.status, STATUS.RETRYING);
  assert.equal(stored.attempt, 1);
  assert.equal(stored.response_code, 503);
  assert.ok(stored.next_retry_at);
});

test('processDelivery: thrown fetch error records last_error and retries', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['incident.opened'],
    secret: 's',
  });
  const row = await enqueueDelivery(deliveries, queue, { subscription, event: 'incident.opened', payload: {} });
  const fetchImpl = mockFetch([new Error('ECONNREFUSED')]);

  const result = await processDelivery(deliveries, subs, row.id, { fetch: fetchImpl, now: () => 1_700_000_000_000 });
  assert.equal(result.delivered, false);
  const stored = await deliveries.findById(row.id);
  assert.equal(stored.status, STATUS.RETRYING);
  assert.equal(stored.last_error, 'ECONNREFUSED');
});

test('processDelivery: after MAX_ATTEMPTS transitions to failed', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['consent.revoked'],
    secret: 's',
  });
  const row = await enqueueDelivery(deliveries, queue, { subscription, event: 'consent.revoked', payload: {} });
  await deliveries.update(row.id, { attempt: MAX_ATTEMPTS - 1 });
  const fetchImpl = mockFetch([buildBadResponse(500)]);

  const result = await processDelivery(deliveries, subs, row.id, { fetch: fetchImpl, now: () => 1_700_000_000_000 });
  assert.equal(result.status, STATUS.FAILED);
  const stored = await deliveries.findById(row.id);
  assert.equal(stored.status, STATUS.FAILED);
  assert.equal(stored.attempt, MAX_ATTEMPTS);
  assert.equal(stored.next_retry_at, null);
});

test('processDelivery: missing subscription fails delivery row', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const ghostSub = {
    id: 'whsub_ghost',
    tenant_id: 't-1',
    url: 'https://ghost.example',
    secret: 's',
    events: ['approval.created'],
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const row = await enqueueDelivery(deliveries, queue, { subscription: ghostSub, event: 'approval.created', payload: {} });
  const result = await processDelivery(deliveries, subs, row.id);
  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'subscription_missing');
  const stored = await deliveries.findById(row.id);
  assert.equal(stored.status, STATUS.FAILED);
});

test('processDelivery: unknown delivery id returns not_found', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const result = await processDelivery(deliveries, subs, 'whdel_nope');
  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'not_found');
});

// ---------------------------------------------------------------------------
// Phase 203-07 Task 2: dispatch-gates integration behaviors 2c, 2d, 2f.
// ---------------------------------------------------------------------------

function mockLimiter(results) {
  let i = 0;
  return {
    async limit() {
      const r = results[Math.min(i, results.length - 1)];
      i += 1;
      return r;
    },
    // Plan 203-08: breaker.canDispatch reads state via redis.get — mock returns null
    // so the breaker gate resolves to closed and the rate-limit gate below still fires.
    async get() { return null; },
  };
}

test('Plan 203-07 2c: rate-limit gate blocks dispatch (no fetch), transitions to retrying, attempt NOT incremented', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['approval.created'],
    secret: 's',
    rps_override: null,
  });
  const row = await enqueueDelivery(deliveries, queue, {
    subscription,
    event: 'approval.created',
    payload: {},
  });

  const fetchImpl = mockFetch([buildOkResponse(200)]);
  // Limiter breaches; reset 5s in the future.
  const limiter = mockLimiter([{ success: false, reset: Date.now() + 5_000, remaining: 0 }]);

  const result = await processDelivery(deliveries, subs, row.id, {
    fetch: fetchImpl,
    now: () => 1_700_000_000_000,
    redis: limiter,
    planTier: 'team',
  });

  // Fetch must NOT have been called.
  assert.equal(fetchImpl.calls.length, 0);
  assert.equal(result.delivered, false);
  assert.equal(result.status, 'rate_limited');

  // Row transitioned to retrying with next_attempt_at set; attempt unchanged (0).
  const stored = await deliveries.findById(row.id);
  assert.equal(stored.status, STATUS.RETRYING);
  assert.equal(stored.attempt, 0);
  assert.ok(stored.next_attempt_at);
});

test('Plan 203-07 2d: rate-limit gate allowed → dispatch proceeds through fetch', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['approval.created'],
    secret: 's',
  });
  const row = await enqueueDelivery(deliveries, queue, {
    subscription,
    event: 'approval.created',
    payload: {},
  });

  const fetchImpl = mockFetch([buildOkResponse(204)]);
  const limiter = mockLimiter([{ success: true, remaining: 59, reset: Date.now() + 1_000 }]);

  const result = await processDelivery(deliveries, subs, row.id, {
    fetch: fetchImpl,
    now: () => 1_700_000_000_000,
    redis: limiter,
    planTier: 'team',
  });
  assert.equal(result.delivered, true);
  assert.equal(result.status, 204);
  assert.equal(fetchImpl.calls.length, 1);
  const stored = await deliveries.findById(row.id);
  assert.equal(stored.status, STATUS.DELIVERED);
  assert.equal(stored.attempt, 1);
});

test('Plan 203-07 2f: repeated gate blocks do NOT accumulate the attempt counter (24-cap not burned)', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  const queue = createInMemoryQueue();
  const subscription = await subscribe(subs, {
    tenant_id: 't-1',
    url: 'https://example.com/hook',
    events: ['approval.created'],
    secret: 's',
  });
  const row = await enqueueDelivery(deliveries, queue, {
    subscription,
    event: 'approval.created',
    payload: {},
  });

  const fetchImpl = mockFetch([buildOkResponse(200)]);
  const limiter = mockLimiter([
    { success: false, reset: Date.now() + 2_000, remaining: 0 },
    { success: false, reset: Date.now() + 2_000, remaining: 0 },
    { success: false, reset: Date.now() + 2_000, remaining: 0 },
  ]);

  for (let i = 0; i < 3; i += 1) {
    await processDelivery(deliveries, subs, row.id, {
      fetch: fetchImpl,
      now: () => 1_700_000_000_000,
      redis: limiter,
      planTier: 'team',
    });
  }

  assert.equal(fetchImpl.calls.length, 0, 'no fetch call should happen when gate blocks');
  const stored = await deliveries.findById(row.id);
  // 3 gate blocks must NOT have incremented the attempt counter.
  assert.equal(stored.attempt, 0, `attempt should remain 0, got ${stored.attempt}`);
  assert.equal(stored.status, STATUS.RETRYING);
});
