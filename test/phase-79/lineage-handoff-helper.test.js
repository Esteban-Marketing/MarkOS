'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCanonicalArtifactsFromWrites,
} = require('../../onboarding/backend/brand-governance/lineage-handoff.cjs');

test('lineage handoff: maps writer metadata into canonical artifacts with fixed lane keys', () => {
  const result = buildCanonicalArtifactsFromWrites({
    strategyPersistenceResult: {
      artifact_id: 'tenant-1:strategy:abc',
      artifact_fingerprint: 'fp-strategy-001',
    },
    identityArtifactWrite: {
      artifact_id: 'tenant-1:identity:def',
      artifact_fingerprint: 'fp-identity-001',
    },
    designSystemArtifactWrite: {
      artifact_id: 'tenant-1:design-system:ghi',
      token_contract_fingerprint: 'fp-design-001',
    },
    starterArtifactWrite: {
      artifact_id: 'tenant-1:nextjs-starter:jkl',
      starter_fingerprint: 'fp-starter-001',
    },
  });

  assert.equal(result.strategy_artifact_id, 'tenant-1:strategy:abc');
  assert.equal(result.identity_artifact_id, 'tenant-1:identity:def');
  assert.equal(result.design_system_artifact_id, 'tenant-1:design-system:ghi');
  assert.equal(result.starter_artifact_id, 'tenant-1:nextjs-starter:jkl');

  assert.deepEqual(Object.keys(result.lineage_fingerprints).sort(), ['design_system', 'identity', 'starter', 'strategy']);
  assert.equal(result.lineage_fingerprints.strategy, 'fp-strategy-001');
  assert.equal(result.lineage_fingerprints.identity, 'fp-identity-001');
  assert.equal(result.lineage_fingerprints.design_system, 'fp-design-001');
  assert.equal(result.lineage_fingerprints.starter, 'fp-starter-001');
});

test('lineage handoff: preserves all lanes with null when source fingerprints are missing', () => {
  const result = buildCanonicalArtifactsFromWrites({
    strategyPersistenceResult: {
      artifact_id: 'tenant-1:strategy:abc',
      artifact_fingerprint: null,
    },
    identityArtifactWrite: {
      artifact_id: 'tenant-1:identity:def',
    },
    designSystemArtifactWrite: {
      artifact_id: 'tenant-1:design-system:ghi',
      token_contract_fingerprint: null,
    },
    starterArtifactWrite: {
      artifact_id: 'tenant-1:nextjs-starter:jkl',
    },
  });

  assert.equal(result.lineage_fingerprints.strategy, null);
  assert.equal(result.lineage_fingerprints.identity, null);
  assert.equal(result.lineage_fingerprints.design_system, null);
  assert.equal(result.lineage_fingerprints.starter, null);
});

test('lineage handoff: forwards metadata values without recomputing or overriding fingerprints', () => {
  const strategyFp = 'already-computed-strategy-fp';
  const identityFp = 'already-computed-identity-fp';
  const designFp = 'already-computed-design-fp';
  const starterFp = 'already-computed-starter-fp';

  const result = buildCanonicalArtifactsFromWrites({
    strategyPersistenceResult: { artifact_fingerprint: strategyFp },
    identityArtifactWrite: { artifact_fingerprint: identityFp },
    designSystemArtifactWrite: { token_contract_fingerprint: designFp },
    starterArtifactWrite: { starter_fingerprint: starterFp },
  });

  assert.equal(result.lineage_fingerprints.strategy, strategyFp);
  assert.equal(result.lineage_fingerprints.identity, identityFp);
  assert.equal(result.lineage_fingerprints.design_system, designFp);
  assert.equal(result.lineage_fingerprints.starter, starterFp);
});
