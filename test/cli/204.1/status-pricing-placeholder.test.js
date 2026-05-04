'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const STATUS_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'status.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');

const { FRAMES_UTF8 } = require('../../../bin/lib/cli/spinner.cjs');

function resetModuleCache() {
  for (const p of [STATUS_PATH, KEYCHAIN_PATH]) {
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

async function runCli(fn) {
  const originalExit = process.exit;
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  let stdout = '';
  let stderr = '';
  let exitCode = null;

  class ExitSignal extends Error {
    constructor(code) {
      super(`exit:${code}`);
      this.exitCode = code;
    }
  }

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
  }

  return { exitCode, stdout, stderr };
}

async function withTty(fn) {
  const prevStdoutTTY = process.stdout.isTTY;
  const prevStderrTTY = process.stderr.isTTY;
  const prevLang = process.env.LANG;
  const prevNoColor = process.env.NO_COLOR;
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true, writable: true });
  Object.defineProperty(process.stderr, 'isTTY', { value: true, configurable: true, writable: true });
  process.env.LANG = 'en_US.UTF-8';
  delete process.env.NO_COLOR;
  try {
    return await fn();
  } finally {
    Object.defineProperty(process.stdout, 'isTTY', { value: prevStdoutTTY, configurable: true, writable: true });
    Object.defineProperty(process.stderr, 'isTTY', { value: prevStderrTTY, configurable: true, writable: true });
    if (prevLang == null) delete process.env.LANG;
    else process.env.LANG = prevLang;
    if (prevNoColor == null) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = prevNoColor;
  }
}

function makeEnvelope(subscription) {
  return {
    subscription,
    quota: {
      runs_this_month: 42,
      tokens_this_month: 62000,
      deliveries_this_month: 1200,
      window_days: 30,
    },
    active_rotations: [],
    recent_runs: [],
    generated_at: '2026-04-30T00:00:00Z',
  };
}

test('204.1 status: null pricing recommendation shows the pricing placeholder', async () => {
  await withTty(async () => {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'a'.repeat(64) });
    const mock = installFetchMock(async () => ({
      status: 200,
      body: makeEnvelope({ plan_tier: 'pro', billing_status: 'active', pricing_recommendation_id: null }),
    }));
    try {
      const { main } = require(STATUS_PATH);
      const result = await runCli(() => main({ cli: {} }));
      assert.equal(result.exitCode, 0);
      assert.match(result.stdout, /\{\{MARKOS_PRICING_ENGINE_PENDING\}\}/);
      assert.doesNotMatch(result.stdout, /Plan:\s+pro/);
    } finally {
      mock.restore();
    }
  });
});

test('204.1 status: non-null pricing recommendation keeps the approved tier name', async () => {
  await withTty(async () => {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'b'.repeat(64) });
    const mock = installFetchMock(async () => ({
      status: 200,
      body: makeEnvelope({ plan_tier: 'pro', billing_status: 'active', pricing_recommendation_id: 'pr_123' }),
    }));
    try {
      const { main } = require(STATUS_PATH);
      const result = await runCli(() => main({ cli: {} }));
      assert.equal(result.exitCode, 0);
      assert.match(result.stdout, /Plan:\s+pro/);
      assert.doesNotMatch(result.stdout, /\{\{MARKOS_PRICING_ENGINE_PENDING\}\}/);
    } finally {
      mock.restore();
    }
  });
});

test('204.1 status: missing plan tier still shows the placeholder when pricing is pending', async () => {
  await withTty(async () => {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'c'.repeat(64) });
    const mock = installFetchMock(async () => ({
      status: 200,
      body: makeEnvelope({ plan_tier: null, billing_status: 'trialing', pricing_recommendation_id: null }),
    }));
    try {
      const { main } = require(STATUS_PATH);
      const result = await runCli(() => main({ cli: {} }));
      assert.equal(result.exitCode, 0);
      assert.match(result.stdout, /Plan:\s+\{\{MARKOS_PRICING_ENGINE_PENDING\}\}/);
    } finally {
      mock.restore();
    }
  });
});

test('204.1 status: JSON mode preserves pricing_recommendation_id and never injects placeholder text', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'd'.repeat(64) });
  const mock = installFetchMock(async () => ({
    status: 200,
    body: makeEnvelope({ plan_tier: 'pro', billing_status: 'active', pricing_recommendation_id: null }),
  }));
  try {
    const { main } = require(STATUS_PATH);
    const result = await runCli(() => main({ cli: { json: true } }));
    assert.equal(result.exitCode, 0);
    const parsed = JSON.parse(result.stdout.trim());
    assert.equal(parsed.subscription.pricing_recommendation_id, null);
    assert.doesNotMatch(result.stdout, /\{\{MARKOS_PRICING_ENGINE_PENDING\}\}/);
  } finally {
    mock.restore();
  }
});

test('204.1 status: spinner renders on stderr during a slow human-mode fetch', async () => {
  await withTty(async () => {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'e'.repeat(64) });
    const mock = installFetchMock(async () => {
      await new Promise((resolve) => setTimeout(resolve, 180));
      return {
        status: 200,
        body: makeEnvelope({ plan_tier: 'pro', billing_status: 'active', pricing_recommendation_id: 'pr_123' }),
      };
    });
    try {
      const { main } = require(STATUS_PATH);
      const result = await runCli(() => main({ cli: {} }));
      assert.equal(result.exitCode, 0);
      assert.match(result.stderr, /fetching status/);
      assert.ok(FRAMES_UTF8.some((frame) => result.stderr.includes(frame)), 'expected a UTF-8 spinner frame');
    } finally {
      mock.restore();
    }
  });
});

test('204.1 status: spinner stays silent in JSON mode', async () => {
  await withTty(async () => {
    resetModuleCache();
    installKeychainSpy({ default: 'mks_ak_' + 'f'.repeat(64) });
    const mock = installFetchMock(async () => {
      await new Promise((resolve) => setTimeout(resolve, 180));
      return {
        status: 200,
        body: makeEnvelope({ plan_tier: 'pro', billing_status: 'active', pricing_recommendation_id: 'pr_123' }),
      };
    });
    try {
      const { main } = require(STATUS_PATH);
      const result = await runCli(() => main({ cli: { json: true } }));
      assert.equal(result.exitCode, 0);
      assert.equal(result.stderr, '');
    } finally {
      mock.restore();
    }
  });
});
