const test = require('node:test');
const assert = require('node:assert/strict');

const { createEvaluationEnvelope } = require('../../onboarding/backend/research/evaluation-contract.cjs');

test('95-01 provider audit and allow-list signals remain visible in the envelope', () => {
  const envelope = createEvaluationEnvelope({
    run_id: 'run-allowlist',
    best_candidate: { provider: 'tavily+vault', score: 79, band: 'winner', reason: 'Allowed-domain evidence is grounded.' },
    runner_up: null,
    decision: 'review_required',
    score_breakdown: [],
    artifact_flags: [],
    governance_diagnostics: [],
    provider_attempts: [{ provider: 'tavily', status: 'used', allowed_domains: ['example.com'] }],
  });

  assert.equal(envelope.provider_attempts[0].provider, 'tavily');
  assert.deepEqual(envelope.provider_attempts[0].allowed_domains, ['example.com']);
});
