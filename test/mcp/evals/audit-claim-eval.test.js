'use strict';

// Suite 202-10 eval: audit_claim (Haiku classifier — canon-grounded).
// Deterministic LLM + canon injection — CI-safe.

const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor } = require('../../../lib/markos/mcp/tools/marketing/audit-claim.cjs');

function fakeLLM(responseJson) {
  return {
    messages: {
      async create() {
        return {
          content: [{ text: responseJson }],
          usage: { input_tokens: 200, output_tokens: 80 },
        };
      },
    },
  };
}

test('Suite 202-10 eval: audit_claim happy-path with canon evidence + tenant_id embedded', async () => {
  const r = await descriptor.handler({
    args: { claim: 'fastest onboarding in the industry' },
    session: { tenant_id: 'eval-tenant' },
    deps: {
      loadCanon: async () => [
        { title: 'Benchmarks', text: '90-second setup beats the benchmark of 10 minutes' },
      ],
      llm: fakeLLM(JSON.stringify({
        supported: true,
        confidence: 0.75,
        evidence: [{ source: 'Benchmarks', quote: '90-second setup', score: 0.8 }],
      })),
    },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.tenant_id, 'eval-tenant', 'tenant_id must be embedded (D-15)');
  assert.equal(parsed.claim, 'fastest onboarding in the industry');
});

test('Suite 202-10 eval: audit_claim confidence in [0,1] + supported is boolean', async () => {
  const r = await descriptor.handler({
    args: { claim: 'fastest onboarding' },
    session: { tenant_id: 't1' },
    deps: {
      loadCanon: async () => [{ title: 'Benchmarks', text: '90-second setup' }],
      llm: fakeLLM(JSON.stringify({
        supported: true,
        confidence: 0.75,
        evidence: [{ source: 'Benchmarks', quote: '90-second', score: 0.8 }],
      })),
    },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(typeof parsed.supported, 'boolean');
  assert.ok(parsed.confidence >= 0 && parsed.confidence <= 1,
    `confidence ${parsed.confidence} not in [0,1]`);
});

test('Suite 202-10 eval: audit_claim claim-check pass rate >= 0.9 across 10 deterministic scenarios', async () => {
  const scenarios = [
    { claim: 'fastest', supported: true,  confidence: 0.9 },
    { claim: 'best',    supported: true,  confidence: 0.85 },
    { claim: 'cheapest', supported: false, confidence: 0.1 },
    { claim: '10x ROI', supported: true,  confidence: 0.7 },
    { claim: 'unique feature', supported: true, confidence: 0.8 },
    { claim: 'industry leader', supported: true, confidence: 0.75 },
    { claim: 'award-winning', supported: true, confidence: 0.65 },
    { claim: 'free forever', supported: false, confidence: 0.05 },
    { claim: 'one-click setup', supported: true, confidence: 0.9 },
    { claim: '99.99% uptime', supported: true, confidence: 0.95 },
  ];
  let passCount = 0;
  for (const sc of scenarios) {
    const r = await descriptor.handler({
      args: { claim: sc.claim },
      session: { tenant_id: 't-eval' },
      deps: {
        loadCanon: async () => [{ title: 'Canon', text: 'supporting evidence' }],
        llm: fakeLLM(JSON.stringify({
          supported: sc.supported,
          confidence: sc.confidence,
          evidence: sc.supported ? [{ source: 'Canon', quote: 'q', score: 0.8 }] : [],
        })),
      },
    });
    const parsed = JSON.parse(r.content[0].text);
    // "Pass" = handler returned structurally valid output with expected supported + confidence.
    if (parsed.supported === sc.supported && Math.abs(parsed.confidence - sc.confidence) < 0.001) {
      passCount += 1;
    }
  }
  const rate = passCount / scenarios.length;
  assert.ok(rate >= 0.9, `claim-check pass rate ${rate} < 0.9`);
});

test('Suite 202-10 eval: audit_claim robust to malformed LLM JSON (fallback supported=false)', async () => {
  const r = await descriptor.handler({
    args: { claim: 'unverifiable' },
    session: { tenant_id: 't' },
    deps: {
      loadCanon: async () => [],
      llm: fakeLLM('not json at all'),
    },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.supported, false);
  assert.equal(parsed.confidence, 0);
  assert.ok(Array.isArray(parsed.evidence));
  assert.equal(parsed.evidence.length, 0);
});
