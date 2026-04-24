---
date: 2026-04-22
status: active
description: "GSD-ready master work plan for MarkOS v2: discussion goals, research agenda, phase strategy, workstreams, dependencies, acceptance gates, and next decisions."
tags:
  - work
  - active
  - plan
  - gsd
  - markos
  - v2
aliases:
  - MarkOS v2 GSD Master Work Plan
  - MarkOS v2 Work Plan
---

# MarkOS v2 GSD Master Work Plan

## Purpose

This is the handoff artifact for the next GSD discuss and research phase. It turns the v2 blueprint into a concrete, researchable, phaseable plan without pretending implementation decisions are already solved.

The goal is to make MarkOS a future-ready, AI-agentic Marketing Operating System that can manage real company marketing requirements through one evidence-backed, human-approved, continuously learning loop.

## North Star

> Marketing-attributed pipeline created per dollar of MarkOS platform spend.

Every phase should explain how it improves one of:

- Pipeline creation.
- Cost per useful agent action.
- Human decision speed.
- Brand and claim safety.
- Data-connected marketing quality.
- Learning rate from artifact outcomes.
- Tenant trust and governance.

## Recommended GSD Shape

### Selected path after codebase compliance audit

The 2026-04-22 codebase audit selected the non-decimal route. Do not insert Phase 203.5. Keep Phase 204 as CLI GA, keep Phase 205 as Pricing Engine Foundation + Billing Readiness, update Phase 206 for SOC2 v2 controls, and route the remaining v2 operating-loop gaps through Phases 207-213.

| Phase | Name |
|---|---|
| 204 | CLI `markos` v1 GA plus v2 guardrails |
| 205 | Pricing Engine Foundation + Billing Readiness |
| 206 | SOC 2 Type I Foundation for v2 controls |
| 207 | AgentRun v2 Orchestration Substrate |
| 208 | Human Operating Interface |
| 209 | Evidence, Research, and Claim Safety |
| 210 | Connector Wow Loop and Recovery |
| 211 | Content, Social, and Revenue Loop |
| 212 | Learning and Literacy Evolution |
| 213 | Tenant 0 Dogfood and Compliance Validation |
| 214 | SaaS Suite Activation and Subscription Core |
| 215 | SaaS Billing, Payments, and Multi-Country Compliance |
| 216 | SaaS Health, Churn, Support, and Product Usage Intelligence |
| 217 | SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness |
| Future post-217 | SaaS Marketing OS Strategy translation |

Planning audit: `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`.

### Historical option considered: decimal insertion

Insert a strategic realignment phase before Phase 204:

| Proposed phase | Name | Why |
|---|---|---|
| 203.5 | MarkOS v2 Strategic Realignment and Operating Loop Foundation | Phase 203 is gap-free but not yet verified; Phase 204 CLI GA could drift unless v2 substrate decisions are locked first |

### Historical option selected and expanded

If decimal insertion is undesirable, create Phase 207 after v4.0.0:

| Proposed phase | Name | Why |
|---|---|---|
| 207 | MarkOS v2 Operating Loop Foundation | Keeps v4.0.0 roadmap intact while making v2 the next milestone bridge |

### Do not do

- Do not rewrite all active v4.0.0 work retroactively.
- Do not start implementing 80 agents.
- Do not ship UI screens before AgentRun/task/approval/cost substrate is clear.
- Do not alter `.markos-local/` tenant override space.

## Phase 0: Discuss and Decision Lock

### Goal

Turn doctrine into phase boundaries and lock the choices that determine implementation.

### Required discussion decisions

| Decision | Options | Recommended default |
|---|---|---|
| GSD insertion | Phase 203.5 before CLI GA, or Phase 207 after v4.0.0 | Selected: keep Phase 204 active and expand the non-decimal path into Phases 207-213 |
| First-loop slice | Full content/social/revenue loop, or analytics/content loop first | Analytics/content loop first, with social signal schema prepared |
| Contract ID range | Reuse incoming F-90 range, or allocate fresh range | Fresh range only |
| Agent token namespace | Keep current shorthand, adopt v2 domain codes, or bridge map | Bridge map first, then migrate |
| Connector substrate | Nango baseline, direct adapters, or hybrid | Hybrid: Nango baseline, direct only for depth gaps |
| Pricing timing | Update billing immediately, or use as planning baseline | Planning baseline until product loop exists |
| Pricing Engine ownership | Keep fixed tier assumptions, or make Pricing Engine source of truth | Pricing Engine owns; use `{{MARKOS_PRICING_ENGINE_PENDING}}` until approved recommendations |
| Tenant 0 readiness | Internal dogfood only, or public case-study engine | Internal first, public after evidence quality is real |

### Outputs

- DISCUSS.md with decisions, non-goals, risks, and exact phase number.
- Decision table linked back to [[Key Decisions]].
- Updated ROADMAP entry or explicit decision to defer.
- Research plan split into independent questions.

## Phase 1: Research Plan

### Goal

Answer only the questions that change implementation strategy.

### Research questions

| Research area | Questions | Required sources during research |
|---|---|---|
| Connector architecture | Which GA4/GSC/social/CRM APIs require direct adapters beyond Nango? What scopes and rate limits shape the first loop? | Official platform docs, Nango docs, existing connector code |
| Orchestration substrate | Can current `markos_agent_runs`/events/side effects support DAGs, priorities, retries, DLQ, schedules, and cost accounting? | Existing migrations/libs/tests, queue/provider docs if new dependency considered |
| Task/approval model | Can current CRM tasks and approval packages be generalized, or does v2 need a new task system? | Existing CRM schema, UI components, approval package code |
| Evidence and research | What minimum SQS/citation/evidence data model blocks hallucinated claims without overbuilding? | Incoming research doc, literacy notes, LLM eval practice |
| UI decision surfaces | What is the smallest Morning Brief, Task Board, and Approval Inbox that proves decision speed? | Current app routes/components, design system, accessibility gates |
| Pricing/cost | How should AgentRun costs map to existing billing usage events and BYOK logic? | Existing billing libs/schema, v2 pricing doc |
| Pricing Engine | How should competitor crawling, cost models, recommendations, price tests, and PRC agents fit into the first v2 milestone? | [[Pricing Engine Canon]], `15-PRICING-ENGINE.md`, existing billing/MCP/schema |
| SaaS Suite | How should subscription lifecycle, legal billing, churn, support, product usage, revenue intelligence, SAS agents, and SaaS API/MCP/UI fit after the core foundation? | [[SaaS Suite Canon]], `16-SAAS-SUITE.md`, existing billing/webhook/CRM/MCP/schema |
| SaaS Marketing OS Strategy | How should B2B/B2C/PLG mode routing, PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, revenue alignment, and 28 target growth agents fit after SaaS Suite? | [[SaaS Marketing OS Strategy Canon]], `17-SAAS-MARKETING-OS-STRATEGY.md`, existing CRM/billing/Pricing Engine/SaaS Suite/task/approval/schema |
| Learning loop | What data is needed for artifact performance envelopes and tenant overlays? | Current literacy schema, performance docs, privacy constraints |
| Tenant 0 | Which internal MarkOS marketing loop can dogfood the product without fake data? | MarkOS brand/ICP/docs, available marketing surfaces |

### Research output format

Each research note should include:

- Question answered.
- Sources inspected.
- Current-code support.
- Gap.
- Recommendation.
- Risks.
- Phase implications.
- Acceptance tests implied.

## Phase 2: Architecture Baseline

### Goal

Design the minimum substrate that all v2 loops need.

### Workstreams

| Workstream | Scope | Depends on | Output |
|---|---|---|---|
| AgentRun v2 | Run state, priority, trigger, DAG edges, cost, retry, error, DLQ | Research on current migration 53 | Contract/schema plan |
| Task substrate | Unified tasks for agent outputs, approvals, escalations, connector recovery | AgentRun v2 | Task model and UI requirements |
| Approval gate v2 | Preview, decision, edit/reject, reason, rollback, evidence | Task substrate | Approval gate contract |
| Cost accounting | Estimate, actual cost, budget cap, BYOK flag, usage ledger mapping | AgentRun v2 and billing | Billing integration plan |
| Evidence map | Source, quote, SQS, claim, confidence, TTL, known gaps | Research/evidence | Evidence contract |
| Artifact performance | Expected envelope, actual outcomes, attribution evidence | Evidence map, connectors | Performance log contract |
| Tenant overlays | Tenant learning, confidence, promotion candidate | Artifact performance | Overlay governance plan |
| Pricing Engine | pricing knowledge, cost models, recommendations, price tests, watch lists, alerts | Evidence map, connectors, billing, approval gates | Pricing Engine architecture plan |

### Acceptance gates

- Fresh contract IDs allocated.
- Schema changes mapped to existing migrations.
- RLS and tenant isolation described for every new table.
- Approval and cost gates are visible before external side effects.
- Failure states produce tasks, not silent logs.

## Phase 3: Human Operating Interface

### Goal

Build the minimum UI that makes the agentic system trustworthy.

### Required surfaces

| Surface | Purpose | Minimum viable behavior |
|---|---|---|
| Morning Brief | Start the day with decisions, anomalies, blockers, and wins | Shows urgent approvals, run failures, connector issues, top opportunities, budget risk |
| Task Board | Make agent outputs and human actions visible | Group by priority, campaign, source agent, due date, and status |
| Approval Inbox | Human gate for external-world actions | Render preview, evidence, brand score, compliance, cost, approve/edit/reject |
| Connector Recovery | Make data failures actionable | Shows broken connector, affected agents, recovery steps, backfill status |
| Weekly Narrative | Explain performance and next actions | Ties artifact results to pipeline or leading indicators |

### UX constraints

- Decision-first, not metric-first.
- No nested dashboard sprawl.
- Mobile is reactive only.
- Every warning must have an owner and next action.
- Every approval must explain why it is safe or unsafe.

## Phase 4: First Operating Loop

### Goal

Prove one full loop end to end.

### Recommended first loop

1. Operator completes Brand Pack Wizard.
2. Operator connects GA4 and GSC or equivalent analytics/search sources.
3. MarkOS produces a live-data wow audit within 30 minutes.
4. MarkOS creates a content strategy and three briefs.
5. MarkOS drafts one artifact.
6. Voice/claim/evidence/channel audits run.
7. Operator approves or rejects in Approval Inbox.
8. Approved artifact is dispatched or marked ready to publish.
9. Performance envelope is written.
10. Pricing-sensitive output uses live Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
11. Outcome signals update weekly narrative and next task suggestions.

### Scope fence

This loop can defer:

- Full social automation.
- Full CRM mutation automation.
- Agent marketplace.
- Multi-client agency dashboard.
- Central literacy auto-promotion.

It must not defer:

- Human approval.
- Cost visibility.
- Evidence for claims.
- Task visibility.
- Connector failure handling.
- Run state visibility.

## Phase 5: Social and Revenue Expansion

### Goal

Extend the loop into social signals and revenue impact after the first content loop is reliable.

### Workstreams

- Social signal schema.
- Official API listener strategy.
- Sentiment/intent/topic/CRM-match classification.
- Response drafting with approval.
- Crisis pause rules.
- High-intent DM to CRM/task path.
- UTM/pipeline attribution feedback.
- Budget reallocation recommendations.

## Phase 5.5: Pricing Engine Foundation

### Goal

Make pricing a first-class MarkOS operating loop before public MarkOS pricing is locked.

### Workstreams

- Pricing Knowledge Object and history store.
- Tenant Cost Model for SaaS/eCommerce/Services.
- Competitor pricing watch list and crawler strategy.
- PricingRecommendation object and approval decisions.
- Price test model and activation gate.
- PRC agent tier and MCP tool contracts.
- Pricing Engine dashboard, competitor matrix, cost model wizard, recommendation cards, alerts.
- MarkOS Tenant 0 pricing dogfood using `{{MARKOS_PRICING_ENGINE_PENDING}}` until approved recommendations exist.

### Non-negotiable

No public MarkOS price point becomes canonical until the Pricing Engine models cost, market position, and operator-approved recommendations.

## Phase 6: Learning and Literacy Evolution

### Goal

Turn performance into better tenant-specific execution without compromising trust.

### Workstreams

- Artifact performance log.
- Tenant overlay creation.
- Overlay confidence scoring.
- Central literacy update candidates.
- Admin review queue.
- Cross-tenant anonymization.
- Sample-size confidence rules.
- Freshness scanning.

### Non-negotiable

Central literacy promotion remains human-reviewed until a later explicit autonomy decision.

## Phase 7: SaaS Suite Foundation

### Goal

Turn MarkOS into a tenant-type operating suite for subscription companies without breaking the core Marketing OS foundation.

### Workstreams

- SaaS Suite activation and `business_type = saas` module gating.
- SaaS plan catalog and subscription lifecycle.
- Stripe/US and Mercado Pago/Colombia processor strategy.
- QuickBooks, Siigo/Alegra, and DIAN legal billing posture.
- Churn health score and intervention playbooks.
- Customer support intelligence with approval-gated responses.
- Product usage ingestion and health/revenue contribution.
- MRR/ARR/NRR/GRR revenue dashboard and forecast.
- SAS agent tier, `/v1/saas/*` API, `markos-saas` MCP tools, and SaaS UI navigation.

### Non-negotiable

SaaS Suite does not ship as a passive billing dashboard. It must turn subscription, billing, support, product, and revenue signals into governed tasks, approvals, recommendations, and learning.

## Future: SaaS Marketing OS Strategy Translation

### Goal

Translate [[SaaS Marketing OS Strategy Canon]] into GSD artifacts after the core operating loop, Pricing Engine, and SaaS Suite substrate are either shipped or explicitly planned.

### Candidate workstreams

- SaaS growth profile and B2B/B2C/B2B2C/PLG mode routing.
- PLG activation, PQL scoring, upgrade triggers, and in-app campaign orchestration.
- B2B ABM, account expansion, customer marketing, and advocacy.
- B2C viral/referral loops and community-led growth.
- Events, PR/analyst/G2, partnerships, affiliate, developer marketing, and revenue-team alignment.
- Growth experimentation registry, ICE backlog, guardrails, decisions, and learning loop.

### Non-negotiable

Do not turn the 28 target growth agents into runnable implementation before contracts, data objects, approval posture, costs, tests, UI/API/MCP surfaces, and Pricing Engine/SaaS Suite dependencies are clear.

## Research Agenda for Competitive State of the Art

This agenda belongs in the GSD research phase. It should be answered with current primary sources wherever possible.

### Marketing OS category research

- What tools are closest to an AI-native Marketing OS today?
- Where do HubSpot, Salesforce, Adobe GenStudio, Jasper, Copy.ai, Clay, Mutiny, Hightouch, Customer.io, and social management suites stop short?
- What is the defensible category wedge for MarkOS: orchestration, evidence, approval, learning, or Tenant 0 proof?

### Agent orchestration research

- What orchestration patterns are best for long-running marketing agents: internal queues, DAG engine, Temporal, Inngest, Trigger.dev, Vercel Queues, or custom substrate?
- How should retries, partial failure, chain cancellation, and human wait states be modeled?
- What trace shape makes support and audit easiest?

### Research/evidence research

- What is the minimum viable source quality score that blocks hallucinations without slowing every output?
- How should primary versus secondary evidence be exposed in copy approvals?
- What TTL should different claim types use?

### Connector research

- Which official APIs support the needed first-loop data with stable access?
- Which connectors should be read-only first?
- Which APIs require app review before design partner usage?
- Which connector failures are recoverable by the operator versus admin-only?

### UI research

- What approval inbox patterns minimize review debt?
- What information makes a human decision fast: preview, diff, risk labels, evidence, cost, or predicted impact?
- What should Morning Brief show on day 1 versus day 30?

### Pricing/cost research

- What AI budget defaults make the 14-day trial safe?
- What usage units are understandable to a marketing operator?
- When should BYOK be recommended automatically?
- What cost model fields are mandatory before MarkOS can recommend pricing?
- What competitor pricing crawler and extraction posture is safe, accurate, and compliant?
- What price-test metrics and stop conditions are required by business type?

### SaaS Suite research

- Which existing billing, CRM, webhook, MCP, and AgentRun primitives should SaaS Suite reuse?
- What fresh contract and migration ranges should be reserved for SaaS Suite?
- What is the safe US launch path for Stripe Billing, tax, invoices, and QuickBooks sync?
- What is the safe Colombia launch path for Mercado Pago, DIAN, Siigo/Alegra, IVA, retentions, CUFE, and QR?
- Which product analytics and support connectors should be first-class for health score v1?
- What approval gates are mandatory for lifecycle changes, support replies, invoice corrections, refunds, discounts, and save offers?

## Phase Acceptance Criteria

Before the first implementation phase closes:

- GSD DISCUSS decisions are linked to [[Key Decisions]].
- All v2 contracts use fresh IDs.
- Every new tenant-scoped table has RLS policy plan.
- Every external-world action has approval posture.
- Every AgentRun has cost and failure state.
- Every customer-facing claim has evidence or inference labeling.
- Every connector dependency has recovery behavior.
- Pricing-sensitive artifacts use [[Pricing Engine Canon]] or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- SaaS Suite artifacts use [[SaaS Suite Canon]] and route legal billing, support replies, save offers, discounts, and lifecycle mutations through approval/compliance gates.
- PageIndex has been regenerated.
- Vault docs link from source -> doctrine -> work plan -> implementation notes.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Building breadth before loop depth | Many agents, no product proof | Use first-loop done criteria as phase gate |
| Planning drift between vault and `.planning` | GSD executes old assumptions | Add explicit realignment phase or roadmap update |
| Contract ID collision | Broken registry and implementation confusion | Allocate fresh IDs before code |
| Generic AI writer trap | Weak differentiation | Enforce evidence, approval, measurement, and learning |
| Connector access friction | Wow moment blocked | Pick first-loop connectors with accessible APIs and fallback manual imports |
| Approval inbox overload | Operators ignore system | Prioritize by risk/impact and batch low-risk reviews |
| Cost surprise | Trial churn and trust damage | Budget caps, estimates, BYOK visibility, usage dashboard |
| Static pricing drift | Public prices age into wrong strategy | Pricing Engine owns pricing; no hard-coded prices in active doctrine |
| SaaS Suite overreach | Billing, support, product usage, and revenue scope can swallow the foundation | Route through Phases 214-217 after core AgentRun/task/approval/evidence/Pricing Engine substrate is ready |
| SaaS Marketing OS strategy overreach | PLG, ABM, viral/referral, events, PR, partnerships, developer marketing, RevOps, and 28 agents can overrun the foundation | Treat document 17 as post-suite destination map until a dedicated GSD translation prompt creates phases |
| Legal billing mistake | Wrong invoice/tax behavior creates customer and compliance harm | Start with researched US and Colombia paths, prefer Siigo/Alegra for DIAN first, and create P1 tasks for rejected invoices |
| Support autonomy risk | AI replies can damage relationships | CS approval by default; tenant opt-in only after safe auto-response controls exist |
| Cross-tenant privacy leak | Trust/compliance failure | Tenant-only raw data, anonymized aggregates, admin review |
| Tenant 0 theater | False proof | Use real MarkOS marketing data and publish only sourced evidence |

## Handoff Checklist

- [x] GSD phase number selected for Pricing Engine: Phase 205.
- [x] DISCUSS.md seeded for Phase 205 Pricing Engine Foundation + Billing Readiness.
- [x] Research questions split into Phase 205 research scaffold.
- [x] Non-decimal v2 compliance route selected: Phases 207-213.
- [x] Codebase-to-vault compliance audit created.
- [x] Phase 204 v2 guardrail plan added.
- [x] Phase 206 refreshed for v2 and Pricing Engine controls.
- [x] DISCUSS.md seeded for Phases 207-213.
- [ ] Contract ID range reserved.
- [ ] Token namespace migration map drafted.
- [x] First-loop slice selected: connector wow loop first, then content/social/revenue loop with social pathway prepared.
- [x] Pricing Engine placement selected: Phase 205 in the live v4.0.0 roadmap.
- [x] SaaS Suite placement selected: Phases 214-217 as the next major tenant-type suite arc.
- [x] SaaS Marketing OS Strategy indexed as future post-217 translation material.
- [ ] Pricing contract/schema range reserved.
- [ ] SaaS Suite contract/schema range reserved.
- [ ] SaaS Marketing OS Strategy GSD route selected in a later prompt.
- [ ] Design partner criteria confirmed.
- [ ] Tenant 0 minimum data sources listed.
- [ ] PageIndex regenerated after any vault changes.

## Related

- [[MarkOS v2 GSD Readiness Audit]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 Pricing Engine Intake]]
- [[SaaS Suite Canon]]
- [[MarkOS v2 SaaS Suite Intake]]
- [[SaaS Marketing OS Strategy Canon]]
- [[MarkOS v2 SaaS Marketing OS Strategy Intake]]
- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Operating Loop Spec]]
- [[MarkOS v2 Blueprint Intake]]
- [[Key Decisions]]
- [[North Star]]
