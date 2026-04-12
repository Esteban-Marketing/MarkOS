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

function normalizeToken(value) {
  return String(value || '').trim();
}

function createAuditLog(options = {}) {
  const appendSink = asFunction(
    options.append,
    'E_AUDIT_APPEND_REQUIRED',
    'append(entry) handler is required for audit log.'
  );

  const seenKeys = new Set();

  async function append(entry) {
    const payload = entry && typeof entry === 'object' ? { ...entry } : null;
    if (!payload) {
      throw createError('E_AUDIT_ENTRY_REQUIRED', 'audit log append requires an entry payload.');
    }

    payload.tenant_id = normalizeToken(payload.tenant_id);
    payload.doc_id = normalizeToken(payload.doc_id);
    payload.idempotency_key = normalizeToken(payload.idempotency_key);

    if (!payload.tenant_id || !payload.doc_id || !payload.idempotency_key) {
      throw createError('E_AUDIT_ENTRY_INVALID', 'audit entry requires tenant_id, doc_id, and idempotency_key.');
    }

    if (seenKeys.has(payload.idempotency_key)) {
      return {
        ok: true,
        deduped: true,
      };
    }

    const result = await appendSink(payload);
    seenKeys.add(payload.idempotency_key);

    return {
      ok: true,
      deduped: false,
      result,
    };
  }

  return {
    append,
  };
}

module.exports = {
  createAuditLog,
};
