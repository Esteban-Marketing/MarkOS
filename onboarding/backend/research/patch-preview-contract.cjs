'use strict';

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeEvidenceItem(item = {}, index = 0) {
  return {
    id: normalizeToken(item.id || `ev-${index + 1}`),
    citation: normalizeToken(item.citation || item.source_ref || 'unknown_source'),
    excerpt: normalizeToken(item.excerpt || item.claim || item.implication || ''),
    implication: normalizeToken(item.implication || null) || null,
  };
}

function createPatchPreviewEnvelope(input = {}) {
  const evidence = Array.isArray(input.evidence) ? input.evidence.map(normalizeEvidenceItem) : [];
  const diffInput = input.diff && typeof input.diff === 'object' ? input.diff : {};

  return {
    preview_id: normalizeToken(input.preview_id || `patchprev_${Date.now()}`),
    artifact_family: normalizeToken(input.artifact_family || 'MIR').toUpperCase(),
    artifact_type: normalizeToken(input.artifact_type || 'strategy_note'),
    section_key: normalizeToken(input.section_key || 'company_profile'),
    target: input.target && typeof input.target === 'object' ? { ...input.target } : {},
    status: normalizeToken(input.status || 'review_required'),
    approval_required: true,
    suggestion_only: input.suggestion_only === true,
    write_disabled: true,
    confidence: Number(input.confidence || 0.75),
    evidence_strength: normalizeToken(input.evidence_strength || (evidence.length >= 2 ? 'strong' : 'weak')),
    summary: normalizeToken(input.summary || diffInput.change_rationale || 'Evidence-backed patch preview generated for review.'),
    diff: {
      mode: normalizeToken(diffInput.mode || 'section_replace'),
      before_excerpt: normalizeToken(diffInput.before_excerpt || ''),
      after_excerpt: normalizeToken(diffInput.after_excerpt || ''),
      change_rationale: normalizeToken(diffInput.change_rationale || 'Evidence-backed section refresh suggested.'),
      supporting_evidence: Array.isArray(diffInput.supporting_evidence)
        ? diffInput.supporting_evidence.slice()
        : evidence.map((entry) => entry.id),
    },
    evidence,
    contradictions: Array.isArray(input.contradictions) ? input.contradictions : [],
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    route_trace: Array.isArray(input.route_trace) ? input.route_trace : [],
    provider_attempts: Array.isArray(input.provider_attempts) ? input.provider_attempts : [],
  };
}

module.exports = {
  createPatchPreviewEnvelope,
};
