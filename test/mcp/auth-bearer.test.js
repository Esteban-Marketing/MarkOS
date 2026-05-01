'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createKey, TOKEN_REGEX } = require('../../lib/markos/mcp/api-keys.cjs');
const { verifyBearer } = require('../../lib/markos/mcp/auth-bearer.cjs');

function createClient(state = {}) {
  state.keys = state.keys || [];
  state.audit = state.audit || [];
  state.tenants = state.tenants || { t1: { id: 't1', org_id: 'o1', status: 'active' } };
  state.subscriptions = state.subscriptions || { t1: { plan_key: 'team', billing_state: 'active' } };

  return {
    state,
    from(name) {
      if (name === 'markos_tenants') {
        return {
          select: () => ({
            eq: (_col, val) => ({
              maybeSingle: async () => ({ data: state.tenants[val] || null, error: null }),
            }),
          }),
        };
      }
      if (name === 'tenant_billing_subscriptions') {
        return {
          select: () => ({
            eq: (_col, val) => ({
              maybeSingle: async () => ({ data: state.subscriptions[val] || null, error: null }),
            }),
          }),
        };
      }
      if (name === 'markos_mcp_api_keys') {
        return {
          insert: async (row) => {
            state.keys.push({ ...row, revoked_at: row.revoked_at || null, last_used_at: row.last_used_at || null });
            return { error: null };
          },
          select: () => ({
            eq: (col, val) => ({
              maybeSingle: async () => ({
                data: state.keys.find((row) => row[col] === val) || null,
                error: null,
              }),
            }),
          }),
          update: (patch) => ({
            eq: (col, val) => ({
              then: async (resolve) => {
                for (const row of state.keys) {
                  if (row[col] === val) Object.assign(row, patch);
                }
                return resolve({ error: null });
              },
            }),
          }),
        };
      }
      if (name === 'markos_audit_log_staging') {
        return {
          insert: (row) => ({
            select: () => ({
              single: async () => {
                state.audit.push(row);
                return { data: { id: String(state.audit.length) }, error: null };
              },
            }),
          }),
        };
      }
      return {
        insert: async () => ({ error: null }),
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  };
}

function makeReq(token) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

test('createKey returns mks_ plaintext token once and matches the base32 regex', async () => {
  const client = createClient();
  const created = await createKey(client, 't1', 'Claude Desktop', ['tools:call'], 'user-1');
  assert.match(created.plaintext_token_show_once, TOKEN_REGEX);
  assert.equal(created.id.startsWith('mcp-key-'), true);
});

test('verifyBearer rejects missing Authorization header', async () => {
  const client = createClient();
  const result = await verifyBearer(makeReq(null), client);
  assert.deepEqual(result, { ok: false, reason: 'missing_authorization' });
});

test('verifyBearer rejects malformed bearer token', async () => {
  const client = createClient();
  const result = await verifyBearer(makeReq('not-a-real-mcp-token'), client);
  assert.deepEqual(result, { ok: false, reason: 'malformed_bearer' });
});

test('verifyBearer resolves active key and returns tenant-scoped auth context', async () => {
  const client = createClient();
  const created = await createKey(client, 't1', 'Claude Desktop', ['tools:call'], 'user-1');
  const result = await verifyBearer(makeReq(created.plaintext_token_show_once), client);
  assert.equal(result.ok, true);
  assert.equal(result.tenant_id, 't1');
  assert.equal(result.user_id, 'user-1');
  assert.equal(result.plan_tier, 'team');
  assert.equal(result.auth_type, 'api_key');
});

test('verifyBearer rejects revoked keys and emits auth.failed audit', async () => {
  const client = createClient();
  const created = await createKey(client, 't1', 'Claude Desktop', ['tools:call'], 'user-1');
  client.state.keys[0].revoked_at = new Date().toISOString();
  const result = await verifyBearer(makeReq(created.plaintext_token_show_once), client);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unknown_or_revoked_key');
  assert.equal(client.state.audit[0].action, 'auth.failed');
});

test('createKey stores sha256 hash instead of plaintext token', async () => {
  const client = createClient();
  const created = await createKey(client, 't1', 'Claude Desktop', ['tools:call'], 'user-1');
  const stored = client.state.keys[0];
  const expectedHash = createHash('sha256').update(created.plaintext_token_show_once).digest('hex');
  assert.equal(stored.key_hash, expectedHash);
  assert.notEqual(stored.key_hash, created.plaintext_token_show_once);
});

test('verifyBearer bumps last_used_at on successful lookup', async () => {
  const client = createClient();
  const created = await createKey(client, 't1', 'Claude Desktop', ['tools:call'], 'user-1');
  await verifyBearer(makeReq(created.plaintext_token_show_once), client);
  assert.ok(client.state.keys[0].last_used_at);
});
