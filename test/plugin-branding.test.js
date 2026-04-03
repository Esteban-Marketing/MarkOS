'use strict';

/**
 * test/plugin-branding.test.js
 *
 * TDD scaffolds for Phase 52 WL-01/02/03 + PLG-DA-01 branding tasks.
 * Covers: plugin brand token inheritance, notification payload branding,
 * and domain-agnostic tenant routing (custom domain vs shared domain parity).
 *
 * Phase 52 — Plan 03, Task 52-03-02 (RED scaffolds committed first)
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getPluginBrandContext,
  buildPluginNotificationPayload,
} = require('../lib/markos/plugins/brand-context.js');

const {
  resolveTenantFromDomain,
} = require('../onboarding/backend/runtime-context.cjs');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-alpha-001';

const MOCK_BRAND_PACK = {
  tenantId: TENANT_ID,
  label: 'Acme Corp',
  logoUrl: 'https://cdn.acme.io/logo.png',
  overrides: {
    'color.action.primary': '#1a56db',
    'color.action.primaryText': '#ffffff',
  },
};

// ---------------------------------------------------------------------------
// getPluginBrandContext — brand token inheritance for plugin surfaces
// ---------------------------------------------------------------------------

test('brand: getPluginBrandContext returns tenantId and pluginNamespace', () => {
  const ctx = getPluginBrandContext(TENANT_ID, MOCK_BRAND_PACK);
  assert.equal(ctx.tenantId, TENANT_ID);
  assert.equal(typeof ctx.pluginNamespace, 'string');
  assert.ok(ctx.pluginNamespace.includes('digital-agency') || ctx.pluginNamespace.includes('plugin'), 'pluginNamespace should identify the plugin context');
});

test('brand: getPluginBrandContext inherits primaryColor from brand-pack overrides', () => {
  const ctx = getPluginBrandContext(TENANT_ID, MOCK_BRAND_PACK);
  assert.equal(ctx.primaryColor, '#1a56db', 'Should inherit color.action.primary from brand-pack overrides');
});

test('brand: getPluginBrandContext includes logo from brand-pack', () => {
  const ctx = getPluginBrandContext(TENANT_ID, MOCK_BRAND_PACK);
  assert.equal(ctx.logoUrl, 'https://cdn.acme.io/logo.png');
});

test('brand: getPluginBrandContext falls back to default accent when no overrides provided', () => {
  const minimalPack = { tenantId: TENANT_ID, label: 'Minimal', overrides: {} };
  const ctx = getPluginBrandContext(TENANT_ID, minimalPack);
  assert.equal(typeof ctx.primaryColor, 'string', 'primaryColor must always be a non-empty string');
  assert.ok(ctx.primaryColor.length > 0);
});

test('brand: getPluginBrandContext does not expose raw brand-pack overrides directly', () => {
  const ctx = getPluginBrandContext(TENANT_ID, MOCK_BRAND_PACK);
  assert.ok(!ctx.overrides, 'Raw overrides object must not be passed through unmasked');
});

// ---------------------------------------------------------------------------
// buildPluginNotificationPayload — notifications carry brand context
// ---------------------------------------------------------------------------

test('brand: buildPluginNotificationPayload includes primary and logoUrl from brand context', () => {
  const ctx = getPluginBrandContext(TENANT_ID, MOCK_BRAND_PACK);
  const payload = buildPluginNotificationPayload({
    type: 'approval:granted',
    subject: 'Campaign approved',
    body: 'Your Q4 campaign has been approved.',
    recipientId: 'user-99',
  }, ctx);
  assert.equal(payload.brand.primaryColor, ctx.primaryColor);
  assert.equal(payload.brand.logoUrl, ctx.logoUrl);
  assert.equal(payload.brand.tenantId, TENANT_ID);
});

test('brand: buildPluginNotificationPayload preserves original notification content', () => {
  const ctx = getPluginBrandContext(TENANT_ID, MOCK_BRAND_PACK);
  const payload = buildPluginNotificationPayload({
    type: 'campaign:published',
    subject: 'Campaign live',
    body: 'Q4 is live.',
    recipientId: 'user-1',
  }, ctx);
  assert.equal(payload.subject, 'Campaign live');
  assert.equal(payload.body, 'Q4 is live.');
  assert.equal(payload.recipientId, 'user-1');
  assert.equal(payload.type, 'campaign:published');
});

// ---------------------------------------------------------------------------
// resolveTenantFromDomain — custom domain and shared domain parity
// ---------------------------------------------------------------------------

const DOMAIN_MAP = new Map([
  ['acme.markos.io', 'tenant-alpha-001'],
  ['mycustomdomain.com', 'tenant-alpha-001'],
  ['beta.markos.io', 'tenant-beta-002'],
]);

test('domain: shared subdomain resolves to correct tenant', () => {
  const tenantId = resolveTenantFromDomain('acme.markos.io', DOMAIN_MAP);
  assert.equal(tenantId, 'tenant-alpha-001');
});

test('domain: custom domain resolves to correct tenant', () => {
  const tenantId = resolveTenantFromDomain('mycustomdomain.com', DOMAIN_MAP);
  assert.equal(tenantId, 'tenant-alpha-001');
});

test('domain: shared and custom domain for same tenant resolve to same tenant_id', () => {
  const fromShared = resolveTenantFromDomain('acme.markos.io', DOMAIN_MAP);
  const fromCustom = resolveTenantFromDomain('mycustomdomain.com', DOMAIN_MAP);
  assert.equal(fromShared, fromCustom, 'Custom and shared domains must resolve to the same tenant_id');
});

test('domain: unknown domain returns null (fail-closed)', () => {
  const tenantId = resolveTenantFromDomain('unknown.example.com', DOMAIN_MAP);
  assert.equal(tenantId, null);
});

test('domain: empty hostname returns null (fail-closed)', () => {
  const tenantId = resolveTenantFromDomain('', DOMAIN_MAP);
  assert.equal(tenantId, null);
});

test('domain: different tenants on different subdomains are isolated', () => {
  const tenantA = resolveTenantFromDomain('acme.markos.io', DOMAIN_MAP);
  const tenantB = resolveTenantFromDomain('beta.markos.io', DOMAIN_MAP);
  assert.notEqual(tenantA, tenantB, 'Different subdomains must not resolve to the same tenant');
});
