-- Rollback migration 92: drop the markos_reserved_slugs table.
-- WARNING: callers MUST be reverted to the hardcoded reserved-slugs.cjs before
-- this rollback runs (otherwise isReservedSlugAsync silently returns false and the slug bypass).
drop policy if exists markos_reserved_slugs_admin on markos_reserved_slugs;
drop policy if exists markos_reserved_slugs_read on markos_reserved_slugs;
drop index if exists idx_markos_reserved_slugs_source_version;
drop index if exists idx_markos_reserved_slugs_category;
drop table if exists markos_reserved_slugs;
