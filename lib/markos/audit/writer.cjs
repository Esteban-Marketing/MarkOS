'use strict';

const { canonicalJson } = require('./canonical.cjs');

const AUDIT_SOURCE_DOMAINS = Object.freeze([
  'auth', 'tenancy', 'orgs', 'billing', 'crm', 'outbound',
  'webhooks', 'approvals', 'consent', 'governance', 'system',
  // Phase 202 Plan 01: MCP session lifecycle + tool-call audit fabric.
  'mcp',
]);

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') throw new Error('writeAuditRow: entry required');
  if (typeof entry.tenant_id !== 'string' || !entry.tenant_id) throw new Error('writeAuditRow: tenant_id required');
  if (typeof entry.source_domain !== 'string') throw new Error('writeAuditRow: source_domain required');
  if (!AUDIT_SOURCE_DOMAINS.includes(entry.source_domain)) {
    throw new Error(`writeAuditRow: invalid source_domain "${entry.source_domain}". Valid: ${AUDIT_SOURCE_DOMAINS.join(', ')}`);
  }
  if (typeof entry.action !== 'string' || !entry.action) throw new Error('writeAuditRow: action required');
  if (typeof entry.actor_id !== 'string') throw new Error('writeAuditRow: actor_id required');
  if (typeof entry.actor_role !== 'string') throw new Error('writeAuditRow: actor_role required');
}

// Writes one row through the SQL function append_markos_audit_row.
// That function serialises the write via pg_advisory_xact_lock per tenant and computes the hash
// chain inside the txn. Never implement hash computation in JS — the DB is the single writer.
async function writeAuditRow(client, entry) {
  validateEntry(entry);
  if (!client || typeof client.rpc !== 'function') throw new Error('writeAuditRow: supabase client required');

  const occurred_at = entry.occurred_at || new Date().toISOString();
  const payload = entry.payload && typeof entry.payload === 'object' ? entry.payload : {};

  const { data, error } = await client.rpc('append_markos_audit_row', {
    p_tenant_id:     entry.tenant_id,
    p_org_id:        entry.org_id || null,
    p_source_domain: entry.source_domain,
    p_action:        entry.action,
    p_actor_id:      entry.actor_id,
    p_actor_role:    entry.actor_role,
    p_payload:       payload,
    p_occurred_at:   occurred_at,
  });

  if (error) throw new Error(`writeAuditRow: rpc failed: ${error.message}`);

  // append_markos_audit_row returns a setof record — Supabase returns an array.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('writeAuditRow: rpc returned no row');
  return { id: row.id, row_hash: row.row_hash, prev_hash: row.prev_hash };
}

// At-least-once staging insert. Used by code paths that do not want to block on the advisory lock.
async function enqueueAuditStaging(client, entry) {
  validateEntry(entry);
  if (!client || typeof client.from !== 'function') throw new Error('enqueueAuditStaging: supabase client required');

  const row = {
    tenant_id:     entry.tenant_id,
    org_id:        entry.org_id || null,
    source_domain: entry.source_domain,
    action:        entry.action,
    actor_id:      entry.actor_id,
    actor_role:    entry.actor_role,
    payload:       entry.payload && typeof entry.payload === 'object' ? entry.payload : {},
    occurred_at:   entry.occurred_at || new Date().toISOString(),
  };

  const { data, error } = await client
    .from('markos_audit_log_staging')
    .insert(row)
    .select('id')
    .single();

  if (error) throw new Error(`enqueueAuditStaging: insert failed: ${error.message}`);
  return { staging_id: data.id };
}

// Exposed for tests + drain.js diagnostics.
function canonicalPayloadForHash(entry) {
  return canonicalJson({
    action:      entry.action,
    actor_id:    entry.actor_id,
    actor_role:  entry.actor_role,
    occurred_at: entry.occurred_at,
    payload:     entry.payload || {},
    tenant_id:   entry.tenant_id,
  });
}

module.exports = {
  AUDIT_SOURCE_DOMAINS,
  writeAuditRow,
  enqueueAuditStaging,
  canonicalPayloadForHash,
};
