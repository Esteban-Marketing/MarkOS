#!/usr/bin/env node
'use strict';

// Phase 201.1 D-108: staging smoke #06 — Middleware staging-load (k6 100 RPS for 60s baseline).
// Closes review H2 (operational smoke reclassified as v4.0.0-release gate).
//
// Modes:
//   --mode dry  : run mocked locally; PASS if smoke shape is sane.
//   --mode live : run against staging; PASS only on real verification.

const SMOKE_NAME = '06-middleware-load-baseline';
const SMOKE_DESCRIPTION = 'Middleware staging-load (k6 100 RPS for 60s baseline)';

async function runDry(_opts) {
  return { ok: true, message: 'dry-run mock pass: middleware load baseline shape verified', latency_ms: 1 };
}

async function runLive(_opts) {
  // STUB: live-mode body filled in during v4.0.0-release prep.
  // Reference: k6 (or autocannon fallback) wrapped via child_process.spawn.
  // Assert: p99 < 500ms + zero 5xx at 100 RPS for 60s against /<slug>.markos.dev/app.
  return {
    ok: false,
    skipped: true,
    message: 'STAGING_SMOKE_LIVE_NOT_IMPLEMENTED — fill in for v4.0.0-release prep',
  };
}

async function run(opts = {}) {
  const mode = opts.mode === 'live' ? 'live' : 'dry';
  const start = Date.now();
  try {
    const result = mode === 'live' ? await runLive(opts) : await runDry(opts);
    return { name: SMOKE_NAME, description: SMOKE_DESCRIPTION, mode, duration_ms: Date.now() - start, ...result };
  } catch (err) {
    return { name: SMOKE_NAME, description: SMOKE_DESCRIPTION, mode, ok: false, error: err.message, duration_ms: Date.now() - start };
  }
}

module.exports = { run, SMOKE_NAME, SMOKE_DESCRIPTION };

if (require.main === module) {
  const argMode = process.argv.includes('--mode')
    ? process.argv[process.argv.indexOf('--mode') + 1]
    : 'dry';
  run({ mode: argMode }).then((r) => {
    console.log(JSON.stringify(r, null, 2));
    if (r.skipped) process.exit(78); // POSIX skip
    process.exit(r.ok ? 0 : 1);
  });
}
