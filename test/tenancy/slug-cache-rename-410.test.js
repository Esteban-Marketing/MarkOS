'use strict';

// Phase 201.1 Plan 05 Task 2: middleware transitional-410 + renameTenantSlug D-104 tests.
// Closes H5 sub-concerns: propagation race (410 pin) + thundering-herd (single-flight).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Helpers: minimal NextRequest / NextResponse stubs for middleware grep tests
// ---------------------------------------------------------------------------

// Test 1: middleware.ts contains the 410 branch with TRANSITIONAL_PREFIX guard
test('Suite 201.1-05 410: middleware.ts emits 410 + Location + Sunset on __renamed: prefix (source check)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'middleware.ts'), 'utf8');
  assert.match(src, /TRANSITIONAL_PREFIX/, 'middleware must import TRANSITIONAL_PREFIX');
  assert.match(src, /startsWith\(TRANSITIONAL_PREFIX\)/, 'middleware must check __renamed: prefix');
  assert.match(src, /status: 410/, 'middleware must return 410');
  assert.match(src, /Location/, 'middleware must set Location header');
  assert.match(src, /Sunset/, 'middleware must set Sunset header');
  assert.match(src, /singleFlight\.coalesce/, 'middleware must use singleFlight.coalesce for cache-miss path');
});

// Test 2: renameTenantSlug augmented with D-104 flow
test('Suite 201.1-05 410: renameTenantSlug calls writeTransitionalRename + writeSlugToEdgeJittered', async () => {
  const { renameTenantSlug } = require('../../lib/markos/orgs/tenants.cjs');

  const updates = [];
  const audits = [];
  const transitionalCalls = [];
  const jitteredCalls = [];
  const readCalls = [];

  const fakeDeps = {
    VERCEL_API_TOKEN: 'tok',
    EDGE_CONFIG_ID: 'ecfg_test',
    fetch: async (_url, init) => {
      const body = JSON.parse(init.body);
      const item = body.items[0];
      if (item.value && item.value.startsWith('__renamed:')) transitionalCalls.push(item);
      else jitteredCalls.push(item);
      return { ok: true };
    },
    edgeConfigGet: async (key) => {
      readCalls.push(key);
      // Return the transitional value on first poll
      return '__renamed:new-slug';
    },
  };

  const chainable = {
    from: (table) => ({
      update: (patch) => ({
        eq: async () => { updates.push({ table, patch }); return { error: null }; },
      }),
      insert: (row) => {
        if (table === 'markos_audit_log_staging') audits.push(row);
        return { select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) };
      },
    }),
  };

  const result = await renameTenantSlug(chainable, {
    tenant_id: 't1',
    old_slug: 'old-slug',
    new_slug: 'new-slug',
    actor_id: 'u1',
    org_id: 'org-1',
  }, fakeDeps);

  assert.ok(result.ok, 'must return { ok: true }');
  assert.ok(updates.length >= 1, 'must UPDATE markos_tenants');
  assert.equal(updates[0].patch.slug, 'new-slug');

  assert.equal(transitionalCalls.length, 1, 'writeTransitionalRename must be called once');
  assert.equal(transitionalCalls[0].value, '__renamed:new-slug');
  assert.equal(transitionalCalls[0].ttl, 90);

  assert.equal(jitteredCalls.length, 1, 'writeSlugToEdgeJittered must be called once');
  assert.equal(jitteredCalls[0].key, 'markos:slug:new-slug');
  assert.ok(jitteredCalls[0].ttl >= 45 && jitteredCalls[0].ttl <= 75, 'jitter TTL out of range');
});

// Test 3: read-after-write poll — finds transitional pin on retry 2
test('Suite 201.1-05 410: renameTenantSlug polls until transitional pin visible (finds on retry 2)', async () => {
  const { renameTenantSlug } = require('../../lib/markos/orgs/tenants.cjs');

  let pollCount = 0;
  const fakeDeps = {
    VERCEL_API_TOKEN: 'tok',
    EDGE_CONFIG_ID: 'ecfg_test',
    fetch: async () => ({ ok: true }),
    edgeConfigGet: async () => {
      pollCount++;
      // Return null on first poll, transitional value on second
      if (pollCount < 2) return null;
      return '__renamed:new-slug';
    },
  };

  const chainable = {
    from: (table) => ({
      update: (patch) => ({ eq: async () => ({ error: null }) }),
      insert: (row) => ({ select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) }),
    }),
  };

  const result = await renameTenantSlug(chainable, {
    tenant_id: 't1',
    old_slug: 'old-slug',
    new_slug: 'new-slug',
    actor_id: 'u1',
  }, fakeDeps);

  assert.ok(result.ok);
  assert.ok(result.transitional_pin_confirmed, 'transitional_pin_confirmed must be true when poll succeeds');
  assert.ok(pollCount >= 2, `expected at least 2 poll attempts, got ${pollCount}`);
});

// Test 4: renameTenantSlug emits audit row with action='tenant_slug.renamed'
test('Suite 201.1-05 410: renameTenantSlug emits audit row with action tenant_slug.renamed', async () => {
  const { renameTenantSlug } = require('../../lib/markos/orgs/tenants.cjs');

  const audits = [];
  const fakeDeps = {
    VERCEL_API_TOKEN: 'tok',
    EDGE_CONFIG_ID: 'ecfg_test',
    fetch: async () => ({ ok: true }),
    edgeConfigGet: async () => '__renamed:renamed-slug',
  };

  const chainable = {
    from: (table) => ({
      update: () => ({ eq: async () => ({ error: null }) }),
      insert: (row) => {
        if (table === 'markos_audit_log_staging') audits.push(row);
        return { select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) };
      },
    }),
  };

  await renameTenantSlug(chainable, {
    tenant_id: 't-audit',
    old_slug: 'before',
    new_slug: 'renamed-slug',
    actor_id: 'u-audit',
    org_id: 'org-audit',
  }, fakeDeps);

  assert.ok(audits.length >= 1, 'audit row must be inserted');
  const auditRow = audits[0];
  assert.equal(auditRow.action, 'tenant_slug.renamed');
  assert.equal(auditRow.source_domain, 'tenancy');
  assert.equal(auditRow.tenant_id, 't-audit');
  assert.ok(auditRow.payload && auditRow.payload.old_slug === 'before');
  assert.ok(auditRow.payload && auditRow.payload.new_slug === 'renamed-slug');
});
