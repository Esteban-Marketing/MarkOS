'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  AUDIT_SOURCE_DOMAINS,
  writeAuditRow,
  enqueueAuditStaging,
  canonicalPayloadForHash,
} = require('../../lib/markos/audit/writer.cjs');

function mockSupabase(rpcResponse, insertResponse) {
  const calls = { rpc: [], inserts: [] };
  return {
    calls,
    rpc: async (fn, args) => {
      calls.rpc.push({ fn, args });
      return rpcResponse || { data: [{ id: 1, row_hash: 'deadbeef', prev_hash: 'cafebabe' }], error: null };
    },
    from: (table) => ({
      insert: (row) => {
        calls.inserts.push({ table, row });
        return {
          select: () => ({
            single: async () => insertResponse || { data: { id: 42 }, error: null },
          }),
        };
      },
    }),
  };
}

test('Suite 201-02: AUDIT_SOURCE_DOMAINS is the locked list (11 core + 1 MCP)', () => {
  assert.deepEqual([...AUDIT_SOURCE_DOMAINS], [
    'auth', 'tenancy', 'orgs', 'billing', 'crm', 'outbound',
    'webhooks', 'approvals', 'consent', 'governance', 'system',
    // Phase 202 Plan 01: MCP session lifecycle + tool-call audit fabric.
    'mcp',
  ]);
  assert.equal(Object.isFrozen(AUDIT_SOURCE_DOMAINS), true);
});

test('Suite 201-02: writeAuditRow rejects unknown source_domain', async () => {
  const client = mockSupabase();
  await assert.rejects(
    () => writeAuditRow(client, {
      tenant_id: 't1', source_domain: 'banana', action: 'x', actor_id: 'u', actor_role: 'owner',
    }),
    /invalid source_domain/,
  );
});

test('Suite 201-02: writeAuditRow rejects missing tenant_id', async () => {
  const client = mockSupabase();
  await assert.rejects(
    () => writeAuditRow(client, {
      source_domain: 'auth', action: 'x', actor_id: 'u', actor_role: 'owner',
    }),
    /tenant_id required/,
  );
});

test('Suite 201-02: writeAuditRow calls append_markos_audit_row with exactly 8 parameters', async () => {
  const client = mockSupabase();
  const result = await writeAuditRow(client, {
    tenant_id: 'tenant-1',
    org_id: 'org-1',
    source_domain: 'auth',
    action: 'user.login',
    actor_id: 'user-1',
    actor_role: 'owner',
    payload: { method: 'magic-link' },
    occurred_at: '2026-04-17T10:00:00.000Z',
  });

  assert.equal(client.calls.rpc.length, 1);
  assert.equal(client.calls.rpc[0].fn, 'append_markos_audit_row');
  const args = client.calls.rpc[0].args;
  assert.deepEqual(Object.keys(args).sort(), [
    'p_action', 'p_actor_id', 'p_actor_role', 'p_occurred_at',
    'p_org_id', 'p_payload', 'p_source_domain', 'p_tenant_id',
  ]);
  assert.equal(args.p_tenant_id, 'tenant-1');
  assert.equal(args.p_action, 'user.login');
  assert.deepEqual(args.p_payload, { method: 'magic-link' });
  assert.equal(result.id, 1);
  assert.equal(result.row_hash, 'deadbeef');
  assert.equal(result.prev_hash, 'cafebabe');
});

test('Suite 201-02: writeAuditRow surfaces rpc error', async () => {
  const client = mockSupabase({ data: null, error: { message: 'db_down' } });
  await assert.rejects(
    () => writeAuditRow(client, {
      tenant_id: 't1', source_domain: 'auth', action: 'x', actor_id: 'u', actor_role: 'owner',
    }),
    /rpc failed: db_down/,
  );
});

test('Suite 201-02: enqueueAuditStaging inserts into markos_audit_log_staging', async () => {
  const client = mockSupabase(null, { data: { id: 99 }, error: null });
  const result = await enqueueAuditStaging(client, {
    tenant_id: 'tenant-1',
    org_id: 'org-1',
    source_domain: 'crm',
    action: 'deal.created',
    actor_id: 'u-1',
    actor_role: 'contributor',
    payload: { deal_id: 'd-1' },
  });
  assert.equal(result.staging_id, 99);
  assert.equal(client.calls.inserts.length, 1);
  assert.equal(client.calls.inserts[0].table, 'markos_audit_log_staging');
  assert.equal(client.calls.inserts[0].row.source_domain, 'crm');
});

test('Suite 201-02: canonicalPayloadForHash produces the exact SQL-matching layout', () => {
  const canonical = canonicalPayloadForHash({
    action: 'tenant.created',
    actor_id: 'u-1',
    actor_role: 'owner',
    occurred_at: '2026-04-17T00:00:00.000Z',
    payload: { slug: 'acme' },
    tenant_id: 'tenant-1',
  });
  assert.equal(
    canonical,
    '{"action":"tenant.created","actor_id":"u-1","actor_role":"owner","occurred_at":"2026-04-17T00:00:00.000Z","payload":{"slug":"acme"},"tenant_id":"tenant-1"}',
  );
});
