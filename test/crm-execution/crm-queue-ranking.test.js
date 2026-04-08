const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildExecutionRecommendations,
  buildExecutionQueues,
  rankExecutionQueue,
} = require('../../lib/markos/crm/execution.ts');
const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');

function makeStore() {
  return {
    entities: [],
    activities: [],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
  };
}

test('CRM-04: personal queue ranking prioritizes actionable overdue and inbound work over passive records', () => {
  const store = makeStore();
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Urgent Renewal Expansion',
    attributes: { owner_actor_id: 'ae-001', intent_score: 84, amount: 7000 },
  });
  createCrmEntity(store, {
    entity_id: 'deal-002',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Quiet Prospect',
    attributes: { owner_actor_id: 'ae-001', intent_score: 12, amount: 1500 },
  });
  createCrmEntity(store, {
    entity_id: 'task-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'task',
    display_name: 'Follow up now',
    status: 'open',
    linked_record_kind: 'deal',
    linked_record_id: 'deal-001',
    attributes: { due_at: '2026-04-03T00:00:00.000Z', assigned_actor_id: 'ae-001' },
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

  const recommendations = buildExecutionRecommendations({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'ae-001',
    now: '2026-04-04T12:00:00.000Z',
  });
  const ranked = rankExecutionQueue({ recommendations, scope: 'personal', actor_id: 'ae-001' });

  assert.equal(ranked[0].record_id, 'deal-001');
  assert.ok(ranked[0].urgency_score > ranked[1].urgency_score);
});

test('CRM-04: manager or team queue includes intervention candidates beyond the personal queue', () => {
  const store = makeStore();
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Owned Deal',
    attributes: { owner_actor_id: 'ae-001', intent_score: 50, amount: 3000 },
  });
  createCrmEntity(store, {
    entity_id: 'customer-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'customer',
    display_name: 'Unowned Renewal',
    attributes: { health_score: 38, renewal_at: '2026-04-20T00:00:00.000Z' },
  });
  createCrmEntity(store, {
    entity_id: 'deal-002',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Approval Gate Deal',
    attributes: { owner_actor_id: 'ae-002', approval_state: 'needed', amount: 12000 },
  });

  const queueData = buildExecutionQueues({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'ae-001',
    now: '2026-04-04T12:00:00.000Z',
  });

  assert.ok(queueData.personal_queue.every((item) => item.owner_actor_id === 'ae-001' || item.queue_scope === 'personal'));
  assert.ok(queueData.team_queue.some((item) => item.record_id === 'customer-001'));
  assert.ok(queueData.team_queue.some((item) => item.queue_tab === 'approval_needed'));
  assert.ok(queueData.tabs.some((tab) => tab.tab_key === 'success_risk'));
});