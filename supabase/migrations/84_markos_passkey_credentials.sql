-- Phase 201 Plan 04: Passkey credentials + challenges + login events.
-- Decision: D-01 (passkey opt-in on second successful login; no password column in schema).
-- Library: @simplewebauthn/server v13 — DO NOT hand-roll CBOR/COSE/attestation.

-- ============================================================================
-- 1. markos_passkey_credentials
-- ============================================================================
create table if not exists markos_passkey_credentials (
  id text primary key,
  user_id text not null,
  credential_id text unique not null,
  public_key text not null,
  counter bigint not null default 0,
  device_type text,
  backed_up boolean not null default false,
  aaguid text,
  nickname text,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table markos_passkey_credentials is 'Phase 201 D-01: WebAuthn credentials per user (may register multiple devices). @simplewebauthn/server v13 format.';

create index if not exists idx_markos_passkey_credentials_user_id on markos_passkey_credentials(user_id);

-- ============================================================================
-- 2. markos_passkey_challenges — short-TTL one-time tokens
-- ============================================================================
create table if not exists markos_passkey_challenges (
  id text primary key,
  user_id text not null,
  challenge text not null,
  kind text not null check (kind in ('registration', 'authentication')),
  expires_at timestamptz not null default (now() + interval '2 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists idx_markos_passkey_challenges_expires_at on markos_passkey_challenges(expires_at);
create index if not exists idx_markos_passkey_challenges_user_kind on markos_passkey_challenges(user_id, kind);

-- ============================================================================
-- 3. markos_login_events — drives the "second successful login" passkey prompt trigger (D-01)
-- ============================================================================
create table if not exists markos_login_events (
  id bigserial primary key,
  user_id text not null,
  event text not null check (event in ('magic_link', 'passkey')),
  occurred_at timestamptz not null default now()
);

create index if not exists idx_markos_login_events_user_occurred on markos_login_events(user_id, occurred_at desc);

-- ============================================================================
-- 4. RLS: users read own credentials, inserts / deletes via service role only
-- ============================================================================
alter table markos_passkey_credentials enable row level security;
alter table markos_passkey_challenges  enable row level security;
alter table markos_login_events        enable row level security;

create policy if not exists markos_passkey_credentials_read_own on markos_passkey_credentials
  as permissive
  for select
  using (user_id = auth.jwt()->>'sub');

create policy if not exists markos_passkey_credentials_delete_own on markos_passkey_credentials
  as permissive
  for delete
  using (user_id = auth.jwt()->>'sub');

create policy if not exists markos_login_events_read_own on markos_login_events
  as permissive
  for select
  using (user_id = auth.jwt()->>'sub');

-- Challenges are not user-readable; they're service-role only. No read policy.

-- ============================================================================
-- End migration 84.
-- ============================================================================
