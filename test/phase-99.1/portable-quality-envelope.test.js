const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEvaluationReviewBundle } = require('../../onboarding/backend/research/evaluation-review-entrypoint.cjs');
const { createEvaluationEnvelope, validateEvaluationEnvelope } = require('../../onboarding/backend/research/evaluation-contract.cjs');
const { buildPremiumQualityFixture } = require('./fixtures/premium-quality-fixtures.cjs');

test('99.1-01 the same quality payload remains portable across all supported surfaces', () => {
  const fixture = buildPremiumQualityFixture();
  const evaluation = createEvaluationEnvelope({
    run_id: 'phase99.1-portable-envelope',
    decision: 'promotable',
    best_candidate: { provider: 'premium-grounded', score: 93, band: 'winner', reason: 'Strong fit.' },
    runner_up: { provider: 'backup', score: 80, band: 'runner_up', reason: 'Decent fit.' },
    quality_dimensions: fixture.candidate.quality_signals,
    quality_gate: {
      status: 'passed',
      pass_floors: {},
      failed_dimensions: [],
      blocking_reasons: [],
      required_fixes: [],
    },
    baseline_regressions: {
      preview_safe: true,
      provenance_required: true,
      read_safe: true,
      write_disabled: true,
      route_trace_present: true,
      provider_audit_present: true,
    },
  });

  const validation = validateEvaluationEnvelope(evaluation);
  assert.equal(validation.valid, true);

  const bundle = buildEvaluationReviewBundle({ evaluation });
  for (const surface of ['api', 'mcp', 'cli', 'editor', 'internal_automation']) {
    assert.ok(bundle.surfaces[surface], `missing surface ${surface}`);
    assert.deepEqual(bundle.surfaces[surface].payload.quality_dimensions, evaluation.quality_dimensions);
    assert.deepEqual(bundle.surfaces[surface].payload.baseline_regressions, evaluation.baseline_regressions);
  }
});

test('99.1-01 missing quality dimensions or baseline flags fail validation fast', () => {
  const invalid = createEvaluationEnvelope({
    run_id: 'phase99.1-invalid-envelope',
    decision: 'review_required',
    quality_dimensions: {
      personalization_depth: 88,
      icp_fit: 87,
      neuro_fit: 79,
      naturality: 80,
      specificity: 85,
    },
    baseline_regressions: {
      preview_safe: true,
      provenance_required: true,
      read_safe: true,
      write_disabled: true,
      route_trace_present: true,
    },
  });

  const validation = validateEvaluationEnvelope(invalid);
  assert.equal(validation.valid, false);
  assert.ok(validation.missing.includes('quality_dimensions.grounded_usefulness'));
  assert.ok(validation.missing.includes('baseline_regressions.provider_audit_present'));
});
