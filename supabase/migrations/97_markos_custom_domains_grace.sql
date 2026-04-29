-- Phase 201.1 D-107 (closes M2): BYOD soft-failure grace window.
-- 24h tolerance for verified->failed transitions to absorb cert renewals + DNS blips.
-- Migration slot 97: slot 96 is occupied by 96_neuro_literacy_metadata.sql (parallel phase).
-- Gap at 96 is intentional; Supabase CLI applies by filename order. Do NOT renumber.

alter table markos_custom_domains
  add column if not exists last_verified_at timestamptz;

create index if not exists idx_markos_custom_domains_last_verified
  on markos_custom_domains(last_verified_at)
  where last_verified_at is not null;

-- Backfill primary: for any row that was ever verified, mirror verified_at.
update markos_custom_domains
  set last_verified_at = verified_at
  where last_verified_at is null and verified_at is not null;

-- Backfill fallback: rows in status=verified with no verified_at (legacy pre-D-107 quirk),
-- use updated_at as best available timestamp.
update markos_custom_domains
  set last_verified_at = updated_at
  where last_verified_at is null and status = 'verified' and updated_at is not null;

comment on column markos_custom_domains.last_verified_at
  is 'Phase 201.1 D-107 (closes M2): timestamp of most recent successful Vercel verification. '
     'Middleware grants 24h grace if status=failed but last_verified_at is within window. '
     'Updated by pollDomainStatus on every verified=true result (not just first transition). '
     'Grace window constant: BYOD_GRACE_WINDOW_MS = 86400000 in lib/markos/tenant/byod-grace.cjs.';
