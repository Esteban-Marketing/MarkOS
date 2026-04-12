'use strict';

const crypto = require('crypto');

const REASON_CODES = Object.freeze({
  STARTER_INPUT_INVALID: 'STARTER_INPUT_INVALID',
  STARTER_SECTION_MISSING: 'STARTER_SECTION_MISSING',
  STARTER_LINEAGE_INVALID: 'STARTER_LINEAGE_INVALID',
  STARTER_SCHEMA_INVALID: 'STARTER_SCHEMA_INVALID',
  ROLE_PROJECTOR_INPUT_INVALID: 'ROLE_PROJECTOR_INPUT_INVALID',
  ROLE_REQUIRED_FIELD_MISSING: 'ROLE_REQUIRED_FIELD_MISSING',
  ROLE_SCHEMA_INVALID: 'ROLE_SCHEMA_INVALID',
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
      recommended_fix: item.recommended_fix || 'Provide required deterministic handoff compiler input fields.',
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

function normalizeString(value, fallback) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

module.exports = {
  REASON_CODES,
  isObject,
  stableSort,
  stableStringify,
  buildFingerprint,
  createDiagnostic,
  normalizeDiagnostics,
  normalizeString,
};
