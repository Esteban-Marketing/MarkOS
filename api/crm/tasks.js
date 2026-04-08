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

function createTaskRecord(store, context, body = {}) {
  const task = createCrmEntity(store, {
    entity_id: body.entity_id || `task-${Date.now()}`,
    tenant_id: context.tenant_id,
    record_kind: 'task',
    display_name: body.title || body.display_name || 'Execution task',
    status: body.status || 'open',
    linked_record_kind: body.linked_record_kind,
    linked_record_id: body.linked_record_id,
    attributes: {
      due_at: body.due_at || null,
      assigned_actor_id: body.assigned_actor_id || context.actor_id,
      priority: body.priority || 'medium',
      recommendation_id: body.recommendation_id || null,
    },
  });
  appendCrmActivity(store, {
    tenant_id: context.tenant_id,
    activity_family: 'task',
    related_record_kind: task.linked_record_kind || 'task',
    related_record_id: task.linked_record_id || task.entity_id,
    source_event_ref: `api:tasks:create:${task.entity_id}`,
    actor_id: context.actor_id,
    payload_json: {
      action: 'task_created',
      task_id: task.entity_id,
      assigned_actor_id: task.attributes.assigned_actor_id,
      recommendation_id: body.recommendation_id || null,
    },
  });
  return task;
}

async function handleTasks(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);
  if (req.method === 'GET') {
    const tasks = listCrmEntities(store, { tenant_id: context.tenant_id, record_kind: 'task' })
      .filter((task) => !req.query?.linked_record_id || task.linked_record_id === req.query.linked_record_id);
    return writeJson(res, 200, { success: true, tasks });
  }

  if (req.method === 'POST') {
    const decision = assertCrmMutationAllowed(context, 'record_create');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const task = createTaskRecord(store, context, req.body || {});
    return writeJson(res, 200, { success: true, task });
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
  return handleTasks(req, res);
};

module.exports.handleTasks = handleTasks;
module.exports.createTaskRecord = createTaskRecord;