#!/usr/bin/env node
/**
 * msp-filler.cjs — MSP (Marketing Strategy Plan) Draft Generators
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Generates AI draft content for each MSP section from onboarding seed data.
 *   These are strategic outputs (how to market) vs MIR (what we know).
 *
 * SECTION-TO-FILE MAP:
 *   generateBrandVoice      → .mgsd-local/MIR/Core_Strategy/02_BRAND/VOICE-TONE.md
 *   generateChannelStrategy → .mgsd-local/MSP/Strategy/00_MASTER-PLAN/CHANNEL-STRATEGY.md
 *   generatePaidAcquisition → .mgsd-local/MSP/Campaigns/01_PAID_ACQUISITION.md
 *
 * EXPORTS:
 *   generateBrandVoice(seed)       → Promise<{ ok, text, provider }>
 *   generateChannelStrategy(seed)  → Promise<{ ok, text, provider }>
 *   generatePaidAcquisition(seed)  → Promise<{ ok, text, provider }>
 *
 * RELATED FILES:
 *   onboarding/backend/agents/llm-adapter.cjs    (LLM API surface)
 *   onboarding/backend/agents/orchestrator.cjs   (calls all generators)
 *   onboarding/backend/agents/mir-filler.cjs     (MIR counterpart)
 *   onboarding/onboarding-seed.schema.json        (input data shape)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const path = require('path');
const llm  = require('./llm-adapter.cjs');
const { resolveExample } = require('./example-resolver.cjs');

// ─── EXAMPLE BASE PATHS ────────────────────────────────────────────────────────
const TMPL_ROOT        = path.resolve(__dirname, '..', '..', '..', '..', '.agent', 'marketing-get-shit-done', 'templates');
const CORE_STRAT_DIR   = path.join(TMPL_ROOT, 'MIR', 'Core_Strategy');
const MSP_STRAT_DIR    = path.join(TMPL_ROOT, 'MSP', 'Strategy');
const MSP_CAMPAIGNS_DIR = path.join(TMPL_ROOT, 'MSP', 'Campaigns');

const SYSTEM_PROMPT = `You are a senior marketing strategist specializing in channel strategy, brand voice, and go-to-market execution. Your outputs go directly into a Marketing Strategy Platform (MSP) that guides AI agents and human marketers. 

RULES:
1. Be specific and opinionated — vague strategy outputs are worse than no output.
2. Ground every recommendation in the client data provided. Never recommend a channel without explicitly tying it to the audience behavior data.
3. Output clean markdown only. No preamble, no meta-commentary.
4. Where data is missing, output "[REQUIRES HUMAN INPUT — reason]" as a placeholder.`;

async function generateBrandVoice(seed) {
  const { company, audience } = seed;

  const exampleBlock = resolveExample('BRAND-VOICE', company.business_model || '', '', CORE_STRAT_DIR);

  const prompt = `Create the Brand Voice & Tone Guide for:

Company: ${company.name} (${company.industry}) — Business Model: ${company.business_model || 'Not specified'}
Declared Tone: ${company.tone_of_voice}
Brand Values: ${company.brand_values?.join(', ')}
Mission: ${company.mission}
Primary Audience: ${audience.segment_name} — ${audience.job_title}
Audience Vocabulary: ${audience.vocabulary || 'Not specified'}

${exampleBlock}
Write:
## Brand Voice in One Sentence
[A single, memorable sentence that captures the brand's voice]

## Voice Dimensions
Create 4 dimensions using this format:
**[Dimension] ✓** — [What this means for us]
**[Dimension] ✗** — [What this does NOT mean]

## Do / Don't Language Guide
| Do Say | Don't Say |
(Minimum 6 rows — use real examples based on the industry and values)

## Tone Calibration by Context
- **Social Media Posts:** [tone guidance]
- **Email Campaigns:** [tone guidance]
- **Sales/Landing Pages:** [tone guidance]
- **Customer Support Responses:** [tone guidance]`;

  return llm.call(SYSTEM_PROMPT, prompt, { max_tokens: 1000 });
}

async function generateChannelStrategy(seed) {
  const { audience, content, company, market } = seed;

  const exampleBlock = resolveExample('CHANNEL-STRATEGY', company.business_model || '', '', MSP_STRAT_DIR);

  const prompt = `Recommend a channel priority strategy for:

Company: ${company.name} (${company.industry}) — Business Model: ${company.business_model || 'Not specified'}
Market Maturity: ${market.maturity}
Biggest Trend: ${market.biggest_trend}

AUDIENCE BEHAVIOR:
- Where They Spend Time Online: ${audience.online_hangouts}
- Job Title: ${audience.job_title}

CURRENT CHANNELS (self-reported):
- Active Channels: ${content.active_channels?.join(', ') || 'None specified'}
- Monthly Output: ${content.monthly_output}
- Best Performing Format: ${content.best_format || 'Not specified'}

${exampleBlock}
Write:
## Channel Priority Stack
Rank channels 1-5 in execution priority. For each:
**[N]. [Channel Name]**
- Why this channel for this audience
- Content format to prioritize
- Posting frequency target
- KPI to track

## Quick Wins (First 30 Days)
3 specific, actionable things to do immediately based on existing assets.

## Channels to Explicitly Avoid (for now)
[List any channels not recommended and explain why — connect to audience data]`;

  return llm.call(SYSTEM_PROMPT, prompt, { max_tokens: 1000 });
}

async function generatePaidAcquisition(seed) {
  const { company, audience, market, product } = seed;

  const exampleBlock = resolveExample('PAID-ACQUISITION', company.business_model || '', '', MSP_CAMPAIGNS_DIR);

  const prompt = `Create the Paid Acquisition Pipeline plan for:

Company: ${company.name} (${company.industry}) — Business Model: ${company.business_model || 'Not specified'}
Primary Audience: ${audience.segment_name} — ${audience.job_title}
Where They Spend Time Online: ${audience.online_hangouts}
Top Pain Points: ${[audience.pain_point_1, audience.pain_point_2, audience.pain_point_3].filter(Boolean).join('; ')}
Product Pricing Model: ${product?.pricing_model || 'Not specified'}
Key Differentiator vs Competitors: ${company.differentiator || 'Not specified'}
Market Maturity: ${market?.maturity || 'Not specified'}

${exampleBlock}
Write a complete Paid Acquisition Pipeline covering:

## Phase Budget & Parameters
- Target CAC Limits, CPA Bounds, LTV Goal, Daily Spend Threshold

## 1. Audience Matrix
- Cold audience targeting criteria (platform-specific)
- Lookalike seeds
- Retargeting layers (Day 0–3, Day 4–7, Day 8–14)

## 2. Pipeline Execution: [Primary Channel]
- Sprint 1 (TOF), Sprint 2 (MOF), Sprint 3 (BOF)
- For each: format, copy angle, CTA, budget %, KPI

## 3. Pipeline Execution: [Secondary Channel]
- Key campaigns with budget and KPI

## 4. Optimization Loop
- Day 7, 14, 21 review gates with specific kill/scale criteria

## Quick Wins (First 14 Days)
3 specific, immediately actionable items

## Channels to Avoid (For Now)
[List with rationale tied to audience data]`;

  return llm.call(SYSTEM_PROMPT, prompt, { max_tokens: 1200 });
}

module.exports = { generateBrandVoice, generateChannelStrategy, generatePaidAcquisition };
