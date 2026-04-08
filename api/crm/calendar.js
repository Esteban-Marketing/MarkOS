'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
  listCrmEntities,
  updateCrmEntity,
  listWorkspaceObjectDefinitions,
} = require('../../lib/markos/crm/api.cjs');

const workspace = require('../../lib/markos/crm/workspace.ts');

function resolveObjectDefinition(store, tenantId, recordKind) {
  return listWorkspaceObjectDefinitions(store, { tenant_id: tenantId })
    .find((entry) => entry.record_kind === recordKind) || null;
}

async function handleCalendar(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);
  const query = req.query || {};
  const recordKind = String(query.object_kind || req.body?.record_kind || 'deal').trim();
  const objectDefinition = resolveObjectDefinition(store, context.tenant_id, recordKind);

  if (req.method === 'GET') {
    const state = workspace.createWorkspaceState({
      tenant_id: context.tenant_id,
      object_kind: recordKind,
      view_type: 'calendar',
      pipeline_key: query.pipeline_key ? String(query.pipeline_key).trim() : null,
      filters: {
        search: query.search || '',
        stage_key: query.stage_key || '',
      },
      records: listCrmEntities(store, {
        tenant_id: context.tenant_id,
        record_kind: recordKind,
        search: query.search,
      }),
    });

    return writeJson(res, 200, {
      success: true,
      entries: workspace.buildCalendarEntries({ state, object_definition: objectDefinition || {} }),
      object_definition: objectDefinition,
    });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const decision = assertCrmMutationAllowed(context, 'record_update');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    if (objectDefinition?.calendar_enabled !== true || !objectDefinition?.calendar_date_field_key) {
      return writeJson(res, 400, { success: false, error: 'CRM_CALENDAR_NOT_ENABLED' });
    }

    const body = req.body || {};
    const entityId = String(body.entity_id || '').trim();
    if (!entityId || !String(body.value || '').trim()) {
      return writeJson(res, 400, { success: false, error: 'CRM_CALENDAR_RESCHEDULE_INVALID' });
    }

    const existing = listCrmEntities(store, { tenant_id: context.tenant_id, record_kind: recordKind })
      .find((record) => record.entity_id === entityId);
    if (!existing) {
      return writeJson(res, 404, { success: false, error: 'CRM_ENTITY_NOT_FOUND' });
    }

    const record = updateCrmEntity(store, {
      tenant_id: context.tenant_id,
      entity_id: entityId,
    }, {
      attributes: {
        ...(existing.attributes ? existing.attributes : {}),
        [objectDefinition.calendar_date_field_key]: String(body.value).trim(),
      },
    });

    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: record.record_kind,
      related_record_id: record.entity_id,
      source_event_ref: `api:calendar:reschedule:${record.entity_id}`,
      actor_id: context.actor_id,
      payload_json: {
        action: 'calendar_reschedule',
        field_key: objectDefinition.calendar_date_field_key,
        value: String(body.value).trim(),
      },
    });

    return writeJson(res, 200, { success: true, record });
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
  return handleCalendar(req, res);
};

module.exports.handleCalendar = handleCalendar;