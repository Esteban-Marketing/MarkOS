'use strict';

// Phase 201.1 D-102 (closes H3): reissueExport tests.

const test = require('node:test');
const assert = require('node:assert/strict');
const { reissueExport } = require('../../lib/markos/tenant/gdpr-export.cjs');

function makeClient({ tenantRow, memberRow, exportRow, updateShouldFail = false } = {}) {
  const updates = [];
  const auditStaged = [];

  const client = {
    _updates: updates,
    _auditStaged: auditStaged,
    from: (table) => ({
      select: (cols) => ({
        eq: (col, val) => ({
          maybeSingle: async () => {
            if (table === 'markos_tenants') return { data: tenantRow || null };
            if (table === 'markos_org_memberships') return { data: memberRow || null };
            if (table === 'markos_gdpr_exports') return { data: exportRow || null };
            return { data: null };
          },
          eq: (col2, val2) => ({
            maybeSingle: async () => {
              if (table === 'markos_org_memberships') return { data: memberRow || null };
              return { data: null };
            },
          }),
        }),
      }),
      update: (payload) => {
        updates.push({ table, payload });
        return {
          eq: (col, val) => ({
            then: (resolve) => resolve(updateShouldFail ? { error: { message: 'db error' } } : { error: null }),
            error: updateShouldFail ? { message: 'db error' } : null,
          }),
        };
      },
      insert: (row) => {
        auditStaged.push(row);
        return { select: () => ({ single: async () => ({ data: { id: auditStaged.length }, error: null }) }) };
      },
    }),
  };

  return { client, updates, auditStaged };
}

const FUTURE = new Date(Date.now() + 3600 * 1000).toISOString();

const BASE_EXPORT = {
  id: 'gdpr-reissue-001',
  audience_tenant_id: 'tenant-x',
};

test('Suite 201.1-08: reissueExport — owner role required; non-owner throws', async () => {
  const { client } = makeClient({
    tenantRow: { org_id: 'org-1' },
    memberRow: { role: 'contributor' }, // not owner
    exportRow: BASE_EXPORT,
  });

  await assert.rejects(
    () => reissueExport(client, {
      export_id: 'gdpr-reissue-001',
      actor_user_id: 'user-contrib',
      session_id: 'sess-x',
      requesting_tenant_id: 'tenant-x',
    }),
    /owner role required/,
  );
});

test('Suite 201.1-08: reissueExport — rotates nonce (new value !== old)', async () => {
  const OLD_NONCE = 'ff'.repeat(32); // 64 hex chars
  const exportRow = { ...BASE_EXPORT };

  const { client, updates } = makeClient({
    tenantRow: { org_id: 'org-1' },
    memberRow: { role: 'owner' },
    exportRow,
  });

  const result = await reissueExport(client, {
    export_id: 'gdpr-reissue-001',
    actor_user_id: 'user-owner',
    session_id: 'sess-owner',
    requesting_tenant_id: 'tenant-x',
  });

  assert.ok(result.nonce, 'nonce must be present');
  assert.ok(typeof result.nonce === 'string' && result.nonce.length === 64, 'nonce must be 64 hex chars');
  assert.notEqual(result.nonce, OLD_NONCE, 'new nonce must differ from any fixed value');

  // The update payload must include the new nonce.
  const upd = updates.find(u => u.table === 'markos_gdpr_exports');
  assert.ok(upd, 'must call UPDATE on markos_gdpr_exports');
  assert.equal(upd.payload.nonce, result.nonce, 'update payload nonce must match returned nonce');
});

test('Suite 201.1-08: reissueExport — extends expires_at to ~24h from now', async () => {
  const { client } = makeClient({
    tenantRow: { org_id: 'org-1' },
    memberRow: { role: 'owner' },
    exportRow: BASE_EXPORT,
  });

  const before = Date.now();
  const result = await reissueExport(client, {
    export_id: 'gdpr-reissue-001',
    actor_user_id: 'user-owner',
    session_id: 'sess-owner',
    requesting_tenant_id: 'tenant-x',
  });
  const after = Date.now();

  const expiresMs = new Date(result.expires_at).getTime();
  assert.ok(expiresMs >= before + 86400 * 1000 - 5_000, 'new expires_at must be at least 24h from now');
  assert.ok(expiresMs <= after  + 86400 * 1000 + 5_000, 'new expires_at must not exceed 24h+5s from now');
});

test('Suite 201.1-08: reissueExport — emits gdpr_export.reissued audit row', async () => {
  const { client, auditStaged } = makeClient({
    tenantRow: { org_id: 'org-1' },
    memberRow: { role: 'owner' },
    exportRow: BASE_EXPORT,
  });

  await reissueExport(client, {
    export_id: 'gdpr-reissue-001',
    actor_user_id: 'user-owner',
    session_id: 'sess-owner',
    requesting_tenant_id: 'tenant-x',
  });

  const reissueAudit = auditStaged.find(r => r && r.action === 'gdpr_export.reissued');
  assert.ok(reissueAudit, 'must emit gdpr_export.reissued audit row');
  assert.equal(reissueAudit.source_domain, 'governance');
  assert.equal(reissueAudit.actor_id, 'user-owner');
});

test('Suite 201.1-08: reissueExport — audience_mismatch throws', async () => {
  const { client } = makeClient({
    tenantRow: { org_id: 'org-1' },
    memberRow: { role: 'owner' },
    exportRow: { id: 'gdpr-reissue-001', audience_tenant_id: 'tenant-other' }, // different tenant
  });

  await assert.rejects(
    () => reissueExport(client, {
      export_id: 'gdpr-reissue-001',
      actor_user_id: 'user-owner',
      requesting_tenant_id: 'tenant-x',
    }),
    /audience_mismatch/,
  );
});
