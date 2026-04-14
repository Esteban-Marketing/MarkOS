'use strict';

function normalizeText(value) {
  return String(value || '').trim();
}

function buildSectionDiff(input = {}) {
  return {
    mode: normalizeText(input.mode || 'section_replace'),
    before_excerpt: normalizeText(input.before || input.before_excerpt || ''),
    after_excerpt: normalizeText(input.after || input.after_excerpt || ''),
    change_rationale: normalizeText(input.rationale || input.change_rationale || 'Evidence-backed section update suggested.'),
    supporting_evidence: Array.isArray(input.supportingEvidence)
      ? input.supportingEvidence.slice()
      : Array.isArray(input.supporting_evidence)
        ? input.supporting_evidence.slice()
        : [],
  };
}

module.exports = {
  buildSectionDiff,
};
