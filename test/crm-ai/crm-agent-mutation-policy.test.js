const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { getCrmStore } = require('../../lib/markos/crm/api.cjs');
const { buildApprovalPackage, assertAgentMutationAllowed, recordAgentMutationOutcome } = require('../../lib/markos/crm/agent-actions.ts');

const telemetryPath = path.join(__dirname, '../..', 'lib/markos/telemetry/events.ts');
const policiesPath = path.join(__dirname, '../..', 'lib/markos/rbac/policies.ts');
const iamPath = path.join(__dirname, '../..', 'lib/markos/rbac/iam-v32.js');

function contextFor(role, tenantId = 'tenant-alpha-001', actorId = `${role}-actor-001`) {
  return {
    tenant_id: tenantId,
    iamRole: role,
    actor_id: actorId,
  };
}

test('AI-CRM-02: bounded mutation families are explicit, approval-aware, and fail closed for unauthorized roles', () => {
  const allowed = assertAgentMutationAllowed(contextFor('manager'), 'create_task');
  const denied = assertAgentMutationAllowed(contextFor('readonly'), 'create_task');
  const invalid = assertAgentMutationAllowed(contextFor('manager'), 'silent_send');

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.approval_required, true);
  assert.equal(denied.allowed, false);
  assert.equal(denied.status, 403);
  assert.equal(invalid.allowed, false);
  assert.equal(invalid.status, 400);
});

test('AI-CRM-02: approval packages preserve immutable lineage and AI-originated mutation outcome evidence', () => {
  const store = getCrmStore({ crmStore: { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] } });
  const approvalPackage = buildApprovalPackage({
    package_id: 'pkg-001',
    tenant_id: 'tenant-alpha-001',
    run_id: 'copilot-run-001',
    mutation_family: 'append_note',
    target_record_kind: 'deal',
    target_record_id: 'deal-001',
    actor_id: 'manager-actor-001',
    actor_role: 'manager',
    correlation_id: 'req-001',
    rationale: { summary: 'Capture the risk in a canonical note.' },
    evidence: [{ key: 'timeline_count', value: 2 }],
    proposed_changes: { body_markdown: 'Grounded note' },
  });
  const outcome = recordAgentMutationOutcome(store, {
    package_id: approvalPackage.package_id,
    tenant_id: approvalPackage.tenant_id,
    review_tenant_id: approvalPackage.review_tenant_id,
    run_id: approvalPackage.run_id,
    mutation_family: approvalPackage.mutation_family,
    status: 'approved',
    actor_id: 'reviewer-actor-001',
    actor_role: 'reviewer',
    related_record_kind: 'deal',
    related_record_id: 'deal-001',
    payload_json: { approval_package_id: approvalPackage.package_id },
  });

  assert.equal(approvalPackage.approval_required, true);
  assert.equal(approvalPackage.status, 'awaiting_approval');
  assert.equal(approvalPackage.immutable_lineage.correlation_id, 'req-001');
  assert.equal(outcome.status, 'approved');
  assert.ok(store.activities.some((entry) => entry.activity_family === 'agent_event' && entry.payload_json.package_id === 'pkg-001'));
});

test('AI-CRM-02: telemetry and RBAC vocabularies declare copilot actions explicitly', () => {
  const telemetrySource = fs.readFileSync(telemetryPath, 'utf8');
  const policiesSource = fs.readFileSync(policiesPath, 'utf8');
  const iamSource = fs.readFileSync(iamPath, 'utf8');

  assert.match(telemetrySource, /markos_crm_copilot_summary_generated/);
  assert.match(telemetrySource, /markos_crm_copilot_recommendation_packaged/);
  assert.match(telemetrySource, /markos_crm_copilot_mutation_committed/);
  assert.match(policiesSource, /package_copilot_action/);
  assert.match(policiesSource, /review_cross_tenant_copilot/);
  assert.match(iamSource, /run_copilot_playbook/);
});