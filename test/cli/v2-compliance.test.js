'use strict';

// Phase 204 Plan 13 — v2 compliance test suite.
//
// Tests the guardrails added by Plan 204-13:
//   vc-01  submitRun row carries all V2_REQUIRED_FIELDS (Task 2)
//   vc-02  buildV2Payload default shape passes assertV2PayloadShape
//   vc-03  deriveIdempotencyKey is deterministic for same inputs
//   vc-04  STATE_V1_TO_V2_MAP covers every v1 state
//   vc-05  pricing_engine_context defaults to {{MARKOS_PRICING_ENGINE_PENDING}} sentinel
//   vc-06  listRuns synthesizes v2_state for rows without the column (pre-migration-77)
//   vc-07  runStubExecutor updates v2_state → executing → completed (best-effort)
//   vc-08  cancelRun transitions v2_state → canceled + sets closed_at
//   vc-09  doctor agentrun_v2_alignment ok when migration 77 + v2 fields present
//   vc-10  doctor agentrun_v2_alignment error when migration 77 missing
//   vc-11  doctor pricing_placeholder_policy error on hardcoded price in docs
//   vc-12  doctor pricing_placeholder_policy ok when placeholder sentinel present
//   vc-13  doctor vault_freshness warns on stale incoming without distillation
//   vc-14  migration 77 SQL file references the canonical v2 columns

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const RUNS_LIB_PATH = path.resolve(REPO_ROOT, 'lib', 'markos', 'cli', 'runs.cjs');
const DOCTOR_CHECKS_PATH = path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'doctor-checks.cjs');
const MIGRATION_77_PATH = path.resolve(REPO_ROOT, 'supabase', 'migrations', '77_markos_cli_runs_v2_align.sql');

// ─── Minimal stub client that records inserts/updates ─────────────────────

function createStubClient(initial = {}) {
  const state = {
    runs: [...(initial.runs || [])],
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
    const filters = [];
    let wantsSingle = false;
    const builder = {
      select() { return builder; },
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
      eq(col, val) { filters.push({ col, val }); return builder; },
      order() { return builder; },
      limit() { return builder; },
      maybeSingle() { wantsSingle = true; return builder; },
      single() { wantsSingle = true; return builder; },
      then(resolve) {
        if (op === 'insert') {
          resolve({ data: wantsSingle ? insertRow : [insertRow], error: null });
          return { catch() { return builder; } };
        }
        let matched = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        if (op === 'update') {
          for (const r of matched) Object.assign(r, patch);
          resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
          return { catch() { return builder; } };
        }
        resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
        return { catch() { return builder; } };
      },
    };
    return builder;
  }
  return { from(t) { return makeQuery(t); }, _state: state };
}

function sampleBrief() {
  return {
    channel: 'email',
    audience: 'CTOs at growth-stage SaaS',
    pain: 'churn spikes after trial',
    promise: 'predictive retention signals',
    brand: 'MarkOS',
  };
}

// ─── vc-01..05 pure-unit tests on the runs lib ────────────────────────────

test('vc-01: submitRun row carries all V2_REQUIRED_FIELDS', async () => {
  delete require.cache[require.resolve(RUNS_LIB_PATH)];
  const runs = require(RUNS_LIB_PATH);
  const client = createStubClient();
  await runs.submitRun({
    client,
    tenant_id: 'ten_vc1',
    user_id: 'usr_vc1',
    brief: sampleBrief(),
  });
  const row = client._state.runs[0];
  assert.ok(row, 'submitRun should have inserted a row');
  const { ok, missing } = runs.assertV2PayloadShape(row);
  assert.ok(ok, `v2 payload missing fields: ${missing.join(', ')}`);
  assert.equal(row.trigger_kind, 'cli');
  assert.equal(row.source_surface, 'cli:markos run');
  assert.equal(row.priority, 'P2');
  assert.equal(row.agent_registry_version, '2026-04-23-r1');
  assert.equal(row.v2_state, 'requested');
  assert.equal(row.cost_currency, 'USD');
  assert.equal(row.tokens_input, 0);
  assert.equal(row.tokens_output, 0);
  assert.equal(row.retry_count, 0);
  assert.ok(row.idempotency_key && row.idempotency_key.startsWith('idem_'));
});

test('vc-02: buildV2Payload default shape passes assertV2PayloadShape', () => {
  delete require.cache[require.resolve(RUNS_LIB_PATH)];
  const runs = require(RUNS_LIB_PATH);
  const payload = runs.buildV2Payload({
    tenant_id: 'ten_vc2',
    user_id: 'usr_vc2',
    brief: sampleBrief(),
  });
  const { ok, missing } = runs.assertV2PayloadShape(payload);
  assert.ok(ok, `missing: ${missing.join(', ')}`);
  assert.deepEqual(payload.approval_policy, { mode: 'always', required_roles: [] });
  assert.deepEqual(payload.pricing_engine_context, { placeholder: '{{MARKOS_PRICING_ENGINE_PENDING}}' });
});

test('vc-03: deriveIdempotencyKey is deterministic for identical inputs', () => {
  delete require.cache[require.resolve(RUNS_LIB_PATH)];
  const runs = require(RUNS_LIB_PATH);
  const a = runs.deriveIdempotencyKey({ tenant_id: 'ten_A', brief: sampleBrief() });
  const b = runs.deriveIdempotencyKey({ tenant_id: 'ten_A', brief: sampleBrief() });
  const c = runs.deriveIdempotencyKey({ tenant_id: 'ten_B', brief: sampleBrief() });
  assert.equal(a, b, 'same inputs must produce same key');
  assert.notEqual(a, c, 'different tenant must produce different key');
  assert.ok(a.startsWith('idem_'));
});

test('vc-04: STATE_V1_TO_V2_MAP covers every v1 state with a valid v2 state', () => {
  delete require.cache[require.resolve(RUNS_LIB_PATH)];
  const runs = require(RUNS_LIB_PATH);
  for (const v1 of runs.RUN_STATES) {
    const v2 = runs.STATE_V1_TO_V2_MAP[v1];
    assert.ok(v2, `no v2 mapping for v1 state '${v1}'`);
    assert.ok(runs.V2_STATES.includes(v2), `mapped v2 state '${v2}' is not in V2_STATES`);
  }
  // Spot-check canonical map entries.
  assert.equal(runs.STATE_V1_TO_V2_MAP.pending, 'requested');
  assert.equal(runs.STATE_V1_TO_V2_MAP.cancelled, 'canceled'); // US spelling
});

test('vc-05: pricing_engine_context defaults to placeholder sentinel', () => {
  delete require.cache[require.resolve(RUNS_LIB_PATH)];
  const runs = require(RUNS_LIB_PATH);
  assert.equal(runs.PRICING_PLACEHOLDER_SENTINEL, '{{MARKOS_PRICING_ENGINE_PENDING}}');
  const p = runs.buildV2Payload({ tenant_id: 't', user_id: 'u', brief: sampleBrief() });
  assert.equal(p.pricing_engine_context.placeholder, runs.PRICING_PLACEHOLDER_SENTINEL);
});

// ─── vc-06..08 behavior against the stub client ──────────────────────────

test('vc-06: listRuns synthesizes v2_state for rows without the column', async () => {
  delete require.cache[require.resolve(RUNS_LIB_PATH)];
  const runs = require(RUNS_LIB_PATH);
  // Seed a row that predates migration 77 — v1 fields only, no v2_state.
  const client = createStubClient({
    runs: [{
      id: 'run_pre_77',
      tenant_id: 'ten_vc6',
      user_id: 'usr_vc6',
      status: 'success',
      steps_completed: 3,
      steps_total: 3,
      priority: 'P2',
      trigger_kind: 'cli',
      source_surface: 'cli:markos run',
      estimated_cost_usd_micro: 0,
      actual_cost_usd_micro: 0,
      created_at: new Date().toISOString(),
    }],
  });
  const list = await runs.listRuns({ client, tenant_id: 'ten_vc6' });
  assert.equal(list.length, 1);
  assert.equal(list[0].v2_state, 'completed', 'success→completed per STATE_V1_TO_V2_MAP');
});

test('vc-07: runStubExecutor writes v2_state executing → completed', async () => {
  delete require.cache[require.resolve(RUNS_LIB_PATH)];
  const runs = require(RUNS_LIB_PATH);
  const client = createStubClient();
  const result = await runs.submitRun({
    client,
    tenant_id: 'ten_vc7',
    user_id: 'usr_vc7',
    brief: sampleBrief(),
  });
  // Wait for the stub executor (300ms × 3 + margin) to finish.
  await new Promise((r) => setTimeout(r, 300 * 4));
  const row = client._state.runs.find((x) => x.id === result.run_id);
  assert.ok(row);
  // v2_state may be 'completed' if executor finished, or 'executing' mid-run.
  assert.ok(['executing', 'completed'].includes(row.v2_state),
    `expected v2_state executing|completed, got ${row.v2_state}`);
  if (row.v2_state === 'completed') {
    assert.ok(row.closed_at, 'closed_at should be set when v2_state=completed');
  }
});

test('vc-08: cancelRun transitions v2_state to canceled with closed_at', async () => {
  delete require.cache[require.resolve(RUNS_LIB_PATH)];
  const runs = require(RUNS_LIB_PATH);
  // Seed a running row.
  const client = createStubClient({
    runs: [{
      id: 'run_vc8',
      tenant_id: 'ten_vc8',
      user_id: 'usr_vc8',
      status: 'running',
      v2_state: 'executing',
      steps_completed: 1,
      steps_total: 3,
      priority: 'P2',
      created_at: new Date().toISOString(),
    }],
  });
  const out = await runs.cancelRun({
    client,
    tenant_id: 'ten_vc8',
    user_id: 'usr_vc8',
    run_id: 'run_vc8',
  });
  assert.equal(out.status, 'cancelled');
  const row = client._state.runs[0];
  assert.equal(row.status, 'cancelled');
  assert.equal(row.v2_state, 'canceled');
  assert.ok(row.closed_at, 'closed_at should be set on cancel');
});

// ─── vc-09..13 doctor compliance checks ───────────────────────────────────

function tmpRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-v2c-'));
  // Minimal layout: supabase/migrations/ + lib/markos/cli/runs.cjs symlink-ish
  fs.mkdirSync(path.join(dir, 'supabase', 'migrations'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'lib', 'markos', 'cli'), { recursive: true });
  // Copy the real runs.cjs + its plan.cjs dependency so buildV2Payload can run.
  fs.mkdirSync(path.join(dir, 'lib', 'markos', 'audit'), { recursive: true });
  fs.copyFileSync(
    path.resolve(REPO_ROOT, 'lib', 'markos', 'cli', 'runs.cjs'),
    path.join(dir, 'lib', 'markos', 'cli', 'runs.cjs'),
  );
  fs.copyFileSync(
    path.resolve(REPO_ROOT, 'lib', 'markos', 'cli', 'plan.cjs'),
    path.join(dir, 'lib', 'markos', 'cli', 'plan.cjs'),
  );
  return dir;
}

test('vc-09: doctor agentrun_v2_alignment → ok when migration 77 + v2 fields present', async () => {
  delete require.cache[require.resolve(DOCTOR_CHECKS_PATH)];
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const dir = tmpRepo();
  // Copy migration 77 in.
  fs.copyFileSync(
    MIGRATION_77_PATH,
    path.join(dir, 'supabase', 'migrations', '77_markos_cli_runs_v2_align.sql'),
  );
  const result = await _checks.checkAgentrunV2Alignment({ cwd: dir });
  assert.equal(result.id, 'agentrun_v2_alignment');
  assert.equal(result.status, 'ok', `expected ok, got ${result.status}: ${result.message}`);
});

test('vc-10: doctor agentrun_v2_alignment → error when migration 77 missing', async () => {
  delete require.cache[require.resolve(DOCTOR_CHECKS_PATH)];
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const dir = tmpRepo();
  const result = await _checks.checkAgentrunV2Alignment({ cwd: dir });
  assert.equal(result.status, 'error');
  assert.match(result.message, /migration 77/);
});

test('vc-11: doctor pricing_placeholder_policy → error on hardcoded price', async () => {
  delete require.cache[require.resolve(DOCTOR_CHECKS_PATH)];
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-v2c-price-'));
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'docs', 'pricing.md'),
    '# Pricing\n\nMarkOS starts at $49/mo per seat.\n',
  );
  const result = await _checks.checkPricingPlaceholderPolicy({ cwd: dir });
  assert.equal(result.status, 'error');
  assert.match(result.message, /hard-coded/);
});

test('vc-12: doctor pricing_placeholder_policy → ok when placeholder sentinel present', async () => {
  delete require.cache[require.resolve(DOCTOR_CHECKS_PATH)];
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-v2c-price-ok-'));
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'docs', 'pricing.md'),
    '# Pricing\n\nMarkOS starts at $49/mo — {{MARKOS_PRICING_ENGINE_PENDING}} until Phase 205.\n',
  );
  const result = await _checks.checkPricingPlaceholderPolicy({ cwd: dir });
  assert.equal(result.status, 'ok');
});

test('vc-13: doctor vault_freshness → warn on stale incoming without distillation', async () => {
  delete require.cache[require.resolve(DOCTOR_CHECKS_PATH)];
  const { _checks } = require(DOCTOR_CHECKS_PATH);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-v2c-vault-'));
  fs.mkdirSync(path.join(dir, 'obsidian', 'work', 'incoming'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'obsidian', 'brain'), { recursive: true });
  const stalePath = path.join(dir, 'obsidian', 'work', 'incoming', '99-ANCIENT-ALIEN-DOC.md');
  fs.writeFileSync(stalePath, '# Ancient\n');
  // Set mtime 100 days in the past.
  const old = Date.now() - (100 * 24 * 3600 * 1000);
  fs.utimesSync(stalePath, new Date(old), new Date(old));
  // Also add a fresh doc + a distilled-backed stale doc to spot-check filter.
  fs.writeFileSync(path.join(dir, 'obsidian', 'work', 'incoming', '00-FRESH.md'), 'ok');
  const distilledStale = path.join(dir, 'obsidian', 'work', 'incoming', '01-PRODUCT-VISION.md');
  fs.writeFileSync(distilledStale, 'old');
  fs.utimesSync(distilledStale, new Date(old), new Date(old));
  fs.writeFileSync(path.join(dir, 'obsidian', 'brain', 'Product Vision Canon.md'), '# distilled');
  const result = await _checks.checkVaultFreshness({ cwd: dir });
  assert.equal(result.id, 'vault_freshness');
  assert.equal(result.status, 'warn');
  assert.match(result.message, /99-ANCIENT-ALIEN-DOC\.md|stale incoming/);
});

test('vc-14: migration 77 SQL file references canonical v2 columns', () => {
  const text = fs.readFileSync(MIGRATION_77_PATH, 'utf8');
  for (const col of [
    'idempotency_key',
    'parent_run_id',
    'task_id',
    'approval_policy',
    'provider_policy',
    'tool_policy',
    'pricing_engine_context',
    'cost_currency',
    'tokens_input',
    'tokens_output',
    'retry_count',
    'retry_after',
    'last_error_code',
    'closed_at',
    'v2_state',
  ]) {
    assert.match(text, new RegExp(col, 'i'), `migration 77 should reference column '${col}'`);
  }
});
