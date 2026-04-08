const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const identityPath = path.join(root, 'lib/markos/crm/identity.ts');
const mergePath = path.join(root, 'lib/markos/crm/merge.ts');
const entitiesPath = path.join(root, 'lib/markos/crm/entities.ts');
const contractPath = path.join(root, 'contracts/F-58-crm-merge-dedupe-v1.yaml');

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

test('TRK-04 foundation: identity candidate scoring is deterministic and review-oriented', () => {
  const { scoreIdentityCandidate } = loadTsCommonJsModule(identityPath);
  const strong = scoreIdentityCandidate({ email_exact_match: true, domain_match: true, session_overlap: true });
  const weak = scoreIdentityCandidate({ device_match: true });
  assert.equal(strong.recommended_decision, 'accepted');
  assert.equal(weak.recommended_decision, 'rejected');
  assert.ok(strong.confidence > weak.confidence);
});

test('CRM-02: merge helpers preserve accepted and rejected lineage without deleting evidence', () => {
  const entities = loadTsCommonJsModule(entitiesPath);
  const { recordMergeDecision, applyApprovedMerge } = loadTsCommonJsModule(mergePath);
  const store = { entities: [], mergeDecisions: [], mergeLineage: [] };
  entities.createCrmEntity(store, { entity_id: 'contact-001', tenant_id: 'tenant-alpha-001', record_kind: 'contact', display_name: 'Ada Lovelace' });
  entities.createCrmEntity(store, { entity_id: 'contact-002', tenant_id: 'tenant-alpha-001', record_kind: 'contact', display_name: 'A. Lovelace' });
  const rejected = recordMergeDecision(store, {
    tenant_id: 'tenant-alpha-001',
    canonical_record_kind: 'contact',
    canonical_record_id: 'contact-001',
    decision_state: 'rejected',
    confidence: 0.42,
    reviewer_actor_id: 'reviewer-001',
    source_event_ref: 'merge:review:1',
    source_record_refs: [{ source_record_kind: 'contact', source_record_id: 'contact-002' }],
  });
  const accepted = applyApprovedMerge(store, {
    tenant_id: 'tenant-alpha-001',
    canonical_record_kind: 'contact',
    canonical_record_id: 'contact-001',
    confidence: 0.92,
    reviewer_actor_id: 'reviewer-001',
    source_event_ref: 'merge:review:2',
    source_record_refs: [{ source_record_kind: 'contact', source_record_id: 'contact-002' }],
  });
  assert.equal(rejected.decision_state, 'rejected');
  assert.equal(accepted.decision_state, 'accepted');
  assert.equal(store.mergeDecisions.length, 2);
  assert.ok(store.mergeLineage.length >= 2);
  const mergedRow = store.entities.find((row) => row.entity_id === 'contact-002');
  assert.equal(mergedRow.status, 'merged');
  assert.equal(mergedRow.merged_into, 'contact-001');
});

test('CRM-02: merge contract records immutable evidence fields', () => {
  const contract = fs.readFileSync(contractPath, 'utf8');
  assert.match(contract, /immutable_decisions: true/);
  assert.match(contract, /merge_decisions:/);
  assert.match(contract, /source_record_refs/);
});
