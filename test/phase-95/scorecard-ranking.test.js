const test = require('node:test');
const assert = require('node:assert/strict');

const { rankProviderCandidates } = require('../../onboarding/backend/research/provider-comparison-engine.cjs');

test('95-01 winner and runner-up are ranked by evidence quality first', () => {
  const ranking = rankProviderCandidates([
    {
      provider: 'fast-but-thin',
      grounding: 62,
      evidence_sufficiency: 60,
      personalization: 70,
      delta_safety: 75,
      efficiency: 95,
    },
    {
      provider: 'grounded-winner',
      grounding: 94,
      evidence_sufficiency: 91,
      personalization: 83,
      delta_safety: 88,
      efficiency: 68,
    },
    {
      provider: 'runner-up',
      grounding: 86,
      evidence_sufficiency: 82,
      personalization: 80,
      delta_safety: 81,
      efficiency: 74,
    },
  ]);

  assert.equal(ranking.best_candidate.provider, 'grounded-winner');
  assert.equal(ranking.runner_up.provider, 'runner-up');
  assert.ok(ranking.best_candidate.reason.includes('grounding'));
});
