'use strict';

const {
  QUALITY_DIMENSION_KEYS,
  QUALITY_DIMENSION_FLOORS,
} = require('./evaluation-score-policy.cjs');

const VALID_DECISIONS = Object.freeze(['promotable', 'review_required', 'blocked']);
const REVIEW_STATUSES = Object.freeze(['passed', 'warnings', 'rewrite_required']);
const BASELINE_REGRESSION_KEYS = Object.freeze([
  'preview_safe',
  'provenance_required',
  'read_safe',
  'write_disabled',
  'route_trace_present',
  'provider_audit_present',
]);

function normalizeToken(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return value === true;
}

function unique(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function normalizeDecision(value) {
  return VALID_DECISIONS.includes(value) ? value : 'review_required';
}

function normalizeDecisionStatus(value, fallback = 'warnings') {
  const status = normalizeToken(value, fallback).toLowerCase();
  return REVIEW_STATUSES.includes(status) ? status : fallback;
}

function normalizeCandidate(candidate, fallbackBand) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  return {
    provider: normalizeToken(candidate.provider, 'unknown_provider'),
    score: normalizeNumber(candidate.score ?? candidate.total, 0),
    band: normalizeToken(candidate.band, fallbackBand || 'candidate'),
    reason: normalizeToken(candidate.reason, 'Evidence-first review outcome generated.'),
  };
}

function normalizeArtifactFlag(flag = {}, index = 0) {
  return {
    artifact_id: normalizeToken(flag.artifact_id, `artifact-${index + 1}`),
    status: normalizeToken(flag.status, 'warning'),
    warnings: Array.isArray(flag.warnings) ? flag.warnings.slice() : [],
    blockers: Array.isArray(flag.blockers) ? flag.blockers.slice() : [],
    evidence_refs: Array.isArray(flag.evidence_refs) ? flag.evidence_refs.slice() : [],
  };
}

function normalizeDiagnosticEntry(entry = {}) {
  return {
    code: normalizeToken(entry.code, 'REVIEW_REQUIRED'),
    detail: normalizeToken(entry.detail, 'Manual review is required.'),
    machine_readable: entry.machine_readable !== false,
    severity: normalizeToken(entry.severity, 'warning'),
  };
}

function normalizeReview(review = {}) {
  return {
    status: normalizeDecisionStatus(review.status, 'passed'),
    blocking_reasons: Array.isArray(review.blocking_reasons)
      ? review.blocking_reasons.map((entry) => ({
          code: normalizeToken(entry.code, 'REVIEW_NOTE'),
          detail: normalizeToken(entry.detail, 'Review feedback available.'),
        }))
      : [],
    required_fixes: Array.isArray(review.required_fixes)
      ? unique(review.required_fixes.map((entry) => normalizeToken(entry)).filter(Boolean))
      : [],
  };
}

function normalizeQualityDimensions(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const missing = QUALITY_DIMENSION_KEYS
    .filter((key) => source[key] === undefined)
    .map((key) => `quality_dimensions.${key}`);

  return {
    value: QUALITY_DIMENSION_KEYS.reduce((acc, key) => {
      acc[key] = normalizeNumber(source[key], 0);
      return acc;
    }, {}),
    missing,
  };
}

function normalizeQualityGate(input = {}) {
  const gate = input && typeof input === 'object' ? input : {};
  return {
    status: normalizeDecisionStatus(gate.status, 'warnings'),
    pass_floors: {
      ...QUALITY_DIMENSION_FLOORS,
      ...(gate.pass_floors && typeof gate.pass_floors === 'object' ? gate.pass_floors : {}),
    },
    failed_dimensions: Array.isArray(gate.failed_dimensions) ? gate.failed_dimensions.slice() : [],
    blocking_reasons: Array.isArray(gate.blocking_reasons)
      ? gate.blocking_reasons.map((entry) => ({
          code: normalizeToken(entry.code, 'QUALITY_REVIEW_REQUIRED'),
          detail: normalizeToken(entry.detail, 'Quality review requires follow-up.'),
        }))
      : [],
    required_fixes: Array.isArray(gate.required_fixes)
      ? unique(gate.required_fixes.map((entry) => normalizeToken(entry)).filter(Boolean))
      : [],
  };
}

function normalizeBaselineRegressions(input = {}, envelope = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const missing = BASELINE_REGRESSION_KEYS.filter((key) => {
    if (source[key] !== undefined) return false;
    if ((key === 'read_safe' || key === 'write_disabled') && envelope[key] !== undefined) return false;
    return true;
  }).map((key) => `baseline_regressions.${key}`);

  return {
    value: {
      preview_safe: normalizeBoolean(source.preview_safe, true),
      provenance_required: normalizeBoolean(source.provenance_required, true),
      read_safe: normalizeBoolean(source.read_safe, envelope.read_safe !== false),
      write_disabled: normalizeBoolean(source.write_disabled, envelope.write_disabled !== false),
      route_trace_present: normalizeBoolean(source.route_trace_present, Array.isArray(envelope.route_trace) && envelope.route_trace.length > 0),
      provider_audit_present: normalizeBoolean(source.provider_audit_present, Array.isArray(envelope.provider_attempts) && envelope.provider_attempts.length > 0),
    },
    missing,
  };
}

function normalizeCloseoutReadiness(closeout = {}, decision = 'review_required') {
  let fallbackStatus = 'review_required';
  if (decision === 'promotable') {
    fallbackStatus = 'ready';
  } else if (decision === 'blocked') {
    fallbackStatus = 'blocked';
  }

  return {
    status: normalizeToken(closeout.status, fallbackStatus).toLowerCase(),
    evidence_refs: Array.isArray(closeout.evidence_refs) ? unique(closeout.evidence_refs.map((entry) => normalizeToken(entry)).filter(Boolean)) : [],
    remaining_gaps: Array.isArray(closeout.remaining_gaps) ? unique(closeout.remaining_gaps.map((entry) => normalizeToken(entry)).filter(Boolean)) : [],
  };
}

function buildNextActions(decision) {
  if (decision === 'blocked') {
    return ['inspect_grounding', 'repair_evidence', 'rerun_review'];
  }

  if (decision === 'promotable') {
    return ['human_review', 'manual_accept_or_reject'];
  }

  return ['human_review', 'compare_candidates', 'resolve_warnings'];
}

function createEvaluationEnvelope(input = {}) {
  const decision = normalizeDecision(input.decision);
  const bestCandidate = normalizeCandidate(input.best_candidate, 'winner');
  const runnerUp = normalizeCandidate(input.runner_up, 'runner_up');
  const review = normalizeReview(input.review || input.tailoring_alignment?.review || {});
  const qualityDimensions = normalizeQualityDimensions(input.quality_dimensions);
  const qualityGate = normalizeQualityGate(input.quality_gate);

  const envelope = {
    schema_version: 'phase95.evaluation.v1',
    run_id: normalizeToken(input.run_id, `eval_${Date.now()}`),
    read_safe: input.read_safe !== false,
    write_disabled: input.write_disabled !== false,
    approval_required: true,
    decision,
    best_candidate: bestCandidate,
    runner_up: runnerUp,
    score_breakdown: Array.isArray(input.score_breakdown) ? input.score_breakdown.map((entry) => ({ ...entry })) : [],
    artifact_flags: Array.isArray(input.artifact_flags) ? input.artifact_flags.map(normalizeArtifactFlag) : [],
    governance_diagnostics: Array.isArray(input.governance_diagnostics)
      ? input.governance_diagnostics.map(normalizeDiagnosticEntry)
      : [],
    route_trace: Array.isArray(input.route_trace) ? input.route_trace.map((entry) => ({ ...entry })) : [],
    provider_attempts: Array.isArray(input.provider_attempts) ? input.provider_attempts.map((entry) => ({ ...entry })) : [],
    review,
    quality_dimensions: qualityDimensions.value,
    quality_gate: qualityGate,
    override: input.override && typeof input.override === 'object' ? { ...input.override } : null,
    next_actions: Array.isArray(input.next_actions) && input.next_actions.length > 0 ? input.next_actions.slice() : buildNextActions(decision),
  };

  const baselineRegressions = normalizeBaselineRegressions(input.baseline_regressions, envelope);

  return {
    ...envelope,
    baseline_regressions: baselineRegressions.value,
    closeout_readiness: normalizeCloseoutReadiness(input.closeout_readiness, decision),
    contract_gaps: unique([
      ...(Array.isArray(input.contract_gaps) ? input.contract_gaps : []),
      ...qualityDimensions.missing,
      ...baselineRegressions.missing,
    ]),
  };
}

function validateEvaluationEnvelope(envelope = {}) {
  const missing = [];

  for (const field of ['run_id', 'decision', 'read_safe', 'artifact_flags', 'governance_diagnostics', 'quality_dimensions', 'quality_gate', 'baseline_regressions']) {
    if (envelope[field] === undefined) {
      missing.push(field);
    }
  }

  if (Array.isArray(envelope.contract_gaps)) {
    missing.push(...envelope.contract_gaps);
  }

  for (const key of QUALITY_DIMENSION_KEYS) {
    if (envelope.quality_dimensions?.[key] === undefined) {
      missing.push(`quality_dimensions.${key}`);
    }
  }

  for (const key of BASELINE_REGRESSION_KEYS) {
    if (envelope.baseline_regressions?.[key] === undefined) {
      missing.push(`baseline_regressions.${key}`);
    }
  }

  return {
    valid: unique(missing).length === 0 && VALID_DECISIONS.includes(envelope.decision),
    missing: unique(missing),
  };
}

module.exports = {
  VALID_DECISIONS,
  REVIEW_STATUSES,
  BASELINE_REGRESSION_KEYS,
  createEvaluationEnvelope,
  validateEvaluationEnvelope,
};
