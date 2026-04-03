const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildExternalRoleClaim,
  buildIdentityRoleMappingDecision,
  buildTenantSsoBinding,
} = require('../helpers/billing-fixtures.cjs');

const identityContractsPath = path.join(__dirname, '../../lib/markos/identity/contracts.ts');

test('IAM-04: identity contracts lock tenant SSO binding and canonical role mapping vocabulary', () => {
  const source = fs.readFileSync(identityContractsPath, 'utf8');

  assert.match(source, /export type TenantSsoBinding/);
  assert.match(source, /export type ExternalRoleClaim/);
  assert.match(source, /export type IdentityRoleMappingDecision/);
  assert.match(source, /canonical_role/);
});

test('IAM-04: fixture builders encode tenant SSO binding with deterministic provider metadata', () => {
  const binding = buildTenantSsoBinding();
  const claim = buildExternalRoleClaim();

  assert.equal(binding.tenant_id, 'tenant-alpha-001');
  assert.equal(binding.sso_provider_id, 'sso-provider-acme');
  assert.equal(claim.claim_type, 'group');
  assert.equal(claim.claim_value, 'markos-billing-admin');
});

test('IAM-04: role mapping decisions resolve only to canonical IAM v3.2 roles', async () => {
  const { IAM_V32_ROLES } = await import('../../lib/markos/rbac/iam-v32.js');
  const decision = buildIdentityRoleMappingDecision();

  assert.ok(IAM_V32_ROLES.includes(decision.canonical_role));
  assert.equal(decision.external_permission_set, undefined);
  assert.equal(decision.decision, 'granted');
});