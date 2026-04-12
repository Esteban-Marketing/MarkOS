'use strict';

const { listCrmEntities } = require('./entities.ts');
const { buildCrmTimeline } = require('./timeline.ts');
const { buildCrmWorkspaceSnapshot } = require('./workspace-data.ts');

const EXECUTION_QUEUE_TABS = Object.freeze([
  'due_overdue',
  'inbound',
  'stalled',
  'success_risk',
  'approval_needed',
  'ownership_data',
  'priority',
]);

function ensureExecutionStore(store) {
  if (!store || typeof store !== 'object') {
    throw new Error('CRM_STORE_REQUIRED');
  }
  if (!Array.isArray(store.executionRecommendations)) {
    store.executionRecommendations = [];
  }
  if (!Array.isArray(store.executionDrafts)) {
    store.executionDrafts = [];
  }
  if (!Array.isArray(store.executionQueuePreferences)) {
    store.executionQueuePreferences = [];
  }
  return store;
}

function toTimestamp(value, fallback = 0) {
  let resolved;
  if (value) {
    resolved = Date.parse(String(value));
  } else if (typeof fallback === 'number') {
    resolved = fallback;
  } else {
    resolved = Date.parse(String(fallback || 0));
  }
  if (Number.isNaN(resolved)) {
    return 0;
  }
  return resolved;
}

function toIso(value, fallback = Date.now()) {
  const timestamp = toTimestamp(value, fallback || Date.now());
  return new Date(timestamp || Date.now()).toISOString();
}

function resolveMissingData(record) {
  if (record.record_kind === 'deal') {
    return !record.attributes?.amount;
  }
  if (record.record_kind === 'customer') {
    return !record.attributes?.renewal_at;
  }
  return false;
}

function resolveRiskLevel(urgencyScore) {
  if (urgencyScore >= 60) {
    return 'high';
  }
  if (urgencyScore >= 35) {
    return 'medium';
  }
  return 'low';
}

function normalizeExecutionSignals(input = {}) {
  const record = input.record && typeof input.record === 'object' ? input.record : {};
  const recordAttributes = record.attributes && typeof record.attributes === 'object' ? record.attributes : {};
  const nowIso = input.now || new Date().toISOString();
  const nowTs = toTimestamp(nowIso, Date.now());
  const tasks = Array.isArray(input.tasks)
    ? input.tasks.filter((task) => Boolean(task) && typeof task === 'object')
    : [];
  const timeline = Array.isArray(input.timeline)
    ? input.timeline.filter((entry) => Boolean(entry) && typeof entry === 'object')
    : [];
  const normalizedTasks = tasks.map((task) => ({
    ...task,
    attributes: task.attributes && typeof task.attributes === 'object' ? task.attributes : {},
  }));
  const normalizedTimeline = timeline.map((entry) => ({
    ...entry,
    payload_json: entry.payload_json && typeof entry.payload_json === 'object' ? entry.payload_json : {},
  }));
  const taskDueTimestamps = normalizedTasks
    .map((task) => toTimestamp(task.attributes?.due_at, 0))
    .filter((value) => value > 0);
  const openTasks = normalizedTasks.filter((task) => !['completed', 'done', 'closed'].includes(String(task.status || '').toLowerCase()));
  const overdueTasks = openTasks.filter((task) => {
    const dueAt = toTimestamp(task.attributes?.due_at, 0);
    return dueAt > 0 && dueAt < nowTs;
  });
  const inboundTouches = normalizedTimeline.filter((entry) => {
    const payload = entry.payload_json || {};
    return payload.direction === 'inbound' || payload.reply_state === 'received' || payload.channel_state === 'inbound';
  });
  const approvalNeeded = recordAttributes.approval_state === 'needed' || recordAttributes.approval_required === true;
  const ownerActorId = recordAttributes.owner_actor_id || null;
  const assignedActorIds = Array.from(new Set(openTasks.map((task) => String(task.attributes?.assigned_actor_id || task.attributes?.owner_actor_id || task.attributes?.assigned_to || '').trim()).filter(Boolean)));
  const lastActivityAt = normalizedTimeline.reduce((latest, entry) => {
    const candidate = toTimestamp(entry.occurred_at || entry.created_at, 0);
    return Math.max(candidate, latest);
  }, toTimestamp(record.updated_at || record.created_at, 0));
  const stalledDays = Math.max(0, Math.floor((nowTs - lastActivityAt) / 86400000));
  const intentScore = Number(recordAttributes.intent_score || 0);
  const healthScore = Number(recordAttributes.health_score || 0);
  const renewalAtTs = toTimestamp(recordAttributes.renewal_at, 0);
  const expectedCloseTs = toTimestamp(recordAttributes.expected_close_at, 0);
  const renewalWindowDays = renewalAtTs > 0 ? Math.floor((renewalAtTs - nowTs) / 86400000) : null;
  const closeWindowDays = expectedCloseTs > 0 ? Math.floor((expectedCloseTs - nowTs) / 86400000) : null;
  const missingData = resolveMissingData(record);
  const successRisk = (record.record_kind === 'customer' || record.record_kind === 'account')
    && ((healthScore > 0 && healthScore < 50) || (renewalWindowDays !== null && renewalWindowDays <= 30));

  return Object.freeze({
    owner_actor_id: ownerActorId,
    assigned_actor_ids: assignedActorIds,
    open_task_count: openTasks.length,
    overdue_task_count: overdueTasks.length,
    inbound_touch_count: inboundTouches.length,
    approval_needed: approvalNeeded,
    stalled_days: stalledDays,
    intent_score: intentScore,
    health_score: healthScore,
    missing_owner: !ownerActorId,
    missing_data: missingData,
    success_risk: successRisk,
    renewal_window_days: renewalWindowDays,
    close_window_days: closeWindowDays,
    last_activity_at: lastActivityAt > 0 ? new Date(lastActivityAt).toISOString() : toIso(nowIso),
    next_due_at: taskDueTimestamps.length > 0 ? new Date(Math.min(...taskDueTimestamps)).toISOString() : null,
  });
}

function resolveQueueTab(signals) {
  if (signals.approval_needed) {
    return 'approval_needed';
  }
  if (signals.overdue_task_count > 0) {
    return 'due_overdue';
  }
  if (signals.inbound_touch_count > 0) {
    return 'inbound';
  }
  if (signals.success_risk) {
    return 'success_risk';
  }
  if (signals.missing_owner || signals.missing_data) {
    return 'ownership_data';
  }
  if (signals.stalled_days >= 7) {
    return 'stalled';
  }
  return 'priority';
}

function buildRationaleSummary(record, signals) {
  const parts = [];
  if (signals.overdue_task_count > 0) {
    parts.push(`${signals.overdue_task_count} overdue task${signals.overdue_task_count === 1 ? '' : 's'}`);
  }
  if (signals.inbound_touch_count > 0) {
    parts.push(`${signals.inbound_touch_count} inbound touch${signals.inbound_touch_count === 1 ? '' : 'es'} awaiting follow-up`);
  }
  if (signals.stalled_days >= 7) {
    parts.push(`${signals.stalled_days} days since last activity`);
  }
  if (signals.success_risk) {
    parts.push(record.record_kind === 'customer' ? 'customer health or renewal risk detected' : 'account health risk detected');
  }
  if (signals.approval_needed) {
    parts.push('approval is explicitly required');
  }
  if (signals.missing_owner) {
    parts.push('record has no owner assigned');
  }
  if (signals.missing_data) {
    parts.push('required execution data is incomplete');
  }
  if (signals.intent_score >= 70) {
    parts.push(`intent score is ${signals.intent_score}`);
  }
  return parts.length > 0
    ? parts.join('; ')
    : 'record remains actionable based on canonical CRM recency and ownership state';
}

function buildSourceSignals(record, signals) {
  return Object.freeze([
    { key: 'owner_actor_id', label: 'Owner', value: signals.owner_actor_id },
    { key: 'open_task_count', label: 'Open Tasks', value: signals.open_task_count },
    { key: 'overdue_task_count', label: 'Overdue Tasks', value: signals.overdue_task_count },
    { key: 'inbound_touch_count', label: 'Inbound Touches', value: signals.inbound_touch_count },
    { key: 'stalled_days', label: 'Stalled Days', value: signals.stalled_days },
    { key: 'intent_score', label: 'Intent Score', value: signals.intent_score },
    { key: 'health_score', label: 'Health Score', value: signals.health_score },
    { key: 'approval_needed', label: 'Approval Needed', value: signals.approval_needed },
    { key: 'last_activity_at', label: 'Last Activity', value: signals.last_activity_at },
    { key: record.record_kind === 'customer' ? 'renewal_window_days' : 'close_window_days', label: record.record_kind === 'customer' ? 'Renewal Window Days' : 'Close Window Days', value: record.record_kind === 'customer' ? signals.renewal_window_days : signals.close_window_days },
  ]);
}

function buildBoundedActions(signals) {
  const actions = [
    { action_key: 'create_task', label: 'Create Task', safe: true },
    { action_key: 'append_note', label: 'Add Note', safe: true },
    { action_key: 'update_record', label: 'Update Record', safe: true, allowed_fields: ['stage_key', 'owner_actor_id', 'priority', 'status'] },
  ];
  if (signals.approval_needed) {
    actions.push({ action_key: 'approve_recommendation', label: 'Approve', safe: true, approval_required: true });
  }
  if (signals.inbound_touch_count > 0 || signals.stalled_days >= 7 || signals.success_risk) {
    actions.push({ action_key: 'view_draft_suggestion', label: 'View Draft Suggestion', safe: true, suggestion_only: true });
  }
  return Object.freeze(actions);
}

function computeUrgencyScore(signals) {
  let score = 10;
  score += Math.min(signals.overdue_task_count * 20, 40);
  score += Math.min(signals.inbound_touch_count * 15, 30);
  score += Math.min(signals.stalled_days, 20);
  score += signals.success_risk ? 25 : 0;
  score += signals.approval_needed ? 20 : 0;
  score += signals.missing_owner ? 15 : 0;
  score += signals.missing_data ? 10 : 0;
  score += Math.min(Math.max(signals.intent_score, 0), 100) / 5;
  return Math.round(score);
}

function buildDraftSuggestion(record, signals) {
  if (!(signals.inbound_touch_count > 0 || signals.stalled_days >= 7 || signals.success_risk)) {
    return null;
  }
  return Object.freeze({
    suggestion_id: `draft:${record.record_kind}:${record.entity_id}`,
    suggestion_only: true,
    send_disabled: true,
    sequence_disabled: true,
    approval_required: signals.approval_needed,
    channel: 'email',
    title: `Suggested follow-up for ${record.display_name}`,
    preview: signals.success_risk
      ? 'Check recent adoption blockers, confirm renewal timeline, and propose the next safe step.'
      : 'Acknowledge the latest signal, restate the next step, and confirm a concrete follow-up time.',
  });
}

function buildExecutionRecommendation(input = {}) {
  const record = input.record && typeof input.record === 'object' ? input.record : {};
  const signals =
    input.signals && typeof input.signals === 'object'
      ? input.signals
      : normalizeExecutionSignals(input);
  const queueTab = resolveQueueTab(signals);
  const urgencyScore = computeUrgencyScore(signals);
  const actorId = String(input.actor_id || '').trim() || null;
  const ownedByActor = actorId && (signals.owner_actor_id === actorId || signals.assigned_actor_ids.includes(actorId));
  const recommendationId = `${record.tenant_id}:${record.record_kind}:${record.entity_id}:${queueTab}`;
  const draftSuggestion = buildDraftSuggestion(record, signals);

  return Object.freeze({
    recommendation_id: recommendationId,
    tenant_id: String(record.tenant_id || '').trim(),
    record_kind: String(record.record_kind || '').trim(),
    record_id: String(record.entity_id || '').trim(),
    display_name: String(record.display_name || '').trim(),
    queue_tab: queueTab,
    urgency_score: urgencyScore,
    risk_level: resolveRiskLevel(urgencyScore),
    rationale_summary: buildRationaleSummary(record, signals),
    source_signals: buildSourceSignals(record, signals),
    bounded_actions: buildBoundedActions(signals),
    owner_actor_id: signals.owner_actor_id,
    queue_scope: ownedByActor ? 'personal' : 'team',
    approval_needed: signals.approval_needed,
    status: 'active',
    created_at: toIso(input.now || record.updated_at || record.created_at),
    suggestion_artifact: draftSuggestion,
  });
}

function readRecommendationLifecycle(store, recommendationId) {
  const targetStore = ensureExecutionStore(store);
  return targetStore.executionRecommendations.find((row) => row.recommendation_id === recommendationId) || null;
}

function applyRecommendationLifecycle(recommendation, lifecycle) {
  if (!lifecycle) {
    return recommendation;
  }
  return Object.freeze({
    ...recommendation,
    status: lifecycle.status || recommendation.status,
    dismissed_at: lifecycle.dismissed_at || null,
    snoozed_until: lifecycle.snoozed_until || null,
    approved_at: lifecycle.approved_at || null,
  });
}

function buildExecutionRecommendations(input = {}) {
  const store = ensureExecutionStore(input.crmStore || input.store || { entities: [], activities: [], identityLinks: [] });
  const tenantId = String(input.tenant_id || '').trim();
  if (!tenantId) {
    throw new Error('CRM_TENANT_SCOPE_REQUIRED');
  }
  const actorId = String(input.actor_id || '').trim() || null;
  const nowIso = input.now || new Date().toISOString();
  const records = listCrmEntities(store, { tenant_id: tenantId })
    .filter((record) => !['task', 'note'].includes(record.record_kind));
  const tasks = listCrmEntities(store, { tenant_id: tenantId, record_kind: 'task' });
  const recommendations = records.map((record) => {
    const linkedTasks = tasks.filter((task) => task.linked_record_id === record.entity_id && task.linked_record_kind === record.record_kind);
    const timeline = buildCrmTimeline({
      tenant_id: tenantId,
      record_kind: record.record_kind,
      record_id: record.entity_id,
      activities: store.activities || [],
      identity_links: store.identityLinks || [],
    });
    const recommendation = buildExecutionRecommendation({
      record,
      tasks: linkedTasks,
      timeline,
      actor_id: actorId,
      now: nowIso,
    });
    return applyRecommendationLifecycle(recommendation, readRecommendationLifecycle(store, recommendation.recommendation_id));
  }).filter((recommendation) => input.include_dismissed === true || recommendation.status !== 'dismissed');
  return recommendations;
}

function queueTabWeight(queueTab) {
  return {
    approval_needed: 6,
    due_overdue: 5,
    inbound: 4,
    success_risk: 3,
    ownership_data: 2,
    stalled: 1,
    priority: 0,
  }[queueTab] || 0;
}

function rankExecutionQueue(input = {}) {
  const scope = input.scope === 'team' ? 'team' : 'personal';
  const queueTab = input.queue_tab ? String(input.queue_tab).trim() : 'all';
  const actorId = String(input.actor_id || '').trim() || null;
  const recommendations = Array.isArray(input.recommendations)
    ? input.recommendations.slice()
    : [];
  return recommendations
    .filter((recommendation) => {
      if (scope === 'personal') {
        if (!actorId) {
          return false;
        }
        return recommendation.owner_actor_id === actorId || recommendation.queue_scope === 'personal';
      }
      return true;
    })
    .filter((recommendation) => queueTab === 'all' || recommendation.queue_tab === queueTab)
    .sort((left, right) => {
      const urgencyDelta = right.urgency_score - left.urgency_score;
      if (urgencyDelta !== 0) {
        return urgencyDelta;
      }
      const tabDelta = queueTabWeight(right.queue_tab) - queueTabWeight(left.queue_tab);
      if (tabDelta !== 0) {
        return tabDelta;
      }
      return String(left.display_name || '').localeCompare(String(right.display_name || ''));
    });
}

function buildQueueTabs(recommendations) {
  return EXECUTION_QUEUE_TABS.map((tab) => ({
    tab_key: tab,
    count: recommendations.filter((item) => item.queue_tab === tab).length,
  }));
}

function buildExecutionQueues(input = {}) {
  const recommendations = buildExecutionRecommendations(input);
  const actorId = String(input.actor_id || '').trim() || null;
  const personal = rankExecutionQueue({ recommendations, scope: 'personal', actor_id: actorId, queue_tab: input.queue_tab || 'all' });
  const team = rankExecutionQueue({ recommendations, scope: 'team', actor_id: actorId, queue_tab: input.queue_tab || 'all' });
  return Object.freeze({
    recommendations,
    personal_queue: personal,
    team_queue: team,
    tabs: buildQueueTabs(recommendations),
  });
}

function upsertRecommendationLifecycle(store, input = {}) {
  const targetStore = ensureExecutionStore(store);
  const recommendationId = String(input.recommendation_id || '').trim();
  if (!recommendationId) {
    throw new Error('CRM_EXECUTION_RECOMMENDATION_REQUIRED');
  }
  const next = Object.freeze({
    recommendation_id: recommendationId,
    tenant_id: String(input.tenant_id || '').trim(),
    status: String(input.status || 'active').trim(),
    dismissed_at: input.dismissed_at ? toIso(input.dismissed_at) : null,
    snoozed_until: input.snoozed_until ? toIso(input.snoozed_until) : null,
    approved_at: input.approved_at ? toIso(input.approved_at) : null,
    updated_at: toIso(Date.now()),
  });
  const index = targetStore.executionRecommendations.findIndex((row) => row.recommendation_id === recommendationId);
  if (index >= 0) {
    targetStore.executionRecommendations.splice(index, 1, next);
  } else {
    targetStore.executionRecommendations.push(next);
  }
  return next;
}

function listDraftSuggestions(input = {}) {
  const store = input.crmStore ? ensureExecutionStore(input.crmStore) : null;
  const recommendations = Array.isArray(input.recommendations)
    ? input.recommendations
    : buildExecutionRecommendations(input);
  return recommendations
    .filter((recommendation) => recommendation.suggestion_artifact)
    .filter((recommendation) => {
      if (!store || input.include_dismissed === true) {
        return true;
      }
      const lifecycle = store.executionDrafts.find((item) => item.suggestion_id === recommendation.suggestion_artifact.suggestion_id);
      return lifecycle?.status !== 'dismissed';
    })
    .map((recommendation) => Object.freeze({
      recommendation_id: recommendation.recommendation_id,
      record_id: recommendation.record_id,
      record_kind: recommendation.record_kind,
      display_name: recommendation.display_name,
      urgency_score: recommendation.urgency_score,
      rationale_summary: recommendation.rationale_summary,
      ...recommendation.suggestion_artifact,
    }));
}

function upsertDraftLifecycle(store, input = {}) {
  const targetStore = ensureExecutionStore(store);
  const suggestionId = String(input.suggestion_id || '').trim();
  if (!suggestionId) {
    throw new Error('CRM_EXECUTION_SUGGESTION_REQUIRED');
  }
  const next = Object.freeze({
    suggestion_id: suggestionId,
    tenant_id: String(input.tenant_id || '').trim(),
    status: String(input.status || 'active').trim(),
    dismissed_at: input.dismissed_at ? toIso(input.dismissed_at) : null,
    updated_at: toIso(Date.now()),
  });
  const index = targetStore.executionDrafts.findIndex((row) => row.suggestion_id === suggestionId);
  if (index >= 0) {
    targetStore.executionDrafts.splice(index, 1, next);
  } else {
    targetStore.executionDrafts.push(next);
  }
  return next;
}

function buildExecutionWorkspaceSnapshot(input = {}) {
  const store = ensureExecutionStore(input.crmStore || input.store || { entities: [], activities: [], identityLinks: [] });
  const tenantId = String(input.tenant_id || '').trim();
  const actorId = String(input.actor_id || '').trim() || null;
  const initialScope = input.scope === 'team' ? 'team' : 'personal';
  const queueData = buildExecutionQueues({
    crmStore: store,
    tenant_id: tenantId,
    actor_id: actorId,
    queue_tab: 'all',
    now: input.now,
  });
  const visibleQueue = initialScope === 'team' ? queueData.team_queue : queueData.personal_queue;
  const selectedRecommendation = visibleQueue.find((item) => item.recommendation_id === input.selected_recommendation_id)
    || visibleQueue[0]
    || queueData.recommendations[0]
    || null;
  const recordSnapshot = selectedRecommendation
    ? buildCrmWorkspaceSnapshot({
        crmStore: store,
        tenant_id: tenantId,
        record_kind: selectedRecommendation.record_kind,
        view_type: 'detail',
        record_id: selectedRecommendation.record_id,
      })
    : null;
  const detail = selectedRecommendation ? {
    recommendation: selectedRecommendation,
    record: recordSnapshot?.detail?.record || null,
    timeline: recordSnapshot?.detail?.timeline || [],
    tasks: recordSnapshot?.detail?.tasks || [],
    notes: recordSnapshot?.detail?.notes || [],
    drafts: listDraftSuggestions({ recommendations: [selectedRecommendation], crmStore: store }),
  } : null;

  return Object.freeze({
    tenant_id: tenantId,
    actor_id: actorId,
    role: input.role || null,
    initial_scope: initialScope,
    initial_tab: 'all',
    tabs: queueData.tabs,
    recommendations: queueData.recommendations,
    selected_recommendation_id: selectedRecommendation?.recommendation_id || null,
    detail,
  });
}

module.exports = {
  EXECUTION_QUEUE_TABS,
  ensureExecutionStore,
  normalizeExecutionSignals,
  buildExecutionRecommendation,
  buildExecutionRecommendations,
  rankExecutionQueue,
  buildExecutionQueues,
  upsertRecommendationLifecycle,
  listDraftSuggestions,
  upsertDraftLifecycle,
  buildExecutionWorkspaceSnapshot,
};