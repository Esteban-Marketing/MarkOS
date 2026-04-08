'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
  listWorkspaceObjectDefinitions,
  upsertWorkspaceObjectDefinition,
} = require('../../lib/markos/crm/api.cjs');

async function handleObjectDefinitions(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);

  if (req.method === 'GET') {
    return writeJson(res, 200, {
      success: true,
      definitions: listWorkspaceObjectDefinitions(store, { tenant_id: context.tenant_id }),
    });
  }

  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    const decision = assertCrmMutationAllowed(context, 'object_definition_update');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const body = req.body || {};
    const definition = upsertWorkspaceObjectDefinition(store, {
      ...body,
      tenant_id: context.tenant_id,
    }, context.actor_id);
    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: 'workspace_object',
      related_record_id: definition.record_kind,
      source_event_ref: `api:object-definitions:upsert:${definition.record_kind}`,
      actor_id: context.actor_id,
      payload_json: {
        action: 'workspace_object_updated',
        is_custom_object: definition.is_custom_object,
        calendar_enabled: definition.calendar_enabled,
        funnel_enabled: definition.funnel_enabled,
      },
    });
    return writeJson(res, 200, { success: true, definition });
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
  return handleObjectDefinitions(req, res);
};

module.exports.handleObjectDefinitions = handleObjectDefinitions;