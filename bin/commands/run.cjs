'use strict';

// Phase 204 Plan 06 Task 3 — `markos run <brief>` CLI command.
//
// Submits a durable run via POST /api/tenant/runs, then (by default) opens a
// Server-Sent Events connection to GET /api/tenant/runs/{run_id}/events to
// watch progress in real time. SIGINT sends a POST /cancel + exits gracefully.
//
// Flags:
//   --brief=<path>        brief source (or first positional arg)
//   --no-watch            submit + print run_id, exit immediately (fire-and-forget)
//   --watch=false         same as --no-watch
//   --json                one-line JSON per event (stdout)
//   --timeout=<seconds>   hard cap on watch duration (default 1800 = 30min)
//
// Exit codes (D-10):
//   0  SUCCESS         (run.completed status='success' OR --no-watch run_id printed)
//   1  USER_ERROR      (invalid brief / missing args / failed run)
//   2  TRANSIENT       (timeout, 5xx, network)
//   3  AUTH_FAILURE    (401 / no keychain)
//
// Flow:
//   1. Resolve brief source + parse + validate (exit 1 USER_ERROR on bad).
//   2. resolveProfile + getToken (exit 3 on no token).
//   3. POST /api/tenant/runs → 201 { run_id, events_url }.
//   4. If --no-watch: print run_id + exit 0.
//   5. Install SIGINT handler: POST /cancel + print friendly hint + exit 0.
//   6. Call streamSSE(events_url) + render each event.
//   7. On 'run.completed' success → exit 0; failed → exit 1.
//   8. On timeout → exit 2.

const path = require('node:path');

const { authedFetch, BASE_URL, AuthError, TransientError } = require('../lib/cli/http.cjs');
const { getToken } = require('../lib/cli/keychain.cjs');
const { resolveProfile } = require('../lib/cli/config.cjs');
const { createSpinner } = require('../lib/cli/spinner.cjs');
const { streamSSE } = require('../lib/cli/sse.cjs');
const {
  EXIT_CODES, shouldUseJson, shouldUseColor, ANSI, pickGlyphs,
} = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');
const { parseBrief, validateBrief, normalizeBrief } = require('../lib/brief-parser.cjs');

const CREATE_ENDPOINT = '/api/tenant/runs';
const DEFAULT_TIMEOUT_SEC = 30 * 60;

// ─── Small helpers ─────────────────────────────────────────────────────────

function resolveBriefSource(cli = {}) {
  if (cli.brief && typeof cli.brief === 'string') return cli.brief;
  const positional = Array.isArray(cli.positional) ? cli.positional : [];
  if (positional.length > 0 && typeof positional[0] === 'string') return positional[0];
  const args = Array.isArray(cli.args) ? cli.args : [];
  if (args.length > 0 && typeof args[0] === 'string') return args[0];
  return null;
}

function shouldWatch(cli = {}) {
  if (cli.watch === false) return false;
  if (cli.watch === 'false') return false;
  if (cli['no-watch'] === true) return false;
  if (cli.detach === true || cli.detach === 'true') return false;
  return true;
}

function resolveTimeoutSec(cli = {}) {
  const n = Number.parseInt(String(cli.timeout || ''), 10);
  if (Number.isFinite(n) && n > 0) return n;
  return DEFAULT_TIMEOUT_SEC;
}

function exitUsage(cli, message) {
  formatError({
    error: 'INVALID_ARGS',
    message,
    hint: 'Usage: markos run <brief.yaml> [--no-watch] [--json] [--timeout=<sec>]',
  }, cli);
  return process.exit(EXIT_CODES.USER_ERROR);
}

function exitAuth(cli, signature) {
  const payload = signature === 'revoked_token'
    ? { error: 'UNAUTHORIZED', message: 'This API key was revoked.', hint: 'Run `markos login` to mint a fresh key.' }
    : { error: 'UNAUTHORIZED', message: 'Authentication failed.', hint: 'Run `markos login` again.' };
  formatError(payload, cli);
  return process.exit(EXIT_CODES.AUTH_FAILURE);
}

function exitTransient(cli, error, message) {
  formatError({ error, message }, cli);
  return process.exit(EXIT_CODES.TRANSIENT);
}

function signatureFromBody(bodyText) {
  if (/revoked_token/.test(bodyText)) return 'revoked_token';
  if (/invalid_token/.test(bodyText)) return 'invalid_token';
  return 'generic';
}

function loadAndValidateBrief(briefSource, cli) {
  let rawBrief;
  try {
    rawBrief = parseBrief(briefSource);
  } catch (err) {
    formatError({
      error: 'INVALID_BRIEF',
      message: `Could not read brief: ${err?.message || err}`,
      hint: 'Provide a YAML or JSON file with channel/audience/pain/promise/brand.',
    }, cli);
    process.exit(EXIT_CODES.USER_ERROR);
    return null;
  }
  const validation = validateBrief(rawBrief);
  if (!validation.ok) {
    formatError({
      error: 'INVALID_BRIEF',
      message: 'Brief is missing required fields.',
      hint: validation.errors.join('; '),
    }, cli);
    process.exit(EXIT_CODES.USER_ERROR);
    return null;
  }
  return { normalized: normalizeBrief(rawBrief) };
}

async function postRun(normalized, token, cli) {
  try {
    return await authedFetch(CREATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: normalized }),
    }, { token });
  } catch (err) {
    if (err instanceof AuthError) {
      const bodyText = typeof err?.body === 'string' ? err.body : '';
      exitAuth(cli, signatureFromBody(bodyText));
      return null;
    }
    if (err instanceof TransientError) {
      exitTransient(cli, 'SERVER_ERROR', `Server error: ${err.message}`);
      return null;
    }
    exitTransient(cli, 'NETWORK_ERROR', err?.message || 'Unknown network error');
    return null;
  }
}

// ─── Rendering ─────────────────────────────────────────────────────────────

function ttyIcon(event, color) {
  const G = pickGlyphs();
  if (!color) {
    if (event === 'run.completed') return 'done';
    if (event === 'run.step.completed') return 'ok  ';
    if (event === 'run.step.started') return '... ';
    if (event === 'run.snapshot') return `${G.arrow}  `;
    if (event === 'heartbeat') return '·   ';
    if (event === 'run.aborted') return '!!  ';
    return '    ';
  }
  if (event === 'run.completed') return ANSI.GREEN + '✓ ' + ANSI.RESET;
  if (event === 'run.step.completed') return ANSI.GREEN + '✓ ' + ANSI.RESET;
  if (event === 'run.step.started') return ANSI.CYAN + '◐ ' + ANSI.RESET;
  if (event === 'run.snapshot') return ANSI.DIM + '» ' + ANSI.RESET;
  if (event === 'heartbeat') return ANSI.DIM + '· ' + ANSI.RESET;
  if (event === 'run.aborted') return ANSI.YELLOW + '! ' + ANSI.RESET;
  return '  ';
}

function ttyIcon(event, color) {
  const G = pickGlyphs();
  if (!color) {
    if (event === 'run.completed') return 'done';
    if (event === 'run.step.completed') return 'ok  ';
    if (event === 'run.step.started') return '... ';
    if (event === 'run.snapshot') return `${G.arrow}  `;
    if (event === 'heartbeat') return 'Â·   ';
    if (event === 'run.aborted') return '!!  ';
    return '    ';
  }
  if (event === 'run.completed') return ANSI.GREEN + 'âœ“ ' + ANSI.RESET;
  if (event === 'run.step.completed') return ANSI.GREEN + 'âœ“ ' + ANSI.RESET;
  if (event === 'run.step.started') return ANSI.CYAN + 'â— ' + ANSI.RESET;
  if (event === 'run.snapshot') return ANSI.DIM + `${G.arrow} ` + ANSI.RESET;
  if (event === 'heartbeat') return ANSI.DIM + 'Â· ' + ANSI.RESET;
  if (event === 'run.aborted') return ANSI.YELLOW + '! ' + ANSI.RESET;
  return '  ';
}

function renderEvent(evt, cli) {
  if (shouldUseJson(cli)) {
    process.stdout.write(JSON.stringify({ event: evt.event, data: evt.payload || evt.data || null, id: evt.id }) + '\n');
    return;
  }
  if (evt.event === 'heartbeat') return; // suppress in TTY; noisy
  const color = shouldUseColor(cli);
  const icon = ttyIcon(evt.event, color);
  const payload = evt.payload || {};
  let line = '';
  if (evt.event === 'run.snapshot') {
    line = `${icon}snapshot  ${payload.run_id || ''}  status=${payload.status || '?'}`;
  } else if (evt.event === 'run.step.started') {
    line = `${icon}step ${payload.step || '?'} / ${payload.steps_total || '?'}  started`;
  } else if (evt.event === 'run.step.completed') {
    line = `${icon}step ${payload.step || '?'} / ${payload.steps_total || '?'}  done`;
  } else if (evt.event === 'run.completed') {
    const status = payload.status || 'unknown';
    const tag = color
      ? (status === 'success' ? ANSI.GREEN : ANSI.RED) + status + ANSI.RESET
      : status;
    line = `${icon}run.completed  status=${tag}`;
  } else if (evt.event === 'run.aborted') {
    line = `${icon}run.aborted  reason=${payload.reason || 'unknown'}`;
  } else {
    line = `${icon}${evt.event}`;
  }
  process.stdout.write(line + '\n');
}

// ─── Cancellation helper ───────────────────────────────────────────────────

async function sendCancel(run_id, token) {
  try {
    await authedFetch(`/api/tenant/runs/${run_id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, { token, retries: 0 });
  } catch {
    // Cancellation is best-effort; the run will still terminate eventually.
  }
}

// ─── main ─────────────────────────────────────────────────────────────────

async function main(ctx = {}) {
  const cli = ctx?.cli || ctx || {};

  // 1. Brief source.
  const briefSource = resolveBriefSource(cli);
  if (!briefSource) {
    return exitUsage(cli, 'markos run: missing brief. Pass a YAML/JSON path or --brief=<path>.');
  }

  // 2. Parse + validate.
  const loaded = loadAndValidateBrief(briefSource, cli);
  if (!loaded) return;
  const { normalized } = loaded;

  // 3. Auth.
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

  // 4. POST the run.
  const submitSpinner = createSpinner({ label: 'submitting run', opts: cli });
  let res;
  try {
    res = await postRun(normalized, token, cli);
  } finally {
    submitSpinner.stop();
  }
  if (!res) return;

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (res.status === 400) {
    const errors = Array.isArray(body?.errors) ? body.errors : [];
    formatError({
      error: 'INVALID_BRIEF',
      message: 'Server rejected brief.',
      hint: errors.length ? errors.join('; ') : 'Fix your brief and try again.',
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }
  if (res.status === 401) {
    return exitAuth(cli, body?.error || 'generic');
  }
  if (!res.ok) {
    return exitTransient(cli, 'SERVER_ERROR', `Run create failed (${res.status}): ${body?.error || 'unknown'}`);
  }

  const run_id = body?.run_id;
  const events_url = body?.events_url || `/api/tenant/runs/${run_id}/events`;

  if (!run_id) {
    return exitTransient(cli, 'SERVER_ERROR', 'run_create returned no run_id');
  }

  // 5. --no-watch (fire-and-forget).
  if (!shouldWatch(cli)) {
    if (shouldUseJson(cli)) {
      process.stdout.write(JSON.stringify({ run_id, status: body.status || 'pending', events_url }) + '\n');
    } else {
      process.stderr.write(`Run submitted: ${run_id}\n`);
      process.stderr.write(`Watch with: markos status run ${run_id}\n`);
    }
    return process.exit(EXIT_CODES.SUCCESS);
  }

  // 6. Watch mode — stream SSE events with SIGINT handler + timeout.
  const controller = new AbortController();
  let finalStatus = null;
  let timedOut = false;
  let sigintCaught = false;

  const onSigint = () => {
    // Flag + abort; the actual exit fires after streamSSE unwinds so the
    // main flow can observe it and skip the "stream ended without terminal"
    // path below.
    sigintCaught = true;
    process.stderr.write('\n  Run still executing. Sending cancel… (Ctrl+C again to force-exit)\n');
    controller.abort();
    // Fire-and-forget cancel RPC. We don't await it here — the main flow
    // sees sigintCaught and exits 0 first.
    sendCancel(run_id, token).catch(() => { /* advisory */ });
  };
  process.on('SIGINT', onSigint);

  const timeoutSec = resolveTimeoutSec(cli);
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutSec * 1000);

  const fullUrl = `${BASE_URL.replace(/\/+$/, '')}${events_url}`;

  try {
    await streamSSE(fullUrl, {
      token,
      signal: controller.signal,
      heartbeatMs: 22_500,
      maxRetries: 2,
      onEvent: (evt) => {
        renderEvent(evt, cli);
        if (evt.event === 'run.completed') {
          finalStatus = (evt.payload && evt.payload.status) || 'unknown';
          controller.abort();
        }
      },
    });
  } finally {
    clearTimeout(timeoutHandle);
    process.removeListener('SIGINT', onSigint);
  }

  // SIGINT path: graceful exit 0 regardless of what streamSSE saw.
  // Use process.exitCode (not process.exit) so inflight undici/fetch handles
  // can unwind cleanly — avoids libuv assertion on Windows (UV_HANDLE_CLOSING).
  if (sigintCaught) {
    process.stderr.write(`  Check status with: markos status run ${run_id}\n`);
    process.exitCode = EXIT_CODES.SUCCESS;
    return;
  }

  if (timedOut && !finalStatus) {
    formatError({
      error: 'TIMEOUT',
      message: `Run did not complete within ${timeoutSec}s. Check status with: markos status run ${run_id}`,
    }, cli);
    process.exitCode = EXIT_CODES.TRANSIENT;
    return;
  }

  if (finalStatus === 'success') { process.exitCode = EXIT_CODES.SUCCESS; return; }
  if (finalStatus === 'failed')  { process.exitCode = EXIT_CODES.USER_ERROR; return; }
  if (finalStatus === 'cancelled') { process.exitCode = EXIT_CODES.USER_ERROR; return; }

  // Stream ended without a terminal frame — treat as transient so CI can retry.
  formatError({ error: 'SERVER_ERROR', message: 'Stream ended without terminal event' }, cli);
  process.exitCode = EXIT_CODES.TRANSIENT;
}

module.exports = { main };
module.exports._CREATE_ENDPOINT = CREATE_ENDPOINT;
module.exports._DEFAULT_TIMEOUT_SEC = DEFAULT_TIMEOUT_SEC;
module.exports._resolveBriefSource = resolveBriefSource;
module.exports._shouldWatch = shouldWatch;
module.exports._resolveTimeoutSec = resolveTimeoutSec;
module.exports._renderEvent = renderEvent;
module.exports._sendCancel = sendCancel;
