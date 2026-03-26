#!/usr/bin/env node
/**
 * orchestrator.cjs — MGSD Draft Generation Orchestrator
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Coordinates all AI draft generators and persists results to ChromaDB.
 *   Called by `onboarding/backend/server.cjs` when handling POST /submit.
 *
 * EXECUTION FLOW:
 *   Step 1 — Store raw seed JSON in ChromaDB for RAG retrieval later.
 *   Step 2 — Run MIR generators sequentially (batched to avoid LLM rate limits):
 *              generateCompanyProfile, generateMissionVisionValues,
 *              generateAudienceProfile, generateCompetitiveLandscape
 *   Step 3 — Run MSP generators:
 *              generateBrandVoice, generateChannelStrategy
 *   Step 3.5 — Run Neuro-Auditor validation if skill file exists.
 *   Step 4 — Collect all draft texts into a {section_key: text} map.
 *   Step 5 — Store each draft in ChromaDB under mgsd-{slug} collection.
 *
 * RETRY STRATEGY (executeWithRetry):
 *   - 3 attempts with exponential backoff (1.5s, 3s, 6s)
 *   - Prevents cascade failures on transient LLM 429 rate limit errors
 *   - Returns { ok: false, text: "[DRAFT UNAVAILABLE...]" } on all retries exhausted
 *
 * EXPORTS:
 *   orchestrate(seed, slug) → Promise<{ drafts, chromaResults, errors }>
 *     drafts          — { company_profile, mission_values, audience, competitive, brand_voice, channel_strategy }
 *     chromaResults   — array of Chroma store operation results
 *     errors          — array of { phase, error } objects for failed steps
 *
 * RELATED FILES:
 *   onboarding/backend/server.cjs               (caller — POST /submit handler)
 *   onboarding/backend/agents/mir-filler.cjs    (MIR section generators)
 *   onboarding/backend/agents/msp-filler.cjs    (MSP section generators)
 *   onboarding/backend/agents/llm-adapter.cjs   (LLM call wrapper)
 *   onboarding/backend/chroma-client.cjs        (ChromaDB operations)
 *   onboarding/backend/write-mir.cjs            (writes approved drafts → MIR files)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

const mirFiller  = require('./mir-filler.cjs');
const mspFiller  = require('./msp-filler.cjs');
const chroma     = require('../chroma-client.cjs');
const telemetry  = require('./telemetry.cjs');

// ── Rate Limits & Retries ───────────────────────────────────────────────────
async function executeWithRetry(fn, name, slug, retries = 3, baseDelay = 1500) {
  telemetry.capture('agent_execution_started', { agent_name: name, project_slug: slug });
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fn();
      if (!res.ok) throw new Error(res.error);
      telemetry.capture('agent_execution_completed', { 
        agent_name: name, 
        project_slug: slug,
        token_usage: res.usage?.totalTokens || 0,
        generation_time_ms: res.generationTimeMs || 0
      });
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
  const companyProfileResult = await executeWithRetry(() => mirFiller.generateCompanyProfile(seed), 'Company Profile', slug);
  const missionValuesResult  = await executeWithRetry(() => mirFiller.generateMissionVisionValues(seed), 'Mission/Values', slug);
  const audienceResult       = await executeWithRetry(() => mirFiller.generateAudienceProfile(seed), 'Audience Profile', slug);
  const competitiveResult    = await executeWithRetry(() => mirFiller.generateCompetitiveLandscape(seed), 'Competitive Landscape', slug);

  // ── 3. Run MSP agents ─────────────────────────────────────────────────────
  console.log('[orchestrator] Generating MSP drafts...');
  const brandVoiceResult      = await executeWithRetry(() => mspFiller.generateBrandVoice(seed), 'Brand Voice', slug);
  const channelStrategyResult = await executeWithRetry(() => mspFiller.generateChannelStrategy(seed), 'Channel Strategy', slug);

  // ── 3.5. Neuro-Auditor Validation ─────────────────────────────────────────
  console.log('[orchestrator] Running Neuro-Auditor verification...');
  const llm = require('./llm-adapter.cjs');
  const fs = require('fs');
  const path = require('path');
  try {
    const auditorPath = path.resolve(__dirname, '../../../.agent/marketing-get-shit-done/agents/mgsd-neuro-auditor.md');
    if (fs.existsSync(auditorPath) && audienceResult.ok && brandVoiceResult.ok) {
      const systemPrompt = fs.readFileSync(auditorPath, 'utf8');
      const userPrompt = `Review the following Audience logic and Brand Voice for psychological archetype alignment:\n\nAUDIENCE:\n${audienceResult.text}\n\nBRAND VOICE:\n${brandVoiceResult.text}\n\nOutput ONLY a concise 2-sentence verification summary (e.g. "Archetype alignment confirmed. The Rebel brand voice accurately attacks the Target Audience's core fear of conformity.") No preamble or pleasantries.`;
      
      const auditResult = await executeWithRetry(() => llm.call(systemPrompt, userPrompt), 'Neuro-Auditor', slug);
      if (auditResult && auditResult.ok) {
        const blockquote = `\n\n> 🧠 **Neuro-Auditor Verification:**\n> ${auditResult.text.replace(/\n/g, '\n> ')}\n`;
        audienceResult.text += blockquote;
        brandVoiceResult.text += blockquote;
      }
    }
  } catch (e) {
    console.warn(`[orchestrator] Neuro-auditor skipped: ${e.message}`);
  }

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
