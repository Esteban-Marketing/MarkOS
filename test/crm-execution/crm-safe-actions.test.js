const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleExecutionActions } = require('../../api/crm/execution/actions.js');
const { handleTasks } = require('../../api/crm/tasks.js');
const { handleNotes } = require('../../api/crm/notes.js');

function authFor(role, tenantId = 'tenant-alpha-001', actorId = `${role}-actor-001`) {
  return {
    tenant_id: tenantId,
    iamRole: role,
    principal: {
      id: actorId,
      tenant_id: tenantId,
      tenant_role: role,
    },
  };
}

function makeReq({ method = 'GET', auth = null, crmStore = null, body = {}, query = {} } = {}) {
  return {
    method,
    body,
    query,
    crmStore,
    markosAuth: auth,
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

test('CRM-06: execution actions create canonical tasks and notes with audit lineage', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { owner_actor_id: 'manager-actor-001', amount: 2000 },
  });

  const taskReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: { action_key: 'create_task', record_kind: 'deal', record_id: 'deal-001', title: 'Call champion', recommendation_id: 'rec-001' },
  });
  const taskRes = makeRes();
  await handleExecutionActions(taskReq, taskRes);

  const noteReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: { action_key: 'append_note', record_kind: 'deal', record_id: 'deal-001', body_markdown: 'Documented next step', recommendation_id: 'rec-001' },
  });
  const noteRes = makeRes();
  await handleExecutionActions(noteReq, noteRes);

  assert.equal(taskRes.statusCode, 200);
  assert.equal(noteRes.statusCode, 200);
  assert.equal(taskRes.body.task.record_kind, 'task');
  assert.equal(noteRes.body.note.record_kind, 'note');
  assert.ok(store.activities.some((item) => item.payload_json.action === 'task_created'));
  assert.ok(store.activities.some((item) => item.payload_json.action === 'note_created'));
});

test('CRM-06: execution actions support safe record updates and approval state without silent execution drift', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Approval Deal',
    attributes: { owner_actor_id: 'manager-actor-001', approval_state: 'needed', amount: 12000 },
  });

  const updateReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: { action_key: 'update_record', record_kind: 'deal', record_id: 'deal-001', priority: 'high', recommendation_id: 'rec-002' },
  });
  const updateRes = makeRes();
  await handleExecutionActions(updateReq, updateRes);

  const approveReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: { action_key: 'approve_recommendation', record_kind: 'deal', record_id: 'deal-001', recommendation_id: 'tenant-alpha-001:deal:deal-001:approval_needed' },
  });
  const approveRes = makeRes();
  await handleExecutionActions(approveReq, approveRes);

  assert.equal(updateRes.statusCode, 200);
  assert.equal(updateRes.body.record.attributes.priority, 'high');
  assert.equal(approveRes.statusCode, 200);
  assert.equal(approveRes.body.recommendation.status, 'approved');
  assert.ok(store.activities.some((item) => item.payload_json.action === 'execution_safe_record_update'));
  assert.ok(store.activities.some((item) => item.payload_json.action === 'recommendation_approved'));
});

test('CRM-06: task and note APIs remain permission-aware and directly list canonical linked entities', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { amount: 2400 },
  });

  const taskCreateReq = makeReq({ method: 'POST', auth: authFor('contributor'), crmStore: store, body: { title: 'Prepare meeting', linked_record_kind: 'deal', linked_record_id: 'deal-001' } });
  const taskCreateRes = makeRes();
  await handleTasks(taskCreateReq, taskCreateRes);

  const noteCreateReq = makeReq({ method: 'POST', auth: authFor('contributor'), crmStore: store, body: { body_markdown: 'Decision maker identified', linked_record_kind: 'deal', linked_record_id: 'deal-001' } });
  const noteCreateRes = makeRes();
  await handleNotes(noteCreateReq, noteCreateRes);

  const listReq = makeReq({ method: 'GET', auth: authFor('readonly'), crmStore: store, query: { linked_record_id: 'deal-001' } });
  const listTaskRes = makeRes();
  const listNoteRes = makeRes();
  await handleTasks(listReq, listTaskRes);
  await handleNotes(listReq, listNoteRes);

  const forbiddenReq = makeReq({ method: 'POST', auth: authFor('readonly'), crmStore: store, body: { action_key: 'create_task', record_kind: 'deal', record_id: 'deal-001' } });
  const forbiddenRes = makeRes();
  await handleExecutionActions(forbiddenReq, forbiddenRes);

  assert.equal(taskCreateRes.statusCode, 200);
  assert.equal(noteCreateRes.statusCode, 200);
  assert.equal(listTaskRes.body.tasks.length, 1);
  assert.equal(listNoteRes.body.notes.length, 1);
  assert.equal(forbiddenRes.statusCode, 403);
});