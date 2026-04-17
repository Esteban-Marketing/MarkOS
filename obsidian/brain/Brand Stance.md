---
date: 2026-04-16
description: "MarkOS brand stance (Q-B) — developer-native, AI-first, quietly confident. Locked 2026-04-16. Drives marketing copy, UI aesthetic, partnerships, content voice."
tags:
  - brain
  - brand
  - stance
  - markos
---

# Brand Stance

> Locked 2026-04-16 under SaaS Roadmap decision Q-B. The MarkOS voice is **developer-native · AI-first · quietly confident**. Not loud. Not hype-driven. Not enterprise-grey. Not startup-jokey. A serious tool presented with restraint and precision.

## Three anchors

### 1. Developer-native

- Docs-first. Code samples front-and-center. Every concept has a CLI, API, and MCP path.
- Terminal-screenshots beat marketing videos.
- Release notes talk about contracts, migrations, and SDK diffs.
- Open primitives (OpenAPI, MCP, webhooks, CLI) over closed walled-gardens.
- Treats operator users as capable, not babysat.

### 2. AI-first (without hype)

- Every feature assumes LLMs are a first-class substrate, not an add-on.
- We say "agent" when we mean agent — not "assistant," not "bot," not "copilot" generically.
- Evidence > adjectives. "Grounded in your first-party data" beats "revolutionary AI."
- Claude, OpenAI, Gemini treated as peer providers — not brand-name props.
- Never calls itself "intelligent," "smart," or "powerful." Let the outcomes do that.

### 3. Quietly confident

- Direct. One sentence per claim. No hedges unless legally required.
- Zero marketing-speak from the [[Communication Guides|anti-cliché list]]: no "delve," no "elevate," no "in today's fast-paced world," no "unlock the power of."
- Tone closer to Stripe · Linear · Supabase · Resend · Vercel than Salesforce · Adobe · HubSpot.
- No exclamation marks in core product copy.
- Landing-page screenshots rather than stock illustration.
- Data-dense over decoration-dense.

## Visual system direction

| Axis | Choice |
|---|---|
| Palette | neutral base (near-black + near-white) · one accent (electric, deliberate) · semantic colors for status |
| Type | neutral sans for UI (Inter · Geist) · monospace for code (JetBrains Mono · Geist Mono) · optional editorial serif for long-form |
| Density | dense, aligned to grid · generous line-height only in marketing long-form |
| Imagery | product screenshots · terminal captures · diagrams · minimal illustration |
| Motion | <200ms transitions · no hero-carousel · no confetti · no particles |
| Dark mode | first-class; both themes equal treatment |
| Logo | wordmark-first · mark for small contexts · no 3D or gradient variants |

Mirrors [[Visual Style Token Template]] with MarkOS-specific defaults.

## Voice rules (enforced by classifier)

| Rule | Value |
|---|---|
| Lexicon prefer | brief · ship · prove · audit · contract · agent · signal · pipeline |
| Lexicon avoid | revolutionize · elevate · unlock · leverage · delve · intersection · journey · transform · seamless · cutting-edge |
| Taboos | hype-style hyperbole · fear-based copy · anti-competitor snark · exploit-the-founder-hustle tropes |
| Sentence length | avg 12–16 words; max 24 (with exceptions for marketing hero lines) |
| Register | professional-conversational — not academic, not bro |
| Reading level | grade 8–10 for marketing; 10–12 for docs |
| Cadence | mixed — staccato for emphasis, flowing for explanation |
| Humor | rare, dry, never clever for its own sake |
| Pronouns | "we" sparingly (brand voice) · "you" aimed at the operator · no "your business" filler |
| Emoji | forbidden in product copy · allowed in social (sparing) |
| Exclamation marks | zero in product; rare in social |

## Copy exemplars

**Landing hero (good)**:
> MarkOS is the Marketing Operating System for agentic teams. Install it, brief it, ship audit-passing campaigns in minutes.

**Landing hero (bad, rejected by classifier)**:
> 🚀 Revolutionize your marketing with AI-powered, cutting-edge automation that elevates your brand to unlock growth like never before!

**Feature blurb (good)**:
> Every draft carries a pain-point tag. Every claim is sourced. Every agent mutation gets human approval. This is the contract.

**Feature blurb (bad)**:
> Our intelligent AI system seamlessly empowers marketers to effortlessly generate amazing content that resonates with their audience.

**Pricing page (good)**:
> $49/mo for solo. $499/mo for teams. BYOK your own API keys for a discount on AI usage.

**Pricing page (bad)**:
> Get started with flexible pricing that scales with your business needs.

## Partnership + co-marketing stance

- Partner with tools the ICP already uses: Anthropic · OpenAI · Vercel · Supabase · Stripe · Resend · Shopify · HubSpot · Linear · PostHog · Segment · Cursor · v0 · Lovable · Bolt.
- Avoid co-marketing with adjacent AI-marketing tools (Jasper, Copy.ai, Typeface, Adobe GenStudio). Positioned as different category ("agentic Marketing OS," not "AI content tool").
- Creator partnerships: vibe-coder / solopreneur / indie-hacker channels on YouTube + X + Bluesky.
- No influencer shills. Real-use case studies only.

## Event stance

- Conferences: dev-facing (Next.js Conf · Vercel Ship · AI Engineer · GitHub Universe · Nango Connect) first; marketing conferences (SaaStr · MarketingProfs · Content Marketing World) later.
- Demos > talks. Live MCP agent building MarkOS campaign on stage.
- No swag-as-strategy.

## Community stance

- GitHub Discussions = source of truth for product feedback.
- Discord for daily conversation.
- Claude Marketplace reviews + Product Hunt + HN for launch moments.
- Transparent public roadmap (`.planning/` is already public-style; consider GitHub project board).
- Monthly "Operator Office Hours" — live session for MarkOS customers.

## Anti-pattern watchlist

| Pattern | Why we reject |
|---|---|
| Hero video with face | not our aesthetic; product screenshot beats face |
| "AI that understands your business" | meaningless; show the MIR, show the pipeline |
| Logo soup on homepage | low signal unless real customer case studies attached |
| Numeric boasts ("10x faster") | only if benchmarked in-hand |
| Founder hagiography | brand > founder at scale |
| Email breadcrumb dark-patterns | we sell consent gates — we live them |

## Enforcement

- Voice classifier rubric: [[Voice Classifier Rubric]].
- Claim library: [[Claim Library Template]] (MarkOS instance lives at `.markos-local/MIR/claim-library.md`).
- All marketing copy passes [[Message Crafting Pipeline]] — no exception for "internal team."

## Evolution

This stance is reviewed quarterly. Shifts require new [[Key Decisions]] entry. Voice drift is a regression and caught by classifier.

## Related

- [[MarkOS Canon]] · [[Target ICP]] · [[Brand System Canon]] · [[Communication Guides]] · [[Voice Classifier Rubric]] · [[Brand Pack Template]]
- [[Key Decisions]]
