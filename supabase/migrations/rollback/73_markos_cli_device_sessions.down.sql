-- Phase 204 Plan 01 Task 1 rollback: markos_cli_device_sessions.

drop index if exists idx_cli_device_user_code;
drop table if exists markos_cli_device_sessions;
