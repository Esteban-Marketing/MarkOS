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

> Every MarkOS agent is addressable by `TOKEN_ID` in the form `MARKOS-AGT-<DOMAIN>-<NN>`. This registry is the operator-facing map. Canonical source: `.agent/markos/MARKOS-INDEX.md`.

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

- [[MarkOS Canon]] · [[MarkOS Protocol]] · [[MarkOS Codebase Atlas]] · [[Message Crafting Pipeline]] · [[Skills]]
