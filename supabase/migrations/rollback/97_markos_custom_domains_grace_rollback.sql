-- Phase 201.1 D-107 rollback: remove last_verified_at column + index from markos_custom_domains.
-- Run this ONLY to revert migration 97_markos_custom_domains_grace.sql.

drop index if exists idx_markos_custom_domains_last_verified;
alter table markos_custom_domains drop column if exists last_verified_at;
