---
date: 2026-04-22
status: active
description: "Deep vault readiness audit for MarkOS v2 before GSD discuss/research: coverage, gaps, blockers, and documentation improvements required for a serious refactor plan."
tags:
  - work
  - active
  - audit
  - gsd
  - markos
  - v2
aliases:
  - MarkOS v2 GSD Readiness Audit
---

# MarkOS v2 GSD Readiness Audit

## Purpose

This audit answers one question:

> Is the Obsidian vault ready to act as the strategic foundation for a GSD discuss and research phase that will turn MarkOS into a competitive, future-ready, AI-agentic Marketing Operating System?

Short answer: the vault now has strong v2 doctrine, but it needed a GSD-facing work-plan layer and traceability layer. This pass adds those missing pieces and records the remaining blockers so the next GSD step does not restart from ambiguity.

## Vault Areas Reviewed

| Area | Notes reviewed | Readiness | Finding |
|---|---|---|---|
| Incoming v2 pack | `obsidian/work/incoming/00-17*.md` | Strong | Rich architecture source material exists and is now synthesized in [[MarkOS v2 Blueprint Intake]] |
| Pricing Engine extension | `obsidian/work/incoming/15-PRICING-ENGINE.md` | Strong | Added as v2 extension; distilled into [[Pricing Engine Canon]] and [[MarkOS v2 Pricing Engine Intake]] |
| SaaS Suite extension | `obsidian/work/incoming/16-SAAS-SUITE.md` | Strong | Added as tenant-type suite; distilled into [[SaaS Suite Canon]] and [[MarkOS v2 SaaS Suite Intake]] |
| SaaS Marketing OS Strategy extension | `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md` | Strong | Added as post-suite growth destination; distilled into [[SaaS Marketing OS Strategy Canon]] and [[MarkOS v2 SaaS Marketing OS Strategy Intake]] |
| Brain doctrine | [[Marketing Operating System Foundation]], [[MarkOS Canon]], [[Target ICP]], [[Brand Stance]], [[Agent Registry]], [[Message Crafting Pipeline]] | Strong | Doctrine now aligns around the v2 OS thesis |
| Reference/codebase map | [[MarkOS Protocol]], [[Contracts Registry]], [[Database Schema]], [[Core Lib]], [[UI Components]], [[MarkOS Codebase Atlas]] | Medium | Good current-state map; needs explicit v2 gap overlays |
| Work/MOC layer | [[Work Notes]], [[Home]], [[Memories]], [[North Star]] | Strong | Entry points now link to v2 doctrine and active work |
| Literacy layer | [[Marketing Literacy]], literacy README | Medium-strong | Good 2026 marketing corpus; needs future research agenda before implementation |
| GSD state | `.planning/STATE.md`, `.planning/v4.0.0-ROADMAP.md` | Medium | State remains v4.0.0 SaaS readiness; v2 realignment needs an intentional phase |
| PageIndex | `.pageindex/VAULT-INDEX.md`, JSON outputs | Strong | New anchors are indexed after regeneration |

## What Was Missing Before This Audit

### 1. GSD master work plan

The foundation said what MarkOS must become, but GSD still needed a phase-ready map of workstreams, dependencies, decisions, research prompts, and acceptance gates.

Resolution: create [[MarkOS v2 GSD Master Work Plan]].

### 2. Requirements traceability

The incoming docs are large. Future agents need to know which source file drives which requirement, which vault note owns the doctrine, and which implementation area will be affected.

Resolution: create [[MarkOS v2 Requirements Traceability Matrix]].

### 3. Current-state versus target-state gaps in reference docs

The reference docs mostly described the existing codebase. They did not clearly call out the v2 gap at the point of inspection.

Resolution: add v2 overlays to:

- [[MarkOS Codebase Atlas]]
- [[Contracts Registry]]
- [[Database Schema]]
- [[Core Lib]]
- [[UI Components]]
- [[MarkOS Protocol]]

### 4. GSD phase insertion decision

The current roadmap wants to proceed to Phase 204 CLI GA after Phase 203 verification. The v2 blueprint suggests a realignment/instrumentation phase before that work continues unchanged.

Resolution: document as a blocker in [[MarkOS v2 GSD Master Work Plan]].

### 5. Contract ID collision

Incoming v2 docs propose F-90 through F-96 for learning contracts, but current codebase history already uses F-90 through F-100 for MCP/webhook work.

Resolution: mark as non-negotiable implementation blocker in [[MarkOS v2 Requirements Traceability Matrix]] and [[Contracts Registry]].

### 6. Pricing Engine ownership

Fixed tier values were still present in active doctrine. The new pricing engine makes static public pricing premature.

Resolution: define `{{MARKOS_PRICING_ENGINE_PENDING}}` in [[Pricing Engine Canon]] and replace active fixed tier references with the placeholder.

## Readiness Scorecard

| Dimension | Score | Why |
|---|---:|---|
| Product thesis clarity | 5/5 | MarkOS v2 is clearly defined as AI-native Marketing OS, not content tool/dashboard |
| ICP/GTM clarity | 4/5 | Growth-stage B2B and agencies resolved; design partner filters documented |
| Build order | 4/5 | Complete loop before 80 agents is clear; exact GSD phase insertion still open |
| Agent architecture | 3/5 | Target domains and Phase 1 responsibilities documented; token migration still open |
| Data architecture | 3/5 | Target objects documented; actual schema/contracts need research and fresh IDs |
| UI/product surface | 3/5 | Morning Brief, Task Board, Approval Inbox defined; current app surface gap remains |
| Research/evidence | 4/5 | Strong source-quality and citation doctrine; implementation evals need planning |
| Connectors | 3/5 | Value loop clear; Nango/direct split needs research |
| Pricing Engine | 4/5 | Source doc is deep and now distilled; implementation needs crawler/cost-model/schema/approval planning |
| SaaS Suite | 4/5 | Suite doctrine is distilled and routed to Phases 214-217; implementation still needs contract/schema range and connector choices |
| SaaS Marketing OS Strategy | 4/5 | Growth-mode destination is indexed; future GSD translation must avoid building 28 agents before substrate exists |
| Learning/literacy | 4/5 | Strong doctrine; promotion workflow and tables need implementation plan |
| GSD handoff readiness | 4/5 | Master work plan and traceability now make next discuss/research viable |

## Remaining Blockers Before Implementation Planning

1. Decide whether to insert a decimal GSD phase before Phase 204 or add v2 realignment after v4.0.0 closes.
2. Allocate fresh F-contract IDs for AgentRun expansion, task board, approvals, artifact performance, literacy updates, connector recovery, and social signals.
3. Decide token namespace migration: current content shorthand versus v2 `CONT`.
4. Research connector strategy: Nango embedded baseline versus direct adapters for API-depth gaps.
5. Decide the smallest first-loop scope that proves MarkOS v2 without bloating Phase 1.
6. Define what counts as Tenant 0 readiness.
7. Define product metrics that tie weekly narratives to the north star.
8. Pricing Engine placement is now selected: Phase 205 is re-scoped to Pricing Engine Foundation + Billing Readiness. Remaining work is contract/migration range allocation and implementation planning.
9. SaaS Suite placement is selected: Phases 214-217. Remaining work is contract/schema range allocation and connector/compliance research.
10. SaaS Marketing OS Strategy is indexed only. A later GSD prompt must decide whether it becomes post-217 phases, a new milestone, or a research overlay.

## Recommended Next GSD Command

Use GSD discuss first, not execute:

```bash
/gsd-discuss-phase --auto "MarkOS v2 strategic realignment and first operating-loop plan"
```

Recommended phase title:

> MarkOS v2 Strategic Realignment and Operating Loop Foundation

The discuss phase should use:

- [[MarkOS v2 GSD Master Work Plan]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Operating Loop Spec]]
- [[MarkOS v2 Blueprint Intake]]
- `.planning/STATE.md`
- `.planning/v4.0.0-ROADMAP.md`

## Related

- [[MarkOS v2 GSD Master Work Plan]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Operating Loop Spec]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 Pricing Engine Intake]]
- [[SaaS Suite Canon]]
- [[MarkOS v2 SaaS Suite Intake]]
- [[SaaS Marketing OS Strategy Canon]]
- [[MarkOS v2 SaaS Marketing OS Strategy Intake]]
- [[Work Notes]]
