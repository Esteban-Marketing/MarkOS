'use strict';

const { normalizeRetrievalEnvelope } = require('./retrieval-envelope.cjs');

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function buildRetrievalCacheKey({ tenantId, envelope }) {
  const normalized = normalizeRetrievalEnvelope(envelope);
  const normalizedTenantId = String(tenantId || normalized.filters.tenant_scope || '').trim();

  if (!normalizedTenantId) {
    const error = new Error('tenantId is required for retrieval cache key generation.');
    error.code = 'E_RETRIEVAL_CACHE_TENANT_REQUIRED';
    throw error;
  }

  return `retrieval:${normalizedTenantId}:${stableStringify(normalized)}`;
}

function createRetrievalCache() {
  const cache = new Map();
  return {
    get(key) {
      return cache.get(key);
    },
    set(key, value) {
      cache.set(key, value);
      return value;
    },
    clear() {
      cache.clear();
    },
  };
}

module.exports = {
  buildRetrievalCacheKey,
  createRetrievalCache,
};
