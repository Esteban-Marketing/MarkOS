const test = require('node:test');
const assert = require('node:assert/strict');

const { handleCopilotRecommendations } = require('../../api/crm/copilot/recommendations.js');
const { handleCopilotPackageApproval } = require('../../api/crm/copilot/approve-package.js');

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

function createCopilotStore() {
  return {
    entities: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Expansion', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T10:00:00.000Z', status: 'active', linked_record_kind: null, linked_record_id: null, merged_into: null, attributes: { owner_actor_id: 'ae-001', stage_key: 'qualified', amount: 25000, approval_state: 'needed' } },
    ],
    activities: [
      { activity_id: 'activity-001', tenant_id: 'tenant-alpha-001', activity_family: 'campaign_touch', related_record_kind: 'deal', related_record_id: 'deal-001', source_event_ref: 'tracked:reply', payload_json: { direction: 'inbound' }, actor_id: 'contact-001', occurred_at: '2026-04-04T10:30:00.000Z' },
    ],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    outboundMessages: [
      { message_id: 'msg-001', conversation_id: 'conv-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', record_id: 'deal-001', channel: 'email', body_markdown: 'Can we review rollout timing?', created_at: '2026-04-04T10:35:00.000Z' },
    ],
    outboundConversations: [
      { conversation_id: 'conv-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', record_id: 'deal-001', contact_id: 'contact-001', latest_message_at: '2026-04-04T10:35:00.000Z', message_count: 2 },
    ],
    copilotSummaries: [],
    copilotApprovalPackages: [],
    copilotMutationOutcomes: [],
  };
}

test('AI-CRM-02: grounded recommendations become reviewable approval packages with run lineage', async () => {
  const store = createCopilotStore();
  const getReq = {
    method: 'GET',
    query: { record_kind: 'deal', record_id: 'deal-001', conversation_id: 'conv-001', mode: 'conversation' },
    crmStore: store,
    markosAuth: { tenant_id: 'tenant-alpha-001', iamRole: 'manager', principal: { id: 'manager-001', tenant_role: 'manager', tenant_id: 'tenant-alpha-001' } },
  };
  const getRes = createMockResponse();

  await handleCopilotRecommendations(getReq, getRes);

  assert.equal(getRes.statusCode, 200);
  assert.equal(getRes.body.success, true);
  assert.equal(getRes.body.summary.summary_mode, 'conversation');
  assert.ok(getRes.body.recommendations.every((entry) => entry.approval_required === true));

  const packageReq = {
    method: 'POST',
    body: {
      record_kind: 'deal',
      record_id: 'deal-001',
      conversation_id: 'conv-001',
      recommendation_id: getRes.body.recommendations[0].recommendation_id,
      mutation_family: getRes.body.recommendations[0].action_key,
      proposed_changes: { title: 'Follow up on rollout timing' },
    },
    crmStore: store,
    markosAuth: getReq.markosAuth,
  };
  const packageRes = createMockResponse();

  await handleCopilotRecommendations(packageReq, packageRes);

  assert.equal(packageRes.statusCode, 200);
  assert.equal(packageRes.body.success, true);
  assert.equal(packageRes.body.approval_package.status, 'awaiting_approval');
  assert.equal(packageRes.body.run.state, 'awaiting_approval');
  assert.equal(store.copilotApprovalPackages.length, 1);
  assert.equal(store.copilotApprovalPackages[0].mutation_family, getRes.body.recommendations[0].action_key);
  assert.ok(store.activities.some((entry) => entry.payload_json?.action === 'copilot_recommendation_packaged'));
});

test('AI-CRM-02: approval-package decisions preserve accepted or rejected outcomes without silent CRM mutation', async () => {
  const store = createCopilotStore();
  const packageReq = {
    method: 'POST',
    body: {
      record_kind: 'deal',
      record_id: 'deal-001',
      recommendation_id: 'recommendation:grounding:tenant-alpha-001:deal:deal-001:conv-001:create_task',
      mutation_family: 'create_task',
      proposed_changes: { title: 'Prepare implementation check-in' },
    },
    crmStore: store,
    markosAuth: { tenant_id: 'tenant-alpha-001', iamRole: 'manager', principal: { id: 'manager-001', tenant_role: 'manager', tenant_id: 'tenant-alpha-001' } },
  };
  const packageRes = createMockResponse();

  await handleCopilotRecommendations(packageReq, packageRes);

  const approveReq = {
    method: 'POST',
    body: {
      package_id: packageRes.body.approval_package.package_id,
      decision: 'approved',
      rationale: 'Grounded task recommendation is safe to queue.',
    },
    crmStore: store,
    markosAuth: packageReq.markosAuth,
  };
  const approveRes = createMockResponse();

  await handleCopilotPackageApproval(approveReq, approveRes);

  assert.equal(approveRes.statusCode, 200);
  assert.equal(approveRes.body.success, true);
  assert.equal(approveRes.body.approval_package.status, 'approved');
  assert.equal(approveRes.body.outcome.status, 'approved');
  assert.equal(store.copilotMutationOutcomes.length, 1);
  assert.equal(store.entities.filter((entry) => entry.record_kind === 'task').length, 0);
  assert.ok(store.activities.some((entry) => entry.payload_json?.action === 'copilot_package_approved'));
});