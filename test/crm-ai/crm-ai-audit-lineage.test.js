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

test('AI-CRM-02: AI-originated playbook effects retain run, actor, and approval lineage in canonical CRM activity', async () => {
  const store = {
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
  const auth = { tenant_id: 'tenant-alpha-001', iamRole: 'manager', principal: { id: 'manager-001', tenant_role: 'manager', tenant_id: 'tenant-alpha-001' } };

  const createRes = createMockResponse();
  await handleCopilotPlaybooks({
    method: 'POST',
    body: {
      action: 'create',
      record_kind: 'deal',
      record_id: 'deal-001',
      playbook_key: 'deal_followup',
      steps: [
        { action_key: 'create_task', proposed_changes: { title: 'Prepare executive recap' } },
      ],
    },
    crmStore: store,
    markosAuth: auth,
  }, createRes);

  const reviewRes = createMockResponse();
  await handleCopilotPlaybooks({
    method: 'POST',
    body: { action: 'review', playbook_id: createRes.body.playbook.playbook_id, decision: 'approved', rationale: 'Proceed.' },
    crmStore: store,
    markosAuth: auth,
  }, reviewRes);

  const resumeRes = createMockResponse();
  await handleCopilotPlaybooks({
    method: 'POST',
    body: { action: 'resume', playbook_id: createRes.body.playbook.playbook_id },
    crmStore: store,
    markosAuth: auth,
  }, resumeRes);

  assert.equal(resumeRes.statusCode, 200);
  assert.ok(store.activities.some((entry) => entry.payload_json?.action === 'copilot_playbook_created'));
  assert.ok(store.activities.some((entry) => entry.payload_json?.action === 'copilot_playbook_step_applied'));
  const lineageEntry = store.activities.find((entry) => entry.payload_json?.action === 'copilot_playbook_step_applied');
  assert.equal(lineageEntry.payload_json.run_id, resumeRes.body.playbook.run_id);
  assert.equal(lineageEntry.payload_json.actor_id, 'manager-001');
  assert.equal(lineageEntry.payload_json.approval_decision, 'approved');
});