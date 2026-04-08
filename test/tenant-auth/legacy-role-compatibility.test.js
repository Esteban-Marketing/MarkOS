 'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateLegacyRole,
  LEGACY_TO_IAM_MAPPING,
} = require('../../lib/markos/tenant/contracts.js');

const {
  canPerformAction,
} = require('../../lib/markos/rbac/iam-v32.js');

// ============================================================================
// Legacy Role Compatibility Bridge Tests
// ============================================================================

test('legacy-role-compat: validateLegacyRole maps all legacy roles deterministically', () => {
  const mappings = {
    'owner': 'owner',
    'operator': 'tenant-admin',
    'strategist': 'manager',
    'viewer': 'readonly',
    'agent': 'owner',
  };

  Object.entries(mappings).forEach(([legacyRole, expectedIamRole]) => {
    const iamRole = validateLegacyRole(legacyRole);
    assert.equal(
      iamRole,
      expectedIamRole,
      `${legacyRole} must map to ${expectedIamRole}, got ${iamRole}`
    );
  });
});

test('legacy-role-compat: validateLegacyRole rejects unmapped roles with deterministic error', () => {
  assert.throws(
    () => validateLegacyRole('unknown-legacy-role'),
    (err) => {
      assert.equal(err.code, 'UNMAPPED_LEGACY_ROLE');
      return true;
    },
    'Unknown legacy role must throw UNMAPPED_LEGACY_ROLE error'
  );
});

test('legacy-role-compat: LEGACY_TO_IAM_MAPPING is frozen to prevent mutation', () => {
  assert.throws(
    () => {
      LEGACY_TO_IAM_MAPPING['new-role'] = 'owner';
    },
    /Cannot add property/,
    'LEGACY_TO_IAM_MAPPING must be immutable'
  );
});

// ============================================================================
// Privilege Widening Guard Tests
// ============================================================================

test('legacy-role-compat: legacy operator (tenant-admin) cannot access owner-only manage_billing action', () => {
  const legacyOperatorRole = 'operator';
  const iamRole = validateLegacyRole(legacyOperatorRole);

  // tenant-admin should NOT have manage_billing access (owner only)
  assert.equal(
    canPerformAction(iamRole, 'manage_billing'),
    false,
    'operator (tenant-admin) must not be able to manage_billing'
  );
});

test('legacy-role-compat: legacy viewer (readonly) cannot execute tasks', () => {
  const legacyViewerRole = 'viewer';
  const iamRole = validateLegacyRole(legacyViewerRole);

  assert.equal(
    canPerformAction(iamRole, 'execute_task'),
    false,
    'viewer (readonly) must not be able to execute_task'
  );
});

test('legacy-role-compat: legacy strategist (manager) cannot manage billing', () => {
  const legacyStrategistRole = 'strategist';
  const iamRole = validateLegacyRole(legacyStrategistRole);

  assert.equal(
    canPerformAction(iamRole, 'manage_billing'),
    false,
    'strategist (manager) must not be able to manage_billing'
  );
});

test('legacy-role-compat: legacy operator preserves read_operations access', () => {
  const legacyOperatorRole = 'operator';
  const iamRole = validateLegacyRole(legacyOperatorRole);

  assert.ok(
    canPerformAction(iamRole, 'read_operations'),
    'operator (tenant-admin) must be able to read_operations'
  );
});

test('legacy-role-compat: legacy owner maintains all permissions equivalence', () => {
  const legacyOwnerRole = 'owner';
  const iamRole = validateLegacyRole(legacyOwnerRole);

  const allActions = [
    'read_operations',
    'execute_task',
    'approve_task',
    'retry_task',
    'publish_campaign',
    'manage_billing',
    'manage_users',
    'access_analytics',
  ];

  allActions.forEach((action) => {
    assert.ok(
      canPerformAction(iamRole, action),
      `legacy owner must be able to perform ${action}`
    );
  });
});

// ============================================================================
// Compatibility Boundary Tests
// ============================================================================

test('legacy-role-compat: mixed tenant with legacy and IAM roles coexist', () => {
  // Simulate a tenant with mixed roles
  const membershipA = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    iam_role: 'manager', // native IAM role
    legacy_role: 'strategist',
  };

  const membershipB = {
    user_id: 'user-2',
    tenant_id: 'tenant-1',
    iam_role: 'owner', // native IAM role
    legacy_role: 'owner',
  };

  // Resolve IAM role in both cases (via iam_role field when available)
  // When legacy_role is used, it goes through mapping
  const roleBFromIam = membershipB.iam_role;
  const roleBFromLegacy = validateLegacyRole(membershipB.legacy_role);

  // Both should resolve to same effective permission level
  assert.equal(
    roleBFromIam,
    roleBFromLegacy,
    'Native IAM role and legacy role mapping must result in same permission level'
  );
});

// ============================================================================
// Null Safety Tests
// ============================================================================

test('legacy-role-compat: validateLegacyRole rejects null with deterministic error', () => {
  assert.throws(
    () => validateLegacyRole(null),
    (err) => {
      assert.ok(
        err.code === 'INVALID_LEGACY_ROLE_TYPE',
        'null must throw INVALID_LEGACY_ROLE_TYPE'
      );
      return true;
    }
  );
});

test('legacy-role-compat: validateLegacyRole rejects undefined with deterministic error', () => {
  assert.throws(
    () => validateLegacyRole(undefined),
    (err) => {
      assert.ok(
        err.code === 'INVALID_LEGACY_ROLE_TYPE',
        'undefined must throw INVALID_LEGACY_ROLE_TYPE'
      );
      return true;
    }
  );
});

test('legacy-role-compat: validateLegacyRole rejects non-string types', () => {
  const invalidInputs = [123, { role: 'owner' }, ['owner'], true];

  invalidInputs.forEach((input) => {
    assert.throws(
      () => validateLegacyRole(input),
      (err) => {
        assert.equal(err.code, 'INVALID_LEGACY_ROLE_TYPE');
        return true;
      },
      `validateLegacyRole must reject ${typeof input}`
    );
  });
});
