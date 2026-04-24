'use strict';

// Phase 204 Plan 05 Task 3 — `markos eval` CLI command.
//
// Local rubric scoring of a draft against a brief. **Fully offline** — per
// CONTEXT D-03 no tenant round-trip happens in the default path. Pluggable
// LLM is honored via the --remote hook (not wired in v1; eval-runner.cjs
// supports { llm } passthrough for library consumers).
//
// Flow:
//   1. Parse brief (positional[0] or --brief=<path>).
//   2. If --draft=<path> supplied → read the file as the draft text.
//      Otherwise → call bin/lib/generate-runner.cjs::runDraft to generate
//      a draft locally via the stub LLM (D-03: pluggable LLM).
//   3. Call scoreDraft(draft, brief) → { score, dimensions, issues, ... }.
//   4. threshold = Number(cli.threshold) || 60.
//   5. Render:
//        • TTY: score header + dimension table + issues list.
//        • non-TTY/--json: full result object on one line.
//   6. Exit:
//        0 if score >= threshold
//        1 if score <  threshold (CI-friendly: composes with gate scripts)
//        1 on brief parse/validate failure
//
// Security: no network call; brief + draft stay local.

const fs = require('node:fs');
const path = require('node:path');
const { parseBrief, validateBrief, normalizeBrief } = require('../lib/brief-parser.cjs');
const { runDraft } = require('../lib/generate-runner.cjs');
const { scoreDraft, MAX_SCORE } = require('../lib/eval-runner.cjs');
const {
  EXIT_CODES, shouldUseJson, shouldUseColor, renderJson, ANSI,
} = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');

const DEFAULT_THRESHOLD = 60;

// ─── Brief + draft resolution ─────────────────────────────────────────────

function resolveBriefSource(cli = {}) {
  if (cli.brief && typeof cli.brief === 'string') return cli.brief;
  const positional = Array.isArray(cli.positional) ? cli.positional : [];
  if (positional.length > 0 && typeof positional[0] === 'string') return positional[0];
  const args = Array.isArray(cli.args) ? cli.args : [];
  if (args.length > 0 && typeof args[0] === 'string') return args[0];
  return null;
}

function resolveThreshold(cli = {}) {
  const raw = cli.threshold;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0 && n <= MAX_SCORE) return n;
  return DEFAULT_THRESHOLD;
}

function loadDraftFromPath(draftPath) {
  const abs = path.resolve(draftPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`draft file not found: ${draftPath}`);
  }
  return { text: fs.readFileSync(abs, 'utf8') };
}

// Generate a draft via the local stub LLM (same path as `markos generate`).
async function generateLocalDraft(briefSource, cli) {
  const result = await runDraft(briefSource, {});
  if (!result?.success) {
    const errs = result?.brief_errors || [];
    const msg = errs.length ? errs.join('; ') : 'runDraft failed to produce a draft';
    throw new Error(msg);
  }
  return result.draft;
}

// ─── Rendering ────────────────────────────────────────────────────────────

function renderTTY(result, threshold, cli) {
  const color = shouldUseColor(cli);
  const label = (s) => color ? (ANSI.DIM + s + ANSI.RESET) : s;
  const bold = (s) => color ? (ANSI.BOLD + s + ANSI.RESET) : s;
  const pass = (s) => color ? (ANSI.GREEN + s + ANSI.RESET) : s;
  const fail = (s) => color ? (ANSI.RED + s + ANSI.RESET) : s;

  const ok = result.score >= threshold;
  const status = ok ? pass('PASS') : fail('FAIL');
  const header = `markos eval — score ${bold(String(result.score))} / ${MAX_SCORE}  [${status}]`;
  process.stdout.write(header + '\n');
  process.stdout.write(label('threshold: ') + String(threshold) + '\n');
  process.stdout.write('\n');

  // Dimension breakdown table.
  const rows = [['dimension', 'score'], ['---------', '-----']];
  for (const key of ['voice', 'claims', 'structure', 'length']) {
    rows.push([key, String(result.dimensions[key] || 0)]);
  }
  const widths = [0, 0];
  for (const r of rows) for (let i = 0; i < 2; i++) widths[i] = Math.max(widths[i], String(r[i]).length);
  for (const r of rows) {
    const line = r.map((c, i) => String(c).padEnd(widths[i], ' ')).join('  ');
    process.stdout.write(line + '\n');
  }

  process.stdout.write('\n');
  process.stdout.write(label('word_count:     ') + String(result.word_count) + '\n');
  process.stdout.write(label('sentence_count: ') + String(result.sentence_count) + '\n');

  if (Array.isArray(result.issues) && result.issues.length > 0) {
    process.stdout.write('\n');
    process.stdout.write(label('issues:\n'));
    for (const issue of result.issues) {
      process.stdout.write('  - ' + issue + '\n');
    }
  }
}

function renderResult(result, threshold, cli) {
  if (shouldUseJson(cli)) {
    renderJson({ threshold, ...result });
  } else {
    renderTTY(result, threshold, cli);
  }
}

// ─── main ─────────────────────────────────────────────────────────────────

async function main(ctx = {}) {
  const cli = ctx?.cli || ctx || {};

  // 1. Brief.
  const briefSource = resolveBriefSource(cli);
  if (!briefSource) {
    formatError({
      error: 'INVALID_ARGS',
      message: 'markos eval: missing brief.',
      hint: 'Usage: markos eval <brief.yaml> [--draft=<path>] [--threshold=<int>]',
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  let rawBrief;
  try {
    rawBrief = parseBrief(briefSource);
  } catch (err) {
    formatError({
      error: 'INVALID_BRIEF',
      message: `Could not read brief: ${err?.message || err}`,
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  const validation = validateBrief(rawBrief);
  if (!validation.ok) {
    formatError({
      error: 'INVALID_BRIEF',
      message: 'Brief is missing required fields.',
      hint: validation.errors.join('; '),
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  const brief = normalizeBrief(rawBrief);

  // 2. Draft — read file or regenerate locally.
  let draft;
  try {
    if (cli.draft && typeof cli.draft === 'string') {
      draft = loadDraftFromPath(cli.draft);
    } else {
      draft = await generateLocalDraft(briefSource, cli);
    }
  } catch (err) {
    formatError({
      error: 'INVALID_ARGS',
      message: `markos eval: ${err?.message || 'could not load/generate draft'}`,
    }, cli);
    return process.exit(EXIT_CODES.USER_ERROR);
  }

  // 3. Score.
  const result = await scoreDraft(draft, brief);
  const threshold = resolveThreshold(cli);

  // 4. Render.
  renderResult(result, threshold, cli);

  // 5. Exit based on threshold. CI-friendly: callers can `markos eval … ||
  //    fail-the-build`. No threshold comparison happens above the MAX_SCORE
  //    cap (scoreDraft already clamps to [0, 100]).
  const exitCode = result.score >= threshold ? EXIT_CODES.SUCCESS : EXIT_CODES.USER_ERROR;
  process.exit(exitCode);
}

module.exports = { main };
module.exports._DEFAULT_THRESHOLD = DEFAULT_THRESHOLD;
module.exports._resolveBriefSource = resolveBriefSource;
module.exports._resolveThreshold = resolveThreshold;
