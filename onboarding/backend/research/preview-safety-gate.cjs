'use strict';

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertPreviewOnlyOperation(input = {}) {
  if (input.allow_write === true || input.write_disabled === false) {
    throw createError('E_PREVIEW_WRITE_BLOCKED', 'Phase 94 preview generation is strictly read-only.');
  }
  return true;
}

function classifyPreviewSafety(input = {}) {
  const confidence = Number(input.confidence || 0);
  const evidenceCount = Math.max(0, Number(input.evidenceCount) || 0);
  const contradictions = Array.isArray(input.contradictions) ? input.contradictions : [];

  if (contradictions.length > 0 || confidence < 0.45 || evidenceCount < 2) {
    return {
      status: 'suggestion_only',
      suggestion_only: true,
      warnings: ['Evidence is weak, incomplete, or contradictory; downgrade to suggestion-only mode.'],
    };
  }

  if (confidence < 0.75) {
    return {
      status: 'review_required',
      suggestion_only: false,
      warnings: ['Patch preview requires careful operator review before any approval decision.'],
    };
  }

  return {
    status: 'preview_ready',
    suggestion_only: false,
    warnings: [],
  };
}

module.exports = {
  assertPreviewOnlyOperation,
  classifyPreviewSafety,
};
