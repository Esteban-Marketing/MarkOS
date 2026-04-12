'use strict';

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

function createReindexDispatch(options = {}) {
  const reindexDocument = asFunction(
    options.reindexDocument,
    'E_REINDEX_DISPATCH_HANDLER_REQUIRED',
    'reindexDocument({ tenantId, docId, reason, observedAt, idempotencyKey }) is required.'
  );

  async function dispatch(job) {
    const payload = job && typeof job === 'object' ? job : null;
    if (!payload) {
      throw createError('E_REINDEX_JOB_REQUIRED', 'dispatch requires a job payload.');
    }

    if (!payload.tenantId || !payload.docId || !payload.idempotencyKey) {
      throw createError(
        'E_REINDEX_JOB_INVALID',
        'dispatch requires tenantId, docId, and idempotencyKey.'
      );
    }

    const result = await reindexDocument({
      tenantId: String(payload.tenantId),
      docId: String(payload.docId),
      reason: String(payload.reason || 'change'),
      observedAt: String(payload.observedAt || new Date().toISOString()),
      idempotencyKey: String(payload.idempotencyKey),
    });

    return {
      ok: true,
      result,
    };
  }

  return {
    dispatch,
  };
}

module.exports = {
  createReindexDispatch,
};
