-- Phase 204 Plan 07 Task 1 — rollback for 76_markos_cli_tenant_env.sql.
--
-- Drops the RPC functions, RLS policy, index, then the table itself.
-- pgcrypto is intentionally NOT dropped (shared with migration 82 audit hash
-- chain + other domains). Safe to run multiple times (uses `if exists`).
-- QA-13 drills assert this script returns exit 0.

drop function if exists get_env_entries(text, text);
drop function if exists set_env_entry(text, text, text, text, text);

drop policy if exists markos_cli_tenant_env_tenant_isolation on markos_cli_tenant_env;

drop index if exists idx_cli_tenant_env_tenant;

drop table if exists markos_cli_tenant_env;

-- pgcrypto extension intentionally NOT dropped — shared with other domains.
