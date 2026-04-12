const test = require('node:test');
const assert = require('node:assert/strict');

const { createIngestRouter } = require('../../onboarding/backend/vault/ingest-router.cjs');
const { createReindexQueue } = require('../../onboarding/backend/pageindex/reindex-queue.cjs');

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

test('85-03 accepted ingest event enqueues one deterministic re-index job id', async () => {
  const dispatched = [];
  const queue = createReindexQueue({
    dispatch: async (job) => {
      dispatched.push(job);
      return { ok: true };
    },
  });

  const router = createIngestRouter({
    appendAudit: async () => ({ ok: true }),
    applyIngest: async () => ({ outcome: 'applied', revision: { content_hash: 'hash-a' } }),
    enqueueReindex: async ({ event, idempotencyKey }) => queue.enqueue({
      tenantId: event.tenant_id,
      docId: event.doc_id,
      idempotencyKey,
      reason: event.event_type,
      observedAt: event.observed_at,
    }),
    indexArtifact: async () => ({ ok: true }),
  });

  const first = await router.route({ event: buildEvent() });
  const second = await router.route({ event: buildEvent() });

  await queue.drain();

  assert.equal(first.indexed.queued, true);
  assert.equal(first.indexed.job.id, second.indexed.job.id);
  assert.equal(dispatched.length, 1);
});

test('85-03 transient failures retry with bounded exponential backoff', async () => {
  const delays = [];
  let attempts = 0;

  const queue = createReindexQueue({
    maxAttempts: 3,
    baseBackoffMs: 50,
    jitterRatio: 0,
    sleep: async (ms) => {
      delays.push(ms);
    },
    dispatch: async () => {
      attempts += 1;
      if (attempts < 3) {
        throw Object.assign(new Error('temporary failure'), { code: 'E_PAGEINDEX_TEMP' });
      }
      return { ok: true };
    },
  });

  await queue.enqueue({
    tenantId: 'tenant-alpha',
    docId: 'paid-media/doc.md',
    idempotencyKey: 'tenant-alpha:paid-media/doc.md:hash-a',
    reason: 'change',
    observedAt: '2026-04-12T10:00:00.000Z',
  });

  const result = await queue.drain();

  assert.equal(result.completed, 1);
  assert.equal(result.deadLettered, 0);
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [50, 100]);
});

test('85-03 duplicate enqueue attempts for same idempotency key are suppressed', async () => {
  let attempts = 0;

  const queue = createReindexQueue({
    dispatch: async () => {
      attempts += 1;
      return { ok: true };
    },
  });

  const first = await queue.enqueue({
    tenantId: 'tenant-alpha',
    docId: 'paid-media/doc.md',
    idempotencyKey: 'tenant-alpha:paid-media/doc.md:hash-a',
    reason: 'change',
    observedAt: '2026-04-12T10:00:00.000Z',
  });

  const second = await queue.enqueue({
    tenantId: 'tenant-alpha',
    docId: 'paid-media/doc.md',
    idempotencyKey: 'tenant-alpha:paid-media/doc.md:hash-a',
    reason: 'change',
    observedAt: '2026-04-12T10:00:00.000Z',
  });

  await queue.drain();

  assert.equal(first.queued, true);
  assert.equal(second.queued, false);
  assert.equal(second.reason, 'duplicate_active');
  assert.equal(attempts, 1);
});
