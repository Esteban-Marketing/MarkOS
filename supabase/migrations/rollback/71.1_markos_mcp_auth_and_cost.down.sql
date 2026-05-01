drop function if exists markos_mcp_increment_rate_window(text, timestamptz);

drop policy if exists markos_mcp_rate_windows_service_role_all on markos_mcp_rate_windows;
drop index if exists idx_markos_mcp_rate_windows_window_start;
drop table if exists markos_mcp_rate_windows;

drop policy if exists markos_mcp_cost_events_read_via_membership on markos_mcp_cost_events;
drop policy if exists markos_mcp_cost_events_service_role_all on markos_mcp_cost_events;
drop index if exists idx_markos_mcp_cost_events_tenant_id_occurred_at;
drop index if exists idx_markos_mcp_cost_events_session;
drop index if exists idx_markos_mcp_cost_events_key_id;
drop table if exists markos_mcp_cost_events;

drop policy if exists markos_mcp_api_keys_read_via_membership on markos_mcp_api_keys;
drop policy if exists markos_mcp_api_keys_service_role_all on markos_mcp_api_keys;
drop index if exists idx_markos_mcp_api_keys_tenant_id;
drop index if exists idx_markos_mcp_api_keys_revoked_at;
drop table if exists markos_mcp_api_keys;
