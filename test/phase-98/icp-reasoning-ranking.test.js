const test = require('node:test');
const assert = require('node:assert/strict');

const { buildIcpReasoningRecommendation } = require('../../onboarding/backend/research/icp-reasoning-engine.cjs');

function buildFixture(overrides = {}) {
  return {
    discipline: 'Paid_Media',
    business_model: 'SaaS',
    funnel_stage: 'decision',
    tenant_scope: 'tenant-alpha-001',
    company: {
      trust_driver_tags: ['proof'],
      naturality_tags: ['human'],
      company_tailoring_profile: { proof_posture: 'evidence_first' },
    },
    icp: {
      pain_point_tags: ['high_cac'],
      desired_outcome_tags: ['more_pipeline'],
      trust_driver_tags: ['proof'],
      trust_blocker_tags: ['complexity'],
      objection_tags: ['too_expensive'],
      emotional_state_tags: ['skeptical'],
      neuro_trigger_tags: ['B04'],
      archetype_tags: ['sage'],
      icp_segment_tags: ['revops_leader'],
    },
    stage: {
      funnel_stage: 'decision',
      emotional_state_tags: ['cautious'],
    },
    ...overrides,
  };
}

test('98-01 same input yields the same shortlist order and rank-1 winner', () => {
  const first = buildIcpReasoningRecommendation(buildFixture());
  const second = buildIcpReasoningRecommendation(buildFixture());

  assert.equal(first.contract_type, 'icp_reasoning_recommendation');
  assert.equal(first.authority_token, 'MARKOS-REF-NEU-01');
  assert.equal(first.winner.rank, 1);
  assert.equal(first.winner.overlay_key, 'saas');
  assert.ok(first.winner.retrieval_filters.icp_segment_tags.includes('revops_leader'));
  assert.deepEqual(
    first.candidate_shortlist.map((entry) => [entry.rank, entry.candidate_id, entry.overlay_key]),
    second.candidate_shortlist.map((entry) => [entry.rank, entry.candidate_id, entry.overlay_key])
  );
  assert.match(first.explanation.summary, /proof|trust|pipeline/i);
});

test('98-01 mixed evidence still returns a winner with explicit uncertainty', () => {
  const result = buildIcpReasoningRecommendation(buildFixture({
    icp: {
      pain_point_tags: ['high_cac'],
      desired_outcome_tags: ['more_pipeline'],
      trust_driver_tags: ['proof'],
      trust_blocker_tags: ['complexity', 'skepticism'],
      objection_tags: ['too_expensive', 'too_complex'],
      neuro_trigger_tags: ['B04', 'B07'],
      archetype_tags: ['sage', 'hero'],
      icp_segment_tags: ['revops_leader'],
    },
  }));

  assert.ok(result.winner);
  assert.match(result.confidence_flag, /high|medium|low/);
  assert.ok(Array.isArray(result.explanation.uncertainty));
  assert.ok(result.explanation.uncertainty.length >= 1);
  assert.equal(result.winner.rank, 1);
});
