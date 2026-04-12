'use strict';

const path = require('path');

const ALLOWED_EVENT_TYPES = new Set(['add', 'change', 'unlink']);

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizePathForDocId(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
}

function toAbsolutePath(value) {
  return path.resolve(String(value || ''));
}

function inferVaultRoot(absolutePath) {
  const resolved = toAbsolutePath(absolutePath);
  const segments = resolved.split(path.sep);
  const vaultIndex = segments.findIndex((segment) => String(segment).toLowerCase() === 'vault');

  if (vaultIndex <= 0) {
    return path.parse(resolved).root;
  }

  return path.join(...segments.slice(0, vaultIndex + 1));
}

function toDocId(absolutePath, vaultRoot) {
  const relativePath = path.relative(toAbsolutePath(vaultRoot), toAbsolutePath(absolutePath));
  if (!relativePath || relativePath.startsWith('..')) {
    throw createError('E_SYNC_PATH_OUTSIDE_VAULT', 'Sync event path is outside configured vault root.');
  }

  return normalizePathForDocId(relativePath);
}

function normalizeSyncEvent(input) {
  const payload = input && typeof input === 'object' ? input : {};
  const eventType = String(payload.eventType || '').toLowerCase();
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    throw createError('E_SYNC_EVENT_TYPE_INVALID', 'Sync event type must be add, change, or unlink.');
  }

  const tenantId = String(payload.tenantId || '').trim();
  if (!tenantId) {
    throw createError('E_SYNC_TENANT_REQUIRED', 'Sync event tenant id is required.');
  }

  const absolutePath = String(payload.absolutePath || '').trim();
  if (!absolutePath) {
    throw createError('E_SYNC_PATH_REQUIRED', 'Sync event absolute path is required.');
  }

  const observedAt = payload.observedAt || new Date().toISOString();
  if (Number.isNaN(Date.parse(observedAt))) {
    throw createError('E_SYNC_TIMESTAMP_INVALID', 'Sync event observedAt must be a valid ISO timestamp.');
  }

  const vaultRoot = payload.vaultRoot || inferVaultRoot(absolutePath);
  const docId = toDocId(absolutePath, vaultRoot);

  return {
    tenant_id: tenantId,
    doc_id: docId,
    source_path: absolutePath,
    source: 'obsidian-watch',
    event_type: eventType,
    observed_at: observedAt,
    enqueued_at: payload.enqueuedAt || observedAt,
    requires_manual_publish: false,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
    queue_key: `${tenantId}:${docId}`,
  };
}

function chooseEventWinner(current, incoming) {
  if (!current) {
    return incoming;
  }

  const currentObserved = Date.parse(current.observed_at || 0);
  const incomingObserved = Date.parse(incoming.observed_at || 0);
  if (incomingObserved >= currentObserved) {
    return incoming;
  }

  return current;
}

function collapseEventBurst(events) {
  const list = Array.isArray(events) ? events : [];
  const collapsed = new Map();

  for (const event of list) {
    if (!event || !event.queue_key) {
      continue;
    }

    const selected = chooseEventWinner(collapsed.get(event.queue_key), event);
    collapsed.set(event.queue_key, selected);
  }

  return Array.from(collapsed.values());
}

module.exports = {
  ALLOWED_EVENT_TYPES,
  normalizeSyncEvent,
  collapseEventBurst,
};
