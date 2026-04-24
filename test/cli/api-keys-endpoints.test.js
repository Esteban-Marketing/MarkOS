'use strict';

// Phase 204 Plan 03 Task 2 — API-keys tenant endpoint unit tests.
//
// Covers:
//   ep-01: GET  /api/tenant/api-keys 401 when no tenant headers
//   ep-02: GET  /api/tenant/api-keys happy → { keys } with NO key_hash leak
//   ep-03: POST /api/tenant/api-keys 401 when no auth
//   ep-04: POST /api/tenant/api-keys 403 insufficient_role when role='member'
//   ep-05: POST /api/tenant/api-keys happy (role='owner') → 201 + access_token + audit row
//   ep-06: POST /api/tenant/api-keys invalid_name (0 or 65+ chars) → 400
//   ep-07: POST /api/tenant/api-keys/{id}/revoke — 401, 403 role, 403 cross-tenant, 404 not-found, 200 happy + audit row
//   ep-08: F-102 YAML shape — 3 paths + 5 error envelopes + block-form tags + openapi regen landed

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const listHandler = require('../../api/tenant/api-keys/list.js');
const createHandler = require('../../api/tenant/api-keys/create.js');
const revokeHandler = require('../../api/tenant/api-keys/[key_id]/revoke.js');

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
      const text = JSON.stringify(body);
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

// ─── Stub Supabase ────────────────────────────────────────────────────────

function createStubClient(initial = {}) {
  const state = {
    api_keys: [...(initial.api_keys || [])],
    audit_rows: [],
    memberships: [...(initial.memberships || [])],
  };

  function tableFor(name) {
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

// ─── Tests ─────────────────────────────────────────────────────────────────

test('ep-01: GET /api/tenant/api-keys 401 when no tenant headers', async () => {
  const req = makeReq({ method: 'GET', headers: {} });
  const res = makeRes();
  await listHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseResBody(res).error, 'unauthorized');
});

test('ep-02: GET /api/tenant/api-keys happy → { keys } with NO key_hash leak', async () => {
  const now = new Date().toISOString();
  const supabase = createStubClient({
    api_keys: [
      { id: 'cak_a', tenant_id: 'ten_ep', name: 'a', key_hash: 'SECRET', key_fingerprint: 'fp11111a', scope: 'cli', created_at: now, last_used_at: null, revoked_at: null },
      { id: 'cak_b', tenant_id: 'ten_ep', name: 'b', key_hash: 'SECRET2', key_fingerprint: 'fp22222b', scope: 'cli', created_at: now, last_used_at: null, revoked_at: new Date(Date.now() - 1000).toISOString() },
      { id: 'cak_c', tenant_id: 'ten_OTHER', name: 'noise', key_hash: 'SECRET3', key_fingerprint: 'fp33333c', scope: 'cli', created_at: now, last_used_at: null, revoked_at: null },
    ],
  });
  const req = makeReq({
    method: 'GET',
    headers: { 'x-markos-user-id': 'usr_ep', 'x-markos-tenant-id': 'ten_ep' },
  });
  const res = makeRes();
  await listHandler(req, res, { supabase });
  assert.equal(res.statusCode, 200);
  const body = parseResBody(res);
  assert.ok(Array.isArray(body.keys));
  assert.equal(body.keys.length, 1, 'revoked + cross-tenant rows must be excluded');
  assert.equal(body.keys[0].id, 'cak_a');
  // key_hash MUST NOT appear anywhere in the response.
  const text = JSON.stringify(body);
  assert.ok(!text.includes('SECRET'), 'key_hash must not leak into list response');
  assert.equal(body.keys[0].key_hash, undefined);
});

test('ep-03: POST /api/tenant/api-keys 401 when no auth headers', async () => {
  const req = makeReq({ method: 'POST', headers: {}, body: {} });
  const res = makeRes();
  await createHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseResBody(res).error, 'unauthorized');
});

test('ep-04: POST /api/tenant/api-keys 403 insufficient_role when role=member', async () => {
  const supabase = createStubClient({
    memberships: [{ user_id: 'usr_m', tenant_id: 'ten_m', role: 'member' }],
  });
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_m', 'x-markos-tenant-id': 'ten_m' },
    body: { name: 'test' },
  });
  const res = makeRes();
  await createHandler(req, res, { supabase });
  assert.equal(res.statusCode, 403);
  const body = parseResBody(res);
  assert.equal(body.error, 'insufficient_role');
  assert.ok(body.required.includes('owner'));
});

test('ep-05: POST /api/tenant/api-keys happy (role=owner) → 201 + access_token + audit row', async () => {
  const supabase = createStubClient({
    memberships: [{ user_id: 'usr_o', tenant_id: 'ten_o', role: 'owner' }],
  });
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_o', 'x-markos-tenant-id': 'ten_o' },
    body: { name: 'prod-key' },
  });
  const res = makeRes();
  await createHandler(req, res, { supabase });
  assert.equal(res.statusCode, 201);
  const body = parseResBody(res);
  assert.ok(body.key_id.startsWith('cak_'));
  assert.match(body.access_token, /^mks_ak_[a-f0-9]{64}$/);
  assert.equal(body.key_fingerprint.length, 8);
  assert.equal(body.name, 'prod-key');
  assert.ok(body.created_at);

  // Exactly one key inserted.
  assert.equal(supabase._state.api_keys.length, 1);
  // Audit row emitted (library emits + endpoint emits = 2; accept >= 1).
  assert.ok(supabase._state.audit_rows.length >= 1);
  const audit = supabase._state.audit_rows.find((a) => a.action === 'api_key.created');
  assert.ok(audit, 'api_key.created audit row must be emitted');
  assert.equal(audit.source_domain, 'cli');
  assert.equal(audit.actor_id, 'usr_o');
  assert.equal(audit.payload.key_id, body.key_id);
  assert.equal(audit.payload.key_fingerprint, body.key_fingerprint);
});

test('ep-06: POST /api/tenant/api-keys invalid_name (too long) → 400', async () => {
  const supabase = createStubClient({
    memberships: [{ user_id: 'usr_o', tenant_id: 'ten_o', role: 'owner' }],
  });
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_o', 'x-markos-tenant-id': 'ten_o' },
    body: { name: 'x'.repeat(200) },
  });
  const res = makeRes();
  await createHandler(req, res, { supabase });
  assert.equal(res.statusCode, 400);
  assert.equal(parseResBody(res).error, 'invalid_name');

  // Empty string → also invalid_name.
  const req2 = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_o', 'x-markos-tenant-id': 'ten_o' },
    body: { name: '' },
  });
  const res2 = makeRes();
  await createHandler(req2, res2, { supabase });
  assert.equal(res2.statusCode, 400);
  assert.equal(parseResBody(res2).error, 'invalid_name');
});

test('ep-07: POST /api/tenant/api-keys/{id}/revoke — 401, 403 role, 403 cross-tenant, 404, 200 happy + audit', async () => {
  // No auth → 401
  {
    const req = makeReq({ method: 'POST', headers: {}, query: { key_id: 'cak_abc' }, body: {} });
    const res = makeRes();
    await revokeHandler(req, res, { supabase: createStubClient() });
    assert.equal(res.statusCode, 401);
  }

  // Member role → 403 insufficient_role
  {
    const supabase = createStubClient({
      memberships: [{ user_id: 'usr_m', tenant_id: 'ten_m', role: 'member' }],
    });
    const req = makeReq({
      method: 'POST',
      headers: { 'x-markos-user-id': 'usr_m', 'x-markos-tenant-id': 'ten_m' },
      query: { key_id: 'cak_abc' },
      body: {},
    });
    const res = makeRes();
    await revokeHandler(req, res, { supabase });
    assert.equal(res.statusCode, 403);
    assert.equal(parseResBody(res).error, 'insufficient_role');
  }

  // Admin role, cross-tenant key → 403 cross_tenant_forbidden
  {
    const supabase = createStubClient({
      memberships: [{ user_id: 'usr_a', tenant_id: 'ten_a', role: 'admin' }],
      api_keys: [
        { id: 'cak_other', tenant_id: 'ten_DIFFERENT', user_id: 'usr_d', key_hash: 'h', key_fingerprint: 'fpother1', scope: 'cli', created_at: new Date().toISOString(), revoked_at: null },
      ],
    });
    const req = makeReq({
      method: 'POST',
      headers: { 'x-markos-user-id': 'usr_a', 'x-markos-tenant-id': 'ten_a' },
      query: { key_id: 'cak_other' },
      body: {},
    });
    const res = makeRes();
    await revokeHandler(req, res, { supabase });
    assert.equal(res.statusCode, 403);
    assert.equal(parseResBody(res).error, 'cross_tenant_forbidden');
  }

  // Admin role, key not found → 404
  {
    const supabase = createStubClient({
      memberships: [{ user_id: 'usr_a', tenant_id: 'ten_a', role: 'admin' }],
    });
    const req = makeReq({
      method: 'POST',
      headers: { 'x-markos-user-id': 'usr_a', 'x-markos-tenant-id': 'ten_a' },
      query: { key_id: 'cak_ghost' },
      body: {},
    });
    const res = makeRes();
    await revokeHandler(req, res, { supabase });
    assert.equal(res.statusCode, 404);
    assert.equal(parseResBody(res).error, 'key_not_found');
  }

  // Happy path → 200 + audit emitted
  {
    const supabase = createStubClient({
      memberships: [{ user_id: 'usr_a', tenant_id: 'ten_rev', role: 'admin' }],
      api_keys: [
        { id: 'cak_rvok', tenant_id: 'ten_rev', user_id: 'usr_a', key_hash: 'h', key_fingerprint: 'fprvok', scope: 'cli', created_at: new Date().toISOString(), revoked_at: null },
      ],
    });
    const req = makeReq({
      method: 'POST',
      headers: { 'x-markos-user-id': 'usr_a', 'x-markos-tenant-id': 'ten_rev' },
      query: { key_id: 'cak_rvok' },
      body: {},
    });
    const res = makeRes();
    await revokeHandler(req, res, { supabase });
    assert.equal(res.statusCode, 200);
    const body = parseResBody(res);
    assert.ok(body.revoked_at, 'response must include revoked_at');

    // Row mutated.
    assert.ok(supabase._state.api_keys[0].revoked_at);
    // Audit row emitted.
    const audit = supabase._state.audit_rows.find((a) => a.action === 'api_key.revoked');
    assert.ok(audit, 'api_key.revoked audit row must be emitted');
    assert.equal(audit.source_domain, 'cli');
    assert.equal(audit.actor_id, 'usr_a');
    assert.equal(audit.payload.key_id, 'cak_rvok');
  }
});

test('ep-08: F-102 YAML shape + openapi regen landed', () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-102-cli-api-keys-v1.yaml');
  const text = fs.readFileSync(yamlPath, 'utf8');

  // Three paths (list uses same path for GET+POST; revoke uses {key_id}).
  assert.ok(text.includes('/api/tenant/api-keys:'));
  assert.ok(text.includes('/api/tenant/api-keys/{key_id}/revoke:'));

  // Block-form tags — prevents regression of the 203 tags-missing issue.
  assert.ok(/\n\s+tags:\n\s+- cli\n\s+- api-keys/.test(text), 'tags must be block-form');

  // Error envelopes declared.
  for (const err of [
    'insufficient_role', 'cross_tenant_forbidden', 'key_not_found',
    'invalid_name', 'unauthorized', 'method_not_allowed',
  ]) {
    assert.ok(text.includes(err), `F-102 must declare error envelope: ${err}`);
  }

  // F-102 flow_id present.
  assert.ok(/flow_id:\s*F-102/.test(text));

  // openapi regen must include F-102.
  const openapi = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'contracts', 'openapi.json'), 'utf8'));
  assert.ok(openapi['x-markos-flows']['F-102'], 'openapi.json x-markos-flows must include F-102');
  assert.ok(openapi.paths['/api/tenant/api-keys'], 'openapi.json must include list/create path');
  assert.ok(openapi.paths['/api/tenant/api-keys/{key_id}/revoke'], 'openapi.json must include revoke path');
  const flowCount = Object.keys(openapi['x-markos-flows']).length;
  assert.ok(flowCount >= 66, `flow count must be >= 66 after F-102 merge (saw ${flowCount})`);
});
