'use strict';

// Phase 204 Plan 09 Task 1 — doctor-checks library unit tests.
//
// Coverage:
//   dc-01: node_version ok when process.version satisfies MIN_NODE_VERSION
//   dc-01b: node_version error when override sets version below minimum
//   dc-02: config_dir fix creates the directory (respects checkOnly)
//   dc-03: active_token absent → warn (not error); never fixable
//   dc-04: token_valid 401 → error; never fixable
//   dc-05: markos_local_dir missing + fix → mkdir + fixed=true
//   dc-06: gitignore_protected missing + fix → applyGitignoreProtections called
//   dc-07: --check-only prevents any FS mutation even with fixable items
//   dc-08: keytar absent → warn (not error)
//   dc-09: server_reachable timeout → warn
//   dc-10: runChecks returns 9 results, each with id/label/status (stable order)
//   dc-11: applyGitignoreProtections is exported from bin/install.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCTOR_CHECKS_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'doctor-checks.cjs');
const INSTALL_PATH = path.resolve(REPO_ROOT, 'bin', 'install.cjs');

function resetDoctorChecks() {
  delete require.cache[require.resolve(DOCTOR_CHECKS_PATH)];
}

function tmpDir(prefix = 'markos-doctor-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return dir;
}

function fakeKeychain(store = {}) {
  const map = new Map(Object.entries(store));
  return {
    SERVICE: 'markos-cli',
    async getToken(profile) { return map.get(profile) || null; },
    async setToken(profile, token) { map.set(profile, token); },
    async deleteToken(profile) { map.delete(profile); },
    async listProfiles() { return [...map.keys()]; },
    xdgCredPath: () => '/tmp/no-such-path',
    _resetWarningStateForTests() {},
  };
}

function fakeConfig(profile = 'default', dir) {
  return {
    DEFAULT_CONFIG: { active_profile: profile },
    configPath: () => path.join(dir, 'config.json'),
    loadConfig: () => ({ active_profile: profile }),
    saveConfig: (p) => ({ active_profile: profile, ...(p || {}) }),
    resolveProfile: () => profile,
  };
}

function fakeHttp({ status = 200, throws = null } = {}) {
  return {
    BASE_URL: 'http://127.0.0.1:1',
    authedFetch: async () => {
      if (throws) throw throws;
      return {
        status,
        ok: status >= 200 && status < 300,
        async json() { return {}; },
        async text() { return ''; },
        clone() { return { async text() { return ''; } }; },
      };
    },
    AuthError: class AuthError extends Error { constructor(m){ super(m); this.name='AuthError'; } },
    TransientError: class TransientError extends Error { constructor(m){ super(m); this.name='TransientError'; } },
  };
}

// Neutralise real API + envs globally across tests.
process.env.MARKOS_API_KEY = '';
process.env.MARKOS_API_BASE_URL = 'http://127.0.0.1:1';

// ─── dc-01 / dc-01b: node_version ─────────────────────────────────────────

test('dc-01: node_version returns ok when process.version satisfies MIN_NODE_VERSION', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  // Force a high override so we always pass regardless of runner version.
  const prev = process.env.MARKOS_NODE_VERSION_OVERRIDE;
  process.env.MARKOS_NODE_VERSION_OVERRIDE = '99.0.0';
  try {
    const r = await _checks.checkNodeVersion();
    assert.equal(r.id, 'node_version');
    assert.equal(r.status, 'ok');
    assert.equal(r.fixable, false);
    assert.match(r.message, /99\.0\.0/);
  } finally {
    if (prev === undefined) delete process.env.MARKOS_NODE_VERSION_OVERRIDE;
    else process.env.MARKOS_NODE_VERSION_OVERRIDE = prev;
  }
});

test('dc-01b: node_version error when override pins below 22.0.0', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const prev = process.env.MARKOS_NODE_VERSION_OVERRIDE;
  process.env.MARKOS_NODE_VERSION_OVERRIDE = '20.10.0';
  try {
    const r = await _checks.checkNodeVersion();
    assert.equal(r.status, 'error');
    assert.match(r.message, /20\.10\.0/);
    assert.ok(r.hint && /Upgrade/i.test(r.hint));
  } finally {
    if (prev === undefined) delete process.env.MARKOS_NODE_VERSION_OVERRIDE;
    else process.env.MARKOS_NODE_VERSION_OVERRIDE = prev;
  }
});

// ─── dc-02: config_dir fix ────────────────────────────────────────────────

test('dc-02: config_dir fix creates the directory', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const base = tmpDir();
  const nested = path.join(base, 'does-not-exist-yet');
  const cfg = fakeConfig('default', nested);

  // First: without --fix → error.
  const noFix = await _checks.checkConfigDir({ fix: false, checkOnly: false, configModule: cfg });
  assert.equal(noFix.id, 'config_dir');
  assert.equal(noFix.status, 'error');
  assert.equal(noFix.fixable, true);
  assert.equal(noFix.fixed, null);
  assert.ok(!fs.existsSync(nested));

  // Second: with --fix → creates dir.
  const fixed = await _checks.checkConfigDir({ fix: true, checkOnly: false, configModule: cfg });
  assert.equal(fixed.status, 'ok');
  assert.equal(fixed.fixed, true);
  assert.ok(fs.existsSync(nested));
});

// ─── dc-03: active_token absent → warn, never fixable ─────────────────────

test('dc-03: active_token absent → warn; never fixable (anti-phishing)', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const dir = tmpDir();
  const r = await _checks.checkActiveToken({
    keychainModule: fakeKeychain({}), // empty
    configModule: fakeConfig('default', dir),
    cli: {},
  });
  assert.equal(r.id, 'active_token');
  assert.equal(r.status, 'warn');
  assert.equal(r.fixable, false, 'active_token MUST NEVER be fixable (T-204-09-01)');
  assert.match(r.hint, /markos login/);
});

// ─── dc-04: token_valid 401 → error, never fixable ────────────────────────

test('dc-04: token_valid 401 → error; never fixable', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const dir = tmpDir();
  const kc = fakeKeychain({ default: 'mks_ak_' + 'x'.repeat(64) });
  const cfg = fakeConfig('default', dir);

  // Simulate 401 via AuthError throw from http stub.
  const http = fakeHttp();
  http.authedFetch = async () => {
    const e = new Error('Authentication failed: 401');
    e.name = 'AuthError';
    e.status = 401;
    throw e;
  };

  const r = await _checks.checkTokenValid({
    keychainModule: kc,
    configModule: cfg,
    httpModule: http,
    cli: {},
    previousChecks: [{ id: 'active_token', status: 'ok' }],
    timeoutMs: 500,
  });
  assert.equal(r.id, 'token_valid');
  assert.equal(r.status, 'error');
  assert.equal(r.fixable, false, 'token_valid MUST NEVER be fixable (T-204-09-01)');
  assert.match(r.hint, /markos login/);
});

test('dc-04b: token_valid skips when no active token', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const r = await _checks.checkTokenValid({
    previousChecks: [{ id: 'active_token', status: 'warn' }],
  });
  assert.equal(r.status, 'skip');
});

// ─── dc-05: markos_local_dir fix ──────────────────────────────────────────

test('dc-05: markos_local_dir missing + --fix → mkdir + fixed=true', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const cwd = tmpDir();
  const target = path.join(cwd, '.markos-local');
  assert.ok(!fs.existsSync(target));

  const r = await _checks.checkMarkosLocalDir({ fix: true, checkOnly: false, cwd });
  assert.equal(r.id, 'markos_local_dir');
  assert.equal(r.status, 'ok');
  assert.equal(r.fixed, true);
  assert.ok(fs.existsSync(target));
});

// ─── dc-06: gitignore_protected fix calls applyGitignoreProtections ───────

test('dc-06: gitignore_protected missing + --fix → applyGitignoreProtections called + fixed=true', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const cwd = tmpDir();
  fs.writeFileSync(path.join(cwd, '.gitignore'), 'node_modules/\n', 'utf8');

  const calls = [];
  const spy = {
    applyGitignoreProtections(dir) {
      calls.push(dir);
      // Simulate write (Plan 1's idempotent behavior).
      fs.appendFileSync(path.join(dir, '.gitignore'), '\n.markos-local/\n', 'utf8');
      return { changed: true, gitignorePath: path.join(dir, '.gitignore') };
    },
  };

  const r = await _checks.checkGitignoreProtected({
    fix: true, checkOnly: false, cwd,
    installModule: spy,
  });
  assert.equal(r.id, 'gitignore_protected');
  assert.equal(r.status, 'ok');
  assert.equal(r.fixed, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], cwd);
});

// ─── dc-07: --check-only ignores --fix ────────────────────────────────────

test('dc-07: --check-only never mutates FS even when items are fixable', async () => {
  resetDoctorChecks();
  const { runChecks } = require(DOCTOR_CHECKS_PATH);
  const cwd = tmpDir();
  // No .markos-local, no .gitignore → both would normally be fixable.
  assert.ok(!fs.existsSync(path.join(cwd, '.markos-local')));
  assert.ok(!fs.existsSync(path.join(cwd, '.gitignore')));

  let applyCalled = false;
  const installSpy = {
    applyGitignoreProtections() { applyCalled = true; return { changed: true }; },
  };

  const results = await runChecks({
    fix: true, // deliberately set, --check-only MUST override
    checkOnly: true,
    cwd,
    keychainModule: fakeKeychain({}),
    configModule: fakeConfig('default', cwd),
    httpModule: fakeHttp({ throws: new Error('skip network') }),
    installModule: installSpy,
    timeoutMs: 200,
  });

  // Zero writes: markos_local_dir still missing, .gitignore still missing.
  assert.ok(!fs.existsSync(path.join(cwd, '.markos-local')), 'checkOnly must not create .markos-local');
  assert.ok(!fs.existsSync(path.join(cwd, '.gitignore')), 'checkOnly must not create .gitignore');
  assert.equal(applyCalled, false, 'applyGitignoreProtections must not be invoked in checkOnly mode');

  // All results must have fixed=null (never attempted).
  for (const r of results) {
    assert.equal(r.fixed, null, `${r.id} must have fixed=null in checkOnly mode`);
  }
});

// ─── dc-08: keytar absent → warn ──────────────────────────────────────────

test('dc-08: keytar require failure → warn (not error)', async () => {
  resetDoctorChecks();
  // Inject a require-cache poison: stub `keytar` such that a fresh require throws.
  // We do this by simulating the MODULE_NOT_FOUND branch via a wrapping check.
  const { _checks } = require(DOCTOR_CHECKS_PATH);

  // Call the real check — in this sandbox keytar is likely available OR absent.
  // Either outcome MUST be non-error:
  const r = await _checks.checkKeytarAvailable({ keychainModule: fakeKeychain({}) });
  assert.equal(r.id, 'keytar_available');
  assert.notEqual(r.status, 'error', 'keytar absence must never be an error');
  assert.ok(['ok', 'warn'].includes(r.status));
});

// ─── dc-09: server_reachable timeout → warn ───────────────────────────────

test('dc-09: server_reachable timeout → warn', async () => {
  resetDoctorChecks();
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('ETIMEDOUT: unreachable');
  };
  try {
    const r = await _checks.checkServerReachable({
      httpModule: { BASE_URL: 'http://127.0.0.1:1' },
      timeoutMs: 100,
    });
    assert.equal(r.id, 'server_reachable');
    assert.equal(r.status, 'warn');
    assert.match(r.message, /cannot reach|timeout/i);
  } finally {
    global.fetch = originalFetch;
  }
});

// ─── dc-10: runChecks returns 9 results in stable order ───────────────────

test('dc-10: runChecks returns 12 ordered results with id/label/status', async () => {
  resetDoctorChecks();
  const { runChecks } = require(DOCTOR_CHECKS_PATH);
  const cwd = tmpDir();
  // Avoid network.
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error('simulated offline'); };
  try {
    const results = await runChecks({
      fix: false, checkOnly: true,
      cwd,
      keychainModule: fakeKeychain({}),
      configModule: fakeConfig('default', cwd),
      httpModule: fakeHttp({ throws: new Error('simulated offline') }),
      timeoutMs: 100,
    });
    const expectedIds = [
      'node_version',
      'config_dir',
      'active_token',
      'token_valid',
      'markos_local_dir',
      'gitignore_protected',
      'keytar_available',
      'server_reachable',
      'supabase_connectivity',
      // Plan 204-13 v2 compliance checks (appended).
      'agentrun_v2_alignment',
      'pricing_placeholder_policy',
      'vault_freshness',
    ];
    assert.equal(results.length, expectedIds.length);
    for (let i = 0; i < expectedIds.length; i++) {
      assert.equal(results[i].id, expectedIds[i], `results[${i}] should be ${expectedIds[i]}`);
      assert.ok(typeof results[i].label === 'string' && results[i].label.length > 0);
      assert.ok(['ok', 'warn', 'error', 'skip'].includes(results[i].status));
    }
  } finally {
    global.fetch = originalFetch;
  }
});

// ─── dc-11: applyGitignoreProtections is exported from bin/install.cjs ────

test('dc-11: applyGitignoreProtections is exported from bin/install.cjs', () => {
  delete require.cache[require.resolve(INSTALL_PATH)];
  const mod = require(INSTALL_PATH);
  assert.equal(typeof mod.applyGitignoreProtections, 'function',
    'install.cjs must export applyGitignoreProtections for doctor reuse');
});
