// Phase 201.1 D-106 (closes M4): TypeScript mirror of erasure.cjs
// Source of truth is erasure.cjs — keep in sync.

export interface EraseAuditPiiInput {
  row_id: number;
  reason: string;
  actor_id: string;
  /** Optional: tenant_id for cross-reference logging at the API layer. Not passed to SQL fn. */
  tenant_id_for_authz?: string;
}

export interface EraseAuditPiiResult {
  row_id: number;
  tombstone_id: number;
  new_row_hash: string;
}

export interface RecanonicalizeLegacyRowResult {
  row_id: number;
  tombstone_id: number;
  old_row_hash: string;
  new_row_hash: string;
}

export async function eraseAuditPii(
  client: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> },
  input: EraseAuditPiiInput,
): Promise<EraseAuditPiiResult> {
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

  const row = Array.isArray(data) ? (data as Record<string, unknown>[])[0] : (data as Record<string, unknown>);
  if (!row) throw new Error('eraseAuditPii: rpc returned no row');
  return {
    row_id:       row.id as number,
    tombstone_id: row.tombstone_id as number,
    new_row_hash: row.new_row_hash as string,
  };
}

export async function recanonicalizeLegacyRow(
  client: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> },
  row_id: number,
  actor_id: string,
): Promise<RecanonicalizeLegacyRowResult> {
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

  const row = Array.isArray(data) ? (data as Record<string, unknown>[])[0] : (data as Record<string, unknown>);
  if (!row) throw new Error('recanonicalizeLegacyRow: rpc returned no row');
  return {
    row_id:       row.id as number,
    tombstone_id: row.tombstone_id as number,
    old_row_hash: row.old_row_hash as string,
    new_row_hash: row.new_row_hash as string,
  };
}
