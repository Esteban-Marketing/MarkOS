'use strict';

const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
} = require('../../../lib/markos/crm/api.cjs');
const { evaluateOutboundEligibility } = require('../../../lib/markos/outbound/consent.ts');
const { buildSequenceExecutionPlan } = require('../../../lib/markos/outbound/scheduler.ts');

function normalizeChannel(channel) {
  const normalized = String(channel || '').trim().toLowerCase();
  if (!['email', 'sms', 'whatsapp'].includes(normalized)) {
    throw new Error(`CRM_OUTBOUND_CHANNEL_INVALID:${channel}`);
  }
  return normalized;
}

function normalizeSequenceSteps(steps = []) {
  return steps.map((step, index) => Object.freeze({
    step_id: String(step.step_id || `step-${index + 1}`),
    channel: normalizeChannel(step.channel),
    template_key: step.template_key ? String(step.template_key).trim() : null,
    delay_minutes: Number(step.delay_minutes || 0),
  }));
}

function buildSequenceRecord(store, context, body = {}, approvalState, steps) {
  const now = new Date().toISOString();
  return Object.freeze({
    sequence_id: String(body.sequence_id || `sequence-${context.tenant_id}-${store.outboundSequences.length + 1}`),
    tenant_id: context.tenant_id,
    sequence_key: String(body.sequence_key || '').trim(),
    display_name: String(body.display_name || body.sequence_key || 'Outbound Sequence').trim(),
    record_kind: String(body.record_kind || 'contact').trim(),
    record_id: String(body.record_id || body.contact_id || '').trim(),
    contact_id: String(body.contact_id || '').trim(),
    use_case: String(body.use_case || 'marketing').trim(),
    risk_level: String(body.risk_level || 'standard').trim(),
    approval_state: approvalState,
    steps,
    created_by: context.actor_id,
    updated_by: context.actor_id,
    created_at: now,
    updated_at: now,
  });
}

function upsertSequence(store, sequence) {
  const index = store.outboundSequences.findIndex((row) => row.tenant_id === sequence.tenant_id && row.sequence_key === sequence.sequence_key && row.contact_id === sequence.contact_id);
  if (index >= 0) {
    store.outboundSequences.splice(index, 1, sequence);
  } else {
    store.outboundSequences.push(sequence);
  }
}

function enqueuePlan(store, context, sequence, plan) {
  const now = new Date().toISOString();
  return plan.steps.map((step, index) => {
    const item = Object.freeze({
      queue_id: `queue-${context.tenant_id}-${store.outboundQueue.length + index + 1}`,
      tenant_id: context.tenant_id,
      work_type: 'sequence_step',
      status: 'scheduled',
      due_at: step.due_at,
      created_at: now,
      updated_at: now,
      contact_id: sequence.contact_id,
      record_kind: sequence.record_kind,
      record_id: sequence.record_id,
      channel: step.channel,
      template_key: step.template_key,
      sequence_id: sequence.sequence_id,
      sequence_key: sequence.sequence_key,
      sequence_step_id: step.step_id,
      approval_state: sequence.approval_state,
      bulk_send_id: null,
    });
    store.outboundQueue.push(item);
    return item;
  });
}

async function handleOutboundSequences(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const actionDecision = assertCrmMutationAllowed(context, 'outbound_send');
  if (!actionDecision.allowed) {
    return writeJson(res, actionDecision.status, { success: false, error: actionDecision.error, message: actionDecision.message });
  }

  const store = getCrmStore(req);
  const body = req.body || {};
  const steps = normalizeSequenceSteps(body.steps || []);
  const needsApproval = body.approval_granted === true;
  if (needsApproval) {
    const approvalDecision = assertCrmMutationAllowed(context, 'outbound_approve');
    if (!approvalDecision.allowed) {
      return writeJson(res, approvalDecision.status, { success: false, error: approvalDecision.error, message: approvalDecision.message });
    }
  }

  const eligibility = steps.reduce((current, step) => {
    if (current && !current.allowed && current.reason_code !== 'ALLOWED') {
      return current;
    }
    return evaluateOutboundEligibility(store, {
      tenant_id: context.tenant_id,
      contact_id: body.contact_id,
      channel: step.channel,
      use_case: body.use_case,
      risk_level: body.risk_level,
      template_key: step.template_key,
      approval_granted: body.approval_granted === true,
      bulk_size: 1,
    });
  }, null);

  const approvalState = eligibility && eligibility.allowed ? (body.approval_granted === true ? 'approved' : 'ready') : 'pending_approval';
  const sequence = buildSequenceRecord(store, context, body, approvalState, steps);
  upsertSequence(store, sequence);

  if (!eligibility || !eligibility.allowed) {
    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'outbound_event',
      related_record_kind: sequence.record_kind,
      related_record_id: sequence.record_id,
      source_event_ref: `api:crm:outbound:sequence:${sequence.sequence_key}`,
      actor_id: context.actor_id,
      payload_json: {
        action: 'outbound_send_blocked',
        outcome: 'blocked',
        reason_code: eligibility ? eligibility.reason_code : 'SEQUENCE_STEPS_REQUIRED',
        sequence_key: sequence.sequence_key,
      },
    });
    return writeJson(res, 409, {
      success: false,
      error: eligibility && eligibility.requires_approval ? 'CRM_OUTBOUND_APPROVAL_REQUIRED' : 'CRM_OUTBOUND_INELIGIBLE',
      reason_code: eligibility ? eligibility.reason_code : 'SEQUENCE_STEPS_REQUIRED',
      sequence,
    });
  }

  const launchedAt = new Date().toISOString();
  const plan = buildSequenceExecutionPlan({
    tenant_id: context.tenant_id,
    contact_id: sequence.contact_id,
    record_kind: sequence.record_kind,
    record_id: sequence.record_id,
    sequence_key: sequence.sequence_key,
    steps,
    launched_at: launchedAt,
  });
  const queueItems = enqueuePlan(store, context, sequence, plan);
  appendCrmActivity(store, {
    tenant_id: context.tenant_id,
    activity_family: 'outbound_event',
    related_record_kind: sequence.record_kind,
    related_record_id: sequence.record_id,
    source_event_ref: `api:crm:outbound:sequence:${sequence.sequence_key}`,
    actor_id: context.actor_id,
    payload_json: {
      action: body.approval_granted === true ? 'crm_outbound_send_approved' : 'outbound_sequence_scheduled',
      outcome: 'scheduled',
      sequence_key: sequence.sequence_key,
      queued_steps: queueItems.length,
    },
  });
  return writeJson(res, 200, { success: true, sequence, queue: queueItems, plan });
}

module.exports = async function handler(req, res) {
  return handleOutboundSequences(req, res);
};

module.exports.handleOutboundSequences = handleOutboundSequences;