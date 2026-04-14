const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createCompanyKnowledgeAdapter,
  PUBLIC_TOOL_NAMES,
} = require('../../onboarding/backend/mcp/company-knowledge-adapter.cjs');

test('92-02 adapter exposes only the minimal public surface', async () => {
  const adapter = createCompanyKnowledgeAdapter({
    service: {
      async searchApprovedKnowledge(args) {
        return {
          operation: 'search_markos_knowledge',
          query: args.query,
          results: [
            {
              artifact_uri: 'markos://tenant/tenant-alpha-001/literacy/lit-1',
              artifact_kind: 'literacy',
              title: 'Canonical literacy',
              snippet: 'Snippet-first preview',
              citation: 'Lit / Canonical',
              source_ref: 'Lit / Canonical',
              updated_at: '2026-04-14T00:00:00.000Z',
              freshness: '2026-04-14T00:00:00.000Z',
              authority: 'approved_internal',
              confidence: 0.91,
              implication: 'Use evidence-first framing.',
              resource_link: { uri: 'markos://tenant/tenant-alpha-001/literacy/lit-1' },
            },
          ],
          warnings: [],
        };
      },
      async fetchApprovedArtifact(args) {
        return {
          operation: 'fetch_markos_artifact',
          uri: args.uri,
          artifact: {
            artifact_uri: args.uri,
            artifact_kind: 'literacy',
            title: 'Canonical literacy',
            content: 'Full artifact body',
          },
          warnings: [],
        };
      },
    },
  });

  assert.deepEqual(PUBLIC_TOOL_NAMES, ['search_markos_knowledge', 'fetch_markos_artifact']);
  assert.deepEqual(adapter.listTools().map((tool) => tool.name), PUBLIC_TOOL_NAMES);

  const result = await adapter.invokeTool({
    name: 'search_markos_knowledge',
    arguments: {
      query: 'evidence backed messaging',
      scopes: ['literacy'],
      filters: { audience: ['revops_leader'] },
    },
    claims: { tenantId: 'tenant-alpha-001' },
    clientSurface: 'copilot',
  });

  assert.ok(Array.isArray(result.content));
  assert.equal(result.structuredContent.operation, 'search_markos_knowledge');
  assert.equal(result.structuredContent.results[0].resource_link.uri, 'markos://tenant/tenant-alpha-001/literacy/lit-1');
});
