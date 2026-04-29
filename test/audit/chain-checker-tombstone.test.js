'use strict';

// Phase 201.1 D-106: negative-path tests for verifyTenantChain tombstone detection.
// Tests that row_hash mismatch WITHOUT a tombstone is reported as 'tampering_suspected'
// and that ok=false is returned.
//
// Complements erasure-chain-tombstone.test.js (positive path).

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const { verifyTenantChain } = require('../../lib/markos/audit/chain-checker.cjs');
const { canonicalJson } = require('../../lib/markos/audit/canonical.cjs');

function sha(input) { return createHash('sha256').update(input).digest('hex'); }

function buildChain(tenant_id, entries) {
  let prev = sha('genesis:' + tenant_id);
  return entries.map((e, i) => {
    const occurred_at = `2026-04-29T00:00:0${i}.000Z`;
    const canonical = canonicalJson({
      action: e.action, actor_id: e.actor_id, actor_role: e.actor_role,
      occurred_at, payload: e.payload, tenant_id,
    });
    const row_hash = sha(prev + canonical);
    const row = {
      id: i + 1,
      tenant_id,
      action: e.action,
      actor_id: e.actor_id,
      actor_role: e.actor_role,
      payload: e.payload,
      occurred_at,
      prev_hash: prev,
      row_hash,
      redacted_at: null,
    };
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

test('chain-checker-tombstone: tampering_suspected when row_hash drifts with no tombstone', async () => {
  const tenant_id = 'tampering-test-tenant';
  const rows = buildChain(tenant_id, [
    { action: 'tenant.created', actor_id: 'u1', actor_role: 'owner', payload: { slug: 'acme' } },
    { action: 'user.login',     actor_id: 'u1', actor_role: 'member', payload: { email: 'alice@example.com' } },
    { action: 'user.logout',    actor_id: 'u1', actor_role: 'member', payload: {} },
  ]);

  // Tamper row 2's payload directly WITHOUT providing a tombstone row.
  rows[1] = { ...rows[1], payload: { email: 'attacker@example.com' } };

  const result = await verifyTenantChain(mockClient(rows), tenant_id);

  assert.equal(result.ok, false, 'chain must be ok=false on unexplained row_hash mismatch');
  assert.ok(result.breaks.length >= 1, 'at least one break must be reported');
  const brk = result.breaks.find((b) => b.row_id === 2);
  assert.ok(brk, 'break must reference row_id=2');
  assert.equal(brk.reason, 'tampering_suspected', 'reason must be tampering_suspected (no tombstone)');
  assert.ok(!brk.tombstone_row_id, 'tombstone_row_id must NOT be present when reason=tampering_suspected');
});

test('chain-checker-tombstone: intact chain returns ok=true with zero breaks', async () => {
  const tenant_id = 'intact-chain-tenant';
  const rows = buildChain(tenant_id, [
    { action: 'a', actor_id: 'u1', actor_role: 'owner', payload: { x: 1 } },
    { action: 'b', actor_id: 'u1', actor_role: 'owner', payload: { x: 2 } },
    { action: 'c', actor_id: 'u1', actor_role: 'owner', payload: { x: 3 } },
  ]);
  const result = await verifyTenantChain(mockClient(rows), tenant_id);
  assert.equal(result.ok, true);
  assert.deepEqual(result.breaks, []);
});

test('chain-checker-tombstone: ok=false when row_hash mismatch has wrong tombstone action', async () => {
  // A row with a tombstone action that is NOT 'audit.pii_erased' or 'audit.recanonicalized'
  // must NOT be treated as a documented exception.
  const tenant_id = 'wrong-tombstone-action-tenant';
  const rows = buildChain(tenant_id, [
    { action: 'a', actor_id: 'u', actor_role: 'owner', payload: {} },
    { action: 'b', actor_id: 'u', actor_role: 'owner', payload: { pii: 'data' } },
    { action: 'c', actor_id: 'u', actor_role: 'owner', payload: {} },
  ]);

  // Tamper row 2.
  rows[1] = { ...rows[1], payload: { pii: 'tampered' } };

  // Add a row that LOOKS like a tombstone but has a different action (not recognized).
  const prevHashForFake = rows[2].row_hash;
  const fakePayload = { original_row_id: 2 }; // same payload structure
  const fakeOccurredAt = '2026-04-29T00:01:00.000Z';
  const fakeCanonical = canonicalJson({
    action: 'audit.fake_tombstone', actor_id: 'u', actor_role: 'owner',
    occurred_at: fakeOccurredAt, payload: fakePayload, tenant_id,
  });
  const fakeHash = sha(prevHashForFake + fakeCanonical);
  rows.push({
    id: 4, tenant_id,
    action: 'audit.fake_tombstone', actor_id: 'u', actor_role: 'owner',
    payload: fakePayload, occurred_at: fakeOccurredAt,
    prev_hash: prevHashForFake, row_hash: fakeHash, redacted_at: null,
  });

  const result = await verifyTenantChain(mockClient(rows), tenant_id);
  assert.equal(result.ok, false, 'chain must be ok=false when tombstone action is not recognized');
  const brk = result.breaks.find((b) => b.row_id === 2);
  assert.ok(brk, 'break must reference row_id=2');
  assert.equal(brk.reason, 'tampering_suspected', 'unrecognized tombstone action must NOT clear tampering_suspected');
});

test('chain-checker-tombstone: ok=true on empty chain (backward compat)', async () => {
  const result = await verifyTenantChain(mockClient([]), 'empty-tenant');
  assert.deepEqual(result, { ok: true, row_count: 0, breaks: [] });
});
