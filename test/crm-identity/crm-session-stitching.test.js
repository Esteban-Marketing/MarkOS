const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const identityPath = path.join(root, 'lib/markos/crm/identity.ts');
const contractPath = path.join(root, 'contracts/F-59-identity-stitching-v1.yaml');

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

test('TRK-04: strong identity signals auto-accept and preserve stitch lineage', () => {
  const { scoreIdentityCandidate, createIdentityLink } = loadTsCommonJsModule(identityPath);
  const score = scoreIdentityCandidate({
    email_exact_match: true,
    domain_match: true,
    session_overlap: true,
  });
  const store = { identityLinks: [] };
  const link = createIdentityLink(store, {
    tenant_id: 'tenant-alpha-001',
    anonymous_identity_id: 'anon-123',
    known_record_kind: 'contact',
    known_record_id: 'contact-123',
    confidence: score.confidence,
    link_status: score.recommended_decision,
    source_event_ref: 'identify:accepted:1',
  });

  assert.equal(score.recommended_decision, 'accepted');
  assert.equal(link.link_status, 'accepted');
  assert.equal(store.identityLinks.length, 1);
});

test('TRK-04: medium identity signals stay review-only instead of auto-attaching', () => {
  const { scoreIdentityCandidate, createIdentityLink } = loadTsCommonJsModule(identityPath);
  const score = scoreIdentityCandidate({
    domain_match: true,
    form_submitted: true,
    device_match: true,
  });
  const store = { identityLinks: [] };
  const link = createIdentityLink(store, {
    tenant_id: 'tenant-alpha-001',
    anonymous_identity_id: 'anon-456',
    known_record_kind: 'contact',
    known_record_id: 'contact-123',
    confidence: score.confidence,
    link_status: score.recommended_decision,
    source_event_ref: 'identify:review:1',
    reviewer_actor_id: 'owner-001',
  });

  assert.equal(score.recommended_decision, 'review');
  assert.equal(link.link_status, 'review');
  assert.equal(link.reviewer_actor_id, 'owner-001');
});

test('TRK-04: weak identity signals are rejected explicitly', () => {
  const { scoreIdentityCandidate, createIdentityLink } = loadTsCommonJsModule(identityPath);
  const score = scoreIdentityCandidate({ device_match: true });
  const store = { identityLinks: [] };
  const link = createIdentityLink(store, {
    tenant_id: 'tenant-alpha-001',
    anonymous_identity_id: 'anon-789',
    known_record_kind: 'contact',
    known_record_id: 'contact-123',
    confidence: score.confidence,
    link_status: score.recommended_decision,
    source_event_ref: 'identify:rejected:1',
    reviewer_actor_id: 'owner-001',
  });

  assert.equal(score.recommended_decision, 'rejected');
  assert.equal(link.link_status, 'rejected');
});

test('TRK-04: stitch contract records accepted, review, and rejected outcomes', () => {
  const contract = fs.readFileSync(contractPath, 'utf8');

  assert.match(contract, /accepted/);
  assert.match(contract, /review/);
  assert.match(contract, /rejected/);
  assert.match(contract, /source_event_ref/);
});