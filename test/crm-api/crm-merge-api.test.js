const test = require('node:test');
const assert = require('node:assert/strict');

const { handleMerge } = require('../../api/crm/merge.js');
const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');

function makeReq({ body = {}, auth = null, crmStore = null } = {}) {
  return {
    method: 'POST',
    body,
    crmStore,
    markosAuth: auth,
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

function authFor(role, tenantId = 'tenant-alpha-001') {
  return {
    tenant_id: tenantId,
    iamRole: role,
    principal: {
      id: `${role}-actor-001`,
      tenant_id: tenantId,
      tenant_role: role,
    },
  };
}

test('CRM merge API: readonly role is denied', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  const req = makeReq({
    auth: authFor('readonly'),
    crmStore: store,
    body: {
      canonical_record_kind: 'contact',
      canonical_record_id: 'contact-001',
      decision_state: 'rejected',
      confidence: 0.5,
      source_event_ref: 'merge:1',
      source_record_refs: [{ source_record_kind: 'contact', source_record_id: 'contact-002' }],
    },
  });
  const res = makeRes();
  await handleMerge(req, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'CRM_MUTATION_FORBIDDEN');
});

test('CRM merge API: reviewer can record rejected merge evidence immutably', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  const req = makeReq({
    auth: authFor('reviewer'),
    crmStore: store,
    body: {
      canonical_record_kind: 'contact',
      canonical_record_id: 'contact-001',
      decision_state: 'rejected',
      confidence: 0.43,
      rationale: 'Shared company domain only',
      source_event_ref: 'merge:review:rejected',
      source_record_refs: [{ source_record_kind: 'contact', source_record_id: 'contact-002' }],
    },
  });
  const res = makeRes();
  await handleMerge(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.decision.decision_state, 'rejected');
  assert.equal(res.body.lineage.length, 1);
});

test('CRM merge API: accepted decisions preserve source rows as merged lineage', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, { entity_id: 'contact-001', tenant_id: 'tenant-alpha-001', record_kind: 'contact', display_name: 'Ada Lovelace' });
  createCrmEntity(store, { entity_id: 'contact-002', tenant_id: 'tenant-alpha-001', record_kind: 'contact', display_name: 'A. Lovelace' });
  const req = makeReq({
    auth: authFor('reviewer'),
    crmStore: store,
    body: {
      canonical_record_kind: 'contact',
      canonical_record_id: 'contact-001',
      decision_state: 'accepted',
      confidence: 0.95,
      rationale: 'Exact email and session continuity',
      source_event_ref: 'merge:review:accepted',
      source_record_refs: [{ source_record_kind: 'contact', source_record_id: 'contact-002' }],
    },
  });
  const res = makeRes();
  await handleMerge(req, res);
  assert.equal(res.statusCode, 200);
  const mergedRow = store.entities.find((row) => row.entity_id === 'contact-002');
  assert.equal(mergedRow.status, 'merged');
  assert.equal(mergedRow.merged_into, 'contact-001');
});
