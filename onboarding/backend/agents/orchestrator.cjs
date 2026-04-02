#!/usr/bin/env node
/**
 * orchestrator.cjs — MARKOS Draft Generation Orchestrator
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Coordinates all AI draft generators and persists results to the vector storage layer.
 *   Called by `onboarding/backend/server.cjs` when handling POST /submit.
 *
 * EXECUTION FLOW:
 *   Step 1 — Store raw seed JSON for retrieval-augmented generation.
 *   Step 2 — Run MIR generators sequentially (batched to avoid LLM rate limits):
 *              generateCompanyProfile, generateMissionVisionValues,
 *              generateAudienceProfile, generateCompetitiveLandscape
 *   Step 3 — Run MSP generators:
 *              generateBrandVoice, generateChannelStrategy
 *   Step 3.5 — Run Neuro-Auditor validation if skill file exists.
 *   Step 4 — Collect all draft texts into a {section_key: text} map.
 *   Step 5 — Store each draft in vector storage under project namespaces.
 *
 * RETRY STRATEGY (executeWithRetry):
 *   - 3 attempts with exponential backoff (1.5s, 3s, 6s)
 *   - Prevents cascade failures on transient LLM 429 rate limit errors
 *   - Returns { ok: false, text: "[DRAFT UNAVAILABLE...]" } on all retries exhausted
 *
 * EXPORTS:
 *   orchestrate(seed, slug) → Promise<{ drafts, vectorStoreResults, errors }>
 *     drafts          — { company_profile, mission_values, audience, competitive, brand_voice, channel_strategy }
 *     vectorStoreResults — array of vector store operation results
 *     errors          — array of { phase, error } objects for failed steps
 *
 * RELATED FILES:
 *   onboarding/backend/server.cjs               (caller — POST /submit handler)
 *   onboarding/backend/agents/mir-filler.cjs    (MIR section generators)
 *   onboarding/backend/agents/msp-filler.cjs    (MSP section generators)
 *   onboarding/backend/agents/llm-adapter.cjs   (LLM call wrapper)
 *   onboarding/backend/vector-store-client.cjs   (Vector store operations)
 *   onboarding/backend/write-mir.cjs            (writes approved drafts → MIR files)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

const mirFiller  = require('./mir-filler.cjs');
const mspFiller  = require('./msp-filler.cjs');
const vectorStore = require('../vector-store-client.cjs');
const telemetry  = require('./telemetry.cjs');
const llm        = require('./llm-adapter.cjs');
const disciplineRouter = require('./discipline-router.cjs');
const fs         = require('fs');
const path       = require('path');
const crypto     = require('crypto');

const PLANNING_CONFIG_PATH = path.resolve(__dirname, '../../../.planning/config.json');
const DEFAULT_MAX_CONTEXT_CHUNKS = 6;
const PARENT_KEYWORDS = {
  high_acquisition_cost: ['cac', 'cpl', 'cpa', 'cpr', 'roas', 'expensive leads', 'ad costs', 'acquisition cost'],
  low_conversions: ['conversion', 'cvr', 'form completion', 'checkout', 'landing page', 'low conversions'],
  poor_retention_churn: ['churn', 'retention', 'unsubscribes', 'repeat purchase', 'retention drop', 'high churn'],
  low_organic_visibility: ['seo', 'rankings', 'organic traffic', 'search visibility', 'low organic'],
  attribution_measurement: ['attribution', 'tracking', 'measurement', 'analytics', 'utm'],
  audience_mismatch: ['wrong audience', 'bad fit', 'irrelevant traffic', 'unqualified'],
  pipeline_velocity: ['stalled leads', 'pipeline', 'follow-up', 'nurture', 'mid funnel', 'velocity'],
  content_engagement: ['engagement', 'shares', 'comments', 'reach', 'awareness'],
};

function getMaxContextChunks() {
  try {
    const config = require(PLANNING_CONFIG_PATH);
    const candidate = config && config.literacy ? config.literacy.max_context_chunks : null;
    if (Number.isInteger(candidate) && candidate > 0) {
      return candidate;
    }
  } catch {
    // Use default when config cannot be loaded.
  }
  return DEFAULT_MAX_CONTEXT_CHUNKS;
}

function normalizePainPoints(seed) {
  if (!seed || !seed.audience || !Array.isArray(seed.audience.pain_points)) {
    return [];
  }
  return seed.audience.pain_points
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

function deriveParentTags(painPoints) {
  const matched = new Set();
  for (const phrase of painPoints) {
    for (const [parentTag, keywords] of Object.entries(PARENT_KEYWORDS)) {
      if (keywords.some((keyword) => phrase.includes(keyword))) {
        matched.add(parentTag);
      }
    }
  }
  return [...matched];
}

function buildDedupKey(entry) {
  const metadata = entry && entry.metadata ? entry.metadata : {};
  if (metadata.doc_id) return `doc:${String(metadata.doc_id)}`;
  if (metadata.chunk_id) return `chunk:${String(metadata.chunk_id)}`;
  return `hash:${crypto.createHash('sha1').update(String(entry && entry.text ? entry.text : ''), 'utf8').digest('hex')}`;
}

function normalizeHit(entry, discipline, matchedParentTags) {
  const metadata = entry && entry.metadata ? entry.metadata : {};
  const entryTags = Array.isArray(metadata.pain_point_tags) ? metadata.pain_point_tags.map((tag) => String(tag)) : [];
  const overlap = entryTags.filter((tag) => matchedParentTags.includes(tag)).length;
  const baseScore = typeof entry.score === 'number' ? entry.score : 0;
  return {
    discipline,
    id: entry && entry.id ? entry.id : null,
    text: entry && typeof entry.text === 'string' ? entry.text : '',
    metadata,
    score: baseScore,
    pain_point_match_count: overlap,
    effective_score: baseScore + Math.min(0.3, overlap * 0.1),
  };
}

function dedupeByPriority(entries) {
  const deduped = new Map();
  for (const entry of entries) {
    const key = buildDedupKey(entry);
    const current = deduped.get(key);
    if (!current || entry.effective_score > current.effective_score) {
      deduped.set(key, entry);
    }
  }
  return [...deduped.values()];
}

// ── Rate Limits & Retries ───────────────────────────────────────────────────
/**
 * @llm_context
 * intent: Execute a single generator with bounded retries so transient provider failures
 * do not fail the entire onboarding orchestration.
 * failure_boundaries:
 * - Authentication and provider configuration errors are treated as fatal and not retried.
 * - Retries are capped; exhausted retries degrade to a draft placeholder rather than throwing.
 * - Fallback responses from llm-adapter are accepted as terminal to avoid wasted retries.
 */
async function executeWithRetry(fn, name, slug, retries = 3, baseDelay = 1500) {
  telemetry.capture('agent_execution_started', { agent_name: name, project_slug: slug });
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fn();
      
      // If the adapter returned a fallback, it already "failed gracefully" 
      // and won't suddenly start working on retry. Fast-fail.
      if (res.isFallback) {
        console.log(`[orchestrator] ${name} using fallback content: ${res.error}`);
        return res; 
      }

      if (!res.ok) throw new Error(res.error);
      
      telemetry.capture('agent_execution_completed', { 
        agent_name: name, 
        project_slug: slug,
        token_usage: res.usage?.totalTokens || 0,
        generation_time_ms: res.generationTimeMs || 0
      });
      return res;
    } catch (e) {
      const isRetryable = !e.message.includes('API_KEY') && 
                         !e.message.includes('not set') && 
                         !e.message.includes('401') && 
                         !e.message.includes('403');
      
      if (i === retries - 1 || !isRetryable) {
        console.error(`[orchestrator] ${name} failed ${!isRetryable ? '(fatal)' : 'after retries'}: ${e.message}`);
        return { ok: false, error: e.message, text: `[DRAFT UNAVAILABLE — ${e.message}]` };
      }
      
      const wait = baseDelay * Math.pow(2, i);
      console.log(`[orchestrator] ${name} failed, retrying in ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

/**
 * Run all draft-generation agents for a given seed.
 * Persists results to vector storage.
 * Returns: { drafts: { ... }, vectorStoreResults: [...], errors: [...] }
 *
 * @param {object} seed   — parsed onboarding-seed.json
 * @param {string} slug   — project slug (e.g. "acme-corp")
 */
/**
 * @llm_context
 * intent: Coordinate the end-to-end onboarding draft pipeline and return usable output even
 * when optional infrastructure (vector storage, neuro-auditor) is partially unavailable.
 * failure_boundaries:
 * - Vector store seed upsert/store failures are non-fatal and recorded in errors.
 * - Individual generator failure becomes section-local placeholder text; other sections continue.
 * - The function always returns a structured result object with drafts and error metadata.
 */
async function orchestrate(seed, slug) {
  console.log(`[orchestrator] Starting draft generation for: ${slug}`);

  const errors = [];
  let literacyContextHits = [];
  const warningCodes = new Set();
  const warnOnce = (code, message) => {
    if (warningCodes.has(code)) return;
    warningCodes.add(code);
    console.warn(message);
  };

  try {
    const disciplines = disciplineRouter.rankDisciplines(seed).slice(0, 3);
    const businessModel = seed && seed.company ? seed.company.business_model : null;
    const painPoints = normalizePainPoints(seed);
    const matchedParentTags = deriveParentTags(painPoints);
    const query = [
      seed && seed.product ? seed.product.name : '',
      seed && seed.audience ? seed.audience.segment_name : '',
      ...painPoints,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' ') || 'summary';
    const maxContextChunks = getMaxContextChunks();

    const perDiscipline = await Promise.all(
      disciplines.map(async (discipline) => {
        const [filteredHits, universalHits] = await Promise.all([
          vectorStore.getLiteracyContext(
            discipline,
            query,
            { business_model: businessModel || null, pain_point_tags: matchedParentTags },
            3
          ),
          vectorStore.getLiteracyContext(
            discipline,
            query,
            { pain_point_tags: matchedParentTags },
            3
          ),
        ]);

        const normalized = [...(filteredHits || []), ...(universalHits || [])]
          .map((entry) => normalizeHit(entry, discipline, matchedParentTags))
          .filter((entry) => entry.text.trim().length > 0);

        return dedupeByPriority(normalized);
      })
    );

    const globalDeduped = dedupeByPriority(perDiscipline.flat())
      .sort((a, b) => b.effective_score - a.effective_score);
    const totalHits = globalDeduped.length;
    const painPointMatchCount = globalDeduped.filter((entry) => entry.pain_point_match_count > 0).length;
    literacyContextHits = globalDeduped.slice(0, maxContextChunks);
    const standardsContext = literacyContextHits.map((entry) => entry.text).join('\n\n');

    telemetry.capture('literacy_retrieval_observed', {
      project_slug: slug,
      disciplines_queried: disciplines,
      total_hits: totalHits,
      pain_point_match_count: painPointMatchCount,
      context_tokens: Math.ceil(Buffer.byteLength(standardsContext || '', 'utf8') / 4),
    });
  } catch (error) {
    warnOnce('literacy-context', `[orchestrator] Literacy context skipped: ${error.message}`);
  }

  // ── 1. Store raw seed in vector memory stores ─────────────────────────────
  let vectorStoreResults = [];
  try {
    vectorStoreResults = await vectorStore.upsertSeed(slug, seed);
    console.log(`[orchestrator] Seed stored in vector memory (${vectorStoreResults.length} sections)`);
  } catch (err) {
    warnOnce('vector-store-upsert', `[orchestrator] Vector memory upsert failed: ${err.message} — continuing without persistence`);
    errors.push({ phase: 'vector-store-upsert', error: err.message });
  }

  // ── 2. Run MIR agents (Batched to prevent 429s) ──────────────────────────
  console.log('[orchestrator] Generating MIR drafts...');
  const companyProfileResult = await executeWithRetry(() => mirFiller.generateCompanyProfile(seed), 'Company Profile', slug);
  const missionValuesResult  = await executeWithRetry(() => mirFiller.generateMissionVisionValues(seed), 'Mission/Values', slug);
  const audienceResult       = await executeWithRetry(() => mirFiller.generateAudienceProfile(seed), 'Audience Profile', slug);
  const competitiveResult    = await executeWithRetry(() => mirFiller.generateCompetitiveLandscape(seed), 'Competitive Landscape', slug);

  // ── 3. Run MSP agents ─────────────────────────────────────────────────────
  console.log('[orchestrator] Generating MSP drafts...');
  const brandVoiceResult      = await executeWithRetry(() => mspFiller.generateBrandVoice(seed, slug), 'Brand Voice', slug);
  const channelStrategyResult = await executeWithRetry(() => mspFiller.generateChannelStrategy(seed, slug), 'Channel Strategy', slug);

  // ── 3.5. Neuro-Auditor Validation ─────────────────────────────────────────
  /**
   * @llm_context
   * intent: Run a lightweight post-generation psychological alignment check when the auditor
   * definition exists and required draft sections succeeded.
   * failure_boundaries:
   * - Missing auditor file or LLM failure must not block draft generation.
   * - Audit output is additive; no core draft content is discarded on audit failure.
   */
  console.log('[orchestrator] Running Neuro-Auditor verification...');
  try {
    const canonicalAuditorPath = path.resolve(__dirname, '../../../.agent/markos/agents/markos-neuro-auditor.md');
    const legacyAuditorPath = path.resolve(__dirname, '../../../.agent/markos/agents/markos-neuro-auditor.md');
    const auditorPath = fs.existsSync(canonicalAuditorPath) ? canonicalAuditorPath : legacyAuditorPath;
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
    warnOnce('neuro-auditor-skip', `[orchestrator] Neuro-auditor skipped: ${e.message}`);
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

  if (literacyContextHits.length > 0) {
    drafts.standards_context = literacyContextHits.map((entry) => entry.text).join('\n\n');
  }

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

  // ── 5. Store drafts in vector memory ──────────────────────────────────────
  for (const [section, content] of Object.entries(drafts)) {
    try {
      const storeResult = await vectorStore.storeDraft(slug, section, content);
      if (storeResult && storeResult.ok === false) {
        warnOnce(`vector-store-${section}`, `[orchestrator] Failed to store ${section}: ${storeResult.error || 'Unknown vector persistence error'}`);
        errors.push({ phase: `vector-store-${section}`, error: storeResult.error || 'Unknown vector persistence error' });
      }
    } catch (storeErr) {
      warnOnce(`vector-store-${section}`, `[orchestrator] Failed to store ${section}: ${storeErr.message}`);
      errors.push({ phase: `vector-store-${section}`, error: storeErr.message });
    }
  }

  console.log(`[orchestrator] Done. Errors: ${errors.length}`);
  return { drafts, vectorStoreResults, errors };
}

module.exports = { orchestrate };
