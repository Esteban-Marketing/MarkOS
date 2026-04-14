'use strict';

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeEvidenceList(value) {
  const list = Array.isArray(value) ? value : [];
  return Array.from(new Set(list.map((entry) => normalizeToken(entry)).filter(Boolean)));
}

function createPatchApprovalBlock() {
  return {
    write_mode: 'preview_only',
    human_approval_required: true,
    allow_write: false,
  };
}

function createPatchPreview(input = {}) {
  return {
    artifact: normalizeToken(input.artifact).toUpperCase(),
    section: normalizeToken(input.section).toUpperCase(),
    change_type: normalizeToken(input.change_type).toLowerCase() || 'refresh',
    rationale: normalizeToken(input.rationale),
    supporting_evidence: normalizeEvidenceList(input.supporting_evidence),
    allow_write: false,
    human_approval_required: true,
  };
}

module.exports = {
  createPatchApprovalBlock,
  createPatchPreview,
};
