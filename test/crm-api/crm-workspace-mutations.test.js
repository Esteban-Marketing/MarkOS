const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleRecords } = require('../../api/crm/records.js');

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

test('CRM-03: shared records API lists canonical records for one workspace object family', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200 },
  });

  const req = makeReq({ method: 'GET', auth: authFor('readonly'), crmStore: store, query: { record_kind: 'deal', pipeline_key: 'sales' } });
  const res = makeRes();
  await handleRecords(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.records.length, 1);
  assert.equal(res.body.records[0].entity_id, 'deal-001');
});

test('CRM-03: stage moves append CRM activity instead of mutating UI-only state', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200 },
  });

  const req = makeReq({
    method: 'PATCH',
    auth: authFor('manager'),
    crmStore: store,
    body: { entity_id: 'deal-001', stage_key: 'proposal' },
  });
  const res = makeRes();
  await handleRecords(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.record.attributes.stage_key, 'proposal');
  assert.equal(store.activities.at(-1).payload_json.action, 'stage_change');
});

test('CRM-03: inline field edits remain auditable through the shared records seam', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200 },
  });

  const req = makeReq({
    method: 'PATCH',
    auth: authFor('manager'),
    crmStore: store,
    body: { entity_id: 'deal-001', field_key: 'amount', value: 1800 },
  });
  const res = makeRes();
  await handleRecords(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.record.attributes.amount, 1800);
  assert.equal(store.activities.at(-1).payload_json.action, 'field_update');
  assert.equal(store.activities.at(-1).payload_json.field_key, 'amount');
});