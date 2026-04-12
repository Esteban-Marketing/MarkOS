'use strict';

const { DENY_CODES, normalizeDiagnostic } = require('./governance-diagnostics.cjs');
const { runClosureGates } = require('./closure-gates.cjs');
const { getBundle, getCanonicalBundle } = require('./bundle-registry.cjs');

/**
 * In-memory active pointer: tenant_id → bundle_id.
 * Pointer-only switch — never stores bundle content here.
 */
const _activePointers = new Map();

/**
 * Append-only traceability log per D-10.
 * Each entry: { action, tenant_id, bundle_id, actor_id, reason, timestamp }
 */
const _traceabilityLog = [];

/**
 * Publish a candidate bundle as the active pointer for a tenant.
 *
 * Calls runClosureGates on the canonical bundle (no governance metadata) per D-02 and D-05.
 * Denies with BRAND_GOV_CLOSURE_GATE_FAIL if any gate fails per D-10.
 * On pass: switches active pointer and appends traceability entry per D-10.
 * No standalone route — additive integration only per D-07.
 *
 * @param {string} tenant_id
 * @param {string} candidate_bundle_id
 * @param {{ actor_id: string, reason: string }} options
 * @returns {{ published: true, bundle_id: string, traceability_entry: object }
 *          | { denied: true, reason_code: string, diagnostics: object }}
 */
function publishBundle(tenant_id, candidate_bundle_id, { actor_id, reason }) {
  const canonicalBundle = getCanonicalBundle(tenant_id, candidate_bundle_id);
  if (!canonicalBundle) {
    const diag = normalizeDiagnostic(
      DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED,
      `Bundle ${candidate_bundle_id} not found for tenant ${tenant_id}`
    );
    return { denied: true, reason_code: DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED, diagnostics: diag };
  }

  const gateResult = runClosureGates(tenant_id, canonicalBundle);
  if (!gateResult.passed) {
    const diag = normalizeDiagnostic(
      DENY_CODES.BRAND_GOV_CLOSURE_GATE_FAIL,
      'One or more closure gates failed for candidate bundle'
    );
    return {
      denied: true,
      reason_code: DENY_CODES.BRAND_GOV_CLOSURE_GATE_FAIL,
      diagnostics: diag,
      gates: gateResult.gates,
    };
  }

  _activePointers.set(tenant_id, candidate_bundle_id);
  const traceability_entry = {
    action: 'publish',
    tenant_id,
    bundle_id: candidate_bundle_id,
    actor_id,
    reason,
    timestamp: new Date().toISOString(),
  };
  _traceabilityLog.push(traceability_entry);

  return { published: true, bundle_id: candidate_bundle_id, traceability_entry };
}

/**
 * Rollback the active pointer to a previously verified bundle.
 *
 * Requires the target bundle to carry a verification_evidence_hash annotation per D-03.
 * Denies with BRAND_GOV_BUNDLE_NOT_VERIFIED if the annotation is absent.
 * On pass: switches active pointer and appends traceability entry with action: 'rollback' per D-10.
 * No standalone route — additive integration only per D-07.
 *
 * @param {string} tenant_id
 * @param {string} target_bundle_id
 * @param {{ actor_id: string, reason: string }} options
 * @returns {{ rolled_back: true, bundle_id: string, traceability_entry: object }
 *          | { denied: true, reason_code: string, diagnostics: object }}
 */
function rollbackBundle(tenant_id, target_bundle_id, { actor_id, reason }) {
  const bundle = getBundle(tenant_id, target_bundle_id);
  if (!bundle) {
    const diag = normalizeDiagnostic(
      DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED,
      `Bundle ${target_bundle_id} not found for tenant ${tenant_id}`
    );
    return { denied: true, reason_code: DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED, diagnostics: diag };
  }

  if (!bundle.verification_evidence_hash) {
    const diag = normalizeDiagnostic(
      DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED,
      `Bundle ${target_bundle_id} lacks verification_evidence_hash required for rollback per D-03`
    );
    return { denied: true, reason_code: DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED, diagnostics: diag };
  }

  _activePointers.set(tenant_id, target_bundle_id);
  const traceability_entry = {
    action: 'rollback',
    tenant_id,
    bundle_id: target_bundle_id,
    actor_id,
    reason,
    timestamp: new Date().toISOString(),
  };
  _traceabilityLog.push(traceability_entry);

  return { rolled_back: true, bundle_id: target_bundle_id, traceability_entry };
}

/**
 * Get the current active bundle for a tenant (full merged view from bundle registry).
 *
 * @param {string} tenant_id
 * @returns {object|null}
 */
function getActiveBundle(tenant_id) {
  const activeBundleId = _activePointers.get(tenant_id);
  if (!activeBundleId) return null;
  return getBundle(tenant_id, activeBundleId);
}

/**
 * Get a copy of the full traceability log (all publish and rollback entries).
 *
 * @returns {object[]}
 */
function getTraceabilityLog() {
  return _traceabilityLog.slice();
}

/**
 * Test-only reset. Clears in-memory active pointers and traceability log.
 */
function _resetActivePointerForTest() {
  _activePointers.clear();
  _traceabilityLog.length = 0;
}

module.exports = {
  publishBundle,
  rollbackBundle,
  getActiveBundle,
  getTraceabilityLog,
  _resetActivePointerForTest,
};
