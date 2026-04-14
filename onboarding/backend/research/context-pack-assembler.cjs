'use strict';

function buildShortSummary({ evidence = [], contradictions = [] }) {
  if (contradictions.length > 0) {
    return `Research pack assembled with ${evidence.length} evidence item(s) and ${contradictions.length} contradiction flag(s) for operator review.`;
  }

  if (evidence.length > 0) {
    return `Research pack assembled with ${evidence.length} ranked evidence item(s) and no contradiction flags.`;
  }

  return 'Research pack assembled with no evidence items; review warnings for degraded provider state.';
}

function assembleContextPack(input = {}) {
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const contradictions = Array.isArray(input.contradictions) ? input.contradictions : [];
  const warnings = Array.isArray(input.warnings) ? input.warnings : [];
  const providerAttempts = Array.isArray(input.providerAttempts) ? input.providerAttempts : [];
  const routeTrace = Array.isArray(input.routeTrace) ? input.routeTrace : [];
  const summary = input.short_summary || buildShortSummary({ evidence, contradictions });

  return {
    short_summary: summary,
    context_pack: {
      summary,
      claims: evidence.slice(0, 5).map((entry) => ({
        topic: entry.topic || 'general',
        claim: entry.claim,
        citation: entry.citation,
        freshness: entry.freshness,
        confidence: entry.confidence,
        implication: entry.implication,
        authority_class: entry.authority_class,
      })),
      evidence,
      contradictions,
      active_filters: input.request && input.request.filters && typeof input.request.filters === 'object' ? { ...input.request.filters } : {},
      route_trace: routeTrace,
      provider_attempts: providerAttempts,
    },
    warnings,
  };
}

module.exports = {
  assembleContextPack,
};
