const test = require('node:test');
const assert = require('node:assert/strict');

const { buildIcpReasoningRecommendation } = require('../../onboarding/backend/research/icp-reasoning-engine.cjs');

function buildFixture() {
  return {
    discipline: 'Paid_Media',
    business_model: 'SaaS',
    funnel_stage: 'decision',
    tenant_scope: 'tenant-alpha-001',
    company: { trust_driver_tags: ['proof'], naturality_tags: ['human'] },
    icp: {
      pain_point_tags: ['high_cac'],
      desired_outcome_tags: ['more_pipeline'],
      trust_driver_tags: ['proof'],
      objection_tags: ['too_expensive'],
      neuro_trigger_tags: ['B04'],
      archetype_tags: ['sage'],
      icp_segment_tags: ['revops_leader'],
    },
    stage: { funnel_stage: 'decision' },
  };
}

test('98-02 reasoning contract remains JSON-safe and portable across surfaces', () => {
  const recommendation = buildIcpReasoningRecommendation(buildFixture());
  const portable = JSON.parse(JSON.stringify(recommendation));

  assert.deepEqual(Object.keys(portable), [
    'version',
    'authority_token',
    'contract_type',
    'input_fingerprint',
    'confidence_flag',
    'candidate_shortlist',
    'winner',
    'explanation',
    'governance',
  ]);
  assert.equal(portable.authority_token, 'MARKOS-REF-NEU-01');
  assert.equal(portable.winner.rank, 1);
  assert.equal(typeof portable.explanation.summary, 'string');
  assert.ok(Array.isArray(portable.candidate_shortlist));
});
