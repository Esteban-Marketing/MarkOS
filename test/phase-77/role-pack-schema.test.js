const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  REQUIRED_ROLES,
  REQUIRED_ROLE_SECTIONS,
  validateRoleHandoffPack,
} = require('../../onboarding/backend/brand-nextjs/role-handoff-pack-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');
const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('role handoff pack: required roles and sections are enforced', async () => {
  const payload = loadFixture('role-pack-pass.json').role_pack_contract;
  const result = validateRoleHandoffPack(payload);

  assert.equal(result.valid, true, JSON.stringify(result.diagnostics, null, 2));
  assert.deepEqual(REQUIRED_ROLES, [
    'strategist',
    'designer',
    'founder_operator',
    'frontend_engineer',
    'content_marketing',
  ]);
  assert.deepEqual(REQUIRED_ROLE_SECTIONS, [
    'immediate_next_actions',
    'immutable_constraints',
    'acceptance_checks',
    'lineage',
  ]);
});

test('role handoff pack: failing fixture is rejected with deterministic diagnostics', async () => {
  const payload = loadFixture('role-pack-fail.json').role_pack_contract;
  const result = validateRoleHandoffPack(payload);

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

  assert.ok(result.diagnostics.some((item) => item.code === 'ROLE_PACK_MISSING' && item.path === 'role_packs.content_marketing'));
  assert.ok(result.diagnostics.some((item) => item.code === 'ROLE_SECTION_MISSING' && item.path === 'role_packs.designer.immediate_next_actions'));
  assert.ok(result.diagnostics.some((item) => item.code === 'ROLE_LINEAGE_POINTER_MISSING' && item.path === 'role_packs.founder_operator.lineage.source_artifacts'));
});

test('role handoff pack: missing required role fails deterministically', async () => {
  const payload = loadFixture('role-pack-pass.json').role_pack_contract;
  delete payload.role_packs.frontend_engineer;

  const result = validateRoleHandoffPack(payload);
  assert.equal(result.valid, false);
  assert.ok(result.diagnostics.some((item) => item.code === 'ROLE_PACK_MISSING' && item.path === 'role_packs.frontend_engineer'));
});

test('role handoff pack: tests remain tied to existing submit surface (D-08)', async () => {
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(handlersContent.includes('handleSubmit'), 'Expected submit handler integration surface');
  assert.ok(!handlersContent.includes("'/role-handoff-pack'"), 'Plan forbids standalone role handoff pack route additions in this wave');
});
