'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { slugFromEmail, baseSlug, provisionOrgAndTenantOnVerify } = require('../../lib/markos/auth/provisioner.cjs');

test('Suite 201-03: baseSlug uses email domain if present', () => {
  assert.equal(baseSlug('alice@acme.com'), 'acme');
  assert.equal(baseSlug('bob@big-company.io'), 'big-company');
});

test('Suite 201-03: baseSlug falls back to localpart when domain absent', () => {
  assert.equal(baseSlug('alice@'), 'alice');
});

test('Suite 201-03: slugFromEmail avoids reserved slugs', () => {
  // domain 'www' is reserved — slug should not land on it
  const reserved = slugFromEmail('whoever@www.io', new Set());
  assert.notEqual(reserved, 'www');
  assert.ok(reserved.startsWith('www-'), `expected slug to start with www-<suffix>, got ${reserved}`);
});

test('Suite 201-03: slugFromEmail avoids collisions with existingSlugs', () => {
  const s = slugFromEmail('alice@acme.com', new Set(['acme']));
  assert.notEqual(s, 'acme');
  assert.ok(s.startsWith('acme-'));
});

test('Suite 201-03: slugFromEmail leaves clean slugs alone', () => {
  assert.equal(slugFromEmail('alice@mystartup.io', new Set()), 'mystartup');
});

test('Suite 201-03: provisionOrgAndTenantOnVerify is idempotent when user already has an org', async () => {
  const client = {
    from: (table) => {
      if (table === 'markos_orgs') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({ maybeSingle: async () => ({ data: { id: 'org-existing' }, error: null }) }),
            }),
          }),
        };
      }
      if (table === 'markos_tenants') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({ maybeSingle: async () => ({ data: { id: 'tenant-existing', slug: 'existing-slug' }, error: null }) }),
            }),
          }),
        };
      }
      return { insert: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }) };
    },
  };
  const r = await provisionOrgAndTenantOnVerify(client, { user_id: 'user-1', email: 'alice@acme.com' });
  assert.deepEqual(r, { org_id: 'org-existing', tenant_id: 'tenant-existing', slug: 'existing-slug' });
});
