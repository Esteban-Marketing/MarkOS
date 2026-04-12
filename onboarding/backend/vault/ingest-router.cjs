'use strict';

const { validateAudienceMetadata } = require('./audience-schema.cjs');
const { buildIdempotencyKey } = require('./idempotency-key.cjs');

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

function createIngestRouter(options = {}) {
  const indexArtifact = asFunction(
    options.indexArtifact,
    'E_INGEST_INDEX_REQUIRED',
    'indexArtifact(event) function is required.'
  );

  const applyIngest = typeof options.applyIngest === 'function' ? options.applyIngest : null;
  const appendAudit = typeof options.appendAudit === 'function' ? options.appendAudit : null;
  const persistArtifact = applyIngest && appendAudit
    ? null
    : asFunction(
      options.persistArtifact,
      'E_INGEST_PERSIST_REQUIRED',
      'persistArtifact(event) function is required.'
    );

  function createLineageRecord(event, applyResult) {
    const revision = applyResult && applyResult.revision && typeof applyResult.revision === 'object'
      ? applyResult.revision
      : {};

    const actor = event.actor && typeof event.actor === 'object'
      ? event.actor
      : { id: 'system', type: 'system' };

    return {
      tenant_id: event.tenant_id,
      doc_id: event.doc_id,
      event_type: event.event_type,
      source: event.source || 'obsidian-watch',
      observed_at: event.observed_at,
      actor,
      idempotency_key: applyResult && applyResult.idempotency_key
        ? applyResult.idempotency_key
        : buildIdempotencyKey(event),
      content_hash: revision.content_hash || event.content_hash || null,
      supersedes_content_hash: revision.supersedes_content_hash || null,
    };
  }

  async function route({ event }) {
    if (!event || typeof event !== 'object') {
      throw createError('E_INGEST_EVENT_REQUIRED', 'ingest router requires an event payload.');
    }

    const metadata = validateAudienceMetadata(event.metadata);

    const enrichedEvent = {
      ...event,
      metadata,
    };

    if (applyIngest && appendAudit) {
      const applied = await applyIngest({ event: enrichedEvent });
      const audit = await appendAudit(createLineageRecord(enrichedEvent, applied));

      const shouldIndex = !applied || (applied.outcome !== 'noop_duplicate' && applied.outcome !== 'noop_stale');
      const indexed = shouldIndex ? await indexArtifact(enrichedEvent) : { skipped: true, reason: applied.outcome };

      return {
        accepted: true,
        event: enrichedEvent,
        applied,
        audit,
        indexed,
      };
    }

    const persisted = await persistArtifact(enrichedEvent);
    const indexed = await indexArtifact(enrichedEvent);

    return {
      accepted: true,
      event: enrichedEvent,
      persisted,
      indexed,
    };
  }

  return {
    route,
  };
}

module.exports = {
  createIngestRouter,
};
