'use strict';

// Phase 204 Plan 09 Task 2 — `markos doctor` CLI command.
//
// Diagnose-and-fix helper for the MarkOS CLI environment.
//
// Flags:
//   --check-only    CI gate mode: zero side effects, exit 1 on any error.
//   --fix           Apply auto-remediation to fixable filesystem checks.
//                   Ignored in --check-only mode (T-204-09-06).
//                   NEVER triggers `markos login` (T-204-09-01).
//   --json          Output JSON array instead of TTY dashboard.
//   --quiet         Suppress ok/warn lines in TTY render (errors still shown).
//
// Exit codes (D-10):
//   0 SUCCESS         (all green or warnings only; or fixed → no residual errors)
//   1 USER_ERROR      (--check-only + any error)
//   2 TRANSIENT       (all errors were network-warns only)
//   5 INTERNAL_BUG    (unexpected exception)

const { runChecks } = require('../lib/cli/doctor-checks.cjs');
const { EXIT_CODES, shouldUseJson, shouldUseColor, ANSI, renderJson } = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');

// ─── Status icons + colors ─────────────────────────────────────────────────

const ICON = Object.freeze({
  ok:    '✓',
  warn:  '⚠',
  error: '✗',
  skip:  '·',
});

function colorFor(status) {
  switch (status) {
    case 'ok':    return ANSI.GREEN;
    case 'warn':  return ANSI.YELLOW;
    case 'error': return ANSI.RED;
    case 'skip':  return ANSI.DIM;
    default:      return '';
  }
}

// ─── Renderers ─────────────────────────────────────────────────────────────

function renderDashboard(checks, summary, cli) {
  const color = shouldUseColor(cli);
  const quiet = Boolean(cli && cli.quiet);
  const paint = (text, ansi) => color ? (ansi + text + ANSI.RESET) : text;

  // Header.
  process.stdout.write('┌─ markos doctor ' + '─'.repeat(48) + '┐\n');

  for (const c of checks) {
    if (quiet && (c.status === 'ok' || c.status === 'skip')) continue;

    const icon = paint(ICON[c.status] || '?', colorFor(c.status));
    const label = c.label.padEnd(24, ' ').slice(0, 24);
    const msg = c.message || '';
    let line = `│ ${icon} ${label}${msg}`;
    if (c.fixed === true) line += paint('  [fixed]', ANSI.GREEN);
    if (c.fixed === false) line += paint('  [fix failed]', ANSI.RED);
    process.stdout.write(line + '\n');

    if (c.hint && (c.status === 'warn' || c.status === 'error')) {
      process.stdout.write(`│   ${paint('hint:', ANSI.DIM)} ${c.hint}\n`);
    }
  }

  process.stdout.write('└' + '─'.repeat(64) + '┘\n');

  // Summary line.
  const parts = [];
  parts.push(`${summary.ok} ok`);
  parts.push(`${summary.warn} warn`);
  parts.push(`${summary.error} error`);
  if (summary.skip) parts.push(`${summary.skip} skipped`);
  if (summary.fixed) parts.push(paint(`${summary.fixed} fixed`, ANSI.GREEN));
  process.stdout.write(parts.join('  ·  ') + '\n');
}

function renderJsonDashboard(checks, summary) {
  renderJson({ checks, summary });
}

// ─── Summary + exit-code resolver ──────────────────────────────────────────

function buildSummary(checks) {
  const summary = { total: checks.length, ok: 0, warn: 0, error: 0, skip: 0, fixed: 0 };
  for (const c of checks) {
    if (c.status === 'ok') summary.ok += 1;
    else if (c.status === 'warn') summary.warn += 1;
    else if (c.status === 'error') summary.error += 1;
    else if (c.status === 'skip') summary.skip += 1;
    if (c.fixed === true) summary.fixed += 1;
  }
  return summary;
}

function resolveExitCode(checks, cli) {
  const anyError = checks.some((c) => c.status === 'error');
  if (anyError) {
    // --check-only makes any error fail the gate.
    if (cli.checkOnly) return EXIT_CODES.USER_ERROR;
    return EXIT_CODES.USER_ERROR;
  }
  // Warnings only or all green → success.
  return EXIT_CODES.SUCCESS;
}

// ─── main ─────────────────────────────────────────────────────────────────

async function main(ctx = {}) {
  const cli = (ctx && ctx.cli) || ctx || {};

  // --check-only dominates --fix (T-204-09-06).
  const checkOnly = Boolean(cli.checkOnly || cli['check-only']);
  // --fix defaults OFF in check-only mode; OFF by default otherwise too (user opts in).
  const fix = checkOnly ? false : Boolean(cli.fix);

  let checks;
  try {
    checks = await runChecks({
      fix,
      checkOnly,
      cwd: process.cwd(),
      cli,
    });
  } catch (err) {
    formatError({
      error: 'INTERNAL',
      message: `doctor failed: ${err.message}`,
      hint: 'This is likely a bug — please report with the full stack trace.',
    }, cli);
    return process.exit(EXIT_CODES.INTERNAL_BUG);
  }

  const summary = buildSummary(checks);

  if (shouldUseJson(cli)) {
    renderJsonDashboard(checks, summary);
  } else {
    renderDashboard(checks, summary, cli);
  }

  const code = resolveExitCode(checks, { checkOnly });
  return process.exit(code);
}

module.exports = {
  main,
  // Exposed for tests.
  _buildSummary: buildSummary,
  _resolveExitCode: resolveExitCode,
  _ICON: ICON,
};
