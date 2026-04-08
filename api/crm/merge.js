'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  recordMergeDecision,
  applyApprovedMerge,
} = require('../../lib/markos/crm/api.cjs');

async function handleMerge(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  const decision = assertCrmMutationAllowed(context, 'merge_review');
  if (!decision.allowed) {
    return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
  }
  const body = req.body || {};
  const store = getCrmStore(req);
  const result = body.decision_state === 'accepted'
    ? applyApprovedMerge(store, {
        ...body,
        tenant_id: context.tenant_id,
        reviewer_actor_id: context.actor_id,
      })
    : recordMergeDecision(store, {
        ...body,
        tenant_id: context.tenant_id,
        reviewer_actor_id: context.actor_id,
      });
  return writeJson(res, 200, { success: true, decision: result, lineage: store.mergeLineage.filter((row) => row.merge_decision_id === result.merge_decision_id) });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleMerge(req, res);
};

module.exports.handleMerge = handleMerge;
