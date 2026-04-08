import type { Stats } from 'node:fs';

'use strict';

const { assertWorkspaceViewType } = require('./contracts.ts');

function toTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeWorkspaceState(state) {
  return state && typeof state === 'object'
    ? state
    : { filters: {}, records: [], selected_record: null, tenant_id: '', object_kind: 'deal', pipeline_key: null, sort: normalizeSort(null) };
}

function normalizeSort(sort) {
  const input = sort && typeof sort === 'object' ? sort : {};
  return Object.freeze({
    field: String(input.field || 'display_name').trim(),
    direction: String(input.direction || 'asc').trim().toLowerCase() === 'desc' ? 'desc' : 'asc',
  });
}

function createWorkspaceState(input: Record<string, unknown> = {}) {
  const filters = input.filters && typeof input.filters === 'object'
    ? { ...input.filters }
    : {};
  return Object.freeze({
    tenant_id: toTrimmedString(input.tenant_id),
    object_kind: toTrimmedString(input.object_kind, 'deal'),
    view_type: assertWorkspaceViewType(input.view_type || 'kanban'),
    pipeline_key: typeof input.pipeline_key === 'string' ? input.pipeline_key.trim() : null,
    filters: Object.freeze(filters),
    sort: normalizeSort(input.sort),
    selected_record: typeof input.selected_record === 'string' ? input.selected_record.trim() : null,
    records: Array.isArray(input.records) ? input.records.slice() : [],
  });
}

function getRecordValue(record, field) {
  if (!record || typeof record !== 'object') {
    return null;
  }
  if (Object.hasOwn(record, field)) {
    return record[field];
  }
  return record.attributes && Object.hasOwn(record.attributes, field)
    ? record.attributes[field]
    : null;
}

function getWorkspaceRecords(state) {
  const search = String(state.filters.search || '').trim().toLowerCase();
  const stageKey = state.filters.stage_key ? String(state.filters.stage_key).trim() : null;
  return state.records
    .filter((record) => record.tenant_id === state.tenant_id)
    .filter((record) => record.record_kind === state.object_kind)
    .filter((record) => !state.pipeline_key || String(getRecordValue(record, 'pipeline_key') || '') === state.pipeline_key)
    .filter((record) => !stageKey || String(getRecordValue(record, 'stage_key') || '') === stageKey)
    .filter((record) => !search || String(record.display_name || '').toLowerCase().includes(search))
    .sort((left, right) => {
      const leftValue = getRecordValue(left, state.sort.field);
      const rightValue = getRecordValue(right, state.sort.field);
      if (leftValue === rightValue) {
        return String(left.entity_id || '').localeCompare(String(right.entity_id || ''));
      }
      if (state.sort.direction === 'desc') {
        return String(rightValue || '').localeCompare(String(leftValue || ''));
      }
      return String(leftValue || '').localeCompare(String(rightValue || ''));
    });
}

function buildKanbanColumns(state, stages = []) {
  const records = getWorkspaceRecords(state);
  const configuredStages = Array.isArray(stages) && stages.length > 0
    ? stages.slice().sort((left, right) => Number(left.stage_order || 0) - Number(right.stage_order || 0))
    : Array.from(new Set(records.map((record) => String(getRecordValue(record, 'stage_key') || 'unassigned')))).map((stageKey, index) => ({
        stage_key: stageKey,
        display_name: stageKey,
        stage_order: index + 1,
      }));

  return configuredStages.map((stage) => ({
    stage_key: stage.stage_key,
    display_name: stage.display_name,
    records: records.filter((record) => String(getRecordValue(record, 'stage_key') || 'unassigned') === stage.stage_key),
  }));
}

function buildTableRows(state) {
  return getWorkspaceRecords(state);
}

function buildRecordDetailModel(input: Record<string, unknown> = {}) {
  const state = normalizeWorkspaceState(input.state);
  const recordId = toTrimmedString(input.record_id, toTrimmedString(state.selected_record));
  const records = Array.isArray(state.records) ? state.records : [];
  const record = records.find((entry) => entry.entity_id === recordId) || null;
  return {
    record,
    timeline: (Array.isArray(input.timeline) ? input.timeline : []).filter((entry) => entry.related_record_id === recordId || entry.stitched_identity === true),
    tasks: (Array.isArray(input.tasks) ? input.tasks : []).filter((entry) => entry.linked_record_id === recordId),
    notes: (Array.isArray(input.notes) ? input.notes : []).filter((entry) => entry.linked_record_id === recordId),
  };
}

function buildCalendarEntries(input: Record<string, unknown> = {}) {
  const state = normalizeWorkspaceState(input.state);
  const objectDefinition: Record<string, unknown> =
    input.object_definition && typeof input.object_definition === 'object'
      ? input.object_definition as Record<string, unknown>
      : {};
  if (objectDefinition.calendar_enabled !== true || !objectDefinition.calendar_date_field_key) {
    return [];
  }
  return getWorkspaceRecords(state)
    .map((record) => ({
      entity_id: record.entity_id,
      display_name: record.display_name,
      occurs_at: getRecordValue(record, objectDefinition.calendar_date_field_key),
    }))
    .filter((entry) => Boolean(entry.occurs_at))
    .sort((left, right) => {
      const leftTs = Date.parse(left.occurs_at || 0);
      const rightTs = Date.parse(right.occurs_at || 0);
      if (leftTs !== rightTs) {
        return leftTs - rightTs;
      }
      return String(left.entity_id || '').localeCompare(String(right.entity_id || ''));
    });
}

function buildFunnelRows(input: Record<string, unknown> = {}) {
  const state = normalizeWorkspaceState(input.state);
  const pipeline: Record<string, unknown> =
    input.pipeline && typeof input.pipeline === 'object'
      ? input.pipeline as Record<string, unknown>
      : { stages: [] };
  const records = getWorkspaceRecords(state);
  const stages = Array.isArray(pipeline.stages) && pipeline.stages.length > 0
    ? pipeline.stages
    : Array.from(new Set(records.map((record) => String(getRecordValue(record, 'stage_key') || 'unassigned')))).map((stageKey) => ({ stage_key: stageKey, display_name: stageKey }));

  return stages.map((stage) => {
    const stageRecords = records.filter((record) => String(getRecordValue(record, 'stage_key') || 'unassigned') === stage.stage_key);
    return {
      stage_key: stage.stage_key,
      display_name: stage.display_name,
      record_count: stageRecords.length,
      total_value: Number(stageRecords.reduce((sum, record) => sum + Number(getRecordValue(record, 'amount') || 0), 0).toFixed(2)),
    };
  });
}

function serializeWorkspaceFilters(filters: Record<string, unknown> = {}) {
  return Object.keys(filters)
    .sort((left, right) => left.localeCompare(right))
    .filter((key) => filters[key] !== undefined && filters[key] !== null && toTrimmedString(filters[key]).length > 0)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(toTrimmedString(filters[key]))}`)
    .join('&');
}

function applyWorkspaceMutation(state, mutation: Record<string, unknown> = {}) {
  const normalizedState = normalizeWorkspaceState(state);
  const mutationFilters = mutation.filters && typeof mutation.filters === 'object'
    ? mutation.filters as Record<string, unknown>
    : {};
  const mutationRecord = mutation.record && typeof mutation.record === 'object'
    ? mutation.record as Record<string, unknown>
    : null;
  if (mutation.type === 'set_view') {
    return createWorkspaceState({ ...normalizedState, view_type: mutation.view_type });
  }
  if (mutation.type === 'set_filter') {
    return createWorkspaceState({ ...normalizedState, filters: { ...normalizedState.filters, ...mutationFilters } });
  }
  if (mutation.type === 'select_record') {
    return createWorkspaceState({ ...normalizedState, selected_record: mutation.record_id });
  }
  if (mutation.type === 'replace_records') {
    return createWorkspaceState({ ...normalizedState, records: mutation.records });
  }
  if (mutation.type === 'record_updated') {
    return createWorkspaceState({
      ...normalizedState,
      records: normalizedState.records.map((record) => mutationRecord && record.entity_id === mutationRecord.entity_id ? mutationRecord : record),
    });
  }
  return createWorkspaceState(normalizedState);
}

module.exports = {
  createWorkspaceState,
  getWorkspaceRecords,
  buildKanbanColumns,
  buildTableRows,
  buildRecordDetailModel,
  buildCalendarEntries,
  buildFunnelRows,
  serializeWorkspaceFilters,
  applyWorkspaceMutation,
};