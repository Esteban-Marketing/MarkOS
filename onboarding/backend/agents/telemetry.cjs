'use strict';

const { PostHog } = require('posthog-node');
const crypto = require('crypto');

let client = null;

if (process.env.MGSD_TELEMETRY !== 'false' && process.env.POSTHOG_API_KEY) {
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
      $lib: 'mgsd-backend-telemetry',
    }
  });
}

async function shutdown() {
  if (client) {
    await client.shutdown();
  }
}

module.exports = { capture, shutdown };
