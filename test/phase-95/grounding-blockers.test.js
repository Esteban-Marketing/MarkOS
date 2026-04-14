const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateResearchRun } = require('../../onboarding/backend/research/run-acceptance-evaluator.cjs');

test('95-02 missing citations or route trace block unsafe promotion', () => {
  const result = evaluateResearchRun({
    run_id: 'run-002',
    candidates: [{ provider: 'openai', grounding: 82, evidence_sufficiency: 80, personalization: 78, delta_safety: 80, efficiency: 70 }],
    previews: [{ artifact_id: 'mir-positioning', evidence: [], contradictions: [] }],
    route_trace: [],
    provider_attempts: [],
  });

  assert.equal(result.decision, 'blocked');
  assert.ok(result.governance_diagnostics.some((entry) => entry.code === 'GROUNDING_BLOCKED'));
});
