const test = require('node:test');
const assert = require('node:assert/strict');

const { createTailoringAlignmentEnvelope } = require('../../onboarding/backend/research/tailoring-alignment-contract.cjs');
const { buildEvaluationReviewBundle } = require('../../onboarding/backend/research/evaluation-review-entrypoint.cjs');
const { buildTailoredFixture, buildGenericOutputFixture } = require('./fixtures/generic-vs-tailored-fixtures.cjs');

test('99-01 the same logical review payload survives api, mcp, cli, editor, and internal automation wrappers', () => {
  const tailoredFixture = buildTailoredFixture();
  const genericFixture = buildGenericOutputFixture();
  const alignment = createTailoringAlignmentEnvelope({
    ...tailoredFixture,
    review: genericFixture.review,
  });

  const bundle = buildEvaluationReviewBundle({
    evaluation: {
      run_id: 'phase99-portability',
      decision: 'blocked',
      review: alignment.review,
      tailoring_alignment: alignment,
      best_candidate: { provider: 'tailored-winner', score: 94, band: 'winner', reason: 'High ICP fit.' },
      runner_up: { provider: 'generic-runner-up', score: 65, band: 'runner_up', reason: 'Too broad.' },
      governance_diagnostics: [{ code: 'GENERIC_OUTPUT_BLOCKED', detail: 'Generic sample blocked.', machine_readable: true }],
      artifact_flags: [],
    },
  });

  for (const surface of ['api', 'mcp', 'cli', 'editor', 'internal_automation']) {
    assert.ok(bundle.surfaces[surface], `missing surface ${surface}`);
    assert.equal(bundle.surfaces[surface].payload.review.status, 'rewrite_required');
    assert.equal(bundle.surfaces[surface].payload.tailoring_alignment.reasoning.winner.overlay_key, 'revenue-operators');
  }

  assert.deepEqual(bundle.surfaces.internal_automation.payload.review.required_fixes, alignment.review.required_fixes);
});
