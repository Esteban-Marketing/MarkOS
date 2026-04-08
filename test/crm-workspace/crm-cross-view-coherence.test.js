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
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal', attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200, expected_close_at: '2026-04-11T10:00:00.000Z' } },
      { entity_id: 'deal-002', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Beta Deal', attributes: { pipeline_key: 'sales', stage_key: 'proposal', amount: 800, expected_close_at: '2026-04-15T10:00:00.000Z' } },
    ],
  });

  const updatedRecord = {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { pipeline_key: 'sales', stage_key: 'proposal', amount: 2000, expected_close_at: '2026-04-20T09:00:00.000Z' },
  };
  const next = workspace.applyWorkspaceMutation(initial, { type: 'record_updated', record: updatedRecord });
  const tableState = workspace.applyWorkspaceMutation(next, { type: 'set_view', view_type: 'table' });
  const calendarState = workspace.applyWorkspaceMutation(next, { type: 'set_view', view_type: 'calendar' });
  const funnelState = workspace.applyWorkspaceMutation(next, { type: 'set_view', view_type: 'funnel' });

  const kanban = workspace.buildKanbanColumns(next, pipeline.stages);
  const table = workspace.buildTableRows(tableState);
  const calendar = workspace.buildCalendarEntries({ state: calendarState, object_definition: objectDefinition });
  const funnel = workspace.buildFunnelRows({ state: funnelState, pipeline });
  const detail = workspace.buildRecordDetailModel({
    state: next,
    record_id: 'deal-001',
    timeline: [{ activity_id: 'activity-001', related_record_id: 'deal-001', activity_family: 'crm_mutation', source_event_ref: 'api:records:update:deal-001' }],
    tasks: [],
    notes: [],
  });

  assert.equal(tableState.filters.search, 'Alpha');
  assert.equal(calendarState.pipeline_key, 'sales');
  assert.equal(kanban.find((column) => column.stage_key === 'proposal').records[0].entity_id, 'deal-001');
  assert.equal(table[0].attributes.stage_key, 'proposal');
  assert.equal(calendar[0].occurs_at, '2026-04-20T09:00:00.000Z');
  assert.deepEqual(funnel.map((row) => [row.stage_key, row.record_count, row.total_value]), [
    ['qualified', 0, 0],
    ['proposal', 1, 2000],
  ]);
  assert.equal(detail.record.entity_id, 'deal-001');
});