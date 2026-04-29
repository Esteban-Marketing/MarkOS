'use strict';

// Phase 201.1 D-102 (closes H3): single-use nonce tests for consumeExportNonce.

const test = require('node:test');
const assert = require('node:assert/strict');
const { consumeExportNonce } = require('../../lib/markos/tenant/gdpr-export.cjs');

// Builds a mock Supabase client that stores a pre-seeded export row
// and a consumed ledger in memory.
function makeClient({ exportRow, consumed = [] } = {}) {
  const consumedLedger = [...consumed];
  const auditStaged = [];

  const client = {
    _auditStaged: auditStaged,
    from: (table) => {
      if (table === 'markos_gdpr_exports') {
        return {
          select: (cols) => ({
            eq: (col, val) => ({
              maybeSingle: async () => {
                if (exportRow && exportRow.id === val) {
                  return { data: exportRow, error: null };
                }
                return { data: null, error: null };
              },
            }),
          }),
        };
      }
      if (table === 'markos_gdpr_export_consumed') {
        return {
          insert: (row) => {
            const key = `${row.export_id}::${row.nonce}`;
            const alreadyConsumed = consumedLedger.some(c => `${c.export_id}::${c.nonce}` === key);
            if (alreadyConsumed) {
              return { then: (resolve) => resolve({ error: { message: 'duplicate key value violates unique constraint' } }), error: { message: 'duplicate key value' } };
            }
            consumedLedger.push(row);
            return { then: (resolve) => resolve({ error: null }), error: null };
          },
        };
      }
      if (table === 'markos_audit_log_staging') {
        return {
          insert: (row) => {
            auditStaged.push(row);
            return { select: () => ({ single: async () => ({ data: { id: auditStaged.length }, error: null }) }) };
          },
        };
      }
      return { insert: () => ({ then: (r) => r({ error: null }) }) };
    },
  };

  return { client, consumedLedger, auditStaged };
}

const FUTURE = new Date(Date.now() + 3600 * 1000).toISOString();
const PAST = new Date(Date.now() - 3600 * 1000).toISOString();

const BASE_ROW = {
  id: 'gdpr-test-001',
  audience_tenant_id: 'tenant-a',
  signed_url: 'https://r2.example/exports/tenant-a/gdpr-test-001.zip',
  object_key: 'exports/tenant-a/gdpr-test-001.zip',
  bucket: 'markos-gdpr',
  expires_at: FUTURE,
  nonce: 'aabbcc00' + '0'.repeat(56),
};

test('Suite 201.1-08: consumeExportNonce — first call returns ok=true', async () => {
  const { client } = makeClient({ exportRow: { ...BASE_ROW } });

  const result = await consumeExportNonce(client, {
    export_id: BASE_ROW.id,
    nonce: BASE_ROW.nonce,
    session_id: 'sess-001',
    user_id: 'user-001',
    requesting_tenant_id: 'tenant-a',
  });

  assert.equal(result.ok, true);
  assert.ok(result.signed_url, 'signed_url must be returned on success');
  assert.ok(result.object_key, 'object_key must be returned on success');
});

test('Suite 201.1-08: consumeExportNonce — second call with same nonce returns ok=false reason=consumed', async () => {
  // Pre-seed the consumed ledger so the insert will fail with PK violation.
  const { client } = makeClient({
    exportRow: { ...BASE_ROW },
    consumed: [{ export_id: BASE_ROW.id, nonce: BASE_ROW.nonce }],
  });

  const result = await consumeExportNonce(client, {
    export_id: BASE_ROW.id,
    nonce: BASE_ROW.nonce,
    session_id: 'sess-002',
    user_id: 'user-001',
    requesting_tenant_id: 'tenant-a',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'consumed');
});

test('Suite 201.1-08: consumeExportNonce — replay emits gdpr_export.replay_blocked audit', async () => {
  const { client, auditStaged } = makeClient({
    exportRow: { ...BASE_ROW },
    consumed: [{ export_id: BASE_ROW.id, nonce: BASE_ROW.nonce }],
  });

  await consumeExportNonce(client, {
    export_id: BASE_ROW.id,
    nonce: BASE_ROW.nonce,
    session_id: 'sess-replay',
    user_id: 'user-001',
    requesting_tenant_id: 'tenant-a',
  });

  const replayAudit = auditStaged.find(r => r.action === 'gdpr_export.replay_blocked');
  assert.ok(replayAudit, 'must emit replay_blocked audit row');
  assert.equal(replayAudit.source_domain, 'governance');
});

test('Suite 201.1-08: consumeExportNonce — cross-tenant returns ok=false reason=audience_mismatch', async () => {
  const { client } = makeClient({ exportRow: { ...BASE_ROW } });

  const result = await consumeExportNonce(client, {
    export_id: BASE_ROW.id,
    nonce: BASE_ROW.nonce,
    session_id: 'sess-003',
    user_id: 'user-evil',
    requesting_tenant_id: 'tenant-b', // wrong tenant
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'audience_mismatch');
});

test('Suite 201.1-08: consumeExportNonce — expired export returns ok=false reason=expired', async () => {
  const expiredRow = { ...BASE_ROW, expires_at: PAST };
  const { client } = makeClient({ exportRow: expiredRow });

  const result = await consumeExportNonce(client, {
    export_id: expiredRow.id,
    nonce: expiredRow.nonce,
    session_id: 'sess-004',
    user_id: 'user-001',
    requesting_tenant_id: 'tenant-a',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'expired');
});

test('Suite 201.1-08: consumeExportNonce — unknown export_id returns ok=false reason=not_found', async () => {
  const { client } = makeClient({ exportRow: null });

  const result = await consumeExportNonce(client, {
    export_id: 'gdpr-does-not-exist',
    nonce: '0'.repeat(64),
    requesting_tenant_id: 'tenant-a',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'not_found');
});

test('Suite 201.1-08: consumeExportNonce — success emits gdpr_export.downloaded audit', async () => {
  const { client, auditStaged } = makeClient({ exportRow: { ...BASE_ROW } });

  const result = await consumeExportNonce(client, {
    export_id: BASE_ROW.id,
    nonce: BASE_ROW.nonce,
    session_id: 'sess-005',
    user_id: 'user-001',
    requesting_tenant_id: 'tenant-a',
  });

  assert.equal(result.ok, true);
  const dlAudit = auditStaged.find(r => r.action === 'gdpr_export.downloaded');
  assert.ok(dlAudit, 'must emit gdpr_export.downloaded audit row');
  assert.equal(dlAudit.source_domain, 'governance');
});
