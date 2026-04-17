'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { handleSubscribe } = require('../../api/webhooks/subscribe.js');
const { handleList } = require('../../api/webhooks/list.js');
const { handleUnsubscribe } = require('../../api/webhooks/unsubscribe.js');
const { handleTestFire } = require('../../api/webhooks/test-fire.js');
const { _resetWebhookStoresForTests, getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');

function makeReq({ method = 'GET', body, tenant_id = 't-1', query } = {}) {
  const req = { method, body, query, markosAuth: { tenant_id } };
  return req;
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

test.beforeEach(() => {
  _resetWebhookStoresForTests();
});

test('POST /api/webhooks/subscribe creates a subscription', async () => {
  const req = makeReq({
    method: 'POST',
    body: { url: 'https://example.com/hook', events: ['approval.created'] },
  });
  const res = makeRes();
  await handleSubscribe(req, res);
  assert.equal(res.statusCode, 201);
  const payload = parse(res);
  assert.equal(payload.success, true);
  assert.match(payload.subscription.id, /^whsub_/);
});

test('subscribe rejects missing tenant context', async () => {
  const req = { method: 'POST', body: { url: 'https://example.com', events: ['approval.created'] } };
  const res = makeRes();
  await handleSubscribe(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(parse(res).error, 'TENANT_CONTEXT_REQUIRED');
});

test('subscribe rejects non-POST', async () => {
  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await handleSubscribe(req, res);
  assert.equal(res.statusCode, 405);
});

test('GET /api/webhooks/list returns only tenant rows', async () => {
  const subs = getWebhookStores().subscriptions;
  await subs.insert({
    id: 'whsub_a', tenant_id: 't-1', url: 'https://a', secret: 's', events: ['approval.created'],
    active: true, created_at: 'x', updated_at: 'x',
  });
  await subs.insert({
    id: 'whsub_b', tenant_id: 't-2', url: 'https://b', secret: 's', events: ['approval.created'],
    active: true, created_at: 'x', updated_at: 'x',
  });
  const req = makeReq({ method: 'GET', tenant_id: 't-1' });
  const res = makeRes();
  await handleList(req, res);
  assert.equal(res.statusCode, 200);
  const payload = parse(res);
  assert.equal(payload.subscriptions.length, 1);
  assert.equal(payload.subscriptions[0].id, 'whsub_a');
});

test('POST /api/webhooks/unsubscribe deactivates matching row', async () => {
  const createRes = makeRes();
  await handleSubscribe(
    makeReq({ method: 'POST', body: { url: 'https://example.com', events: ['approval.created'] } }),
    createRes,
  );
  const { subscription } = parse(createRes);
  const res = makeRes();
  await handleUnsubscribe(makeReq({ method: 'POST', body: { id: subscription.id } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(parse(res).subscription.active, false);
});

test('unsubscribe returns 404 for unknown id', async () => {
  const res = makeRes();
  await handleUnsubscribe(makeReq({ method: 'POST', body: { id: 'whsub_nope' } }), res);
  assert.equal(res.statusCode, 404);
});

test('POST /api/webhooks/test-fire enqueues delivery without dispatch when skip_dispatch', async () => {
  const createRes = makeRes();
  await handleSubscribe(
    makeReq({ method: 'POST', body: { url: 'https://example.com/hook', events: ['approval.created'] } }),
    createRes,
  );
  const { subscription } = parse(createRes);

  const res = makeRes();
  await handleTestFire(
    makeReq({
      method: 'POST',
      body: { subscription_id: subscription.id, event: 'approval.created', skip_dispatch: true },
    }),
    res,
  );
  assert.equal(res.statusCode, 202);
  const payload = parse(res);
  assert.match(payload.delivery.id, /^whdel_/);
  assert.equal(payload.delivery.status, 'pending');
});

test('test-fire returns 404 for foreign subscription id', async () => {
  const res = makeRes();
  await handleTestFire(
    makeReq({ method: 'POST', body: { subscription_id: 'whsub_missing', skip_dispatch: true } }),
    res,
  );
  assert.equal(res.statusCode, 404);
});
