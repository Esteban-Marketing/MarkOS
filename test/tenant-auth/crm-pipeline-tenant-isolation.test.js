const test = require('node:test');
const assert = require('node:assert/strict');

const { handlePipelines } = require('../../api/crm/pipelines.js');
const { handleObjectDefinitions } = require('../../api/crm/object-definitions.js');

function makeReq({ method = 'GET', body = {}, query = {}, auth = null, crmStore = null } = {}) {
  return {
    method,
    body,
    query,
    crmStore,
    markosAuth: auth,
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

function authFor(role, tenantId = 'tenant-alpha-001') {
  return {
    tenant_id: tenantId,
    iamRole: role,
    principal: {
      id: `${role}-actor-001`,
      tenant_id: tenantId,
      tenant_role: role,
    },
  };
}

test('CRM pipeline APIs fail closed without tenant auth context', async () => {
  const store = { entities: [], activities: [] };
  const req = makeReq({ method: 'GET', crmStore: store });
  const res = makeRes();

  await handlePipelines(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'TENANT_CONTEXT_REQUIRED');
});

test('CRM pipeline APIs deny readonly mutation attempts', async () => {
  const store = { entities: [], activities: [] };
  const req = makeReq({
    method: 'POST',
    auth: authFor('readonly'),
    crmStore: store,
    body: {
      pipeline_key: 'renewal',
      display_name: 'Renewal Pipeline',
      object_kind: 'deal',
      stages: [{ stage_key: 'active', display_name: 'Active', stage_order: 1 }],
    },
  });
  const res = makeRes();

  await handlePipelines(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'CRM_MUTATION_FORBIDDEN');
});

test('CRM pipeline APIs do not bleed pipeline or object definitions across tenants', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };

  let req = makeReq({
    method: 'POST',
    auth: authFor('owner', 'tenant-alpha-001'),
    crmStore: store,
    body: {
      pipeline_key: 'sales',
      display_name: 'Sales',
      object_kind: 'deal',
      stages: [{ stage_key: 'qualified', display_name: 'Qualified', stage_order: 1 }],
    },
  });
  let res = makeRes();
  await handlePipelines(req, res);

  req = makeReq({
    method: 'POST',
    auth: authFor('owner', 'tenant-beta-002'),
    crmStore: store,
    body: {
      record_kind: 'deal',
      display_name: 'Deals',
      workspace_enabled: true,
      pipeline_enabled: true,
      detail_enabled: true,
      timeline_enabled: true,
    },
  });
  res = makeRes();
  await handleObjectDefinitions(req, res);

  req = makeReq({ method: 'GET', auth: authFor('readonly', 'tenant-alpha-001'), crmStore: store });
  res = makeRes();
  await handlePipelines(req, res);
  assert.equal(res.body.pipelines.length, 1);

  req = makeReq({ method: 'GET', auth: authFor('readonly', 'tenant-alpha-001'), crmStore: store });
  res = makeRes();
  await handleObjectDefinitions(req, res);
  assert.equal(res.body.definitions.length, 0);

  req = makeReq({ method: 'GET', auth: authFor('readonly', 'tenant-beta-002'), crmStore: store });
  res = makeRes();
  await handlePipelines(req, res);
  assert.equal(res.body.pipelines.length, 0);

  req = makeReq({ method: 'GET', auth: authFor('readonly', 'tenant-beta-002'), crmStore: store });
  res = makeRes();
  await handleObjectDefinitions(req, res);
  assert.equal(res.body.definitions.length, 1);
});