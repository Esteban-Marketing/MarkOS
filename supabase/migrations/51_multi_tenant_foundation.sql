-- Phase 51: Multi-Tenant Foundation and Authorization
-- Establishes tenant data model, membership explicit contracts, and tenant_id RLS baseline.
-- 
-- Key principles:
-- - tenant_id is the canonical partition key for all tenant-scoped data
-- - workspace_id is retained for backward compatibility during transition
-- - All access is denied by default; tenant membership must be explicitly resolved
-- - RLS policies include both USING (read) and WITH CHECK (write) clauses

-- ============================================================================
-- Core Tenant Tables
-- ============================================================================

create table if not exists markos_tenants (
  id text primary key,
  name text not null,
  workspace_id text references markos_workspaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table markos_tenants is 'Core tenant (workspace upgrade) - canonical identity for tenant-scoped data partitioning';

create table if not exists markos_tenant_memberships (
  id text primary key,
  user_id text not null,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  iam_role text not null default 'readonly' 
    check (iam_role in ('owner', 'tenant-admin', 'manager', 'contributor', 'reviewer', 'billing-admin', 'readonly')),
  legacy_role text,
  workspace_id text references markos_workspaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tenant_id)
);

comment on table markos_tenant_memberships is 'Explicit user->role->tenant membership; supports multi-tenancy without implicit cross-tenant trust';

create index if not exists idx_markos_tenant_memberships_user_id on markos_tenant_memberships(user_id);
create index if not exists idx_markos_tenant_memberships_tenant_id on markos_tenant_memberships(tenant_id);

-- ============================================================================
-- Backfill tenant_id into existing workspace-scoped tables
-- ============================================================================

-- Add tenant_id column to markos_company table (nullable during backfill, becomes required after migration)
alter table markos_company 
  add column if not exists tenant_id text references markos_tenants(id) on delete cascade;

-- Add tenant_id column to markos_mir_documents
alter table markos_mir_documents
  add column if not exists tenant_id text references markos_tenants(id) on delete cascade;

-- Add tenant_id column to markos_msp_plans
alter table markos_msp_plans
  add column if not exists tenant_id text references markos_tenants(id) on delete cascade;

-- Add tenant_id column to markos_icps
alter table markos_icps
  add column if not exists tenant_id text references markos_tenants(id) on delete cascade;

-- Add tenant_id column to markos_segments
alter table markos_segments
  add column if not exists tenant_id text references markos_tenants(id) on delete cascade;

-- Add tenant_id column to markos_campaigns
alter table markos_campaigns
  add column if not exists tenant_id text references markos_tenants(id) on delete cascade;

-- Add tenant_id column to markos_revisions
alter table markos_revisions
  add column if not exists tenant_id text references markos_tenants(id) on delete cascade;

-- Add tenant_id column to markos_audit_log
alter table markos_audit_log
  add column if not exists tenant_id text references markos_tenants(id) on delete cascade;

-- Backfill tenant_id from workspace_id via a synthetic tenant entry
-- (In production, this would be more sophisticated; for now, create one tenant per workspace)
insert into markos_tenants (id, name, workspace_id, created_at, updated_at)
  select 
    'tenant-' || id,
    name,
    id as workspace_id,
    now(),
    now()
  from markos_workspaces
  where not exists (select 1 from markos_tenants where workspace_id = markos_workspaces.id)
  on conflict (id) do nothing;

-- Backfill tenant_id on all existing records from their workspace_id reference
update markos_company 
  set tenant_id = (select id from markos_tenants where workspace_id = markos_company.workspace_id limit 1)
  where tenant_id is null;

update markos_mir_documents
  set tenant_id = (select id from markos_tenants where workspace_id = markos_mir_documents.workspace_id limit 1)
  where tenant_id is null;

update markos_msp_plans
  set tenant_id = (select id from markos_tenants where workspace_id = markos_msp_plans.workspace_id limit 1)
  where tenant_id is null;

update markos_icps
  set tenant_id = (select id from markos_tenants where workspace_id = markos_icps.workspace_id limit 1)
  where tenant_id is null;

update markos_segments
  set tenant_id = (select id from markos_tenants where workspace_id = markos_segments.workspace_id limit 1)
  where tenant_id is null;

update markos_campaigns
  set tenant_id = (select id from markos_tenants where workspace_id = markos_campaigns.workspace_id limit 1)
  where tenant_id is null;

update markos_revisions
  set tenant_id = (select id from markos_tenants where workspace_id = markos_revisions.workspace_id limit 1)
  where tenant_id is null;

update markos_audit_log
  set tenant_id = (select id from markos_tenants where workspace_id = markos_audit_log.workspace_id limit 1)
  where tenant_id is null;

-- ============================================================================
-- Indexes for tenant_id partitioning
-- ============================================================================

create index if not exists idx_markos_company_tenant_id on markos_company(tenant_id);
create index if not exists idx_markos_mir_documents_tenant_id on markos_mir_documents(tenant_id);
create index if not exists idx_markos_msp_plans_tenant_id on markos_msp_plans(tenant_id);
create index if not exists idx_markos_icps_tenant_id on markos_icps(tenant_id);
create index if not exists idx_markos_segments_tenant_id on markos_segments(tenant_id);
create index if not exists idx_markos_campaigns_tenant_id on markos_campaigns(tenant_id);
create index if not exists idx_markos_revisions_tenant_id on markos_revisions(tenant_id);
create index if not exists idx_markos_audit_log_tenant_id on markos_audit_log(tenant_id);

-- ============================================================================
-- Row Level Security: Enable RLS on all tenant-scoped tables
-- ============================================================================

alter table markos_tenants enable row level security;
alter table markos_tenant_memberships enable row level security;
alter table markos_company enable row level security;
alter table markos_mir_documents enable row level security;
alter table markos_msp_plans enable row level security;
alter table markos_icps enable row level security;
alter table markos_segments enable row level security;
alter table markos_campaigns enable row level security;
alter table markos_revisions enable row level security;
alter table markos_audit_log enable row level security;

-- ============================================================================
-- RLS Policies: Tenant membership-based access control
-- All policies enforce deny-by-default: access only when tenant membership is verified
-- ============================================================================

-- Tenant table read policy: Only allow reading tenants where actor has membership
create policy if not exists markos_tenants_read_via_membership on markos_tenants
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_tenants.id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- Membership table read policy: Only allow reading own memberships
create policy if not exists markos_tenant_memberships_read_own on markos_tenant_memberships
  as permissive
  for select
  using (
    user_id = auth.jwt()->>'sub'
  );

-- Company table read policy: Require tenant membership for the tenant_id
create policy if not exists markos_company_read_via_tenant on markos_company
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_company.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- Company table write policy: Require tenant membership + explicit tenant check
create policy if not exists markos_company_write_via_tenant on markos_company
  as permissive
  for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_company.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    tenant_id = (
      select markos_tenant_memberships.tenant_id
      from markos_tenant_memberships
      where markos_tenant_memberships.user_id = auth.jwt()->>'sub'
      and markos_tenant_memberships.tenant_id = markos_company.tenant_id
    )
  );

-- Insert policy for company: Verify tenant_id in POST data matches membership
create policy if not exists markos_company_insert_via_tenant on markos_company
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_company.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- MIR Documents: Read via tenant membership
create policy if not exists markos_mir_documents_read_via_tenant on markos_mir_documents
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_documents.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- MIR Documents: Insert via tenant membership
create policy if not exists markos_mir_documents_insert_via_tenant on markos_mir_documents
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_documents.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- MIR Documents: Update via tenant membership
create policy if not exists markos_mir_documents_update_via_tenant on markos_mir_documents
  as permissive
  for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_documents.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    tenant_id = (
      select markos_tenant_memberships.tenant_id
      from markos_tenant_memberships
      where markos_tenant_memberships.user_id = auth.jwt()->>'sub'
      and markos_tenant_memberships.tenant_id = markos_mir_documents.tenant_id
    )
  );

-- MSP Plans: Read via tenant membership
create policy if not exists markos_msp_plans_read_via_tenant on markos_msp_plans
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_msp_plans.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- MSP Plans: Insert via tenant membership
create policy if not exists markos_msp_plans_insert_via_tenant on markos_msp_plans
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_msp_plans.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- MSP Plans: Update via tenant membership
create policy if not exists markos_msp_plans_update_via_tenant on markos_msp_plans
  as permissive
  for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_msp_plans.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    tenant_id = (
      select markos_tenant_memberships.tenant_id
      from markos_tenant_memberships
      where markos_tenant_memberships.user_id = auth.jwt()->>'sub'
      and markos_tenant_memberships.tenant_id = markos_msp_plans.tenant_id
    )
  );

-- ICP: Read via tenant membership
create policy if not exists markos_icps_read_via_tenant on markos_icps
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_icps.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- ICP: Insert via tenant membership
create policy if not exists markos_icps_insert_via_tenant on markos_icps
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_icps.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- ICP: Update via tenant membership
create policy if not exists markos_icps_update_via_tenant on markos_icps
  as permissive
  for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_icps.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    tenant_id = (
      select markos_tenant_memberships.tenant_id
      from markos_tenant_memberships
      where markos_tenant_memberships.user_id = auth.jwt()->>'sub'
      and markos_tenant_memberships.tenant_id = markos_icps.tenant_id
    )
  );

-- Segments: Read via tenant membership
create policy if not exists markos_segments_read_via_tenant on markos_segments
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_segments.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- Segments: Insert via tenant membership
create policy if not exists markos_segments_insert_via_tenant on markos_segments
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_segments.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- Segments: Update via tenant membership
create policy if not exists markos_segments_update_via_tenant on markos_segments
  as permissive
  for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_segments.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    tenant_id = (
      select markos_tenant_memberships.tenant_id
      from markos_tenant_memberships
      where markos_tenant_memberships.user_id = auth.jwt()->>'sub'
      and markos_tenant_memberships.tenant_id = markos_segments.tenant_id
    )
  );

-- Campaigns: Read via tenant membership
create policy if not exists markos_campaigns_read_via_tenant on markos_campaigns
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_campaigns.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- Campaigns: Insert via tenant membership
create policy if not exists markos_campaigns_insert_via_tenant on markos_campaigns
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_campaigns.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- Campaigns: Update via tenant membership
create policy if not exists markos_campaigns_update_via_tenant on markos_campaigns
  as permissive
  for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_campaigns.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    tenant_id = (
      select markos_tenant_memberships.tenant_id
      from markos_tenant_memberships
      where markos_tenant_memberships.user_id = auth.jwt()->>'sub'
      and markos_tenant_memberships.tenant_id = markos_campaigns.tenant_id
    )
  );

-- Revisions: Read via tenant membership
create policy if not exists markos_revisions_read_via_tenant on markos_revisions
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_revisions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- Audit Log: Read via tenant membership
create policy if not exists markos_audit_log_read_via_tenant on markos_audit_log
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_audit_log.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- ============================================================================
-- Phase 51 Complete: Tenant schema foundation and RLS baseline in place
-- ============================================================================
