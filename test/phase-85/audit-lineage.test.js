const test = require('node:test');
const assert = require('node:assert/strict');

const { createIngestRouter } = require('../../onboarding/backend/vault/ingest-router.cjs');
const { createAuditLog } = require('../../onboarding/backend/vault/audit-log.cjs');

function buildEvent(overrides = {}) {
  return {
    tenant_id: 'tenant-alpha',
    doc_id: 'paid-media/doc.md',
    event_type: 'change',
    source_path: '/vault/Paid_Media/doc.md',
    observed_at: '2026-04-12T10:00:00.000Z',
    metadata: {
      discipline: 'Paid_Media',
      audience: ['ICP:SMB'],
      business_model: 'B2B',
      pain_point_tags: ['high_cac'],
    },
    actor: {
      id: 'operator-1',
      type: 'human',
    },
    source: 'obsidian-watch',
    content_hash: 'hash-a',
    ...overrides,
  };
}

test('85-02 accepted events append immutable lineage records with identity and actor/source', async () => {
  const entries = [];
  const audit = createAuditLog({
    append: async (entry) => {
      entries.push(entry);
      return { ok: true, id: String(entries.length) };
    },
  });

  const router = createIngestRouter({
    appendAudit: (entry) => audit.append(entry),
    applyIngest: async () => ({ outcome: 'applied', revision: { content_hash: 'hash-a' } }),
    indexArtifact: async () => ({ ok: true }),
  });

  await router.route({ event: buildEvent() });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].doc_id, 'paid-media/doc.md');
  assert.equal(entries[0].actor.id, 'operator-1');
  assert.equal(entries[0].source, 'obsidian-watch');
});

test('85-02 duplicate idempotency key does not create repeated audit rows', async () => {
  const entries = [];
  const audit = createAuditLog({
    append: async (entry) => {
      entries.push(entry);
      return { ok: true, id: String(entries.length) };
    },
  });

  const router = createIngestRouter({
    appendAudit: (entry) => audit.append(entry),
    applyIngest: async () => ({ outcome: 'noop_duplicate', revision: null }),
    indexArtifact: async () => ({ ok: true }),
  });

  await router.route({ event: buildEvent() });
  await router.route({ event: buildEvent() });

  assert.equal(entries.length, 1);
});

test('85-02 audit append occurs before any re-index enqueue', async () => {
  const order = [];

  const audit = createAuditLog({
    append: async (entry) => {
      order.push(`audit:${entry.doc_id}`);
      return { ok: true, id: 'audit-1' };
    },
  });

  const router = createIngestRouter({
    appendAudit: (entry) => audit.append(entry),
    applyIngest: async () => ({ outcome: 'applied', revision: { content_hash: 'hash-a' } }),
    indexArtifact: async () => {
      order.push('index');
      return { ok: true };
    },
  });

  await router.route({ event: buildEvent() });

  assert.deepEqual(order, ['audit:paid-media/doc.md', 'index']);
});

test('85-02 lineage includes supersedes link when conflict replaces older revision', async () => {
  const entries = [];
  const audit = createAuditLog({
    append: async (entry) => {
      entries.push(entry);
      return { ok: true, id: String(entries.length) };
    },
  });

  const router = createIngestRouter({
    appendAudit: (entry) => audit.append(entry),
    applyIngest: async () => ({
      outcome: 'superseded',
      revision: {
        content_hash: 'hash-new',
        supersedes_content_hash: 'hash-old',
      },
    }),
    indexArtifact: async () => ({ ok: true }),
  });

  await router.route({ event: buildEvent({ content_hash: 'hash-new' }) });

  assert.equal(entries[0].supersedes_content_hash, 'hash-old');
});

test('85-02 re-index dispatch is skipped when audit append fails', async () => {
  let indexCalls = 0;

  const audit = createAuditLog({
    append: async () => {
      throw Object.assign(new Error('audit down'), { code: 'E_AUDIT_APPEND_FAILED' });
    },
  });

  const router = createIngestRouter({
    appendAudit: (entry) => audit.append(entry),
    applyIngest: async () => ({ outcome: 'applied', revision: { content_hash: 'hash-a' } }),
    indexArtifact: async () => {
      indexCalls += 1;
      return { ok: true };
    },
  });

  await assert.rejects(() => router.route({ event: buildEvent() }), (error) => error && error.code === 'E_AUDIT_APPEND_FAILED');
  assert.equal(indexCalls, 0);
});
