'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBundle,
  setVerificationEvidence,
} = require('../../onboarding/backend/brand-governance/bundle-registry.cjs');

const {
  publishBundle,
  rollbackBundle,
  getActiveBundle,
} = require('../../onboarding/backend/brand-governance/active-pointer.cjs');

const { DENY_CODES } = require('../../onboarding/backend/brand-governance/governance-diagnostics.cjs');

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a lineagePayload that passes all three closure gates (complete lineage lanes). */
function makeGoodPayload() {
  return {
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
  };
}

/** Returns a lineagePayload that fails Gate 3 (contract integrity): empty lineage_fingerprints. */
function makeGateFailPayload() {
  return {
    strategy_artifact_id: 'strat-fail-001',
    identity_artifact_id: 'ident-fail-001',
    design_system_artifact_id: 'ds-fail-001',
    starter_artifact_id: 'starter-fail-001',
    lineage_fingerprints: {}, // contract integrity gate will fail — all 4 lanes missing
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// publishBundle — gate-fail path (unique tenant per test for isolation)
// ─────────────────────────────────────────────────────────────────────────────

test('publishBundle: denies with BRAND_GOV_CLOSURE_GATE_FAIL when a closure gate fails', () => {
  const tenant_id = 'tenant-pub-fail-001';
  const bundle = createBundle(tenant_id, makeGateFailPayload());
  assert.ok(bundle && !bundle.denied, 'createBundle must succeed with empty lineage_fingerprints lanes');

  const result = publishBundle(tenant_id, bundle.bundle_id, { actor_id: 'actor-001', reason: 'gate fail test' });

  assert.equal(result.denied, true);
  assert.equal(result.reason_code, DENY_CODES.BRAND_GOV_CLOSURE_GATE_FAIL);
  assert.ok(result.diagnostics, 'diagnostics must be present on denial');
  assert.equal(result.diagnostics.machine_readable, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// publishBundle — gate-pass path
// ─────────────────────────────────────────────────────────────────────────────

test('publishBundle: switches active pointer and appends traceability entry on gate pass', () => {
  const tenant_id = 'tenant-pub-pass-001';
  const bundle = createBundle(tenant_id, makeGoodPayload());
  assert.ok(bundle && !bundle.denied, 'createBundle must succeed');

  const result = publishBundle(tenant_id, bundle.bundle_id, { actor_id: 'actor-001', reason: 'initial publish' });

  assert.equal(result.published, true);
  assert.equal(result.bundle_id, bundle.bundle_id);

  // Traceability entry
  assert.ok(result.traceability_entry, 'traceability_entry must be returned');
  assert.equal(result.traceability_entry.action, 'publish');
  assert.equal(result.traceability_entry.tenant_id, tenant_id);
  assert.equal(result.traceability_entry.bundle_id, bundle.bundle_id);
  assert.equal(result.traceability_entry.actor_id, 'actor-001');
  assert.equal(result.traceability_entry.reason, 'initial publish');
  assert.ok(
    typeof result.traceability_entry.timestamp === 'string' && result.traceability_entry.timestamp.length > 0,
    'timestamp must be a non-empty ISO string'
  );

  // Active pointer switched
  const active = getActiveBundle(tenant_id);
  assert.ok(active !== null, 'active bundle must not be null after publish');
  assert.equal(active.bundle_id, bundle.bundle_id);
});

// ─────────────────────────────────────────────────────────────────────────────
// rollbackBundle — deny path (no verification evidence)
// ─────────────────────────────────────────────────────────────────────────────

test('rollbackBundle: denies with BRAND_GOV_BUNDLE_NOT_VERIFIED when target lacks verification_evidence_hash', () => {
  const tenant_id = 'tenant-rb-deny-001';
  const bundle = createBundle(tenant_id, makeGoodPayload());
  assert.ok(bundle && !bundle.denied, 'createBundle must succeed');

  // Do NOT call setVerificationEvidence — rollback must be denied
  const result = rollbackBundle(tenant_id, bundle.bundle_id, { actor_id: 'actor-001', reason: 'rollback deny test' });

  assert.equal(result.denied, true);
  assert.equal(result.reason_code, DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED);
  assert.ok(result.diagnostics, 'diagnostics must be present on denial');
  assert.equal(result.diagnostics.machine_readable, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// rollbackBundle — pass path
// ─────────────────────────────────────────────────────────────────────────────

test('rollbackBundle: switches active pointer to verified bundle with traceability entry action rollback', () => {
  const tenant_id = 'tenant-rb-pass-001';
  const bundle = createBundle(tenant_id, makeGoodPayload());
  assert.ok(bundle && !bundle.denied, 'createBundle must succeed');

  // Set verification evidence (required for rollback per D-03)
  const annotated = setVerificationEvidence(tenant_id, bundle.bundle_id, 'evidence-hash-abc123');
  assert.ok(annotated && !annotated.denied, 'setVerificationEvidence must succeed');
  assert.equal(annotated.verification_evidence_hash, 'evidence-hash-abc123');

  const result = rollbackBundle(tenant_id, bundle.bundle_id, { actor_id: 'actor-001', reason: 'rollback test' });

  assert.equal(result.rolled_back, true);
  assert.equal(result.bundle_id, bundle.bundle_id);

  // Traceability entry with action: 'rollback'
  assert.ok(result.traceability_entry, 'traceability_entry must be returned');
  assert.equal(result.traceability_entry.action, 'rollback');
  assert.equal(result.traceability_entry.tenant_id, tenant_id);
  assert.equal(result.traceability_entry.bundle_id, bundle.bundle_id);
  assert.equal(result.traceability_entry.actor_id, 'actor-001');
  assert.equal(result.traceability_entry.reason, 'rollback test');
  assert.ok(
    typeof result.traceability_entry.timestamp === 'string' && result.traceability_entry.timestamp.length > 0,
    'timestamp must be a non-empty ISO string'
  );

  // Active pointer switched to rollback target
  const active = getActiveBundle(tenant_id);
  assert.ok(active !== null, 'active bundle must not be null after rollback');
  assert.equal(active.bundle_id, bundle.bundle_id);
});

// ─────────────────────────────────────────────────────────────────────────────
// bundle-registry immutability: no mutate or delete operation exposed
// ─────────────────────────────────────────────────────────────────────────────

test('bundle-registry: exposes no mutate or delete operation', () => {
  const bundleRegistry = require('../../onboarding/backend/brand-governance/bundle-registry.cjs');
  const publicExports = Object.keys(bundleRegistry).filter((k) => !k.startsWith('_'));

  const forbiddenNames = ['deleteBundle', 'mutateBundle', 'updateBundle', 'replaceBundle', 'removeBundle'];
  for (const name of forbiddenNames) {
    assert.ok(!publicExports.includes(name), `Must not expose: ${name}`);
  }

  // Required operations
  assert.ok(publicExports.includes('createBundle'), 'createBundle must be exported');
  assert.ok(publicExports.includes('getBundle'), 'getBundle must be exported');
  assert.ok(publicExports.includes('listBundles'), 'listBundles must be exported');
  assert.ok(publicExports.includes('setVerificationEvidence'), 'setVerificationEvidence must be exported (append-only annotation)');
});
