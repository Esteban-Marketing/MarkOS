const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const workspacePath = path.join(root, 'lib/markos/crm/workspace.ts');
const shellPath = path.join(root, 'components/markos/crm/workspace-shell.tsx');

function loadTsCommonJsModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, { filename: filePath });
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      return loadTsCommonJsModule(path.resolve(path.dirname(filePath), specifier));
    }
    return require(specifier);
  };
  wrapped.runInThisContext()(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

test('CRM-03: workspace shell exposes all six required views', () => {
  const source = fs.readFileSync(shellPath, 'utf8');

  assert.match(source, /Kanban/);
  assert.match(source, /Table/);
  assert.match(source, /Detail/);
  assert.match(source, /Timeline/);
  assert.match(source, /Calendar/);
  assert.match(source, /Funnel/);
});

test('CRM-03: cross-view state keeps filters, pipeline context, and mutations coherent across all six views', () => {
  const workspace = loadTsCommonJsModule(workspacePath);
  const pipeline = {
    stages: [
      { stage_key: 'qualified', display_name: 'Qualified', stage_order: 1 },
      { stage_key: 'proposal', display_name: 'Proposal', stage_order: 2 },
    ],
  };
  const objectDefinition = {
    calendar_enabled: true,
    calendar_date_field_key: 'expected_close_at',
  };
  const initial = workspace.createWorkspaceState({
    tenant_id: 'tenant-alpha-001',
    object_kind: 'deal',
    view_type: 'kanban',
    pipeline_key: 'sales',
    filters: { search: 'Alpha' },
    selected_record: 'deal-001',
    records: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal', attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200, expected_close_at: '2026-04-11T10:00:00.000Z', owner_actor_id: 'owner-actor-001', risk_level: 'medium' } },
      { entity_id: 'deal-002', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Beta Deal', attributes: { pipeline_key: 'sales', stage_key: 'proposal', amount: 800, expected_close_at: '2026-04-15T10:00:00.000Z', owner_actor_id: 'owner-actor-002', risk_level: 'low' } },
    ],
  });

  const updatedRecord = {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { pipeline_key: 'sales', stage_key: 'proposal', amount: 2000, expected_close_at: '2026-04-20T09:00:00.000Z', owner_actor_id: 'owner-actor-001', risk_level: 'medium' },
  };
  const next = workspace.applyWorkspaceMutation(initial, { type: 'record_updated', record: updatedRecord });
  const savedState = workspace.applyWorkspaceMutation(next, {
    type: 'save_view',
    saved_view: {
      view_key: 'at-risk-alpha',
      label: 'At Risk Alpha',
      view_type: 'table',
      filters: { search: 'Alpha', owner_actor_id: 'owner-actor-001', risk_level: 'medium' },
    },
  });
  const tableState = workspace.applyWorkspaceMutation(savedState, { type: 'set_view', view_type: 'table' });
  const restoredState = workspace.applyWorkspaceMutation(tableState, { type: 'set_saved_view', saved_view_key: 'at-risk-alpha' });
  const calendarState = workspace.applyWorkspaceMutation(restoredState, { type: 'set_view', view_type: 'calendar' });
  const funnelState = workspace.applyWorkspaceMutation(restoredState, { type: 'set_view', view_type: 'funnel' });

  const kanban = workspace.buildKanbanColumns(restoredState, pipeline.stages);
  const table = workspace.buildTableRows(tableState);
  const restoredRows = workspace.buildTableRows(restoredState);
  const calendar = workspace.buildCalendarEntries({ state: calendarState, object_definition: objectDefinition });
  const funnel = workspace.buildFunnelRows({ state: funnelState, pipeline });
  const detail = workspace.buildRecordDetailModel({
    state: restoredState,
    record_id: 'deal-001',
    timeline: [{ activity_id: 'activity-001', related_record_id: 'deal-001', activity_family: 'crm_mutation', source_event_ref: 'api:records:update:deal-001' }],
    tasks: [],
    notes: [],
  });

  assert.equal(tableState.filters.search, 'Alpha');
  assert.equal(restoredState.active_saved_view_key, 'at-risk-alpha');
  assert.equal(restoredState.filters.owner_actor_id, 'owner-actor-001');
  assert.equal(restoredState.filters.risk_level, 'medium');
  assert.equal(restoredRows.length, 1);
  assert.equal(restoredRows[0].entity_id, 'deal-001');
  assert.equal(calendarState.pipeline_key, 'sales');
  assert.equal(kanban.find((column) => column.stage_key === 'proposal').records[0].entity_id, 'deal-001');
  assert.equal(table[0].attributes.stage_key, 'proposal');
  assert.equal(calendar[0].occurs_at, '2026-04-20T09:00:00.000Z');
  assert.deepEqual(funnel.map((row) => [row.stage_key, row.record_count, row.total_value, row.weighted_value]), [
    ['qualified', 0, 0, 0],
    ['proposal', 1, 2000, 1333.33],
  ]);
  assert.equal(detail.record.entity_id, 'deal-001');
});