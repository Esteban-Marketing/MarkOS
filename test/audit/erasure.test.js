'use strict';

// Phase 201.1 D-106: unit tests for lib/markos/audit/erasure.cjs
// Covers: input validation, happy path (mock RPC), RPC error propagation,
// recanonicalizeLegacyRow feature-flag enforcement.

const test = require('node:test');
const assert = require('node:assert/strict');

const { eraseAuditPii, recanonicalizeLegacyRow } = require('../../lib/markos/audit/erasure.cjs');

function mockClient(overrides = {}) {
  return {
    rpc: overrides.rpc || (async () => ({ data: [{ id: 42, tombstone_id: 43, new_row_hash: 'abc123' }], error: null })),
    ...overrides,
  };
}

// ── eraseAuditPii input validation ────────────────────────────────────────────

test('erasure: eraseAuditPii rejects missing client', async () => {
  await assert.rejects(
    () => eraseAuditPii(null, { row_id: 1, reason: 'gdpr', actor_id: 'u1' }),
    /supabase client required/
  );
});

test('erasure: eraseAuditPii rejects row_id = 0', async () => {
  await assert.rejects(
    () => eraseAuditPii(mockClient(), { row_id: 0, reason: 'gdpr', actor_id: 'u1' }),
    /row_id must be a positive integer/
  );
});

test('erasure: eraseAuditPii rejects non-integer row_id', async () => {
  await assert.rejects(
    () => eraseAuditPii(mockClient(), { row_id: 1.5, reason: 'gdpr', actor_id: 'u1' }),
    /row_id must be a positive integer/
  );
});

test('erasure: eraseAuditPii rejects empty reason', async () => {
  await assert.rejects(
    () => eraseAuditPii(mockClient(), { row_id: 1, reason: '  ', actor_id: 'u1' }),
    /reason must be a non-empty string/
  );
});

test('erasure: eraseAuditPii rejects reason > 256 chars', async () => {
  await assert.rejects(
    () => eraseAuditPii(mockClient(), { row_id: 1, reason: 'x'.repeat(257), actor_id: 'u1' }),
    /reason must be a non-empty string/
  );
});

test('erasure: eraseAuditPii rejects missing actor_id', async () => {
  await assert.rejects(
    () => eraseAuditPii(mockClient(), { row_id: 1, reason: 'gdpr', actor_id: '' }),
    /actor_id required/
  );
});

// ── eraseAuditPii happy path ──────────────────────────────────────────────────

test('erasure: eraseAuditPii returns { row_id, tombstone_id, new_row_hash } on success', async () => {
  const calls = [];
  const client = mockClient({
    rpc: async (fn, args) => {
      calls.push({ fn, args });
      return { data: [{ id: 7, tombstone_id: 8, new_row_hash: 'deadbeef' }], error: null };
    },
  });
  const result = await eraseAuditPii(client, { row_id: 7, reason: 'gdpr_art_17', actor_id: 'admin-1' });
  assert.equal(result.row_id, 7);
  assert.equal(result.tombstone_id, 8);
  assert.equal(result.new_row_hash, 'deadbeef');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].fn, 'erase_audit_pii');
  assert.equal(calls[0].args.p_audit_row_id, 7);
  assert.equal(calls[0].args.p_redaction_marker, 'gdpr_art_17');
  assert.equal(calls[0].args.p_actor_id, 'admin-1');
});

test('erasure: eraseAuditPii handles rpc returning a single object (not array)', async () => {
  const client = mockClient({
    rpc: async () => ({ data: { id: 5, tombstone_id: 6, new_row_hash: 'ff00' }, error: null }),
  });
  const result = await eraseAuditPii(client, { row_id: 5, reason: 'test', actor_id: 'u2' });
  assert.equal(result.row_id, 5);
  assert.equal(result.tombstone_id, 6);
});

// ── eraseAuditPii RPC error propagation ───────────────────────────────────────

test('erasure: eraseAuditPii propagates RPC error', async () => {
  const client = mockClient({
    rpc: async () => ({ data: null, error: { message: 'row not found' } }),
  });
  await assert.rejects(
    () => eraseAuditPii(client, { row_id: 99, reason: 'gdpr', actor_id: 'u1' }),
    /rpc failed: row not found/
  );
});

test('erasure: eraseAuditPii throws when rpc returns no row', async () => {
  const client = mockClient({
    rpc: async () => ({ data: [], error: null }),
  });
  await assert.rejects(
    () => eraseAuditPii(client, { row_id: 1, reason: 'gdpr', actor_id: 'u1' }),
    /rpc returned no row/
  );
});

// ── recanonicalizeLegacyRow feature-flag gate ─────────────────────────────────

test('erasure: recanonicalizeLegacyRow throws when MARKOS_AUDIT_RECANONICALIZE_ENABLED != 1', async () => {
  const saved = process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED;
  delete process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED;
  await assert.rejects(
    () => recanonicalizeLegacyRow(mockClient(), 1, 'actor'),
    /MARKOS_AUDIT_RECANONICALIZE_ENABLED is not enabled/
  );
  if (saved !== undefined) process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED = saved;
});

test('erasure: recanonicalizeLegacyRow passes when flag is enabled', async () => {
  const saved = process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED;
  process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED = '1';
  const client = mockClient({
    rpc: async () => ({ data: [{ id: 3, tombstone_id: 4, old_row_hash: 'oldhash', new_row_hash: 'newhash' }], error: null }),
  });
  const result = await recanonicalizeLegacyRow(client, 3, 'sys-actor');
  assert.equal(result.row_id, 3);
  assert.equal(result.old_row_hash, 'oldhash');
  assert.equal(result.new_row_hash, 'newhash');
  process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED = saved !== undefined ? saved : '';
  if (saved === undefined) delete process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED;
});

test('erasure: recanonicalizeLegacyRow rejects invalid row_id when flag is set', async () => {
  const saved = process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED;
  process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED = '1';
  await assert.rejects(
    () => recanonicalizeLegacyRow(mockClient(), -1, 'actor'),
    /row_id must be a positive integer/
  );
  process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED = saved !== undefined ? saved : '';
  if (saved === undefined) delete process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED;
});
