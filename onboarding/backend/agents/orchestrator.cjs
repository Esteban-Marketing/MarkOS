#!/usr/bin/env node
// orchestrator.cjs — Reads onboarding seed, runs all MIR/MSP agents, stores drafts
// mgsd-onboarding v2.0

'use strict';

const mirFiller  = require('./mir-filler.cjs');
const mspFiller  = require('./msp-filler.cjs');
const chroma     = require('../chroma-client.cjs');

/**
 * Run all draft-generation agents for a given seed.
 * Persists results to ChromaDB.
 * Returns: { drafts: { ... }, chromaResults: [...], errors: [...] }
 *
 * @param {object} seed   — parsed onboarding-seed.json
 * @param {string} slug   — project slug (e.g. "acme-corp")
 */
async function orchestrate(seed, slug) {
  console.log(`[orchestrator] Starting draft generation for: ${slug}`);

  const errors = [];

  // ── 1. Store raw seed in ChromaDB ─────────────────────────────────────────
  let chromaResults = [];
  try {
    chromaResults = await chroma.upsertSeed(slug, seed);
    console.log(`[orchestrator] Seed stored in ChromaDB (${chromaResults.length} collections)`);
  } catch (err) {
    console.warn(`[orchestrator] ChromaDB upsert failed: ${err.message} — continuing without persistence`);
    errors.push({ phase: 'chroma-upsert', error: err.message });
  }

  // ── 2. Run MIR agents in parallel ─────────────────────────────────────────
  console.log('[orchestrator] Generating MIR drafts...');
  const [
    companyProfileResult,
    missionValuesResult,
    audienceResult,
    competitiveResult,
  ] = await Promise.all([
    mirFiller.generateCompanyProfile(seed),
    mirFiller.generateMissionVisionValues(seed),
    mirFiller.generateAudienceProfile(seed),
    mirFiller.generateCompetitiveLandscape(seed),
  ]);

  // ── 3. Run MSP agents in parallel ─────────────────────────────────────────
  console.log('[orchestrator] Generating MSP drafts...');
  const [
    brandVoiceResult,
    channelStrategyResult,
  ] = await Promise.all([
    mspFiller.generateBrandVoice(seed),
    mspFiller.generateChannelStrategy(seed),
  ]);

  // ── 4. Collect all drafts ─────────────────────────────────────────────────
  const drafts = {
    company_profile:    companyProfileResult.text,
    mission_values:     missionValuesResult.text,
    audience:           audienceResult.text,
    competitive:        competitiveResult.text,
    brand_voice:        brandVoiceResult.text,
    channel_strategy:   channelStrategyResult.text,
  };

  // Track any LLM errors
  const agentResults = {
    company_profile:  companyProfileResult,
    mission_values:   missionValuesResult,
    audience:         audienceResult,
    competitive:      competitiveResult,
    brand_voice:      brandVoiceResult,
    channel_strategy: channelStrategyResult,
  };
  for (const [key, result] of Object.entries(agentResults)) {
    if (!result.ok) {
      errors.push({ phase: `llm-${key}`, error: result.error });
    }
  }

  // ── 5. Store drafts in ChromaDB ───────────────────────────────────────────
  for (const [section, content] of Object.entries(drafts)) {
    await chroma.storeDraft(slug, section, content);
  }

  console.log(`[orchestrator] Done. Errors: ${errors.length}`);
  return { drafts, chromaResults, errors };
}

module.exports = { orchestrate };
