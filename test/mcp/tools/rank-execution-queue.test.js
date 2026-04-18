'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../../lib/markos/mcp/tools/execution/rank-execution-queue.cjs');

test('Suite 202-06: rank_execution_queue simple-tier non-mutating', () => {
  assert.equal(descriptor.latency_tier, 'simple');
  assert.equal(descriptor.mutating, false);
});

test('Suite 202-06: rank_execution_queue returns ranked list + tenant_id + generated_at', async () => {
  const r = await descriptor.handler({
    args: { limit: 5 },
    session: { tenant_id: 't1' },
    deps: { rank: async () => ({ ranked: [{ id: 'e1', rank: 1, score: 0.9, reason: 'a' }, { id: 'e2', rank: 2, score: 0.5, reason: 'b' }] }) },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.tenant_id, 't1');
  assert.equal(parsed.ranked.length, 2);
  assert.ok(parsed.generated_at);
});

test('Suite 202-06: rank_execution_queue respects limit', async () => {
  const r = await descriptor.handler({
    args: { limit: 1 },
    session: { tenant_id: 't1' },
    deps: { rank: async () => ({ ranked: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }) },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.ranked.length, 1);
});
