'use strict';

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = require.extensions['.js'];
}

const { createCrmEntity, updateCrmEntity, listCrmEntities } = require('./entities.ts');
const { buildCrmTimeline } = require('./timeline.ts');
const { recordMergeDecision, applyApprovedMerge } = require('./merge.ts');
const { validatePipelineDefinition, validateWorkspaceObjectDefinition } = require('./contracts.ts');

const READ_ROLES = new Set(['owner', 'tenant-admin', 'manager', 'contributor', 'reviewer', 'billing-admin', 'readonly']);
const MUTATION_ROLES = new Set(['owner', 'tenant-admin', 'manager', 'contributor']);
const MERGE_ROLES = new Set(['owner', 'tenant-admin', 'manager', 'reviewer']);
const OUTBOUND_SEND_ROLES = new Set(['owner', 'tenant-admin', 'manager', 'contributor']);
const OUTBOUND_APPROVAL_ROLES = new Set(['owner', 'tenant-admin', 'manager', 'reviewer']);

const sharedStore = {
  entities: [],
  activities: [],
  identityLinks: [],
  mergeDecisions: [],
  mergeLineage: [],
};

function ensureStoreArray(store, key) {
  if (!Array.isArray(store[key])) {
    store[key] = [];
  }
}

function ensureStoreMap(store, key) {
  if (!store[key] || typeof store[key].has !== 'function') {
    store[key] = new Map();
  }
}

function ensureCrmStoreCollections(store) {
  [
    'pipelines',
    'pipelineStages',
    'objectDefinitions',
    'executionRecommendations',
    'executionDrafts',
    'executionQueuePreferences',
    'outboundMessages',
    'outboundConsentRecords',
    'outboundConversations',
    'outboundTemplates',
    'outboundSequences',
    'outboundQueue',
    'outboundBulkSends',
    'copilotSummaries',
    'copilotApprovalPackages',
    'copilotMutationOutcomes',
    'copilotPlaybookRuns',
    'copilotPlaybookSteps',
    'copilotPlaybookAudit',
  ].forEach((key) => ensureStoreArray(store, key));
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function requireCrmTenantContext(req) {
  const auth = req && (req.markosAuth || req.tenantContext) || {};
  const tenantId = auth.tenant_id || auth.principal?.tenant_id || auth.tenantId;
  const role = auth.iamRole || auth.principal?.tenant_role || auth.role;
  const actorId = auth.principal?.id || auth.actor_id || 'unknown';

  if (!tenantId) {
    return {
      ok: false,
      status: 401,
      error: 'TENANT_CONTEXT_REQUIRED',
      message: 'CRM operations require tenant-scoped auth context.',
    };
  }

  if (!READ_ROLES.has(String(role || ''))) {
    return {
      ok: false,
      status: 403,
      error: 'CRM_ROLE_DENIED',
      message: 'CRM role is not allowed for this tenant-scoped action.',
    };
  }

  return {
    ok: true,
    tenant_id: tenantId,
    iamRole: String(role),
    actor_id: String(actorId),
  };
}

function assertCrmMutationAllowed(context, action) {
  const role = String(context?.iamRole || '');
  const mergeAction = action === 'merge_review';
  const outboundSendAction = action === 'outbound_send';
  const outboundApprovalAction = action === 'outbound_approve';
  let allowed = MUTATION_ROLES.has(role);
  if (mergeAction) {
    allowed = MERGE_ROLES.has(role);
  } else if (outboundSendAction) {
    allowed = OUTBOUND_SEND_ROLES.has(role);
  } else if (outboundApprovalAction) {
    allowed = OUTBOUND_APPROVAL_ROLES.has(role);
  }
  if (!allowed) {
    return {
      allowed: false,
      status: 403,
      error: 'CRM_MUTATION_FORBIDDEN',
      message: `Role '${role}' cannot perform CRM mutation '${action}'.`,
    };
  }
  return { allowed: true };
}

function getCrmStore(req) {
  const store = req?.crmStore || sharedStore;
  ensureCrmStoreCollections(store);
  ensureStoreMap(store, 'copilotRunRegistry');
  ensureStoreMap(store, 'copilotDecisionStore');
  if (!store.copilotEventStore || typeof store.copilotEventStore.appendEvent !== 'function') {
    const { createInMemoryEventStore } = require('../../../onboarding/backend/agents/run-engine.cjs');
    store.copilotEventStore = createInMemoryEventStore();
  }
  if (!store.copilotSideEffectLedger || typeof store.copilotSideEffectLedger.has !== 'function') {
    const { createInMemorySideEffectLedger } = require('../../../onboarding/backend/agents/run-engine.cjs');
    store.copilotSideEffectLedger = createInMemorySideEffectLedger();
  }
  return store;
}

function appendCrmActivity(store, activity) {
  if (!Array.isArray(store.activities)) {
    store.activities = [];
  }
  const row = Object.freeze({
    activity_id: String(activity.activity_id || `activity-${store.activities.length + 1}`),
    tenant_id: String(activity.tenant_id || '').trim(),
    activity_family: String(activity.activity_family || 'crm_mutation').trim(),
    related_record_kind: String(activity.related_record_kind || '').trim(),
    related_record_id: String(activity.related_record_id || '').trim(),
    anonymous_identity_id: activity.anonymous_identity_id ? String(activity.anonymous_identity_id).trim() : null,
    source_event_ref: String(activity.source_event_ref || '').trim(),
    payload_json: activity.payload_json ? { ...activity.payload_json } : {},
    actor_id: activity.actor_id ? String(activity.actor_id).trim() : null,
    occurred_at: new Date(activity.occurred_at || Date.now()).toISOString(),
  });
  store.activities.push(row);
  return row;
}

function listPipelineConfigs(store, selector = {}) {
  const targetStore = getCrmStore({ crmStore: store });
  const tenantId = String(selector.tenant_id || '').trim();
  if (!tenantId) {
    throw new Error('CRM_TENANT_SCOPE_REQUIRED');
  }
  const objectKind = selector.object_kind ? String(selector.object_kind).trim() : null;
  return targetStore.pipelines
    .filter((row) => row.tenant_id === tenantId)
    .filter((row) => !objectKind || row.object_kind === objectKind)
    .sort((left, right) => left.display_name.localeCompare(right.display_name))
    .map((pipeline) => ({
      ...pipeline,
      stages: targetStore.pipelineStages
        .filter((stage) => stage.tenant_id === tenantId && stage.pipeline_key === pipeline.pipeline_key)
        .sort((left, right) => left.stage_order - right.stage_order),
    }));
}

function upsertPipelineConfig(store, input, actorId = null) {
  const targetStore = getCrmStore({ crmStore: store });
  validatePipelineDefinition(input);
  const tenantId = String(input.tenant_id).trim();
  const pipelineKey = String(input.pipeline_key).trim();
  const now = new Date().toISOString();
  const pipeline = Object.freeze({
    pipeline_id: String(input.pipeline_id || `pipeline-${tenantId}-${pipelineKey}`),
    tenant_id: tenantId,
    pipeline_key: pipelineKey,
    display_name: String(input.display_name).trim(),
    object_kind: String(input.object_kind).trim(),
    created_by: input.created_by ? String(input.created_by).trim() : actorId,
    updated_by: actorId,
    created_at: input.created_at || now,
    updated_at: now,
  });

  const existingIndex = targetStore.pipelines.findIndex((row) => row.tenant_id === tenantId && row.pipeline_key === pipelineKey);
  if (existingIndex >= 0) {
    targetStore.pipelines.splice(existingIndex, 1, pipeline);
  } else {
    targetStore.pipelines.push(pipeline);
  }

  if (Array.isArray(input.stages)) {
    targetStore.pipelineStages = targetStore.pipelineStages.filter((row) => !(row.tenant_id === tenantId && row.pipeline_key === pipelineKey));
    const stages = input.stages
      .map((stage, index) => Object.freeze({
        stage_id: String(stage.stage_id || `stage-${tenantId}-${pipelineKey}-${stage.stage_key}`),
        tenant_id: tenantId,
        pipeline_key: pipelineKey,
        stage_key: String(stage.stage_key).trim(),
        display_name: String(stage.display_name).trim(),
        stage_order: Number(stage.stage_order ?? index + 1),
        color_hex: stage.color_hex ? String(stage.color_hex).trim() : null,
        is_won: stage.is_won === true,
        is_lost: stage.is_lost === true,
        created_by: actorId,
        updated_by: actorId,
        created_at: stage.created_at || now,
        updated_at: now,
      }))
      .sort((left, right) => left.stage_order - right.stage_order);
    targetStore.pipelineStages.push(...stages);
  }

  return listPipelineConfigs(targetStore, { tenant_id: tenantId }).find((row) => row.pipeline_key === pipelineKey);
}

function listWorkspaceObjectDefinitions(store, selector = {}) {
  const targetStore = getCrmStore({ crmStore: store });
  const tenantId = String(selector.tenant_id || '').trim();
  if (!tenantId) {
    throw new Error('CRM_TENANT_SCOPE_REQUIRED');
  }
  return targetStore.objectDefinitions
    .filter((row) => row.tenant_id === tenantId)
    .sort((left, right) => left.display_name.localeCompare(right.display_name));
}

function upsertWorkspaceObjectDefinition(store, input, actorId = null) {
  const targetStore = getCrmStore({ crmStore: store });
  validateWorkspaceObjectDefinition(input);
  const tenantId = String(input.tenant_id).trim();
  const recordKind = String(input.record_kind).trim();
  const now = new Date().toISOString();
  const definition = Object.freeze({
    object_definition_id: String(input.object_definition_id || `object-definition-${tenantId}-${recordKind}`),
    tenant_id: tenantId,
    record_kind: recordKind,
    display_name: String(input.display_name).trim(),
    is_custom_object: input.is_custom_object === true,
    workspace_enabled: input.workspace_enabled !== false,
    pipeline_enabled: input.pipeline_enabled === true,
    detail_enabled: input.detail_enabled !== false,
    timeline_enabled: input.timeline_enabled !== false,
    calendar_enabled: input.calendar_enabled === true,
    funnel_enabled: input.funnel_enabled === true,
    calendar_date_field_key: input.calendar_date_field_key ? String(input.calendar_date_field_key).trim() : null,
    created_by: input.created_by ? String(input.created_by).trim() : actorId,
    updated_by: actorId,
    created_at: input.created_at || now,
    updated_at: now,
  });

  const existingIndex = targetStore.objectDefinitions.findIndex((row) => row.tenant_id === tenantId && row.record_kind === recordKind);
  if (existingIndex >= 0) {
    targetStore.objectDefinitions.splice(existingIndex, 1, definition);
  } else {
    targetStore.objectDefinitions.push(definition);
  }
  return definition;
}

module.exports = {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
  listPipelineConfigs,
  upsertPipelineConfig,
  listWorkspaceObjectDefinitions,
  upsertWorkspaceObjectDefinition,
  createCrmEntity,
  updateCrmEntity,
  listCrmEntities,
  buildCrmTimeline,
  recordMergeDecision,
  applyApprovedMerge,
  sharedStore,
};
