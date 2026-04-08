const test = require('node:test');
const assert = require('node:assert/strict');

const { handleReportingDashboard } = require('../../api/crm/reporting/dashboard.js');

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

test('REP-01: dashboard API returns unified cockpit metrics and executive summary from the same truth layer', async () => {
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
    crmStore: {
      entities: [
        {
          entity_id: 'deal-001',
          tenant_id: 'tenant-alpha-001',
          record_kind: 'deal',
          display_name: 'Northwind Expansion',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
          status: 'open',
          linked_record_kind: null,
          linked_record_id: null,
          merged_into: null,
          attributes: { stage_key: 'proposal', amount: 1200 },
        },
        {
          entity_id: 'task-001',
          tenant_id: 'tenant-alpha-001',
          record_kind: 'task',
          display_name: 'Send revision',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
          status: 'open',
          linked_record_kind: 'deal',
          linked_record_id: 'deal-001',
          merged_into: null,
          attributes: {},
        },
      ],
      activities: [
        {
          activity_id: 'activity-001',
          tenant_id: 'tenant-alpha-001',
          activity_family: 'campaign_touch',
          related_record_kind: 'deal',
          related_record_id: 'deal-001',
          source_event_ref: 'tracking:utm-entry',
          payload_json: { utm_campaign: 'q2-pipeline' },
          occurred_at: '2026-04-03T12:00:00.000Z',
        },
      ],
      identityLinks: [],
      outboundMessages: [
        {
          tenant_id: 'tenant-alpha-001',
          record_id: 'deal-001',
        },
      ],
      mergeDecisions: [],
      mergeLineage: [],
    },
  });
  const res = makeRes();

  await handleReportingDashboard(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.metric_families, ['pipeline_health', 'conversion', 'attribution', 'sla_risk', 'productivity', 'readiness']);
  assert.equal(res.body.readiness.status, 'ready');
  assert.equal(Array.isArray(res.body.cockpit.pipeline_health), true);
  assert.equal(res.body.executive_summary.deal_count, 1);
  assert.equal(res.body.executive_summary.open_task_count, 1);
  assert.equal(res.body.executive_summary.readiness_status, res.body.readiness.status);
});