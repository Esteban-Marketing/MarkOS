'use strict';

// Phase 201.1 D-106 (closes M4): GDPR Art. 17 erasure with hash-chain tombstone.
// Wraps the SQL functions erase_audit_pii and recanonicalize_legacy_audit_row (migration 93).
//
// eraseAuditPii:
//   - Validates input.row_id, input.reason, input.actor_id.
//   - Calls client.rpc('erase_audit_pii', ...).
//   - Returns { row_id, tombstone_id, new_row_hash }.
//
// recanonicalizeLegacyRow:
//   - Gated by env flag MARKOS_AUDIT_RECANONICALIZE_ENABLED=1 (application layer).
//   - Calls client.rpc('recanonicalize_legacy_audit_row', ...).
//   - Returns { row_id, tombstone_id, old_row_hash, new_row_hash }.

async function eraseAuditPii(client, input) {
  if (!client || typeof client.rpc !== 'function') {
    throw new Error('eraseAuditPii: supabase client required');
  }
  if (!input || typeof input.row_id !== 'number' || !Number.isInteger(input.row_id) || input.row_id <= 0) {
    throw new Error('eraseAuditPii: row_id must be a positive integer');
  }
  if (typeof input.reason !== 'string' || !input.reason.trim() || input.reason.length > 256) {
    throw new Error('eraseAuditPii: reason must be a non-empty string <= 256 chars');
  }
  if (typeof input.actor_id !== 'string' || !input.actor_id.trim()) {
    throw new Error('eraseAuditPii: actor_id required');
  }

  const { data, error } = await client.rpc('erase_audit_pii', {
    p_audit_row_id:     input.row_id,
    p_redaction_marker: input.reason.trim(),
    p_actor_id:         input.actor_id.trim(),
  });

  if (error) throw new Error(`eraseAuditPii: rpc failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('eraseAuditPii: rpc returned no row');
  return {
    row_id:       row.id,
    tombstone_id: row.tombstone_id,
    new_row_hash: row.new_row_hash,
  };
}

async function recanonicalizeLegacyRow(client, row_id, actor_id) {
  if (process.env.MARKOS_AUDIT_RECANONICALIZE_ENABLED !== '1') {
    throw new Error('recanonicalizeLegacyRow: feature flag MARKOS_AUDIT_RECANONICALIZE_ENABLED is not enabled');
  }
  if (!client || typeof client.rpc !== 'function') {
    throw new Error('recanonicalizeLegacyRow: supabase client required');
  }
  if (typeof row_id !== 'number' || !Number.isInteger(row_id) || row_id <= 0) {
    throw new Error('recanonicalizeLegacyRow: row_id must be a positive integer');
  }
  if (typeof actor_id !== 'string' || !actor_id.trim()) {
    throw new Error('recanonicalizeLegacyRow: actor_id required');
  }

  const { data, error } = await client.rpc('recanonicalize_legacy_audit_row', {
    p_audit_row_id: row_id,
    p_actor_id:     actor_id.trim(),
  });

  if (error) throw new Error(`recanonicalizeLegacyRow: rpc failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('recanonicalizeLegacyRow: rpc returned no row');
  return {
    row_id:       row.id,
    tombstone_id: row.tombstone_id,
    old_row_hash: row.old_row_hash,
    new_row_hash: row.new_row_hash,
  };
}

module.exports = { eraseAuditPii, recanonicalizeLegacyRow };
