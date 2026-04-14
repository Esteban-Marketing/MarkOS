const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildMarkosKnowledgeUri,
  parseMarkosKnowledgeUri,
} = require('../../onboarding/backend/research/markos-knowledge-uri.cjs');

test('92-01 URI contract is tenant-bound, portable, and section-aware', () => {
  const uri = buildMarkosKnowledgeUri({
    tenantId: 'tenant-alpha-001',
    kind: 'mir',
    artifactId: 'mir-123',
    section: 'AUDIENCES',
  });

  assert.equal(uri, 'markos://tenant/tenant-alpha-001/mir/mir-123#section=AUDIENCES');

  const parsed = parseMarkosKnowledgeUri(uri, {
    claims: { tenantId: 'tenant-alpha-001' },
  });

  assert.deepEqual(parsed, {
    tenant_id: 'tenant-alpha-001',
    kind: 'mir',
    artifact_id: 'mir-123',
    section: 'AUDIENCES',
    uri,
  });
});

test('92-01 URI parser rejects raw paths and tenant mismatches', () => {
  assert.throws(
    () => parseMarkosKnowledgeUri('C:/secret/file.md', { claims: { tenantId: 'tenant-alpha-001' } }),
    (error) => error && error.code === 'E_MARKOS_URI_RAW_PATH_FORBIDDEN'
  );

  assert.throws(
    () => parseMarkosKnowledgeUri('markos://tenant/tenant-beta-002/msp/msp-888', {
      claims: { tenantId: 'tenant-alpha-001' },
    }),
    (error) => error && error.code === 'E_SCOPE_TENANT_MISMATCH'
  );
});
