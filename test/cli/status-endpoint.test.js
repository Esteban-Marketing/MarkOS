'use strict';

// Phase 204 Plan 08 Task 1 — aggregateStatus library + /api/tenant/status endpoint tests.
//
// Covers:
//   ep-01: GET no auth → 401 unauthorized
//   ep-02: GET valid Bearer → 200 envelope with all 4 panels + generated_at
//   ep-03: subscription falls back to { plan_tier: 'free', billing_status: 'active' }
//          when markos_orgs lookup yields no row (Phase 205 columns absent)
//   ep-04: active_rotations is empty array when rotation.cjs export throws
//          (simulated via module-cache override)
//   ep-05: recent_runs filtered by tenant_id — cross-tenant run never surfaces
//   ep-06: quota numbers accurate when seed data exists (runs + tokens + deliveries)
//   ep-07: F-105 YAML shape — StatusEnvelope present, x-markos-phase placeholder removed
//   ep-08: ?runs=N override clamps to 1..50
//   ep-09: aggregateStatus envelope omits brief_json/result_json (T-204-06-04 inheritance)

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ─── Mock req / res ────────────────────────────────────────────────────────

function makeReq({ method = 'GET', url = '/', headers = {}, body = null, query = {} } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = Object.assign({}, headers);
  req.query = query;
  if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) {
    req.body = body;
  }
  req.socket = { remoteAddress: '127.0.0.1' };
  queueMicrotask(() => {
    if (body !== null && typeof body === 'string') {
      req.emit('data', Buffer.from(body, 'utf8'));
    } else if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) {
      req.emit('data', Buffer.from(JSON.stringify(body), 'utf8'));
    }
    req.emit('end');
  });
  return req;
}

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    bodyText: '',
    writeHead(code, headers) {
      this.statusCode = code;
      if (headers) Object.assign(this.headers, headers);
    },
    setHeader(k, v) { this.headers[k] = v; },
    end(text) { this.bodyText = text || ''; },
  };
  return res;
}

function parseResBody(res) {
  try { return JSON.parse(res.bodyText); } catch { return null; }
}

// ─── Stub Supabase ────────────────────────────────────────────────────────

function createStubClient(initial = {}) {
  const state = {
    api_keys: [...(initial.api_keys || [])],
    tenants: [...(initial.tenants || [])],
    orgs: [...(initial.orgs || [])],
    users: [...(initial.users || [])],
    memberships: [...(initial.memberships || [])],
    runs: [...(initial.runs || [])],
    rotations: [...(initial.rotations || [])],
    subscriptions: [...(initial.subscriptions || [])],
    fleet_metrics: [...(initial.fleet_metrics || [])],
    deliveries: [...(initial.deliveries || [])],
    dlq: [...(initial.dlq || [])],
    audit_rows: [],
  };

  function tableFor(name) {
    if (name === 'markos_cli_api_keys') return state.api_keys;
    if (name === 'markos_tenants') return state.tenants;
    if (name === 'markos_orgs') return state.orgs;
    if (name === 'markos_users') return state.users;
    if (name === 'markos_tenant_memberships') return state.memberships;
    if (name === 'markos_cli_runs') return state.runs;
    if (name === 'markos_webhook_secret_rotations') return state.rotations;
    if (name === 'markos_webhook_subscriptions') return state.subscriptions;
    if (name === 'markos_webhook_fleet_metrics_v1') return state.fleet_metrics;
    if (name === 'markos_webhook_deliveries') return state.deliveries;
    if (name === 'markos_webhook_dlq') return state.dlq;
    if (name === 'markos_audit_log_staging') return state.audit_rows;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    const filters = [];
    const isFilters = [];
    const inFilters = [];
    const gteFilters = [];
    let wantsSingle = false;
    let orderBy = null;
    let limitN = Infinity;

    const builder = {
      select() { return builder; },
      insert(row) {
        if (Array.isArray(row)) for (const r of row) table.push({ ...r });
        else table.push({ ...row });
        return { data: Array.isArray(row) ? row : [row], error: null };
      },
      update(p) { op = 'update'; patch = p; return builder; },
      eq(col, val) { filters.push({ col, val }); return builder; },
      is(col, val) { isFilters.push({ col, val }); return builder; },
      in(col, vals) { inFilters.push({ col, vals }); return builder; },
      gte(col, val) { gteFilters.push({ col, val }); return builder; },
      order(col, opts) {
        orderBy = { col, ascending: !(opts && opts.ascending === false) };
        return builder;
      },
      limit(n) { limitN = n; return builder; },
      maybeSingle() { wantsSingle = true; return builder; },
      single() { wantsSingle = true; return builder; },
      then(resolve) {
        let matched = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        matched = matched.filter((r) => isFilters.every((f) => {
          const v = r[f.col];
          return f.val === null ? (v == null) : (v === f.val);
        }));
        matched = matched.filter((r) => inFilters.every((f) => f.vals.includes(r[f.col])));
        matched = matched.filter((r) => gteFilters.every((f) => String(r[f.col]) >= String(f.val)));

        if (op === 'update') {
          for (const r of matched) Object.assign(r, patch);
          resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
          return { catch() { return builder; } };
        }
        if (orderBy) {
          matched = matched.slice().sort((a, b) => {
            const av = a[orderBy.col];
            const bv = b[orderBy.col];
            if (av === bv) return 0;
            const cmp = String(av).localeCompare(String(bv));
            return orderBy.ascending ? cmp : -cmp;
          });
        }
        if (Number.isFinite(limitN)) matched = matched.slice(0, limitN);
        resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
        return { catch() { return builder; } };
      },
    };
    return builder;
  }

  return { from(t) { return makeQuery(t); }, _state: state };
}

function sha256Hex(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function makeBearerFixture(extra = {}) {
  const access_token = 'mks_ak_' + 'a'.repeat(64);
  const key_hash = sha256Hex(access_token);
  const key_fingerprint = key_hash.slice(0, 8);
  const now = new Date().toISOString();

  const api_key_row = {
    id: 'cak_abc123',
    tenant_id: 'ten_acme',
    user_id: 'usr_sam',
    scope: 'cli',
    key_hash,
    key_fingerprint,
    name: 'dev-key',
    created_at: now,
    last_used_at: null,
    revoked_at: null,
  };

  const supabase = createStubClient(Object.assign({
    api_keys: [api_key_row],
    tenants: [{ id: 'ten_acme', name: 'Acme Inc', org_id: 'org_acme' }],
    orgs: [{ id: 'org_acme', plan_tier: 'pro', billing_status: 'active' }],
    users: [{ id: 'usr_sam', email: 'sam@acme.com' }],
    memberships: [{ tenant_id: 'ten_acme', user_id: 'usr_sam', role: 'owner' }],
  }, extra));

  return { access_token, key_hash, key_fingerprint, supabase };
}

// Reset module cache between tests that swap out webhook modules.
function resetStatusModuleCache() {
  const STATUS_LIB = path.resolve(REPO_ROOT, 'lib', 'markos', 'cli', 'status.cjs');
  const ENDPOINT = path.resolve(REPO_ROOT, 'api', 'tenant', 'status.js');
  delete require.cache[require.resolve(STATUS_LIB)];
  delete require.cache[require.resolve(ENDPOINT)];
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('ep-01: GET /api/tenant/status no auth → 401 unauthorized', async () => {
  resetStatusModuleCache();
  const handler = require('../../api/tenant/status.js');
  const req = makeReq({ method: 'GET', headers: {} });
  const res = makeRes();
  await handler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseResBody(res).error, 'unauthorized');
});

test('ep-02: GET /api/tenant/status valid Bearer → 200 envelope with all 4 panels', async () => {
  resetStatusModuleCache();
  const handler = require('../../api/tenant/status.js');
  const fx = makeBearerFixture();
  const req = makeReq({
    method: 'GET',
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await handler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);

  // 4 panels + generated_at — exact required keys.
  for (const k of ['subscription', 'quota', 'active_rotations', 'recent_runs', 'generated_at']) {
    assert.ok(Object.prototype.hasOwnProperty.call(body, k), `envelope must have ${k}`);
  }
  assert.equal(body.subscription.plan_tier, 'pro');
  assert.equal(body.subscription.billing_status, 'active');
  assert.ok(Array.isArray(body.active_rotations));
  assert.ok(Array.isArray(body.recent_runs));
  assert.ok(typeof body.quota.runs_this_month === 'number');
  assert.ok(typeof body.quota.tokens_this_month === 'number');
  assert.ok(typeof body.quota.deliveries_this_month === 'number');
  assert.equal(body.quota.window_days, 30);
  assert.ok(!Number.isNaN(Date.parse(body.generated_at)));

  // Underscore-prefixed advisory fields are stripped at the wire.
  assert.equal(body._tenant_id, undefined);
  assert.equal(body._user_id, undefined);
});

test('ep-03: subscription panel defaults to free/active when org row absent', async () => {
  resetStatusModuleCache();
  const handler = require('../../api/tenant/status.js');
  const fx = makeBearerFixture({
    tenants: [{ id: 'ten_acme', name: 'Acme Inc', org_id: null }],
    orgs: [],
  });
  const req = makeReq({
    method: 'GET',
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await handler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  assert.equal(body.subscription.plan_tier, 'free');
  assert.equal(body.subscription.billing_status, 'active');
});

test('ep-04: active_rotations is [] when rotation.cjs throws (safe-require fallback)', async () => {
  // Override the rotation module in the require cache BEFORE loading status.cjs.
  resetStatusModuleCache();
  const ROTATION_PATH = require.resolve('../../lib/markos/webhooks/rotation.cjs');
  const original = require.cache[ROTATION_PATH];
  require.cache[ROTATION_PATH] = {
    id: ROTATION_PATH,
    filename: ROTATION_PATH,
    loaded: true,
    exports: {
      listActiveRotations: async () => { throw new Error('simulated boom'); },
    },
  };
  try {
    const handler = require('../../api/tenant/status.js');
    const fx = makeBearerFixture();
    const req = makeReq({
      method: 'GET',
      headers: { authorization: `Bearer ${fx.access_token}` },
    });
    const res = makeRes();
    await handler(req, res, { supabase: fx.supabase });
    assert.equal(res.statusCode, 200);
    const body = parseResBody(res);
    assert.deepEqual(body.active_rotations, [], 'rotation throw → empty array');
  } finally {
    if (original) require.cache[ROTATION_PATH] = original;
    else delete require.cache[ROTATION_PATH];
    resetStatusModuleCache();
  }
});

test('ep-05: recent_runs filtered by tenant_id — cross-tenant runs never surface', async () => {
  resetStatusModuleCache();
  const handler = require('../../api/tenant/status.js');
  const now = Date.now();
  const fx = makeBearerFixture({
    runs: [
      {
        id: 'run_mine_01', tenant_id: 'ten_acme', user_id: 'usr_sam',
        status: 'success', steps_completed: 3, steps_total: 3,
        created_at: new Date(now - 1000).toISOString(),
        completed_at: new Date(now - 500).toISOString(),
      },
      {
        id: 'run_other_01', tenant_id: 'ten_OTHER', user_id: 'usr_eve',
        status: 'success', steps_completed: 3, steps_total: 3,
        created_at: new Date(now - 2000).toISOString(),
        completed_at: null,
      },
    ],
  });
  const req = makeReq({
    method: 'GET',
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await handler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  const ids = body.recent_runs.map((r) => r.run_id);
  assert.ok(ids.includes('run_mine_01'), 'own run must surface');
  assert.ok(!ids.includes('run_other_01'), 'cross-tenant run must NEVER surface');
});

test('ep-06: quota.runs_this_month + tokens_this_month accurate over seed data', async () => {
  resetStatusModuleCache();
  const handler = require('../../api/tenant/status.js');
  const now = Date.now();
  const fx = makeBearerFixture({
    runs: [
      {
        id: 'r1', tenant_id: 'ten_acme', user_id: 'usr_sam',
        status: 'success', steps_completed: 3, steps_total: 3,
        result_json: { tokens_used: 1000 },
        created_at: new Date(now - 1000).toISOString(),
      },
      {
        id: 'r2', tenant_id: 'ten_acme', user_id: 'usr_sam',
        status: 'success', steps_completed: 3, steps_total: 3,
        result_json: { tokens_used: 500 },
        created_at: new Date(now - 2000).toISOString(),
      },
      {
        id: 'r3', tenant_id: 'ten_acme', user_id: 'usr_sam',
        status: 'failed', steps_completed: 1, steps_total: 3,
        result_json: null,
        created_at: new Date(now - 3000).toISOString(),
      },
    ],
  });
  const req = makeReq({
    method: 'GET',
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await handler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  assert.equal(body.quota.runs_this_month, 3, 'all three rows count toward runs');
  assert.equal(body.quota.tokens_this_month, 1500, 'r1 + r2 token sums');
});

test('ep-07: F-105 YAML — StatusEnvelope present + x-markos-phase placeholder removed + StatusEnvelope in openapi', () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-105-cli-whoami-status-v1.yaml');
  const text = fs.readFileSync(yamlPath, 'utf8');

  // StatusEnvelope schema declared.
  assert.ok(/StatusEnvelope:/.test(text), 'F-105 must declare StatusEnvelope schema');
  // 4 sub-panels declared (subscription / quota / active_rotations / recent_runs).
  for (const panel of ['StatusSubscriptionPanel', 'StatusQuotaPanel', 'StatusRotationRow', 'StatusRecentRunRow']) {
    assert.ok(text.includes(panel), `F-105 must declare ${panel}`);
  }
  // The 204-08-PLAN placeholder marker is GONE.
  assert.equal(
    (text.match(/204-08-PLAN/g) || []).length,
    0,
    'x-markos-phase: 204-08-PLAN placeholder marker must be removed',
  );
  // Status path still present + has structured response (200).
  assert.ok(text.includes('/api/tenant/status:'), 'status path present');
  // openapi regen contains the path + (renamed) StatusEnvelope schema.
  const openapi = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'contracts', 'openapi.json'), 'utf8'));
  assert.ok(openapi.paths['/api/tenant/status'], '/api/tenant/status must be in openapi.json');
  assert.ok(openapi.paths['/api/tenant/status'].get, 'GET method must be wired');
  // Build script prefixes with F_105_ — check both forms.
  const schemaKeys = Object.keys(openapi.components?.schemas || {});
  const hasStatusEnvelope = schemaKeys.some((k) => /StatusEnvelope$/.test(k));
  assert.ok(hasStatusEnvelope, `openapi components must include StatusEnvelope schema (saw ${schemaKeys.length} keys)`);
});

test('ep-08: ?runs=N override clamps to 1..50', () => {
  const handler = require('../../api/tenant/status.js');
  // Direct unit on parseRunsLimit helper.
  assert.equal(handler._parseRunsLimit({ url: '/api/tenant/status?runs=10', headers: {} }), 10);
  assert.equal(handler._parseRunsLimit({ url: '/api/tenant/status?runs=999', headers: {} }), 50);
  assert.equal(handler._parseRunsLimit({ url: '/api/tenant/status?runs=-1', headers: {} }), undefined);
  assert.equal(handler._parseRunsLimit({ url: '/api/tenant/status', headers: {} }), undefined);
  // Express-style query property.
  assert.equal(handler._parseRunsLimit({ url: '/', headers: {}, query: { runs: '7' } }), 7);
});

test('ep-09: aggregateStatus envelope omits brief_json/result_json (T-204-06-04 inheritance)', async () => {
  resetStatusModuleCache();
  const handler = require('../../api/tenant/status.js');
  const fx = makeBearerFixture({
    runs: [
      {
        id: 'r1', tenant_id: 'ten_acme', user_id: 'usr_sam',
        status: 'success', steps_completed: 3, steps_total: 3,
        brief_json: { secret: 'TOPSECRETBRIEF' },
        result_json: { secret: 'TOPSECRETRESULT', tokens_used: 100 },
        created_at: new Date().toISOString(),
      },
    ],
  });
  const req = makeReq({
    method: 'GET',
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await handler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const text = res.bodyText;
  assert.ok(!text.includes('TOPSECRETBRIEF'), 'brief_json must NEVER leak through recent_runs');
  assert.ok(!text.includes('TOPSECRETRESULT'), 'result_json must NEVER leak through recent_runs');
});
