-- Rollback for migration 85 (Phase 201 Plan 05)
drop policy if exists markos_custom_domains_read_via_org on markos_custom_domains;
drop index if exists idx_markos_custom_domains_one_per_org;
drop index if exists idx_markos_custom_domains_status;
drop index if exists idx_markos_custom_domains_tenant_id;
drop index if exists idx_markos_custom_domains_org_id;
drop table if exists markos_custom_domains;
drop policy if exists markos_sessions_devices_update_own on markos_sessions_devices;
drop policy if exists markos_sessions_devices_read_own on markos_sessions_devices;
drop index if exists idx_markos_sessions_devices_last_seen;
drop index if exists idx_markos_sessions_devices_user_tenant;
drop table if exists markos_sessions_devices;
