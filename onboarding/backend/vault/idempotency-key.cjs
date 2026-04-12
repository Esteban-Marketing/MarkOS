'use strict';

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function buildIdempotencyKey(event) {
  const payload = event && typeof event === 'object' ? event : {};
  const tenantId = normalizeToken(payload.tenant_id);
  const docId = normalizeToken(payload.doc_id);
  const contentHash = normalizeToken(payload.content_hash || payload?.metadata?.content_hash);

  if (!tenantId || !docId || !contentHash) {
    throw createError(
      'E_IDEMPOTENCY_KEY_INPUT',
      'tenant_id, doc_id, and content_hash are required to build an idempotency key.'
    );
  }

  return `${tenantId}:${docId}:${contentHash}`;
}

module.exports = {
  buildIdempotencyKey,
};
