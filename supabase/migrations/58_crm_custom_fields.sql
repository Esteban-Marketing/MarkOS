-- Phase 58 Wave 1: governed CRM custom fields

create table if not exists crm_custom_field_definitions (
  field_definition_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  entity_kind text not null check (entity_kind in ('contact', 'company', 'deal', 'account', 'customer', 'task', 'note')),
  field_key text not null,
  label text not null,
  field_type text not null check (field_type in ('text', 'number', 'boolean', 'date', 'select', 'multiselect', 'json')),
  option_values_json jsonb not null default '[]',
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, entity_kind, field_key)
);

create table if not exists crm_custom_field_values (
  field_value_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  field_definition_id text not null references crm_custom_field_definitions(field_definition_id) on delete cascade,
  entity_kind text not null check (entity_kind in ('contact', 'company', 'deal', 'account', 'customer', 'task', 'note')),
  entity_id text not null,
  value_text text null,
  value_number numeric(14,4) null,
  value_boolean boolean null,
  value_date timestamptz null,
  value_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, field_definition_id, entity_id)
);

create index if not exists idx_crm_custom_field_definitions_tenant_id on crm_custom_field_definitions(tenant_id);
create index if not exists idx_crm_custom_field_values_tenant_id on crm_custom_field_values(tenant_id);
create index if not exists idx_crm_custom_field_values_entity_ref on crm_custom_field_values(entity_kind, entity_id);

alter table crm_custom_field_definitions enable row level security;
alter table crm_custom_field_values enable row level security;

create policy if not exists crm_custom_field_definitions_read_via_tenant on crm_custom_field_definitions
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_custom_field_definitions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_custom_field_definitions_insert_via_tenant on crm_custom_field_definitions
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_custom_field_definitions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_custom_field_definitions_update_via_tenant on crm_custom_field_definitions
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_custom_field_definitions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_custom_field_definitions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_custom_field_values_read_via_tenant on crm_custom_field_values
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_custom_field_values.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_custom_field_values_insert_via_tenant on crm_custom_field_values
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_custom_field_values.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_custom_field_values_update_via_tenant on crm_custom_field_values
  as permissive for update
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_custom_field_values.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_custom_field_values.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );
