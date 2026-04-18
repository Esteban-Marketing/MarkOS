'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../../lib/markos/mcp/tools/marketing/generate-brief.cjs');

function fakeLLM(text) {
  return { messages: { async create() { return { content: [{ text }], usage: { input_tokens: 50, output_tokens: 120 } }; } } };
}

test('Suite 202-06: generate_brief descriptor (llm tier, non-mutating)', () => {
  assert.equal(descriptor.latency_tier, 'llm');
  assert.equal(descriptor.mutating, false);
});

test('Suite 202-06: generate_brief returns parsed JSON brief with _usage', async () => {
  const r = await descriptor.handler({
    args: { prompt: 'email campaign for early adopters' },
    session: { tenant_id: 't1' },
    deps: { llm: fakeLLM(JSON.stringify({ channel: 'email', audience: 'early adopters', pain: 'adoption', promise: 'fast setup', brand: 'markos', derived_from: 'prompt' })) },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.channel, 'email');
  assert.equal(parsed.tenant_id, 't1');
  assert.equal(r._usage.input_tokens, 50);
});

test('Suite 202-06: generate_brief falls back gracefully on unparseable LLM response', async () => {
  const r = await descriptor.handler({
    args: { prompt: 'test' },
    session: { tenant_id: 't1' },
    deps: { llm: fakeLLM('not json') },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.derived_from, 'parse_failed');
});
