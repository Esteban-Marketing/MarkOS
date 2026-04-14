'use strict';

const { createContextPack } = require('./context-pack-contract.cjs');
const { createIcpRecommendation } = require('./icp-recommendation-contract.cjs');

const AUTHORITY_TOKEN = 'MARKOS-REF-NEU-01';
const PORTABLE_SURFACES = Object.freeze(['api', 'mcp', 'cli', 'editor', 'internal_automation']);
const REVIEW_STATUSES = Object.freeze(['passed', 'warnings', 'rewrite_required']);

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeToken(value) {
  return String(value ?? '').trim();
}

function cloneObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return JSON.parse(JSON.stringify(value));
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => normalizeToken(entry)).filter(Boolean)));
}

function ensureContextPack(input = {}) {
  if (input.contextPack && typeof input.contextPack === 'object') {
    return input.contextPack;
  }

  if (input.context_pack && typeof input.context_pack === 'object') {
    return input.context_pack;
  }

  if (input.tailoring_signals) {
    return createContextPack({ tailoring_signals: input.tailoring_signals, summary: input.summary || '' });
  }

  if (input.summary || input.findings || input.claims) {
    return createContextPack(input);
  }

  throw createError('E_TAILORING_CONTEXT_REQUIRED', 'contextPack with tailoring_signals is required.');
}

function ensureReasoning(input = {}) {
  const candidate = input.reasoning || input.icpRecommendation || input.icp_recommendation || null;

  if (!candidate || typeof candidate !== 'object') {
    throw createError('E_TAILORING_REASONING_REQUIRED', 'Phase 98 reasoning recommendation is required.');
  }

  if (candidate.contract_type === 'icp_reasoning_recommendation') {
    return candidate;
  }

  if (candidate.winner || candidate.candidate_shortlist) {
    return createIcpRecommendation(candidate);
  }

  throw createError('E_TAILORING_REASONING_REQUIRED', 'Phase 98 reasoning recommendation is required.');
}

function normalizeReview(review = {}) {
  const status = normalizeToken(review.status || 'passed').toLowerCase();
  return {
    status: REVIEW_STATUSES.includes(status) ? status : 'passed',
    blocking_reasons: Array.isArray(review.blocking_reasons)
      ? review.blocking_reasons.map((entry) => ({
          code: normalizeToken(entry.code || 'REVIEW_NOTE') || 'REVIEW_NOTE',
          detail: normalizeToken(entry.detail || 'Review feedback available.') || 'Review feedback available.',
        }))
      : [],
    required_fixes: normalizeStringArray(review.required_fixes),
  };
}

function assertRequiredSignalArray(signals, key) {
  const values = normalizeStringArray(signals[key]);
  if (values.length === 0) {
    throw createError('E_TAILORING_SIGNAL_REQUIRED', `tailoring_signals.${key} must contain at least one value.`);
  }
  return values;
}

function assertWinnerFields(reasoning = {}) {
  const winner = cloneObject(reasoning.winner);
  const requiredFields = ['overlay_key', 'primary_trigger', 'why_it_fits_summary'];

  for (const field of requiredFields) {
    if (!normalizeToken(winner[field])) {
      throw createError('E_TAILORING_WINNER_REQUIRED', `reasoning.winner.${field} is required.`);
    }
  }

  return {
    rank: Number(winner.rank || 1),
    candidate_id: normalizeToken(winner.candidate_id || winner.overlay_key),
    overlay_key: normalizeToken(winner.overlay_key),
    primary_trigger: normalizeToken(winner.primary_trigger).toUpperCase(),
    archetype: normalizeToken(winner.archetype),
    retrieval_filters: cloneObject(winner.retrieval_filters),
    matched_signals: cloneObject(winner.matched_signals),
    why_it_fits_summary: normalizeToken(winner.why_it_fits_summary),
    confidence: normalizeToken(winner.confidence || reasoning.confidence_flag || 'medium'),
  };
}

function createTailoringAlignmentEnvelope(input = {}) {
  const contextPack = ensureContextPack(input);
  const reasoning = ensureReasoning(input);
  const signals = cloneObject(contextPack.tailoring_signals);

  const normalizedSignals = {
    pain_point_tags: assertRequiredSignalArray(signals, 'pain_point_tags'),
    desired_outcome_tags: assertRequiredSignalArray(signals, 'desired_outcome_tags'),
    objection_tags: assertRequiredSignalArray(signals, 'objection_tags'),
    trust_driver_tags: assertRequiredSignalArray(signals, 'trust_driver_tags'),
    trust_blocker_tags: normalizeStringArray(signals.trust_blocker_tags),
    emotional_state_tags: normalizeStringArray(signals.emotional_state_tags),
    neuro_trigger_tags: normalizeStringArray(signals.neuro_trigger_tags),
    naturality_tags: assertRequiredSignalArray(signals, 'naturality_tags'),
    company_tailoring_profile: cloneObject(signals.company_tailoring_profile),
    icp_tailoring_profile: cloneObject(signals.icp_tailoring_profile),
    stage_tailoring_profile: cloneObject(signals.stage_tailoring_profile),
  };

  const winner = assertWinnerFields(reasoning);
  const confidenceFlag = normalizeToken(reasoning.confidence_flag).toLowerCase();
  if (!confidenceFlag) {
    throw createError('E_TAILORING_CONFIDENCE_REQUIRED', 'reasoning.confidence_flag is required.');
  }

  const review = normalizeReview(input.review || input.review_gate || {});

  return {
    version: '1.0',
    contract_type: 'tailoring_alignment_envelope',
    authority_token: normalizeToken(reasoning.authority_token || AUTHORITY_TOKEN) || AUTHORITY_TOKEN,
    read_safe: true,
    write_disabled: true,
    confidence_flag: confidenceFlag,
    tailoring_signals: normalizedSignals,
    reasoning: {
      version: normalizeToken(reasoning.version || '1.0') || '1.0',
      authority_token: normalizeToken(reasoning.authority_token || AUTHORITY_TOKEN) || AUTHORITY_TOKEN,
      confidence_flag: confidenceFlag,
      candidate_shortlist: Array.isArray(reasoning.candidate_shortlist) ? reasoning.candidate_shortlist.map((entry) => ({ ...entry })) : [],
      winner,
      explanation: cloneObject(reasoning.explanation),
    },
    review,
    surface_portability: {
      semantics_locked: true,
      supported_surfaces: PORTABLE_SURFACES.slice(),
      presenter_mode: 'shared_payload_many_wrappers',
      required_fields: [
        'authority_token',
        'tailoring_signals',
        'reasoning.winner.overlay_key',
        'reasoning.winner.primary_trigger',
        'reasoning.winner.why_it_fits_summary',
        'confidence_flag',
        'review.status',
      ],
    },
  };
}

function assertTailoringAlignmentEnvelope(input = {}) {
  const envelope = input.contract_type === 'tailoring_alignment_envelope'
    ? input
    : createTailoringAlignmentEnvelope(input);

  if (normalizeToken(envelope.authority_token) !== AUTHORITY_TOKEN) {
    throw createError('E_TAILORING_AUTHORITY_TOKEN', `authority_token must equal ${AUTHORITY_TOKEN}.`);
  }

  if (normalizeToken(envelope.contract_type) !== 'tailoring_alignment_envelope') {
    throw createError('E_TAILORING_CONTRACT_TYPE', 'contract_type must be tailoring_alignment_envelope.');
  }

  if (normalizeStringArray(envelope.surface_portability?.supported_surfaces).length !== PORTABLE_SURFACES.length) {
    throw createError('E_TAILORING_PORTABILITY_REQUIRED', 'surface portability must cover api, mcp, cli, editor, and internal_automation.');
  }

  assertWinnerFields(envelope.reasoning || {});
  assertRequiredSignalArray(envelope.tailoring_signals || {}, 'pain_point_tags');
  assertRequiredSignalArray(envelope.tailoring_signals || {}, 'trust_driver_tags');
  assertRequiredSignalArray(envelope.tailoring_signals || {}, 'naturality_tags');

  return envelope;
}

module.exports = {
  AUTHORITY_TOKEN,
  PORTABLE_SURFACES,
  REVIEW_STATUSES,
  createTailoringAlignmentEnvelope,
  assertTailoringAlignmentEnvelope,
};
