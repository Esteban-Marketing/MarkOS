-- Rollback for migration 83 (Phase 201 Plan 03)
drop table if exists markos_signup_email_throttle;
drop index if exists idx_markos_signup_rate_limits_window;
drop table if exists markos_signup_rate_limits;
drop index if exists idx_markos_unverified_signups_expires_at;
drop table if exists markos_unverified_signups;
