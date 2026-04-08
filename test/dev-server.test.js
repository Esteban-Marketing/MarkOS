'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  buildLocalAuthContext,
  buildPluginTenantContext,
  resolveLegacyApiRoute,
  resolveOnboardingAssetPath,
} = require('../bin/dev-server.cjs');
const { requireHostedSupabaseAuth } = require('../onboarding/backend/runtime-context.cjs');

test('resolveLegacyApiRoute resolves billing API modules and onboarding aliases', () => {
  const billingPath = resolveLegacyApiRoute('/api/billing/tenant-summary');
  const aliasPath = resolveLegacyApiRoute('/config');

  assert.equal(billingPath, path.join(process.cwd(), 'api', 'billing', 'tenant-summary.js'));
  assert.equal(aliasPath, path.join(process.cwd(), 'api', 'config.js'));
});

test('resolveOnboardingAssetPath keeps onboarding assets reachable under unified dev server', () => {
  const onboardingIndex = resolveOnboardingAssetPath('/onboarding');
  const onboardingScript = resolveOnboardingAssetPath('/onboarding.js');

  assert.equal(onboardingIndex, path.join(process.cwd(), 'onboarding', 'index.html'));
  assert.equal(onboardingScript, path.join(process.cwd(), 'onboarding', 'onboarding.js'));
});

test('buildPluginTenantContext defaults plugin access on for local runtime probes', () => {
  const pluginContext = buildPluginTenantContext({
    MARKOS_ACTIVE_ROLE: 'owner',
    MARKOS_ACTIVE_TENANT_ID: 'tenant-local-001',
    MARKOS_ACTIVE_USER_ID: 'user-local-001',
  });

  assert.equal(pluginContext.tenantId, 'tenant-local-001');
  assert.equal(pluginContext.role, 'owner');
  assert.equal(pluginContext.pluginEnabled, true);
  assert.ok(pluginContext.grantedCapabilities.includes('read_campaigns'));
  assert.ok(pluginContext.grantedCapabilities.includes('publish_campaigns'));
});

test('requireHostedSupabaseAuth local fallback inherits active tenant and role', () => {
  const auth = requireHostedSupabaseAuth({
    env: {
      MARKOS_ACTIVE_ROLE: 'billing-admin',
      MARKOS_ACTIVE_TENANT_ID: 'tenant-local-002',
      MARKOS_ACTIVE_USER_ID: 'user-local-002',
    },
    operation: 'status_read',
    req: { headers: {}, method: 'GET', url: '/api/billing/operator-reconciliation' },
    runtimeContext: { mode: 'local' },
  });

  assert.equal(auth.ok, true);
  assert.equal(auth.tenant_id, 'tenant-local-002');
  assert.equal(auth.iamRole, 'billing-admin');
  assert.equal(auth.principal.id, 'user-local-002');
  assert.equal(auth.principal.tenant_role, 'billing-admin');
});

test('buildLocalAuthContext exposes stable local operator defaults', () => {
  const auth = buildLocalAuthContext({});

  assert.equal(auth.tenant_id, 'tenant-alpha-001');
  assert.equal(auth.role, 'owner');
  assert.equal(auth.principal.type, 'runtime_local');
});