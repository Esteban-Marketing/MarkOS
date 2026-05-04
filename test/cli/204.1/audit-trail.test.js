'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const AUDIT_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'audit.cjs');
const HTTP_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'http.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');
const INSTALL_PATH = path.resolve(REPO_ROOT, 'bin', 'install.cjs');
const DOCTOR_COMMAND_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'doctor.cjs');

process.env.MARKOS_API_KEY = '';

function resetModuleCache() {
  for (const modulePath of [AUDIT_PATH, HTTP_PATH, KEYCHAIN_PATH, INSTALL_PATH, DOCTOR_COMMAND_PATH]) {
    delete require.cache[require.resolve(modulePath)];
  }
}

function installKeychainSpy(initial = {}) {
  const store = new Map(Object.entries(initial));
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

function installFetchMock(responder) {
  const calls = [];
  const originalFetch = global.fetch;

  global.fetch = async (url, opts = {}) => {
    const method = String(opts.method || 'GET').toUpperCase();
    const call = {
      url: String(url),
      method,
      headers: { ...(opts.headers || {}) },
      body: opts.body || null,
    };
    calls.push(call);
    const response = await responder(call);
    const bodyText = typeof response.body === 'string' ? response.body : JSON.stringify(response.body || {});

    return {
      status: response.status,
      statusText: response.statusText || '',
      ok: response.status >= 200 && response.status < 300,
      async text() { return bodyText; },
      async json() { return typeof response.body === 'string' ? JSON.parse(response.body) : (response.body || {}); },
      clone() {
        return {
          async text() { return bodyText; },
        };
      },
    };
  };

  return {
    calls,
    restore() {
      global.fetch = originalFetch;
    },
  };
}

async function captureStderr(fn) {
  const originalWrite = process.stderr.write.bind(process.stderr);
  let stderr = '';

  process.stderr.write = (chunk) => {
    stderr += String(chunk);
    return true;
  };

  try {
    const result = await fn();
    return { result, stderr };
  } finally {
    process.stderr.write = originalWrite;
  }
}

class ExitSignal extends Error {
  constructor(code) {
    super(`exit:${code}`);
    this.name = 'ExitSignal';
    this.exitCode = code;
  }
}

async function captureExit(fn) {
  const originalExit = process.exit;
  let exitCode = null;

  process.exit = (code) => {
    exitCode = code;
    throw new ExitSignal(code);
  };

  try {
    await fn();
    return { exitCode };
  } catch (error) {
    if (error instanceof ExitSignal) {
      return { exitCode: error.exitCode };
    }
    throw error;
  } finally {
    process.exit = originalExit;
  }
}

test('204.1 audit-01: redactArgs scrubs token values', () => {
  resetModuleCache();
  const { redactArgs } = require(AUDIT_PATH);

  const output = redactArgs({
    command: 'login',
    token: 'sekrit-abc-123',
    profile: 'staging',
    json: false,
    positional: [],
  });

  assert.equal(output.token, '[REDACTED]');
  assert.equal(JSON.stringify(output).includes('sekrit'), false);
});

test('204.1 audit-02: redactArgs scrubs env put positional value', () => {
  resetModuleCache();
  const { redactArgs } = require(AUDIT_PATH);

  const output = redactArgs({
    command: 'env',
    name: 'DATABASE_URL',
    positional: ['put', 'API_KEY', 'prod-secret-xyz'],
  });

  assert.deepEqual(output.positional, ['put', 'API_KEY', '[REDACTED]']);
  assert.equal(JSON.stringify(output).includes('prod-secret-xyz'), false);
});

test('204.1 audit-03: redactArgs preserves non-secret flags', () => {
  resetModuleCache();
  const { redactArgs } = require(AUDIT_PATH);

  const input = {
    json: true,
    watch: true,
    force: true,
    format: 'json',
    tenant: 'ten_abc',
    timeout: '30000',
  };

  assert.deepEqual(redactArgs(input), input);
});

test('204.1 audit-04: recordCommandAudit success path returns recorded true and stays quiet', async () => {
  const previousBaseUrl = process.env.MARKOS_API_BASE_URL;
  process.env.MARKOS_API_BASE_URL = 'https://audit.example.test';

  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_testtoken' });
  const fetchMock = installFetchMock(async () => ({ status: 202, body: { ok: true } }));

  try {
    const { recordCommandAudit } = require(AUDIT_PATH);
    const { result, stderr } = await captureStderr(() => recordCommandAudit({
      command: 'whoami',
      parsed: { command: 'whoami', profile: 'default' },
      profile: 'default',
      exit_code: 0,
      duration_ms: 12,
    }));

    assert.deepEqual(result, { recorded: true, status: 202 });
    assert.equal(stderr, '');
    assert.equal(fetchMock.calls.length, 1);
    assert.equal(fetchMock.calls[0].method, 'POST');
    assert.match(fetchMock.calls[0].url, /\/api\/tenant\/cli-audit$/);
    assert.equal(fetchMock.calls[0].headers.Authorization, 'Bearer mks_ak_testtoken');
  } finally {
    fetchMock.restore();
    if (previousBaseUrl === undefined) {
      delete process.env.MARKOS_API_BASE_URL;
    } else {
      process.env.MARKOS_API_BASE_URL = previousBaseUrl;
    }
  }
});

test('204.1 audit-05: recordCommandAudit 404 fallback is debug-only', async () => {
  const previousBaseUrl = process.env.MARKOS_API_BASE_URL;
  process.env.MARKOS_API_BASE_URL = 'https://audit.example.test';

  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_testtoken' });
  const fetchMock = installFetchMock(async () => ({ status: 404, body: { error: 'not_found' } }));

  try {
    const { recordCommandAudit } = require(AUDIT_PATH);

    const debugRun = await captureStderr(() => recordCommandAudit({
      command: 'status',
      parsed: { command: 'status', profile: 'default' },
      profile: 'default',
      exit_code: 0,
      duration_ms: 8,
      debug: true,
    }));
    assert.deepEqual(debugRun.result, { recorded: false, reason: 'endpoint_not_available' });
    const lines = debugRun.stderr.trim().split(/\r?\n/).filter(Boolean);
    assert.equal(lines.length, 1);
    assert.match(lines[0], /\[audit\] endpoint not yet available/);

    const quietRun = await captureStderr(() => recordCommandAudit({
      command: 'status',
      parsed: { command: 'status', profile: 'default' },
      profile: 'default',
      exit_code: 0,
      duration_ms: 8,
      debug: false,
    }));
    assert.deepEqual(quietRun.result, { recorded: false, reason: 'endpoint_not_available' });
    assert.equal(quietRun.stderr, '');
  } finally {
    fetchMock.restore();
    if (previousBaseUrl === undefined) {
      delete process.env.MARKOS_API_BASE_URL;
    } else {
      process.env.MARKOS_API_BASE_URL = previousBaseUrl;
    }
  }
});

test('204.1 audit-06: recordCommandAudit transport failures never reject', async () => {
  const previousBaseUrl = process.env.MARKOS_API_BASE_URL;
  process.env.MARKOS_API_BASE_URL = 'https://audit.example.test';

  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_testtoken' });
  const fetchMock = installFetchMock(async () => {
    throw new Error('ENETUNREACH');
  });

  try {
    const { recordCommandAudit } = require(AUDIT_PATH);
    const debugRun = await captureStderr(() => recordCommandAudit({
      command: 'run',
      parsed: { command: 'run', profile: 'default' },
      profile: 'default',
      exit_code: 2,
      duration_ms: 99,
      debug: true,
    }));

    assert.deepEqual(debugRun.result, { recorded: false, reason: 'transport_error' });
    assert.match(debugRun.stderr, /\[audit\] transport error - skipping/);
  } finally {
    fetchMock.restore();
    if (previousBaseUrl === undefined) {
      delete process.env.MARKOS_API_BASE_URL;
    } else {
      process.env.MARKOS_API_BASE_URL = previousBaseUrl;
    }
  }
});

test('204.1 audit-07: audit envelope has the expected key set', async () => {
  const previousBaseUrl = process.env.MARKOS_API_BASE_URL;
  process.env.MARKOS_API_BASE_URL = 'https://audit.example.test';

  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_testtoken' });
  const fetchMock = installFetchMock(async () => ({ status: 202, body: { ok: true } }));

  try {
    const { recordCommandAudit } = require(AUDIT_PATH);
    await recordCommandAudit({
      command: 'env',
      parsed: { command: 'env', positional: ['put', 'API_KEY', 'sekrit'] },
      profile: 'default',
      exit_code: 4,
      duration_ms: 41,
    });

    const posted = JSON.parse(fetchMock.calls[0].body);
    assert.deepEqual(Object.keys(posted), [
      'command',
      'args_redacted',
      'profile',
      'exit_code',
      'duration_ms',
      'cli_version',
    ]);
    assert.equal(posted.command, 'env');
    assert.equal(typeof posted.exit_code, 'number');
    assert.ok(posted.exit_code >= 0 && posted.exit_code <= 5);
    assert.deepEqual(posted.args_redacted.positional, ['put', 'API_KEY', '[REDACTED]']);
  } finally {
    fetchMock.restore();
    if (previousBaseUrl === undefined) {
      delete process.env.MARKOS_API_BASE_URL;
    } else {
      process.env.MARKOS_API_BASE_URL = previousBaseUrl;
    }
  }
});

test('204.1 audit-08: dispatch helper records audit before propagating process.exit', async () => {
  resetModuleCache();

  const auditCalls = [];
  require.cache[AUDIT_PATH] = {
    id: AUDIT_PATH,
    filename: AUDIT_PATH,
    loaded: true,
    exports: {
      recordCommandAudit: async (entry) => {
        auditCalls.push(entry);
        return { recorded: true, status: 202 };
      },
    },
  };
  require.cache[DOCTOR_COMMAND_PATH] = {
    id: DOCTOR_COMMAND_PATH,
    filename: DOCTOR_COMMAND_PATH,
    loaded: true,
    exports: {
      main: async () => {
        process.exit(3);
      },
    },
  };

  const { _dispatchWithAudit } = require(INSTALL_PATH);
  const result = await captureExit(() => _dispatchWithAudit('doctor', './commands/doctor.cjs', {
    command: 'doctor',
    profile: 'default',
  }));

  assert.equal(result.exitCode, 3);
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].command, 'doctor');
  assert.equal(auditCalls[0].exit_code, 3);
});

test('204.1 audit-09: dispatch helper audits thrown command failures with exit code 5', async () => {
  resetModuleCache();

  const auditCalls = [];
  require.cache[AUDIT_PATH] = {
    id: AUDIT_PATH,
    filename: AUDIT_PATH,
    loaded: true,
    exports: {
      recordCommandAudit: async (entry) => {
        auditCalls.push(entry);
        return { recorded: true, status: 202 };
      },
    },
  };
  require.cache[DOCTOR_COMMAND_PATH] = {
    id: DOCTOR_COMMAND_PATH,
    filename: DOCTOR_COMMAND_PATH,
    loaded: true,
    exports: {
      main: async () => {
        throw new Error('boom');
      },
    },
  };

  const { _dispatchWithAudit } = require(INSTALL_PATH);

  await assert.rejects(
    () => _dispatchWithAudit('doctor', './commands/doctor.cjs', { command: 'doctor', profile: 'default' }),
    (error) => {
      assert.equal(error.message, 'boom');
      assert.equal(error.exitCode, 5);
      return true;
    }
  );

  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].exit_code, 5);
});
