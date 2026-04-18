'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../../lib/markos/mcp/tools/literacy/list-pain-points.cjs');

test('Suite 202-06: list_pain_points is simple-tier non-mutating', () => {
  assert.equal(descriptor.latency_tier, 'simple');
  assert.equal(descriptor.mutating, false);
});

test('Suite 202-06: list_pain_points returns tenant-scoped items', async () => {
  const r = await descriptor.handler({
    args: {},
    session: { tenant_id: 't1' },
    deps: { loadPack: async () => ({ pains: [{ id: 'p1', name: 'slow', description: 'bad', score: 0.8, category: 'adoption' }] }) },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.tenant_id, 't1');
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].id, 'p1');
});

test('Suite 202-06: list_pain_points filters by category when provided', async () => {
  const r = await descriptor.handler({
    args: { category: 'billing' },
    session: { tenant_id: 't1' },
    deps: { loadPack: async () => ({ pains: [{ name: 'x', category: 'adoption' }, { name: 'y', category: 'billing' }] }) },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].name, 'y');
});
