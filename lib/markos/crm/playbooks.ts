export type __ModuleMarker = import('node:fs').Stats;

'use strict';

const crypto = require('node:crypto');

const { createRunEnvelope, assertTransitionAllowed, recordSideEffect } = require('../../../onboarding/backend/agents/run-engine.cjs');
const { appendCrmActivity, getCrmStore, listCrmEntities, updateCrmEntity } = require('./api.cjs');
const { createTaskRecord } = require('../../../api/crm/tasks.js');
const { createNoteRecord } = require('../../../api/crm/notes.js');

const SAFE_PLAYBOOK_ACTIONS = new Set(['create_task', 'append_note', 'propose_enrichment', 'update_stage', 'update_owner']);

function buildPlaybookStep(playbookId, step, index, recordKind, recordId) {
  return Object.freeze({
    step_key: String(step.step_key || `step-${index + 1}`),
    action_key: String(step.action_key || '').trim(),
    replay_key: String(step.replay_key || `${playbookId}:${index + 1}:${step.action_key || 'unknown'}`),
    status: String(step.status || 'pending_approval'),
    target_record_kind: step.target_record_kind ? String(step.target_record_kind).trim() : recordKind,
    target_record_id: step.target_record_id ? String(step.target_record_id).trim() : recordId,
    proposed_changes: step.proposed_changes && typeof step.proposed_changes === 'object' ? { ...step.proposed_changes } : {},
  });
}

function toTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function transitionRun(run, toState, store, actorId, reason) {
  const transition = assertTransitionAllowed({
    run_id: run.run_id,
    tenant_id: run.tenant_id,
    from_state: run.state,
    to_state: toState,
    eventStore: store.copilotEventStore,
    actor_id: actorId,
    correlation_id: run.correlation_id,
    reason,
  });
  if (!transition.allowed) {
    throw new Error(transition.error_code || 'AGENT_RUN_INVALID_TRANSITION');
  }
  run.state = toState;
  run.updated_at = new Date().toISOString();
  return run;
}

function assertReplaySafePlaybookAction(input: Record<string, unknown> = {}) {
  const store = getCrmStore({ crmStore: input.crmStore || input.store });
  const playbook: Record<string, unknown> =
    input.playbook && typeof input.playbook === 'object' ? input.playbook as Record<string, unknown> : {};
  const step: Record<string, unknown> =
    input.step && typeof input.step === 'object' ? input.step as Record<string, unknown> : {};
  return recordSideEffect({
    ledger: store.copilotSideEffectLedger,
    run_id: playbook.run_id,
    tenant_id: playbook.tenant_id,
    step_key: step.step_key,
    effect_hash: step.replay_key,
    effect_type: step.action_key,
    payload: { playbook_id: playbook.playbook_id, target_record_id: step.target_record_id },
  });
}

function buildCopilotPlaybookRun(input: Record<string, unknown> = {}) {
  const store = getCrmStore({ crmStore: input.crmStore || input.store });
  const tenantId = toTrimmedString(input.tenant_id);
  const actorId = toTrimmedString(input.actor_id);
  const playbookId = typeof input.playbook_id === 'string' ? input.playbook_id.trim() : `playbook-${crypto.randomUUID()}`;
  const steps = Array.isArray(input.steps) ? input.steps : [];
  const envelope = createRunEnvelope({
    tenant_id: tenantId,
    actor_id: actorId,
    correlation_id: typeof input.correlation_id === 'string' ? input.correlation_id : `corr-${playbookId}`,
    idempotency_key: typeof input.idempotency_key === 'string' ? input.idempotency_key : playbookId,
    provider_policy: { mode: 'crm_copilot_playbook', playbook_key: typeof input.playbook_key === 'string' ? input.playbook_key : 'copilot_playbook' },
    tool_policy: { durable_effects: 'approval_required', step_count: steps.length },
    registry: store.copilotRunRegistry,
  });
  const run = envelope.run;
  transitionRun(run, 'accepted', store, actorId, 'copilot_playbook_requested');
  transitionRun(run, 'context_loaded', store, actorId, 'copilot_playbook_context_loaded');
  transitionRun(run, 'executing', store, actorId, 'copilot_playbook_prepared');
  transitionRun(run, 'awaiting_approval', store, actorId, 'copilot_playbook_requires_review');

  const playbook = Object.freeze({
    playbook_id: playbookId,
    tenant_id: tenantId,
    review_tenant_id: typeof input.review_tenant_id === 'string' ? input.review_tenant_id.trim() : tenantId,
    playbook_key: typeof input.playbook_key === 'string' ? input.playbook_key.trim() : 'copilot_playbook',
    status: 'awaiting_approval',
    actor_id: actorId,
    actor_role: toTrimmedString(input.actor_role),
    run_id: run.run_id,
    run_state: run.state,
    record_kind: typeof input.record_kind === 'string' ? input.record_kind.trim() : null,
    record_id: typeof input.record_id === 'string' ? input.record_id.trim() : null,
    steps: steps.map((step, index) => buildPlaybookStep(playbookId, step, index, input.record_kind, input.record_id)),
    created_at: new Date().toISOString(),
  });

  store.copilotPlaybookRuns.push(playbook);
  store.copilotPlaybookSteps.push(...playbook.steps.map((step) => Object.freeze({ ...step, playbook_id: playbook.playbook_id, run_id: playbook.run_id, tenant_id: playbook.tenant_id })));
  appendCrmActivity(store, {
    tenant_id: playbook.review_tenant_id,
    activity_family: 'agent_event',
    related_record_kind: playbook.record_kind || 'copilot_playbook',
    related_record_id: playbook.record_id || playbook.playbook_id,
    source_event_ref: `api:crm:copilot:playbook:create:${playbook.playbook_id}`,
    actor_id: playbook.actor_id,
    payload_json: {
      action: 'copilot_playbook_created',
      playbook_id: playbook.playbook_id,
      run_id: playbook.run_id,
      step_count: playbook.steps.length,
    },
  });

  return { playbook, run };
}

function updateStepStatus(store, playbookId, stepKey, status) {
  const index = store.copilotPlaybookSteps.findIndex((entry) => entry.playbook_id === playbookId && entry.step_key === stepKey);
  if (index >= 0) {
    const current = store.copilotPlaybookSteps[index];
    store.copilotPlaybookSteps.splice(index, 1, Object.freeze({ ...current, status }));
  }
}

function applySafeRecordUpdate(store, context, step) {
  const record = listCrmEntities(store, { tenant_id: context.tenant_id, record_kind: step.target_record_kind }).find((entry) => entry.entity_id === step.target_record_id);
  if (!record) {
    throw new Error('CRM_ENTITY_NOT_FOUND');
  }
  const recordAttributes = record.attributes && typeof record.attributes === 'object' ? record.attributes : {};
  const stepChanges = step.proposed_changes && typeof step.proposed_changes === 'object' ? step.proposed_changes : {};
  const nextAttributes = { ...recordAttributes };
  if (step.action_key === 'update_stage') {
    nextAttributes.stage_key = stepChanges.stage_key;
  }
  if (step.action_key === 'update_owner') {
    nextAttributes.owner_actor_id = stepChanges.owner_actor_id;
  }
  if (step.action_key === 'propose_enrichment') {
    nextAttributes.enrichment_fields = Array.isArray(stepChanges.fields) ? [...stepChanges.fields] : [];
  }
  return updateCrmEntity(store, { tenant_id: context.tenant_id, entity_id: record.entity_id }, { attributes: nextAttributes });
}

function applyApprovedPlaybookStep(input: Record<string, unknown> = {}) {
  const store = getCrmStore({ crmStore: input.crmStore || input.store });
  const playbook: Record<string, unknown> =
    input.playbook && typeof input.playbook === 'object' ? input.playbook as Record<string, unknown> : {};
  const step: Record<string, unknown> =
    input.step && typeof input.step === 'object' ? input.step as Record<string, unknown> : {};
  const context: Record<string, unknown> =
    input.context && typeof input.context === 'object' ? input.context as Record<string, unknown> : {};
  const actionKey = typeof step.action_key === 'string' ? step.action_key : '';
  const proposedChanges: Record<string, unknown> =
    step.proposed_changes && typeof step.proposed_changes === 'object'
      ? step.proposed_changes as Record<string, unknown>
      : {};
  if (!SAFE_PLAYBOOK_ACTIONS.has(actionKey)) {
    throw new Error('CRM_COPILOT_PLAYBOOK_STEP_INVALID');
  }
  const replay = assertReplaySafePlaybookAction({ crmStore: store, playbook, step });
  if (!replay.applied) {
    return replay;
  }

  let result = null;
  if (actionKey === 'create_task') {
    result = createTaskRecord(store, context, {
      title: proposedChanges.title,
      linked_record_kind: step.target_record_kind,
      linked_record_id: step.target_record_id,
    });
  } else if (actionKey === 'append_note') {
    result = createNoteRecord(store, context, {
      title: proposedChanges.title || 'Copilot note',
      body_markdown: proposedChanges.body_markdown,
      linked_record_kind: step.target_record_kind,
      linked_record_id: step.target_record_id,
    });
  } else {
    result = applySafeRecordUpdate(store, context, step);
  }

  updateStepStatus(store, playbook.playbook_id, step.step_key, 'completed');
  appendCrmActivity(store, {
    tenant_id: playbook.review_tenant_id || playbook.tenant_id,
    activity_family: 'agent_event',
    related_record_kind: step.target_record_kind || playbook.record_kind || 'copilot_playbook',
    related_record_id: step.target_record_id || playbook.record_id || playbook.playbook_id,
    source_event_ref: `api:crm:copilot:playbook:step:${playbook.playbook_id}:${step.step_key}`,
    actor_id: context.actor_id,
    payload_json: {
      action: 'copilot_playbook_step_applied',
      playbook_id: playbook.playbook_id,
      run_id: playbook.run_id,
      step_key: step.step_key,
      action_key: actionKey,
      actor_id: context.actor_id,
      approval_decision: 'approved',
    },
  });

  return { applied: true, reason: null, result, entry: replay.entry };
}

module.exports = {
  buildCopilotPlaybookRun,
  applyApprovedPlaybookStep,
  assertReplaySafePlaybookAction,
  transitionRun,
};