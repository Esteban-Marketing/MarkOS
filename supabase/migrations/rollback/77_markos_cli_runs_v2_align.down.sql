-- Rollback for 77_markos_cli_runs_v2_align.sql
-- Drops all columns + constraints + indexes added by the forward migration.
-- Safe: uses `if exists` everywhere. Idempotent.

drop index if exists idx_cli_runs_parent_run;
drop index if exists idx_cli_runs_idempotency;
drop index if exists idx_cli_runs_tenant_v2_state;

alter table markos_cli_runs
  drop constraint if exists markos_cli_runs_v2_state_chk;

alter table markos_cli_runs
  drop column if exists v2_state,
  drop column if exists closed_at,
  drop column if exists last_error_code,
  drop column if exists retry_after,
  drop column if exists retry_count,
  drop column if exists tokens_output,
  drop column if exists tokens_input,
  drop column if exists cost_currency,
  drop column if exists pricing_engine_context,
  drop column if exists tool_policy,
  drop column if exists provider_policy,
  drop column if exists approval_policy,
  drop column if exists task_id,
  drop column if exists parent_run_id,
  drop column if exists idempotency_key;

comment on table markos_cli_runs is
  'Phase 204 Plan 06: CLI run submissions (pending → running → success/failed/cancelled). AgentRun v2 forward-compatible fields in place so Plan 207-06 adapter can bridge without schema change.';
