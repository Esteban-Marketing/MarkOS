-- Migration 96: Add neuro-aware literacy metadata columns to markos_literacy_chunks
-- Phase 96: Neuro-Aware Literacy Schema and Taxonomy Expansion
-- Non-destructive: existing rows remain valid and receive safe empty defaults.

ALTER TABLE markos_literacy_chunks
  ADD COLUMN IF NOT EXISTS desired_outcome_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS objection_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trust_driver_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trust_blocker_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emotional_state_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS neuro_trigger_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS archetype_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS naturality_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS icp_segment_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_tailoring_profile JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS icp_tailoring_profile JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stage_tailoring_profile JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS neuro_profile JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN markos_literacy_chunks.neuro_trigger_tags
  IS 'Governed B01-B10 neuromarketing hints only; brand-safe, evidence-aware, non-manipulative.';

COMMENT ON COLUMN markos_literacy_chunks.icp_segment_tags
  IS 'Deterministic ICP segment tags used for company-baseline plus audience-overlay retrieval.';
