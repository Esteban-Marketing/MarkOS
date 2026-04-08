const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildExecutionRecommendation,
  buildExecutionRecommendations,
  normalizeExecutionSignals,
} = require('../../lib/markos/crm/execution.ts');
const { handleExecutionRecommendations } = require('../../api/crm/execution/recommendations.js');
const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');

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

test('CRM-04: recommendation engine exposes explainable rationale, source signals, and bounded actions', () => {
  const record = {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Expansion',
    created_at: '2026-04-01T09:00:00.000Z',
    updated_at: '2026-04-04T09:00:00.000Z',
    attributes: {
      owner_actor_id: 'manager-actor-001',
      intent_score: 88,
      stage_key: 'proposal',
      amount: 14000,
    },
  };
  const tasks = [{
    entity_id: 'task-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'task',
    display_name: 'Follow up on security review',
    status: 'open',
    linked_record_kind: 'deal',
    linked_record_id: 'deal-001',
    attributes: {
      due_at: '2026-04-03T09:00:00.000Z',
      assigned_actor_id: 'manager-actor-001',
    },
  }];
  const timeline = [{
    activity_id: 'activity-001',
    tenant_id: 'tenant-alpha-001',
    activity_family: 'campaign_touch',
    related_record_kind: 'deal',
    related_record_id: 'deal-001',
    occurred_at: '2026-04-02T09:00:00.000Z',
    payload_json: { direction: 'inbound', channel: 'email' },
  }];

  const signals = normalizeExecutionSignals({
    record,
    tasks,
    timeline,
    now: '2026-04-04T12:00:00.000Z',
  });
  const recommendation = buildExecutionRecommendation({
    record,
    tasks,
    timeline,
    actor_id: 'manager-actor-001',
    now: '2026-04-04T12:00:00.000Z',
    signals,
  });

  assert.equal(signals.overdue_task_count, 1);
  assert.equal(signals.inbound_touch_count, 1);
  assert.equal(recommendation.queue_tab, 'due_overdue');
  assert.match(recommendation.rationale_summary, /overdue task/i);
  assert.match(recommendation.rationale_summary, /intent score/i);
  assert.equal(recommendation.queue_scope, 'personal');
  assert.equal(recommendation.risk_level, 'high');
  assert.ok(recommendation.source_signals.some((signal) => signal.key === 'intent_score' && signal.value === 88));
  assert.ok(recommendation.bounded_actions.some((action) => action.action_key === 'create_task'));
  assert.ok(recommendation.bounded_actions.some((action) => action.action_key === 'view_draft_suggestion'));
  assert.equal(recommendation.suggestion_artifact.suggestion_only, true);
  assert.equal(recommendation.suggestion_artifact.send_disabled, true);
});

test('CRM-04: recommendation builder spans sales and success motions from canonical CRM state', () => {
  const store = {
    entities: [],
    activities: [],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
  };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Expansion Deal',
    attributes: { owner_actor_id: 'ae-001', intent_score: 91, stage_key: 'proposal', amount: 9000 },
  });
  createCrmEntity(store, {
    entity_id: 'customer-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'customer',
    display_name: 'Renewal Risk Account',
    attributes: { owner_actor_id: 'csm-001', health_score: 42, renewal_at: '2026-04-20T00:00:00.000Z' },
  });
  createCrmEntity(store, {
    entity_id: 'task-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'task',
    display_name: 'Call renewal champion',
    status: 'open',
    linked_record_kind: 'customer',
    linked_record_id: 'customer-001',
    attributes: { due_at: '2026-04-01T00:00:00.000Z', assigned_actor_id: 'csm-001' },
  });

  const recommendations = buildExecutionRecommendations({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'csm-001',
    now: '2026-04-04T12:00:00.000Z',
  });

  assert.equal(recommendations.length, 2);
  assert.ok(recommendations.some((item) => item.record_kind === 'deal'));
  assert.ok(recommendations.some((item) => item.record_kind === 'customer' && item.queue_tab === 'due_overdue'));
  assert.ok(recommendations.some((item) => item.record_kind === 'customer' && /renewal|health/i.test(item.rationale_summary)));
});

test('CRM-06: recommendation lifecycle updates remain auditable and tenant-safe', async () => {
  const store = {
    entities: [],
    activities: [],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
  };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { owner_actor_id: 'manager-actor-001', intent_score: 76, amount: 5000 },
  });

  const initialReq = makeReq({
    method: 'GET',
    auth: authFor('manager'),
    crmStore: store,
  });
  const initialRes = makeRes();
  await handleExecutionRecommendations(initialReq, initialRes);
  const recommendationId = initialRes.body.recommendations[0].recommendation_id;

  const req = makeReq({
    method: 'PATCH',
    auth: authFor('manager'),
    crmStore: store,
    body: { recommendation_id: recommendationId, action: 'dismiss' },
  });
  const res = makeRes();
  await handleExecutionRecommendations(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.recommendation.status, 'dismissed');
  assert.equal(store.activities.at(-1).payload_json.action, 'recommendation_dismiss');
  assert.equal(store.executionRecommendations.length, 1);
});