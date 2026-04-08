'use strict';

const BLOCKED_KEY_PARTS = ['authorization', 'token', 'password', 'secret', 'service_role_key'];

function sanitizePayload(payload = {}) {
  const output = {};

  for (const [key, value] of Object.entries(payload)) {
    const lowered = key.toLowerCase();
    if (BLOCKED_KEY_PARTS.some((part) => lowered.includes(part))) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = value;
  }

  return output;
}

function buildEvent(event) {
  return {
    ...event,
    payload: sanitizePayload(event.payload || {}),
  };
}

module.exports = {
  buildEvent,
  sanitizePayload,
};