const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { validateIdentityArtifact } = require('../../onboarding/backend/brand-identity/identity-artifact-schema.cjs');
const {
  GATE_STATUS,
  CHECK_STATUS,
  validateAccessibilityGateReport,
} = require('../../onboarding/backend/brand-identity/accessibility-gate-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');
const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('gate schema: identity validator is available for deterministic contract checks', async () => {
  const payload = loadFixture('identity-strategy-pass.json').identity_artifact;
  const result = validateIdentityArtifact(payload);
  assert.equal(result.valid, true, result.errors.join('; '));
});

test('gate schema: required check matrix and diagnostics shape are enforced', async () => {
  const report = {
    gate_status: 'blocked',
    checks: [
      {
        id: 'contrast.text.primary_on_surface.default',
        required_ratio: 4.5,
        observed_ratio: 7.2,
        status: 'pass',
        blocking: true,
      },
      {
        id: 'contrast.brand.primary_on_surface.default',
        required_ratio: 3.0,
        observed_ratio: 2.4,
        status: 'fail',
        blocking: true,
      },
    ],
    diagnostics: [
      {
        check_id: 'contrast.brand.primary_on_surface.default',
        required_ratio: 3.0,
        observed_ratio: 2.4,
        blocking: true,
        message: 'Required contrast ratio is below threshold',
      },
    ],
  };

  const result = validateAccessibilityGateReport(report);
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.deepEqual(GATE_STATUS, ['pass', 'blocked']);
  assert.deepEqual(CHECK_STATUS, ['pass', 'fail']);
});

test('gate schema: missing observed ratio fails deterministically', async () => {
  const report = {
    gate_status: 'blocked',
    checks: [
      {
        id: 'contrast.text.inverse_on_brand.primary',
        required_ratio: 4.5,
        status: 'fail',
        blocking: true,
      },
    ],
    diagnostics: [],
  };

  const result = validateAccessibilityGateReport(report);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('checks[0].observed_ratio must be a number'));
});

test('gate schema: blocking failure forces blocked gate status', async () => {
  const report = {
    gate_status: 'pass',
    checks: [
      {
        id: 'contrast.brand.primary_on_surface.default',
        required_ratio: 3.0,
        observed_ratio: 2.2,
        status: 'fail',
        blocking: true,
      },
    ],
    diagnostics: [
      {
        check_id: 'contrast.brand.primary_on_surface.default',
        required_ratio: 3.0,
        observed_ratio: 2.2,
        blocking: true,
        message: 'Required contrast ratio is below threshold',
      },
    ],
  };

  const result = validateAccessibilityGateReport(report);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('gate_status must be blocked when a blocking check fails'));
});

test('gate schema: tests remain tied to existing submit surface (D-08)', async () => {
  const handlersContent = fs.readFileSync(handlersPath, 'utf8');
  assert.ok(handlersContent.includes('handleSubmit'), 'Expected submit handler integration surface');
  assert.ok(!handlersContent.includes("'/identity'"), 'Plan forbids standalone identity route additions in this wave');
});
