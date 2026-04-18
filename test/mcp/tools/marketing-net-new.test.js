'use strict';

// Suite 202-07: 10 net-new marketing handlers — descriptor shape + handler invariants.
// Parametric: iterates descriptors and asserts contract-level properties that every
// LLM-backed marketing tool must satisfy (D-01 marketing-weighted net-new; D-15 tenant scope).

const test = require('node:test');
const assert = require('node:assert/strict');

const DESCRIPTORS = [
  require('../../../lib/markos/mcp/tools/marketing/remix-draft.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/rank-draft-variants.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/brief-to-plan.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/generate-channel-copy.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/expand-claim-evidence.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/clone-persona-voice.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/generate-subject-lines.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/optimize-cta.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/generate-preview-text.cjs').descriptor,
  require('../../../lib/markos/mcp/tools/marketing/audit-claim-strict.cjs').descriptor,
];

const EXPECTED_NAMES = [
  'remix_draft',
  'rank_draft_variants',
  'brief_to_plan',
  'generate_channel_copy',
  'expand_claim_evidence',
  'clone_persona_voice',
  'generate_subject_lines',
  'optimize_cta',
  'generate_preview_text',
  'audit_claim_strict',
];

function buildMinimalArgs(d) {
  const args = {};
  const required = d.inputSchema.required || [];
  for (const k of required) {
    const prop = d.inputSchema.properties[k];
    if (!prop) continue;
    if (prop.enum) args[k] = prop.enum[0];
    else if (prop.type === 'string') args[k] = 'x';
    else if (prop.type === 'integer' || prop.type === 'number') args[k] = prop.minimum || 1;
    else if (prop.type === 'array') {
      const n = prop.minItems || 2;
      args[k] = Array.from({ length: n }, (_, i) => 'variant' + i);
    } else if (prop.type === 'object') {
      // Synthesize minimal object honoring its nested required fields.
      const nested = {};
      for (const sub of prop.required || []) {
        const sp = prop.properties?.[sub];
        if (sp?.enum) nested[sub] = sp.enum[0];
        else nested[sub] = 'x';
      }
      args[k] = nested;
    } else args[k] = 'x';
  }
  return args;
}

const SESSION = { tenant_id: 'tenant-xyz', user_id: 'u-1', org_id: 'o-1', plan_tier: 'pro' };

test('Suite 202-07: 10 net-new marketing descriptors present + every name matches expected', () => {
  assert.equal(DESCRIPTORS.length, 10);
  for (const name of EXPECTED_NAMES) {
    assert.ok(DESCRIPTORS.some((d) => d.name === name), `missing descriptor: ${name}`);
  }
});

test('Suite 202-07: every marketing descriptor is llm tier, non-mutating, carries cost_model + handler', () => {
  for (const d of DESCRIPTORS) {
    assert.equal(d.latency_tier, 'llm', `${d.name} should be llm tier`);
    assert.equal(d.mutating, false, `${d.name} should be non-mutating`);
    assert.ok(d.cost_model, `${d.name} missing cost_model`);
    assert.ok(d.cost_model.model, `${d.name} cost_model.model missing (must be llm)`);
    assert.equal(typeof d.handler, 'function', `${d.name} handler not a function`);
    assert.equal(typeof d.description, 'string', `${d.name} description not a string`);
    assert.ok(d.description.length > 0, `${d.name} description empty`);
  }
});

test('Suite 202-07: every marketing descriptor has strict input schema (additionalProperties:false)', () => {
  for (const d of DESCRIPTORS) {
    assert.equal(
      d.inputSchema.additionalProperties,
      false,
      `${d.name} inputSchema must reject additionalProperties (AJV strict)`,
    );
    assert.ok(Array.isArray(d.inputSchema.required), `${d.name} inputSchema.required missing`);
  }
});

test('Suite 202-07: every marketing descriptor outputSchema requires content + _usage', () => {
  for (const d of DESCRIPTORS) {
    assert.ok(Array.isArray(d.outputSchema.required), `${d.name} outputSchema.required missing`);
    assert.ok(d.outputSchema.required.includes('content'), `${d.name} output missing required content`);
    assert.ok(d.outputSchema.required.includes('_usage'), `${d.name} output missing required _usage`);
  }
});

test('Suite 202-07: handler with null LLM returns valid fallback shape (no throw)', async () => {
  for (const d of DESCRIPTORS) {
    const args = buildMinimalArgs(d);
    const r = await d.handler({
      args,
      session: SESSION,
      supabase: null,
      deps: { llm: null },
    });
    assert.ok(r.content && Array.isArray(r.content), `${d.name} content not array`);
    assert.ok(r.content.length > 0, `${d.name} content empty`);
    assert.equal(r.content[0].type, 'text', `${d.name} first content item not text`);
    assert.ok(r._usage, `${d.name} missing _usage`);
    assert.equal(typeof r._usage.input_tokens, 'number', `${d.name} _usage.input_tokens not number`);
    assert.equal(typeof r._usage.output_tokens, 'number', `${d.name} _usage.output_tokens not number`);
  }
});

test('Suite 202-07: every marketing handler embeds tenant_id in output JSON (D-15)', async () => {
  for (const d of DESCRIPTORS) {
    const args = buildMinimalArgs(d);
    const r = await d.handler({
      args,
      session: SESSION,
      supabase: null,
      deps: { llm: null },
    });
    const parsed = JSON.parse(r.content[0].text);
    assert.equal(parsed.tenant_id, 'tenant-xyz', `${d.name} output missing tenant_id (D-15 defense)`);
  }
});
