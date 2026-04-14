const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEvaluationReviewBundle } = require('../../onboarding/backend/research/evaluation-review-entrypoint.cjs');
const { createEvaluationEnvelope } = require('../../onboarding/backend/research/evaluation-contract.cjs');

test('95-03 review bundle preserves the same semantics across all supported surfaces', () => {
  const evaluation = createEvaluationEnvelope({
    run_id: 'run-004',
    best_candidate: { provider: 'grounded-winner', score: 88, band: 'winner', reason: 'Strong grounding and personalization.' },
    runner_up: { provider: 'runner-up', score: 80, band: 'runner_up', reason: 'Slightly weaker grounding.' },
    decision: 'review_required',
    score_breakdown: [],
    artifact_flags: [{ artifact_id: 'mir-audience', status: 'ok', warnings: [], blockers: [] }],
    governance_diagnostics: [{ code: 'GROUNDING_REVIEW_REQUIRED', detail: 'Review needed.', machine_readable: true }],
  });

  const bundle = buildEvaluationReviewBundle({ evaluation });
  assert.equal(bundle.surfaces.api.payload.decision, 'review_required');
  assert.equal(bundle.surfaces.cli.payload.best_candidate.provider, 'grounded-winner');
  assert.equal(bundle.surfaces.mcp.payload.read_safe, true);
  assert.equal(bundle.surfaces.editor.payload.runner_up.provider, 'runner-up');
});
