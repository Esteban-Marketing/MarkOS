'use strict';

const { createEvaluationEnvelope } = require('./evaluation-contract.cjs');
const { packageEvaluationReview } = require('./evaluation-review-packager.cjs');
const { createTailoringAlignmentEnvelope } = require('./tailoring-alignment-contract.cjs');

function normalizeReview(review = {}) {
  const status = String(review.status || 'passed').trim().toLowerCase();
  return {
    status: ['passed', 'warnings', 'rewrite_required'].includes(status) ? status : 'passed',
    blocking_reasons: Array.isArray(review.blocking_reasons) ? review.blocking_reasons.map((entry) => ({ ...entry })) : [],
    required_fixes: Array.isArray(review.required_fixes) ? review.required_fixes.slice() : [],
  };
}

function buildPortableEvaluation(source = {}, evaluationBase = {}) {
  const review = normalizeReview(
    source.review
      || source.tailoring_alignment?.review
      || source.alignment?.review
      || evaluationBase.review
      || {},
  );

  let tailoringAlignment = source.tailoring_alignment || source.alignment || evaluationBase.tailoring_alignment || null;
  if (tailoringAlignment) {
    try {
      tailoringAlignment = createTailoringAlignmentEnvelope(
        tailoringAlignment.contract_type === 'tailoring_alignment_envelope'
          ? tailoringAlignment
          : { ...tailoringAlignment, review },
      );
    } catch {
      tailoringAlignment = {
        ...tailoringAlignment,
        review,
      };
    }
  }

  const evaluation = createEvaluationEnvelope({
    ...evaluationBase,
    ...source,
    review,
    tailoring_alignment: tailoringAlignment,
    quality_dimensions: source.quality_dimensions || evaluationBase.quality_dimensions,
    quality_gate: source.quality_gate || evaluationBase.quality_gate,
    baseline_regressions: source.baseline_regressions || evaluationBase.baseline_regressions,
    closeout_readiness: source.closeout_readiness || evaluationBase.closeout_readiness,
  });

  return {
    ...evaluation,
    tailoring_alignment: tailoringAlignment,
  };
}

function adaptForSurface(evaluation, reviewPackage, surface) {
  return {
    surface,
    payload: evaluation,
    presentation: {
      title: reviewPackage.headline,
      summary: reviewPackage.summary,
      closeout_status: reviewPackage.closeout_readiness.status,
    },
  };
}

function buildEvaluationReviewBundle(input = {}) {
  const source = input.evaluation || input;
  const evaluationBase = source.read_safe === true
    ? source
    : createEvaluationEnvelope(source);
  const evaluation = buildPortableEvaluation(source, evaluationBase);

  const reviewPackage = packageEvaluationReview(evaluation);

  return {
    read_safe: true,
    write_disabled: true,
    evaluation,
    review_package: reviewPackage,
    surfaces: {
      api: adaptForSurface(evaluation, reviewPackage, 'api'),
      mcp: adaptForSurface(evaluation, reviewPackage, 'mcp'),
      cli: adaptForSurface(evaluation, reviewPackage, 'cli'),
      editor: adaptForSurface(evaluation, reviewPackage, 'editor'),
      internal_automation: adaptForSurface(evaluation, reviewPackage, 'internal_automation'),
    },
  };
}

module.exports = {
  buildEvaluationReviewBundle,
};
