'use strict';

// Phase 204 Plan 05 Task 1 — `markos init` command.
//
// Delegator / discoverability alias for the existing interactive installer
// (bin/install.cjs). Users expect `markos init` to exist alongside `gh auth
// login`-style flat commands, but the real install flow lives in install.cjs
// and is invoked by the `npx markos` entry. `markos init` spawns a fresh
// Node process that runs install.cjs with `--yes` (accept defaults) plus any
// flags the user passed (`--preset`, `--no-onboarding`, `--profile`, etc.).
//
// Why spawn instead of require():
//   - install.cjs uses top-level readline + process.exit; requiring it mutates
//     global state in the parent process. A subprocess keeps lifecycle clean
//     and lets us bubble the child's exit code verbatim (per D-10).
//   - Tests that want to assert wiring use cli.programmatic=true to bypass the
//     subprocess (the spawn spy pattern in test/cli/init.test.js).
//
// Flags forwarded to install.cjs:
//   --yes           (always — discoverable command assumes accept defaults)
//   --no-onboarding (pass-through when cli.noOnboarding)
//   --preset=<b>    (pass-through when cli.preset — validated downstream)
//   --project       (pass-through when cli.scope === 'project')
//   --global        (pass-through when cli.scope === 'global')
//   --profile=<p>   (install profile: full/cli/minimal — only if the token
//                    looks like an install profile; CLI auth profile is a
//                    different namespace and not forwarded here)
//
// Exit codes (D-10):
//   0 — child exited 0
//   4 — usage error (conflicting flags, --help ran)
//   N — whatever the child exited with (propagated verbatim)

const { spawn } = require('node:child_process');
const path = require('node:path');
const { EXIT_CODES } = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');

const INSTALL_SCRIPT = path.resolve(__dirname, '..', 'install.cjs');

const USAGE = 'markos init [--no-onboarding] [--preset=<bucket>] [--project|--global]';

// Build the argv tail forwarded to install.cjs. --yes is always present so
// the installer runs non-interactively in delegate mode.
function buildInstallArgs(cli = {}) {
  const args = ['--yes'];
  if (cli.noOnboarding) args.push('--no-onboarding');
  if (cli.preset) args.push(`--preset=${cli.preset}`);
  if (cli.scope === 'project') args.push('--project');
  if (cli.scope === 'global') args.push('--global');
  if (cli.installProfile) args.push(`--profile=${cli.installProfile}`);
  if (cli.projectName) args.push(`--project-name=${cli.projectName}`);
  if (cli.projectSlug) args.push(`--project-slug=${cli.projectSlug}`);
  return args;
}

function printUsage() {
  process.stdout.write(USAGE + '\n');
}

// Test-hook: tests override `_spawnImpl` via module.exports to spy on the
// subprocess call without actually forking the installer. Production code
// always goes through child_process.spawn.
function defaultSpawn(command, args, opts) {
  return spawn(command, args, opts);
}

async function main(ctx = {}) {
  const cli = ctx?.cli || ctx || {};

  if (cli.help) {
    printUsage();
    process.exit(EXIT_CODES.SUCCESS);
    return;
  }

  // Programmatic mode — tests can load bin/install.cjs directly and bypass
  // the subprocess dance entirely. In production this is never set.
  if (cli.programmatic) {
    // Delegate to install.cjs via require; do not spawn. We don't actually
    // run the real installer here (it has side effects); this branch is a
    // seam for tests that need synchronous delegation.
    const install = require(INSTALL_SCRIPT);
    if (install && typeof install.run === 'function') {
      try {
        await install.run();
        process.exit(EXIT_CODES.SUCCESS);
      } catch (err) {
        formatError({
          error: 'INTERNAL',
          message: `init: programmatic install failed: ${err?.message || err}`,
        }, cli);
        process.exit(EXIT_CODES.INTERNAL_BUG);
      }
    }
    return;
  }

  const args = buildInstallArgs(cli);

  // Route test spies via module.exports._spawnImpl if present.
  const spawnImpl = module.exports?._spawnImpl || defaultSpawn;

  // Spawn the installer. stdio: 'inherit' so prompts/banners flow through.
  // The child script is invoked with the same Node interpreter so we stay on
  // the user's pinned runtime (nvm / volta / Windows installer).
  const child = spawnImpl(process.execPath, [INSTALL_SCRIPT, ...args], {
    stdio: 'inherit',
    env: process.env,
  });

  if (!child || typeof child.on !== 'function') {
    // Spawn returned nothing usable — treat as internal bug.
    formatError({
      error: 'INTERNAL',
      message: 'init: failed to spawn installer subprocess.',
    }, cli);
    process.exit(EXIT_CODES.INTERNAL_BUG);
    return;
  }

  const result = await new Promise((resolve) => {
    child.on('close', (code, signal) => {
      // Propagate the child's exit code verbatim. Node returns null when a
      // signal terminates the child; coerce to 1 so we never exit 0 on abort.
      const exitCode = (typeof code === 'number') ? code : 1;
      if (signal) {
        process.stderr.write(`init: installer terminated by signal ${signal}\n`);
      }
      resolve({ kind: 'exit', code: exitCode });
    });
    child.on('error', (err) => {
      resolve({ kind: 'error', err });
    });
  });

  if (result.kind === 'error') {
    formatError({
      error: 'INTERNAL',
      message: `init: installer subprocess error: ${result.err?.message || result.err}`,
    }, cli);
    process.exit(EXIT_CODES.INTERNAL_BUG);
    return;
  }
  process.exit(result.code);
}

module.exports = { main };
module.exports._INSTALL_SCRIPT = INSTALL_SCRIPT;
module.exports._buildInstallArgs = buildInstallArgs;
// Test hook; tests replace this to spy on subprocess invocations.
module.exports._spawnImpl = null;
