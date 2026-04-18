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
-- 5. Rotation RPC stubs - Plan 203-05 fills the bodies
-- ============================================================================
-- Signatures are declared here so downstream plans can reference them by name
-- without waiting on 203-05. Invoking any of these today raises an exception.

create or replace function start_webhook_rotation(
  p_rotation_id     text,
  p_subscription_id text,
  p_tenant_id       text,
  p_new_secret      text,
  p_grace_ends_at   timestamptz,
  p_actor_id        text
) returns json as $$
begin
  raise exception 'start_webhook_rotation: body ships in Plan 203-05';
end;
$$ language plpgsql security definer;

create or replace function rollback_webhook_rotation(
  p_subscription_id text,
  p_tenant_id       text,
  p_actor_id        text
) returns json as $$
begin
  raise exception 'rollback_webhook_rotation: body ships in Plan 203-05';
end;
$$ language plpgsql security definer;

create or replace function finalize_expired_webhook_rotations(
  p_now timestamptz
) returns json as $$
begin
  raise exception 'finalize_expired_webhook_rotations: body ships in Plan 203-05';
end;
$$ language plpgsql security definer;
