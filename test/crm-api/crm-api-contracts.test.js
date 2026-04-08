const test = require('node:test');
const assert = require('node:assert/strict');

const { handleContacts } = require('../../api/crm/contacts.js');
const { handleCompanies } = require('../../api/crm/companies.js');
const { handleDeals } = require('../../api/crm/deals.js');
const { handleActivities } = require('../../api/crm/activities.js');
const { appendCrmActivity } = require('../../lib/markos/crm/api.cjs');

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

test('CRM API: handlers fail closed without tenant auth context', async () => {
  const req = makeReq({ method: 'GET', crmStore: { entities: [] } });
  const res = makeRes();
  await handleContacts(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'TENANT_CONTEXT_REQUIRED');
});

test('CRM API: tenant-safe CRUD does not bleed across tenants', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  let req = makeReq({ method: 'POST', body: { entity_id: 'contact-001', display_name: 'Ada Lovelace' }, auth: authFor('owner'), crmStore: store });
  let res = makeRes();
  await handleContacts(req, res);
  assert.equal(res.statusCode, 200);

  req = makeReq({ method: 'GET', auth: authFor('owner', 'tenant-alpha-001'), crmStore: store });
  res = makeRes();
  await handleContacts(req, res);
  assert.equal(res.body.records.length, 1);

  req = makeReq({ method: 'GET', auth: authFor('owner', 'tenant-beta-002'), crmStore: store });
  res = makeRes();
  await handleContacts(req, res);
  assert.equal(res.body.records.length, 0);
});

test('CRM API: readonly users can read but cannot mutate', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  const createReq = makeReq({ method: 'POST', body: { entity_id: 'company-001', display_name: 'Alpha Co' }, auth: authFor('readonly'), crmStore: store });
  const createRes = makeRes();
  await handleCompanies(createReq, createRes);
  assert.equal(createRes.statusCode, 403);
  assert.equal(createRes.body.error, 'CRM_MUTATION_FORBIDDEN');
});

test('CRM API: company and deal handlers share canonical CRUD semantics', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  let req = makeReq({ method: 'POST', body: { entity_id: 'company-001', display_name: 'Alpha Co' }, auth: authFor('manager'), crmStore: store });
  let res = makeRes();
  await handleCompanies(req, res);
  assert.equal(res.statusCode, 200);

  req = makeReq({ method: 'POST', body: { entity_id: 'deal-001', display_name: 'Alpha Renewal' }, auth: authFor('manager'), crmStore: store });
  res = makeRes();
  await handleDeals(req, res);
  assert.equal(res.statusCode, 200);
});

test('CRM API: timeline reads preserve ordering and source refs through shared helper', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  appendCrmActivity(store, {
    tenant_id: 'tenant-alpha-001',
    activity_id: 'activity-001',
    activity_family: 'note',
    related_record_kind: 'deal',
    related_record_id: 'deal-001',
    source_event_ref: 'note:latest',
    occurred_at: '2026-04-04T12:00:00.000Z',
  });
  appendCrmActivity(store, {
    tenant_id: 'tenant-alpha-001',
    activity_id: 'activity-000',
    activity_family: 'crm_mutation',
    related_record_kind: 'deal',
    related_record_id: 'deal-001',
    source_event_ref: 'deal:create',
    occurred_at: '2026-04-04T11:00:00.000Z',
  });
  const req = makeReq({ method: 'GET', query: { record_kind: 'deal', record_id: 'deal-001' }, auth: authFor('readonly'), crmStore: store });
  const res = makeRes();
  await handleActivities(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.timeline.map((row) => row.activity_id), ['activity-001', 'activity-000']);
  assert.equal(res.body.timeline[0].source_event_ref, 'note:latest');
});
