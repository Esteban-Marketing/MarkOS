'use strict';

const crypto = require('crypto');

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const { createRunEnvelope, assertTransitionAllowed } = require('../../../onboarding/backend/agents/run-engine.cjs');
const { canPerformAction } = require('../../../lib/markos/rbac/iam-v32.js');
const { writeJson, requireCrmTenantContext, getCrmStore, appendCrmActivity } = require('../../../lib/markos/crm/api.cjs');
const { buildCopilotGroundingBundle, generateCopilotSummaryModel, packageRecommendationAction } = require('../../../lib/markos/crm/copilot.ts');
const { assertAgentMutationAllowed, buildApprovalPackage } = require('../../../lib/markos/crm/agent-actions.ts');

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

function buildSummaryPayload(store, context, input = {}) {
  const grounding = buildCopilotGroundingBundle({
    crmStore: store,
    tenant_id: input.tenant_id,
    actor_id: context.actor_id,
    record_kind: input.record_kind,
    record_id: input.record_id,
    conversation_id: input.conversation_id,
  });
  const summary = generateCopilotSummaryModel(grounding, { mode: input.mode });
  return { grounding, summary, recommendations: summary.recommendations || [] };
}

function resolveRecommendation(summaryPayload, body = {}) {
  const recommendationId = String(body.recommendation_id || '').trim();
  const actionKey = String(body.mutation_family || body.action_key || '').trim();
  if (recommendationId) {
    const matched = summaryPayload.recommendations.find((entry) => entry.recommendation_id === recommendationId);
    if (matched) {
      return matched;
    }
  }
  if (actionKey) {
    const matched = summaryPayload.recommendations.find((entry) => entry.action_key === actionKey);
    if (matched) {
      return matched;
    }
  }
  return packageRecommendationAction(summaryPayload.grounding, {
    action_key: actionKey || 'append_note',
    proposed_changes: body.proposed_changes || {},
    summary: 'Fallback package created from grounded CRM context.',
  });
}

function applyRunTransition(run, toState, context, store, reason) {
  const transition = assertTransitionAllowed({
    run_id: run.run_id,
    tenant_id: run.tenant_id,
    from_state: run.state,
    to_state: toState,
    eventStore: store.copilotEventStore,
    actor_id: context.actor_id,
    correlation_id: run.correlation_id,
    reason,
  });
  if (!transition.allowed) {
    throw new Error(transition.error_code || 'AGENT_RUN_INVALID_TRANSITION');
  }
  run.state = toState;
  run.updated_at = new Date().toISOString();
  return run;
}

function handleGetRecommendations(req, res, context, store, targetTenantId) {
  const payload = buildSummaryPayload(store, context, {
    tenant_id: targetTenantId,
    record_kind: req.query?.record_kind,
    record_id: req.query?.record_id,
    conversation_id: req.query?.conversation_id,
    mode: req.query?.mode,
  });
  return writeJson(res, 200, { success: true, ...payload, target_tenant_id: targetTenantId });
}

function handlePackageRecommendation(req, res, context, store, targetTenantId) {
  const body = req.body || {};
  const payload = buildSummaryPayload(store, context, {
    tenant_id: targetTenantId,
    record_kind: body.record_kind,
    record_id: body.record_id,
    conversation_id: body.conversation_id,
    mode: body.mode || 'conversation',
  });
  const recommendation = resolveRecommendation(payload, body);
  const policy = assertAgentMutationAllowed(context, body.mutation_family || recommendation.action_key, {
    review_tenant_id: body.review_tenant_id,
  });
  if (!policy.allowed) {
    return writeJson(res, policy.status, { success: false, error: policy.error, message: policy.message });
  }

  const packageId = `copilot-package-${crypto.randomUUID()}`;
  const correlationId = String(body.correlation_id || `corr-${crypto.randomUUID()}`);
  const envelope = createRunEnvelope({
    tenant_id: targetTenantId,
    actor_id: context.actor_id,
    correlation_id: correlationId,
    idempotency_key: body.idempotency_key || packageId,
    provider_policy: { mode: 'grounded_copilot', package_id: packageId },
    tool_policy: { mutations: 'approval_required', mutation_family: recommendation.action_key },
    registry: store.copilotRunRegistry,
  });
  const run = envelope.run;
  applyRunTransition(run, 'accepted', context, store, 'copilot_package_requested');
  applyRunTransition(run, 'context_loaded', context, store, 'copilot_context_grounded');
  applyRunTransition(run, 'executing', context, store, 'copilot_package_prepared');
  applyRunTransition(run, 'awaiting_approval', context, store, 'copilot_package_requires_review');

  const approvalPackage = Object.freeze({
    ...buildApprovalPackage({
      package_id: packageId,
      tenant_id: targetTenantId,
      review_tenant_id: policy.review_tenant_id,
      run_id: run.run_id,
      mutation_family: recommendation.action_key,
      target_record_kind: recommendation.target_record_kind || body.record_kind,
      target_record_id: recommendation.target_record_id || body.record_id,
      actor_id: context.actor_id,
      actor_role: context.iamRole,
      rationale: recommendation.rationale,
      evidence: recommendation.evidence,
      proposed_changes: body.proposed_changes || recommendation.proposed_changes,
      correlation_id: correlationId,
      request_id: correlationId,
    }),
    recommendation_id: recommendation.recommendation_id,
    run_state: run.state,
  });
  store.copilotApprovalPackages.push(approvalPackage);

  appendCrmActivity(store, {
    tenant_id: policy.review_tenant_id,
    activity_family: 'agent_event',
    related_record_kind: approvalPackage.target_record_kind || 'copilot_package',
    related_record_id: approvalPackage.target_record_id || approvalPackage.package_id,
    source_event_ref: `api:crm:copilot:recommendations:package:${approvalPackage.package_id}`,
    actor_id: context.actor_id,
    payload_json: {
      action: 'copilot_recommendation_packaged',
      package_id: approvalPackage.package_id,
      recommendation_id: approvalPackage.recommendation_id,
      run_id: approvalPackage.run_id,
      mutation_family: approvalPackage.mutation_family,
    },
  });

  return writeJson(res, 200, {
    success: true,
    approval_package: approvalPackage,
    run,
    recommendation,
    summary: payload.summary,
    grounding: payload.grounding,
  });
}

async function handleCopilotRecommendations(req, res) {
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
    return handleGetRecommendations(req, res, context, store, decision.tenant_id);
  }
  if (req.method === 'POST') {
    return handlePackageRecommendation(req, res, context, store, decision.tenant_id);
  }
  return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleCopilotRecommendations(req, res);
};

module.exports.handleCopilotRecommendations = handleCopilotRecommendations;