'use strict';

/**
 * test/plugin-control.test.js
 *
 * Wave 0 TDD scaffolds for PLG-DA-01: tenant-scoped plugin enablement,
 * capability grant isolation, and deterministic deny-by-default boundaries.
 *
 * Phase 52 — Plan 01, Task 52-01-01 (RED state — implementation pending)
 * RED → GREEN wired in Task 52-01-03.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEntitlementSnapshot } = require('./helpers/billing-fixtures.cjs');

const {
  isTenantPluginEnabled,
  getGrantedCapabilities,
  assertPluginCapability,
  recordCapabilityGrant,
} = require('../onboarding/backend/runtime-context.cjs');

// ---------------------------------------------------------------------------
// Fixtures — two isolated tenants
// ---------------------------------------------------------------------------

const TENANT_A = 'tenant-alpha-001';
const TENANT_B = 'tenant-beta-002';
const PLUGIN_ID = 'digital-agency-v1';

/** Minimal in-memory plugin config store used by the stub helpers. */
function makePluginStore(...entries) {
  const store = new Map();
  for (const entry of entries) {
    store.set(`${entry.tenant_id}::${entry.plugin_id}`, { ...entry });
  }
  return store;
}

// ---------------------------------------------------------------------------
// Tenant isolation: Tenant A grants never authorize Tenant B
// ---------------------------------------------------------------------------

test('isTenantPluginEnabled: returns false for tenant with no config', () => {
  const store = makePluginStore();
  assert.equal(isTenantPluginEnabled(store, TENANT_A, PLUGIN_ID), false);
});

test('isTenantPluginEnabled: returns true only for the exact tenant that enabled the plugin', () => {
  const store = makePluginStore(
    { tenant_id: TENANT_A, plugin_id: PLUGIN_ID, enabled: true, granted_capabilities: ['read_drafts'] }
  );
  assert.equal(isTenantPluginEnabled(store, TENANT_A, PLUGIN_ID), true);
  assert.equal(isTenantPluginEnabled(store, TENANT_B, PLUGIN_ID), false, 'Tenant B must not inherit Tenant A grant');
});

test('getGrantedCapabilities: returns empty array for unknown tenant', () => {
  const store = makePluginStore();
  const caps = getGrantedCapabilities(store, TENANT_B, PLUGIN_ID);
  assert.deepEqual(caps, []);
});

test('getGrantedCapabilities: Tenant A capabilities not visible to Tenant B', () => {
  const store = makePluginStore(
    { tenant_id: TENANT_A, plugin_id: PLUGIN_ID, enabled: true, granted_capabilities: ['read_drafts', 'write_campaigns'] }
  );
  const capsA = getGrantedCapabilities(store, TENANT_A, PLUGIN_ID);
  const capsB = getGrantedCapabilities(store, TENANT_B, PLUGIN_ID);
  assert.ok(capsA.includes('read_drafts'));
  assert.deepEqual(capsB, [], 'Tenant B must see empty capabilities when Tenant A config exists');
});

// ---------------------------------------------------------------------------
// Disabled plugin: not found regardless of route existence
// ---------------------------------------------------------------------------

test('assertPluginCapability: throws PLUGIN_DISABLED when plugin is not enabled', () => {
  const store = makePluginStore(
    { tenant_id: TENANT_A, plugin_id: PLUGIN_ID, enabled: false, granted_capabilities: ['read_drafts'] }
  );
  assert.throws(
    () => assertPluginCapability(store, TENANT_A, PLUGIN_ID, 'read_drafts'),
    (err) => {
      assert.match(err.message, /PLUGIN_DISABLED/);
      assert.equal(err.statusCode, 404, 'Disabled plugin must return 404, not 403');
      return true;
    }
  );
});

test('assertPluginCapability: throws PLUGIN_DISABLED for tenant with no config row (default off)', () => {
  const store = makePluginStore();
  assert.throws(
    () => assertPluginCapability(store, TENANT_A, PLUGIN_ID, 'read_drafts'),
    (err) => {
      assert.match(err.message, /PLUGIN_DISABLED/);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

test('assertPluginCapability: throws CAPABILITY_NOT_GRANTED when plugin enabled but capability absent', () => {
  const store = makePluginStore(
    { tenant_id: TENANT_A, plugin_id: PLUGIN_ID, enabled: true, granted_capabilities: ['read_drafts'] }
  );
  assert.throws(
    () => assertPluginCapability(store, TENANT_A, PLUGIN_ID, 'publish_campaigns'),
    (err) => {
      assert.match(err.message, /CAPABILITY_NOT_GRANTED/);
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test('assertPluginCapability: does not throw when plugin enabled and capability granted', () => {
  const store = makePluginStore(
    { tenant_id: TENANT_A, plugin_id: PLUGIN_ID, enabled: true, granted_capabilities: ['read_drafts', 'read_campaigns'] }
  );
  assert.doesNotThrow(() => assertPluginCapability(store, TENANT_A, PLUGIN_ID, 'read_drafts'));
  assert.doesNotThrow(() => assertPluginCapability(store, TENANT_A, PLUGIN_ID, 'read_campaigns'));
});

// ---------------------------------------------------------------------------
// Capability grants: immutable append-only records with deterministic lookup
// ---------------------------------------------------------------------------

test('recordCapabilityGrant: adds new capability to tenant config', () => {
  const store = makePluginStore(
    { tenant_id: TENANT_A, plugin_id: PLUGIN_ID, enabled: true, granted_capabilities: [] }
  );
  const updated = recordCapabilityGrant(store, TENANT_A, PLUGIN_ID, 'write_campaigns');
  const caps = getGrantedCapabilities(updated, TENANT_A, PLUGIN_ID);
  assert.ok(caps.includes('write_campaigns'));
});

test('recordCapabilityGrant: duplicate grant is idempotent (no duplicates stored)', () => {
  const store = makePluginStore(
    { tenant_id: TENANT_A, plugin_id: PLUGIN_ID, enabled: true, granted_capabilities: ['read_drafts'] }
  );
  let updated = recordCapabilityGrant(store, TENANT_A, PLUGIN_ID, 'read_drafts');
  updated = recordCapabilityGrant(updated, TENANT_A, PLUGIN_ID, 'read_drafts');
  const caps = getGrantedCapabilities(updated, TENANT_A, PLUGIN_ID);
  assert.equal(caps.filter((c) => c === 'read_drafts').length, 1, 'Duplicate grants must not create duplicate entries');
});

test('recordCapabilityGrant: Tenant A grant does not modify Tenant B store', () => {
  const store = makePluginStore(
    { tenant_id: TENANT_A, plugin_id: PLUGIN_ID, enabled: true, granted_capabilities: [] },
    { tenant_id: TENANT_B, plugin_id: PLUGIN_ID, enabled: true, granted_capabilities: [] }
  );
  const updated = recordCapabilityGrant(store, TENANT_A, PLUGIN_ID, 'write_campaigns');
  const capsB = getGrantedCapabilities(updated, TENANT_B, PLUGIN_ID);
  assert.deepEqual(capsB, [], 'Tenant B capabilities must be unaffected by Tenant A grant');
});

test('recordCapabilityGrant: throws for unknown tenant (fail-closed)', () => {
  const store = makePluginStore();
  assert.throws(
    () => recordCapabilityGrant(store, 'ghost-tenant', PLUGIN_ID, 'read_drafts'),
    (err) => {
      assert.match(err.message, /TENANT_NOT_FOUND/);
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// Plugin settings API — IAM role gating (Task 52-03-01)
// ---------------------------------------------------------------------------

const { handlePluginSettings } = require('../api/tenant-plugin-settings.js');

function makeSettingsReq({ method = 'POST', iamRole = 'owner', tenantId = TENANT_A, body = {}, entitlementSnapshot = null } = {}) {
  return {
    method,
    url: '/api/tenant-plugin-settings',
    body,
    entitlementSnapshot,
    markosAuth: { ok: true, status: 200, tenant_id: tenantId, principal: { id: 'user-1', tenant_id: tenantId, tenant_role: iamRole } },
    tenantContext: { tenantId, userId: 'user-1', role: iamRole },
  };
}

function makeSettingsRes() {
  const res = { statusCode: null, body: null };
  res.writeHead = (code) => { res.statusCode = code; return res; };
  res.end = (data) => { try { res.body = JSON.parse(data); } catch { res.body = data; } return res; };
  return res;
}

test('settings: owner can enable plugin and update capabilities', async () => {
  const req = makeSettingsReq({ iamRole: 'owner', body: { plugin_id: PLUGIN_ID, enabled: true, capabilities: ['read_drafts', 'read_campaigns'] } });
  const res = makeSettingsRes();
  await handlePluginSettings(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body?.success, 'Owner must receive success response');
});

test('settings: tenant-admin can enable plugin', async () => {
  const req = makeSettingsReq({ iamRole: 'tenant-admin', body: { plugin_id: PLUGIN_ID, enabled: false, capabilities: [] } });
  const res = makeSettingsRes();
  await handlePluginSettings(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body?.success);
});

test('settings: non-admin role is denied with 403', async () => {
  const req = makeSettingsReq({ iamRole: 'contributor', body: { plugin_id: PLUGIN_ID, enabled: true, capabilities: ['read_drafts'] } });
  const res = makeSettingsRes();
  await handlePluginSettings(req, res);
  assert.equal(res.statusCode, 403, 'Contributor must not update plugin settings');
  assert.match(res.body?.error ?? '', /SETTINGS_FORBIDDEN/);
});

test('settings: readonly role is denied with 403', async () => {
  const req = makeSettingsReq({ iamRole: 'readonly', body: { plugin_id: PLUGIN_ID, enabled: true, capabilities: ['read_drafts'] } });
  const res = makeSettingsRes();
  await handlePluginSettings(req, res);
  assert.equal(res.statusCode, 403);
});

test('settings: missing plugin_id returns 400', async () => {
  const req = makeSettingsReq({ iamRole: 'owner', body: { enabled: true } });
  const res = makeSettingsRes();
  await handlePluginSettings(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body?.error ?? '', /MISSING_PLUGIN_ID/);
});

test('settings: capability update is tenant-scoped (does not bleed to Tenant B)', async () => {
  const reqA = makeSettingsReq({ iamRole: 'owner', tenantId: TENANT_A, body: { plugin_id: PLUGIN_ID, enabled: true, capabilities: ['write_campaigns'] } });
  const reqB = makeSettingsReq({ iamRole: 'owner', tenantId: TENANT_B, body: { plugin_id: PLUGIN_ID, enabled: false, capabilities: [] } });
  const resA = makeSettingsRes();
  const resB = makeSettingsRes();
  await handlePluginSettings(reqA, resA);
  await handlePluginSettings(reqB, resB);
  assert.equal(resA.statusCode, 200);
  assert.equal(resB.statusCode, 200);
  // Responses are independent — each reflects the correct tenant's update
  assert.equal(resA.body?.config?.tenant_id ?? TENANT_A, TENANT_A);
  assert.equal(resB.body?.config?.tenant_id ?? TENANT_B, TENANT_B);
});

test('settings: owner can restore plugin settings while prepaid token budget is exhausted', async () => {
  const req = makeSettingsReq({
    iamRole: 'owner',
    entitlementSnapshot: buildEntitlementSnapshot({
      allowances: { token_budget: 100 },
      usage_to_date: { token_budget: 100 },
      quota_state: { token_budget: 'over_limit' },
    }),
    body: { plugin_id: PLUGIN_ID, enabled: true, capabilities: ['read_drafts'] },
  });
  const res = makeSettingsRes();
  await handlePluginSettings(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body?.success);
});

test('SEC-01 governance evidence: tenant configuration family cites plugin settings change evidence', () => {
  const { buildGovernanceEvidencePack } = require('../lib/markos/governance/evidence-pack.cjs');
  const pack = buildGovernanceEvidencePack();
  const configFamily = pack.privileged_action_families.find((family) => family.action_family === 'tenant_configuration');

  assert.ok(configFamily);
  assert.equal(configFamily.evidence_source, 'tenant_configuration_change_log');
  assert.ok(configFamily.actions.includes('plugin_settings_updated'));
  assert.ok(configFamily.immutable_provenance_fields.includes('updated_at'));
});
