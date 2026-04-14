'use strict';

const REQUIRED_CORE_FILTERS = Object.freeze([
  'industry',
  'company',
  'audience',
  'offer_product',
]);

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function ensureObject(value, code, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError(code, message);
  }
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeStringArray(value, fieldName) {
  const list = Array.isArray(value) ? value : [value];
  const normalized = Array.from(new Set(list.map((entry) => normalizeToken(entry)).filter(Boolean))).sort((left, right) => left.localeCompare(right));
  if (normalized.length === 0) {
    throw createError('E_DEEP_RESEARCH_FILTER_REQUIRED', `${fieldName} must contain at least one non-empty value.`);
  }
  return normalized;
}

function normalizeOptionalStringArray(value) {
  if (value === null || value === undefined) {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return Array.from(new Set(list.map((entry) => normalizeToken(entry)).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function normalizeCompany(value) {
  ensureObject(value, 'E_DEEP_RESEARCH_COMPANY_REQUIRED', 'filters.company must be an object with name and domain.');
  const name = normalizeToken(value.name);
  const domain = normalizeToken(value.domain).toLowerCase();
  if (!name || !domain) {
    throw createError('E_DEEP_RESEARCH_COMPANY_REQUIRED', 'filters.company.name and filters.company.domain are required.');
  }
  return { name, domain };
}

function normalizeExtensions(value) {
  if (value === null || value === undefined) {
    return {};
  }

  ensureObject(value, 'E_DEEP_RESEARCH_FILTERS_INVALID', 'filters.extensions must be an object when provided.');

  const normalized = {};
  for (const key of Object.keys(value).sort((left, right) => left.localeCompare(right))) {
    const entry = value[key];
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      normalized[key] = normalizeExtensions(entry);
      continue;
    }

    normalized[key] = normalizeOptionalStringArray(entry);
  }

  return normalized;
}

function normalizeDeepResearchFilters(input) {
  ensureObject(input, 'E_DEEP_RESEARCH_FILTERS_INVALID', 'Deep research filters must be an object.');

  for (const field of REQUIRED_CORE_FILTERS) {
    if (!(field in input)) {
      throw createError('E_DEEP_RESEARCH_FILTER_REQUIRED', `filters.${field} is required.`);
    }
  }

  return {
    industry: normalizeStringArray(input.industry, 'filters.industry'),
    company: normalizeCompany(input.company),
    audience: normalizeStringArray(input.audience, 'filters.audience'),
    offer_product: normalizeStringArray(input.offer_product, 'filters.offer_product'),
    extensions: normalizeExtensions(input.extensions),
  };
}

module.exports = {
  REQUIRED_CORE_FILTERS,
  normalizeDeepResearchFilters,
};
