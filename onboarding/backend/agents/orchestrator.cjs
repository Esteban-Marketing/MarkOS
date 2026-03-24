#!/usr/bin/env node
// orchestrator.cjs — Reads onboarding seed, runs all MIR/MSP agents, stores drafts
// mgsd-onboarding v2.0

'use strict';

const mirFiller  = require('./mir-filler.cjs');
const mspFiller  = require('./msp-filler.cjs');
const chroma     = require('../chroma-client.cjs');

// ── Rate Limits & Retries ───────────────────────────────────────────────────
async function executeWithRetry(fn, name, retries = 3, baseDelay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fn();
      if (!res.ok) throw new Error(res.error);
      return res;
    } catch (e) {
      if (i === retries - 1) {
        console.error(`[orchestrator] ${name} failed after ${retries} retries: ${e.message}`);
        return { ok: false, error: e.message, text: `[DRAFT UNAVAILABLE — ${e.message}]` };
      }
      const wait = baseDelay * Math.pow(2, i);
      console.warn(`[orchestrator] ${name} failed (rate limit/error), retrying in ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

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

  // ── 2. Run MIR agents (Batched to prevent 429s) ──────────────────────────
  console.log('[orchestrator] Generating MIR drafts...');
  const companyProfileResult = await executeWithRetry(() => mirFiller.generateCompanyProfile(seed), 'Company Profile');
  const missionValuesResult  = await executeWithRetry(() => mirFiller.generateMissionVisionValues(seed), 'Mission/Values');
  const audienceResult       = await executeWithRetry(() => mirFiller.generateAudienceProfile(seed), 'Audience Profile');
  const competitiveResult    = await executeWithRetry(() => mirFiller.generateCompetitiveLandscape(seed), 'Competitive Landscape');

  // ── 3. Run MSP agents ─────────────────────────────────────────────────────
  console.log('[orchestrator] Generating MSP drafts...');
  const brandVoiceResult      = await executeWithRetry(() => mspFiller.generateBrandVoice(seed), 'Brand Voice');
  const channelStrategyResult = await executeWithRetry(() => mspFiller.generateChannelStrategy(seed), 'Channel Strategy');

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
