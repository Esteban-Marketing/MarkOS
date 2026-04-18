-- Phase 202 Plan 01 rollback: markos_mcp_cost_window + check_and_charge_mcp_budget.

drop function if exists check_and_charge_mcp_budget(text, integer, integer);
drop policy if exists mmcw_read_tenant_admin on markos_mcp_cost_window;
drop index if exists idx_mmcw_tenant_window;
drop table if exists markos_mcp_cost_window;
