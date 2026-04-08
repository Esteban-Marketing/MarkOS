const test = require('node:test');
const assert = require('node:assert/strict');

const { handleCopilotRecommendations } = require('../../api/crm/copilot/recommendations.js');

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    writeHead(code, headers = {}) {
      this.statusCode = code;
      this.headers = headers;
    },
    end(payload) {
      this.body = payload ? JSON.parse(payload) : null;
    },
  };
}

test('AI-CRM-01: conversation copilot summaries stay grounded in outbound and CRM history', async () => {
  const store = {
    entities: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Expansion', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T10:00:00.000Z', status: 'active', linked_record_kind: null, linked_record_id: null, merged_into: null, attributes: { owner_actor_id: 'ae-001', stage_key: 'qualified', amount: 10000, approval_state: 'needed' } },
    ],
    activities: [
      { activity_id: 'activity-001', tenant_id: 'tenant-alpha-001', activity_family: 'campaign_touch', related_record_kind: 'deal', related_record_id: 'deal-001', source_event_ref: 'tracked:reply', payload_json: { direction: 'inbound', excerpt: 'Can we break rollout into phases?' }, actor_id: 'contact-001', occurred_at: '2026-04-04T10:30:00.000Z' },
    ],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    outboundMessages: [
      { message_id: 'msg-001', conversation_id: 'conv-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', record_id: 'deal-001', channel: 'email', body_markdown: 'We can support phased rollout.', created_at: '2026-04-04T10:32:00.000Z' },
    ],
    outboundConversations: [
      { conversation_id: 'conv-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', record_id: 'deal-001', contact_id: 'contact-001', latest_message_at: '2026-04-04T10:32:00.000Z', message_count: 2 },
    ],
    copilotSummaries: [],
    copilotApprovalPackages: [],
    copilotMutationOutcomes: [],
  };
  const req = {
    method: 'GET',
    query: { record_kind: 'deal', record_id: 'deal-001', conversation_id: 'conv-001', mode: 'conversation' },
    crmStore: store,
    markosAuth: { tenant_id: 'tenant-alpha-001', iamRole: 'manager', principal: { id: 'manager-001', tenant_role: 'manager', tenant_id: 'tenant-alpha-001' } },
  };
  const res = createMockResponse();

  await handleCopilotRecommendations(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.summary.summary_mode, 'conversation');
  assert.ok(res.body.grounding.source_classes.includes('conversation_context'));
  assert.ok(res.body.grounding.source_classes.includes('outbound_history'));
  assert.ok(res.body.grounding.source_classes.includes('timeline_activity'));
  assert.match(res.body.summary.summary_text, /Conversation summary/);
  assert.ok(res.body.recommendations.some((entry) => entry.action_key === 'create_task'));
  assert.ok(res.body.recommendations.some((entry) => entry.action_key === 'append_note'));
});