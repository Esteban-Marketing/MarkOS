const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEvaluationReviewBundle } = require('../../onboarding/backend/research/evaluation-review-entrypoint.cjs');
const { evaluateQualityCloseoutGate } = require('../../onboarding/backend/research/quality-closeout-gate.cjs');
const {
  buildPremiumQualityFixture,
  buildBaselineRegressionFixture,
} = require('./fixtures/premium-quality-fixtures.cjs');

test('99.1-03 the final review bundle carries closeout readiness evidence across all surfaces', () => {
  const fixture = buildPremiumQualityFixture();
  const evaluation = evaluateQualityCloseoutGate({
    run_id: 'phase99.1-closeout-pass',
    draft: fixture.draft,
    candidate: fixture.candidate,
    previews: fixture.previews,
    route_trace: fixture.route_trace,
    provider_attempts: fixture.provider_attempts,
    contextPack: fixture.contextPack,
    reasoning: fixture.reasoning,
  });

  const bundle = buildEvaluationReviewBundle({ evaluation });

  assert.equal(bundle.review_package.closeout_readiness.status, 'ready');
  assert.ok(bundle.review_package.closeout_readiness.evidence_refs.length >= 1);

  for (const surface of ['api', 'mcp', 'cli', 'editor', 'internal_automation']) {
    assert.deepEqual(bundle.surfaces[surface].payload.closeout_readiness, bundle.evaluation.closeout_readiness);
  }
});

test('99.1-03 the closeout bundle exposes exact remaining gaps when promotion is blocked', () => {
  const fixture = buildBaselineRegressionFixture();
  const evaluation = evaluateQualityCloseoutGate({
    run_id: 'phase99.1-closeout-blocked',
    draft: fixture.draft,
    candidate: fixture.candidate,
    previews: fixture.previews,
    route_trace: fixture.route_trace,
    provider_attempts: fixture.provider_attempts,
    contextPack: fixture.contextPack,
    reasoning: fixture.reasoning,
    baseline_regressions: fixture.baseline_regressions,
  });

  const bundle = buildEvaluationReviewBundle({ evaluation });
  assert.equal(bundle.review_package.closeout_readiness.status, 'blocked');
  assert.ok(bundle.review_package.closeout_readiness.remaining_gaps.length >= 1);
  assert.equal(bundle.read_safe, true);
  assert.equal(bundle.write_disabled, true);
});
