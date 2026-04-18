'use strict';

// D-32: Sentry wraps every tool handler error. No-op when SENTRY_DSN unset (graceful degrade).
// Scope does NOT persist between requests in Vercel serverless (RESEARCH §Sentry Setup IMPORTANT);
// captureToolError passes tags + extra DIRECTLY in captureException call.

let _sentry = null;
let _loadAttempted = false;

function loadSentry(injected) {
  if (injected) return injected;
  if (_loadAttempted) return _sentry;
  _loadAttempted = true;
  if (!process.env.SENTRY_DSN) return null;
  try {
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
      tags: { domain: 'mcp', tool_id: (ctx && ctx.tool_id) || 'unknown', status: 'error' },
      extra: {
        req_id: ctx && ctx.req_id,
        session_id: ctx && ctx.session_id,
        tenant_id: ctx && ctx.tenant_id,
      },
    });
    return true;
  } catch {
    return false;
  }
}

function setupSentryContext(ctx, deps = {}) {
  // On Vercel this is only useful for a single call-chain; we still set it so non-Vercel runtimes correlate.
  const Sentry = loadSentry(deps.sentry);
  if (!Sentry || typeof Sentry.setTag !== 'function') return;
  try {
    Sentry.setTag('domain', 'mcp');
    if (ctx && ctx.req_id) Sentry.setTag('req_id', ctx.req_id);
    if (ctx && ctx.session_id) Sentry.setTag('session_id', ctx.session_id);
  } catch {}
}

function _internalResetForTests() {
  _sentry = null;
  _loadAttempted = false;
}

module.exports = { captureToolError, setupSentryContext, _internalResetForTests };
