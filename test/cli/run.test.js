'use strict';

// Phase 204 Plan 06 Task 3 — `markos run` CLI command integration tests.
//
// Tests spawn bin/commands/run.cjs in a child process via a tiny harness
// (test/cli/_fixtures/run-cli-harness.cjs) so the Node test runner's own
// stdout cannot bleed into our capture (Node 22 writes V8-serialized
// subtest metadata to parent process.stdout which invalidates in-process
// capture). The child's stdout/stderr + exit code are observed cleanly.
//
// Cases:
//   run-01 no brief → exit 1
//   run-02 invalid brief → exit 1
//   run-03 no token → exit 3
//   run-04 --no-watch happy → exit 0
//   run-05 --watch success → exit 0
//   run-06 run.completed failed → exit 1
//   run-07 SIGINT mid-stream → exit 0 + hint
//   run-08 401 on create → exit 3
//   run-09 --timeout=1 slow stream → exit 2 timeout
//   run-10 --json one valid JSON per line
//   run-meta file surface grep

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const RUN_PATH = path.resolve(REPO_ROOT, 'bin', 'commands', 'run.cjs');
const HARNESS_PATH = path.resolve(__dirname, '_fixtures', 'run-cli-harness.cjs');

const HAPPY_BRIEF = {
  channel: 'email',
  audience: 'founders',
  pain: 'pipeline velocity',
  promise: 're-fill your pipeline',
  brand: 'markos',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function tmpBriefFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-run-'));
  const file = path.join(dir, 'brief.json');
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
  return file;
}

function runHarness({ cli = {}, briefFile = null, baseUrl = null, apiKey = '', profile = null, triggerSigintMs = null, timeoutMs = 15_000 } = {}) {
  return new Promise((resolve) => {
    const spec = { cli, briefFile, baseUrl, apiKey, profile, triggerSigintMs };
    const proc = spawn(process.execPath, [HARNESS_PATH, JSON.stringify(spec)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

    const killer = setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch {}
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(killer);
      resolve({ exitCode: code, stdout, stderr });
    });
  });
}

// ─── Stub server ───────────────────────────────────────────────────────────

function startStubServer({ postStatus = 201, postBody = null, events = [], slow = 0 } = {}) {
  let lastCancel = null;
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url.endsWith('/cancel')) {
      lastCancel = req.url;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ run_id: 'run_stub', status: 'cancelled', was_terminal: false }));
      return;
    }
    if (req.method === 'POST' && req.url === '/api/tenant/runs') {
      res.writeHead(postStatus, { 'Content-Type': 'application/json' });
      const body = postBody || {
        run_id: 'run_stub',
        status: 'pending',
        tenant_id: 'ten_acme',
        priority: 'P2',
        correlation_id: 'cor_test',
        events_url: '/api/tenant/runs/run_stub/events',
      };
      res.end(JSON.stringify(body));
      return;
    }
    if (req.method === 'GET' && req.url.endsWith('/events')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      let idx = 0;
      const tick = () => {
        if (idx >= events.length) return;
        const e = events[idx++];
        const lines = [];
        if (e.event) lines.push(`event: ${e.event}`);
        if (e.id != null) lines.push(`id: ${e.id}`);
        const payload = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
        for (const l of payload.split('\n')) lines.push(`data: ${l}`);
        try { res.write(lines.join('\n') + '\n\n'); } catch {}
        if (idx < events.length) setTimeout(tick, slow || 10);
        else setTimeout(() => { try { res.end(); } catch {} }, 20);
      };
      setImmediate(tick);
      return;
    }
    res.writeHead(404);
    res.end();
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        port: addr.port,
        url: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((r) => server.close(() => r())),
        get lastCancel() { return lastCancel; },
      });
    });
  });
}

const HEX_TOKEN = 'mks_ak_' + 'a'.repeat(64);

// ─── Tests ─────────────────────────────────────────────────────────────────

test('run-01: no brief → exit 1 (usage)', async () => {
  const r = await runHarness({
    cli: { json: true },
    apiKey: HEX_TOKEN,
    baseUrl: 'http://127.0.0.1:1',
  });
  assert.equal(r.exitCode, 1, `stderr: ${r.stderr}`);
  assert.match(r.stderr, /missing brief|INVALID_ARGS|Usage/i);
});

test('run-02: invalid brief → exit 1', async () => {
  const briefFile = tmpBriefFile({ audience: 'a', pain: 'b', promise: 'c', brand: 'd' });
  const r = await runHarness({
    cli: { json: true },
    briefFile,
    apiKey: HEX_TOKEN,
    baseUrl: 'http://127.0.0.1:1',
  });
  assert.equal(r.exitCode, 1, `stderr: ${r.stderr}`);
  assert.match(r.stderr, /INVALID_BRIEF|channel|missing/i);
});

test('run-03: no token → exit 3', async () => {
  const briefFile = tmpBriefFile(HAPPY_BRIEF);
  // Empty apiKey → getToken falls back to keychain → keytar absent → XDG
  // file path. Use a custom XDG dir with no credentials file.
  const emptyXdg = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-empty-xdg-'));
  const r = await new Promise((resolve) => {
    const spec = {
      cli: { json: true },
      briefFile,
      baseUrl: 'http://127.0.0.1:1',
      apiKey: '',
      profile: 'missing-profile',
    };
    const proc = spawn(process.execPath, [HARNESS_PATH, JSON.stringify(spec)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NO_COLOR: '1',
        XDG_CONFIG_HOME: emptyXdg,
        APPDATA: emptyXdg,
        MARKOS_API_KEY: '',
      },
    });
    let so = ''; let se = '';
    proc.stdout.on('data', (d) => { so += d.toString('utf8'); });
    proc.stderr.on('data', (d) => { se += d.toString('utf8'); });
    proc.on('close', (code) => resolve({ exitCode: code, stdout: so, stderr: se }));
  });
  assert.equal(r.exitCode, 3, `stderr: ${r.stderr}`);
  assert.match(r.stderr, /NO_TOKEN|markos login/i);
});

test('run-04: POST happy + --no-watch prints run_id + exit 0', async () => {
  const stub = await startStubServer({
    postBody: {
      run_id: 'run_nowatch',
      status: 'pending',
      tenant_id: 'ten_acme',
      priority: 'P2',
      correlation_id: 'cor_nowatch',
      events_url: '/api/tenant/runs/run_nowatch/events',
    },
  });
  try {
    const briefFile = tmpBriefFile(HAPPY_BRIEF);
    const r = await runHarness({
      cli: { json: true, watch: false },
      briefFile,
      baseUrl: stub.url,
      apiKey: HEX_TOKEN,
    });
    assert.equal(r.exitCode, 0, `stderr: ${r.stderr}`);
    assert.match(r.stdout, /run_nowatch/);
    assert.match(r.stdout, /"run_id":"run_nowatch"/);
  } finally {
    await stub.close();
  }
});

test('run-05: POST + --watch completes success → exit 0', async () => {
  const stub = await startStubServer({
    events: [
      { event: 'run.snapshot', data: { run_id: 'run_stub', status: 'running' }, id: '1' },
      { event: 'run.step.started', data: { run_id: 'run_stub', step: 1, steps_total: 3 }, id: '2' },
      { event: 'run.step.completed', data: { run_id: 'run_stub', step: 1, steps_total: 3 }, id: '3' },
      { event: 'run.completed', data: { run_id: 'run_stub', status: 'success' }, id: '4' },
    ],
  });
  try {
    const briefFile = tmpBriefFile(HAPPY_BRIEF);
    const r = await runHarness({
      cli: { json: true },
      briefFile,
      baseUrl: stub.url,
      apiKey: HEX_TOKEN,
    });
    assert.equal(r.exitCode, 0, `stdout: ${r.stdout} stderr: ${r.stderr}`);
    assert.match(r.stdout, /run\.completed/);
    assert.match(r.stdout, /"status":"success"/);
  } finally {
    await stub.close();
  }
});

test('run-06: run.completed failed → exit 1', async () => {
  const stub = await startStubServer({
    events: [
      { event: 'run.snapshot', data: { run_id: 'run_stub', status: 'running' }, id: '1' },
      { event: 'run.completed', data: { run_id: 'run_stub', status: 'failed', error: 'boom' }, id: '2' },
    ],
  });
  try {
    const briefFile = tmpBriefFile(HAPPY_BRIEF);
    const r = await runHarness({
      cli: { json: true },
      briefFile,
      baseUrl: stub.url,
      apiKey: HEX_TOKEN,
    });
    assert.equal(r.exitCode, 1, `stderr: ${r.stderr}`);
  } finally {
    await stub.close();
  }
});

test('run-07: SIGINT mid-stream → exit 0 + hint', async () => {
  const stub = await startStubServer({
    events: [
      { event: 'run.snapshot', data: { run_id: 'run_stub', status: 'running' }, id: '1' },
    ],
    slow: 5_000,
  });
  try {
    const briefFile = tmpBriefFile(HAPPY_BRIEF);
    const r = await runHarness({
      cli: { json: true, timeout: 30 },
      briefFile,
      baseUrl: stub.url,
      apiKey: HEX_TOKEN,
      triggerSigintMs: 400,
      timeoutMs: 8_000,
    });
    assert.equal(r.exitCode, 0, `exitCode expected 0, got ${r.exitCode}; stderr: ${r.stderr}`);
    assert.match(r.stderr, /Run still executing/);
  } finally {
    await stub.close();
  }
});

test('run-08: 401 on create → exit 3', async () => {
  const stub = await startStubServer({ postStatus: 401, postBody: { error: 'invalid_token' } });
  try {
    const briefFile = tmpBriefFile(HAPPY_BRIEF);
    const r = await runHarness({
      cli: { json: true, watch: false },
      briefFile,
      baseUrl: stub.url,
      apiKey: HEX_TOKEN,
    });
    assert.equal(r.exitCode, 3, `stderr: ${r.stderr}`);
    assert.match(r.stderr, /UNAUTHORIZED|markos login/i);
  } finally {
    await stub.close();
  }
});

test('run-09: --timeout=1 with slow stream → exit 2 timeout', async () => {
  const stub = await startStubServer({
    events: [
      { event: 'run.snapshot', data: { run_id: 'run_stub', status: 'running' }, id: '1' },
    ],
    slow: 60_000,
  });
  try {
    const briefFile = tmpBriefFile(HAPPY_BRIEF);
    const r = await runHarness({
      cli: { json: true, timeout: 1 },
      briefFile,
      baseUrl: stub.url,
      apiKey: HEX_TOKEN,
      timeoutMs: 10_000,
    });
    assert.equal(r.exitCode, 2, `stderr: ${r.stderr}`);
    assert.match(r.stderr, /TIMEOUT|did not complete/i);
  } finally {
    await stub.close();
  }
});

test('run-10: --json emits valid JSON per event line', async () => {
  const stub = await startStubServer({
    events: [
      { event: 'run.snapshot', data: { run_id: 'run_stub', status: 'running' }, id: '1' },
      { event: 'run.step.started', data: { run_id: 'run_stub', step: 1, steps_total: 3 }, id: '2' },
      { event: 'run.completed', data: { run_id: 'run_stub', status: 'success' }, id: '3' },
    ],
  });
  try {
    const briefFile = tmpBriefFile(HAPPY_BRIEF);
    const r = await runHarness({
      cli: { json: true },
      briefFile,
      baseUrl: stub.url,
      apiKey: HEX_TOKEN,
    });
    assert.equal(r.exitCode, 0, `stderr: ${r.stderr}`);
    const lines = r.stdout.trim().split(/\r?\n+/).filter(Boolean);
    assert.ok(lines.length >= 1, `stdout empty: ${JSON.stringify(r.stdout)}`);
    for (const line of lines) {
      assert.doesNotThrow(() => JSON.parse(line), `line not valid JSON: ${line}`);
    }
    const parsed = lines.map((l) => JSON.parse(l));
    assert.ok(parsed.some((p) => p.event === 'run.completed'));
  } finally {
    await stub.close();
  }
});

test('run-meta: run.cjs surface is non-stub and wires shared primitives', () => {
  const src = fs.readFileSync(RUN_PATH, 'utf8');
  assert.ok(!/not yet implemented/.test(src), 'stub placeholder removed');
  assert.match(src, /streamSSE/);
  assert.match(src, /SIGINT/);
  assert.match(src, /AbortController/);
  assert.match(src, /Run still executing/);
  assert.match(src, /cli\.watch|--watch|--no-watch/);
  assert.match(src, /cli\.timeout|--timeout/);
});
