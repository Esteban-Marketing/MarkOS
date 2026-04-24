'use strict';

// Phase 204 Plan 03 Task 3 — `markos keys` CLI subcommand dispatcher.
//
// Subcommands:
//   markos keys list                       — GET  /api/tenant/api-keys
//   markos keys create [--name=LABEL]      — POST /api/tenant/api-keys
//   markos keys revoke <key_id> [--yes]    — POST /api/tenant/api-keys/{key_id}/revoke
//
// Exit codes (D-10):
//   0 SUCCESS
//   1 USER_ERROR       (bad subcommand, missing key_id, invalid_name, revoke without --yes in non-TTY)
//   2 TRANSIENT        (5xx, network)
//   3 AUTH_FAILURE     (no token, 401)
//   4 QUOTA_PERMISSION (403)
//   5 INTERNAL_BUG     (unhandled)
//
// --yes gate (CONTEXT.md line 109 mandate + T-204-03-07):
//   revoke subcommand WITHOUT --yes in a non-TTY shell exits 1 with
//   'refusing to revoke without --yes flag in non-interactive mode'.
//   In TTY mode without --yes, we prompt "Revoke key X? [y/N] " and require
//   'y' (case-insensitive) to proceed; anything else → exit 1 'Aborted.'

const readline = require('node:readline');

const { authedFetch, BASE_URL, AuthError, TransientError } = require('../lib/cli/http.cjs');
const { getToken } = require('../lib/cli/keychain.cjs');
const { resolveProfile } = require('../lib/cli/config.cjs');
const { EXIT_CODES, shouldUseJson, renderTable, renderJson } = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');

const SUBCOMMANDS = ['list', 'create', 'revoke'];
const LIST_COLUMNS = ['id', 'name', 'key_fingerprint', 'scope', 'created_at', 'last_used_at'];

// Prompt wrapper around node:readline. Resolves to lowercased trimmed input.
function promptYesNo(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer || '').trim().toLowerCase());
    });
  });
}

function usage() {
  process.stderr.write('usage: markos keys list|create|revoke\n');
}

// Resolve keychain token once. Exits 3 if absent.
async function getAuthToken(profile) {
  const token = await getToken(profile);
  if (!token) {
    formatError({
      error: 'NO_TOKEN',
      message: `No API token found for profile "${profile}".`,
      hint: 'Run `markos login` first.',
    });
    process.exit(EXIT_CODES.AUTH_FAILURE);
  }
  return token;
}

// Shared response-error → exit-code mapping. Never throws; exits the process.
function handleHttpError(err, opts) {
  if (err instanceof AuthError) {
    const status = err.status || 401;
    if (status === 403) {
      formatError({
        error: 'FORBIDDEN',
        message: 'Forbidden — your role does not permit this action.',
        hint: 'Only tenant owners/admins can manage API keys.',
      }, opts);
      process.exit(EXIT_CODES.QUOTA_PERMISSION);
    }
    formatError({
      error: 'UNAUTHORIZED',
      message: 'Authentication failed.',
      hint: 'Run `markos login` to re-authenticate.',
    }, opts);
    process.exit(EXIT_CODES.AUTH_FAILURE);
  }
  if (err instanceof TransientError) {
    formatError({
      error: 'SERVER_ERROR',
      message: `Server error: ${err.message}`,
    }, opts);
    process.exit(EXIT_CODES.TRANSIENT);
  }
  formatError({
    error: 'INTERNAL',
    message: err?.message || 'Unknown error',
  }, opts);
  process.exit(EXIT_CODES.INTERNAL_BUG);
}

// ─── Subcommand: list ─────────────────────────────────────────────────────

async function doList(cli) {
  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile);

  let res;
  try {
    res = await authedFetch('/api/tenant/api-keys', { method: 'GET' }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (!res.ok) {
    formatError({
      error: 'SERVER_ERROR',
      message: `List failed (${res.status}): ${body?.error || 'unknown'}`,
    }, cli);
    process.exit(EXIT_CODES.TRANSIENT);
  }

  const keys = Array.isArray(body.keys) ? body.keys : [];
  if (shouldUseJson(cli)) {
    renderJson({ keys });
  } else if (keys.length === 0) {
    process.stdout.write('  (no API keys)\n');
  } else {
    renderTable(keys, LIST_COLUMNS);
  }
  process.exit(EXIT_CODES.SUCCESS);
}

// ─── Subcommand: create ───────────────────────────────────────────────────

async function doCreate(cli) {
  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile);

  const requestBody = {};
  if (cli.name) requestBody.name = cli.name;

  let res;
  try {
    res = await authedFetch('/api/tenant/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestBody),
    }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 201) {
    // Success — surface plaintext access_token ONCE with explicit warning.
    if (shouldUseJson(cli)) {
      renderJson(body);
    } else {
      process.stdout.write('\n');
      process.stdout.write(`  Key ID:      ${body.key_id}\n`);
      if (body.name) process.stdout.write(`  Name:        ${body.name}\n`);
      process.stdout.write(`  Fingerprint: ${body.key_fingerprint}\n`);
      process.stdout.write(`  Token:       ${body.access_token}\n`);
      process.stdout.write('\n');
      process.stdout.write('  ! This is the only time the full token is shown. Store it securely.\n');
      process.stdout.write('\n');
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }

  // Typed error mapping.
  if (res.status === 400 && body?.error === 'invalid_name') {
    formatError({
      error: 'INVALID_ARGS',
      message: 'Invalid --name.',
      hint: 'Name must be 1-64 characters.',
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }
  if (res.status === 401) {
    formatError({ error: 'UNAUTHORIZED', message: 'Authentication failed.', hint: 'Run `markos login`.' }, cli);
    return process.exit(EXIT_CODES.AUTH_FAILURE);
  }
  if (res.status === 403) {
    formatError({
      error: 'FORBIDDEN',
      message: body?.error === 'insufficient_role'
        ? 'Only tenant owners/admins can create API keys.'
        : 'Forbidden.',
    }, cli);
    return process.exit(EXIT_CODES.QUOTA_PERMISSION);
  }

  formatError({
    error: 'SERVER_ERROR',
    message: `Create failed (${res.status}): ${body?.error || 'unknown'}`,
  }, cli);
  process.exit(EXIT_CODES.TRANSIENT);
}

// ─── Subcommand: revoke ───────────────────────────────────────────────────

async function doRevoke(cli) {
  const key_id = cli.positional?.[1];
  if (!key_id) {
    process.stderr.write('usage: markos keys revoke <key_id> [--yes]\n');
    process.exit(EXIT_CODES.USER_ERROR);
  }

  // T-204-03-07: --yes mandate for non-interactive / interactive fallback.
  if (!cli.yes) {
    if (!process.stdout.isTTY) {
      process.stderr.write('refusing to revoke without --yes flag in non-interactive mode\n');
      return process.exit(EXIT_CODES.USER_ERROR);
    }
    // Interactive confirmation.
    const answer = await promptYesNo(`Revoke key ${key_id}? This cannot be undone. [y/N] `);
    if (answer !== 'y' && answer !== 'yes') {
      process.stdout.write('Aborted.\n');
      return process.exit(EXIT_CODES.USER_ERROR);
    }
  }

  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile);

  let res;
  try {
    res = await authedFetch(`/api/tenant/api-keys/${encodeURIComponent(key_id)}/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 200) {
    if (shouldUseJson(cli)) {
      renderJson({ revoked_at: body.revoked_at, key_id });
    } else {
      process.stdout.write(`\n  Key ${key_id} revoked.\n\n`);
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }
  if (res.status === 404) {
    formatError({ error: 'NOT_FOUND', message: `Key ${key_id} not found.` }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }
  if (res.status === 401) {
    formatError({ error: 'UNAUTHORIZED', message: 'Authentication failed.', hint: 'Run `markos login`.' }, cli);
    return process.exit(EXIT_CODES.AUTH_FAILURE);
  }
  if (res.status === 403) {
    formatError({ error: 'FORBIDDEN', message: body?.error || 'Forbidden.' }, cli);
    return process.exit(EXIT_CODES.QUOTA_PERMISSION);
  }

  formatError({
    error: 'SERVER_ERROR',
    message: `Revoke failed (${res.status}): ${body?.error || 'unknown'}`,
  }, cli);
  process.exit(EXIT_CODES.TRANSIENT);
}

// ─── main ─────────────────────────────────────────────────────────────────

async function main(ctx = {}) {
  const cli = (ctx && ctx.cli) || ctx || {};
  const sub = cli.positional?.[0];

  if (!sub || !SUBCOMMANDS.includes(sub)) {
    usage();
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  if (sub === 'list') return doList(cli);
  if (sub === 'create') return doCreate(cli);
  if (sub === 'revoke') return doRevoke(cli);

  usage();
  return process.exit(EXIT_CODES.USER_ERROR);
}

module.exports = { main };
module.exports._BASE_URL = BASE_URL;
module.exports._SUBCOMMANDS = SUBCOMMANDS;
