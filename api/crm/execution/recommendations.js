'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
} = require('../../../lib/markos/crm/api.cjs');
const {
  buildExecutionRecommendations,
  upsertRecommendationLifecycle,
} = require('../../../lib/markos/crm/execution.ts');

async function handleExecutionRecommendations(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);

  if (req.method === 'GET') {
    const recommendations = buildExecutionRecommendations({
      crmStore: store,
      tenant_id: context.tenant_id,
      actor_id: context.actor_id,
      include_dismissed: req.query?.include_dismissed === 'true',
      now: req.query?.now,
    });
    return writeJson(res, 200, { success: true, recommendations });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const decision = assertCrmMutationAllowed(context, 'record_update');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }

    const body = req.body || {};
    const recommendationId = String(body.recommendation_id || '').trim();
    const lifecycleAction = String(body.action || 'dismiss').trim();
    if (!recommendationId) {
      return writeJson(res, 400, { success: false, error: 'CRM_EXECUTION_RECOMMENDATION_REQUIRED' });
    }
    if (!['dismiss', 'approve', 'restore', 'snooze'].includes(lifecycleAction)) {
      return writeJson(res, 400, { success: false, error: 'CRM_EXECUTION_RECOMMENDATION_ACTION_INVALID' });
    }

    const status = lifecycleAction === 'dismiss'
      ? 'dismissed'
      : lifecycleAction === 'approve'
        ? 'approved'
        : 'active';
    const record = upsertRecommendationLifecycle(store, {
      recommendation_id: recommendationId,
      tenant_id: context.tenant_id,
      status,
      dismissed_at: lifecycleAction === 'dismiss' ? new Date().toISOString() : null,
      snoozed_until: lifecycleAction === 'snooze' ? body.snoozed_until : null,
      approved_at: lifecycleAction === 'approve' ? new Date().toISOString() : null,
    });

    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: 'task',
      related_record_id: recommendationId,
      source_event_ref: `api:execution:recommendations:${lifecycleAction}:${recommendationId}`,
      actor_id: context.actor_id,
      payload_json: {
        action: `recommendation_${lifecycleAction}`,
        recommendation_id: recommendationId,
      },
    });

    return writeJson(res, 200, { success: true, recommendation: record });
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
  return handleExecutionRecommendations(req, res);
};

module.exports.handleExecutionRecommendations = handleExecutionRecommendations;