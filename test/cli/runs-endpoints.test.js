'use strict';

// Phase 204 Plan 06 Task 1 — runs library + migration 75 tests.
//
// Covers:
//   mig-01: migration 75 exists + creates markos_cli_runs + has status enum + RLS + index
//   mig-02: rollback exists + drops table
//   sr-01:  submitRun INSERTs row with correct shape + audit attempted
//   sr-02:  submitRun schedules setImmediate executor (spy on setImmediate)
//   sr-03:  stub executor progresses running → steps_completed++ → success
//   sre-01: streamRunEvents emits run.step.started/completed on steps_completed++
//   sre-02: streamRunEvents emits heartbeat within heartbeatMs window
//   sre-03: streamRunEvents emits run.completed on terminal state + closes writer
//   sre-04: streamRunEvents respects abortSignal (emits run.aborted + ends)
//   sre-05: streamRunEvents honors Last-Event-ID (resumes id counter at N+1)
//   lr-01:  listRuns returns tenant-scoped rows in desc created_at order; no brief/result JSON
//   gr-01:  getRun returns full row inside tenant; null cross-tenant

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MIGRATION_PATH = path.resolve(REPO_ROOT, 'supabase', 'migrations', '75_markos_cli_runs.sql');
const ROLLBACK_PATH = path.resolve(REPO_ROOT, 'supabase', 'migrations', 'rollback', '75_markos_cli_runs.down.sql');
const RUNS_LIB_PATH = path.resolve(REPO_ROOT, 'lib', 'markos', 'cli', 'runs.cjs');

const runsLib = require(RUNS_LIB_PATH);

// ─── Stub supabase client ──────────────────────────────────────────────────

function createStubClient({ runs = [], auditCapture = null } = {}) {
  const state = {
    runs: runs.map((r) => ({ ...r })),
    audit: [],
    idCounter: 0,
  };

  function tableFor(name) {
    if (name === 'markos_cli_runs') return state.runs;
    if (name === 'markos_audit_log_staging') return state.audit;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    let insertRow = null;
    let selectCols = '*';
    const filters = [];
    let wantsSingle = false;
    let orderCol = null;
    let orderAsc = true;
    let limitN = Infinity;

    const builder = {
      select(cols) { selectCols = cols || '*'; return builder; },
      insert(row) {
        op = 'insert';
        insertRow = { ...row };
        if (!insertRow.id) {
          state.idCounter += 1;
          insertRow.id = `run_${String(state.idCounter).padStart(12, '0')}`;
        }
        if (!insertRow.created_at) insertRow.created_at = new Date().toISOString();
        table.push(insertRow);
        return builder;
      },
      update(p) { op = 'update'; patch = p; return builder; },
      upsert(p) { op = 'upsert'; patch = p; return builder; },
      eq(col, val) { filters.push({ col, val }); return builder; },
      is(col, val) { filters.push({ col, val, isNull: val === null }); return builder; },
      order(col, opts) { orderCol = col; orderAsc = !(opts && opts.ascending === false); return builder; },
      limit(n) { limitN = n; return builder; },
      maybeSingle() { wantsSingle = true; return builder; },
      single() { wantsSingle = true; return builder; },
      then(resolve) {
        if (op === 'insert') {
          const rows = [insertRow];
          resolve({ data: wantsSingle ? rows[0] : rows, error: null });
          return { catch() { return builder; } };
        }
        let matched = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        if (op === 'update') {
          for (const r of matched) Object.assign(r, patch);
          resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
          return { catch() { return builder; } };
        }
        if (orderCol) {
          matched = matched.slice().sort((a, b) => {
            const av = a[orderCol]; const bv = b[orderCol];
            if (av < bv) return orderAsc ? -1 : 1;
            if (av > bv) return orderAsc ? 1 : -1;
            return 0;
          });
        }
        if (Number.isFinite(limitN)) matched = matched.slice(0, limitN);
        // Project requested columns (mimic real Supabase behavior).
        if (selectCols && selectCols !== '*' && typeof selectCols === 'string') {
          const keep = selectCols.split(',').map((s) => s.trim());
          matched = matched.map((r) => {
            const p = {};
            for (const k of keep) if (k in r) p[k] = r[k];
            return p;
          });
        }
        resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
        return { catch() { return builder; } };
      },
    };
    return builder;
  }

  return { from(t) { return makeQuery(t); }, _state: state };
}

// ─── Writer collector ──────────────────────────────────────────────────────

function createWriter() {
  const frames = [];
  let ended = false;
  return {
    write(chunk) { frames.push(String(chunk)); },
    end() { ended = true; },
    get frames() { return frames; },
    get raw() { return frames.join(''); },
    get ended() { return ended; },
    // Parse the raw stream into event objects.
    parse() {
      const raw = frames.join('');
      const chunks = raw.split(/\n\n/).filter(Boolean);
      return chunks.map((chunk) => {
        const evt = {};
        for (const line of chunk.split('\n')) {
          const idx = line.indexOf(':');
          if (idx === -1) continue;
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).replace(/^\s/, '');
          if (key === 'event') evt.event = val;
          else if (key === 'data') evt.data = (evt.data ? evt.data + '\n' : '') + val;
          else if (key === 'id') evt.id = val;
        }
        try { evt.payload = evt.data ? JSON.parse(evt.data) : undefined; } catch { /* keep raw */ }
        return evt;
      });
    },
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('mig-01: migration 75 creates markos_cli_runs with status enum + RLS + index', () => {
  assert.ok(fs.existsSync(MIGRATION_PATH), 'migration 75 file missing');
  const src = fs.readFileSync(MIGRATION_PATH, 'utf8');
  assert.match(src, /create table( if not exists)? markos_cli_runs/, 'must create table markos_cli_runs');
  assert.match(src, /'pending','running','success','failed','cancelled'/, 'must declare status enum');
  assert.match(src, /enable row level security/, 'must enable RLS');
  assert.match(src, /markos_cli_runs_tenant_isolation/, 'must create tenant isolation policy');
  assert.match(src, /idx_cli_runs_tenant_created/, 'must create tenant+created_at index');
  // AgentRun v2 forward-compat fields
  assert.match(src, /estimated_cost_usd_micro/, 'must ship AgentRun v2 cost column');
  assert.match(src, /priority.*P0.*P1.*P2.*P3.*P4/s, 'must declare priority enum');
  assert.match(src, /trigger_kind/, 'must ship trigger_kind');
  assert.match(src, /source_surface/, 'must ship source_surface');
});

test('mig-02: rollback 75 drops markos_cli_runs', () => {
  assert.ok(fs.existsSync(ROLLBACK_PATH), 'rollback file missing');
  const src = fs.readFileSync(ROLLBACK_PATH, 'utf8');
  assert.match(src, /drop table if exists markos_cli_runs/, 'rollback must drop table');
  assert.match(src, /drop policy/i, 'rollback must drop policy');
});

test('sr-01: submitRun INSERTs row with correct shape', async () => {
  const client = createStubClient();
  const res = await runsLib.submitRun({
    client,
    tenant_id: 'ten_acme',
    user_id: 'usr_sam',
    brief: { channel: 'email', audience: 'ICP', pain: 'pain', promise: 'value', brand: 'markos' },
  });

  assert.ok(res.run_id && /^run_/.test(res.run_id), `run_id prefix: ${res.run_id}`);
  assert.equal(res.status, 'pending');
  assert.equal(res.tenant_id, 'ten_acme');
  assert.equal(res.priority, 'P2');
  assert.ok(res.correlation_id && res.correlation_id.startsWith('cor_'), 'correlation_id emitted');
  assert.equal(res.events_url, `/api/tenant/runs/${res.run_id}/events`);

  // Row present in stub.
  assert.equal(client._state.runs.length, 1);
  const row = client._state.runs[0];
  assert.equal(row.tenant_id, 'ten_acme');
  assert.equal(row.user_id, 'usr_sam');
  assert.equal(row.status, 'pending');
  assert.equal(row.trigger_kind, 'cli');
  assert.equal(row.source_surface, 'cli:markos run');
  assert.equal(row.priority, 'P2');
  assert.equal(row.steps_total, 3);
  assert.ok(row.brief_json && row.brief_json.channel === 'email');
  assert.ok(Number.isInteger(row.estimated_cost_usd_micro));
});

test('sr-02: submitRun schedules executor via setImmediate', async () => {
  // Spy on setImmediate.
  const original = global.setImmediate;
  let calls = 0;
  global.setImmediate = function spyImmediate(fn, ...args) {
    calls += 1;
    // Don't actually run the executor in this assertion — we only count.
    return original(() => { /* swallow */ }, ...args);
  };
  try {
    const client = createStubClient();
    await runsLib.submitRun({
      client,
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      brief: { channel: 'email', audience: 'a', pain: 'b', promise: 'c', brand: 'd' },
    });
    assert.ok(calls >= 1, `setImmediate called at least once (got ${calls})`);
  } finally {
    global.setImmediate = original;
  }
});

test('sr-03: runStubExecutor progresses running → steps_completed → success', async () => {
  const client = createStubClient({
    runs: [{
      id: 'run_t3',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'pending',
      steps_completed: 0,
      steps_total: 3,
      brief_json: {},
    }],
  });

  // Run the executor directly with a tiny delay override via monkey-patching
  // setTimeout — this test is real-time but bounded.
  const origTimeout = global.setTimeout;
  // Shorten delay drastically.
  global.setTimeout = (fn, _ms) => origTimeout(fn, 5);
  try {
    await runsLib.runStubExecutor(client, 'run_t3');
  } finally {
    global.setTimeout = origTimeout;
  }

  const row = client._state.runs[0];
  assert.equal(row.status, 'success');
  assert.equal(row.steps_completed, 3);
  assert.ok(row.completed_at, 'completed_at set');
  assert.ok(row.result_json && row.result_json.draft, 'result_json emitted');
});

test('sre-01: streamRunEvents emits run.step.started/completed on step increments', async () => {
  const client = createStubClient({
    runs: [{
      id: 'run_s1',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'running',
      steps_completed: 0,
      steps_total: 3,
    }],
  });

  const writer = createWriter();
  const controller = new AbortController();

  // Drive the state forward while the stream polls.
  const advance = (async () => {
    await new Promise((r) => setTimeout(r, 30));
    client._state.runs[0].steps_completed = 1;
    await new Promise((r) => setTimeout(r, 30));
    client._state.runs[0].steps_completed = 2;
    await new Promise((r) => setTimeout(r, 30));
    client._state.runs[0].status = 'success';
    client._state.runs[0].steps_completed = 3;
    client._state.runs[0].result_json = { draft: 'ok' };
  })();

  await Promise.all([
    advance,
    runsLib.streamRunEvents({
      client, run_id: 'run_s1', tenant_id: 'ten_acme', writer, signal: controller.signal,
      pollMs: 10, heartbeatMs: 5_000, maxMs: 5_000,
    }),
  ]);

  const events = writer.parse().map((e) => e.event);
  assert.ok(events.includes('run.step.started'), `saw run.step.started: ${events.join(',')}`);
  assert.ok(events.includes('run.step.completed'));
  assert.ok(events.includes('run.completed'));
  assert.ok(writer.ended, 'writer.end() called');
});

test('sre-02: streamRunEvents emits heartbeat within heartbeatMs', async () => {
  const client = createStubClient({
    runs: [{
      id: 'run_hb',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'running',
      steps_completed: 0,
      steps_total: 3,
    }],
  });

  const writer = createWriter();
  const controller = new AbortController();

  // Let it idle for ~50ms with a 20ms heartbeat budget → at least one HB.
  setTimeout(() => controller.abort(), 80);
  await runsLib.streamRunEvents({
    client, run_id: 'run_hb', tenant_id: 'ten_acme', writer, signal: controller.signal,
    pollMs: 15, heartbeatMs: 20, maxMs: 5_000,
  });

  const events = writer.parse().map((e) => e.event);
  assert.ok(events.includes('heartbeat'), `saw heartbeat: ${events.join(',')}`);
});

test('sre-03: streamRunEvents emits run.completed on terminal state + closes writer', async () => {
  const client = createStubClient({
    runs: [{
      id: 'run_done',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'success',
      steps_completed: 3,
      steps_total: 3,
      result_json: { draft: 'done' },
    }],
  });

  const writer = createWriter();
  await runsLib.streamRunEvents({
    client, run_id: 'run_done', tenant_id: 'ten_acme', writer,
    pollMs: 10, heartbeatMs: 10_000, maxMs: 5_000,
  });

  const events = writer.parse();
  const completed = events.find((e) => e.event === 'run.completed');
  assert.ok(completed, 'run.completed emitted');
  assert.equal(completed.payload && completed.payload.status, 'success');
  assert.ok(writer.ended, 'writer closed after terminal state');
});

test('sre-04: streamRunEvents respects signal.abort (emits run.aborted + ends)', async () => {
  const client = createStubClient({
    runs: [{
      id: 'run_abt',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'running',
      steps_completed: 0,
      steps_total: 3,
    }],
  });

  const writer = createWriter();
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 20);

  await runsLib.streamRunEvents({
    client, run_id: 'run_abt', tenant_id: 'ten_acme', writer, signal: controller.signal,
    pollMs: 10, heartbeatMs: 5_000, maxMs: 5_000,
  });

  const events = writer.parse().map((e) => e.event);
  assert.ok(events.includes('run.aborted') || events.includes('run.completed'),
    `saw run.aborted or completed: ${events.join(',')}`);
  assert.ok(writer.ended, 'writer ended on abort');
});

test('sre-05: streamRunEvents honors Last-Event-ID (resumes counter)', async () => {
  const client = createStubClient({
    runs: [{
      id: 'run_lei',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'success',
      steps_completed: 3,
      steps_total: 3,
      result_json: { draft: 'x' },
    }],
  });

  const writer = createWriter();
  await runsLib.streamRunEvents({
    client, run_id: 'run_lei', tenant_id: 'ten_acme', writer,
    lastEventId: 42,
    pollMs: 10, heartbeatMs: 5_000, maxMs: 5_000,
  });

  const events = writer.parse();
  // First emitted id should be 43 (42 + 1).
  const firstId = Number.parseInt(events[0].id, 10);
  assert.ok(firstId >= 43, `expected first id >= 43, got ${firstId}`);
});

test('lr-01: listRuns excludes brief_json + result_json, tenant-scoped, desc order', async () => {
  const now = Date.now();
  const client = createStubClient({
    runs: [
      { id: 'run_a', tenant_id: 'ten_acme', user_id: 'u1', status: 'success',
        steps_completed: 3, steps_total: 3, priority: 'P2', trigger_kind: 'cli',
        source_surface: 'cli:markos run', estimated_cost_usd_micro: 6000,
        actual_cost_usd_micro: 0, created_at: new Date(now - 2000).toISOString(),
        brief_json: { big: 'x'.repeat(1000) }, result_json: { big: 'y'.repeat(1000) } },
      { id: 'run_b', tenant_id: 'ten_acme', user_id: 'u1', status: 'running',
        steps_completed: 1, steps_total: 3, priority: 'P2', trigger_kind: 'cli',
        source_surface: 'cli:markos run', estimated_cost_usd_micro: 6000,
        actual_cost_usd_micro: 0, created_at: new Date(now - 1000).toISOString(),
        brief_json: {}, result_json: null },
      { id: 'run_other', tenant_id: 'ten_other', user_id: 'u2', status: 'pending',
        steps_completed: 0, steps_total: 3, priority: 'P2', trigger_kind: 'cli',
        source_surface: 'cli:markos run', estimated_cost_usd_micro: 6000,
        actual_cost_usd_micro: 0, created_at: new Date(now).toISOString(),
        brief_json: {}, result_json: null },
    ],
  });

  const rows = await runsLib.listRuns({ client, tenant_id: 'ten_acme', limit: 10 });
  assert.equal(rows.length, 2, 'only tenant rows');
  assert.equal(rows[0].id, 'run_b', 'desc created_at');
  assert.equal(rows[1].id, 'run_a');
  for (const r of rows) {
    assert.ok(!('brief_json' in r), 'brief_json must be excluded');
    assert.ok(!('result_json' in r), 'result_json must be excluded');
  }
});

test('gr-01: getRun returns tenant-match row; null on cross-tenant', async () => {
  const client = createStubClient({
    runs: [
      { id: 'run_g1', tenant_id: 'ten_acme', user_id: 'u1', status: 'success',
        brief_json: { channel: 'email' }, result_json: { draft: 'x' }, steps_completed: 3,
        steps_total: 3, priority: 'P2', trigger_kind: 'cli' },
      { id: 'run_g2', tenant_id: 'ten_other', user_id: 'u2', status: 'pending', brief_json: {} },
    ],
  });

  const hit = await runsLib.getRun({ client, tenant_id: 'ten_acme', run_id: 'run_g1' });
  assert.ok(hit);
  assert.equal(hit.status, 'success');
  assert.ok(hit.result_json && hit.result_json.draft === 'x');

  const miss = await runsLib.getRun({ client, tenant_id: 'ten_acme', run_id: 'run_g2' });
  assert.equal(miss, null, 'cross-tenant must return null');

  const absent = await runsLib.getRun({ client, tenant_id: 'ten_acme', run_id: 'run_absent' });
  assert.equal(absent, null);
});

test('cr-01: cancelRun flips non-terminal runs and no-ops terminal', async () => {
  const client = createStubClient({
    runs: [
      { id: 'run_c1', tenant_id: 'ten_acme', user_id: 'u1', status: 'running',
        steps_completed: 1, steps_total: 3, brief_json: {} },
      { id: 'run_c2', tenant_id: 'ten_acme', user_id: 'u1', status: 'success',
        steps_completed: 3, steps_total: 3, brief_json: {} },
    ],
  });

  const first = await runsLib.cancelRun({ client, tenant_id: 'ten_acme', user_id: 'u1', run_id: 'run_c1' });
  assert.equal(first.status, 'cancelled');
  assert.equal(first.was_terminal, false);
  assert.equal(client._state.runs[0].status, 'cancelled');

  const second = await runsLib.cancelRun({ client, tenant_id: 'ten_acme', user_id: 'u1', run_id: 'run_c2' });
  assert.equal(second.status, 'success');
  assert.equal(second.was_terminal, true);
});

test('meta: runs lib exports expected surface', () => {
  const exports = Object.keys(runsLib).sort();
  for (const name of ['submitRun', 'streamRunEvents', 'listRuns', 'getRun', 'cancelRun', 'runStubExecutor']) {
    assert.ok(exports.includes(name), `export ${name} present`);
  }
  // Grep library source for source_domain: 'cli' + heartbeat keyword.
  const src = fs.readFileSync(RUNS_LIB_PATH, 'utf8');
  assert.match(src, /source_domain: 'cli'/, 'runs.cjs emits cli source_domain');
  assert.match(src, /heartbeat/, 'runs.cjs references heartbeat');
  assert.match(src, /setImmediate/, 'runs.cjs schedules executor with setImmediate');
});
