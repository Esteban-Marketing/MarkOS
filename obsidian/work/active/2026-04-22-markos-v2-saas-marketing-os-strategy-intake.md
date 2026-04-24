---
date: 2026-04-22
status: active
quarter: 2026-Q2
description: "Distilled intake for incoming document 17: Complete SaaS Marketing Operating System strategy, B2B/B2C/PLG mode routing, growth modules, target agents, and codebase implications."
tags:
  - work
  - active
  - intake
  - markos
  - saas
  - strategy
  - growth
  - incoming-v2
aliases:
  - MarkOS v2 SaaS Marketing OS Strategy Intake
---

# MarkOS v2 SaaS Marketing OS Strategy Intake

## Purpose

This note ingests `17-SAAS-MARKETING-OS-STRATEGY.md` into the vault as planning doctrine. It is meant to be indexed by Obsidian Mind and PageIndex, then translated into GSD artifacts only in a later prompt.

This intake does not create implementation phases yet. Its job is to make the vault coherent about what changed.

## Source File

- Raw source: `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`
- Canon owner: [[SaaS Marketing OS Strategy Canon]]
- Depends on: [[Marketing Operating System Foundation]], [[Pricing Engine Canon]], [[SaaS Suite Canon]], [[MarkOS v2 Operating Loop Spec]], [[MarkOS v2 Requirements Traceability Matrix]]

## Executive Distillation

Document 17 says the 00-16 pack is strong on acquisition, operations, SaaS billing/compliance, Pricing Engine, research, and analytics, but incomplete in the SaaS compounding layer.

The missing layer is the set of growth mechanics that connect acquisition to retention and expansion:

- PLG activation and PQL scoring.
- B2B expansion, customer marketing, advocacy, and ABM.
- B2C viral loops, referral systems, and habit/retention mechanics.
- In-app marketing coordinated with email and CS.
- Community, events, PR/analyst relations, partnerships, developer marketing, experimentation, and revenue alignment.

The strategic conclusion is explicit: the build order stays the same, but the destination is now fully specified.

## What Changed

### New tenant routing requirement

SaaS tenants eventually need a `SaaSModel` or equivalent growth-mode field:

- `b2b`
- `b2c`
- `b2b2c`
- `plg_b2b`
- `plg_b2c`

This field should drive active modules, metrics, agents, playbooks, UI, and approval posture.

### New growth module families

| Family | New requirement |
|---|---|
| PLG | Activation definition, milestone funnel, PQL scoring, upgrade triggers, in-app conversion prompts |
| Expansion | Seat expansion, plan upgrade, add-on adoption, customer marketing, advocacy |
| ABM | Tier 1/2/3 strategy, account intelligence, buying committee, account-personalized content |
| Viral and Referral | K-factor tracking, referral incentives, fraud prevention, powered-by/share/collaboration loops |
| In-App | Triggered tooltips, banners, modals, slideouts, checklists, hotspots, announcements with email suppression |
| Community | Community profile, health score, launch stages, peer support, feedback, UGC, health-score integration |
| Events | Event strategy, production, reminders, replay, no-show/attendee sequences, pipeline attribution |
| PR and Reviews | G2/Capterra ownership, press and analyst intelligence, review generation, coverage tracking |
| Experimentation | Experiment registry, ICE backlog, guardrails, decisions, documented learnings |
| Partnerships | Technology partnerships, referral partners, affiliates, co-marketing, reseller/white-label |
| Developer Marketing | Docs-as-product, examples, starter kits, changelog, developer community |
| Revenue Alignment | MQL/SQL/PQL definitions, SLA, sales feedback, win/loss, pipeline coverage, shared targets |

### New target agent families

Document 17 adds 28 target agents:

- PLG-01 through PLG-06.
- EXP-01 through EXP-03.
- ABM-01 through ABM-03.
- VRL-01 through VRL-02.
- IAM-01.
- CMT-01 through CMT-03.
- EVT-01 through EVT-03.
- XP-01 through XP-02.
- PR-01 through PR-04.
- PRT-01 through PRT-03.
- DEV-01 through DEV-02.
- REV-01 through REV-02.

These should be treated as target architecture, not active implementation truth, until GSD assigns contracts, data objects, approval posture, tests, and UI/API/MCP surfaces.

## Codebase Change Sensemaking

| Codebase area | What will likely need to change later |
|---|---|
| Tenant profile/onboarding | Add SaaS growth-mode selection, PLG flags, developer audience flags, enabled growth modules, sales/CS posture |
| Schema | Research new objects for activation, PQL, ABM packages, referral programs, in-app campaigns, communities, events, experiments, partners, affiliate programs, and revenue team config |
| Agent runtime | Add target tiers only after AgentRun v2 supports cost, task creation, approvals, retries, DLQ, and provenance |
| CRM/domain data | Reuse contacts, accounts, tasks, outbound, attribution, and activity ledger for ABM, revenue alignment, events, advocacy, and partner motions |
| Billing/Pricing | Route upgrade triggers, discounts, referral rewards, affiliate commissions, pricing-page/G2 sync, and save offers through Pricing Engine |
| SaaS Suite | Feed product usage, support, billing, health score, MRR, churn, and expansion facts into PLG, advocacy, revenue alignment, and experimentation |
| UI | Add new surfaces only when they produce decisions, tasks, approvals, or learnings, not passive dashboards |
| API/MCP | Reserve fresh contracts for read-first SaaS growth tools; mutation tools come later and require approval contracts |
| Governance | Extend approval gates to in-app campaigns, PR/review outreach, affiliate/referral payouts, events, expansion outreach, and experiments |
| Literacy | Tie module logic to PLG, ABM, social/community, events, PR, experimentation, RevOps, pricing, and developer-marketing literacy |

## Future GSD Translation Shape

Candidate post-SaaS-Suite GSD streams:

1. SaaS growth profile and mode routing.
2. PLG activation, PQL scoring, upgrade triggers, and in-app orchestration.
3. B2B expansion, customer marketing, advocacy, and ABM.
4. B2C viral/referral engine and community-led growth.
5. Events, PR/analyst/G2, partnerships, developer marketing, and revenue alignment.
6. Cross-module growth experimentation framework.

The future GSD prompt should decide whether these become phases after 217, a new milestone, or an overlay research package before phase numbering.

## Requirements To Carry Forward

- The build order has not changed: do not leapfrog core loop, Pricing Engine, or SaaS Suite foundations.
- SaaS mode routing must be a product decision, not campaign metadata.
- Product usage events must drive activation, PQL, upgrade, health, retention, and expansion decisions.
- Pricing-sensitive growth prompts must use Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Growth modules must create tasks, approvals, experiments, or learnings; passive dashboards do not satisfy the spec.
- External customer, partner, press, analyst, event, support, pricing, discount, referral, affiliate, and in-app mutations require approval by default.
- Learnings from experiments and campaigns feed tenant overlays first and central literacy only through admin-reviewed candidates.

## Open Questions For Later GSD

1. Should the SaaS growth mode live in the core tenant profile, SaaS Suite activation, or a separate SaaS Growth Profile object?
2. Which product analytics connector ships first for PLG: PostHog, Mixpanel, Segment, or a generic event ingestion contract?
3. What fresh contract range should cover SaaS growth API/MCP surfaces?
4. Which growth modules are Phase 2 versus Phase 3 after the SaaS Suite?
5. Should the 28 target agents be introduced as domain tiers all at once in registry docs, or only as their module phases become active?
6. Which actions can ever earn auto-approval, and which must remain permanently human-approved?

## Related

- [[SaaS Marketing OS Strategy Canon]]
- [[Marketing Operating System Foundation]]
- [[SaaS Suite Canon]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 Blueprint Intake]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[MarkOS v2 Operating Loop Spec]]
- [[Agent Registry]]
