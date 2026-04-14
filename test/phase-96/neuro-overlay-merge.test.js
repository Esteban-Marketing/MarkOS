const test = require('node:test');
const assert = require('node:assert/strict');

const { mergeTailoringProfiles } = require('../../onboarding/backend/research/neuro-literacy-overlay.cjs');

test('96-01 overlay merge keeps company, ICP, and stage signals composable and deterministic', () => {
  const merged = mergeTailoringProfiles({
    company: {
      trust_driver_tags: ['proof'],
      naturality_tags: ['human'],
      messages: { tone: 'confident', proof: 'case_studies' },
    },
    icp: {
      trust_driver_tags: ['roi'],
      objection_tags: ['too_expensive'],
      messages: { tone: 'empathetic' },
    },
    stage: {
      emotional_state_tags: ['skeptical'],
      messages: { cta: 'book_demo' },
    },
  });

  assert.deepEqual(merged.trust_driver_tags, ['proof', 'roi']);
  assert.deepEqual(merged.objection_tags, ['too_expensive']);
  assert.deepEqual(merged.emotional_state_tags, ['skeptical']);
  assert.equal(merged.messages.tone, 'empathetic');
  assert.equal(merged.messages.proof, 'case_studies');
  assert.equal(merged.messages.cta, 'book_demo');
  assert.deepEqual(merged.layer_order, ['company', 'icp', 'stage']);
});
