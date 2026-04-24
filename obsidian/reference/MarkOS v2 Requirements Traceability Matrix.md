---
date: 2026-04-22
status: canonical
description: "Traceability matrix from the MarkOS v2 blueprint source docs to vault doctrine, implementation domains, GSD workstreams, and acceptance criteria."
tags:
  - reference
  - requirements
  - traceability
  - markos
  - v2
aliases:
  - MarkOS v2 Requirements Traceability Matrix
  - v2 RTM
---

# MarkOS v2 Requirements Traceability Matrix

## Purpose

This matrix keeps v2 planning honest. Each source document from the incoming pack maps to:

- The requirement it introduces.
- The canonical vault note that owns the doctrine.
- The likely implementation domain.
- The GSD workstream that should research or implement it.
- The acceptance gate that proves it is done.

## Source-to-Doctrine Map

| Source | Requirement family | Canonical vault owner | Implementation domains | GSD workstream |
|---|---|---|---|---|
| `01-PRODUCT-VISION.md` | Product thesis, north star, moat, Tenant 0 | [[Marketing Operating System Foundation]] | Roadmap, metrics, onboarding, analytics | Decision Lock, First Loop |
| `02-AGENT-NETWORK-FULL.md` | 80+ agent target network, token domains, interaction patterns | [[Agent Registry]], [[MarkOS v2 Operating Loop Spec]] | `.agent/markos`, AgentRun, contracts | AgentRun v2, Token Migration |
| `03-SOCIAL-DEEP-INTEGRATION.md` | Social inbox, listening, routing, DMs, social-to-revenue loop | [[MarkOS v2 Operating Loop Spec]] | Social APIs, CRM, tasks, approvals | Social and Revenue Expansion |
| `04-INTELLIGENCE-LAYER.md` | Connector registry, audits, data governance, recovery | [[MarkOS v2 Operating Loop Spec]], [[Core Lib]] | Connectors, tasks, schema, UI | Connector Research, First Loop |
| `05-CONTENT-ENGINE.md` | Strategy, brief, create, publish, measure content loop | [[Message Crafting Pipeline]] | Agents, UI, approvals, tracking | First Operating Loop |
| `06-RESEARCH-ENGINE.md` | Research tiers, SQS, citations, hallucination defense | [[MarkOS v2 Operating Loop Spec]], [[Marketing Literacy]] | Evidence model, LLM evals, research context store | Evidence/Research |
| `07-PIPELINE-MODULES.md` | Calendar, demo engine, lead gen, brand engine, research product | [[Marketing Operating System Foundation]] | CRM, calendar, demo surface, pipeline attribution | Social and Revenue Expansion |
| `08-SELF-EVOLVING-ARCHITECTURE.md` | Artifact performance, tenant overlays, central literacy updates | [[Marketing Operating System Foundation]] | Schema, literacy, admin review, analytics | Learning and Literacy |
| `09-ORCHESTRATION-CONTRACT.md` | AgentRun, DAG chains, priority, approvals, cost, retries, DLQ | [[MarkOS v2 Operating Loop Spec]], [[MarkOS Protocol]] | Agent lifecycle, queues, billing, tasks | Architecture Baseline |
| `10-HUMAN-INTERFACE-LAYER.md` | Morning Brief, Task Board, Approval Inbox, notifications, portal | [[UI Components]], [[MarkOS v2 Operating Loop Spec]] | React app, task APIs, approval UI | Human Operating Interface |
| `11-ONBOARDING-ARCHITECTURE.md` | Under-30-minute onboarding, brand wizard, max 3 connectors, wow moment | [[Brand System Canon]], [[Target ICP]] | Onboarding, connectors, brand pack, activation metrics | First Loop, Tenant 0 |
| `12-AGENT-PHASE-PLAN.md` | Phase 1 agent scope and shipped-agent criteria | [[Agent Registry]], [[MarkOS v2 GSD Master Work Plan]] | `.agent/markos`, evals, design partner feedback | AgentRun v2, First Loop |
| `13-PRICING-AND-COST-MODEL.md` | Historical platform-tier assumptions, metered AI/BYOK cost inputs, budget controls | [[Target ICP]], [[Core Lib]], [[Pricing Engine Canon]] | Billing, usage ledger, settings UI, Pricing Engine cost model | Cost Accounting / Pricing Engine |
| `14-GO-TO-MARKET.md` | ICP, design partners, positioning, Tenant 0 GTM | [[Target ICP]], [[Brand Stance]] | Tenant 0, docs, GTM analytics | Decision Lock, Tenant 0 |
| `15-PRICING-ENGINE.md` | Pricing intelligence, cost models, competitor monitoring, recommendations, price tests, PRC agents, API/MCP/UI | [[Pricing Engine Canon]], [[MarkOS v2 Pricing Engine Intake]] | Pricing schema, API, MCP, UI, billing, research, agents | Pricing Engine Foundation |
| `16-SAAS-SUITE.md` | SaaS tenant suite: subscriptions, billing, compliance, churn, support, product usage, revenue intelligence, SAS agents, API/MCP/UI | [[SaaS Suite Canon]], [[MarkOS v2 SaaS Suite Intake]] | SaaS schema, billing, compliance, support, product analytics, revenue dashboards, agents, MCP/API/UI | SaaS Suite Phases 214-217 |
| `17-SAAS-MARKETING-OS-STRATEGY.md` | Complete SaaS Marketing OS strategy: B2B/B2C/PLG modes, PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, revenue alignment, 28 target growth agents | [[SaaS Marketing OS Strategy Canon]], [[MarkOS v2 SaaS Marketing OS Strategy Intake]] | SaaS growth profile, product analytics, CRM/revenue alignment, in-app messaging, experiments, community/events/PR/partner connectors, growth agents, UI/API/MCP | Future post-217 GSD translation |

## Requirement Families

### R1 Product and GTM Doctrine

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| MarkOS is an AI-native Marketing OS, not an AI content tool | [[Marketing Operating System Foundation]] | Every phase plan states how it supports the operating loop |
| North star is pipeline per platform dollar | [[North Star]] | Metrics and weekly narrative tie to pipeline or leading indicators |
| Primary ICP is growth-stage B2B marketing leaders | [[Target ICP]] | Product copy, onboarding, design partner filters, and pricing use v2 ICP |
| Tenant 0 markets MarkOS through MarkOS | [[Brand Stance]] | Tenant 0 has brand pack, connectors, performance narrative, and sourced case studies |

### R2 Agent Orchestration

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| Every invocation is an AgentRun | [[MarkOS v2 Operating Loop Spec]] | Run records include trigger, priority, status, input, output, model, token/cost, retries, errors |
| Chains are DAGs | [[MarkOS Protocol]] | Dependency-satisfied nodes can run without breaking tenant limits |
| Priority tiers P0-P4 exist | [[MarkOS v2 Operating Loop Spec]] | P0 bypass behavior and starvation caps are defined |
| Failures create visible tasks | [[MarkOS v2 GSD Master Work Plan]] | Retry, pause, cancel, fallback, and DLQ states are visible |

### R3 Human Approval and Task System

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| External-world mutations require approval by default | [[MarkOS Canon]] | Publish/send/social/ad/CRM/data-export actions cannot execute without gate |
| Every agent output becomes a task or approval | [[MarkOS v2 Operating Loop Spec]] | Task Board shows source agent, priority, state, owner, due date |
| Approval Inbox is a primary surface | [[UI Components]] | Preview, evidence, brand score, compliance, cost, approve/edit/reject exist |
| Mobile is reactive only | [[MarkOS v2 Operating Loop Spec]] | Mobile supports approvals, brief, inbox, notifications, quick tasks only |

### R4 Brand, Claims, and Content

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| Brand pack is mandatory | [[Brand System Canon]] | Brand Pack Wizard is part of onboarding; completion target tracked |
| Voice classifier runs before approval | [[Brand Stance]] | Artifacts persist voice score dimensions |
| Claims require evidence and decay | [[Brand System Canon]] | Unsupported claims block output |
| Content loop is strategy -> brief -> create -> publish -> measure | [[Message Crafting Pipeline]] | One artifact completes the 10-stage loop |

### R5 Research and Evidence

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| Five research tiers exist | [[MarkOS v2 Operating Loop Spec]] | Research context records tier and source coverage |
| Source Quality Score controls trust | [[MarkOS v2 GSD Master Work Plan]] | Low-SQS sources are flagged or blocked by policy |
| Every factual claim has evidence text | [[Brand System Canon]] | Approval UI exposes evidence map |
| Agents check research context before new research | [[Marketing Literacy]] | Duplicate research is avoided unless context is stale |

### R6 Connectors and Intelligence

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| Connectors inform actions, not passive dashboards | [[Marketing Operating System Foundation]] | Connector data produces tasks, audits, briefs, narratives, or recovery actions |
| Initial onboarding recommends max 3 connectors | [[Target ICP]] | Connector screen enforces limited recommendations |
| Connector failure pauses dependent agents | [[MarkOS v2 Operating Loop Spec]] | Failure creates recovery task and backfill path |
| Nango/direct split is researched | [[MarkOS v2 GSD Master Work Plan]] | Direct adapter requires explicit API-depth justification |

### R7 Learning and Literacy

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| Every artifact writes a performance envelope | [[MarkOS v2 Operating Loop Spec]] | Envelope exists before dispatch |
| Tenant overlays refine local execution | [[Marketing Operating System Foundation]] | Overlay includes confidence, evidence, and expiry/review |
| Cross-tenant learning is anonymized | [[MarkOS Canon]] | No tenant_id or PII in aggregate signal |
| Central literacy promotion is admin-reviewed | [[Marketing Literacy]] | Update candidate queue exists before central write |

### R8 Pricing, Cost, and BYOK

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| Fixed public tier prices are superseded | [[Pricing Engine Canon]] | Active doctrine uses `{{MARKOS_PRICING_ENGINE_PENDING}}` until approved PricingRecommendation exists |
| AI costs are estimated and actualized | [[Core Lib]] | AgentRun and usage ledger can show estimate vs actual |
| Budget caps protect trial and tenants | [[MarkOS v2 Operating Loop Spec]] | Normal runs block or degrade when budget cap is reached |
| BYOK is visible when it saves money | [[Brand Stance]] | Usage UI explains BYOK savings and trust tradeoff |

### R9 Pricing Engine

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| Pricing is a continuous intelligence loop | [[Pricing Engine Canon]] | Pricing flow has knowledge, cost, recommendation, approval, test, measurement |
| Pricing Knowledge Objects are versioned and quality-scored | [[MarkOS v2 Pricing Engine Intake]] | Own/competitor/market/strategic records preserve source, SQS, confidence, diff, history |
| Tenant cost model is required before recommendations | [[Pricing Engine Canon]] | Recommendations block or degrade when cost model is missing |
| PRC agent tier exists in target architecture | [[Agent Registry]] | PRC-01 through PRC-06 have token, role, inputs, outputs, cadence, approval posture |
| Pricing MCP tools are available to other agents | [[MarkOS v2 Operating Loop Spec]] | Pricing-sensitive content can query live matrix, position, competitor pricing, pricing floor, alerts, recommendations |
| Price changes and tests require approval | [[MarkOS Canon]] | Price test activation, public price changes, and packaging changes cannot execute without approval gate |

### R10 SaaS Suite

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| SaaS Suite activates only for SaaS tenants | [[SaaS Suite Canon]] | `business_type = saas` plus operator module configuration is required before SaaS Suite surfaces/actions appear |
| SaaS subscription lifecycle is first-class | [[SaaS Suite Canon]] | Plans, subscriptions, trials, upgrades, downgrades, pauses, past-due state, cancellations, and reactivations have durable records and lifecycle events |
| SaaS plan/package/pricing decisions are Pricing Engine-owned | [[Pricing Engine Canon]], [[SaaS Suite Canon]] | Unapproved prices/packages/discounts/save offers use `{{MARKOS_PRICING_ENGINE_PENDING}}` or approved PricingRecommendation records |
| SaaS billing supports launch-country compliance | [[SaaS Suite Canon]] | US Stripe/Tax/QuickBooks path and Colombia Mercado Pago/DIAN/Siigo/Alegra path are researched, approval-gated, and auditable |
| Legal invoice failures become visible work | [[SaaS Suite Canon]] | DIAN/accounting/processor failures create priority tasks and block dependent legal-billing completion |
| Churn intelligence uses explainable health scoring | [[SaaS Suite Canon]] | Health score exposes product usage, support, billing, engagement, relationship depth, confidence, trend, and intervention |
| Support intelligence is reviewed before customer response | [[SaaS Suite Canon]] | AI-suggested support replies require CS approval unless tenant safe auto-response is explicitly configured |
| Product usage informs health and revenue decisions | [[SaaS Suite Canon]] | Usage signals generate tasks, health deltas, churn risk, expansion opportunities, or revenue narrative, not passive charts |
| SaaS revenue intelligence is operator-ready | [[SaaS Suite Canon]] | MRR, ARR, NRR, GRR, churn, expansion, contraction, cohorts, and forecast have definitions and source reconciliation |
| SAS agent tier exists in target architecture | [[Agent Registry]] | SAS-01 through SAS-06 have token, role, inputs, outputs, cadence, approval posture, and cost visibility |
| SaaS API/MCP/UI surfaces are tenant-safe | [[MarkOS v2 Operating Loop Spec]] | `/v1/saas/*`, `markos-saas`, and SaaS navigation are gated by activation, RLS, auth, audit, and fresh contracts |

### R11 SaaS Marketing OS Strategy

| Requirement | Vault owner | Acceptance gate |
|---|---|---|
| SaaS growth mode routes product behavior | [[SaaS Marketing OS Strategy Canon]] | Tenant profile or SaaS activation can distinguish `b2b`, `b2c`, `b2b2c`, `plg_b2b`, and `plg_b2c`, with active modules and metrics changing by mode |
| PLG activation and PQL scoring are first-class | [[SaaS Marketing OS Strategy Canon]] | ActivationDefinition, milestone funnel, PQLScore, and upgrade-trigger concepts are researched before implementation |
| Growth modules create work, not passive dashboards | [[SaaS Marketing OS Strategy Canon]] | PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, and revenue alignment produce tasks, approvals, experiments, or learnings |
| SaaS Suite facts feed growth motions | [[SaaS Suite Canon]], [[SaaS Marketing OS Strategy Canon]] | Product usage, support, billing, health, MRR, churn, expansion, and cohort signals route into growth decisions |
| Pricing-sensitive SaaS growth remains Pricing Engine-owned | [[Pricing Engine Canon]] | Upgrade prompts, discounts, save offers, referral rewards, affiliate commissions, pricing-page copy, and G2 pricing fields query Pricing Engine or use `{{MARKOS_PRICING_ENGINE_PENDING}}` |
| Target growth agent tiers are planned, not blindly implemented | [[Agent Registry]] | PLG/EXP/ABM/VRL/IAM/CMT/EVT/XP/PR/PRT/DEV/REV agents receive contracts, inputs, outputs, costs, approval posture, and tests before runnable implementation |
| Customer-facing growth mutations remain approval-gated | [[MarkOS v2 Operating Loop Spec]] | In-app activations, outreach, event sends, PR pitches, review requests, affiliate/referral payouts, experiments, discounts, and expansion asks require approval by default |

## Known Collision Register

| Collision | Status | Rule |
|---|---|---|
| Incoming F-90 through F-96 learning contracts collide with existing F-90 through F-100 contracts | Open implementation blocker | Allocate fresh IDs before implementation |
| Current v4.0.0 roadmap says Phase 204 CLI GA next; v2 suggests realignment first | Open GSD decision | Discuss phase must decide insertion or defer |
| Current agent registry is 39-ish implementation agents; v2 source says 80+ target network | Managed | Current registry remains implementation truth until migration |
| `CNT` versus `CONT` content token namespace | Open implementation blocker | Build migration map before renaming |
| Nango embedded versus direct deep APIs | Open research blocker | Hybrid default; prove direct adapter need |
| Fixed tier strategy versus Pricing Engine ownership | Resolved doctrine, open implementation | Use `{{MARKOS_PRICING_ENGINE_PENDING}}` until Pricing Engine produces approved recommendations |
| SaaS Suite proposed `/v1/webhooks/stripe`, `/v1/webhooks/mercado-pago`, and `/v1/webhooks/dian` versus existing webhook engine | Open implementation blocker | Route processor events through existing webhook durability, signing, replay, DLQ, rate-limit, and observability contracts |
| SaaS Suite schema names in intake versus existing MarkOS tenant/CRM/billing schema | Open implementation blocker | Map to current `markos_*`, CRM, and billing tables before creating parallel objects |
| SaaS Marketing OS Strategy adds 28 agents while the v2 launch rule still says one complete loop first | Managed doctrine | Treat growth agents as target architecture until post-suite GSD translation assigns contracts and tests |
| B2B/B2C/PLG mode routing expands beyond the locked launch ICP | Managed doctrine | Keep launch ICP focused, but model the SaaS mode field as future tenant capability rather than immediate GTM expansion |

## GSD Routing After Codebase Compliance Audit

The 2026-04-22 codebase audit selected the non-decimal phase path: keep Phase 204 active for CLI GA, keep Phase 205 for Pricing Engine, update Phase 206 for SOC2 v2 controls, and route the remaining v2 operating-loop gaps through Phases 207-213.

| Phase | Requirement family | Primary acceptance gate |
|---|---|---|
| 204 | CLI v1 GA with v2 guardrails | `markos run/status/doctor` understand AgentRun, approvals, connector issues, budget state, vault freshness, and Pricing Engine placeholder policy |
| 205 | Pricing Engine | Pricing Knowledge Objects, Tenant Cost Model, PricingRecommendation, PriceTest, PRC agents, API/MCP/UI, and billing handoff exist |
| 206 | SOC2 Type I v2 controls | AI, pricing, connector, evidence, learning, billing, approval, and Tenant 0 controls are in the auditor-ready package |
| 207 | AgentRun v2 orchestration | Durable AgentRuns, DAG chains, priority tiers, retry/DLQ, costs, approvals, tasks, and side effects are canonical |
| 208 | Human Operating Interface | Morning Brief, Task Board, Approval Inbox, Connector Recovery, and Weekly Narrative are primary surfaces |
| 209 | Evidence and research | EvidenceMap, SQS, freshness, claim TTL, and unsupported-claim blocking are implemented |
| 210 | Connector wow loop | ConnectorInstall, max-3 onboarding, GA4/GSC or equivalent wow audit, and recovery tasks are implemented |
| 211 | Content/social/revenue loop | One artifact completes strategy -> brief -> draft -> audit -> approve -> dispatch -> measure -> learn |
| 212 | Learning and literacy | ArtifactPerformanceLog, TenantOverlay, LiteracyUpdateCandidate, anonymized learning, and admin review exist |
| 213 | Tenant 0 and final validation | MarkOS markets MarkOS with real evidence and the vault/codebase compliance matrix is closed |
| 214 | SaaS Suite activation and subscription core | `business_type=saas` activation, SaaS profile, plan/subscription lifecycle, RLS schema, and lifecycle tasks exist |
| 215 | SaaS billing, payments, and compliance | Stripe/US, Mercado Pago/Colombia, QuickBooks/Siigo/Alegra, DIAN setup, invoice compliance, and webhook routing are specified |
| 216 | SaaS health, churn, support, and usage | Health score, churn alerts, support triage, product usage ingestion, and intervention tasks exist |
| 217 | SaaS revenue, SAS agents, API/MCP/UI | Revenue intelligence, SAS agent tier, `/v1/saas/*`, `markos-saas`, and SaaS navigation are ready |
| Future post-217 | SaaS Marketing OS strategy | Growth profile, PLG/PQL/in-app, ABM/expansion, viral/referral/community, events/PR/partnerships/developer marketing/revenue alignment, and experimentation are translated into GSD plans |

Planning audit: `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`.

## First Implementation Candidate Slices

| Slice | Why it matters | Prerequisites |
|---|---|---|
| AgentRun v2 + cost/failure visibility | Foundation for all agents | Phase 207 |
| Task Board + Approval Inbox | Makes human decisions visible | Phase 208 |
| Brand Pack Wizard + voice score persistence | Quality substrate | Phase 211 and current brand pack code audit |
| GA4/GSC wow audit | Fast design partner proof | Phase 210 |
| Content brief/draft/audit/approval | First complete artifact loop | Phase 211 |
| Artifact performance log | Learning loop substrate | Phase 212 |
| Pricing Engine foundation | Pricing strategy and margin-aware GTM substrate | Phase 205 |
| SaaS Suite foundation | Subscription-company operating suite after the core loop is governed | Phases 214-217 |
| SaaS Marketing OS strategy | Full SaaS growth operating system after core loop, Pricing Engine, and SaaS Suite substrate exist | Future post-217 GSD translation |

## Related

- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Operating Loop Spec]]
- [[MarkOS v2 GSD Master Work Plan]]
- [[MarkOS v2 GSD Readiness Audit]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 Pricing Engine Intake]]
- [[SaaS Suite Canon]]
- [[MarkOS v2 SaaS Suite Intake]]
- [[SaaS Marketing OS Strategy Canon]]
- [[MarkOS v2 SaaS Marketing OS Strategy Intake]]
- [[MarkOS v2 Blueprint Intake]]
- [[Contracts Registry]]
- [[Database Schema]]
