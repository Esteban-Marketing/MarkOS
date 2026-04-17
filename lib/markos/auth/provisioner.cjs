'use strict';

const { randomUUID } = require('node:crypto');
const { createOrg, addOrgMember } = require('../orgs/api.cjs');
const { DEFAULT_SEAT_QUOTA } = require('../orgs/contracts.cjs');
const { isReservedSlug } = require('../tenant/reserved-slugs.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');

function baseSlug(email) {
  const local = (email || '').toLowerCase().trim().split('@')[0] || 'workspace';
  const domain = (email || '').toLowerCase().trim().split('@')[1] || '';
  const candidate = domain.split('.')[0] || local;
  return candidate.replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'workspace';
}

function slugFromEmail(email, existingSlugs) {
  const set = existingSlugs instanceof Set ? existingSlugs : new Set();
  let candidate = baseSlug(email);
  if (!isReservedSlug(candidate) && !set.has(candidate)) return candidate;

  // Append a short random suffix until we find a slot.
  for (let i = 0; i < 10; i++) {
    const suffix = randomUUID().slice(0, 6);
    const attempt = `${candidate}-${suffix}`;
    if (!isReservedSlug(attempt) && !set.has(attempt)) return attempt;
  }
  // Last resort
  return `workspace-${randomUUID().slice(0, 8)}`;
}

async function getExistingTenantSlugs(client) {
  const { data, error } = await client.from('markos_tenants').select('slug');
  if (error) return new Set();
  return new Set((data || []).map(r => r.slug).filter(Boolean));
}

async function provisionOrgAndTenantOnVerify(client, input) {
  const { user_id, email } = input || {};
  if (!user_id || !email) throw new Error('provisionOrgAndTenantOnVerify: user_id + email required');

  // Idempotency guard: if this user already owns an org, return it.
  const { data: existingOrg } = await client
    .from('markos_orgs')
    .select('id')
    .eq('owner_user_id', user_id)
    .limit(1)
    .maybeSingle();
  if (existingOrg && existingOrg.id) {
    const { data: existingTenant } = await client
      .from('markos_tenants')
      .select('id, slug')
      .eq('org_id', existingOrg.id)
      .limit(1)
      .maybeSingle();
    if (existingTenant) {
      return { org_id: existingOrg.id, tenant_id: existingTenant.id, slug: existingTenant.slug };
    }
  }

  const existingSlugs = await getExistingTenantSlugs(client);
  const slug = slugFromEmail(email, existingSlugs);

  // 1) Create org (owner_user_id = supabase auth user id)
  const org = await createOrg(client, {
    slug,
    name: `${slug} workspace`,
    owner_user_id: user_id,
    seat_quota: DEFAULT_SEAT_QUOTA,
  });

  // 2) Create tenant under the org
  const tenantId = `tenant-${randomUUID()}`;
  const { data: tenant, error: tErr } = await client
    .from('markos_tenants')
    .insert({
      id: tenantId,
      name: `${slug} workspace`,
      org_id: org.id,
      slug,
      status: 'active',
    })
    .select()
    .single();
  if (tErr) throw new Error(`provisionOrgAndTenantOnVerify: tenant insert failed: ${tErr.message}`);

  // 3) Org membership — owner
  await addOrgMember(client, { org_id: org.id, user_id, org_role: 'owner' });

  // 4) Tenant membership — owner (iam_role from migration 51 enum)
  const tmId = `tm-${randomUUID()}`;
  const { error: tmErr } = await client
    .from('markos_tenant_memberships')
    .insert({ id: tmId, user_id, tenant_id: tenant.id, iam_role: 'owner' });
  if (tmErr) throw new Error(`provisionOrgAndTenantOnVerify: tenant membership failed: ${tmErr.message}`);

  // 5) Audit event (source_domain='auth')
  try {
    await enqueueAuditStaging(client, {
      tenant_id: tenant.id,
      org_id: org.id,
      source_domain: 'auth',
      action: 'tenant.created',
      actor_id: user_id,
      actor_role: 'owner',
      payload: { slug, email, source: 'public_signup' },
    });
  } catch (err) {
    // Best-effort — auth flow must not block on audit. Cron drain retries.
    // eslint-disable-next-line no-console
    console.warn('[provisioner] audit staging failed:', err.message);
  }

  // 6) Cleanup buffer row
  await client.from('markos_unverified_signups').delete().eq('email', email.trim().toLowerCase());

  return { org_id: org.id, tenant_id: tenant.id, slug };
}

module.exports = { provisionOrgAndTenantOnVerify, slugFromEmail, baseSlug };
