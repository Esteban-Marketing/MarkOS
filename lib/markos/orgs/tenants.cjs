'use strict';

// Phase 201 Plan 08 Task 3: Tenant row CRUD + write-through slug cache hook.
// Callers: Plan 03 signup provisioner, Plan 07 switcher.createTenantInOrg (follow-up wiring),
// any future markos_tenants INSERT/UPDATE path. The write-through keeps the edge-config
// slug cache primed at creation time so the very first middleware request can hit-read.
//
// Contracts:
//   upsertTenantWithSlugCache(client, input) → { tenant_id, slug }
//   renameTenantSlug(client, { tenant_id, old_slug, new_slug, actor_id? }) → void
//   writeSlugThroughCache({ slug, tenant_id }) → void      (thin composite for other writers)

const { writeSlugToEdge, invalidateSlug } = require('../tenant/slug-cache.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');

async function writeSlugThroughCache({ slug, tenant_id }) {
  if (!slug || !tenant_id) return;
  await writeSlugToEdge(slug, tenant_id);
}

async function upsertTenantWithSlugCache(client, input) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('upsertTenantWithSlugCache: client required');
  }
  const { id, slug, org_id, name } = input || {};
  if (!id || !slug || !org_id || !name) {
    throw new Error('upsertTenantWithSlugCache: id, slug, org_id, name required');
  }

  const row = {
    id,
    slug,
    org_id,
    name,
    status: input.status || 'active',
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from('markos_tenants')
    .upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`upsertTenantWithSlugCache: upsert failed: ${error.message}`);

  await writeSlugThroughCache({ slug, tenant_id: id });
  return { tenant_id: id, slug };
}

async function renameTenantSlug(client, input) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('renameTenantSlug: client required');
  }
  const { tenant_id, old_slug, new_slug } = input || {};
  if (!tenant_id || !old_slug || !new_slug) {
    throw new Error('renameTenantSlug: tenant_id + old_slug + new_slug required');
  }
  if (old_slug === new_slug) return;

  const { error } = await client
    .from('markos_tenants')
    .update({ slug: new_slug, updated_at: new Date().toISOString() })
    .eq('id', tenant_id);
  if (error) throw new Error(`renameTenantSlug: update failed: ${error.message}`);

  await invalidateSlug(old_slug);
  await writeSlugToEdge(new_slug, tenant_id);

  try {
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id: input.org_id || null,
      source_domain: 'tenancy',
      action: 'tenant.slug_renamed',
      actor_id: input.actor_id || 'system',
      actor_role: input.actor_role || 'owner',
      payload: { old_slug, new_slug },
    });
  } catch {
    // Audit is best-effort — primary write already succeeded.
  }
}

module.exports = {
  writeSlugThroughCache,
  upsertTenantWithSlugCache,
  renameTenantSlug,
};
