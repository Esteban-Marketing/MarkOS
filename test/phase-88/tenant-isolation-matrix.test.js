'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { checkOperatorViewScope, checkAgentViewScope } = require('../../onboarding/backend/vault/visibility-scope.cjs');
const { buildTenantBoundPageIndexScope } = require('../../onboarding/backend/vault/pageindex-scope.cjs');

const SAME_TENANT = 'tenant-alpha';
const OTHER_TENANT = 'tenant-beta';

test('operator and agent scopes allow same-tenant access for all retrieval modes', () => {
  const claimsOperator = { tenantId: SAME_TENANT, role: 'operator' };
  const claimsAgent = { tenantId: SAME_TENANT, role: 'agent' };

  assert.equal(checkOperatorViewScope(claimsOperator, { tenantId: SAME_TENANT }).allowed, true);
  assert.equal(checkAgentViewScope(claimsAgent, { tenantId: SAME_TENANT, strictAgentRole: true }).allowed, true);

  for (const mode of ['reason', 'apply', 'iterate']) {
    const scope = buildTenantBoundPageIndexScope({ claims: claimsAgent, resourceContext: { tenantId: SAME_TENANT }, mode });
    assert.equal(scope.mode, mode);
    assert.equal(scope.scope.query_scope, 'tenant-bound');
  }
});

test('cross-tenant operator and agent checks deny before data access', () => {
  const operator = checkOperatorViewScope({ tenantId: SAME_TENANT, role: 'operator' }, { tenantId: OTHER_TENANT });
  const agent = checkAgentViewScope({ tenantId: SAME_TENANT, role: 'agent' }, { tenantId: OTHER_TENANT, strictAgentRole: true });

  assert.equal(operator.allowed, false);
  assert.equal(operator.code, 'E_SCOPE_TENANT_MISMATCH');
  assert.equal(agent.allowed, false);
  assert.equal(agent.code, 'E_SCOPE_TENANT_MISMATCH');
});

test('pageindex scope helper rejects tenant mismatch and invalid mode', () => {
  assert.throws(
    () => buildTenantBoundPageIndexScope({ claims: { tenantId: SAME_TENANT }, resourceContext: { tenantId: OTHER_TENANT }, mode: 'reason' }),
    { code: 'E_SCOPE_TENANT_MISMATCH' }
  );

  assert.throws(
    () => buildTenantBoundPageIndexScope({ claims: { tenantId: SAME_TENANT }, resourceContext: { tenantId: SAME_TENANT }, mode: 'invalid' }),
    { code: 'E_PAGEINDEX_MODE_INVALID' }
  );
});
