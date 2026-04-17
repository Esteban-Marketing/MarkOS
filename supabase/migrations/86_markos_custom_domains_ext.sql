-- Phase 201 Plan 06: Extend markos_custom_domains + add markos_tenant_branding.
-- Decisions: D-12 (BYOD full surface), D-13 (1 per org).

alter table markos_custom_domains
  add column if not exists vercel_project_id text,
  add column if not exists vercel_domain_id text,
  add column if not exists verification_challenge text,
  add column if not exists last_verification_at timestamptz,
  add column if not exists removed_at timestamptz;

create index if not exists idx_markos_custom_domains_vercel_domain_id on markos_custom_domains(vercel_domain_id);

create table if not exists markos_tenant_branding (
  tenant_id text primary key references markos_tenants(id) on delete cascade,
  logo_url text,
  primary_color text not null default '#0d9488'
    check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  display_name text,
  vanity_login_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table markos_tenant_branding is 'Phase 201 D-12: tenant brand chrome + vanity login toggle. Used by middleware + /login page on BYOD.';

alter table markos_tenant_branding enable row level security;

create policy if not exists markos_tenant_branding_read_via_membership on markos_tenant_branding
  as permissive
  for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_tenant_branding.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_tenant_branding_upsert_via_admin on markos_tenant_branding
  as permissive
  for all
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_tenant_branding.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
      and markos_tenant_memberships.iam_role in ('owner', 'tenant-admin')
    )
  )
  with check (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_tenant_branding.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
      and markos_tenant_memberships.iam_role in ('owner', 'tenant-admin')
    )
  );
