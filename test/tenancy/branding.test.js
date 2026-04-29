'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_BRANDING, getTenantBranding, upsertTenantBranding } = require('../../lib/markos/tenant/branding.cjs');

test('Suite 201-06: DEFAULT_BRANDING primary_color is WCAG-compliant teal accent', () => {
  // Phase 201.1-07: updated from #0d9488 (~3.86:1, failing) to #0f766e (~4.79:1, passing).
  assert.equal(DEFAULT_BRANDING.primary_color, '#0f766e');
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
  // Phase 201.1-07: default color updated to #0f766e (WCAG-compliant).
  assert.equal(b.primary_color, '#0f766e');
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
  // Phase 201.1-07: #ff0000 fails WCAG AA (~3.99:1); using #cc0000 (~5.89:1) instead.
  await upsertTenantBranding(client, 'tenant-x', { display_name: 'Acme', primary_color: '#cc0000', vanity_login_enabled: true });
  assert.equal(writtenRow.tenant_id, 'tenant-x');
  assert.equal(writtenRow.primary_color, '#cc0000');
  assert.equal(writtenRow.display_name, 'Acme');
  assert.equal(writtenRow.vanity_login_enabled, true);
});

// ── Phase 201.1-07 new cases ────────────────────────────────────────────────

test('Suite 201.1-07: upsertTenantBranding rejects low-contrast color with WCAG AA error', async () => {
  const client = { from: () => ({ upsert: async () => ({ error: null }) }) };
  await assert.rejects(
    () => upsertTenantBranding(client, 'tenant-x', { primary_color: '#ffffe0' }),
    (err) => {
      assert.ok(err.message.includes('contrast ratio'), `Missing 'contrast ratio' in: ${err.message}`);
      assert.ok(err.message.includes('WCAG AA'), `Missing 'WCAG AA' in: ${err.message}`);
      return true;
    },
  );
});

test('Suite 201.1-07: upsertTenantBranding accepts high-contrast black', async () => {
  let writtenRow = null;
  const client = {
    from: () => ({
      upsert: async (row) => { writtenRow = row; return { error: null }; },
    }),
  };
  await upsertTenantBranding(client, 'tenant-x', { primary_color: '#000000' });
  assert.equal(writtenRow.primary_color, '#000000');
});

test('Suite 201.1-07: upsertTenantBranding without primary_color does not trigger contrast check', async () => {
  let writtenRow = null;
  const client = {
    from: () => ({
      upsert: async (row) => { writtenRow = row; return { error: null }; },
    }),
  };
  // Only logo_url — must NOT trigger the contrast gate.
  await upsertTenantBranding(client, 'tenant-x', { logo_url: 'https://example.com/logo.png' });
  assert.ok(!Object.prototype.hasOwnProperty.call(writtenRow, 'primary_color'), 'primary_color should not be set');
});

test('Suite 201.1-07: upsertTenantBranding accepts WCAG-compliant corrected default teal #0f766e', async () => {
  let writtenRow = null;
  const client = {
    from: () => ({
      upsert: async (row) => { writtenRow = row; return { error: null }; },
    }),
  };
  await upsertTenantBranding(client, 'tenant-x', { primary_color: '#0f766e' });
  assert.equal(writtenRow.primary_color, '#0f766e');
});
