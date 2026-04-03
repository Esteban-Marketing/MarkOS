-- Phase 52: Plugin Runtime Foundation
-- Establishes tenant-plugin enablement, capability grants, and plan entitlement tables.
--
-- Key principles (aligned with Phase 51 deny-by-default conventions):
-- - All plugin access is denied by default; tenants must explicitly enable each plugin
-- - plugin_tenant_config: per-tenant plugin enable/disable and capability grants
-- - plugin_tenant_capability_grants: immutable append-only capability grant history
-- - plugin_entitlements_by_plan: maps plugins to subscription plan tiers (Phase 54 enforces)
-- - RLS policies include both USING (read) and WITH CHECK (write) clauses
-- - tenant_id is the canonical partition key on all plugin tables

-- ============================================================================
-- Plugin Registry Metadata
-- Central record of all registered first-party plugins.
-- ============================================================================

create table if not exists markos_plugins (
  id text primary key,
  version text not null,
  name text not null,
  description text not null default '',
  required_capabilities text[] not null default '{}',
  required_iam_roles text[] not null default '{}',
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table markos_plugins is 'First-party plugin registry — canonical plugin metadata; updated at server boot';

-- ============================================================================
-- Tenant Plugin Configuration
-- Per-tenant plugin enablement state and capability grant set.
-- ============================================================================

create table if not exists plugin_tenant_config (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  plugin_id text not null references markos_plugins(id) on delete cascade,
  enabled boolean not null default false,
  granted_capabilities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, plugin_id)
);

comment on table plugin_tenant_config is 'Per-tenant plugin enablement and capability grants; default off for all tenants';

create index if not exists idx_plugin_tenant_config_tenant_id on plugin_tenant_config(tenant_id);
create index if not exists idx_plugin_tenant_config_plugin_id on plugin_tenant_config(plugin_id);
create index if not exists idx_plugin_tenant_config_tenant_plugin on plugin_tenant_config(tenant_id, plugin_id);

-- ============================================================================
-- Capability Grant History
-- Immutable append-only records of each capability grant/revoke event.
-- Phase 54 may use for billing; Phase 52 records for auditability.
-- ============================================================================

create table if not exists plugin_tenant_capability_grants (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  plugin_id text not null,
  capability text not null,
  granted_by text not null,
  action text not null check (action in ('grant', 'revoke')),
  granted_at timestamptz not null default now(),
  correlation_id text
);

comment on table plugin_tenant_capability_grants is 'Immutable append-only audit trail of capability grant/revoke events per tenant+plugin';

create index if not exists idx_plugin_capability_grants_tenant_id on plugin_tenant_capability_grants(tenant_id);
create index if not exists idx_plugin_capability_grants_tenant_plugin on plugin_tenant_capability_grants(tenant_id, plugin_id);

-- ============================================================================
-- Plan Entitlements
-- Maps plugins to subscription plan tiers. Phase 54 enforces at request time;
-- Phase 52 creates the data structure.
-- ============================================================================

create table if not exists plugin_entitlements_by_plan (
  id text primary key default gen_random_uuid()::text,
  plan_tier text not null check (plan_tier in ('free', 'starter', 'pro', 'enterprise')),
  plugin_id text not null references markos_plugins(id) on delete cascade,
  allowed_capabilities text[] not null default '{}',
  feature_flags jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_tier, plugin_id)
);

comment on table plugin_entitlements_by_plan is 'Plugin capability entitlements by subscription tier; Phase 54 enforces at runtime';

create index if not exists idx_plugin_entitlements_plan on plugin_entitlements_by_plan(plan_tier);
create index if not exists idx_plugin_entitlements_plugin on plugin_entitlements_by_plan(plugin_id);

-- ============================================================================
-- Row Level Security: Deny by default on plugin tables
-- Aligned with Phase 51 deny-by-default conventions.
-- ============================================================================

alter table markos_plugins enable row level security;
alter table plugin_tenant_config enable row level security;
alter table plugin_tenant_capability_grants enable row level security;
alter table plugin_entitlements_by_plan enable row level security;

-- markos_plugins: all authenticated users can read plugin metadata
create policy if not exists markos_plugins_read_all on markos_plugins
  as permissive
  for select
  using (auth.role() = 'authenticated');

-- markos_plugins: only system role can insert/update (managed by server, not users)
create policy if not exists markos_plugins_write_system on markos_plugins
  as permissive
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- plugin_tenant_config: tenants read only their own plugin configuration
create policy if not exists plugin_tenant_config_read_own on plugin_tenant_config
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

-- plugin_tenant_config: only owner/tenant-admin may insert or update plugin config
create policy if not exists plugin_tenant_config_write_admin on plugin_tenant_config
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
        and iam_role in ('owner', 'tenant-admin')
    )
  );

create policy if not exists plugin_tenant_config_update_admin on plugin_tenant_config
  as permissive
  for update
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
        and iam_role in ('owner', 'tenant-admin')
    )
  )
  with check (
    tenant_id = (
      select m.tenant_id from markos_tenant_memberships m
      where m.user_id = auth.jwt()->>'sub'
        and m.tenant_id = plugin_tenant_config.tenant_id
        and m.iam_role in ('owner', 'tenant-admin')
    )
  );

-- plugin_tenant_capability_grants: tenants read only their own grant history
create policy if not exists plugin_capability_grants_read_own on plugin_tenant_capability_grants
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

-- plugin_tenant_capability_grants: append-only inserts by owner/tenant-admin only
create policy if not exists plugin_capability_grants_insert_admin on plugin_tenant_capability_grants
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
        and iam_role in ('owner', 'tenant-admin')
    )
  );

-- No UPDATE/DELETE on capability grants — append-only immutability enforced by policy absence.

-- plugin_entitlements_by_plan: all authenticated may read (public plan info)
create policy if not exists plugin_entitlements_read_all on plugin_entitlements_by_plan
  as permissive
  for select
  using (auth.role() = 'authenticated');

-- plugin_entitlements_by_plan: system role only for writes
create policy if not exists plugin_entitlements_write_system on plugin_entitlements_by_plan
  as permissive
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- Seed Phase 52 Digital Agency plugin into registry
-- ============================================================================

insert into markos_plugins (id, version, name, description, required_capabilities, required_iam_roles)
  values (
    'digital-agency-v1',
    '1.0.0',
    'Digital Agency',
    'First-party Digital Agency plugin: agency workflows, campaign approvals, and scheduling.',
    array['read_drafts', 'read_campaigns', 'write_campaigns', 'publish_campaigns', 'read_approvals', 'write_approvals'],
    array['manager', 'owner', 'tenant-admin']
  )
  on conflict (id) do update set
    version = excluded.version,
    name = excluded.name,
    description = excluded.description,
    required_capabilities = excluded.required_capabilities,
    required_iam_roles = excluded.required_iam_roles,
    updated_at = now();

-- Seed Phase 52 plan entitlements (Phase 54 enforces at request time)
insert into plugin_entitlements_by_plan (plan_tier, plugin_id, allowed_capabilities, feature_flags)
  values
    ('free',       'digital-agency-v1', array['read_drafts', 'read_campaigns'], '{"read_only": true}'::jsonb),
    ('starter',    'digital-agency-v1', array['read_drafts', 'read_campaigns', 'write_campaigns'], '{}'::jsonb),
    ('pro',        'digital-agency-v1', array['read_drafts', 'read_campaigns', 'write_campaigns', 'publish_campaigns', 'read_approvals', 'write_approvals'], '{}'::jsonb),
    ('enterprise', 'digital-agency-v1', array['read_drafts', 'read_campaigns', 'write_campaigns', 'publish_campaigns', 'read_approvals', 'write_approvals', 'read_telemetry', 'trigger_workflows'], '{}'::jsonb)
  on conflict (plan_tier, plugin_id) do nothing;
