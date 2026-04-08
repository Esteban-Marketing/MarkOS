const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const timelinePath = path.join(root, 'lib/markos/crm/timeline.ts');
const contractPath = path.join(root, 'contracts/F-58-crm-timeline-query-v1.yaml');
const migrationPath = path.join(root, 'supabase/migrations/58_crm_activity_and_identity.sql');

function loadTsCommonJsModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, { filename: filePath });
  wrapped.runInThisContext()(module.exports, require, module, filePath, path.dirname(filePath));
  return module.exports;
}

test('CRM-02: timeline helper orders newest activity first and preserves source references', () => {
  const { buildCrmTimeline } = loadTsCommonJsModule(timelinePath);
  const timeline = buildCrmTimeline({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    record_id: 'contact-001',
    activities: [
      { activity_id: 'activity-002', tenant_id: 'tenant-alpha-001', activity_family: 'note', related_record_kind: 'contact', related_record_id: 'contact-001', source_event_ref: 'note:2', occurred_at: '2026-04-04T12:00:00.000Z' },
      { activity_id: 'activity-001', tenant_id: 'tenant-alpha-001', activity_family: 'pageview', related_record_kind: 'contact', related_record_id: 'contact-001', anonymous_identity_id: 'anon-001', source_event_ref: 'web:1', occurred_at: '2026-04-04T10:00:00.000Z' },
    ],
    identity_links: [
      { tenant_id: 'tenant-alpha-001', anonymous_identity_id: 'anon-001', known_record_kind: 'contact', known_record_id: 'contact-001', link_status: 'accepted' },
    ],
  });
  assert.deepEqual(timeline.map((row) => row.activity_id), ['activity-002', 'activity-001']);
  assert.equal(timeline[1].stitched_identity, true);
  assert.equal(timeline[0].source_event_ref, 'note:2');
});

test('CRM-02: timeline contract and migration encode MarkOS-owned ledger semantics', () => {
  const contract = fs.readFileSync(contractPath, 'utf8');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  assert.match(contract, /source_of_truth: "crm_activity_ledger"/);
  assert.match(contract, /deterministic_ordering:/);
  assert.match(migration, /crm_activity_ledger/i);
  assert.match(migration, /activity_family text not null check/i);
  assert.match(migration, /source_event_ref text not null/i);
});
