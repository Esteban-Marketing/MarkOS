const test = require('node:test');
const assert = require('node:assert/strict');

const {
  QUALITY_DIMENSION_FLOORS,
  scoreQualityDimensions,
} = require('../../onboarding/backend/research/evaluation-score-policy.cjs');
const { evaluateResearchRun } = require('../../onboarding/backend/research/run-acceptance-evaluator.cjs');
const {
  buildPremiumQualityFixture,
  buildBorderlineQualityFixture,
} = require('./fixtures/premium-quality-fixtures.cjs');

test('99.1-01 exposes all six NLI-11 quality dimensions with deterministic floors', () => {
  const fixture = buildPremiumQualityFixture();
  const result = scoreQualityDimensions(fixture.candidate, { tailoringGate: { status: 'passed' } });

  assert.deepEqual(Object.keys(result.quality_dimensions).sort(), [
    'grounded_usefulness',
    'icp_fit',
    'naturality',
    'neuro_fit',
    'personalization_depth',
    'specificity',
  ]);

  for (const [dimension, floor] of Object.entries(QUALITY_DIMENSION_FLOORS)) {
    assert.equal(typeof result.quality_dimensions[dimension], 'number');
    assert.ok(result.quality_dimensions[dimension] >= floor, `${dimension} should clear the pass floor`);
  }

  assert.equal(result.quality_gate.status, 'passed');
  assert.deepEqual(result.quality_gate.failed_dimensions, []);
});

test('99.1-01 one weak dimension cannot hide behind a strong total', () => {
  const fixture = buildBorderlineQualityFixture();
  const result = scoreQualityDimensions(fixture.candidate, { tailoringGate: { status: 'passed' } });

  assert.equal(result.quality_gate.status, 'warnings');
  assert.ok(result.quality_gate.failed_dimensions.includes('naturality'));
  assert.ok(result.quality_gate.failed_dimensions.includes('specificity'));
  assert.ok(result.quality_gate.required_fixes.length >= 1);
});

test('99.1-01 evaluation results append the additive quality contract without changing core decision semantics', () => {
  const fixture = buildPremiumQualityFixture();
  const evaluation = evaluateResearchRun({
    run_id: 'phase99.1-quality-pass',
    candidates: [fixture.candidate],
    previews: fixture.previews,
    route_trace: fixture.route_trace,
    provider_attempts: fixture.provider_attempts,
    draft: fixture.draft,
    contextPack: fixture.contextPack,
    reasoning: fixture.reasoning,
  });

  assert.ok(['promotable', 'review_required', 'blocked'].includes(evaluation.decision));
  assert.equal(typeof evaluation.quality_dimensions.personalization_depth, 'number');
  assert.equal(typeof evaluation.baseline_regressions.preview_safe, 'boolean');
  assert.equal(evaluation.quality_gate.pass_floors.naturality, QUALITY_DIMENSION_FLOORS.naturality);
});
