'use strict';

const crypto = require('node:crypto');

const { createReindexDeadLetterStore } = require('./reindex-dead-letter.cjs');

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function buildJobId(idempotencyKey) {
  const digest = crypto.createHash('sha1').update(idempotencyKey).digest('hex').slice(0, 12);
  return `reindex-${digest}`;
}

function backoffDelay(baseMs, failedAttempt, jitterRatio) {
  const exponential = baseMs * Math.pow(2, Math.max(0, failedAttempt - 1));
  if (jitterRatio <= 0) {
    return exponential;
  }

  const jitterSpan = exponential * jitterRatio;
  const jitter = Math.round((Math.random() * 2 - 1) * jitterSpan);
  return Math.max(0, exponential + jitter);
}

function createReindexQueue(options = {}) {
  const maxAttempts = Number.isInteger(options.maxAttempts) && options.maxAttempts > 0 ? options.maxAttempts : 3;
  const baseBackoffMs = Number.isInteger(options.baseBackoffMs) && options.baseBackoffMs > 0 ? options.baseBackoffMs : 100;
  const concurrency = Number.isInteger(options.concurrency) && options.concurrency > 0 ? options.concurrency : 2;
  const jitterRatio = typeof options.jitterRatio === 'number' ? Math.max(0, options.jitterRatio) : 0.1;
  const sleep = typeof options.sleep === 'function' ? options.sleep : (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const dispatch = typeof options.dispatch === 'function'
    ? options.dispatch
    : async () => {
      throw createError('E_REINDEX_DISPATCH_REQUIRED', 'dispatch(job) handler is required.');
    };

  const deadLetter = options.deadLetter && typeof options.deadLetter.capture === 'function'
    ? options.deadLetter
    : createReindexDeadLetterStore();

  const pending = [];
  const activeKeys = new Set();
  const activeJobs = new Map();

  function validateJobInput(input) {
    const tenantId = normalizeToken(input && input.tenantId);
    const docId = normalizeToken(input && input.docId);
    const idempotencyKey = normalizeToken(input && input.idempotencyKey);

    if (!tenantId || !docId || !idempotencyKey) {
      throw createError(
        'E_REINDEX_JOB_INVALID',
        'enqueue requires tenantId, docId, and idempotencyKey.'
      );
    }

    return {
      tenantId,
      docId,
      idempotencyKey,
      reason: normalizeToken(input.reason) || 'change',
      observedAt: normalizeToken(input.observedAt) || new Date().toISOString(),
    };
  }

  async function runJob(job) {
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        await dispatch({ ...job, attempt, maxAttempts });
        return { outcome: 'completed', attempts: attempt };
      } catch (error) {
        if (attempt >= maxAttempts) {
          deadLetter.capture({
            job,
            error,
            attemptCount: attempt,
            maxAttempts,
            failedAt: new Date().toISOString(),
          });
          return { outcome: 'dead-letter', attempts: attempt, error };
        }

        const delay = backoffDelay(baseBackoffMs, attempt, jitterRatio);
        await sleep(delay);
      }
    }

    return { outcome: 'dead-letter', attempts: attempt };
  }

  async function enqueue(input) {
    const normalized = validateJobInput(input);

    if (activeKeys.has(normalized.idempotencyKey)) {
      return {
        queued: false,
        reason: 'duplicate_active',
        job: activeJobs.get(normalized.idempotencyKey) || null,
      };
    }

    const job = {
      id: buildJobId(normalized.idempotencyKey),
      ...normalized,
      queuedAt: new Date().toISOString(),
    };

    activeKeys.add(normalized.idempotencyKey);
    activeJobs.set(normalized.idempotencyKey, job);
    pending.push(job);

    return {
      queued: true,
      job,
    };
  }

  async function drain() {
    let completed = 0;
    let deadLettered = 0;
    let running = 0;

    return new Promise((resolve) => {
      async function kick() {
        while (running < concurrency && pending.length > 0) {
          const job = pending.shift();
          running += 1;

          runJob(job)
            .then((result) => {
              if (result.outcome === 'completed') {
                completed += 1;
              } else {
                deadLettered += 1;
              }
            })
            .finally(() => {
              activeKeys.delete(job.idempotencyKey);
              activeJobs.delete(job.idempotencyKey);
              running -= 1;

              if (pending.length === 0 && running === 0) {
                resolve({ completed, deadLettered });
                return;
              }

              void kick();
            });
        }

        if (pending.length === 0 && running === 0) {
          resolve({ completed, deadLettered });
        }
      }

      void kick();
    });
  }

  function getStats() {
    return {
      pending: pending.length,
      activeKeys: activeKeys.size,
    };
  }

  return {
    enqueue,
    drain,
    getStats,
  };
}

module.exports = {
  createReindexQueue,
  buildJobId,
};
