import type { Stats } from 'node:fs';

'use strict';

const { getCrmStore } = require('../crm/api.cjs');

function toTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toIsoString(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? new Date(value).toISOString()
    : new Date().toISOString();
}

function addMinutes(timestamp, minutes) {
  return new Date(Date.parse(timestamp) + (Number(minutes || 0) * 60000)).toISOString();
}

function buildSequenceExecutionPlan(input: Record<string, unknown> = {}) {
  const launchedAt = toIsoString(input.launched_at);
  const steps = Array.isArray(input.steps) ? input.steps : [];

  return {
    launched_at: launchedAt,
    steps: steps.map((step, index) => ({
      step_id: toTrimmedString(step.step_id, `${toTrimmedString(input.sequence_key, 'sequence')}-step-${index + 1}`),
      sequence_key: toTrimmedString(input.sequence_key),
      tenant_id: toTrimmedString(input.tenant_id),
      contact_id: toTrimmedString(input.contact_id),
      record_kind: toTrimmedString(input.record_kind, 'contact'),
      record_id: toTrimmedString(input.record_id, toTrimmedString(input.contact_id)),
      channel: toTrimmedString(step.channel).toLowerCase(),
      template_key: step.template_key ? String(step.template_key).trim() : null,
      delay_minutes: Number(step.delay_minutes || 0),
      due_at: addMinutes(launchedAt, step.delay_minutes || 0),
    })),
  };
}

function selectDueOutboundWork(store, input: Record<string, unknown> = {}) {
  const targetStore = getCrmStore({ crmStore: store });
  const tenantId = toTrimmedString(input.tenant_id);
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