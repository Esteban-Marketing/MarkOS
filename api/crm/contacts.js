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

async function handleContacts(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);

  if (req.method === 'GET') {
    const rows = listCrmEntities(store, {
      tenant_id: context.tenant_id,
      record_kind: 'contact',
      search: req.query && req.query.search,
    });
    return writeJson(res, 200, { success: true, tenant_id: context.tenant_id, records: rows });
  }

  if (req.method === 'POST') {
    const decision = assertCrmMutationAllowed(context, 'contact_create');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const body = req.body || {};
    const record = createCrmEntity(store, {
      entity_id: body.entity_id,
      tenant_id: context.tenant_id,
      record_kind: 'contact',
      display_name: body.display_name,
      attributes: body.attributes || {},
    });
    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: 'contact',
      related_record_id: record.entity_id,
      source_event_ref: `api:contacts:create:${record.entity_id}`,
      actor_id: context.actor_id,
      payload_json: { action: 'create_contact' },
    });
    return writeJson(res, 200, { success: true, record });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const decision = assertCrmMutationAllowed(context, 'contact_update');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const body = req.body || {};
    const record = updateCrmEntity(store, {
      tenant_id: context.tenant_id,
      entity_id: body.entity_id,
    }, {
      display_name: body.display_name,
      status: body.status,
      attributes: body.attributes,
    });
    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: 'contact',
      related_record_id: record.entity_id,
      source_event_ref: `api:contacts:update:${record.entity_id}`,
      actor_id: context.actor_id,
      payload_json: { action: 'update_contact' },
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
  return handleContacts(req, res);
};

module.exports.handleContacts = handleContacts;
