'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  checkOperatorViewScope,
  checkAgentViewScope,
} = require('../../onboarding/backend/vault/role-views.cjs');

test('operator claims pass operator-view checks and fail agent-only action checks when configured', async () => {
  const allowed = checkOperatorViewScope(
    { tenantId: 'tenant-alpha', role: 'operator' },
    { tenantId: 'tenant-alpha' }
  );
  assert.equal(allowed.allowed, true);

  const denied = checkAgentViewScope(
    { tenantId: 'tenant-alpha', role: 'operator' },
    { tenantId: 'tenant-alpha', strictAgentRole: true }
  );
  assert.equal(denied.allowed, false);
  assert.equal(denied.code, 'E_SCOPE_ROLE_DENIED');
});

test('agent claims pass retrieval-view checks and fail management-only checks', async () => {
  const allowed = checkAgentViewScope(
    { tenantId: 'tenant-alpha', role: 'agent' },
    { tenantId: 'tenant-alpha' }
  );
  assert.equal(allowed.allowed, true);

  const denied = checkOperatorViewScope(
    { tenantId: 'tenant-alpha', role: 'agent' },
    { tenantId: 'tenant-alpha' }
  );
  assert.equal(denied.allowed, false);
  assert.equal(denied.code, 'E_SCOPE_ROLE_DENIED');
});

test('tenant mismatch rejects for both views before data access', async () => {
  const operatorDenied = checkOperatorViewScope(
    { tenantId: 'tenant-alpha', role: 'operator' },
    { tenantId: 'tenant-beta' }
  );
  assert.equal(operatorDenied.allowed, false);
  assert.equal(operatorDenied.code, 'E_SCOPE_TENANT_MISMATCH');

  const agentDenied = checkAgentViewScope(
    { tenantId: 'tenant-alpha', role: 'agent' },
    { tenantId: 'tenant-beta' }
  );
  assert.equal(agentDenied.allowed, false);
  assert.equal(agentDenied.code, 'E_SCOPE_TENANT_MISMATCH');
});

test('unauthorized roles fail closed with explicit error codes', async () => {
  const operatorDenied = checkOperatorViewScope(
    { tenantId: 'tenant-alpha', role: 'viewer' },
    { tenantId: 'tenant-alpha' }
  );
  assert.equal(operatorDenied.allowed, false);
  assert.equal(operatorDenied.code, 'E_SCOPE_ROLE_DENIED');

  const agentDenied = checkAgentViewScope(
    { tenantId: 'tenant-alpha', role: 'viewer' },
    { tenantId: 'tenant-alpha' }
  );
  assert.equal(agentDenied.allowed, false);
  assert.equal(agentDenied.code, 'E_SCOPE_ROLE_DENIED');
});
