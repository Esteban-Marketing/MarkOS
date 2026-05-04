'use strict';

// Phase 204 Plan 04 Task 2 - `markos whoami` CLI command.
//
// Observability command - prints the caller's tenant/role/email + active API
// key fingerprint. Closes Wave 1 by proving end-to-end auth + tenant routing.

const { authedFetch, BASE_URL, AuthError, TransientError } = require('../lib/cli/http.cjs');
const { getToken } = require('../lib/cli/keychain.cjs');
const { resolveProfile } = require('../lib/cli/config.cjs');
const { createSpinner } = require('../lib/cli/spinner.cjs');
const {
  EXIT_CODES,
  shouldUseJson,
  shouldUseColor,
  renderJson,
  ANSI,
  pickGlyphs,
} = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');

function formatLastUsed(iso) {
  if (!iso) return 'never';
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const deltaMs = Date.now() - then;
  if (deltaMs < 0) return 'just now';
  const sec = Math.floor(deltaMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function renderBox(envelope, profile, opts) {
  const color = shouldUseColor(opts);
  const G = pickGlyphs();
  const lines = [];
  const label = (s) => (color ? (ANSI.DIM + s + ANSI.RESET) : s);
  const value = (s) => (color ? (ANSI.BOLD + s + ANSI.RESET) : s);

  const fp = envelope.key_fingerprint
    ? `sha256:${envelope.key_fingerprint}... (last used ${formatLastUsed(envelope.last_used_at)})`
    : '(session - no API key)';

  const rows = [
    ['Tenant', `${envelope.tenant_name} (${envelope.tenant_id})`],
    ['Role', envelope.role],
    ['Email', envelope.email],
    ['User ID', envelope.user_id],
    ['Key', fp],
    ['Scope', envelope.scope],
  ];

  const headerText = `whoami (profile: ${profile})`;
  const labelWidth = Math.max(...rows.map(([l]) => l.length));
  const valueWidth = Math.max(...rows.map(([, v]) => String(v).length));
  const contentWidth = Math.max(headerText.length, labelWidth + 2 + valueWidth);

  lines.push(
    G.topLeft
      + G.horiz
      + ' '
      + headerText
      + ' '
      + G.horiz.repeat(Math.max(0, contentWidth - headerText.length - 1))
      + G.topRight,
  );

  for (const [l, v] of rows) {
    const labelCell = l.padEnd(labelWidth, ' ');
    const valueStr = String(v);
    const pad = Math.max(0, contentWidth - labelWidth - 2 - valueStr.length);
    lines.push(G.vert + ' ' + label(labelCell) + '  ' + value(valueStr) + ' '.repeat(pad) + G.vert);
  }

  lines.push(G.bottomLeft + G.horiz.repeat(contentWidth + 2) + G.bottomRight);

  for (const line of lines) process.stdout.write(line + '\n');
}

function authErrorPayload(signature) {
  if (signature === 'revoked_token') {
    return {
      error: 'UNAUTHORIZED',
      message: 'This API key was revoked.',
      hint: 'Run `markos login` to mint a fresh key.',
    };
  }
  if (signature === 'invalid_token') {
    return {
      error: 'UNAUTHORIZED',
      message: 'Session expired.',
      hint: 'Run `markos login` again.',
    };
  }
  return {
    error: 'UNAUTHORIZED',
    message: 'Authentication failed.',
    hint: 'Run `markos login` to re-authenticate.',
  };
}

function signatureFromBody(bodyText) {
  if (/revoked_token/.test(bodyText)) return 'revoked_token';
  if (/invalid_token/.test(bodyText)) return 'invalid_token';
  return 'generic';
}

function exitAuth(cli, signature) {
  formatError(authErrorPayload(signature), cli);
  return process.exit(EXIT_CODES.AUTH_FAILURE);
}

function exitTransient(cli, error, message) {
  formatError({ error, message }, cli);
  return process.exit(EXIT_CODES.TRANSIENT);
}

function handleFetchError(err, cli) {
  if (err instanceof AuthError) {
    const bodyText = typeof err?.body === 'string' ? err.body : '';
    return exitAuth(cli, signatureFromBody(bodyText));
  }
  if (err instanceof TransientError) {
    return exitTransient(cli, 'SERVER_ERROR', `Server error: ${err.message}`);
  }
  return exitTransient(cli, 'NETWORK_ERROR', err?.message || 'Unknown network error');
}

function renderEnvelope(body, profile, cli) {
  if (shouldUseJson(cli)) {
    renderJson({
      profile,
      tenant_id: body.tenant_id,
      tenant_name: body.tenant_name,
      role: body.role,
      email: body.email,
      user_id: body.user_id,
      key_fingerprint: body.key_fingerprint || null,
      scope: body.scope,
      last_used_at: body.last_used_at || null,
    });
    return;
  }

  renderBox(body, profile, cli);
}

async function main(ctx = {}) {
  const cli = (ctx && ctx.cli) || ctx || {};
  const profile = resolveProfile(cli);

  const token = await getToken(profile);
  if (!token) {
    formatError({
      error: 'NO_TOKEN',
      message: `Not logged in (profile: ${profile}).`,
      hint: 'Run `markos login` to get started.',
    }, cli);
    return process.exit(EXIT_CODES.AUTH_FAILURE);
  }

  const retries = Number.isFinite(cli.retries) ? cli.retries : undefined;
  let res;
  const spinner = createSpinner({ label: 'fetching identity', opts: cli });
  try {
    const ctxOpts = { token };
    if (retries !== undefined) ctxOpts.retries = retries;
    res = await authedFetch('/api/tenant/whoami', { method: 'GET' }, ctxOpts);
  } catch (err) {
    return handleFetchError(err, cli);
  } finally {
    spinner.stop();
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 401) {
    return exitAuth(cli, body?.error || 'generic');
  }

  if (!res.ok) {
    return exitTransient(cli, 'SERVER_ERROR', `Whoami failed (${res.status}): ${body?.error || 'unknown'}`);
  }

  renderEnvelope(body, profile, cli);
  process.exit(EXIT_CODES.SUCCESS);
}

module.exports = { main };
module.exports._BASE_URL = BASE_URL;
module.exports._formatLastUsed = formatLastUsed;
