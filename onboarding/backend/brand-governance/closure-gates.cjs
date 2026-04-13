'use strict';

const crypto = require('crypto');
const { DENY_CODES, normalizeDiagnostic } = require('./governance-diagnostics.cjs');

/**
 * Stable-sort an object's keys recursively (alphabetical).
 * Arrays and primitives are returned as-is.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function stableSortObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = stableSortObject(value[key]);
      return acc;
    }, {});
}

/**
 * Compute the expected bundle_id as sha256(JSON.stringify(stableSort(bundlePayloadWithoutBundleId))).
 *
 * @param {object} bundle
 * @returns {string} hex digest
 */
function computeBundleId(bundle) {
  const payload = Object.assign({}, bundle);
  delete payload.bundle_id;
  const sorted = stableSortObject(payload);
  return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}

/**
 * Run all three mandatory closure gates for publish/rollback eligibility.
 *
 * All gates run regardless of prior failures (never short-circuit) so evidence is complete.
 * Fail-closed: returned passed is false when any single gate fails per D-05.
 *
 * Gate 1 - Determinism: recompute sha256(stableSort(bundle payload minus bundle_id)) and compare.
 * Gate 2 - Tenant isolation: request tenant_id must match bundle.tenant_id.
 * Gate 3 - Contract integrity: every lineage_fingerprints lane must be present and non-null.
 *
 * @param {string} tenant_id   - Requesting tenant identifier
 * @param {object} bundle      - Governance lineage bundle envelope
 * @param {object} _context    - Reserved for future context injection
 * @returns {{
 *   passed: boolean,
 *   gates: {
 *     determinism: { passed: boolean, reason_code: string|null, detail: string|null },
 *     tenant_isolation: { passed: boolean, reason_code: string|null, detail: string|null },
 *     contract_integrity: { passed: boolean, reason_code: string|null, detail: string|null }
 *   }
 * }}
 */
function runClosureGates(tenant_id, bundle, _context) {
  const gates = {
    determinism: { passed: false, reason_code: null, detail: null },
    tenant_isolation: { passed: false, reason_code: null, detail: null },
    contract_integrity: { passed: false, reason_code: null, detail: null },
  };

  // Gate 1: Determinism - bundle_id must match computed digest
  const expectedId = computeBundleId(bundle);
  if (bundle.bundle_id === expectedId) {
    gates.determinism.passed = true;
  } else {
    const diag = normalizeDiagnostic(
      DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED,
      `bundle_id mismatch: expected ${expectedId}, got ${bundle.bundle_id}`
    );
    gates.determinism.reason_code = diag.code;
    gates.determinism.detail = diag.detail;
  }

  // Gate 2: Tenant isolation - requesting tenant must match bundle owner
  if (tenant_id === bundle.tenant_id) {
    gates.tenant_isolation.passed = true;
  } else {
    const diag = normalizeDiagnostic(
      DENY_CODES.BRAND_GOV_TENANT_MISMATCH,
      `tenant_id mismatch: expected ${bundle.tenant_id}, got ${tenant_id}`
    );
    gates.tenant_isolation.reason_code = diag.code;
    gates.tenant_isolation.detail = diag.detail;
  }

  // Gate 3: Contract integrity - all lineage_fingerprints lanes must be present and non-null
  const REQUIRED_LANES = ['strategy', 'identity', 'design_system', 'starter'];
  const fp = bundle.lineage_fingerprints;
  const missingLanes = REQUIRED_LANES.filter((lane) => !fp || fp[lane] == null);
  if (missingLanes.length === 0) {
    gates.contract_integrity.passed = true;
  } else {
    const diag = normalizeDiagnostic(
      DENY_CODES.BRAND_GOV_MISSING_LANE,
      `Missing or null lineage fingerprint lanes: ${missingLanes.join(', ')}`
    );
    gates.contract_integrity.reason_code = diag.code;
    gates.contract_integrity.detail = diag.detail;
  }

  const passed = gates.determinism.passed && gates.tenant_isolation.passed && gates.contract_integrity.passed;

  return { passed, gates };
}

function runV34NonRegressionGate(input = {}) {
  const checks = {
    brandingDeterminism: Boolean(input.brandingDeterminism),
    governancePublishRollback: Boolean(input.governancePublishRollback),
    uatBaseline: Boolean(input.uatBaseline),
  };

  const failed = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    passed: failed.length === 0,
    checks,
    failed,
  };
}

module.exports = { runClosureGates, computeBundleId, runV34NonRegressionGate };
