'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveHost, SYSTEM_SUBDOMAINS, resolveTenantBySlug, resolveTenantByDomain } = require('../../lib/markos/tenant/resolver.cjs');

test('Suite 201-05: resolveHost — bare apex', () => {
  const r = resolveHost('markos.dev', 'markos.dev');
  assert.equal(r.kind, 'bare');
  assert.equal(r.host, 'markos.dev');
  assert.equal(r.apex, 'markos.dev');
});

test('Suite 201-05: resolveHost — www.markos.dev is system', () => {
  const r = resolveHost('www.markos.dev', 'markos.dev');
  assert.equal(r.kind, 'system');
  assert.equal(r.slug, 'www');
});

test('Suite 201-05: resolveHost — first-party slug', () => {
  const r = resolveHost('acme.markos.dev', 'markos.dev');
  assert.equal(r.kind, 'first_party');
  assert.equal(r.slug, 'acme');
});

test('Suite 201-05: resolveHost — reserved slug (claude)', () => {
  const r = resolveHost('claude.markos.dev', 'markos.dev');
  assert.equal(r.kind, 'reserved');
  assert.equal(r.slug, 'claude');
  assert.equal(r.is_reserved, true);
});

test('Suite 201-05: resolveHost — BYOD domain', () => {
  const r = resolveHost('acme.com', 'markos.dev');
  assert.equal(r.kind, 'byod');
  assert.equal(r.host, 'acme.com');
});

test('Suite 201-05: resolveHost — case-insensitive + strips port', () => {
  const r = resolveHost('ACME.Markos.DEV:3000', 'markos.dev');
  assert.equal(r.kind, 'first_party');
  assert.equal(r.slug, 'acme');
});

test('Suite 201-05: SYSTEM_SUBDOMAINS is frozen', () => {
  assert.ok(SYSTEM_SUBDOMAINS.has('api'));
  assert.ok(SYSTEM_SUBDOMAINS.has('admin'));
});

test('Suite 201-05: resolveTenantBySlug returns null for missing tenant', async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    }),
  };
  const r = await resolveTenantBySlug(client, 'ghost');
  assert.equal(r, null);
});

test('Suite 201-05: resolveTenantBySlug returns row for active tenant', async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { id: 'tenant-acme', org_id: 'org-acme', status: 'active' }, error: null }) }),
        }),
      }),
    }),
  };
  const r = await resolveTenantBySlug(client, 'acme');
  assert.deepEqual(r, { tenant_id: 'tenant-acme', org_id: 'org-acme', status: 'active' });
});

test('Suite 201-05: resolveTenantByDomain filters on status=verified only', async () => {
  let capturedFilter = null;
  function makeEq() {
    return (col, val) => {
      if (col === 'status') capturedFilter = val;
      return {
        eq: makeEq(),
        maybeSingle: async () => ({ data: null, error: null }),
      };
    };
  }
  const client = {
    from: () => ({
      select: () => ({ eq: makeEq() }),
    }),
  };
  await resolveTenantByDomain(client, 'byod.example.com');
  assert.equal(capturedFilter, 'verified');
});
