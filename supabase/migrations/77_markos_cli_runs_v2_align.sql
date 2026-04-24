-- Phase 204 Plan 13 Task 1: v2 compliance guardrails — markos_cli_runs alignment.
--
-- Purpose: bring `markos_cli_runs` (migration 75) into alignment with Phase 207
-- CONTRACT-LOCK §4 (AgentRun v2 schema) WITHOUT breaking the shipped CLI GA
-- surface. Strictly additive — no column drops, no constraint tightening on
-- existing rows. Pre-existing rows remain valid under the new shape.
--
-- Reference: `.planning/phases/207-agentrun-v2-orchestration-substrate/207-01-CONTRACT-LOCK.md`
-- §4 Zod schemas · §5 state machine · §8 cost model · §9 approval/task handoff.
--
-- Columns added (all nullable or default-backed):
--   - idempotency_key         text             v2 §4 AgentRun.idempotency_key
--   - parent_run_id           text             v2 §4 AgentRun.parent_run_id (self-FK deferred; not enforced until 207-03 lands agent_chains)
--   - task_id                 text             v2 §9 task handoff link (FK deferred until 104 migration creates markos_agent_tasks)
--   - approval_policy         jsonb            v2 §4 AgentRun.approval_policy (default: { mode:'always', required_roles:[] })
--   - provider_policy         jsonb            v2 §4 AgentRun.provider_policy
--   - tool_policy             jsonb            v2 §4 AgentRun.tool_policy
--   - pricing_engine_context  jsonb NOT NULL   v2 §8 cost model — placeholder-safe; accepts '{{MARKOS_PRICING_ENGINE_PENDING}}' sentinel
--   - cost_currency           text NOT NULL    v2 §8 default 'USD'
--   - tokens_input            int  NOT NULL    v2 §4 default 0
--   - tokens_output           int  NOT NULL    v2 §4 default 0
--   - retry_count             int  NOT NULL    v2 §4 default 0
--   - retry_after             timestamptz      v2 §4 AgentRun.retry_after
--   - last_error_code         text             v2 §4 AgentRun.last_error_code
--   - closed_at               timestamptz      v2 §4 AgentRun.closed_at (canonical "terminal stamp"; separate from completed_at)
--   - v2_state                text             v2 §4 AgentRun.state — 15-state canonical enum lives here
--                                               (parallel to the v1 `status` column; the adapter in 207-06 will
--                                               collapse the two; see STATE_V1_TO_V2_MAP comment below)
--
-- State mapping documented in this migration (enforced by CHECK + validated in
-- lib/markos/cli/runs.cjs::STATE_V1_TO_V2_MAP):
--
--   v1 status      → v2_state         notes
--   pending        → requested        row inserted, before executor picks up
--   running        → executing        stub executor or future LLM agent running
--   success        → completed        terminal success
--   failed         → failed           terminal failure
--   cancelled      → canceled         note spelling: v2 uses US "canceled"
--
-- v1 `status` is NOT dropped — older rows keep it, and the lib writes both
-- columns for new rows going forward (Task 3).
--
-- Idempotency: every ALTER is `if not exists`. Safe to re-run. No data migration.

alter table markos_cli_runs
  add column if not exists idempotency_key          text;

alter table markos_cli_runs
  add column if not exists parent_run_id            text;

alter table markos_cli_runs
  add column if not exists task_id                  text;

alter table markos_cli_runs
  add column if not exists approval_policy          jsonb not null
    default jsonb_build_object('mode', 'always', 'required_roles', '[]'::jsonb);

alter table markos_cli_runs
  add column if not exists provider_policy          jsonb not null default '{}'::jsonb;

alter table markos_cli_runs
  add column if not exists tool_policy              jsonb not null default '{}'::jsonb;

alter table markos_cli_runs
  add column if not exists pricing_engine_context   jsonb not null default '{}'::jsonb;

alter table markos_cli_runs
  add column if not exists cost_currency            text  not null default 'USD';

alter table markos_cli_runs
  add column if not exists tokens_input             int   not null default 0;

alter table markos_cli_runs
  add column if not exists tokens_output            int   not null default 0;

alter table markos_cli_runs
  add column if not exists retry_count              int   not null default 0;

alter table markos_cli_runs
  add column if not exists retry_after              timestamptz;

alter table markos_cli_runs
  add column if not exists last_error_code          text;

alter table markos_cli_runs
  add column if not exists closed_at                timestamptz;

alter table markos_cli_runs
  add column if not exists v2_state                 text;

-- Optional CHECK constraint on v2_state — NULL tolerated because older rows
-- (from migration 75) predate this column. New rows from the v2-aware lib will
-- populate it. Enforced via DO block so re-runs don't fail.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'markos_cli_runs_v2_state_chk'
  ) then
    alter table markos_cli_runs
      add constraint markos_cli_runs_v2_state_chk
      check (
        v2_state is null or v2_state in (
          'requested','accepted','context_loaded','executing',
          'awaiting_approval','approved','rejected','completed','failed','archived',
          'queued','paused','retry_wait','canceled','dlq'
        )
      ) not valid;
  end if;
end$$;

-- Back-fill v2_state for existing rows via the canonical v1→v2 mapping.
-- Safe: only updates rows where v2_state IS NULL. Idempotent.
update markos_cli_runs
set v2_state = case status
  when 'pending'   then 'requested'
  when 'running'   then 'executing'
  when 'success'   then 'completed'
  when 'failed'    then 'failed'
  when 'cancelled' then 'canceled'
  else 'requested'
end
where v2_state is null;

-- Helpful indexes for the new lookup paths (doctor + status panels + 207-06).
create index if not exists idx_cli_runs_tenant_v2_state
  on markos_cli_runs(tenant_id, v2_state);

create index if not exists idx_cli_runs_idempotency
  on markos_cli_runs(tenant_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_cli_runs_parent_run
  on markos_cli_runs(parent_run_id)
  where parent_run_id is not null;

-- Column comments for operator clarity.
comment on column markos_cli_runs.idempotency_key        is 'AgentRun v2 idempotency_key (CONTRACT-LOCK §4). Derived by CLI from sha256(brief) if unsupplied.';
comment on column markos_cli_runs.parent_run_id          is 'AgentRun v2 parent_run_id (self-reference). FK will be added when chain table lands in migration 102.';
comment on column markos_cli_runs.task_id                is 'AgentRun v2 task_id — handoff link to markos_agent_tasks. FK added by migration 104 (Phase 207-04).';
comment on column markos_cli_runs.approval_policy        is 'AgentRun v2 approval_policy (mode/required_roles). Default: always-ask.';
comment on column markos_cli_runs.provider_policy        is 'AgentRun v2 provider_policy (model/provider routing hints).';
comment on column markos_cli_runs.tool_policy            is 'AgentRun v2 tool_policy (allowed/denied tool IDs).';
comment on column markos_cli_runs.pricing_engine_context is 'AgentRun v2 §8 pricing_engine_context. Placeholder-safe: accepts {{MARKOS_PRICING_ENGINE_PENDING}} sentinel until Pricing Engine (Phase 205) lands.';
comment on column markos_cli_runs.cost_currency          is 'AgentRun v2 §8 cost_currency. Default USD.';
comment on column markos_cli_runs.tokens_input           is 'AgentRun v2 tokens_input. 0 until Phase 205 LLM integration lands.';
comment on column markos_cli_runs.tokens_output          is 'AgentRun v2 tokens_output. 0 until Phase 205 LLM integration lands.';
comment on column markos_cli_runs.retry_count            is 'AgentRun v2 retry_count. Incremented by 207-03 retry policy.';
comment on column markos_cli_runs.retry_after            is 'AgentRun v2 retry_after. Next permissible retry timestamp.';
comment on column markos_cli_runs.last_error_code        is 'AgentRun v2 last_error_code. Stable machine code for the most recent failure.';
comment on column markos_cli_runs.closed_at              is 'AgentRun v2 closed_at. Terminal timestamp (distinct from completed_at — older rows used completed_at for this).';
comment on column markos_cli_runs.v2_state               is 'AgentRun v2 canonical state (15-enum). Parallel to v1 `status`; 207-06 adapter collapses the two.';

comment on table markos_cli_runs is
  'Phase 204 Plan 06 + 13: CLI run submissions. Plan 13 migration 77 adds v2-compliance columns (task_id/approval_policy/pricing_engine_context/v2_state/...) so Phase 207 integration lands without a CLI schema migration. Strictly additive — v1 columns (status/steps_completed/steps_total) remain for backward-compat.';
