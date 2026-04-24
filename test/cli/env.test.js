'use strict';

// Phase 204 Plan 07 Task 3 — `markos env` CLI integration tests.
//
// Covers:
//   env-01: env list happy → renders + exit 0
//   env-02: env pull into new file → writes 0o600 .markos-local/.env
//   env-03: env pull existing file without --force → exit 1 + file_exists hint
//   env-04: env pull --force overwrites
//   env-05: env pull --diff shows additions/removals without writing
//   env-06: env pull --merge preserves local-only keys
//   env-07: env push reads .markos-local/.env + POSTs + exit 0
//   env-08: env push --dry-run prints without POST (spy)
//   env-09: env push missing .env → exit 1 NOT_FOUND
//   env-10: env delete key --yes happy
//   env-11: env delete key no --yes non-TTY → exit 1 refusing
//   env-12: unknown subcommand → exit 1 usage

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ENV_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'env.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');

// ─── Harness ──────────────────────────────────────────────────────────────

function resetModuleCache() {
  for (const p of [ENV_PATH, KEYCHAIN_PATH]) {
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
    const method = (opts.method || 'GET').toUpperCase();
    const body = opts.body || null;
    calls.push({ url: String(url), method, body });
    const resp = await responder({ url: String(url), method, body });
    const bodyText = JSON.stringify(resp.body || {});
    return {
      status: resp.status,
      statusText: resp.statusText || '',
      ok: resp.status >= 200 && resp.status < 300,
      headers: new Map(),
      async text() { return bodyText; },
      async json() { return resp.body || {}; },
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

// Per-test isolated cwd so .markos-local/.env writes don't pollute the repo.
function withTmpCwd(fn) {
  return async () => {
    const prev = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-env-test-'));
    try {
      process.chdir(dir);
      await fn(dir);
    } finally {
      process.chdir(prev);
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
  };
}

process.env.MARKOS_API_KEY = '';
process.env.MARKOS_API_BASE_URL = 'http://127.0.0.1:1';

// ─── Tests ─────────────────────────────────────────────────────────────────

test('env-01: env list happy → renders + exit 0', withTmpCwd(async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({
    status: 200,
    body: { entries: [{ key: 'FOO', value_preview: 'hell…', updated_at: '2026-04-23T00:00:00Z', updated_by: 'usr_a' }] },
  }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['list'], json: true } }));
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /FOO/);
    assert.equal(mock.calls.length, 1);
    assert.equal(mock.calls[0].method, 'GET');
    assert.match(mock.calls[0].url, /\/api\/tenant\/env\b/);
  } finally {
    mock.restore();
  }
}));

test('env-02: env pull into new file → writes 0o600 .markos-local/.env', withTmpCwd(async (dir) => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({
    status: 200,
    body: { entries: [{ key: 'FOO', value: 'hello' }, { key: 'BAR', value: 'world' }] },
  }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['pull'], json: true } }));
    assert.equal(r.exitCode, 0);
    const envFile = path.join(dir, '.markos-local', '.env');
    assert.ok(fs.existsSync(envFile), 'pull should write .markos-local/.env');
    const text = fs.readFileSync(envFile, 'utf8');
    assert.match(text, /^FOO=hello$/m);
    assert.match(text, /^BAR=world$/m);
    // 0o600 (POSIX only — Windows may not honor chmod, skip there).
    if (process.platform !== 'win32') {
      const st = fs.statSync(envFile);
      assert.equal((st.mode & 0o777), 0o600, 'mode must be 0o600');
    }
  } finally {
    mock.restore();
  }
}));

test('env-03: env pull existing file without --force → exit 1 + file_exists hint', withTmpCwd(async (dir) => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  fs.mkdirSync(path.join(dir, '.markos-local'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.markos-local', '.env'), 'LOCAL=preserved\n');
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['pull'], json: true } }));
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /file_exists|--force/);
    // No network call must have been made.
    assert.equal(mock.calls.length, 0);
    // Local file must be unchanged.
    const text = fs.readFileSync(path.join(dir, '.markos-local', '.env'), 'utf8');
    assert.match(text, /LOCAL=preserved/);
  } finally {
    mock.restore();
  }
}));

test('env-04: env pull --force overwrites', withTmpCwd(async (dir) => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  fs.mkdirSync(path.join(dir, '.markos-local'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.markos-local', '.env'), 'OLD=gone\n');
  const mock = installFetchMock(async () => ({
    status: 200,
    body: { entries: [{ key: 'FRESH', value: 'new' }] },
  }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['pull'], force: true, json: true } }));
    assert.equal(r.exitCode, 0);
    const text = fs.readFileSync(path.join(dir, '.markos-local', '.env'), 'utf8');
    assert.match(text, /FRESH=new/);
    assert.ok(!text.includes('OLD=gone'), 'force must overwrite old contents');
  } finally {
    mock.restore();
  }
}));

test('env-05: env pull --diff shows additions/removals without writing', withTmpCwd(async (dir) => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  fs.mkdirSync(path.join(dir, '.markos-local'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.markos-local', '.env'), 'LOCAL_ONLY=x\nSHARED=local_value\n');
  const mock = installFetchMock(async () => ({
    status: 200,
    body: { entries: [
      { key: 'SHARED', value: 'remote_value' },
      { key: 'REMOTE_ONLY', value: 'y' },
    ] },
  }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['pull'], diff: true, json: true } }));
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /REMOTE_ONLY/);    // added
    assert.match(r.stdout, /SHARED/);         // changed
    assert.match(r.stdout, /LOCAL_ONLY/);     // removed
    // File must be unchanged.
    const text = fs.readFileSync(path.join(dir, '.markos-local', '.env'), 'utf8');
    assert.match(text, /SHARED=local_value/);
    assert.match(text, /LOCAL_ONLY=x/);
  } finally {
    mock.restore();
  }
}));

test('env-06: env pull --merge preserves local-only keys', withTmpCwd(async (dir) => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  fs.mkdirSync(path.join(dir, '.markos-local'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.markos-local', '.env'), 'LOCAL_ONLY=keepme\nSHARED=will_lose\n');
  const mock = installFetchMock(async () => ({
    status: 200,
    body: { entries: [
      { key: 'SHARED', value: 'remote_wins' },
      { key: 'REMOTE_ONLY', value: 'new' },
    ] },
  }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['pull'], merge: true, json: true } }));
    assert.equal(r.exitCode, 0);
    const text = fs.readFileSync(path.join(dir, '.markos-local', '.env'), 'utf8');
    assert.match(text, /LOCAL_ONLY=keepme/, 'local-only key must survive');
    assert.match(text, /SHARED=remote_wins/, 'remote must win conflict');
    assert.match(text, /REMOTE_ONLY=new/, 'remote-only key must land');
  } finally {
    mock.restore();
  }
}));

test('env-07: env push reads .markos-local/.env + POSTs + exit 0', withTmpCwd(async (dir) => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  fs.mkdirSync(path.join(dir, '.markos-local'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.markos-local', '.env'), 'FOO=a\nBAR=b\n');
  const mock = installFetchMock(async ({ method, url, body }) => {
    if (method === 'POST' && url.includes('/api/tenant/env/push')) {
      const parsed = JSON.parse(body || '{}');
      return { status: 200, body: { updated: parsed.entries.length } };
    }
    return { status: 405, body: { error: 'method_not_allowed' } };
  });
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['push'], json: true } }));
    assert.equal(r.exitCode, 0);
    assert.equal(mock.calls.length, 1);
    assert.equal(mock.calls[0].method, 'POST');
    const sent = JSON.parse(mock.calls[0].body);
    assert.equal(sent.entries.length, 2);
    assert.deepEqual(sent.entries.map((e) => e.key).sort(), ['BAR', 'FOO']);
  } finally {
    mock.restore();
  }
}));

test('env-08: env push --dry-run prints without POST', withTmpCwd(async (dir) => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  fs.mkdirSync(path.join(dir, '.markos-local'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.markos-local', '.env'), 'FOO=a\n');
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['push'], 'dry-run': true, json: true } }));
    assert.equal(r.exitCode, 0);
    assert.equal(mock.calls.length, 0, 'dry-run must not call the server');
    assert.match(r.stdout, /FOO/);
  } finally {
    mock.restore();
  }
}));

test('env-09: env push missing .env → exit 1 NOT_FOUND', withTmpCwd(async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['push'], json: true } }));
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /no \.env|NOT_FOUND/);
    assert.equal(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
}));

test('env-10: env delete key --yes happy', withTmpCwd(async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async ({ method, url }) => {
    if (method === 'POST' && url.includes('/api/tenant/env/delete')) {
      return { status: 200, body: { deleted: 1 } };
    }
    return { status: 500, body: {} };
  });
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['delete', 'FOO'], yes: true, json: true } }));
    assert.equal(r.exitCode, 0);
    assert.equal(mock.calls.length, 1);
    assert.match(mock.calls[0].url, /\/api\/tenant\/env\/delete$/);
    const sent = JSON.parse(mock.calls[0].body);
    assert.deepEqual(sent.keys, ['FOO']);
  } finally {
    mock.restore();
  }
}));

test('env-11: env delete key no --yes non-TTY → exit 1 refusing', withTmpCwd(async () => {
  const prevTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true, writable: true });
  try {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_t' });
    const mock = installFetchMock(async () => ({ status: 500, body: {} }));
    try {
      const { main } = require(ENV_PATH);
      const r = await runCli(() => main({ cli: { positional: ['delete', 'FOO'], yes: false, json: true } }));
      assert.equal(r.exitCode, 1);
      assert.match(r.stderr, /refusing/);
      assert.equal(mock.calls.length, 0);
    } finally {
      mock.restore();
    }
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevTTY, configurable: true, writable: true });
  }
}));

test('env-12: unknown subcommand → exit 1 usage', withTmpCwd(async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_t' });
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(ENV_PATH);
    const r = await runCli(() => main({ cli: { positional: ['nonsense'], json: true } }));
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /usage: markos env/);
  } finally {
    mock.restore();
  }
}));

test('env-meta: bin/commands/env.cjs is not a stub', () => {
  const text = fs.readFileSync(ENV_PATH, 'utf8');
  assert.ok(!text.includes('not yet implemented'), 'env.cjs must not contain stub sentinel');
  // Key subcommand words must be present.
  for (const word of ['list', 'pull', 'push', 'delete']) {
    assert.ok(text.includes(`'${word}'`), `env.cjs missing subcommand word: ${word}`);
  }
  assert.match(text, /\.markos-local/);
  assert.match(text, /0o600/);
  assert.match(text, /parseDotenv|serializeDotenv/);
});
