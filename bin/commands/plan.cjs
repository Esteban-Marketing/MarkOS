'use strict';

// Phase 204 Plan 05 Task 2 — `markos plan <brief>` CLI command.
//
// Pre-execution dry-run. Parses a local brief file (YAML or JSON), validates
// it, posts it to the authenticated /api/tenant/runs/plan endpoint, and
// renders the plan envelope the server would execute. **No state changes
// server-side** — the response carries run_id: null and no billing debit.
//
// Flow:
//   1. Resolve brief source (positional[0] or --brief flag). Missing → exit 4
//      USAGE ERROR with one-line hint.
//   2. parseBrief → validateBrief. Errors → exit 1 with formatted error list.
//   3. resolveProfile + getToken. No token → exit 3 with "Run markos login".
//   4. authedFetch POST /api/tenant/runs/plan with { brief: normalized }.
//   5. 200 → render as either
//        • TTY table: 3-row step breakdown + summary line (tokens + cost)
//        • non-TTY / --json: full envelope as one-line JSON
//   6. 400 → exit 1 (invalid brief; surface the server's error list)
//      401 → exit 3 (auth failure; hint at markos login)
//      5xx / net → exit 2 (transient)
//
// Exit codes (D-10):
//   0 SUCCESS
//   1 USER_ERROR (invalid brief)
//   2 TRANSIENT  (5xx, network)
//   3 AUTH_FAILURE
//   4 USAGE_ERROR (missing brief path, malformed args)
//
// This command is the natural entry point for "what would `markos run` do?"
// — saves tenant quota by letting users verify intent before committing.

const { authedFetch, BASE_URL, AuthError, TransientError } = require('../lib/cli/http.cjs');
const { getToken } = require('../lib/cli/keychain.cjs');
const { resolveProfile } = require('../lib/cli/config.cjs');
const {
  EXIT_CODES, shouldUseJson, shouldUseColor, renderJson, ANSI,
} = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');
const { parseBrief, validateBrief, normalizeBrief } = require('../lib/brief-parser.cjs');

const ENDPOINT = '/api/tenant/runs/plan';

// ─── Brief resolution ──────────────────────────────────────────────────────

// Pull the brief source from CLI args. Checks --brief flag first, then the
// first positional argument (npx markos plan brief.yaml). Returns null if no
// brief was supplied.
function resolveBriefSource(cli = {}) {
  if (cli.brief && typeof cli.brief === 'string') return cli.brief;
  const positional = Array.isArray(cli.positional) ? cli.positional : [];
  if (positional.length > 0 && typeof positional[0] === 'string') return positional[0];
  // Also allow args[0] since cli-runtime.cjs varies.
  const args = Array.isArray(cli.args) ? cli.args : [];
  if (args.length > 0 && typeof args[0] === 'string') return args[0];
  return null;
}

// ─── Rendering ────────────────────────────────────────────────────────────

function renderTTY(envelope, cli) {
  const color = shouldUseColor(cli);
  const label = (s) => color ? (ANSI.DIM + s + ANSI.RESET) : s;
  const value = (s) => color ? (ANSI.BOLD + s + ANSI.RESET) : s;
  const header = color
    ? (ANSI.BOLD + ANSI.CYAN + 'markos plan (dry-run)' + ANSI.RESET)
    : 'markos plan (dry-run)';

  process.stdout.write(header + '\n');
  process.stdout.write(label('plan_id: ') + value(envelope.plan_id) + '\n');
  process.stdout.write(label('tenant:  ') + value(envelope.tenant_id) + '\n');
  process.stdout.write('\n');

  // Step rows — hand-rolled table, zero-dep per D-08.
  const rows = [['step', 'inputs', 'est_tokens'], ['----', '------', '----------']];
  for (const s of envelope.steps) {
    rows.push([s.name, (s.inputs || []).join(', '), String(s.estimated_tokens)]);
  }
  const widths = [0, 0, 0];
  for (const r of rows) for (let i = 0; i < 3; i++) widths[i] = Math.max(widths[i], String(r[i]).length);
  for (const r of rows) {
    const line = r.map((c, i) => String(c).padEnd(widths[i], ' ')).join('  ');
    process.stdout.write(line + '\n');
  }

  process.stdout.write('\n');
  process.stdout.write(label('estimated tokens:   ') + value(String(envelope.estimated_tokens)) + '\n');
  process.stdout.write(label('estimated cost USD: ') + value('$' + envelope.estimated_cost_usd.toFixed(6)) + '\n');
  process.stdout.write(label('estimated duration: ') + value(envelope.estimated_duration_ms + 'ms') + '\n');
  process.stdout.write('\n');
  process.stdout.write(label('note: ') + 'dry-run; no billing debit and no durable run was created.\n');
}

function renderEnvelope(envelope, cli) {
  if (shouldUseJson(cli)) {
    renderJson(envelope);
  } else {
    renderTTY(envelope, cli);
  }
}

// ─── Error dispatch helpers ────────────────────────────────────────────────

function exitUsage(cli, message) {
  formatError({
    error: 'INVALID_ARGS',
    message,
    hint: 'Usage: markos plan <brief.yaml> [--json]',
  }, cli);
  return process.exit(EXIT_CODES.USER_ERROR);
}

function authErrorPayload(signature) {
  if (signature === 'revoked_token') {
    return { error: 'UNAUTHORIZED', message: 'This API key was revoked.', hint: 'Run `markos login` to mint a fresh key.' };
  }
  if (signature === 'invalid_token') {
    return { error: 'UNAUTHORIZED', message: 'Session expired.', hint: 'Run `markos login` again.' };
  }
  return { error: 'UNAUTHORIZED', message: 'Authentication failed.', hint: 'Run `markos login` to re-authenticate.' };
}

function exitAuth(cli, signature) {
  formatError(authErrorPayload(signature), cli);
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

// Prepare + validate the brief. Returns { normalized } or exits with USER_ERROR.
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

// Post to the plan endpoint; returns the fetch Response or triggers exit.
async function postPlan(normalized, token, cli) {
  const retries = Number.isFinite(cli.retries) ? cli.retries : undefined;
  try {
    const ctxOpts = { token };
    if (retries !== undefined) ctxOpts.retries = retries;
    return await authedFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: normalized }),
    }, ctxOpts);
  } catch (err) {
    handleFetchError(err, cli);
    return null;
  }
}

// Dispatch the server response body to the correct exit path, or render.
function handleResponse(res, body, cli) {
  if (res.status === 400) {
    const errors = Array.isArray(body?.errors) ? body.errors : [];
    formatError({
      error: 'INVALID_BRIEF',
      message: body?.error === 'invalid_brief' ? 'Server rejected brief.' : (body?.error || 'Bad request.'),
      hint: errors.length ? errors.join('; ') : 'Fix your brief and try again.',
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }
  if (res.status === 401) {
    return exitAuth(cli, body?.error || 'generic');
  }
  if (!res.ok) {
    return exitTransient(cli, 'SERVER_ERROR', `Plan failed (${res.status}): ${body?.error || 'unknown'}`);
  }
  renderEnvelope(body, cli);
  return process.exit(EXIT_CODES.SUCCESS);
}

// ─── main ─────────────────────────────────────────────────────────────────

async function main(ctx = {}) {
  const cli = ctx?.cli || ctx || {};

  // 1. Brief source.
  const briefSource = resolveBriefSource(cli);
  if (!briefSource) {
    return exitUsage(cli, 'markos plan: missing brief. Pass a YAML/JSON path or --brief=<path>.');
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

  // 4. POST the brief to the plan endpoint.
  const res = await postPlan(normalized, token, cli);
  if (!res) return;

  let body;
  try { body = await res.json(); } catch { body = {}; }

  // 5. Dispatch response — handleResponse renders or exits.
  return handleResponse(res, body, cli);
}

module.exports = { main };
module.exports._ENDPOINT = ENDPOINT;
module.exports._BASE_URL = BASE_URL;
module.exports._resolveBriefSource = resolveBriefSource;
