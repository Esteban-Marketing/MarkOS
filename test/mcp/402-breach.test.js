'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildBudgetExhaustedJsonRpcError } = require('../../lib/markos/mcp/cost-meter.cjs');

test('Suite 202-03: 402 envelope has JSON-RPC 2.0 shape', () => {
  const env = buildBudgetExhaustedJsonRpcError(1, 'req', { reset_at: 'x', spent_cents: 100, cap_cents: 100 });
  assert.equal(env.jsonrpc, '2.0');
  assert.ok('id' in env);
  assert.ok('error' in env);
  assert.equal(typeof env.error, 'object');
});

test('Suite 202-03: 402 envelope error.code is -32001 (D-11 custom server-defined code)', () => {
  const env = buildBudgetExhaustedJsonRpcError(1, 'req', { reset_at: 'x', spent_cents: 0, cap_cents: 0 });
  assert.equal(env.error.code, -32001);
});

test('Suite 202-03: 402 envelope error.code is within JSON-RPC server-defined range [-32099,-32000]', () => {
  const env = buildBudgetExhaustedJsonRpcError(1, 'req', { reset_at: 'x', spent_cents: 0, cap_cents: 0 });
  assert.ok(env.error.code >= -32099 && env.error.code <= -32000);
});

test('Suite 202-03: 402 envelope error.message is exactly "budget_exhausted"', () => {
  const env = buildBudgetExhaustedJsonRpcError(null, 'r', { reset_at: 'x', spent_cents: 1, cap_cents: 2 });
  assert.equal(env.error.message, 'budget_exhausted');
});

test('Suite 202-03: 402 envelope data includes reset_at, spent_cents, cap_cents, req_id (D-11)', () => {
  const env = buildBudgetExhaustedJsonRpcError(7, 'mcp-req-abc', { reset_at: '2026-04-18T14:00:00.000Z', spent_cents: 100, cap_cents: 100 });
  assert.equal(env.error.data.reset_at, '2026-04-18T14:00:00.000Z');
  assert.equal(env.error.data.spent_cents, 100);
  assert.equal(env.error.data.cap_cents, 100);
  assert.equal(env.error.data.req_id, 'mcp-req-abc');
});

test('Suite 202-03: 402 envelope round-trips through JSON.stringify/parse (wire-safe)', () => {
  const env = buildBudgetExhaustedJsonRpcError('id-str', 'r', { reset_at: '2026-04-18T14:00:00Z', spent_cents: 42, cap_cents: 100 });
  const roundtripped = JSON.parse(JSON.stringify(env));
  assert.deepEqual(roundtripped, env);
});

test('Suite 202-03: 402 envelope code (-32001) is distinct from 429 envelope code (-32002) to avoid confusion', () => {
  const env = buildBudgetExhaustedJsonRpcError(1, 'r', { reset_at: 'x', spent_cents: 0, cap_cents: 0 });
  assert.notEqual(env.error.code, -32002);
});

test('Suite 202-03: 402 envelope retains null id when caller passes null (JSON-RPC spec — notifications map to null id in errors)', () => {
  const env = buildBudgetExhaustedJsonRpcError(null, 'r', { reset_at: 'x', spent_cents: 0, cap_cents: 0 });
  assert.equal(env.id, null);
});
