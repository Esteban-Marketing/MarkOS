const test = require('node:test');
const assert = require('node:assert/strict');

const {
  searchApprovedKnowledge,
  fetchApprovedArtifact,
} = require('../../onboarding/backend/research/company-knowledge-service.cjs');

test('92-01 cross-tenant requests fail closed before results are returned', async () => {
  await assert.rejects(
    () => searchApprovedKnowledge({
      query: 'anything',
      scopes: ['mir'],
      claims: { tenantId: 'tenant-alpha-001' },
      filters: { tenant_scope: 'tenant-beta-002' },
      fixtures: { records: [] },
    }),
    (error) => error?.code === 'E_SCOPE_TENANT_MISMATCH'
  );
});

test('92-01 draft and write-like requests are rejected deterministically', async () => {
  await assert.rejects(
    () => searchApprovedKnowledge({
      query: 'approve this',
      scopes: ['mir'],
      claims: { tenantId: 'tenant-alpha-001' },
      operation: 'approve_markos_artifact',
      fixtures: { records: [] },
    }),
    (error) => error?.code === 'E_KNOWLEDGE_WRITE_BLOCKED'
  );

  await assert.rejects(
    () => fetchApprovedArtifact({
      uri: 'markos://tenant/tenant-alpha-001/mir/mir-draft',
      claims: { tenantId: 'tenant-alpha-001' },
      fixtures: {
        records: [
          {
            tenant_id: 'tenant-alpha-001',
            kind: 'mir',
            artifact_id: 'mir-draft',
            title: 'Draft MIR',
            content: 'not approved yet',
            approval_status: 'draft',
          },
        ],
      },
    }),
    (error) => error?.code === 'E_KNOWLEDGE_APPROVAL_REQUIRED'
  );
});
