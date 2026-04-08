-- Phase 60 Wave 1: tenant-owned pipeline and workspace metadata

create table if not exists crm_pipelines (
  pipeline_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  pipeline_key text not null,
  display_name text not null,
  object_kind text not null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, pipeline_key)
);

create table if not exists crm_pipeline_stages (
  stage_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  pipeline_key text not null,
  stage_key text not null,
  display_name text not null,
  stage_order integer not null,
  color_hex text null,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, pipeline_key, stage_key)
);

create table if not exists crm_workspace_object_definitions (
  object_definition_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  record_kind text not null,
  display_name text not null,
  is_custom_object boolean not null default false,
  workspace_enabled boolean not null default true,
  pipeline_enabled boolean not null default false,
  detail_enabled boolean not null default true,
  timeline_enabled boolean not null default true,
  calendar_enabled boolean not null default false,
  funnel_enabled boolean not null default false,
  calendar_date_field_key text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, record_kind)
);

create index if not exists idx_crm_pipelines_tenant_id on crm_pipelines(tenant_id);
create index if not exists idx_crm_pipeline_stages_tenant_id on crm_pipeline_stages(tenant_id);
create index if not exists idx_crm_pipeline_stages_pipeline_key on crm_pipeline_stages(tenant_id, pipeline_key, stage_order);
create index if not exists idx_crm_workspace_object_definitions_tenant_id on crm_workspace_object_definitions(tenant_id);

alter table crm_pipelines enable row level security;
alter table crm_pipeline_stages enable row level security;
alter table crm_workspace_object_definitions enable row level security;

create policy if not exists crm_pipelines_read_via_tenant on crm_pipelines
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_pipelines.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_pipelines_insert_via_tenant on crm_pipelines
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_pipelines.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_pipelines_update_via_tenant on crm_pipelines
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_pipelines.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_pipelines.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_pipeline_stages_read_via_tenant on crm_pipeline_stages
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_pipeline_stages.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_pipeline_stages_insert_via_tenant on crm_pipeline_stages
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_pipeline_stages.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_pipeline_stages_update_via_tenant on crm_pipeline_stages
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_pipeline_stages.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_pipeline_stages.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_workspace_object_definitions_read_via_tenant on crm_workspace_object_definitions
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_workspace_object_definitions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_workspace_object_definitions_insert_via_tenant on crm_workspace_object_definitions
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_workspace_object_definitions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_workspace_object_definitions_update_via_tenant on crm_workspace_object_definitions
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_workspace_object_definitions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_workspace_object_definitions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );
