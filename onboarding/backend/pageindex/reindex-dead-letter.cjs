'use strict';

function normalizeToken(value) {
  return String(value || '').trim();
}

function createEntryId(job) {
  return `${job.id}:dead-letter`;
}

function toSerializableError(error) {
  return {
    code: normalizeToken(error && error.code) || 'E_REINDEX_FAILED',
    message: normalizeToken(error && error.message) || 'Unknown re-index failure.',
  };
}

function createReindexDeadLetterStore(options = {}) {
  const entries = options.entries instanceof Map ? options.entries : new Map();

  function capture({ job, error, attemptCount, maxAttempts, failedAt }) {
    const entry = {
      id: createEntryId(job),
      job_id: job.id,
      tenant_id: normalizeToken(job.tenantId),
      doc_id: normalizeToken(job.docId),
      idempotency_key: normalizeToken(job.idempotencyKey),
      reason: normalizeToken(job.reason) || 'change',
      observed_at: normalizeToken(job.observedAt) || null,
      attempt_count: Number(attemptCount || 0),
      max_attempts: Number(maxAttempts || 0),
      failed_at: normalizeToken(failedAt) || new Date().toISOString(),
      failure: toSerializableError(error),
      replay: {
        status: 'pending',
        attempt_count: 0,
        last_replayed_at: null,
        requeue_job_id: null,
      },
    };

    entries.set(entry.id, entry);
    return entry;
  }

  function list(options = {}) {
    const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : Number.MAX_SAFE_INTEGER;
    const replayStatus = normalizeToken(options.replayStatus);

    const values = Array.from(entries.values()).filter((entry) => {
      if (!replayStatus) {
        return true;
      }
      return normalizeToken(entry.replay && entry.replay.status) === replayStatus;
    });

    return values.slice(0, limit).map((entry) => ({ ...entry, replay: { ...entry.replay }, failure: { ...entry.failure } }));
  }

  function markReplayCompleted(id, metadata = {}) {
    const key = normalizeToken(id);
    const current = entries.get(key);
    if (!current) {
      return null;
    }

    current.replay = {
      ...current.replay,
      status: 'completed',
      attempt_count: Number(current.replay.attempt_count || 0) + 1,
      last_replayed_at: new Date().toISOString(),
      requeue_job_id: normalizeToken(metadata.requeueJobId) || current.replay.requeue_job_id || null,
    };

    entries.set(key, current);
    return { ...current, replay: { ...current.replay }, failure: { ...current.failure } };
  }

  function markReplayDuplicate(id) {
    const key = normalizeToken(id);
    const current = entries.get(key);
    if (!current) {
      return null;
    }

    current.replay = {
      ...current.replay,
      status: current.replay.status || 'pending',
    };

    entries.set(key, current);
    return { ...current, replay: { ...current.replay }, failure: { ...current.failure } };
  }

  return {
    capture,
    list,
    markReplayCompleted,
    markReplayDuplicate,
  };
}

module.exports = {
  createReindexDeadLetterStore,
};
