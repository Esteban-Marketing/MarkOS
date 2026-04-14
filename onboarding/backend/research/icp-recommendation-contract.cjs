'use strict';

const crypto = require('crypto');

const { NEURO_TRIGGER_IDS } = require('./neuro-literacy-taxonomy.cjs');
const { AUTHORITY_TOKEN, ALLOWED_ARCHETYPES } = require('./icp-signal-normalizer.cjs');
const { CONFIDENCE_FLAGS } = require('./icp-confidence-policy.cjs');

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeToken(value) {
  return String(value == null ? '' : value).trim();
}

function cloneObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return JSON.parse(JSON.stringify(value));
}

function ensureArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value.slice() : [value];
}

function normalizeRetrievalFilters(value = {}) {
  const filters = cloneObject(value);
  const tenantScope = normalizeToken(filters.tenant_scope || filters.tenantId || filters.tenant_id);
  if (!tenantScope) {
    throw createError('E_ICP_TENANT_SCOPE_REQUIRED', 'winner.retrieval_filters.tenant_scope is required.');
  }

  const normalized = { tenant_scope: tenantScope };
  for (const key of Object.keys(filters).sort((left, right) => left.localeCompare(right))) {
    if (key === 'tenant_scope' || key === 'tenantId' || key === 'tenant_id') continue;
    const valueForKey = filters[key];
    normalized[key] = Array.isArray(valueForKey)
      ? Array.from(new Set(valueForKey.map((entry) => normalizeToken(entry)).filter(Boolean)))
      : valueForKey;
  }

  return normalized;
}

function normalizeConfidence(value, errorCode = 'E_ICP_CONFIDENCE_FLAG_REQUIRED') {
  const normalized = normalizeToken(value).toLowerCase();
  if (!CONFIDENCE_FLAGS.includes(normalized)) {
    throw createError(errorCode, 'confidence flag must be one of high, medium, or low.');
  }
  return normalized;
}

function assertGovernedTrigger(trigger) {
  const normalized = normalizeToken(trigger).toUpperCase();
  if (normalized && !NEURO_TRIGGER_IDS.includes(normalized)) {
    throw createError('E_ICP_TRIGGER_NOT_GOVERNED', `Unsupported trigger '${trigger}'.`);
  }
  return normalized || null;
}

function assertGovernedArchetype(archetype) {
  const normalized = normalizeToken(archetype).toLowerCase();
  if (normalized && !ALLOWED_ARCHETYPES.includes(normalized)) {
    throw createError('E_ICP_ARCHETYPE_INVALID', `Unsupported archetype '${archetype}'.`);
  }
  return normalized || null;
}

function normalizeCandidate(candidate = {}, index = 0) {
  const overlay_key = normalizeToken(candidate.overlay_key || candidate.family_slug || '');
  if (!overlay_key) {
    throw createError('E_ICP_OVERLAY_KEY_REQUIRED', 'Every ICP candidate must include an overlay_key.');
  }

  return {
    rank: Math.max(1, Number(candidate.rank || index + 1)),
    candidate_id: normalizeToken(candidate.candidate_id || `${overlay_key}-${index + 1}`),
    overlay_key,
    score: Math.round(Number(candidate.score || 0)),
    confidence: normalizeConfidence(candidate.confidence || 'medium', 'E_ICP_CANDIDATE_CONFIDENCE_REQUIRED'),
    primary_trigger: assertGovernedTrigger(candidate.primary_trigger),
    archetype: assertGovernedArchetype(candidate.archetype),
    retrieval_filters: normalizeRetrievalFilters(candidate.retrieval_filters || {}),
    matched_signals: cloneObject(candidate.matched_signals),
    why_it_fits: normalizeToken(candidate.why_it_fits || candidate.why_it_fits_summary || 'Explainable governed ICP fit.'),
    warnings: ensureArray(candidate.warnings),
  };
}

function createInputFingerprint(input = {}) {
  const payload = JSON.stringify(input || {});
  return `sha256:${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

function createIcpRecommendation(input = {}) {
  const confidence_flag = normalizeConfidence(input.confidence_flag);

  const shortlistSource = Array.isArray(input.candidate_shortlist) ? input.candidate_shortlist : [];
  const normalizedShortlist = shortlistSource.map((entry, index) => normalizeCandidate(entry, index))
    .sort((left, right) => left.rank - right.rank || Number(right.score || 0) - Number(left.score || 0) || String(left.candidate_id).localeCompare(String(right.candidate_id)));

  if (normalizedShortlist.length === 0) {
    throw createError('E_ICP_WINNER_REQUIRED', 'candidate_shortlist must contain at least one ranked candidate.');
  }

  const normalizedWinnerSource = input.winner || normalizedShortlist[0];
  if (!normalizedWinnerSource) {
    throw createError('E_ICP_WINNER_REQUIRED', 'winner is required.');
  }

  const normalizedWinner = normalizeCandidate(normalizedWinnerSource, 0);

  const explanation = input.explanation && typeof input.explanation === 'object' ? input.explanation : {};

  return {
    version: '1.0',
    authority_token: AUTHORITY_TOKEN,
    contract_type: 'icp_reasoning_recommendation',
    input_fingerprint: createInputFingerprint(input.input || {}),
    confidence_flag,
    candidate_shortlist: normalizedShortlist.map((entry, index) => ({ ...entry, rank: index + 1 })),
    winner: {
      rank: 1,
      candidate_id: normalizedWinner.candidate_id,
      overlay_key: normalizedWinner.overlay_key,
      score: normalizedWinner.score,
      confidence: normalizedWinner.confidence,
      primary_trigger: normalizedWinner.primary_trigger,
      archetype: normalizedWinner.archetype,
      retrieval_filters: normalizedWinner.retrieval_filters,
      matched_signals: normalizedWinner.matched_signals,
      why_it_fits_summary: normalizeToken(normalizedWinnerSource.why_it_fits_summary || normalizedWinner.why_it_fits),
    },
    explanation: {
      summary: normalizeToken(explanation.summary || 'A governed ICP recommendation is available.'),
      runner_up_reason: normalizeToken(explanation.runner_up_reason || 'Runner-up rationale not provided.'),
      uncertainty: Array.isArray(explanation.uncertainty) ? explanation.uncertainty.slice() : [],
    },
    governance: {
      provenance_required: true,
      evidence_required: true,
      manipulation_blocked: true,
    },
  };
}

module.exports = {
  createIcpRecommendation,
  createInputFingerprint,
};
