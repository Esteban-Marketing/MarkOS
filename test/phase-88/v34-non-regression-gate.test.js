'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { runV34BaselineChecks } = require('../../bin/verify-v34-baselines.cjs');
const { runV34NonRegressionGate } = require('../../onboarding/backend/brand-governance/closure-gates.cjs');

test('v3.4 baseline runner passes only when all checks pass', () => {
  assert.equal(runV34BaselineChecks({ brandingDeterminism: true, governancePublishRollback: true, uatBaseline: true }).passed, true);
  assert.equal(runV34BaselineChecks({ brandingDeterminism: false, governancePublishRollback: true, uatBaseline: true }).passed, false);
});

test('hard gate fails when any baseline check fails', () => {
  const failBrand = runV34NonRegressionGate({ brandingDeterminism: false, governancePublishRollback: true, uatBaseline: true });
  const failGov = runV34NonRegressionGate({ brandingDeterminism: true, governancePublishRollback: false, uatBaseline: true });
  const failUat = runV34NonRegressionGate({ brandingDeterminism: true, governancePublishRollback: true, uatBaseline: false });

  assert.equal(failBrand.passed, false);
  assert.equal(failGov.passed, false);
  assert.equal(failUat.passed, false);
});

test('hard gate passes only when all baselines pass', () => {
  const result = runV34NonRegressionGate({ brandingDeterminism: true, governancePublishRollback: true, uatBaseline: true });
  assert.equal(result.passed, true);
});
