-- Phase 204 Plan 06 Task 1 — rollback for 75_markos_cli_runs.sql.
--
-- Drops the RLS policy, indexes, then the table itself. Safe to run multiple
-- times (uses `if exists`). QA-13 drills assert this script returns exit 0.

drop policy if exists markos_cli_runs_tenant_isolation on markos_cli_runs;

drop index if exists idx_cli_runs_status_created;
drop index if exists idx_cli_runs_tenant_created;

drop table if exists markos_cli_runs;
