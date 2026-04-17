'use strict';

const {
  getCrmStore,
  listCrmEntities,
  listPipelineConfigs,
  listWorkspaceObjectDefinitions,
  buildCrmTimeline,
} = require('./api.cjs');

const workspace = require('./workspace.ts');

function buildDefaultObjectDefinition(recordKind) {
  return {
    record_kind: recordKind,
    display_name: String(recordKind || 'record'),
    workspace_enabled: true,
    pipeline_enabled: recordKind === 'deal',
    detail_enabled: true,
    timeline_enabled: true,
    calendar_enabled: false,
    funnel_enabled: recordKind === 'deal',
    calendar_date_field_key: null,
  };
}

function listLinkedEntities(store, tenantId, recordKind, recordId) {
  const entities = listCrmEntities(store, {
    tenant_id: tenantId,
    record_kind: recordKind,
  });
  return entities.filter((entry) => entry.linked_record_id === recordId);
}

function buildDefaultSavedViews(input = {}) {
  const pipelineKey = typeof input.pipeline_key === 'string' ? input.pipeline_key.trim() : null;
  const baseFilters = {
    search: input.search || '',
    stage_key: input.stage_key || '',
  };
  return [
    {
      view_key: 'pipeline-board',
      label: 'Pipeline Board',
      view_type: 'kanban',
      pipeline_key: pipelineKey,
      filters: baseFilters,
    },
    {
      view_key: 'closing-soon',
      label: 'Closing Soon',
      view_type: 'table',
      pipeline_key: pipelineKey,
      filters: { ...baseFilters, risk_level: 'medium' },
    },
    {
      view_key: 'at-risk',
      label: 'At Risk',
      view_type: 'table',
      pipeline_key: pipelineKey,
      filters: { ...baseFilters, risk_level: 'high' },
    },
  ];
}

function buildCrmWorkspaceSnapshot(input = {}) {
  const tenantId = String(input.tenant_id || '').trim();
  const recordKind = String(input.record_kind || 'deal').trim();
  const viewType = input.view_type || 'kanban';
  const search = String(input.search || '').trim();
  const stageKey = String(input.stage_key || '').trim();
  const store = getCrmStore({ crmStore: input.crmStore });
  const objectDefinition = listWorkspaceObjectDefinitions(store, { tenant_id: tenantId })
    .find((entry) => entry.record_kind === recordKind) || buildDefaultObjectDefinition(recordKind);
  const pipelines = listPipelineConfigs(store, { tenant_id: tenantId, object_kind: recordKind });
  const pipeline = (input.pipeline_key
    ? pipelines.find((entry) => entry.pipeline_key === input.pipeline_key)
    : pipelines[0]) || { pipeline_key: input.pipeline_key || null, stages: [] };
  const records = listCrmEntities(store, {
    tenant_id: tenantId,
    record_kind: recordKind,
    search,
  }).filter((entry) => !pipeline.pipeline_key || String(entry.attributes?.pipeline_key || '') === pipeline.pipeline_key)
    .filter((entry) => !stageKey || String(entry.attributes?.stage_key || '') === stageKey);
  const selectedRecord = String(input.record_id || input.selected_record || records[0]?.entity_id || '').trim() || null;
  const state = workspace.createWorkspaceState({
    tenant_id: tenantId,
    object_kind: recordKind,
    view_type: viewType,
    pipeline_key: pipeline.pipeline_key || null,
    filters: {
      search,
      stage_key: stageKey,
    },
    saved_views: buildDefaultSavedViews({
      pipeline_key: pipeline.pipeline_key || null,
      search,
      stage_key: stageKey,
    }),
    active_saved_view_key: viewType === 'kanban' ? 'pipeline-board' : null,
    selected_record: selectedRecord,
    records,
  });
  const timeline = selectedRecord
    ? buildCrmTimeline({
        tenant_id: tenantId,
        record_kind: recordKind,
        record_id: selectedRecord,
        activities: store.activities || [],
        identity_links: store.identityLinks || [],
      })
    : [];
  const tasks = selectedRecord ? listLinkedEntities(store, tenantId, 'task', selectedRecord) : [];
  const notes = selectedRecord ? listLinkedEntities(store, tenantId, 'note', selectedRecord) : [];
  const detail = workspace.buildRecordDetailModel({
    state,
    record_id: selectedRecord,
    timeline,
    tasks,
    notes,
  });

  return {
    objectDefinition,
    pipelines,
    pipeline,
    records,
    state,
    detail,
  };
}

module.exports = {
  buildCrmWorkspaceSnapshot,
};