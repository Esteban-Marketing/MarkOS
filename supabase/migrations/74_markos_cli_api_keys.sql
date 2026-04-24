-- Phase 204 Plan 01 Task 1: CLI API key storage (hashed).
--
-- Backs `markos keys create|list|revoke` (Plan 204-03) and the Bearer auth
-- path for all CLI commands. Stores sha256(plaintext) hex only; plaintext is
-- displayed once at creation and never persisted.
--
-- Consumers:
--   204-03 keys commands           - CRUD via /api/cli/keys
--   204-02 login (device flow)    - inserts row when device session approved
--   204-12 security tests          - asserts plaintext never stored; RLS tenant isolation
--
-- Idempotency: `if not exists` guarded. Safe to re-run.

create table if not exists markos_cli_api_keys (
  id              text primary key default ('cak_' || encode(gen_random_bytes(16), 'hex')),
  tenant_id       text not null references markos_tenants(id) on delete cascade,
  user_id         text not null references markos_users(id),
  key_hash        text unique not null,
  key_fingerprint text not null,
  scope           text not null default 'cli',
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz,
  revoked_at      timestamptz,
  name            text
);

create index if not exists idx_cli_api_keys_tenant
  on markos_cli_api_keys(tenant_id)
  where revoked_at is null;

create index if not exists idx_cli_api_keys_fingerprint
  on markos_cli_api_keys(key_fingerprint);

alter table markos_cli_api_keys enable row level security;

drop policy if exists markos_cli_api_keys_tenant_isolation on markos_cli_api_keys;
create policy markos_cli_api_keys_tenant_isolation on markos_cli_api_keys
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

comment on table markos_cli_api_keys is 'Phase 204 Plan 01: CLI API keys (sha256-hashed); RLS tenant-isolated.';
comment on column markos_cli_api_keys.key_hash        is 'sha256(plaintext_key) hex — plaintext never stored (D-06).';
comment on column markos_cli_api_keys.key_fingerprint is 'First 8 chars of sha256(plaintext) for UI display — not secret.';
comment on column markos_cli_api_keys.scope           is 'Permission scope; defaults to "cli". Extensible for future scoped keys.';
comment on column markos_cli_api_keys.name            is 'User-supplied label shown in `markos keys list`.';
