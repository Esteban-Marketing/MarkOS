const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { compileMessagingRules } = require('../../onboarding/backend/brand-strategy/messaging-rules-compiler.cjs');
const { detectContradictions } = require('../../onboarding/backend/brand-strategy/contradiction-detector.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

function buildCanonicalArtifact() {
  const fixture = loadFixture('strategy-evidence-valid.json').strategy_artifact;
  return {
    ...fixture,
    ruleset_version: '74.03.0',
    conflict_annotations: detectContradictions(fixture, { ruleset_version: '74.03.0' }),
  };
}

test('messaging compiler: every channel inherits one canonical voice profile', async () => {
  const payload = loadFixture('strategy-evidence-valid.json').messaging_rules;
  const artifact = buildCanonicalArtifact();

  const compiled = compileMessagingRules(artifact, payload, { ruleset_version: '74.03.0' });

  assert.equal(compiled.voice_profile.tone, 'pragmatic');
  assert.equal(compiled.voice_profile.formality, 'professional');
  assert.equal(compiled.voice_profile.energy, 'balanced');

  assert.equal(compiled.channel_rules.site.tone, 'pragmatic');
  assert.equal(compiled.channel_rules.site.formality, 'professional');
  assert.equal(compiled.channel_rules.site.energy, 'balanced');

  assert.equal(compiled.channel_rules.email.tone, 'empathetic');
  assert.equal(compiled.channel_rules.social.energy, 'high');
  assert.equal(compiled.channel_rules['sales-call'].formality, 'executive');
});

test('messaging compiler: contradiction annotations are consistent across channels', async () => {
  const payload = loadFixture('strategy-evidence-valid.json').messaging_rules;
  const artifact = {
    ...buildCanonicalArtifact(),
    positioning: {
      claim: 'A self-serve path for teams that need speed.',
      evidence_node_ids: ['node-a'],
    },
    value_promise: {
      claim: 'Every customer gets white-glove onboarding.',
      evidence_node_ids: ['node-b'],
    },
    differentiators: [
      { claim: 'Affordable by default.', evidence_node_ids: ['node-c'] },
      { claim: 'Premium enterprise controls.', evidence_node_ids: ['node-d'] },
    ],
  };
  artifact.conflict_annotations = detectContradictions(artifact, { ruleset_version: '74.03.0' });

  const compiled = compileMessagingRules(artifact, payload, { ruleset_version: '74.03.0' });
  const channels = ['site', 'email', 'social', 'sales-call'];

  assert.ok(artifact.conflict_annotations.length >= 2);

  channels.forEach((channel) => {
    assert.deepEqual(
      compiled.channel_rules[channel].contradiction_annotations,
      compiled.channel_rules.site.contradiction_annotations
    );
  });

  assert.ok(
    compiled.channel_rules.site.contradiction_annotations.some((entry) => entry.conflict_key === 'positioning_service_model_mismatch')
  );
  assert.ok(
    compiled.channel_rules.site.contradiction_annotations.some((entry) => entry.conflict_key === 'price_posture_mismatch')
  );
});
