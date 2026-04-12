const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  DENY_CODES,
  normalizeDiagnostic,
  validateGovernanceBundle,
} = require('../../onboarding/backend/brand-governance/governance-diagnostics.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('governance bundle: valid bundle passes schema validation', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, true, JSON.stringify(result.denials));
});

test('governance bundle: incomplete bundle is denied with canonical reason codes', () => {
  const bundle = loadFixture('governance-bundle-fail.json').bundle;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.length > 0, 'Expected at least one denial');
  const validCodes = new Set(Object.values(DENY_CODES));
  for (const denial of result.denials) {
    assert.ok(validCodes.has(denial.code), `Unknown reason code: ${denial.code}`);
    assert.equal(denial.machine_readable, true);
  }
});

test('governance bundle: missing tenant_id triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.tenant_id;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.detail.includes('tenant_id')));
});

test('governance bundle: missing bundle_id triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.bundle_id;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.detail.includes('bundle_id')));
});

test('governance bundle: missing strategy lineage lane reference triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.strategy_artifact_id;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.code === DENY_CODES.BRAND_GOV_MISSING_LANE));
});

test('governance bundle: missing identity lineage lane reference triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.identity_artifact_id;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.code === DENY_CODES.BRAND_GOV_MISSING_LANE && d.detail.includes('identity_artifact_id')));
});

test('governance bundle: missing design_system lineage lane reference triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.design_system_artifact_id;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.code === DENY_CODES.BRAND_GOV_MISSING_LANE && d.detail.includes('design_system_artifact_id')));
});

test('governance bundle: missing starter lineage lane reference triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.starter_artifact_id;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.code === DENY_CODES.BRAND_GOV_MISSING_LANE && d.detail.includes('starter_artifact_id')));
});

test('governance bundle: missing publish_readiness triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.publish_readiness;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.detail.includes('publish_readiness')));
});

test('governance bundle: missing lineage_fingerprints field triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.lineage_fingerprints;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.detail.includes('lineage_fingerprints')));
});

test('governance bundle: missing strategy fingerprint lane triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  delete bundle.lineage_fingerprints.strategy;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.code === DENY_CODES.BRAND_GOV_MISSING_LANE && d.detail.includes('strategy')));
});

test('governance bundle: null lineage fingerprint lane triggers denial', () => {
  const bundle = loadFixture('governance-bundle-pass.json').bundle;
  bundle.lineage_fingerprints.identity = null;
  const result = validateGovernanceBundle(bundle);
  assert.equal(result.valid, false);
  assert.ok(result.denials.some((d) => d.code === DENY_CODES.BRAND_GOV_MISSING_LANE && d.detail.includes('identity')));
});

test('governance-diagnostics: normalizeDiagnostic returns machine_readable shape', () => {
  const result = normalizeDiagnostic(DENY_CODES.BRAND_GOV_MISSING_LANE, 'test detail');
  assert.deepEqual(result, {
    code: DENY_CODES.BRAND_GOV_MISSING_LANE,
    detail: 'test detail',
    machine_readable: true,
  });
});

test('governance-diagnostics: DENY_CODES has all required constants', () => {
  assert.equal(typeof DENY_CODES.BRAND_GOV_MISSING_LANE, 'string');
  assert.equal(typeof DENY_CODES.BRAND_GOV_TENANT_MISMATCH, 'string');
  assert.equal(typeof DENY_CODES.BRAND_GOV_BUNDLE_NOT_VERIFIED, 'string');
  assert.equal(typeof DENY_CODES.BRAND_GOV_CLOSURE_GATE_FAIL, 'string');
});

test('governance bundle: no standalone governance route added to handlers (D-07)', () => {
  const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(!handlersContent.includes("'/governance'"), 'No standalone governance route permitted per D-07');
  assert.ok(!handlersContent.includes('"/governance"'), 'No standalone governance route permitted per D-07');
});
