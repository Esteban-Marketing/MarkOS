'use strict';

const DEFAULT_ROUTE = Object.freeze([
  'markos_vault',
  'markos_mcp',
  'tavily',
  'firecrawl',
  'openai_synthesis',
]);

const AUTHORITY_ORDER = Object.freeze({
  approved_internal: 0,
  external_candidate: 1,
  synthesized: 2,
});

function normalizeToken(value) {
  return String(value || '').trim();
}

function buildResearchRoute(request = {}, options = {}) {
  const providerPolicy = request.provider_policy || {};
  const route = Array.isArray(providerPolicy.route) && providerPolicy.route.length > 0
    ? providerPolicy.route.slice()
    : DEFAULT_ROUTE.slice();
  const availability = options.externalAvailability || {};
  const warnings = [];

  const route_trace = route.map((provider) => {
    if (provider === 'markos_vault' || provider === 'markos_mcp') {
      return { stage: 'internal', provider, status: 'used' };
    }

    if (providerPolicy.allow_external === false) {
      warnings.push(`External provider ${provider} skipped because allow_external is false.`);
      return { stage: provider === 'openai_synthesis' ? 'synthesis' : 'external', provider, status: 'skipped' };
    }

    if (availability[provider] === false) {
      warnings.push(`Provider ${provider} unavailable; degraded to internal-first response.`);
      return { stage: provider === 'openai_synthesis' ? 'synthesis' : 'external', provider, status: 'degraded' };
    }

    return { stage: provider === 'openai_synthesis' ? 'synthesis' : 'external', provider, status: 'used' };
  });

  return {
    route_trace,
    warnings,
    internal_authority: providerPolicy.internal_authority !== false,
    allowed_domains: Array.isArray(providerPolicy.allowed_domains) ? providerPolicy.allowed_domains.slice() : [],
    ranking_hints: {
      authority_weight: 'internal_first',
      freshness_weight: 'supporting',
    },
  };
}

function rankEvidenceByAuthority(items = []) {
  return [...items].sort((left, right) => {
    const leftRank = AUTHORITY_ORDER[normalizeToken(left.authority)] ?? 99;
    const rightRank = AUTHORITY_ORDER[normalizeToken(right.authority)] ?? 99;
    return leftRank - rightRank;
  });
}

module.exports = {
  DEFAULT_ROUTE,
  buildResearchRoute,
  rankEvidenceByAuthority,
};
