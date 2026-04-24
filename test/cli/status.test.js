'use strict';

// Phase 204 Plan 08 Task 2 — `markos status` CLI integration tests.
//
// Covers:
//   st-01: status no token → exit 3 + stderr mentions `markos login`
//   st-02: status TTY happy → exits 0 + stdout has 4 box panels (┌ char count)
//   st-03: status --json → exits 0 + one-line JSON envelope with 5 top-level keys
//   st-04: status run <id> happy → fetches /events + renders run detail
//   st-05: status run (no id) → exit 1 INVALID_ARGS
//   st-06: status --watch on non-TTY → exit 1 watch_requires_tty
//   st-07: status 401 → exit 3 (auth failure mapping)
//   st-08: status --runs=N rewrites query string
//   st-meta-1: not a stub (no 'not yet implemented' string)
//   st-meta-2: progress bar threshold colors honor 70/90 cutoffs

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const STATUS_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'status.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');

// ─── Harness (mirrors whoami.test.js) ─────────────────────────────────────

function resetModuleCache() {
  for (const p of [STATUS_PATH, KEYCHAIN_PATH]) {
    delete require.cache[require.resolve(p)];
  }
}

function installKeychainSpy(initial = {}) {
  const store = new Map(Object.entries(initial));
  const api = {
    SERVICE: 'markos-cli',
    async getToken(profile) { return store.get(profile) || null; },
    async setToken(profile, token) { store.set(profile, token); },
    async deleteToken(profile) { store.delete(profile); },
    async listProfiles() { return [...store.keys()]; },
    xdgCredPath: () => '/tmp/no-such-path',
    _resetWarningStateForTests() {},
    _store: store,
  };
  require.cache[KEYCHAIN_PATH] = {
    id: KEYCHAIN_PATH,
    filename: KEYCHAIN_PATH,
    loaded: true,
    exports: api,
  };
  return api;
}

function installFetchMock(responder) {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    const entry = {
      url: String(url),
      method: (opts.method || 'GET').toUpperCase(),
      headers: Object.assign({}, opts.headers || {}),
      body: opts.body || null,
    };
    calls.push(entry);
    const resp = await responder(entry);
    const bodyText = typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body || {});
    return {
      status: resp.status,
      statusText: resp.statusText || '',
      ok: resp.status >= 200 && resp.status < 300,
      headers: new Map(),
      async text() { return bodyText; },
      async json() {
        if (typeof resp.body === 'string') {
          try { return JSON.parse(resp.body); } catch { return {}; }
        }
        return resp.body || {};
      },
      clone() { return { async text() { return bodyText; } }; },
    };
  };
  return {
    calls,
    restore: () => { global.fetch = originalFetch; },
  };
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

// Sample envelope (matches StatusEnvelope contract).
const HAPPY_ENVELOPE = {
  subscription: { plan_tier: 'pro', billing_status: 'active' },
  quota: {
    runs_this_month: 42,
    tokens_this_month: 62000,
    deliveries_this_month: 1200,
    window_days: 30,
  },
  active_rotations: [],
  recent_runs: [
    {
      run_id: 'run_abc12345',
      status: 'success',
      created_at: new Date(Date.now() - 60_000).toISOString(),
      completed_at: new Date(Date.now() - 30_000).toISOString(),
      steps_completed: 3,
      steps_total: 3,
    },
  ],
  generated_at: new Date().toISOString(),
};

// Pin BASE_URL so un-mocked fetches fail fast.
process.env.MARKOS_API_KEY = '';
process.env.MARKOS_API_BASE_URL = 'http://127.0.0.1:1';

// ─── Tests ─────────────────────────────────────────────────────────────────

test('st-01: status no token → exit 3 + stderr mentions `markos login`', async () => {
  resetModuleCache();
  installKeychainSpy(); // empty keychain
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(STATUS_PATH);
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 3);
    assert.match(r.stderr, /markos login/i);
    assert.equal(mock.calls.length, 0, 'no fetch when keychain is empty');
  } finally {
    mock.restore();
  }
});

test('st-02: status TTY happy → exits 0 + stdout has 4 box panels', async () => {
  const prevTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true, writable: true });
  try {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'a'.repeat(64) });
    const mock = installFetchMock(async ({ method, url }) => {
      assert.equal(method, 'GET');
      assert.match(url, /\/api\/tenant\/status/);
      return { status: 200, body: HAPPY_ENVELOPE };
    });
    try {
      const { main } = require(STATUS_PATH);
      const r = await runCli(() => main({ cli: {} }));
      assert.equal(r.exitCode, 0);
      // Four box panels — count `┌─ ` openings.
      const opens = (r.stdout.match(/┌─ /g) || []).length;
      assert.equal(opens, 4, `expected exactly 4 box panel openings, saw ${opens}`);
      assert.match(r.stdout, /Subscription/);
      assert.match(r.stdout, /Quota/);
      assert.match(r.stdout, /Active rotations/);
      assert.match(r.stdout, /Recent runs/);
      assert.match(r.stdout, /pro/);
    } finally {
      mock.restore();
    }
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
  }
});

test('st-03: status --json → exits 0 + one-line JSON envelope with 5 top-level keys', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'b'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 200, body: HAPPY_ENVELOPE }));
  try {
    const { main } = require(STATUS_PATH);
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 0);
    const trimmed = r.stdout.trim();
    // Must be a single JSON line.
    assert.equal(trimmed.split('\n').length, 1, 'JSON envelope must be one line');
    const parsed = JSON.parse(trimmed);
    for (const k of ['subscription', 'quota', 'active_rotations', 'recent_runs', 'generated_at']) {
      assert.ok(Object.prototype.hasOwnProperty.call(parsed, k), `JSON envelope must have ${k}`);
    }
  } finally {
    mock.restore();
  }
});

test('st-04: status run <id> happy → fetches /events + renders run detail', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'c'.repeat(64) });
  // Fake SSE body — single snapshot frame.
  const sseBody = [
    'event: run.snapshot',
    'data: {"run_id":"run_xyz","status":"running","steps_completed":1,"steps_total":3}',
    'id: 1',
    '',
    '',
  ].join('\n');
  const mock = installFetchMock(async ({ url }) => {
    assert.match(url, /\/api\/tenant\/runs\/run_xyz\/events/);
    return { status: 200, body: sseBody };
  });
  try {
    const { main } = require(STATUS_PATH);
    const r = await runCli(() => main({ cli: { json: true, positional: ['run', 'run_xyz'] } }));
    assert.equal(r.exitCode, 0);
    assert.equal(mock.calls.length, 1);
    const trimmed = r.stdout.trim();
    const parsed = JSON.parse(trimmed);
    assert.equal(parsed.run_id, 'run_xyz');
    assert.equal(parsed.event, 'run.snapshot');
    assert.equal(parsed.data.status, 'running');
  } finally {
    mock.restore();
  }
});

test('st-05: status run (no id) → exit 1 INVALID_ARGS', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'd'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(STATUS_PATH);
    const r = await runCli(() => main({ cli: { json: true, positional: ['run'] } }));
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /missing run_id|usage|INVALID_ARGS/i);
    assert.equal(mock.calls.length, 0, 'no network call when run_id missing');
  } finally {
    mock.restore();
  }
});

test('st-06: status --watch on non-TTY → exit 1 watch_requires_tty', async () => {
  // Ensure isTTY is false.
  const prevTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true, writable: true });
  try {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'e'.repeat(64) });
    const mock = installFetchMock(async () => ({ status: 200, body: HAPPY_ENVELOPE }));
    try {
      const { main } = require(STATUS_PATH);
      const r = await runCli(() => main({ cli: { json: true, watch: true } }));
      assert.equal(r.exitCode, 1);
      assert.match(r.stderr, /watch_requires_tty/);
    } finally {
      mock.restore();
    }
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
  }
});

test('st-07: status 401 → exit 3 auth failure', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'f'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 401, body: { error: 'invalid_token' } }));
  try {
    const { main } = require(STATUS_PATH);
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 3);
    assert.match(r.stderr, /UNAUTHORIZED|markos login/i);
  } finally {
    mock.restore();
  }
});

test('st-08: status --runs=N appends ?runs query string', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + '0'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 200, body: HAPPY_ENVELOPE }));
  try {
    const { main } = require(STATUS_PATH);
    const r = await runCli(() => main({ cli: { json: true, runs: 10 } }));
    assert.equal(r.exitCode, 0);
    assert.equal(mock.calls.length, 1);
    assert.match(mock.calls[0].url, /\?runs=10$/);
  } finally {
    mock.restore();
  }
});

test('st-meta-1: bin/commands/status.cjs is not a stub', () => {
  const text = fs.readFileSync(STATUS_PATH, 'utf8');
  assert.ok(!/not yet implemented/i.test(text), 'status.cjs must not contain "not yet implemented"');
  assert.ok(/\/api\/tenant\/status/.test(text), 'status.cjs must reference /api/tenant/status');
  assert.ok(/\/api\/tenant\/runs/.test(text), 'status.cjs must reference /api/tenant/runs (status run subcommand)');
  assert.ok(/SIGINT/.test(text), 'status.cjs must install a SIGINT handler for --watch');
  assert.ok(/x1b\[2J/.test(text), 'status.cjs must clear screen via ANSI \\x1b[2J');
  assert.ok(/watch_requires_tty/.test(text), 'status.cjs must guard --watch in non-TTY');
  assert.ok(/cli\.watch|--watch|shouldWatch/.test(text), 'status.cjs must read the --watch flag');
});

test('st-meta-2: progress bar honors 70/90 color thresholds', () => {
  const status = require(STATUS_PATH);
  const { _progressBar, _QUOTA_THRESHOLDS } = status;
  assert.equal(_QUOTA_THRESHOLDS.GREEN_MAX_PCT, 70);
  assert.equal(_QUOTA_THRESHOLDS.YELLOW_MAX_PCT, 90);
  // useColor=true cases — assert the right ANSI code is embedded.
  const green = _progressBar(50, true);
  const yellow = _progressBar(80, true);
  const red = _progressBar(95, true);
  assert.match(green, /\x1b\[32m/, 'pct 50 → green ANSI');
  assert.match(yellow, /\x1b\[33m/, 'pct 80 → yellow ANSI');
  assert.match(red, /\x1b\[31m/, 'pct 95 → red ANSI');
  // useColor=false → no ANSI
  const plain = _progressBar(50, false);
  assert.ok(!/\x1b\[/.test(plain), 'no color when useColor=false');
});
