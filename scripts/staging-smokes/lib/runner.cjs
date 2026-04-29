'use strict';

// Phase 201.1 D-108: shared runner utilities for the staging-smoke harness.

async function runSmoke(smokeModule, opts) {
  if (!smokeModule || typeof smokeModule.run !== 'function') {
    return { ok: false, error: 'invalid smoke module: missing run()' };
  }
  return smokeModule.run(opts);
}

function summarize(results) {
  const total = results.length;
  const passed = results.filter((r) => r.ok && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = total - passed - skipped;
  return { total, passed, skipped, failed };
}

module.exports = { runSmoke, summarize };
