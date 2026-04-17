-- Phase 201: Org + Tenant Hardening (Migration 81)
-- Adds markos_orgs + markos_org_memberships. Extends markos_tenants with org_id, slug, status.
-- RLS mirrors migration 51 markos_tenant_memberships pattern.
-- Decisions implemented: D-05, D-06 (schema), D-07 (seat_quota on orgs), D-14 (status column).

-- ============================================================================
-- 1. markos_orgs — top-level billing + seat container
-- ============================================================================
create table if not exists markos_orgs (
  id text primary key,
  slug text unique not null,
  name text not null,
  owner_user_id text not null,
  seat_quota integer not null default 5 check (seat_quota >= 1),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'offboarding', 'purged')),
  offboarding_initiated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table markos_orgs is 'Phase 201: billing + seat container. One org owns N tenants. D-05, D-07.';

create index if not exists idx_markos_orgs_owner_user_id on markos_orgs(owner_user_id);
create index if not exists idx_markos_orgs_slug on markos_orgs(slug);
create index if not exists idx_markos_orgs_status on markos_orgs(status);

-- ============================================================================
-- 2. markos_org_memberships — org-level roles (distinct from tenant memberships)
-- ============================================================================
create table if not exists markos_org_memberships (
  id text primary key,
  org_id text not null references markos_orgs(id) on delete cascade,
  user_id text not null,
  org_role text not null default 'member'
    check (org_role in ('owner', 'billing-admin', 'member', 'readonly')),
  created_at timestamptz not null default now(),
  unique(org_id, user_id)
);

comment on table markos_org_memberships is 'Phase 201: org-level roles (billing-admin lives here). D-08.';

create index if not exists idx_markos_org_memberships_user_id on markos_org_memberships(user_id);
create index if not exists idx_markos_org_memberships_org_id on markos_org_memberships(org_id);

-- ============================================================================
-- 3. Extend markos_tenants with org_id + slug + status
-- ============================================================================
-- Step 3a: add nullable first, backfill, then set not null (idempotent-safe).
alter table markos_tenants
  add column if not exists org_id text references markos_orgs(id) on delete cascade,
  add column if not exists slug text,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended', 'offboarding', 'purged'));

-- Backfill: create a legacy org per distinct existing tenant.
insert into markos_orgs (id, slug, name, owner_user_id, seat_quota, status)
  select
    'org-legacy-' || t.id,
    lower(regexp_replace(coalesce(t.name, t.id), '[^a-z0-9]+', '-', 'g')),
    coalesce(t.name, 'Legacy Org'),
    'legacy-owner',
    5,
    'active'
  from markos_tenants t
  where t.org_id is null
    and not exists (select 1 from markos_orgs o where o.id = 'org-legacy-' || t.id)
  on conflict (id) do nothing;

update markos_tenants
  set org_id = 'org-legacy-' || id
  where org_id is null;

update markos_tenants
  set slug = lower(regexp_replace(coalesce(name, id), '[^a-z0-9]+', '-', 'g'))
  where slug is null;

-- Now enforce not-null on org_id.
alter table markos_tenants
  alter column org_id set not null;

-- UNIQUE constraint on slug across all tenants (first-party subdomain namespace).
create unique index if not exists idx_markos_tenants_slug_unique on markos_tenants(slug) where slug is not null;

create index if not exists idx_markos_tenants_org_id on markos_tenants(org_id);
create index if not exists idx_markos_tenants_status on markos_tenants(status);

-- ============================================================================
-- 4. RLS on new org tables (clone of migration 51 pattern)
-- ============================================================================
alter table markos_orgs enable row level security;
alter table markos_org_memberships enable row level security;

-- markos_orgs: read via org_memberships
create policy if not exists markos_orgs_read_via_membership on markos_orgs
  as permissive
  for select
  using (
    exists (
      select 1 from markos_org_memberships
      where markos_org_memberships.org_id = markos_orgs.id
      and markos_org_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- markos_orgs: insert requires auth.jwt()->>'sub' = owner_user_id (self-serve signup creates own org)
create policy if not exists markos_orgs_insert_self on markos_orgs
  as permissive
  for insert
  with check (
    owner_user_id = auth.jwt()->>'sub'
  );

-- markos_orgs: update requires owner or billing-admin role
create policy if not exists markos_orgs_update_via_role on markos_orgs
  as permissive
  for update
  using (
    exists (
      select 1 from markos_org_memberships
      where markos_org_memberships.org_id = markos_orgs.id
      and markos_org_memberships.user_id = auth.jwt()->>'sub'
      and markos_org_memberships.org_role in ('owner', 'billing-admin')
    )
  );

-- markos_org_memberships: read own
create policy if not exists markos_org_memberships_read_own on markos_org_memberships
  as permissive
  for select
  using (
    user_id = auth.jwt()->>'sub'
    or exists (
      select 1 from markos_org_memberships m2
      where m2.org_id = markos_org_memberships.org_id
      and m2.user_id = auth.jwt()->>'sub'
      and m2.org_role = 'owner'
    )
  );

-- markos_org_memberships: insert (owner only; invite accept flow bypasses via service role)
create policy if not exists markos_org_memberships_insert_via_owner on markos_org_memberships
  as permissive
  for insert
  with check (
    exists (
      select 1 from markos_org_memberships m2
      where m2.org_id = markos_org_memberships.org_id
      and m2.user_id = auth.jwt()->>'sub'
      and m2.org_role = 'owner'
    )
  );

-- ============================================================================
-- 5. Seat-count SQL function (Plan 07 invite handler calls this)
-- ============================================================================
create or replace function count_org_active_members(p_org_id text)
returns integer
language sql
stable
as $$
  select count(distinct user_id)::integer
  from markos_tenant_memberships m
  join markos_tenants t on t.id = m.tenant_id
  where t.org_id = p_org_id
    and t.status = 'active';
$$;

comment on function count_org_active_members(text) is 'Phase 201 D-07: distinct active seats pooled across all tenants of an org.';

-- ============================================================================
-- Phase 201 Plan 01: org schema complete. Migration 82 (Plan 02) handles audit log.
-- ============================================================================
