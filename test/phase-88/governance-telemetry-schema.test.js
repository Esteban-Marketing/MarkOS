'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeGovernanceTelemetryEvent, REQUIRED_FIELDS } = require('../../onboarding/backend/vault/telemetry-schema.cjs');

function validEvent(overrides = {}) {
  return {
    tenant_id: 'tenant-alpha',
    artifact_id: 'artifact-01',
    retrieval_mode: 'reason',
    run_id: 'run-01',
    actor_role: 'agent',
    outcome_status: 'success',
    expected_evidence_ref: 'evidence://expected/1',
    observed_evidence_ref: 'evidence://observed/1',
    anomaly_flags: [],
    timestamp: '2026-04-12T22:00:00.000Z',
    ...overrides,
  };
}

test('governance telemetry accepts full required schema', () => {
  const event = normalizeGovernanceTelemetryEvent(validEvent());
  for (const field of REQUIRED_FIELDS) {
    assert.ok(Object.hasOwn(event, field));
  }
  assert.equal(event.retrieval_mode, 'reason');
});

test('governance telemetry rejects missing required fields', () => {
  const missing = validEvent();
  delete missing.run_id;
  assert.throws(
    () => normalizeGovernanceTelemetryEvent(missing),
    { code: 'E_GOV_TELEMETRY_REQUIRED_FIELDS' }
  );
});

test('governance telemetry retains anomaly flags and evidence refs', () => {
  const event = normalizeGovernanceTelemetryEvent(
    validEvent({ anomaly_flags: ['evidence_mismatch'], observed_evidence_ref: 'evidence://observed/2' })
  );
  assert.deepEqual(event.anomaly_flags, ['evidence_mismatch']);
  assert.equal(event.observed_evidence_ref, 'evidence://observed/2');
});
