'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createSupabaseAuditStore,
  createInMemoryAuditStore,
} = require('../../onboarding/backend/vault/supabase-audit-store.cjs');
const {
  createAuditStore,
} = require('../../onboarding/backend/vault/audit-store.cjs');

function createFakeSupabase() {
  const rows = [];

  return {
    _rows: rows,
    from() {
      const state = {
        tenantId: null,
      };

      return {
        async insert(payload) {
          rows.push({ ...payload });
          return {
            data: [{ ...payload }],
            error: null,
          };
        },
        select() {
          const selected = state.tenantId
            ? rows.filter((row) => row.tenant_id === state.tenantId)
            : rows.slice();
          return {
            data: selected.map((row) => ({ ...row })),
            error: null,
          };
        },
        eq(column, value) {
          if (column === 'tenant_id') {
            state.tenantId = value;
          }
          return this;
        },
        async delete() {
          if (state.tenantId) {
            const keep = rows.filter((row) => row.tenant_id !== state.tenantId);
            rows.length = 0;
            rows.push(...keep);
          } else {
            rows.length = 0;
          }
          return {
            error: null,
          };
        },
      };
    },
  };
}

test('append persists entry with appended_at and lineage keys', async () => {
  const supabase = createFakeSupabase();
  const store = createSupabaseAuditStore({ supabase, tableName: 'audit_lineage' });

  const saved = await store.append({
    tenant_id: 'tenant-alpha',
    artifact_id: 'artifact-001',
    doc_id: 'doc-001',
    view: 'agent',
  });

  assert.equal(saved.tenant_id, 'tenant-alpha');
  assert.equal(saved.artifact_id, 'artifact-001');
  assert.equal(saved.doc_id, 'doc-001');
  assert.equal(saved.view, 'agent');
  assert.ok(saved.appended_at);
  assert.equal(typeof saved.appended_at, 'string');
});

test('getAll({ tenantId }) returns only matching tenant rows', async () => {
  const supabase = createFakeSupabase();
  const store = createSupabaseAuditStore({ supabase, tableName: 'audit_lineage' });

  await store.append({ tenant_id: 'tenant-alpha', artifact_id: 'a-1' });
  await store.append({ tenant_id: 'tenant-beta', artifact_id: 'b-1' });

  const rows = await store.getAll({ tenantId: 'tenant-alpha' });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].tenant_id, 'tenant-alpha');
  assert.equal(rows[0].artifact_id, 'a-1');
});

test('size returns row count for selected mode', async () => {
  const inMemory = createInMemoryAuditStore();
  await inMemory.append({ tenant_id: 'tenant-alpha', artifact_id: 'a-1' });
  await inMemory.append({ tenant_id: 'tenant-alpha', artifact_id: 'a-2' });
  assert.equal(await inMemory.size(), 2);

  const supabase = createFakeSupabase();
  const supabaseStore = createSupabaseAuditStore({ supabase, tableName: 'audit_lineage' });
  await supabaseStore.append({ tenant_id: 'tenant-alpha', artifact_id: 'a-1' });
  assert.equal(await supabaseStore.size(), 1);
});

test('clear empties store in fallback mode and supabase mode', async () => {
  const inMemory = createInMemoryAuditStore();
  await inMemory.append({ tenant_id: 'tenant-alpha', artifact_id: 'a-1' });
  await inMemory.clear();
  assert.equal(await inMemory.size(), 0);

  const supabase = createFakeSupabase();
  const supabaseStore = createSupabaseAuditStore({ supabase, tableName: 'audit_lineage' });
  await supabaseStore.append({ tenant_id: 'tenant-alpha', artifact_id: 'a-1' });
  await supabaseStore.clear();
  assert.equal(await supabaseStore.size(), 0);
});

test('createAuditStore falls back to in-memory when supabase is missing', async () => {
  const store = createAuditStore({ mode: 'in-memory' });
  await store.append({ tenant_id: 'tenant-alpha', artifact_id: 'a-1' });
  assert.equal(await store.size(), 1);
});
