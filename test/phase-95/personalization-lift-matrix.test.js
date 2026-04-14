const test = require('node:test');
const assert = require('node:assert/strict');

const { scoreCandidate } = require('../../onboarding/backend/research/evaluation-score-policy.cjs');

test('95-01 personalization lift remains a material score dimension', () => {
  const general = scoreCandidate({
    provider: 'generic',
    grounding: 88,
    evidence_sufficiency: 85,
    personalization: 55,
    delta_safety: 86,
    efficiency: 80,
  });

  const tailored = scoreCandidate({
    provider: 'tailored',
    grounding: 88,
    evidence_sufficiency: 85,
    personalization: 82,
    delta_safety: 86,
    efficiency: 80,
  });

  assert.ok(tailored.total > general.total);
});
