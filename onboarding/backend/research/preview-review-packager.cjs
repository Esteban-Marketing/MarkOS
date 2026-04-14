'use strict';

function packagePatchReview(preview = {}) {
  return {
    headline: `${preview.artifact_family || 'MIR'} ${preview.section_key || 'section'} preview`,
    summary: preview.summary || '',
    before_after: {
      before: preview.diff?.before_excerpt || '',
      after: preview.diff?.after_excerpt || '',
      rationale: preview.diff?.change_rationale || '',
    },
    inline_evidence: Array.isArray(preview.evidence) ? preview.evidence : [],
    contradictions: Array.isArray(preview.contradictions) ? preview.contradictions : [],
    warnings: Array.isArray(preview.warnings) ? preview.warnings : [],
    audit: {
      preview_id: preview.preview_id || null,
      route_trace: Array.isArray(preview.route_trace) ? preview.route_trace : [],
      provider_attempts: Array.isArray(preview.provider_attempts) ? preview.provider_attempts : [],
    },
  };
}

module.exports = {
  packagePatchReview,
};
