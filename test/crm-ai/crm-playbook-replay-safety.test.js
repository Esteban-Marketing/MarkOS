const test = require('node:test');
const assert = require('node:assert/strict');

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = require.extensions['.js'];
}

const { buildCopilotPlaybookRun, applyApprovedPlaybookStep } = require('../../lib/markos/crm/playbooks.ts');

test('AI-CRM-02: replay-safe playbook steps cannot duplicate durable CRM side effects', () => {
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
  const context = { tenant_id: 'tenant-alpha-001', iamRole: 'manager', actor_id: 'manager-001' };
  const created = buildCopilotPlaybookRun({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'manager-001',
    actor_role: 'manager',
    record_kind: 'deal',
    record_id: 'deal-001',
    playbook_key: 'deal_followup',
    steps: [
      { action_key: 'create_task', proposed_changes: { title: 'Confirm rollout plan' } },
    ],
  });
  const playbook = created.playbook;

  const first = applyApprovedPlaybookStep({ crmStore: store, playbook, step: playbook.steps[0], context });
  const second = applyApprovedPlaybookStep({ crmStore: store, playbook, step: playbook.steps[0], context });

  assert.equal(first.applied, true);
  assert.equal(second.applied, false);
  assert.equal(second.reason, 'IDEMPOTENT_REDELIVERY');
  assert.equal(store.entities.filter((entry) => entry.record_kind === 'task').length, 1);
});