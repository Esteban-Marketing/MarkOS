'use strict';

// Phase 204.1 Plan 01 - CLI audit trail primitive.
//
// This stays best-effort by design: the operator command's exit behavior wins,
// and any audit transport/auth/server failure is swallowed after an optional
// debug-only stderr note.

const { BASE_URL, CLIENT_VERSION, generateTraceId } = require('./http.cjs');
const { resolveProfile } = require('./config.cjs');
const { getToken } = require('./keychain.cjs');

const CLI_AUDIT_PATH = '/api/tenant/cli-audit';
const REDACTED = '[REDACTED]';
const SECRET_KEYS = new Set(['password', 'token', 'key', '--password', '--token', '--key']);
const SECRET_POSITIONAL_FLAGS = new Set(['--password', '--token', '--key']);
const ENV_WRITE_VERBS = new Set(['put', 'set']);

function redactScalar(value) {
  if (value == null || value === false || value === '') {
    return value;
  }
  return REDACTED;
}

function redactPositional(tokens = []) {
  const out = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (SECRET_POSITIONAL_FLAGS.has(token) && index + 1 < tokens.length) {
      out.push(token, REDACTED);
      index += 1;
      continue;
    }

    if (ENV_WRITE_VERBS.has(token) && index + 2 < tokens.length) {
      out.push(token, tokens[index + 1], REDACTED);
      index += 2;
      continue;
    }

    out.push(token);
  }

  return out;
}

function redactArgs(parsed = {}) {
  const out = {};

  for (const [key, value] of Object.entries(parsed || {})) {
    if (SECRET_KEYS.has(key)) {
      out[key] = redactScalar(value);
      continue;
    }

    if (key === 'positional' && Array.isArray(value)) {
      out[key] = redactPositional(value);
      continue;
    }

    out[key] = value;
  }

  return out;
}

function buildAuditUrl() {
  const base = String(BASE_URL || '').replace(/\/+$/, '');
  return `${base}${CLI_AUDIT_PATH}`;
}

function writeDebug(debug, message) {
  if (!debug) {
    return;
  }
  process.stderr.write(`${message}\n`);
}

async function postAudit(body, token, timeoutMs = 5000) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  let timer = null;

  if (controller) {
    timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  }

  try {
    const headers = {
      'content-type': 'application/json',
      'x-markos-client': `markos-cli/${CLIENT_VERSION || 'unknown'}`,
    };
    const traceId = typeof generateTraceId === 'function' ? generateTraceId() : null;

    if (traceId) {
      headers['x-markos-trace-id'] = traceId;
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return await fetch(buildAuditUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined,
    });
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function recordCommandAudit({
  command,
  parsed,
  profile,
  exit_code,
  duration_ms,
  cli_version,
  debug = false,
  token,
} = {}) {
  const resolvedProfile = profile || resolveProfile(parsed || {});
  const args_redacted = redactArgs(parsed || {});
  const body = {
    command: command || (parsed && parsed.command) || null,
    args_redacted,
    profile: resolvedProfile || null,
    exit_code: Number.isInteger(exit_code) ? exit_code : 5,
    duration_ms: Number.isFinite(duration_ms) ? Math.max(0, Math.round(duration_ms)) : 0,
    cli_version: cli_version || CLIENT_VERSION || 'unknown',
  };

  let authToken = token;
  if (!authToken) {
    try {
      authToken = await getToken(resolvedProfile);
    } catch {
      authToken = null;
    }
  }

  if (!authToken) {
    return { recorded: false, reason: 'auth_unavailable' };
  }

  try {
    const response = await postAudit(body, authToken);

    if (response && (response.status === 200 || response.status === 202)) {
      return { recorded: true, status: response.status };
    }

    if (response && response.status === 404) {
      writeDebug(debug, '[audit] endpoint not yet available - skipping (pending P204 server-side wire-up)');
      return { recorded: false, reason: 'endpoint_not_available' };
    }

    if (response && (response.status === 401 || response.status === 403)) {
      return { recorded: false, reason: 'auth_unavailable' };
    }

    const status = response ? response.status : 'unknown';
    writeDebug(debug, `[audit] unexpected status ${status} - skipping`);
    return { recorded: false, reason: response ? `unexpected_status_${response.status}` : 'unexpected_status_unknown' };
  } catch (error) {
    const message = error && error.message ? error.message : 'unknown';
    writeDebug(debug, `[audit] transport error - skipping (${message})`);
    return { recorded: false, reason: 'transport_error' };
  }
}

module.exports = {
  CLI_AUDIT_PATH,
  REDACTED,
  recordCommandAudit,
  redactArgs,
  redactPositional,
};
