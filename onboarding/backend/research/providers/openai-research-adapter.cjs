'use strict';

const { normalizeEvidenceItem, normalizeProviderAttempt } = require('../research-orchestration-contract.cjs');

function createOpenAIResearchAdapter(options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY || null;
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  return {
    async collect(request = {}, runtime = {}) {
      const routeStage = request.routeStage || { status: 'skipped', stage: 'openai_research', reason: 'deep_research_not_selected' };
      if (routeStage.status !== 'used' || request.deepResearch !== true) {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'openai_research', stage: 'openai_research', status: routeStage.status || 'skipped', reason: routeStage.reason || 'deep_research_not_selected' })],
          warnings: [],
        };
      }

      const fixtureResponse = runtime.fixtureResponse && typeof runtime.fixtureResponse === 'object' ? runtime.fixtureResponse : null;
      if (fixtureResponse) {
        return {
          evidence: [normalizeEvidenceItem({
            provider: 'openai_research',
            authority_class: 'synthesized_inference',
            source_ref: Array.isArray(fixtureResponse.citations) ? fixtureResponse.citations[0] : 'openai:responses',
            citation: Array.isArray(fixtureResponse.citations) ? fixtureResponse.citations[0] : 'openai:responses',
            freshness: new Date().toISOString(),
            confidence: 0.68,
            implication: 'Use synthesized insight only with visible citations.',
            claim: fixtureResponse.summary || 'No summary provided.',
            lineage: { source_type: 'synthesized', provider: 'openai_research' },
            topic: 'synthesis',
          })],
          attempts: [normalizeProviderAttempt({ provider: 'openai_research', stage: 'openai_research', status: 'used' })],
          warnings: [],
        };
      }

      if (!apiKey || typeof fetchImpl !== 'function') {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'openai_research', stage: 'openai_research', status: 'degraded', reason: 'missing_api_key' })],
          warnings: ['OpenAI deep research is unavailable; returning gathered evidence without deep synthesis.'],
        };
      }

      try {
        const response = await fetchImpl('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            input: request.query || 'Summarize the latest relevant evidence.',
          }),
        });

        const body = response.ok ? await response.json() : {};
        const outputText = Array.isArray(body.output)
          ? body.output.map((entry) => entry.content?.map((content) => content.text || '').join(' ')).join(' ').trim()
          : '';

        return {
          evidence: [normalizeEvidenceItem({
            provider: 'openai_research',
            authority_class: 'synthesized_inference',
            source_ref: 'openai:responses',
            citation: 'openai:responses',
            freshness: new Date().toISOString(),
            confidence: 0.65,
            implication: 'Use synthesized insight only with underlying evidence review.',
            claim: outputText || 'No model synthesis returned.',
            lineage: { source_type: 'synthesized', provider: 'openai_research' },
            topic: 'synthesis',
          })],
          attempts: [normalizeProviderAttempt({ provider: 'openai_research', stage: 'openai_research', status: 'used' })],
          warnings: [],
        };
      } catch (error) {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'openai_research', stage: 'openai_research', status: 'degraded', reason: error.message })],
          warnings: ['OpenAI research request failed; returning degraded output.'],
        };
      }
    },
  };
}

module.exports = {
  createOpenAIResearchAdapter,
};
