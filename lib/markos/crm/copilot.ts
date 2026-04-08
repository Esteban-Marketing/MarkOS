export type __ModuleMarker = import('node:fs').Stats;

'use strict';

const { listCrmEntities } = require('./entities.ts');
const { buildCrmTimeline } = require('./timeline.ts');

function ensureCopilotStore(store) {
  if (!store || typeof store !== 'object') {
    throw new Error('CRM_STORE_REQUIRED');
  }
  if (!Array.isArray(store.outboundMessages)) {
    store.outboundMessages = [];
  }
  if (!Array.isArray(store.outboundConversations)) {
    store.outboundConversations = [];
  }
  if (!Array.isArray(store.copilotSummaries)) {
    store.copilotSummaries = [];
  }
  if (!Array.isArray(store.copilotApprovalPackages)) {
    store.copilotApprovalPackages = [];
  }
  return store;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeSelector(input: Record<string, unknown> = {}) {
  return {
    tenantId: String(input.tenant_id || '').trim(),
    recordKind: input.record_kind ? String(input.record_kind).trim() : null,
    recordId: input.record_id ? String(input.record_id).trim() : null,
    conversationId: input.conversation_id ? String(input.conversation_id).trim() : null,
  };
}

function resolveTargetRecord(entities, recordKind, recordId) {
  if (!recordKind || !recordId) {
    return null;
  }
  return entities.find((entity) => entity.record_kind === recordKind && entity.entity_id === recordId) || null;
}

function buildBundleScope(record, recordKind, recordId) {
  if (!record) {
    return { recordKind, recordId };
  }
  return {
    recordKind: record.record_kind,
    recordId: record.entity_id,
  };
}

function buildContextInventory(record, timeline, linked, outboundHistory, conversation) {
  return [
    ['record_state', Boolean(record)],
    ['timeline_activity', timeline.length > 0],
    ['linked_tasks', linked.tasks.length > 0],
    ['linked_notes', linked.notes.length > 0],
    ['outbound_history', outboundHistory.length > 0],
    ['conversation_context', Boolean(conversation)],
  ];
}

function collectContextClasses(entries, present) {
  return unique(entries.map(([name, isPresent]) => (isPresent === present ? name : null)));
}

function resolveLinkedEntities(store, tenantId, recordKind, recordId) {
  const entities = listCrmEntities(store, { tenant_id: tenantId });
  const tasks = entities.filter((entity) => entity.record_kind === 'task' && entity.linked_record_kind === recordKind && entity.linked_record_id === recordId);
  const notes = entities.filter((entity) => entity.record_kind === 'note' && entity.linked_record_kind === recordKind && entity.linked_record_id === recordId);
  return { entities, tasks, notes };
}

function buildConversationContext(store, tenantId, recordKind, recordId, conversationId) {
  const conversations = (store.outboundConversations || []).filter((row) => row.tenant_id === tenantId);
  const conversation = conversations.find((row) => conversationId && row.conversation_id === conversationId)
    || conversations.find((row) => row.record_kind === recordKind && row.record_id === recordId)
    || null;
  const relatedActivities = (store.activities || [])
    .filter((row) => row.tenant_id === tenantId)
    .filter((row) => {
      if (conversation) {
        return row.related_record_kind === conversation.record_kind && row.related_record_id === conversation.record_id;
      }
      return row.related_record_kind === recordKind && row.related_record_id === recordId;
    });
  const outboundHistory = unique([
    ...((store.outboundMessages || [])
      .filter((row) => row.tenant_id === tenantId)
      .filter((row) => {
        if (conversation) {
          return row.conversation_id === conversation.conversation_id || row.record_id === conversation.record_id;
        }
        return row.record_kind === recordKind && row.record_id === recordId;
      })),
    ...relatedActivities,
  ]);
  return { conversation, outboundHistory };
}

function buildCopilotGroundingBundle(input: Record<string, unknown> = {}) {
  const store = ensureCopilotStore(input.crmStore || input.store || { entities: [], activities: [], identityLinks: [] });
  const { tenantId, recordKind, recordId, conversationId } = normalizeSelector(input);
  if (!tenantId) {
    throw new Error('CRM_TENANT_SCOPE_REQUIRED');
  }
  const entities = listCrmEntities(store, { tenant_id: tenantId });
  const record = resolveTargetRecord(entities, recordKind, recordId);
  const scope = buildBundleScope(record, recordKind, recordId);
  const linked = record ? resolveLinkedEntities(store, tenantId, record.record_kind, record.entity_id) : { entities, tasks: [], notes: [] };
  const timeline = record
    ? buildCrmTimeline({
        tenant_id: tenantId,
        record_kind: record.record_kind,
        record_id: record.entity_id,
        activities: store.activities || [],
        identity_links: store.identityLinks || [],
      })
    : [];
  const { conversation, outboundHistory } = buildConversationContext(
    store,
    tenantId,
    scope.recordKind,
    scope.recordId,
    conversationId,
  );
  const contextInventory = buildContextInventory(record, timeline, linked, outboundHistory, conversation);
  const sourceClasses = collectContextClasses(contextInventory, true);
  const missingContext = collectContextClasses(contextInventory, false);

  return Object.freeze({
    grounding_id: `grounding:${tenantId}:${scope.recordKind || 'unknown'}:${scope.recordId || 'unknown'}:${conversationId || 'none'}`,
    tenant_id: tenantId,
    actor_id: input.actor_id ? String(input.actor_id).trim() : null,
    record,
    conversation,
    timeline,
    tasks: linked.tasks,
    notes: linked.notes,
    outbound_history: outboundHistory,
    source_classes: sourceClasses,
    missing_context: missingContext,
  });
}

function buildRiskFlags(bundle) {
  const flags = [];
  const record = bundle.record;
  if (!record) {
    return ['missing_record_context'];
  }
  if (record.attributes?.approval_state === 'needed') {
    flags.push('approval_required');
  }
  if (record.record_kind === 'customer' && Number(record.attributes?.health_score || 0) > 0 && Number(record.attributes?.health_score || 0) < 50) {
    flags.push('customer_health_risk');
  }
  if (record.record_kind === 'deal' && !record.attributes?.amount) {
    flags.push('missing_amount');
  }
  if (bundle.tasks.filter((task) => !['completed', 'done', 'closed'].includes(String(task.status || '').toLowerCase())).length === 0) {
    flags.push('no_open_tasks');
  }
  return flags;
}

function packageRecommendationAction(bundle, input: Record<string, unknown> = {}) {
  const actionKey = String(input.action_key || 'append_note').trim();
  const record = bundle.record;
  const recommendedLabel = input.label || actionKey.replaceAll('_', ' ');
  return Object.freeze({
    action_key: actionKey,
    label: recommendedLabel,
    approval_required: true,
    recommendation_id: `recommendation:${bundle.grounding_id}:${actionKey}`,
    target_record_kind: record ? record.record_kind : null,
    target_record_id: record ? record.entity_id : null,
    rationale: {
      summary: input.summary || `Use grounded CRM context to ${recommendedLabel}.`,
      source_classes: bundle.source_classes,
    },
    evidence: [
      { key: 'source_classes', value: bundle.source_classes },
      { key: 'timeline_count', value: bundle.timeline.length },
      { key: 'task_count', value: bundle.tasks.length },
      { key: 'conversation_present', value: Boolean(bundle.conversation) },
    ],
    proposed_changes: input.proposed_changes || {},
  });
}

function generateCopilotSummaryModel(bundle, input: Record<string, unknown> = {}) {
  const mode = String(input.mode || (bundle.conversation ? 'conversation' : 'record')).trim();
  const record = bundle.record;
  const riskFlags = buildRiskFlags(bundle);
  const recordName = record ? record.display_name : 'CRM record';
  let summaryText = `Record summary for ${recordName} with ${bundle.tasks.length} linked task(s), ${bundle.notes.length} linked note(s), and ${bundle.timeline.length} timeline event(s).`;
  if (mode === 'conversation') {
    summaryText = `Conversation summary for ${recordName} with ${bundle.outbound_history.length} outbound context item(s) and ${bundle.timeline.length} CRM event(s).`;
  }
  const recommendations = [
    packageRecommendationAction(bundle, {
      action_key: 'create_task',
      summary: 'Create a next-step task anchored in current CRM signals.',
      proposed_changes: { title: `Follow up on ${record ? record.display_name : 'record'}` },
    }),
    packageRecommendationAction(bundle, {
      action_key: 'append_note',
      summary: 'Persist a short grounded note that captures rationale and risk.',
      proposed_changes: { title: `Copilot note for ${record ? record.display_name : 'record'}` },
    }),
  ];
  if (record?.record_kind === 'deal') {
    recommendations.push(packageRecommendationAction(bundle, {
      action_key: 'update_stage',
      summary: 'Prepare a safe stage update for explicit operator approval.',
      proposed_changes: { stage_key: record.attributes?.stage_key || 'qualified' },
    }));
  }
  recommendations.push(packageRecommendationAction(bundle, {
    action_key: 'propose_enrichment',
    summary: 'Prepare a bounded enrichment proposal rather than mutating silently.',
    proposed_changes: { fields: ['persona', 'next_best_channel'] },
  }));

  return Object.freeze({
    summary_id: `summary:${bundle.grounding_id}:${mode}`,
    tenant_id: bundle.tenant_id,
    record_kind: record ? record.record_kind : null,
    record_id: record ? record.entity_id : null,
    conversation_id: bundle.conversation ? bundle.conversation.conversation_id : null,
    summary_mode: mode,
    source_classes: bundle.source_classes,
    missing_context: bundle.missing_context,
    summary_text: summaryText,
    rationale: {
      summary: record
        ? `${record.display_name} is grounded in canonical CRM state with ${bundle.source_classes.join(', ')}.`
        : 'Summary generated from partial CRM context only.',
      evidence_count: bundle.timeline.length + bundle.tasks.length + bundle.notes.length + bundle.outbound_history.length,
    },
    risk_flags: riskFlags,
    recommendations,
  });
}

function buildCopilotWorkspaceSnapshot(input: Record<string, unknown> = {}) {
  const store = ensureCopilotStore(input.crmStore || input.store || { entities: [], activities: [], identityLinks: [] });
  const tenantId = String(input.tenant_id || '').trim();
  const records = listCrmEntities(store, { tenant_id: tenantId })
    .filter((entity) => !['task', 'note'].includes(entity.record_kind));
  const selectedRecord = records[0] || null;
  const bundle = selectedRecord
    ? buildCopilotGroundingBundle({
        crmStore: store,
        tenant_id: tenantId,
        actor_id: input.actor_id,
        record_kind: selectedRecord.record_kind,
        record_id: selectedRecord.entity_id,
      })
    : buildCopilotGroundingBundle({ crmStore: store, tenant_id: tenantId, actor_id: input.actor_id });
  const summary = generateCopilotSummaryModel(bundle, { mode: bundle.conversation ? 'conversation' : 'record' });
  const recommendations = summary.recommendations || [];
  const selectedPackage = store.copilotApprovalPackages.find((row) => row.review_tenant_id === tenantId || row.tenant_id === tenantId) || null;
  const evidenceEntries = [
    ...summary.source_classes.map((entry) => ({ type: 'source_class', label: entry })),
    ...summary.risk_flags.map((entry) => ({ type: 'risk_flag', label: entry })),
    ...recommendations.flatMap((entry) => (entry.evidence || []).map((evidence) => ({
      type: 'recommendation_evidence',
      label: `${entry.action_key}:${evidence.key}`,
      value: evidence.value,
    }))),
  ];
  return Object.freeze({
    tenant_id: tenantId,
    actor_id: input.actor_id ? String(input.actor_id).trim() : null,
    role: input.role ? String(input.role).trim() : null,
    records,
    selected_record_id: selectedRecord ? selectedRecord.entity_id : null,
    selected_conversation_id: bundle.conversation ? bundle.conversation.conversation_id : null,
    summary_mode: summary.summary_mode,
    summary_modes: ['record', 'conversation'],
    bundle,
    summary,
    recommendations,
    selected_recommendation_id: recommendations[0] ? recommendations[0].recommendation_id : null,
    evidence_entries: evidenceEntries,
    approval_packages: store.copilotApprovalPackages.filter((row) => row.review_tenant_id === tenantId || row.tenant_id === tenantId),
    selected_package_id: selectedPackage ? selectedPackage.package_id : null,
  });
}

module.exports = {
  buildCopilotGroundingBundle,
  generateCopilotSummaryModel,
  packageRecommendationAction,
  buildCopilotWorkspaceSnapshot,
};