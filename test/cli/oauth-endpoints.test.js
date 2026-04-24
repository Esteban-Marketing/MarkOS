'use strict';

// Phase 204 Plan 02 Task 2 — OAuth device endpoint unit tests.
//
// Covers:
//   oauth-01: /start missing client_id  → 400 invalid_client
//   oauth-02: /start happy              → 200 with device/user codes
//   oauth-03: /start rate-limit trip    → 429
//   oauth-04: /token wrong grant_type   → 400 unsupported_grant_type
//   oauth-05: /token authorization_pending → 400 with error body
//   oauth-06: /token success            → 200 with access_token
//   oauth-07: /authorize missing auth   → 401
//   oauth-08: /authorize cross-tenant   → 403 cross_tenant_forbidden
//   oauth-09: /authorize happy          → 200 approved + audit row written
//   oauth-10: F-101 YAML shape          → 3 paths + 6 error envelopes + openapi regen landed

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const startHandler = require('../../api/cli/oauth/device/start.js');
const tokenHandler = require('../../api/cli/oauth/device/token.js');
const authorizeHandler = require('../../api/cli/oauth/device/authorize.js');

// ─── Mock req / res ────────────────────────────────────────────────────────

function makeReq({ method = 'POST', url = '/', headers = {}, body = null, query = {} } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = Object.assign({}, headers);
  req.query = query;
  // Expose body as object for readJson() fast-path AND also replay as chunks so
  // readRawBody (token.js) sees a serialized form when the body is an object.
  if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) {
    req.body = body;
  }
  req.socket = { remoteAddress: '127.0.0.1' };
  queueMicrotask(() => {
    if (body !== null && typeof body === 'string') {
      req.emit('data', Buffer.from(body, 'utf8'));
    } else if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) {
      // Serialize per content-type so readRawBody produces a parsable string.
      const ct = (headers['content-type'] || '').toLowerCase();
      const text = ct.includes('urlencoded')
        ? new URLSearchParams(body).toString()
        : JSON.stringify(body);
      req.emit('data', Buffer.from(text, 'utf8'));
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

// ─── Stub Supabase — identical shape to device-flow.test.js stub ──────────

function createStubClient(initial = {}) {
  const state = {
    device_sessions: [...(initial.device_sessions || [])],
    api_keys: [...(initial.api_keys || [])],
    audit_rows: [],
    memberships: [...(initial.memberships || [])],
  };

  function tableFor(name) {
    if (name === 'markos_cli_device_sessions') return state.device_sessions;
    if (name === 'markos_cli_api_keys') return state.api_keys;
    if (name === 'markos_audit_log_staging') return state.audit_rows;
    if (name === 'markos_tenant_memberships') return state.memberships;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    let filters = [];
    let wantsSingle = false;

    const builder = {
      select() { return builder; },
      insert(row) {
        if (Array.isArray(row)) for (const r of row) table.push({ ...r });
        else table.push({ ...row });
        return { data: Array.isArray(row) ? row : [row], error: null };
      },
      update(p) { op = 'update'; patch = p; return builder; },
      eq(col, val) { filters.push({ col, val }); return builder; },
      maybeSingle() { wantsSingle = true; return builder; },
      single() { wantsSingle = true; return builder; },
      then(resolve) {
        const matched = table.filter((r) => filters.every((f) => r[f.col] === f.val));
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

function makeAllowLimiter() {
  return { limit: async () => ({ success: true, reset: Date.now() + 60_000 }) };
}
function makeDenyLimiter() {
  return { limit: async () => ({ success: false, reset: Date.now() + 42_000 }) };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('oauth-01: /start missing client_id → 400 invalid_client', async () => {
  const req = makeReq({ method: 'POST', body: { scope: 'cli' } });
  const res = makeRes();
  await startHandler(req, res, { supabase: createStubClient(), limiter: makeAllowLimiter() });
  assert.equal(res.statusCode, 400);
  assert.equal(parseResBody(res).error, 'invalid_client');
});

test('oauth-02: /start happy → 200 with well-formed device_code + user_code', async () => {
  const req = makeReq({ method: 'POST', body: { client_id: 'markos-cli', scope: 'cli' } });
  const res = makeRes();
  const supabase = createStubClient();
  await startHandler(req, res, { supabase, limiter: makeAllowLimiter() });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  assert.match(body.device_code, /^djNhcl8/);
  assert.match(body.user_code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  assert.equal(body.expires_in, 900);
  assert.equal(body.interval, 5);
  assert.ok(body.verification_uri.startsWith('https://app.markos.com'));
});

test('oauth-03: /start rate-limit trip → 429 with Retry-After', async () => {
  const req = makeReq({ method: 'POST', body: { client_id: 'markos-cli', scope: 'cli' } });
  const res = makeRes();
  await startHandler(req, res, { supabase: createStubClient(), limiter: makeDenyLimiter() });
  assert.equal(res.statusCode, 429);
  assert.equal(parseResBody(res).error, 'rate_limited');
  assert.ok(res.headers['Retry-After']);
});

test('oauth-04: /token wrong grant_type → 400 unsupported_grant_type', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: { grant_type: 'password', device_code: 'x', client_id: 'markos-cli' },
  });
  const res = makeRes();
  await tokenHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 400);
  assert.equal(parseResBody(res).error, 'unsupported_grant_type');
});

test('oauth-05: /token authorization_pending → 400 with error body', async () => {
  const now = new Date();
  const supabase = createStubClient({
    device_sessions: [{
      device_code: 'djNhcl8pending',
      user_code: 'PEND-1234',
      status: 'pending',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      poll_count: 0,
    }],
  });
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: 'djNhcl8pending',
      client_id: 'markos-cli',
    },
  });
  const res = makeRes();
  await tokenHandler(req, res, { supabase });
  assert.equal(res.statusCode, 400);
  assert.equal(parseResBody(res).error, 'authorization_pending');
});

test('oauth-06: /token on approved session → 200 with access_token', async () => {
  const now = new Date();
  const supabase = createStubClient({
    device_sessions: [{
      device_code: 'djNhcl8approved',
      user_code: 'APPR-2345',
      status: 'approved',
      tenant_id: 'ten_demo',
      user_id: 'usr_demo',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      approved_at: now.toISOString(),
      poll_count: 5,
      last_poll_at: new Date(now.getTime() - 10_000).toISOString(),
    }],
  });
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: 'djNhcl8approved',
      client_id: 'markos-cli',
    },
  });
  const res = makeRes();
  await tokenHandler(req, res, { supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  assert.match(body.access_token, /^mks_ak_[a-f0-9]{32,}$/);
  assert.equal(body.token_type, 'bearer');
  assert.equal(body.scope, 'cli');
  assert.equal(body.tenant_id, 'ten_demo');
  assert.equal(supabase._state.api_keys.length, 1);
});

test('oauth-07: /authorize missing auth headers → 401', async () => {
  const req = makeReq({
    method: 'POST',
    headers: {},
    body: { user_code: 'ABCD-EFGH', tenant_id: 'ten_a' },
  });
  const res = makeRes();
  await authorizeHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseResBody(res).error, 'unauthorized');
});

test('oauth-08: /authorize cross-tenant → 403 cross_tenant_forbidden', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_x', 'x-markos-tenant-id': 'ten_header' },
    body: { user_code: 'ABCD-EFGH', tenant_id: 'ten_other' },
  });
  const res = makeRes();
  await authorizeHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 403);
  assert.equal(parseResBody(res).error, 'cross_tenant_forbidden');
});

test('oauth-09: /authorize happy → 200 approved + audit row written', async () => {
  const now = new Date();
  const supabase = createStubClient({
    device_sessions: [{
      device_code: 'djNhcl8authz',
      user_code: 'AUTH-ZXYZ',
      status: 'pending',
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 900_000).toISOString(),
      poll_count: 0,
    }],
    memberships: [{ user_id: 'usr_auth', tenant_id: 'ten_auth', role: 'admin' }],
  });
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_auth', 'x-markos-tenant-id': 'ten_auth' },
    body: { user_code: 'AUTH-ZXYZ', tenant_id: 'ten_auth' },
  });
  const res = makeRes();
  await authorizeHandler(req, res, { supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  assert.equal(body.approved, true);
  assert.ok(body.device_code);

  // Audit row was emitted.
  assert.ok(supabase._state.audit_rows.length >= 1);
  const audit = supabase._state.audit_rows[0];
  assert.equal(audit.source_domain, 'cli');
  assert.equal(audit.action, 'device.approved');
  assert.equal(audit.actor_id, 'usr_auth');
});

test('oauth-09b: /authorize non-admin role → 403 insufficient_role', async () => {
  const supabase = createStubClient({
    memberships: [{ user_id: 'usr_mem', tenant_id: 'ten_mem', role: 'contributor' }],
  });
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_mem', 'x-markos-tenant-id': 'ten_mem' },
    body: { user_code: 'XXXX-YYYY', tenant_id: 'ten_mem' },
  });
  const res = makeRes();
  await authorizeHandler(req, res, { supabase });
  assert.equal(res.statusCode, 403);
  assert.equal(parseResBody(res).error, 'insufficient_role');
});

test('oauth-10: F-101 YAML shape + openapi regen landed', async () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-101-cli-oauth-device-v1.yaml');
  const text = fs.readFileSync(yamlPath, 'utf8');

  // Three paths declared.
  assert.ok(text.includes('/api/cli/oauth/device/start'));
  assert.ok(text.includes('/api/cli/oauth/device/token'));
  assert.ok(text.includes('/api/cli/oauth/device/authorize'));

  // Block-form tags (not inline) — prevents tags-missing regression.
  assert.ok(/\n\s+tags:\n\s+- cli\n\s+- oauth/.test(text), 'tags must be block-form');

  // All six RFC 8628 error envelopes present.
  for (const err of [
    'authorization_pending', 'slow_down', 'expired_token',
    'access_denied', 'invalid_grant', 'invalid_client',
  ]) {
    assert.ok(text.includes(err), `F-101 must declare error envelope: ${err}`);
  }

  // openapi regen must include F-101.
  const openapi = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'contracts', 'openapi.json'), 'utf8'));
  assert.ok(openapi['x-markos-flows']['F-101'], 'openapi.json x-markos-flows must include F-101');
  assert.ok(openapi.paths['/api/cli/oauth/device/start'], 'openapi.json must include /start path');
  assert.ok(openapi.paths['/api/cli/oauth/device/token'], 'openapi.json must include /token path');
  assert.ok(openapi.paths['/api/cli/oauth/device/authorize'], 'openapi.json must include /authorize path');
});
