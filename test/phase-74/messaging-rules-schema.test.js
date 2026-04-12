const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  CHANNELS,
  ENERGY_ENUM,
  FORMALITY_ENUM,
  TONE_ENUM,
  validateMessagingRules,
} = require('../../onboarding/backend/brand-strategy/messaging-rules-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('messaging rules: bounded enums and canonical channels are enforced', async () => {
  const payload = loadFixture('strategy-evidence-valid.json').messaging_rules;
  const result = validateMessagingRules(payload);

  assert.equal(result.valid, true, result.errors.join('; '));
  assert.deepEqual(CHANNELS, ['site', 'email', 'social', 'sales-call']);
  assert.ok(TONE_ENUM.includes('pragmatic'));
  assert.ok(FORMALITY_ENUM.includes('professional'));
  assert.ok(ENERGY_ENUM.includes('balanced'));
});

test('messaging rules: invalid enums are rejected', async () => {
  const payload = loadFixture('strategy-evidence-conflict.json').messaging_rules;
  const result = validateMessagingRules(payload);

  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((entry) => entry.includes('voice_profile.tone must be one of')),
    `Expected voice tone enum failure, got: ${result.errors.join('; ')}`
  );
});

test('messaging rules: channel inheritance resolves from canonical voice profile', async () => {
  const payload = loadFixture('strategy-evidence-valid.json').messaging_rules;
  delete payload.channel_rules.site.tone;
  delete payload.channel_rules.site.formality;
  delete payload.channel_rules.site.energy;

  const result = validateMessagingRules(payload);
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.equal(result.resolved_channel_rules.site.tone, payload.voice_profile.tone);
  assert.equal(result.resolved_channel_rules.site.formality, payload.voice_profile.formality);
  assert.equal(result.resolved_channel_rules.site.energy, payload.voice_profile.energy);
});
