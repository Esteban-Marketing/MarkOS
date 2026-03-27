---
token_id: MGSD-RES-PRD-01
document_class: RESEARCH
version: "1.0.0"
status: populated
populated_by: mgsd-onboarder
populated_at: 2025-07-18
feeds_into:
  - MIR/Products/
---

# Product Research — MarkOS

<!-- mgsd-token: RESEARCH -->

---

## Feature Inventory

| Feature | Functional Description | Technical Detail | Status |
|---------|----------------------|------------------|--------|
| **One-command install** | `npx marketing-get-shit-done install` scaffolds the complete marketing intelligence architecture | Copies 78 MIR templates + 80 MSP templates, sets up .mgsd-local/ override layer, boots ChromaDB daemon | Live |
| **MIR (Marketing Intelligence Repository)** | Structured markdown repository for all marketing intelligence: brand, audience, competitive, tech stack, analytics | 78 templated files across Core_Strategy, Market_Audiences, Products, Campaigns_Assets, Operations folders | Live |
| **MSP (Marketing Strategy Plan)** | Tactical execution blueprints for all 10 marketing disciplines | 80 templated files across Strategy, Inbound, Outbound, Social, Campaigns, Paid_Media, Lifecycle_Email, Community_Events | Live |
| **Gate system (Gate 1 + Gate 2)** | Progressive validation gates that unlock marketing execution capabilities | Gate 1: 5 identity files required. Gate 2: 4 execution infrastructure files required | Live |
| **Multi-LLM adapter** | Unified interface supporting OpenAI, Anthropic, Gemini, Ollama | Auto-detects available providers, falls back gracefully, 3-attempt retry with exponential backoff | Live |
| **Vector memory (ChromaDB)** | Per-project vector storage for episodic learning and RAG | Collection naming: `mgsd-{project_slug}`. Local daemon auto-healing + cloud override via env var | Live |
| **Override resolution system** | Client-specific overrides in `.mgsd-local/` without modifying base templates | Check `.mgsd-local/` → use if exists → fall back to `.agent/templates/` | Live |
| **Agent ecosystem** | 25+ specialized AI agents for strategy, execution, content, intelligence, and verification | Includes mgsd-strategist, mgsd-planner, mgsd-executor, mgsd-copy-drafter, mgsd-neuro-auditor, and 20+ more | Live |
| **Onboarding server** | Web-based guided onboarding that generates AI MIR/MSP drafts from company data | Node.js server on port 4242. Endpoints: /submit, /approve, /regenerate, /api/extract-sources, /api/extract-and-score | Live |
| **Confidence scoring** | Rates quality of extracted/provided data as Red/Yellow/Green | Triggers gap-fill interview for low-confidence fields | Live |
| **Winners catalog** | Per-discipline library of high-performing past campaigns that anchors future generation | `.mgsd-local/MSP/{discipline}/WINNERS/_CATALOG.md` — agents read before generating new assets | Live |
| **Telemetry hooks** | PostHog event tracking for agent execution, form submissions, and approvals | Controllable via `MGSD_TELEMETRY=false` env var | Live |

Source: Codebase architecture map (TECH-MAP.md), Gate 1 product intake. Confidence: High (features are live in codebase). Note: Feature completeness vs. user-tested stability is unvalidated — pre-alpha.

---

## Benefits Hierarchy

**Functional benefits (what it does):**
- Scaffolds the complete marketing intelligence architecture in seconds via one command
- Provides structured templates for all 10 marketing disciplines (strategy, content, paid, SEO, email, social, community, outbound, inbound, analytics)
- Enables AI agents to execute marketing tasks with consistent brand context
- Separates marketing intelligence (who you are) from execution (what you do) — preventing context contamination across tasks
- Provides gate-based validation to ensure marketing execution doesn't start before intelligence foundation is in place

**Emotional benefits (how it makes users feel):**
- In control — "I have a system, not scattered experiments"
- Confident — "My AI agents know who we are now"
- Legitimate — "This is how real marketing organizations operate, even at 1 person"
- Efficient — "I can run marketing operations without a full-time marketer"

**Identity benefits (who it makes them become):**
- "The builder who has their marketing systems dialed"
- "The founder who runs marketing like an engineering discipline"
- "The indie operator who punches above their weight"
- Peer-to-peer social signal: sharing the `npx` command in a community thread is a credibility marker

Source: JTBD-MATRIX.md (emotional/social jobs, gains), MESSAGING-FRAMEWORK.md. Confidence: Medium (benefits hierarchy is derived from JTBD analysis, not user-validated). Implication: Marketing copy should ladder from functional → emotional → identity benefits in that order, not lead with identity claims.

---

## Pricing Architecture

**Current model:** Freemium → Per-seat → Usage-based (three-tier model from Gate 1)

| Tier | Price | What's Included | Target User |
|------|-------|-----------------|-------------|
| **Free / Freemium** | $0 | Full MIR/MSP template scaffold, core agent templates, local ChromaDB, all 10 discipline templates | Solo builders, pre-revenue founders validating product-market fit |
| **Per-seat (Paid)** | TBD | Team collaboration features, shared MIR/MSP across multiple agents, priority support, advanced discipline plans | Growing startups with 2-10 person teams adding marketing headcount |
| **Usage-based** | TBD | API access to hosted MGSD capabilities, scale-based agent execution, advanced analytics integration | Companies running MarkOS at scale with high agent execution volume |

**Cost structure advantage:** $0 operating costs on the free tier — users supply their own API keys (OpenAI, Anthropic, Gemini). MarkOS provides the architecture, not the compute. Source: LEAN-CANVAS.md (cost structure: $0 direct). Confidence: High.

**Pricing gaps (unresolved at pre-alpha):**
- Exact per-seat price point not set
- Usage-based tier definition and billing logic not built
- Freemium-to-paid conversion mechanic not designed

Implication: Pricing strategy should be validated through pilot conversations — ask each pilot "what would you pay, and what would make the jump from free to paid obvious." Do not set prices before talking to 10 pilots.

Source: Gate 1 product intake (pricing model), LEAN-CANVAS.md. Confidence: High on model type, Low on specific price points.

---

## Primary Use Cases

**Use Case 1 — AI-Powered SaaS Launch (Most common)**
Scenario: Solo founder launching a new SaaS product. Needs brand voice, positioning, content strategy, and a growth plan — but has no marketing budget or team. Runs `npx marketing-get-shit-done install`, completes Gate 1 intake to generate MIR files, then uses the 25+ agent templates to execute every marketing discipline autonomously.
Value delivered: Complete marketing intelligence architecture + structured tactics in < 1 day. Without MarkOS: 2-4 weeks building from scratch, inconsistent AI outputs.

**Use Case 2 — Brand Consistency Across AI Agents**
Scenario: Technical marketing lead at a 15-person startup. Currently using 4 different AI tools (ChatGPT, Claude, Notion AI, Midjourney) and getting inconsistent brand voice across outputs. Deploys MarkOS to create a single MIR override layer that all agents read from — ensuring consistent brand voice, messaging, and positioning regardless of which tool is used.
Value delivered: Single source of truth for all AI agent context. Without MarkOS: Brand consistency requires manual review of every AI-generated output.

**Use Case 3 — Marketing Intelligence Audit**
Scenario: Founder who has been "doing marketing" for 6 months but has no structured documentation of their ICP, competitive position, or messaging framework. Uses MarkOS Gate 1 intake to formalize and document existing intelligence into structured MIR files.
Value delivered: Documented, auditable marketing intelligence that can be shared with contractors, investors, or future hires.

**Use Case 4 — Systematic Content Operations**
Scenario: Bootstrapped founder who ships one product per month (indie hacker portfolio). Needs to execute content, social, and SEO across multiple products without a system. Uses MarkOS MSP templates to create per-product strategy plans that agents execute autonomously.
Value delivered: Multi-product marketing operations without proportional time increase.

**Use Case 5 — Developer Tool Community Launch**
Scenario: Developer tool building on OSS. Needs developer community strategy (GitHub, X, HN, Reddit) aligned with positioning. Uses MarkOS JTBD matrix, messaging framework, and channel strategy templates to build a coherent launch plan.
Value delivered: Structured developer community launch plan anchored to buyer psychology diagnostics.

Source: JTBD-MATRIX.md (functional jobs, copy anchors), Gate 1 product intake. Confidence: Medium (use cases are derived from JTBD analysis + codebase capabilities — not yet validated with real user scenarios).

---

## Objection Library

| Objection | Root Cause | Counter |
|-----------|-----------|---------|
| "I already use ChatGPT for marketing" | Conflating content generation with marketing intelligence | "ChatGPT generates text. MarkOS gives ChatGPT structured context about who you are, what you sell, and who you're talking to — so the text it generates is actually right." |
| "This seems complex to set up" | Fear of another tool requiring configuration time | "One command. `npx marketing-get-shit-done install`. The structure is built for you — you fill in what you know, the agents handle the rest." |
| "I'm not ready for a 'marketing system' yet" | Premature maturity framing — thinks marketing systems are for bigger companies | "You needed the system yesterday. The chaos you're in right now is what this solves. Starting structured is easier than restructuring later." |
| "Is this just another AI wrapper?" | Pattern-matching to low-value AI tools they've seen | "The AI generates drafts. The architecture is what's different — MIR/MSP separation means your context is structured, versioned, and auditable. No other tool has this." |
| "What happens if I hit a wall? Who supports this?" | Fear of DIY tool abandonment | "Founder-supported directly during pilot. GitHub issues for bugs. Pre-alpha means active development — your feedback directly shapes the roadmap." |
| "My stack is different — will this work?" | Tool compatibility concern | "Works alongside any LLM provider (OpenAI, Anthropic, Gemini, local Ollama). Doesn't replace your stack — installs next to it." |

Source: MESSAGING-FRAMEWORK.md (objection responses), JTBD-MATRIX.md (pains, copy anchors). Confidence: Medium (objections are derived from known ICP pain points — not yet validated in actual user conversations). Implication: First pilot conversations should be structured to surface new objections not yet in this library.

---

## Proof Points & Social Proof

**Current state: Pre-alpha, 0 users. No social proof exists yet.**

**Proof point strategy (roadmap):**

| Proof Type | Priority | When | How |
|-----------|---------|------|-----|
| GitHub stars | P1 | Day 1 launch | Signals technical community credibility |
| Install count transparency | P1 | Week 2+ | Publish real install numbers (not vanity) |
| First pilot case study | P2 | Day 60 | Document one pilot's journey with real metrics |
| Founder credibility content | P2 | Ongoing | Publish MarkOS's own marketing operations built with MarkOS (meta-proof) |
| Community mentions | P3 | Month 2+ | Reddit/X/HN organic mentions about the tool |
| Architecture openness | P1 | Now | Open codebase + open MIR/MSP templates = inspectable proof > testimonials |

**Key proof strategy insight:** For this audience (technical builders), architecture transparency IS social proof. The ability to `cat .mgsd-local/MIR/Core_Strategy/02_BRAND/VOICE-TONE.md` and see a real, structured document is more convincing than any testimonial. The tool proves itself by being used — the goal is to engineer the install experience to deliver visible value in under 5 minutes.

Source: Gate 1 intake (0 users), KPI-FRAMEWORK.md (GitHub stars as KPI), MESSAGING-FRAMEWORK.md. Confidence: High on proof strategy approach, N/A on actual proof (pre-alpha). Implication: First 90 days of content should be structured around building the proof corpus — document MarkOS's own marketing operations using MarkOS itself.

---
*Research Quality Gate: All sections include evidence source, confidence level, and strategic implication.*
*Last populated: 2025-07-18 | Populated by: mgsd-onboarder | Source: Gate 1 + Gate 2 MIR intake + codebase*
