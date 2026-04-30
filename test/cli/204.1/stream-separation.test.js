'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const KEYS_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'keys.cjs');
const ENV_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'env.cjs');
const LOGIN_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'login.cjs');
const RUN_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'run.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');
const OPEN_BROWSER_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'open-browser.cjs');

function resetModuleCache() {
  for (const p of [KEYS_PATH, ENV_PATH, LOGIN_PATH, RUN_PATH, KEYCHAIN_PATH, OPEN_BROWSER_PATH]) {
    delete require.cache[require.resolve(p)];
  }
}

function installKeychainSpy(initial = {}) {
  const store = new Map(Object.entries(initial));
  require.cache[KEYCHAIN_PATH] = {
    id: KEYCHAIN_PATH,
    filename: KEYCHAIN_PATH,
    loaded: true,
    exports: {
      SERVICE: 'markos-cli',
      async getToken(profile) { return store.get(profile) || null; },
      async setToken(profile, token) { store.set(profile, token); },
      async deleteToken(profile) { store.delete(profile); },
      async listProfiles() { return [...store.keys()]; },
      xdgCredPath: () => '/tmp/no-such-path',
      _resetWarningStateForTests() {},
      _store: store,
    },
  };
}

function installOpenBrowserSpy() {
  const calls = [];
  require.cache[OPEN_BROWSER_PATH] = {
    id: OPEN_BROWSER_PATH,
    filename: OPEN_BROWSER_PATH,
    loaded: true,
    exports: {
      openBrowser(url) {
        calls.push(url);
        return null;
      },
      _calls: calls,
    },
  };
  return calls;
}

function installFetchMock(responder) {
  const originalFetch = global.fetch;
  const calls = [];
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
        if (typeof resp.body === 'string') return JSON.parse(resp.body);
        return resp.body || {};
      },
      clone() { return { async text() { return bodyText; } }; },
    };
  };
  return {
    calls,
    restore() { global.fetch = originalFetch; },
  };
}

async function runCli(fn, { stdoutTTY = true, stderrTTY = true } = {}) {
  const originalExit = process.exit;
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalStdoutTTY = process.stdout.isTTY;
  const originalStderrTTY = process.stderr.isTTY;
  let stdout = '';
  let stderr = '';
  let exitCode = null;

  class ExitSignal extends Error {
    constructor(code) {
      super(`exit:${code}`);
      this.exitCode = code;
    }
  }

  Object.defineProperty(process.stdout, 'isTTY', { value: stdoutTTY, configurable: true, writable: true });
  Object.defineProperty(process.stderr, 'isTTY', { value: stderrTTY, configurable: true, writable: true });
  process.exit = (code) => {
    exitCode = code;
    throw new ExitSignal(code);
  };
  process.stdout.write = (chunk) => {
    stdout += String(chunk);
    return true;
  };
  process.stderr.write = (chunk) => {
    stderr += String(chunk);
    return true;
  };

  try {
    await fn();
  } catch (err) {
    if (!(err instanceof ExitSignal)) throw err;
  } finally {
    process.exit = originalExit;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    Object.defineProperty(process.stdout, 'isTTY', { value: originalStdoutTTY, configurable: true, writable: true });
    Object.defineProperty(process.stderr, 'isTTY', { value: originalStderrTTY, configurable: true, writable: true });
  }

  return { exitCode, stdout, stderr };
}

async function withTempCwd(fn) {
  const prevCwd = process.cwd();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-cli-2041-'));
  process.chdir(tempDir);
  try {
    return await fn(tempDir);
  } finally {
    process.chdir(prevCwd);
  }
}

async function withPromptResponse(answer, fn) {
  const originalCreateInterface = readline.createInterface;
  readline.createInterface = () => ({
    question(_prompt, cb) {
      cb(answer);
    },
    close() {},
  });
  try {
    return await fn();
  } finally {
    readline.createInterface = originalCreateInterface;
  }
}

function withFastTimers(fn) {
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (cb, ms, ...args) => originalSetTimeout(cb, Math.min(Number(ms) || 0, 5), ...args);
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      global.setTimeout = originalSetTimeout;
    });
}

process.env.MARKOS_API_BASE_URL = 'http://127.0.0.1:1';

test('204.1 streams: keys revoke human mode writes success prose to stderr only', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'a'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 200, body: { revoked_at: '2026-04-30T00:00:00Z' } }));
  try {
    const { main } = require(KEYS_PATH);
    const result = await runCli(() => main({ cli: { positional: ['revoke', 'key_xyz'], yes: true } }));
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Key key_xyz revoked\./);
  } finally {
    mock.restore();
  }
});

test('204.1 streams: keys revoke JSON mode keeps the JSON envelope on stdout', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'b'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 200, body: { revoked_at: '2026-04-30T00:00:00Z' } }));
  try {
    const { main } = require(KEYS_PATH);
    const result = await runCli(() => main({ cli: { positional: ['revoke', 'key_xyz'], yes: true, json: true } }));
    assert.equal(result.exitCode, 0);
    const parsed = JSON.parse(result.stdout.trim());
    assert.equal(parsed.key_id, 'key_xyz');
    assert.equal(parsed.revoked_at, '2026-04-30T00:00:00Z');
    assert.doesNotMatch(result.stderr, /Key key_xyz revoked\./);
  } finally {
    mock.restore();
  }
});

test('204.1 streams: keys revoke aborts on stderr only', async () => {
  await withPromptResponse('n', async () => {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'bb'.repeat(32) });
    const mock = installFetchMock(async () => ({ status: 500, body: {} }));
    try {
      const { main } = require(KEYS_PATH);
      const result = await runCli(() => main({ cli: { positional: ['revoke', 'key_xyz'] } }));
      assert.equal(result.exitCode, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Aborted\./);
      assert.equal(mock.calls.length, 0);
    } finally {
      mock.restore();
    }
  });
});

test('204.1 streams: env pull human mode reports to stderr only', async () => {
  await withTempCwd(async () => {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'c'.repeat(64) });
    const mock = installFetchMock(async () => ({ status: 200, body: { entries: [{ key: 'FOO', value: 'bar' }] } }));
    try {
      const { main } = require(ENV_PATH);
      const result = await runCli(() => main({ cli: { positional: ['pull'], force: true } }));
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Pulled 1 env entries/);
    } finally {
      mock.restore();
    }
  });
});

test('204.1 streams: env push human mode reports to stderr only', async () => {
  await withTempCwd(async () => {
    fs.mkdirSync('.markos-local', { recursive: true });
    fs.writeFileSync(path.join('.markos-local', '.env'), 'FOO=bar\n', 'utf8');
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'd'.repeat(64) });
    const mock = installFetchMock(async () => ({ status: 200, body: { updated: 1 } }));
    try {
      const { main } = require(ENV_PATH);
      const result = await runCli(() => main({ cli: { positional: ['push'] } }));
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Pushed 1 env entries to tenant\./);
    } finally {
      mock.restore();
    }
  });
});

test('204.1 streams: env delete human mode reports to stderr only', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'e'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 200, body: { deleted: 1 } }));
  try {
    const { main } = require(ENV_PATH);
    const result = await runCli(() => main({ cli: { positional: ['delete', 'FOO'], yes: true } }));
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Deleted env key "FOO"\./);
  } finally {
    mock.restore();
  }
});

test('204.1 streams: env delete aborts on stderr only', async () => {
  await withPromptResponse('n', async () => {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'f'.repeat(64) });
    const mock = installFetchMock(async () => ({ status: 500, body: {} }));
    try {
      const { main } = require(ENV_PATH);
      const result = await runCli(() => main({ cli: { positional: ['delete', 'FOO'] } }));
      assert.equal(result.exitCode, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Aborted\./);
      assert.equal(mock.calls.length, 0);
    } finally {
      mock.restore();
    }
  });
});

test('204.1 streams: login device flow writes Go to / Code / success lines to stderr only', async () => {
  await withFastTimers(async () => {
    resetModuleCache();
    installKeychainSpy();
    installOpenBrowserSpy();
    const mock = installFetchMock(async ({ url }) => {
      if (/device\/start$/.test(url)) {
        return {
          status: 200,
          body: {
            verification_uri: 'https://markos.dev/verify',
            verification_uri_complete: 'https://markos.dev/verify?code=ABCD-1234',
            user_code: 'ABCD-1234',
            device_code: 'dev_123',
            expires_in: 900,
            interval: 0,
          },
        };
      }
      return {
        status: 200,
        body: {
          access_token: 'mks_ak_' + '1'.repeat(64),
          key_fingerprint: 'abcd1234',
        },
      };
    });
    try {
      const { main } = require(LOGIN_PATH);
      const result = await runCli(() => main({ cli: { noBrowser: true } }));
      assert.equal(result.exitCode, 0);
      assert.doesNotMatch(result.stdout, /Go to:|Code:|Logged in/);
      assert.match(result.stderr, /Go to:/);
      assert.match(result.stderr, /Code:/);
      assert.match(result.stderr, /Logged in/);
    } finally {
      mock.restore();
    }
  });
});

test('204.1 streams: run submit human mode reports to stderr only', async () => {
  await withTempCwd(async (cwd) => {
    const briefPath = path.join(cwd, 'brief.json');
    fs.writeFileSync(briefPath, JSON.stringify({
      channel: 'email',
      audience: 'founders',
      pain: 'pipeline velocity',
      promise: 're-fill your pipeline',
      brand: 'markos',
    }), 'utf8');

    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + '9'.repeat(64) });
    const mock = installFetchMock(async () => ({
      status: 201,
      body: {
        run_id: 'run_123',
        status: 'pending',
        events_url: '/api/tenant/runs/run_123/events',
      },
    }));
    try {
      const { main } = require(RUN_PATH);
      const result = await runCli(() => main({ cli: { positional: [briefPath], 'no-watch': true } }));
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Run submitted: run_123/);
      assert.match(result.stderr, /Watch with: markos status run run_123/);
    } finally {
      mock.restore();
    }
  });
});
