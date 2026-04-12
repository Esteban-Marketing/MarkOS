'use strict';

const crypto = require('crypto');
const { DENY_CODES, normalizeDiagnostic } = require('./governance-diagnostics.cjs');

/**
 * Required lineage payload fields for createBundle.
 * Fail-closed: createBundle returns a denial if any is absent or null per D-06.
 */
const REQUIRED_LINEAGE_FIELDS = Object.freeze([
  'strategy_artifact_id',
  'identity_artifact_id',
  'design_system_artifact_id',
  'starter_artifact_id',
  'lineage_fingerprints',
]);

/**
 * Immutable in-memory store keyed by `${tenant_id}:${bundle_id}`.
 * Each entry: { canonical: Object (frozen), meta: Object (governance annotation only) }
 */
const _store = new Map();

/**
 * Recursively stable-sort an object's keys (alphabetical).
 * Mirrors the pattern in closure-gates.cjs for deterministic hashing.
 */
function stableSortObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = stableSortObject(value[key]);
      return acc;
    }, {});
}

/**
 * Compute bundle_id as sha256(JSON.stringify(stableSort({ tenant_id, ...lineagePayload }))).
 * Compatible with computeBundleId in closure-gates.cjs: that function strips bundle_id from
 * the full canonical bundle and hashes the rest, which equals this computation.
 */
function _computeBundleId(tenant_id, lineagePayload) {
  const basePayload = stableSortObject(Object.assign({ tenant_id }, lineagePayload));
  return crypto.createHash('sha256').update(JSON.stringify(basePayload)).digest('hex');
}

/**
 * Create an immutable tenant-scoped lineage bundle record.
 *
 * Fail-closed: returns a denial object if any required lineage field is absent or null (D-06).
 * Idempotent: same payload for the same tenant returns the existing bundle.
 * No mutate or delete operation is exposed — append-only governance via setVerificationEvidence.
 *
 * @param {string} tenant_id
 * @param {object} lineagePayload - Must include: strategy_artifact_id, identity_artifact_id,
 *   design_system_artifact_id, starter_artifact_id, lineage_fingerprints
 * @returns {object} Stored bundle record or denial { denied, reason_code, diagnostics }
 */
function createBundle(tenant_id, lineagePayload) {
  if (!lineagePayload || typeof lineagePayload !== 'object' || Array.isArray(lineagePayload)) {
    const diag = normalizeDiagnostic(DENY_CODES.BRAND_GOV_MISSING_LANE, 'lineagePayload must be a non-null object');
    return { denied: true, reason_code: DENY_CODES.BRAND_GOV_MISSING_LANE, diagnostics: diag };
  }

  for (const field of REQUIRED_LINEAGE_FIELDS) {
    if (lineagePayload[field] == null) {
      const diag = normalizeDiagnostic(
        DENY_CODES.BRAND_GOV_MISSING_LANE,
        `Missing required lineage field: ${field}`
      );
      return { denied: true, reason_code: DENY_CODES.BRAND_GOV_MISSING_LANE, diagnostics: diag };
    }
  }

  const bundle_id = _computeBundleId(tenant_id, lineagePayload);
  const key = `${tenant_id}:${bundle_id}`;

  if (!_store.has(key)) {
    const canonical = Object.freeze(Object.assign({ tenant_id, bundle_id }, lineagePayload));
    _store.set(key, { canonical, meta: {} });
  }

  return getBundle(tenant_id, bundle_id);
}

/**
 * Retrieve the merged bundle view (canonical lineage + governance annotation metadata).
 *
 * @param {string} tenant_id
 * @param {string} bundle_id
 * @returns {object|null}
 */
function getBundle(tenant_id, bundle_id) {
  const entry = _store.get(`${tenant_id}:${bundle_id}`);
  if (!entry) return null;
  return Object.assign({}, entry.canonical, entry.meta);
}

/**
 * Retrieve the canonical bundle only (no governance annotation metadata).
 * Used internally by active-pointer for gate checks to preserve determinism gate integrity:
 * governance annotation fields (verification_evidence_hash etc.) must not be included when
 * computing bundle_id for the determinism gate.
 *
 * @param {string} tenant_id
 * @param {string} bundle_id
 * @returns {object|null}
 */
function getCanonicalBundle(tenant_id, bundle_id) {
  const entry = _store.get(`${tenant_id}:${bundle_id}`);
  return entry ? Object.assign({}, entry.canonical) : null;
}

/**
 * List all bundles for a tenant (merged view: canonical + governance annotation).
 *
 * @param {string} tenant_id
 * @returns {object[]}
 */
function listBundles(tenant_id) {
  const prefix = `${tenant_id}:`;
  const result = [];
  for (const [key, entry] of _store) {
    if (key.startsWith(prefix)) {
      result.push(Object.assign({}, entry.canonical, entry.meta));
    }
  }
  return result;
}

/**
 * Append-only governance annotation: sets verification_evidence_hash and verification_updated_at.
 * Never mutates lineage payload fields, bundle_id, or fingerprint content per D-09.
 *
 * @param {string} tenant_id
 * @param {string} bundle_id
 * @param {string} evidence_hash
 * @returns {object} Updated merged bundle view or denial
 */
function setVerificationEvidence(tenant_id, bundle_id, evidence_hash) {
  const key = `${tenant_id}:${bundle_id}`;
  const entry = _store.get(key);
  if (!entry) {
    const diag = normalizeDiagnostic(
      DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED,
      `Bundle ${bundle_id} not found for tenant ${tenant_id}`
    );
    return { denied: true, reason_code: DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED, diagnostics: diag };
  }
  // Append-only: governance annotation fields only — never overwrites canonical lineage per D-09
  entry.meta.verification_evidence_hash = evidence_hash;
  entry.meta.verification_updated_at = new Date().toISOString();
  return getBundle(tenant_id, bundle_id);
}

/**
 * Test-only reset. Clears the in-memory store for test isolation.
 */
function _resetBundleRegistryForTest() {
  _store.clear();
}

module.exports = {
  createBundle,
  getBundle,
  getCanonicalBundle,
  listBundles,
  setVerificationEvidence,
  _resetBundleRegistryForTest,
};
