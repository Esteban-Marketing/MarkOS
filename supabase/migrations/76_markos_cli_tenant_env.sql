-- Phase 204 Plan 07 Task 1: CLI tenant env storage (pgcrypto-encrypted).
--
-- Backs `markos env list|pull|push|delete` (Plan 204-07) and the 4 tenant-env
-- endpoints. Stores per-tenant environment variables at rest, encrypted with
-- pgcrypto pgp_sym_encrypt keyed on a server-side secret
-- (MARKOS_ENV_ENCRYPTION_KEY). The list endpoint never decrypts: it returns a
-- redacted `value_preview` (first 4 chars + ellipsis). The pull endpoint (owner
-- /admin only) decrypts via the get_env_entries RPC function.
--
-- Consumers:
--   204-07  markos env CLI + 4 endpoints         (this plan)
--   204-12  security tests                       (asserts encrypted-at-rest,
--                                                 no plaintext columns, RLS)
--   205     Bearer-auth middleware               (reads via pull flow)
--
-- Design notes:
--   * pgcrypto is already loaded in this cluster via migration 82 (audit hash
--     chain). We still guard with `create extension if not exists pgcrypto`
--     so a fresh install has it without depending on cross-migration order.
--   * Composite PK (tenant_id, key) — upsert pattern for push.
--   * value_encrypted is BYTEA (pgp_sym_encrypt native output).
--   * value_preview stores first 4 chars + '…' for list redaction so operators
--     can recognise rotating secrets without full exposure.
--   * RLS policy enforces tenant_id claim match (`request.jwt.claims`).
--   * set_env_entry + get_env_entries are SECURITY DEFINER RPCs — keeps the
--     encryption key out of JS-layer SQL literals and avoids leaking it into
--     postgres query logs on the application side.
--
-- Idempotency: `if not exists` + `create or replace function`. Safe to re-run.

create extension if not exists pgcrypto;

create table if not exists markos_cli_tenant_env (
  tenant_id         text not null references markos_tenants(id) on delete cascade,
  key               text not null,
  value_encrypted   bytea not null,
  value_preview     text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        text not null references markos_users(id),
  primary key (tenant_id, key)
);

create index if not exists idx_cli_tenant_env_tenant
  on markos_cli_tenant_env(tenant_id);

alter table markos_cli_tenant_env enable row level security;

drop policy if exists markos_cli_tenant_env_tenant_isolation on markos_cli_tenant_env;
create policy markos_cli_tenant_env_tenant_isolation on markos_cli_tenant_env
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

comment on table markos_cli_tenant_env is
  'Phase 204 Plan 07: CLI tenant env vars — pgcrypto pgp_sym_encrypt at rest. Composite PK (tenant_id, key). RLS tenant-isolated.';
comment on column markos_cli_tenant_env.value_encrypted is
  'pgp_sym_encrypt(value, MARKOS_ENV_ENCRYPTION_KEY) — never returned to the client directly. Decrypted via get_env_entries RPC in pull flow only.';
comment on column markos_cli_tenant_env.value_preview is
  'First 4 chars of plaintext + ''…'' — safe redacted preview for list UI (T-204-07-01 mitigation).';

-- ─── RPC: set_env_entry ───────────────────────────────────────────────────
-- Upserts a single env row. Encrypts the value with the caller-supplied
-- p_encryption_key (read from process.env.MARKOS_ENV_ENCRYPTION_KEY at the
-- endpoint layer) and writes the 4-char redacted preview.
--
-- SECURITY DEFINER so callers need not have direct INSERT on the table.
-- The RLS policy + endpoint role gate still enforce tenant isolation; this
-- function trusts the caller-supplied tenant_id which the endpoint has already
-- resolved via resolveWhoami.
create or replace function set_env_entry(
  p_tenant_id      text,
  p_key            text,
  p_value          text,
  p_user_id        text,
  p_encryption_key text
) returns void
language plpgsql
security definer
as $$
begin
  insert into markos_cli_tenant_env (
    tenant_id, key, value_encrypted, value_preview, updated_by
  ) values (
    p_tenant_id,
    p_key,
    pgp_sym_encrypt(p_value, p_encryption_key),
    substring(p_value from 1 for 4) || '…',
    p_user_id
  )
  on conflict (tenant_id, key) do update set
    value_encrypted = pgp_sym_encrypt(p_value, p_encryption_key),
    value_preview   = substring(p_value from 1 for 4) || '…',
    updated_at      = now(),
    updated_by      = p_user_id;
end; $$;

comment on function set_env_entry(text, text, text, text, text) is
  'Phase 204 Plan 07: upsert markos_cli_tenant_env row with pgp_sym_encrypt. Encryption key is passed per-call so it never lives as a SQL literal in postgres logs.';

-- ─── RPC: get_env_entries ─────────────────────────────────────────────────
-- Bulk decrypt all env rows for a tenant. SECURITY DEFINER so the endpoint
-- layer can invoke without direct SELECT privilege on the table.
--
-- Only called from the /api/tenant/env/pull handler after owner|admin role
-- gate. NEVER called from /api/tenant/env (list) — list returns value_preview
-- only and never touches this function.
create or replace function get_env_entries(
  p_tenant_id      text,
  p_encryption_key text
) returns table (key text, value text)
language sql
security definer
as $$
  select
    e.key,
    pgp_sym_decrypt(e.value_encrypted, p_encryption_key)::text
  from markos_cli_tenant_env e
  where e.tenant_id = p_tenant_id
  order by e.key asc;
$$;

comment on function get_env_entries(text, text) is
  'Phase 204 Plan 07: bulk decrypt tenant env for pull flow. Owner/admin-only at endpoint layer. pgp_sym_decrypt with per-call encryption key argument.';
