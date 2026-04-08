const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const workspacePath = path.join(root, 'lib/markos/crm/workspace.ts');
const workspaceDataPath = path.join(root, 'lib/markos/crm/workspace-data.ts');
const crmIndexPath = path.join(root, 'app/(markos)/crm/page.tsx');
const crmObjectPath = path.join(root, 'app/(markos)/crm/[objectKind]/page.tsx');
const workspaceShellPath = path.join(root, 'components/markos/crm/workspace-shell.tsx');

function loadTsCommonJsModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, { filename: filePath });
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filePath), specifier);
      const extension = path.extname(resolved);
      if (extension === '.cjs' || extension === '.json' || extension === '.node') {
        return require(resolved);
      }
      return loadTsCommonJsModule(resolved);
    }
    return require(specifier);
  };
  wrapped.runInThisContext()(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

test('CRM-03: workspace routes and shell replace placeholder pages with a CRM workspace entry family', () => {
  [crmIndexPath, crmObjectPath, workspaceShellPath].forEach((filePath) => {
    assert.equal(fs.existsSync(filePath), true, `${filePath} must exist`);
  });
  const indexSource = fs.readFileSync(crmIndexPath, 'utf8');
  const objectSource = fs.readFileSync(crmObjectPath, 'utf8');
  const shellSource = fs.readFileSync(workspaceShellPath, 'utf8');
  assert.match(indexSource, /buildCrmWorkspaceSnapshot/);
  assert.match(objectSource, /buildCrmWorkspaceSnapshot/);
  assert.match(shellSource, /Kanban/);
  assert.match(shellSource, /Table/);
  assert.match(shellSource, /Timeline/);
  assert.match(shellSource, /fetch\('\/api\/crm\/records'/);
});

test('CRM-03: protected CRM routes hydrate canonical records, pipeline context, and detail timeline state', () => {
  const workspaceData = loadTsCommonJsModule(workspaceDataPath);
  const store = {
    entities: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T10:00:00.000Z', status: 'active', linked_record_kind: null, linked_record_id: null, merged_into: null, attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200, expected_close_at: '2026-04-11T10:00:00.000Z' } },
      { entity_id: 'task-001', tenant_id: 'tenant-alpha-001', record_kind: 'task', display_name: 'Call champion', created_at: '2026-04-04T10:15:00.000Z', updated_at: '2026-04-04T10:15:00.000Z', status: 'open', linked_record_kind: 'deal', linked_record_id: 'deal-001', merged_into: null, attributes: {} },
      { entity_id: 'note-001', tenant_id: 'tenant-alpha-001', record_kind: 'note', display_name: 'Deal note', created_at: '2026-04-04T10:20:00.000Z', updated_at: '2026-04-04T10:20:00.000Z', status: 'active', linked_record_kind: 'deal', linked_record_id: 'deal-001', merged_into: null, attributes: { body_markdown: 'Strong buying signal' } },
    ],
    activities: [
      { activity_id: 'activity-001', tenant_id: 'tenant-alpha-001', activity_family: 'crm_mutation', related_record_kind: 'deal', related_record_id: 'deal-001', source_event_ref: 'api:records:update:deal-001', payload_json: {}, actor_id: 'manager-actor-001', occurred_at: '2026-04-04T10:30:00.000Z' },
    ],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    pipelines: [
      { pipeline_id: 'pipeline-tenant-alpha-001-sales', tenant_id: 'tenant-alpha-001', pipeline_key: 'sales', display_name: 'Sales Pipeline', object_kind: 'deal', created_by: 'owner-actor-001', updated_by: 'owner-actor-001', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T09:00:00.000Z' },
    ],
    pipelineStages: [
      { stage_id: 'stage-qualified', tenant_id: 'tenant-alpha-001', pipeline_key: 'sales', stage_key: 'qualified', display_name: 'Qualified', stage_order: 1, color_hex: null, is_won: false, is_lost: false, created_by: 'owner-actor-001', updated_by: 'owner-actor-001', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T09:00:00.000Z' },
    ],
    objectDefinitions: [
      { object_definition_id: 'object-definition-tenant-alpha-001-deal', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Deals', is_custom_object: false, workspace_enabled: true, pipeline_enabled: true, detail_enabled: true, timeline_enabled: true, calendar_enabled: true, funnel_enabled: true, calendar_date_field_key: 'expected_close_at', created_by: 'owner-actor-001', updated_by: 'owner-actor-001', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T09:00:00.000Z' },
    ],
  };

  const snapshot = workspaceData.buildCrmWorkspaceSnapshot({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    view_type: 'detail',
    pipeline_key: 'sales',
    record_id: 'deal-001',
  });

  assert.equal(snapshot.state.records.length, 1);
  assert.equal(snapshot.pipeline.pipeline_key, 'sales');
  assert.equal(snapshot.detail.record.entity_id, 'deal-001');
  assert.equal(snapshot.detail.timeline.length, 1);
  assert.equal(snapshot.detail.tasks.length, 1);
  assert.equal(snapshot.detail.notes.length, 1);
});

test('CRM-03: kanban and table views read from the same canonical workspace record layer', () => {
  const workspace = loadTsCommonJsModule(workspacePath);
  const state = workspace.createWorkspaceState({
    tenant_id: 'tenant-alpha-001',
    object_kind: 'deal',
    view_type: 'kanban',
    pipeline_key: 'sales',
    records: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal', updated_at: '2026-04-04T10:00:00.000Z', created_at: '2026-04-04T09:00:00.000Z', attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200 } },
      { entity_id: 'deal-002', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Beta Deal', updated_at: '2026-04-04T11:00:00.000Z', created_at: '2026-04-04T09:30:00.000Z', attributes: { pipeline_key: 'sales', stage_key: 'proposal', amount: 800 } },
    ],
  });
  const stages = [
    { stage_key: 'qualified', display_name: 'Qualified', stage_order: 1 },
    { stage_key: 'proposal', display_name: 'Proposal', stage_order: 2 },
  ];

  const kanban = workspace.buildKanbanColumns(state, stages);
  const tableRows = workspace.buildTableRows(state);

  assert.deepEqual(kanban.flatMap((column) => column.records.map((record) => record.entity_id)).sort(), ['deal-001', 'deal-002']);
  assert.deepEqual(tableRows.map((record) => record.entity_id).sort(), ['deal-001', 'deal-002']);
});

test('CRM-03: workspace filter state survives view switching and remains serializable', () => {
  const workspace = loadTsCommonJsModule(workspacePath);
  const initial = workspace.createWorkspaceState({
    tenant_id: 'tenant-alpha-001',
    object_kind: 'deal',
    pipeline_key: 'sales',
    records: [],
    filters: { stage_key: 'qualified', search: 'Alpha' },
  });

  const next = workspace.applyWorkspaceMutation(initial, { type: 'set_view', view_type: 'table' });
  const serialized = workspace.serializeWorkspaceFilters(next.filters);

  assert.equal(next.view_type, 'table');
  assert.equal(next.filters.stage_key, 'qualified');
  assert.match(serialized, /search=Alpha/);
  assert.match(serialized, /stage_key=qualified/);
});