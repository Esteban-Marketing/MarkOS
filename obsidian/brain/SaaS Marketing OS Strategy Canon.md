---
date: 2026-04-22
status: canonical
description: "Canonical MarkOS SaaS Marketing OS strategy doctrine: B2B/B2C/PLG operating modes, SaaS growth engines, target agent tiers, approval posture, and future GSD translation map."
tags:
  - brain
  - canon
  - markos
  - saas
  - strategy
  - growth
  - v2
aliases:
  - SaaS Marketing OS Strategy Canon
  - MarkOS SaaS Marketing OS
  - SaaS Growth OS
---

# SaaS Marketing OS Strategy Canon

> MarkOS must become the marketing operating system SaaS companies run on. The SaaS Suite gives MarkOS the subscription and revenue runtime; this strategy layer defines the growth engines that make SaaS businesses compound.

## Source

Canonical intake source:

- `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`
- [[MarkOS v2 SaaS Marketing OS Strategy Intake]]
- [[SaaS Suite Canon]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 Operating Loop Spec]]

This canon is a planning and indexing layer only. It does not create executable GSD phase artifacts yet. Translation into GSD should happen in a later prompt after the current foundation, Pricing Engine, and SaaS Suite routes are respected.

## Product Role

Document 17 closes the gap between "MarkOS can operate marketing workflows" and "MarkOS can run the full SaaS growth system."

It adds the growth mechanics that were partial, fragmented, or absent in the previous 00-16 source pack:

- Product-led growth activation, PQL scoring, in-app upgrade triggers, and viral loops.
- B2B account expansion, customer marketing, advocacy, and ABM orchestration.
- B2C referral mechanics, product virality, k-factor modeling, and habit/lifecycle loops.
- In-app marketing coordinated with email, support, CS, and product analytics.
- Community, events, PR/analyst relations, G2/Capterra review generation, partnerships, developer marketing, experimentation, and revenue team alignment.

The build order does not change: first build the core operating loop, then Pricing Engine, then SaaS Suite. This canon specifies the destination after those foundations exist.

## SaaS Operating Modes

The SaaS tenant profile must eventually distinguish these operating modes:

| Mode | Meaning | Activated growth modules |
|---|---|---|
| `b2b` | Committee sale, longer cycle, pipeline and NRR focus | Demo Engine, ABM, B2B lead gen, Account Expansion, Revenue Team Alignment, PR/Analyst Relations, Partnerships |
| `b2c` | Individual buyer, fast activation, retention and virality focus | Viral Loop Engine, Referral Program, In-App Marketing, Behavioral Segmentation, App Store Optimization where relevant, Community |
| `plg_b2b` | Self-serve product adoption with enterprise expansion | PLG Engine, PQL Scoring, In-App Upgrade Triggers, ABM for PQL conversion, Account Expansion, Community, Developer Marketing where relevant |
| `plg_b2c` | Self-serve consumer or creator product | PLG Engine, Viral Loops, Referral, In-App Marketing, Behavioral Segmentation, Community, Growth Experimentation |
| `b2b2c` | B2B buyer with B2C end users | Requires the broadest routing: B2B acquisition plus B2C activation and retention |

This mode should not be treated as cosmetic segmentation. It changes active modules, agents, metrics, playbooks, approval gates, and UI surfaces.

## Growth Engine Modules

| Module | Required capability | Primary doctrine links |
|---|---|---|
| PLG Engine | activation definitions, milestone funnels, PQL score, upgrade triggers, product usage interventions | [[Product-Led Growth]], [[Product-Qualified Leads]], [[SaaS Suite Canon]] |
| Account Expansion | seat expansion, plan upgrades, add-on adoption, customer marketing, advocacy pipeline | [[Marketing Ops & RevOps]], [[SaaS Suite Canon]] |
| ABM Engine | tier 1/2/3 account strategy, buying committee map, account intelligence, account-personalized content | [[Account-Based Marketing]], [[Buying Committee Mapping]] |
| Viral and Referral Engine | k-factor, referral program, incentive quality controls, powered-by moments, embeds, collaborative invites | [[Product-Led Growth]], [[Community-Led Growth]] |
| In-App Marketing | event/page/segment/time triggers, tooltip/banner/modal/slideout/checklist/hotspot formats, email suppression and CS coordination | [[Email & Lifecycle]], [[Conversion & CRO]] |
| Community Engine | community profile, launch maturity, health score, peer support, UGC, product feedback, community-to-health signals | [[Social & Community]], [[Community-Led Growth]] |
| Event Marketing | webinars, summits, launches, customer events, conferences, registration, reminders, replay, pipeline attribution | [[Events & Field Marketing]], [[Event ROI Modeling]] |
| PR and Analyst Relations | G2/Capterra management, press intelligence, journalist profiles, analyst relationship building, coverage tracking | [[PR & Comms]], [[Analyst Relations]] |
| Growth Experimentation | experiment registry, ICE backlog, guardrails, learnings, rollout/reject/extend/redesign decisions | [[Experimentation]], [[Experiment Design 101]] |
| Partnership Ecosystem | technology partnerships, referral partners, affiliate program, co-marketing, reseller/white-label routes | [[MarTech Stack]], [[Pricing Engine Canon]] |
| Developer Marketing | docs-as-product, API examples, changelog discipline, starter kits, developer community | [[Documentation-as-Marketing]], [[Marketing Literacy]] |
| Revenue Team Alignment | shared MQL/SQL/PQL definitions, SLA, feedback loop, win/loss, pipeline target, marketing-sales-CS one reality | [[Marketing Ops & RevOps]], [[Lead Lifecycle & SLAs]] |

## Core Objects

Future implementation should research durable objects for:

| Object | Purpose |
|---|---|
| `SaaSGrowthProfile` | Tenant SaaS mode, active growth modules, activation posture, GTM motion, developer-audience flags |
| `ActivationDefinition` | Operator-defined aha moment, milestone funnel, baseline activation metrics |
| `PQLScore` | Product behavior plus intent and fit scoring with recommended action/channel/timing |
| `UpgradeTrigger` | Product event or usage threshold that creates a timely, governed conversion prompt |
| `CustomerMarketingProgram` | Expansion, advocacy, retention, education, beta, advisory, review, or co-marketing program |
| `ABMAccountPackage` | Account intelligence, buying committee, strategic signals, messaging, engagement, ABM stage |
| `ViralLoopMetrics` | K-factor, invite rate, conversion rate, viral channel breakdown, referral performance |
| `ReferralProgram` | Incentives, attribution window, share tools, fraud prevention, dashboard visibility |
| `InAppCampaign` | Triggered in-product campaign with frequency cap, suppression logic, goal, success event, and results |
| `CommunityProfile` | Community type, platform, goals, health score, launch status, and URL |
| `MarketingEvent` | Event planning, promotion plan, speakers, reminders, replay, no-show/attendee sequence, pipeline attribution |
| `MarketingExperiment` | Hypothesis, surface, variants, sample, guardrails, decision, and documented learning |
| `AffiliateProgram` | Commission, cookie window, approval, prohibited methods, tracking provider, payouts, performance |
| `RevenueTeamConfig` | Sales/CS model, MQL/SQL/PQL routing, SLA, attribution, shared targets, feedback cadence |

All tenant-scoped growth objects require RLS, auditability, deletion/export coverage, and approval gates before customer-facing or external-world mutations.

## Target Agent Tiers

Document 17 adds 28 target agents across new growth tiers. These are not runnable implementation truth yet; they are target registry requirements for future GSD translation.

| Tier | Tokens | Agents |
|---|---|---|
| PLG | `MARKOS-AGT-PLG-*` | PLG Strategist, Activation Analyst, PQL Scorer, In-App Campaign Manager, Upgrade Trigger Engine, Viral Loop Designer |
| Expansion | `MARKOS-AGT-EXP-*` | Expansion Intelligence Agent, Customer Marketing Manager, Advocacy Engine |
| ABM | `MARKOS-AGT-ABM-*` | ABM Account Intelligence Agent, ABM Content Personalization Agent, ABM Orchestration Agent |
| Viral | `MARKOS-AGT-VRL-*` | Viral Loop Analyst, Referral Program Manager |
| In-App | `MARKOS-AGT-IAM-*` | In-App Campaign Orchestrator |
| Community | `MARKOS-AGT-CMT-*` | Community Strategy Agent, Community Content Manager, Community Health Monitor |
| Events | `MARKOS-AGT-EVT-*` | Event Strategy Agent, Event Production Manager, Event Revenue Attributor |
| Growth/Revenue | `XP`, `PR`, `PRT`, `DEV`, `REV` | Experiment Strategist/Analyst, PR/Analyst/Review agents, Partnership/Affiliate/Integration agents, Developer Content/Community agents, Revenue Intelligence/Alignment agents |

Registry rule: do not add these as active implementation agents until a GSD phase assigns stable input contracts, output contracts, approval posture, costs, tests, and UI/API/MCP surfaces.

## Pricing Engine Relationship

This strategy layer increases Pricing Engine importance:

- PLG upgrade prompts, usage-limit prompts, feature gates, annual-plan prompts, trial extensions, and save offers must use [[Pricing Engine Canon]].
- Referral rewards, affiliate commissions, discount ladders, and incentive experiments require cost/margin context.
- G2/Capterra pricing profile sync, pricing-page experiments, and pricing copy must use approved PricingRecommendation context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Pricing-sensitive in-app, email, event, ABM, partnership, and sales content must query Pricing Engine MCP tools before publication.

## SaaS Suite Relationship

The SaaS Suite supplies the operational facts; this canon turns those facts into growth motion:

- Product usage feeds activation, PQL scoring, upgrade triggers, community health, and churn prevention.
- MRR/ARR/NRR/GRR, expansion, contraction, and cohort data feed account expansion and revenue alignment.
- Support and CSAT/NPS signals feed advocacy, review generation, churn risk, and community health.
- Subscription lifecycle, billing friction, and failed payment state influence lifecycle, save, and dunning messaging.

## Approval and Safety

Approval is required by default for:

- In-app campaign activation that changes customer experience.
- Upgrade prompts, save offers, discounts, feature unlocks, and pricing-sensitive nudges.
- Referral rewards, affiliate commissions, and partner payouts.
- Customer-facing support, CS, expansion, or advocacy outreach.
- Public PR pitches, analyst outreach, press releases, G2/Capterra responses, and review requests.
- Event invitations and post-event sales sequences when sent externally.
- Experiment launch where the surface affects pricing, billing, legal claims, customer data, or customer-facing UX.

Read-only monitoring, scoring, and recommendation drafts can run before approval if they remain tenant-scoped, auditable, and cost-controlled.

## Codebase Change Map

Future app work likely needs these changes:

| Layer | Change needed |
|---|---|
| Tenant profile | Add SaaS mode, sales model, PLG flags, developer audience flags, active growth modules |
| Schema | Add activation/PQL/ABM/referral/in-app/community/event/experiment/partner/revenue-team records, or map them into existing CRM/task/agent substrates |
| Agent runtime | Register target tiers only after AgentRun v2, task, approval, and cost substrate are ready |
| Connectors | Reuse PostHog/Mixpanel/product analytics, CRM, support, billing, Stripe, G2/Capterra, event, community, PR/news, affiliate, and partner data sources |
| UI | Add activation/PQL, ABM, customer marketing, in-app, community, events, experiments, partnerships, reviews, and revenue alignment surfaces only when they create tasks or approvals |
| API/MCP | Reserve fresh contracts for SaaS growth objects and expose read tools before mutation tools |
| Governance | Extend approval gates, audit logs, consent checks, evidence maps, and rollback plans to growth motions |
| Literacy | Route each module to the corresponding Marketing Literacy discipline and feed learnings through admin-reviewed literacy update candidates |

## Future GSD Translation

Do not disrupt the current sequence:

1. Phase 204: CLI GA plus v2 guardrails.
2. Phase 205: Pricing Engine foundation.
3. Phase 206: SOC2 v2 controls.
4. Phases 207-213: core v2 operating loop.
5. Phases 214-217: SaaS Suite foundation.

After that, translate this canon into candidate GSD workstreams:

- SaaS mode and growth profile foundation.
- PLG activation, PQL, upgrade triggers, and in-app orchestration.
- B2B expansion, customer marketing, advocacy, and ABM.
- B2C viral/referral and community engine.
- Events, PR/analyst/G2, partnerships, developer marketing, and revenue alignment.
- Cross-module growth experimentation framework.

## Acceptance Gates

This strategy layer is ready for implementation planning when:

- The vault links source doc 17 to canon, traceability, operating loop, agent registry, and codebase gap docs.
- PageIndex includes the raw source, intake note, and canon.
- The GSD translation prompt has explicit permission to create or update `.planning` artifacts.
- Core AgentRun, task, approval, evidence, Pricing Engine, and SaaS Suite dependencies are either shipped or explicitly planned.
- Each future growth module has a clear owner, data source, object model, approval posture, and proof metric.

## Related

- [[Marketing Operating System Foundation]]
- [[MarkOS v2 SaaS Marketing OS Strategy Intake]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[MarkOS v2 Operating Loop Spec]]
- [[SaaS Suite Canon]]
- [[Pricing Engine Canon]]
- [[Agent Registry]]
- [[Marketing Literacy]]
