const test = require('node:test');
const assert = require('node:assert/strict');

const {
  NEURO_TRIGGER_IDS,
  normalizeNeuroAwareTaxonomy,
} = require('../../onboarding/backend/research/neuro-literacy-taxonomy.cjs');

test('96-01 taxonomy normalizes additive neuro-aware tag families deterministically', () => {
  const normalized = normalizeNeuroAwareTaxonomy({
    desired_outcome_tags: ['more_pipeline', ' more_pipeline '],
    objection_tags: ['too_expensive'],
    trust_driver_tags: ['proof', 'proof'],
    emotional_state_tags: ['skeptical'],
    naturality_tags: ['human', 'human'],
    icp_segment_tags: ['revops_leader', 'revops_leader'],
    neuro_trigger_tags: ['b03', 'B01', 'unsupported'],
  });

  assert.deepEqual(NEURO_TRIGGER_IDS, ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10']);
  assert.deepEqual(normalized.desired_outcome_tags, ['more_pipeline']);
  assert.deepEqual(normalized.trust_driver_tags, ['proof']);
  assert.deepEqual(normalized.naturality_tags, ['human']);
  assert.deepEqual(normalized.icp_segment_tags, ['revops_leader']);
  assert.deepEqual(normalized.neuro_trigger_tags, ['B01', 'B03']);
});
