'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { handleUsage } = require('../../api/tenant/mcp/usage.js');
const { handleList } = require('../../api/tenant/mcp/sessions/list.js');
const { handleRevoke } = require('../../api/tenant/mcp/sessions/revoke.js');
const { handleBreakdown } = require('../../api/tenant/mcp/cost-breakdown.js');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    writeHead(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(this.headers, hdrs); },
    status(c) { this.statusCode = c; return this; },
    end(b) { this.body = b; return this; },
  };
}
function mockReq(method, body, headers = {}) {
  const chunks = body ? [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))] : [];
  return {
    method,
    headers,
    url: '/',
    on(evt, cb) {
      if (evt === 'data') chunks.forEach(cb);
      if (evt === 'end') setImmediate(cb);
    },
  };
}

test('Suite 202-09: /api/tenant/mcp/usage 401 without headers', async () => {
  const res = mockRes();
  await handleUsage(mockReq('GET'), res);
  assert.equal(res.statusCode, 401);
});

test('Suite 202-09: /api/tenant/mcp/usage returns { spent_cents, cap_cents, plan_tier, reset_at, window_start }', async () => {
  const supabase = {
    from(name) {
      if (name === 'markos_orgs') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan_tier: 'team' } }) }) }) };
      if (name === 'markos_mcp_cost_window') return { select: () => ({ eq: () => ({ gt: async () => ({ data: [{ spent_cents: 42, window_start: new Date(Date.now() - 3600_000).toISOString() }] }) }) }) };
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
    },
  };
  const res = mockRes();
  await handleUsage(mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't', 'x-markos-org-id': 'o' }), res, { supabase });
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.tenant_id, 't');
  assert.equal(parsed.spent_cents, 42);
  assert.equal(parsed.cap_cents, 10000);
  assert.equal(parsed.plan_tier, 'team');
  assert.ok(parsed.reset_at);
});

test('Suite 202-09: /api/tenant/mcp/usage returns cap 100 for free tier (D-21)', async () => {
  const supabase = {
    from(name) {
      if (name === 'markos_orgs') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan_tier: 'free' } }) }) }) };
      if (name === 'markos_mcp_cost_window') return { select: () => ({ eq: () => ({ gt: async () => ({ data: [] }) }) }) };
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
    },
  };
  const res = mockRes();
  await handleUsage(mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't', 'x-markos-org-id': 'o' }), res, { supabase });
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.cap_cents, 100);
  assert.equal(parsed.spent_cents, 0);
});

test('Suite 202-09: /api/tenant/mcp/sessions returns shaped list (token_hash NEVER present)', async () => {
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({
              data: [
                { id: 'mcp-sess-1', user_id: 'u', tenant_id: 't', client_id: 'cli', scopes: ['read'], created_at: 'x', last_used_at: 'y', expires_at: 'z' },
              ],
              error: null,
            }),
          }),
        }),
      }),
    }),
  };
  const res = mockRes();
  await handleList(mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't' }), res, { supabase });
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.sessions.length, 1);
  assert.equal(parsed.sessions[0].id, 'mcp-sess-1');
  assert.equal(parsed.sessions[0].token_hash, undefined);
});

test('Suite 202-09: /api/tenant/mcp/sessions 401 without headers', async () => {
  const res = mockRes();
  await handleList(mockReq('GET'), res);
  assert.equal(res.statusCode, 401);
});

test('Suite 202-09: /api/tenant/mcp/sessions/revoke rejects cross-tenant session', async () => {
  const supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'mcp-sess-x', tenant_id: 'other-tenant' }, error: null }) }) }),
    }),
  };
  const res = mockRes();
  await handleRevoke(mockReq('POST', { session_id: 'mcp-sess-x' }, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't' }), res, { supabase });
  assert.equal(res.statusCode, 403);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error, 'cross_tenant_forbidden');
});

test('Suite 202-09: /api/tenant/mcp/sessions/revoke returns 404 when session not found', async () => {
  const supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    }),
  };
  const res = mockRes();
  await handleRevoke(mockReq('POST', { session_id: 'mcp-sess-missing' }, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't' }), res, { supabase });
  assert.equal(res.statusCode, 404);
});

test('Suite 202-09: /api/tenant/mcp/sessions/revoke happy path returns { revoked:true, session_id }', async () => {
  const state = { sessions: [{ id: 'mcp-sess-ok', tenant_id: 't', user_id: 'owner', org_id: 'o' }], audit: [] };
  const supabase = {
    from(name) {
      if (name === 'markos_mcp_sessions') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.sessions[0], error: null }) }) }),
          update: () => ({ eq: () => { state.sessions[0].revoked_at = new Date().toISOString(); return Promise.resolve({ error: null }); } }),
        };
      }
      if (name === 'markos_audit_staging' || name === 'markos_audit_log') {
        return {
          insert: (r) => ({
            select: () => ({
              single: async () => { state.audit.push(r); return { data: { id: 'a1' }, error: null }; },
            }),
          }),
        };
      }
      return { insert: async () => ({ error: null }) };
    },
  };
  const res = mockRes();
  await handleRevoke(mockReq('POST', { session_id: 'mcp-sess-ok' }, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't' }), res, { supabase });
  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.revoked, true);
  assert.equal(parsed.session_id, 'mcp-sess-ok');
});

test('Suite 202-09: /api/tenant/mcp/cost-breakdown aggregates by tool_id + sorts desc', async () => {
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              gt: async () => ({
                data: [
                  { payload: { tool_id: 'draft_message', cost_cents: 3 } },
                  { payload: { tool_id: 'plan_campaign', cost_cents: 5 } },
                  { payload: { tool_id: 'draft_message', cost_cents: 2 } },
                  { payload: { tool_id: 'list_pain_points', cost_cents: 0 } },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    }),
  };
  const res = mockRes();
  await handleBreakdown(mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't' }), res, { supabase });
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.by_tool[0].tool_id, 'plan_campaign'); // highest cost first
  assert.equal(parsed.by_tool[0].total_cost_cents, 5);
  const dm = parsed.by_tool.find(t => t.tool_id === 'draft_message');
  assert.equal(dm.calls, 2);
  assert.equal(dm.total_cost_cents, 5);
});

test('Suite 202-09: cost-breakdown returns tenant_id + window fields', async () => {
  const supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ gt: async () => ({ data: [], error: null }) }) }) }) }),
    }),
  };
  const res = mockRes();
  await handleBreakdown(mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1' }), res, { supabase });
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.tenant_id, 't1');
  assert.ok(parsed.window_start);
  assert.ok(parsed.window_end);
});

test('Suite 202-09: revoke endpoint 400s on missing session_id', async () => {
  const res = mockRes();
  await handleRevoke(mockReq('POST', {}, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't' }), res, { supabase: { from: () => ({}) } });
  assert.equal(res.statusCode, 400);
});

test('Suite 202-09: all 4 handlers reject non-method requests with 405', async () => {
  for (const h of [handleUsage, handleList, handleRevoke, handleBreakdown]) {
    const res = mockRes();
    await h({ method: 'DELETE', headers: {}, url: '/', on() {} }, res);
    assert.equal(res.statusCode, 405);
  }
});
