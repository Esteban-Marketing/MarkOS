const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { buildCrmTimeline } = require('../../lib/markos/crm/timeline.ts');
const { appendInboundConversationEvent, buildOutboundConversation } = require('../../lib/markos/outbound/conversations.ts');

test('CRM-05: conversation writeback lands provider replies and delivery evidence back in CRM-visible history', () => {
  const store = {
    entities: [],
    activities: [],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    outboundMessages: [
      {
        outbound_id: 'outbound-tenant-alpha-001-0001',
        tenant_id: 'tenant-alpha-001',
        contact_id: 'contact-001',
        record_kind: 'contact',
        record_id: 'contact-001',
        channel: 'email',
        provider: 'resend',
        provider_message_id: 're_msg_001',
        status: 'sent',
        outcome: 'sent',
        body_markdown: 'Checking in.',
        created_by: 'manager-actor-001',
        created_at: '2026-04-04T12:00:00.000Z',
        updated_at: '2026-04-04T12:00:00.000Z',
      },
    ],
    outboundConversations: [],
    outboundConsentRecords: [],
  };

  createCrmEntity(store, {
    entity_id: 'contact-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    display_name: 'Ada Lovelace',
    attributes: { email: 'ada@example.com' },
  });

  const event = appendInboundConversationEvent(store, {
    tenant_id: 'tenant-alpha-001',
    provider: 'resend',
    provider_message_id: 're_msg_001',
    channel: 'email',
    direction: 'inbound',
    status: 'received',
    text: 'Reply received. Let us talk tomorrow.',
    occurred_at: '2026-04-04T12:15:00.000Z',
  });
  const thread = buildOutboundConversation(store, {
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    record_id: 'contact-001',
  });
  const timeline = buildCrmTimeline({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    record_id: 'contact-001',
    activities: store.activities,
    identity_links: [],
  });

  assert.equal(event.thread_id, thread.thread_id);
  assert.equal(thread.messages.length, 2);
  assert.equal(thread.last_direction, 'inbound');
  assert.equal(thread.status, 'reply_pending');
  assert.equal(timeline[0].activity_family, 'outbound_event');
  assert.equal(timeline[0].payload_json.direction, 'inbound');
});
