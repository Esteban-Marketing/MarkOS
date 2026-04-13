'use strict';

const REQUIRED_FIELDS = [
  'tenant_id',
  'artifact_id',
  'retrieval_mode',
  'run_id',
  'actor_role',
  'outcome_status',
  'expected_evidence_ref',
  'observed_evidence_ref',
  'anomaly_flags',
  'timestamp',
];

function normalize(value) {
  return String(value || '').trim();
}

function createError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function normalizeGovernanceTelemetryEvent(input = {}) {
  const event = {
    tenant_id: normalize(input.tenant_id),
    artifact_id: normalize(input.artifact_id),
    retrieval_mode: normalize(input.retrieval_mode),
    run_id: normalize(input.run_id),
    actor_role: normalize(input.actor_role),
    outcome_status: normalize(input.outcome_status),
    expected_evidence_ref: normalize(input.expected_evidence_ref),
    observed_evidence_ref: normalize(input.observed_evidence_ref),
    anomaly_flags: Array.isArray(input.anomaly_flags) ? input.anomaly_flags.map((v) => normalize(v)).filter(Boolean) : null,
    timestamp: normalize(input.timestamp) || new Date().toISOString(),
  };

  const missing = REQUIRED_FIELDS.filter((field) => {
    if (field === 'anomaly_flags') {
      return !Array.isArray(event.anomaly_flags);
    }
    return !event[field];
  });

  if (missing.length > 0) {
    throw createError('E_GOV_TELEMETRY_REQUIRED_FIELDS', `Missing required governance telemetry fields: ${missing.join(', ')}`);
  }

  if (!['reason', 'apply', 'iterate', 'manage'].includes(event.retrieval_mode)) {
    throw createError('E_GOV_TELEMETRY_MODE_INVALID', 'retrieval_mode must be reason, apply, iterate, or manage.');
  }

  return event;
}

module.exports = {
  REQUIRED_FIELDS,
  normalizeGovernanceTelemetryEvent,
};
