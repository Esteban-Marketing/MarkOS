'use strict';

// Phase 204 Plan 04 Task 1 — resolveWhoami library + /api/tenant/whoami endpoint unit tests.
//
// Covers:
//   ep-01: GET no auth + no legacy headers → 401 unauthorized
//   ep-02: GET malformed Authorization header (no 'Bearer ' prefix) → 401 unauthorized
//   ep-03: GET valid Bearer → 200 with full envelope { tenant_id, tenant_name, role, email,
//          user_id, key_fingerprint, scope='cli', last_used_at } + no Bearer/hash leak
//   ep-04: GET revoked Bearer → 401 revoked_token + hint
//   ep-05: GET legacy session headers (x-markos-user-id + x-markos-tenant-id) → 200 envelope
//          with scope='session' + key_fingerprint=null
//   ep-06: GET legacy session header with orphaned user_id → 401 invalid_token
//   ep-07: F-105 YAML shape — loadable + has whoami GET + status placeholder marker
//   ep-08: last_used_at async touch — after resolveWhoami, DB row has a fresh last_used_at

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const whoamiHandler = require('../../api/tenant/whoami.js');
const { resolveWhoami } = require('../../lib/markos/cli/whoami.cjs');

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
    users: [...(initial.users || [])],
    memberships: [...(initial.memberships || [])],
    audit_rows: [],
  };

  function tableFor(name) {
    if (name === 'markos_cli_api_keys') return state.api_keys;
    if (name === 'markos_tenants') return state.tenants;
    if (name === 'markos_users') return state.users;
    if (name === 'markos_tenant_memberships') return state.memberships;
    if (name === 'markos_audit_log_staging') return state.audit_rows;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    let filters = [];
    let isFilters = [];
    let wantsSingle = false;
    let orderBy = null;

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
      order(col, { ascending = true } = {}) { orderBy = { col, ascending }; return builder; },
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
        if (orderBy) {
          matched = matched.slice().sort((a, b) => {
            const av = a[orderBy.col];
            const bv = b[orderBy.col];
            if (av === bv) return 0;
            const cmp = String(av).localeCompare(String(bv));
            return orderBy.ascending ? cmp : -cmp;
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
  // Seed a fully populated stub with a known Bearer token.
  const access_token = 'mks_ak_' + 'a'.repeat(64);
  const key_hash = sha256Hex(access_token);
  const key_fingerprint = key_hash.slice(0, 8);
  const now = new Date().toISOString();

  const api_key_row = Object.assign({
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
  }, overrides.api_key || {});

  return {
    access_token,
    key_hash,
    key_fingerprint,
    supabase: createStubClient({
      api_keys: [api_key_row],
      tenants: [{ id: 'ten_acme', name: 'Acme Inc' }],
      users: [{ id: 'usr_sam', email: 'sam@acme.com' }],
      memberships: [{ tenant_id: 'ten_acme', user_id: 'usr_sam', role: 'owner' }],
    }),
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('ep-01: GET /api/tenant/whoami no auth + no legacy headers → 401 unauthorized', async () => {
  const req = makeReq({ method: 'GET', headers: {} });
  const res = makeRes();
  await whoamiHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseResBody(res).error, 'unauthorized');
});

test('ep-02: GET /api/tenant/whoami malformed Bearer (no prefix) → 401 unauthorized', async () => {
  // No 'Bearer ' prefix — extractBearer returns null, and no legacy headers
  // are present, so the handler returns 401 unauthorized (not invalid_token).
  const req = makeReq({
    method: 'GET',
    headers: { authorization: 'mks_ak_notabearer' },
  });
  const res = makeRes();
  await whoamiHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseResBody(res).error, 'unauthorized');
});

test('ep-03: GET /api/tenant/whoami valid Bearer → 200 full envelope + no hash leak', async () => {
  const fx = makeBearerFixture();
  const req = makeReq({
    method: 'GET',
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await whoamiHandler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);

  assert.equal(body.tenant_id, 'ten_acme');
  assert.equal(body.tenant_name, 'Acme Inc');
  assert.equal(body.role, 'owner');
  assert.equal(body.email, 'sam@acme.com');
  assert.equal(body.user_id, 'usr_sam');
  assert.equal(body.key_fingerprint, fx.key_fingerprint);
  assert.equal(body.scope, 'cli');
  // last_used_at may be null (never used) or a timestamp — shape only.
  assert.ok(body.last_used_at === null || typeof body.last_used_at === 'string');

  // Bearer token, key_hash, and key_id must NOT appear in the response.
  const text = JSON.stringify(body);
  assert.ok(!text.includes(fx.access_token), 'Bearer token must not leak into response');
  assert.ok(!text.includes(fx.key_hash), 'key_hash must not leak into response');
  assert.ok(!text.includes('cak_abc123'), 'key_id must not leak into whoami envelope');
  assert.equal(body.key_hash, undefined);
  assert.equal(body.access_token, undefined);
});

test('ep-04: GET /api/tenant/whoami revoked Bearer → 401 revoked_token + hint', async () => {
  const fx = makeBearerFixture({
    api_key: { revoked_at: new Date(Date.now() - 1000).toISOString() },
  });
  const req = makeReq({
    method: 'GET',
    headers: { authorization: `Bearer ${fx.access_token}` },
  });
  const res = makeRes();
  await whoamiHandler(req, res, { supabase: fx.supabase });
  assert.equal(res.statusCode, 401);
  const body = parseResBody(res);
  assert.equal(body.error, 'revoked_token');
  assert.ok(body.hint && /markos login/i.test(body.hint), 'hint must mention markos login');
});

test('ep-05: GET /api/tenant/whoami legacy session headers → 200 envelope scope=session', async () => {
  const supabase = createStubClient({
    tenants: [{ id: 'ten_legacy', name: 'Legacy Corp' }],
    users: [{ id: 'usr_eve', email: 'eve@legacy.example' }],
    memberships: [{ tenant_id: 'ten_legacy', user_id: 'usr_eve', role: 'admin' }],
  });
  const req = makeReq({
    method: 'GET',
    headers: {
      'x-markos-user-id': 'usr_eve',
      'x-markos-tenant-id': 'ten_legacy',
    },
  });
  const res = makeRes();
  await whoamiHandler(req, res, { supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  assert.equal(body.tenant_id, 'ten_legacy');
  assert.equal(body.tenant_name, 'Legacy Corp');
  assert.equal(body.role, 'admin');
  assert.equal(body.email, 'eve@legacy.example');
  assert.equal(body.user_id, 'usr_eve');
  assert.equal(body.scope, 'session');
  assert.equal(body.key_fingerprint, null);
  assert.equal(body.last_used_at, null);
});

test('ep-06: GET /api/tenant/whoami orphaned legacy session → 401 invalid_token', async () => {
  // No user row seeded — user_id is orphaned / session purged.
  const supabase = createStubClient({
    tenants: [{ id: 'ten_acme', name: 'Acme Inc' }],
    memberships: [],
    users: [],
  });
  const req = makeReq({
    method: 'GET',
    headers: {
      'x-markos-user-id': 'usr_ghost',
      'x-markos-tenant-id': 'ten_acme',
    },
  });
  const res = makeRes();
  await whoamiHandler(req, res, { supabase });
  assert.equal(res.statusCode, 401);
  assert.equal(parseResBody(res).error, 'invalid_token');
});

test('ep-07: F-105 YAML shape + openapi regen landed', () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-105-cli-whoami-status-v1.yaml');
  const text = fs.readFileSync(yamlPath, 'utf8');

  // flow_id + paths present.
  assert.ok(/flow_id:\s*F-105/.test(text), 'F-105 flow_id declared');
  assert.ok(text.includes('/api/tenant/whoami:'), 'whoami path present');
  assert.ok(text.includes('/api/tenant/status:'), 'status placeholder path present');

  // Status placeholder marker — Plan 204-08 will grep for this.
  assert.ok(/204-08-PLAN/.test(text), 'status path carries x-markos-phase: 204-08-PLAN marker');

  // Block-form tags (prevents 203 tags-missing regression).
  assert.ok(/\n\s+tags:\n\s+- cli\n\s+- whoami/.test(text), 'whoami tags must be block-form');

  // Error envelopes.
  for (const err of ['unauthorized', 'invalid_token', 'revoked_token', 'method_not_allowed']) {
    assert.ok(text.includes(err), `F-105 must declare error envelope: ${err}`);
  }

  // openapi regen must include F-105 + whoami path + 67 flows.
  const openapi = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'contracts', 'openapi.json'), 'utf8'));
  assert.ok(openapi['x-markos-flows']['F-105'], 'openapi.json x-markos-flows must include F-105');
  assert.ok(openapi.paths['/api/tenant/whoami'], 'openapi.json must include whoami path');
  assert.ok(openapi.paths['/api/tenant/status'], 'openapi.json must include status placeholder path');
  const flowCount = Object.keys(openapi['x-markos-flows']).length;
  assert.ok(flowCount >= 67, `flow count must be >= 67 after F-105 merge (saw ${flowCount})`);
});

test('ep-08: last_used_at async touch — after resolveWhoami, DB row gains a fresh timestamp', async () => {
  const fx = makeBearerFixture();
  // Pre-assert: never used.
  assert.equal(fx.supabase._state.api_keys[0].last_used_at, null);

  await resolveWhoami({ client: fx.supabase, key_hash: fx.key_hash });

  // The async setImmediate touch is scheduled on next tick. Wait for it to
  // land before asserting.
  await new Promise((resolve) => setImmediate(resolve));
  // One more microtask tick for the update promise to resolve.
  await new Promise((resolve) => setImmediate(resolve));

  const row = fx.supabase._state.api_keys[0];
  assert.ok(
    row.last_used_at && typeof row.last_used_at === 'string',
    `last_used_at must be touched after resolveWhoami (saw ${row.last_used_at})`,
  );
  // Must be a recent ISO timestamp.
  assert.ok(!Number.isNaN(Date.parse(row.last_used_at)));
});
