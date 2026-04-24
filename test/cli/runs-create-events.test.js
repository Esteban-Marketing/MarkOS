'use strict';

// Phase 204 Plan 06 Task 2 — POST /api/tenant/runs + GET /.../events + cancel handler tests.
//
// Covers:
//   rc-01: POST no auth → 401 unauthorized
//   rc-02: POST missing brief field → 400 invalid_brief
//   rc-03: POST happy + Bearer → 201 { run_id, status:'pending', events_url }
//   rc-04: GET (wrong method) on /runs → 405
//   ev-01: events GET no auth → 401
//   ev-02: events GET with foreign tenant → 404 run_not_found (no existence leak)
//   ev-03: events GET happy path → 200 with text/event-stream + run.completed frame
//   ev-04: events GET method POST → 405
//   ca-01: cancel POST happy → 200 { status:'cancelled', was_terminal:false }
//   ca-02: cancel POST on terminal run → 200 { was_terminal:true }
//   ca-03: cancel GET → 405

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const { Writable } = require('node:stream');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CREATE_HANDLER = require(path.resolve(REPO_ROOT, 'api', 'tenant', 'runs', 'create.js'));
const EVENTS_HANDLER = require(path.resolve(REPO_ROOT, 'api', 'tenant', 'runs', '[run_id]', 'events.js'));
const CANCEL_HANDLER = require(path.resolve(REPO_ROOT, 'api', 'tenant', 'runs', '[run_id]', 'cancel.js'));

// ─── Mock req/res (shared with runs-plan-endpoint.test.js pattern) ─────────

function makeReq({ method = 'POST', url = '/', headers = {}, body = null, query = {} } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = Object.assign({}, headers);
  req.query = query;
  req.socket = { remoteAddress: '127.0.0.1' };
  if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) {
    req.body = body;
  }
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
  const chunks = [];
  let ended = false;
  const res = {
    statusCode: 200,
    headers: {},
    bodyText: '',
    writeHead(code, headers) {
      this.statusCode = code;
      if (headers) Object.assign(this.headers, headers);
    },
    setHeader(k, v) { this.headers[k] = v; },
    write(chunk) { chunks.push(String(chunk)); },
    end(text) {
      if (text !== undefined) this.bodyText = String(text);
      else if (chunks.length) this.bodyText = chunks.join('');
      ended = true;
    },
    get ended() { return ended; },
    get raw() { return chunks.join(''); },
  };
  return res;
}

function parseBody(res) {
  try { return JSON.parse(res.bodyText); } catch { return null; }
}

// ─── Stub client ───────────────────────────────────────────────────────────

function createStubClient(initial = {}) {
  const state = {
    api_keys: [...(initial.api_keys || [])],
    tenants: [...(initial.tenants || [])],
    users: [...(initial.users || [])],
    memberships: [...(initial.memberships || [])],
    runs: [...(initial.runs || [])],
    audit: [],
    idCounter: 0,
  };

  function tableFor(name) {
    if (name === 'markos_cli_api_keys') return state.api_keys;
    if (name === 'markos_tenants') return state.tenants;
    if (name === 'markos_users') return state.users;
    if (name === 'markos_tenant_memberships') return state.memberships;
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
          insertRow.id = `run_${String(state.idCounter).padStart(24, '0')}`;
        }
        if (!insertRow.created_at) insertRow.created_at = new Date().toISOString();
        table.push(insertRow);
        return builder;
      },
      update(p) { op = 'update'; patch = p; return builder; },
      upsert(p) { op = 'upsert'; patch = p; return builder; },
      eq(col, val) { filters.push({ col, val }); return builder; },
      is(col, val) { filters.push({ col, val }); return builder; },
      order(col, opts) { orderCol = col; orderAsc = !(opts && opts.ascending === false); return builder; },
      limit(n) { limitN = n; return builder; },
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
        if (orderCol) {
          matched = matched.slice().sort((a, b) => {
            const av = a[orderCol]; const bv = b[orderCol];
            if (av < bv) return orderAsc ? -1 : 1;
            if (av > bv) return orderAsc ? 1 : -1;
            return 0;
          });
        }
        if (Number.isFinite(limitN)) matched = matched.slice(0, limitN);
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

function sha256Hex(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function makeBearerFixture(overrides = {}) {
  const access_token = 'mks_ak_' + 'b'.repeat(64);
  const key_hash = sha256Hex(access_token);
  const key_fingerprint = key_hash.slice(0, 8);
  const now = new Date().toISOString();
  return {
    access_token,
    key_hash,
    supabase: createStubClient({
      api_keys: [{
        id: 'cak_def456',
        tenant_id: 'ten_acme',
        user_id: 'usr_sam',
        scope: 'cli',
        key_hash,
        key_fingerprint,
        name: 'dev-key',
        created_at: now,
        last_used_at: null,
        revoked_at: null,
      }],
      tenants: [{ id: 'ten_acme', name: 'Acme Inc' }],
      users: [{ id: 'usr_sam', email: 'sam@acme.com' }],
      memberships: [{ tenant_id: 'ten_acme', user_id: 'usr_sam', role: 'owner' }],
      ...overrides,
    }),
  };
}

const HAPPY_BRIEF = {
  channel: 'email',
  audience: 'founders',
  pain: 'pipeline velocity',
  promise: 're-fill your pipeline',
  brand: 'markos',
};

// ─── POST /api/tenant/runs (create.js) ─────────────────────────────────────

test('rc-01: POST /api/tenant/runs without auth → 401 unauthorized', async () => {
  const req = makeReq({ method: 'POST', body: { brief: HAPPY_BRIEF } });
  const res = makeRes();
  await CREATE_HANDLER(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseBody(res).error, 'unauthorized');
});

test('rc-02: POST missing required brief field → 400 invalid_brief', async () => {
  const fx = makeBearerFixture();
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${fx.access_token}` },
    body: { brief: { audience: 'a', pain: 'b', promise: 'c', brand: 'd' } }, // channel missing
  });
  const res = makeRes();
  await CREATE_HANDLER(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 400);
  const body = parseBody(res);
  assert.equal(body.error, 'invalid_brief');
  assert.ok(Array.isArray(body.errors));
  assert.ok(body.errors.some((e) => /channel/i.test(e)));
});

test('rc-03: POST happy Bearer + brief → 201 with run_id + events_url', async () => {
  const fx = makeBearerFixture();
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${fx.access_token}` },
    body: { brief: HAPPY_BRIEF },
  });
  const res = makeRes();
  await CREATE_HANDLER(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 201, `body: ${res.bodyText}`);
  const body = parseBody(res);
  assert.ok(body.run_id && body.run_id.startsWith('run_'));
  assert.equal(body.status, 'pending');
  assert.equal(body.tenant_id, 'ten_acme');
  assert.equal(body.priority, 'P2');
  assert.ok(body.events_url && body.events_url.includes(body.run_id));
  assert.ok(body.correlation_id);

  // The runs table should have the row.
  assert.equal(fx.supabase._state.runs.length, 1);
  assert.equal(fx.supabase._state.runs[0].tenant_id, 'ten_acme');
});

test('rc-04: GET on /api/tenant/runs → 405', async () => {
  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await CREATE_HANDLER(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 405);
  assert.equal(parseBody(res).error, 'method_not_allowed');
});

// ─── GET /api/tenant/runs/{run_id}/events (events.js) ──────────────────────

test('ev-01: events GET without auth → 401', async () => {
  const req = makeReq({ method: 'GET', url: '/api/tenant/runs/run_abc/events', query: { run_id: 'run_abc' } });
  const res = makeRes();
  await EVENTS_HANDLER(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
});

test('ev-02: events GET cross-tenant → 404 run_not_found', async () => {
  const fx = makeBearerFixture({
    runs: [{
      id: 'run_foreign',
      tenant_id: 'ten_other',
      user_id: 'usr_other',
      status: 'running',
      steps_completed: 1,
      steps_total: 3,
      brief_json: {},
    }],
  });
  const req = makeReq({
    method: 'GET',
    url: '/api/tenant/runs/run_foreign/events',
    query: { run_id: 'run_foreign' },
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await EVENTS_HANDLER(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 404);
  assert.equal(parseBody(res).error, 'run_not_found');
});

test('ev-03: events GET happy → 200 text/event-stream with run.completed frame', async () => {
  const fx = makeBearerFixture({
    runs: [{
      id: 'run_happy',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'success',
      steps_completed: 3,
      steps_total: 3,
      result_json: { draft: 'ok' },
      brief_json: {},
      created_at: new Date().toISOString(),
    }],
  });
  const req = makeReq({
    method: 'GET',
    url: '/api/tenant/runs/run_happy/events',
    query: { run_id: 'run_happy' },
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await EVENTS_HANDLER(req, res, { supabase: fx.supabase });

  assert.equal(res.statusCode, 200, `body: ${res.bodyText}`);
  assert.equal(res.headers['Content-Type'], 'text/event-stream');
  assert.ok(/no-cache/.test(res.headers['Cache-Control']));
  // The stream should contain run.completed.
  assert.match(res.raw, /event: run\.completed/);
  assert.match(res.raw, /"status":"success"/);
});

test('ev-04: events POST → 405', async () => {
  const req = makeReq({
    method: 'POST',
    url: '/api/tenant/runs/run_x/events',
    query: { run_id: 'run_x' },
  });
  const res = makeRes();
  await EVENTS_HANDLER(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 405);
});

// ─── POST /api/tenant/runs/{run_id}/cancel (cancel.js) ─────────────────────

test('ca-01: cancel happy (non-terminal) → 200 cancelled', async () => {
  const fx = makeBearerFixture({
    runs: [{
      id: 'run_cx',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'running',
      steps_completed: 1,
      steps_total: 3,
      brief_json: {},
    }],
  });
  const req = makeReq({
    method: 'POST',
    url: '/api/tenant/runs/run_cx/cancel',
    query: { run_id: 'run_cx' },
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await CANCEL_HANDLER(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const body = parseBody(res);
  assert.equal(body.status, 'cancelled');
  assert.equal(body.was_terminal, false);
  assert.equal(fx.supabase._state.runs[0].status, 'cancelled');
});

test('ca-02: cancel terminal run → 200 was_terminal:true', async () => {
  const fx = makeBearerFixture({
    runs: [{
      id: 'run_ct',
      tenant_id: 'ten_acme',
      user_id: 'usr_sam',
      status: 'success',
      steps_completed: 3,
      steps_total: 3,
      brief_json: {},
    }],
  });
  const req = makeReq({
    method: 'POST',
    url: '/api/tenant/runs/run_ct/cancel',
    query: { run_id: 'run_ct' },
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await CANCEL_HANDLER(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const body = parseBody(res);
  assert.equal(body.status, 'success');
  assert.equal(body.was_terminal, true);
});

test('ca-03: cancel with wrong method → 405', async () => {
  const req = makeReq({
    method: 'GET',
    url: '/api/tenant/runs/run_x/cancel',
    query: { run_id: 'run_x' },
  });
  const res = makeRes();
  await CANCEL_HANDLER(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 405);
});
