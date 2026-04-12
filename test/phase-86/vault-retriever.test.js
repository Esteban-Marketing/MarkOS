'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createVaultRetriever } = require('../../onboarding/backend/vault/vault-retriever.cjs');

function makeArtifact(overrides = {}) {
  return {
    tenant_id: 'tenant-alpha',
    doc_id: 'paid-media/doc-01',
    content_hash: 'sha256-abc123',
    content: 'raw paid media content',
    observed_at: new Date('2025-01-15T10:00:00Z'),
    appended_at: new Date('2025-01-15T09:00:00Z'),
    discipline: 'Paid_Media',
    audience: ['ICP:smb'],
    audience_tags: ['ICP:smb', 'SEGMENT:mid-market'],
    pain_point_tags: ['PAIN:budget-constraints'],
    business_model: 'B2B-SaaS',
    provenance: {
      source: { system: 'hubspot', kind: 'contact' },
      actor: { id: 'user-1', type: 'human' },
      timestamp: new Date('2025-01-15T10:00:00Z'),
    },
    idempotency_key: 'ingest:tenant-alpha:doc-01:hubspot:sha256-abc123',
    ...overrides,
  };
}

test('createVaultRetriever throws if getArtifacts is not a function', async (t) => {
  assert.throws(
    () => createVaultRetriever({}),
    { code: 'E_VAULT_RETRIEVER_ARTIFACTS_REQUIRED' }
  );

  assert.throws(
    () => createVaultRetriever({ getArtifacts: 'not-a-function' }),
    { code: 'E_VAULT_RETRIEVER_ARTIFACTS_REQUIRED' }
  );
});

test('retrieveReason returns packs with mode=reason and raw_content', async (t) => {
  const artifact = makeArtifact();
  const retriever = createVaultRetriever({
    getArtifacts: async () => [artifact],
  });

  const result = await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  assert.ok(Array.isArray(result));
  assert.equal(result.length, 1);
  assert.equal(result[0].mode, 'reason');
  assert.ok('raw_content' in result[0]);
  assert.equal(result[0].raw_content, 'raw paid media content');
});

test('retrieveApply returns packs with mode=apply and template_context', async (t) => {
  const artifact = makeArtifact();
  const retriever = createVaultRetriever({
    getArtifacts: async () => [artifact],
  });

  const result = await retriever.retrieveApply({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  assert.ok(Array.isArray(result));
  assert.equal(result.length, 1);
  assert.equal(result[0].mode, 'apply');
  assert.ok('template_context' in result[0]);
  assert.ok(!('raw_content' in result[0]));
});

test('retrieveIterate returns packs with mode=iterate and verification_hook', async (t) => {
  const artifact = makeArtifact();
  const retriever = createVaultRetriever({
    getArtifacts: async () => [artifact],
  });

  const result = await retriever.retrieveIterate({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  assert.ok(Array.isArray(result));
  assert.equal(result.length, 1);
  assert.equal(result[0].mode, 'iterate');
  assert.ok('verification_hook' in result[0]);
  assert.ok(!('raw_content' in result[0]));
});

test('cross-tenant artifacts never returned', async (t) => {
  const alpha = makeArtifact({ tenant_id: 'tenant-alpha' });
  const beta = makeArtifact({ tenant_id: 'tenant-beta', doc_id: 'beta-doc' });

  const retriever = createVaultRetriever({
    getArtifacts: async () => [alpha, beta],
  });

  const result = await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].artifact_id, 'paid-media/doc-01');
});

test('invalid role rejected before artifact data is touched', async (t) => {
  const retriever = createVaultRetriever({
    getArtifacts: async () => {
      throw new Error('should not reach artifact layer');
    },
  });

  await assert.rejects(
    () => retriever.retrieveReason({
      tenantId: 'tenant-alpha',
      claims: { tenantId: 'tenant-alpha', role: 'attacker' },
      filter: {},
    }),
    { code: 'E_SCOPE_ROLE_DENIED' }
  );
});

test('discipline filter applied correctly', async (t) => {
  const paid = makeArtifact({ discipline: 'Paid_Media' });
  const email = makeArtifact({ discipline: 'Email', doc_id: 'email-doc' });

  const retriever = createVaultRetriever({
    getArtifacts: async () => [paid, email],
  });

  const result = await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: { discipline: 'Paid_Media' },
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].discipline, 'Paid_Media');
});

test('audience_tags AND filter applied', async (t) => {
  const match = makeArtifact({ audience_tags: ['ICP:smb', 'SEGMENT:mid-market'] });
  const noMatch = makeArtifact({
    audience_tags: ['ICP:smb'],
    doc_id: 'no-match-doc',
  });

  const retriever = createVaultRetriever({
    getArtifacts: async () => [match, noMatch],
  });

  const result = await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: { audience_tags: ['ICP:smb', 'SEGMENT:mid-market'] },
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].artifact_id, 'paid-media/doc-01');
});

test('empty store returns empty array', async (t) => {
  const retriever = createVaultRetriever({
    getArtifacts: async () => [],
  });

  const reason = await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  const apply = await retriever.retrieveApply({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  const iterate = await retriever.retrieveIterate({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  assert.equal(reason.length, 0);
  assert.equal(apply.length, 0);
  assert.equal(iterate.length, 0);
});

test('all three methods share tenant isolation', async (t) => {
  const alpha = makeArtifact({ tenant_id: 'tenant-alpha' });
  const beta = makeArtifact({ tenant_id: 'tenant-beta', doc_id: 'beta-doc' });

  const retriever = createVaultRetriever({
    getArtifacts: async () => [alpha, beta],
  });

  const reasonResult = await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  const applyResult = await retriever.retrieveApply({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  const iterateResult = await retriever.retrieveIterate({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'operator' },
    filter: {},
  });

  assert.equal(reasonResult.length, 1);
  assert.equal(applyResult.length, 1);
  assert.equal(iterateResult.length, 1);
  assert.equal(reasonResult[0].artifact_id, 'paid-media/doc-01');
});
