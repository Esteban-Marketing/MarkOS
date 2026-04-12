'use strict';

const crmEntities = require('./entities.ts');
const crmTimeline = require('./timeline.ts');
const crmExecution = require('./execution.ts');

const { listCrmEntities } = crmEntities;
const { buildCrmTimeline } = crmTimeline;
const { normalizeExecutionSignals } = crmExecution;

function toTimestamp(value) {
  const resolved = Date.parse(value || 0);
  return Number.isNaN(resolved) ? 0 : resolved;
}

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCrmStore(input) {
  return input.crmStore && typeof input.crmStore === 'object'
    ? input.crmStore
    : {};
}

function normalizeContacts(input = {}) {
  const crmStore = normalizeCrmStore(input);
  if (Array.isArray(input.contacts)) {
    return input.contacts;
  }
  if (Object.keys(crmStore).length > 0) {
    return listCrmEntities(crmStore, { tenant_id: input.tenant_id, record_kind: 'contact' });
  }
  return [];
}

function normalizeActivities(input = {}) {
  const crmStore = normalizeCrmStore(input);
  if (Array.isArray(input.activities)) {
    return input.activities.filter((entry) => entry?.tenant_id === input.tenant_id);
  }
  return Array.isArray(crmStore.activities)
    ? crmStore.activities.filter((entry) => entry?.tenant_id === input.tenant_id)
    : [];
}

function normalizeIdentityLinks(input = {}) {
  const crmStore = normalizeCrmStore(input);
  let links = [];
  if (Array.isArray(input.identity_links)) {
    links = input.identity_links;
  } else if (Array.isArray(crmStore.identityLinks)) {
    links = crmStore.identityLinks;
  }
  return links.filter((entry) => entry?.tenant_id === input.tenant_id);
}

function normalizeOutboundMessages(input = {}) {
  const crmStore = normalizeCrmStore(input);
  let messages = [];
  if (Array.isArray(input.outbound_messages)) {
    messages = input.outbound_messages;
  } else if (Array.isArray(crmStore.outboundMessages)) {
    messages = crmStore.outboundMessages;
  }
  return messages.filter((entry) => entry?.tenant_id === input.tenant_id);
}

function collectTenantIds(input = {}) {
  const crmStore = normalizeCrmStore(input);
  const tenantIds = new Set();
  [crmStore.entities, crmStore.activities, crmStore.identityLinks, crmStore.outboundMessages]
    .filter(Array.isArray)
    .forEach((rows) => {
      rows.forEach((entry) => {
        const tenantId = String(entry?.tenant_id || '').trim();
        if (tenantId) {
          tenantIds.add(tenantId);
        }
      });
    });
  const requestedTenantId = toTrimmedString(input.tenant_id);
  if (requestedTenantId) {
    tenantIds.add(requestedTenantId);
  }
  return Array.from(tenantIds).sort((left, right) => left.localeCompare(right));
}

function determineFreshnessStatus(latestActivityTs, freshnessAgeHours) {
  if (latestActivityTs === 0) {
    return 'blocked';
  }
  if (freshnessAgeHours > 48) {
    return 'degraded';
  }
  return 'ready';
}

function determineReadinessStatus(reasons, totalRecords) {
  if (reasons.length === 0) {
    return 'ready';
  }
  if (totalRecords === 0) {
    return 'blocked';
  }
  return 'degraded';
}

function collectReadinessReasons(input) {
  const reasons = [];
  if (input.reviewLinkCount > 0) {
    reasons.push('identity stitching pending review');
  }
  if (input.totalRecords > 0 && input.trackedRecordCount < input.totalRecords) {
    reasons.push('tracking coverage partial');
  }
  if (input.outboundRecordCount === 0) {
    reasons.push('outbound evidence missing');
  }
  if (input.freshnessStatus !== 'ready') {
    reasons.push(input.latestActivityTs === 0 ? 'freshness unavailable from CRM evidence' : 'freshness stale beyond reporting threshold');
  }
  return reasons;
}

function deriveRiskLevel(signals) {
  if (signals.success_risk) {
    return 'high';
  }
  if (signals.stalled_days >= 7) {
    return 'medium';
  }
  return 'low';
}

function buildReadinessReport(input = {}) {
  const tenantId = toTrimmedString(input.tenant_id);
  const contacts = normalizeContacts({ ...input, tenant_id: tenantId });
  const activities = normalizeActivities({ ...input, tenant_id: tenantId });
  const identityLinks = normalizeIdentityLinks({ ...input, tenant_id: tenantId });
  const outboundMessages = normalizeOutboundMessages({ ...input, tenant_id: tenantId });
  const totalRecords = contacts.length;
  const acceptedLinks = identityLinks.filter((entry) => entry.link_status === 'accepted');
  const reviewLinks = identityLinks.filter((entry) => entry.link_status === 'review');
  const trackedRecordIds = new Set(activities
    .filter((entry) => ['campaign_touch', 'web_activity', 'outbound_event'].includes(entry.activity_family))
    .map((entry) => String(entry.related_record_id || '').trim())
    .filter(Boolean));
  const outboundRecordIds = new Set(outboundMessages
    .map((entry) => String(entry.record_id || entry.contact_id || '').trim())
    .filter(Boolean));
  const latestActivityTs = activities.reduce((latest, entry) => Math.max(latest, toTimestamp(entry.occurred_at || entry.created_at)), 0);
  const nowTs = toTimestamp(input.now || Date.now());
  const freshnessAgeHours = latestActivityTs > 0 ? Number(((nowTs - latestActivityTs) / 3600000).toFixed(1)) : null;
  const freshnessStatus = determineFreshnessStatus(latestActivityTs, freshnessAgeHours);
  const reasons = collectReadinessReasons({
    reviewLinkCount: reviewLinks.length,
    totalRecords,
    trackedRecordCount: trackedRecordIds.size,
    outboundRecordCount: outboundRecordIds.size,
    freshnessStatus,
    latestActivityTs,
  });
  const status = determineReadinessStatus(reasons, totalRecords);
  const summary = status === 'ready'
    ? 'Reporting readiness ready from canonical CRM evidence.'
    : `Reporting readiness ${status}: ${reasons.join('; ')}.`;

  return Object.freeze({
    tenant_id: tenantId,
    status,
    summary,
    reasons: Object.freeze(reasons),
    coverage: Object.freeze({
      identity: Object.freeze({
        accepted_links: acceptedLinks.length,
        review_links: reviewLinks.length,
      }),
      tracking: Object.freeze({
        covered_records: trackedRecordIds.size,
        total_records: totalRecords,
      }),
      outbound: Object.freeze({
        records_with_outbound: outboundRecordIds.size,
      }),
      freshness: Object.freeze({
        latest_activity_at: latestActivityTs > 0 ? new Date(latestActivityTs).toISOString() : null,
        age_hours: freshnessAgeHours,
        status: freshnessStatus,
      }),
    }),
  });
}

function buildReportingCockpitData(input = {}) {
  const tenantId = toTrimmedString(input.tenant_id);
  const store = Object.keys(normalizeCrmStore(input)).length > 0
    ? normalizeCrmStore(input)
    : { entities: [], activities: [], identityLinks: [] };
  const records = listCrmEntities(store, { tenant_id: tenantId })
    .filter((entry) => !['task', 'note'].includes(entry.record_kind));
  const tasks = listCrmEntities(store, { tenant_id: tenantId, record_kind: 'task' });
  const pipelineHealth = records.filter((entry) => entry.record_kind === 'deal').map((record) => {
    const linkedTasks = tasks.filter((task) => task.linked_record_kind === record.record_kind && task.linked_record_id === record.entity_id);
    const timeline = buildCrmTimeline({
      tenant_id: tenantId,
      record_kind: record.record_kind,
      record_id: record.entity_id,
      activities: store.activities || [],
      identity_links: store.identityLinks || [],
    });
    const signals = normalizeExecutionSignals({ record, tasks: linkedTasks, timeline, now: input.now });
    return Object.freeze({
      record_id: record.entity_id,
      display_name: record.display_name,
      stage_key: record.attributes?.stage_key || null,
      risk_level: deriveRiskLevel(signals),
      stalled_days: signals.stalled_days,
      overdue_task_count: signals.overdue_task_count,
      inbound_touch_count: signals.inbound_touch_count,
    });
  });
  const productivity = Object.freeze({
    open_task_count: tasks.filter((task) => !['completed', 'done', 'closed'].includes(String(task.status || '').toLowerCase())).length,
    completed_task_count: tasks.filter((task) => ['completed', 'done', 'closed'].includes(String(task.status || '').toLowerCase())).length,
    record_count: records.length,
  });
  const slaRisk = Object.freeze({
    at_risk_records: pipelineHealth.filter((entry) => entry.risk_level !== 'low').length,
    stalled_records: pipelineHealth.filter((entry) => entry.stalled_days >= 7).length,
  });

  return Object.freeze({
    tenant_id: tenantId,
    pipeline_health: pipelineHealth,
    productivity,
    sla_risk: slaRisk,
  });
}

function buildExecutiveSummary(input = {}) {
  const readiness =
    input.readiness && typeof input.readiness === 'object'
      ? input.readiness
      : buildReadinessReport(input);
  const cockpit =
    input.cockpit && typeof input.cockpit === 'object'
      ? input.cockpit
      : buildReportingCockpitData(input);
  return Object.freeze({
    readiness_status: readiness.status,
    readiness_summary: readiness.summary,
    deal_count: cockpit.pipeline_health.length,
    at_risk_records: cockpit.sla_risk.at_risk_records,
    open_task_count: cockpit.productivity.open_task_count,
  });
}

function buildCentralReportingRollup(input = {}) {
  const tenantIds = collectTenantIds(input);
  const tenants = tenantIds.map((tenantId) => {
    const readiness = buildReadinessReport({ ...input, tenant_id: tenantId });
    const cockpit = buildReportingCockpitData({ ...input, tenant_id: tenantId });
    const executive = buildExecutiveSummary({ tenant_id: tenantId, readiness, cockpit });
    return Object.freeze({
      tenant_id: tenantId,
      readiness_status: readiness.status,
      deal_count: executive.deal_count,
      at_risk_records: executive.at_risk_records,
      open_task_count: executive.open_task_count,
      readiness_summary: executive.readiness_summary,
    });
  });
  const totals = Object.freeze({
    tenant_count: tenants.length,
    deal_count: tenants.reduce((sum, entry) => sum + entry.deal_count, 0),
    at_risk_records: tenants.reduce((sum, entry) => sum + entry.at_risk_records, 0),
    open_task_count: tenants.reduce((sum, entry) => sum + entry.open_task_count, 0),
  });

  return Object.freeze({
    generated_at: typeof input.now === 'string' || typeof input.now === 'number'
      ? new Date(input.now).toISOString()
      : new Date().toISOString(),
    totals,
    tenants,
    governance: Object.freeze({
      summary: 'Governed drill-down requests only.',
      deeper_inspection_path: '/api/crm/reporting/dashboard',
      tenant_labels_explicit: true,
    }),
  });
}

module.exports = {
  buildReportingCockpitData,
  buildReadinessReport,
  buildExecutiveSummary,
  buildCentralReportingRollup,
};