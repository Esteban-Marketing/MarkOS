'use strict';

/**
 * test/digital-agency.test.js
 *
 * TDD contracts for Phase 52 Digital Agency plugin (PLG-DA-02).
 * Covers: route existence, authorization deny-by-default, plugin disabled 404,
 * campaign workflow lifecycle, and cross-tenant isolation.
 *
 * Phase 52 — Plan 02, Task 52-02-01/02 (RED scaffolds committed first)
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  digitalAgencyPlugin,
} = require('../lib/markos/plugins/digital-agency/index.js');

const {
  handleDashboard,
} = require('../lib/markos/plugins/digital-agency/routes/dashboard.js');

const {
  handleDrafts,
} = require('../lib/markos/plugins/digital-agency/routes/drafts.js');

const {
  handleAssembleCampaign,
  handlePublishCampaign,
} = require('../lib/markos/plugins/digital-agency/routes/campaigns.js');

const {
  handleApprovalGranted,
  handleCampaignPublished,
} = require('../lib/markos/plugins/digital-agency/handlers/events.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  res.end = () => res;
  return res;
}

function makeTenantContext({ tenantId = 'tenant-alpha-001', role = 'manager', enabled = true, capabilities = ['read_drafts', 'read_campaigns', 'write_campaigns', 'publish_campaigns', 'read_approvals', 'write_approvals'] } = {}) {
  return Object.freeze({ tenantId, userId: 'user-1', role, pluginEnabled: enabled, grantedCapabilities: capabilities });
}

// ---------------------------------------------------------------------------
// Task 52-02-01: Plugin manifest and route registration
// ---------------------------------------------------------------------------

test('plugin: digitalAgencyPlugin exports a valid plugin contract', () => {
  assert.ok(digitalAgencyPlugin, 'digitalAgencyPlugin must be exported');
  assert.equal(typeof digitalAgencyPlugin.id, 'string');
  assert.equal(typeof digitalAgencyPlugin.version, 'string');
  assert.equal(typeof digitalAgencyPlugin.name, 'string');
  assert.ok(Array.isArray(digitalAgencyPlugin.requiredCapabilities));
  assert.ok(Array.isArray(digitalAgencyPlugin.requiredIamRoles));
  assert.ok(Array.isArray(digitalAgencyPlugin.routes));
  assert.ok(digitalAgencyPlugin.routes.length >= 4, 'Must declare at least 4 routes');
});

test('plugin: all routes have path, method, handler, and requiredCapability', () => {
  for (const route of digitalAgencyPlugin.routes) {
    assert.equal(typeof route.path, 'string', `route path must be string: ${JSON.stringify(route)}`);
    assert.match(route.path, /^\/plugins\/digital-agency/, `route path must start with /plugins/digital-agency: ${route.path}`);
    assert.ok(['GET', 'POST', 'PUT', 'DELETE'].includes(route.method), `route method must be HTTP verb: ${route.method}`);
    assert.equal(typeof route.handler, 'function', `route handler must be function`);
    assert.equal(typeof route.requiredCapability, 'string', `route requiredCapability must be string`);
  }
});

test('plugin: plugin id matches digital-agency-v1', () => {
  assert.equal(digitalAgencyPlugin.id, 'digital-agency-v1');
});

test('route: GET /plugins/digital-agency/dashboard returns 200 for authorized tenant', async () => {
  const req = { method: 'GET', url: '/plugins/digital-agency/dashboard', markosAuth: { tenantId: 'tenant-alpha-001' }, tenantContext: makeTenantContext() };
  const res = makeMockRes();
  await handleDashboard(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body, 'response body should be set');
});

test('route: GET /plugins/digital-agency/drafts returns 200 for authorized tenant', async () => {
  const req = { method: 'GET', url: '/plugins/digital-agency/drafts', query: { discipline: 'social' }, markosAuth: { tenantId: 'tenant-alpha-001' }, tenantContext: makeTenantContext() };
  const res = makeMockRes();
  await handleDrafts(req, res);
  assert.equal(res.statusCode, 200);
});

test('route: POST /plugins/digital-agency/campaigns/assemble returns 200 for authorized tenant', async () => {
  const req = { method: 'POST', url: '/plugins/digital-agency/campaigns/assemble', body: { draft_ids: ['d-1', 'd-2'], name: 'Q4 Campaign' }, markosAuth: { tenantId: 'tenant-alpha-001' }, tenantContext: makeTenantContext() };
  const res = makeMockRes();
  await handleAssembleCampaign(req, res);
  assert.equal(res.statusCode, 200);
});

// ---------------------------------------------------------------------------
// Authorization: disabled plugin returns 404 before handler
// ---------------------------------------------------------------------------

test('authorization: handleDashboard returns 404 when plugin is disabled for tenant', async () => {
  const req = { method: 'GET', url: '/plugins/digital-agency/dashboard', markosAuth: { tenantId: 'tenant-no-plugin' }, tenantContext: makeTenantContext({ enabled: false }) };
  const res = makeMockRes();
  await handleDashboard(req, res);
  assert.equal(res.statusCode, 404, 'Disabled plugin must return 404');
  assert.match(res.body?.error ?? '', /PLUGIN_DISABLED/);
});

test('authorization: handleAssembleCampaign returns 403 when capability not granted', async () => {
  const req = { method: 'POST', url: '/plugins/digital-agency/campaigns/assemble', body: {}, markosAuth: { tenantId: 'tenant-alpha-001' }, tenantContext: makeTenantContext({ capabilities: ['read_drafts'] }) };
  const res = makeMockRes();
  await handleAssembleCampaign(req, res);
  assert.equal(res.statusCode, 403, 'Missing capability must return 403');
  assert.match(res.body?.error ?? '', /CAPABILITY_NOT_GRANTED/);
});

test('authorization: handlePublishCampaign returns 403 when capability not granted', async () => {
  const req = { method: 'POST', url: '/plugins/digital-agency/campaigns/publish', body: { campaign_id: 'c-1' }, markosAuth: { tenantId: 'tenant-alpha-001' }, tenantContext: makeTenantContext({ capabilities: ['read_drafts', 'write_campaigns'] }) };
  const res = makeMockRes();
  await handlePublishCampaign(req, res);
  assert.equal(res.statusCode, 403, 'Missing publish_campaigns capability must return 403');
});

// ---------------------------------------------------------------------------
// Task 52-02-02: Campaign workflow lifecycle
// ---------------------------------------------------------------------------

test('workflow: handleAssembleCampaign returns campaign with draft_ids and pending_approval state', async () => {
  const draftIds = ['draft-001', 'draft-002'];
  const req = { method: 'POST', url: '/plugins/digital-agency/campaigns/assemble', body: { draft_ids: draftIds, name: 'Q4 Test Campaign' }, markosAuth: { tenantId: 'tenant-alpha-001' }, tenantContext: makeTenantContext() };
  const res = makeMockRes();
  await handleAssembleCampaign(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body?.campaign?.id, 'campaign.id must be set');
  assert.equal(res.body?.campaign?.state, 'pending_approval', 'Assembled campaign must start in pending_approval state');
  assert.deepEqual(res.body?.campaign?.draft_ids, draftIds);
  assert.equal(res.body?.campaign?.tenant_id, 'tenant-alpha-001');
});

test('workflow: handlePublishCampaign returns campaign with published state for authorized tenant', async () => {
  const req = { method: 'POST', url: '/plugins/digital-agency/campaigns/c-99/publish', body: { campaign_id: 'c-99' }, markosAuth: { tenantId: 'tenant-alpha-001' }, tenantContext: makeTenantContext() };
  const res = makeMockRes();
  await handlePublishCampaign(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.campaign?.state, 'published');
});

test('workflow: handlePublishCampaign denied attempt does not mutate campaign state', async () => {
  const req = { method: 'POST', url: '/plugins/digital-agency/campaigns/c-99/publish', body: { campaign_id: 'c-99' }, markosAuth: { tenantId: 'tenant-alpha-001' }, tenantContext: makeTenantContext({ capabilities: ['read_drafts', 'write_campaigns'] }) };
  const res = makeMockRes();
  await handlePublishCampaign(req, res);
  assert.equal(res.statusCode, 403, 'Denied publish must not proceed');
  assert.ok(!res.body?.campaign?.state, 'No campaign state change on denied publish');
});

// ---------------------------------------------------------------------------
// Event handlers: immutable audit records
// ---------------------------------------------------------------------------

test('events: handleApprovalGranted records approval event with tenant_id and correlation_id', async () => {
  const event = {
    type: 'approval:granted',
    correlationId: 'corr-001',
    actor: { userId: 'user-1', tenantId: 'tenant-alpha-001', role: 'manager' },
    resourceId: 'campaign-001',
    payload: {},
  };
  const result = await handleApprovalGranted(event);
  assert.ok(result?.recorded, 'handleApprovalGranted must return {recorded: true}');
  assert.equal(result?.tenant_id, 'tenant-alpha-001');
  assert.equal(result?.correlation_id, 'corr-001');
});

test('events: handleCampaignPublished records publish event with state and tenant_id', async () => {
  const event = {
    type: 'campaign:published',
    correlationId: 'corr-002',
    actor: { userId: 'user-1', tenantId: 'tenant-alpha-001', role: 'owner' },
    resourceId: 'campaign-002',
    payload: { campaign_name: 'Q4' },
  };
  const result = await handleCampaignPublished(event);
  assert.ok(result?.recorded);
  assert.equal(result?.tenant_id, 'tenant-alpha-001');
  assert.equal(result?.event_type, 'campaign:published');
});
