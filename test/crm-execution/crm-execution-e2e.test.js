const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity, buildCrmTimeline } = require('../../lib/markos/crm/api.cjs');
const { buildExecutionWorkspaceSnapshot } = require('../../lib/markos/crm/execution.ts');
const { handleExecutionActions } = require('../../api/crm/execution/actions.js');

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

test('CRM-06: queue selection, bounded action, and canonical timeline remain coherent end to end', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [], pipelines: [], pipelineStages: [], objectDefinitions: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { owner_actor_id: 'manager-actor-001', amount: 3000, intent_score: 84 },
  });
  store.activities.push({
    activity_id: 'activity-001',
    tenant_id: 'tenant-alpha-001',
    activity_family: 'campaign_touch',
    related_record_kind: 'deal',
    related_record_id: 'deal-001',
    occurred_at: '2026-04-04T08:00:00.000Z',
    payload_json: { direction: 'inbound' },
  });

  const before = buildExecutionWorkspaceSnapshot({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'manager-actor-001',
    scope: 'personal',
    now: '2026-04-04T12:00:00.000Z',
  });

  const recommendation = before.detail.recommendation;
  const taskReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      action_key: 'create_task',
      recommendation_id: recommendation.recommendation_id,
      record_kind: recommendation.record_kind,
      record_id: recommendation.record_id,
      title: 'Follow up now',
    },
  });
  const taskRes = makeRes();
  await handleExecutionActions(taskReq, taskRes);

  const noteReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      action_key: 'append_note',
      recommendation_id: recommendation.recommendation_id,
      record_kind: recommendation.record_kind,
      record_id: recommendation.record_id,
      body_markdown: 'Committed next step',
    },
  });
  const noteRes = makeRes();
  await handleExecutionActions(noteReq, noteRes);

  const after = buildExecutionWorkspaceSnapshot({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'manager-actor-001',
    scope: 'personal',
    selected_recommendation_id: recommendation.recommendation_id,
    now: '2026-04-04T12:00:00.000Z',
  });
  const timeline = buildCrmTimeline({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    record_id: 'deal-001',
    activities: store.activities,
    identity_links: [],
  });

  assert.equal(taskRes.statusCode, 200);
  assert.equal(noteRes.statusCode, 200);
  assert.equal(after.detail.tasks.length, 1);
  assert.equal(after.detail.notes.length, 1);
  assert.ok(timeline.some((entry) => entry.activity_family === 'task'));
  assert.ok(timeline.some((entry) => entry.activity_family === 'note'));
  assert.ok(after.detail.recommendation.bounded_actions.some((action) => action.action_key === 'create_task'));
});