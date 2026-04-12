const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { runClosureGates, computeBundleId } = require('../../onboarding/backend/brand-governance/closure-gates.cjs');
const { DENY_CODES } = require('../../onboarding/backend/brand-governance/governance-diagnostics.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

// ────────────────────────────────────────────────────────────────────────────
// Pass cases
// ────────────────────────────────────────────────────────────────────────────

test('closure gates: valid bundle with matching bundle_id passes all three gates', () => {
  const bundle = loadFixture('closure-gate-pass.json').bundle;
  const result = runClosureGates(bundle.tenant_id, bundle, {});
  assert.equal(result.passed, true, JSON.stringify(result));
  assert.equal(result.gates.determinism.passed, true);
  assert.equal(result.gates.tenant_isolation.passed, true);
  assert.equal(result.gates.contract_integrity.passed, true);
  assert.equal(result.gates.determinism.reason_code, null);
  assert.equal(result.gates.tenant_isolation.reason_code, null);
  assert.equal(result.gates.contract_integrity.reason_code, null);
});

test('closure gates: pass fixture bundle_id is the correct sha256 of sorted payload', () => {
  const bundle = loadFixture('closure-gate-pass.json').bundle;
  const expected = computeBundleId(bundle);
  assert.equal(bundle.bundle_id, expected, 'Fixture bundle_id must be sha256 of stableSort(payload without bundle_id)');
});

// ────────────────────────────────────────────────────────────────────────────
// Determinism gate failures
// ────────────────────────────────────────────────────────────────────────────

test('closure gates: determinism gate fails when bundle_id does not match expected sha256 digest', () => {
  const bundle = loadFixture('closure-gate-fail.json').bundle;
  const result = runClosureGates(bundle.tenant_id, bundle, {});
  assert.equal(result.passed, false);
  assert.equal(result.gates.determinism.passed, false);
  assert.equal(result.gates.determinism.reason_code, DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED);
  assert.ok(typeof result.gates.determinism.detail === 'string' && result.gates.determinism.detail.length > 0);
});

test('closure gates: tampered bundle_id triggers determinism gate failure', () => {
  const bundle = loadFixture('closure-gate-pass.json').bundle;
  bundle.bundle_id = 'tampered-hash-value';
  const result = runClosureGates(bundle.tenant_id, bundle, {});
  assert.equal(result.passed, false);
  assert.equal(result.gates.determinism.passed, false);
  assert.equal(result.gates.determinism.reason_code, DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED);
});

// ────────────────────────────────────────────────────────────────────────────
// Tenant isolation gate failures
// ────────────────────────────────────────────────────────────────────────────

test('closure gates: tenant isolation gate fails when request tenant_id mismatches bundle.tenant_id', () => {
  const bundle = loadFixture('closure-gate-pass.json').bundle;
  const wrongTenant = 'tenant-attacker-999';
  const result = runClosureGates(wrongTenant, bundle, {});
  assert.equal(result.passed, false);
  assert.equal(result.gates.tenant_isolation.passed, false);
  assert.equal(result.gates.tenant_isolation.reason_code, DENY_CODES.BRAND_GOV_TENANT_MISMATCH);
  assert.ok(result.gates.tenant_isolation.detail.includes(wrongTenant));
});

// ────────────────────────────────────────────────────────────────────────────
// Contract integrity gate failures
// ────────────────────────────────────────────────────────────────────────────

test('closure gates: contract integrity gate fails when a lineage_fingerprints lane is null', () => {
  // Build a bundle with correct bundle_id but a null fingerprint lane
  const base = {
    tenant_id: 'tenant-test-001',
    strategy_artifact_id: 'strat-art-001',
    identity_artifact_id: 'ident-art-001',
    design_system_artifact_id: 'ds-art-001',
    starter_artifact_id: 'starter-art-001',
    publish_readiness: true,
    lineage_fingerprints: {
      strategy: 'fp-strat-abc123',
      identity: null,
      design_system: 'fp-ds-abc123',
      starter: 'fp-starter-abc123',
    },
  };
  base.bundle_id = computeBundleId(base);
  const result = runClosureGates('tenant-test-001', base, {});
  assert.equal(result.passed, false);
  assert.equal(result.gates.contract_integrity.passed, false);
  assert.equal(result.gates.contract_integrity.reason_code, DENY_CODES.BRAND_GOV_MISSING_LANE);
  assert.ok(result.gates.contract_integrity.detail.includes('identity'));
});

test('closure gates: contract integrity gate fails when a lineage_fingerprints lane is absent', () => {
  const base = {
    tenant_id: 'tenant-test-001',
    strategy_artifact_id: 'strat-art-001',
    identity_artifact_id: 'ident-art-001',
    design_system_artifact_id: 'ds-art-001',
    starter_artifact_id: 'starter-art-001',
    publish_readiness: true,
    lineage_fingerprints: {
      strategy: 'fp-strat-abc123',
      identity: 'fp-ident-abc123',
      design_system: 'fp-ds-abc123',
    },
  };
  base.bundle_id = computeBundleId(base);
  const result = runClosureGates('tenant-test-001', base, {});
  assert.equal(result.passed, false);
  assert.equal(result.gates.contract_integrity.passed, false);
  assert.equal(result.gates.contract_integrity.reason_code, DENY_CODES.BRAND_GOV_MISSING_LANE);
  assert.ok(result.gates.contract_integrity.detail.includes('starter'));
});

// ────────────────────────────────────────────────────────────────────────────
// Multi-gate failure (non-short-circuit)
// ────────────────────────────────────────────────────────────────────────────

test('closure gates: all three gates are always evaluated (no short-circuit) when multiple fail', () => {
  const bundle = {
    tenant_id: 'tenant-bundle-001',
    bundle_id: 'wrong-bundle-id',
    strategy_artifact_id: 'strat-art-001',
    identity_artifact_id: 'ident-art-001',
    design_system_artifact_id: 'ds-art-001',
    starter_artifact_id: 'starter-art-001',
    publish_readiness: true,
    lineage_fingerprints: {
      strategy: null,
      identity: 'fp-ident',
      design_system: 'fp-ds',
      starter: 'fp-starter',
    },
  };
  // tenant_id mismatch is also introduced by passing a different tenant
  const result = runClosureGates('tenant-requester-999', bundle, {});
  assert.equal(result.passed, false);
  // All three gates ran; two should fail
  assert.equal(result.gates.determinism.passed, false, 'determinism gate should fail');
  assert.equal(result.gates.tenant_isolation.passed, false, 'tenant_isolation gate should fail');
  assert.equal(result.gates.contract_integrity.passed, false, 'contract_integrity gate should fail');
});

// ────────────────────────────────────────────────────────────────────────────
// Reason code provenance
// ────────────────────────────────────────────────────────────────────────────

test('closure gates: all reason_code values come from DENY_CODES (governance-diagnostics)', () => {
  const validCodes = new Set(Object.values(DENY_CODES));
  const bundle = {
    tenant_id: 'tenant-test-001',
    bundle_id: 'bad-id',
    strategy_artifact_id: 'strat-art-001',
    identity_artifact_id: 'ident-art-001',
    design_system_artifact_id: 'ds-art-001',
    starter_artifact_id: 'starter-art-001',
    publish_readiness: true,
    lineage_fingerprints: {
      strategy: null,
      identity: 'fp-ident',
      design_system: 'fp-ds',
      starter: 'fp-starter',
    },
  };
  const result = runClosureGates('different-tenant', bundle, {});
  for (const [name, gate] of Object.entries(result.gates)) {
    if (!gate.passed) {
      assert.ok(validCodes.has(gate.reason_code), `Gate ${name} has unknown reason_code: ${gate.reason_code}`);
    }
  }
});

test('closure gates: no standalone governance route added to handlers (D-07)', () => {
  const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(!handlersContent.includes("'/closure-gates'"), 'No standalone closure-gates route permitted per D-07');
  assert.ok(!handlersContent.includes('"/closure-gates"'), 'No standalone closure-gates route permitted per D-07');
});
