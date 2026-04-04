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
const roleMappingPath = path.join(__dirname, '../../lib/markos/identity/role-mapping.ts');
const ssoBindingsPath = path.join(__dirname, '../../lib/markos/identity/sso-bindings.ts');
const federationMigrationPath = path.join(__dirname, '../../supabase/migrations/54_identity_federation.sql');

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

test('IAM-04: sso role mapping exports canonical claim mapping helpers', () => {
  assert.equal(fs.existsSync(roleMappingPath), true, 'role-mapping.ts must exist');

  const source = fs.readFileSync(roleMappingPath, 'utf8');
  assert.match(source, /export function mapExternalClaimsToRole/);
  assert.match(source, /export function recordRoleMappingDecision/);
  assert.match(source, /IAM_V32_ROLES|canPerformAction/);
  assert.match(source, /EXTERNAL_ROLE_ESCALATION_DENIED|UNMAPPED_EXTERNAL_CLAIM/);
});

test('IAM-04: tenant sso bindings encode provider metadata and tenant scoping', () => {
  assert.equal(fs.existsSync(ssoBindingsPath), true, 'sso-bindings.ts must exist');

  const source = fs.readFileSync(ssoBindingsPath, 'utf8');
  assert.match(source, /export function normalizeTenantSsoBinding/);
  assert.match(source, /export function resolveTenantSsoBinding/);
  assert.match(source, /tenant_id/);
  assert.match(source, /sso_provider_id/);
});

test('IAM-04: identity federation migration creates binding, rule, and immutable mapping event tables', () => {
  assert.equal(fs.existsSync(federationMigrationPath), true, '54_identity_federation.sql must exist');

  const source = fs.readFileSync(federationMigrationPath, 'utf8');
  assert.match(source, /create table if not exists tenant_sso_bindings/i);
  assert.match(source, /create table if not exists identity_role_mapping_rules/i);
  assert.match(source, /create table if not exists identity_role_mapping_events/i);
  assert.match(source, /enable row level security/i);
});