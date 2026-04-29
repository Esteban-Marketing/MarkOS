'use strict';

// Phase 201.1 D-106: integration-shaped tests — verifyTenantChain tombstone detection.
//
// Background on what the verifier actually sees after erase_audit_pii runs:
//
//   Before erasure:  row1 → row2(original, row_hash=H2) → ...
//   After erasure:   row1 → row2(redacted, row_hash=H2') → row3(tombstone, prev_hash=H2)
//
//   The SQL fn: (a) appends tombstone with prev_hash=H2 (old), then (b) updates row2 with
//   new payload + new row_hash H2'. The tombstone prev_hash now points to H2 (stale), so
//   the verifier sees a prev_hash mismatch on the tombstone row.
//
//   Row 2 itself passes the verifier hash check: the verifier recomputes
//   sha(row2.prev_hash || canonicalJson(row2.payload)) = sha(H1 || canon(redacted)) = H2',
//   which matches the stored H2'. No break for row 2.
//
//   The row_hash mismatch path in the verifier (tombstoneByOriginalId lookup) is reached
//   when the ORIGINAL row is present with its hash NOT recomputed. This occurs in the
//   recanonicalize_legacy_audit_row path OR in unit tests that simulate a partial erasure
//   (payload changed, row_hash NOT updated). The tombstone detection is verified here.
//
// Test A: row_hash mismatch WITH tombstone → redaction_tombstone_detected (ok=true).
// Test B: row_hash mismatch WITHOUT tombstone → tampering_suspected (ok=false).
// Test C: after full erase_audit_pii, chain integrity: row2 passes, tombstone has
//         prev_hash mismatch (documented cascade), ok=false but row2 itself is clean.
//
// Uses in-memory mock chain (no real DB required).

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

// ── Test A ────────────────────────────────────────────────────────────────────
// Simulates the scenario where a row's payload was mutated WITHOUT recomputing
// its row_hash AND a tombstone row exists in the chain for that row_id.
// This is the direct path through tombstoneByOriginalId in the verifier.
// (In production this occurs if erase_audit_pii only wrote the tombstone but the
//  UPDATE of row_hash failed — which the atomicity test proves cannot happen in
//  the DB. But it is the correct unit test for the verifier's tombstone branch.)
test('erasure-chain-tombstone: verifyTenantChain classifies row_hash drift with tombstone as redaction_tombstone_detected', async () => {
  const tenant_id = 'tombstone-drift-tenant';

  const rows = buildChain(tenant_id, [
    { action: 'tenant.created', actor_id: 'u1', actor_role: 'owner',  payload: { slug: 'acme' } },
    { action: 'user.login',     actor_id: 'u1', actor_role: 'member', payload: { email: 'alice@example.com', ip: '1.2.3.4' } },
  ]);

  const row2 = rows[1];

  // Build tombstone row BEFORE mutating row2's payload (mirrors the SQL insert-before-update order).
  const tombstonePayload = {
    original_row_id: 2,
    redaction_marker: 'gdpr_art_17_test',
    reason: 'gdpr_art_17_test',
  };
  const tombstoneOccurredAt = '2026-04-29T00:01:00.000Z';
  const tombstoneCanonical = canonicalJson({
    action: 'audit.pii_erased', actor_id: 'admin-1', actor_role: 'owner',
    occurred_at: tombstoneOccurredAt, payload: tombstonePayload, tenant_id,
  });
  const tombstoneRowHash = sha(row2.row_hash + tombstoneCanonical);
  const tombstoneRow = {
    id: 3,
    tenant_id,
    action: 'audit.pii_erased',
    actor_id: 'admin-1',
    actor_role: 'owner',
    payload: tombstonePayload,
    occurred_at: tombstoneOccurredAt,
    prev_hash: row2.row_hash,
    row_hash: tombstoneRowHash,
    redacted_at: null,
  };

  // Mutate row2's payload WITHOUT recomputing row_hash — simulates partial state
  // (the unit test path that exercises the row_hash mismatch branch in the verifier).
  rows[1] = {
    ...row2,
    payload: { __redacted: 'gdpr_art_17_test', at: tombstoneOccurredAt, by: 'admin-1' },
    // row_hash deliberately left as the PRE-erasure value so the verifier sees a mismatch.
    row_hash: row2.row_hash,
    redacted_at: tombstoneOccurredAt,
  };

  const allRows = [...rows, tombstoneRow];
  const result = await verifyTenantChain(mockClient(allRows), tenant_id);

  // Row 2 has a row_hash mismatch AND a tombstone exists for original_row_id=2.
  // Verifier must classify this as redaction_tombstone_detected, not tampering.
  const row2Break = result.breaks.find((b) => b.row_id === 2);
  assert.ok(row2Break, 'a break must be reported for the drifted row id=2');
  assert.equal(
    row2Break.reason, 'redaction_tombstone_detected',
    'row 2 hash mismatch must be classified as redaction_tombstone_detected when a tombstone exists'
  );
  assert.equal(row2Break.tombstone_row_id, 3, 'tombstone_row_id must reference the tombstone row id=3');
  assert.ok(row2Break.expected_row_hash, 'expected_row_hash must be populated');
  assert.ok(row2Break.actual_row_hash, 'actual_row_hash must be populated');
  assert.notEqual(row2Break.expected_row_hash, row2Break.actual_row_hash, 'hashes must differ');

  // Confirm 'tampering_suspected' is NOT reported for row 2.
  assert.ok(
    !result.breaks.find((b) => b.row_id === 2 && b.reason === 'tampering_suspected'),
    'row 2 must NOT be classified as tampering_suspected when tombstone covers it'
  );

  // ok=true: all breaks are redaction_tombstone_detected (row3 tombstone itself passes
  // because the verifier continues with row2's actual row_hash as expected_prev, which
  // matches tombstone's prev_hash since we left row2.row_hash unchanged above).
  assert.equal(result.ok, true, 'chain must be ok=true when all breaks are tombstone-documented');
});

// ── Test B ────────────────────────────────────────────────────────────────────
test('erasure-chain-tombstone: verifyTenantChain ok=false when row_hash drifts without tombstone', async () => {
  const tenant_id = 'no-tombstone-tenant';
  const rows = buildChain(tenant_id, [
    { action: 'a', actor_id: 'u', actor_role: 'owner', payload: { v: 1 } },
    { action: 'b', actor_id: 'u', actor_role: 'owner', payload: { v: 2 } },
    { action: 'c', actor_id: 'u', actor_role: 'owner', payload: { v: 3 } },
  ]);

  // Tamper row 2's payload WITHOUT adding a tombstone.
  rows[1] = { ...rows[1], payload: { __redacted: 'no-tombstone', at: '', by: '' } };

  const result = await verifyTenantChain(mockClient(rows), tenant_id);
  assert.equal(result.ok, false, 'chain must NOT be ok when hash drifts without a tombstone');
  assert.ok(result.breaks.some((b) => b.reason === 'tampering_suspected'), 'must report tampering_suspected');
  assert.ok(
    !result.breaks.some((b) => b.reason === 'redaction_tombstone_detected'),
    'must NOT report tombstone_detected when no tombstone exists'
  );
});

// ── Test C ────────────────────────────────────────────────────────────────────
// Documents the actual chain state after a full erase_audit_pii call:
// row2's row_hash IS updated (verifier sees it clean), but the tombstone row
// has prev_hash = old row2 hash → prev_hash mismatch on the tombstone.
// This is a known cascade: ok=false because of the prev_hash mismatch on the tombstone.
test('erasure-chain-tombstone: after full erasure, tombstone prev_hash mismatch is the cascade break', async () => {
  const tenant_id = 'full-erasure-cascade-tenant';
  const rows = buildChain(tenant_id, [
    { action: 'tenant.created', actor_id: 'u1', actor_role: 'owner', payload: { slug: 'acme' } },
    { action: 'user.login',     actor_id: 'u1', actor_role: 'member', payload: { email: 'alice@example.com' } },
  ]);
  const row2 = rows[1];

  // Tombstone appended with prev_hash = OLD row2 hash.
  const tombstonePayload = { original_row_id: 2, redaction_marker: 'gdpr', reason: 'gdpr' };
  const tombstoneOccurredAt = '2026-04-29T00:01:00.000Z';
  const tombstoneCanonical = canonicalJson({
    action: 'audit.pii_erased', actor_id: 'admin-1', actor_role: 'owner',
    occurred_at: tombstoneOccurredAt, payload: tombstonePayload, tenant_id,
  });
  const tombstoneRow = {
    id: 3, tenant_id, action: 'audit.pii_erased', actor_id: 'admin-1', actor_role: 'owner',
    payload: tombstonePayload, occurred_at: tombstoneOccurredAt,
    prev_hash: row2.row_hash,                                 // OLD hash — appended before UPDATE
    row_hash: sha(row2.row_hash + tombstoneCanonical),
    redacted_at: null,
  };

  // Row 2 row_hash recomputed (mirroring the SQL UPDATE).
  const redactedPayload = { __redacted: 'gdpr', at: tombstoneOccurredAt, by: 'admin-1' };
  const newRow2Hash = sha(row2.prev_hash + canonicalJson({
    action: row2.action, actor_id: row2.actor_id, actor_role: row2.actor_role,
    occurred_at: row2.occurred_at, payload: redactedPayload, tenant_id,
  }));
  rows[1] = { ...row2, payload: redactedPayload, row_hash: newRow2Hash, redacted_at: tombstoneOccurredAt };

  const allRows = [...rows, tombstoneRow];
  const result = await verifyTenantChain(mockClient(allRows), tenant_id);

  // Row 2 passes (hash recomputed, verifier confirms it). No break on row 2.
  assert.ok(
    !result.breaks.find((b) => b.row_id === 2),
    'row 2 must NOT produce a break when row_hash was recomputed after erasure'
  );
  // Tombstone (row 3) has prev_hash = old row2 hash, but verifier expects new row2 hash.
  const tombstoneBreak = result.breaks.find((b) => b.row_id === 3);
  assert.ok(tombstoneBreak, 'tombstone row 3 must have a prev_hash mismatch (cascade)');
  assert.equal(tombstoneBreak.reason, 'prev_hash mismatch', 'cascade break is prev_hash mismatch');
});
