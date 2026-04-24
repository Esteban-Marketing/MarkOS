---
date: 2026-04-22
status: active
quarter: 2026-Q2
description: "Synthesis of incoming MarkOS v2 architecture docs into vault-ready requirements, conflicts, and refactor planning criteria."
tags:
  - work
  - active
  - strategy
  - requirements
  - incoming-v2
  - refactor
aliases:
  - MarkOS v2 Blueprint Intake
---

# MarkOS v2 Blueprint Intake

## Purpose

This note turns the incoming architecture pack in `obsidian/work/incoming/` into a single planning base for future GSD phases and app refactors.

The incoming pack should be treated as a product strategy and system architecture blueprint. It does not directly overwrite the current v4.0.0 SaaS Readiness roadmap. It creates new requirements, clarifies the north star, and exposes conflicts that must be resolved before implementation planning.

## Source Pack

Read these before planning work derived from this intake:

| File | Defines | Planning role |
|---|---|---|
| `obsidian/work/incoming/00-DOCUMENT-INDEX.md` | Bundle map and reading order | Entry point |
| `obsidian/work/incoming/01-PRODUCT-VISION.md` | Product thesis, moat, product surface, north star metric | Product doctrine |
| `obsidian/work/incoming/02-AGENT-NETWORK-FULL.md` | 80+ agent vision, token scheme, interaction patterns | Long-range agent taxonomy |
| `obsidian/work/incoming/03-SOCIAL-DEEP-INTEGRATION.md` | Social OS, inbox, DM/comment/listening/publishing/revenue loop | Social requirements |
| `obsidian/work/incoming/04-INTELLIGENCE-LAYER.md` | Connector map, audits, diagnostic layer, data governance | Connector and audit requirements |
| `obsidian/work/incoming/05-CONTENT-ENGINE.md` | Strategy to brief to create to publish to measure content pipeline | Content loop requirements |
| `obsidian/work/incoming/06-RESEARCH-ENGINE.md` | Research tiers, SQS, citations, hallucination defense, context packages | Research substrate requirements |
| `obsidian/work/incoming/07-PIPELINE-MODULES.md` | Calendar, demo engine, B2B/B2C lead gen, brand engine, research products | Pipeline module requirements |
| `obsidian/work/incoming/08-SELF-EVOLVING-ARCHITECTURE.md` | Artifact performance log, literacy freshness, overlays, cross-tenant learning | Learning architecture |
| `obsidian/work/incoming/09-ORCHESTRATION-CONTRACT.md` | Agent run model, queues, approvals, costs, retry, schedules, isolation | Execution contract |
| `obsidian/work/incoming/10-HUMAN-INTERFACE-LAYER.md` | Morning brief, task board, approval inbox, notifications, portal, chat | Operator UI contract |
| `obsidian/work/incoming/11-ONBOARDING-ARCHITECTURE.md` | First 30 minutes, brand wizard, connectors, wow moment, offboarding | Activation requirements |
| `obsidian/work/incoming/12-AGENT-PHASE-PLAN.md` | Phase 1/2/3 build order and shipped-agent criteria | Delivery sequencing |
| `obsidian/work/incoming/13-PRICING-AND-COST-MODEL.md` | Pricing tiers, metered AI, BYOK, unit economics | Billing and packaging |
| `obsidian/work/incoming/14-GO-TO-MARKET.md` | Tenant 0, ICP, design partners, positioning, acquisition, launch | GTM requirements |
| `obsidian/work/incoming/15-PRICING-ENGINE.md` | Pricing intelligence, cost models, competitor monitoring, recommendations, tests, PRC agents, API/MCP/UI | Pricing Engine requirements |
| `obsidian/work/incoming/16-SAAS-SUITE.md` | SaaS tenant suite: subscriptions, billing, compliance, churn, support, product usage, revenue intelligence, SAS agents, API/MCP/UI | SaaS Suite requirements |
| `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` | Complete SaaS Marketing OS strategy: B2B/B2C/PLG modes, PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, revenue alignment, 28 target growth agents | Post-suite SaaS growth requirements |

## Strategic Findings

### Product Identity

MarkOS v2 is positioned as an AI-native marketing operating system, not a content generator, scheduler, reporting dashboard, or CRM with AI features.

The four core properties are:

- Orchestrated: marketing functions are synchronized, not isolated.
- Connected: data is pulled to drive agent decisions, not to beautify dashboards.
- Agentic: scheduled and event-driven agents work continuously between human decisions.
- Learning: every output and outcome becomes feedback for tenant-specific and central literacy.

### North Star

The incoming north star metric is:

> Marketing-attributed pipeline created per dollar of MarkOS platform spend.

This should become the product-level optimization target for refactor planning. Secondary metrics like content volume, impressions, and approvals only matter when they improve pipeline per platform dollar.

### Launch Wedge

The incoming phase plan explicitly rejects building the full 80-agent vision first. The launch wedge is a complete loop:

1. Connect GA4 and GSC.
2. Run analytics and SEO audits.
3. Produce content strategy.
4. Generate three content briefs.
5. Draft and approve content.
6. Publish one artifact.
7. Monitor social engagement.
8. Detect anomalies.
9. Deliver weekly performance narrative.

This loop is more important than breadth. Future app work should prefer one complete loop over many disconnected features.

## Hard Requirements

### Execution and Orchestration

- Every agent invocation is an `AgentRun` with tenant, token, trigger source, priority, status, input, output artifact, approval gate, cost estimate, actual cost, tokens, model, retry count, and error state.
- Agent chains are DAGs; dependency-satisfied nodes can run concurrently within tenant concurrency limits.
- Priority tiers are P0 through P4. P0 crisis/security events bypass normal queues but are capped to avoid tenant starvation.
- All external-world mutations require approval gates: content publish, social post, social response, email send, ad campaign change, CRM mutation, data export, strategy activation, and literacy promotion.
- Default posture is manual approval. Auto-approval only unlocks after trust is established, with voice score and compliance gates.
- Every run has cost accounting and budget enforcement before execution. P0 runs are exempt from budget blocks.
- Retry behavior is failure-type specific and must escalate through task creation, admin notification, chain pause/cancel, or fallback.
- Permanently failed runs enter a dead letter queue visible to operators.
- Every tenant run is isolated across data, credentials, queue namespace, and LLM context.

### Human Interface

- The UI's primary job is to make human decisions fast and confident.
- The first screen should become a Morning Brief, not a metric dashboard.
- Every agent output, escalation, and human action becomes a task.
- Approval inbox is the most-used product view and should show rendered artifact preview, source agent, campaign, voice score dimensions, compliance status, approve/edit/reject controls, and rejection reason capture.
- Notification levels are L0 emergency, L1 urgent, L2 normal, L3 info, with delivery rules by level.
- Client portal is a curated white-label view, not a full MarkOS account.
- Mobile is reactive only: approvals, notifications, social inbox, morning brief, client messages, quick tasks. No campaign creation or full analytics dashboards on mobile.

### Brand, Content, and Claims

- Brand pack is mandatory for quality content: identity, personality, positioning, voice, visual, and claim library.
- Voice classifier scores every output before operator review.
- Claims require evidence rows and decay dates.
- Content pipeline is: strategy, brief, create, publish, measure.
- Content briefs must include target, audience, SEO intelligence, GEO intelligence, content architecture, proof requirements, brand constraints, internal links, and performance targets.
- Long-form creation must pass structure adherence, evidence requirements, reading level, voice calibration, fact-checking, SEO/GEO optimization, and human review.
- Every published content artifact is tracked with UTM links, performance metrics, social/email/web outcomes, and downstream learning metadata.

### Research and Evidence

- Research is a substrate, not a one-off feature.
- Five research tiers exist: connector data, enrichment, shallow web research, deep research, and primary research synthesis.
- Tier 3 research follows query, search, select, fetch, extract, cite.
- Tier 4 research starts with a research plan, runs parallel query clusters, reads full documents, synthesizes by question, resolves contradictions, fills gaps, and outputs confidence annotations.
- Source Quality Score is 0-100 across domain authority, recency, author credibility, methodology, and primary-vs-secondary status.
- Blocked sources are never fetched. Sources below SQS 40 are only used when depth budget cannot be met and must be flagged.
- Every factual claim needs evidence text. Unsupported claims block output.
- Statistics require primary source tracing inside the claim TTL, or explicit secondary-source chain disclosure.
- Research reports produce evidence maps, source registries, known gaps, recommended follow-up, and agent-specific context packages.
- Agents must check the research context store before triggering new external research.

### Social Operating System

- Social is a bidirectional communication layer, not a posting queue.
- Integrations target maximum official API depth for Meta/Instagram, X, LinkedIn, TikTok, YouTube, Pinterest, and Threads.
- Every inbound signal normalizes into a social signal schema: source, author, content, context, processing, response state, escalation state, and automation state.
- Comments route by sentiment, intent, topic, CRM match, author influence, spam risk, and purchase/support signal.
- DM automation is only allowed for explicitly configured scenarios, brand voice compliance, rate limits, CRM logging, and human escape hatch.
- High-intent DMs flow into CRM, lead scoring, meeting intelligence, personalized response, and follow-up sequence.
- Crisis triggers pause automated responses and activate human war-room handling.
- Social activity must connect to revenue through UTM, CRM, attribution, pipeline stage movement, and budget allocation feedback.
- No unauthorized scraping. Social data is personal data when tied to identified people.

### Intelligence and Connectors

- Connectors exist to inform agents, not create passive dashboards.
- Initial high-value connector families include GA4, PostHog, GSC, GMB, SEMrush/Ahrefs/Moz, Google Ads, Meta Marketing API, LinkedIn Campaign Manager, BuiltWith/Wappalyzer, Apollo/Clearbit/Hunter, Bombora/6sense, News/PR, Crunchbase/Pitchbook, SimilarWeb, Lighthouse/PageSpeed, CMS, ESP, and social APIs.
- A unified connector registry should store type, tenant, auth type, encrypted credentials, scopes, status, last sync, sync frequency, and retention.
- Connector failure pauses dependent agents gracefully, notifies the operator, generates recovery instructions, and backfills after reconnection.
- Raw connector data is tenant-only; cross-tenant usage is anonymized.

### Self-Evolving Literacy

- Every generated artifact should write a performance envelope before outcome signals arrive.
- `markos_artifact_performance_log` is the core feedback loop table proposed by the incoming docs.
- Cross-tenant signals aggregate by channel, format, industry, pain tag, funnel stage, trigger combo, and performance percentiles with no tenant_id or PII.
- Literacy updates from web crawl, performance data, and tenant overlay promotion must stage into an admin review queue before central promotion.
- Tenant overlays live in `.markos-local/` and override central literacy when they reach medium confidence.
- Overlay promotion to central literacy requires high confidence and cross-tenant consistency.
- Human approval is mandatory for central literacy promotion until trust is established.

### Onboarding and Activation

- Onboarding must complete in under 30 minutes.
- No credit card at signup; 14-day full-access trial with AI budget cap.
- Stage 1 asks for current intent to pick agents, connector priority, and email sequence.
- Brand Pack Wizard is the critical setup step and should take 8-12 minutes.
- Connector stage shows a maximum of 3 recommended connectors with value-unlock copy.
- Wow moment must use actual tenant data and arrive within 30 minutes from signup.
- Activation equals wow moment plus at least one approved artifact.
- Supporting targets: first connector under 10 minutes, first artifact approved under 48 hours, brand pack completion over 85%, day-7 retention via 3 opens, day-14 retention via one published artifact.
- Offboarding pauses runs immediately, revokes connector tokens within 24 hours, provides export for 30 days, deletes tenant data by default after 90 days, and honors GDPR erasure within 30 days.

### Pricing and Cost

- Pricing is two-axis: platform tier plus metered AI usage.
- Buyer must never be surprised: cost calculator, budget controls, and usage dashboard are first-class.
- Incoming fixed tier examples from `13-PRICING-AND-COST-MODEL.md` are superseded by `15-PRICING-ENGINE.md` for active doctrine.
- Active pricing placeholder: `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- BYOK is a trust feature, not just a margin lever. It should be visible when it saves the tenant money.
- Trial: 14 days, full Professional feature set, $50 AI credit, no permanent free tier.

### Pricing Engine

- Pricing is a continuous intelligence and recommendation system, not a static pricing table.
- The engine has four data layers: own pricing/cost data, competitor pricing intelligence, market pricing signals, and strategic pricing intelligence.
- Every pricing insight becomes a versioned Pricing Knowledge Object with source quality, extraction method, confidence, changed fields, and price-history lineage.
- Tenant cost model is mandatory before strategic pricing recommendations.
- Cost models differ by business type: SaaS, eCommerce, and Services.
- The engine computes pricing floors; pricing below floor must be explicit strategy.
- Competitor pricing pages are monitored with tiered crawl cadence and major-change alerts.
- PricingRecommendation objects include options, projected impact, risk, confidence, evidence, assumptions, and price-test design.
- Price test activation, public price changes, packaging changes, and pricing-page changes require approval gates.
- PRC agent tier is required: PRC-01 SaaS, PRC-02 eCommerce, PRC-03 Services, PRC-04 recommendation synthesis, PRC-05 pricing page optimization, PRC-06 competitive price watcher.
- Pricing MCP tools must be available to any agent writing pricing-sensitive content or strategy.

### SaaS Suite

- SaaS Suite is a conditional tenant-type suite for tenants where `business_type = saas`.
- It adds activation, plan/subscription lifecycle, billing, payment processor routing, accounting sync, legal billing, churn intelligence, support intelligence, product usage health, revenue intelligence, SAS agents, API/MCP/UI surfaces.
- Launch compliance explicitly includes United States and Colombia, with Stripe/QuickBooks for US and Mercado Pago plus DIAN/Siigo/Alegra posture for Colombia.
- SaaS plan/package/pricing/discount/save-offer decisions are Pricing Engine-owned.
- Customer-facing support replies, legal invoice corrections, refunds, discounts, save offers, and subscription lifecycle mutations require approval by default.

### SaaS Marketing OS Strategy

- SaaS growth must be mode-routed: `b2b`, `b2c`, `b2b2c`, `plg_b2b`, and `plg_b2c` activate different modules, agents, metrics, and playbooks.
- PLG requires activation definitions, milestone funnels, PQL scoring, upgrade triggers, and coordinated in-app/email/CS campaigns.
- B2B SaaS requires ABM, account expansion, customer marketing, advocacy, PR/analyst relations, partnerships, and revenue-team alignment.
- B2C and PLG SaaS require viral loops, referral programs, in-app marketing, behavioral segmentation, community, and experimentation.
- Community, event, PR, partnership, developer-marketing, and revenue-alignment modules are now part of the long-range SaaS Marketing OS destination.
- The 28 target growth agents are planning doctrine, not immediate runnable implementation.
- Growth modules must produce tasks, approvals, experiments, or learnings. Passive dashboards do not satisfy the spec.
- Pricing-sensitive growth prompts, incentives, discounts, referral rewards, affiliate commissions, save offers, and pricing-page/G2 pricing fields are Pricing Engine-owned.
- Customer-facing SaaS growth mutations require approval by default.

### GTM and Tenant 0

- MarkOS markets itself through MarkOS. Tenant 0 is the production marketing workspace for MarkOS.
- Tenant 0 must have its own brand pack, voice classifier, SEO strategy, social publishing, cold outreach, performance feedback, and case studies.
- Primary incoming ICP is in-house marketing leaders at growth-stage B2B companies. Secondary incoming ICP is agencies managing B2B clients.
- Incoming GTM explicitly excludes solopreneurs, very early pre-revenue companies, and B2C consumer brands from the initial sales motion.
- First 10 design partners should have existing paid media accounts and publication history so day-1 audits have data.
- Positioning sentence: MarkOS is the AI-native marketing operating system that replaces your agency, unifies your stack, and runs your marketing continuously.

## Acceptance Criteria Extracted

These criteria should feed future GSD plans:

- A shipped agent must run reliably for 7 consecutive days on test tenants.
- A shipped agent must average voice classifier score >= 82%.
- A shipped agent type must have an approval gate, run-level cost tracking, failure handling, task board visibility, and written feedback from at least 3 design partners.
- A Phase 1 loop is not done until a tenant can connect GA4 + GSC, receive an SEO audit, generate content strategy and briefs, approve and publish content, monitor social engagement, receive anomaly detection, and review a weekly narrative.
- No customer-facing research claim advances without citation evidence or explicit inference labeling.
- No external-world mutation advances without approval or explicitly configured low-risk auto-approval.
- No pricing or metered AI workflow ships without budget estimate, budget cap handling, and usage visibility.
- No public MarkOS pricing strategy ships while active docs still use fixed tier assumptions instead of Pricing Engine recommendations.
- No pricing recommendation ships without cost model, competitive context, evidence, assumptions, projected impact, risk, and approval posture.
- No pricing-sensitive content ships without Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- No cross-tenant learning ships without anonymization, sample-size confidence, and admin review.
- No onboarding refactor ships unless it preserves under-30-minute onboarding and under-30-minute wow moment targets.
- No SaaS growth mutation ships without approval gates for in-app campaigns, external outreach, referral/affiliate rewards, PR/review asks, event sequences, experiments, discounts, expansion asks, and pricing-sensitive prompts.

## Conflict Register

Resolution update 2026-04-22: the vault harmonization pass locked the product/GTM stance in [[Key Decisions]] and [[Marketing Operating System Foundation]]. Remaining conflict work is implementation planning, not doctrine drift.

These must be resolved before code implementation:

| Conflict | Current vault/codebase posture | Incoming v2 posture | Recommended handling |
|---|---|---|---|
| ICP | [[Target ICP]] now treats growth-stage B2B marketing leaders as primary and agencies as secondary | `14-GO-TO-MARKET.md` prioritizes growth-stage B2B marketing leaders and agencies; excludes solopreneurs and B2C launch | Resolved in vault doctrine; code/GTM work should follow v2 |
| Pricing | [[Pricing Engine Canon]] now owns active pricing; hard-coded tier prices are replaced by `{{MARKOS_PRICING_ENGINE_PENDING}}` | `15-PRICING-ENGINE.md` supersedes fixed tier assumptions from `13-PRICING-AND-COST-MODEL.md` | Resolved as engine-owned doctrine; public MarkOS pricing must come from approved PricingRecommendation |
| Contract IDs | `contracts/F-90` through `F-100` are already occupied by MCP and webhook contracts | `08-SELF-EVOLVING-ARCHITECTURE.md` proposes F-90 through F-96 for learning contracts | Renumber all incoming learning contracts before planning |
| Agent tokens | Current registry uses `CNT` in places and has 39 codebase agents | Incoming uses `CONT`, adds SOC/PAID/LG/LIT tiers and 80+ vision | Create token migration map before editing `.agent/markos/MARKOS-INDEX.md` |
| Phase insertion | `.planning/ROADMAP.md` now routes v4.0.0 through phases 200-213 | Incoming suggests Phase 200.5 instrumentation and Phase 210+ learning | Resolved: non-decimal route selected; Phase 204 remains CLI, Phase 205 Pricing Engine, Phase 206 SOC2, and Phases 207-213 carry v2 operating-loop gaps |
| SaaS Suite placement | v4.0.0 already routes foundation work through 204-213 | `16-SAAS-SUITE.md` adds a large tenant-type suite that depends on pricing, billing, AgentRun, approvals, evidence, connectors, and SOC2 | Route as v4.1.0 candidate Phases 214-217, not as a disruption to active foundation phases |
| SaaS Marketing OS strategy placement | Current plan already reserves 214-217 for SaaS Suite | `17-SAAS-MARKETING-OS-STRATEGY.md` adds a post-suite growth system and 28 target agents | Treat as destination map and future post-217 GSD translation, not a current build-order disruption |
| Research path names | Existing vault path is `obsidian/brain/Pain-Point Engine.md` | `06-RESEARCH-ENGINE.md` mentions `brain/Pain-Point-Engine.md` | Normalize references in any derived specs |
| Incoming index status | `00-DOCUMENT-INDEX.md` now lists 00-16 and treats `06-RESEARCH-ENGINE.md` as complete | The source files exist and are substantive | Keep the index as the source-pack entry point after future intakes |

## Refactor Planning Implications

### What to build first

The codebase already has SaaS-readiness foundations: tenant auth, audit logs, MCP, webhooks, CLI work, billing/BYOK direction, OpenAPI contracts, and vault-first onboarding. The next strategic refactor should not discard these. It should add the missing operating-system loop on top.

Recommended planning order after the codebase compliance audit:

1. Phase 204: CLI GA plus v2 guardrails.
2. Phase 205: Pricing Engine Foundation + Billing Readiness.
3. Phase 206: SOC2 Type I controls for the v2 risk profile.
4. Phase 207: AgentRun v2 orchestration substrate.
5. Phase 208: Human Operating Interface.
6. Phase 209: Evidence, Research, and Claim Safety.
7. Phase 210: Connector Wow Loop and Recovery.
8. Phase 211: Content, Social, and Revenue Loop.
9. Phase 212: Learning and Literacy Evolution.
10. Phase 213: Tenant 0 Dogfood and Compliance Validation.

### What not to build yet

- Do not build all 80 agents before a complete Phase 1 loop works.
- Do not build the 28 SaaS growth agents before AgentRun v2, approvals, Pricing Engine, and SaaS Suite substrate exist.
- Do not add passive dashboards unless they directly support a decision.
- Do not enable direct external-world mutations without approval gates.
- Do not update central literacy directly from agents without human review.
- Do not reuse occupied F-contract IDs.
- Do not modify `.markos-local/` as part of protocol or product updates.

## Canonical Vault References

### Current canon to preserve

- [[Marketing Operating System Foundation]] - canonical v2 product doctrine and launch order.
- [[MarkOS v2 Operating Loop Spec]] - functional loop contract and verification gates.
- [[Pricing Engine Canon]] - pricing intelligence doctrine and placeholder policy.
- [[MarkOS Canon]] - ten-commandment operating doctrine.
- [[Agent Registry]] - current operator-facing agent registry.
- [[Message Crafting Pipeline]] - audience, pain, promise, brand, draft, audit, approval, dispatch, measure.
- [[Pain-Point Engine]] - 8-parent taxonomy and routing.
- [[Brand System Canon]] - brand pack, voice, style, claim library.
- [[Target ICP]] - current locked ICP that now requires reconciliation with v2.
- [[Brand Stance]] - developer-native, AI-first, quietly confident voice.
- [[Marketing Literacy]] - 2026 literacy root.

### Codebase orientation

- [[MarkOS Codebase Atlas]] - codebase map.
- [[MarkOS Protocol]] - protocol and GSD bridge.
- [[Contracts Registry]] - current F-contract ownership.
- [[Database Schema]] - Supabase table history.
- [[HTTP Layer]] - current API route posture.
- [[Core Lib]] - LLM, billing, governance, RBAC, outbound, telemetry.
- `.planning/ROADMAP.md` - active v4.0.0 roadmap.
- `.planning/STATE.md` - canonical GSD mission state.

### Literacy nodes most affected

- [[Agentic Marketing Stack]]
- [[LLM Observability for Marketing]]
- [[RAG-Grounded Personalization]]
- [[Documentation-as-Marketing]]
- [[Generative Engine Optimization]]
- [[Zero-Click Search]]
- [[Unified Measurement]]
- [[MMM Revival]]
- [[Incrementality Testing]]
- [[AI Creative Pipelines 2026]]
- [[Privacy, Consent & Compliance]]
- [[Marketing Planning]]
- [[Usage-Based Pricing]]
- [[Tier Design Patterns]]
- [[Value-Based Pricing]]

## Remaining Decisions for Next GSD Discussion

1. Should the next planning artifact be a new GSD phase for "v2 strategic realignment" before Phase 204 continues, or should it be deferred until after v4.0.0 SaaS Readiness closes?
2. What fresh F-contract IDs should replace the incoming F-90 through F-96 learning contracts?
3. What is the canonical token namespace migration plan for content agents: `CNT` as current shorthand, or `CONT` as incoming docs use?
4. Which v2 connectors require direct API depth beyond Nango embedded?
5. Which Phase 1 agent responsibilities should be implemented first in code after the AgentRun/task/approval substrate exists?
6. Pricing Engine foundation is now placed in live GSD Phase 205: `.planning/phases/205-pricing-engine-foundation-billing-readiness/`.
7. What fresh contract range should be reserved for pricing intelligence, cost models, recommendations, tests, watch lists, and alerts?
8. What fresh contract range should be reserved for SaaS Suite APIs, processor webhooks, SAS agents, and revenue intelligence?
9. Which SaaS Suite connector path should ship first for support, product usage, accounting, and Colombia DIAN compliance?
10. Should the SaaS Marketing OS strategy become a post-217 milestone, a research overlay, or a set of module-specific phases?
11. Where should SaaS growth mode live: tenant profile, SaaS Suite activation, or a separate SaaS Growth Profile object?

## GSD-Ready Summary

Phase boundary for a future refactor should be:

> Turn MarkOS from a SaaS-ready protocol/app foundation into the first complete AI-native marketing operating loop: brand pack, connector wow moment, agent run substrate, task board, approval inbox, content brief/draft/publish/measure path, and learning instrumentation.

The scope anchor is not "build 80 agents." It is "ship one loop that proves the operating-system thesis."

## Feeds Into

- [[North Star]]
- [[Key Decisions]]
- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Operating Loop Spec]]
- [[MarkOS v2 GSD Master Work Plan]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 Pricing Engine Intake]]
- [[SaaS Suite Canon]]
- [[MarkOS v2 SaaS Suite Intake]]
- [[SaaS Marketing OS Strategy Canon]]
- [[MarkOS v2 SaaS Marketing OS Strategy Intake]]
- [[2026-04-16-markos-saas-roadmap]]
- Future GSD phase discussion and planning for v2 refactor work.
