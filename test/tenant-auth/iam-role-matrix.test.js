import test from 'node:test';
import assert from 'node:assert/strict';

const { 
  IAM_V32_ROLES, 
  ACTION_POLICY, 
  canPerformAction 
} = await import('../../lib/markos/rbac/iam-v32.js');

// ============================================================================
// Contract Tests: IAM v3.2 Module Exports
// ============================================================================

test('iam-v32: exports IAM_V32_ROLES array with all 7 canonical roles', () => {
  assert.ok(Array.isArray(IAM_V32_ROLES), 'IAM_V32_ROLES must be an array');
  const expectedRoles = [
    'owner',
    'tenant-admin',
    'manager',
    'contributor',
    'reviewer',
    'billing-admin',
    'readonly',
  ];
  expectedRoles.forEach((role) => {
    assert.ok(
      IAM_V32_ROLES.includes(role),
      `IAM_V32_ROLES must include '${role}'`
    );
  });
  assert.equal(
    IAM_V32_ROLES.length,
    7,
    'IAM_V32_ROLES must have exactly 7 roles'
  );
});

test('iam-v32: exports ACTION_POLICY mapping actions to allowed roles', () => {
  assert.ok(typeof ACTION_POLICY === 'object', 'ACTION_POLICY must be an object');
  assert.ok(!Array.isArray(ACTION_POLICY), 'ACTION_POLICY must not be an array');
  
  // Verify action keys exist
  const expectedActions = [
    'read_operations',
    'execute_task',
    'approve_task',
    'retry_task',
    'publish_campaign',
    'manage_billing',
    'manage_users',
    'access_analytics',
  ];
  
  expectedActions.forEach((action) => {
    assert.ok(
      ACTION_POLICY[action],
      `ACTION_POLICY must define policy for action '${action}'`
    );
    assert.ok(
      Array.isArray(ACTION_POLICY[action]),
      `ACTION_POLICY['${action}'] must be an array of roles`
    );
  });
});

test('iam-v32: exports canPerformAction(role, action) function', () => {
  assert.equal(
    typeof canPerformAction,
    'function',
    'canPerformAction must be a function'
  );
});

// ============================================================================
// Role x Action Matrix Coverage Tests
// ============================================================================

test('iam-v32: owner role can perform all protected actions', () => {
  const owner = 'owner';
  const protectedActions = [
    'read_operations',
    'execute_task',
    'approve_task',
    'publish_campaign',
    'manage_billing',
    'manage_users',
    'access_analytics',
  ];
  
  protectedActions.forEach((action) => {
    assert.ok(
      canPerformAction(owner, action),
      `owner must be able to perform '${action}'`
    );
  });
});

test('iam-v32: tenant-admin can perform admin and operational actions', () => {
  const tenantAdmin = 'tenant-admin';
  const expectedAllowed = [
    'read_operations',
    'execute_task',
    'approve_task',
    'manage_users',
  ];
  const expectedDenied = ['manage_billing'];
  
  expectedAllowed.forEach((action) => {
    assert.ok(
      canPerformAction(tenantAdmin, action),
      `tenant-admin must be able to perform '${action}'`
    );
  });

  expectedDenied.forEach((action) => {
    assert.equal(
      canPerformAction(tenantAdmin, action),
      false,
      `tenant-admin must NOT be able to perform '${action}'`
    );
  });
});

test('iam-v32: manager can perform campaign and content operations', () => {
  const manager = 'manager';
  const expectedAllowed = [
    'read_operations',
    'execute_task',
    'publish_campaign',
    'access_analytics',
  ];
  
  expectedAllowed.forEach((action) => {
    assert.ok(
      canPerformAction(manager, action),
      `manager must be able to perform '${action}'`
    );
  });
});

test('iam-v32: contributor can create and edit content but not approve', () => {
  const contributor = 'contributor';
  const expectedAllowed = [
    'read_operations',
    'access_analytics',
  ];
  const expectedDenied = [
    'approve_task',
    'manage_users',
    'manage_billing',
    'execute_task',
  ];
  
  expectedAllowed.forEach((action) => {
    assert.ok(
      canPerformAction(contributor, action),
      `contributor must be able to perform '${action}'`
    );
  });

  expectedDenied.forEach((action) => {
    assert.equal(
      canPerformAction(contributor, action),
      false,
      `contributor must NOT be able to perform '${action}'`
    );
  });
});

test('iam-v32: reviewer can only approve and read', () => {
  const reviewer = 'reviewer';
  const expectedAllowed = [
    'read_operations',
    'approve_task',
    'access_analytics',
  ];
  const expectedDenied = [
    'execute_task',
    'retry_task',
    'publish_campaign',
    'manage_billing',
    'manage_users',
  ];
  
  expectedAllowed.forEach((action) => {
    assert.ok(
      canPerformAction(reviewer, action),
      `reviewer must be able to perform '${action}'`
    );
  });

  expectedDenied.forEach((action) => {
    assert.equal(
      canPerformAction(reviewer, action),
      false,
      `reviewer must NOT be able to perform '${action}'`
    );
  });
});

test('iam-v32: billing-admin can manage billing and access analytics', () => {
  const billingAdmin = 'billing-admin';
  const expectedAllowed = [
    'read_operations',
    'manage_billing',
    'access_analytics',
  ];
  const expectedDenied = [
    'execute_task',
    'approve_task',
    'publish_campaign',
    'manage_users',
  ];
  
  expectedAllowed.forEach((action) => {
    assert.ok(
      canPerformAction(billingAdmin, action),
      `billing-admin must be able to perform '${action}'`
    );
  });

  expectedDenied.forEach((action) => {
    assert.equal(
      canPerformAction(billingAdmin, action),
      false,
      `billing-admin must NOT be able to perform '${action}'`
    );
  });
});

test('iam-v32: readonly can only read and access analytics', () => {
  const readonly = 'readonly';
  const expectedAllowed = [
    'read_operations',
    'access_analytics',
  ];
  const expectedDenied = [
    'execute_task',
    'approve_task',
    'retry_task',
    'publish_campaign',
    'manage_billing',
    'manage_users',
  ];
  
  expectedAllowed.forEach((action) => {
    assert.ok(
      canPerformAction(readonly, action),
      `readonly must be able to perform '${action}'`
    );
  });

  expectedDenied.forEach((action) => {
    assert.equal(
      canPerformAction(readonly, action),
      false,
      `readonly must NOT be able to perform '${action}'`
    );
  });
});

// ============================================================================
// Default Deny Tests
// ============================================================================

test('iam-v32: unknown roles are denied all actions', () => {
  const unknownRole = 'unknown-role-xyz';
  const anyAction = 'read_operations';
  
  assert.equal(
    canPerformAction(unknownRole, anyAction),
    false,
    `unknown role must be denied any action (fail-closed)`
  );
});

test('iam-v32: unknown actions are denied all roles', () => {
  const anyRole = 'owner';
  const unknownAction = 'unknown-action-xyz';
  
  assert.equal(
    canPerformAction(anyRole, unknownAction),
    false,
    `any role must be denied unknown action (fail-closed)`
  );
});

test('iam-v32: null or undefined inputs are denied', () => {
  assert.equal(
    canPerformAction(null, 'read_operations'),
    false,
    'null role must be denied'
  );
  assert.equal(
    canPerformAction('owner', null),
    false,
    'null action must be denied'
  );
  assert.equal(
    canPerformAction(undefined, 'read_operations'),
    false,
    'undefined role must be denied'
  );
  assert.equal(
    canPerformAction('owner', undefined),
    false,
    'undefined action must be denied'
  );
});

// ============================================================================
// Idempotency Tests
// ============================================================================

test('iam-v32: canPerformAction results are deterministic', () => {
  const role = 'manager';
  const action = 'publish_campaign';
  const result1 = canPerformAction(role, action);
  const result2 = canPerformAction(role, action);
  
  assert.equal(
    result1,
    result2,
    'canPerformAction must return same result for identical inputs'
  );
});
