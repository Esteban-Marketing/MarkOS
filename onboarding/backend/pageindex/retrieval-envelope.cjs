'use strict';

const { OPTIONAL_TAG_FIELDS } = require('../research/neuro-literacy-schema.cjs');

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
  ...OPTIONAL_TAG_FIELDS,
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
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
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

function mergeReasoningRetrievalFilters(filters = {}, reasoning = null) {
  const baseFilters = (!filters || typeof filters !== 'object' || Array.isArray(filters)) ? {} : { ...filters };
  const winner = reasoning && typeof reasoning === 'object' ? reasoning.winner || null : null;
  const winnerFilters = winner && typeof winner.retrieval_filters === 'object' ? winner.retrieval_filters : {};

  const merged = {
    ...baseFilters,
    ...winnerFilters,
  };

  for (const fieldName of FILTER_KEYS) {
    if (fieldName === 'tenant_scope') continue;
    merged[fieldName] = Array.from(new Set([
      ...normalizeStringArray(baseFilters[fieldName]),
      ...normalizeStringArray(winnerFilters[fieldName]),
    ])).sort((left, right) => left.localeCompare(right));
  }

  if (winner && winner.primary_trigger) {
    merged.neuro_trigger_tags = Array.from(new Set([
      ...normalizeStringArray(merged.neuro_trigger_tags),
      normalizeToken(winner.primary_trigger),
    ])).sort((left, right) => left.localeCompare(right));
  }

  merged.tenant_scope = normalizeToken(baseFilters.tenant_scope || winnerFilters.tenant_scope);
  return merged;
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

  const normalizedFilters = {
    pain_point_tags: normalizeStringArray(filters.pain_point_tags),
    business_model: normalizeStringArray(filters.business_model),
    funnel_stage: normalizeStringArray(filters.funnel_stage),
    content_type: normalizeStringArray(filters.content_type),
    tenant_scope: tenantScope,
  };

  for (const fieldName of OPTIONAL_TAG_FIELDS) {
    normalizedFilters[fieldName] = normalizeStringArray(filters[fieldName]);
  }

  return {
    mode,
    discipline: normalizeNullableString(input.discipline, 'discipline'),
    audience: normalizeNullableString(input.audience, 'audience'),
    filters: normalizedFilters,
    provenance_required: true,
  };
}

module.exports = {
  TOP_LEVEL_KEYS,
  FILTER_KEYS,
  mergeReasoningRetrievalFilters,
  normalizeRetrievalEnvelope,
};
