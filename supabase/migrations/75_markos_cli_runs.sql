-- Phase 204 Plan 06 Task 1: CLI run submissions + live progress.
--
-- Backs `markos run <brief>` (Plan 204-06) — user-submitted runs with live
-- SSE progress streaming. Rows are written by POST /api/tenant/runs (create.js)
-- and polled by the SSE event stream in GET /api/tenant/runs/{run_id}/events.
--
-- Consumers:
--   204-06  markos run CLI + SSE streamer          (this plan)
--   204-09  markos status                           (reads listRuns + getRun)
--   204-13  v2 doctrine compliance gap-closure     (migrates rows to AgentRun v2)
--   207-06  adoption adapter                        (wraps as v2-compatible rows)
--
-- Design notes:
--   * column names are AgentRun v2 forward-compatible where practical
--     (run_id, tenant_id, user_id, trigger_kind, source_surface, priority,
--     chain_id, estimated_cost_usd_micro) so Plan 207-06's adapter can lift
--     rows without a schema migration.
--   * `brief_json` holds the normalised brief submitted by the caller.
--   * `result_json` holds the stub executor's output (v1 GA) — replaced by the
--     real agent run in Phase 205 / 204-13.
--   * status enum is the v1 subset; Plan 204-13 will extend with
--     queued/paused/retry_wait/canceled/dlq.
--   * RLS policy enforces tenant_id claim match (`request.jwt.claims`).
--
-- Idempotency: guarded with `if not exists`. Safe to re-run.

create table if not exists markos_cli_runs (
  id                           text primary key default ('run_' || encode(gen_random_bytes(12), 'hex')),
  tenant_id                    text not null references markos_tenants(id) on delete cascade,
  user_id                      text not null references markos_users(id),
  brief_json                   jsonb not null,
  status                       text not null default 'pending'
                               check (status in ('pending','running','success','failed','cancelled')),
  steps_completed              int not null default 0,
  steps_total                  int not null default 3,
  result_json                  jsonb,
  error_message                text,
  -- AgentRun v2 forward-compat fields (Phase 207 CONTRACT-LOCK §6/§8) -------
  trigger_kind                 text not null default 'cli',
  source_surface               text not null default 'cli:markos run',
  priority                     text not null default 'P2'
                               check (priority in ('P0','P1','P2','P3','P4')),
  chain_id                     text,
  correlation_id               text,
  agent_id                     text not null default 'markos.plan.v1',
  agent_registry_version       text not null default '2026-04-23-r1',
  estimated_cost_usd_micro     bigint not null default 0,
  actual_cost_usd_micro        bigint not null default 0,
  -- Lifecycle timestamps -----------------------------------------------------
  created_at                   timestamptz not null default now(),
  started_at                   timestamptz,
  completed_at                 timestamptz
);

create index if not exists idx_cli_runs_tenant_created
  on markos_cli_runs(tenant_id, created_at desc);

create index if not exists idx_cli_runs_status_created
  on markos_cli_runs(status, created_at desc)
  where status in ('pending','running');

alter table markos_cli_runs enable row level security;

drop policy if exists markos_cli_runs_tenant_isolation on markos_cli_runs;
create policy markos_cli_runs_tenant_isolation on markos_cli_runs
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

comment on table markos_cli_runs is
  'Phase 204 Plan 06: CLI run submissions (pending → running → success/failed/cancelled). AgentRun v2 forward-compatible fields in place so Plan 207-06 adapter can bridge without schema change.';
comment on column markos_cli_runs.brief_json              is 'Normalised brief JSON submitted by markos run. Opaque blob — never executed by DB.';
comment on column markos_cli_runs.trigger_kind            is 'AgentRun v2 trigger_kind. Always "cli" for this table.';
comment on column markos_cli_runs.source_surface          is 'AgentRun v2 source_surface. "cli:markos run" for this table.';
comment on column markos_cli_runs.priority                is 'AgentRun v2 priority. Default P2 (standard). Plan 207 will enforce concurrency per PRIORITY_CONCURRENCY_DEFAULTS.';
comment on column markos_cli_runs.estimated_cost_usd_micro is 'AgentRun v2 BIGINT micro-USD. 1 USD = 1_000_000 micro.';
comment on column markos_cli_runs.actual_cost_usd_micro   is 'AgentRun v2 BIGINT micro-USD. Stub executor leaves at 0 until Phase 205 LLM integration.';
