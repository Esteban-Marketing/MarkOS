---
date: 2026-04-22
status: canonical
description: "Canonical MarkOS v2 foundation: product thesis, operating loop, non-negotiable requirements, launch sequence, and success criteria for the AI-native Marketing Operating System."
tags:
  - brain
  - canon
  - markos
  - operating-system
  - v2
aliases:
  - MarkOS Foundation
  - Marketing Operating System Foundation
---

# Marketing Operating System Foundation

> MarkOS is the AI-native Marketing Operating System. It replaces scattered tools, passive dashboards, and agency handoffs with one orchestrated, evidence-backed, human-approved operating loop.

This note is the vault-level foundation for v2 planning. It absorbs the incoming blueprint pack into the living [[MarkOS Canon]], while keeping implementation details grounded in the current SaaS readiness roadmap and codebase constraints.

## Source Stack

Planning derived from this foundation must read these first:

- [[MarkOS v2 Blueprint Intake]] - synthesis of the incoming v2 source pack.
- [[MarkOS v2 GSD Master Work Plan]] - GSD discuss/research/phase strategy.
- [[MarkOS v2 Requirements Traceability Matrix]] - source-to-workstream requirement map.
- [[Pricing Engine Canon]] - pricing intelligence, PRC agents, and pricing placeholder policy.
- [[SaaS Suite Canon]] - conditional SaaS tenant suite for subscription, billing, churn, support, product usage, and revenue intelligence.
- [[SaaS Marketing OS Strategy Canon]] - post-suite SaaS growth-mode doctrine for PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, and revenue alignment.
- [[MarkOS Canon]] - operator doctrine and ship-safe campaign checklist.
- [[MarkOS v2 Operating Loop Spec]] - step-by-step functional contract.
- [[Target ICP]] - current v2 ICP, pricing, and GTM scope.
- [[Agent Registry]] - current implementation registry and v2 target network.
- [[Brand System Canon]] - brand pack, voice classifier, and claim library.
- [[Message Crafting Pipeline]] - artifact flow from intent to measurement.
- [[Pain-Point Engine]] - pain taxonomy, evidence, and discipline routing.
- [[Marketing Literacy]] - canonical marketing knowledge base.

## Product Thesis

MarkOS must become a continuous marketing operating system with four properties:

| Property | Meaning | Product implication |
|---|---|---|
| Orchestrated | Strategy, content, social, analytics, and revenue actions move as one system | Agents run in chains, not isolated prompts |
| Connected | Data feeds decisions instead of decorating dashboards | Connectors must power audits, briefs, tasks, and learning |
| Agentic | Scheduled and event-driven agents work between human decisions | Every agent run has state, costs, failures, and approval gates |
| Learning | Outputs and outcomes improve tenant overlays and central literacy | Artifact performance, freshness, and evidence become product substrate |

The product is not a content generator, scheduler, reporting dashboard, or CRM with AI added. Those can exist as surfaces, but the product contract is the operating loop.

## North Star

The product-level optimization target is:

> Marketing-attributed pipeline created per dollar of MarkOS platform spend.

Secondary metrics matter only when they explain or improve that target: activation, approval rate, voice score, first connector time, artifact performance, social engagement, pipeline influence, CAC, cost per agent run, and retention.

## What MarkOS Must Achieve

MarkOS must let one operator or small marketing team:

1. Capture brand, audience, offer, claims, and constraints into a machine-readable brand and strategy pack.
2. Connect a small number of high-value data sources quickly enough to produce a real wow moment.
3. Diagnose the current marketing system from live tenant data and sourced research.
4. Convert diagnosis into strategy, tasks, briefs, drafts, approvals, dispatch, measurement, and learning.
5. Keep every factual claim sourced, every external-world mutation approval-gated, and every agent action auditable.
6. Let pricing strategy emerge from cost models, competitor intelligence, and approved price tests instead of static assumptions.
7. For SaaS tenants, manage subscription, billing, churn, support, product usage, and revenue intelligence in the same governed operating loop.
8. For SaaS tenants, eventually route B2B, B2C, B2B2C, PLG B2B, and PLG B2C growth motions through mode-specific modules, agents, metrics, and approval gates.
9. Improve tenant-specific execution over time without leaking tenant data or bypassing central review.
10. Market MarkOS through MarkOS itself via Tenant 0.

## Required Product Layers

### 1. Brand Intelligence

- Brand Pack Wizard is mandatory during onboarding.
- Brand pack contains identity, personality, positioning, voice, visual style, and claim library.
- Voice classifier scores every artifact before human review.
- Claims require evidence rows, scope, decay dates, and review status.

### 2. Audience and Pain Intelligence

- Every artifact has a resolved audience archetype.
- Every message carries a dominant pain-point tag from [[Pain-Point Engine]].
- Research gaps block weak briefs instead of allowing generic output.
- B2B buying committee context matters for the v2 ICP.

### 3. Connector Intelligence

- Connectors exist to drive actions, not passive charts.
- Onboarding recommends a maximum of 3 initial connectors.
- Initial wow loop prioritizes GA4, GSC, analytics, SEO, and social signals.
- Connector failures pause dependent agents, create tasks, and provide recovery steps.

### 4. Research Evidence

- Research is a substrate available to all agents.
- Factual claims require citations, source quality, and confidence labels.
- Unsupported claims block customer-facing output.
- Agents check existing research context before starting new research.

### 5. Agent Run Orchestration

- Every agent invocation is an AgentRun.
- Agent chains are DAGs with tenant concurrency limits.
- Runs include trigger, priority, input, output, status, cost estimate, actual cost, model, tokens, retry count, and error state.
- Failures create visible tasks and dead-letter records when unrecoverable.

### 6. Human Decision Interface

- UI exists to make decisions fast and confident.
- First screen becomes Morning Brief, not a generic metrics dashboard.
- Every agent output, escalation, and human action becomes a task.
- Approval Inbox is a core product surface.
- Mobile is reactive: approvals, notifications, social inbox, morning brief, and quick tasks.

### 7. Content, Social, and Revenue Loops

- Content pipeline is strategy -> brief -> create -> publish -> measure.
- Social is a bidirectional operating layer: listen, classify, route, respond, escalate, and attribute.
- Revenue modules must tie campaign, social, and content activity to CRM/pipeline evidence.
- All sends, posts, ad changes, CRM mutations, and data exports remain approval-gated by default.

### 8. Pricing Intelligence

- Active MarkOS pricing is engine-owned; use `{{MARKOS_PRICING_ENGINE_PENDING}}` until recommendations are generated and approved.
- Pricing Engine maintains own, competitor, market, and strategic pricing intelligence.
- Tenant cost models are mandatory before strategy recommendations.
- Pricing floors, margin health, competitive position, and buyer psychology inform recommendations.
- Price changes, packaging changes, pricing page changes, and price-test activation require approval.
- Pricing-sensitive content must query pricing MCP tools or use the placeholder.

### 9. Learning and Literacy

- Every artifact has a performance envelope before outcome signals arrive.
- Outcome signals update tenant overlays first.
- Cross-tenant learning is anonymized, aggregated, confidence-scored, and admin-reviewed.
- Central literacy updates require human approval until trust is deliberately established.

### 10. Tenant-Type Suites

- Tenant-type suites activate only when the tenant profile and operator configuration justify them.
- The first planned tenant-type suite is [[SaaS Suite Canon]] for `business_type = saas`.
- SaaS Suite adds subscription lifecycle, billing/legal compliance, churn intelligence, support intelligence, product usage, revenue intelligence, and SAS agents.
- SaaS plan/package/pricing/discount/save-offer decisions remain Pricing Engine-owned.
- SaaS external mutations, legal billing, customer-facing support responses, and retention offers remain approval-gated by default.

### 11. SaaS Growth Operating System

- [[SaaS Marketing OS Strategy Canon]] is the post-suite destination map for SaaS growth, not a reason to skip the foundation loop.
- SaaS tenants eventually declare a growth mode: `b2b`, `b2c`, `b2b2c`, `plg_b2b`, or `plg_b2c`.
- SaaS mode controls active modules, agents, metrics, playbooks, and UI surfaces.
- PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, and revenue alignment should all create tasks, approvals, experiments, or learnings.
- Product usage, support, billing, health, MRR, churn, and expansion signals from the SaaS Suite feed these growth motions.
- Pricing-sensitive upgrade prompts, discounts, save offers, affiliate commissions, referral incentives, pricing-page copy, and G2 pricing fields remain Pricing Engine-owned.

## Step-by-Step Operating Loop

This is the first complete loop MarkOS must prove before expanding breadth:

1. **Intent** - operator states the business outcome and current constraint.
2. **Brand pack** - identity, voice, claims, style, and proof boundaries are created or refreshed.
3. **Connector setup** - MarkOS recommends up to 3 connectors and explains the value unlocked by each.
4. **Wow audit** - live tenant data produces an analytics, SEO, or content opportunity within 30 minutes.
5. **Research context** - existing data plus sourced research creates an evidence map and confidence labels.
6. **Strategy** - agent chain converts evidence into a campaign/content thesis tied to pipeline impact.
7. **Pricing context** - when pricing matters, agents query the Pricing Engine or use `{{MARKOS_PRICING_ENGINE_PENDING}}`.
8. **Tenant suite context** - when `business_type = saas`, SaaS Suite context can add subscription, billing, churn, support, product usage, and MRR signals.
9. **SaaS growth context** - when SaaS growth modules are active, the loop can add PLG, ABM, expansion, viral/referral, in-app, community, event, PR, experiment, partnership, developer, or revenue-alignment context.
10. **Brief** - content/social/revenue brief includes audience, pain tag, SEO/GEO intelligence, proof needs, brand constraints, pricing context, tenant-suite context, SaaS growth context, and performance targets.
11. **Draft** - format-specific agents create channel-native artifacts.
12. **Audit** - voice, claim, research, pricing, legal, channel, tenant-suite, SaaS-growth, and optional neuro gates run before human review.
13. **Approval** - operator previews, edits, approves, rejects, or requests revision with a reason.
14. **Dispatch** - only approved artifacts reach external systems.
15. **Measure** - UTMs, connector signals, CRM movement, social engagement, pricing outcomes, SaaS Suite outcomes, SaaS growth outcomes, and outcomes update the performance log.
16. **Learn** - tenant overlays, task suggestions, strategy changes, pricing recommendations, SaaS Suite interventions, SaaS growth experiments, and central literacy proposals are generated with provenance.

## Launch Build Order

The blueprint is explicit: do not build all 80 agents first. Build one complete loop.

1. Strategic realignment: resolve ICP, pricing, token namespace, contract IDs, and connector posture.
2. Instrumentation foundation: AgentRun, artifact performance log, evidence, cost, and provenance fields.
3. Task Board and Approval Inbox: every run output and human action visible.
4. Brand pack and voice classifier: activation-quality content substrate.
5. Connector wow loop: GA4/GSC/audit path that creates a real recommendation.
6. Content strategy and brief loop: first complete strategy -> brief -> draft path.
7. Publish and measure: approved publish, tracking, and weekly narrative.
8. Social inbox MVP: normalized signals, routing, draft responses, human approval.
9. Pricing Engine foundation: cost model, competitive matrix, pricing recommendations, tests, PRC agents, API/MCP/UI.
10. Tenant 0: MarkOS uses its own loop and Pricing Engine to create GTM proof.
11. SaaS Suite: activate subscription, billing, compliance, churn, support, product usage, revenue intelligence, and SAS agents for SaaS tenants.
12. SaaS Marketing OS Strategy: translate PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, and revenue alignment into post-suite GSD plans.
13. Broaden the agent network only after the loop runs reliably for design partners.

## Active GSD Routing

The 2026-04-22 codebase compliance audit mapped the foundation build order into the live GSD roadmap:

| Phase | Foundation responsibility |
|---|---|
| 204 | CLI v1 GA with v2 guardrails for AgentRun, approvals, connector health, budget state, vault freshness, and Pricing Engine placeholder policy |
| 205 | Pricing Engine Foundation + Billing Readiness |
| 206 | SOC2 Type I foundation for AI, pricing, connectors, evidence, learning, billing, approvals, and Tenant 0 controls |
| 207 | AgentRun v2 orchestration substrate |
| 208 | Morning Brief, Task Board, Approval Inbox, Connector Recovery, and Weekly Narrative |
| 209 | EvidenceMap, source quality, claim TTL, research freshness, and unsupported-claim blocking |
| 210 | ConnectorInstall, max-3 onboarding, first wow audit, and connector recovery |
| 211 | First complete content/social/revenue operating loop |
| 212 | Artifact performance, tenant overlays, central literacy update candidates, and anonymized learning |
| 213 | Tenant 0 dogfood and final vault/codebase compliance validation |
| 214 | SaaS Suite Activation and Subscription Core |
| 215 | SaaS Billing, Payments, and Multi-Country Compliance |
| 216 | SaaS Health, Churn, Support, and Product Usage Intelligence |
| 217 | SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness |
| Future post-217 | SaaS Marketing OS Strategy translation: growth profile, PLG, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, revenue alignment |

## Non-Negotiables

- No external-world mutation without approval or an explicitly configured low-risk auto-approval policy.
- No customer-facing factual claim without evidence or clear inference labeling.
- No passive dashboard that does not help an operator decide or act.
- No central literacy promotion without admin review.
- No cross-tenant learning with tenant identifiers or PII.
- No pricing or AI usage workflow without budget estimate, cap handling, and usage visibility.
- No fixed MarkOS public price point without Pricing Engine evidence and approval.
- No SaaS Suite legal billing, customer-facing support response, save offer, discount, plan change, or processor mutation without the relevant approval/compliance gate.
- No SaaS growth mutation without the relevant approval gate: in-app campaign activation, external outreach, referral/affiliate reward, PR pitch, analyst outreach, review request, event sequence, experiment launch, expansion ask, or pricing-sensitive prompt.
- No contract ID reuse when existing codebase contracts already occupy an incoming ID range.
- No `.markos-local/` protocol writes during product/protocol updates; it remains tenant override space.

## Done Criteria for the Foundation Loop

The foundation loop is real when a design partner can:

- Complete onboarding in under 30 minutes.
- Connect at least GA4 and GSC or equivalent live data sources.
- Receive a live-data wow moment within 30 minutes.
- Approve at least one artifact within 48 hours.
- See each agent output as a task or approval.
- Trace every published claim to evidence.
- See run-level cost and budget impact.
- See pricing-sensitive work marked with Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- For SaaS tenants, see subscription, billing, churn, support, product usage, and revenue intelligence routed into tasks and approvals.
- For SaaS growth tenants, see growth-mode context and active growth modules create tasks, approvals, experiments, or learnings instead of passive charts.
- Publish or schedule an approved artifact.
- Review a weekly performance narrative tied to pipeline impact.
- Keep the loop reliable for 7 consecutive days.

## Related

- [[Home]]
- [[North Star]]
- [[Key Decisions]]
- [[MarkOS v2 Blueprint Intake]]
- [[MarkOS v2 GSD Master Work Plan]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[MarkOS v2 Operating Loop Spec]]
- [[SaaS Suite Canon]]
- [[SaaS Marketing OS Strategy Canon]]
- [[MarkOS Canon]]
- [[Target ICP]]
- [[Marketing Literacy]]
