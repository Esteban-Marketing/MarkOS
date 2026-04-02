-- Migration 39: Add pain_point_tags column to markos_literacy_chunks
-- Phase 39: Pain-Points-First Content Corpus
-- Non-destructive: existing rows receive an empty array default.

ALTER TABLE markos_literacy_chunks
  ADD COLUMN IF NOT EXISTS pain_point_tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN markos_literacy_chunks.pain_point_tags
  IS 'Two-tier pain-point tags: parent category + discipline sub-tag (e.g. ["high_acquisition_cost","paid_media:high_cpr"]). Filterable via Supabase TEXT[] operators.';