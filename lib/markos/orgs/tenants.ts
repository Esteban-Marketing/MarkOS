// Phase 201 Plan 08 Task 3: TypeScript dual-export for tenants write-through helpers.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const t = require('./tenants.cjs');

export type UpsertTenantInput = {
  id: string;
  slug: string;
  org_id: string;
  name: string;
  status?: string;
};

export type RenameTenantSlugInput = {
  tenant_id: string;
  old_slug: string;
  new_slug: string;
  actor_id?: string;
  actor_role?: string;
  org_id?: string | null;
};

export type RenameTenantSlugResult = {
  ok: boolean;
  no_op?: boolean;
  transitional_pin_confirmed?: boolean;
};

export const writeSlugThroughCache: (
  input: { slug: string; tenant_id: string },
) => Promise<void> = t.writeSlugThroughCache;

export const upsertTenantWithSlugCache: (
  client: unknown,
  input: UpsertTenantInput,
) => Promise<{ tenant_id: string; slug: string }> = t.upsertTenantWithSlugCache;

export const renameTenantSlug: (
  client: unknown,
  input: RenameTenantSlugInput,
  deps?: import('../tenant/slug-cache').SlugCacheDeps,
) => Promise<RenameTenantSlugResult> = t.renameTenantSlug;
