'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_BRANDING, getTenantBranding, upsertTenantBranding } = require('../../lib/markos/tenant/branding.cjs');

test('Suite 201-06: DEFAULT_BRANDING primary_color is teal accent', () => {
  assert.equal(DEFAULT_BRANDING.primary_color, '#0d9488');
  assert.equal(DEFAULT_BRANDING.vanity_login_enabled, false);
});

test('Suite 201-06: getTenantBranding returns defaults when row missing', async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    }),
  };
  const b = await getTenantBranding(client, 'tenant-x');
  assert.deepEqual(b, { ...DEFAULT_BRANDING });
});

test('Suite 201-06: getTenantBranding falls back to default color when stored value is invalid', async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { logo_url: null, primary_color: 'not-a-color', display_name: 'X', vanity_login_enabled: true }, error: null }) }),
      }),
    }),
  };
  const b = await getTenantBranding(client, 'tenant-x');
  assert.equal(b.primary_color, '#0d9488');
  assert.equal(b.display_name, 'X');
});

test('Suite 201-06: upsertTenantBranding rejects invalid hex color', async () => {
  const client = { from: () => ({ upsert: async () => ({ error: null }) }) };
  await assert.rejects(
    () => upsertTenantBranding(client, 'tenant-x', { primary_color: 'bluish' }),
    /primary_color must match/,
  );
});

test('Suite 201-06: upsertTenantBranding writes row on valid input', async () => {
  let writtenRow = null;
  const client = {
    from: () => ({
      upsert: async (row) => { writtenRow = row; return { error: null }; },
    }),
  };
  await upsertTenantBranding(client, 'tenant-x', { display_name: 'Acme', primary_color: '#ff0000', vanity_login_enabled: true });
  assert.equal(writtenRow.tenant_id, 'tenant-x');
  assert.equal(writtenRow.primary_color, '#ff0000');
  assert.equal(writtenRow.display_name, 'Acme');
  assert.equal(writtenRow.vanity_login_enabled, true);
});
