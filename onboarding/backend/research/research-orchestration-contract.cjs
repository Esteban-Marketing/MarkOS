'use strict';

const { createPatchApprovalBlock } = require('./patch-preview-policy.cjs');

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeEvidenceItem(item = {}) {
  return {
    provider: normalizeToken(item.provider || 'internal'),
    authority_class: normalizeToken(item.authority_class || item.authority || 'approved_internal'),
    source_ref: normalizeToken(item.source_ref || item.citation || 'unknown_source'),
    citation: normalizeToken(item.citation || item.source_ref || 'unknown_source'),
    freshness: normalizeToken(item.freshness || item.updated_at || item.captured_at || null) || null,
    confidence: Number(item.confidence || item.score || 0),
    implication: normalizeToken(item.implication || null) || null,
    claim: normalizeToken(item.claim || item.title || item.snippet || null) || null,
    topic: normalizeToken(item.topic || 'general') || 'general',
    lineage: item.lineage && typeof item.lineage === 'object' ? { ...item.lineage } : {},
  };
}

function normalizeProviderAttempt(entry = {}) {
  return {
    provider: normalizeToken(entry.provider || entry.stage || 'unknown'),
    stage: normalizeToken(entry.stage || entry.provider || 'unknown'),
    status: normalizeToken(entry.status || 'skipped') || 'skipped',
    reason: normalizeToken(entry.reason || null) || null,
    latency_ms: entry.latency_ms == null ? null : Number(entry.latency_ms),
  };
}

function createResearchOrchestrationResponse(input = {}) {
  const contextPack = input.context_pack && typeof input.context_pack === 'object' ? input.context_pack : {};
  const evidence = Array.isArray(contextPack.evidence) ? contextPack.evidence.map(normalizeEvidenceItem) : [];
  const providerAttempts = Array.isArray(input.provider_attempts) ? input.provider_attempts.map(normalizeProviderAttempt) : [];

  return {
    short_summary: normalizeToken(input.short_summary || contextPack.summary || 'No research summary available.'),
    context_pack: {
      summary: normalizeToken(contextPack.summary || input.short_summary || 'No research summary available.'),
      claims: Array.isArray(contextPack.claims) ? contextPack.claims : [],
      evidence,
      contradictions: Array.isArray(contextPack.contradictions) ? contextPack.contradictions : [],
      active_filters: contextPack.active_filters && typeof contextPack.active_filters === 'object' ? { ...contextPack.active_filters } : {},
      route_trace: Array.isArray(input.route_trace) ? input.route_trace : [],
      provider_attempts: providerAttempts,
      providers_used: Array.from(new Set(providerAttempts.filter((entry) => entry.status === 'used').map((entry) => entry.provider))),
    },
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    route_trace: Array.isArray(input.route_trace) ? input.route_trace : [],
    provider_attempts: providerAttempts,
    approval: createPatchApprovalBlock(),
    degraded: input.degraded === true,
  };
}

module.exports = {
  normalizeEvidenceItem,
  normalizeProviderAttempt,
  createResearchOrchestrationResponse,
};
