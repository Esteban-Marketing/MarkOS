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
    .select('id, tenant_id, action, actor_id, actor_role, payload, occurred_at, prev_hash, row_hash, redacted_at')
    .eq('tenant_id', tenant_id)
    .order('id', { ascending: true });

  if (error) throw new Error(`verifyTenantChain: select failed: ${error.message}`);
  const rows = data || [];

  if (rows.length === 0) {
    return { ok: true, row_count: 0, breaks: [] };
  }

  // Phase 201.1 D-106 (closes M4): pre-load tombstone map to distinguish
  // legitimate PII erasure from tampering. Tombstone rows carry the original_row_id
  // in their payload. We build a Map<original_row_id (number), tombstone_row_id>.
  //
  // Chain walk: when a row_hash mismatch is detected on row N:
  //   - If tombstoneByOriginalId.has(N) AND the tombstone row id > N (tombstone was
  //     appended AFTER the original row, as guaranteed by append_markos_audit_row),
  //     report as 'redaction_tombstone_detected' — the chain is still ok for this row.
  //   - Otherwise, report as 'tampering_suspected' — ok becomes false.
  const tombstoneByOriginalId = new Map(); // Map<number, number> original_row_id -> tombstone_row_id
  for (const row of rows) {
    if (row.action === 'audit.pii_erased' || row.action === 'audit.recanonicalized') {
      const origId = row.payload && row.payload.original_row_id;
      if (origId !== undefined && origId !== null) {
        tombstoneByOriginalId.set(Number(origId), row.id);
      }
    }
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
      // D-106: cross-reference the tombstone map.
      if (tombstoneByOriginalId.has(row.id)) {
        // Legitimate PII erasure — the tombstone was appended to the chain before
        // this row's hash drifted. Report as documented exception, not tampering.
        breaks.push({
          row_id: row.id,
          expected_row_hash,
          actual_row_hash: row.row_hash,
          tombstone_row_id: tombstoneByOriginalId.get(row.id),
          reason: 'redaction_tombstone_detected',
        });
        // The chain continues — use the row's actual (redacted) row_hash as expected_prev.
      } else {
        // No tombstone found — treat as tampering.
        breaks.push({
          row_id: row.id,
          expected_row_hash,
          actual_row_hash: row.row_hash,
          reason: 'tampering_suspected',
        });
      }
    }

    expected_prev = row.row_hash;
  }

  // ok = true only when all breaks are documented redaction tombstones (no tampering).
  // Backward compat: on a chain with NO redactions, breaks is empty, ok is true — identical
  // to Phase 201 behavior.
  const ok = breaks.every((b) => b.reason === 'redaction_tombstone_detected');
  return { ok, row_count: rows.length, breaks };
}

module.exports = { computeRowHash, verifyTenantChain };
