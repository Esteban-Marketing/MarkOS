-- Phase 204.1 Plan 04 Task 1: CLI env preview mask reconciliation.
--
-- Migration 76 stored value_preview as the first 4 characters plus an
-- ellipsis. The CLI/UI spec locks the opposite policy: preserve length while
-- revealing only the last 4 characters for secrets that are at least 8
-- characters long, and fully mask shorter secrets.
--
-- This repo's live RPC surface is set_env_entry(...), not the older
-- upsert_markos_cli_tenant_env_v1(...) name referenced in the original plan.
-- We keep the real function name and only change the preview algorithm.
--
-- Backfill is intentionally NOT part of this migration. Existing rows will
-- retain their first-4 preview until the next push/update rewrites them
-- through set_env_entry(). Operators can remediate by re-pushing affected keys.
--
-- JS parity twin: lib/markos/cli/env.cjs::maskSecret()

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
declare
  v_preview text;
  v_len     int;
begin
  v_len := length(coalesce(p_value, ''));
  if v_len >= 8 then
    v_preview := repeat('*', v_len - 4) || substring(p_value from v_len - 3 for 4);
  else
    v_preview := repeat('*', v_len);
  end if;

  insert into markos_cli_tenant_env (
    tenant_id, key, value_encrypted, value_preview, updated_by
  ) values (
    p_tenant_id,
    p_key,
    pgp_sym_encrypt(p_value, p_encryption_key),
    v_preview,
    p_user_id
  )
  on conflict (tenant_id, key) do update set
    value_encrypted = pgp_sym_encrypt(p_value, p_encryption_key),
    value_preview   = v_preview,
    updated_at      = now(),
    updated_by      = p_user_id;
end;
$$;

comment on function set_env_entry(text, text, text, text, text) is
  'Phase 204.1 D-06: rebuilds value_preview with a last-4 mask while preserving the existing pgp_sym_encrypt storage contract.';
