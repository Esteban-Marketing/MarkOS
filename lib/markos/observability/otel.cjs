'use strict';

// Phase 200.1 Plan 09: shared OTEL wrapper for api/webhooks/* + api/mcp/*.
// Closes review concern M5 (gate-9 OTEL coverage + gate-10 cost telemetry wiring).
//
// Design goals:
// - stable startSpan / withSpan / recordEvent API for route handlers
// - Sentry-first when SENTRY_DSN is configured and a runtime SDK exists
// - JSON console fallback for Vercel log-drain ingestion
// - fail-soft emission: sink failures never break the request path
// - zero undefined attr pollution in the final payload

/**
 * @typedef {Object} SpanAttrs
 * @property {string=} tenant_id
 * @property {string=} webhook_subscription_id
 * @property {string=} mcp_session_id
 * @property {string=} tool_name
 * @property {number=} cost_cents
 * @property {boolean=} error
 * @property {string=} error_code
 * @property {number=} status_code
 * @property {string=} status
 * @property {string=} method
 * @property {string=} req_id
 */

let _initialized = false;
let _serviceName = 'markos';
let _sentry = null;
let _testSink = null;

function tryRequireSentry() {
  try {
    return require('@sentry/nextjs');
  } catch {}
  try {
    return require('@sentry/node');
  } catch {}
  return null;
}

function dropUndefined(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function emitJsonLine(payload) {
  try {
    const envelope = {
      ts: new Date().toISOString(),
      service: _serviceName,
      ...dropUndefined(payload),
    };
    const line = JSON.stringify(envelope);
    if (_testSink) {
      _testSink(line, envelope);
      return envelope;
    }
    // eslint-disable-next-line no-console
    console.log(line);
    return envelope;
  } catch {
    return null;
  }
}

function emitToSentry(name, attrs, duration_ms) {
  if (!_sentry || typeof _sentry.captureMessage !== 'function') return false;
  try {
    _sentry.captureMessage(name, {
      level: 'info',
      tags: dropUndefined(attrs || {}),
      contexts: duration_ms === undefined
        ? undefined
        : { trace: { duration_ms, service: _serviceName } },
      extra: duration_ms === undefined ? undefined : { duration_ms },
    });
    return true;
  } catch {
    return false;
  }
}

function normalizeAttrs(attrs) {
  return dropUndefined(attrs || {});
}

function mergeAttrs(base, extra) {
  return {
    ...normalizeAttrs(base),
    ...normalizeAttrs(extra),
  };
}

function nowMs() {
  return Date.now();
}

/**
 * Idempotent OTEL bootstrap.
 * Safe to call from every route module: the first call wins.
 *
 * @param {{ serviceName?: string }=} options
 * @returns {void}
 */
function initOtel({ serviceName = 'markos' } = {}) {
  if (_initialized) return;
  _serviceName = serviceName;

  if (process.env.SENTRY_DSN) {
    const sentry = tryRequireSentry();
    if (sentry && typeof sentry.init === 'function') {
      try {
        sentry.init({
          dsn: process.env.SENTRY_DSN,
          tracesSampleRate: parseFloat(process.env.OTEL_SAMPLE_RATE || '1.0'),
        });
        _sentry = sentry;
      } catch {
        _sentry = null;
      }
    }
  }

  _initialized = true;
}

/**
 * Test-only sink override used by node:test suites to capture lines in-memory.
 *
 * @param {(line: string, payload: object) => void} sinkFn
 * @returns {void}
 */
function setTestSink(sinkFn) {
  _testSink = sinkFn;
}

function clearTestSink() {
  _testSink = null;
}

/**
 * Test-only reset for idempotent init state.
 * Preserves module identity while allowing repeated scenarios in one process.
 *
 * @returns {void}
 */
function _internalResetForTests() {
  _initialized = false;
  _serviceName = 'markos';
  _sentry = null;
  _testSink = null;
}

/**
 * Start a span and return a lightweight mutable handle.
 *
 * @param {string} name
 * @param {SpanAttrs=} attrs
 * @returns {{ end: (attrs?: SpanAttrs) => void, setAttribute: (k: string, v: any) => void }}
 */
function startSpan(name, attrs) {
  if (!_initialized) initOtel({});

  const startedAt = nowMs();
  const accumulated = normalizeAttrs(attrs);
  let ended = false;

  return {
    setAttribute(key, value) {
      if (value !== undefined) accumulated[key] = value;
    },
    end(extraAttrs) {
      if (ended) return;
      ended = true;

      const finalAttrs = mergeAttrs(accumulated, extraAttrs);
      const duration_ms = Math.max(0, nowMs() - startedAt);

      try {
        emitToSentry(name, finalAttrs, duration_ms);
      } catch {}

      try {
        emitJsonLine({
          name,
          attrs: finalAttrs,
          duration_ms,
        });
      } catch {}
    },
  };
}

/**
 * Wrap async work in a span and propagate the wrapped function result.
 * Wrapped-function errors are re-thrown after error attrs are attached.
 *
 * @template T
 * @param {string} name
 * @param {SpanAttrs=} attrs
 * @param {(span: ReturnType<typeof startSpan>) => Promise<T>|T} fn
 * @returns {Promise<T>}
 */
async function withSpan(name, attrs, fn) {
  const span = startSpan(name, attrs);
  try {
    const result = await fn(span);
    span.end({ status: 'ok' });
    return result;
  } catch (error) {
    span.end({
      error: true,
      error_code: error && error.code ? String(error.code) : 'unhandled_error',
      error_message: error && error.message ? error.message : String(error),
      status: 'error',
    });
    throw error;
  }
}

/**
 * Emit a one-shot event without duration.
 *
 * @param {string} name
 * @param {SpanAttrs=} attrs
 * @returns {void}
 */
function recordEvent(name, attrs) {
  if (!_initialized) initOtel({});
  const finalAttrs = normalizeAttrs(attrs);

  try {
    emitToSentry(name, finalAttrs);
  } catch {}

  try {
    emitJsonLine({
      event: name,
      attrs: finalAttrs,
    });
  } catch {}
}

module.exports = {
  initOtel,
  startSpan,
  withSpan,
  recordEvent,
  setTestSink,
  clearTestSink,
  _internalResetForTests,
};
