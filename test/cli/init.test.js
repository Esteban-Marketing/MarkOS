'use strict';

// Phase 204 Plan 05 Task 1 — `markos init` CLI integration tests.
//
// Covers:
//   init-01: main() spawns install.cjs subprocess with --yes flag
//   init-02: --no-onboarding flag forwarded to the subprocess argv
//   init-03: --preset=b2b-saas forwarded to the subprocess argv
//   init-04: --help prints one-line usage + exits 0
//   init-05: subprocess exit 0 → parent exits 0
//   init-06: subprocess non-zero exit code → parent propagates the same code
//   init-meta: init.cjs is not a stub + wires to install.cjs + buildInstallArgs

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const INIT_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'init.cjs');
const INSTALL_PATH = path.resolve(REPO_ROOT, 'bin', 'install.cjs');

// ─── Harness ──────────────────────────────────────────────────────────────

function resetModuleCache() {
  delete require.cache[require.resolve(INIT_PATH)];
}

// Fake ChildProcess that we can resolve at will. Mimics the node:child_process
// `spawn` return shape enough to satisfy the init.cjs contract (.on('close'|'error')).
function makeFakeChild({ exitCode = 0, signal = null, emitError = null } = {}) {
  const ee = new EventEmitter();
  ee.pid = 12345;
  queueMicrotask(() => {
    if (emitError) {
      ee.emit('error', emitError);
      return;
    }
    ee.emit('close', exitCode, signal);
  });
  return ee;
}

// Install a spawn spy onto the init module. Returns { calls, restore }.
function installSpawnSpy(initModule, options = {}) {
  const calls = [];
  const prev = initModule._spawnImpl;
  initModule._spawnImpl = (command, args, opts) => {
    calls.push({ command, args: [...(args || [])], opts });
    return makeFakeChild(options);
  };
  return {
    calls,
    restore: () => { initModule._spawnImpl = prev; },
  };
}

// Capture stdout/stderr + intercept process.exit so tests remain in-process.
async function runCli(fn) {
  const originalExit = process.exit;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  let stderr = '';
  let stdout = '';
  let exitCode = null;
  let exited = false;

  class ExitSignal extends Error {
    constructor(code) { super('exit:' + code); this.name = 'ExitSignal'; this.exitCode = code; }
  }

  process.exit = (code) => {
    if (!exited) { exited = true; exitCode = code; }
    throw new ExitSignal(code);
  };
  process.stderr.write = (chunk) => { stderr += String(chunk); return true; };
  process.stdout.write = (chunk) => { stdout += String(chunk); return true; };

  let thrown = null;
  try {
    await fn();
  } catch (err) {
    if (!(err && err.name === 'ExitSignal')) thrown = err;
  } finally {
    process.exit = originalExit;
    process.stderr.write = originalStderrWrite;
    process.stdout.write = originalStdoutWrite;
  }
  if (thrown) throw thrown;
  return { exitCode, stdout, stderr };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('init-01: main() spawns install.cjs subprocess with --yes flag', async () => {
  resetModuleCache();
  const init = require(INIT_PATH);
  const spy = installSpawnSpy(init, { exitCode: 0 });
  try {
    const r = await runCli(() => init.main({ cli: {} }));
    assert.equal(r.exitCode, 0);
    assert.equal(spy.calls.length, 1, 'spawn must be called exactly once');
    const call = spy.calls[0];
    // First argv after node should be the install script.
    assert.ok(call.args[0].endsWith('install.cjs'), `expected install.cjs as first arg, got ${call.args[0]}`);
    assert.ok(call.args.includes('--yes'), '--yes flag must be forwarded');
  } finally {
    spy.restore();
  }
});

test('init-02: --no-onboarding flag forwarded to subprocess argv', async () => {
  resetModuleCache();
  const init = require(INIT_PATH);
  const spy = installSpawnSpy(init, { exitCode: 0 });
  try {
    const r = await runCli(() => init.main({ cli: { noOnboarding: true } }));
    assert.equal(r.exitCode, 0);
    assert.ok(spy.calls[0].args.includes('--no-onboarding'), '--no-onboarding must be forwarded');
    assert.ok(spy.calls[0].args.includes('--yes'), '--yes must still be forwarded');
  } finally {
    spy.restore();
  }
});

test('init-03: --preset=b2b-saas forwarded to subprocess argv', async () => {
  resetModuleCache();
  const init = require(INIT_PATH);
  const spy = installSpawnSpy(init, { exitCode: 0 });
  try {
    const r = await runCli(() => init.main({ cli: { preset: 'b2b-saas' } }));
    assert.equal(r.exitCode, 0);
    assert.ok(
      spy.calls[0].args.some((a) => a === '--preset=b2b-saas'),
      '--preset=b2b-saas must be forwarded as a single arg',
    );
  } finally {
    spy.restore();
  }
});

test('init-04: --help prints usage + exits 0 (no spawn)', async () => {
  resetModuleCache();
  const init = require(INIT_PATH);
  const spy = installSpawnSpy(init, { exitCode: 0 });
  try {
    const r = await runCli(() => init.main({ cli: { help: true } }));
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /markos init/, 'help output must describe `markos init` usage');
    assert.equal(spy.calls.length, 0, 'help must not spawn the installer');
  } finally {
    spy.restore();
  }
});

test('init-05: subprocess exit 0 → parent exits 0', async () => {
  resetModuleCache();
  const init = require(INIT_PATH);
  const spy = installSpawnSpy(init, { exitCode: 0 });
  try {
    const r = await runCli(() => init.main({ cli: {} }));
    assert.equal(r.exitCode, 0, 'parent must exit 0 when child exits 0');
  } finally {
    spy.restore();
  }
});

test('init-06: subprocess non-zero exit → parent propagates the same code', async () => {
  resetModuleCache();
  const init = require(INIT_PATH);
  const spy = installSpawnSpy(init, { exitCode: 2 });
  try {
    const r = await runCli(() => init.main({ cli: {} }));
    assert.equal(r.exitCode, 2, 'parent must propagate child exit code 2');
  } finally {
    spy.restore();
  }

  // Also try a non-zero (user error) code.
  resetModuleCache();
  const init2 = require(INIT_PATH);
  const spy2 = installSpawnSpy(init2, { exitCode: 4 });
  try {
    const r2 = await runCli(() => init2.main({ cli: {} }));
    assert.equal(r2.exitCode, 4, 'parent must propagate child exit code 4 verbatim');
  } finally {
    spy2.restore();
  }
});

test('init-meta: bin/commands/init.cjs is not a stub + wires to install.cjs', () => {
  const text = fs.readFileSync(INIT_PATH, 'utf8');
  assert.ok(!text.includes('not yet implemented'), 'stub message must be gone');
  assert.ok(/child_process|spawn/.test(text), 'init.cjs must reference child_process.spawn');
  assert.ok(/install\.cjs/.test(text), 'init.cjs must reference install.cjs');
  assert.ok(/'--yes'|--yes/.test(text), 'init.cjs must forward --yes flag');
  assert.ok(fs.existsSync(INSTALL_PATH), 'install.cjs must exist at the expected path');

  // Exported helper is usable (buildInstallArgs is a pure function we can poke).
  resetModuleCache();
  const init = require(INIT_PATH);
  const args = init._buildInstallArgs({ preset: 'dtc', noOnboarding: true });
  assert.ok(args.includes('--yes'));
  assert.ok(args.includes('--no-onboarding'));
  assert.ok(args.includes('--preset=dtc'));
});
