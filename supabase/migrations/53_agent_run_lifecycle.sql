-- Phase 53: Agent run lifecycle and idempotency foundation
-- AGT-01 / AGT-02 contracts:
-- - tenant-bound run envelopes with required policy metadata
-- - canonical transition event log with denied transition evidence
-- - side-effect idempotency ledger that blocks duplicate external mutations

create table if not exists markos_agent_runs (
  run_id text primary key,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  actor_id text not null,
  correlation_id text not null,
  project_slug text,
  prompt_version text,
  idempotency_key text,
  state text not null check (
    state in (
      'requested',
      'accepted',
      'context_loaded',
      'executing',
      'awaiting_approval',
      'approved',
      'rejected',
      'completed',
      'failed',
      'archived'
    )
  ),
  provider_policy jsonb not null,
  tool_policy jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (tenant_id, idempotency_key)
);

comment on table markos_agent_runs is 'Tenant-bound agent run envelopes with deterministic lifecycle state and policy metadata.';

create index if not exists idx_markos_agent_runs_tenant_state on markos_agent_runs(tenant_id, state);
create index if not exists idx_markos_agent_runs_tenant_created on markos_agent_runs(tenant_id, created_at desc);
create index if not exists idx_markos_agent_runs_correlation on markos_agent_runs(correlation_id);

create table if not exists markos_agent_run_events (
  event_id text primary key default gen_random_uuid()::text,
  run_id text not null references markos_agent_runs(run_id) on delete cascade,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'agent_run_transitioned',
      'agent_run_transition_denied',
      'agent_run_provider_attempt',
      'agent_run_awaiting_approval',
      'agent_run_close_completed',
      'agent_run_close_incomplete'
    )
  ),
  from_state text,
  to_state text,
  actor_id text,
  correlation_id text,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table markos_agent_run_events is 'Append-only event stream for run lifecycle transitions, denials, and provider attempts.';

create index if not exists idx_markos_agent_run_events_run_created on markos_agent_run_events(run_id, created_at);
create index if not exists idx_markos_agent_run_events_tenant_type on markos_agent_run_events(tenant_id, event_type, created_at);

create table if not exists markos_agent_side_effects (
  effect_id text primary key default gen_random_uuid()::text,
  run_id text not null references markos_agent_runs(run_id) on delete cascade,
  tenant_id text not null references markos_tenants(id) on delete cascade,
  step_key text not null,
  effect_hash text not null,
  effect_type text not null,
  payload jsonb not null default '{}'::jsonb,
  committed_at timestamptz not null default now(),
  unique (tenant_id, run_id, step_key, effect_hash)
);

comment on table markos_agent_side_effects is 'Idempotency ledger for externally visible run side effects.';

create index if not exists idx_markos_agent_side_effects_tenant_run on markos_agent_side_effects(tenant_id, run_id);
create index if not exists idx_markos_agent_side_effects_committed on markos_agent_side_effects(committed_at desc);

alter table markos_agent_runs enable row level security;
alter table markos_agent_run_events enable row level security;
alter table markos_agent_side_effects enable row level security;

create policy if not exists markos_agent_runs_read_own on markos_agent_runs
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_agent_runs_insert_member on markos_agent_runs
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_agent_runs_update_member on markos_agent_runs
  as permissive
  for update
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  )
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_agent_run_events_read_own on markos_agent_run_events
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_agent_run_events_insert_member on markos_agent_run_events
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_agent_side_effects_read_own on markos_agent_side_effects
  as permissive
  for select
  using (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

create policy if not exists markos_agent_side_effects_insert_member on markos_agent_side_effects
  as permissive
  for insert
  with check (
    tenant_id in (
      select tenant_id from markos_tenant_memberships
      where user_id = auth.jwt()->>'sub'
    )
  );

-- Append-only semantics: no UPDATE/DELETE policies are created for events/effects.
