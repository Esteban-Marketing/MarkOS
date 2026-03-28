'use strict';

const { PostHog } = require('posthog-node');
const crypto = require('crypto');

let client = null;

const EXECUTION_CHECKPOINT_EVENTS = new Set([
  'approval_completed',
  'execution_readiness_ready',
  'execution_readiness_blocked',
  'execution_failure',
  'execution_loop_completed',
  'execution_loop_abandoned',
]);

function getTelemetryPreference() {
  return process.env.MARKOS_TELEMETRY ?? process.env.MGSD_TELEMETRY;
}

if (getTelemetryPreference() !== 'false' && process.env.POSTHOG_API_KEY) {
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

  const projectSlug = properties.project_slug || 'local_cli_fallback';
  
  const distinctId = crypto.createHash('md5').update(projectSlug).digest('hex');

  client.capture({
    distinctId: distinctId,
    event: eventName,
    properties: {
      ...properties,
      $lib: 'markos-backend-telemetry',
    }
  });
}

function captureExecutionCheckpoint(eventName, properties = {}) {
  if (!EXECUTION_CHECKPOINT_EVENTS.has(eventName)) return;
  capture(eventName, {
    telemetry_scope: 'execution_loop',
    ...properties,
  });
}

async function shutdown() {
  if (client) {
    await client.shutdown();
  }
}

module.exports = { capture, captureExecutionCheckpoint, shutdown };
