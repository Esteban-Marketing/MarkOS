const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TenantMembership,
  TenantPrincipal,
  IamRole,
  LegacyRole,
  LEGACY_TO_IAM_MAPPING,
  validateLegacyRole,
} = require('../../lib/markos/tenant/contracts.js');

// Test contract presence
test('51-01-01: Exports all required tenant contracts', () => {
  assert.equal(typeof TenantMembership, 'object');
  assert.equal(typeof TenantPrincipal, 'object');
  assert.equal(typeof IamRole, 'object');
  assert.equal(typeof LegacyRole, 'object');
  assert.equal(typeof LEGACY_TO_IAM_MAPPING, 'object');
  assert.equal(typeof validateLegacyRole, 'function');
});

// Test TenantMembership contract
test('51-01-01: TenantMembership contract includes tenant_id as mandatory', () => {
  const sample = {
    membership_id: 'mem-123',
    user_id: 'user-456',
    tenant_id: 'tenant-789',
    iam_role: 'owner',
    legacy_role: 'owner',
    created_at: new Date().toISOString(),
  };
  // Verify required fields are present in contract definition
  assert.ok(TenantMembership.memb_fields);
  assert.ok(TenantMembership.memb_fields.includes('tenant_id'));
  assert.ok(TenantMembership.memb_fields.includes('user_id'));
  assert.ok(TenantMembership.memb_fields.includes('iam_role'));
});

// Test TenantPrincipal contract
test('51-01-01: TenantPrincipal contract includes actor_id and active_tenant_id', () => {
  // Verify required fields are present
  assert.ok(TenantPrincipal.principal_fields);
  assert.ok(TenantPrincipal.principal_fields.includes('actor_id'));
  assert.ok(TenantPrincipal.principal_fields.includes('active_tenant_id'));
  assert.ok(TenantPrincipal.principal_fields.includes('memberships'));
});

// Test IamRole contract
test('51-01-01: IamRole lists all v3.2 canonical roles', () => {
  const expectedRoles = ['owner', 'tenant-admin', 'manager', 'contributor', 'reviewer', 'billing-admin', 'readonly'];
  expectedRoles.forEach((role) => {
    assert.ok(IamRole.valid_roles.includes(role), `IamRole should include ${role}`);
  });
});

// Test LegacyRole contract
test('51-01-01: LegacyRole lists v3.1 legacy roles', () => {
  const expectedLegacy = ['owner', 'operator', 'strategist', 'viewer', 'agent'];
  expectedLegacy.forEach((role) => {
    assert.ok(LegacyRole.valid_roles.includes(role), `LegacyRole should include ${role}`);
  });
});

// Test legacy-to-IAM mapping completeness
test('51-01-01: LEGACY_TO_IAM_MAPPING covers all legacy roles', () => {
  const legacyRoles = ['owner', 'operator', 'strategist', 'viewer', 'agent'];
  legacyRoles.forEach((legacy) => {
    assert.ok(LEGACY_TO_IAM_MAPPING[legacy], `Mapping missing for legacy role: ${legacy}`);
    assert.equal(typeof LEGACY_TO_IAM_MAPPING[legacy], 'string');
  });
});

// Test legacy role validation with unmapped roles
test('51-01-01: validateLegacyRole rejects unmapped roles with deterministic error', () => {
  assert.throws(
    () => validateLegacyRole('unknown-role'),
    (err) => {
      assert.equal(err.code, 'UNMAPPED_LEGACY_ROLE');
      return true;
    },
    'Should throw UNMAPPED_LEGACY_ROLE error'
  );
});

// Test legacy role validation with valid roles
test('51-01-01: validateLegacyRole accepts all mapped legacy roles', () => {
  const legacyRoles = ['owner', 'operator', 'strategist', 'viewer', 'agent'];
  legacyRoles.forEach((legacy) => {
    assert.equal(validateLegacyRole(legacy), LEGACY_TO_IAM_MAPPING[legacy]);
  });
});

// Test workspace_id marked as compatibility-only
test('51-01-01: TenantMembership marks workspace_id as compatibility-only metadata', () => {
  assert.ok(TenantMembership.compatibility_fields);
  assert.ok(TenantMembership.compatibility_fields.includes('workspace_id'));
});
