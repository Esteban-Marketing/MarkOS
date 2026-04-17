-- Phase 201 Plan 05: Device-level session tracking + custom domains stub.
-- Decisions: D-04 (30-day rolling session + revoke), D-09 (middleware BYOD pre-scaffold).
-- Note: markos_custom_domains is additive — Plan 06 extends it with Vercel Domains API fields.

-- ============================================================================
-- 1. markos_sessions_devices — session revoke list (/settings/sessions)
-- ============================================================================
create table if not exists markos_sessions_devices (
  session_id text primary key,
  user_id text not null,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  device_label text,
  user_agent text,
  ip_hash text,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table markos_sessions_devices is 'Phase 201 D-04: per-device session list. Revocation flips revoked_at; Supabase refresh tokens remain the underlying auth.';

create index if not exists idx_markos_sessions_devices_user_tenant on markos_sessions_devices(user_id, tenant_id);
create index if not exists idx_markos_sessions_devices_last_seen on markos_sessions_devices(last_seen_at desc);

alter table markos_sessions_devices enable row level security;

create policy if not exists markos_sessions_devices_read_own on markos_sessions_devices
  as permissive
  for select
  using (user_id = auth.jwt()->>'sub');

create policy if not exists markos_sessions_devices_update_own on markos_sessions_devices
  as permissive
  for update
  using (user_id = auth.jwt()->>'sub');

-- ============================================================================
-- 2. markos_custom_domains — BYOD routing table (Plan 06 adds more columns)
-- ============================================================================
create table if not exists markos_custom_domains (
  domain text primary key,
  org_id text not null references markos_orgs(id) on delete cascade,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'verifying', 'verified', 'failed')),
  cname_target text,
  verified_at timestamptz,
  ssl_issued_at timestamptz,
  vanity_login_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table markos_custom_domains is 'Phase 201 D-12 + D-13: 1 custom domain per org. Plan 06 extends with Vercel Domains API integration columns.';

create index if not exists idx_markos_custom_domains_org_id on markos_custom_domains(org_id);
create index if not exists idx_markos_custom_domains_tenant_id on markos_custom_domains(tenant_id);
create index if not exists idx_markos_custom_domains_status on markos_custom_domains(status);

-- D-13: 1-per-org quota via partial unique index on active rows (pending/verifying/verified).
create unique index if not exists idx_markos_custom_domains_one_per_org
  on markos_custom_domains(org_id)
  where status in ('pending', 'verifying', 'verified');

alter table markos_custom_domains enable row level security;

create policy if not exists markos_custom_domains_read_via_org on markos_custom_domains
  as permissive
  for select
  using (
    exists (
      select 1 from markos_org_memberships
      where markos_org_memberships.org_id = markos_custom_domains.org_id
      and markos_org_memberships.user_id = auth.jwt()->>'sub'
    )
  );

-- ============================================================================
-- End migration 85.
-- ============================================================================
