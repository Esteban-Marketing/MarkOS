const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeBrandInput } = require('../../onboarding/backend/brand-inputs/normalize-brand-input.cjs');
const { synthesizeStrategyArtifact } = require('../../onboarding/backend/brand-strategy/strategy-synthesizer.cjs');
const { compileIdentityArtifact } = require('../../onboarding/backend/brand-identity/identity-compiler.cjs');
const {
  REQUIRED_CHECKS,
  evaluateAccessibilityGates,
} = require('../../onboarding/backend/brand-identity/accessibility-gates.cjs');
const { validateAccessibilityGateReport } = require('../../onboarding/backend/brand-identity/accessibility-gate-schema.cjs');

function buildBrandInput() {
  return {
    brand_profile: {
      primary_name: 'Accessibility Determinism Co',
      mission_statement: 'Enforce blocking checks with stable diagnostics.',
    },
    audience_segments: [
      {
        segment_id: 'seg-accessibility',
        segment_name: 'Compliance owners',
        pains: [
          { pain: 'Late-stage accessibility failures', rationale: 'Checks happen too late in review.' },
        ],
        needs: [
          { need: 'Deterministic gate diagnostics', rationale: 'Release decisions need consistent evidence.' },
        ],
        expectations: [
          { expectation: 'Blocking policy for required checks', rationale: 'Failing checks must block readiness.' },
        ],
        desired_outcomes: ['Fewer release surprises'],
      },
      {
        segment_id: 'seg-product',
        segment_name: 'Product operators',
        pains: [
          { pain: 'Ambiguous quality gates', rationale: 'Teams need explicit threshold outcomes.' },
        ],
        needs: [
          { need: 'Stable report format', rationale: 'Automations consume structured diagnostics.' },
        ],
        expectations: [
          { expectation: 'Machine-readable reason codes', rationale: 'Blocking reason must be explicit.' },
        ],
        desired_outcomes: ['Predictable shipping workflow'],
      },
    ],
  };
}

function buildCompiledIdentity(tenantId) {
  const normalized = normalizeBrandInput(tenantId, buildBrandInput());
  const synthesized = synthesizeStrategyArtifact(tenantId, normalized);
  return compileIdentityArtifact(synthesized);
}

test('accessibility gates: deterministic pass report for canonical artifact', async () => {
  const compiled = buildCompiledIdentity('tenant-accessibility-pass');

  const run1 = evaluateAccessibilityGates(compiled);
  const run2 = evaluateAccessibilityGates(compiled);

  assert.deepEqual(run1, run2);
  assert.equal(run1.gate_status, 'pass');
  assert.equal(run1.checks.length, REQUIRED_CHECKS.length);
  assert.equal(run1.diagnostics.length, 0);

  const schemaResult = validateAccessibilityGateReport(run1);
  assert.equal(schemaResult.valid, true, schemaResult.errors.join('; '));
});

test('accessibility gates: failing required checks deterministically block readiness', async () => {
  const compiled = buildCompiledIdentity('tenant-accessibility-blocked');

  compiled.artifact.semantic_color_roles['text.primary'] = '#ffffff';
  compiled.artifact.semantic_color_roles['surface.default'] = '#ffffff';

  const report = evaluateAccessibilityGates(compiled);

  assert.equal(report.gate_status, 'blocked');
  assert.ok(report.diagnostics.length > 0);

  const contrastCheck = report.checks.find((entry) => entry.id === 'contrast.text.primary_on_surface.default');
  assert.ok(contrastCheck);
  assert.equal(contrastCheck.status, 'fail');
  assert.equal(contrastCheck.blocking, true);
  assert.equal(contrastCheck.reason_code, 'ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD');

  const schemaResult = validateAccessibilityGateReport(report);
  assert.equal(schemaResult.valid, true, schemaResult.errors.join('; '));
});

test('accessibility gates: diagnostics payload includes deterministic threshold details', async () => {
  const compiled = buildCompiledIdentity('tenant-accessibility-diagnostics');

  compiled.artifact.typography_hierarchy['type.body'].line_height = 1.2;

  const report = evaluateAccessibilityGates(compiled);
  const diagnostic = report.diagnostics.find((entry) => entry.check_id === 'readability.type.body.line_height_minimum');

  assert.equal(report.gate_status, 'blocked');
  assert.ok(diagnostic);
  assert.equal(diagnostic.required_ratio, 1.4);
  assert.equal(diagnostic.observed_ratio, 1.2);
  assert.equal(diagnostic.blocking, true);
  assert.ok(diagnostic.message.includes('readability.type.body.line_height_minimum'));
  assert.equal(diagnostic.reason_code, 'ACCESSIBILITY_READABILITY_BELOW_THRESHOLD');
});
