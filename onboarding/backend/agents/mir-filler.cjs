#!/usr/bin/env node
// mir-filler.cjs — Generates MIR draft content from onboarding seed
// Uses tight, parametrized prompts. Returns structured draft object.
// mgsd-onboarding v2.0

'use strict';

const llm = require('./llm-adapter.cjs');

// ─── SYSTEM PROMPT (shared across all MIR sections) ───────────────────────────
const SYSTEM_PROMPT = `You are an expert B2B and B2C marketing strategist. Your job is to fill in structured marketing intelligence documents (MIR — Marketing Intelligence Repository) based on raw client onboarding data.

RULES:
1. Never fabricate specific data (revenue numbers, market share %) unless explicitly given. Use qualitative language instead.
2. Write in third-person about the company (e.g., "The company...", not "We...").
3. Output clean, professional prose or structured markdown. No fluff, no buzzwords.
4. Keep each section concise. Dense, accurate, actionable.
5. If data is missing, write "[REQUIRES HUMAN INPUT — describe what is needed]" as a placeholder.
6. Never output JSON — output the actual markdown content only.`;

// ─── INDIVIDUAL SECTION GENERATORS ────────────────────────────────────────────

async function generateCompanyProfile(seed) {
  const { company, product, audience, market } = seed;

  const prompt = `Fill the Company Profile (PROFILE.md) for this client:

COMPANY DATA:
- Name: ${company.name}
- Industry: ${company.industry}
- Founded: ${company.founded}
- Geographic Market: ${company.country}
- Mission: ${company.mission}
- Brand Values: ${company.brand_values?.join(', ')}
- Tone of Voice: ${company.tone_of_voice}

PRODUCT:
- Name: ${product.name}
- Category: ${product.category}
- Primary Benefit: ${product.primary_benefit}
- Top Features: ${product.top_features?.join(', ')}
- Pricing: ${product.price_range || 'Not specified'}

AUDIENCE SUMMARY:
- Primary Segment: ${audience.segment_name}
- Job Title: ${audience.job_title}
- Key Pain Points: ${audience.pain_points?.join('; ')}

MARKET:
- Maturity: ${market.maturity}
- Biggest Trend: ${market.biggest_trend}

Write the following sections as markdown:

## 1. Basic Identity (key facts — use yaml code block)
## 2. What The Business Does (one sentence + one paragraph)
## 3. The Problem They Solve
## 4. Target Customer Summary
## 5. What This Business Is NOT (3-4 explicit exclusions)

Be specific. Use real data from above. Do not repeat the input verbatim.`;

  return llm.call(SYSTEM_PROMPT, prompt, { max_tokens: 1400 });
}

async function generateMissionVisionValues(seed) {
  const { company } = seed;

  const prompt = `Generate the Mission, Vision, and Values section for:

Company: ${company.name}
Industry: ${company.industry}
Mission (raw): ${company.mission}
Brand Values (raw): ${company.brand_values?.join(', ')}
Tone: ${company.tone_of_voice}

Write:
## Mission Statement
[A crisp, 1-sentence mission]

## Vision Statement
[A forward-looking 1-sentence vision, 3-5 year horizon]

## Core Values
For each of the 3 values provided, write:
- **[Value Name]** — [2-3 sentence explanation of what this means in practice for this company]

## Cultural Norms (3 bullet points)
Inferred behaviors based on the values above.`;

  return llm.call(SYSTEM_PROMPT, prompt, { max_tokens: 800 });
}

async function generateAudienceProfile(seed) {
  const { audience, product, company } = seed;

  const prompt = `Create a detailed Audience Profile document for:

Company: ${company.name} (${company.industry})
Product: ${product.name} — ${product.primary_benefit}

PRIMARY SEGMENT:
- Segment Name: ${audience.segment_name}
- Typical Job Title: ${audience.job_title}
- Age Range: ${audience.age_range || 'Not specified'}
- Pain Points: ${audience.pain_points?.join('; ')}
- Where They Spend Time Online: ${audience.online_hangouts}
- Vocabulary / Lingo They Use: ${audience.vocabulary || 'Not specified'}
- Main Objection to Buying: ${product.main_objection}

Write:
## Primary Persona: [Give them a name]
### Demographics
### Psychographic Profile
### Pain Points (ranked by intensity)
### Decision-Making Triggers
### Preferred Content Formats & Channels
### Vocabulary to Use in Messaging
### Vocabulary to AVOID

Keep it practical — every point should directly inform a marketing decision.`;

  return llm.call(SYSTEM_PROMPT, prompt, { max_tokens: 1200 });
}

async function generateCompetitiveLandscape(seed) {
  const { competition, company, product } = seed;

  const competitors = (competition.competitors || []).map((c, i) =>
    `Competitor ${i + 1}: ${c.name}\n  URL: ${c.url || 'N/A'}\n  Our Differentiator vs. Them: ${c.differentiator}\n  Their Messaging Gap: ${c.gap}`
  ).join('\n\n');

  const prompt = `Write the Competitive Landscape section for:

OUR COMPANY: ${company.name} (${company.industry})
OUR PRODUCT: ${product.name} — ${product.primary_benefit}

COMPETITORS:
${competitors || 'No competitors specified yet.'}

Write:
## Competitive Overview
[1-paragraph market context]

## Competitor Analysis Table (use markdown table)
| Competitor | Strengths | Weaknesses | Their Core Message | Our Edge vs. Them |

## Positioning Whitespace
[What positioning territory is unclaimed that we can own?]

## Messaging Landmines
[3-5 claims our competitors make that we should actively avoid parroting — even if true]`;

  return llm.call(SYSTEM_PROMPT, prompt, { max_tokens: 1000 });
}

// ─── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = {
  generateCompanyProfile,
  generateMissionVisionValues,
  generateAudienceProfile,
  generateCompetitiveLandscape,
};
