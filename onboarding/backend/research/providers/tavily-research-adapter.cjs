'use strict';

const { normalizeEvidenceItem, normalizeProviderAttempt } = require('../research-orchestration-contract.cjs');

function createTavilyResearchAdapter(options = {}) {
  const apiKey = options.apiKey || process.env.TAVILY_API_KEY || null;
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  return {
    async collect(request = {}, runtime = {}) {
      const routeStage = request.routeStage || { status: 'used', stage: 'tavily' };
      if (routeStage.status !== 'used') {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'tavily', stage: 'tavily', status: routeStage.status || 'skipped', reason: routeStage.reason || 'policy_skipped' })],
          warnings: [],
        };
      }

      const fixtureResults = Array.isArray(runtime.fixtureResults) ? runtime.fixtureResults : null;
      if (fixtureResults) {
        return {
          evidence: fixtureResults.map((item) => normalizeEvidenceItem({
            provider: 'tavily',
            authority_class: 'external_official',
            source_ref: item.url,
            citation: item.url,
            freshness: item.freshness || new Date().toISOString(),
            confidence: item.confidence || 0.72,
            implication: item.implication || 'Use fresh external evidence for review.',
            claim: item.content || item.title,
            lineage: { source_type: 'external', provider: 'tavily' },
            topic: item.topic || 'market',
          })),
          attempts: [normalizeProviderAttempt({ provider: 'tavily', stage: 'tavily', status: 'used' })],
          warnings: [],
        };
      }

      if (!apiKey || typeof fetchImpl !== 'function') {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'tavily', stage: 'tavily', status: 'degraded', reason: 'missing_api_key' })],
          warnings: ['Tavily is unavailable; degraded to internal-first evidence only.'],
        };
      }

      try {
        const response = await fetchImpl('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            query: request.query || 'markos research',
            search_depth: 'basic',
            include_raw_content: false,
            max_results: 5,
            include_domains: Array.isArray(request.allowed_domains) ? request.allowed_domains : undefined,
          }),
        });

        const body = response.ok ? await response.json() : { results: [] };
        return {
          evidence: (body.results || []).map((item) => normalizeEvidenceItem({
            provider: 'tavily',
            authority_class: 'external_official',
            source_ref: item.url,
            citation: item.url,
            freshness: new Date().toISOString(),
            confidence: item.score || 0.7,
            implication: 'Fresh external discovery available for review.',
            claim: item.content || item.title,
            lineage: { source_type: 'external', provider: 'tavily' },
            topic: 'market',
          })),
          attempts: [normalizeProviderAttempt({ provider: 'tavily', stage: 'tavily', status: 'used' })],
          warnings: [],
        };
      } catch (error) {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'tavily', stage: 'tavily', status: 'degraded', reason: error.message })],
          warnings: ['Tavily request failed; returning safe degraded output.'],
        };
      }
    },
  };
}

module.exports = {
  createTavilyResearchAdapter,
};
