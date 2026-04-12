const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  REQUIRED_ROOT_SECTIONS,
  REQUIRED_APP_SHELL_FIELDS,
  REQUIRED_THEME_MAPPING_SECTIONS,
  validateStarterDescriptor,
} = require('../../onboarding/backend/brand-nextjs/starter-descriptor-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');
const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('starter descriptor: required sections are enforced', async () => {
  const payload = loadFixture('starter-descriptor-pass.json').starter_descriptor;
  const result = validateStarterDescriptor(payload);

  assert.equal(result.valid, true, JSON.stringify(result.diagnostics, null, 2));
  assert.deepEqual(REQUIRED_ROOT_SECTIONS, [
    'app_shell',
    'theme_mappings',
    'component_bindings',
    'integration_metadata',
    'lineage',
  ]);
  assert.deepEqual(REQUIRED_APP_SHELL_FIELDS, ['framework', 'router', 'entry_layout', 'supported_routes']);
  assert.deepEqual(REQUIRED_THEME_MAPPING_SECTIONS, ['css_variables', 'theme_extensions']);
});

test('starter descriptor: failing fixture is rejected with deterministic diagnostics', async () => {
  const payload = loadFixture('starter-descriptor-fail.json').starter_descriptor;
  const result = validateStarterDescriptor(payload);

  assert.equal(result.valid, false);
  assert.ok(Array.isArray(result.diagnostics));
  assert.ok(result.diagnostics.length >= 4);

  const first = result.diagnostics[0];
  assert.deepEqual(Object.keys(first), [
    'code',
    'severity',
    'path',
    'message',
    'blocking',
    'recommended_fix',
  ]);

  assert.ok(result.diagnostics.some((item) => item.code === 'STARTER_THEME_MAPPING_SECTION_MISSING' && item.path === 'theme_mappings.css_variables'));
  assert.ok(result.diagnostics.some((item) => item.code === 'STARTER_COMPONENT_BINDINGS_MISSING' && item.path === 'component_bindings.required_primitives'));
  assert.ok(result.diagnostics.some((item) => item.code === 'STARTER_INTEGRATION_METADATA_MISSING' && item.path === 'integration_metadata.install_steps'));
  assert.ok(result.diagnostics.some((item) => item.code === 'STARTER_LINEAGE_POINTER_MISSING' && item.path === 'lineage.identity_fingerprint'));
});

test('starter descriptor: missing app shell field fails deterministically', async () => {
  const payload = loadFixture('starter-descriptor-pass.json').starter_descriptor;
  delete payload.app_shell.router;

  const result = validateStarterDescriptor(payload);
  assert.equal(result.valid, false);
  assert.ok(result.diagnostics.some((item) => item.code === 'STARTER_APP_SHELL_FIELD_MISSING' && item.path === 'app_shell.router'));
});

test('starter descriptor: tests remain tied to existing submit surface (D-08)', async () => {
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(handlersContent.includes('handleSubmit'), 'Expected submit handler integration surface');
  assert.ok(!handlersContent.includes("'/nextjs-starter'"), 'Plan forbids standalone nextjs starter route additions in this wave');
});
