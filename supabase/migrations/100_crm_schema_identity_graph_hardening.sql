-- Phase 100: CRM schema and identity graph hardening
-- Forward-only parity fixes for identity review state and tenant-safe audit behavior.

alter table if exists crm_identity_links
  drop constraint if exists crm_identity_links_link_status_check;

alter table if exists crm_identity_links
  add constraint crm_identity_links_link_status_check
  check (link_status in ('candidate', 'accepted', 'review', 'rejected'));

create index if not exists idx_crm_identity_links_status_tenant
  on crm_identity_links (tenant_id, link_status, created_at desc);
