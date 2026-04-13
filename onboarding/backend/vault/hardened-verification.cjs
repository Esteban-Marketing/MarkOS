'use strict';

function normalize(value) {
  return String(value || '').trim();
}

function verifyHighRiskExecution(input = {}) {
  const reasoning_trace = normalize(input.reasoning_trace);
  const expected_evidence_ref = normalize(input.expected_evidence_ref);
  const observed_evidence_ref = normalize(input.observed_evidence_ref);

  const anomaly_flags = [];

  if (!reasoning_trace) {
    anomaly_flags.push('missing_reasoning_trace');
  }

  if (!expected_evidence_ref || !observed_evidence_ref) {
    anomaly_flags.push('missing_evidence_refs');
  }

  if (expected_evidence_ref && observed_evidence_ref && expected_evidence_ref !== observed_evidence_ref) {
    anomaly_flags.push('evidence_mismatch');
  }

  return {
    verified: anomaly_flags.length === 0,
    anomaly_flags,
    expected_evidence_ref: expected_evidence_ref || null,
    observed_evidence_ref: observed_evidence_ref || null,
    reasoning_trace: reasoning_trace || null,
  };
}

module.exports = {
  verifyHighRiskExecution,
};
