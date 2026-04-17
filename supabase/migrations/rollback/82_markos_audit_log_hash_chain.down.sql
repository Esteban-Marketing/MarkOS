-- Rollback for migration 82 (Phase 201 Plan 02)
drop function if exists append_markos_audit_row(text, text, text, text, text, text, jsonb, timestamptz);
drop table if exists markos_audit_chain_checks;
drop table if exists markos_audit_log_staging;
drop policy if exists markos_audit_log_block_delete on markos_audit_log;
drop policy if exists markos_audit_log_block_update on markos_audit_log;
drop index if exists idx_markos_audit_log_org_id;
drop index if exists idx_markos_audit_log_source_domain;
drop index if exists idx_markos_audit_log_tenant_occurred;
alter table if exists markos_audit_log drop column if exists occurred_at;
alter table if exists markos_audit_log drop column if exists row_hash;
alter table if exists markos_audit_log drop column if exists prev_hash;
alter table if exists markos_audit_log drop column if exists payload;
alter table if exists markos_audit_log drop column if exists actor_role;
alter table if exists markos_audit_log drop column if exists actor_id;
alter table if exists markos_audit_log drop column if exists source_domain;
alter table if exists markos_audit_log drop column if exists org_id;
