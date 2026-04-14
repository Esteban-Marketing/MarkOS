const test = require('node:test');
const assert = require('node:assert/strict');

const { createTavilyResearchAdapter } = require('../../onboarding/backend/research/providers/tavily-research-adapter.cjs');
const { createFirecrawlResearchAdapter } = require('../../onboarding/backend/research/providers/firecrawl-research-adapter.cjs');
const { createOpenAIResearchAdapter } = require('../../onboarding/backend/research/providers/openai-research-adapter.cjs');

test('93-02 missing provider credentials degrade safely instead of throwing', async () => {
  const tavily = createTavilyResearchAdapter();
  const firecrawl = createFirecrawlResearchAdapter();
  const openai = createOpenAIResearchAdapter();

  const tavilyResult = await tavily.collect({ query: 'freshness check', routeStage: { status: 'used' } });
  const firecrawlResult = await firecrawl.collect({ target_urls: ['https://example.com'], routeStage: { status: 'used' } });
  const openaiResult = await openai.collect({ query: 'freshness check', routeStage: { status: 'skipped' }, deepResearch: false });

  assert.equal(tavilyResult.attempts[0].status, 'degraded');
  assert.equal(firecrawlResult.attempts[0].status, 'degraded');
  assert.equal(openaiResult.attempts[0].status, 'skipped');
  assert.ok(Array.isArray(tavilyResult.warnings));
  assert.ok(Array.isArray(firecrawlResult.warnings));
});
