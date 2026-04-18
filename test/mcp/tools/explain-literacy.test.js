'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../../lib/markos/mcp/tools/literacy/explain-literacy.cjs');

test('Suite 202-06: explain_literacy simple-tier non-mutating', () => {
  assert.equal(descriptor.latency_tier, 'simple');
  assert.equal(descriptor.mutating, false);
});

test('Suite 202-06: explain_literacy resolves an archetype slug', async () => {
  const r = await descriptor.handler({
    args: { archetype: 'builder' },
    session: { tenant_id: 't1' },
    deps: { loadPack: async () => ({ archetypes: [{ slug: 'builder', description: 'makes things', examples: ['e1'] }], canon: [] }) },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.archetype, 'builder');
  assert.equal(parsed.description, 'makes things');
  assert.deepEqual(parsed.examples, ['e1']);
});

test('Suite 202-06: explain_literacy resolves a node_id', async () => {
  const r = await descriptor.handler({
    args: { node_id: 'n1' },
    session: { tenant_id: 't1' },
    deps: { loadPack: async () => ({ archetypes: [], canon: [{ id: 'n1', slug: 'n1-slug', description: 'root' }] }) },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.node_id, 'n1');
  assert.equal(parsed.canonical_slug, 'n1-slug');
});
