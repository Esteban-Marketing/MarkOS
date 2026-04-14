const test = require('node:test');
const assert = require('node:assert/strict');

const { createInternalEvidenceAdapter } = require('../../onboarding/backend/research/providers/internal-evidence-adapter.cjs');
const { createTavilyResearchAdapter } = require('../../onboarding/backend/research/providers/tavily-research-adapter.cjs');
const { createFirecrawlResearchAdapter } = require('../../onboarding/backend/research/providers/firecrawl-research-adapter.cjs');
const { createOpenAIResearchAdapter } = require('../../onboarding/backend/research/providers/openai-research-adapter.cjs');

test('93-02 adapters normalize evidence into one shared schema', async () => {
  const internal = createInternalEvidenceAdapter({
    searchService: {
      async searchApprovedKnowledge() {
        return {
          results: [{
            artifact_uri: 'markos://tenant/tenant-alpha-001/mir/mir-1',
            artifact_kind: 'mir',
            title: 'Internal positioning',
            snippet: 'Internal proof',
            citation: 'MIR / Canonical',
            source_ref: 'MIR / Canonical',
            freshness: '2026-04-14T00:00:00.000Z',
            confidence: 0.95,
            implication: 'Keep operator-safe framing.',
          }],
        };
      },
    },
  });

  const tavily = createTavilyResearchAdapter({ apiKey: 'test-key' });
  const firecrawl = createFirecrawlResearchAdapter({ apiKey: 'test-key' });
  const openai = createOpenAIResearchAdapter({ apiKey: 'test-key' });

  const internalResult = await internal.collect({ query: 'positioning', claims: { tenantId: 'tenant-alpha-001' } });
  const tavilyResult = await tavily.collect({ query: 'positioning', routeStage: { status: 'used' } }, {
    fixtureResults: [{ url: 'https://example.com', title: 'Example', content: 'Fresh market proof' }],
  });
  const firecrawlResult = await firecrawl.collect({ target_urls: ['https://example.com'], routeStage: { status: 'used' } }, {
    fixtureResults: [{ url: 'https://example.com', markdown: '# Pricing\nFresh details' }],
  });
  const openaiResult = await openai.collect({ query: 'positioning', routeStage: { status: 'used' }, deepResearch: true }, {
    fixtureResponse: { summary: 'Synthesized insight', citations: ['https://example.com'] },
  });

  for (const result of [internalResult, tavilyResult, firecrawlResult, openaiResult]) {
    assert.ok(Array.isArray(result.evidence));
    assert.ok(Array.isArray(result.attempts));
    assert.ok(result.evidence[0].citation || result.evidence[0].source_ref);
    assert.ok(result.evidence[0].freshness);
    assert.equal(typeof result.evidence[0].confidence, 'number');
    assert.ok(result.evidence[0].lineage && typeof result.evidence[0].lineage === 'object');
  }
});
