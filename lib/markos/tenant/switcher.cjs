'use strict';

const { randomUUID } = require('node:crypto');
const { isReservedSlug } = require('./reserved-slugs.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');
// Phase 201 Plan 08 Task 3: route new tenant INSERTs through the write-through slug cache.
const { writeSlugThroughCache } = require('../orgs/tenants.cjs');

async function listTenantsForUser(client, user_id) {
  if (!user_id) return [];
  const { data: orgMems } = await client
    .from('markos_org_memberships')
    .select('org_id, org_role, markos_orgs!inner(id, slug, name, status)')
    .eq('user_id', user_id);

  const orgMap = new Map();
  for (const m of orgMems || []) {
    const o = m.markos_orgs;
    if (!o || o.status === 'purged') continue;
    orgMap.set(o.id, { org_id: o.id, org_name: o.name, org_slug: o.slug, org_role: m.org_role, tenants: [] });
  }

  const { data: tms } = await client
    .from('markos_tenant_memberships')
    .select('tenant_id, iam_role, markos_tenants!inner(id, slug, name, org_id, status)')
    .eq('user_id', user_id);

  for (const tm of tms || []) {
    const t = tm.markos_tenants;
    if (!t || t.status === 'purged') continue;
    const bucket = orgMap.get(t.org_id);
    if (!bucket) continue;
    bucket.tenants.push({ id: t.id, slug: t.slug, name: t.name, iam_role: tm.iam_role, status: t.status });
  }

  return Array.from(orgMap.values());
}

async function createTenantInOrg(client, input) {
  const { org_id, slug, name, actor_id } = input || {};
  if (!org_id || !slug || !name || !actor_id) throw new Error('createTenantInOrg: missing required field');
  if (isReservedSlug(slug)) {
    const err = new Error('slug_reserved');
    err.code = 'slug_reserved';
    throw err;
  }

  const { data: mem } = await client
    .from('markos_org_memberships')
    .select('org_role')
    .eq('org_id', org_id)
    .eq('user_id', actor_id)
    .maybeSingle();
  if (!mem || !['owner', 'billing-admin'].includes(mem.org_role)) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }

  const { data: existing } = await client.from('markos_tenants').select('id').eq('slug', slug).maybeSingle();
  if (existing) {
    const err = new Error('slug_taken');
    err.code = 'slug_taken';
    throw err;
  }

  const tenant_id = `tenant-${randomUUID()}`;
  const { error: tErr } = await client.from('markos_tenants').insert({
    id: tenant_id, name, org_id, slug, status: 'active',
  });
  if (tErr) throw new Error(`createTenantInOrg: insert failed: ${tErr.message}`);

  await client.from('markos_tenant_memberships').insert({
    id: `tm-${randomUUID()}`, user_id: actor_id, tenant_id, iam_role: 'owner',
  });

  // Phase 201 Plan 08 Task 3: prime the edge-config slug cache at creation time so the
  // first middleware request for this slug hits the cache instead of Supabase.
  try {
    await writeSlugThroughCache({ slug, tenant_id });
  } catch { /* noop — DB insert is source of truth */ }

  try {
    await enqueueAuditStaging(client, {
      tenant_id, org_id, source_domain: 'tenancy',
      action: 'tenant.created',
      actor_id, actor_role: 'owner',
      payload: { slug, name, source: 'switcher' },
    });
  } catch { /* noop */ }

  return { tenant_id, slug };
}

module.exports = { listTenantsForUser, createTenantInOrg };
