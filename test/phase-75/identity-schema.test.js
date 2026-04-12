const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  REQUIRED_SECTIONS,
  REQUIRED_SEMANTIC_COLOR_ROLES,
  REQUIRED_TYPOGRAPHY_ROLES,
  validateIdentityArtifact,
} = require('../../onboarding/backend/brand-identity/identity-artifact-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');
const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('identity artifact: required canonical sections are enforced', async () => {
  const payload = loadFixture('identity-strategy-pass.json').identity_artifact;
  const result = validateIdentityArtifact(payload);

  assert.equal(result.valid, true, result.errors.join('; '));
  assert.deepEqual(REQUIRED_SECTIONS, [
    'semantic_color_roles',
    'typography_hierarchy',
    'spacing_intent',
    'visual_constraints',
    'lineage',
  ]);
  assert.deepEqual(REQUIRED_SEMANTIC_COLOR_ROLES, [
    'brand.primary',
    'brand.secondary',
    'surface.default',
    'text.primary',
    'text.inverse',
    'state.accent',
  ]);
  assert.deepEqual(REQUIRED_TYPOGRAPHY_ROLES, [
    'type.display',
    'type.heading',
    'type.body',
    'type.caption',
  ]);
});

test('identity artifact: failing fixture is rejected with deterministic errors', async () => {
  const payload = loadFixture('identity-strategy-fail.json').identity_artifact;
  const result = validateIdentityArtifact(payload);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('semantic_color_roles.text.inverse must be a non-empty string'));
  assert.ok(result.errors.includes('lineage.decisions[0].strategy_node_ids must be a non-empty string array'));
});

test('identity artifact: missing canonical section fails fast', async () => {
  const payload = loadFixture('identity-strategy-pass.json').identity_artifact;
  delete payload.visual_constraints;

  const result = validateIdentityArtifact(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Missing required section: visual_constraints'));
});

test('identity artifact: tests remain tied to existing submit surface (D-08)', async () => {
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(handlersContent.includes('handleSubmit'), 'Expected submit handler integration surface');
  assert.ok(!handlersContent.includes("'/identity'"), 'Plan forbids standalone identity route additions in this wave');
});
