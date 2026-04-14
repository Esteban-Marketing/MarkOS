'use strict';

const ROUTE_ORDER = Object.freeze([
  'internal_approved',
  'markos_mcp',
  'tavily',
  'firecrawl',
  'openai_research',
]);

function normalizeToken(value) {
  return String(value || '').trim();
}

function classifyResearchComplexity(request = {}) {
  const query = normalizeToken(request.query).toLowerCase();
  const researchType = normalizeToken(request.research_type).toLowerCase();
  const businessValue = normalizeToken(request.business_value).toLowerCase();

  let score = 0;
  if (query.split(/\s+/).filter(Boolean).length >= 12) score += 2;
  if (/compare|analysis|competitor|reposition|strategy|contradiction|enterprise/.test(query)) score += 2;
  if (researchType === 'competitive_analysis' || researchType === 'positioning') score += 2;
  if (request.requires_freshness === true) score += 1;
  if (businessValue === 'high' || businessValue === 'critical') score += 2;

  const tier = score >= 5 ? 'deep' : score >= 3 ? 'medium' : 'light';

  return {
    score,
    tier,
    should_use_deep_research: tier === 'deep',
  };
}

function assessEvidenceSufficiency(input = {}) {
  const internalEvidenceCount = Math.max(0, Number(input.internalEvidenceCount) || 0);
  const contradictions = Array.isArray(input.contradictions) ? input.contradictions : [];
  const requiresFreshness = input.requiresFreshness === true;

  const sufficient = internalEvidenceCount >= 2 && contradictions.length === 0 && !requiresFreshness;
  return {
    sufficient,
    reasons: sufficient
      ? ['internal_evidence_sufficient']
      : ['freshness_or_coverage_gap'],
  };
}

function createStage(stage, status, reason = null) {
  const entry = { stage, status };
  if (reason) {
    entry.reason = reason;
  }
  return entry;
}

function buildAdaptiveResearchRoute(request = {}, signals = {}) {
  const complexity = classifyResearchComplexity(request);
  const sufficiency = typeof signals.evidenceSufficient === 'boolean'
    ? {
        sufficient: signals.evidenceSufficient,
        reasons: [signals.evidenceSufficient ? 'internal_evidence_sufficient' : 'freshness_or_coverage_gap'],
      }
    : assessEvidenceSufficiency({
        internalEvidenceCount: signals.internalEvidenceCount || 0,
        contradictions: signals.contradictions || [],
        requiresFreshness: request.requires_freshness === true,
      });

  const shouldUseFirecrawl = !sufficiency.sufficient && ((Array.isArray(request.target_urls) && request.target_urls.length > 0) || request.requires_structured_extraction === true);
  const shouldUseDeepResearch = !sufficiency.sufficient && complexity.should_use_deep_research;

  const stage_plan = [
    createStage('internal_approved', 'used'),
    createStage('markos_mcp', sufficiency.sufficient ? 'skipped' : 'used', sufficiency.sufficient ? 'internal_evidence_sufficient' : null),
    createStage('tavily', sufficiency.sufficient ? 'skipped' : 'used', sufficiency.sufficient ? 'internal_evidence_sufficient' : null),
    createStage('firecrawl', shouldUseFirecrawl ? 'used' : 'skipped', shouldUseFirecrawl ? null : 'targeted_extraction_not_required'),
    createStage('openai_research', shouldUseDeepResearch ? 'used' : 'skipped', shouldUseDeepResearch ? null : 'deep_research_not_earned'),
  ];

  const selected_path = shouldUseDeepResearch
    ? 'deep_research'
    : sufficiency.sufficient
      ? 'internal_only'
      : 'external_light';

  return {
    route_order: ROUTE_ORDER.slice(),
    complexity,
    sufficiency,
    stage_plan,
    should_use_deep_research: shouldUseDeepResearch,
    selected_path,
  };
}

module.exports = {
  ROUTE_ORDER,
  classifyResearchComplexity,
  assessEvidenceSufficiency,
  buildAdaptiveResearchRoute,
};
