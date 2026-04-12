'use strict';

const { buildIdempotencyKey } = require('./idempotency-key.cjs');
const { resolveConflict } = require('./conflict-resolution.cjs');

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function asFunction(value, code, message) {
  if (typeof value !== 'function') {
    throw createError(code, message);
  }
  return value;
}

function createIngestApply(options = {}) {
  const getActiveRevision = asFunction(
    options.getActiveRevision,
    'E_INGEST_APPLY_ACTIVE_READER_REQUIRED',
    'getActiveRevision({ tenantId, docId }) is required.'
  );

  const upsertRevision = asFunction(
    options.upsertRevision,
    'E_INGEST_APPLY_UPSERT_REQUIRED',
    'upsertRevision({ revision, event }) is required.'
  );

  const buildKey = typeof options.buildIdempotencyKey === 'function' ? options.buildIdempotencyKey : buildIdempotencyKey;
  const evaluateConflict = typeof options.resolveConflict === 'function' ? options.resolveConflict : resolveConflict;

  async function apply({ event }) {
    if (!event || typeof event !== 'object') {
      throw createError('E_INGEST_APPLY_EVENT_REQUIRED', 'apply requires an event payload.');
    }

    const idempotencyKey = buildKey(event);
    const currentRevision = await getActiveRevision({ tenantId: event.tenant_id, docId: event.doc_id });

    const resolution = evaluateConflict({
      currentRevision,
      incomingEvent: event,
      incomingKey: idempotencyKey,
    });

    if (resolution.outcome === 'duplicate') {
      return {
        outcome: 'noop_duplicate',
        idempotency_key: idempotencyKey,
        revision: currentRevision,
      };
    }

    if (resolution.outcome === 'stale') {
      return {
        outcome: 'noop_stale',
        idempotency_key: idempotencyKey,
        revision: currentRevision,
      };
    }

    const revision = {
      tenant_id: event.tenant_id,
      doc_id: event.doc_id,
      observed_at: event.observed_at,
      event_type: event.event_type,
      content_hash: event.content_hash,
      idempotency_key: idempotencyKey,
      supersedes_content_hash: resolution.supersedes ? resolution.supersedes.content_hash : null,
    };

    const persisted = await upsertRevision({ revision, event });

    return {
      outcome: resolution.outcome,
      idempotency_key: idempotencyKey,
      revision: persisted || revision,
    };
  }

  return {
    apply,
  };
}

module.exports = {
  createIngestApply,
};
