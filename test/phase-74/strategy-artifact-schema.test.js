const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { REQUIRED_SECTIONS, validateStrategyArtifact } = require('../../onboarding/backend/brand-strategy/strategy-artifact-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');
const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('strategy artifact: required canonical sections are enforced', async () => {
  const payload = loadFixture('strategy-evidence-valid.json').strategy_artifact;
  const result = validateStrategyArtifact(payload);

  assert.equal(result.valid, true, result.errors.join('; '));
  assert.deepEqual(REQUIRED_SECTIONS, [
    'positioning',
    'value_promise',
    'differentiators',
    'messaging_pillars',
    'disallowed_claims',
    'confidence_notes',
  ]);
});

test('strategy artifact: missing canonical section fails deterministically', async () => {
  const payload = loadFixture('strategy-evidence-valid.json').strategy_artifact;
  delete payload.value_promise;

  const result = validateStrategyArtifact(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Missing required section: value_promise'));
});

test('strategy artifact: tests remain tied to existing submit surface (D-09)', async () => {
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(handlersContent.includes('handleSubmit'), 'Expected submit handler integration surface');
  assert.ok(!handlersContent.includes("'/strategy'"), 'Plan forbids standalone strategy route additions in this wave');
});
