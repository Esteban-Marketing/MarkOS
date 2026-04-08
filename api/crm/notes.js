'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
  createCrmEntity,
  listCrmEntities,
} = require('../../lib/markos/crm/api.cjs');

function createNoteRecord(store, context, body = {}) {
  const note = createCrmEntity(store, {
    entity_id: body.entity_id || `note-${Date.now()}`,
    tenant_id: context.tenant_id,
    record_kind: 'note',
    display_name: body.title || 'Execution note',
    status: 'active',
    linked_record_kind: body.linked_record_kind,
    linked_record_id: body.linked_record_id,
    attributes: {
      body_markdown: body.body_markdown || '',
      recommendation_id: body.recommendation_id || null,
    },
  });
  appendCrmActivity(store, {
    tenant_id: context.tenant_id,
    activity_family: 'note',
    related_record_kind: note.linked_record_kind || 'note',
    related_record_id: note.linked_record_id || note.entity_id,
    source_event_ref: `api:notes:create:${note.entity_id}`,
    actor_id: context.actor_id,
    payload_json: {
      action: 'note_created',
      note_id: note.entity_id,
      recommendation_id: body.recommendation_id || null,
    },
  });
  return note;
}

async function handleNotes(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);
  if (req.method === 'GET') {
    const notes = listCrmEntities(store, { tenant_id: context.tenant_id, record_kind: 'note' })
      .filter((note) => !req.query?.linked_record_id || note.linked_record_id === req.query.linked_record_id);
    return writeJson(res, 200, { success: true, notes });
  }

  if (req.method === 'POST') {
    const decision = assertCrmMutationAllowed(context, 'record_create');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const note = createNoteRecord(store, context, req.body || {});
    return writeJson(res, 200, { success: true, note });
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
  return handleNotes(req, res);
};

module.exports.handleNotes = handleNotes;
module.exports.createNoteRecord = createNoteRecord;