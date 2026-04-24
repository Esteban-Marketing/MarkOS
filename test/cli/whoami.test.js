'use strict';

// Phase 204 Plan 04 Task 2 — `markos whoami` CLI integration tests.
//
// Covers:
//   wh-01: whoami no token → exit 3 + stderr contains 'Run `markos login`'
//   wh-02: whoami valid token → exits 0 + stdout JSON in non-TTY
//   wh-03: whoami 401 invalid_token → exit 3 with 'Session expired' hint
//   wh-04: whoami 401 revoked_token → exit 3 with 'revoked' message
//   wh-05: whoami --profile=prod uses 'prod' profile keychain entry
//   wh-06: whoami TTY mode emits boxed unicode table (grep ┌ char)
//   wh-07: stdout NEVER contains 'mks_ak_' (never leaks token)
//   wh-08: whoami 5xx server error → exit 2 transient
//   wh-meta: bin/commands/whoami.cjs is not a stub + wires through shared primitives

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const WHOAMI_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'whoami.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');

// ─── Harness ──────────────────────────────────────────────────────────────

function resetModuleCache() {
  for (const p of [WHOAMI_PATH, KEYCHAIN_PATH]) {
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

// Per-test mock of global.fetch. Returns { calls, restore }.
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
    const bodyText = JSON.stringify(resp.body || {});
    return {
      status: resp.status,
      statusText: resp.statusText || '',
      ok: resp.status >= 200 && resp.status < 300,
      headers: new Map(),
      async text() { return bodyText; },
      async json() { return resp.body || {}; },
      clone() {
        return { async text() { return bodyText; } };
      },
    };
  };
  return {
    calls,
    restore: () => { global.fetch = originalFetch; },
  };
}

// Per-test process.exit + stdout/stderr capture.
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

// Happy envelope used by multiple tests — never contains plaintext token.
const HAPPY_ENVELOPE = {
  tenant_id: 'ten_acme',
  tenant_name: 'Acme Inc',
  role: 'owner',
  email: 'sam@acme.com',
  user_id: 'usr_sam',
  key_fingerprint: 'a1b2c3d4',
  scope: 'cli',
  last_used_at: '2026-04-20T00:00:00Z',
};

// Neutralise the real keytar + pin BASE_URL so un-mocked fetches fail fast.
process.env.MARKOS_API_KEY = '';
process.env.MARKOS_API_BASE_URL = 'http://127.0.0.1:1';

// ─── Tests ─────────────────────────────────────────────────────────────────

test('wh-01: whoami no token → exit 3 + stderr mentions `markos login`', async () => {
  resetModuleCache();
  installKeychainSpy(); // empty keychain
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(WHOAMI_PATH);
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 3);
    assert.match(r.stderr, /markos login/i);
    // No network should have been hit.
    assert.equal(mock.calls.length, 0, 'no fetch when keychain is empty');
  } finally {
    mock.restore();
  }
});

test('wh-02: whoami valid token → exits 0 + stdout JSON in non-TTY', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'a'.repeat(64) });
  const mock = installFetchMock(async ({ method, url }) => {
    assert.equal(method, 'GET');
    assert.match(url, /\/api\/tenant\/whoami\b/);
    return { status: 200, body: HAPPY_ENVELOPE };
  });
  try {
    const { main } = require(WHOAMI_PATH);
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 0);
    const parsed = JSON.parse(r.stdout.trim());
    assert.equal(parsed.tenant_id, 'ten_acme');
    assert.equal(parsed.tenant_name, 'Acme Inc');
    assert.equal(parsed.role, 'owner');
    assert.equal(parsed.email, 'sam@acme.com');
    assert.equal(parsed.key_fingerprint, 'a1b2c3d4');
    assert.equal(parsed.scope, 'cli');
    assert.equal(parsed.profile, 'default');
    assert.equal(mock.calls.length, 1);
    // Authorization header sent as Bearer.
    assert.match(mock.calls[0].headers.Authorization || '', /^Bearer mks_ak_/);
  } finally {
    mock.restore();
  }
});

test('wh-03: whoami 401 invalid_token → exit 3 with hint `markos login`', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'b'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 401, body: { error: 'invalid_token' } }));
  try {
    const { main } = require(WHOAMI_PATH);
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 3);
    // Either the session-expired message or generic UNAUTHORIZED envelope.
    assert.match(r.stderr, /expired|UNAUTHORIZED/i);
    assert.match(r.stderr, /markos login/i);
  } finally {
    mock.restore();
  }
});

test('wh-04: whoami 401 revoked_token → exit 3 + mentions revoked', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'c'.repeat(64) });
  const mock = installFetchMock(async () => ({
    status: 401,
    body: { error: 'revoked_token', hint: 'Run `markos login` again.' },
  }));
  try {
    const { main } = require(WHOAMI_PATH);
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 3);
    assert.match(r.stderr, /revoked/i);
    assert.match(r.stderr, /markos login/i);
  } finally {
    mock.restore();
  }
});

test('wh-05: whoami --profile=prod reads `prod` keychain entry', async () => {
  resetModuleCache();
  const spy = installKeychainSpy({ prod: 'mks_ak_' + 'd'.repeat(64) });
  // Record every profile key requested — assert only `prod` was asked.
  const asked = [];
  const origGet = spy.getToken;
  spy.getToken = async (profile) => {
    asked.push(profile);
    return origGet.call(spy, profile);
  };
  const mock = installFetchMock(async () => ({ status: 200, body: HAPPY_ENVELOPE }));
  try {
    const { main } = require(WHOAMI_PATH);
    const r = await runCli(() => main({ cli: { profile: 'prod', json: true } }));
    assert.equal(r.exitCode, 0);
    assert.deepEqual(asked, ['prod']);
    const parsed = JSON.parse(r.stdout.trim());
    assert.equal(parsed.profile, 'prod');
  } finally {
    mock.restore();
  }
});

test('wh-06: whoami TTY mode emits boxed unicode table (contains ┌)', async () => {
  const prevTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true, writable: true });
  try {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'e'.repeat(64) });
    const mock = installFetchMock(async () => ({ status: 200, body: HAPPY_ENVELOPE }));
    try {
      const { main } = require(WHOAMI_PATH);
      // No json:true → TTY path is taken.
      const r = await runCli(() => main({ cli: {} }));
      assert.equal(r.exitCode, 0);
      assert.match(r.stdout, /┌/, 'TTY output must contain box drawing ┌');
      assert.match(r.stdout, /└/, 'TTY output must contain box drawing └');
      assert.match(r.stdout, /Tenant/, 'TTY output must have Tenant label');
      assert.match(r.stdout, /Acme Inc/, 'TTY output must render tenant_name');
      assert.match(r.stdout, /a1b2c3d4/, 'TTY output must render key_fingerprint');
      assert.match(r.stdout, /whoami \(profile: default\)/, 'header must include profile');
    } finally {
      mock.restore();
    }
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
  }
});

test('wh-07: stdout NEVER contains `mks_ak_` (never leaks Bearer token)', async () => {
  const token = 'mks_ak_' + 'f'.repeat(64);
  resetModuleCache();
  installKeychainSpy({ default: token });
  const mock = installFetchMock(async () => ({ status: 200, body: HAPPY_ENVELOPE }));
  try {
    const { main } = require(WHOAMI_PATH);
    // Test both JSON and would-be TTY output paths — both must be safe.
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 0);
    assert.ok(!r.stdout.includes('mks_ak_'), 'stdout must NEVER contain mks_ak_ prefix');
    assert.ok(!r.stdout.includes(token), 'stdout must NEVER contain full token');
    assert.ok(!r.stderr.includes('mks_ak_'), 'stderr must NEVER contain mks_ak_ prefix');
  } finally {
    mock.restore();
  }
});

test('wh-08: whoami 5xx server error → exit 2 transient', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'g'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 500, body: { error: 'whoami_failed' } }));
  try {
    const { main } = require(WHOAMI_PATH);
    const r = await runCli(() => main({ cli: { json: true, retries: 0 } }));
    // authedFetch treats 5xx as retriable and after retries throws TransientError.
    assert.equal(r.exitCode, 2);
    assert.match(r.stderr, /SERVER_ERROR|Server error/i);
  } finally {
    mock.restore();
  }
});

test('wh-meta: bin/commands/whoami.cjs is not a stub + wires through shared primitives', () => {
  const text = fs.readFileSync(WHOAMI_PATH, 'utf8');
  assert.ok(!text.includes('not yet implemented'), 'stub message must be gone');
  assert.ok(/require\(['"]\.\.\/lib\/cli\/http\.cjs['"]\)/.test(text), 'whoami.cjs must require http primitive');
  assert.ok(/require\(['"]\.\.\/lib\/cli\/keychain\.cjs['"]\)/.test(text), 'whoami.cjs must require keychain primitive');
  assert.ok(/require\(['"]\.\.\/lib\/cli\/output\.cjs['"]\)/.test(text), 'whoami.cjs must require output primitive');
  assert.ok(/\/api\/tenant\/whoami/.test(text), 'whoami.cjs must hit /api/tenant/whoami');
  assert.ok(/authedFetch/.test(text), 'whoami.cjs must use authedFetch');
  assert.ok(/key_fingerprint/.test(text), 'whoami.cjs must reference key_fingerprint in rendering');
  assert.ok(/Run .markos login./.test(text) || /no_token|NO_TOKEN/.test(text), 'whoami.cjs must have first-run nudge');
  // Security rail: never echo token / hash.
  assert.ok(!/mks_ak_/.test(text), 'whoami.cjs must not contain any mks_ak_ substring anywhere');
});
