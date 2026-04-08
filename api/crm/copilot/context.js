'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const { writeJson, requireCrmTenantContext, getCrmStore } = require('../../../lib/markos/crm/api.cjs');
const { buildCopilotGroundingBundle } = require('../../../lib/markos/crm/copilot.ts');
const { canPerformAction } = require('../../../lib/markos/rbac/iam-v32.js');

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

async function handleCopilotContext(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  const decision = resolveTargetTenant(context, req.query?.review_tenant_id || req.body?.review_tenant_id);
  if (!decision.ok) {
    return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
  }
  const store = getCrmStore(req);
  const grounding = buildCopilotGroundingBundle({
    crmStore: store,
    tenant_id: decision.tenant_id,
    actor_id: context.actor_id,
    record_kind: req.query?.record_kind || req.body?.record_kind,
    record_id: req.query?.record_id || req.body?.record_id,
    conversation_id: req.query?.conversation_id || req.body?.conversation_id,
  });
  return writeJson(res, 200, { success: true, grounding, target_tenant_id: decision.tenant_id });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleCopilotContext(req, res);
};

module.exports.handleCopilotContext = handleCopilotContext;