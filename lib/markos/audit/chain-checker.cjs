'use strict';

const { createHash } = require('node:crypto');
const { canonicalJson } = require('./canonical.cjs');

function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex');
}

function computeRowHash(prev_hash, canonical_payload) {
  return sha256Hex(prev_hash + canonical_payload);
}

async function verifyTenantChain(client, tenant_id) {
  if (!client || typeof client.from !== 'function') throw new Error('verifyTenantChain: client required');
  if (typeof tenant_id !== 'string' || !tenant_id) throw new Error('verifyTenantChain: tenant_id required');

  const { data, error } = await client
    .from('markos_audit_log')
    .select('id, tenant_id, action, actor_id, actor_role, payload, occurred_at, prev_hash, row_hash')
    .eq('tenant_id', tenant_id)
    .order('id', { ascending: true });

  if (error) throw new Error(`verifyTenantChain: select failed: ${error.message}`);
  const rows = data || [];

  if (rows.length === 0) {
    return { ok: true, row_count: 0, breaks: [] };
  }

  const genesis = sha256Hex('genesis:' + tenant_id);
  let expected_prev = genesis;
  const breaks = [];

  for (const row of rows) {
    if (row.prev_hash !== expected_prev) {
      breaks.push({
        row_id: row.id,
        expected_prev_hash: expected_prev,
        actual_prev_hash: row.prev_hash,
        actual_row_hash: row.row_hash,
        reason: 'prev_hash mismatch',
      });
      // Continue from the actual row_hash so we only flag the one break point.
      expected_prev = row.row_hash;
      continue;
    }

    const canonical = canonicalJson({
      action:      row.action,
      actor_id:    row.actor_id,
      actor_role:  row.actor_role,
      occurred_at: typeof row.occurred_at === 'string' ? row.occurred_at : new Date(row.occurred_at).toISOString(),
      payload:     row.payload || {},
      tenant_id:   row.tenant_id,
    });

    const expected_row_hash = computeRowHash(row.prev_hash, canonical);
    if (expected_row_hash !== row.row_hash) {
      breaks.push({
        row_id: row.id,
        expected_row_hash,
        actual_row_hash: row.row_hash,
        reason: 'row_hash mismatch',
      });
    }

    expected_prev = row.row_hash;
  }

  return { ok: breaks.length === 0, row_count: rows.length, breaks };
}

module.exports = { computeRowHash, verifyTenantChain };
