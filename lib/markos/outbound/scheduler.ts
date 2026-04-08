'use strict';

const { getCrmStore } = require('../crm/api.cjs');

function toIsoString(value) {
  return new Date(value || Date.now()).toISOString();
}

function addMinutes(timestamp, minutes) {
  return new Date(Date.parse(timestamp) + (Number(minutes || 0) * 60000)).toISOString();
}

function buildSequenceExecutionPlan(input = {}) {
  const launchedAt = toIsoString(input.launched_at);
  const steps = Array.isArray(input.steps) ? input.steps : [];

  return {
    launched_at: launchedAt,
    steps: steps.map((step, index) => ({
      step_id: String(step.step_id || `${String(input.sequence_key || 'sequence')}-step-${index + 1}`),
      sequence_key: String(input.sequence_key || '').trim(),
      tenant_id: String(input.tenant_id || '').trim(),
      contact_id: String(input.contact_id || '').trim(),
      record_kind: String(input.record_kind || 'contact').trim(),
      record_id: String(input.record_id || input.contact_id || '').trim(),
      channel: String(step.channel || '').trim().toLowerCase(),
      template_key: step.template_key ? String(step.template_key).trim() : null,
      delay_minutes: Number(step.delay_minutes || 0),
      due_at: addMinutes(launchedAt, step.delay_minutes || 0),
    })),
  };
}

function selectDueOutboundWork(store, input = {}) {
  const targetStore = getCrmStore({ crmStore: store });
  const tenantId = String(input.tenant_id || '').trim();
  const asOf = Date.parse(toIsoString(input.as_of));

  return targetStore.outboundQueue
    .filter((row) => row.tenant_id === tenantId)
    .filter((row) => String(row.status || '').trim() === 'scheduled')
    .filter((row) => Date.parse(row.due_at) <= asOf)
    .sort((left, right) => Date.parse(left.due_at) - Date.parse(right.due_at));
}

module.exports = {
  selectDueOutboundWork,
  buildSequenceExecutionPlan,
};