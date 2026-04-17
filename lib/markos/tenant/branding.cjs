'use strict';

const { enqueueAuditStaging } = require('../audit/writer.cjs');

const DEFAULT_BRANDING = Object.freeze({
  logo_url: null,
  primary_color: '#0d9488',
  display_name: null,
  vanity_login_enabled: false,
});

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

async function getTenantBranding(client, tenant_id) {
  if (!tenant_id) return { ...DEFAULT_BRANDING };
  const { data } = await client
    .from('markos_tenant_branding')
    .select('logo_url, primary_color, display_name, vanity_login_enabled')
    .eq('tenant_id', tenant_id)
    .maybeSingle();
  if (!data) return { ...DEFAULT_BRANDING };
  return {
    logo_url: data.logo_url || null,
    primary_color: (data.primary_color && HEX_COLOR.test(data.primary_color)) ? data.primary_color : DEFAULT_BRANDING.primary_color,
    display_name: data.display_name || null,
    vanity_login_enabled: !!data.vanity_login_enabled,
  };
}

async function upsertTenantBranding(client, tenant_id, input, actor_id) {
  if (!tenant_id) throw new Error('upsertTenantBranding: tenant_id required');
  const row = { tenant_id, updated_at: new Date().toISOString() };

  if (Object.prototype.hasOwnProperty.call(input, 'logo_url')) row.logo_url = input.logo_url || null;
  if (Object.prototype.hasOwnProperty.call(input, 'display_name')) row.display_name = input.display_name || null;
  if (Object.prototype.hasOwnProperty.call(input, 'vanity_login_enabled')) row.vanity_login_enabled = !!input.vanity_login_enabled;
  if (Object.prototype.hasOwnProperty.call(input, 'primary_color')) {
    const c = String(input.primary_color || '').trim();
    if (!HEX_COLOR.test(c)) throw new Error('upsertTenantBranding: primary_color must match #RRGGBB');
    row.primary_color = c;
  }

  const { error } = await client
    .from('markos_tenant_branding')
    .upsert(row, { onConflict: 'tenant_id' });
  if (error) throw new Error(`upsertTenantBranding: upsert failed: ${error.message}`);

  if (actor_id) {
    try {
      // Need org_id for audit — look it up.
      const { data: tenant } = await client
        .from('markos_tenants')
        .select('org_id')
        .eq('id', tenant_id)
        .maybeSingle();
      await enqueueAuditStaging(client, {
        tenant_id,
        org_id: tenant && tenant.org_id ? tenant.org_id : null,
        source_domain: 'tenancy',
        action: 'tenant_branding.updated',
        actor_id,
        actor_role: 'owner',
        payload: row,
      });
    } catch { /* noop */ }
  }
}

module.exports = { DEFAULT_BRANDING, getTenantBranding, upsertTenantBranding, HEX_COLOR };
