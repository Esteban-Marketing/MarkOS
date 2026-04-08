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
  listDraftSuggestions,
  upsertDraftLifecycle,
} = require('../../../lib/markos/crm/execution.ts');

async function handleExecutionDrafts(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);

  if (req.method === 'GET') {
    const drafts = listDraftSuggestions({
      crmStore: store,
      tenant_id: context.tenant_id,
      actor_id: context.actor_id,
      include_dismissed: req.query?.include_dismissed === 'true',
      now: req.query?.now,
    });
    return writeJson(res, 200, { success: true, drafts });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const decision = assertCrmMutationAllowed(context, 'record_update');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const suggestionId = String(req.body?.suggestion_id || '').trim();
    if (!suggestionId) {
      return writeJson(res, 400, { success: false, error: 'CRM_EXECUTION_SUGGESTION_REQUIRED' });
    }
    const draft = upsertDraftLifecycle(store, {
      suggestion_id: suggestionId,
      tenant_id: context.tenant_id,
      status: 'dismissed',
      dismissed_at: new Date().toISOString(),
    });
    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: 'note',
      related_record_id: suggestionId,
      source_event_ref: `api:execution:drafts:dismiss:${suggestionId}`,
      actor_id: context.actor_id,
      payload_json: {
        action: 'draft_suggestion_dismissed',
        suggestion_id: suggestionId,
      },
    });
    return writeJson(res, 200, { success: true, draft });
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
  return handleExecutionDrafts(req, res);
};

module.exports.handleExecutionDrafts = handleExecutionDrafts;