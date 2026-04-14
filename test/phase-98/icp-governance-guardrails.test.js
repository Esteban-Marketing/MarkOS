const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeIcpSignals } = require('../../onboarding/backend/research/icp-signal-normalizer.cjs');
const { createIcpRecommendation } = require('../../onboarding/backend/research/icp-recommendation-contract.cjs');

test('98-01 signal normalization strips unsupported triggers and archetypes', () => {
  const normalized = normalizeIcpSignals({
    tenant_scope: 'tenant-alpha-001',
    icp: {
      neuro_trigger_tags: ['B04', 'bad_trigger', 'B99'],
      archetype_tags: ['sage', 'made_up_arch'],
    },
  });

  assert.deepEqual(normalized.neuro_trigger_tags, ['B04']);
  assert.deepEqual(normalized.archetype_tags, ['sage']);
  assert.equal(normalized.neuro_profile.manipulation_blocked, true);
  assert.equal(normalized.neuro_profile.evidence_required, true);
});

test('98-01 portable contract rejects missing confidence and ungoverned triggers', () => {
  assert.throws(
    () => createIcpRecommendation({
      input: { tenant_scope: 'tenant-alpha-001' },
      candidate_shortlist: [],
      winner: null,
      confidence_flag: '',
    }),
    (error) => error?.code === 'E_ICP_CONFIDENCE_FLAG_REQUIRED'
  );

  assert.throws(
    () => createIcpRecommendation({
      input: { tenant_scope: 'tenant-alpha-001' },
      confidence_flag: 'high',
      candidate_shortlist: [{
        rank: 1,
        candidate_id: 'bad-candidate',
        overlay_key: 'saas',
        score: 91,
        confidence: 'high',
        primary_trigger: 'B99',
        archetype: 'sage',
        retrieval_filters: { tenant_scope: 'tenant-alpha-001' },
        matched_signals: { trust_driver_tags: ['proof'] },
        why_it_fits: 'invalid test payload',
      }],
      winner: {
        rank: 1,
        candidate_id: 'bad-candidate',
        overlay_key: 'saas',
        score: 91,
        confidence: 'high',
        primary_trigger: 'B99',
        archetype: 'sage',
        retrieval_filters: { tenant_scope: 'tenant-alpha-001' },
        matched_signals: { trust_driver_tags: ['proof'] },
        why_it_fits_summary: 'invalid test payload',
      },
    }),
    (error) => error?.code === 'E_ICP_TRIGGER_NOT_GOVERNED'
  );
});
