-- Phase 201 Plan 07 rollback: GDPR exports + offboarding runs + invites.

drop policy if exists markos_gdpr_exports_read_via_tenant on markos_gdpr_exports;
drop index if exists idx_markos_gdpr_exports_tenant_created;
drop table if exists markos_gdpr_exports;
drop policy if exists markos_tenant_offboarding_runs_read_via_tenant on markos_tenant_offboarding_runs;
drop index if exists idx_markos_tenant_offboarding_active;
drop table if exists markos_tenant_offboarding_runs;
drop policy if exists markos_invites_read_via_tenant on markos_invites;
drop index if exists idx_markos_invites_email_pending;
drop index if exists idx_markos_invites_tenant_pending;
drop table if exists markos_invites;
