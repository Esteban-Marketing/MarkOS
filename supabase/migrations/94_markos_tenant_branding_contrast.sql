-- Phase 201.1 D-110 (closes M3): WCAG AA contrast gate at the DB layer.
-- Mirrors lib/markos/tenant/contrast.cjs::passesWcagAa('<primary_color>', '#ffffff').

-- ============================================================================
-- 0. Add created_at column to markos_tenant_branding if it does not exist.
--    Migration 86 created the table with only updated_at. We add created_at
--    here so the W-3 narrowing clause (updated_at = created_at) can distinguish
--    never-edited rows (both timestamps are identical) from operator-customized
--    rows (updated_at > created_at after any upsert).
--    For existing rows we set created_at = updated_at — the best available
--    proxy for the original insert time.
-- ============================================================================
alter table markos_tenant_branding
  add column if not exists created_at timestamptz not null default now();

-- Back-fill existing rows: set created_at = updated_at so the narrowing clause
-- is correct for rows that were inserted and never subsequently edited.
update markos_tenant_branding
  set created_at = updated_at
  where created_at = now();   -- only rows where the DEFAULT now() just fired

-- ============================================================================
-- 1. SQL helper: WCAG 2.2 §1.4.3 luminance + contrast ratio against locked white bg.
-- Returns true iff (a) input is null, OR (b) input is a valid #RRGGBB AND
-- contrast against '#ffffff' >= 4.5:1.
-- Mirrors lib/markos/tenant/contrast.cjs using double precision arithmetic.
-- ============================================================================
create or replace function markos_tenant_branding_contrast_check(p_color text)
  returns boolean
  language plpgsql
  immutable
  parallel safe
as $$
declare
  v_r int;
  v_g int;
  v_b int;
  v_lr double precision;
  v_lg double precision;
  v_lb double precision;
  v_lum double precision;
  v_ratio double precision;
begin
  if p_color is null then
    return true;
  end if;
  if p_color !~ '^#[0-9a-fA-F]{6}$' then
    return false; -- invalid format -> reject (mirrors the HEX_COLOR regex in JS)
  end if;

  -- Parse hex channels via bit casting (reliable on all Postgres >= 10).
  v_r := ('x' || substr(p_color, 2, 2))::bit(8)::int;
  v_g := ('x' || substr(p_color, 4, 2))::bit(8)::int;
  v_b := ('x' || substr(p_color, 6, 2))::bit(8)::int;

  -- sRGB -> linear per WCAG 2.2 §1.4.3 (threshold 0.03928, exponent 2.4).
  v_lr := case when (v_r::double precision / 255) <= 0.03928
               then (v_r::double precision / 255) / 12.92
               else power(((v_r::double precision / 255) + 0.055) / 1.055, 2.4)
          end;
  v_lg := case when (v_g::double precision / 255) <= 0.03928
               then (v_g::double precision / 255) / 12.92
               else power(((v_g::double precision / 255) + 0.055) / 1.055, 2.4)
          end;
  v_lb := case when (v_b::double precision / 255) <= 0.03928
               then (v_b::double precision / 255) / 12.92
               else power(((v_b::double precision / 255) + 0.055) / 1.055, 2.4)
          end;

  v_lum := 0.2126 * v_lr + 0.7152 * v_lg + 0.0722 * v_lb;

  -- White background luminance is exactly 1.0.
  -- color is always darker than white, so formula simplifies to:
  v_ratio := (1.0 + 0.05) / (v_lum + 0.05);

  return v_ratio >= 4.5;
end;
$$;

comment on function markos_tenant_branding_contrast_check(text)
  is 'Phase 201.1 D-110 (closes M3): WCAG AA contrast gate against locked white vanity-login background. Mirrors lib/markos/tenant/contrast.cjs::passesWcagAa.';

-- ============================================================================
-- 2. W-3 closure — NARROWED backfill: fix the Phase 201 default color that was
-- inadvertently below WCAG AA, but ONLY for rows that were never edited.
--
-- #0d9488 (teal-600 Tailwind) -> ~3.86:1 contrast on white. Below WCAG AA 4.5:1.
-- Replacement: #0f766e (teal-700) -> ~4.79:1. Passes WCAG AA.
--
-- The `updated_at = created_at` clause identifies rows where the operator has
-- never changed their branding settings. Any row where the operator deliberately
-- set or modified a value (updated_at > created_at after migration 86+94 deploy)
-- is NOT touched. Those rows retain #0d9488 and will fail the CHECK constraint
-- below — the constraint addition step will surface those rows for manual review.
--
-- The execution SUMMARY at deploy time MUST report:
--   (a) Count of rows backfilled (select count(*) from the narrowed set)
--   (b) Count of operator-customized rows that retain #0d9488 (if any)
--   (c) Operator revert path (see rollback file)
-- ============================================================================
update markos_tenant_branding
  set primary_color = '#0f766e',
      updated_at = now()
  where primary_color = '#0d9488'
    and updated_at = created_at;

-- ============================================================================
-- 3. CHECK constraint enforcing the WCAG gate at INSERT/UPDATE.
-- Uses a DO block for idempotency on Postgres < 15 (no IF NOT EXISTS on ALTER).
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'markos_tenant_branding_primary_color_passes_wcag_aa'
      and conrelid = 'markos_tenant_branding'::regclass
  ) then
    alter table markos_tenant_branding
      add constraint markos_tenant_branding_primary_color_passes_wcag_aa
      check (markos_tenant_branding_contrast_check(primary_color));
  end if;
end $$;
