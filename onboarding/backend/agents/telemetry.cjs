'use strict';

let PostHog = null;
try {
  ({ PostHog } = require('posthog-node'));
} catch (error) {
  PostHog = null;
}
const crypto = require('crypto');
const { redactSensitive } = require('../runtime-context.cjs');

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
    properties: payload
  });
}

function captureExecutionCheckpoint(eventName, properties = {}) {
  if (!EXECUTION_CHECKPOINT_EVENTS.has(eventName)) return;
  capture(eventName, {
    telemetry_scope: 'execution_loop',
    ...properties,
  });
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

async function shutdown() {
  if (client) {
    await client.shutdown();
  }
}

module.exports = {
  capture,
  captureExecutionCheckpoint,
  captureRolloutEndpointEvent,
  getTelemetryPreference,
  ROLLOUT_ENDPOINT_SLOS,
  shutdown,
};
