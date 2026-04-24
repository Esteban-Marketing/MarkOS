'use strict';

// Phase 204 Plan 03 Task 3 — `markos keys` CLI integration tests.
//
// Covers:
//   keys-01: `keys list` with valid token → fetches + renders + exits 0
//   keys-02: `keys list` no token → exits 3 (AUTH_FAILURE)
//   keys-03: `keys list` 401 → exits 3 (AUTH_FAILURE)
//   keys-04: `keys list` 403 → exits 4 (QUOTA_PERMISSION)
//   keys-05: `keys create --name=prod` 201 → prints access_token + warning
//   keys-06: `keys create` 403 insufficient_role → exits 4
//   keys-07: `keys revoke cak_abc --yes` 200 → exits 0
//   keys-08: `keys revoke cak_abc` non-TTY without --yes → exits 1 'refusing'
//   keys-09: unknown subcommand → exits 1 usage hint
//   keys-10: `keys revoke` missing key_id → exits 1
//   keys-11: `keys` no subcommand → exits 1 usage hint
//   keys-meta: bin/commands/keys.cjs is not a stub

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const KEYS_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'keys.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');

// ─── Harness ──────────────────────────────────────────────────────────────

function resetModuleCache() {
  for (const p of [KEYS_PATH, KEYCHAIN_PATH]) {
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

// Mock global fetch — per-test. Returns { calls: [] } for assertion.
function installFetchMock(responder) {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), method: (opts.method || 'GET').toUpperCase(), body: opts.body || null });
    const resp = await responder({ url: String(url), method: (opts.method || 'GET').toUpperCase(), body: opts.body || null });
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

// Per-test process.exit + stdout/stderr capture. No global listeners.
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

// Neutralise the real keytar.
process.env.MARKOS_API_KEY = '';
// Pin BASE_URL to a non-resolvable value so any un-mocked fetch would fail fast.
process.env.MARKOS_API_BASE_URL = 'http://127.0.0.1:1';

// ─── Tests ─────────────────────────────────────────────────────────────────

test('keys-01: keys list with valid token → fetches + exits 0', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_test' });
  const mock = installFetchMock(async () => ({
    status: 200,
    body: { keys: [{ id: 'cak_a', name: 'dev', key_fingerprint: 'fp000001', scope: 'cli', created_at: '2026-04-20T00:00:00Z', last_used_at: null }] },
  }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['list'], json: true } }));
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /cak_a/);
    assert.equal(mock.calls.length, 1);
    assert.equal(mock.calls[0].method, 'GET');
    assert.match(mock.calls[0].url, /\/api\/tenant\/api-keys\b/);
  } finally {
    mock.restore();
  }
});

test('keys-02: keys list no token → exits 3', async () => {
  resetModuleCache();
  installKeychainSpy(); // empty
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['list'], json: true } }));
    assert.equal(r.exitCode, 3);
    assert.match(r.stderr, /NO_TOKEN|markos login/);
    // No network should have been hit because token check is first.
    assert.equal(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
});

test('keys-03: keys list 401 → exits 3 (AUTH_FAILURE)', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_bad' });
  const mock = installFetchMock(async () => ({ status: 401, body: { error: 'unauthorized' } }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['list'], json: true } }));
    assert.equal(r.exitCode, 3);
  } finally {
    mock.restore();
  }
});

test('keys-04: keys list 403 → exits 4 (QUOTA_PERMISSION)', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({ status: 403, body: { error: 'forbidden' } }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['list'], json: true } }));
    assert.equal(r.exitCode, 4);
  } finally {
    mock.restore();
  }
});

test('keys-05: keys create --name=prod 201 → prints access_token + warning', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async ({ body, method }) => {
    if (method !== 'POST') return { status: 405, body: { error: 'method_not_allowed' } };
    const parsed = JSON.parse(body || '{}');
    if (parsed.name !== 'prod') return { status: 400, body: { error: 'unexpected_name' } };
    return {
      status: 201,
      body: {
        key_id: 'cak_new',
        access_token: 'mks_ak_' + 'a'.repeat(64),
        key_fingerprint: 'fpnewnew',
        name: 'prod',
        created_at: '2026-04-23T00:00:00Z',
      },
    };
  });
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['create'], name: 'prod', json: true } }));
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /mks_ak_/);
    assert.match(r.stdout, /cak_new/);
  } finally {
    mock.restore();
  }
});

test('keys-06: keys create 403 insufficient_role → exits 4', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({
    status: 403,
    body: { error: 'insufficient_role', required: ['owner', 'admin'], actual: 'member' },
  }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['create'], json: true } }));
    assert.equal(r.exitCode, 4);
  } finally {
    mock.restore();
  }
});

test('keys-07: keys revoke cak_abc --yes 200 → exits 0 + correct path hit', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({ status: 200, body: { revoked_at: '2026-04-23T12:00:00Z' } }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['revoke', 'cak_abc'], yes: true, json: true } }));
    assert.equal(r.exitCode, 0);
    assert.equal(mock.calls.length, 1);
    assert.match(mock.calls[0].url, /\/api\/tenant\/api-keys\/cak_abc\/revoke$/);
    assert.equal(mock.calls[0].method, 'POST');
  } finally {
    mock.restore();
  }
});

test('keys-08: keys revoke cak_abc no --yes + non-TTY → exits 1 refusing', async () => {
  const prevTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true, writable: true });
  try {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_t' });
    const mock = installFetchMock(async () => ({ status: 500, body: {} }));
    try {
      const { main } = require(KEYS_PATH);
      const r = await runCli(() => main({ cli: { positional: ['revoke', 'cak_abc'], yes: false, json: true } }));
      assert.equal(r.exitCode, 1);
      assert.match(r.stderr, /refusing to revoke/);
      assert.equal(mock.calls.length, 0, 'no network call must be made when refusing');
    } finally {
      mock.restore();
    }
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
  }
});

test('keys-09: unknown subcommand → exits 1 with usage', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['nonsense'], json: true } }));
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /usage: markos keys/);
  } finally {
    mock.restore();
  }
});

test('keys-10: revoke missing key_id → exits 1', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: ['revoke'], yes: true, json: true } }));
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /usage: markos keys revoke/);
  } finally {
    mock.restore();
  }
});

test('keys-11: no subcommand → exits 1 with usage', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(KEYS_PATH);
    const r = await runCli(() => main({ cli: { positional: [], json: true } }));
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /usage: markos keys/);
  } finally {
    mock.restore();
  }
});

test('keys-meta: bin/commands/keys.cjs is not a stub + wires through shared primitives', () => {
  const text = fs.readFileSync(KEYS_PATH, 'utf8');
  assert.ok(!text.includes('not yet implemented'), 'stub message must be gone');
  assert.ok(/require\(['"]\.\.\/lib\/cli\/http\.cjs['"]\)/.test(text), 'keys.cjs must require http primitive');
  assert.ok(/require\(['"]\.\.\/lib\/cli\/keychain\.cjs['"]\)/.test(text), 'keys.cjs must require keychain primitive');
  assert.ok(/access_token/.test(text), 'create must print access_token');
  assert.ok(/cli\.yes/.test(text) || /--yes/.test(text), 'revoke must gate on --yes / cli.yes');
  assert.ok(/refusing to revoke/.test(text), 'non-TTY revoke must refuse without --yes');
  assert.ok(
    /only time the full token is shown/i.test(text) || /store it securely/i.test(text),
    'create must warn on echo-once',
  );
});
