'use strict';

const crypto = require('crypto');

/**
 * Recursively stable-sort an object's keys (alphabetical).
 * Mirrors the pattern in closure-gates.cjs and bundle-registry.cjs for deterministic hashing.
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
 * Write governance evidence envelope: a machine-readable, deterministic artifact
 * containing gate results, drift evidence, and machine-readable audit trail per D-08 and D-10.
 *
 * Returns an immutable envelope with: tenant_id, bundle_id, gate_results, drift_summary,
 * evidence_hash (sha256 of stableSort), written_at (ISO timestamp).
 *
 * The evidence_hash is deterministic and can be used as verification_evidence_hash
 * in the bundle registry to prove verification per D-03.
 *
 * @param {string} tenant_id - Tenant identifier
 * @param {string} bundle_id - Bundle identifier
 * @param {object} gateResults - Result from runClosureGates({ passed, gates: {...} })
 * @param {object} driftSummary - Result from auditDrift({ tenant_id, has_drift, expected_fingerprint, ... })
 * @returns {{
 *   tenant_id: string,
 *   bundle_id: string,
 *   gate_results: object,
 *   drift_summary: object,
 *   evidence_hash: string,
 *   written_at: string
 * }}
 */
function writeGovernanceEvidence(tenant_id, bundle_id, gateResults, driftSummary) {
  // Build deterministic payload for evidence hash per D-08
  const evidencePayload = {
    tenant_id,
    bundle_id,
    gate_results: gateResults,
    drift_summary: driftSummary,
  };

  // Compute evidence hash using stableSort for determinism
  const sortedPayload = stableSortObject(evidencePayload);
  const evidence_hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(sortedPayload))
    .digest('hex');

  const envelope = Object.freeze({
    tenant_id,
    bundle_id,
    gate_results: Object.freeze(gateResults),
    drift_summary: Object.freeze(driftSummary),
    evidence_hash,
    written_at: new Date().toISOString(),
  });

  return envelope;
}

module.exports = {
  writeGovernanceEvidence,
};
