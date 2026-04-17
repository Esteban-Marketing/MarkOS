const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const routePath = path.join(root, 'app/(markos)/crm/copilot/page.tsx');
const storePath = path.join(root, 'app/(markos)/crm/copilot/copilot-store.tsx');
const recordPanelPath = path.join(root, 'components/markos/crm/copilot-record-panel.tsx');
const conversationPanelPath = path.join(root, 'components/markos/crm/copilot-conversation-panel.tsx');
const recommendationCardPath = path.join(root, 'components/markos/crm/copilot-recommendation-card.tsx');
const approvalPackagePath = path.join(root, 'components/markos/crm/copilot-approval-package.tsx');
const copilotPath = path.join(root, 'lib/markos/crm/copilot.ts');

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

test('CRM-04: copilot workspace route uses CRM-native queue, detail, and evidence regions instead of a detached chatbox', () => {
  [routePath, storePath, recordPanelPath, conversationPanelPath, recommendationCardPath, approvalPackagePath].forEach((filePath) => {
    assert.equal(fs.existsSync(filePath), true, `${filePath} must exist`);
  });
  const routeSource = fs.readFileSync(routePath, 'utf8');
  const storeSource = fs.readFileSync(storePath, 'utf8');

  assert.match(routeSource, /CopilotStoreProvider/);
  assert.match(routeSource, /CopilotRecordPanel/);
  assert.match(routeSource, /CopilotConversationPanel/);
  assert.match(routeSource, /CopilotApprovalPackage/);
  assert.match(routeSource, /buildCopilotWorkspaceSnapshot/);
  assert.doesNotMatch(routeSource, /chatbox|assistant console/i);
  assert.match(storeSource, /selectedRecord/);
  assert.match(storeSource, /summaryMode/);
  assert.match(storeSource, /selectedPackage/);
  assert.match(storeSource, /evidenceEntries/);

  const recordPanelSource = fs.readFileSync(recordPanelPath, 'utf8');
  assert.match(recordPanelSource, /Record brief/i);
  assert.match(recordPanelSource, /why it matters|evidence-backed|next step/i);
});

test('AI-CRM-01: copilot workspace snapshot hydrates record, conversation, recommendations, and evidence from canonical CRM state', () => {
  const copilot = loadTsCommonJsModule(copilotPath);
  const store = {
    entities: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Expansion', created_at: '2026-04-04T09:00:00.000Z', updated_at: '2026-04-04T10:00:00.000Z', status: 'active', linked_record_kind: null, linked_record_id: null, merged_into: null, attributes: { owner_actor_id: 'ae-001', stage_key: 'qualified', amount: 42000, approval_state: 'needed' } },
      { entity_id: 'task-001', tenant_id: 'tenant-alpha-001', record_kind: 'task', display_name: 'Confirm rollout timing', created_at: '2026-04-04T10:10:00.000Z', updated_at: '2026-04-04T10:10:00.000Z', status: 'open', linked_record_kind: 'deal', linked_record_id: 'deal-001', merged_into: null, attributes: { due_at: '2026-04-05T10:00:00.000Z' } },
      { entity_id: 'note-001', tenant_id: 'tenant-alpha-001', record_kind: 'note', display_name: 'Buying committee note', created_at: '2026-04-04T10:11:00.000Z', updated_at: '2026-04-04T10:11:00.000Z', status: 'active', linked_record_kind: 'deal', linked_record_id: 'deal-001', merged_into: null, attributes: { body_markdown: 'Champion asked for implementation sequencing.' } },
    ],
    activities: [
      { activity_id: 'activity-001', tenant_id: 'tenant-alpha-001', activity_family: 'campaign_touch', related_record_kind: 'deal', related_record_id: 'deal-001', source_event_ref: 'tracked:reply', payload_json: { direction: 'inbound' }, actor_id: 'contact-001', occurred_at: '2026-04-04T10:15:00.000Z' },
    ],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    outboundMessages: [
      { message_id: 'msg-001', conversation_id: 'conv-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', record_id: 'deal-001', channel: 'email', body_markdown: 'Can we stage rollout in two waves?', created_at: '2026-04-04T10:16:00.000Z' },
    ],
    outboundConversations: [
      { conversation_id: 'conv-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', record_id: 'deal-001', contact_id: 'contact-001', latest_message_at: '2026-04-04T10:16:00.000Z', message_count: 2 },
    ],
    copilotApprovalPackages: [],
  };

  const snapshot = copilot.buildCopilotWorkspaceSnapshot({
    crmStore: store,
    tenant_id: 'tenant-alpha-001',
    actor_id: 'ae-001',
    role: 'manager',
  });

  assert.equal(snapshot.selected_record_id, 'deal-001');
  assert.equal(snapshot.selected_conversation_id, 'conv-001');
  assert.equal(snapshot.summary.summary_mode, 'conversation');
  assert.ok(snapshot.recommendations.length >= 3);
  assert.ok(snapshot.evidence_entries.length >= 4);
  assert.equal(snapshot.bundle.record.entity_id, 'deal-001');
  assert.equal(snapshot.bundle.conversation.conversation_id, 'conv-001');
  assert.ok(snapshot.summary.risk_flags.includes('approval_required'));
});