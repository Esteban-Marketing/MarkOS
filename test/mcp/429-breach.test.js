'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRateLimitedJsonRpcError } = require('../../lib/markos/mcp/rate-limit.cjs');
const { buildBudgetExhaustedJsonRpcError } = require('../../lib/markos/mcp/cost-meter.cjs');

test('Suite 202-04: 429 envelope error.code is -32002 and round-trips through JSON', () => {
  const env = buildRateLimitedJsonRpcError(1, 'r', { scope: 'tenant', retry_after: 15, limit: 600 });
  const rt = JSON.parse(JSON.stringify(env));
  assert.deepEqual(rt, env);
  assert.equal(rt.error.code, -32002);
});

test('Suite 202-04: 429 envelope code is within JSON-RPC server-defined range', () => {
  const env = buildRateLimitedJsonRpcError(1, 'r', { scope: 'session', retry_after: 1, limit: 60 });
  assert.ok(env.error.code >= -32099 && env.error.code <= -32000);
});

test('Suite 202-04: 429 vs 402 envelope codes are distinct (-32002 vs -32001)', () => {
  const env429 = buildRateLimitedJsonRpcError(1, 'r', { scope: 's', retry_after: 1, limit: 60 });
  const env402 = buildBudgetExhaustedJsonRpcError(1, 'r', { reset_at: 'x', spent_cents: 0, cap_cents: 0 });
  assert.notEqual(env429.error.code, env402.error.code);
});
