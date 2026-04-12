'use strict';

/**
 * Canonical governance reason codes and diagnostic normalization helpers.
 *
 * Used by all Phase 78 governance modules (closure-gates, publish/rollback).
 * No standalone public route — additive integration only per D-07.
 */

const DENY_CODES = Object.freeze({
  BRAND_GOV_MISSING_LANE: 'BRAND_GOV_MISSING_LANE',
  BRAND_GOV_TENANT_MISMATCH: 'BRAND_GOV_TENANT_MISMATCH',
  BRAND_GOV_BUNDLE_NOT_VERIFIED: 'BRAND_GOV_BUNDLE_NOT_VERIFIED',
  BRAND_GOV_CLOSURE_GATE_FAIL: 'BRAND_GOV_CLOSURE_GATE_FAIL',
});

/**
 * Normalize a governance denial into a machine-readable diagnostic payload per D-08 and D-10.
 *
 * @param {string} code  - One of DENY_CODES
 * @param {string} detail - Human-readable explanation of the denial reason
 * @returns {{ code: string, detail: string, machine_readable: true }}
 */
function normalizeDiagnostic(code, detail) {
  return { code, detail, machine_readable: true };
}

/**
 * Required top-level fields for a governance lineage bundle envelope (D-01, D-06, D-09).
 */
const REQUIRED_BUNDLE_FIELDS = Object.freeze([
  'tenant_id',
  'bundle_id',
  'strategy_artifact_id',
  'identity_artifact_id',
  'design_system_artifact_id',
  'starter_artifact_id',
  'publish_readiness',
  'lineage_fingerprints',
]);

/**
 * Required lineage lane keys inside lineage_fingerprints.
 */
const REQUIRED_LINEAGE_LANES = Object.freeze(['strategy', 'identity', 'design_system', 'starter']);

/**
 * Validate a governance lineage bundle envelope for schema completeness.
 *
 * Returns fail-closed denial diagnostics per D-06 when any required field or lane is absent.
 *
 * @param {object} bundle - Candidate governance bundle envelope
 * @returns {{ valid: boolean, denials: Array<{ code: string, detail: string, machine_readable: true }> }}
 */
function validateGovernanceBundle(bundle) {
  const denials = [];

  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
    denials.push(normalizeDiagnostic(DENY_CODES.BRAND_GOV_MISSING_LANE, 'Bundle must be a non-null object'));
    return { valid: false, denials };
  }

  for (const field of REQUIRED_BUNDLE_FIELDS) {
    if (bundle[field] === undefined || bundle[field] === null) {
      denials.push(normalizeDiagnostic(DENY_CODES.BRAND_GOV_MISSING_LANE, `Missing required field: ${field}`));
    }
  }

  const fp = bundle.lineage_fingerprints;
  if (fp !== undefined && fp !== null) {
    if (typeof fp !== 'object' || Array.isArray(fp)) {
      denials.push(normalizeDiagnostic(DENY_CODES.BRAND_GOV_MISSING_LANE, 'lineage_fingerprints must be an object'));
    } else {
      for (const lane of REQUIRED_LINEAGE_LANES) {
        if (fp[lane] == null) {
          denials.push(normalizeDiagnostic(DENY_CODES.BRAND_GOV_MISSING_LANE, `Missing lineage fingerprint lane: ${lane}`));
        }
      }
    }
  }

  return { valid: denials.length === 0, denials };
}

module.exports = {
  DENY_CODES,
  normalizeDiagnostic,
  validateGovernanceBundle,
  REQUIRED_BUNDLE_FIELDS,
  REQUIRED_LINEAGE_LANES,
};
