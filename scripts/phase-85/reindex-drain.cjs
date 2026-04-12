'use strict';

function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 25;
  }
  return Math.floor(parsed);
}

function createReindexDrain(options = {}) {
  const queue = options.queue;
  const deadLetter = options.deadLetter;

  if (!queue || typeof queue.enqueue !== 'function') {
    throw new Error('createReindexDrain requires queue.enqueue.');
  }

  if (!deadLetter || typeof deadLetter.list !== 'function') {
    throw new Error('createReindexDrain requires deadLetter.list.');
  }

  async function replay({ limit } = {}) {
    const normalizedLimit = normalizeLimit(limit);
    const entries = deadLetter.list({ replayStatus: 'pending', limit: normalizedLimit });

    let replayed = 0;
    let duplicatesSkipped = 0;

    for (const entry of entries) {
      const result = await queue.enqueue({
        tenantId: entry.tenant_id,
        docId: entry.doc_id,
        idempotencyKey: entry.idempotency_key,
        reason: `replay:${entry.reason}`,
        observedAt: entry.observed_at,
      });

      if (result && result.queued) {
        replayed += 1;
        if (typeof deadLetter.markReplayCompleted === 'function') {
          deadLetter.markReplayCompleted(entry.id, { requeueJobId: result.job && result.job.id });
        }
      } else {
        duplicatesSkipped += 1;
        if (typeof deadLetter.markReplayDuplicate === 'function') {
          deadLetter.markReplayDuplicate(entry.id);
        }
      }
    }

    if (entries.length === 0) {
      const alreadyCompleted = deadLetter.list({ replayStatus: 'completed', limit: normalizedLimit });
      duplicatesSkipped += alreadyCompleted.length;
    }

    return {
      replayed,
      duplicatesSkipped,
    };
  }

  async function drain({ replayFirst = false, limit } = {}) {
    const replayResult = replayFirst ? await replay({ limit }) : { replayed: 0, duplicatesSkipped: 0 };
    const queueResult = await queue.drain();

    return {
      replay: replayResult,
      queue: queueResult,
    };
  }

  return {
    replay,
    drain,
  };
}

async function runCli() {
  process.stdout.write('reindex-drain utility is intended to be imported with queue/dead-letter dependencies.\n');
  process.exitCode = 1;
}

if (require.main === module) {
  runCli().catch((error) => {
    process.stderr.write(`${error && error.message ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  createReindexDrain,
};
