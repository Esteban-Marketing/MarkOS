const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildExternalRoleClaim,
  buildTenantSsoBinding,
} = require('../helpers/billing-fixtures.cjs');

const roleMappingPath = path.join(__dirname, '../../lib/markos/identity/role-mapping.ts');
const callbackHandlerPath = path.join(__dirname, '../../api/auth/sso/callback.js');
const startHandlerPath = path.join(__dirname, '../../api/auth/sso/start.js');
const runtimeContextPath = path.join(__dirname, '../../onboarding/backend/runtime-context.cjs');
const { buildGovernanceEvidencePack } = require('../../lib/markos/governance/evidence-pack.cjs');

test('IAM-04 sso deny: escalation claims are rejected by canonical mapping rules', () => {
  const binding = buildTenantSsoBinding();
  const claim = buildExternalRoleClaim({ claim_value: 'markos-super-admin' });
  const source = fs.existsSync(roleMappingPath) ? fs.readFileSync(roleMappingPath, 'utf8') : '';

  assert.equal(binding.tenant_id, 'tenant-alpha-001');
  assert.equal(claim.claim_value, 'markos-super-admin');
  assert.match(source, /EXTERNAL_ROLE_ESCALATION_DENIED/);
  assert.match(source, /canonical_role:\s*null|canonicalRole:\s*null/);
});

test('IAM-04 sso callback deny: negative-path decisions remain bound to tenant and correlation evidence', () => {
  const source = fs.existsSync(callbackHandlerPath) ? fs.readFileSync(callbackHandlerPath, 'utf8') : '';

  assert.match(source, /mapExternalClaimsToRole/);
  assert.match(source, /recordRoleMappingDecision/);
  assert.match(source, /tenant_id|tenantId/);
  assert.match(source, /correlation_id|correlationId/);
});

test('IAM-04 sso provider binding: start handler fails closed when tenant provider binding is unavailable', () => {
  const source = fs.existsSync(startHandlerPath) ? fs.readFileSync(startHandlerPath, 'utf8') : '';

  assert.match(source, /TENANT_SSO_BINDING_NOT_FOUND|SSO_BINDING_NOT_FOUND/);
  assert.match(source, /resolveTenantSsoBinding/);
  assert.match(source, /tenant_id|tenantId/);
});

test('IAM-04 sso deny: runtime context exposes immutable identity mapping evidence helpers', () => {
  const source = fs.readFileSync(runtimeContextPath, 'utf8');

  assert.match(source, /buildIdentityMappingEvidence/);
  assert.match(source, /emitIdentityMappingTelemetry/);
  assert.match(source, /markos_identity_role_mapping_(granted|denied)/);
});

test('SEC-01 governance evidence: auth and authz family cites immutable role-mapping evidence', () => {
  const pack = buildGovernanceEvidencePack();
  const authFamily = pack.privileged_action_families.find((family) => family.action_family === 'authentication_authorization');

  assert.ok(authFamily);
  assert.equal(authFamily.evidence_source, 'identity_role_mapping_events');
  assert.ok(authFamily.actions.includes('sso_role_mapping_denied'));
  assert.ok(authFamily.immutable_provenance_fields.includes('correlation_id'));
});