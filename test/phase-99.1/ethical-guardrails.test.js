const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateQualityCloseoutGate } = require('../../onboarding/backend/research/quality-closeout-gate.cjs');
const { buildManipulativeQualityFixture } = require('./fixtures/premium-quality-fixtures.cjs');

test('99.1-02 manipulative or unsupported neuro language fails closed', () => {
  const fixture = buildManipulativeQualityFixture();
  const result = evaluateQualityCloseoutGate({
    draft: fixture.draft,
    candidate: fixture.candidate,
    previews: fixture.previews,
    route_trace: fixture.route_trace,
    provider_attempts: fixture.provider_attempts,
    contextPack: fixture.contextPack,
    reasoning: fixture.reasoning,
  });

  assert.equal(result.decision, 'blocked');
  assert.ok(result.quality_gate.blocking_reasons.some((entry) => /MANIPULATIVE|UNSUPPORTED_NEURO/.test(entry.code)));
  assert.ok(result.governance_diagnostics.some((entry) => entry.severity === 'blocker'));
});
