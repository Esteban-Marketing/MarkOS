---
date: 2026-04-16
description: "Registry of all 39 MarkOS codebase agents — token IDs, roles, inputs, outputs, tier, literacy references. The operator-facing map of who does what."
tags:
  - brain
  - agents
  - registry
  - markos
---

# Agent Registry

> Every MarkOS agent is addressable by `TOKEN_ID` in the form `MARKOS-AGT-<DOMAIN>-<NN>`. This registry is the operator-facing map. Canonical implementation source: `.agent/markos/MARKOS-INDEX.md`. The v2 target architecture is defined by [[Marketing Operating System Foundation]] and [[MarkOS v2 Operating Loop Spec]].

## v2 Registry Direction

The current codebase registry is not the final v2 network. The incoming blueprint describes an 80+ agent vision, but the launch rule is to ship one reliable operating loop before expanding breadth.

Planning stance:

- Keep the current `.agent/markos/MARKOS-INDEX.md` as implementation truth until a migration phase explicitly changes it.
- Treat v2 domains as the target taxonomy: STR, RES, AUD, CONT, SOC, PAID, LG, ANA, OPS, and LIT.
- Add PRC as the Pricing Engine tier; see [[Pricing Engine Canon]].
- Add SAS as the SaaS Suite tier; see [[SaaS Suite Canon]].
- Add PLG, EXP, ABM, VRL, IAM, CMT, EVT, XP, PR, PRT, DEV, and REV as future SaaS Marketing OS growth tiers; see [[SaaS Marketing OS Strategy Canon]].
- Resolve `CNT` vs `CONT` before renaming content agents.
- Do not create anonymous agents. Every new capability gets a stable token, input contract, output contract, approval posture, literacy refs, and cost visibility.
- Add agent types only when they close the foundation loop in [[MarkOS v2 Operating Loop Spec]].

## Phase 1 v2 Agent Responsibilities

Phase 1 needs a compact loop, not the full 80-agent system:

| Domain | Needed responsibilities |
|---|---|
| Strategy | intent intake, campaign/content thesis, plan decomposition |
| Research | source quality scoring, evidence map, citation/context package |
| Audit | SEO audit, analytics audit, voice/claim/compliance gate |
| Content | content strategy, brief, draft, edit, repurpose |
| Social | listener, classifier, response drafter, escalation router |
| Revenue | lead scoring, pipeline narrative, attribution explanation |
| Analytics | anomaly detection, performance monitor, weekly narrative |
| Ops | task synthesis, approval coordination, budget monitor, connector recovery |
| Literacy | tenant overlay candidate, freshness check, central update candidate |
| Pricing | cost model, competitive price watch, pricing recommendations, price tests, pricing page optimization |
| SaaS Suite | subscription lifecycle, billing compliance, churn risk, support intelligence, product usage, revenue intelligence |
| SaaS Growth | PLG activation, PQL scoring, upgrade triggers, ABM, expansion, viral/referral, in-app, community, events, PR, experiments, partnerships, developer marketing, revenue alignment |

## Tiered view

### Strategy tier

| Agent | File | Role |
|---|---|---|
| `MARKOS-AGT-STR-01` **Strategist** | `.agent/markos/agents/markos-strategist.md` | turns MIR + MSP into a campaign thesis with neuro architecture |
| `MARKOS-AGT-STR-02` **Planner** | `.agent/markos/agents/markos-planner.md` | decomposes thesis into phases + plans |
| `MARKOS-AGT-EXE-03` **Plan Checker** | `.agent/markos/agents/markos-plan-checker.md` | validates plans against gates + neuro schema before execution |
| `MARKOS-AGT-STR-XX` **Campaign Architect** | `.agent/markos/agents/markos-campaign-architect.md` | composes cross-channel campaign structure |
| `MARKOS-AGT-STR-XX` **Creative Brief** | `.agent/markos/agents/markos-creative-brief.md` | drafts creative briefs per [[Brand System Canon]] |
| `MARKOS-AGT-STR-XX` **CRO Hypothesis** | `.agent/markos/agents/markos-cro-hypothesis.md` | writes testable CRO hypotheses |
| `MARKOS-AGT-STR-XX` **Onboarder** | `.agent/markos/agents/markos-onboarder.md` | Phase 0 intake → MIR/MSP seed |

### Audience tier

| Agent | File | Role |
|---|---|---|
| `MARKOS-AGT-AUD-XX` **Audience Intel** | `.agent/markos/agents/markos-audience-intel.md` | builds audience archetypes |
| **Market Researcher** | `.agent/markos/agents/markos-market-researcher.md` | market-level intelligence |
| **Market Scanner** | `.agent/markos/agents/markos-market-scanner.md` | trend + signal scanning |
| **Competitive Monitor** | `.agent/markos/agents/markos-competitive-monitor.md` | competitor tracking → positioning updates |
| **Behavioral Scraper** | `.agent/markos/agents/markos-behavioral-scraper.md` | behavioral signals from public surfaces |
| **Researcher** | `.agent/markos/agents/markos-researcher.md` | general research orchestrator |

### Content / Creator tier

| Agent | File | Role |
|---|---|---|
| **Content Creator** | `.agent/markos/agents/markos-content-creator.md` | long-form content production |
| **Content Brief** | `.agent/markos/agents/markos-content-brief.md` | content brief authoring |
| **Copy Drafter** | `.agent/markos/agents/markos-copy-drafter.md` | short-form copy production (ads, subject lines, CTAs) |
| **Social Drafter** | `.agent/markos/agents/markos-social-drafter.md` | platform-native social posts |
| **Email Sequence** | `.agent/markos/agents/markos-email-sequence.md` | multi-step lifecycle flows |
| **SEO Planner** | `.agent/markos/agents/markos-seo-planner.md` | SEO plans + GEO/LLMO guidance |

### Analytics tier

| Agent | File | Role |
|---|---|---|
| **Analyst** | `.agent/markos/agents/markos-analyst.md` | narrative analytics |
| **Data Scientist** | `.agent/markos/agents/markos-data-scientist.md` | quantitative modelling (MMM, incrementality, clustering) |
| **Funnel Analyst** | `.agent/markos/agents/markos-funnel-analyst.md` | funnel step diagnostics |
| **Performance Monitor** | `.agent/markos/agents/markos-performance-monitor.md` | live performance tracking |
| **Report Compiler** | `.agent/markos/agents/markos-report-compiler.md` | periodic rollup reports |
| **Gap Auditor** | `.agent/markos/agents/markos-gap-auditor.md` | diagnoses pain-point → literacy gap |

### Operations tier

| Agent | File | Role |
|---|---|---|
| `MARKOS-AGT-EXE-01` **Executor** | `.agent/markos/agents/markos-executor.md` | runs plans as atomic tasks with approval gates |
| **Verifier** | `.agent/markos/agents/markos-verifier.md` | post-phase verification |
| **Task Synthesizer** | `.agent/markos/agents/markos-task-synthesizer.md` | aggregates outputs into ticketable tasks |
| **Automation Architect** | `.agent/markos/agents/markos-automation-architect.md` | wiring of triggers + workflows |
| **Calendar Builder** | `.agent/markos/agents/markos-calendar-builder.md` | content + campaign calendar |
| **Budget Monitor** | `.agent/markos/agents/markos-budget-monitor.md` | spend pacing + guardrails |
| **Lead Scorer** | `.agent/markos/agents/markos-lead-scorer.md` | lead prioritization |
| **Tracking Spec** | `.agent/markos/agents/markos-tracking-spec.md` | tracking plan generator |
| **UTM Architect** | `.agent/markos/agents/markos-utm-architect.md` | UTM + naming conventions |
| **Linear Manager** | `.agent/markos/agents/markos-linear-manager.md` | Linear.app issue sync |
| **Context Loader** | `.agent/markos/agents/markos-context-loader.md` | loads MIR + MSP + literacy into agent window |
| **Librarian** | `.agent/markos/agents/markos-librarian.md` | literacy + vault maintenance |

### Specialty tier

| Agent | File | Role |
|---|---|---|
| `MARKOS-AGT-NEU-01` **Neuro Auditor** | `.agent/markos/agents/markos-neuro-auditor.md` | validates B01–B10 triggers; enforces `<neuro_spec>` block |
| **Auditor** | `.agent/markos/agents/markos-auditor.md` | general audit of campaigns + claims |

### Pricing tier (v2 target)

The PRC tier is target architecture from [[Pricing Engine Canon]]. Protocol discovery now starts at `.agent/markos/references/pricing-engine.md`, while runnable PRC agent files remain planned for Phase 205.

| Agent | Role |
|---|---|
| `MARKOS-AGT-PRC-01` **SaaS Pricing Strategist** | SaaS tier structure, value metric analysis, annual/monthly optimization, freemium/trial evaluation |
| `MARKOS-AGT-PRC-02` **eCommerce Pricing Monitor** | SKU-level competitor pricing, bundles, promos, margin-aware recommendations |
| `MARKOS-AGT-PRC-03` **Services Pricing Strategist** | market rate benchmarking, value-based pricing, productized services |
| `MARKOS-AGT-PRC-04` **Pricing Recommendation Agent** | synthesizes all pricing data layers into PricingRecommendation options |
| `MARKOS-AGT-PRC-05` **Pricing Page Optimizer** | pricing page copy, structure, social proof, and A/B test briefs |
| `MARKOS-AGT-PRC-06` **Competitive Price Watcher** | pricing crawler orchestration, change detection, alerts, weekly digest |

### SaaS Suite tier (v2 target)

The SAS tier is target architecture from [[SaaS Suite Canon]]. Protocol discovery starts at `.agent/markos/references/saas-suite.md`; planned agent definition files live under `.agent/markos/agents/markos-saas-*.md`, while runnable implementation remains planned for Phases 214-217.

| Agent | Role |
|---|---|
| `MARKOS-AGT-SAS-01` **Subscription Lifecycle Manager** | subscription lifecycle actions, renewal state, cancellation/reactivation workflows |
| `MARKOS-AGT-SAS-02` **Revenue Intelligence Analyst** | MRR, ARR, NRR, GRR, churn, expansion, forecast, waterfall |
| `MARKOS-AGT-SAS-03` **Billing Compliance Agent** | invoice compliance, DIAN/US checks, accounting sync issues |
| `MARKOS-AGT-SAS-04` **Churn Risk Assessor** | health score, churn risk, and intervention recommendations |
| `MARKOS-AGT-SAS-05` **Support Intelligence Agent** | ticket triage, suggested responses, KB grounding, support pattern mining |
| `MARKOS-AGT-SAS-06` **Expansion Revenue Scout** | upgrade, add-seat, expansion, and cross-sell opportunities |

### SaaS Marketing OS growth tiers (future v2 target)

The growth tiers are target architecture from [[SaaS Marketing OS Strategy Canon]]. They should remain planning doctrine until GSD assigns contracts, data objects, tests, UI/API/MCP surfaces, cost posture, and approval posture.

| Tier | Agents |
|---|---|
| PLG | `MARKOS-AGT-PLG-01` PLG Strategist, `PLG-02` Activation Analyst, `PLG-03` PQL Scorer, `PLG-04` In-App Campaign Manager, `PLG-05` Upgrade Trigger Engine, `PLG-06` Viral Loop Designer |
| Expansion | `MARKOS-AGT-EXP-01` Expansion Intelligence Agent, `EXP-02` Customer Marketing Manager, `EXP-03` Advocacy Engine |
| ABM | `MARKOS-AGT-ABM-01` ABM Account Intelligence Agent, `ABM-02` ABM Content Personalization Agent, `ABM-03` ABM Orchestration Agent |
| Viral | `MARKOS-AGT-VRL-01` Viral Loop Analyst, `VRL-02` Referral Program Manager |
| In-App | `MARKOS-AGT-IAM-01` In-App Campaign Orchestrator |
| Community | `MARKOS-AGT-CMT-01` Community Strategy Agent, `CMT-02` Community Content Manager, `CMT-03` Community Health Monitor |
| Events | `MARKOS-AGT-EVT-01` Event Strategy Agent, `EVT-02` Event Production Manager, `EVT-03` Event Revenue Attributor |
| Experimentation | `MARKOS-AGT-XP-01` Growth Experiment Strategist, `XP-02` Experiment Analyst |
| PR and Reviews | `MARKOS-AGT-PR-01` PR Intelligence Agent, `PR-02` Press Outreach Manager, `PR-03` Analyst Relations Agent, `PR-04` Review Generation Manager |
| Partnerships | `MARKOS-AGT-PRT-01` Partnership Intelligence Agent, `PRT-02` Affiliate Program Manager, `PRT-03` Integration Marketing Agent |
| Developer Marketing | `MARKOS-AGT-DEV-01` Developer Content Strategist, `DEV-02` Developer Community Manager |
| Revenue Alignment | `MARKOS-AGT-REV-01` Revenue Intelligence Agent, `REV-02` Marketing-Sales Alignment Agent |

## Shared rules

1. Every agent run has an immutable envelope in `markos_agent_runs` + events in `markos_agent_run_events` + side effects in `markos_agent_side_effects`.
2. Every mutation proposed by an agent passes through the F-63A approval package before applying.
3. Every agent references literacy by TOKEN_ID (not file path) via [[MarkOS Protocol]].
4. The Executor (`MARKOS-AGT-EXE-01`) is the only agent authorized to trigger side effects; others produce plans or drafts.
5. The Neuro Auditor is **advisory**, not mandatory — but becomes mandatory when `<neuro_spec>` is declared in a plan.

## How to invoke an agent

MarkOS agents are invoked via skills, not directly. Skill tool resolves to the right agent based on intent:

- Plan a phase → `markos-plan-phase`
- Execute a phase → `markos-execute-phase`
- Discuss a phase → `markos-discuss-phase`
- Verify work → `markos-verify-work`
- Campaign launch → `markos-campaign-launch`
- Neuro audit → `markos-neuro-auditor`

See `.agent/skills/markos-*` for the full list.

## Agent ↔ literacy mapping

| Agent | Primary literacy |
|---|---|
| Strategist · Planner · Campaign Architect | [[Strategy & Positioning]] · [[Frameworks]] · [[Marketing Literacy]] |
| Audience Intel · Researcher · Market Scanner | [[Audience & Segmentation]] · [[Audience Archetype Canon]] |
| Content Creator · Copy Drafter · Social Drafter · Email Sequence | [[Content Marketing]] · [[Brand System Canon]] · [[Communication Guides]] · [[Message Crafting Pipeline]] |
| SEO Planner | [[SEO & Organic Discovery]] · [[Generative Engine Optimization]] · [[Zero-Click Search]] |
| Neuro Auditor | [[Neuro Audit Canon]] |
| Executor · Verifier | [[MarkOS Canon]] |
| Performance Monitor · Analyst · Data Scientist · Report Compiler | [[Data, Analytics & Measurement]] · [[MMM Revival]] · [[Incrementality Testing]] · [[Unified Measurement]] |
| Automation Architect · Tracking Spec · UTM Architect | [[MarTech Stack]] · [[Privacy, Consent & Compliance]] |

## Related

- [[Marketing Operating System Foundation]] - v2 launch loop and agent expansion rule
- [[MarkOS v2 Operating Loop Spec]] - first-loop agent responsibilities and verification gates
- [[SaaS Suite Canon]] - SAS target tier and SaaS tenant-suite doctrine
- [[SaaS Marketing OS Strategy Canon]] - future SaaS growth tiers and mode-specific growth doctrine

- [[MarkOS Canon]] · [[MarkOS Protocol]] · [[MarkOS Codebase Atlas]] · [[Message Crafting Pipeline]] · [[Skills]]
