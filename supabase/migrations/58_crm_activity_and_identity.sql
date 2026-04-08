-- Phase 58 Wave 2: CRM activity ledger and identity lineage

create table if not exists crm_activity_ledger (
  activity_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  activity_family text not null check (activity_family in ('web_activity', 'campaign_touch', 'crm_mutation', 'note', 'task', 'agent_event', 'outbound_event', 'attribution_update')),
  related_record_kind text not null,
  related_record_id text not null,
  anonymous_identity_id text null,
  source_event_ref text not null,
  payload_json jsonb not null default '{}',
  actor_id text null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists crm_identity_links (
  identity_link_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  anonymous_identity_id text not null,
  known_record_kind text not null check (known_record_kind in ('contact', 'company', 'account', 'customer')),
  known_record_id text not null,
  confidence numeric(5,2) not null,
  link_status text not null check (link_status in ('candidate', 'accepted', 'rejected')),
  source_event_ref text not null,
  reviewer_actor_id text null,
  created_at timestamptz not null default now()
);

create table if not exists crm_merge_decisions (
  merge_decision_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  canonical_record_kind text not null,
  canonical_record_id text not null,
  decision_state text not null check (decision_state in ('accepted', 'rejected')),
  confidence numeric(5,2) not null,
  rationale text null,
  reviewer_actor_id text not null,
  source_event_ref text not null,
  created_at timestamptz not null default now()
);

create table if not exists crm_merge_lineage (
  lineage_id text primary key,
  merge_decision_id text not null references crm_merge_decisions(merge_decision_id) on delete cascade,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  source_record_kind text not null,
  source_record_id text not null,
  canonical_record_kind text not null,
  canonical_record_id text not null,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_crm_activity_ledger_tenant_id on crm_activity_ledger(tenant_id);
create index if not exists idx_crm_activity_ledger_related_ref on crm_activity_ledger(related_record_kind, related_record_id, occurred_at desc);
create index if not exists idx_crm_identity_links_tenant_id on crm_identity_links(tenant_id);
create index if not exists idx_crm_merge_decisions_tenant_id on crm_merge_decisions(tenant_id);
create index if not exists idx_crm_merge_lineage_tenant_id on crm_merge_lineage(tenant_id);

alter table crm_activity_ledger enable row level security;
alter table crm_identity_links enable row level security;
alter table crm_merge_decisions enable row level security;
alter table crm_merge_lineage enable row level security;

create policy if not exists crm_activity_ledger_read_via_tenant on crm_activity_ledger
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_activity_ledger.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_activity_ledger_insert_via_tenant on crm_activity_ledger
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_activity_ledger.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_identity_links_read_via_tenant on crm_identity_links
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_identity_links.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_identity_links_insert_via_tenant on crm_identity_links
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_identity_links.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_merge_decisions_read_via_tenant on crm_merge_decisions
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_merge_decisions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_merge_decisions_insert_via_tenant on crm_merge_decisions
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_merge_decisions.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_merge_lineage_read_via_tenant on crm_merge_lineage
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_merge_lineage.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists crm_merge_lineage_insert_via_tenant on crm_merge_lineage
  as permissive for insert
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = crm_merge_lineage.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );
