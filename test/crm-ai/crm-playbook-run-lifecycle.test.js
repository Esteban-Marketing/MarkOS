const test = require('node:test');
const assert = require('node:assert/strict');

const { handleCopilotPlaybooks } = require('../../api/crm/copilot/playbooks.js');

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

function createPlaybookStore() {
  return {
    entities: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Expansion', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T10:00:00.000Z', status: 'active', linked_record_kind: null, linked_record_id: null, merged_into: null, attributes: { owner_actor_id: 'ae-001', stage_key: 'qualified', amount: 50000, approval_state: 'needed' } },
    ],
    activities: [],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    outboundMessages: [],
    outboundConversations: [],
    copilotPlaybookRuns: [],
    copilotPlaybookSteps: [],
    copilotApprovalPackages: [],
    copilotMutationOutcomes: [],
  };
}

test('AI-CRM-02: playbooks pause for approval and resume only through the shared run lifecycle', async () => {
  const store = createPlaybookStore();
  const auth = { tenant_id: 'tenant-alpha-001', iamRole: 'manager', principal: { id: 'manager-001', tenant_role: 'manager', tenant_id: 'tenant-alpha-001' } };

  const createReq = {
    method: 'POST',
    body: {
      action: 'create',
      record_kind: 'deal',
      record_id: 'deal-001',
      playbook_key: 'deal_followup',
      steps: [
        { action_key: 'create_task', proposed_changes: { title: 'Schedule rollout review' } },
        { action_key: 'append_note', proposed_changes: { body_markdown: 'Track phased rollout request.' } },
      ],
    },
    crmStore: store,
    markosAuth: auth,
  };
  const createRes = createMockResponse();
  await handleCopilotPlaybooks(createReq, createRes);

  assert.equal(createRes.statusCode, 200);
  assert.equal(createRes.body.playbook.status, 'awaiting_approval');
  assert.equal(createRes.body.run.state, 'awaiting_approval');
  assert.equal(createRes.body.playbook.steps.length, 2);

  const reviewReq = {
    method: 'POST',
    body: {
      action: 'review',
      playbook_id: createRes.body.playbook.playbook_id,
      decision: 'approved',
      rationale: 'Steps are bounded and safe.',
    },
    crmStore: store,
    markosAuth: auth,
  };
  const reviewRes = createMockResponse();
  await handleCopilotPlaybooks(reviewReq, reviewRes);

  assert.equal(reviewRes.statusCode, 200);
  assert.equal(reviewRes.body.playbook.status, 'approved');

  const resumeReq = {
    method: 'POST',
    body: {
      action: 'resume',
      playbook_id: createRes.body.playbook.playbook_id,
    },
    crmStore: store,
    markosAuth: auth,
  };
  const resumeRes = createMockResponse();
  await handleCopilotPlaybooks(resumeReq, resumeRes);

  assert.equal(resumeRes.statusCode, 200);
  assert.equal(resumeRes.body.playbook.status, 'completed');
  assert.equal(resumeRes.body.run.state, 'completed');
  assert.equal(store.entities.filter((entry) => entry.record_kind === 'task').length, 1);
  assert.equal(store.entities.filter((entry) => entry.record_kind === 'note').length, 1);
});