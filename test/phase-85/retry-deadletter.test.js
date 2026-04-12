const test = require('node:test');
const assert = require('node:assert/strict');

const { createReindexQueue } = require('../../onboarding/backend/pageindex/reindex-queue.cjs');
const { createReindexDeadLetterStore } = require('../../onboarding/backend/pageindex/reindex-dead-letter.cjs');
const { createReindexDrain } = require('../../scripts/phase-85/reindex-drain.cjs');

test('85-03 max-attempt failures route to dead-letter with replay metadata', async () => {
  const deadLetter = createReindexDeadLetterStore();
  let attempts = 0;

  const queue = createReindexQueue({
    maxAttempts: 3,
    baseBackoffMs: 10,
    jitterRatio: 0,
    sleep: async () => {},
    deadLetter,
    dispatch: async () => {
      attempts += 1;
      throw Object.assign(new Error('downstream outage'), { code: 'E_PAGEINDEX_DOWN' });
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
  const entries = deadLetter.list();

  assert.equal(result.deadLettered, 1);
  assert.equal(attempts, 3);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].attempt_count, 3);
  assert.equal(entries[0].replay.status, 'pending');
  assert.equal(entries[0].failure.code, 'E_PAGEINDEX_DOWN');
});

test('85-03 replay tool re-queues dead-letter entries deterministically and idempotently', async () => {
  const deadLetter = createReindexDeadLetterStore();
  let dispatchCalls = 0;

  const queue = createReindexQueue({
    maxAttempts: 1,
    baseBackoffMs: 10,
    jitterRatio: 0,
    sleep: async () => {},
    deadLetter,
    dispatch: async () => {
      dispatchCalls += 1;
      if (dispatchCalls === 1) {
        throw Object.assign(new Error('first run fails'), { code: 'E_TEMP_FAIL' });
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

  await queue.drain();

  const drain = createReindexDrain({ queue, deadLetter });
  const first = await drain.replay({ limit: 10 });
  const second = await drain.replay({ limit: 10 });

  await queue.drain();

  assert.equal(first.replayed, 1);
  assert.equal(first.duplicatesSkipped, 0);
  assert.equal(second.replayed, 0);
  assert.equal(second.duplicatesSkipped, 1);

  const entries = deadLetter.list();
  assert.equal(entries[0].replay.status, 'completed');
  assert.equal(entries[0].replay.attempt_count, 1);
});
