'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
  createCrmEntity,
  updateCrmEntity,
  listCrmEntities,
} = require('../../lib/markos/crm/api.cjs');

function mergeAttributes(record, body) {
  const nextAttributes = record.attributes ? { ...record.attributes } : {};
  if (body.attributes && typeof body.attributes === 'object') {
    Object.assign(nextAttributes, body.attributes);
  }
  if (body.pipeline_key) {
    nextAttributes.pipeline_key = body.pipeline_key;
  }
  if (body.stage_key) {
    nextAttributes.stage_key = body.stage_key;
  }
  if (body.field_key) {
    nextAttributes[body.field_key] = body.value;
  }
  return nextAttributes;
}

function getMutationAction(body) {
  if (body.stage_key) {
    return 'stage_change';
  }
  if (body.field_key) {
    return 'field_update';
  }
  return 'record_update';
}

async function handleRecords(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);
  const query = req.query || {};

  if (req.method === 'GET') {
    const records = listCrmEntities(store, {
      tenant_id: context.tenant_id,
      record_kind: query.record_kind,
      search: query.search,
    }).filter((record) => !query.pipeline_key || String(record.attributes?.pipeline_key || '') === String(query.pipeline_key));
    return writeJson(res, 200, { success: true, records });
  }

  if (req.method === 'POST') {
    const decision = assertCrmMutationAllowed(context, 'record_create');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const body = req.body || {};
    const record = createCrmEntity(store, {
      entity_id: body.entity_id,
      tenant_id: context.tenant_id,
      record_kind: body.record_kind,
      display_name: body.display_name,
      status: body.status,
      attributes: body.attributes || {},
    });
    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: record.record_kind,
      related_record_id: record.entity_id,
      source_event_ref: `api:records:create:${record.entity_id}`,
      actor_id: context.actor_id,
      payload_json: { action: 'record_create' },
    });
    return writeJson(res, 200, { success: true, record });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const decision = assertCrmMutationAllowed(context, 'record_update');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const body = req.body || {};
    const existing = listCrmEntities(store, { tenant_id: context.tenant_id, record_kind: body.record_kind || undefined }).find((record) => record.entity_id === body.entity_id);
    if (!existing) {
      return writeJson(res, 404, { success: false, error: 'CRM_ENTITY_NOT_FOUND' });
    }
    const record = updateCrmEntity(store, {
      tenant_id: context.tenant_id,
      entity_id: body.entity_id,
    }, {
      display_name: body.display_name || existing.display_name,
      status: body.status || existing.status,
      attributes: mergeAttributes(existing, body),
    });
    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: record.record_kind,
      related_record_id: record.entity_id,
      source_event_ref: `api:records:update:${record.entity_id}`,
      actor_id: context.actor_id,
      payload_json: {
        action: getMutationAction(body),
        field_key: body.field_key || null,
        stage_key: body.stage_key || null,
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
  return handleRecords(req, res);
};

module.exports.handleRecords = handleRecords;