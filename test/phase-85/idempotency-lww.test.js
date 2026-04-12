const test = require('node:test');
const assert = require('node:assert/strict');

const { createIngestApply } = require('../../onboarding/backend/vault/ingest-apply.cjs');
const { buildIdempotencyKey } = require('../../onboarding/backend/vault/idempotency-key.cjs');

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
    content_hash: 'hash-a',
    ...overrides,
  };
}

test('85-02 idempotency key includes tenant, doc identity, and content hash', () => {
  const event = buildEvent();
  const key = buildIdempotencyKey(event);

  assert.equal(typeof key, 'string');
  assert.equal(key.includes(event.tenant_id), true);
  assert.equal(key.includes(event.doc_id), true);
  assert.equal(key.includes(event.content_hash), true);
});

test('85-02 duplicate events short-circuit to no-op without duplicate active revision', async () => {
  const activeByDoc = new Map();
  const revisions = [];

  const apply = createIngestApply({
    getActiveRevision: async ({ docId }) => activeByDoc.get(docId) || null,
    upsertRevision: async ({ revision }) => {
      revisions.push(revision);
      activeByDoc.set(revision.doc_id, revision);
      return revision;
    },
  });

  const first = await apply.apply({ event: buildEvent() });
  const second = await apply.apply({ event: buildEvent() });

  assert.equal(first.outcome, 'applied');
  assert.equal(second.outcome, 'noop_duplicate');
  assert.equal(revisions.length, 1);
});

test('85-02 newer observed write supersedes older write and preserves lineage', async () => {
  const activeByDoc = new Map();
  const revisions = [];

  const apply = createIngestApply({
    getActiveRevision: async ({ docId }) => activeByDoc.get(docId) || null,
    upsertRevision: async ({ revision }) => {
      revisions.push(revision);
      activeByDoc.set(revision.doc_id, revision);
      return revision;
    },
  });

  await apply.apply({ event: buildEvent({ observed_at: '2026-04-12T10:00:00.000Z', content_hash: 'hash-old' }) });
  const result = await apply.apply({ event: buildEvent({ observed_at: '2026-04-12T10:00:05.000Z', content_hash: 'hash-new' }) });

  assert.equal(result.outcome, 'superseded');
  assert.equal(result.revision.supersedes_content_hash, 'hash-old');
  assert.equal(revisions.length, 2);
});

test('85-02 out-of-order arrival resolves by deterministic LWW policy', async () => {
  const activeByDoc = new Map();

  const apply = createIngestApply({
    getActiveRevision: async ({ docId }) => activeByDoc.get(docId) || null,
    upsertRevision: async ({ revision }) => {
      activeByDoc.set(revision.doc_id, revision);
      return revision;
    },
  });

  const newer = buildEvent({ observed_at: '2026-04-12T10:01:00.000Z', content_hash: 'hash-new' });
  const older = buildEvent({ observed_at: '2026-04-12T09:59:00.000Z', content_hash: 'hash-old' });

  await apply.apply({ event: newer });
  const second = await apply.apply({ event: older });

  assert.equal(second.outcome, 'noop_stale');
  const current = activeByDoc.get('paid-media/doc.md');
  assert.equal(current.content_hash, 'hash-new');
});
