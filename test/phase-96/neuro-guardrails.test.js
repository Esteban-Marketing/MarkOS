const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeNeuroLiteracyMetadata } = require('../../onboarding/backend/research/neuro-literacy-schema.cjs');

test('96-01 schema applies brand-safe defaults and governed trigger allow-list', () => {
  const normalized = normalizeNeuroLiteracyMetadata({
    neuro_trigger_tags: ['B02', 'bad_trigger'],
    neuro_profile: {
      trigger_tags: ['b10', 'bad_trigger'],
      rationale: 'Use authority and trust cues responsibly.',
    },
  });

  assert.deepEqual(normalized.neuro_trigger_tags, ['B02']);
  assert.deepEqual(normalized.neuro_profile.trigger_tags, ['B10']);
  assert.equal(normalized.neuro_profile.evidence_required, true);
  assert.equal(normalized.neuro_profile.manipulation_blocked, true);
  assert.match(normalized.neuro_profile.rationale, /responsibly/i);
});
