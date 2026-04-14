const test = require('node:test');
const assert = require('node:assert/strict');

const { createEvaluationEnvelope } = require('../../onboarding/backend/research/evaluation-contract.cjs');

test('95-01 evaluation contract is read-safe and portable', () => {
  const envelope = createEvaluationEnvelope({
    run_id: 'run-001',
    best_candidate: { provider: 'internal+openai', score: 84, band: 'winner', reason: 'Best grounding and personalization fit.' },
    runner_up: { provider: 'tavily+vault', score: 78, band: 'runner_up', reason: 'Strong freshness, slightly weaker grounding.' },
    decision: 'review_required',
    score_breakdown: [{ provider: 'internal+openai', total: 84 }],
    artifact_flags: [{ artifact_id: 'mir-audience', status: 'ok', warnings: [], blockers: [] }],
    governance_diagnostics: [{ code: 'GROUNDING_REVIEW_REQUIRED', detail: 'Citation quality needs review.', machine_readable: true }],
  });

  assert.equal(envelope.read_safe, true);
  assert.equal(envelope.decision, 'review_required');
  assert.equal(envelope.best_candidate.provider, 'internal+openai');
  assert.equal(envelope.runner_up.provider, 'tavily+vault');
  assert.equal(envelope.override, null);
});
