-- Phase 201.1 D-106 rollback: remove erase_audit_pii, recanonicalize_legacy_audit_row,
-- and the redacted_at/redacted_by columns added by 93_markos_audit_pii_erasure.sql.

revoke all on function recanonicalize_legacy_audit_row(bigint, text) from public, service_role;
revoke all on function erase_audit_pii(bigint, text, text) from public, service_role;
drop function if exists recanonicalize_legacy_audit_row(bigint, text);
drop function if exists erase_audit_pii(bigint, text, text);
drop index if exists idx_markos_audit_log_redacted_at;
alter table markos_audit_log drop column if exists redacted_by;
alter table markos_audit_log drop column if exists redacted_at;
