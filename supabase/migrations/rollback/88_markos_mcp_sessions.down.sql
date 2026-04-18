-- Phase 202 Plan 01 rollback: markos_mcp_sessions.

drop policy if exists mmsess_revoke_tenant_owner on markos_mcp_sessions;
drop policy if exists mmsess_revoke_own on markos_mcp_sessions;
drop policy if exists mmsess_read_tenant_admin on markos_mcp_sessions;
drop policy if exists mmsess_read_own on markos_mcp_sessions;
drop index if exists idx_mmsess_expires;
drop index if exists idx_mmsess_user_tenant;
drop index if exists idx_mmsess_tenant_id;
drop index if exists idx_mmsess_token_hash;
drop table if exists markos_mcp_sessions;
