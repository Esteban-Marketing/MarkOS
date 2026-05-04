'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  LIMIT_PER_MINUTE,
  currentMinuteWindowStart,
  checkRateLimit,
} = require('../../lib/markos/mcp/rate-limit-bearer.cjs');

function clientWithRpc(handler) {
  return {
    rpc: async (_name, args) => handler(args),
  };
}

test('LIMIT_PER_MINUTE is 100', () => {
  assert.equal(LIMIT_PER_MINUTE, 100);
});

test('currentMinuteWindowStart floors milliseconds to the current minute', () => {
  assert.equal(currentMinuteWindowStart(Date.parse('2026-04-30T12:34:56.789Z')), '2026-04-30T12:34:00.000Z');
});

test('checkRateLimit returns ok=true when SQL function count is at or below the limit', async () => {
  const client = clientWithRpc(async () => ({ data: 100, error: null }));
  const result = await checkRateLimit(client, 't1');
  assert.equal(result.ok, true);
  assert.equal(result.count, 100);
});

test('checkRateLimit returns ok=false and retry_after_seconds when count exceeds the limit', async () => {
  const client = clientWithRpc(async () => ({ data: 101, error: null }));
  const result = await checkRateLimit(client, 't1', { now: Date.parse('2026-04-30T12:34:30.000Z') });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'rate_limited');
  assert.equal(result.count, 101);
  assert.equal(result.retry_after_seconds, 30);
});

test('checkRateLimit throws when RPC fails', async () => {
  const client = clientWithRpc(async () => ({ data: null, error: { message: 'db down' } }));
  await assert.rejects(() => checkRateLimit(client, 't1'), /db down/);
});

test('checkRateLimit requires tenant_id', async () => {
  const client = clientWithRpc(async () => ({ data: 1, error: null }));
  await assert.rejects(() => checkRateLimit(client, ''), /tenant_id required/);
});
