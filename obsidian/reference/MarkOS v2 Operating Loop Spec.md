---
date: 2026-04-22
status: canonical
description: "Functional reference spec for the MarkOS v2 operating loop: data objects, workflow steps, UI surfaces, agent phases, and verification gates."
tags:
  - reference
  - spec
  - markos
  - operating-loop
  - v2
aliases:
  - MarkOS v2 Operating Loop Spec
  - Operating Loop Spec
---

# MarkOS v2 Operating Loop Spec

> Functional spec for the first complete MarkOS v2 loop. Use this as the planning bridge between [[Marketing Operating System Foundation]], [[MarkOS v2 Blueprint Intake]], and future GSD phases.

For GSD discuss and research preparation, pair this spec with [[MarkOS v2 GSD Master Work Plan]] and [[MarkOS v2 Requirements Traceability Matrix]].

## Scope

This spec defines the minimum operating loop that proves MarkOS is a Marketing Operating System:

`onboard -> connect -> audit -> plan -> brief -> draft -> audit -> approve -> dispatch -> measure -> learn`

It does not require the full 80-agent network. It requires a reliable chain, clear UI, data provenance, approval gates, and performance learning.

## Core Data Objects

| Object | Required purpose | Notes |
|---|---|---|
| `AgentRun` | Immutable record of an agent invocation | tenant, token, trigger, priority, state, input, output, cost, model, tokens, retries, errors |
| `AgentRunEvent` | Timeline event for a run | queued, started, tool call, blocked, approval requested, completed, failed |
| `AgentChain` | DAG definition for multi-agent work | dependencies, concurrency, timeout, cancellation, pause rules |
| `ApprovalGate` | Human decision boundary | preview, approve, edit, reject, reason, rollback plan, owner, due date |
| `Task` | Unified operator work item | every agent output, escalation, approval, connector failure, and follow-up becomes a task |
| `ConnectorInstall` | Tenant data source connection | auth type, scopes, encrypted credentials, status, sync cadence, retention |
| `EvidenceMap` | Claims and source linkage | citation, source quality score, freshness, claim TTL, known gaps |
| `ArtifactPerformanceLog` | Expected and actual artifact outcomes | channel, format, pain tag, funnel stage, prediction, results, attribution evidence |
| `PricingKnowledgeObject` | Versioned pricing intelligence | own/competitor/market/strategic pricing data, source quality, extraction method, confidence, price-history diff |
| `TenantCostModel` | Margin-aware pricing substrate | SaaS/eCommerce/Services cost model, pricing floor, target margin, confidence |
| `PricingRecommendation` | Operator-facing pricing decision | options, projected impact, risk, evidence, assumptions, test design, approval status |
| `PriceTest` | Approved pricing experiment | control/test config, sample size, duration, metrics, stop conditions, results, rollout decision |
| `SaaSSuiteActivation` | SaaS tenant-suite configuration | business_type=saas, enabled modules, countries, processors, accounting, legal billing, autonomy posture |
| `SaaSPlan` | SaaS operational plan catalog | Pricing Engine-owned prices/packages when unresolved, features, value metric, cadence, country availability |
| `SaaSSubscription` | SaaS customer subscription lifecycle | trial, active, past_due, paused, canceled, reactivated, plan, quantity, processor IDs, lifecycle events |
| `SaaSInvoice` | SaaS invoice and legal billing record | processor status, taxes, credits, accounting sync, US/Colombia compliance fields |
| `SaaSHealthScore` | SaaS account health and churn risk | usage, support, billing, engagement, relationship depth, confidence, trend, intervention |
| `SaaSSupportTicket` | SaaS support intelligence object | ticket source, SLA, topic, sentiment, risk, KB grounding, suggested response, approval state |
| `SaaSMRRSnapshot` | SaaS revenue intelligence record | MRR, ARR, NRR, GRR, churn, expansion, contraction, cohort, forecast |
| `SaaSGrowthProfile` | SaaS growth-mode configuration | `b2b`, `b2c`, `b2b2c`, `plg_b2b`, `plg_b2c`, active modules, sales/CS/developer posture |
| `ActivationDefinition` | PLG activation contract | aha moment, event name, milestone funnel, baseline activation metrics |
| `PQLScore` | Product-qualified lead score | usage, intent, fit, recommended action, timing, channel |
| `ABMAccountPackage` | B2B account intelligence package | account tier, company profile, buying committee, strategic signals, messaging, engagement |
| `CustomerMarketingProgram` | Expansion, advocacy, retention, education, review, beta, advisory, or co-marketing program | target segment, activation criteria, goal, status, enrolled count, conversion |
| `ReferralProgram` | B2C/B2B referral mechanics | rewards, attribution window, share tools, fraud controls, performance |
| `InAppCampaign` | Triggered in-product campaign | segment, trigger, format, frequency cap, email/CS suppression, goal, success event |
| `CommunityProfile` | Community-led growth state | type, platform, goals, member count, monthly active members, health score, launch status |
| `MarketingEvent` | Event marketing workflow | type, date, platform, promotion plan, reminders, replay/no-show/attendee sequences, attribution |
| `MarketingExperiment` | Growth experiment registry | hypothesis, surface, variants, sample, metrics, guardrails, result, decision, learning |
| `AffiliateProgram` | Partnership/affiliate program | commission, cookie window, tiers, approval, tracking, payout, performance |
| `RevenueTeamConfig` | Marketing-sales-CS alignment | sales model, MQL/SQL/PQL definitions, SLA, feedback cadence, shared pipeline target |
| `TenantOverlay` | Tenant-specific learned preference or rule | overrides central literacy when confidence is sufficient |
| `LiteracyUpdateCandidate` | Proposed central literacy change | admin-reviewed before promotion |

Incoming docs propose new F-contract IDs in a range already occupied by the current codebase. Any implementation phase must allocate fresh contract IDs before schema or API work begins.

## Priority and Notification Rules

| Tier | Meaning | Required behavior |
|---|---|---|
| P0 | crisis, security, compliance, live spend leak | bypass normal queue, alert immediately, cap to prevent starvation |
| P1 | revenue-critical or blocked approval | high-priority task and notification |
| P2 | normal scheduled marketing work | standard queue and task board visibility |
| P3 | background analysis | defer under load |
| P4 | enrichment or low-risk maintenance | cheapest viable model and low priority |

Notification levels:

| Level | Meaning | Product surface |
|---|---|---|
| L0 | emergency | immediate push/email/in-app and task escalation |
| L1 | urgent | in-app plus configured channel notification |
| L2 | normal | task board and morning brief |
| L3 | informational | activity feed and digest |

## Approval Gate Contract

Approval is required by default for:

- Content publish.
- Social post or reply.
- DM automation response.
- Email send or sequence activation.
- Ad campaign creation, pause, edit, or budget change.
- CRM mutation.
- Data export.
- Strategy activation.
- Central literacy promotion.
- Price change, packaging change, price-test activation, public pricing page edit, or discount strategy.
- SaaS Suite lifecycle mutation, legal invoice correction, refund/credit/write-off, customer-facing support reply, churn save offer, or retention/expansion outreach.
- SaaS growth mutation: in-app campaign activation, upgrade prompt, referral or affiliate reward, partner payout, event send, PR pitch, analyst outreach, review request, ABM outreach, customer advocacy ask, developer-community outreach, experiment launch, or revenue-team handoff with external effects.

Approval UI must show:

- Rendered artifact preview.
- Source agent and chain.
- Campaign, audience, pain tag, and target funnel stage.
- Brand voice score and score dimensions.
- Claim/evidence status.
- Compliance status.
- Estimated cost and budget impact when relevant.
- Approve, edit, reject, and request revision controls.
- Rejection reason capture.

Auto-approval is a later earned-autonomy feature. It requires low-risk action family, tenant opt-in, voice/compliance pass, budget checks, and a rollback story.

## Onboarding and Activation

Target flow:

1. Signup starts a 14-day full-access trial with an AI budget cap and no credit card.
2. Intent capture chooses initial agent chain, connector recommendations, and activation email sequence.
3. Brand Pack Wizard completes identity, personality, positioning, voice, visual style, and claim library in 8-12 minutes.
4. Connector step recommends no more than 3 sources with value-unlock copy.
5. First connector should be live in under 10 minutes.
6. First wow moment should appear within 30 minutes.
7. Activation requires wow moment plus at least one approved artifact.

Targets:

- Onboarding under 30 minutes.
- Brand pack completion over 85%.
- First artifact approval under 48 hours.
- Day-7 retention: 3 opens or meaningful task interactions.
- Day-14 retention: at least one published artifact.

## Phase 1 Agent Set

The v2 blueprint warns against building the full 80-agent network first. The first loop needs a compact set that covers strategy, data, content, social, and operations.

| Domain | Phase 1 responsibilities |
|---|---|
| Strategy | strategist, planner, campaign/content strategist |
| Research | market research, source quality, evidence map, citation pack |
| Audit | SEO audit, analytics audit, claim/voice/compliance checks |
| Content | brief, draft, edit, repurpose, publish prep |
| Social | listener, classifier, response drafter, escalation router |
| Paid/Revenue | campaign diagnostics, lead scoring, pipeline narrative |
| Analytics | anomaly detection, performance monitor, weekly narrative |
| Ops | task synthesizer, approval coordinator, budget monitor, connector recovery |
| Literacy | freshness scanner, tenant overlay candidate, central update candidate |

Current [[Agent Registry]] entries are the implementation registry. The v2 network is the target taxonomy. Future code edits must create a token migration map before renaming or expanding `.agent/markos/MARKOS-INDEX.md`.

## Content Loop Contract

1. Strategy input includes objective, audience, pain tag, offer, channel, budget, timing, and success target.
2. Brief includes target audience, SEO/GEO intelligence, content architecture, proof requirements, brand constraints, internal links, and performance targets.
3. Draft is channel-native and references the brief.
4. Audit checks voice, claims, research, legal/compliance, channel fit, accessibility, and optional neuro spec.
5. Approval creates a durable decision record.
6. Dispatch writes tracking metadata.
7. Measurement updates the artifact performance log.
8. Learning proposes next tasks, tenant overlay changes, or central literacy candidates.

## Pricing Engine Contract

Pricing-sensitive work must use [[Pricing Engine Canon]].

Required behaviors:

1. Active MarkOS pricing uses `{{MARKOS_PRICING_ENGINE_PENDING}}` until the Pricing Engine creates approved recommendations.
2. Agents writing pricing-sensitive content must query pricing MCP tools or use the placeholder.
3. Pricing recommendations require tenant cost model, competitive matrix, evidence, assumptions, projected impact, risk, and reversibility.
4. Price tests require approval before activation.
5. Competitor pricing monitoring is read-only and can run without approval.
6. Public pricing page changes require approval and claim/evidence review.
7. Pricing Engine tables must be tenant-isolated and preserve pricing history.

## SaaS Suite Contract

SaaS Suite work must use [[SaaS Suite Canon]].

Required behaviors:

1. SaaS Suite activates only for `business_type = saas` tenants through an operator-visible configuration flow.
2. SaaS plans, prices, packages, discounts, save offers, and value metrics use Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}` until approved recommendations exist.
3. Subscription lifecycle changes create tasks and approval gates when they mutate processor, accounting, customer, or legal state.
4. US launch supports Stripe Billing/Tax or equivalent tax posture and QuickBooks sync.
5. Colombia launch supports Mercado Pago where applicable and DIAN electronic invoicing through Siigo/Alegra first unless direct DIAN integration is explicitly researched and approved.
6. Churn intelligence writes explainable health scores with product usage, support, billing, engagement, and relationship dimensions.
7. Support intelligence can draft responses, but customer-facing responses require CS review unless the tenant opts into safe auto-response.
8. Product usage and revenue intelligence create decisions, tasks, or alerts; they are not passive charts.
9. `markos-saas` MCP tools and `/v1/saas/*` APIs must be tenant-scoped, RLS-safe, auditable, and contract-ID fresh.
10. Processor webhooks must use existing webhook engine durability, signing, replay, DLQ, rate-limit, and observability guarantees.

## SaaS Marketing OS Strategy Contract

SaaS growth strategy work must use [[SaaS Marketing OS Strategy Canon]].

Required behaviors:

1. SaaS growth-mode routing is a product contract, not only marketing copy. The system eventually distinguishes `b2b`, `b2c`, `b2b2c`, `plg_b2b`, and `plg_b2c`.
2. Active SaaS growth modules must be configured and visible before their agents or UI surfaces run.
3. PLG work requires an ActivationDefinition, milestone funnel, PQLScore, and upgrade-trigger policy before conversion automation.
4. ABM, expansion, advocacy, event, PR, partnership, developer, and revenue-alignment work must reuse CRM, activity, attribution, task, and approval substrates where possible.
5. In-app campaigns coordinate with email, support, CS, and quiet-hour/frequency caps to avoid duplicate or intrusive messaging.
6. Referral, affiliate, discount, upgrade, save, pricing-page, and G2 pricing workflows query Pricing Engine or use `{{MARKOS_PRICING_ENGINE_PENDING}}`.
7. Growth experiments require hypothesis, primary metric, guardrails, minimum runtime, decision, and documented learning.
8. Community, support, product usage, billing, and revenue signals feed health, advocacy, churn, expansion, and learning loops.
9. Growth modules produce tasks, approvals, experiments, or learnings. Passive dashboards do not satisfy the contract.
10. The 28 target growth agents remain target architecture until GSD assigns contracts, costs, tests, UI/API/MCP surfaces, and approval posture.

## Social Loop Contract

Social is bidirectional and revenue-aware:

1. Listen to official APIs and approved sources.
2. Normalize each inbound item into a social signal.
3. Classify sentiment, intent, topic, CRM match, author influence, spam risk, support risk, and purchase signal.
4. Route to response draft, escalation, CRM task, opportunity, or no-action archive.
5. Require human approval for public replies and DMs unless explicitly configured otherwise.
6. Attribute social influence through UTMs, CRM movement, pipeline stage changes, and budget feedback.
7. Pause automation on crisis triggers.

No unauthorized scraping. Identified social data is personal data and must follow privacy and consent rules.

## Learning Loop Contract

Every artifact writes:

- Intended audience and pain tag.
- Channel and format.
- Funnel stage.
- Brand score.
- Claim/evidence summary.
- Expected outcome envelope.
- Actual performance metrics.
- Attribution evidence.
- Lessons learned.

Tenant overlays may override central literacy only when confidence is sufficient. Central literacy promotion requires anonymization, cross-tenant consistency, sample-size confidence, and admin review.

## Verification Gates

A GSD phase touching this loop should not close unless the relevant gates pass:

- Agent run state is observable and replayable enough for support.
- Every external-world action has an approval gate or documented low-risk auto-approval rule.
- Run-level cost estimates and actual costs are visible.
- Connector failure creates a recovery task and pauses dependent work.
- Voice score average for shipped agent outputs is at least 82%.
- Test tenants run the shipped loop for 7 consecutive days without silent failure.
- Research claims cite evidence or clearly label inference.
- Artifact performance updates are written after dispatch.
- Cross-tenant learning has no tenant identifiers or PII.
- SaaS Suite activation is gated by `business_type = saas` and explicit module configuration.
- SaaS legal billing validates country-specific compliance before invoice issuance or correction.
- SaaS support replies, save offers, discounts, and lifecycle mutations are approval-gated by default.
- SaaS health, support, product usage, and revenue intelligence produce tasks or decisions rather than passive dashboards.
- SaaS growth modules are gated by active SaaS mode/module configuration and create tasks, approvals, experiments, or learnings.
- SaaS growth external actions, in-app activations, referral/affiliate payouts, PR/review outreach, experiments, discounts, and expansion asks are approval-gated by default.
- PageIndex and vault docs link back to this spec after changes.

## Related

- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Blueprint Intake]]
- [[MarkOS v2 GSD Master Work Plan]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[Pricing Engine Canon]]
- [[SaaS Suite Canon]]
- [[SaaS Marketing OS Strategy Canon]]
- [[MarkOS v2 Pricing Engine Intake]]
- [[MarkOS Canon]]
- [[Agent Registry]]
- [[MarkOS Protocol]]
- [[Contracts Registry]]
- [[Database Schema]]
- [[Core Lib]]
- [[10-HUMAN-INTERFACE-LAYER|Human Interface Layer]]
