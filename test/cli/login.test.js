'use strict';

// Phase 204 Plan 02 Task 3 — `markos login` integration tests.
//
// Covers:
//   login-01: --token writes to keychain + exits 0
//   login-02: --token invalid format → exit 1 + stderr 'invalid_token'
//   login-03: device flow happy (stub scenario=happy) → writes access_token
//   login-04: device flow scenario=expired → exit 3 + stderr 'expired_token'
//   login-05: device flow scenario=slow-down → interval increases by 5000 ms
//   login-06: MARKOS_NO_BROWSER=1 → openBrowser not called
//   login-07: --profile=prod writes to profile='prod' keychain entry
//   login-08: SIGINT mid-poll → exit 3

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOGIN_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'login.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');
const OPEN_BROWSER_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'open-browser.cjs');
const HTTP_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'http.cjs');

const { startStubOAuthServer } = require('./_fixtures/oauth-device-server.cjs');

// ─── Test harness helpers ──────────────────────────────────────────────────
//
// login.cjs calls process.exit(). We must:
//   1. Stub process.exit to throw an Exit marker we can catch
//   2. Reset module cache between tests so login.cjs re-resolves fetch + deps
//   3. Inject a fake keychain so setToken writes into a spy map
//   4. Inject a fake openBrowser that records invocation
//   5. Override BASE_URL by injecting a fake http.cjs via require.cache

function resetModuleCache() {
  // Invalidate login.cjs and its direct dependencies so imports take fresh
  // cache entries on each test — otherwise the first test's fakes bleed into
  // subsequent runs.
  const paths = [LOGIN_PATH, KEYCHAIN_PATH, OPEN_BROWSER_PATH, HTTP_PATH];
  for (const p of paths) delete require.cache[require.resolve(p)];
}

function installKeychainSpy() {
  const store = new Map();
  const api = {
    SERVICE: 'markos-cli',
    async getToken(profile) { return store.get(profile) || null; },
    async setToken(profile, token) { store.set(profile, token); },
    async deleteToken(profile) { store.delete(profile); },
    async listProfiles() { return [...store.keys()].sort(); },
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

function installOpenBrowserSpy() {
  const calls = [];
  const api = {
    openBrowser(url) { calls.push(url); return null; },
    _calls: calls,
  };
  require.cache[OPEN_BROWSER_PATH] = {
    id: OPEN_BROWSER_PATH,
    filename: OPEN_BROWSER_PATH,
    loaded: true,
    exports: api,
  };
  return api;
}

function installHttpOverride(baseUrl) {
  // Load the real http module once to preserve AuthError/TransientError classes,
  // then shadow BASE_URL with the stub-server url.
  const real = require(HTTP_PATH);
  const api = { ...real, BASE_URL: baseUrl };
  require.cache[HTTP_PATH] = {
    id: HTTP_PATH,
    filename: HTTP_PATH,
    loaded: true,
    exports: api,
  };
  return api;
}

class ExitError extends Error {
  constructor(code) { super(`process.exit(${code})`); this.exitCode = code; }
}

// Permanent global install — stays in place across all tests and swallows
// any late `process.exit(...)` from leaked polling loops. Each captureExit()
// call records the FIRST exit code observed after it starts; late exits from
// prior tests become no-ops.
const exitSink = { current: null, exitCode: null, installed: false };

function installGlobalExitSink() {
  if (exitSink.installed) return;
  exitSink.installed = true;
  // Swallow any ExitError that bubbles up from a timer.
  process.on('uncaughtException', (err) => {
    if (err instanceof ExitError) return; // intentional — tests still decide pass/fail
    throw err;
  });
  process.exit = (code) => {
    if (exitSink.current) {
      exitSink.current.onExit(code);
    }
    // Throw so the caller's control flow still unwinds (but will be swallowed
    // by uncaughtException handler if it escapes the promise chain).
    throw new ExitError(code);
  };
}

function captureExit(fn) {
  installGlobalExitSink();
  return new Promise((resolve) => {
    let resolved = false;
    let seen = null;
    const settle = (exitCode) => {
      if (resolved) return;
      resolved = true;
      // Detach as the "active" exit observer; late exits from leaked code
      // after this point become harmless no-ops.
      if (exitSink.current && exitSink.current.id === handle.id) exitSink.current = null;
      resolve({ exitCode });
    };
    const handle = {
      id: Symbol('captureExit'),
      onExit: (code) => {
        seen = code;
        settle(code);
      },
    };
    exitSink.current = handle;

    Promise.resolve()
      .then(fn)
      .then(() => settle(seen))
      .catch((err) => {
        if (err instanceof ExitError) settle(err.exitCode);
        else { settle(null); /* swallow non-exit errors to avoid spurious reports */ }
      });
  });
}

function captureStderr(fn) {
  const originalWrite = process.stderr.write.bind(process.stderr);
  let buf = '';
  process.stderr.write = (chunk) => { buf += String(chunk); return true; };
  return Promise.resolve().then(fn).finally(() => { process.stderr.write = originalWrite; })
    .then((v) => ({ result: v, stderr: buf }));
}

// Neutralise the auto-install of the real keytar module — force keychain to
// always take the fallback path before the spy is installed (otherwise the
// real setToken writes to the host user's keychain).
process.env.MARKOS_API_KEY = '';

// ─── Tests ─────────────────────────────────────────────────────────────────

test('login-01: --token=<valid> writes to keychain + exits 0', async () => {
  resetModuleCache();
  const keychain = installKeychainSpy();
  installOpenBrowserSpy();
  installHttpOverride('http://127.0.0.1:1'); // unused in token mode

  const { main } = require(LOGIN_PATH);
  const validToken = 'mks_ak_' + 'a'.repeat(32);
  const cli = { token: validToken, json: true };

  const { exitCode } = await captureExit(() => main({ cli }));
  assert.equal(exitCode, 0);
  assert.equal(keychain._store.get('default'), validToken);
});

test('login-02: --token invalid format → exit 1 + stderr contains invalid_token', async () => {
  resetModuleCache();
  installKeychainSpy();
  installOpenBrowserSpy();
  installHttpOverride('http://127.0.0.1:1');

  const { main } = require(LOGIN_PATH);
  const { exitCode, stderr } = await captureStderr(async () => {
    const r = await captureExit(() => main({ cli: { token: 'garbage', json: true } }));
    return r;
  }).then((out) => ({ exitCode: out.result.exitCode, stderr: out.stderr }));

  assert.equal(exitCode, 1);
  assert.match(stderr, /invalid_token/);
});

test('login-03: device flow happy (stub scenario=happy) → writes access_token to keychain + exit 0', async () => {
  const server = await startStubOAuthServer({ scenario: 'happy', pendingThreshold: 1 });
  try {
    resetModuleCache();
    const keychain = installKeychainSpy();
    installOpenBrowserSpy();
    installHttpOverride(server.url);

    const { main } = require(LOGIN_PATH);
    const { exitCode } = await captureExit(() => main({ cli: { json: true, timeout: 30 } }));
    assert.equal(exitCode, 0);
    const token = keychain._store.get('default');
    assert.ok(token);
    assert.match(token, /^mks_ak_[a-f0-9]+$/);
  } finally {
    await server.close();
  }
});

test('login-04: device flow scenario=expired → exit 3 + stderr contains expired_token', async () => {
  const server = await startStubOAuthServer({ scenario: 'expired' });
  try {
    resetModuleCache();
    installKeychainSpy();
    installOpenBrowserSpy();
    installHttpOverride(server.url);

    const { main } = require(LOGIN_PATH);
    const out = await captureStderr(async () => captureExit(() => main({ cli: { json: true, timeout: 5 } })));
    assert.equal(out.result.exitCode, 3);
    assert.match(out.stderr, /TOKEN_EXPIRED|expired/);
  } finally {
    await server.close();
  }
});

test('login-05: device flow scenario=slow-down → interval increases (slow_down then success)', async () => {
  const server = await startStubOAuthServer({ scenario: 'slow-down' });
  try {
    resetModuleCache();
    const keychain = installKeychainSpy();
    installOpenBrowserSpy();
    installHttpOverride(server.url);

    // Spy on setTimeout to observe interval changes; restore after.
    const originalSetTimeout = global.setTimeout;
    const intervals = [];
    global.setTimeout = (fn, ms, ...rest) => {
      intervals.push(ms);
      return originalSetTimeout(fn, ms, ...rest);
    };

    try {
      const { main } = require(LOGIN_PATH);
      const { exitCode } = await captureExit(() => main({ cli: { json: true, timeout: 30 } }));
      assert.equal(exitCode, 0);
      // After slow_down the interval must have grown past the initial 1000ms
      // (stub server returns interval=1 second).
      const maxInterval = Math.max(...intervals.filter((n) => Number.isFinite(n) && n > 0));
      assert.ok(maxInterval >= 5000, `expected interval to bump by 5000ms on slow_down; saw max ${maxInterval}`);
      assert.ok(keychain._store.get('default'));
    } finally {
      global.setTimeout = originalSetTimeout;
    }
  } finally {
    await server.close();
  }
});

test('login-06: MARKOS_NO_BROWSER=1 → openBrowser not called', async () => {
  const server = await startStubOAuthServer({ scenario: 'happy', pendingThreshold: 0 });
  try {
    resetModuleCache();
    installKeychainSpy();
    const browser = installOpenBrowserSpy();
    installHttpOverride(server.url);

    process.env.MARKOS_NO_BROWSER = '1';
    try {
      const { main } = require(LOGIN_PATH);
      const { exitCode } = await captureExit(() => main({ cli: { json: true, timeout: 30 } }));
      assert.equal(exitCode, 0);
      assert.equal(browser._calls.length, 0, 'openBrowser must NOT be called when MARKOS_NO_BROWSER=1');
    } finally {
      delete process.env.MARKOS_NO_BROWSER;
    }
  } finally {
    await server.close();
  }
});

test('login-07: --profile=prod writes to profile="prod" keychain entry', async () => {
  const server = await startStubOAuthServer({ scenario: 'happy', pendingThreshold: 0 });
  try {
    resetModuleCache();
    const keychain = installKeychainSpy();
    installOpenBrowserSpy();
    installHttpOverride(server.url);

    const { main } = require(LOGIN_PATH);
    const { exitCode } = await captureExit(() => main({ cli: { profile: 'prod', json: true, noBrowser: true, timeout: 30 } }));
    assert.equal(exitCode, 0);
    assert.ok(keychain._store.get('prod'), 'prod profile must have token written');
    assert.equal(keychain._store.get('default'), undefined);
  } finally {
    await server.close();
  }
});

test('login-08: SIGINT mid-poll → exit 3', async () => {
  const server = await startStubOAuthServer({ scenario: 'pending' });
  try {
    resetModuleCache();
    installKeychainSpy();
    installOpenBrowserSpy();
    installHttpOverride(server.url);

    const { main } = require(LOGIN_PATH);
    // Drive main() and invoke SIGINT handler directly once login has registered it.
    // We can't send an OS signal from a test harness; instead, after start
    // we look up the listener that login.cjs installs and invoke it in a
    // Promise.race so the capture resolves without the throw escaping into
    // a timer callback (which node:test reports as uncaught).
    const mainPromise = captureExit(() => main({ cli: { json: true, noBrowser: true, timeout: 60 } }));

    // Give main() a few hundred ms to install its SIGINT handler.
    await new Promise((r) => setTimeout(r, 250));
    // Synchronously invoke the SIGINT listener registered by login.cjs.
    const listeners = process.listeners('SIGINT');
    const loginListener = listeners.find((fn) => /Login aborted/.test(fn.toString()))
      || listeners[listeners.length - 1];
    try {
      loginListener();
    } catch (err) {
      // ExitError will be thrown from the stub process.exit — swallow here so
      // node:test does NOT report it as an unhandled timer error.
      if (err && err.exitCode !== 3) throw err;
    }
    const { exitCode } = await mainPromise;
    assert.equal(exitCode, 3);
  } finally {
    await server.close();
  }
});

test('login-meta: login.cjs exports the main function + is NOT a stub', () => {
  // Sanity check that Plan 01's stub message is gone.
  const text = fs.readFileSync(LOGIN_PATH, 'utf8');
  assert.ok(!text.includes('not yet implemented'), 'stub NOT_IMPLEMENTED message must be removed');
  assert.ok(text.includes('setToken'));
  assert.ok(text.includes('openBrowser'));
  assert.ok(text.includes('SIGINT'));
  assert.ok(text.includes('/api/cli/oauth/device/start'));
  assert.ok(text.includes('/api/cli/oauth/device/token'));
});
