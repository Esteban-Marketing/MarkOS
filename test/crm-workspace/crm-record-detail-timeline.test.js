const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const workspacePath = path.join(root, 'lib/markos/crm/workspace.ts');
const recordDetailPath = path.join(root, 'components/markos/crm/record-detail.tsx');
const recordRoutePath = path.join(root, 'app/(markos)/crm/[objectKind]/[recordId]/page.tsx');
const { buildCrmTimeline } = require('../../lib/markos/crm/timeline.ts');

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

test('CRM-03: record-detail hub surfaces canonical fields, ordered timeline, tasks, and notes', () => {
  assert.equal(fs.existsSync(recordDetailPath), true);
  assert.equal(fs.existsSync(recordRoutePath), true);

  const workspace = loadTsCommonJsModule(workspacePath);
  const timeline = buildCrmTimeline({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    record_id: 'deal-001',
    activities: [
      { activity_id: 'activity-002', tenant_id: 'tenant-alpha-001', activity_family: 'note', related_record_kind: 'deal', related_record_id: 'deal-001', source_event_ref: 'note:1', occurred_at: '2026-04-04T12:00:00.000Z' },
      { activity_id: 'activity-001', tenant_id: 'tenant-alpha-001', activity_family: 'crm_mutation', related_record_kind: 'deal', related_record_id: 'deal-001', anonymous_identity_id: 'anon-123', source_event_ref: 'deal:create', occurred_at: '2026-04-04T11:00:00.000Z' },
    ],
    identity_links: [
      { tenant_id: 'tenant-alpha-001', anonymous_identity_id: 'anon-123', known_record_kind: 'deal', known_record_id: 'deal-001', link_status: 'accepted' },
    ],
  });
  const state = workspace.createWorkspaceState({
    tenant_id: 'tenant-alpha-001',
    object_kind: 'deal',
    selected_record: 'deal-001',
    records: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal', updated_at: '2026-04-04T12:00:00.000Z', created_at: '2026-04-04T09:00:00.000Z', attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200 } },
    ],
  });

  const detail = workspace.buildRecordDetailModel({
    state,
    record_id: 'deal-001',
    timeline,
    tasks: [{ task_id: 'task-001', linked_record_kind: 'deal', linked_record_id: 'deal-001', title: 'Call champion' }],
    notes: [{ note_id: 'note-001', linked_record_kind: 'deal', linked_record_id: 'deal-001', body_markdown: 'Strong buying signal' }],
  });

  assert.equal(detail.record.entity_id, 'deal-001');
  assert.deepEqual(detail.timeline.map((entry) => entry.activity_id), ['activity-002', 'activity-001']);
  assert.equal(detail.timeline[1].stitched_identity, true);
  assert.equal(detail.tasks.length, 1);
  assert.equal(detail.notes.length, 1);
});