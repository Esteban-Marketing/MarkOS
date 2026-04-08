const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity, appendCrmActivity } = require('../../lib/markos/crm/api.cjs');
const { buildCopilotGroundingBundle, generateCopilotSummaryModel } = require('../../lib/markos/crm/copilot.ts');

test('AI-CRM-01: copilot grounding bundles record state, timeline, tasks, notes, and outbound context deterministically', () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [], outboundMessages: [], outboundConversations: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Expansion',
    attributes: { owner_actor_id: 'manager-actor-001', stage_key: 'qualified', amount: 9000, approval_state: 'needed' },
  });
  createCrmEntity(store, {
    entity_id: 'task-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'task',
    display_name: 'Call champion',
    linked_record_kind: 'deal',
    linked_record_id: 'deal-001',
    attributes: { due_at: '2026-04-05T09:00:00.000Z' },
  });
  createCrmEntity(store, {
    entity_id: 'note-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'note',
    display_name: 'Buying signal',
    linked_record_kind: 'deal',
    linked_record_id: 'deal-001',
    attributes: { body_markdown: 'Prospect asked for rollout timing.' },
  });
  appendCrmActivity(store, {
    tenant_id: 'tenant-alpha-001',
    activity_family: 'campaign_touch',
    related_record_kind: 'deal',
    related_record_id: 'deal-001',
    source_event_ref: 'tracked:campaign:reply',
    payload_json: { direction: 'inbound' },
    actor_id: 'contact-001',
    occurred_at: '2026-04-04T10:00:00.000Z',
  });
  store.outboundConversations.push({
    conversation_id: 'conv-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    record_id: 'deal-001',
    contact_id: 'contact-001',
    latest_message_at: '2026-04-04T10:05:00.000Z',
    message_count: 2,
  });
  store.outboundMessages.push({
    message_id: 'msg-001',
    conversation_id: 'conv-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    record_id: 'deal-001',
    channel: 'email',
    body_markdown: 'Thanks for the response.',
    created_at: '2026-04-04T10:05:00.000Z',
  });

  const grounding = buildCopilotGroundingBundle({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'manager-actor-001',
    record_kind: 'deal',
    record_id: 'deal-001',
    conversation_id: 'conv-001',
  });
  const summary = generateCopilotSummaryModel(grounding, { mode: 'conversation' });

  assert.equal(grounding.record.entity_id, 'deal-001');
  assert.equal(grounding.tasks.length, 1);
  assert.equal(grounding.notes.length, 1);
  assert.equal(grounding.timeline.length, 1);
  assert.equal(grounding.conversation.conversation_id, 'conv-001');
  assert.equal(grounding.outbound_history.length, 2);
  assert.deepEqual(grounding.source_classes, [
    'record_state',
    'timeline_activity',
    'linked_tasks',
    'linked_notes',
    'outbound_history',
    'conversation_context',
  ]);
  assert.match(summary.summary_text, /Conversation summary/);
  assert.ok(summary.risk_flags.includes('approval_required'));
  assert.ok(summary.recommendations.every((entry) => entry.approval_required === true));
});

test('AI-CRM-01: copilot summaries fail gracefully when timeline and conversation context are missing', () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [], outboundMessages: [], outboundConversations: [] };
  createCrmEntity(store, {
    entity_id: 'customer-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'customer',
    display_name: 'Beta Customer',
    attributes: { health_score: 42 },
  });

  const grounding = buildCopilotGroundingBundle({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    record_kind: 'customer',
    record_id: 'customer-001',
  });
  const summary = generateCopilotSummaryModel(grounding, { mode: 'record' });

  assert.equal(grounding.timeline.length, 0);
  assert.equal(grounding.outbound_history.length, 0);
  assert.ok(grounding.missing_context.includes('timeline_activity'));
  assert.ok(grounding.missing_context.includes('conversation_context'));
  assert.match(summary.summary_text, /Record summary/);
  assert.ok(summary.rationale.evidence_count >= 0);
});