'use strict';

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = require.extensions['.js'];
}

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const { canPerformAction } = require('../../../lib/markos/rbac/iam-v32.js');
const { recordApprovalDecision } = require('../../../onboarding/backend/agents/approval-gate.cjs');
const { writeJson, requireCrmTenantContext, getCrmStore, appendCrmActivity } = require('../../../lib/markos/crm/api.cjs');
const { buildCopilotPlaybookRun, applyApprovedPlaybookStep, transitionRun } = require('../../../lib/markos/crm/playbooks.ts');

function resolveTargetTenant(context, requestTenantId) {
  const targetTenantId = requestTenantId ? String(requestTenantId).trim() : context.tenant_id;
  if (targetTenantId !== context.tenant_id && !canPerformAction(context.iamRole, 'review_cross_tenant_copilot')) {
    return {
      ok: false,
      status: 403,
      error: 'CRM_COPILOT_OVERSIGHT_FORBIDDEN',
      message: 'Cross-tenant copilot oversight requires explicit owner authorization.',
    };
  }
  return { ok: true, tenant_id: targetTenantId };
}

function replacePlaybook(store, nextPlaybook) {
  const index = store.copilotPlaybookRuns.findIndex((entry) => entry.playbook_id === nextPlaybook.playbook_id);
  if (index < 0) {
    throw new Error('CRM_COPILOT_PLAYBOOK_NOT_FOUND');
  }
  store.copilotPlaybookRuns.splice(index, 1, nextPlaybook);
  return nextPlaybook;
}

function resolvePlaybook(store, playbookId, tenantId) {
  return store.copilotPlaybookRuns.find((entry) => entry.playbook_id === playbookId && (entry.tenant_id === tenantId || entry.review_tenant_id === tenantId)) || null;
}

function handleListPlaybooks(req, res, context, store, targetTenantId) {
  const playbooks = store.copilotPlaybookRuns.filter((entry) => entry.tenant_id === targetTenantId || entry.review_tenant_id === targetTenantId);
  return writeJson(res, 200, { success: true, target_tenant_id: targetTenantId, playbooks });
}

function handleCreatePlaybook(req, res, context, store, targetTenantId) {
  if (!canPerformAction(context.iamRole, 'run_copilot_playbook')) {
    return writeJson(res, 403, { success: false, error: 'CRM_COPILOT_PLAYBOOK_FORBIDDEN' });
  }
  const created = buildCopilotPlaybookRun({
    crmStore: store,
    tenant_id: targetTenantId,
    review_tenant_id: req.body?.review_tenant_id || targetTenantId,
    actor_id: context.actor_id,
    actor_role: context.iamRole,
    record_kind: req.body?.record_kind,
    record_id: req.body?.record_id,
    playbook_key: req.body?.playbook_key,
    steps: req.body?.steps,
  });
  return writeJson(res, 200, { success: true, playbook: created.playbook, run: created.run });
}

function handleReviewPlaybook(req, res, context, store) {
  const playbook = resolvePlaybook(store, String(req.body?.playbook_id || '').trim(), context.tenant_id);
  if (!playbook) {
    return writeJson(res, 404, { success: false, error: 'CRM_COPILOT_PLAYBOOK_NOT_FOUND' });
  }
  const decisionValue = String(req.body?.decision || '').trim();
  if (!['approved', 'rejected'].includes(decisionValue)) {
    return writeJson(res, 400, { success: false, error: 'CRM_COPILOT_DECISION_INVALID' });
  }
  const decision = recordApprovalDecision({
    run_id: playbook.run_id,
    tenant_id: playbook.review_tenant_id || playbook.tenant_id,
    state: playbook.status,
    actor_id: context.actor_id,
    actor_role: context.iamRole,
    action: decisionValue,
    rationale: req.body?.rationale,
    correlation_id: `${playbook.playbook_id}:${decisionValue}`,
    decisionStore: store.copilotDecisionStore,
  });
  if (!decision.ok) {
    return writeJson(res, decision.statusCode, { success: false, error: decision.error, message: decision.message });
  }
  const run = { run_id: playbook.run_id, tenant_id: playbook.tenant_id, state: playbook.run_state || 'awaiting_approval', correlation_id: `${playbook.playbook_id}:${decisionValue}` };
  transitionRun(run, decisionValue, store, context.actor_id, `copilot_playbook_${decisionValue}`);
  const nextPlaybook = Object.freeze({ ...playbook, status: decisionValue, run_state: run.state, decided_by: context.actor_id, decided_at: decision.decision.created_at });
  replacePlaybook(store, nextPlaybook);
  appendCrmActivity(store, {
    tenant_id: nextPlaybook.review_tenant_id || nextPlaybook.tenant_id,
    activity_family: 'agent_event',
    related_record_kind: nextPlaybook.record_kind || 'copilot_playbook',
    related_record_id: nextPlaybook.record_id || nextPlaybook.playbook_id,
    source_event_ref: `api:crm:copilot:playbook:review:${nextPlaybook.playbook_id}`,
    actor_id: context.actor_id,
    payload_json: {
      action: decisionValue === 'approved' ? 'copilot_playbook_approved' : 'copilot_playbook_rejected',
      playbook_id: nextPlaybook.playbook_id,
      run_id: nextPlaybook.run_id,
    },
  });
  return writeJson(res, 200, { success: true, playbook: nextPlaybook, decision: decision.decision });
}

function handleResumePlaybook(req, res, context, store) {
  const playbook = resolvePlaybook(store, String(req.body?.playbook_id || '').trim(), context.tenant_id);
  if (!playbook) {
    return writeJson(res, 404, { success: false, error: 'CRM_COPILOT_PLAYBOOK_NOT_FOUND' });
  }
  if (playbook.status !== 'approved') {
    return writeJson(res, 409, { success: false, error: 'CRM_COPILOT_PLAYBOOK_NOT_APPROVED' });
  }
  const run = { run_id: playbook.run_id, tenant_id: playbook.tenant_id, state: playbook.run_state || 'approved', correlation_id: `${playbook.playbook_id}:resume` };
  transitionRun(run, 'executing', store, context.actor_id, 'copilot_playbook_resume');
  const results = playbook.steps.map((step) => applyApprovedPlaybookStep({
    crmStore: store,
    playbook,
    step,
    context: {
      tenant_id: playbook.tenant_id,
      actor_id: context.actor_id,
      iamRole: context.iamRole,
    },
  }));
  transitionRun(run, 'completed', store, context.actor_id, 'copilot_playbook_completed');
  const nextPlaybook = Object.freeze({ ...playbook, status: 'completed', run_state: run.state, completed_at: new Date().toISOString() });
  replacePlaybook(store, nextPlaybook);
  return writeJson(res, 200, { success: true, playbook: nextPlaybook, run, results });
}

async function handleCopilotPlaybooks(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  const decision = resolveTargetTenant(context, req.query?.review_tenant_id || req.body?.review_tenant_id);
  if (!decision.ok) {
    return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
  }
  const store = getCrmStore(req);

  if (req.method === 'GET') {
    return handleListPlaybooks(req, res, context, store, decision.tenant_id);
  }
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const action = String(req.body?.action || '').trim();
  if (action === 'create') {
    return handleCreatePlaybook(req, res, context, store, decision.tenant_id);
  }
  if (action === 'review') {
    return handleReviewPlaybook(req, res, context, store);
  }
  if (action === 'resume') {
    return handleResumePlaybook(req, res, context, store);
  }
  return writeJson(res, 400, { success: false, error: 'CRM_COPILOT_PLAYBOOK_ACTION_INVALID' });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleCopilotPlaybooks(req, res);
};

module.exports.handleCopilotPlaybooks = handleCopilotPlaybooks;