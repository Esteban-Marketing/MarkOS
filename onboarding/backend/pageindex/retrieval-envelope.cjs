'use strict';

const TOP_LEVEL_KEYS = Object.freeze([
  'mode',
  'discipline',
  'audience',
  'filters',
  'provenance_required',
]);

const FILTER_KEYS = Object.freeze([
  'pain_point_tags',
  'business_model',
  'funnel_stage',
  'content_type',
  'tenant_scope',
]);

const MODES = new Set(['reason', 'apply', 'iterate']);

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeNullableString(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = normalizeToken(value);
  if (!normalized) {
    throw createError('E_RETRIEVAL_ENVELOPE_INVALID_FIELD', `${fieldName} must be a non-empty string or null.`);
  }

  return normalized;
}

function normalizeStringArray(value) {
  const list = Array.isArray(value) ? value : [];
  return Array.from(new Set(list.map((entry) => normalizeToken(entry)).filter(Boolean))).sort();
}

function ensureObject(value, code, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError(code, message);
  }
}

function assertAllowedKeys(value, allowedKeys, code, scopeLabel) {
  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw createError(code, `${scopeLabel} contains unknown keys: ${unknown.join(', ')}`);
  }
}

function normalizeRetrievalEnvelope(input) {
  ensureObject(
    input,
    'E_RETRIEVAL_ENVELOPE_INVALID_PAYLOAD',
    'Retrieval envelope must be an object.'
  );
  assertAllowedKeys(input, TOP_LEVEL_KEYS, 'E_RETRIEVAL_ENVELOPE_UNKNOWN_KEY', 'retrieval envelope');

  const mode = normalizeToken(input.mode).toLowerCase();
  if (!MODES.has(mode)) {
    throw createError('E_RETRIEVAL_ENVELOPE_INVALID_MODE', 'Retrieval envelope mode must be reason, apply, or iterate.');
  }

  if (input.provenance_required !== true) {
    throw createError(
      'E_RETRIEVAL_ENVELOPE_PROVENANCE_REQUIRED',
      'Retrieval envelope requires provenance_required: true.'
    );
  }

  const filters = input.filters;
  ensureObject(filters, 'E_RETRIEVAL_ENVELOPE_INVALID_FILTERS', 'Retrieval envelope filters must be an object.');
  assertAllowedKeys(filters, FILTER_KEYS, 'E_RETRIEVAL_ENVELOPE_UNKNOWN_KEY', 'retrieval filters');

  const tenantScope = normalizeToken(filters.tenant_scope);
  if (!tenantScope) {
    throw createError('E_RETRIEVAL_ENVELOPE_TENANT_SCOPE_REQUIRED', 'filters.tenant_scope is required.');
  }

  return {
    mode,
    discipline: normalizeNullableString(input.discipline, 'discipline'),
    audience: normalizeNullableString(input.audience, 'audience'),
    filters: {
      pain_point_tags: normalizeStringArray(filters.pain_point_tags),
      business_model: normalizeStringArray(filters.business_model),
      funnel_stage: normalizeStringArray(filters.funnel_stage),
      content_type: normalizeStringArray(filters.content_type),
      tenant_scope: tenantScope,
    },
    provenance_required: true,
  };
}

module.exports = {
  TOP_LEVEL_KEYS,
  FILTER_KEYS,
  normalizeRetrievalEnvelope,
};
