'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../../lib/markos/mcp/tools/marketing/research-audience.cjs');
const { compileToolSchemas, getToolValidator } = require('../../../lib/markos/mcp/ajv.cjs');

test('Suite 202-06: research_audience descriptor (latency_tier=simple, mutating=false)', () => {
  assert.equal(descriptor.name, 'research_audience');
  assert.equal(descriptor.latency_tier, 'simple');
  assert.equal(descriptor.mutating, false);
});

test('Suite 202-06: research_audience returns schema-valid output', async () => {
  compileToolSchemas({ research_audience: { input: descriptor.inputSchema, output: descriptor.outputSchema } });
  const v = getToolValidator('research_audience');
  const r = await descriptor.handler({
    args: { segment: 'founders' },
    session: { tenant_id: 't1' },
    deps: { loadPack: async () => ({ pains: [{ name: 'slow onboarding', segment: 'founders' }], archetypes: [{ slug: 'builder' }] }) },
  });
  assert.equal(v.validateOutput(r), true);
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.segment, 'founders');
  assert.equal(parsed.tenant_id, 't1');
  assert.deepEqual(parsed.archetypes, ['builder']);
});

test('Suite 202-06: research_audience degrades gracefully when pack-loader throws', async () => {
  const r = await descriptor.handler({
    args: { segment: 'x' },
    session: { tenant_id: 't1' },
    deps: { loadPack: async () => { throw new Error('pack missing'); } },
  });
  // Should not throw; returns empty lists
  assert.ok(r.content[0].text);
});
