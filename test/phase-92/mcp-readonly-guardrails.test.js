const test = require('node:test');
const assert = require('node:assert/strict');

const { createCompanyKnowledgeAdapter } = require('../../onboarding/backend/mcp/company-knowledge-adapter.cjs');

test('92-02 adapter blocks unknown or write-like tool expansion', async () => {
  const adapter = createCompanyKnowledgeAdapter({
    service: {
      async searchApprovedKnowledge() {
        return { operation: 'search_markos_knowledge', results: [], warnings: [] };
      },
      async fetchApprovedArtifact() {
        return { operation: 'fetch_markos_artifact', artifact: null, warnings: [] };
      },
    },
  });

  await assert.rejects(
    () => adapter.invokeTool({
      name: 'approve_markos_artifact',
      arguments: { uri: 'markos://tenant/tenant-alpha-001/mir/mir-1' },
      claims: { tenantId: 'tenant-alpha-001' },
    }),
    (error) => error && error.code === 'E_MARKOS_MCP_TOOL_UNKNOWN'
  );

  assert.equal(adapter.listTools().some((tool) => /approve|write|patch|browse/i.test(tool.name)), false);
});
