'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const {
  hashToken, createSession, lookupSession, touchSession, revokeSession,
  listSessionsForTenant, listSessionsForUser, ROLLING_TTL_MS,
} = require('../../lib/markos/mcp/sessions.cjs');

function mockClient(state = {}) {
  state.sessions = state.sessions || [];
  state.tenants = state.tenants || { t1: { status: 'active' }, t_off: { status: 'offboarding' } };
  state.audit = state.audit || [];

  const sessionsTable = {
    insert: async (row) => { state.sessions.push({ ...row, revoked_at: null, revoke_reason: null }); return { error: null }; },
    select: (_cols) => {
      const q = { _filters: [], _isNullFilters: [] };
      q.eq = (col, val) => { q._filters.push([col, val]); return q; };
      q.is = (col, val) => { q._isNullFilters.push([col, val]); return q; };
      q.maybeSingle = async () => {
        const row = state.sessions.find(r =>
          q._filters.every(([c, v]) => r[c] === v)
          && q._isNullFilters.every(([c, v]) => (v === null ? r[c] == null : r[c] === v))
        );
        return row ? { data: row, error: null } : { data: null, error: null };
      };
      q.order = () => Promise.resolve({
        data: state.sessions.filter(r =>
          q._filters.every(([c, v]) => r[c] === v)
          && q._isNullFilters.every(([c, v]) => (v === null ? r[c] == null : r[c] === v))
        ),
        error: null,
      });
      return q;
    },
    update: (patch) => {
      const u = { _filters: [], _isNullFilters: [] };
      const applyAndResolve = () => {
        state.sessions.forEach(r => {
          const matchEq = u._filters.every(([c, v]) => r[c] === v);
          const matchIs = u._isNullFilters.every(([c, v]) => (v === null ? r[c] == null : r[c] === v));
          if (matchEq && matchIs) Object.assign(r, patch);
        });
        return Promise.resolve({ error: null });
      };
      u.eq = (col, val) => { u._filters.push([col, val]); return u; };
      u.is = (col, val) => { u._isNullFilters.push([col, val]); return u; };
      // Make the whole chain thenable so `await client.from(...).update(...).eq(...)` resolves.
      u.then = (onFulfilled, onRejected) => applyAndResolve().then(onFulfilled, onRejected);
      return u;
    },
  };

  const tenantsTable = {
    select: () => ({
      eq: (col, val) => ({
        maybeSingle: async () => state.tenants[val]
          ? { data: { status: state.tenants[val].status }, error: null }
          : { data: null, error: null },
      }),
    }),
  };

  const stagingTable = {
    insert: (row) => ({
      select: () => ({
        single: async () => { state.audit.push(row); return { data: { id: state.audit.length }, error: null }; },
      }),
    }),
  };

  return {
    from: (name) => {
      if (name === 'markos_mcp_sessions') return sessionsTable;
      if (name === 'markos_tenants') return tenantsTable;
      if (name === 'markos_audit_log_staging') return stagingTable;
      // Fallback stub
      return {
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) }),
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      };
    },
    state,
  };
}

test('Suite 202-01: hashToken produces deterministic 64-char lowercase hex', () => {
  const a = hashToken('a'.repeat(64));
  const b = hashToken('a'.repeat(64));
  assert.equal(a, b);
  assert.equal(a.length, 64);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('Suite 202-01: hashToken matches crypto.sha256 reference', () => {
  const h = hashToken('deadbeef'.repeat(8));
  const ref = createHash('sha256').update('deadbeef'.repeat(8)).digest('hex');
  assert.equal(h, ref);
});

test('Suite 202-01: ROLLING_TTL_MS equals 24 hours', () => {
  assert.equal(ROLLING_TTL_MS, 24 * 60 * 60 * 1000);
});

test('Suite 202-01: createSession stores hash not plaintext token', async () => {
  const c = mockClient();
  const { opaque_token } = await createSession(c, {
    user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli', scopes: ['read'], plan_tier: 'free',
  });
  assert.equal(opaque_token.length, 64);
  assert.ok(c.state.sessions[0].token_hash);
  assert.notEqual(c.state.sessions[0].token_hash, opaque_token);
  assert.equal(c.state.sessions[0].token_hash, hashToken(opaque_token));
});

test('Suite 202-01: createSession emits source_domain=mcp audit action=session.created', async () => {
  const c = mockClient();
  await createSession(c, { user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli' });
  const audit = c.state.audit[0];
  assert.equal(audit?.source_domain, 'mcp');
  assert.equal(audit?.action, 'session.created');
});

test('Suite 202-01: createSession rejects offboarding tenant', async () => {
  const c = mockClient();
  await assert.rejects(
    () => createSession(c, { user_id: 'u1', tenant_id: 't_off', org_id: 'o1', client_id: 'cli' }),
    /tenant_unavailable/,
  );
});

test('Suite 202-01: createSession rejects unknown tenant', async () => {
  const c = mockClient();
  await assert.rejects(
    () => createSession(c, { user_id: 'u1', tenant_id: 'nope', org_id: 'o1', client_id: 'cli' }),
    /invalid_tenant/,
  );
});

test('Suite 202-01: lookupSession returns null for unknown token', async () => {
  const c = mockClient();
  const r = await lookupSession(c, 'a'.repeat(64));
  assert.equal(r, null);
});

test('Suite 202-01: lookupSession returns session data but NEVER token_hash', async () => {
  const c = mockClient();
  const { opaque_token } = await createSession(c, { user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli' });
  const r = await lookupSession(c, opaque_token);
  assert.ok(r);
  assert.equal(r.tenant_id, 't1');
  assert.equal(r.token_hash, undefined);
  assert.equal(r.revoked_at, undefined);
});

test('Suite 202-01: lookupSession returns null when expires_at is past', async () => {
  const c = mockClient();
  const { opaque_token } = await createSession(c, { user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli' });
  c.state.sessions[0].expires_at = new Date(Date.now() - 1000).toISOString();
  const r = await lookupSession(c, opaque_token);
  assert.equal(r, null);
});

test('Suite 202-01: lookupSession returns null when revoked', async () => {
  const c = mockClient();
  const { opaque_token } = await createSession(c, { user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli' });
  c.state.sessions[0].revoked_at = new Date().toISOString();
  const r = await lookupSession(c, opaque_token);
  assert.equal(r, null);
});

test('Suite 202-01: touchSession extends expires_at ~24h from now', async () => {
  const c = mockClient();
  const { session_id } = await createSession(c, { user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli' });
  c.state.sessions[0].expires_at = new Date(Date.now() + 60_000).toISOString();
  await touchSession(c, session_id);
  const exp = new Date(c.state.sessions[0].expires_at).getTime();
  const expected = Date.now() + ROLLING_TTL_MS;
  assert.ok(Math.abs(exp - expected) < 5_000, `extended expires_at should be ~24h from now, got delta ${exp - expected}`);
});

test('Suite 202-01: revokeSession sets revoked_at and emits audit', async () => {
  const c = mockClient();
  const { session_id } = await createSession(c, { user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli' });
  await revokeSession(c, { session_id, actor_id: 'u1', reason: 'user_revoked' });
  assert.ok(c.state.sessions[0].revoked_at);
  assert.equal(c.state.sessions[0].revoke_reason, 'user_revoked');
  assert.ok(c.state.audit.some(a => a.source_domain === 'mcp' && a.action === 'session.revoked'));
});

test('Suite 202-01: listSessionsForTenant omits token_hash from projection', async () => {
  const c = mockClient();
  await createSession(c, { user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli' });
  const list = await listSessionsForTenant(c, 't1');
  assert.ok(Array.isArray(list));
  assert.equal(list.length, 1);
  assert.equal(list[0].tenant_id, 't1');
});

test('Suite 202-01: listSessionsForUser returns rows for that user only', async () => {
  const c = mockClient();
  await createSession(c, { user_id: 'u1', tenant_id: 't1', org_id: 'o1', client_id: 'cli' });
  const list = await listSessionsForUser(c, 'u1');
  assert.ok(Array.isArray(list));
  assert.equal(list.length, 1);
  assert.equal(list[0].user_id, 'u1');
});

// ---------------------------------------------------------------------------
// Task 3: Cron cleanup endpoint (api/mcp/session/cleanup.js)
// ---------------------------------------------------------------------------
const { handleCleanup } = require('../../api/mcp/session/cleanup.js');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    writeHead(code, headers) { this.statusCode = code; if (headers) Object.assign(this.headers, headers); },
    setHeader(k, v) { this.headers[k] = v; },
    end(b) { this.body = b; return this; },
  };
}

function cleanupClient(purgedRows = []) {
  const state = { orFilters: [] };
  return {
    from: () => ({
      delete: () => ({
        or: (filter) => {
          state.orFilters.push(filter);
          return {
            select: async () => ({ data: purgedRows, error: null }),
          };
        },
      }),
    }),
    state,
  };
}

test('Suite 202-01: cleanup endpoint rejects when MARKOS_MCP_CRON_SECRET unset', async () => {
  delete process.env.MARKOS_MCP_CRON_SECRET;
  const req = { method: 'POST', headers: {} };
  const res = mockRes();
  await handleCleanup(req, res, { client: cleanupClient() });
  assert.equal(res.statusCode, 401);
});

test('Suite 202-01: cleanup endpoint rejects when secret header mismatches', async () => {
  process.env.MARKOS_MCP_CRON_SECRET = 'expected';
  const req = { method: 'POST', headers: { 'x-markos-cron-secret': 'wrong' } };
  const res = mockRes();
  await handleCleanup(req, res, { client: cleanupClient() });
  assert.equal(res.statusCode, 401);
  delete process.env.MARKOS_MCP_CRON_SECRET;
});

test('Suite 202-01: cleanup endpoint returns { success:true, purged:n } on Bearer auth', async () => {
  process.env.MARKOS_MCP_CRON_SECRET = 'xyz';
  const req = { method: 'POST', headers: { authorization: 'Bearer xyz' } };
  const res = mockRes();
  await handleCleanup(req, res, { client: cleanupClient([{ id: 'a' }, { id: 'b' }]) });
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.success, true);
  assert.equal(parsed.purged, 2);
  delete process.env.MARKOS_MCP_CRON_SECRET;
});

test('Suite 202-01: cleanup endpoint accepts x-markos-cron-secret header', async () => {
  process.env.MARKOS_MCP_CRON_SECRET = 'xyz';
  const req = { method: 'POST', headers: { 'x-markos-cron-secret': 'xyz' } };
  const res = mockRes();
  await handleCleanup(req, res, { client: cleanupClient([]) });
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.success, true);
  assert.equal(parsed.purged, 0);
  delete process.env.MARKOS_MCP_CRON_SECRET;
});

test('Suite 202-01: cleanup endpoint rejects non-POST/GET methods', async () => {
  process.env.MARKOS_MCP_CRON_SECRET = 'xyz';
  const req = { method: 'DELETE', headers: { 'x-markos-cron-secret': 'xyz' } };
  const res = mockRes();
  await handleCleanup(req, res, { client: cleanupClient() });
  assert.equal(res.statusCode, 405);
  delete process.env.MARKOS_MCP_CRON_SECRET;
});
