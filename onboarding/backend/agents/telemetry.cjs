'use strict';

let PostHog = null;
try {
  ({ PostHog } = require('posthog-node'));
} catch (error) {
  PostHog = null;
}
const crypto = require('node:crypto');
const { redactSensitive } = require('../runtime-context.cjs');
const { normalizeGovernanceTelemetryEvent } = require('../vault/telemetry-schema.cjs');

let client = null;

const EXECUTION_CHECKPOINT_EVENTS = new Set([
  'approval_completed',
  'execution_readiness_ready',
  'execution_readiness_blocked',
  'execution_failure',
  'execution_loop_completed',
  'execution_loop_abandoned',
]);

const ROLLOUT_ENDPOINT_SLOS = Object.freeze({
  '/submit': Object.freeze({ tier: 'critical', availability: 99.5, p95_ms: 1500 }),
  '/approve': Object.freeze({ tier: 'critical', availability: 99.9, p95_ms: 900 }),
  '/linear/sync': Object.freeze({ tier: 'standard', availability: 99.0, p95_ms: 1200 }),
  '/campaign/result': Object.freeze({ tier: 'standard', availability: 99.5, p95_ms: 800 }),
});

function getTelemetryPreference() {
  return process.env.MARKOS_TELEMETRY ?? process.env.MARKOS_TELEMETRY;
}

if (PostHog && getTelemetryPreference() !== 'false' && process.env.POSTHOG_API_KEY) {
  client = new PostHog(
    process.env.POSTHOG_API_KEY,
    { host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com' }
  );
}

/**
 * Capture a server-side analytics event
 * @param {string} eventName
 * @param {object} properties
 */
function capture(eventName, properties = {}) {
  if (!client) return;

  const sanitized = redactSensitive(properties);
  const projectSlug = sanitized.project_slug || 'local_cli_fallback';

  const distinctId = crypto.createHash('md5').update(projectSlug).digest('hex');

  const payload = {
    ...sanitized,
    project_slug_hash: distinctId,
    $lib: 'markos-backend-telemetry',
  };

  if (Object.prototype.hasOwnProperty.call(payload, 'project_slug')) {
    delete payload.project_slug;
  }

  client.capture({
    distinctId: distinctId,
    event: eventName,
    properties: payload,
  });
}

function captureExecutionCheckpoint(eventName, properties = {}) {
  if (!EXECUTION_CHECKPOINT_EVENTS.has(eventName)) return;
  capture(eventName, {
    telemetry_scope: 'execution_loop',
    ...properties,
  });
}

function captureTrackingEvent(eventName, properties = {}) {
  capture(eventName, {
    telemetry_scope: 'tracking',
    ...properties,
  });
}

function captureGovernanceEvent(eventName, properties = {}) {
  const normalized = normalizeGovernanceTelemetryEvent(properties);
  capture(eventName, {
    telemetry_scope: 'governance',
    ...normalized,
  });
  return normalized;
}

function captureRolloutEndpointEvent(endpoint, properties = {}) {
  const slo = ROLLOUT_ENDPOINT_SLOS[endpoint];
  if (!slo) return;

  const duration = Number(properties.duration_ms);
  const statusCode = Number(properties.status_code);

  capture('rollout_endpoint_observed', {
    endpoint,
    endpoint_tier: slo.tier,
    slo_target_availability: slo.availability,
    slo_target_p95_ms: slo.p95_ms,
    outcome_state: properties.outcome_state || 'unknown',
    status_code: Number.isFinite(statusCode) ? statusCode : null,
    duration_ms: Number.isFinite(duration) && duration >= 0 ? duration : 0,
    runtime_mode: properties.runtime_mode || 'unknown',
    project_slug: properties.project_slug || null,
  });
}

function normalizeNumeric(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function captureProviderAttempt(properties = {}) {
  const event = {
    run_id: properties.run_id || null,
    tenant_id: properties.tenant_id || null,
    project_slug: properties.project_slug || null,
    agent_name: properties.agent_name || null,
    attempt_number: Math.max(1, Math.trunc(normalizeNumeric(properties.attempt_number, 1))),
    provider: String(properties.provider || 'unknown'),
    provider_policy_primary: properties.provider_policy_primary || null,
    model: String(properties.model || 'unknown'),
    outcome_state: properties.outcome_state || 'unknown',
    reason_code: properties.reason_code || null,
    fallback_reason: properties.fallback_reason || null,
    latency_ms: Math.max(0, normalizeNumeric(properties.latency_ms, 0)),
    cost_usd: Math.max(0, normalizeNumeric(properties.cost_usd, 0)),
    token_usage: redactSensitive(properties.token_usage || {}),
  };

  capture('markos_agent_run_provider_attempt', event);
  return redactSensitive(event);
}

function getMissingRunCloseFields(properties = {}) {
  const missing = [];

  if (!String(properties.model || '').trim()) {
    missing.push('model');
  }

  if (!String(properties.prompt_version || '').trim()) {
    missing.push('prompt_version');
  }

  if (!Array.isArray(properties.tool_events) || properties.tool_events.length === 0) {
    missing.push('tool_events');
  }

  if (!Number.isFinite(Number(properties.latency_ms))) {
    missing.push('latency_ms');
  }

  if (!Number.isFinite(Number(properties.cost_usd))) {
    missing.push('cost_usd');
  }

  if (!String(properties.outcome || '').trim()) {
    missing.push('outcome');
  }

  return missing;
}

function captureRunClose(properties = {}) {
  const missing = getMissingRunCloseFields(properties);
  if (missing.length > 0) {
    capture('markos_agent_run_close_incomplete', {
      run_id: properties.run_id || null,
      tenant_id: properties.tenant_id || null,
      project_slug: properties.project_slug || null,
      missing_fields: missing,
      outcome: properties.outcome || null,
    });
    throw new Error(`RUN_CLOSE_INCOMPLETE:${missing.join(',')}`);
  }

  const event = {
    run_id: properties.run_id || null,
    tenant_id: properties.tenant_id || null,
    project_slug: properties.project_slug || null,
    model: String(properties.model).trim(),
    prompt_version: String(properties.prompt_version).trim(),
    tool_events: redactSensitive(properties.tool_events),
    latency_ms: Math.max(0, normalizeNumeric(properties.latency_ms, 0)),
    cost_usd: Math.max(0, normalizeNumeric(properties.cost_usd, 0)),
    outcome: String(properties.outcome).trim(),
    error_count: Math.max(0, Math.trunc(normalizeNumeric(properties.error_count, 0))),
  };

  capture('markos_agent_run_close_completed', event);
  return redactSensitive(event);
}

async function shutdown() {
  if (client) {
    await client.shutdown();
  }
}

module.exports = {
  capture,
  captureExecutionCheckpoint,
  captureTrackingEvent,
  captureGovernanceEvent,
  captureProviderAttempt,
  captureRunClose,
  captureRolloutEndpointEvent,
  getMissingRunCloseFields,
  getTelemetryPreference,
  ROLLOUT_ENDPOINT_SLOS,
  shutdown,
};
