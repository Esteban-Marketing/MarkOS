const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  REQUIRED_TOKEN_CATEGORIES,
  REQUIRED_TAILWIND_V4_SECTIONS,
  validateTokenContract,
} = require('../../onboarding/backend/brand-design-system/token-contract-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');
const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('token contract: required categories and tailwind mapping sections are enforced', async () => {
  const payload = loadFixture('token-contract-pass.json').token_contract;
  const result = validateTokenContract(payload);

  assert.equal(result.valid, true, JSON.stringify(result.diagnostics, null, 2));
  assert.deepEqual(REQUIRED_TOKEN_CATEGORIES, [
    'color',
    'typography',
    'spacing',
    'radius',
    'shadow',
    'motion',
  ]);
  assert.deepEqual(REQUIRED_TAILWIND_V4_SECTIONS, ['css_variables', 'theme_extensions']);
});

test('token contract: failing fixture is rejected with deterministic diagnostics', async () => {
  const payload = loadFixture('token-contract-fail.json').token_contract;
  const result = validateTokenContract(payload);

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

  assert.ok(result.diagnostics.some((item) => item.code === 'TOKEN_CATEGORY_MISSING' && item.path === 'categories.motion'));
  assert.ok(result.diagnostics.some((item) => item.code === 'TAILWIND_V4_MAPPING_SECTION_MISSING' && item.path === 'tailwind_v4.css_variables'));
  assert.ok(result.diagnostics.some((item) => item.code === 'LINEAGE_POINTER_MISSING' && item.path === 'lineage.strategy_fingerprint'));
  assert.ok(result.diagnostics.some((item) => item.code === 'LINEAGE_DECISIONS_MISSING' && item.path === 'lineage.decisions'));
});

test('token contract: missing required category fails deterministically', async () => {
  const payload = loadFixture('token-contract-pass.json').token_contract;
  delete payload.categories.motion;

  const result = validateTokenContract(payload);
  assert.equal(result.valid, false);
  assert.ok(result.diagnostics.some((item) => item.code === 'TOKEN_CATEGORY_MISSING' && item.path === 'categories.motion'));
});

test('token contract: tests remain tied to existing submit surface (D-09)', async () => {
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(handlersContent.includes('handleSubmit'), 'Expected submit handler integration surface');
  assert.ok(!handlersContent.includes("'/token-contract'"), 'Plan forbids standalone token-contract route additions in this wave');
});
