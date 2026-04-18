'use strict';

// Phase 203 Plan 10 Task 1 — webhook Sentry primitive.
// MIRROR of lib/markos/mcp/sentry.cjs with domain='webhook' tag.
// Triple-safety: env gate (SENTRY_DSN) + lazy import try/catch + captureException try/catch.
// captureToolError never throws, never re-raises — preserves the delivery finally block.

let _sentry = null;
let _loadAttempted = false;

function loadSentry(injected) {
  if (injected) return injected;
  if (_loadAttempted) return _sentry;
  _loadAttempted = true;
  if (!process.env.SENTRY_DSN) return null;
  try {
    // eslint-disable-next-line global-require
    _sentry = require('@sentry/nextjs');
  } catch {
    _sentry = null;
  }
  return _sentry;
}

function captureToolError(err, ctx, deps = {}) {
  const Sentry = loadSentry(deps.sentry);
  if (!Sentry || typeof Sentry.captureException !== 'function') return false;
  try {
    Sentry.captureException(err, {
      tags: {
        domain: 'webhook',
        event_type: (ctx && ctx.event_type) || 'unknown',
        sub_id: (ctx && ctx.sub_id) || 'unknown',
        status: 'error',
      },
      extra: {
        req_id: ctx && ctx.req_id,
        delivery_id: ctx && ctx.delivery_id,
        tenant_id: ctx && ctx.tenant_id,
        attempt: ctx && ctx.attempt,
      },
    });
    return true;
  } catch {
    return false;
  }
}

function setupSentryContext(ctx, deps = {}) {
  const Sentry = loadSentry(deps.sentry);
  if (!Sentry || typeof Sentry.setTag !== 'function') return;
  try {
    Sentry.setTag('domain', 'webhook');
    if (ctx && ctx.req_id) Sentry.setTag('req_id', ctx.req_id);
    if (ctx && ctx.sub_id) Sentry.setTag('sub_id', ctx.sub_id);
  } catch {}
}

function _internalResetForTests() {
  _sentry = null;
  _loadAttempted = false;
}

module.exports = { captureToolError, setupSentryContext, _internalResetForTests };
