const test = require('node:test');
const assert = require('node:assert/strict');

const { flagArtifacts } = require('../../onboarding/backend/research/artifact-governance-flagger.cjs');
const { evaluateResearchRun } = require('../../onboarding/backend/research/run-acceptance-evaluator.cjs');

test('95-02 run-level evaluation preserves artifact-level warnings and blockers', () => {
  const previews = [
    { artifact_id: 'mir-audience', evidence: [{ citation: 'MIR / Canonical' }], contradictions: [], warnings: [] },
    { artifact_id: 'msp-channel', evidence: [], contradictions: [{ topic: 'channel' }], warnings: ['missing citations'] },
  ];

  const flags = flagArtifacts(previews);
  assert.equal(flags[0].status, 'ok');
  assert.equal(flags[1].status, 'blocked');

  const result = evaluateResearchRun({
    run_id: 'run-003',
    candidates: [{ provider: 'internal', grounding: 88, evidence_sufficiency: 85, personalization: 80, delta_safety: 90, efficiency: 75 }],
    previews,
    route_trace: [{ stage: 'internal_approved', status: 'used' }],
    provider_attempts: [{ provider: 'internal', status: 'used' }],
  });

  assert.equal(result.artifact_flags.length, 2);
  assert.equal(result.artifact_flags[1].status, 'blocked');
});
