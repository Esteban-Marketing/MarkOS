const test = require('node:test');
const assert = require('node:assert/strict');

const { runClosureGates, computeBundleId } = require('../../onboarding/backend/brand-governance/closure-gates.cjs');
const { DENY_CODES } = require('../../onboarding/backend/brand-governance/governance-diagnostics.cjs');

// ────────────────────────────────────────────────────────────────────────────
// Test fixture: base lineage bundle with all lanes per D-05
// ────────────────────────────────────────────────────────────────────────────

function createBundleWithAllLanes(tenant_id) {
  const base = {
    tenant_id,
    strategy_artifact_id: 'strat-art-001',
    identity_artifact_id: 'ident-art-001',
    design_system_artifact_id: 'ds-art-001',
    starter_artifact_id: 'starter-art-001',
    lineage_fingerprints: {
      strategy: 'fp-strat-abc123',
      identity: 'fp-ident-abc123',
      design_system: 'fp-ds-abc123',
      starter: 'fp-starter-abc123',
    },
  };
  base.bundle_id = computeBundleId(base);
  return base;
}

// ────────────────────────────────────────────────────────────────────────────
// Scenario A (D-05): contract_integrity gate fails when strategy fingerprint lane is null
// ────────────────────────────────────────────────────────────────────────────

test('contract integrity: gate fails when lineage_fingerprints.strategy is null', () => {
  const bundle = createBundleWithAllLanes('tenant-test-001');
  bundle.lineage_fingerprints.strategy = null;

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, false, 'Gates must fail when strategy fingerprint is null');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate must fail');
  assert.equal(
    result.gates.contract_integrity.reason_code,
    DENY_CODES.BRAND_GOV_MISSING_LANE,
    'Reason code must be BRAND_GOV_MISSING_LANE'
  );
  assert.ok(
    result.gates.contract_integrity.detail.includes('strategy'),
    'Detail must mention which lane failed'
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Scenario B (D-05): contract_integrity gate fails when identity fingerprint lane is null
// ────────────────────────────────────────────────────────────────────────────

test('contract integrity: gate fails when lineage_fingerprints.identity is null', () => {
  const bundle = createBundleWithAllLanes('tenant-test-002');
  bundle.lineage_fingerprints.identity = null;

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, false, 'Gates must fail when identity fingerprint is null');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate must fail');
  assert.equal(
    result.gates.contract_integrity.reason_code,
    DENY_CODES.BRAND_GOV_MISSING_LANE,
    'Reason code must be BRAND_GOV_MISSING_LANE'
  );
  assert.ok(
    result.gates.contract_integrity.detail.includes('identity'),
    'Detail must mention identity lane failure'
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Scenario C (D-05): contract_integrity gate fails when design_system fingerprint lane is null
// ────────────────────────────────────────────────────────────────────────────

test('contract integrity: gate fails when lineage_fingerprints.design_system is null', () => {
  const bundle = createBundleWithAllLanes('tenant-test-003');
  bundle.lineage_fingerprints.design_system = null;

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, false, 'Gates must fail when design_system fingerprint is null');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate must fail');
  assert.equal(
    result.gates.contract_integrity.reason_code,
    DENY_CODES.BRAND_GOV_MISSING_LANE,
    'Reason code must be BRAND_GOV_MISSING_LANE'
  );
  assert.ok(
    result.gates.contract_integrity.detail.includes('design_system'),
    'Detail must mention design_system lane failure'
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Scenario D (D-05): contract_integrity gate fails when starter fingerprint lane is null
// ────────────────────────────────────────────────────────────────────────────

test('contract integrity: gate fails when lineage_fingerprints.starter is null', () => {
  const bundle = createBundleWithAllLanes('tenant-test-004');
  bundle.lineage_fingerprints.starter = null;

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, false, 'Gates must fail when starter fingerprint is null');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate must fail');
  assert.equal(
    result.gates.contract_integrity.reason_code,
    DENY_CODES.BRAND_GOV_MISSING_LANE,
    'Reason code must be BRAND_GOV_MISSING_LANE'
  );
  assert.ok(
    result.gates.contract_integrity.detail.includes('starter'),
    'Detail must mention starter lane failure'
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Scenario E (D-05): contract_integrity gate passes when all lanes are present and non-null
// ────────────────────────────────────────────────────────────────────────────

test('contract integrity: gate passes when all lineage_fingerprints lanes are present and non-null', () => {
  const bundle = createBundleWithAllLanes('tenant-test-005');

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, true, 'All gates must pass when all lanes are present and non-null');
  assert.equal(result.gates.contract_integrity.passed, true, 'contract_integrity gate must pass');
  assert.equal(
    result.gates.contract_integrity.reason_code,
    null,
    'No reason_code when contract_integrity passes'
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Additional: contract_integrity gate fails when fingerprint lane is absent (undefined)
// ────────────────────────────────────────────────────────────────────────────

test('contract integrity: gate fails when lineage_fingerprints.strategy is absent (undefined)', () => {
  const bundle = createBundleWithAllLanes('tenant-test-006');
  delete bundle.lineage_fingerprints.strategy;

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, false, 'Gates must fail when strategy fingerprint is absent');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate must fail');
  assert.equal(
    result.gates.contract_integrity.reason_code,
    DENY_CODES.BRAND_GOV_MISSING_LANE,
    'Reason code must be BRAND_GOV_MISSING_LANE'
  );
});

test('contract integrity: gate fails when lineage_fingerprints.identity is absent (undefined)', () => {
  const bundle = createBundleWithAllLanes('tenant-test-007');
  delete bundle.lineage_fingerprints.identity;

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, false, 'Gates must fail when identity fingerprint is absent');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate must fail');
});

test('contract integrity: gate fails when lineage_fingerprints.design_system is absent (undefined)', () => {
  const bundle = createBundleWithAllLanes('tenant-test-008');
  delete bundle.lineage_fingerprints.design_system;

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, false, 'Gates must fail when design_system fingerprint is absent');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate must fail');
});

test('contract integrity: gate fails when lineage_fingerprints.starter is absent (undefined)', () => {
  const bundle = createBundleWithAllLanes('tenant-test-009');
  delete bundle.lineage_fingerprints.starter;

  const result = runClosureGates(bundle.tenant_id, bundle, {});

  assert.equal(result.passed, false, 'Gates must fail when starter fingerprint is absent');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate must fail');
});

// ────────────────────────────────────────────────────────────────────────────
// Integration: No short-circuit (D-05) — all gates evaluated even when contract integrity fails
// ────────────────────────────────────────────────────────────────────────────

test('contract integrity: all three gates are evaluated (no short-circuit) even when contract integrity fails', () => {
  // Build a bundle with contract_integrity gate failure (null fingerprint lane)
  // BUT with a CORRECT bundle_id so determinism gate can pass
  const tenant = 'tenant-cross-check';
  const base = {
    tenant_id: tenant,
    strategy_artifact_id: 'strat-art-001',
    identity_artifact_id: 'ident-art-001',
    design_system_artifact_id: 'ds-art-001',
    starter_artifact_id: 'starter-art-001',
    // Missing strategy fingerprint lane to trigger contract_integrity failure
    lineage_fingerprints: {
      identity: 'fp-ident-abc123',
      design_system: 'fp-ds-abc123',
      starter: 'fp-starter-abc123',
    },
  };
  base.bundle_id = computeBundleId(base);

  const result = runClosureGates(tenant, base, {});

  // All three gates should be evaluated
  assert.ok(result.gates.determinism, 'determinism gate must be evaluated');
  assert.ok(result.gates.tenant_isolation, 'tenant_isolation gate must be evaluated');
  assert.ok(result.gates.contract_integrity, 'contract_integrity gate must be evaluated');

  // Determinism: should pass because bundle_id correctly hashes the current payload
  assert.equal(result.gates.determinism.passed, true, 'determinism should pass (bundle_id correctly matches payload)');
  // Tenant isolation: should pass because tenant matches
  assert.equal(result.gates.tenant_isolation.passed, true, 'tenant_isolation should pass for matching tenant');
  // Contract integrity: should fail because strategy fingerprint lane is missing
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity should fail on missing lane');

  // Overall result is failed (because one gate failed)
  assert.equal(result.passed, false, 'Result must be failed since contract_integrity gate failed');
});
