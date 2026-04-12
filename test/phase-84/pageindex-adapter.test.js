const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPageIndexAdapter,
} = require('../../onboarding/backend/pageindex/pageindex-client.cjs');

function createEnvelope(overrides = {}) {
  return {
    mode: 'reason',
    discipline: 'Paid Media',
    audience: 'operators',
    filters: {
      pain_point_tags: ['high_cpr'],
      business_model: ['B2B'],
      funnel_stage: ['awareness'],
      content_type: ['playbook'],
      tenant_scope: 'tenant-a',
    },
    provenance_required: true,
    ...overrides,
  };
}

test('84-02 adapter returns normalized retrieval items with provenance metadata', async () => {
  const adapter = createPageIndexAdapter({
    resolveDocIds: async () => ['chunk-1'],
    retrieveDocuments: async () => ([
      {
        id: 'chunk-1',
        text: 'Operator literacy excerpt',
        score: 0.91,
        metadata: { discipline: 'Paid Media' },
        provenance: {
          source: { system: 'pageindex', kind: 'retrieval' },
          timestamp: '2026-04-12T00:00:00.000Z',
          actor: { id: 'tenant-a', type: 'system' },
          lineage: ['pageindex', 'retrieval'],
          joins: { audience: ['operators'], pain_point_tags: ['high_cpr'] },
        },
      },
    ]),
  });

  const result = await adapter.retrieve({
    tenantId: 'tenant-a',
    envelope: createEnvelope(),
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, 'chunk-1');
  assert.equal(result.items[0].provenance.source.system, 'pageindex');
  assert.deepEqual(result.items[0].provenance.joins.audience, ['operators']);
});

test('84-02 adapter supports discipline and audience scoped retrieval in one envelope', async () => {
  const observed = [];

  const adapter = createPageIndexAdapter({
    resolveDocIds: async (payload) => {
      observed.push(payload.envelope);
      return ['chunk-1'];
    },
    retrieveDocuments: async () => ([]),
  });

  await adapter.retrieve({
    tenantId: 'tenant-a',
    envelope: createEnvelope({ discipline: 'Content SEO', audience: null }),
  });

  await adapter.retrieve({
    tenantId: 'tenant-a',
    envelope: createEnvelope({ discipline: null, audience: 'founders' }),
  });

  assert.equal(observed[0].discipline, 'Content SEO');
  assert.equal(observed[0].audience, null);
  assert.equal(observed[1].discipline, null);
  assert.equal(observed[1].audience, 'founders');
});

test('84-02 adapter cache key is deterministic from tenant and canonical envelope', async () => {
  const adapter = createPageIndexAdapter({
    resolveDocIds: async () => ['chunk-1'],
    retrieveDocuments: async () => ([]),
  });

  const first = await adapter.retrieve({
    tenantId: 'tenant-a',
    envelope: createEnvelope({
      filters: {
        pain_point_tags: ['beta', 'alpha'],
        business_model: ['B2B'],
        funnel_stage: ['awareness'],
        content_type: ['playbook'],
        tenant_scope: 'tenant-a',
      },
    }),
  });

  const second = await adapter.retrieve({
    tenantId: 'tenant-a',
    envelope: createEnvelope({
      filters: {
        pain_point_tags: ['alpha', 'beta'],
        business_model: ['B2B'],
        funnel_stage: ['awareness'],
        content_type: ['playbook'],
        tenant_scope: 'tenant-a',
      },
    }),
  });

  assert.equal(first.cache_key, second.cache_key);
});
