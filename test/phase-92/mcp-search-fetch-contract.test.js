const test = require('node:test');
const assert = require('node:assert/strict');

const {
  searchApprovedKnowledge,
  fetchApprovedArtifact,
} = require('../../onboarding/backend/research/company-knowledge-service.cjs');

function buildFixtures() {
  return {
    records: [
      {
        tenant_id: 'tenant-alpha-001',
        kind: 'literacy',
        artifact_id: 'lit-001',
        title: 'RevOps literacy brief',
        content: 'RevOps leaders need proof of pipeline health, clean attribution, and a faster path from signal to action.',
        source_ref: 'Literacy / RevOps / Canonical',
        updated_at: '2026-04-14T00:00:00.000Z',
        approval_status: 'approved',
        score: 0.91,
        confidence: 0.88,
        implication: 'Lead with diagnostic clarity and operator trust.',
      },
      {
        tenant_id: 'tenant-alpha-001',
        kind: 'mir',
        artifact_id: 'mir-001',
        title: 'Operator pain synthesis',
        content: 'Operators are tired of brittle workflows and want systems that preserve evidence, explain tradeoffs, and reduce manual QA work.',
        source_ref: 'MIR / Audience / Operators',
        updated_at: '2026-04-13T00:00:00.000Z',
        approval_status: 'approved',
        score: 0.83,
        confidence: 0.8,
        implication: 'Position MarkOS as a safer operating layer.',
      },
    ],
  };
}

test('92-01 search is snippet-first and fetch is explicit-only', async () => {
  const claims = { tenantId: 'tenant-alpha-001' };
  const search = await searchApprovedKnowledge({
    query: 'operator trust',
    scopes: ['literacy', 'mir'],
    claims,
    topK: 2,
    fixtures: buildFixtures(),
  });

  assert.equal(search.operation, 'search_markos_knowledge');
  assert.equal(search.results.length, 2);
  assert.ok(search.results.every((entry) => typeof entry.snippet === 'string' && entry.snippet.length > 0));
  assert.ok(search.results.every((entry) => !Object.hasOwn(entry, 'content')));
  assert.ok(search.results.every((entry) => entry.artifact_uri.startsWith('markos://tenant/tenant-alpha-001/')));

  const fetched = await fetchApprovedArtifact({
    uri: search.results[0].artifact_uri,
    claims,
    fixtures: buildFixtures(),
  });

  assert.equal(fetched.operation, 'fetch_markos_artifact');
  assert.equal(typeof fetched.artifact.content, 'string');
  assert.ok(fetched.artifact.content.includes('Operators') || fetched.artifact.content.includes('RevOps'));
  assert.equal(fetched.artifact.artifact_uri, search.results[0].artifact_uri);
});
