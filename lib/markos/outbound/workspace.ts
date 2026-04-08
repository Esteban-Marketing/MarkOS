import type { Stats } from 'node:fs';

'use strict';

const { getCrmStore, listCrmEntities } = require('../crm/api.cjs');
const { selectDueOutboundWork } = require('./scheduler.ts');

function toTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function listTenantQueue(store, tenantId) {
  return store.outboundQueue
    .filter((row) => row.tenant_id === tenantId)
    .sort((left, right) => Date.parse(left.due_at) - Date.parse(right.due_at));
}

function buildOutboundWorkspaceSnapshot(input: Record<string, unknown> = {}) {
  const store = getCrmStore({ crmStore: input.crmStore });
  const tenantId = toTrimmedString(input.tenant_id);
  const queue = listTenantQueue(store, tenantId);
  const due = selectDueOutboundWork(store, {
    tenant_id: tenantId,
    as_of: input.now || new Date().toISOString(),
  });
  const activeWork = due[0] || queue[0] || null;
  const contact = activeWork
    ? listCrmEntities(store, { tenant_id: tenantId, record_kind: 'contact' }).find((row) => row.entity_id === activeWork.contact_id) || null
    : null;
  const consent = activeWork
    ? store.outboundConsentRecords.find((row) => row.tenant_id === tenantId && row.contact_id === activeWork.contact_id && row.channel === activeWork.channel) || null
    : null;
  const evidence = activeWork
    ? store.activities.filter((row) => row.tenant_id === tenantId && row.activity_family === 'outbound_event' && row.related_record_id === activeWork.record_id).slice(-5).reverse()
    : [];

  return {
    tenant_id: tenantId,
    actor_id: typeof input.actor_id === 'string' ? input.actor_id.trim() : null,
    role: typeof input.role === 'string' ? input.role.trim() : null,
    queue,
    due_queue: due,
    templates: store.outboundTemplates.filter((row) => row.tenant_id === tenantId),
    sequences: store.outboundSequences.filter((row) => row.tenant_id === tenantId),
    active_work: activeWork,
    active_contact: contact,
    evidence,
    consent,
  };
}

module.exports = {
  buildOutboundWorkspaceSnapshot,
};