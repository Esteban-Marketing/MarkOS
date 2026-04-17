'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { listTenantsForUser, createTenantInOrg } = require('../../lib/markos/tenant/switcher.cjs');

test('Suite 201-07: createTenantInOrg rejects reserved slug (D-11)', async () => {
  const client = { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { org_role: 'owner' } }) }) }) }), insert: async () => ({ error: null }) }) };
  await assert.rejects(
    () => createTenantInOrg(client, { org_id: 'o1', slug: 'claude', name: 'X', actor_id: 'u1' }),
    /slug_reserved/,
  );
});

test('Suite 201-07: createTenantInOrg rejects non-owner', async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { org_role: 'member' }, error: null }) }) }),
      }),
    }),
  };
  await assert.rejects(
    () => createTenantInOrg(client, { org_id: 'o1', slug: 'acme2', name: 'X', actor_id: 'u1' }),
    /forbidden/,
  );
});

test('Suite 201-07: createTenantInOrg rejects slug_taken', async () => {
  const client = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { org_role: 'owner' }, error: null }) }),
          maybeSingle: async () => (table === 'markos_tenants' ? { data: { id: 'existing' }, error: null } : { data: null, error: null }),
        }),
      }),
    }),
  };
  await assert.rejects(
    () => createTenantInOrg(client, { org_id: 'o1', slug: 'acme2', name: 'X', actor_id: 'u1' }),
    /slug_taken/,
  );
});

test('Suite 201-07: listTenantsForUser returns empty array when user has no memberships', async () => {
  const client = { from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }) };
  const r = await listTenantsForUser(client, 'u-none');
  assert.deepEqual(r, []);
});
