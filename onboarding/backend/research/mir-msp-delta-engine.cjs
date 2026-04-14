'use strict';

const { createPatchPreviewEnvelope } = require('./patch-preview-contract.cjs');
const { classifyPreviewSafety, assertPreviewOnlyOperation } = require('./preview-safety-gate.cjs');
const { resolvePreviewTarget } = require('./section-target-resolver.cjs');
const { buildSectionDiff } = require('./diff-builder.cjs');

function averageConfidence(evidence = []) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return 0.35;
  }
  const total = evidence.reduce((sum, entry) => sum + Number(entry.confidence || 0.6), 0);
  return total / evidence.length;
}

function normalizeEvidence(evidence = []) {
  return evidence.map((entry, index) => ({
    id: entry.id || `ev-${index + 1}`,
    citation: entry.citation || entry.source_ref || 'unknown_source',
    excerpt: entry.excerpt || entry.claim || entry.implication || '',
    implication: entry.implication || null,
    confidence: Number(entry.confidence || 0.6),
  }));
}

function generatePatchPreview(input = {}) {
  assertPreviewOnlyOperation(input);

  const contextPack = input.context_pack && typeof input.context_pack === 'object' ? input.context_pack : {};
  const evidence = normalizeEvidence(Array.isArray(contextPack.evidence) ? contextPack.evidence : []);
  const contradictions = Array.isArray(contextPack.contradictions) ? contextPack.contradictions : [];
  const confidence = Number(input.confidence || averageConfidence(evidence));
  const safety = classifyPreviewSafety({
    confidence,
    evidenceCount: evidence.length,
    contradictions,
  });

  const target = resolvePreviewTarget({
    artifact_family: input.artifact_family,
    section_key: input.section_key,
    filters: input.filters || contextPack.active_filters || {},
    evidence,
  });

  const proposedContent = input.proposed_content || (evidence[0] && evidence[0].implication ? `Suggested update: ${evidence[0].implication}` : 'Suggested review update.');
  const diff = buildSectionDiff({
    mode: 'section_replace',
    before: input.current_content || '',
    after: proposedContent,
    rationale: input.change_rationale || (evidence[0] && evidence[0].implication) || 'Evidence-backed refresh suggested.',
    supportingEvidence: evidence.map((entry) => entry.id),
  });

  return createPatchPreviewEnvelope({
    artifact_family: input.artifact_family || 'MIR',
    artifact_type: input.artifact_type || 'strategy_note',
    section_key: target.section_key,
    target,
    status: safety.status,
    suggestion_only: safety.suggestion_only,
    confidence,
    evidence_strength: evidence.length >= 2 ? 'strong' : 'weak',
    summary: safety.suggestion_only
      ? 'Evidence is not strong enough for a confident patch; review the suggestion-only guidance.'
      : 'A narrow section-level preview patch is ready for operator review.',
    diff,
    evidence,
    contradictions,
    warnings: safety.warnings,
    route_trace: Array.isArray(contextPack.route_trace) ? contextPack.route_trace : [],
    provider_attempts: Array.isArray(contextPack.provider_attempts) ? contextPack.provider_attempts : [],
  });
}

module.exports = {
  generatePatchPreview,
};
