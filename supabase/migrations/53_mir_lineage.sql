-- Phase 53: MIR lineage and discipline activation evidence
-- Adds append-only Gate 1 initialization, discipline activation evidence,
-- MIR version history, and regeneration-report tables.

create or replace function markos_reject_append_only_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'append-only mutation denied for % via %', TG_TABLE_NAME, TG_OP;
end;
$$;

create table if not exists markos_mir_gate1_initializations (
  initialization_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  project_slug text not null,
  required_entities jsonb not null,
  entity_status jsonb not null,
  missing_entities jsonb not null,
  gate1_status text not null check (gate1_status in ('ready', 'blocked')),
  source_references jsonb not null default '[]'::jsonb,
  run_id text,
  initialized_at timestamptz not null default now()
);

create table if not exists markos_discipline_activation_evidence (
  activation_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  project_slug text not null,
  discipline text not null,
  selected boolean not null,
  rationale text not null,
  mir_inputs jsonb not null,
  service_context jsonb not null,
  run_id text,
  recorded_at timestamptz not null default now()
);

create table if not exists markos_mir_versions (
  version_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  project_slug text not null,
  entity_key text not null,
  parent_version_id text references markos_mir_versions(version_id),
  content_snapshot jsonb,
  content_hash text not null,
  rationale text not null,
  dependency_impact jsonb not null default '[]'::jsonb,
  run_id text,
  actor_id text,
  effective_at timestamptz not null default now()
);

create table if not exists markos_mir_regenerations (
  regeneration_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  project_slug text not null,
  entity_key text not null,
  parent_version_id text references markos_mir_versions(version_id),
  version_id text not null references markos_mir_versions(version_id),
  rationale text not null,
  dependency_impact jsonb not null default '[]'::jsonb,
  run_id text,
  actor_id text,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_markos_mir_gate1_initializations_tenant_date
  on markos_mir_gate1_initializations(tenant_id, initialized_at desc);

create index if not exists idx_markos_discipline_activation_evidence_tenant_date
  on markos_discipline_activation_evidence(tenant_id, recorded_at desc);

create index if not exists idx_markos_mir_versions_tenant_entity_date
  on markos_mir_versions(tenant_id, entity_key, effective_at desc);

create index if not exists idx_markos_mir_regenerations_tenant_date
  on markos_mir_regenerations(tenant_id, recorded_at desc);

alter table markos_mir_gate1_initializations enable row level security;
alter table markos_discipline_activation_evidence enable row level security;
alter table markos_mir_versions enable row level security;
alter table markos_mir_regenerations enable row level security;

create policy if not exists markos_mir_gate1_initializations_read_via_tenant on markos_mir_gate1_initializations
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_gate1_initializations.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_mir_gate1_initializations_insert_via_tenant on markos_mir_gate1_initializations
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_gate1_initializations.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_discipline_activation_evidence_read_via_tenant on markos_discipline_activation_evidence
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_discipline_activation_evidence.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_discipline_activation_evidence_insert_via_tenant on markos_discipline_activation_evidence
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_discipline_activation_evidence.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_mir_versions_read_via_tenant on markos_mir_versions
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_versions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_mir_versions_insert_via_tenant on markos_mir_versions
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_versions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_mir_regenerations_read_via_tenant on markos_mir_regenerations
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_regenerations.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_mir_regenerations_insert_via_tenant on markos_mir_regenerations
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_mir_regenerations.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

drop trigger if exists markos_mir_gate1_initializations_append_only on markos_mir_gate1_initializations;
create trigger markos_mir_gate1_initializations_append_only
  before update or delete on markos_mir_gate1_initializations
  for each row execute function markos_reject_append_only_mutation();

drop trigger if exists markos_discipline_activation_evidence_append_only on markos_discipline_activation_evidence;
create trigger markos_discipline_activation_evidence_append_only
  before update or delete on markos_discipline_activation_evidence
  for each row execute function markos_reject_append_only_mutation();

drop trigger if exists markos_mir_versions_append_only on markos_mir_versions;
create trigger markos_mir_versions_append_only
  before update or delete on markos_mir_versions
  for each row execute function markos_reject_append_only_mutation();

drop trigger if exists markos_mir_regenerations_append_only on markos_mir_regenerations;
create trigger markos_mir_regenerations_append_only
  before update or delete on markos_mir_regenerations
  for each row execute function markos_reject_append_only_mutation();