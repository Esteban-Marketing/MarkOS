'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBundle,
} = require('../../onboarding/backend/brand-governance/bundle-registry.cjs');

const {
  publishBundle,
} = require('../../onboarding/backend/brand-governance/active-pointer.cjs');

const { auditDrift } = require('../../onboarding/backend/brand-governance/drift-auditor.cjs');

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixture helper
// ─────────────────────────────────────────────────────────────────────────────

/** Full lineagePayload that passes all three closure gates. */
function makeFullPayload(overrides) {
  return Object.assign(
    {
      strategy_artifact_id: 'strat-001',
      identity_artifact_id: 'ident-001',
      design_system_artifact_id: 'ds-001',
      starter_artifact_id: 'starter-001',
      lineage_fingerprints: {
        strategy: 'fp-strat-abc123',
        identity: 'fp-ident-abc123',
        design_system: 'fp-ds-abc123',
        starter: 'fp-starter-abc123',
      },
    },
    overrides || {}
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario (a): no-drift
// canonicalArtifacts matches active bundle artifact IDs → has_drift: false
// ─────────────────────────────────────────────────────────────────────────────

test('auditDrift: returns has_drift false when canonical artifacts match active bundle', () => {
  const tenant_id = 'tenant-drift-nodrift-001';
  const payload = makeFullPayload();
  const bundle = createBundle(tenant_id, payload);
  assert.ok(bundle && !bundle.denied, 'createBundle must succeed');

  // Publish to establish active pointer
  const pubResult = publishBundle(tenant_id, bundle.bundle_id, { actor_id: 'actor-001', reason: 'drift setup' });
  assert.equal(pubResult.published, true, 'publishBundle must succeed for drift test setup');

  // canonicalArtifacts has the SAME artifact IDs as the active bundle
  const canonicalArtifacts = {
    strategy_artifact_id: payload.strategy_artifact_id,
    identity_artifact_id: payload.identity_artifact_id,
    design_system_artifact_id: payload.design_system_artifact_id,
    starter_artifact_id: payload.starter_artifact_id,
  };

  const evidence = auditDrift(tenant_id, canonicalArtifacts);

  assert.equal(evidence.has_drift, false);
  assert.equal(evidence.tenant_id, tenant_id);
  assert.ok(
    typeof evidence.expected_fingerprint === 'string' && evidence.expected_fingerprint.length > 0,
    'expected_fingerprint must be a non-empty string'
  );
  assert.ok(
    typeof evidence.active_fingerprint === 'string' && evidence.active_fingerprint.length > 0,
    'active_fingerprint must be a non-empty string when active bundle exists'
  );
  assert.equal(
    evidence.expected_fingerprint,
    evidence.active_fingerprint,
    'fingerprints must match for no-drift scenario'
  );
  assert.ok(
    typeof evidence.evidence_hash === 'string' && evidence.evidence_hash.length > 0,
    'evidence_hash must be a non-empty string per D-08'
  );
  assert.ok(
    typeof evidence.evaluated_at === 'string' && evidence.evaluated_at.length > 0,
    'evaluated_at must be present per D-08'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario (b): drift-detected
// active bundle fingerprint diverges from recomputed expected → has_drift: true
// ─────────────────────────────────────────────────────────────────────────────

test('auditDrift: returns has_drift true when canonical artifacts diverge from active bundle', () => {
  const tenant_id = 'tenant-drift-detect-001';
  const payload = makeFullPayload();
  const bundle = createBundle(tenant_id, payload);
  assert.ok(bundle && !bundle.denied, 'createBundle must succeed');

  const pubResult = publishBundle(tenant_id, bundle.bundle_id, { actor_id: 'actor-001', reason: 'drift setup' });
  assert.equal(pubResult.published, true, 'publishBundle must succeed for drift test setup');

  // canonicalArtifacts has a DIFFERENT strategy_artifact_id → fingerprints diverge
  const canonicalArtifacts = {
    strategy_artifact_id: 'strat-NEW-999',
    identity_artifact_id: payload.identity_artifact_id,
    design_system_artifact_id: payload.design_system_artifact_id,
    starter_artifact_id: payload.starter_artifact_id,
  };

  const evidence = auditDrift(tenant_id, canonicalArtifacts);

  assert.equal(evidence.has_drift, true);
  assert.equal(evidence.tenant_id, tenant_id);
  assert.ok(
    typeof evidence.expected_fingerprint === 'string' && evidence.expected_fingerprint.length > 0,
    'expected_fingerprint must be a non-empty string'
  );
  assert.ok(
    typeof evidence.active_fingerprint === 'string' && evidence.active_fingerprint.length > 0,
    'active_fingerprint must be a non-empty string when active bundle exists'
  );
  assert.notEqual(
    evidence.expected_fingerprint,
    evidence.active_fingerprint,
    'fingerprints must differ for drift-detected scenario'
  );
  assert.ok(
    typeof evidence.evidence_hash === 'string' && evidence.evidence_hash.length > 0,
    'evidence_hash must be a non-empty string per D-08'
  );
  assert.ok(
    typeof evidence.evaluated_at === 'string' && evidence.evaluated_at.length > 0,
    'evaluated_at must be present per D-08'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario (c): no-active-pointer
// getActiveBundle returns null → has_drift: true, active_fingerprint: null
// ─────────────────────────────────────────────────────────────────────────────

test('auditDrift: returns has_drift true when no active pointer exists for tenant', () => {
  const tenant_id = 'tenant-drift-nopointer-001';
  // No bundle created or published — no active pointer exists for this tenant

  const canonicalArtifacts = {
    strategy_artifact_id: 'strat-001',
    identity_artifact_id: 'ident-001',
    design_system_artifact_id: 'ds-001',
    starter_artifact_id: 'starter-001',
  };

  const evidence = auditDrift(tenant_id, canonicalArtifacts);

  assert.equal(evidence.has_drift, true);
  assert.equal(evidence.active_fingerprint, null, 'active_fingerprint must be null when no active pointer exists');
  assert.equal(evidence.tenant_id, tenant_id);
  assert.ok(
    typeof evidence.expected_fingerprint === 'string' && evidence.expected_fingerprint.length > 0,
    'expected_fingerprint must still be computed even with no active pointer'
  );
  assert.ok(
    typeof evidence.evidence_hash === 'string' && evidence.evidence_hash.length > 0,
    'evidence_hash must be a non-empty string per D-08'
  );
  assert.ok(
    typeof evidence.evaluated_at === 'string' && evidence.evaluated_at.length > 0,
    'evaluated_at must be present per D-08'
  );
});
