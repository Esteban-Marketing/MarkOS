'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { verifyHighRiskExecution } = require('../../onboarding/backend/vault/hardened-verification.cjs');

test('high-risk verification passes when reasoning and evidence refs align', () => {
  const result = verifyHighRiskExecution({
    reasoning_trace: 'decision path',
    expected_evidence_ref: 'evidence://a',
    observed_evidence_ref: 'evidence://a',
  });

  assert.equal(result.verified, true);
  assert.deepEqual(result.anomaly_flags, []);
});

test('high-risk verification flags mismatch and missing reasoning without human-gate requirement', () => {
  const result = verifyHighRiskExecution({
    reasoning_trace: '',
    expected_evidence_ref: 'evidence://a',
    observed_evidence_ref: 'evidence://b',
  });

  assert.equal(result.verified, false);
  assert.ok(result.anomaly_flags.includes('missing_reasoning_trace'));
  assert.ok(result.anomaly_flags.includes('evidence_mismatch'));
});
