'use strict';

/**
 * Build canonical governance artifacts from submit-path writer outputs.
 *
 * This helper is metadata-first: it only forwards known writer metadata values
 * and never recomputes fingerprints in handlers.
 */
function buildCanonicalArtifactsFromWrites(writes) {
  const source = writes && typeof writes === 'object' ? writes : {};

  const strategyWrite = source.strategyPersistenceResult || null;
  const identityWrite = source.identityArtifactWrite || null;
  const designWrite = source.designSystemArtifactWrite || null;
  const starterWrite = source.starterArtifactWrite || null;

  return {
    strategy_artifact_id: strategyWrite && strategyWrite.artifact_id ? strategyWrite.artifact_id : null,
    identity_artifact_id: identityWrite && identityWrite.artifact_id ? identityWrite.artifact_id : null,
    design_system_artifact_id: designWrite && designWrite.artifact_id ? designWrite.artifact_id : null,
    starter_artifact_id: starterWrite && starterWrite.artifact_id ? starterWrite.artifact_id : null,
    lineage_fingerprints: {
      strategy: strategyWrite && strategyWrite.artifact_fingerprint ? strategyWrite.artifact_fingerprint : null,
      identity: identityWrite && identityWrite.artifact_fingerprint ? identityWrite.artifact_fingerprint : null,
      design_system: designWrite && designWrite.token_contract_fingerprint ? designWrite.token_contract_fingerprint : null,
      starter: starterWrite && starterWrite.starter_fingerprint ? starterWrite.starter_fingerprint : null,
    },
  };
}

module.exports = {
  buildCanonicalArtifactsFromWrites,
};
