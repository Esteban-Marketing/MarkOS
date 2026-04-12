const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  REQUIRED_PRIMITIVES,
  REQUIRED_INTERACTION_STATES,
  validateComponentContractManifest,
} = require('../../onboarding/backend/brand-design-system/component-contract-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');
const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('component contract manifest: required primitives and interaction states are enforced', async () => {
  const payload = loadFixture('manifest-contract-pass.json').component_contract_manifest;
  const result = validateComponentContractManifest(payload);

  assert.equal(result.valid, true, JSON.stringify(result.diagnostics, null, 2));
  assert.deepEqual(REQUIRED_PRIMITIVES, [
    'button',
    'input',
    'select',
    'textarea',
    'card',
    'badge',
    'alert',
    'dialog',
  ]);
  assert.deepEqual(REQUIRED_INTERACTION_STATES, [
    'hover',
    'focus-visible',
    'active',
    'disabled',
    'loading',
  ]);
});

test('component contract manifest: failing fixture is rejected with deterministic diagnostics', async () => {
  const payload = loadFixture('manifest-contract-fail.json').component_contract_manifest;
  const result = validateComponentContractManifest(payload);

  assert.equal(result.valid, false);
  assert.ok(Array.isArray(result.diagnostics));
  assert.ok(result.diagnostics.length >= 3);

  const first = result.diagnostics[0];
  assert.deepEqual(Object.keys(first), [
    'code',
    'severity',
    'path',
    'message',
    'blocking',
    'recommended_fix',
  ]);

  assert.ok(result.diagnostics.some((item) => item.code === 'COMPONENT_PRIMITIVE_MISSING' && item.path === 'primitives.dialog'));
  assert.ok(result.diagnostics.some((item) => item.code === 'COMPONENT_STATE_COVERAGE_MISSING' && item.path === 'primitives[0].required_states'));
  assert.ok(result.diagnostics.some((item) => item.code === 'LINEAGE_POINTER_MISSING' && item.path === 'lineage.identity_fingerprint'));
  assert.ok(result.diagnostics.some((item) => item.code === 'LINEAGE_DECISIONS_MISSING' && item.path === 'lineage.decisions'));
});

test('component contract manifest: missing required primitive fails deterministically', async () => {
  const payload = loadFixture('manifest-contract-pass.json').component_contract_manifest;
  payload.primitives = payload.primitives.filter((entry) => entry.component !== 'dialog');

  const result = validateComponentContractManifest(payload);
  assert.equal(result.valid, false);
  assert.ok(result.diagnostics.some((item) => item.code === 'COMPONENT_PRIMITIVE_MISSING' && item.path === 'primitives.dialog'));
});

test('component contract manifest: tests remain tied to existing submit surface (D-09)', async () => {
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(handlersContent.includes('handleSubmit'), 'Expected submit handler integration surface');
  assert.ok(!handlersContent.includes("'/component-contract'"), 'Plan forbids standalone component-contract route additions in this wave');
});
