'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createSyncService } = require('../../onboarding/backend/vault/sync-service.cjs');
const { createVaultRetriever } = require('../../onboarding/backend/vault/vault-retriever.cjs');
const { createLineageLogger } = require('../../onboarding/backend/vault/lineage-log.cjs');

function makeArtifact(overrides = {}) {
  return {
    tenant_id: 'tenant-alpha',
    artifact_id: 'artifact-001',
    doc_id: 'doc-001',
    content_hash: 'hash-001',
    content: 'sample content',
    discipline: 'Paid_Media',
    audience_tags: ['ICP:smb'],
    provenance: { source: { system: 'obsidian' } },
    ...overrides,
  };
}

test('operator sync event creates lineage entry with view=operator', async () => {
  const events = [];
  const lineage = createLineageLogger({
    append: async (entry) => {
      events.push(entry);
      return entry;
    },
  });

  const service = createSyncService({
    tenantId: 'tenant-alpha',
    vaultRoot: '/vault',
    ingestEvent: async () => ({ outcome: 'ok' }),
    lineage,
    now: () => '2026-04-12T10:00:00.000Z',
  });

  await service.handleChange('/vault/Paid_Media/doc.md', {
    metadata: {
      artifact_id: 'artifact-001',
      action: 'sync_change',
      actor_id: 'operator-1',
      discipline: 'Paid_Media',
      audience: ['ICP:smb'],
      business_model: 'B2B-SaaS',
      pain_point_tags: ['PAIN:budget-constraints'],
    },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].view, 'operator');
  assert.equal(events[0].tenant_id, 'tenant-alpha');
  assert.equal(events[0].artifact_id, 'artifact-001');
  assert.equal(events[0].action, 'sync_change');
});

test('agent retrieve reason/apply/iterate create lineage entries with view=agent and mode', async () => {
  const events = [];
  const lineage = createLineageLogger({
    append: async (entry) => {
      events.push(entry);
      return entry;
    },
  });

  const retriever = createVaultRetriever({
    getArtifacts: async () => [makeArtifact()],
    lineage,
  });

  await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'agent' },
    filter: {},
  });
  await retriever.retrieveApply({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'agent' },
    filter: {},
  });
  await retriever.retrieveIterate({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'agent' },
    filter: {},
  });

  assert.equal(events.length, 3);
  assert.deepEqual(
    events.map((entry) => ({ view: entry.view, mode: entry.mode })),
    [
      { view: 'agent', mode: 'reason' },
      { view: 'agent', mode: 'apply' },
      { view: 'agent', mode: 'iterate' },
    ]
  );
});

test('all entries for same artifact share tenant_id and artifact_id linkage', async () => {
  const events = [];
  const lineage = createLineageLogger({
    append: async (entry) => {
      events.push(entry);
      return entry;
    },
  });

  const retriever = createVaultRetriever({
    getArtifacts: async () => [makeArtifact()],
    lineage,
  });

  await retriever.retrieveReason({
    tenantId: 'tenant-alpha',
    claims: { tenantId: 'tenant-alpha', role: 'agent' },
    filter: {},
  });

  assert.equal(events[0].tenant_id, 'tenant-alpha');
  assert.equal(events[0].artifact_id, 'artifact-001');
});

test('missing identity keys fail with deterministic error code', async () => {
  const lineage = createLineageLogger({
    append: async (entry) => entry,
  });

  await assert.rejects(
    () => lineage.appendLineageEvent({
      view: 'agent',
      mode: 'reason',
    }),
    { code: 'E_LINEAGE_IDENTITY_REQUIRED' }
  );
});
