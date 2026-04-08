const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleReportingDashboard } = require('../../api/crm/reporting/dashboard.js');
const { handleReportingAttribution } = require('../../api/crm/reporting/attribution.js');
const { handleReportingReadiness } = require('../../api/crm/reporting/readiness.js');

function authFor(role, tenantId = 'tenant-alpha-001', actorId = `${role}-actor-001`) {
  return {
    tenant_id: tenantId,
    iamRole: role,
    principal: {
      id: actorId,
      tenant_id: tenantId,
      tenant_role: role,
    },
  };
}

function makeReq({ method = 'GET', auth = null, crmStore = null, query = {} } = {}) {
  return {
    method,
    query,
    crmStore,
    markosAuth: auth,
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) {
      this.statusCode = code;
    },
    end(payload) {
      this.body = JSON.parse(payload);
    },
  };
}

test('TEN-01 and REP-01: tenant reporting dashboard only returns tenant-scoped records', async () => {
  const req = makeReq({
    auth: authFor('manager', 'tenant-alpha-001', 'manager-001'),
    crmStore: {
      entities: [
        {
          entity_id: 'deal-alpha',
          tenant_id: 'tenant-alpha-001',
          record_kind: 'deal',
          display_name: 'Alpha Deal',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
          status: 'open',
          linked_record_kind: null,
          linked_record_id: null,
          merged_into: null,
          attributes: { stage_key: 'proposal' },
        },
        {
          entity_id: 'deal-beta',
          tenant_id: 'tenant-beta-002',
          record_kind: 'deal',
          display_name: 'Beta Deal',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
          status: 'open',
          linked_record_kind: null,
          linked_record_id: null,
          merged_into: null,
          attributes: { stage_key: 'negotiation' },
        },
      ],
      activities: [],
      identityLinks: [],
      outboundMessages: [],
      mergeDecisions: [],
      mergeLineage: [],
    },
  });
  const res = makeRes();

  await handleReportingDashboard(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.cockpit.pipeline_health.map((entry) => entry.record_id), ['deal-alpha']);
});

test('CRM reporting tenant isolation: readiness fails closed without tenant auth context', async () => {
  const req = makeReq({
    method: 'GET',
    auth: { iamRole: 'manager', principal: { id: 'actor-001', tenant_role: 'manager' } },
    crmStore: { entities: [], activities: [], identityLinks: [], outboundMessages: [] },
  });
  const res = makeRes();

  await handleReportingReadiness(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'TENANT_CONTEXT_REQUIRED');
});

test('CRM reporting tenant isolation: attribution only returns tenant-owned records and activity lineage', async () => {
  const store = { entities: [], activities: [], identityLinks: [], outboundMessages: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-alpha',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { amount: 1000 },
  });
  createCrmEntity(store, {
    entity_id: 'deal-beta',
    tenant_id: 'tenant-beta-002',
    record_kind: 'deal',
    display_name: 'Beta Deal',
    attributes: { amount: 2000 },
  });
  store.activities.push(
    {
      activity_id: 'activity-alpha',
      tenant_id: 'tenant-alpha-001',
      activity_family: 'campaign_touch',
      related_record_kind: 'deal',
      related_record_id: 'deal-alpha',
      source_event_ref: 'tracking:alpha',
      payload_json: { utm_campaign: 'alpha-campaign' },
      occurred_at: '2026-04-03T10:00:00.000Z',
    },
    {
      activity_id: 'activity-beta',
      tenant_id: 'tenant-beta-002',
      activity_family: 'campaign_touch',
      related_record_kind: 'deal',
      related_record_id: 'deal-beta',
      source_event_ref: 'tracking:beta',
      payload_json: { utm_campaign: 'beta-campaign' },
      occurred_at: '2026-04-03T10:00:00.000Z',
    }
  );

  const req = makeReq({
    method: 'GET',
    auth: authFor('manager', 'tenant-alpha-001', 'manager-actor-001'),
    crmStore: store,
  });
  const res = makeRes();

  await handleReportingAttribution(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.rows.length, 1);
  assert.equal(res.body.rows[0].record_id, 'deal-alpha');
  assert.deepEqual(res.body.rows[0].weights.map((entry) => entry.source_event_ref), ['tracking:alpha']);
});

test('CRM reporting tenant isolation: central rollup access stays explicit and denied to tenant roles', async () => {
  const req = makeReq({
    method: 'GET',
    auth: authFor('manager', 'tenant-alpha-001', 'manager-actor-001'),
    crmStore: { entities: [], activities: [], identityLinks: [], outboundMessages: [] },
    query: { scope: 'central' },
  });
  const res = makeRes();

  await handleReportingAttribution(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'CRM_REPORTING_SCOPE_FORBIDDEN');
});