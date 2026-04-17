drop policy if exists markos_tenant_branding_upsert_via_admin on markos_tenant_branding;
drop policy if exists markos_tenant_branding_read_via_membership on markos_tenant_branding;
drop table if exists markos_tenant_branding;
drop index if exists idx_markos_custom_domains_vercel_domain_id;
alter table if exists markos_custom_domains drop column if exists removed_at;
alter table if exists markos_custom_domains drop column if exists last_verification_at;
alter table if exists markos_custom_domains drop column if exists verification_challenge;
alter table if exists markos_custom_domains drop column if exists vercel_domain_id;
alter table if exists markos_custom_domains drop column if exists vercel_project_id;
