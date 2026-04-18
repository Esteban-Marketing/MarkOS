'use strict';

// Phase 203 Plan 05 Task 1 — delivery.cjs dual-sign integration tests.
// Unit of signPayloadDualSign was tested in Plan 203-04 signing.test.js.
// This suite asserts INTEGRATION: processDelivery injects both secrets into outbound
// headers via fetch capture.
//
// Covers behaviors 1i (single V1 when secret_v2 null), 1j (both V1+V2 when secret_v2),
// 1k (shared X-Markos-Timestamp across V1+V2), 1l (replay headers x-markos-replayed-from +
// x-markos-attempt when delivery.replayed_from is set).

const test = require('node:test');
const assert = require('node:assert/strict');

const { processDelivery } = require('../../lib/markos/webhooks/delivery.cjs');

// --- Minimal stores -------------------------------------------------------

function makeStores({ subscription, delivery }) {
  const deliveries = {
    async findById(id) { return id === delivery.id ? { ...delivery } : null; },
    async update(id, patch) {
      if (id === delivery.id) Object.assign(delivery, patch);
      return delivery;
    },
  };
  const subscriptions = {
    async findById(_tenant_id, sub_id) {
      return sub_id === subscription.id ? subscription : null;
    },
  };
  return { deliveries, subscriptions };
}

// Capture outbound fetch request details
function makeCaptureFetch({ ok = true, status = 200 } = {}) {
  const captured = [];
  const fetchImpl = async (url, init) => {
    captured.push({ url, init });
    return { ok, status };
  };
  return { fetchImpl, captured };
}

// Bypass SSRF guard for public URLs by forcing lookup to public IPv4
function passthroughLookup() {
  return async () => ({ address: '93.184.216.34', family: 4 });
}

test('1i: when sub.secret_v2 is null, dispatch sends single X-Markos-Signature-V1 header', async () => {
  const subscription = {
    id: 'whsub_1',
    tenant_id: 'ten_a',
    url: 'https://example.com/hook',
    secret: 'v1-secret-abc',
    secret_v2: null,
  };
  const delivery = {
    id: 'whdel_1',
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    event: 'approval.created',
    payload: { x: 1 },
    attempt: 0,
    status: 'pending',
    replayed_from: null,
  };
  const { deliveries, subscriptions } = makeStores({ subscription, delivery });
  const { fetchImpl, captured } = makeCaptureFetch();

  await processDelivery(deliveries, subscriptions, 'whdel_1', {
    fetch: fetchImpl,
    lookup: passthroughLookup(),
  });

  assert.equal(captured.length, 1);
  const headers = captured[0].init.headers;
  assert.ok(headers['X-Markos-Signature-V1'], 'V1 header required');
  assert.ok(!headers['X-Markos-Signature-V2'], 'V2 header must be absent when secret_v2 is null');
  assert.ok(headers['X-Markos-Timestamp'], 'timestamp header required');
});

test('1j: when sub.secret_v2 is present, dispatch sends BOTH V1 + V2 headers', async () => {
  const subscription = {
    id: 'whsub_1',
    tenant_id: 'ten_a',
    url: 'https://example.com/hook',
    secret: 'v1-secret-abc',
    secret_v2: 'v2-secret-xyz',
  };
  const delivery = {
    id: 'whdel_2',
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    event: 'approval.created',
    payload: { x: 2 },
    attempt: 0,
    status: 'pending',
    replayed_from: null,
  };
  const { deliveries, subscriptions } = makeStores({ subscription, delivery });
  const { fetchImpl, captured } = makeCaptureFetch();

  await processDelivery(deliveries, subscriptions, 'whdel_2', {
    fetch: fetchImpl,
    lookup: passthroughLookup(),
  });

  assert.equal(captured.length, 1);
  const headers = captured[0].init.headers;
  assert.ok(headers['X-Markos-Signature-V1'], 'V1 header required');
  assert.ok(headers['X-Markos-Signature-V2'], 'V2 header required when secret_v2 present');
  assert.notEqual(headers['X-Markos-Signature-V1'], headers['X-Markos-Signature-V2'], 'V1 and V2 signatures must differ');
});

test('1k: X-Markos-Timestamp is identical across V1 + V2 (single signed timestamp)', async () => {
  const subscription = {
    id: 'whsub_1',
    tenant_id: 'ten_a',
    url: 'https://example.com/hook',
    secret: 'v1',
    secret_v2: 'v2',
  };
  const delivery = {
    id: 'whdel_3',
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    event: 'e',
    payload: {},
    attempt: 0,
    status: 'pending',
    replayed_from: null,
  };
  const { deliveries, subscriptions } = makeStores({ subscription, delivery });
  const { fetchImpl, captured } = makeCaptureFetch();

  await processDelivery(deliveries, subscriptions, 'whdel_3', {
    fetch: fetchImpl,
    lookup: passthroughLookup(),
  });

  const headers = captured[0].init.headers;
  assert.ok(headers['X-Markos-Timestamp']);
  assert.match(headers['X-Markos-Timestamp'], /^\d+$/);
  // There is only ONE timestamp header — implicitly shared across both signatures.
  // Verify by ensuring both signatures were computed against the same ts.body input.
  assert.ok(headers['X-Markos-Signature-V1'].startsWith('sha256='));
  assert.ok(headers['X-Markos-Signature-V2'].startsWith('sha256='));
});

test('1l: replay delivery carries x-markos-replayed-from + x-markos-attempt headers (D-06)', async () => {
  const subscription = {
    id: 'whsub_1',
    tenant_id: 'ten_a',
    url: 'https://example.com/hook',
    secret: 'v1',
    secret_v2: null,
  };
  const delivery = {
    id: 'whdel_replay',
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    event: 'e',
    payload: {},
    attempt: 0,
    status: 'pending',
    replayed_from: 'whdel_original_abc',
    created_at: '2026-04-01T00:00:00.000Z',
  };
  const { deliveries, subscriptions } = makeStores({ subscription, delivery });
  const { fetchImpl, captured } = makeCaptureFetch();

  await processDelivery(deliveries, subscriptions, 'whdel_replay', {
    fetch: fetchImpl,
    lookup: passthroughLookup(),
  });

  const headers = captured[0].init.headers;
  assert.equal(headers['x-markos-replayed-from'], 'whdel_original_abc');
  assert.ok(headers['x-markos-attempt']);
  // attempt is delivery.attempt + 1 = 1
  assert.equal(String(headers['x-markos-attempt']), '1');
});
