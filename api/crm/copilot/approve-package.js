'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const { assertTransitionAllowed } = require('../../../onboarding/backend/agents/run-engine.cjs');
const { recordApprovalDecision } = require('../../../onboarding/backend/agents/approval-gate.cjs');
const { writeJson, requireCrmTenantContext, getCrmStore, appendCrmActivity } = require('../../../lib/markos/crm/api.cjs');
const { recordAgentMutationOutcome } = require('../../../lib/markos/crm/agent-actions.ts');

function updateStoredPackage(store, nextPackage) {
  const index = store.copilotApprovalPackages.findIndex((entry) => entry.package_id === nextPackage.package_id);
  if (index < 0) {
    throw new Error('CRM_COPILOT_PACKAGE_NOT_FOUND');
  }
  store.copilotApprovalPackages.splice(index, 1, nextPackage);
  return nextPackage;
}

function advanceRunState(store, context, approvalPackage, toState, reason) {
  const events = store.copilotEventStore.listEventsForRun(approvalPackage.run_id);
  const latestTransition = events.filter((entry) => entry.event_type === 'agent_run_transitioned').slice(-1)[0];
  const fromState = latestTransition ? latestTransition.to_state : approvalPackage.run_state || 'awaiting_approval';
  const transition = assertTransitionAllowed({
    run_id: approvalPackage.run_id,
    tenant_id: approvalPackage.tenant_id,
    from_state: fromState,
    to_state: toState,
    eventStore: store.copilotEventStore,
    actor_id: context.actor_id,
    correlation_id: approvalPackage.immutable_lineage?.correlation_id,
    reason,
  });
  if (!transition.allowed) {
    throw new Error(transition.error_code || 'AGENT_RUN_INVALID_TRANSITION');
  }
  return toState;
}

async function handleCopilotPackageApproval(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const store = getCrmStore(req);
  const body = req.body || {};
  const packageId = String(body.package_id || '').trim();
  const decisionValue = String(body.decision || '').trim();
  if (!packageId) {
    return writeJson(res, 400, { success: false, error: 'CRM_COPILOT_PACKAGE_REQUIRED' });
  }
  if (!['approved', 'rejected'].includes(decisionValue)) {
    return writeJson(res, 400, { success: false, error: 'CRM_COPILOT_DECISION_INVALID' });
  }

  const approvalPackage = store.copilotApprovalPackages.find((entry) => entry.package_id === packageId);
  if (!approvalPackage || ![approvalPackage.tenant_id, approvalPackage.review_tenant_id].includes(context.tenant_id)) {
    return writeJson(res, 404, { success: false, error: 'CRM_COPILOT_PACKAGE_NOT_FOUND' });
  }

  const decision = recordApprovalDecision({
    run_id: approvalPackage.run_id,
    tenant_id: approvalPackage.review_tenant_id || approvalPackage.tenant_id,
    state: approvalPackage.status,
    actor_id: context.actor_id,
    actor_role: context.iamRole,
    action: decisionValue,
    rationale: body.rationale,
    correlation_id: approvalPackage.immutable_lineage?.correlation_id || approvalPackage.package_id,
    decisionStore: store.copilotDecisionStore,
  });
  if (!decision.ok) {
    return writeJson(res, decision.statusCode, { success: false, error: decision.error, message: decision.message });
  }

  const runState = advanceRunState(store, context, approvalPackage, decisionValue, `copilot_package_${decisionValue}`);
  const nextPackage = Object.freeze({
    ...approvalPackage,
    status: decisionValue,
    run_state: runState,
    decision_id: decision.decision.decision_id,
    decided_at: decision.decision.created_at,
    decided_by: context.actor_id,
  });
  updateStoredPackage(store, nextPackage);

  const outcome = recordAgentMutationOutcome(store, {
    package_id: nextPackage.package_id,
    tenant_id: nextPackage.tenant_id,
    review_tenant_id: nextPackage.review_tenant_id,
    run_id: nextPackage.run_id,
    mutation_family: nextPackage.mutation_family,
    status: decisionValue,
    actor_id: context.actor_id,
    actor_role: context.iamRole,
    related_record_kind: nextPackage.target_record_kind,
    related_record_id: nextPackage.target_record_id,
    payload_json: {
      decision_id: decision.decision.decision_id,
      rationale: body.rationale || null,
    },
  });

  appendCrmActivity(store, {
    tenant_id: nextPackage.review_tenant_id || nextPackage.tenant_id,
    activity_family: 'agent_event',
    related_record_kind: nextPackage.target_record_kind || 'copilot_package',
    related_record_id: nextPackage.target_record_id || nextPackage.package_id,
    source_event_ref: `api:crm:copilot:package:${decisionValue}:${nextPackage.package_id}`,
    actor_id: context.actor_id,
    payload_json: {
      action: decisionValue === 'approved' ? 'copilot_package_approved' : 'copilot_package_rejected',
      package_id: nextPackage.package_id,
      run_id: nextPackage.run_id,
      mutation_family: nextPackage.mutation_family,
    },
  });

  return writeJson(res, 200, { success: true, approval_package: nextPackage, decision: decision.decision, outcome });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleCopilotPackageApproval(req, res);
};

module.exports.handleCopilotPackageApproval = handleCopilotPackageApproval;