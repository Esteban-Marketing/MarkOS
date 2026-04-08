const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { buildExecutionRecommendations } = require('../../lib/markos/crm/execution.ts');
const { handleExecutionRecommendations } = require('../../api/crm/execution/recommendations.js');
const telemetryPath = path.join(__dirname, '../..', 'lib/markos/telemetry/events.ts');

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

function makeReq({ method = 'GET', auth = null, crmStore = null, body = {}, query = {} } = {}) {
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

test('CRM-04: every surfaced recommendation carries rationale, source signals, and bounded action metadata', () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'customer-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'customer',
    display_name: 'At-Risk Customer',
    attributes: { owner_actor_id: 'csm-001', health_score: 30, renewal_at: '2026-04-18T00:00:00.000Z' },
  });
  const recommendations = buildExecutionRecommendations({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'csm-001',
    now: '2026-04-04T12:00:00.000Z',
  });

  assert.equal(recommendations.length, 1);
  assert.ok(recommendations[0].rationale_summary.length > 0);
  assert.ok(recommendations[0].source_signals.length >= 5);
  assert.ok(recommendations[0].bounded_actions.every((action) => action.action_key));
  assert.equal(recommendations[0].suggestion_artifact.suggestion_only, true);
});

test('CRM-06: recommendation dismissals preserve immutable audit lineage and telemetry vocabulary exists for execution surfaces', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { owner_actor_id: 'manager-actor-001', amount: 2000, intent_score: 70 },
  });

  const getReq = makeReq({ method: 'GET', auth: authFor('manager'), crmStore: store });
  const getRes = makeRes();
  await handleExecutionRecommendations(getReq, getRes);
  const recommendationId = getRes.body.recommendations[0].recommendation_id;

  const dismissReq = makeReq({ method: 'PATCH', auth: authFor('manager'), crmStore: store, body: { recommendation_id: recommendationId, action: 'dismiss' } });
  const dismissRes = makeRes();
  await handleExecutionRecommendations(dismissReq, dismissRes);

  const telemetrySource = fs.readFileSync(telemetryPath, 'utf8');
  assert.equal(dismissRes.statusCode, 200);
  assert.ok(store.activities.some((item) => item.payload_json.action === 'recommendation_dismiss'));
  assert.match(telemetrySource, /markos_crm_execution_queue_opened/);
  assert.match(telemetrySource, /markos_crm_recommendation_viewed/);
  assert.match(telemetrySource, /markos_crm_execution_action_taken/);
  assert.match(telemetrySource, /markos_crm_recommendation_dismissed/);
  assert.match(telemetrySource, /markos_crm_draft_suggestion_viewed/);
});