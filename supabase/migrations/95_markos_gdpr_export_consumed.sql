-- Phase 201.1 D-102 (closes H3): GDPR signed-URL hardening with single-use nonce + audience claim.

-- ============================================================================
-- 1. Augment markos_gdpr_exports with nonce + audience_tenant_id + reissued_at.
-- ============================================================================
alter table markos_gdpr_exports
  add column if not exists nonce text,
  add column if not exists audience_tenant_id text,
  add column if not exists reissued_at timestamptz;

-- Backfill: for any existing pre-D-102 row, set nonce = id (the export_id was already random)
-- and audience_tenant_id = tenant_id. This makes the NOT NULL invariant safe to enforce.
update markos_gdpr_exports
  set nonce = id,
      audience_tenant_id = tenant_id
  where nonce is null;

alter table markos_gdpr_exports
  alter column nonce set not null,
  alter column audience_tenant_id set not null;

-- ============================================================================
-- 2. markos_gdpr_export_consumed - single-use ledger.
-- ============================================================================
create table if not exists markos_gdpr_export_consumed (
  export_id              text not null,
  nonce                  text not null,
  consumed_at            timestamptz not null default now(),
  consumed_by_session_id text,
  consumed_by_user_id    text,
  primary key (export_id, nonce)
);

create index if not exists idx_markos_gdpr_export_consumed_export
  on markos_gdpr_export_consumed(export_id);

alter table markos_gdpr_export_consumed enable row level security;

-- Only service_role can read/write (admin endpoints inject service_role server-side).
create policy if not exists markos_gdpr_export_consumed_service_role
  on markos_gdpr_export_consumed
  for all to service_role using (true) with check (true);

comment on table markos_gdpr_export_consumed
  is 'Phase 201.1 D-102 (closes H3): single-use ledger for GDPR export downloads. Primary key (export_id, nonce) enforces download-once.';
