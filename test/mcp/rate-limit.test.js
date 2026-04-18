'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SESSION_RPM, TENANT_RPM, checkRateLimit, buildRateLimitedJsonRpcError } = require('../../lib/markos/mcp/rate-limit.cjs');

function mockLimiter(results) {
  let i = 0;
  return { async limit(_id) { return results[Math.min(i++, results.length - 1)]; } };
}

test('Suite 202-04: SESSION_RPM is 60 (D-17)', () => { assert.equal(SESSION_RPM, 60); });
test('Suite 202-04: TENANT_RPM is 600 (D-17)', () => { assert.equal(TENANT_RPM, 600); });

test('Suite 202-04: checkRateLimit returns ok=true when both limiters succeed', async () => {
  const limiters = {
    perSession: mockLimiter([{ success: true }]),
    perTenant: mockLimiter([{ success: true }]),
  };
  const r = await checkRateLimit(limiters, { id: 's1', tenant_id: 't1' });
  assert.equal(r.ok, true);
});

test('Suite 202-04: checkRateLimit returns scope=session + reason=session_rpm on session limit breach', async () => {
  const limiters = {
    perSession: mockLimiter([{ success: false, reset: Date.now() + 30_000 }]),
    perTenant: mockLimiter([{ success: true }]),
  };
  const r = await checkRateLimit(limiters, { id: 's1', tenant_id: 't1' });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'session_rpm');
  assert.equal(r.scope, 'session');
  assert.equal(r.limit, 60);
  assert.ok(r.retry_after >= 1);
});

test('Suite 202-04: checkRateLimit returns scope=tenant when only tenant limiter fails', async () => {
  const limiters = {
    perSession: mockLimiter([{ success: true }]),
    perTenant: mockLimiter([{ success: false, reset: Date.now() + 40_000 }]),
  };
  const r = await checkRateLimit(limiters, { id: 's1', tenant_id: 't1' });
  assert.equal(r.reason, 'tenant_rpm');
  assert.equal(r.scope, 'tenant');
  assert.equal(r.limit, 600);
});

test('Suite 202-04: error_429 carries HTTP 429 + Retry-After header + structured body', async () => {
  const limiters = {
    perSession: mockLimiter([{ success: false, reset: Date.now() + 37_000 }]),
    perTenant: mockLimiter([{ success: true }]),
  };
  const r = await checkRateLimit(limiters, { id: 's1', tenant_id: 't1' });
  assert.equal(r.error_429.http, 429);
  assert.ok(r.error_429.headers['Retry-After']);
  assert.equal(r.error_429.body.error, 'rate_limited');
  assert.equal(r.error_429.body.scope, 'session');
  assert.equal(r.error_429.body.limit, 60);
});

test('Suite 202-04: checkRateLimit requires session.id + session.tenant_id (defensive)', async () => {
  await assert.rejects(() => checkRateLimit({ perSession: mockLimiter([{ success: true }]), perTenant: mockLimiter([{ success: true }]) }, {}), /session.id.*session.tenant_id/);
});

test('Suite 202-04: buildRateLimitedJsonRpcError returns -32002 envelope', () => {
  const env = buildRateLimitedJsonRpcError(5, 'mcp-req-a', { scope: 'session', retry_after: 30, limit: 60 });
  assert.equal(env.jsonrpc, '2.0');
  assert.equal(env.error.code, -32002);
  assert.equal(env.error.message, 'rate_limited');
  assert.equal(env.error.data.scope, 'session');
  assert.equal(env.error.data.retry_after, 30);
  assert.equal(env.error.data.limit, 60);
  assert.equal(env.error.data.req_id, 'mcp-req-a');
});
