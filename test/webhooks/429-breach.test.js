'use strict';

// Phase 203 Plan 07 Task 1: subscribe-time rps_override validation (D-13).
// Tests behaviors 1k..1m from the plan.

const test = require('node:test');
const assert = require('node:assert/strict');

const subscribeMod = require('../../api/webhooks/subscribe.js');
const { _resetWebhookStoresForTests, getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');

function makeReqRes(body) {
  const req = {
    method: 'POST',
    body,
    markosAuth: { tenant_id: 't-1' },
    on() { /* no-op for already-parsed body */ },
  };
  const chunks = [];
  let status = null;
  const res = {
    statusCode: 200,
    setHeader() {},
    getHeader() {},
    writeHead(code) { status = code; this.statusCode = code; },
    write(c) { chunks.push(String(c)); },
    end(c) { if (c !== undefined) chunks.push(String(c)); },
  };
  return { req, res, getStatus: () => status || res.statusCode, getBody: () => chunks.join('') };
}

function parseJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}

test('Plan 203-07 1k: subscribe accepts rps_override=30 with plan_tier=team', async () => {
  _resetWebhookStoresForTests();
  process.env.WEBHOOK_STORE_MODE = 'memory';
  const { req, res, getStatus, getBody } = makeReqRes({
    url: 'https://example.com/hook',
    events: ['approval.created'],
    plan_tier: 'team',
    rps_override: 30,
  });
  await subscribeMod(req, res);
  const status = getStatus();
  assert.equal(status, 201, `expected 201, got ${status} body=${getBody()}`);
  const body = parseJson(getBody());
  assert.ok(body.success === true);
  assert.equal(body.subscription.rps_override, 30);
});

test('Plan 203-07 1l: subscribe rejects rps_override=120 with plan_tier=team (400 rps_override_exceeds_plan)', async () => {
  _resetWebhookStoresForTests();
  process.env.WEBHOOK_STORE_MODE = 'memory';
  const { req, res, getStatus, getBody } = makeReqRes({
    url: 'https://example.com/hook',
    events: ['approval.created'],
    plan_tier: 'team',
    rps_override: 120,
  });
  await subscribeMod(req, res);
  assert.equal(getStatus(), 400);
  const body = parseJson(getBody());
  assert.equal(body.error, 'rps_override_exceeds_plan');
  assert.equal(body.ceiling, 60);
});

test('Plan 203-07 1m: subscribe without rps_override persists rps_override=null', async () => {
  _resetWebhookStoresForTests();
  process.env.WEBHOOK_STORE_MODE = 'memory';
  const { req, res, getStatus, getBody } = makeReqRes({
    url: 'https://example.com/hook',
    events: ['approval.created'],
    plan_tier: 'team',
    // no rps_override
  });
  await subscribeMod(req, res);
  assert.equal(getStatus(), 201);
  const body = parseJson(getBody());
  assert.equal(body.success, true);
  // rps_override should be null/undefined on the returned row
  assert.ok(body.subscription.rps_override == null, 'rps_override should be null/undefined when not provided');
});

test('Plan 203-07 extra: subscribe rejects rps_override="30" as invalid_rps_override', async () => {
  _resetWebhookStoresForTests();
  process.env.WEBHOOK_STORE_MODE = 'memory';
  const { req, res, getStatus, getBody } = makeReqRes({
    url: 'https://example.com/hook',
    events: ['approval.created'],
    plan_tier: 'team',
    rps_override: '30', // string instead of number
  });
  await subscribeMod(req, res);
  assert.equal(getStatus(), 400);
  const body = parseJson(getBody());
  assert.equal(body.error, 'invalid_rps_override');
});

test('Plan 203-07 extra: subscribe with rps_override=30 + free tier rejects (exceeds 10)', async () => {
  _resetWebhookStoresForTests();
  process.env.WEBHOOK_STORE_MODE = 'memory';
  const { req, res, getStatus, getBody } = makeReqRes({
    url: 'https://example.com/hook',
    events: ['approval.created'],
    plan_tier: 'free',
    rps_override: 30,
  });
  await subscribeMod(req, res);
  assert.equal(getStatus(), 400);
  const body = parseJson(getBody());
  assert.equal(body.error, 'rps_override_exceeds_plan');
  assert.equal(body.ceiling, 10);
});
