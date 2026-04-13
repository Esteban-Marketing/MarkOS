'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const handlers = require('../../onboarding/backend/handlers.cjs');

test('smoke: closeout verification blocks when evidence refs are missing', () => {
  const result = handlers.__testing.verifyGovernanceCloseout({
    tenant_id: 'tenant-alpha',
    artifact_id: 'bundle-001',
    retrieval_mode: 'manage',
    run_id: 'run-closeout-1',
    actor_role: 'system',
    expected_evidence_ref: '',
    observed_evidence_ref: '',
    reasoning_trace: 'closure gate review',
    captureGovernanceEvent: () => {
      throw new Error('should not emit telemetry when verification fails');
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'E_GOVERNANCE_CLOSEOUT_VERIFICATION_FAILED');
  assert.ok(result.verification.anomaly_flags.includes('missing_evidence_refs'));
});

test('smoke: closeout verification blocks when anomaly flags are present', () => {
  const result = handlers.__testing.verifyGovernanceCloseout({
    tenant_id: 'tenant-alpha',
    artifact_id: 'bundle-002',
    retrieval_mode: 'manage',
    run_id: 'run-closeout-2',
    actor_role: 'system',
    expected_evidence_ref: 'evidence://expected/1',
    observed_evidence_ref: 'evidence://observed/2',
    reasoning_trace: 'closure gate review',
    captureGovernanceEvent: () => {
      throw new Error('should not emit telemetry when verification fails');
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'E_GOVERNANCE_CLOSEOUT_VERIFICATION_FAILED');
  assert.ok(result.verification.anomaly_flags.includes('evidence_mismatch'));
});

test('smoke: successful closeout verification emits governance telemetry with outcome and anomaly state', () => {
  const emitted = [];

  const result = handlers.__testing.verifyGovernanceCloseout({
    tenant_id: 'tenant-alpha',
    artifact_id: 'bundle-003',
    retrieval_mode: 'manage',
    run_id: 'run-closeout-3',
    actor_role: 'system',
    expected_evidence_ref: 'evidence://bundle/3',
    observed_evidence_ref: 'evidence://bundle/3',
    reasoning_trace: 'closure gate review complete',
    captureGovernanceEvent: (eventName, payload) => {
      emitted.push({ eventName, payload });
      return payload;
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.verification.verified, true);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].payload.outcome_status, 'verified');
  assert.deepEqual(emitted[0].payload.anomaly_flags, []);
});
