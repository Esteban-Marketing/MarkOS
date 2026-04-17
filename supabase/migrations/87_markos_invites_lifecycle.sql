-- Phase 201 Plan 07: Invites + offboarding runs + GDPR export registry.

create table if not exists markos_invites (
  token text primary key,
  org_id text not null references markos_orgs(id) on delete cascade,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  tenant_role text not null
    check (tenant_role in ('owner','tenant-admin','manager','contributor','reviewer','billing-admin','readonly')),
  email text not null,
  invited_by text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by_user_id text,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table markos_invites is 'Phase 201 D-08: invites target a specific tenant + role; invitee auto-added at org_role=readonly on accept.';

create index if not exists idx_markos_invites_tenant_pending
  on markos_invites(tenant_id)
  where accepted_at is null and withdrawn_at is null;
create index if not exists idx_markos_invites_email_pending
  on markos_invites(email)
  where accepted_at is null and withdrawn_at is null;

alter table markos_invites enable row level security;

create policy if not exists markos_invites_read_via_tenant on markos_invites
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_invites.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create table if not exists markos_tenant_offboarding_runs (
  id bigserial primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  offboarding_initiated_at timestamptz not null default now(),
  purge_due_at timestamptz not null,
  purge_ran_at timestamptz,
  export_bundle_id text,
  cancelled_at timestamptz,
  actor_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table markos_tenant_offboarding_runs is 'Phase 201 D-14: 30-day soft-delete state machine rows per tenant.';

create unique index if not exists idx_markos_tenant_offboarding_active
  on markos_tenant_offboarding_runs(tenant_id)
  where purge_ran_at is null and cancelled_at is null;

alter table markos_tenant_offboarding_runs enable row level security;

create policy if not exists markos_tenant_offboarding_runs_read_via_tenant on markos_tenant_offboarding_runs
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_tenant_offboarding_runs.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create table if not exists markos_gdpr_exports (
  id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  bucket text not null,
  object_key text not null,
  bytes bigint,
  signed_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_markos_gdpr_exports_tenant_created on markos_gdpr_exports(tenant_id, created_at desc);

alter table markos_gdpr_exports enable row level security;

create policy if not exists markos_gdpr_exports_read_via_tenant on markos_gdpr_exports
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_gdpr_exports.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );
