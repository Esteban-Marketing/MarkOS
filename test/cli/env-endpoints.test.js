'use strict';

// Phase 204 Plan 07 Task 2 — env endpoints (list/pull/push/delete) + F-104 tests.
//
// Covers:
//   ep-01: GET  /api/tenant/env 401 when no auth
//   ep-02: GET  /api/tenant/env happy → { entries } NEVER contains 'value' field
//   ep-03: GET  /api/tenant/env/pull 403 insufficient_role (member)
//   ep-04: GET  /api/tenant/env/pull 500 encryption_key_missing when env unset
//   ep-05: GET  /api/tenant/env/pull happy owner → decrypted entries + audit
//   ep-06: POST /api/tenant/env/push 403 insufficient_role (member)
//   ep-07: POST /api/tenant/env/push 400 invalid_key on lowercase
//   ep-08: POST /api/tenant/env/push 400 too_many_entries at 101 entries
//   ep-09: POST /api/tenant/env/push 400 value_too_large at 8193-char value
//   ep-10: POST /api/tenant/env/push happy → audit row with keys, no values
//   ep-11: POST /api/tenant/env/delete happy owner → deleted count
//   ep-12: F-104 YAML shape — 4 paths + ≥ 6 error envelopes

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const listHandler = require('../../api/tenant/env/list.js');
const pullHandler = require('../../api/tenant/env/pull.js');
const pushHandler = require('../../api/tenant/env/push.js');
const deleteHandler = require('../../api/tenant/env/delete.js');

// ─── Mock req/res ──────────────────────────────────────────────────────────

function makeReq({ method = 'GET', url = '/', headers = {}, body = null } = {}) {
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
  return {
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
}

function parseBody(res) {
  try { return JSON.parse(res.bodyText); } catch { return null; }
}

// ─── Supabase-like stub ────────────────────────────────────────────────────

function createStubClient(initial = {}) {
  const state = {
    env: [...(initial.env || [])],
    audit_rows: [],
    memberships: [...(initial.memberships || [])],
    api_keys: [...(initial.api_keys || [])],
    tenants: [...(initial.tenants || [])],
    users: [...(initial.users || [])],
    rpc_calls: [],
  };

  function tableFor(name) {
    if (name === 'markos_cli_tenant_env') return state.env;
    if (name === 'markos_audit_log_staging') return state.audit_rows;
    if (name === 'markos_tenant_memberships') return state.memberships;
    if (name === 'markos_cli_api_keys') return state.api_keys;
    if (name === 'markos_tenants') return state.tenants;
    if (name === 'markos_users') return state.users;
    throw new Error(`stub: unknown table ${name}`);
  }

  function makeQuery(tableName) {
    const table = tableFor(tableName);
    let op = 'select';
    let patch = null;
    let filters = [];
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
      delete() { op = 'delete'; return builder; },
      eq(col, val) { filters.push({ col, val }); return builder; },
      order(col, { ascending = true } = {}) { orderBy = { col, ascending }; return builder; },
      maybeSingle() { wantsSingle = true; return builder; },
      single() { wantsSingle = true; return builder; },
      then(resolve) {
        let matched = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        if (op === 'update') {
          for (const r of matched) Object.assign(r, patch);
          resolve({ data: wantsSingle ? (matched[0] || null) : matched, error: null });
          return { catch() { return builder; } };
        }
        if (op === 'delete') {
          for (let i = table.length - 1; i >= 0; i--) {
            if (filters.every((f) => table[i][f.col] === f.val)) table.splice(i, 1);
          }
          resolve({ data: [], error: null });
          return { catch() { return builder; } };
        }
        if (orderBy) {
          matched = matched.slice().sort((a, b) => {
            const av = a[orderBy.col], bv = b[orderBy.col];
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

  return {
    from(t) { return makeQuery(t); },
    async rpc(name, args) {
      state.rpc_calls.push({ name, args });
      if (name === 'set_env_entry') {
        const idx = state.env.findIndex((r) =>
          r.tenant_id === args.p_tenant_id && r.key === args.p_key);
        const row = {
          tenant_id: args.p_tenant_id,
          key: args.p_key,
          value_encrypted: `enc(${args.p_value})`,
          value_preview: (args.p_value || '').slice(0, 4) + '…',
          updated_by: args.p_user_id,
          updated_at: new Date().toISOString(),
        };
        if (idx >= 0) Object.assign(state.env[idx], row);
        else state.env.push({ ...row, created_at: new Date().toISOString() });
        return { data: null, error: null };
      }
      if (name === 'get_env_entries') {
        const rows = state.env
          .filter((r) => r.tenant_id === args.p_tenant_id)
          .map((r) => ({
            key: r.key,
            value: String(r.value_encrypted || '').replace(/^enc\(/, '').replace(/\)$/, ''),
          }));
        return { data: rows, error: null };
      }
      return { data: [{ id: 1 }], error: null };
    },
    _state: state,
  };
}

// ─── Common fixtures ───────────────────────────────────────────────────────

function ownerFixtures() {
  return {
    memberships: [{ tenant_id: 'ten_a', user_id: 'usr_owner', role: 'owner' }],
    tenants: [{ id: 'ten_a', name: 'Acme' }],
    users: [{ id: 'usr_owner', email: 'owner@acme.test' }],
    env: [],
  };
}
function memberFixtures() {
  return {
    memberships: [{ tenant_id: 'ten_a', user_id: 'usr_member', role: 'member' }],
    tenants: [{ id: 'ten_a', name: 'Acme' }],
    users: [{ id: 'usr_member', email: 'member@acme.test' }],
    env: [],
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test('ep-01: GET /api/tenant/env 401 when no auth', async () => {
  const req = makeReq({ method: 'GET', headers: {} });
  const res = makeRes();
  await listHandler(req, res, { supabase: createStubClient() });
  assert.equal(res.statusCode, 401);
  assert.equal(parseBody(res).error, 'unauthorized');
});

test('ep-02: GET /api/tenant/env happy → entries never contain `value`', async () => {
  const fx = ownerFixtures();
  fx.env = [
    { tenant_id: 'ten_a', key: 'FOO', value_encrypted: 'enc(secret)', value_preview: 'secr…', updated_at: 't', updated_by: 'usr_owner' },
  ];
  const req = makeReq({
    method: 'GET',
    headers: { 'x-markos-user-id': 'usr_owner', 'x-markos-tenant-id': 'ten_a' },
  });
  const res = makeRes();
  await listHandler(req, res, { supabase: createStubClient(fx) });
  assert.equal(res.statusCode, 200);
  const body = parseBody(res);
  assert.equal(body.entries.length, 1);
  assert.equal(body.entries[0].key, 'FOO');
  assert.equal(body.entries[0].value, undefined, 'list MUST NOT include full value');
  assert.equal(body.entries[0].value_encrypted, undefined);
  // Serialized response must not contain the plaintext secret anywhere.
  assert.ok(!res.bodyText.includes('enc(secret)'), 'list must not leak encrypted blob');
});

test('ep-03: GET /api/tenant/env/pull 403 insufficient_role (member)', async () => {
  const req = makeReq({
    method: 'GET',
    headers: { 'x-markos-user-id': 'usr_member', 'x-markos-tenant-id': 'ten_a' },
  });
  const res = makeRes();
  await pullHandler(req, res, {
    supabase: createStubClient(memberFixtures()),
    encryption_key: 'k-test',
  });
  assert.equal(res.statusCode, 403);
  assert.equal(parseBody(res).error, 'insufficient_role');
});

test('ep-04: GET /api/tenant/env/pull 500 encryption_key_missing', async () => {
  const prev = process.env.MARKOS_ENV_ENCRYPTION_KEY;
  delete process.env.MARKOS_ENV_ENCRYPTION_KEY;
  try {
    const req = makeReq({
      method: 'GET',
      headers: { 'x-markos-user-id': 'usr_owner', 'x-markos-tenant-id': 'ten_a' },
    });
    const res = makeRes();
    await pullHandler(req, res, { supabase: createStubClient(ownerFixtures()) });
    assert.equal(res.statusCode, 500);
    assert.equal(parseBody(res).error, 'encryption_key_missing');
  } finally {
    if (prev) process.env.MARKOS_ENV_ENCRYPTION_KEY = prev;
  }
});

test('ep-05: GET /api/tenant/env/pull happy owner → decrypted entries + audit', async () => {
  const fx = ownerFixtures();
  fx.env = [
    { tenant_id: 'ten_a', key: 'FOO', value_encrypted: 'enc(hello)', value_preview: 'hell…', updated_at: 't', updated_by: 'usr_owner' },
    { tenant_id: 'ten_a', key: 'BAR', value_encrypted: 'enc(world)', value_preview: 'worl…', updated_at: 't', updated_by: 'usr_owner' },
  ];
  const client = createStubClient(fx);
  const req = makeReq({
    method: 'GET',
    headers: { 'x-markos-user-id': 'usr_owner', 'x-markos-tenant-id': 'ten_a' },
  });
  const res = makeRes();
  await pullHandler(req, res, { supabase: client, encryption_key: 'k-test' });
  assert.equal(res.statusCode, 200);
  const body = parseBody(res);
  assert.equal(body.entries.length, 2);
  const valMap = Object.fromEntries(body.entries.map((e) => [e.key, e.value]));
  assert.equal(valMap.FOO, 'hello');
  assert.equal(valMap.BAR, 'world');
  // Audit row present.
  const audit = client._state.audit_rows.find((r) => r.action === 'env.pulled');
  assert.ok(audit, 'audit row for env.pulled missing');
  assert.equal(audit.source_domain, 'cli');
  assert.equal(audit.payload.key_count, 2);
});

test('ep-06: POST /api/tenant/env/push 403 insufficient_role (member)', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_member', 'x-markos-tenant-id': 'ten_a', 'content-type': 'application/json' },
    body: { entries: [{ key: 'FOO', value: 'bar' }] },
  });
  const res = makeRes();
  await pushHandler(req, res, {
    supabase: createStubClient(memberFixtures()),
    encryption_key: 'k-test',
  });
  assert.equal(res.statusCode, 403);
  assert.equal(parseBody(res).error, 'insufficient_role');
});

test('ep-07: POST /api/tenant/env/push 400 invalid_key on lowercase', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_owner', 'x-markos-tenant-id': 'ten_a', 'content-type': 'application/json' },
    body: { entries: [{ key: 'lowercase', value: 'bar' }] },
  });
  const res = makeRes();
  await pushHandler(req, res, {
    supabase: createStubClient(ownerFixtures()),
    encryption_key: 'k-test',
  });
  assert.equal(res.statusCode, 400);
  assert.equal(parseBody(res).error, 'invalid_key');
});

test('ep-08: POST /api/tenant/env/push 400 too_many_entries at 101', async () => {
  const entries = [];
  for (let i = 0; i < 101; i++) entries.push({ key: `KEY_${i}`, value: 'v' });
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_owner', 'x-markos-tenant-id': 'ten_a', 'content-type': 'application/json' },
    body: { entries },
  });
  const res = makeRes();
  await pushHandler(req, res, {
    supabase: createStubClient(ownerFixtures()),
    encryption_key: 'k-test',
  });
  assert.equal(res.statusCode, 400);
  assert.equal(parseBody(res).error, 'too_many_entries');
});

test('ep-09: POST /api/tenant/env/push 400 value_too_large at 8193 chars', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_owner', 'x-markos-tenant-id': 'ten_a', 'content-type': 'application/json' },
    body: { entries: [{ key: 'FOO', value: 'x'.repeat(8193) }] },
  });
  const res = makeRes();
  await pushHandler(req, res, {
    supabase: createStubClient(ownerFixtures()),
    encryption_key: 'k-test',
  });
  assert.equal(res.statusCode, 400);
  assert.equal(parseBody(res).error, 'value_too_large');
});

test('ep-10: POST /api/tenant/env/push happy → updated count + audit keys (no values)', async () => {
  const client = createStubClient(ownerFixtures());
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_owner', 'x-markos-tenant-id': 'ten_a', 'content-type': 'application/json' },
    body: { entries: [
      { key: 'FOO', value: 'super-secret-one' },
      { key: 'BAR', value: 'super-secret-two' },
    ] },
  });
  const res = makeRes();
  await pushHandler(req, res, { supabase: client, encryption_key: 'k-test' });
  assert.equal(res.statusCode, 200);
  assert.equal(parseBody(res).updated, 2);
  // Endpoint audit has keys + count, never values.
  const endpointAudit = client._state.audit_rows.filter((r) => r.action === 'env.pushed' && r.actor_role === 'owner');
  assert.ok(endpointAudit.length >= 1, 'endpoint audit row for env.pushed missing');
  const payload = JSON.stringify(endpointAudit[0].payload);
  assert.ok(payload.includes('FOO'));
  assert.ok(payload.includes('BAR'));
  assert.ok(!payload.includes('super-secret-one'), 'value leaked into endpoint audit');
  assert.ok(!payload.includes('super-secret-two'), 'value leaked into endpoint audit');
});

test('ep-11: POST /api/tenant/env/delete happy owner → deleted count', async () => {
  const fx = ownerFixtures();
  fx.env = [
    { tenant_id: 'ten_a', key: 'FOO', value_encrypted: 'enc(a)', value_preview: 'a…', updated_by: 'usr_owner', updated_at: 't' },
    { tenant_id: 'ten_a', key: 'BAR', value_encrypted: 'enc(b)', value_preview: 'b…', updated_by: 'usr_owner', updated_at: 't' },
  ];
  const client = createStubClient(fx);
  const req = makeReq({
    method: 'POST',
    headers: { 'x-markos-user-id': 'usr_owner', 'x-markos-tenant-id': 'ten_a', 'content-type': 'application/json' },
    body: { keys: ['FOO', 'BAR'] },
  });
  const res = makeRes();
  await deleteHandler(req, res, { supabase: client });
  assert.equal(res.statusCode, 200);
  assert.equal(parseBody(res).deleted, 2);
  assert.equal(client._state.env.length, 0);
  const audit = client._state.audit_rows.find((r) => r.action === 'env.deleted' && r.actor_role === 'owner');
  assert.ok(audit);
  assert.deepEqual(audit.payload.keys.sort(), ['BAR', 'FOO']);
});

test('ep-12: F-104 contract + openapi regen — 4 paths + ≥ 6 error envelopes', () => {
  const yamlPath = path.resolve(REPO_ROOT, 'contracts', 'F-104-cli-env-v1.yaml');
  const openapiPath = path.resolve(REPO_ROOT, 'contracts', 'openapi.json');
  assert.ok(fs.existsSync(yamlPath));
  const yamlText = fs.readFileSync(yamlPath, 'utf8');
  assert.match(yamlText, /F-104/);
  // 4 paths.
  const paths = ['/api/tenant/env', '/api/tenant/env/pull', '/api/tenant/env/push', '/api/tenant/env/delete'];
  for (const p of paths) {
    assert.ok(yamlText.includes(p + ':'), `F-104 missing path ${p}`);
  }
  // ≥ 6 error envelopes.
  const envelopes = [
    'UnauthorizedError', 'InvalidTokenError', 'RevokedTokenError',
    'InsufficientRoleError', 'InvalidKeyError', 'EncryptionKeyMissingError',
  ];
  for (const env of envelopes) {
    assert.match(yamlText, new RegExp(env + ':'), `F-104 missing error envelope ${env}`);
  }
  // openapi regen landed.
  assert.ok(fs.existsSync(openapiPath));
  const doc = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
  assert.ok(doc['x-markos-flows']['F-104'], 'F-104 not in openapi.json x-markos-flows');
  // All 4 paths present.
  for (const p of paths) {
    assert.ok(doc.paths[p], `openapi.json missing path ${p}`);
  }
});
