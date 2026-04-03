const test = require('node:test');
const assert = require('node:assert/strict');

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');

test('53-02-01: approve_task allows reviewer-authorized IAM roles only', () => {
  const allowedRoles = ['owner', 'tenant-admin', 'manager', 'reviewer'];
  const deniedRoles = ['contributor', 'billing-admin', 'readonly', 'member', ''];

  for (const role of allowedRoles) {
    assert.equal(canPerformAction(role, 'approve_task'), true, `Expected role ${role} to be authorized for approve_task`);
  }

  for (const role of deniedRoles) {
    assert.equal(canPerformAction(role, 'approve_task'), false, `Expected role ${role || '<empty>'} to be denied for approve_task`);
  }
});

test('53-02-01: IAM policy check remains fail-closed for unknown actions and roles', () => {
  assert.equal(canPerformAction('reviewer', 'unknown_action'), false);
  assert.equal(canPerformAction('unknown_role', 'approve_task'), false);
  assert.equal(canPerformAction(null, 'approve_task'), false);
  assert.equal(canPerformAction('reviewer', null), false);
});