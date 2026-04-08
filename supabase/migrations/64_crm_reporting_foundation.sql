-- Phase 64 Wave 1: CRM attribution, readiness, and reporting truth foundation

create table if not exists crm_reporting_snapshots (
  snapshot_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  scope_key text not null,
  readiness_status text not null,
  freshness_status text not null,
  payload_json jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  generated_by text null
);

create table if not exists crm_attribution_snapshots (
  attribution_snapshot_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  record_kind text not null,
  record_id text not null,
  revenue_amount numeric(12,2) not null default 0,
  total_weight numeric(8,4) not null default 0,
  readiness_status text not null,
  weights_json jsonb not null default '[]'::jsonb,
  evidence_json jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  unique (tenant_id, record_kind, record_id)
);

create index if not exists idx_crm_reporting_snapshots_tenant_id on crm_reporting_snapshots(tenant_id, generated_at desc);
create index if not exists idx_crm_attribution_snapshots_tenant_id on crm_attribution_snapshots(tenant_id, record_kind, generated_at desc);

alter table crm_reporting_snapshots enable row level security;
alter table crm_attribution_snapshots enable row level security;

create policy if not exists crm_reporting_snapshots_read_via_tenant on crm_reporting_snapshots
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_reporting_snapshots.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_reporting_snapshots_insert_via_tenant on crm_reporting_snapshots
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_reporting_snapshots.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_attribution_snapshots_read_via_tenant on crm_attribution_snapshots
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_attribution_snapshots.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_attribution_snapshots_insert_via_tenant on crm_attribution_snapshots
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_attribution_snapshots.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );