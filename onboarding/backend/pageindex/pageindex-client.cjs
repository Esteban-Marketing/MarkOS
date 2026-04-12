'use strict';

const { normalizeProvenance, validateProvenance } = require('../vault/provenance-contract.cjs');
const { normalizeRetrievalEnvelope } = require('./retrieval-envelope.cjs');
const { buildRetrievalCacheKey, createRetrievalCache } = require('./retrieval-cache.cjs');

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeItem(item, tenantId, envelope) {
  const payload = item && typeof item === 'object' ? item : {};
  const text = typeof payload.text === 'string'
    ? payload.text
    : (typeof payload.data === 'string' ? payload.data : '');

  const normalizedProvenance = normalizeProvenance(payload.provenance, {
    sourceSystem: 'pageindex',
    sourceKind: 'retrieval',
    sourceMode: envelope.mode,
    actorId: tenantId || envelope.filters.tenant_scope || 'system',
    actorType: 'system',
  });

  const provenance = validateProvenance(normalizedProvenance);

  return {
    id: payload.id || null,
    text,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
    score: typeof payload.score === 'number' ? payload.score : 0,
    provenance,
  };
}

function createPageIndexAdapter(options = {}) {
  const resolveDocIds = typeof options.resolveDocIds === 'function' ? options.resolveDocIds : async () => [];
  const retrieveDocuments = typeof options.retrieveDocuments === 'function' ? options.retrieveDocuments : async () => [];
  const cache = options.cache || createRetrievalCache();

  async function retrieve({ tenantId, envelope }) {
    const normalizedEnvelope = normalizeRetrievalEnvelope(envelope);
    const cacheKey = buildRetrievalCacheKey({ tenantId, envelope: normalizedEnvelope });
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const docIds = await resolveDocIds({ tenantId, envelope: normalizedEnvelope });
    if (!Array.isArray(docIds) || docIds.length === 0) {
      const emptyResult = {
        envelope: normalizedEnvelope,
        cache_key: cacheKey,
        doc_ids: [],
        items: [],
      };
      cache.set(cacheKey, emptyResult);
      return emptyResult;
    }

    const rawItems = await retrieveDocuments({
      tenantId,
      envelope: normalizedEnvelope,
      docIds,
    });

    const normalizedItems = (Array.isArray(rawItems) ? rawItems : [])
      .map((item) => normalizeItem(item, tenantId, normalizedEnvelope))
      .filter((item) => item.text.trim().length > 0);

    if (normalizedEnvelope.provenance_required && normalizedItems.some((item) => !item.provenance)) {
      throw createError('E_PAGEINDEX_PROVENANCE_REQUIRED', 'All retrieval items must include provenance metadata.');
    }

    const result = {
      envelope: normalizedEnvelope,
      cache_key: cacheKey,
      doc_ids: docIds,
      items: normalizedItems,
    };

    cache.set(cacheKey, result);
    return result;
  }

  return {
    retrieve,
  };
}

module.exports = {
  createPageIndexAdapter,
};
