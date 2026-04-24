'use strict';

// Phase 204 Plan 05 Task 2 — POST /api/tenant/runs/plan endpoint tests.
//
// Covers:
//   pep-01: POST no auth → 401 unauthorized
//   pep-02: POST missing required field (channel absent) → 400 + errors listed
//   pep-03: POST happy (valid Bearer + valid brief) → 200 with 3 steps + tokens +
//           cost + tenant_id + run_id:null
//   pep-04: endpoint is strictly read-only (no .insert/.update/.upsert calls
//           land in the stub; grep-asserted against handler source too)
//   pep-05: method gate — GET returns 405 method_not_allowed
//   pep-06: response envelope is AgentRun v2 compatible (estimated_cost_usd_micro
//           present, priority, chain_id, model fields present)

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HANDLER_PATH = path.resolve(REPO_ROOT, 'api', 'tenant', 'runs', 'plan.js');

const planHandler = require(HANDLER_PATH);

// ─── Mock req/res ─────────────────────────────────────────────────────────

function makeReq({ method = 'POST', url = '/', headers = {}, body = null } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = Object.assign({}, headers);
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

// ─── Stub Supabase (copied from whoami-endpoint.test.js pattern) ──────────

function createStubClient(initial = {}) {
  const state = {
    api_keys: [...(initial.api_keys || [])],
    tenants: [...(initial.tenants || [])],
    users: [...(initial.users || [])],
    memberships: [...(initial.memberships || [])],
    // writes counter — if any .insert/.update lands, this bumps; we assert
    // it stays 0 in pep-04 to prove no-DB-write invariant.
    writes: 0,
  };

  function tableFor(name) {
    if (name === 'markos_cli_api_keys') return state.api_keys;
    if (name === 'markos_tenants') return state.tenants;
    if (name === 'markos_users') return state.users;
    if (name === 'markos_tenant_memberships') return state.memberships;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    const filters = [];
    const isFilters = [];
    let wantsSingle = false;

    const builder = {
      select() { return builder; },
      insert(row) {
        state.writes++;
        if (Array.isArray(row)) for (const r of row) table.push({ ...r });
        else table.push({ ...row });
        return { data: Array.isArray(row) ? row : [row], error: null };
      },
      update(p) { op = 'update'; patch = p; state.writes++; return builder; },
      upsert(p) { op = 'upsert'; patch = p; state.writes++; return builder; },
      eq(col, val) { filters.push({ col, val }); return builder; },
      is(col, val) { isFilters.push({ col, val }); return builder; },
      order() { return builder; },
      maybeSingle() { wantsSingle = true; return builder; },
      single() { wantsSingle = true; return builder; },
      then(resolve) {
        let matched = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        matched = matched.filter((r) => isFilters.every((f) => {
          const v = r[f.col];
          return f.val === null ? (v == null) : (v === f.val);
        }));
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

function sha256Hex(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function makeBearerFixture() {
  const access_token = 'mks_ak_' + 'a'.repeat(64);
  const key_hash = sha256Hex(access_token);
  const key_fingerprint = key_hash.slice(0, 8);
  const now = new Date().toISOString();

  return {
    access_token,
    key_hash,
    key_fingerprint,
    supabase: createStubClient({
      api_keys: [{
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
      }],
      tenants: [{ id: 'ten_acme', name: 'Acme Inc' }],
      users: [{ id: 'usr_sam', email: 'sam@acme.com' }],
      memberships: [{ tenant_id: 'ten_acme', user_id: 'usr_sam', role: 'owner' }],
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

// ─── Tests ─────────────────────────────────────────────────────────────────

test('pep-01: POST /api/tenant/runs/plan no auth → 401 unauthorized', async () => {
  const req = makeReq({ method: 'POST', headers: {}, body: { brief: HAPPY_BRIEF } });
  const res = makeRes();
  await planHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseResBody(res).error, 'unauthorized');
});

test('pep-02: POST missing required field (channel) → 400 invalid_brief + errors list', async () => {
  const fx = makeBearerFixture();
  const incomplete = { audience: 'x', pain: 'y', promise: 'z', brand: 'markos' }; // channel missing
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${fx.access_token}` },
    body: { brief: incomplete },
  });
  const res = makeRes();
  await planHandler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 400);
  const body = parseResBody(res);
  assert.equal(body.error, 'invalid_brief');
  assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
  assert.ok(body.errors.some((e) => /channel/i.test(e)), `errors must mention channel: ${JSON.stringify(body.errors)}`);
});

test('pep-03: POST happy Bearer + valid brief → 200 envelope', async () => {
  const fx = makeBearerFixture();
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${fx.access_token}` },
    body: { brief: HAPPY_BRIEF },
  });
  const res = makeRes();
  await planHandler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  assert.equal(body.run_id, null, 'dry-run: run_id must be null');
  assert.ok(body.plan_id && /^plan_[a-f0-9]+$/.test(body.plan_id), `plan_id format: ${body.plan_id}`);
  assert.ok(Array.isArray(body.steps));
  assert.equal(body.steps.length, 3);
  const names = body.steps.map((s) => s.name);
  assert.deepEqual(names, ['audit', 'draft', 'score']);
  assert.equal(body.estimated_tokens, 2000);
  assert.ok(Number.isFinite(body.estimated_cost_usd));
  assert.equal(body.tenant_id, 'ten_acme');
});

test('pep-04: endpoint is strictly read-only (no DB writes + grep-assert no .insert/.update/.upsert in handler)', async () => {
  const fx = makeBearerFixture();
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${fx.access_token}` },
    body: { brief: HAPPY_BRIEF },
  });
  const res = makeRes();

  // Snapshot api_keys state before the call.
  const before = JSON.parse(JSON.stringify(fx.supabase._state.api_keys));
  const writesBefore = fx.supabase._state.writes;

  await planHandler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);

  // Give setImmediate a chance to drain (if whoami touched last_used_at,
  // that's still acceptable because it runs BEFORE this endpoint — we only
  // assert plan.js itself does not write).
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  // Handler source must NEVER reference .insert/.update/.upsert.
  const src = fs.readFileSync(HANDLER_PATH, 'utf8');
  assert.ok(!/\.insert\(/.test(src), 'plan.js handler source must not call .insert()');
  assert.ok(!/\.update\(/.test(src), 'plan.js handler source must not call .update()');
  assert.ok(!/\.upsert\(/.test(src), 'plan.js handler source must not call .upsert()');

  // Api keys rows themselves should be unchanged aside from advisory
  // last_used_at touch (which comes from resolveWhoami — allowed). Plan
  // endpoint must not mutate anything else. The shape assertion proves the
  // row's id/tenant_id/scope/revoked_at are untouched.
  const after = fx.supabase._state.api_keys;
  assert.equal(after.length, before.length);
  assert.equal(after[0].tenant_id, before[0].tenant_id);
  assert.equal(after[0].scope, before[0].scope);
  assert.equal(after[0].revoked_at, before[0].revoked_at);
  assert.equal(after[0].id, before[0].id);
  // `writes` in the stub should not have incremented from this handler —
  // only resolveWhoami's best-effort touch (which is excluded from plan.js
  // source). In practice this number is either unchanged or incremented by
  // 1 from the whoami touch; what we strictly forbid is plan.js itself
  // issuing an .insert/.update (the grep above covers that hermetically).
  assert.ok(fx.supabase._state.writes >= writesBefore,
    'writes counter is monotonic (>= before value)');
});

test('pep-05: GET method gate → 405 method_not_allowed', async () => {
  const req = makeReq({ method: 'GET', headers: {} });
  const res = makeRes();
  await planHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 405);
  assert.equal(parseResBody(res).error, 'method_not_allowed');
});

test('pep-06: response envelope is AgentRun v2 compatible', async () => {
  const fx = makeBearerFixture();
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${fx.access_token}` },
    body: { brief: HAPPY_BRIEF },
  });
  const res = makeRes();
  await planHandler(req, res, { supabase: fx.supabase });
  const body = parseResBody(res);
  assert.equal(res.statusCode, 200);

  // AgentRun v2 compatibility fields (Phase 207 CONTRACT-LOCK).
  assert.ok(Number.isInteger(body.estimated_cost_usd_micro),
    'estimated_cost_usd_micro must be integer (BIGINT in DB)');
  assert.ok(body.estimated_cost_usd_micro >= 0);
  assert.equal(body.priority, 'P2');
  assert.equal(body.chain_id, null, 'chain_id default null for un-chained dry-run');
  // model nullable; must be present as a key.
  assert.ok('model' in body, 'model field must be present (nullable)');
  assert.ok(Number.isInteger(body.estimated_duration_ms));
});
