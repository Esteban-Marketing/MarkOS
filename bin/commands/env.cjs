'use strict';

// Phase 204 Plan 07 Task 3 — `markos env` CLI subcommand dispatcher.
//
// Subcommands (aliased dispatch; unknown → usage + exit 1):
//   markos env list                                  — GET  /api/tenant/env
//   markos env pull [--force|--diff|--merge]         — GET  /api/tenant/env/pull + write .markos-local/.env
//   markos env push [--dry-run]                      — POST /api/tenant/env/push
//   markos env delete <key> [--yes]                  — POST /api/tenant/env/delete
//
// Exit codes (D-10):
//   0 SUCCESS
//   1 USER_ERROR       (bad subcommand, missing key, file_exists refusal, invalid .env, no --yes in non-TTY)
//   2 TRANSIENT        (5xx, network)
//   3 AUTH_FAILURE     (no token, 401)
//   4 QUOTA_PERMISSION (403)
//   5 INTERNAL_BUG     (unhandled)
//
// .markos-local/.env safety (RESEARCH §Pitfall 4):
//   - pull refuses to overwrite existing file without --force / --diff / --merge
//   - pull --diff prints a key-level diff (additions / removals / changed) + exits 0
//   - pull --merge preserves local-only keys; remote wins on conflicts
//   - all write paths chmod 0o600 after write
//   - bin/install.cjs::applyGitignoreProtections already added .markos-local/ to .gitignore

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const { authedFetch, BASE_URL, AuthError, TransientError } = require('../lib/cli/http.cjs');
const { getToken } = require('../lib/cli/keychain.cjs');
const { resolveProfile } = require('../lib/cli/config.cjs');
const { createSpinner } = require('../lib/cli/spinner.cjs');
const { EXIT_CODES, shouldUseJson, renderTable, renderJson } = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');
const { parseDotenv, serializeDotenv } = require('../../lib/markos/cli/env.cjs');

const SUBCOMMANDS = ['list', 'pull', 'push', 'delete'];
const LIST_COLUMNS = ['key', 'value_preview', 'updated_at'];
const LOCAL_ENV_PATH = '.markos-local/.env';

// ─── Helpers ──────────────────────────────────────────────────────────────

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
  process.stderr.write('usage: markos env list|pull|push|delete\n');
}

async function getAuthToken(profile, cli) {
  const token = await getToken(profile);
  if (!token) {
    formatError({
      error: 'NO_TOKEN',
      message: `No API token found for profile "${profile}".`,
      hint: 'Run `markos login` first.',
    }, cli);
    process.exit(EXIT_CODES.AUTH_FAILURE);
  }
  return token;
}

function handleHttpError(err, cli) {
  if (err instanceof AuthError) {
    const status = err.status || 401;
    if (status === 403) {
      formatError({
        error: 'FORBIDDEN',
        message: 'Forbidden — your role does not permit this action.',
        hint: 'Only tenant owners/admins can manage env vars.',
      }, cli);
      process.exit(EXIT_CODES.QUOTA_PERMISSION);
    }
    formatError({
      error: 'UNAUTHORIZED',
      message: 'Authentication failed.',
      hint: 'Run `markos login` to re-authenticate.',
    }, cli);
    process.exit(EXIT_CODES.AUTH_FAILURE);
  }
  if (err instanceof TransientError) {
    formatError({ error: 'SERVER_ERROR', message: `Server error: ${err.message}` }, cli);
    process.exit(EXIT_CODES.TRANSIENT);
  }
  formatError({ error: 'INTERNAL', message: err?.message || 'Unknown error' }, cli);
  process.exit(EXIT_CODES.INTERNAL_BUG);
}

function resolveLocalEnvPath() {
  return path.resolve(process.cwd(), LOCAL_ENV_PATH);
}

function readLocalEnvIfExists() {
  const p = resolveLocalEnvPath();
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function writeLocalEnvSecure(text) {
  const p = resolveLocalEnvPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, { mode: 0o600 });
  try { fs.chmodSync(p, 0o600); } catch { /* windows tolerance */ }
  return p;
}

// ─── Subcommand: list ─────────────────────────────────────────────────────

async function doList(cli) {
  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile, cli);

  let res;
  const spinner = createSpinner({ label: 'fetching env', opts: cli });
  try {
    res = await authedFetch('/api/tenant/env', { method: 'GET' }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  } finally {
    spinner.stop();
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (!res.ok) {
    formatError({ error: 'SERVER_ERROR', message: `List failed (${res.status}): ${body?.error || 'unknown'}` }, cli);
    process.exit(EXIT_CODES.TRANSIENT);
  }

  const entries = Array.isArray(body.entries) ? body.entries : [];
  if (shouldUseJson(cli)) {
    renderJson({ entries });
  } else if (entries.length === 0) {
    process.stdout.write('  (no env entries)\n');
  } else {
    renderTable(entries, LIST_COLUMNS);
  }
  process.exit(EXIT_CODES.SUCCESS);
}

// ─── Subcommand: pull ─────────────────────────────────────────────────────

async function doPull(cli) {
  const target = resolveLocalEnvPath();
  const exists = fs.existsSync(target);

  // Refuse silent overwrite unless the operator opted into one of the three
  // modes: --force (clobber), --diff (preview-only, no write), or --merge
  // (keep local-only keys; remote wins on conflicts).
  if (exists && !cli.force && !cli.diff && !cli.merge) {
    formatError({
      error: 'INVALID_ARGS',
      message: `file_exists: ${LOCAL_ENV_PATH} already present`,
      hint: 'Use --force to overwrite, --diff to preview, or --merge to preserve local-only keys.',
    }, cli);
    process.exit(EXIT_CODES.USER_ERROR);
  }

  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile, cli);

  let res;
  const spinner = createSpinner({ label: 'pulling env', opts: cli });
  try {
    res = await authedFetch('/api/tenant/env/pull', { method: 'GET' }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  } finally {
    spinner.stop();
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 403) {
    formatError({ error: 'FORBIDDEN', message: body?.error === 'insufficient_role'
      ? 'Only tenant owners/admins can pull env values.'
      : 'Forbidden.' }, cli);
    return process.exit(EXIT_CODES.QUOTA_PERMISSION);
  }
  if (!res.ok) {
    formatError({ error: 'SERVER_ERROR', message: `Pull failed (${res.status}): ${body?.error || 'unknown'}` }, cli);
    return process.exit(EXIT_CODES.TRANSIENT);
  }

  const remoteEntries = Array.isArray(body.entries) ? body.entries : [];
  const remoteMap = Object.fromEntries(remoteEntries.map((e) => [e.key, e.value]));

  // --diff: show additions / removals / changes against local, no write.
  if (cli.diff) {
    const localText = readLocalEnvIfExists();
    const localMap = localText
      ? Object.fromEntries(parseDotenv(localText).entries.map((e) => [e.key, e.value]))
      : {};
    const added = [];
    const changed = [];
    const removed = [];
    for (const [k, v] of Object.entries(remoteMap)) {
      if (!(k in localMap)) added.push(k);
      else if (localMap[k] !== v) changed.push(k);
    }
    for (const k of Object.keys(localMap)) {
      if (!(k in remoteMap)) removed.push(k);
    }
    if (shouldUseJson(cli)) {
      renderJson({ added, changed, removed });
    } else {
      process.stdout.write(`\n  Diff against ${LOCAL_ENV_PATH}:\n`);
      for (const k of added)   process.stdout.write(`    + ${k}\n`);
      for (const k of changed) process.stdout.write(`    ~ ${k}\n`);
      for (const k of removed) process.stdout.write(`    - ${k} (local-only)\n`);
      if (!added.length && !changed.length && !removed.length) {
        process.stdout.write('    (no differences)\n');
      }
      process.stdout.write('\n');
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }

  // --merge: preserve local-only keys.
  let finalEntries = remoteEntries.slice();
  if (cli.merge) {
    const localText = readLocalEnvIfExists();
    const localMap = localText
      ? Object.fromEntries(parseDotenv(localText).entries.map((e) => [e.key, e.value]))
      : {};
    for (const [k, v] of Object.entries(localMap)) {
      if (!(k in remoteMap)) finalEntries.push({ key: k, value: v });
    }
    // Stable-sort for determinism.
    finalEntries.sort((a, b) => String(a.key).localeCompare(String(b.key)));
  }

  const serialized = serializeDotenv(finalEntries);
  const written = writeLocalEnvSecure(serialized);

  if (shouldUseJson(cli)) {
    renderJson({ written, count: finalEntries.length, mode: cli.merge ? 'merge' : (cli.force ? 'force' : 'new') });
  } else {
    process.stdout.write(`\n  Pulled ${finalEntries.length} env entries → ${LOCAL_ENV_PATH} (0o600).\n\n`);
  }
  process.exit(EXIT_CODES.SUCCESS);
}

// ─── Subcommand: push ─────────────────────────────────────────────────────

async function doPush(cli) {
  const target = resolveLocalEnvPath();
  if (!fs.existsSync(target)) {
    formatError({
      error: 'NOT_FOUND',
      message: `no .env file at ${LOCAL_ENV_PATH}`,
      hint: 'Create one (e.g. `cp .env.example .markos-local/.env`) or run `markos env pull` first.',
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  const text = fs.readFileSync(target, 'utf8');
  const parsed = parseDotenv(text);
  if (!parsed.ok) {
    const errs = parsed.errors.map((e) => `${e.reason}${e.key ? ` (${e.key})` : ''} on line ${e.line}`);
    formatError({
      error: 'INVALID_ARGS',
      message: `Invalid .env file: ${errs.length} error(s).`,
      hint: errs.slice(0, 3).join('; '),
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  if (cli['dry-run'] || cli.dryRun) {
    if (shouldUseJson(cli)) {
      renderJson({ entries: parsed.entries, dry_run: true });
    } else {
      process.stdout.write(`\n  dry-run: would push ${parsed.entries.length} entries:\n`);
      for (const e of parsed.entries) {
        process.stdout.write(`    ${e.key}\n`);
      }
      process.stdout.write('\n');
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }

  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile, cli);

  let res;
  const spinner = createSpinner({ label: 'pushing env', opts: cli });
  try {
    res = await authedFetch('/api/tenant/env/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entries: parsed.entries }),
    }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  } finally {
    spinner.stop();
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 200) {
    if (shouldUseJson(cli)) {
      renderJson({ updated: body.updated });
    } else {
      process.stdout.write(`\n  Pushed ${body.updated} env entries to tenant.\n\n`);
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }
  if (res.status === 400) {
    formatError({
      error: 'INVALID_ARGS',
      message: `Push rejected: ${body?.error || 'unknown'}`,
      hint: body?.key ? `Offending key: ${body.key}` : undefined,
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
        ? 'Only tenant owners/admins can push env vars.'
        : 'Forbidden.',
    }, cli);
    return process.exit(EXIT_CODES.QUOTA_PERMISSION);
  }
  formatError({ error: 'SERVER_ERROR', message: `Push failed (${res.status}): ${body?.error || 'unknown'}` }, cli);
  process.exit(EXIT_CODES.TRANSIENT);
}

// ─── Subcommand: delete ───────────────────────────────────────────────────

async function doDelete(cli) {
  const key = cli.positional?.[1];
  if (!key) {
    process.stderr.write('usage: markos env delete <key> [--yes]\n');
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  // --yes gate (mirror keys revoke pattern; T-204-07-05 one-way tamper guard).
  if (!cli.yes) {
    if (!process.stdout.isTTY) {
      process.stderr.write('refusing to delete env key without --yes flag in non-interactive mode\n');
      return process.exit(EXIT_CODES.USER_ERROR);
    }
    const answer = await promptYesNo(`Delete env key "${key}"? This cannot be undone. [y/N] `);
    if (answer !== 'y' && answer !== 'yes') {
      process.stdout.write('Aborted.\n');
      return process.exit(EXIT_CODES.USER_ERROR);
    }
  }

  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile, cli);

  let res;
  try {
    res = await authedFetch('/api/tenant/env/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ keys: [key] }),
    }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 200) {
    if (shouldUseJson(cli)) {
      renderJson({ deleted: body.deleted, key });
    } else {
      process.stdout.write(`\n  Deleted env key "${key}".\n\n`);
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }
  if (res.status === 400) {
    formatError({
      error: 'INVALID_ARGS',
      message: `Delete rejected: ${body?.error || 'unknown'}`,
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }
  if (res.status === 403) {
    formatError({
      error: 'FORBIDDEN',
      message: body?.error === 'insufficient_role'
        ? 'Only tenant owners/admins can delete env vars.'
        : 'Forbidden.',
    }, cli);
    return process.exit(EXIT_CODES.QUOTA_PERMISSION);
  }
  formatError({ error: 'SERVER_ERROR', message: `Delete failed (${res.status}): ${body?.error || 'unknown'}` }, cli);
  process.exit(EXIT_CODES.TRANSIENT);
}

// ─── main ─────────────────────────────────────────────────────────────────

async function doPull(cli) {
  const target = resolveLocalEnvPath();
  const exists = fs.existsSync(target);

  if (exists && !cli.force && !cli.diff && !cli.merge) {
    formatError({
      error: 'INVALID_ARGS',
      message: `file_exists: ${LOCAL_ENV_PATH} already present`,
      hint: 'Use --force to overwrite, --diff to preview, or --merge to preserve local-only keys.',
    }, cli);
    process.exit(EXIT_CODES.USER_ERROR);
  }

  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile, cli);

  let res;
  const spinner = createSpinner({ label: 'pulling env', opts: cli });
  try {
    res = await authedFetch('/api/tenant/env/pull', { method: 'GET' }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  } finally {
    spinner.stop();
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 403) {
    formatError({ error: 'FORBIDDEN', message: body?.error === 'insufficient_role'
      ? 'Only tenant owners/admins can pull env values.'
      : 'Forbidden.' }, cli);
    return process.exit(EXIT_CODES.QUOTA_PERMISSION);
  }
  if (!res.ok) {
    formatError({ error: 'SERVER_ERROR', message: `Pull failed (${res.status}): ${body?.error || 'unknown'}` }, cli);
    return process.exit(EXIT_CODES.TRANSIENT);
  }

  const remoteEntries = Array.isArray(body.entries) ? body.entries : [];
  const remoteMap = Object.fromEntries(remoteEntries.map((e) => [e.key, e.value]));

  if (cli.diff) {
    const localText = readLocalEnvIfExists();
    const localMap = localText
      ? Object.fromEntries(parseDotenv(localText).entries.map((e) => [e.key, e.value]))
      : {};
    const added = [];
    const changed = [];
    const removed = [];
    for (const [k, v] of Object.entries(remoteMap)) {
      if (!(k in localMap)) added.push(k);
      else if (localMap[k] !== v) changed.push(k);
    }
    for (const k of Object.keys(localMap)) {
      if (!(k in remoteMap)) removed.push(k);
    }
    if (shouldUseJson(cli)) {
      renderJson({ added, changed, removed });
    } else {
      process.stdout.write(`\n  Diff against ${LOCAL_ENV_PATH}:\n`);
      for (const k of added) process.stdout.write(`    + ${k}\n`);
      for (const k of changed) process.stdout.write(`    ~ ${k}\n`);
      for (const k of removed) process.stdout.write(`    - ${k} (local-only)\n`);
      if (!added.length && !changed.length && !removed.length) {
        process.stdout.write('    (no differences)\n');
      }
      process.stdout.write('\n');
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }

  let finalEntries = remoteEntries.slice();
  if (cli.merge) {
    const localText = readLocalEnvIfExists();
    const localMap = localText
      ? Object.fromEntries(parseDotenv(localText).entries.map((e) => [e.key, e.value]))
      : {};
    for (const [k, v] of Object.entries(localMap)) {
      if (!(k in remoteMap)) finalEntries.push({ key: k, value: v });
    }
    finalEntries.sort((a, b) => String(a.key).localeCompare(String(b.key)));
  }

  const serialized = serializeDotenv(finalEntries);
  const written = writeLocalEnvSecure(serialized);

  if (shouldUseJson(cli)) {
    renderJson({ written, count: finalEntries.length, mode: cli.merge ? 'merge' : (cli.force ? 'force' : 'new') });
  } else {
    process.stderr.write(`\n  Pulled ${finalEntries.length} env entries -> ${LOCAL_ENV_PATH} (0o600).\n\n`);
  }
  process.exit(EXIT_CODES.SUCCESS);
}

async function doPush(cli) {
  const target = resolveLocalEnvPath();
  if (!fs.existsSync(target)) {
    formatError({
      error: 'NOT_FOUND',
      message: `no .env file at ${LOCAL_ENV_PATH}`,
      hint: 'Create one (e.g. `cp .env.example .markos-local/.env`) or run `markos env pull` first.',
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  const text = fs.readFileSync(target, 'utf8');
  const parsed = parseDotenv(text);
  if (!parsed.ok) {
    const errs = parsed.errors.map((e) => `${e.reason}${e.key ? ` (${e.key})` : ''} on line ${e.line}`);
    formatError({
      error: 'INVALID_ARGS',
      message: `Invalid .env file: ${errs.length} error(s).`,
      hint: errs.slice(0, 3).join('; '),
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  if (cli['dry-run'] || cli.dryRun) {
    if (shouldUseJson(cli)) {
      renderJson({ entries: parsed.entries, dry_run: true });
    } else {
      process.stdout.write(`\n  dry-run: would push ${parsed.entries.length} entries:\n`);
      for (const e of parsed.entries) process.stdout.write(`    ${e.key}\n`);
      process.stdout.write('\n');
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }

  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile, cli);

  let res;
  const spinner = createSpinner({ label: 'pushing env', opts: cli });
  try {
    res = await authedFetch('/api/tenant/env/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entries: parsed.entries }),
    }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  } finally {
    spinner.stop();
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 200) {
    if (shouldUseJson(cli)) {
      renderJson({ updated: body.updated });
    } else {
      process.stderr.write(`\n  Pushed ${body.updated} env entries to tenant.\n\n`);
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }
  if (res.status === 400) {
    formatError({
      error: 'INVALID_ARGS',
      message: `Push rejected: ${body?.error || 'unknown'}`,
      hint: body?.key ? `Offending key: ${body.key}` : undefined,
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
        ? 'Only tenant owners/admins can push env vars.'
        : 'Forbidden.',
    }, cli);
    return process.exit(EXIT_CODES.QUOTA_PERMISSION);
  }
  formatError({ error: 'SERVER_ERROR', message: `Push failed (${res.status}): ${body?.error || 'unknown'}` }, cli);
  process.exit(EXIT_CODES.TRANSIENT);
}

async function doDelete(cli) {
  const key = cli.positional?.[1];
  if (!key) {
    process.stderr.write('usage: markos env delete <key> [--yes]\n');
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  if (!cli.yes) {
    if (!process.stdout.isTTY) {
      process.stderr.write('refusing to delete env key without --yes flag in non-interactive mode\n');
      return process.exit(EXIT_CODES.USER_ERROR);
    }
    const answer = await promptYesNo(`Delete env key "${key}"? This cannot be undone. [y/N] `);
    if (answer !== 'y' && answer !== 'yes') {
      process.stderr.write('Aborted.\n');
      return process.exit(EXIT_CODES.USER_ERROR);
    }
  }

  const profile = resolveProfile(cli);
  const token = await getAuthToken(profile, cli);

  let res;
  try {
    res = await authedFetch('/api/tenant/env/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ keys: [key] }),
    }, { token });
  } catch (err) {
    return handleHttpError(err, cli);
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 200) {
    if (shouldUseJson(cli)) {
      renderJson({ deleted: body.deleted, key });
    } else {
      process.stderr.write(`\n  Deleted env key "${key}".\n\n`);
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }
  if (res.status === 400) {
    formatError({
      error: 'INVALID_ARGS',
      message: `Delete rejected: ${body?.error || 'unknown'}`,
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }
  if (res.status === 403) {
    formatError({
      error: 'FORBIDDEN',
      message: body?.error === 'insufficient_role'
        ? 'Only tenant owners/admins can delete env vars.'
        : 'Forbidden.',
    }, cli);
    return process.exit(EXIT_CODES.QUOTA_PERMISSION);
  }
  formatError({ error: 'SERVER_ERROR', message: `Delete failed (${res.status}): ${body?.error || 'unknown'}` }, cli);
  process.exit(EXIT_CODES.TRANSIENT);
}

async function main(ctx = {}) {
  const cli = (ctx && ctx.cli) || ctx || {};
  const sub = cli.positional?.[0];

  if (!sub || !SUBCOMMANDS.includes(sub)) {
    usage();
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  if (sub === 'list')   return doList(cli);
  if (sub === 'pull')   return doPull(cli);
  if (sub === 'push')   return doPush(cli);
  if (sub === 'delete') return doDelete(cli);

  usage();
  return process.exit(EXIT_CODES.USER_ERROR);
}

module.exports = { main };
module.exports._BASE_URL = BASE_URL;
module.exports._SUBCOMMANDS = SUBCOMMANDS;
module.exports._LOCAL_ENV_PATH = LOCAL_ENV_PATH;
