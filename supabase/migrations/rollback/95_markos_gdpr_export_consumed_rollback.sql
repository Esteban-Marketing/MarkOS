-- Phase 201.1 D-102 rollback: remove GDPR single-use nonce hardening.

drop policy if exists markos_gdpr_export_consumed_service_role on markos_gdpr_export_consumed;
drop index if exists idx_markos_gdpr_export_consumed_export;
drop table if exists markos_gdpr_export_consumed;

alter table markos_gdpr_exports
  drop column if exists reissued_at,
  drop column if exists audience_tenant_id,
  drop column if exists nonce;
