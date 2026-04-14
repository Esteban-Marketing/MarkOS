const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeDeepResearchEnvelope } = require('../../onboarding/backend/research/deep-research-envelope.cjs');
const {
  buildResearchRoute,
  rankEvidenceByAuthority,
} = require('../../onboarding/backend/research/provider-routing-policy.cjs');

test('91-02 provider routing stays internal first and degrades safely when external providers are unavailable', () => {
  const request = normalizeDeepResearchEnvelope({
    query: 'Tailor messaging',
    research_type: 'company',
    filters: {
      industry: ['b2b_saas'],
      company: { name: 'Acme', domain: 'acme.com' },
      audience: ['revops_leader'],
      offer_product: ['platform'],
    },
  });

  const policy = buildResearchRoute(request, {
    externalAvailability: {
      tavily: false,
      firecrawl: false,
      openai_synthesis: false,
    },
  });

  assert.deepEqual(policy.route_trace.map((entry) => entry.provider), [
    'markos_vault',
    'markos_mcp',
    'tavily',
    'firecrawl',
    'openai_synthesis',
  ]);
  assert.equal(policy.route_trace[0].status, 'used');
  assert.equal(policy.route_trace[1].status, 'used');
  assert.equal(policy.route_trace[2].status, 'degraded');
  assert.equal(policy.internal_authority, true);
  assert.ok(policy.warnings.length >= 1);
});

test('91-02 authority ranking keeps approved internal evidence ahead of external candidates and synthesis', () => {
  const ranked = rankEvidenceByAuthority([
    { authority: 'synthesized', citation: 'model-summary' },
    { authority: 'external_candidate', citation: 'https://example.com' },
    { authority: 'approved_internal', citation: 'vault://mir/acme' },
  ]);

  assert.deepEqual(ranked.map((entry) => entry.authority), [
    'approved_internal',
    'external_candidate',
    'synthesized',
  ]);
});
