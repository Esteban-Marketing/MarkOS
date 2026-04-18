'use strict';

// Suite 202-07: 3 net-new literacy handlers — descriptor shape + tenant-scope invariants.
// All simple tier, non-mutating. All filter reads via session.tenant_id.

const test = require('node:test');
const assert = require('node:assert/strict');

const DESCRIPTORS = [
  require('../../../lib/markos/mcp/tools/literacy/query-canon.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/literacy/explain-archetype.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/literacy/walk-taxonomy.cjs').descriptor,
];

const SESSION = { tenant_id: 'tenant-xyz', user_id: 'u-1', org_id: 'o-1', plan_tier: 'pro' };

function buildArgs(d) {
  const args = {};
  for (const k of d.inputSchema.required || []) {
    const p = d.inputSchema.properties[k];
    if (p?.enum) args[k] = p.enum[0];
    else if (p?.type === 'integer') args[k] = p.minimum || 1;
    else args[k] = 'x';
  }
  return args;
}

test('Suite 202-07: 3 literacy net-new descriptors present with expected names', () => {
  const names = DESCRIPTORS.map((d) => d.name).sort();
  assert.deepEqual(names, ['explain_archetype', 'query_canon', 'walk_taxonomy']);
});

test('Suite 202-07: all literacy handlers are simple tier, non-mutating', () => {
  for (const d of DESCRIPTORS) {
    assert.equal(d.latency_tier, 'simple', `${d.name} should be simple tier`);
    assert.equal(d.mutating, false, `${d.name} should be non-mutating`);
  }
});

test('Suite 202-07: every literacy descriptor has strict input schema + cost_model', () => {
  for (const d of DESCRIPTORS) {
    assert.equal(
      d.inputSchema.additionalProperties,
      false,
      `${d.name} inputSchema must reject additionalProperties`,
    );
    assert.ok(d.cost_model, `${d.name} missing cost_model`);
  }
});

test('Suite 202-07: every literacy handler embeds tenant_id in output (D-15)', async () => {
  for (const d of DESCRIPTORS) {
    const args = buildArgs(d);
    const r = await d.handler({ args, session: SESSION, supabase: null, deps: {} });
    assert.ok(Array.isArray(r.content), `${d.name} content not array`);
    const parsed = JSON.parse(r.content[0].text);
    assert.equal(parsed.tenant_id, 'tenant-xyz', `${d.name} output missing tenant_id`);
  }
});
