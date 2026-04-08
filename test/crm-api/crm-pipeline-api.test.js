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

test('CRM-03: pipeline API persists tenant-owned pipelines with ordered stages and audit evidence', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  let req = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      pipeline_key: 'renewal',
      display_name: 'Renewal Pipeline',
      object_kind: 'deal',
      stages: [
        { stage_key: 'at_risk', display_name: 'At Risk', stage_order: 2, color_hex: '#f97316' },
        { stage_key: 'active', display_name: 'Active', stage_order: 1, color_hex: '#0f766e' },
      ],
    },
  });
  let res = makeRes();
  await handlePipelines(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.pipeline.pipeline_key, 'renewal');
  assert.deepEqual(res.body.pipeline.stages.map((stage) => stage.stage_key), ['active', 'at_risk']);
  assert.equal(store.activities.length, 1);
  assert.equal(store.activities[0].payload_json.action, 'pipeline_config_updated');

  req = makeReq({ method: 'GET', auth: authFor('readonly'), crmStore: store });
  res = makeRes();
  await handlePipelines(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.pipelines.length, 1);
  assert.equal(res.body.pipelines[0].object_kind, 'deal');
});

test('CRM-03: object-definition API exposes canonical and custom object workspace capability rules', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  let req = makeReq({
    method: 'POST',
    auth: authFor('owner'),
    crmStore: store,
    body: {
      record_kind: 'deal',
      display_name: 'Deals',
      workspace_enabled: true,
      pipeline_enabled: true,
      detail_enabled: true,
      timeline_enabled: true,
      funnel_enabled: true,
      calendar_enabled: true,
      calendar_date_field_key: 'expected_close_at',
    },
  });
  let res = makeRes();
  await handleObjectDefinitions(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.definition.record_kind, 'deal');

  req = makeReq({
    method: 'POST',
    auth: authFor('owner'),
    crmStore: store,
    body: {
      record_kind: 'renewal_motion',
      display_name: 'Renewal Motion',
      is_custom_object: true,
      workspace_enabled: true,
      pipeline_enabled: true,
      detail_enabled: true,
      timeline_enabled: true,
      funnel_enabled: true,
      calendar_enabled: false,
    },
  });
  res = makeRes();
  await handleObjectDefinitions(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.definition.is_custom_object, true);
  assert.equal(store.activities.length, 2);

  req = makeReq({ method: 'GET', auth: authFor('readonly'), crmStore: store });
  res = makeRes();
  await handleObjectDefinitions(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.definitions.length, 2);
  assert.equal(res.body.definitions.some((entry) => entry.record_kind === 'renewal_motion'), true);
});