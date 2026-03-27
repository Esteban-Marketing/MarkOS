# AUDIENCES.md — Ideal Customer Profiles, Personas & Segments

<!-- mgsd-token: MIR -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MIR/Market_Audiences/AUDIENCES.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: Before filling this file, read `RESEARCH/AUDIENCE-RESEARCH.md` in full. This file governs targeting for all `mgsd-copy-drafter` and `mgsd-ad-copy` tasks.

## 1. Primary Audience Segments
*Define the core segments with demographic and firmographic baselines.*
* **[Segment Name]**: [Demographic/Firmographic brief.]

## 2. Advanced Psychographics & Neuromarketing Profile
*What drives this audience at a fundamental psychological level?*
* **Core Desires/Fears:** [e.g., Fear of falling behind competitors, Desire for status]
* **Neuromarketing Triggers:** 
  * *Primary Archetype to Target:* [e.g., The Hero, The Sage, The Rebel]
  * *Effective Cognitive Biases:* [e.g., Social Proof, Scarcity, Authority, Loss Aversion]
* **Pain Points & Frustrations:** [Specific, visceral problems they need solved immediately]
* **Objections & Friction:** [Why they say "no" or hesitate to buy]

## 3. Lexicon & Behavioral Patterns
*How do they speak, and where do they go?*
* **Language/Vocabulary:** [Specific jargon, slang, or tonal preferences used natively by the audience]
* **Channel Consumption:** [Where they natively consume information — e.g., LinkedIn, TikTok, Industry Forums]
* **Buying Triggers:** [At what exact moment do they realize they need a solution?]

## 4. Regulation & Compliance Restraints
*Does this audience operate in a highly regulated space (e.g., Finance, Healthcare, Gov)?*
* **Compliance Checks Required:** [None / HIPAA / FINRA / GDPR / FTC guidelines to strictly obey in copy]

## 5. Live Vectorized Sentiment (Chroma DB Integration)
<!-- mgsd-behavioral-scraper will serialize and embed raw social scrapes (Reddit/X) here natively as context payloads -->
* **Vector DB Target:** `chromadb://collections/mgsd-audience-sentiment`
* **Latest Trending Grievances:** (Injected dynamically per query by `mgsd-strategist` reading the DB).
* **High-Volatility Topics:** (Keywords currently accelerating in market chatboards).