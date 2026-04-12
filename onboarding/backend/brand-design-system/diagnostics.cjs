'use strict';

const crypto = require('crypto');

const REASON_CODES = Object.freeze({
  TOKEN_INPUT_INVALID: 'TOKEN_INPUT_INVALID',
  TOKEN_CATEGORY_MISSING: 'TOKEN_CATEGORY_MISSING',
  TOKEN_BINDING_INVALID: 'TOKEN_BINDING_INVALID',
  COMPONENT_INPUT_INVALID: 'COMPONENT_INPUT_INVALID',
  COMPONENT_PRIMITIVE_MISSING: 'COMPONENT_PRIMITIVE_MISSING',
  COMPONENT_STATE_COVERAGE_MISSING: 'COMPONENT_STATE_COVERAGE_MISSING',
  LINEAGE_POINTER_MISSING: 'LINEAGE_POINTER_MISSING',
});

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function stableSort(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSort(entry));
  }

  if (!isObject(value)) {
    return value;
  }

  const sorted = {};
  Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sorted[key] = stableSort(value[key]);
    });

  return sorted;
}

function stableStringify(value) {
  return JSON.stringify(stableSort(value));
}

function buildFingerprint(value) {
  return crypto.createHash('sha256').update(stableStringify(value), 'utf8').digest('hex');
}

function createDiagnostic(code, path, message, recommendedFix) {
  return {
    code,
    severity: 'error',
    path,
    message,
    blocking: true,
    recommended_fix: recommendedFix,
  };
}

function normalizeDiagnostics(diagnostics) {
  return diagnostics
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      code: item.code,
      severity: item.severity || 'error',
      path: item.path || 'unknown',
      message: item.message || 'Unknown diagnostic',
      blocking: item.blocking !== false,
      recommended_fix: item.recommended_fix || 'Inspect compiler inputs and ensure required sections are present.',
    }))
    .sort((a, b) => {
      const codeCmp = String(a.code).localeCompare(String(b.code));
      if (codeCmp !== 0) {
        return codeCmp;
      }
      const pathCmp = String(a.path).localeCompare(String(b.path));
      if (pathCmp !== 0) {
        return pathCmp;
      }
      return String(a.message).localeCompare(String(b.message));
    });
}

module.exports = {
  REASON_CODES,
  isObject,
  stableSort,
  stableStringify,
  buildFingerprint,
  createDiagnostic,
  normalizeDiagnostics,
};
