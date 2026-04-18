'use strict';

// Phase 203 Plan 02 Task 1: SSRF-guard RED/GREEN suite.
// 17 behaviors (1a–1q) per 203-02-PLAN.md — cover the library, subscribe-time
// wiring, and dispatch-time (DNS-rebinding) wiring.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  assertUrlIsPublic,
  cidrContains,
  BLOCKED_V4,
} = require('../../lib/markos/webhooks/ssrf-guard.cjs');

const { handleSubscribe } = require('../../api/webhooks/subscribe.js');
const {
  createInMemoryDeliveryStore,
  enqueueDelivery,
  processDelivery,
  STATUS,
} = require('../../lib/markos/webhooks/delivery.cjs');
const { createInMemoryStore, subscribe } = require('../../lib/markos/webhooks/engine.cjs');
const {
  _resetWebhookStoresForTests,
  getWebhookStores,
} = require('../../lib/markos/webhooks/store.cjs');

function makeReq({ method = 'POST', body, tenant_id = 't-1' } = {}) {
  return { method, body, markosAuth: { tenant_id } };
}

function makeRes() {
  const res = { statusCode: 200, headers: {}, body: '' };
  res.writeHead = (code, headers) => {
    res.statusCode = code;
    if (headers) Object.assign(res.headers, headers);
  };
  res.end = (b) => {
    res.body = b;
  };
  return res;
}

function parse(res) {
  return JSON.parse(res.body || '{}');
}

function stubLookup(result) {
  // Returns a lookup fn that resolves once with the given { address, family }.
  return async (_host, _opts) => {
    if (result instanceof Error) throw result;
    return result;
  };
}

function stubLookupSequence(results) {
  // Returns a lookup fn that walks through an array of results on each call.
  let i = 0;
  return async (_host, _opts) => {
    const next = results[Math.min(i, results.length - 1)];
    i += 1;
    if (next instanceof Error) throw next;
    return next;
  };
}

test.beforeEach(() => {
  _resetWebhookStoresForTests();
});

// ---------------------------------------------------------------------------
// Library behaviors (1a-1m)
// ---------------------------------------------------------------------------

test('1a: assertUrlIsPublic resolves for public HTTPS URL', async () => {
  const result = await assertUrlIsPublic('https://api.example.com', {
    lookup: stubLookup({ address: '93.184.216.34', family: 4 }),
  });
  assert.equal(result.ip, '93.184.216.34');
  assert.equal(result.family, 4);
});

test('1b: assertUrlIsPublic rejects http:// (HTTPS required)', async () => {
  await assert.rejects(
    () => assertUrlIsPublic('http://example.com'),
    /https_required/,
  );
});

test('1c: assertUrlIsPublic rejects https://localhost (short-circuit)', async () => {
  await assert.rejects(
    () => assertUrlIsPublic('https://localhost'),
    /private_ip/,
  );
});

test('1d: assertUrlIsPublic rejects https://127.0.0.1 (loopback)', async () => {
  await assert.rejects(
    () =>
      assertUrlIsPublic('https://127.0.0.1', {
        lookup: stubLookup({ address: '127.0.0.1', family: 4 }),
      }),
    /private_ip:loopback/,
  );
});

test('1e: assertUrlIsPublic rejects 10.0.0.0/8 (RFC1918 private)', async () => {
  await assert.rejects(
    () =>
      assertUrlIsPublic('https://10.0.0.1', {
        lookup: stubLookup({ address: '10.0.0.1', family: 4 }),
      }),
    /private_ip:private/,
  );
});

test('1f: assertUrlIsPublic rejects 172.16.0.0/12', async () => {
  await assert.rejects(
    () =>
      assertUrlIsPublic('https://172.16.5.5', {
        lookup: stubLookup({ address: '172.16.5.5', family: 4 }),
      }),
    /private_ip:private/,
  );
});

test('1g: assertUrlIsPublic rejects 192.168.0.0/16', async () => {
  await assert.rejects(
    () =>
      assertUrlIsPublic('https://192.168.1.1', {
        lookup: stubLookup({ address: '192.168.1.1', family: 4 }),
      }),
    /private_ip:private/,
  );
});

test('1h: assertUrlIsPublic rejects 169.254.169.254 (cloud IMDS link-local)', async () => {
  await assert.rejects(
    () =>
      assertUrlIsPublic('https://169.254.169.254', {
        lookup: stubLookup({ address: '169.254.169.254', family: 4 }),
      }),
    /private_ip:link-local \(cloud IMDS\)/,
  );
});

test('1i: assertUrlIsPublic rejects non-http(s) scheme', async () => {
  await assert.rejects(
    () => assertUrlIsPublic('ftp://example.com'),
    /invalid_scheme/,
  );
});

test('1j: dispatch-time DNS-rebinding flip rejects second call', async () => {
  const lookup = stubLookupSequence([
    { address: '93.184.216.34', family: 4 }, // subscribe-time: public
    { address: '10.1.2.3', family: 4 },      // dispatch-time: rebinds to private
  ]);
  const first = await assertUrlIsPublic('https://rebind.example.com', { lookup });
  assert.equal(first.ip, '93.184.216.34');
  await assert.rejects(
    () => assertUrlIsPublic('https://rebind.example.com', { lookup }),
    /private_ip:private/,
  );
});

test('1k: assertUrlIsPublic rejects IPv6 ::1 (loopback)', async () => {
  await assert.rejects(
    () =>
      assertUrlIsPublic('https://[::1]', {
        lookup: stubLookup({ address: '::1', family: 6 }),
      }),
    /private_ip:v6/,
  );
});

test('1l: assertUrlIsPublic rejects IPv6 fc00::/7 (ULA)', async () => {
  await assert.rejects(
    () =>
      assertUrlIsPublic('https://[fc00::1]', {
        lookup: stubLookup({ address: 'fc00::1', family: 6 }),
      }),
    /private_ip:v6/,
  );
});

test('1m: assertUrlIsPublic rejects IPv6 fe80::/10 (link-local)', async () => {
  await assert.rejects(
    () =>
      assertUrlIsPublic('https://[fe80::1]', {
        lookup: stubLookup({ address: 'fe80::1', family: 6 }),
      }),
    /private_ip:v6/,
  );
});

// ---------------------------------------------------------------------------
// Subscribe-time wiring (1n-1p)
// ---------------------------------------------------------------------------

test('1n: POST /api/webhooks/subscribe with https://localhost → 400 {error:private_ip}', async () => {
  const req = makeReq({
    method: 'POST',
    body: { url: 'https://localhost', events: ['approval.created'] },
  });
  const res = makeRes();
  await handleSubscribe(req, res);
  assert.equal(res.statusCode, 400);
  const payload = parse(res);
  assert.equal(payload.error, 'private_ip');
  // insert must not have happened — no subs for tenant.
  const { subscriptions } = getWebhookStores();
  const rows = await subscriptions.listByTenant('t-1');
  assert.equal(rows.length, 0);
});

test('1o: POST /api/webhooks/subscribe with http:// → 400 {error:https_required}', async () => {
  const req = makeReq({
    method: 'POST',
    body: { url: 'http://example.com', events: ['approval.created'] },
  });
  const res = makeRes();
  await handleSubscribe(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(parse(res).error, 'https_required');
});

test('1p: POST /api/webhooks/subscribe with public HTTPS succeeds (guard passes)', async () => {
  const req = makeReq({
    method: 'POST',
    body: { url: 'https://api.example.com/hook', events: ['approval.created'] },
  });
  const res = makeRes();
  await handleSubscribe(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(parse(res).success, true);
});

// ---------------------------------------------------------------------------
// Dispatch-time wiring (1q)
// ---------------------------------------------------------------------------

test('1q: processDelivery rejects when dispatch-time lookup resolves to private IP', async () => {
  const subs = createInMemoryStore();
  const deliveries = createInMemoryDeliveryStore();
  // Use the in-memory store directly rather than the subscribe wrapper —
  // subscribe-time uses the real DNS for validation; we want to bypass it so
  // we can verify dispatch-time catches the rebind.
  const now = new Date().toISOString();
  await subs.insert({
    id: 'whsub_test',
    tenant_id: 't-1',
    url: 'https://rebound.example.com',
    secret: 'fixed-secret',
    events: ['approval.created'],
    active: true,
    created_at: now,
    updated_at: now,
  });
  const subscription = { id: 'whsub_test', tenant_id: 't-1' };
  const delivery = await enqueueDelivery(
    deliveries,
    { async push() {} },
    { subscription: { ...subscription, tenant_id: 't-1' }, event: 'approval.created' },
  );

  const result = await processDelivery(deliveries, subs, delivery.id, {
    fetch: async () => {
      throw new Error('fetch must not be called when SSRF guard rejects at dispatch');
    },
    lookup: stubLookup({ address: '192.168.1.1', family: 4 }),
  });
  assert.equal(result.delivered, false);
  const row = await deliveries.findById(delivery.id);
  assert.equal(row.status, STATUS.FAILED);
  assert.ok(row.dlq_reason && row.dlq_reason.startsWith('ssrf_blocked:'));
  assert.ok(row.dlq_at);
});

// ---------------------------------------------------------------------------
// Supporting invariants
// ---------------------------------------------------------------------------

test('BLOCKED_V4 exports 6 CIDRs covering required ranges', () => {
  assert.equal(BLOCKED_V4.length, 6);
  const cidrs = BLOCKED_V4.map((b) => b.cidr);
  assert.ok(cidrs.includes('127.0.0.0/8'));
  assert.ok(cidrs.includes('10.0.0.0/8'));
  assert.ok(cidrs.includes('172.16.0.0/12'));
  assert.ok(cidrs.includes('192.168.0.0/16'));
  assert.ok(cidrs.includes('169.254.0.0/16'));
  assert.ok(cidrs.includes('0.0.0.0/8'));
});

test('cidrContains basic sanity: 10.0.0.0/8 contains 10.1.2.3 but not 11.0.0.1', () => {
  assert.equal(cidrContains('10.0.0.0/8', '10.1.2.3'), true);
  assert.equal(cidrContains('10.0.0.0/8', '11.0.0.1'), false);
  assert.equal(cidrContains('172.16.0.0/12', '172.16.5.5'), true);
  assert.equal(cidrContains('172.16.0.0/12', '172.32.0.1'), false);
});
