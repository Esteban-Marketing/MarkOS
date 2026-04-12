const test = require('node:test');
const assert = require('node:assert/strict');

const { createBundle, getBundle, _resetBundleRegistryForTest } = require('../../onboarding/backend/brand-governance/bundle-registry.cjs');
const { publishBundle, getActiveBundle, _resetActivePointerForTest } = require('../../onboarding/backend/brand-governance/active-pointer.cjs');
const { auditDrift } = require('../../onboarding/backend/brand-governance/drift-auditor.cjs');
const { DENY_CODES } = require('../../onboarding/backend/brand-governance/governance-diagnostics.cjs');

// ────────────────────────────────────────────────────────────────────────────
// Test fixture: canonical lineage payload per D-01
// ────────────────────────────────────────────────────────────────────────────

function createCanonicalPayload(tenant_id) {
  return {
    strategy_artifact_id: `${tenant_id}:strategy:abc123`,
    identity_artifact_id: `${tenant_id}:identity:def456`,
    design_system_artifact_id: `${tenant_id}:design-system:ghi789`,
    starter_artifact_id: `${tenant_id}:starter:jkl012`,
    lineage_fingerprints: {
      strategy: `fp-strat-${tenant_id}`,
      identity: `fp-ident-${tenant_id}`,
      design_system: `fp-ds-${tenant_id}`,
      starter: `fp-starter-${tenant_id}`,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Scenario A (D-06 Pattern 4): Cross-tenant getBundle returns null, not bundle data
// ────────────────────────────────────────────────────────────────────────────

test('tenant isolation: getBundle(tenant_A, bundle_id_from_tenant_B) returns null (deny-not-data pattern)', () => {
  _resetBundleRegistryForTest();

  // Create bundle for tenant_B
  const tenantB = 'tenant-b-org-999';
  const payloadB = createCanonicalPayload(tenantB);
  const bundleB = createBundle(tenantB, payloadB);
  assert.equal(bundleB.denied, undefined, 'Bundle creation for tenant_B should succeed');
  assert.equal(typeof bundleB.bundle_id, 'string', 'Bundle should have bundle_id');
  assert.ok(bundleB.bundle_id.length > 0, 'Bundle ID should not be empty');

  // Try to read bundle_B from tenant_A context
  const tenantA = 'tenant-a-org-888';
  const result = getBundle(tenantA, bundleB.bundle_id);

  // Must return null (deny-not-data), not the bundle from tenant_B
  assert.strictEqual(result, null, 'Cross-tenant getBundle must return null, not bundle data');
});

// ────────────────────────────────────────────────────────────────────────────
// Scenario B (D-06 Pattern 4): Cross-tenant getActiveBundle returns null
// ────────────────────────────────────────────────────────────────────────────

test('tenant isolation: getActiveBundle(tenant_A) returns null after setActive for tenant_B (deny-not-data)', () => {
  _resetBundleRegistryForTest();
  _resetActivePointerForTest();

  // Tenant B creates and publishes a bundle
  const tenantB = 'tenant-b-org-997';
  const payloadB = createCanonicalPayload(tenantB);
  const bundleB = createBundle(tenantB, payloadB);
  assert.equal(bundleB.denied, undefined, 'Bundle creation for tenant_B should succeed');

  // Publish for tenant_B
  const publishResult = publishBundle(tenantB, bundleB.bundle_id, {
    actor_id: 'actor-999',
    reason: 'test_publish_b',
  });
  assert.equal(publishResult.published, true, 'Publish for tenant_B should succeed');

  // Tenant A tries to read active bundle — must get null (deny-not-data), not tenant_B's pointer
  const tenantA = 'tenant-a-org-777';
  const activeForA = getActiveBundle(tenantA);

  assert.strictEqual(activeForA, null, 'Cross-tenant getActiveBundle must return null for tenant without active pointer');
});

// ────────────────────────────────────────────────────────────────────────────
// Scenario C (D-06 Pattern 4): auditDrift per tenant returns has_drift: true when no A-scoped pointer
// ────────────────────────────────────────────────────────────────────────────

test('tenant isolation: auditDrift(tenant_A) returns has_drift: true when active pointer belongs to tenant_B only', () => {
  _resetBundleRegistryForTest();
  _resetActivePointerForTest();

  // Tenant B creates and publishes a bundle (making it active for tenant_B)
  const tenantB = 'tenant-b-org-996';
  const payloadB = createCanonicalPayload(tenantB);
  const bundleB = createBundle(tenantB, payloadB);
  assert.equal(bundleB.denied, undefined, 'Bundle creation for tenant_B should succeed');

  const publishResult = publishBundle(tenantB, bundleB.bundle_id, {
    actor_id: 'actor-888',
    reason: 'test_publish',
  });
  assert.equal(publishResult.published, true, 'Publish should succeed for tenant_B');

  // Tenant A evaluates drift (should have no A-scoped active pointer)
  const tenantA = 'tenant-a-org-666';
  const canonicalA = createCanonicalPayload(tenantA);
  const driftA = auditDrift(tenantA, {
    strategy_artifact_id: canonicalA.strategy_artifact_id,
    identity_artifact_id: canonicalA.identity_artifact_id,
    design_system_artifact_id: canonicalA.design_system_artifact_id,
    starter_artifact_id: canonicalA.starter_artifact_id,
  });

  // Since tenant_A has no active pointer (tenant_B's pointer is not visible), has_drift must be true
  assert.equal(driftA.has_drift, true, 'auditDrift for tenant_A with no active pointer must return has_drift: true');
  assert.equal(driftA.tenant_id, tenantA, 'Drift result must be scoped to tenant_A');
  assert.equal(driftA.active_fingerprint, null, 'Active fingerprint must be null (no tenant_A pointer exists)');
});

// ────────────────────────────────────────────────────────────────────────────
// Scenario D (D-06 Pattern 4): publishBundle denies cross-tenant attempts
// ────────────────────────────────────────────────────────────────────────────

test('tenant isolation: publishBundle denies cross-tenant attempts (fail-closed per D-06)', () => {
  _resetBundleRegistryForTest();
  _resetActivePointerForTest();

  // Tenant A creates a bundle
  const tenantA = 'tenant-a-org-555';
  const payloadA = createCanonicalPayload(tenantA);
  const bundleA = createBundle(tenantA, payloadA);
  assert.equal(bundleA.denied, undefined, 'Bundle creation should succeed');

  // Tenant B tries to publish tenant A's bundle by bundle_id (cross-tenant attack)
  const tenantB = 'tenant-b-org-444';
  const publishResult = publishBundle(tenantB, bundleA.bundle_id, {
    actor_id: 'actor-b-attacker',
    reason: 'attempt_cross_tenant_publish',
  });

  // Must be denied (fail-closed per D-06) 
  // The denial happens because bundle lookup is tenant-scoped: lookupkey = ${tenantB}:${bundleA.bundle_id}
  // which doesn't exist, so returns BUNDLE_NOT_VERIFIED (which is correct security behavior)
  assert.equal(publishResult.denied, true, 'PublishBundle must deny cross-tenant attempt');
  assert.ok(
    [DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED, DENY_CODES.BRAND_GOV_TENANT_MISMATCH].includes(
      publishResult.reason_code
    ),
    `Denial reason_code must be bundle not found or tenant mismatch (got ${publishResult.reason_code})`
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Integration: Summary assertion per D-06
// ────────────────────────────────────────────────────────────────────────────

test('tenant isolation: all governance operations enforce tenant scoping per D-06', () => {
  _resetBundleRegistryForTest();
  _resetActivePointerForTest();

  const tenantA = 'tenant-isolation-test-a';
  const tenantB = 'tenant-isolation-test-b';

  // Create bundles for each tenant
  const payloadA = createCanonicalPayload(tenantA);
  const payloadB = createCanonicalPayload(tenantB);

  const bundleA = createBundle(tenantA, payloadA);
  const bundleB = createBundle(tenantB, payloadB);

  assert.ok(bundleA.bundle_id && !bundleA.denied, 'Bundle A created successfully');
  assert.ok(bundleB.bundle_id && !bundleB.denied, 'Bundle B created successfully');

  // Verify cross-tenant denials
  assert.strictEqual(getBundle(tenantA, bundleB.bundle_id), null, 'Tenant A cannot read tenant B bundle');
  assert.strictEqual(getBundle(tenantB, bundleA.bundle_id), null, 'Tenant B cannot read tenant A bundle');

  // Publish B, verify isolation
  const pubB = publishBundle(tenantB, bundleB.bundle_id, { actor_id: 'a1', reason: 'test' });
  assert.equal(pubB.published, true, 'Publish B succeeds for tenant B');

  // Tenant A has no active pointer (B's pointer is not visible)
  assert.strictEqual(getActiveBundle(tenantA), null, 'Tenant A sees no active pointer after tenant B publishes');

  // Cross-tenant publish attempt denied
  const pubCross = publishBundle(tenantB, bundleA.bundle_id, { actor_id: 'a2', reason: 'test' });
  assert.equal(pubCross.denied, true, 'Cross-tenant publish denied');
});
