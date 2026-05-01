-- Phase 200.1 D-203 migration 70.2: webhook secret encryption via Supabase Vault.
-- Closes review concern H3 (plaintext webhook secrets in DB).
-- Backfill into vault.secrets MUST succeed for every row before the plaintext
-- secret column is dropped.

create or replace function vault_create_or_update_secret(
  p_value text,
  p_name text,
  p_description text default ''
) returns uuid
language plpgsql
security definer
as $$
declare
  v_existing_id uuid;
  v_result uuid;
begin
  select id
    into v_existing_id
    from vault.secrets
   where name = p_name
   limit 1;

  if v_existing_id is null then
    v_result := vault.create_secret(p_value, p_name, p_description);
  else
    perform vault.update_secret(v_existing_id, p_value);
    v_result := v_existing_id;
  end if;

  return v_result;
end;
$$;

alter table markos_webhook_subscriptions
  add column if not exists secret_vault_ref text;

do $$
declare
  r record;
  v_name text;
begin
  for r in
    select id, secret
      from markos_webhook_subscriptions
     where secret is not null
       and secret_vault_ref is null
  loop
    v_name := 'markos:webhook:secret:' || r.id::text;
    perform vault_create_or_update_secret(
      r.secret,
      v_name,
      'Phase 200.1 D-203 backfill'
    );
    update markos_webhook_subscriptions
       set secret_vault_ref = v_name
     where id = r.id;
  end loop;
end;
$$;

do $$
declare
  orphan_count integer;
begin
  select count(*)
    into orphan_count
    from markos_webhook_subscriptions
   where secret is not null
     and secret_vault_ref is null;

  if orphan_count > 0 then
    raise exception 'D-203 backfill incomplete: % rows have plaintext secret but no vault ref', orphan_count;
  end if;
end;
$$;

alter table markos_webhook_subscriptions
  drop column if exists secret;
