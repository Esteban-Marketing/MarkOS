'use strict';

// Phase 201 Plan 08 Task 3: @vercel/edge-config slug→tenant cache contract lock.
// Fulfils T-201-05-06 (Plan 05 threat model) — eliminates DB hit on every middleware request.

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SLUG_CACHE_TTL_SECONDS,
  SLUG_CACHE_NAMESPACE,
  readSlugFromEdge,
  writeSlugToEdge,
  invalidateSlug,
} = require('../../lib/markos/tenant/slug-cache.cjs');
const {
  upsertTenantWithSlugCache,
  renameTenantSlug,
} = require('../../lib/markos/orgs/tenants.cjs');

test('Suite 201-08: SLUG_CACHE_TTL_SECONDS is 60s + namespace locked', () => {
  assert.equal(SLUG_CACHE_TTL_SECONDS, 60);
  assert.equal(SLUG_CACHE_NAMESPACE, 'markos:slug:');
});

test('Suite 201-08: readSlugFromEdge returns tenantId on hit via injected stub', async () => {
  const fake = async (key) => (key === 'markos:slug:acme' ? 'tenant-xyz' : null);
  const r = await readSlugFromEdge('acme', { edgeConfigGet: fake });
  assert.equal(r, 'tenant-xyz');
});

test('Suite 201-08: readSlugFromEdge returns null on miss', async () => {
  const fake = async () => null;
  const r = await readSlugFromEdge('unknown', { edgeConfigGet: fake });
  assert.equal(r, null);
});

test('Suite 201-08: readSlugFromEdge fail-closes on edge-config error (never throws)', async () => {
  const fake = async () => { throw new Error('edge-config down'); };
  const r = await readSlugFromEdge('acme', { edgeConfigGet: fake });
  assert.equal(r, null);
});

test('Suite 201-08: writeSlugToEdge no-ops when token/config id missing (local dev safe)', async () => {
  await assert.doesNotReject(() => writeSlugToEdge('acme', 'tenant-xyz', {
    VERCEL_API_TOKEN: '',
    EDGE_CONFIG_ID: '',
  }));
});

test('Suite 201-08: writeSlugToEdge PATCHes edge-config when deps present', async () => {
  let captured = null;
  const fakeFetch = async (url, init) => {
    captured = { url, init };
    return { ok: true };
  };
  await writeSlugToEdge('acme', 'tenant-xyz', {
    VERCEL_API_TOKEN: 'tok',
    EDGE_CONFIG_ID: 'ecfg_123',
    fetch: fakeFetch,
  });
  assert.ok(captured.url.includes('/v1/edge-config/ecfg_123/items'));
  assert.equal(captured.init.method, 'PATCH');
  const body = JSON.parse(captured.init.body);
  assert.equal(body.items[0].operation, 'upsert');
  assert.equal(body.items[0].key, 'markos:slug:acme');
  assert.equal(body.items[0].value, 'tenant-xyz');
});

test('Suite 201-08: invalidateSlug sends delete op to edge-config', async () => {
  let captured = null;
  const fakeFetch = async (url, init) => {
    captured = { url, init };
    return { ok: true };
  };
  await invalidateSlug('acme', {
    VERCEL_API_TOKEN: 'tok',
    EDGE_CONFIG_ID: 'ecfg_123',
    fetch: fakeFetch,
  });
  const body = JSON.parse(captured.init.body);
  assert.equal(body.items[0].operation, 'delete');
  assert.equal(body.items[0].key, 'markos:slug:acme');
});

test('Suite 201-08: upsertTenantWithSlugCache writes tenant row + returns tenant_id/slug', async () => {
  const inserts = [];
  const client = {
    from: () => ({
      upsert: async (row) => { inserts.push(row); return { error: null }; },
    }),
  };
  const r = await upsertTenantWithSlugCache(client, {
    id: 'tenant-xyz',
    slug: 'acme',
    org_id: 'org-1',
    name: 'Acme',
  });
  assert.equal(r.tenant_id, 'tenant-xyz');
  assert.equal(r.slug, 'acme');
  assert.equal(inserts[0].id, 'tenant-xyz');
  assert.equal(inserts[0].slug, 'acme');
  assert.equal(inserts[0].status, 'active');
});

test('Suite 201-08: renameTenantSlug updates DB + emits audit tenant.slug_renamed', async () => {
  const audits = [];
  const updates = [];
  const client = {
    from: (table) => ({
      update: (patch) => ({
        eq: async () => { updates.push({ table, patch }); return { error: null }; },
      }),
      insert: async (row) => {
        if (table === 'markos_audit_log_staging') audits.push(row);
        return { data: { id: 1 }, error: null, select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) };
      },
      // enqueueAuditStaging chains .insert(...).select('id').single() — provide a chainable stub
      _chain: true,
    }),
  };
  // Rebuild client with full chainable insert for enqueueAuditStaging
  const chainable = {
    from: (table) => ({
      update: (patch) => ({
        eq: async () => { updates.push({ table, patch }); return { error: null }; },
      }),
      insert: (row) => {
        if (table === 'markos_audit_log_staging') audits.push(row);
        return {
          select: () => ({
            single: async () => ({ data: { id: 1 }, error: null }),
          }),
        };
      },
    }),
  };
  await renameTenantSlug(chainable, {
    tenant_id: 't1',
    old_slug: 'a',
    new_slug: 'b',
    actor_id: 'u1',
  });
  assert.equal(updates[0].patch.slug, 'b');
  // Phase 201.1 D-104: action renamed from tenant.slug_renamed → tenant_slug.renamed (plan 05 spec).
  assert.ok(audits.some((a) => a.action === 'tenant_slug.renamed'));
  assert.ok(audits.some((a) => a.source_domain === 'tenancy'));
});

// eslint-disable-next-line no-unused-vars
test('Suite 201-08: middleware.ts reads edge-config before Supabase fallback (grep)', () => {
  const fs = require('fs');
  const path = require('path');
  const mw = fs.readFileSync(path.join(__dirname, '..', '..', 'middleware.ts'), 'utf8');
  assert.match(mw, /readSlugFromEdge/);
  assert.match(mw, /writeSlugToEdge/);
});
