'use strict';

const { normalizeEvidenceItem, normalizeProviderAttempt } = require('../research-orchestration-contract.cjs');

function createFirecrawlResearchAdapter(options = {}) {
  const apiKey = options.apiKey || process.env.FIRECRAWL_API_KEY || null;
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  return {
    async collect(request = {}, runtime = {}) {
      const routeStage = request.routeStage || { status: 'used', stage: 'firecrawl' };
      if (routeStage.status !== 'used') {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'firecrawl', stage: 'firecrawl', status: routeStage.status || 'skipped', reason: routeStage.reason || 'policy_skipped' })],
          warnings: [],
        };
      }

      const targetUrls = Array.isArray(request.target_urls) ? request.target_urls : [];
      const fixtureResults = Array.isArray(runtime.fixtureResults) ? runtime.fixtureResults : null;

      if (fixtureResults) {
        return {
          evidence: fixtureResults.map((item) => normalizeEvidenceItem({
            provider: 'firecrawl',
            authority_class: 'external_official',
            source_ref: item.url,
            citation: item.url,
            freshness: item.freshness || new Date().toISOString(),
            confidence: item.confidence || 0.74,
            implication: item.implication || 'Structured crawl evidence is available for review.',
            claim: item.markdown || item.summary || item.url,
            lineage: { source_type: 'external', provider: 'firecrawl' },
            topic: item.topic || 'site_content',
          })),
          attempts: [normalizeProviderAttempt({ provider: 'firecrawl', stage: 'firecrawl', status: 'used' })],
          warnings: [],
        };
      }

      if (!apiKey || typeof fetchImpl !== 'function') {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'firecrawl', stage: 'firecrawl', status: 'degraded', reason: 'missing_api_key' })],
          warnings: ['Firecrawl is unavailable; skipping structured extraction.'],
        };
      }

      if (targetUrls.length === 0) {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'firecrawl', stage: 'firecrawl', status: 'skipped', reason: 'no_target_urls' })],
          warnings: [],
        };
      }

      try {
        const response = await fetchImpl('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ url: targetUrls[0], formats: ['markdown'] }),
        });

        const body = response.ok ? await response.json() : { data: {} };
        return {
          evidence: [normalizeEvidenceItem({
            provider: 'firecrawl',
            authority_class: 'external_official',
            source_ref: targetUrls[0],
            citation: targetUrls[0],
            freshness: new Date().toISOString(),
            confidence: 0.7,
            implication: 'Structured page extraction is available for review.',
            claim: body.data && (body.data.markdown || body.data.content || targetUrls[0]),
            lineage: { source_type: 'external', provider: 'firecrawl' },
            topic: 'site_content',
          })],
          attempts: [normalizeProviderAttempt({ provider: 'firecrawl', stage: 'firecrawl', status: 'used' })],
          warnings: [],
        };
      } catch (error) {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'firecrawl', stage: 'firecrawl', status: 'degraded', reason: error.message })],
          warnings: ['Firecrawl request failed; returning degraded output.'],
        };
      }
    },
  };
}

module.exports = {
  createFirecrawlResearchAdapter,
};
