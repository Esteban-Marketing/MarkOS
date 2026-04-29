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

const {
  writeSlugToEdge,
  invalidateSlug,
  writeTransitionalRename,
  writeSlugToEdgeJittered,
  readSlugFromEdge,
  TRANSITIONAL_PREFIX,
} = require('../tenant/slug-cache.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');

// Phase 201.1 D-104: backoff delays for read-after-write verification poll.
const RENAME_POLL_DELAYS_MS = [50, 100, 200];

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

async function renameTenantSlug(client, input, deps) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('renameTenantSlug: client required');
  }
  const { tenant_id, old_slug, new_slug } = input || {};
  if (!tenant_id || !old_slug || !new_slug) {
    throw new Error('renameTenantSlug: tenant_id + old_slug + new_slug required');
  }
  if (old_slug === new_slug) return { ok: true, no_op: true };

  // 1. UPDATE the canonical row.
  const { error } = await client
    .from('markos_tenants')
    .update({ slug: new_slug, updated_at: new Date().toISOString() })
    .eq('id', tenant_id);
  if (error) throw new Error(`renameTenantSlug: update failed: ${error.message}`);

  // 2. Phase 201.1 D-104: pin transitional 410 marker on old slug (90s).
  await writeTransitionalRename(old_slug, new_slug, deps);

  // 3. Backfill jittered cache entry for new slug.
  await writeSlugToEdgeJittered(new_slug, tenant_id, deps);

  // 4. Read-after-write verification: poll until transitional pin is visible in calling region.
  let confirmed = false;
  for (const delay of RENAME_POLL_DELAYS_MS) {
    await new Promise((r) => setTimeout(r, delay));
    const v = await readSlugFromEdge(old_slug, deps);
    if (typeof v === 'string' && v.startsWith(TRANSITIONAL_PREFIX)) {
      confirmed = true;
      break;
    }
  }
  if (!confirmed) {
    // Fail-soft: propagation may still catch up; log but do not throw.
    // eslint-disable-next-line no-console
    console.warn(`renameTenantSlug: transitional pin for ${old_slug} not confirmed after ${RENAME_POLL_DELAYS_MS.length} retries`);
  }

  // 5. Emit audit row.
  try {
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id: input.org_id || null,
      source_domain: 'tenancy',
      action: 'tenant_slug.renamed',
      actor_id: input.actor_id || 'system',
      actor_role: input.actor_role || 'owner',
      payload: { old_slug, new_slug, transitional_pin_confirmed: confirmed },
    });
  } catch {
    // Audit is best-effort — primary write already succeeded.
  }

  return { ok: true, transitional_pin_confirmed: confirmed };
}

module.exports = {
  writeSlugThroughCache,
  upsertTenantWithSlugCache,
  renameTenantSlug,
};
