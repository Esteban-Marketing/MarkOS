-- Phase 201 Plan 03: Unverified-signup buffer + signup rate-limit tables.
-- Decisions: D-01 (magic-link primary), D-02 (double opt-in), D-03 (BotID pre-submit + rate-limit).
-- Pitfall-1 mitigation: Supabase Auth creates auth.users on signInWithOtp regardless — we never
-- create markos_orgs/markos_tenants until verifyOtp succeeds. This buffer is the app-layer
-- gate, not a Supabase replacement.

-- ============================================================================
-- 1. markos_unverified_signups — buffer before verifyOtp
-- ============================================================================
create table if not exists markos_unverified_signups (
  email text primary key,
  botid_token text,
  ip_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

comment on table markos_unverified_signups is 'Phase 201 D-02: app-layer double-opt-in gate. Promoted to markos_orgs/markos_tenants on verifyOtp success. Expires rows after 1h (cron cleanup is Plan 08).';

create index if not exists idx_markos_unverified_signups_expires_at
  on markos_unverified_signups(expires_at);

-- ============================================================================
-- 2. markos_signup_rate_limits — IP-based throttle
-- Claude's Discretion: 5/hour/IP + 1/minute/email (decided in Plan 03 per CONTEXT.md)
-- ============================================================================
create table if not exists markos_signup_rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  attempt_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (ip_hash, window_start)
);

comment on table markos_signup_rate_limits is 'Phase 201 D-03: IP-bucketed signup counter. Keyed on sha256(ip). Raw IPs never persisted (GDPR).';

create index if not exists idx_markos_signup_rate_limits_window on markos_signup_rate_limits(window_start);

-- ============================================================================
-- 3. Email-based rate limit table (1/minute/email)
-- ============================================================================
create table if not exists markos_signup_email_throttle (
  email text primary key,
  last_sent_at timestamptz not null default now()
);

comment on table markos_signup_email_throttle is 'Phase 201 D-03: last verifyOtp send time per email. Enforces 1/min cap.';

-- ============================================================================
-- 4. RLS: these tables are WRITE-ONLY from service-role signup handler.
--    Enable RLS with deny-all default so anon cannot read or write.
-- ============================================================================
alter table markos_unverified_signups enable row level security;
alter table markos_signup_rate_limits enable row level security;
alter table markos_signup_email_throttle enable row level security;

-- No policies → deny all for non-service-role. Service role bypasses RLS.

-- ============================================================================
-- Phase 201 Plan 03 migration complete.
-- ============================================================================
