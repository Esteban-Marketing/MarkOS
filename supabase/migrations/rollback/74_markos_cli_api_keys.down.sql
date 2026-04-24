-- Phase 204 Plan 01 Task 1 rollback: markos_cli_api_keys.

drop policy if exists markos_cli_api_keys_tenant_isolation on markos_cli_api_keys;
drop index if exists idx_cli_api_keys_fingerprint;
drop index if exists idx_cli_api_keys_tenant;
drop table if exists markos_cli_api_keys;
