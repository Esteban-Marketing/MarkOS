'use strict';

const crypto = require('crypto');
const { stableSort, buildFingerprint } = require('../brand-nextjs/handoff-diagnostics.cjs');
const { getActiveBundle } = require('./active-pointer.cjs');

/**
 * Compute deterministic drift evidence comparing the active pointer bundle fingerprint
 * against the recomputed expected fingerprint from canonical artifact IDs per D-04 and D-08.
 *
 * Uses the same stableSort + buildFingerprint pattern as existing brand modules (D-04).
 * Returns machine-readable evidence including evidence_hash and evaluated_at in all scenarios.
 * Treats a null active pointer as has_drift: true (no active pointer = drift by definition).
 * No standalone public route — additive integration only per D-07.
 *
 * @param {string} tenant_id
 * @param {{ strategy_artifact_id: string, identity_artifact_id: string,
 *           design_system_artifact_id: string, starter_artifact_id: string }} canonicalArtifacts
 * @returns {{
 *   tenant_id: string,
 *   has_drift: boolean,
 *   expected_fingerprint: string,
 *   active_fingerprint: string|null,
 *   evidence_hash: string,
 *   evaluated_at: string
 * }}
 */
function auditDrift(tenant_id, canonicalArtifacts) {
  const { strategy_artifact_id, identity_artifact_id, design_system_artifact_id, starter_artifact_id } =
    canonicalArtifacts;

  // Recompute expected fingerprint from canonical artifact IDs per D-04
  const expectedPayload = {
    strategy_artifact_id,
    identity_artifact_id,
    design_system_artifact_id,
    starter_artifact_id,
  };
  const expected_fingerprint = buildFingerprint(stableSort(expectedPayload));

  // Read active pointer — null means no active bundle = drift by definition per D-04
  const activeBundle = getActiveBundle(tenant_id);

  let active_fingerprint = null;
  let has_drift = true;

  if (activeBundle !== null) {
    const activePayload = {
      strategy_artifact_id: activeBundle.strategy_artifact_id,
      identity_artifact_id: activeBundle.identity_artifact_id,
      design_system_artifact_id: activeBundle.design_system_artifact_id,
      starter_artifact_id: activeBundle.starter_artifact_id,
    };
    active_fingerprint = buildFingerprint(stableSort(activePayload));
    has_drift = expected_fingerprint !== active_fingerprint;
  }

  // Machine-readable evidence hash per D-08
  const evidencePayload = stableSort({ tenant_id, has_drift, expected_fingerprint, active_fingerprint });
  const evidence_hash = crypto.createHash('sha256').update(JSON.stringify(evidencePayload)).digest('hex');

  return {
    tenant_id,
    has_drift,
    expected_fingerprint,
    active_fingerprint,
    evidence_hash,
    evaluated_at: new Date().toISOString(),
  };
}

module.exports = { auditDrift };
