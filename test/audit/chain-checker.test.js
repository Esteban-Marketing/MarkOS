'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const { computeRowHash, verifyTenantChain } = require('../../lib/markos/audit/chain-checker.cjs');
const { canonicalJson } = require('../../lib/markos/audit/canonical.cjs');

function sha(input) { return createHash('sha256').update(input).digest('hex'); }
function buildValidChain(tenant_id, entries) {
  let prev = sha('genesis:' + tenant_id);
  return entries.map((e, i) => {
    const occurred_at = `2026-04-17T00:00:0${i}.000Z`;
    const canonical = canonicalJson({
      action: e.action, actor_id: e.actor_id, actor_role: e.actor_role,
      occurred_at, payload: e.payload, tenant_id,
    });
    const row_hash = sha(prev + canonical);
    const row = { id: i + 1, tenant_id, action: e.action, actor_id: e.actor_id, actor_role: e.actor_role, payload: e.payload, occurred_at, prev_hash: prev, row_hash };
    prev = row_hash;
    return row;
  });
}

function mockClient(rows) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: rows, error: null }),
        }),
      }),
    }),
  };
}

test('Suite 201-02: computeRowHash matches node:crypto SHA-256', () => {
  const expected = sha('abcpayload');
  assert.equal(computeRowHash('abc', 'payload'), expected);
});

test('Suite 201-02: verifyTenantChain returns ok for empty chain', async () => {
  const result = await verifyTenantChain(mockClient([]), 'tenant-empty');
  assert.deepEqual(result, { ok: true, row_count: 0, breaks: [] });
});

test('Suite 201-02: verifyTenantChain returns ok for intact 3-row chain', async () => {
  const rows = buildValidChain('tenant-a', [
    { action: 'tenant.created', actor_id: 'u1', actor_role: 'owner', payload: { slug: 'acme' } },
    { action: 'user.login', actor_id: 'u1', actor_role: 'owner', payload: { method: 'magic-link' } },
    { action: 'member.invited', actor_id: 'u1', actor_role: 'owner', payload: { email: 'b@c.com' } },
  ]);
  const result = await verifyTenantChain(mockClient(rows), 'tenant-a');
  assert.equal(result.ok, true);
  assert.equal(result.row_count, 3);
  assert.deepEqual(result.breaks, []);
});

test('Suite 201-02: verifyTenantChain detects tampered middle row payload', async () => {
  const rows = buildValidChain('tenant-b', [
    { action: 'a', actor_id: 'u', actor_role: 'owner', payload: { v: 1 } },
    { action: 'b', actor_id: 'u', actor_role: 'owner', payload: { v: 2 } },
    { action: 'c', actor_id: 'u', actor_role: 'owner', payload: { v: 3 } },
  ]);
  // Tamper with row 2's payload (without recomputing row_hash)
  rows[1].payload = { v: 999 };
  const result = await verifyTenantChain(mockClient(rows), 'tenant-b');
  assert.equal(result.ok, false);
  assert.ok(result.breaks.length >= 1, 'expected at least one break');
  assert.ok(result.breaks.some(b => b.row_id === 2 && b.reason === 'row_hash mismatch'));
});

test('Suite 201-02: verifyTenantChain detects orphaned prev_hash pointer', async () => {
  const rows = buildValidChain('tenant-c', [
    { action: 'a', actor_id: 'u', actor_role: 'owner', payload: {} },
    { action: 'b', actor_id: 'u', actor_role: 'owner', payload: {} },
  ]);
  rows[1].prev_hash = 'not-the-previous-row-hash';
  const result = await verifyTenantChain(mockClient(rows), 'tenant-c');
  assert.equal(result.ok, false);
  assert.ok(result.breaks.some(b => b.row_id === 2 && b.reason === 'prev_hash mismatch'));
});

test('Suite 201-02: drain handler handleDrain processes 2 staging rows idempotently', async () => {
  // Require drain via its file path; its handleDrain export accepts a mocked client.
  const drain = require('../../api/audit/drain.js');
  assert.equal(typeof drain.handleDrain, 'function');
  assert.equal(drain.BATCH_SIZE, 500);

  const stagingRows = [
    { id: 1, tenant_id: 't1', org_id: 'o1', source_domain: 'auth', action: 'login', actor_id: 'u1', actor_role: 'owner', payload: {}, occurred_at: '2026-04-17T00:00:00Z' },
    { id: 2, tenant_id: 't1', org_id: 'o1', source_domain: 'auth', action: 'logout', actor_id: 'u1', actor_role: 'owner', payload: {}, occurred_at: '2026-04-17T00:01:00Z' },
  ];

  const updates = [];
  const rpcCalls = [];
  const client = {
    from: (table) => ({
      select: () => ({
        is: () => ({
          order: () => ({
            limit: async () => ({ data: stagingRows, error: null }),
          }),
        }),
      }),
      update: (patch) => ({
        eq: async (col, id) => {
          updates.push({ table, patch, col, id });
          return { error: null };
        },
      }),
    }),
    rpc: async (fn, args) => {
      rpcCalls.push({ fn, args });
      return { data: [{ id: Math.floor(Math.random() * 1000), row_hash: 'r', prev_hash: 'p' }], error: null };
    },
  };

  const result = await drain.handleDrain(client);
  assert.equal(result.ok, true);
  assert.equal(result.processed, 2);
  assert.equal(rpcCalls.length, 2);
  assert.ok(rpcCalls.every(c => c.fn === 'append_markos_audit_row'));
  assert.equal(updates.length, 2);
  assert.ok(updates.every(u => u.patch.claimed_at && u.col === 'id'));
});
