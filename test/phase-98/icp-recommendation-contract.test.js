const test = require('node:test');
const assert = require('node:assert/strict');

const { createIcpRecommendation } = require('../../onboarding/backend/research/icp-recommendation-contract.cjs');

test('98-01 recommendation contract returns the portable shortlist-plus-winner shape', () => {
  const result = createIcpRecommendation({
    input: { tenant_scope: 'tenant-alpha-001', business_model: 'SaaS' },
    confidence_flag: 'high',
    candidate_shortlist: [{
      rank: 1,
      candidate_id: 'saas-sage-B04',
      overlay_key: 'saas',
      score: 92,
      confidence: 'high',
      primary_trigger: 'B04',
      archetype: 'sage',
      retrieval_filters: {
        tenant_scope: 'tenant-alpha-001',
        icp_segment_tags: ['revops_leader'],
        trust_driver_tags: ['proof'],
      },
      matched_signals: {
        pain_point_tags: ['high_cac'],
        trust_driver_tags: ['proof'],
      },
      why_it_fits: 'Strong proof posture and operator-trust fit.',
      warnings: [],
    }],
    winner: {
      rank: 1,
      candidate_id: 'saas-sage-B04',
      overlay_key: 'saas',
      score: 92,
      confidence: 'high',
      primary_trigger: 'B04',
      archetype: 'sage',
      retrieval_filters: {
        tenant_scope: 'tenant-alpha-001',
        icp_segment_tags: ['revops_leader'],
        trust_driver_tags: ['proof'],
      },
      matched_signals: {
        pain_point_tags: ['high_cac'],
        trust_driver_tags: ['proof'],
      },
      why_it_fits_summary: 'Strong proof posture and operator-trust fit.',
    },
    explanation: {
      summary: 'Proof-led messaging best fits this ICP.',
      runner_up_reason: 'Consulting overlay ranked lower because trust blockers remained unresolved.',
      uncertainty: [],
    },
  });

  assert.deepEqual(Object.keys(result), [
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
  assert.equal(result.contract_type, 'icp_reasoning_recommendation');
  assert.equal(result.winner.overlay_key, 'saas');
  assert.equal(result.governance.manipulation_blocked, true);
  assert.equal(result.governance.provenance_required, true);
});
