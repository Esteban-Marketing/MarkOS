const test = require('node:test');
const assert = require('node:assert/strict');

const { detectContradictions } = require('../../onboarding/backend/brand-strategy/contradiction-detector.cjs');

function buildConflictingArtifact() {
  return {
    positioning: {
      claim: 'A self-serve platform for rapid launches.',
      evidence_node_ids: ['node-1'],
    },
    value_promise: {
      claim: 'Every customer gets white-glove onboarding.',
      evidence_node_ids: ['node-2'],
    },
    differentiators: [
      {
        claim: 'Affordable for early-stage teams.',
        evidence_node_ids: ['node-3'],
      },
      {
        claim: 'Premium enterprise controls with concierge support.',
        evidence_node_ids: ['node-4'],
      },
    ],
    messaging_pillars: [
      {
        pillar: 'Proof over hype',
        claims: [
          {
            claim: 'Stay explicit about service model boundaries.',
            evidence_node_ids: ['node-5'],
          },
        ],
      },
    ],
    disallowed_claims: [
      {
        claim: 'Guarantee universal outcomes.',
        evidence_node_ids: ['node-6'],
      },
    ],
    confidence_notes: [
      {
        claim: 'Confidence varies by segment maturity.',
        evidence_node_ids: ['node-7'],
      },
    ],
  };
}

test('contradiction detector: emits explicit annotations for conflicting evidence', async () => {
  const artifact = buildConflictingArtifact();
  const annotations = detectContradictions(artifact, { ruleset_version: '74.02.0' });

  assert.ok(Array.isArray(annotations));
  assert.ok(annotations.length >= 2, `Expected at least 2 conflict annotations, got ${annotations.length}`);

  const keys = annotations.map((entry) => entry.conflict_key);
  assert.ok(keys.includes('positioning_service_model_mismatch'));
  assert.ok(keys.includes('price_posture_mismatch'));

  annotations.forEach((entry) => {
    assert.ok(entry.severity === 'high' || entry.severity === 'medium' || entry.severity === 'low');
    assert.ok(Array.isArray(entry.evidence_node_ids));
    assert.ok(entry.evidence_node_ids.length > 0);
    assert.equal(entry.ruleset_version, '74.02.0');
  });
});

test('contradiction detector: deterministic output ordering is stable', async () => {
  const artifact = buildConflictingArtifact();

  const run1 = detectContradictions(artifact, { ruleset_version: '74.02.0' });
  const run2 = detectContradictions(artifact, { ruleset_version: '74.02.0' });

  assert.deepEqual(run1, run2);
});
