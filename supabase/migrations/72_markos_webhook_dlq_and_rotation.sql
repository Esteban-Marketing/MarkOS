-- Phase 203 Plan 02 Task 2: Webhook DLQ + Rotation substrate.
--
-- Ships the schema substrate every downstream 203 plan depends on:
--   203-03 DLQ           - reads dlq_reason / dlq_at / final_attempt
--   203-04 Replay        - reads replayed_from; writes replay rows
--   203-05 Rotation      - fills in the 3 RPC function bodies stubbed here
--   203-07 Rate-limit    - reads rps_override
--   203-09 Fleet metrics - selects markos_webhook_fleet_metrics_v1
--
-- Idempotency: every DDL is guarded with `if not exists` / `create or replace`
-- so the migration is safe to re-run against a previously-applied database.

-- ============================================================================
-- 1. Rotation + RPS-override columns on markos_webhook_subscriptions
-- ============================================================================
alter table markos_webhook_subscriptions
  add column if not exists secret_v2        text null,
  add column if not exists grace_started_at timestamptz null,
  add column if not exists grace_ends_at    timestamptz null,
  add column if not exists rotation_state   text null,
  add column if not exists rps_override     integer null;

-- rotation_state whitelist (null = no active rotation; enforced separately from
-- the markos_webhook_secret_rotations ledger, which also tracks 'finalized').
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'markos_webhook_subscriptions_rotation_state_check'
  ) then
    alter table markos_webhook_subscriptions
      add constraint markos_webhook_subscriptions_rotation_state_check
      check (rotation_state is null or rotation_state in ('active', 'rolled_back'));
  end if;
end $$;

comment on column markos_webhook_subscriptions.secret_v2       is 'Phase 203 D-10: new secret during 30-day grace window; null outside rotation.';
comment on column markos_webhook_subscriptions.grace_started_at is 'Phase 203 D-10: rotation grace window start (null outside rotation).';
comment on column markos_webhook_subscriptions.grace_ends_at    is 'Phase 203 D-10: rotation grace window end (null outside rotation).';
comment on column markos_webhook_subscriptions.rotation_state   is 'Phase 203 D-09: active | rolled_back | null (no active rotation).';
comment on column markos_webhook_subscriptions.rps_override     is 'Phase 203 D-13: per-sub RPS override; may only LOWER the plan-tier default.';

-- ============================================================================
-- 2. Replay + DLQ audit columns on markos_webhook_deliveries
-- ============================================================================
alter table markos_webhook_deliveries
  add column if not exists replayed_from text null,
  add column if not exists dlq_reason    text null,
  add column if not exists final_attempt integer null,
  add column if not exists dlq_at        timestamptz null;

-- Self-reference FK (replay parent → original delivery). Guarded so re-apply
-- is a no-op.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'markos_webhook_deliveries_replayed_from_fkey'
  ) then
    alter table markos_webhook_deliveries
      add constraint markos_webhook_deliveries_replayed_from_fkey
      foreign key (replayed_from) references markos_webhook_deliveries(id)
      on delete set null;
  end if;
end $$;

-- Partial index for the 7-day DLQ retention sweep (D-08).
create index if not exists idx_deliveries_dlq_retention
  on markos_webhook_deliveries(dlq_at)
  where status = 'failed';

comment on column markos_webhook_deliveries.replayed_from is 'Phase 203 D-06: original delivery_id this replay row was derived from.';
comment on column markos_webhook_deliveries.dlq_reason    is 'Phase 203 D-08: human-readable reason delivery entered DLQ.';
comment on column markos_webhook_deliveries.final_attempt is 'Phase 203 D-07: 1-based attempt number at which delivery exhausted 24 retries.';
comment on column markos_webhook_deliveries.dlq_at        is 'Phase 203 D-08: timestamp at which delivery transitioned to status=failed.';

-- ============================================================================
-- 3. markos_webhook_secret_rotations - audit ledger for Plan 203-05
-- ============================================================================
create table if not exists markos_webhook_secret_rotations (
  id              text primary key,
  subscription_id text not null references markos_webhook_subscriptions(id) on delete cascade,
  tenant_id       text not null references markos_tenants(id) on delete cascade,
  initiated_by    text not null,
  initiated_at    timestamptz not null default now(),
  state           text not null check (state in ('active', 'rolled_back', 'finalized')),
  grace_ends_at   timestamptz not null,
  finalized_at    timestamptz null,
  rolled_back_at  timestamptz null
);

alter table markos_webhook_secret_rotations enable row level security;

comment on table markos_webhook_secret_rotations is 'Phase 203 D-09/D-10/D-12: rotation-event ledger. Read via tenant membership; writes via SECURITY DEFINER rotation RPCs.';

-- RLS: tenant members read their own rotations.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'markos_webhook_secret_rotations'
      and policyname = 'rotations_read_via_tenant'
  ) then
    create policy rotations_read_via_tenant on markos_webhook_secret_rotations
      as permissive for select
      using (
        exists (
          select 1 from markos_tenant_memberships
          where markos_tenant_memberships.tenant_id = markos_webhook_secret_rotations.tenant_id
          and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
        )
      );
  end if;
end $$;

create index if not exists idx_rotations_active
  on markos_webhook_secret_rotations(tenant_id, state, grace_ends_at)
  where state = 'active';

-- ============================================================================
-- 4. Fleet metrics view (S1 hero banner source; D-04)
-- ============================================================================
-- Ship as a VIEW first (cheap); materialize later only if p95 > 150ms.
create or replace view markos_webhook_fleet_metrics_v1 as
  select
    tenant_id,
    date_trunc('hour', created_at) as bucket,
    count(*)                       as total,
    count(*) filter (where status = 'delivered') as delivered,
    count(*) filter (where status = 'failed')    as failed,
    count(*) filter (where status = 'retrying')  as retrying,
    avg(
      extract(epoch from (updated_at - created_at)) * 1000
    ) filter (where status = 'delivered')         as avg_latency_ms
  from markos_webhook_deliveries
  where created_at > now() - interval '48 hours'
  group by tenant_id, bucket;

comment on view markos_webhook_fleet_metrics_v1 is 'Phase 203 D-04: S1 hero banner source. Aggregates last 48h of deliveries per (tenant, hour).';

-- ============================================================================
-- 5. Rotation RPCs — bodies filled by Plan 203-05
-- ============================================================================
-- Atomicity boundary for the rotation state machine (D-09 admin-trigger,
-- D-10 dual-sign grace window, D-12 no post-grace restore). Each RPC emits a
-- hash-chained audit row via append_markos_audit_row (Phase 201 Plan 02 pattern).

create or replace function start_webhook_rotation(
  p_rotation_id     text,
  p_subscription_id text,
  p_tenant_id       text,
  p_new_secret      text,
  p_grace_ends_at   timestamptz,
  p_actor_id        text
) returns json as $$
begin
  -- Assert no active rotation for this (tenant, subscription).
  if exists (
    select 1 from markos_webhook_subscriptions
    where id = p_subscription_id
      and tenant_id = p_tenant_id
      and rotation_state = 'active'
  ) then
    raise exception 'rotation_already_active';
  end if;

  -- Insert the rotations ledger row.
  insert into markos_webhook_secret_rotations (
    id, subscription_id, tenant_id, initiated_by, initiated_at, state, grace_ends_at
  ) values (
    p_rotation_id, p_subscription_id, p_tenant_id, p_actor_id, now(), 'active', p_grace_ends_at
  );

  -- Flip the subscription into rotating state.
  update markos_webhook_subscriptions
    set secret_v2 = p_new_secret,
        grace_started_at = now(),
        grace_ends_at = p_grace_ends_at,
        rotation_state = 'active',
        updated_at = now()
    where id = p_subscription_id
      and tenant_id = p_tenant_id;

  -- Hash-chained audit emit (Phase 201 Plan 02 pattern).
  perform append_markos_audit_row(
    p_tenant_id,
    null,
    'webhooks',
    'secret.rotation_started',
    p_actor_id,
    'owner',
    jsonb_build_object(
      'rotation_id', p_rotation_id,
      'subscription_id', p_subscription_id,
      'grace_ends_at', p_grace_ends_at
    ),
    now()
  );

  return json_build_object(
    'rotation_id', p_rotation_id,
    'grace_ends_at', p_grace_ends_at
  );
end;
$$ language plpgsql security definer;

create or replace function rollback_webhook_rotation(
  p_subscription_id text,
  p_tenant_id       text,
  p_actor_id        text
) returns json as $$
declare
  v_rotation record;
begin
  -- Locate the most recent active rotation matching (subscription, tenant).
  select * into v_rotation
  from markos_webhook_secret_rotations
  where subscription_id = p_subscription_id
    and tenant_id = p_tenant_id
    and state = 'active'
  order by initiated_at desc
  limit 1;

  if not found then
    raise exception 'rotation_not_active';
  end if;

  -- D-12: rollback is valid only during grace; past-grace is unrecoverable.
  if v_rotation.grace_ends_at <= now() then
    raise exception 'past_grace';
  end if;

  -- Revert subscription: drop secret_v2 + grace columns + rotation_state.
  update markos_webhook_subscriptions
    set secret_v2 = null,
        grace_started_at = null,
        grace_ends_at = null,
        rotation_state = null,
        updated_at = now()
    where id = p_subscription_id
      and tenant_id = p_tenant_id;

  -- Update the ledger row.
  update markos_webhook_secret_rotations
    set state = 'rolled_back',
        rolled_back_at = now()
    where id = v_rotation.id;

  perform append_markos_audit_row(
    p_tenant_id,
    null,
    'webhooks',
    'secret.rotation_rolled_back',
    p_actor_id,
    'owner',
    jsonb_build_object(
      'rotation_id', v_rotation.id,
      'subscription_id', p_subscription_id
    ),
    now()
  );

  return json_build_object(
    'rotation_id', v_rotation.id,
    'rolled_back', true
  );
end;
$$ language plpgsql security definer;

create or replace function finalize_expired_webhook_rotations(
  p_now timestamptz
) returns json as $$
declare
  v_row record;
  v_secret_vault_ref text;
  v_results jsonb := '[]'::jsonb;
begin
  for v_row in
    select r.id as rotation_id,
           r.subscription_id,
           r.tenant_id,
           s.secret_v2
      from markos_webhook_secret_rotations r
      join markos_webhook_subscriptions s
        on s.id = r.subscription_id
       and s.tenant_id = r.tenant_id
     where r.state = 'active'
       and r.grace_ends_at < p_now
  loop
    -- Promote secret_v2 → secret; purge grace state.
    v_secret_vault_ref := 'markos:webhook:secret:' || v_row.subscription_id;
    if v_row.secret_v2 is not null then
      perform vault_create_or_update_secret(
        v_row.secret_v2,
        v_secret_vault_ref,
        'Phase 203 rotation finalize'
      );
    end if;

    update markos_webhook_subscriptions
      set secret_vault_ref = case
            when v_row.secret_v2 is not null then v_secret_vault_ref
            else secret_vault_ref
          end,
          secret_v2 = null,
          grace_started_at = null,
          grace_ends_at = null,
          rotation_state = null,
          updated_at = now()
      where id = v_row.subscription_id
        and tenant_id = v_row.tenant_id;

    -- Update ledger row.
    update markos_webhook_secret_rotations
      set state = 'finalized',
          finalized_at = p_now
      where id = v_row.rotation_id;

    perform append_markos_audit_row(
      v_row.tenant_id,
      null,
      'webhooks',
      'secret.rotation_finalized',
      'system:cron',
      'system',
      jsonb_build_object(
        'rotation_id', v_row.rotation_id,
        'subscription_id', v_row.subscription_id
      ),
      p_now
    );

    v_results := v_results || jsonb_build_object(
      'rotation_id', v_row.rotation_id,
      'subscription_id', v_row.subscription_id,
      'finalized_at', p_now
    );
  end loop;

  return v_results::json;
end;
$$ language plpgsql security definer;
