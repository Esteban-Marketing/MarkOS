-- Rollback for migration 84 (Phase 201 Plan 04)
drop policy if exists markos_login_events_read_own on markos_login_events;
drop policy if exists markos_passkey_credentials_delete_own on markos_passkey_credentials;
drop policy if exists markos_passkey_credentials_read_own on markos_passkey_credentials;
drop table if exists markos_login_events;
drop index if exists idx_markos_passkey_challenges_user_kind;
drop index if exists idx_markos_passkey_challenges_expires_at;
drop table if exists markos_passkey_challenges;
drop index if exists idx_markos_passkey_credentials_user_id;
drop table if exists markos_passkey_credentials;
