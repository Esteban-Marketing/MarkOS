-- Rollback for Phase 201.1 migration 94: WCAG AA contrast gate.

-- 1. Drop the CHECK constraint.
alter table markos_tenant_branding
  drop constraint if exists markos_tenant_branding_primary_color_passes_wcag_aa;

-- 2. Drop the SQL helper function.
drop function if exists markos_tenant_branding_contrast_check(text);

-- 3. Backfill rollback (W-3 narrowing reversal):
--    The forward migration's UPDATE restricted itself to rows where
--    updated_at = created_at (never-edited rows) and set primary_color = '#0f766e'.
--    It also set updated_at = now(), so those rows now have updated_at > created_at.
--
--    This rollback reverses ONLY those rows: rows where primary_color = '#0f766e'
--    and updated_at > created_at (i.e., the forward migration touched them).
--    Operator-customized rows that legitimately chose #0f766e after deploy will
--    also be reverted — operators should export markos_tenant_branding before
--    running this rollback.
--
--    Operator revert path (copy-paste safe):
--    alter table markos_tenant_branding
--      drop constraint if exists markos_tenant_branding_primary_color_passes_wcag_aa;
--    update markos_tenant_branding
--      set primary_color = '#0d9488'
--      where primary_color = '#0f766e'
--        and updated_at > created_at;
update markos_tenant_branding
  set primary_color = '#0d9488'
  where primary_color = '#0f766e'
    and updated_at > created_at;

-- 4. Drop the created_at column added by this migration.
--    WARNING: only safe if no downstream code reads created_at.
--    Comment this out if you want to preserve the column for future use.
alter table markos_tenant_branding
  drop column if exists created_at;
