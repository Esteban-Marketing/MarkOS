'use strict';

const { collapseEventBurst, normalizeSyncEvent } = require('./sync-event-contract.cjs');

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

function createSyncOrchestrator(options = {}) {
  const tenantId = String(options.tenantId || '').trim();
  const vaultRoot = String(options.vaultRoot || '').trim();
  if (!tenantId || !vaultRoot) {
    throw createError('E_SYNC_ORCHESTRATOR_CONFIG', 'tenantId and vaultRoot are required to create sync orchestrator.');
  }

  const enqueue = asFunction(
    options.enqueue,
    'E_SYNC_ENQUEUE_REQUIRED',
    'enqueue(event) handler is required for sync orchestrator.'
  );

  const now = typeof options.now === 'function' ? options.now : () => new Date().toISOString();

  async function enqueueNormalized(events) {
    const collapsed = collapseEventBurst(events);
    const accepted = [];

    for (const event of collapsed) {
      await enqueue(event);
      accepted.push(event);
    }

    return accepted;
  }

  async function handleFsEvent(eventType, absolutePath, eventOptions = {}) {
    const normalized = normalizeSyncEvent({
      eventType,
      absolutePath,
      tenantId,
      vaultRoot,
      observedAt: eventOptions.observedAt || now(),
      metadata: eventOptions.metadata || {},
      enqueuedAt: now(),
    });

    const accepted = await enqueueNormalized([normalized]);
    return accepted[0] || null;
  }

  async function handleFsBurst(entries) {
    const events = (Array.isArray(entries) ? entries : []).map((entry) => normalizeSyncEvent({
      eventType: entry.eventType,
      absolutePath: entry.absolutePath,
      tenantId,
      vaultRoot,
      observedAt: entry.observedAt || now(),
      metadata: entry.metadata || {},
      enqueuedAt: now(),
    }));

    return enqueueNormalized(events);
  }

  return {
    handleFsEvent,
    handleFsBurst,
  };
}

module.exports = {
  createSyncOrchestrator,
};
