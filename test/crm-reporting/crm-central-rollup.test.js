const test = require('node:test');
const assert = require('node:assert/strict');

const { handleReportingRollups } = require('../../api/crm/reporting/rollups.js');

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

function makeStore() {
  return {
    entities: [
      {
        entity_id: 'deal-a',
        tenant_id: 'tenant-alpha-001',
        record_kind: 'deal',
        display_name: 'Alpha Deal',
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-01T00:00:00.000Z',
        status: 'open',
        linked_record_kind: null,
        linked_record_id: null,
        merged_into: null,
        attributes: { stage_key: 'proposal', amount: 900 },
      },
      {
        entity_id: 'deal-b',
        tenant_id: 'tenant-beta-002',
        record_kind: 'deal',
        display_name: 'Beta Deal',
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-01T00:00:00.000Z',
        status: 'open',
        linked_record_kind: null,
        linked_record_id: null,
        merged_into: null,
        attributes: { stage_key: 'negotiation', amount: 1500 },
      },
      {
        entity_id: 'task-b',
        tenant_id: 'tenant-beta-002',
        record_kind: 'task',
        display_name: 'Review legal',
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-01T00:00:00.000Z',
        status: 'open',
        linked_record_kind: 'deal',
        linked_record_id: 'deal-b',
        merged_into: null,
        attributes: {},
      },
    ],
    activities: [
      {
        activity_id: 'activity-a',
        tenant_id: 'tenant-alpha-001',
        activity_family: 'campaign_touch',
        related_record_kind: 'deal',
        related_record_id: 'deal-a',
        source_event_ref: 'tracking:alpha',
        payload_json: {},
        occurred_at: '2026-04-03T00:00:00.000Z',
      },
      {
        activity_id: 'activity-b',
        tenant_id: 'tenant-beta-002',
        activity_family: 'campaign_touch',
        related_record_kind: 'deal',
        related_record_id: 'deal-b',
        source_event_ref: 'tracking:beta',
        payload_json: {},
        occurred_at: '2026-04-03T00:00:00.000Z',
      },
    ],
    identityLinks: [],
    outboundMessages: [
      { tenant_id: 'tenant-alpha-001', record_id: 'deal-a' },
      { tenant_id: 'tenant-beta-002', record_id: 'deal-b' },
    ],
    mergeDecisions: [],
    mergeLineage: [],
  };
}

test('REP-01: central rollups stay role-gated and explicit about tenant labels', async () => {
  const req = makeReq({
    method: 'GET',
    auth: {
      tenant_id: 'tenant-alpha-001',
      iamRole: 'owner',
      principal: {
        id: 'owner-001',
        tenant_id: 'tenant-alpha-001',
        tenant_role: 'owner',
      },
    },
    crmStore: makeStore(),
  });
  const res = makeRes();

  await handleReportingRollups(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.scope, 'central');
  assert.equal(res.body.rollup.tenants.length, 2);
  assert.equal(res.body.rollup.tenants.every((entry) => typeof entry.tenant_id === 'string' && entry.tenant_id.length > 0), true);
  assert.match(res.body.rollup.governance.summary, /governed drill-down/i);
});

test('REP-01: unauthorized roles fail closed for central rollups', async () => {
  const req = makeReq({
    method: 'GET',
    auth: {
      tenant_id: 'tenant-alpha-001',
      iamRole: 'manager',
      principal: {
        id: 'manager-001',
        tenant_id: 'tenant-alpha-001',
        tenant_role: 'manager',
      },
    },
    crmStore: makeStore(),
  });
  const res = makeRes();

  await handleReportingRollups(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'CRM_REPORTING_SCOPE_FORBIDDEN');
});