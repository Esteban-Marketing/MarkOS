'use strict';

// Suite 202-07: 5 net-new CRM handlers — descriptor shape + tenant-scope invariants.
// Parametric: iterates descriptors. 4 handlers are `simple` tier (non-LLM); summarize_deal
// is `llm` tier (Haiku). All non-mutating. All filter reads on session.tenant_id.

const test = require('node:test');
const assert = require('node:assert/strict');

const DESCRIPTORS = [
  require('../../../lib/markos/mcp/tools/crm/list-crm-entities.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/crm/query-crm-timeline.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/crm/snapshot-pipeline.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/crm/read-segment.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/crm/summarize-deal.cjs').descriptor,
];

const SESSION = { tenant_id: 'tenant-xyz', user_id: 'u-1', org_id: 'o-1', plan_tier: 'pro' };

function mockSupabase() {
  // Minimal query-builder mock — handler code paths use require('./crm/*') fallbacks
  // by default, so this is mostly a safety net for handlers that call into supabase
  // directly (query-audit / list-members).
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ limit: async () => ({ data: [], error: null }) }),
      }),
    }),
  };
}

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

test('Suite 202-07: 5 CRM net-new descriptors present with expected names', () => {
  const names = DESCRIPTORS.map((d) => d.name).sort();
  assert.deepEqual(names, [
    'list_crm_entities',
    'query_crm_timeline',
    'read_segment',
    'snapshot_pipeline',
    'summarize_deal',
  ]);
});

test('Suite 202-07: all CRM handlers are non-mutating', () => {
  for (const d of DESCRIPTORS) {
    assert.equal(d.mutating, false, `${d.name} should be non-mutating`);
  }
});

test('Suite 202-07: 4 CRM handlers are simple tier, summarize_deal is llm', () => {
  for (const d of DESCRIPTORS) {
    if (d.name === 'summarize_deal') assert.equal(d.latency_tier, 'llm');
    else assert.equal(d.latency_tier, 'simple', `${d.name} should be simple tier`);
  }
});

test('Suite 202-07: every CRM handler has cost_model + strict input schema', () => {
  for (const d of DESCRIPTORS) {
    assert.ok(d.cost_model, `${d.name} missing cost_model`);
    assert.equal(
      d.inputSchema.additionalProperties,
      false,
      `${d.name} must reject additionalProperties`,
    );
  }
});

test('Suite 202-07: every CRM handler filters on session.tenant_id (D-15)', async () => {
  for (const d of DESCRIPTORS) {
    const args = buildArgs(d);
    const deps = d.name === 'summarize_deal' ? { llm: null } : {};
    const r = await d.handler({
      args,
      session: SESSION,
      supabase: mockSupabase(),
      deps,
    });
    assert.ok(Array.isArray(r.content), `${d.name} content not array`);
    const parsed = JSON.parse(r.content[0].text);
    assert.equal(
      parsed.tenant_id,
      'tenant-xyz',
      `${d.name} output missing tenant_id (D-15 defense)`,
    );
  }
});

test('Suite 202-07: summarize_deal returns _usage; other CRM handlers are non-LLM (no _usage required)', async () => {
  for (const d of DESCRIPTORS) {
    const args = buildArgs(d);
    const deps = d.name === 'summarize_deal' ? { llm: null } : {};
    const r = await d.handler({ args, session: SESSION, supabase: mockSupabase(), deps });
    if (d.name === 'summarize_deal') {
      assert.ok(r._usage, 'summarize_deal missing _usage');
      assert.equal(typeof r._usage.input_tokens, 'number');
    }
  }
});
