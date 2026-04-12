'use strict';

/**
 * sync-service.cjs — Ingestion-adjacent sync service with audience enforcement.
 *
 * Wraps sync event normalization and audience schema validation for file-system
 * change events. Ensures all events are ingest-eligible without manual publish
 * gates (D-05) and that audience metadata is valid before hand-off (D-03 / LITV-04).
 *
 * Phase 85 scope boundary: ingestion and ingest-adjacent audit only.
 * Retrieval role-views (Phase 86/87) are explicitly deferred.
 */

const { normalizeSyncEvent } = require('./sync-event-contract.cjs');
const { validateAudienceMetadata } = require('./audience-schema.cjs');

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

/**
 * Create a sync service instance bound to a specific tenant and vault root.
 *
 * options.tenantId     — required string tenant identifier
 * options.vaultRoot    — required string absolute vault root path
 * options.ingestEvent  — required async function(event) → { outcome }
 * options.now          — optional () => ISO timestamp (injectable for tests)
 */
function createSyncService(options) {
  const tenantId = String((options && options.tenantId) || '').trim();
  const vaultRoot = String((options && options.vaultRoot) || '').trim();

  if (!tenantId || !vaultRoot) {
    throw createError(
      'E_SYNC_SERVICE_CONFIG',
      'tenantId and vaultRoot are required to create sync service.'
    );
  }

  const ingestEvent = asFunction(
    options && options.ingestEvent,
    'E_SYNC_SERVICE_INGEST_REQUIRED',
    'ingestEvent(event) handler is required for sync service.'
  );

  const now = typeof (options && options.now) === 'function'
    ? options.now
    : () => new Date().toISOString();

  const lineage = options && options.lineage;

  /**
   * Handle a file change event for the given absolute path.
   * Validates audience metadata (if present) before normalizing the sync event.
   * Never requires manual publish — all accepted events are immediately ingest-eligible.
   */
  async function handleChange(absolutePath, changeOptions) {
    const metadata = (changeOptions && changeOptions.metadata) || {};

    if (metadata && Object.keys(metadata).length > 0) {
      validateAudienceMetadata(metadata);
    }

    const observedAt = now();
    const normalized = normalizeSyncEvent({
      eventType: 'change',
      absolutePath,
      tenantId,
      vaultRoot,
      observedAt,
      metadata,
      enqueuedAt: now(),
    });

    if (lineage && typeof lineage.appendLineageEvent === 'function') {
      await lineage.appendLineageEvent({
        tenant_id: tenantId,
        artifact_id: String((metadata && metadata.artifact_id) || normalized.doc_id || '').trim(),
        view: 'operator',
        role: 'operator',
        action: String((metadata && metadata.action) || 'sync_change').trim(),
        timestamp: observedAt,
      });
    }

    return ingestEvent(normalized);
  }

  return {
    handleChange,
  };
}

module.exports = {
  createSyncService,
};
