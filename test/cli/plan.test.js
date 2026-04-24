'use strict';

// Phase 204 Plan 05 Task 2 — `markos plan` CLI integration tests.
//
// Covers:
//   p-01: missing brief path → exit 1 (usage error surfaced as USER_ERROR)
//   p-02: invalid brief (missing required field) → exit 1 'invalid_brief'
//   p-03: happy path → authedFetch called with normalized brief → exits 0
//   p-04: non-TTY JSON output contains 'steps' array + 'estimated_cost_usd'
//   p-05: 401 response → exit 3
//   p-meta: plan.cjs is not a stub + wires through shared primitives

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PLAN_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'plan.cjs');
const KEYCHAIN_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'keychain.cjs');

// ─── Harness ──────────────────────────────────────────────────────────────

function resetModuleCache() {
  for (const p of [PLAN_PATH, KEYCHAIN_PATH]) {
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

function tmpBriefFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-plan-'));
  const file = path.join(dir, 'brief.yaml');
  fs.writeFileSync(file, content);
  return file;
}

const HAPPY_BRIEF = [
  'channel: email',
  'audience: founders',
  'pain: pipeline velocity',
  'promise: re-fill your pipeline in 30 days',
  'brand: markos',
].join('\n');

const HAPPY_ENVELOPE = {
  run_id: null,
  plan_id: 'plan_abc1234567890000',
  steps: [
    { name: 'audit', inputs: ['brief'], estimated_tokens: 200 },
    { name: 'draft', inputs: ['brief', 'audit'], estimated_tokens: 1500 },
    { name: 'score', inputs: ['draft', 'brief'], estimated_tokens: 300 },
  ],
  estimated_tokens: 2000,
  estimated_cost_usd: 0.006,
  estimated_cost_usd_micro: 6000,
  estimated_duration_ms: 3500,
  tenant_id: 'ten_acme',
  priority: 'P2',
  chain_id: null,
  model: null,
};

process.env.MARKOS_API_KEY = '';
process.env.MARKOS_API_BASE_URL = 'http://127.0.0.1:1';

// ─── Tests ─────────────────────────────────────────────────────────────────

test('p-01: missing brief path → exit 1 (user error)', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'a'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  try {
    const { main } = require(PLAN_PATH);
    const r = await runCli(() => main({ cli: { json: true } }));
    assert.equal(r.exitCode, 1, 'missing brief should exit 1');
    assert.match(r.stderr, /brief|usage/i);
    assert.equal(mock.calls.length, 0, 'no network call when brief is missing');
  } finally {
    mock.restore();
  }
});

test('p-02: invalid brief (missing required field) → exit 1 invalid_brief', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'b'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 500, body: {} }));
  // Missing `promise` + `brand`.
  const briefFile = tmpBriefFile('channel: email\naudience: x\npain: y');
  try {
    const { main } = require(PLAN_PATH);
    const r = await runCli(() => main({ cli: { json: true, positional: [briefFile] } }));
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /INVALID_BRIEF|missing|promise|brand/i);
    assert.equal(mock.calls.length, 0, 'no network call on invalid brief');
  } finally {
    mock.restore();
  }
});

test('p-03: happy brief → authedFetch called with normalized brief → exits 0', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'c'.repeat(64) });
  const mock = installFetchMock(async ({ method, url }) => {
    assert.equal(method, 'POST');
    assert.match(url, /\/api\/tenant\/runs\/plan\b/);
    return { status: 200, body: HAPPY_ENVELOPE };
  });
  const briefFile = tmpBriefFile(HAPPY_BRIEF);
  try {
    const { main } = require(PLAN_PATH);
    const r = await runCli(() => main({ cli: { json: true, positional: [briefFile] } }));
    assert.equal(r.exitCode, 0);
    assert.equal(mock.calls.length, 1);
    // Body must be a JSON-encoded { brief: {...} } envelope with channel=email.
    const body = JSON.parse(mock.calls[0].body);
    assert.ok(body.brief, 'request body must contain a brief wrapper');
    assert.equal(body.brief.channel, 'email');
    assert.equal(body.brief.brand, 'markos');
    assert.match(mock.calls[0].headers.Authorization || '', /^Bearer mks_ak_/);
  } finally {
    mock.restore();
  }
});

test('p-04: non-TTY JSON output contains steps array + estimated_cost_usd', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'd'.repeat(64) });
  const mock = installFetchMock(async () => ({ status: 200, body: HAPPY_ENVELOPE }));
  const briefFile = tmpBriefFile(HAPPY_BRIEF);
  try {
    const { main } = require(PLAN_PATH);
    const r = await runCli(() => main({ cli: { json: true, positional: [briefFile] } }));
    assert.equal(r.exitCode, 0);
    const parsed = JSON.parse(r.stdout.trim());
    assert.ok(Array.isArray(parsed.steps), 'response must have steps array');
    assert.equal(parsed.steps.length, 3);
    assert.ok(Number.isFinite(parsed.estimated_cost_usd), 'estimated_cost_usd must be numeric');
    assert.ok(Number.isFinite(parsed.estimated_tokens), 'estimated_tokens must be numeric');
    assert.equal(parsed.run_id, null, 'run_id must be null (dry-run)');
  } finally {
    mock.restore();
  }
});

test('p-05: 401 response → exit 3', async () => {
  resetModuleCache();
  installKeychainSpy({ default: 'mks_ak_' + 'e'.repeat(64) });
  const mock = installFetchMock(async () => ({
    status: 401,
    body: { error: 'invalid_token' },
  }));
  const briefFile = tmpBriefFile(HAPPY_BRIEF);
  try {
    const { main } = require(PLAN_PATH);
    const r = await runCli(() => main({ cli: { json: true, positional: [briefFile], retries: 0 } }));
    assert.equal(r.exitCode, 3, '401 must map to AUTH_FAILURE exit code');
    assert.match(r.stderr, /markos login|UNAUTHORIZED|expired/i);
  } finally {
    mock.restore();
  }
});

test('p-meta: bin/commands/plan.cjs is not a stub + wires to shared primitives', () => {
  const text = fs.readFileSync(PLAN_PATH, 'utf8');
  assert.ok(!text.includes('not yet implemented'), 'stub message must be gone');
  assert.ok(/parseBrief|validateBrief/.test(text), 'plan.cjs must require parseBrief/validateBrief');
  assert.ok(/\/api\/tenant\/runs\/plan/.test(text), 'plan.cjs must hit /api/tenant/runs/plan');
  assert.ok(/authedFetch/.test(text), 'plan.cjs must use authedFetch');
  assert.ok(/require\(['"]\.\.\/lib\/cli\/http\.cjs['"]\)/.test(text), 'plan.cjs must require http primitive');
  assert.ok(/require\(['"]\.\.\/lib\/cli\/keychain\.cjs['"]\)/.test(text), 'plan.cjs must require keychain primitive');
  assert.ok(/require\(['"]\.\.\/lib\/cli\/output\.cjs['"]\)/.test(text), 'plan.cjs must require output primitive');
  assert.ok(!/mks_ak_/.test(text), 'plan.cjs must not contain any mks_ak_ substring');
});
