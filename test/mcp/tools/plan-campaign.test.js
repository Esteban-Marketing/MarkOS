'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor, outputSchema } = require('../../../lib/markos/mcp/tools/marketing/plan-campaign.cjs');
const { compileToolSchemas, getToolValidator } = require('../../../lib/markos/mcp/ajv.cjs');

function fakeLLM(text) {
  return {
    messages: {
      async create() {
        return { content: [{ type: 'text', text }], usage: { input_tokens: 100, output_tokens: 200 } };
      },
    },
  };
}

test('Suite 202-06: plan_campaign descriptor has required fields (name, latency_tier=llm, mutating=false)', () => {
  assert.equal(descriptor.name, 'plan_campaign');
  assert.equal(descriptor.latency_tier, 'llm');
  assert.equal(descriptor.mutating, false);
  assert.ok(descriptor.cost_model);
  assert.ok(descriptor.inputSchema);
  assert.ok(descriptor.outputSchema);
  assert.equal(typeof descriptor.handler, 'function');
});

test('Suite 202-06: plan_campaign handler returns schema-valid output', async () => {
  compileToolSchemas({ plan_campaign: { input: descriptor.inputSchema, output: descriptor.outputSchema } });
  const v = getToolValidator('plan_campaign');

  const llmText = JSON.stringify({ channels: [{ channel: 'email', blocks: [{ subject: 'Hello', body: 'world' }] }] });
  const r = await descriptor.handler({
    args: { objective: 'launch', audience: 'founders', budget: '$1k' },
    session: { tenant_id: 't1' },
    supabase: null,
    deps: { llm: fakeLLM(llmText) },
    req_id: 'r',
  });
  assert.equal(v.validateOutput(r), true, JSON.stringify(v.validateOutput.errors));
  assert.ok(r._usage.input_tokens > 0);
  assert.ok(r._usage.output_tokens > 0);
});

test('Suite 202-06: plan_campaign output embeds tenant_id (D-15 tenant scope)', async () => {
  const r = await descriptor.handler({
    args: { objective: 'launch', audience: 'founders' },
    session: { tenant_id: 't1' },
    supabase: null,
    deps: { llm: fakeLLM('{"channels":[]}') },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.tenant_id, 't1');
});
