-- Phase 52: Digital Agency Plugin — Core Workflow Tables
-- Tenant-scoped tables for campaign state, approval routing, and scheduling.
--
-- All tables include:
--  - tenant_id (text FK → markos_tenants) for row-level partitioning
--  - RLS deny-by-default aligned with Phase 51 + 52 migration patterns
--  - Immutable audit fields (created_at, updated_at only on campaigns)
--  - campaign_state check constraint to guard workflow transitions
--
-- Naming conventions follow existing MarkOS migrations (snake_case, no prefixes).

-- ============================================================================
-- Campaign state machine
-- States: draft → pending_approval → approved → published (deny_listed, archived)
-- Transitions are enforced at handler layer; DB stores canonical state.
-- ============================================================================

create table if not exists digital_agency_campaigns (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  name text not null default 'Untitled Campaign',
  state text not null default 'draft'
    check (state in ('draft', 'pending_approval', 'approved', 'published', 'deny_listed', 'archived')),
  draft_ids text[] not null default '{}',
  assembled_by text,
  published_by text,
  published_at timestamptz,
  correlation_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table digital_agency_campaigns is 'Tenant-scoped campaign lifecycle records for the Digital Agency plugin';

create index if not exists idx_dac_tenant_id on digital_agency_campaigns(tenant_id);
create index if not exists idx_dac_tenant_state on digital_agency_campaigns(tenant_id, state);
create index if not exists idx_dac_published_at on digital_agency_campaigns(published_at) where state = 'published';

-- ============================================================================
-- Campaign Approvals — append-only approval history
-- Each approval decision creates a new row; no UPDATE or DELETE policies.
-- ============================================================================

create table if not exists digital_agency_campaign_approvals (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  campaign_id text not null references digital_agency_campaigns(id) on delete cascade,
  decision text not null check (decision in ('granted', 'rejected', 'revoked')),
  actor_id text not null,
  actor_role text not null,
  reason text,
  correlation_id text,
  decided_at timestamptz not null default now()
);

comment on table digital_agency_campaign_approvals is 'Immutable append-only approval history for campaigns (no UPDATE/DELETE policies)';

create index if not exists idx_daca_tenant_id on digital_agency_campaign_approvals(tenant_id);
create index if not exists idx_daca_campaign_id on digital_agency_campaign_approvals(campaign_id);
create index if not exists idx_daca_tenant_campaign on digital_agency_campaign_approvals(tenant_id, campaign_id);

-- ============================================================================
-- Campaign Schedules — publish window declarations
-- Scheduler (Phase 54) reads this to drive publish events at scheduled time.
-- ============================================================================

create table if not exists digital_agency_campaign_schedules (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  campaign_id text not null references digital_agency_campaigns(id) on delete cascade,
  publish_at timestamptz not null,
  timezone text not null default 'UTC',
  scheduled_by text not null,
  cancelled_at timestamptz,
  cancelled_by text,
  correlation_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table digital_agency_campaign_schedules is 'Campaign publish window scheduling; Phase 54 drives execution; Phase 52 stores intent';

create index if not exists idx_dacs_tenant_id on digital_agency_campaign_schedules(tenant_id);
create index if not exists idx_dacs_publish_at on digital_agency_campaign_schedules(publish_at) where cancelled_at is null;
create index if not exists idx_dacs_campaign_id on digital_agency_campaign_schedules(campaign_id);

-- ============================================================================
-- Row Level Security: deny by default, tenant-membership-gated
-- Pattern aligned with Phase 51: markos_tenant_memberships join on auth.jwt()->>'sub'
-- ============================================================================

alter table digital_agency_campaigns enable row level security;
alter table digital_agency_campaign_approvals enable row level security;
alter table digital_agency_campaign_schedules enable row level security;

-- digital_agency_campaigns: tenant members may read their own campaigns
create policy if not exists dac_read_own on digital_agency_campaigns
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

-- digital_agency_campaigns: manager/owner/tenant-admin may insert campaigns
create policy if not exists dac_insert_manager on digital_agency_campaigns
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
        and iam_role in ('manager', 'owner', 'tenant-admin')
    )
  );

-- digital_agency_campaigns: manager/owner/tenant-admin may update state
create policy if not exists dac_update_manager on digital_agency_campaigns
  as permissive
  for update
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
        and iam_role in ('manager', 'owner', 'tenant-admin')
    )
  )
  with check (
    tenant_id = (
      select m.tenant_id from markos_tenant_memberships m
      where m.user_id = auth.jwt()->>'sub'
        and m.tenant_id = digital_agency_campaigns.tenant_id
        and m.iam_role in ('manager', 'owner', 'tenant-admin')
    )
  );

-- digital_agency_campaign_approvals: tenant members may read their own approvals
create policy if not exists daca_read_own on digital_agency_campaign_approvals
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

-- digital_agency_campaign_approvals: manager/owner/tenant-admin may insert (append-only)
create policy if not exists daca_insert_manager on digital_agency_campaign_approvals
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
        and iam_role in ('manager', 'owner', 'tenant-admin')
    )
  );

-- No UPDATE/DELETE policies on approvals — immutability enforced by policy absence.

-- digital_agency_campaign_schedules: tenant members may read their own schedules
create policy if not exists dacs_read_own on digital_agency_campaign_schedules
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

-- digital_agency_campaign_schedules: manager/owner/tenant-admin may insert schedules
create policy if not exists dacs_insert_manager on digital_agency_campaign_schedules
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
        and iam_role in ('manager', 'owner', 'tenant-admin')
    )
  );

-- digital_agency_campaign_schedules: allow manager+ to cancel (soft-delete via cancelled_at)
create policy if not exists dacs_update_manager on digital_agency_campaign_schedules
  as permissive
  for update
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
        and iam_role in ('manager', 'owner', 'tenant-admin')
    )
  )
  with check (
    tenant_id = (
      select m.tenant_id from markos_tenant_memberships m
      where m.user_id = auth.jwt()->>'sub'
        and m.tenant_id = digital_agency_campaign_schedules.tenant_id
        and m.iam_role in ('manager', 'owner', 'tenant-admin')
    )
  );
