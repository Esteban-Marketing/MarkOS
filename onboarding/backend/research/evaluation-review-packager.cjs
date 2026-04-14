'use strict';

function normalizeReview(review = {}) {
  const status = String(review.status || 'passed').trim().toLowerCase();
  return {
    status: ['passed', 'warnings', 'rewrite_required'].includes(status) ? status : 'passed',
    blocking_reasons: Array.isArray(review.blocking_reasons) ? review.blocking_reasons : [],
    required_fixes: Array.isArray(review.required_fixes) ? review.required_fixes : [],
  };
}

function normalizeCloseoutReadiness(closeout = {}, decision = 'review_required') {
  const fallbackStatus = decision === 'promotable'
    ? 'ready'
    : decision === 'blocked'
      ? 'blocked'
      : 'review_required';

  return {
    status: String(closeout.status || fallbackStatus).trim().toLowerCase(),
    evidence_refs: Array.isArray(closeout.evidence_refs) ? closeout.evidence_refs : [],
    remaining_gaps: Array.isArray(closeout.remaining_gaps) ? closeout.remaining_gaps : [],
  };
}

function packageEvaluationReview(evaluation = {}) {
  const review = normalizeReview(evaluation.review || evaluation.tailoring_alignment?.review || {});
  const reviewStatus = review.status || 'passed';
  const closeoutReadiness = normalizeCloseoutReadiness(evaluation.closeout_readiness, evaluation.decision);

  return {
    headline: `Evaluation review for ${evaluation.run_id || 'unknown_run'}`,
    summary: `Decision: ${evaluation.decision || 'review_required'}. Quality review: ${reviewStatus}. Closeout readiness: ${closeoutReadiness.status}. Review the scorecard, governance diagnostics, and any required fixes before any manual action.`,
    ranking: {
      best_candidate: evaluation.best_candidate || null,
      runner_up: evaluation.runner_up || null,
      score_breakdown: Array.isArray(evaluation.score_breakdown) ? evaluation.score_breakdown : [],
    },
    quality: {
      dimensions: evaluation.quality_dimensions || {},
      gate: evaluation.quality_gate || {},
      baseline_regressions: evaluation.baseline_regressions || {},
    },
    governance: {
      decision: evaluation.decision || 'review_required',
      diagnostics: Array.isArray(evaluation.governance_diagnostics) ? evaluation.governance_diagnostics : [],
      override: evaluation.override || null,
      next_actions: Array.isArray(evaluation.next_actions) ? evaluation.next_actions : [],
    },
    review,
    artifact_review: Array.isArray(evaluation.artifact_flags) ? evaluation.artifact_flags : [],
    closeout_readiness: closeoutReadiness,
    audit: {
      route_trace: Array.isArray(evaluation.route_trace) ? evaluation.route_trace : [],
      provider_attempts: Array.isArray(evaluation.provider_attempts) ? evaluation.provider_attempts : [],
      read_safe: evaluation.read_safe === true,
    },
  };
}

module.exports = {
  packageEvaluationReview,
};
