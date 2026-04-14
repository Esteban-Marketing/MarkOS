const test = require('node:test');
const assert = require('node:assert/strict');

const vectorStore = require('../../onboarding/backend/vector-store-client.cjs');
const { normalizeRetrievalEnvelope } = require('../../onboarding/backend/pageindex/retrieval-envelope.cjs');

test('96-03 retrieval envelope accepts additive neuro-aware filter families', () => {
  const envelope = normalizeRetrievalEnvelope({
    mode: 'reason',
    discipline: 'Paid Media',
    audience: 'ICP:revops_leader',
    filters: {
      pain_point_tags: ['high_cac'],
      business_model: ['B2B'],
      icp_segment_tags: ['revops_leader'],
      neuro_trigger_tags: ['B01'],
      naturality_tags: ['human'],
      tenant_scope: 'tenant-123',
    },
    provenance_required: true,
  });

  assert.deepEqual(envelope.filters.icp_segment_tags, ['revops_leader']);
  assert.deepEqual(envelope.filters.neuro_trigger_tags, ['B01']);
  assert.deepEqual(envelope.filters.naturality_tags, ['human']);
});

test('96-03 literacy filter adds optional OR clauses for new tag families', () => {
  const filter = vectorStore.buildLiteracyFilter({
    pain_point_tags: ['high_cac'],
    icp_segment_tags: ['revops_leader'],
    neuro_trigger_tags: ['B01', 'B03'],
  });

  assert.match(filter, /pain_point_tags CONTAINS 'high_cac'/);
  assert.match(filter, /icp_segment_tags CONTAINS 'revops_leader'/);
  assert.match(filter, /neuro_trigger_tags CONTAINS 'B01'/);
  assert.match(filter, /neuro_trigger_tags CONTAINS 'B03'/);
});
