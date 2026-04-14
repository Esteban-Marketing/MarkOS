const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateQualityCloseoutGate } = require('../../onboarding/backend/research/quality-closeout-gate.cjs');
const { buildBaselineRegressionFixture } = require('./fixtures/premium-quality-fixtures.cjs');

test('99.1-02 preview-safe, provenance, and audit baseline regressions hard-block closeout', () => {
  const fixture = buildBaselineRegressionFixture();
  const result = evaluateQualityCloseoutGate({
    draft: fixture.draft,
    candidate: fixture.candidate,
    previews: fixture.previews,
    route_trace: fixture.route_trace,
    provider_attempts: fixture.provider_attempts,
    contextPack: fixture.contextPack,
    reasoning: fixture.reasoning,
    baseline_regressions: fixture.baseline_regressions,
  });

  assert.equal(result.decision, 'blocked');
  assert.equal(result.baseline_regressions.preview_safe, false);
  assert.equal(result.baseline_regressions.provider_audit_present, false);
  assert.ok(result.quality_gate.blocking_reasons.some((entry) => entry.code === 'BASELINE_REGRESSION'));
});
