const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPageIndexAdapter,
} = require('../../onboarding/backend/pageindex/pageindex-client.cjs');

function envelope(tenantScope) {
  return {
    mode: 'reason',
    discipline: 'Paid Media',
    audience: 'operators',
    filters: {
      pain_point_tags: ['high_cpr'],
      business_model: ['B2B'],
      funnel_stage: ['awareness'],
      content_type: ['playbook'],
      tenant_scope: tenantScope,
    },
    provenance_required: true,
  };
}

function item(id, tenantScope) {
  return {
    id,
    text: `${tenantScope} retrieval payload`,
    metadata: { tenant_scope: tenantScope },
    score: 0.9,
    provenance: {
      source: { system: 'pageindex', kind: 'retrieval' },
      timestamp: '2026-04-12T00:00:00.000Z',
      actor: { id: tenantScope, type: 'system' },
      lineage: ['pageindex', 'retrieval'],
      joins: { audience: ['operators'], pain_point_tags: ['high_cpr'] },
    },
  };
}

test('84-03 isolation matrix: tenant A retrieves only tenant A authorized documents', async () => {
  const adapter = createPageIndexAdapter({
    resolveDocIds: async () => ['a-doc-1', 'a-doc-2'],
    retrieveDocuments: async () => [item('a-doc-1', 'tenant-a')],
  });

  const result = await adapter.retrieve({
    tenantId: 'tenant-a',
    envelope: envelope('tenant-a'),
  });

  assert.deepEqual(result.doc_ids, ['a-doc-1', 'a-doc-2']);
  assert.deepEqual(result.items.map((entry) => entry.id), ['a-doc-1']);
  assert.ok(result.items.every((entry) => entry.metadata.tenant_scope === 'tenant-a'));
});

test('84-03 isolation matrix: cross-tenant doc injection attempts are denied before successful result return', async () => {
  const adapter = createPageIndexAdapter({
    resolveDocIds: async () => ['a-doc-1'],
    retrieveDocuments: async () => [item('b-doc-9', 'tenant-b')],
  });

  await assert.rejects(
    () => adapter.retrieve({ tenantId: 'tenant-a', envelope: envelope('tenant-a') }),
    (error) => error && error.code === 'E_PAGEINDEX_DOC_SCOPE_VIOLATION'
  );
});

test('84-03 isolation matrix: missing tenant scope fails closed and does not execute provider query', async () => {
  let providerCalls = 0;

  const adapter = createPageIndexAdapter({
    resolveDocIds: async () => ['a-doc-1'],
    retrieveDocuments: async () => {
      providerCalls += 1;
      return [item('a-doc-1', 'tenant-a')];
    },
  });

  await assert.rejects(
    () => adapter.retrieve({ tenantId: '', envelope: envelope('tenant-a') }),
    (error) => error && error.code === 'E_PAGEINDEX_TENANT_REQUIRED'
  );

  await assert.rejects(
    () => adapter.retrieve({ tenantId: 'tenant-a', envelope: envelope('tenant-b') }),
    (error) => error && error.code === 'E_PAGEINDEX_TENANT_SCOPE_MISMATCH'
  );

  assert.equal(providerCalls, 0);
});

test('84-03 isolation matrix: mixed allow-list contamination is rejected and logged as invariant breach', async () => {
  const breaches = [];

  const adapter = createPageIndexAdapter({
    resolveDocIds: async () => ['a-doc-1', 'a-doc-2'],
    retrieveDocuments: async () => [item('a-doc-1', 'tenant-a'), item('b-doc-2', 'tenant-b')],
    onInvariantBreach: (payload) => breaches.push(payload),
  });

  await assert.rejects(
    () => adapter.retrieve({ tenantId: 'tenant-a', envelope: envelope('tenant-a') }),
    (error) => error && error.code === 'E_PAGEINDEX_DOC_SCOPE_VIOLATION'
  );

  assert.equal(breaches.length, 1);
  assert.equal(breaches[0].code, 'E_PAGEINDEX_DOC_SCOPE_VIOLATION');
  assert.deepEqual(breaches[0].offending_ids, ['b-doc-2']);
});
