'use strict';

// Phase 204 Plan 09 Task 2 — `markos doctor` CLI integration tests.
//
// Covers:
//   doc-01: all-green mock → exit 0 + TTY render contains ✓
//   doc-02: gitignore_protected error + --fix → fix applied + exit 0
//   doc-03: token_valid error (no fix possible) → exit 1
//   doc-04: --check-only + gitignore error → exit 1 (no fix attempted; fixed=null)
//   doc-05: --json outputs single-line JSON with summary
//   doc-06: TTY render grep'able for ✓ ⚠ ✗ unicode chars
//   doc-07: --quiet suppresses ok lines in TTY, keeps errors
//   doc-08: network-only warn-level → exit 0 (warn is not a fail)
//   doc-meta: bin/commands/doctor.cjs is not a stub + wires runChecks + exit codes

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCTOR_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'doctor.cjs');
const DOCTOR_CHECKS_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'doctor-checks.cjs');

// ─── Harness ─────────────────────────────────────────────────────────────

function resetModuleCache() {
  for (const p of [DOCTOR_PATH, DOCTOR_CHECKS_PATH]) {
    delete require.cache[require.resolve(p)];
  }
}

function installRunChecksSpy(results) {
  // Replace the doctor-checks module so `require('../lib/cli/doctor-checks.cjs')`
  // inside doctor.cjs returns a stub returning our canned results.
  const captured = { calls: [] };
  require.cache[DOCTOR_CHECKS_PATH] = {
    id: DOCTOR_CHECKS_PATH,
    filename: DOCTOR_CHECKS_PATH,
    loaded: true,
    exports: {
      runChecks: async (opts) => {
        captured.calls.push(opts);
        return typeof results === 'function' ? await results(opts) : results;
      },
    },
  };
  return captured;
}

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

function okResult(id, label, extra = {}) {
  return { id, label, status: 'ok', message: 'fine', fixable: false, fixed: null, ...extra };
}
function warnResult(id, label, extra = {}) {
  return { id, label, status: 'warn', message: 'mehh', hint: 'hint-text', fixable: false, fixed: null, ...extra };
}
function errorResult(id, label, extra = {}) {
  return { id, label, status: 'error', message: 'broken', hint: 'hint-text', fixable: false, fixed: null, ...extra };
}

// ─── Tests ───────────────────────────────────────────────────────────────

test('doc-01: all-green results → exit 0 + stdout contains ✓', async () => {
  const prevTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true, writable: true });
  try {
    resetModuleCache();
    installRunChecksSpy([
      okResult('node_version', 'Node.js version'),
      okResult('config_dir', 'Config directory'),
    ]);
    const { main } = require(DOCTOR_PATH);
    const r = await runCli(() => main({ cli: {} }));
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /✓/);
    assert.match(r.stdout, /markos doctor/);
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
  }
});

test('doc-02: gitignore error + --fix → fix applied + exit 0', async () => {
  resetModuleCache();
  const spy = installRunChecksSpy(async (opts) => {
    // Simulate the library applying the fix when fix=true.
    const fixed = Boolean(opts.fix) && !opts.checkOnly;
    return [
      okResult('node_version', 'Node.js version'),
      fixed
        ? { id: 'gitignore_protected', label: 'Gitignore protection', status: 'ok', message: 'fixed', fixable: true, fixed: true }
        : errorResult('gitignore_protected', 'Gitignore protection', { fixable: true }),
    ];
  });
  const { main } = require(DOCTOR_PATH);
  const r = await runCli(() => main({ cli: { fix: true, json: true } }));
  assert.equal(r.exitCode, 0, 'fix succeeded → exit 0');
  // runChecks was called with fix=true, checkOnly=false.
  assert.equal(spy.calls.length, 1);
  assert.equal(spy.calls[0].fix, true);
  assert.equal(spy.calls[0].checkOnly, false);
});

test('doc-03: token_valid error (no fix possible) → exit 1', async () => {
  resetModuleCache();
  installRunChecksSpy([
    okResult('node_version', 'Node.js version'),
    errorResult('token_valid', 'Token validity', { fixable: false }),
  ]);
  const { main } = require(DOCTOR_PATH);
  const r = await runCli(() => main({ cli: { json: true } }));
  assert.equal(r.exitCode, 1);
});

test('doc-04: --check-only + gitignore error → exit 1 + no fix attempted', async () => {
  resetModuleCache();
  const spy = installRunChecksSpy(async (opts) => {
    // Mirror runChecks behavior: checkOnly never mutates even if fix was also set.
    return [
      okResult('node_version', 'Node.js version'),
      { id: 'gitignore_protected', label: 'Gitignore protection', status: 'error', message: 'missing', hint: 'hint', fixable: true, fixed: null },
    ];
  });
  const { main } = require(DOCTOR_PATH);
  const r = await runCli(() => main({ cli: { checkOnly: true, fix: true, json: true } }));
  assert.equal(r.exitCode, 1, 'any error in check-only mode → exit 1');
  // Doctor must have passed checkOnly: true and fix: false (checkOnly dominates).
  assert.equal(spy.calls[0].checkOnly, true);
  assert.equal(spy.calls[0].fix, false, '--check-only must override --fix');
});

test('doc-05: --json outputs JSON with checks[] and summary{}', async () => {
  resetModuleCache();
  installRunChecksSpy([
    okResult('node_version', 'Node.js version'),
    warnResult('active_token', 'Active token'),
    errorResult('token_valid', 'Token validity'),
  ]);
  const { main } = require(DOCTOR_PATH);
  const r = await runCli(() => main({ cli: { json: true } }));
  assert.equal(r.exitCode, 1);
  const parsed = JSON.parse(r.stdout.trim());
  assert.ok(Array.isArray(parsed.checks));
  assert.equal(parsed.checks.length, 3);
  assert.ok(parsed.summary);
  assert.equal(parsed.summary.ok, 1);
  assert.equal(parsed.summary.warn, 1);
  assert.equal(parsed.summary.error, 1);
  assert.equal(parsed.summary.total, 3);
});

test('doc-06: TTY render contains all three status icons ✓ ⚠ ✗', async () => {
  const prevTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true, writable: true });
  try {
    resetModuleCache();
    installRunChecksSpy([
      okResult('a', 'Alpha'),
      warnResult('b', 'Bravo'),
      errorResult('c', 'Charlie'),
    ]);
    const { main } = require(DOCTOR_PATH);
    const r = await runCli(() => main({ cli: {} }));
    assert.match(r.stdout, /✓/);
    assert.match(r.stdout, /⚠/);
    assert.match(r.stdout, /✗/);
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
  }
});

test('doc-07: --quiet suppresses ok/skip lines in TTY render, keeps errors', async () => {
  const prevTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true, writable: true });
  try {
    resetModuleCache();
    installRunChecksSpy([
      okResult('node_version', 'Node.js version'),
      warnResult('active_token', 'Active token'),
      errorResult('token_valid', 'Token validity'),
    ]);
    const { main } = require(DOCTOR_PATH);
    const r = await runCli(() => main({ cli: { quiet: true } }));
    assert.ok(!/Node\.js version/.test(r.stdout), 'ok lines should be hidden in --quiet mode');
    assert.match(r.stdout, /Active token/);
    assert.match(r.stdout, /Token validity/);
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
  }
});

test('doc-08: all warnings (no errors) → exit 0', async () => {
  resetModuleCache();
  installRunChecksSpy([
    okResult('node_version', 'Node.js version'),
    warnResult('server_reachable', 'Server reachable'),
    warnResult('active_token', 'Active token'),
  ]);
  const { main } = require(DOCTOR_PATH);
  const r = await runCli(() => main({ cli: { json: true } }));
  assert.equal(r.exitCode, 0, 'warnings alone must not fail doctor');
});

test('doc-meta: bin/commands/doctor.cjs is not a stub + wires shared primitives', () => {
  const text = fs.readFileSync(DOCTOR_PATH, 'utf8');
  assert.ok(!text.includes('not yet implemented'), 'stub message must be gone');
  assert.ok(/runChecks/.test(text), 'doctor.cjs must call runChecks');
  assert.ok(/cli\.checkOnly|checkOnly/.test(text));
  assert.ok(/cli\.fix|--fix/.test(text));
  assert.ok(/process\.exit/.test(text));
  assert.ok(/EXIT_CODES/.test(text), 'doctor.cjs must use shared EXIT_CODES');
});
