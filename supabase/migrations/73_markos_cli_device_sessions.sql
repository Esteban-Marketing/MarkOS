-- Phase 204 Plan 01 Task 1: CLI OAuth device-flow session state.
--
-- Backs the `POST /api/cli/oauth/device/start` + `/api/cli/oauth/device/token`
-- endpoints introduced in Phase 204. Tracks pending/approved/denied/expired
-- device-flow attempts per RFC 8628 §3.5.
--
-- Consumers:
--   204-02 login       - writes `pending` row on /device/start, reads on /device/token
--   204-03 keys        - may revoke sessions alongside API keys
--   204-12 security    - partial index on user_code (pending) for approval UI lookup
--
-- Idempotency: `if not exists` guarded. Safe to re-run.

create table if not exists markos_cli_device_sessions (
  device_code   text primary key,
  user_code     text unique not null,
  tenant_id     text references markos_tenants(id),
  user_id       text references markos_users(id),
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'denied', 'expired')),
  issued_at     timestamptz not null default now(),
  expires_at    timestamptz not null,
  approved_at   timestamptz,
  poll_count    int not null default 0,
  last_poll_at  timestamptz,
  constraint expires_after_issue check (expires_at > issued_at)
);

-- Partial index: approval UI looks up `pending` sessions by user_code only.
-- Keeps the index hot and small (expired/approved sessions fall out).
create index if not exists idx_cli_device_user_code
  on markos_cli_device_sessions(user_code)
  where status = 'pending';

comment on table markos_cli_device_sessions  is 'Phase 204 Plan 01: OAuth 2.0 device authorization grant sessions (RFC 8628).';
comment on column markos_cli_device_sessions.device_code  is 'Opaque device_code (base64url of 16 random bytes; ≥128-bit entropy).';
comment on column markos_cli_device_sessions.user_code    is 'Human-readable 8-char code formatted AAAA-AAAA (ambiguous chars removed).';
comment on column markos_cli_device_sessions.status       is 'pending | approved | denied | expired — state machine driven by /device/token polls + UI approval.';
comment on column markos_cli_device_sessions.poll_count   is 'Anti-brute-force: incremented on each /device/token POST; used for slow_down enforcement.';
comment on column markos_cli_device_sessions.last_poll_at is 'Anti-brute-force: server enforces min interval between polls.';
