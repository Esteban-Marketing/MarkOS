-- Rollback for migration 81 (Phase 201 Plan 01)
drop function if exists count_org_active_members(text);
drop policy if exists markos_org_memberships_insert_via_owner on markos_org_memberships;
drop policy if exists markos_org_memberships_read_own on markos_org_memberships;
drop policy if exists markos_orgs_update_via_role on markos_orgs;
drop policy if exists markos_orgs_insert_self on markos_orgs;
drop policy if exists markos_orgs_read_via_membership on markos_orgs;
alter table if exists markos_tenants drop column if exists status;
alter table if exists markos_tenants drop column if exists slug;
alter table if exists markos_tenants drop column if exists org_id;
drop table if exists markos_org_memberships;
drop table if exists markos_orgs;
