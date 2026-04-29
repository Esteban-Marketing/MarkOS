#!/usr/bin/env node
'use strict';

// Phase 201.1 D-108: orchestrator for 8 staging smokes.
// Closes review H2 (operational smokes reclassified as v4.0.0-release gates).

const path = require('node:path');
const { runSmoke, summarize } = require('./lib/runner.cjs');

const STAGING_SMOKES = [
  './01-wildcard-dns.cjs',
  './02-magic-link-delivery.cjs',
  './03-botid-live.cjs',
  './04-gdpr-export-retrieve.cjs',
  './05-passkey-virtual-authenticator.cjs',
  './06-middleware-load-baseline.cjs',
  './07-30day-purge-cron.cjs',
  './08-cookie-samesite.cjs',
];

async function main() {
  const argMode = process.argv.includes('--mode')
    ? process.argv[process.argv.indexOf('--mode') + 1]
    : 'dry';

  console.log(`\n=== STAGING SMOKES (mode: ${argMode}) ===\n`);
  const results = [];

  for (const rel of STAGING_SMOKES) {
    const mod = require(path.join(__dirname, rel));
    const result = await runSmoke(mod, { mode: argMode });
    results.push(result);
    const status = result.skipped ? '[skip]' : result.ok ? '[ok]' : '[err]';
    console.log(
      `${status} ${result.name} — ${result.message || result.error || ''} (${result.duration_ms}ms)`
    );
  }

  const sum = summarize(results);
  console.log('\n=== STAGING SMOKE SUMMARY ===');
  console.log(JSON.stringify(sum, null, 2));

  if (sum.failed > 0) {
    console.error(`\n[err] ${sum.failed} smoke(s) failed.`);
    process.exit(1);
  }
  console.log(`\n[ok] All smokes passed (${sum.skipped} skipped as STUB).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[err] staging-smokes orchestrator crashed:', err);
  process.exit(2);
});
