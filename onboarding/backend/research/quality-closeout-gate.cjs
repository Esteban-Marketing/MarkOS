'use strict';

const { createEvaluationEnvelope } = require('./evaluation-contract.cjs');
const { collectRunDiagnostics, hasBlockingDiagnostics } = require('./evaluation-diagnostics.cjs');
const { scoreQualityDimensions } = require('./evaluation-score-policy.cjs');
const { evaluateTailoringReviewGate } = require('./tailoring-review-gates.cjs');

const REQUIRED_BASELINE_KEYS = Object.freeze([
  'preview_safe',
  'provenance_required',
  'read_safe',
  'write_disabled',
  'route_trace_present',
  'provider_audit_present',
]);

function uniqueStrings(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function uniqueReasons(values = []) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).filter((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const key = `${entry.code}:${entry.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return value === true;
}

function buildBaselineRegressions(input = {}) {
  const source = input.baseline_regressions && typeof input.baseline_regressions === 'object'
    ? input.baseline_regressions
    : {};

  return {
    preview_safe: normalizeBoolean(source.preview_safe, true),
    provenance_required: normalizeBoolean(source.provenance_required, true),
    read_safe: normalizeBoolean(source.read_safe, input.read_safe !== false),
    write_disabled: normalizeBoolean(source.write_disabled, input.write_disabled !== false),
    route_trace_present: normalizeBoolean(source.route_trace_present, Array.isArray(input.route_trace) && input.route_trace.length > 0),
    provider_audit_present: normalizeBoolean(source.provider_audit_present, Array.isArray(input.provider_attempts) && input.provider_attempts.length > 0),
  };
}

function listBaselineFailures(flags = {}) {
  return REQUIRED_BASELINE_KEYS.filter((key) => flags[key] !== true);
}

function buildBaselineFixes(failed = []) {
  const fixes = {
    preview_safe: 'Restore preview-safe behavior so the evaluation remains informational and non-mutating.',
    provenance_required: 'Restore evidence provenance requirements before promotion can proceed.',
    read_safe: 'Keep the review bundle read-safe across all supported surfaces.',
    write_disabled: 'Preserve write-disabled behavior for all evaluation surfaces.',
    route_trace_present: 'Restore the route trace so the evaluation remains auditable.',
    provider_audit_present: 'Restore provider attempt audit evidence before closeout.',
  };

  return failed.map((key) => fixes[key]).filter(Boolean);
}

function buildCloseoutReadiness(decision, blockingReasons = [], requiredFixes = []) {
  return {
    status: decision === 'promotable'
      ? 'ready'
      : decision === 'blocked'
        ? 'blocked'
        : 'review_required',
    evidence_refs: [
      'node --test test/phase-95/*.test.js test/phase-98/*.test.js test/phase-99/*.test.js test/phase-99.1/*.test.js',
    ],
    remaining_gaps: decision === 'promotable'
      ? []
      : uniqueStrings([
          ...blockingReasons.map((entry) => entry.detail),
          ...requiredFixes,
        ]),
  };
}

function evaluateQualityCloseoutGate(input = {}) {
  const routeTrace = Array.isArray(input.route_trace) ? input.route_trace : [];
  const providerAttempts = Array.isArray(input.provider_attempts) ? input.provider_attempts : [];
  const previews = Array.isArray(input.previews) ? input.previews : [];
  const draft = input.draft || input.output || input.text || '';

  const tailoringGate = evaluateTailoringReviewGate({
    draft,
    output: draft,
    envelope: input.envelope,
    contextPack: input.contextPack || input.context_pack,
    reasoning: input.reasoning,
    review: input.review,
  });

  const quality = scoreQualityDimensions(input.candidate || input.best_candidate || {}, { tailoringGate });
  const governanceDiagnostics = collectRunDiagnostics({
    previews,
    route_trace: routeTrace,
    provider_attempts: providerAttempts,
    draft,
  });

  const baselineRegressions = buildBaselineRegressions({
    ...input,
    route_trace: routeTrace,
    provider_attempts: providerAttempts,
  });
  const failedBaselines = listBaselineFailures(baselineRegressions);

  const blockingReasons = uniqueReasons([
    ...(Array.isArray(quality.quality_gate.blocking_reasons) ? quality.quality_gate.blocking_reasons : []),
    ...(Array.isArray(tailoringGate.blocking_reasons) ? tailoringGate.blocking_reasons : []),
    ...governanceDiagnostics
      .filter((entry) => entry.severity === 'blocker')
      .map((entry) => ({ code: entry.code, detail: entry.detail })),
    ...(failedBaselines.length > 0
      ? [{
          code: 'BASELINE_REGRESSION',
          detail: `Governance baseline regressions detected: ${failedBaselines.join(', ')}`,
        }]
      : []),
  ]);

  const requiredFixes = uniqueStrings([
    ...(Array.isArray(quality.quality_gate.required_fixes) ? quality.quality_gate.required_fixes : []),
    ...(Array.isArray(tailoringGate.required_fixes) ? tailoringGate.required_fixes : []),
    ...buildBaselineFixes(failedBaselines),
  ]);

  const reviewStatus = blockingReasons.length > 0
    ? 'rewrite_required'
    : quality.quality_gate.failed_dimensions.length > 0
      ? 'warnings'
      : 'passed';

  const decision = failedBaselines.length > 0 || hasBlockingDiagnostics(governanceDiagnostics) || reviewStatus === 'rewrite_required'
    ? 'blocked'
    : quality.quality_gate.failed_dimensions.length > 0
      ? 'review_required'
      : 'promotable';

  return createEvaluationEnvelope({
    run_id: input.run_id,
    read_safe: true,
    write_disabled: true,
    decision,
    best_candidate: input.best_candidate || {
      provider: String(input.candidate?.provider || 'unknown_provider'),
      score: Number(input.candidate?.score || input.candidate?.total || quality.overall_score || 0),
      band: 'winner',
      reason: 'Evaluated through the additive Phase 99.1 quality closeout gate.',
    },
    runner_up: input.runner_up || null,
    score_breakdown: Array.isArray(input.score_breakdown) ? input.score_breakdown : [],
    artifact_flags: Array.isArray(input.artifact_flags) ? input.artifact_flags : [],
    governance_diagnostics: governanceDiagnostics,
    route_trace: routeTrace,
    provider_attempts: providerAttempts,
    override: input.override || null,
    review: {
      status: reviewStatus,
      blocking_reasons: blockingReasons,
      required_fixes: requiredFixes,
    },
    quality_dimensions: quality.quality_dimensions,
    quality_gate: {
      ...quality.quality_gate,
      status: reviewStatus,
      blocking_reasons: blockingReasons,
      required_fixes: requiredFixes,
    },
    baseline_regressions: baselineRegressions,
    closeout_readiness: buildCloseoutReadiness(decision, blockingReasons, requiredFixes),
  });
}

module.exports = {
  REQUIRED_BASELINE_KEYS,
  evaluateQualityCloseoutGate,
};
