'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
  listCrmEntities,
  updateCrmEntity,
} = require('../../../lib/markos/crm/api.cjs');
const { upsertRecommendationLifecycle } = require('../../../lib/markos/crm/execution.ts');
const { createTaskRecord } = require('../tasks.js');
const { createNoteRecord } = require('../notes.js');

function updateRecordFromAction(store, context, body = {}) {
  const entityId = String(body.record_id || body.entity_id || '').trim();
  const recordKind = String(body.record_kind || '').trim();
  const existing = listCrmEntities(store, { tenant_id: context.tenant_id, record_kind: recordKind }).find((record) => record.entity_id === entityId);
  if (!existing) {
    throw new Error('CRM_ENTITY_NOT_FOUND');
  }
  const nextAttributes = {
    ...(existing.attributes || {}),
  };
  ['stage_key', 'owner_actor_id', 'priority', 'status'].forEach((fieldKey) => {
    if (body[fieldKey] !== undefined) {
      nextAttributes[fieldKey] = body[fieldKey];
    }
  });
  const record = updateCrmEntity(store, { tenant_id: context.tenant_id, entity_id: entityId }, {
    status: body.status || existing.status,
    attributes: nextAttributes,
  });
  appendCrmActivity(store, {
    tenant_id: context.tenant_id,
    activity_family: 'crm_mutation',
    related_record_kind: record.record_kind,
    related_record_id: record.entity_id,
    source_event_ref: `api:execution:actions:update:${record.entity_id}`,
    actor_id: context.actor_id,
    payload_json: {
      action: 'execution_safe_record_update',
      recommendation_id: body.recommendation_id || null,
      fields: ['stage_key', 'owner_actor_id', 'priority', 'status'].filter((fieldKey) => body[fieldKey] !== undefined),
    },
  });
  return record;
}

async function handleExecutionActions(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const decision = assertCrmMutationAllowed(context, 'record_update');
  if (!decision.allowed) {
    return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
  }

  const store = getCrmStore(req);
  const body = req.body || {};
  const actionKey = String(body.action_key || '').trim();

  if (['send_email', 'send_sms', 'send_whatsapp', 'start_sequence', 'delivery_transition'].includes(actionKey)) {
    return writeJson(res, 400, { success: false, error: 'CRM_EXECUTION_BOUNDARY_FORBIDDEN' });
  }

  try {
    if (actionKey === 'create_task') {
      const task = createTaskRecord(store, context, {
        title: body.title,
        linked_record_kind: body.record_kind,
        linked_record_id: body.record_id,
        due_at: body.due_at,
        assigned_actor_id: body.assigned_actor_id || body.owner_actor_id,
        priority: body.priority,
        recommendation_id: body.recommendation_id,
      });
      return writeJson(res, 200, { success: true, task });
    }

    if (actionKey === 'append_note') {
      const note = createNoteRecord(store, context, {
        title: body.title,
        linked_record_kind: body.record_kind,
        linked_record_id: body.record_id,
        body_markdown: body.body_markdown,
        recommendation_id: body.recommendation_id,
      });
      return writeJson(res, 200, { success: true, note });
    }

    if (actionKey === 'update_record') {
      const record = updateRecordFromAction(store, context, body);
      return writeJson(res, 200, { success: true, record });
    }

    if (actionKey === 'approve_recommendation') {
      const recommendation = upsertRecommendationLifecycle(store, {
        recommendation_id: body.recommendation_id,
        tenant_id: context.tenant_id,
        status: 'approved',
        approved_at: new Date().toISOString(),
      });
      appendCrmActivity(store, {
        tenant_id: context.tenant_id,
        activity_family: 'crm_mutation',
        related_record_kind: body.record_kind || 'task',
        related_record_id: body.record_id || body.recommendation_id,
        source_event_ref: `api:execution:actions:approve:${body.recommendation_id}`,
        actor_id: context.actor_id,
        payload_json: {
          action: 'recommendation_approved',
          recommendation_id: body.recommendation_id,
        },
      });
      return writeJson(res, 200, { success: true, recommendation });
    }
  } catch (error) {
    if (error && error.message === 'CRM_ENTITY_NOT_FOUND') {
      return writeJson(res, 404, { success: false, error: error.message });
    }
    throw error;
  }

  return writeJson(res, 400, { success: false, error: 'CRM_EXECUTION_ACTION_INVALID' });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleExecutionActions(req, res);
};

module.exports.handleExecutionActions = handleExecutionActions;