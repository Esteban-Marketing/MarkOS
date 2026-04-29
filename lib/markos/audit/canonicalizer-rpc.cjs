'use strict';

// Phase 201.1 D-103: Supabase RPC wrapper around markos_canonicalize_audit_payload.
// Used exclusively by test/audit/canonical-fuzzer.test.js to compare Node vs Postgres
// canonical outputs over 10k random objects.
// See docs/canonical-audit-spec.md for the full locked specification.

async function callPostgresCanonicalizer(client, payload) {
  if (!client || typeof client.rpc !== 'function') {
    throw new Error('callPostgresCanonicalizer: supabase client required');
  }
  const { data, error } = await client.rpc('markos_canonicalize_audit_payload', {
    p_payload: payload,
  });
  if (error) throw new Error(`callPostgresCanonicalizer: rpc failed: ${error.message}`);
  return typeof data === 'string' ? data : (data && data.toString ? data.toString() : '');
}

module.exports = { callPostgresCanonicalizer };
