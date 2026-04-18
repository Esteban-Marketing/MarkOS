'use strict';

// Suite 202-10 eval: plan_campaign (D-04 hero demo).
// Deterministic LLM injection — CI-safe. QA-08 eval-as-test.

const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../../lib/markos/mcp/tools/marketing/plan-campaign.cjs');
const { compileToolSchemas, getToolValidator } = require('../../../lib/markos/mcp/ajv.cjs');

function fakeLLM(responseJson) {
  return {
    messages: {
      async create() {
        return {
          content: [{ text: responseJson }],
          usage: { input_tokens: 500, output_tokens: 1000 },
        };
      },
    },
  };
}

test('Suite 202-10 eval: plan_campaign deterministic happy-path output validates + carries tenant_id', async () => {
  compileToolSchemas({
    plan_campaign: { input: descriptor.inputSchema, output: descriptor.outputSchema },
  });
  const v = getToolValidator('plan_campaign');
  const canned = JSON.stringify({
    channels: [
      { channel: 'email', blocks: [{ subject: 'Launch', body: 'v1' }] },
      { channel: 'linkedin', blocks: [{ headline: 'Ship it', body: 'b' }] },
    ],
  });
  const r = await descriptor.handler({
    args: { objective: 'launch product', audience: 'seed founders', budget: '$2k' },
    session: { tenant_id: 'eval-tenant' },
    deps: { llm: fakeLLM(canned) },
  });
  assert.equal(v.validateOutput(r), true, JSON.stringify(v.validateOutput.errors));
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.tenant_id, 'eval-tenant', 'tenant_id must be embedded (D-15)');
  assert.equal(parsed.channels.length, 2);
});

test('Suite 202-10 eval: plan_campaign token _usage reported as integers >= 0', async () => {
  compileToolSchemas({
    plan_campaign: { input: descriptor.inputSchema, output: descriptor.outputSchema },
  });
  const r = await descriptor.handler({
    args: { objective: 'test', audience: 'x' },
    session: { tenant_id: 't1' },
    deps: { llm: fakeLLM('{"channels":[]}') },
  });
  assert.ok(Number.isInteger(r._usage.input_tokens), 'input_tokens must be integer');
  assert.ok(Number.isInteger(r._usage.output_tokens), 'output_tokens must be integer');
  assert.ok(r._usage.input_tokens >= 0);
  assert.ok(r._usage.output_tokens >= 0);
});

test('Suite 202-10 eval: plan_campaign robust to malformed LLM JSON (no throw, fallback to empty channels)', async () => {
  const r = await descriptor.handler({
    args: { objective: 'x', audience: 'y' },
    session: { tenant_id: 't' },
    deps: { llm: fakeLLM('definitely not json') },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.ok(Array.isArray(parsed.channels));
  assert.equal(parsed.channels.length, 0);
});

test('Suite 202-10 eval: plan_campaign brand-voice-drift stub < 0.1 (deterministic)', async () => {
  // Brand-voice drift stub metric: hamming-ish ratio of expected markers missing from output.
  const canned = JSON.stringify({
    channels: [{ channel: 'email', blocks: [{ subject: 'Protocol-grade marketing', body: 'MarkOS delivers' }] }],
  });
  const r = await descriptor.handler({
    args: { objective: 'positioning launch', audience: 'AI-ready teams' },
    session: { tenant_id: 't-drift' },
    deps: { llm: fakeLLM(canned) },
  });
  const outputText = JSON.stringify(r);
  const expectedMarkers = ['channels', 'tenant_id', 'plan_id']; // structural markers
  const missing = expectedMarkers.filter((m) => !outputText.includes(m));
  const drift = missing.length / expectedMarkers.length;
  assert.ok(drift < 0.1, `brand-voice drift stub = ${drift}, expected < 0.1`);
});
