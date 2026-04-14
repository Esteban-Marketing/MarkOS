'use strict';

const knowledgeService = require('../company-knowledge-service.cjs');
const { normalizeEvidenceItem, normalizeProviderAttempt } = require('../research-orchestration-contract.cjs');

function createInternalEvidenceAdapter(options = {}) {
  const searchService = options.searchService || knowledgeService;

  return {
    async collect(request = {}) {
      try {
        const search = await searchService.searchApprovedKnowledge({
          query: request.query,
          scopes: request.scopes || ['literacy', 'mir', 'msp', 'evidence'],
          filters: request.filters || {},
          claims: request.claims || {},
          topK: request.topK || 5,
          fixtures: request.fixtures || null,
        });

        const evidence = (search.results || []).map((entry) => normalizeEvidenceItem({
          provider: 'internal',
          authority_class: 'approved_internal',
          source_ref: entry.source_ref,
          citation: entry.citation,
          freshness: entry.freshness || entry.updated_at,
          confidence: entry.confidence || entry.score,
          implication: entry.implication,
          claim: entry.title || entry.snippet,
          lineage: {
            source_type: 'internal',
            artifact_uri: entry.artifact_uri,
          },
          topic: entry.artifact_kind,
        }));

        return {
          evidence,
          attempts: [normalizeProviderAttempt({ provider: 'internal', stage: 'internal_approved', status: 'used' })],
          warnings: Array.isArray(search.warnings) ? search.warnings : [],
        };
      } catch (error) {
        return {
          evidence: [],
          attempts: [normalizeProviderAttempt({ provider: 'internal', stage: 'internal_approved', status: 'degraded', reason: error.code || error.message })],
          warnings: [error.message],
        };
      }
    },
  };
}

module.exports = {
  createInternalEvidenceAdapter,
};
