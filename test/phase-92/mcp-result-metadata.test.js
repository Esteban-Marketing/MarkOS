const test = require('node:test');
const assert = require('node:assert/strict');

const { searchApprovedKnowledge } = require('../../onboarding/backend/research/company-knowledge-service.cjs');

test('92-01 search results include provenance-rich metadata', async () => {
  const response = await searchApprovedKnowledge({
    query: 'pipeline health',
    scopes: ['literacy'],
    claims: { tenantId: 'tenant-alpha-001' },
    fixtures: {
      records: [
        {
          tenant_id: 'tenant-alpha-001',
          kind: 'literacy',
          artifact_id: 'lit-777',
          title: 'Pipeline literacy',
          content: 'Pipeline health depends on trustworthy reporting and evidence-backed workflow changes for every funnel stage.',
          source_ref: 'Literacy / Pipeline / Canonical',
          updated_at: '2026-04-12T00:00:00.000Z',
          approval_status: 'approved',
          score: 0.94,
          confidence: 0.9,
          implication: 'Highlight control and traceability in the message.',
        },
      ],
    },
  });

  const result = response.results[0];
  assert.equal(result.artifact_kind, 'literacy');
  assert.equal(result.authority, 'approved_internal');
  assert.equal(result.title, 'Pipeline literacy');
  assert.equal(result.source_ref, 'Literacy / Pipeline / Canonical');
  assert.equal(result.citation, 'Literacy / Pipeline / Canonical');
  assert.equal(result.updated_at, '2026-04-12T00:00:00.000Z');
  assert.equal(result.freshness, '2026-04-12T00:00:00.000Z');
  assert.equal(result.confidence, 0.9);
  assert.equal(result.implication, 'Highlight control and traceability in the message.');
  assert.ok(result.resource_link && result.resource_link.uri === result.artifact_uri);
});
