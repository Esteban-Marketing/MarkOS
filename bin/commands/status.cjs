'use strict';

// Phase 204 Plan 08 Task 2 — `markos status` CLI command.
//
// Operator-self-serve dashboard. Renders the cross-domain status envelope
// (subscription / quota / active rotations / recent runs) with hand-rolled
// unicode box panels + colored progress bars.
//
// Subcommands & flags:
//   markos status                 — fetch GET /api/tenant/status + render dashboard
//   markos status run <run_id>    — fetch GET /api/tenant/runs/{id}/events (1 snapshot frame)
//                                   and render single-run detail
//   --watch                       — TTY only; refresh every 5s; SIGINT exits 0
//   --json                        — one-line JSON envelope (also auto-on in non-TTY)
//   --runs=N                      — override recent_runs panel size (1..50)
//
// Exit codes (D-10):
//   0 SUCCESS         (default render OR --watch SIGINT'd cleanly)
//   1 USER_ERROR      (status run with no run_id, watch_requires_tty, 404)
//   2 TRANSIENT       (5xx, network)
//   3 AUTH_FAILURE    (no token, 401)
//
// Quota progress-bar color thresholds (constants — single source of truth):
//   GREEN  : 0   <= pct < 70
//   YELLOW : 70  <= pct < 90
//   RED    : 90  <= pct
//
// Rotation stage colors (mirrors Phase 203 Surface 4 banner):
//   normal : green  (>7 days remaining)
//   t-7    : yellow (1–7 days)
//   t-1    : red    (<1 day)
//   t-0    : red    (in or past expiry)

const { authedFetch, BASE_URL, AuthError, TransientError } = require('../lib/cli/http.cjs');
const { getToken } = require('../lib/cli/keychain.cjs');
const { resolveProfile } = require('../lib/cli/config.cjs');
const { EXIT_CODES, shouldUseJson, shouldUseColor, ANSI, renderJson } = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_ENDPOINT = '/api/tenant/status';
const RUN_EVENTS_ENDPOINT = (id) => `/api/tenant/runs/${id}/events`;

const WATCH_INTERVAL_MS = 5000;
const WATCH_MAX_DURATION_MS = 60 * 60 * 1000; // 60-minute safety cap (T-204-08-02)
const PROGRESS_BAR_WIDTH = 15;

// Quota color thresholds — declared once, consumed by progressBar() + renderQuotaPanel().
const QUOTA_THRESHOLDS = Object.freeze({
  GREEN_MAX_PCT:  70,    // 0..69 → green
  YELLOW_MAX_PCT: 90,    // 70..89 → yellow; 90+ → red
});

// Rough plan-tier quota allowances used purely for client-side bar rendering
// when the server envelope doesn't carry hard limits yet (Phase 205 will
// surface authoritative limits). These are conservative defaults so the
// progress-bar visualisation is meaningful.
const PLAN_LIMITS = Object.freeze({
  free:       { runs: 100,    tokens: 100_000,    deliveries: 1_000   },
  pro:        { runs: 5_000,  tokens: 5_000_000,  deliveries: 50_000  },
  enterprise: { runs: 50_000, tokens: 50_000_000, deliveries: 500_000 },
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function isTTY() {
  return Boolean(process.stdout.isTTY);
}

function exitUsage(cli, message, hint) {
  formatError({
    error: 'INVALID_ARGS',
    message,
    hint: hint || 'Usage: markos status [run <run_id>] [--watch] [--json] [--runs=N]',
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

function shouldWatch(cli = {}) {
  return cli.watch === true || cli.watch === 'true';
}

function resolveRunsLimit(cli = {}) {
  const raw = cli.runs;
  if (raw == null) return undefined;
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(50, n);
}

function formatRelative(iso) {
  if (!iso) return '—';
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

function abbreviate(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(v);
}

// Hand-rolled progress bar — single owner of QUOTA_THRESHOLDS coloring.
// Returns the colorised bar string (no leading/trailing whitespace).
function progressBar(pct, useColor) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const filled = Math.floor((clamped / 100) * PROGRESS_BAR_WIDTH);
  const empty = PROGRESS_BAR_WIDTH - filled;
  const head = filled > 0 ? '='.repeat(Math.max(0, filled - 1)) + '>' : '';
  const tail = ' '.repeat(empty);
  const body = `[${head}${tail}]`;
  if (!useColor) return body;
  if (clamped >= QUOTA_THRESHOLDS.YELLOW_MAX_PCT) return ANSI.RED + body + ANSI.RESET;
  if (clamped >= QUOTA_THRESHOLDS.GREEN_MAX_PCT) return ANSI.YELLOW + body + ANSI.RESET;
  return ANSI.GREEN + body + ANSI.RESET;
}

function colorRotationStage(stage, useColor) {
  if (!useColor) return stage;
  if (stage === 't-0' || stage === 't-1') return ANSI.RED + stage + ANSI.RESET;
  if (stage === 't-7') return ANSI.YELLOW + stage + ANSI.RESET;
  return ANSI.GREEN + stage + ANSI.RESET;
}

function colorRunStatus(status, useColor) {
  if (!useColor) return status;
  if (status === 'success') return ANSI.GREEN + status + ANSI.RESET;
  if (status === 'failed' || status === 'cancelled') return ANSI.RED + status + ANSI.RESET;
  if (status === 'running') return ANSI.CYAN + status + ANSI.RESET;
  return ANSI.DIM + status + ANSI.RESET;
}

// ─── Render: TTY box panels ────────────────────────────────────────────────

function strip(s) {
  // eslint-disable-next-line no-control-regex
  return String(s).replace(/\x1b\[[0-9;]*m/g, '');
}

function renderBoxPanel(title, lines, opts = {}) {
  const innerWidth = Math.max(
    title.length + 4,
    ...lines.map((l) => strip(l).length),
    opts.minWidth || 0,
  );
  const out = [];
  out.push('┌─ ' + title + ' ' + '─'.repeat(Math.max(0, innerWidth - title.length - 1)) + '┐');
  for (const l of lines) {
    const pad = Math.max(0, innerWidth - strip(l).length);
    out.push('│ ' + l + ' '.repeat(pad) + ' │');
  }
  out.push('└' + '─'.repeat(innerWidth + 2) + '┘');
  return out;
}

function renderSubscriptionPanel(subscription, useColor) {
  const lines = [
    `Plan:           ${subscription.plan_tier || '—'}`,
    `Billing status: ${subscription.billing_status || '—'}`,
  ];
  return renderBoxPanel('Subscription', lines, { minWidth: 36 });
}

function quotaLine(label, used, limit, useColor) {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  const bar = progressBar(pct, useColor);
  const usage = `${abbreviate(used)}/${abbreviate(limit)}`;
  const pctText = `(${pct.toFixed(1)}%)`;
  // Pad label to width 11.
  const labelCell = (label + ':').padEnd(11);
  return `${labelCell} ${bar} ${usage.padEnd(14)}${pctText}`;
}

function renderQuotaPanel(quota, subscription, useColor) {
  const tier = (subscription && subscription.plan_tier) || 'free';
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;
  const lines = [
    quotaLine('Runs',       quota.runs_this_month       || 0, limits.runs,       useColor),
    quotaLine('Tokens',     quota.tokens_this_month     || 0, limits.tokens,     useColor),
    quotaLine('Deliveries', quota.deliveries_this_month || 0, limits.deliveries, useColor),
  ];
  return renderBoxPanel(`Quota (last ${quota.window_days || 30}d)`, lines);
}

function renderRotationsPanel(rotations, useColor) {
  if (!rotations || rotations.length === 0) {
    return renderBoxPanel('Active rotations', [ANSI.DIM + '(none)' + ANSI.RESET], { minWidth: 36 });
  }
  const lines = rotations.slice(0, 8).map((r) => {
    const stage = colorRotationStage(r.stage || 'normal', useColor);
    const url = (r.url || r.subscription_id || '—').slice(0, 40);
    return `${stage.padEnd(useColor ? 18 : 8)} ${url}`;
  });
  return renderBoxPanel('Active rotations', lines, { minWidth: 36 });
}

function renderRecentRunsPanel(runs, useColor) {
  if (!runs || runs.length === 0) {
    return renderBoxPanel('Recent runs (last 5)', [ANSI.DIM + '(none)' + ANSI.RESET], { minWidth: 40 });
  }
  const lines = runs.slice(0, 5).map((r) => {
    const id = (r.run_id || '').slice(0, 14).padEnd(14, ' ');
    const status = colorRunStatus(r.status || 'unknown', useColor);
    const when = formatRelative(r.created_at).padEnd(8);
    const steps = `${r.steps_completed || 0}/${r.steps_total || 0} steps`;
    const statusPad = useColor ? 17 : 9;
    return `${id} ${String(status).padEnd(statusPad)} ${when}  ${steps}`;
  });
  return renderBoxPanel('Recent runs (last 5)', lines, { minWidth: 50 });
}

function renderDashboard(envelope, cli) {
  const useColor = shouldUseColor(cli);
  const sections = [
    renderSubscriptionPanel(envelope.subscription || {}, useColor),
    renderQuotaPanel(envelope.quota || {}, envelope.subscription || {}, useColor),
    renderRotationsPanel(envelope.active_rotations || [], useColor),
    renderRecentRunsPanel(envelope.recent_runs || [], useColor),
  ];
  for (const lines of sections) {
    for (const l of lines) process.stdout.write(l + '\n');
    process.stdout.write('\n');
  }
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────

async function fetchStatus(token, cli) {
  const limit = resolveRunsLimit(cli);
  const path = limit ? `${STATUS_ENDPOINT}?runs=${limit}` : STATUS_ENDPOINT;
  try {
    return await authedFetch(path, { method: 'GET' }, { token });
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

// `markos status run <id>` — pulls the SSE events stream and grabs the first
// frame (snapshot or completed) to render a single-run detail card. We do NOT
// keep the connection open — one frame is enough to render the per-run
// status + steps + result summary.
async function fetchRunDetail(run_id, token, cli) {
  const events_url = RUN_EVENTS_ENDPOINT(run_id);
  let res;
  try {
    res = await authedFetch(events_url, {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
    }, { token, retries: 0 });
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
  if (res.status === 404) {
    formatError({
      error: 'NOT_FOUND',
      message: `Run not found: ${run_id}`,
      hint: 'Check the run id with `markos status` (recent runs panel).',
    }, cli);
    process.exit(EXIT_CODES.USER_ERROR);
    return null;
  }
  if (res.status === 401) {
    let body = null;
    try { body = await res.text(); } catch { body = ''; }
    exitAuth(cli, signatureFromBody(body || ''));
    return null;
  }
  if (!res.ok) {
    exitTransient(cli, 'SERVER_ERROR', `Run lookup failed (${res.status})`);
    return null;
  }
  // Read the first frame off the SSE body. We only need the initial snapshot.
  let text;
  try { text = await res.text(); } catch { text = ''; }
  return parseFirstSseEvent(text);
}

// Minimal SSE frame parser — returns { event, data } for the first complete
// frame (or null if none). MDN spec: frames separated by '\n\n', each line
// is `event:` / `data:` / `id:`.
function parseFirstSseEvent(text) {
  if (!text) return null;
  const frames = String(text).split(/\r?\n\r?\n/);
  for (const frame of frames) {
    if (!frame.trim()) continue;
    const lines = frame.split(/\r?\n/);
    let event = 'message';
    const dataParts = [];
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataParts.push(line.slice(5).trim());
    }
    if (dataParts.length === 0) continue;
    let data;
    try { data = JSON.parse(dataParts.join('\n')); } catch { data = dataParts.join('\n'); }
    return { event, data };
  }
  return null;
}

function renderRunDetail(snapshot, run_id, cli) {
  if (shouldUseJson(cli)) {
    renderJson({ run_id, ...snapshot });
    return;
  }
  const useColor = shouldUseColor(cli);
  const data = (snapshot && snapshot.data) || {};
  const lines = [
    `Run ID:  ${run_id}`,
    `Event:   ${snapshot && snapshot.event ? snapshot.event : '—'}`,
    `Status:  ${colorRunStatus(data.status || 'unknown', useColor)}`,
    `Steps:   ${data.steps_completed != null ? data.steps_completed : '?'} / ${data.steps_total != null ? data.steps_total : '?'}`,
  ];
  for (const l of renderBoxPanel(`Run detail`, lines, { minWidth: 40 })) {
    process.stdout.write(l + '\n');
  }
}

// ─── Render orchestration ─────────────────────────────────────────────────

function renderEnvelope(envelope, cli) {
  if (shouldUseJson(cli)) {
    renderJson(envelope);
    return;
  }
  renderDashboard(envelope, cli);
}

async function renderOnce(token, cli) {
  const res = await fetchStatus(token, cli);
  if (!res) return null;
  let body;
  try { body = await res.json(); } catch { body = {}; }
  if (res.status === 401) {
    return exitAuth(cli, body?.error || 'generic');
  }
  if (!res.ok) {
    return exitTransient(cli, 'SERVER_ERROR', `Status failed (${res.status}): ${body?.error || 'unknown'}`);
  }
  renderEnvelope(body, cli);
  return body;
}

// ─── --watch loop ──────────────────────────────────────────────────────────

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

async function runWatchLoop(token, cli) {
  if (!isTTY()) {
    formatError({
      error: 'INVALID_ARGS',
      message: 'watch_requires_tty',
      hint: '--watch only works in an interactive TTY. Drop --watch for one-shot mode.',
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  // SIGINT → graceful exit 0.
  let stopped = false;
  const onSigint = () => {
    stopped = true;
    process.stdout.write('\n');
    process.exitCode = EXIT_CODES.SUCCESS;
  };
  process.on('SIGINT', onSigint);

  const startedAt = Date.now();
  try {
    while (!stopped) {
      if (Date.now() - startedAt >= WATCH_MAX_DURATION_MS) {
        process.stdout.write('\n  watch: 60-minute safety cap reached; exiting.\n');
        return; // exit code already 0 by default
      }
      clearScreen();
      await renderOnce(token, cli);
      // Sleep in small ticks so SIGINT can interrupt promptly.
      const sleepEnd = Date.now() + WATCH_INTERVAL_MS;
      while (!stopped && Date.now() < sleepEnd) {
        const remaining = Math.min(100, sleepEnd - Date.now());
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, remaining));
      }
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
  }
}

// ─── main ─────────────────────────────────────────────────────────────────

async function main(ctx = {}) {
  const cli = (ctx && ctx.cli) || ctx || {};
  const positional = Array.isArray(cli.positional) ? cli.positional : [];
  const profile = resolveProfile(cli);

  // Auth — required for all paths.
  const token = await getToken(profile);
  if (!token) {
    formatError({
      error: 'NO_TOKEN',
      message: `Not logged in (profile: ${profile}).`,
      hint: 'Run `markos login` to get started.',
    }, cli);
    return process.exit(EXIT_CODES.AUTH_FAILURE);
  }

  // Branch A: `markos status run <run_id>`
  if (positional[0] === 'run') {
    const run_id = positional[1];
    if (!run_id) {
      return exitUsage(cli, 'markos status run: missing run_id', 'Usage: markos status run <run_id>');
    }
    const snapshot = await fetchRunDetail(run_id, token, cli);
    if (!snapshot) {
      // No snapshot frame returned — exit 1 user error so CI can detect it.
      formatError({
        error: 'NOT_FOUND',
        message: `No snapshot frame received for ${run_id}.`,
        hint: 'The run may have been purged. Check `markos status` recent_runs.',
      }, cli);
      return process.exit(EXIT_CODES.USER_ERROR);
    }
    renderRunDetail(snapshot, run_id, cli);
    return process.exit(EXIT_CODES.SUCCESS);
  }

  // Branch B: --watch (TTY-gated).
  if (shouldWatch(cli)) {
    await runWatchLoop(token, cli);
    return; // exit code set by handler
  }

  // Branch C: default one-shot dashboard.
  const envelope = await renderOnce(token, cli);
  if (envelope) process.exit(EXIT_CODES.SUCCESS);
}

module.exports = { main };
module.exports._STATUS_ENDPOINT = STATUS_ENDPOINT;
module.exports._RUN_EVENTS_ENDPOINT = RUN_EVENTS_ENDPOINT;
module.exports._WATCH_INTERVAL_MS = WATCH_INTERVAL_MS;
module.exports._WATCH_MAX_DURATION_MS = WATCH_MAX_DURATION_MS;
module.exports._QUOTA_THRESHOLDS = QUOTA_THRESHOLDS;
module.exports._PLAN_LIMITS = PLAN_LIMITS;
module.exports._progressBar = progressBar;
module.exports._parseFirstSseEvent = parseFirstSseEvent;
module.exports._resolveRunsLimit = resolveRunsLimit;
module.exports._shouldWatch = shouldWatch;
module.exports._renderDashboard = renderDashboard;
module.exports._renderRunDetail = renderRunDetail;
