const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const routePath = path.join(root, 'app/(markos)/crm/execution/page.tsx');
const storePath = path.join(root, 'app/(markos)/crm/execution/execution-store.tsx');
const queuePath = path.join(root, 'components/markos/crm/execution-queue.tsx');
const detailPath = path.join(root, 'components/markos/crm/execution-detail.tsx');
const evidencePath = path.join(root, 'components/markos/crm/execution-evidence-panel.tsx');
const draftPanelPath = path.join(root, 'components/markos/crm/draft-suggestion-panel.tsx');
const executionPath = path.join(root, 'lib/markos/crm/execution.ts');

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

test('CRM-04: execution workspace route reuses the three-region queue, detail, and evidence grammar', () => {
  [routePath, storePath, queuePath, detailPath, evidencePath, draftPanelPath].forEach((filePath) => {
    assert.equal(fs.existsSync(filePath), true, `${filePath} must exist`);
  });
  const routeSource = fs.readFileSync(routePath, 'utf8');
  const storeSource = fs.readFileSync(storePath, 'utf8');
  assert.match(routeSource, /ExecutionStoreProvider/);
  assert.match(routeSource, /ExecutionQueue/);
  assert.match(routeSource, /ExecutionDetail/);
  assert.match(routeSource, /ExecutionEvidencePanel/);
  assert.match(routeSource, /buildExecutionWorkspaceSnapshot/);
  assert.match(storeSource, /selectedRecommendation/);
  assert.match(storeSource, /visibleRecommendations/);
});

test('CRM-04: execution workspace snapshot hydrates queue, detail context, and evidence from canonical CRM state', () => {
  const execution = loadTsCommonJsModule(executionPath);
  const store = {
    entities: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T10:00:00.000Z', status: 'active', linked_record_kind: null, linked_record_id: null, merged_into: null, attributes: { owner_actor_id: 'ae-001', intent_score: 85, stage_key: 'qualified', amount: 1200 } },
      { entity_id: 'task-001', tenant_id: 'tenant-alpha-001', record_kind: 'task', display_name: 'Call champion', created_at: '2026-04-04T10:15:00.000Z', updated_at: '2026-04-04T10:15:00.000Z', status: 'open', linked_record_kind: 'deal', linked_record_id: 'deal-001', merged_into: null, attributes: { due_at: '2026-04-03T10:00:00.000Z', assigned_actor_id: 'ae-001' } },
      { entity_id: 'note-001', tenant_id: 'tenant-alpha-001', record_kind: 'note', display_name: 'Deal note', created_at: '2026-04-04T10:20:00.000Z', updated_at: '2026-04-04T10:20:00.000Z', status: 'active', linked_record_kind: 'deal', linked_record_id: 'deal-001', merged_into: null, attributes: { body_markdown: 'Strong buying signal' } },
    ],
    activities: [
      { activity_id: 'activity-001', tenant_id: 'tenant-alpha-001', activity_family: 'campaign_touch', related_record_kind: 'deal', related_record_id: 'deal-001', source_event_ref: 'tracked:reply', payload_json: { direction: 'inbound' }, actor_id: 'contact-001', occurred_at: '2026-04-04T10:30:00.000Z' },
    ],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    pipelines: [],
    pipelineStages: [],
    objectDefinitions: [],
  };

  const snapshot = execution.buildExecutionWorkspaceSnapshot({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'ae-001',
    scope: 'personal',
    now: '2026-04-04T12:00:00.000Z',
  });

  assert.ok(snapshot.recommendations.length >= 1);
  assert.equal(snapshot.initial_scope, 'personal');
  assert.equal(snapshot.detail.record.entity_id, 'deal-001');
  assert.equal(snapshot.detail.tasks.length, 1);
  assert.equal(snapshot.detail.notes.length, 1);
  assert.equal(snapshot.detail.timeline.length, 1);
});