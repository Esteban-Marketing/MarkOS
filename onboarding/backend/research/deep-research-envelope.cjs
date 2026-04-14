'use strict';

const { normalizeDeepResearchFilters } = require('./filter-taxonomy-v1.cjs');
const { getResearchModeConfig } = require('./research-mode-taxonomy.cjs');
const { createContextPack } = require('./context-pack-contract.cjs');
const { createPatchApprovalBlock, createPatchPreview } = require('./patch-preview-policy.cjs');
const { DEFAULT_ROUTE } = require('./provider-routing-policy.cjs');

const TOP_LEVEL_KEYS = Object.freeze([
  'contract_version',
  'mode',
  'research_type',
  'query',
  'filters',
  'targets',
  'provider_policy',
  'telemetry',
]);

const TARGETS = new Set(['literacy', 'mir', 'msp']);

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

function assertAllowedKeys(value, allowedKeys, code, scopeLabel) {
  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw createError(code, `${scopeLabel} contains unknown keys: ${unknown.join(', ')}`);
  }
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeTargets(value, modeConfig) {
  const list = Array.isArray(value) && value.length > 0 ? value : (modeConfig.defaultTargets || ['literacy', 'mir', 'msp']);
  const normalized = Array.from(new Set(list.map((entry) => normalizeToken(entry).toLowerCase()).filter(Boolean)));
  const invalid = normalized.filter((entry) => !TARGETS.has(entry));
  if (invalid.length > 0) {
    throw createError('E_DEEP_RESEARCH_INVALID_TARGET', `Unsupported targets: ${invalid.join(', ')}`);
  }
  return normalized.sort();
}

function normalizeProviderPolicy(value = {}) {
  ensureObject(value, 'E_DEEP_RESEARCH_POLICY_INVALID', 'provider_policy must be an object when provided.');

  if (value.allow_write === true) {
    throw createError('E_DEEP_RESEARCH_WRITE_BLOCKED', 'Deep research envelope is preview-only; allow_write cannot be true.');
  }

  return {
    route: Array.isArray(value.route) && value.route.length > 0 ? value.route.slice() : DEFAULT_ROUTE.slice(),
    internal_authority: value.internal_authority !== false,
    allow_external: value.allow_external !== false,
    allow_write: false,
    human_approval_required: true,
    citations_required: value.citations_required !== false,
    allowed_domains: Array.isArray(value.allowed_domains) ? value.allowed_domains.slice() : [],
  };
}

function normalizeTelemetry(value = {}) {
  ensureObject(value, 'E_DEEP_RESEARCH_TELEMETRY_INVALID', 'telemetry must be an object when provided.');
  const client_surface = normalizeToken(value.client_surface) || null;
  const request_id = normalizeToken(value.request_id) || null;
  return { client_surface, request_id };
}

function normalizeDeepResearchEnvelope(input) {
  ensureObject(input, 'E_DEEP_RESEARCH_ENVELOPE_INVALID', 'Deep research envelope must be an object.');
  assertAllowedKeys(input, TOP_LEVEL_KEYS, 'E_DEEP_RESEARCH_ENVELOPE_UNKNOWN_KEY', 'deep research envelope');

  const mode = normalizeToken(input.mode || 'preview').toLowerCase();
  if (mode !== 'preview') {
    throw createError('E_DEEP_RESEARCH_WRITE_BLOCKED', 'Phase 91 only allows preview mode.');
  }

  const contract_version = normalizeToken(input.contract_version || 'markos.deep_research.v1');
  if (contract_version !== 'markos.deep_research.v1') {
    throw createError('E_DEEP_RESEARCH_INVALID_VERSION', 'Unsupported contract_version for deep research envelope.');
  }

  const query = normalizeToken(input.query);
  if (!query) {
    throw createError('E_DEEP_RESEARCH_QUERY_REQUIRED', 'query is required.');
  }

  const research_type = normalizeToken(input.research_type).toLowerCase();
  if (!research_type) {
    throw createError('E_DEEP_RESEARCH_INVALID_TYPE', 'research_type is required.');
  }

  const modeConfig = getResearchModeConfig(research_type);

  return {
    contract_version,
    mode,
    research_type,
    query,
    filters: normalizeDeepResearchFilters(input.filters),
    targets: normalizeTargets(input.targets, modeConfig),
    provider_policy: normalizeProviderPolicy(input.provider_policy || {}),
    telemetry: normalizeTelemetry(input.telemetry || {}),
  };
}

function createPreviewResearchResponse(input = {}) {
  const request = input.request ? normalizeDeepResearchEnvelope(input.request) : normalizeDeepResearchEnvelope({
    query: 'preview',
    research_type: 'company',
    filters: {
      industry: ['general'],
      company: { name: 'Unknown', domain: 'unknown.local' },
      audience: ['general'],
      offer_product: ['general'],
    },
  });

  const patchPreview = Array.isArray(input.patch_preview)
    ? input.patch_preview.map((entry) => createPatchPreview(entry))
    : [];

  return {
    contract_version: request.contract_version,
    status: normalizeToken(input.status) || 'ok',
    research_id: normalizeToken(input.research_id) || `research_${Date.now()}`,
    active_filters: request.filters,
    route_trace: Array.isArray(input.route_trace) ? input.route_trace : [],
    context_pack: createContextPack(input.context_pack || {}),
    patch_preview: patchPreview,
    approval: createPatchApprovalBlock(),
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
  };
}

module.exports = {
  TOP_LEVEL_KEYS,
  normalizeDeepResearchEnvelope,
  createPreviewResearchResponse,
};
