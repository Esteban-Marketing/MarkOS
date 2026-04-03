const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildExternalRoleClaim,
  buildTenantSsoBinding,
} = require('../helpers/billing-fixtures.cjs');
const {
  mapExternalClaimsToCanonicalRole,
} = require('../../lib/markos/identity/sso-mapping.cjs');

test('IAM-04: escalation claims that do not match canonical mapping rules are denied with audit reason', () => {
  const binding = buildTenantSsoBinding();
  const claim = buildExternalRoleClaim({ claim_value: 'markos-super-admin' });

  const decision = mapExternalClaimsToCanonicalRole({
    binding,
    claims: [claim],
    requested_role: 'owner',
  });

  assert.equal(decision.decision, 'denied');
  assert.equal(decision.canonical_role, null);
  assert.equal(decision.denial_reason, 'EXTERNAL_ROLE_ESCALATION_DENIED');
});

test('IAM-04: negative-path decisions remain bound to tenant and correlation evidence', () => {
  const binding = buildTenantSsoBinding();
  const decision = mapExternalClaimsToCanonicalRole({
    binding,
    claims: [],
    requested_role: 'billing-admin',
  });

  assert.equal(decision.tenant_id, 'tenant-alpha-001');
  assert.equal(decision.correlation_id, 'corr-identity-001');
  assert.equal(decision.decision, 'denied');
});