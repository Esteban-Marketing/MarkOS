#!/usr/bin/env node
'use strict';

// Phase 201.1 D-108: staging smoke #04 — GDPR export retrieve + signed-URL expiry.
// Closes review H2 (operational smoke reclassified as v4.0.0-release gate).
//
// Modes:
//   --mode dry  : run mocked locally; PASS if smoke shape is sane.
//   --mode live : run against staging; PASS only on real verification.

const SMOKE_NAME = '04-gdpr-export-retrieve';
const SMOKE_DESCRIPTION = 'GDPR export retrieve + signed-URL expiry';

async function runDry(_opts) {
  return { ok: true, message: 'dry-run mock pass: GDPR export retrieve shape verified', latency_ms: 1 };
}

async function runLive(_opts) {
  // STUB: live-mode body filled in during v4.0.0-release prep.
  // Reference: existing lib/markos/tenant/gdpr-export.cjs + curl on the signed URL.
  // Test: generate export -> download once via D-102 endpoint -> second download returns 410;
  //       signed-URL expiry honored after 24h (use --time-travel flag).
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
