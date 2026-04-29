'use strict';

// Phase 201.1 D-109 (closes M6): tests for admin reserved-slug CRUD endpoints.
// F-106 contract — 3 endpoints: list, add, remove.

const test = require('node:test');
const assert = require('node:assert/strict');
const { clearReservedSlugCache } = require('../../lib/markos/tenant/reserved-slugs.cjs');

const listHandler = require('../../api/admin/reserved-slugs/list.js');
const addHandler = require('../../api/admin/reserved-slugs/add.js');
const removeHandler = require('../../api/admin/reserved-slugs/remove.js');

// ---- Constants ----

const SYSTEM_ADMIN_USER_ID = 'user-system-admin-001';
const NON_OWNER_USER_ID = 'user-non-owner-002';
const TENANT_0_ORG_ID = 'org-tenant-0';

// ---- Mock client factory ----

function makeSeedSlugStore() {
  return [
    { slug: 'vendor-slug', category: 'vendor', source_version: '201-01', added_at: new Date().toISOString(), added_by: 'migration-92', notes: null },
    { slug: 'admin-added', category: 'profanity', source_version: 'admin-2026-01-01', added_at: new Date().toISOString(), added_by: 'user-system-admin-001', notes: 'test entry' },
    { slug: 'www', category: 'system', source_version: '201-01', added_at: new Date().toISOString(), added_by: 'migration-92', notes: null },
    { slug: 'auth', category: 'protected', source_version: '201-01', added_at: new Date().toISOString(), added_by: 'migration-92', notes: null },
    { slug: 'a', category: 'single_char', source_version: '201-01', added_at: new Date().toISOString(), added_by: 'migration-92', notes: null },
  ];
}

/**
 * Builds a mock Supabase client that simulates Tenant-0 RBAC + markos_reserved_slugs table.
 * @param {object} opts
 * @param {string|null} opts.userRole  - org_role to return for the user (null = no membership row)
 * @param {Array}       opts.slugStore - shared in-memory slug array (mutated by insert/delete)
 */
function makeMockClient({ userRole = 'owner', slugStore = null } = {}) {
  if (slugStore === null) slugStore = makeSeedSlugStore();
  const auditLog = [];

  function orgsTable() {
    // Handler calls: .from('markos_orgs').select('id').eq('slug','tenant-0').maybeSingle()
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { id: TENANT_0_ORG_ID }, error: null }),
        }),
      }),
    };
  }

  function membershipsTable() {
    // Handler calls: .from('markos_org_memberships').select('org_role').eq('user_id',...).eq('org_id',...).maybeSingle()
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({
              data: userRole ? { org_role: userRole } : null,
              error: null,
            }),
          }),
        }),
      }),
    };
  }

  function reservedSlugsTable() {
    return {
      // list handler: .select(...).order(...).order(...)
      select: () => {
        const orderResult = Object.assign(
          Promise.resolve({ data: [...slugStore], error: null }),
          { order: () => Promise.resolve({ data: [...slugStore], error: null }) },
        );
        return {
          // remove handler: .select(...).eq(...).maybeSingle()
          eq: (col, val) => {
            const row = slugStore.find((r) => r[col] === val) || null;
            return { maybeSingle: () => Promise.resolve({ data: row, error: null }) };
          },
          order: () => orderResult,
        };
      },
      insert: (row) => {
        if (slugStore.find((r) => r.slug === row.slug)) {
          return Promise.resolve({ error: { message: 'duplicate key', code: '23505' } });
        }
        slugStore.push({ ...row, added_at: new Date().toISOString() });
        return Promise.resolve({ data: row, error: null });
      },
      delete: () => ({
        eq: (col, val) => {
          const idx = slugStore.findIndex((r) => r[col] === val);
          if (idx !== -1) slugStore.splice(idx, 1);
          return Promise.resolve({ error: null });
        },
      }),
    };
  }

  function auditStagingTable() {
    return {
      insert: (row) => ({
        select: () => ({
          single: () => {
            auditLog.push(row);
            return Promise.resolve({ data: { id: 'staging-' + auditLog.length }, error: null });
          },
        }),
      }),
    };
  }

  const client = {
    _auditLog: auditLog,
    _slugStore: slugStore,
    from: (table) => {
      if (table === 'markos_orgs') return orgsTable();
      if (table === 'markos_org_memberships') return membershipsTable();
      if (table === 'markos_reserved_slugs') return reservedSlugsTable();
      if (table === 'markos_audit_log_staging') return auditStagingTable();
      throw new Error(`unexpected table: ${table}`);
    },
  };
  return client;
}

// ---- Request/response builder ----

function makeReqRes({ method = 'GET', headers = {}, body = null } = {}) {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    end(data) { this.body = data || null; },
  };
  const req = {
    method,
    headers,
    body,
    url: 'http://localhost/api/admin/reserved-slugs',
    on: (event, cb) => {
      if (event === 'data' && body !== null) cb(typeof body === 'string' ? body : JSON.stringify(body));
      if (event === 'end') cb();
      return req;
    },
  };
  return { req, res };
}

// ---- Test lifecycle helpers ----

function withClient(mockClient, fn) {
  listHandler._setClientFactory(() => mockClient);
  try {
    return Promise.resolve(fn()).finally(() => listHandler._resetClientFactory());
  } catch (e) {
    listHandler._resetClientFactory();
    throw e;
  }
}

// ============================================================================
// LIST tests
// ============================================================================

test('GET /list: 401 without X-Markos-User-Id header', async () => {
  const { req, res } = makeReqRes({ method: 'GET', headers: {} });
  await withClient(makeMockClient(), () => listHandler(req, res));
  assert.equal(res.statusCode, 401);
  assert.equal(JSON.parse(res.body).error, 'auth_required');
});

test('GET /list: 403 for non-owner user', async () => {
  const { req, res } = makeReqRes({ method: 'GET', headers: { 'x-markos-user-id': NON_OWNER_USER_ID } });
  await withClient(makeMockClient({ userRole: 'member' }), () => listHandler(req, res));
  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).error, 'system_admin_required');
});

test('GET /list: 200 with slugs array + total for system admin', async () => {
  const { req, res } = makeReqRes({ method: 'GET', headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID } });
  await withClient(makeMockClient({ userRole: 'owner' }), () => listHandler(req, res));
  assert.equal(res.statusCode, 200, `body: ${res.body}`);
  const body = JSON.parse(res.body);
  assert.ok(Array.isArray(body.slugs));
  assert.equal(typeof body.total, 'number');
  assert.equal(body.slugs.length, body.total);
});

test('GET /list: 405 for non-GET method', async () => {
  const { req, res } = makeReqRes({ method: 'POST', headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID } });
  await withClient(makeMockClient(), () => listHandler(req, res));
  assert.equal(res.statusCode, 405);
});

// ============================================================================
// ADD tests
// ============================================================================

test('POST /add: 401 without header', async () => {
  const { req, res } = makeReqRes({ method: 'POST', headers: {}, body: { slug: 'test-slug', category: 'vendor' } });
  await withClient(makeMockClient(), () => addHandler(req, res));
  assert.equal(res.statusCode, 401);
});

test('POST /add: 403 for non-owner', async () => {
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': NON_OWNER_USER_ID },
    body: { slug: 'test-slug', category: 'vendor' },
  });
  await withClient(makeMockClient({ userRole: 'member' }), () => addHandler(req, res));
  assert.equal(res.statusCode, 403);
});

test('POST /add: 400 for invalid category', async () => {
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'valid-slug', category: 'invalid' },
  });
  await withClient(makeMockClient({ userRole: 'owner' }), () => addHandler(req, res));
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, 'invalid_category');
});

test('POST /add: 400 for invalid slug format (uppercase + special chars)', async () => {
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'BAD@SLUG', category: 'vendor' },
  });
  await withClient(makeMockClient({ userRole: 'owner' }), () => addHandler(req, res));
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error, 'invalid_slug');
});

test('POST /add: 200 for valid input + audit row emitted', async () => {
  clearReservedSlugCache();
  const slugStore = [];
  const mockClient = makeMockClient({ userRole: 'owner', slugStore });
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'new-vendor-slug', category: 'vendor', notes: 'Added by admin test' },
  });
  await withClient(mockClient, () => addHandler(req, res));
  assert.equal(res.statusCode, 200, `body: ${res.body}`);
  const body = JSON.parse(res.body);
  assert.equal(body.ok, true);
  assert.equal(body.slug, 'new-vendor-slug');
  assert.ok(slugStore.some((r) => r.slug === 'new-vendor-slug'), 'slug must be persisted');
  assert.equal(mockClient._auditLog.length, 1, 'exactly one audit row emitted');
  assert.equal(mockClient._auditLog[0].action, 'reserved_slug.added');
  assert.equal(mockClient._auditLog[0].source_domain, 'governance');
});

test('POST /add: cache invalidated — newly added slug recognized by isReservedSlugAsync', async () => {
  clearReservedSlugCache();
  const slugStore = [];
  const mockClient = makeMockClient({ userRole: 'owner', slugStore });
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'cache-test-slug', category: 'vendor' },
  });
  await withClient(mockClient, () => addHandler(req, res));
  assert.equal(res.statusCode, 200);

  // After the handler runs, clearReservedSlugCache() was called inside add.js.
  // A fresh isReservedSlugAsync call with a client that returns the new slug must return true.
  const { isReservedSlugAsync } = require('../../lib/markos/tenant/reserved-slugs.cjs');
  const clientWithNewSlug = {
    from: () => ({
      select: () => Promise.resolve({ data: [{ slug: 'cache-test-slug' }], error: null }),
    }),
  };
  const result = await isReservedSlugAsync('cache-test-slug', clientWithNewSlug);
  assert.equal(result, true, 'newly added slug must be recognized after cache clear');
});

// ============================================================================
// REMOVE tests
// ============================================================================

test('POST /remove: 401 without header', async () => {
  const { req, res } = makeReqRes({ method: 'POST', headers: {}, body: { slug: 'vendor-slug' } });
  await withClient(makeMockClient(), () => removeHandler(req, res));
  assert.equal(res.statusCode, 401);
});

test('POST /remove: 403 for non-owner', async () => {
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': NON_OWNER_USER_ID },
    body: { slug: 'vendor-slug' },
  });
  await withClient(makeMockClient({ userRole: 'member' }), () => removeHandler(req, res));
  assert.equal(res.statusCode, 403);
});

test('POST /remove: 409 category_locked for system category', async () => {
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'www' },
  });
  await withClient(makeMockClient({ userRole: 'owner' }), () => removeHandler(req, res));
  assert.equal(res.statusCode, 409);
  assert.equal(JSON.parse(res.body).error, 'category_locked');
});

test('POST /remove: 409 category_locked for protected category', async () => {
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'auth' },
  });
  await withClient(makeMockClient({ userRole: 'owner' }), () => removeHandler(req, res));
  assert.equal(res.statusCode, 409);
  assert.equal(JSON.parse(res.body).error, 'category_locked');
});

test('POST /remove: 409 category_locked for single_char category', async () => {
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'a' },
  });
  await withClient(makeMockClient({ userRole: 'owner' }), () => removeHandler(req, res));
  assert.equal(res.statusCode, 409);
  assert.equal(JSON.parse(res.body).error, 'category_locked');
});

test('POST /remove: 200 for vendor category + audit row emitted', async () => {
  clearReservedSlugCache();
  const slugStore = [
    { slug: 'vendor-slug', category: 'vendor', source_version: '201-01', added_at: new Date().toISOString(), added_by: 'migration-92', notes: null },
  ];
  const mockClient = makeMockClient({ userRole: 'owner', slugStore });
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'vendor-slug' },
  });
  await withClient(mockClient, () => removeHandler(req, res));
  assert.equal(res.statusCode, 200, `body: ${res.body}`);
  assert.equal(JSON.parse(res.body).ok, true);
  assert.ok(!slugStore.some((r) => r.slug === 'vendor-slug'), 'vendor-slug must be removed');
  assert.equal(mockClient._auditLog.length, 1, 'exactly one audit row emitted');
  assert.equal(mockClient._auditLog[0].action, 'reserved_slug.removed');
  assert.equal(mockClient._auditLog[0].source_domain, 'governance');
});

test('POST /remove: 404 for slug that does not exist', async () => {
  const { req, res } = makeReqRes({
    method: 'POST',
    headers: { 'x-markos-user-id': SYSTEM_ADMIN_USER_ID },
    body: { slug: 'does-not-exist' },
  });
  await withClient(makeMockClient({ userRole: 'owner', slugStore: [] }), () => removeHandler(req, res));
  assert.equal(res.statusCode, 404);
});
