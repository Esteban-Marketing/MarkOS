'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../../lib/markos/mcp/tools/marketing/audit-claim.cjs');

function fakeLLM(text) {
  return { messages: { async create() { return { content: [{ text }], usage: { input_tokens: 300, output_tokens: 100 } }; } } };
}

test('Suite 202-06: audit_claim descriptor (llm tier, non-mutating, Haiku model)', () => {
  assert.equal(descriptor.name, 'audit_claim');
  assert.equal(descriptor.latency_tier, 'llm');
  assert.ok(/haiku/i.test(descriptor.cost_model.model || ''));
});

test('Suite 202-06: audit_claim returns { supported, confidence, evidence } wrapped in content', async () => {
  const r = await descriptor.handler({
    args: { claim: 'We have the fastest onboarding' },
    session: { tenant_id: 't1' },
    deps: {
      loadCanon: async () => [{ title: 'Benchmarks', text: 'onboarding in 90s' }],
      llm: fakeLLM(JSON.stringify({ supported: true, confidence: 0.8, evidence: [{ source: 'Benchmarks', quote: 'onboarding in 90s', score: 0.9 }] })),
    },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.supported, true);
  assert.equal(parsed.confidence, 0.8);
  assert.equal(parsed.evidence.length, 1);
  assert.equal(parsed.tenant_id, 't1');
});
