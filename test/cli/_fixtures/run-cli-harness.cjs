#!/usr/bin/env node
'use strict';

// Phase 204 Plan 06 Task 3 — child-process harness for run.cjs tests.
//
// Node's test runner emits its own V8-serialized subtest events to
// process.stdout during parent-process test execution, which collides with
// any in-process stdout capture. Running the CLI in a child process fixes
// that cleanly: the child's stdout is isolated from the parent runner.
//
// Protocol:
//   argv[2] = JSON-encoded { cli, briefFile, baseUrl, apiKey, triggerSigintMs }
//   Output: whatever run.cjs prints, with exit code from process.exit.

const path = require('node:path');

async function main() {
  const spec = JSON.parse(process.argv[2] || '{}');

  if (spec.baseUrl) process.env.MARKOS_API_BASE_URL = spec.baseUrl;
  if (spec.apiKey) process.env.MARKOS_API_KEY = spec.apiKey;
  else if (spec.apiKey === '') delete process.env.MARKOS_API_KEY;
  process.env.NO_COLOR = '1';
  if (spec.profile) process.env.MARKOS_PROFILE = spec.profile;
  else delete process.env.MARKOS_PROFILE;

  // If a brief file path is supplied, prepend to positional args.
  const cli = Object.assign({}, spec.cli || {});
  if (spec.briefFile) {
    cli.positional = [spec.briefFile, ...(cli.positional || [])];
  }

  // Optional SIGINT trigger — fires after N ms to simulate Ctrl+C.
  if (Number.isFinite(spec.triggerSigintMs) && spec.triggerSigintMs > 0) {
    setTimeout(() => {
      try { process.emit('SIGINT'); } catch { /* noop */ }
    }, spec.triggerSigintMs);
  }

  // Install an empty keychain override for tests that want no token:
  // setting MARKOS_API_KEY empty + MARKOS_PROFILE to a non-existent profile
  // causes keychain.cjs to return null (file-based fallback reads an empty
  // map) which the CLI treats as NO_TOKEN → exit 3.

  const RUN_PATH = path.resolve(__dirname, '..', '..', '..', 'bin', 'commands', 'run.cjs');
  const { main: runMain } = require(RUN_PATH);

  try {
    await runMain({ cli });
  } catch (err) {
    // main() always calls process.exit itself; any throw is a bug.
    process.stderr.write(`[harness] unexpected error: ${err?.stack || err}\n`);
    process.exit(127);
  }
}

main();
