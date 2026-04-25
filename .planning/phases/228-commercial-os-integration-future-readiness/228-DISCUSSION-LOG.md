# Phase 228: Commercial OS Integration and Future-Readiness — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis path.

**Date:** 2026-04-25
**Phase:** 228-commercial-os-integration-future-readiness
**Mode:** assumptions (auto, --chain)
**Areas analyzed:** Scope anchors, Parity gates, Slice allocation, Test doctrine, Done criteria, Code reuse, Deferral boundary

---

## Context

Phase 228 already had a hardened CONTEXT.md (parity gates + objects matrix + non-negotiables + done criteria) and a 228-RESEARCH.md (architecture patterns + recommended path + tests implied) and a DISCUSS.md (slice plan 228-01..06). The discuss-phase invocation in `--chain --auto` mode triggered an augmentation pass to surface the existing hardened content as formal `<decisions>` / `<canonical_refs>` / `<code_context>` / `<specifics>` / `<deferred>` blocks the planner agent parses, rather than re-running an interactive Q&A on already-locked scope.

## Assumptions Presented (all sourced from existing hardened artifacts — no user correction needed)

### Scope Anchors

| Assumption | Confidence | Evidence |
|---|---|---|
| No new product surface, MCP verb family, or API domain in 228 | Confident | CONTEXT.md "Non-Negotiables" + "This phase explicitly does NOT" |
| No sibling orchestrator on top of 221-227 | Confident | CONTEXT.md "Non-Negotiables" |
| Parity-only enforcement phase | Confident | CONTEXT.md "Why Phase 228 Exists" |

### Parity Gates (10 gates from routing doc lines 113-126)

| Assumption | Confidence | Evidence |
|---|---|---|
| All 10 gates enforced verbatim from routing doc | Confident | CONTEXT.md "Parity Gates Enforced" + V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md L113-126 |
| Gate 9 (UI/API/MCP parity) is hard exit criterion | Confident | "engines are incomplete if they only exist on one surface" |
| Gate 5 (Pricing Engine routing) honors `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder | Likely | CLAUDE.md placeholder rule + Pricing Engine Canon |

### Slice Allocation

| Assumption | Confidence | Evidence |
|---|---|---|
| 6 slices: 228-01..06 per DISCUSS.md | Confident | DISCUSS.md "Proposed Plan Slices" table |
| Slice 228-06 (docs/canon sync) may fold into 228-05 if doc churn is minimal | Likely | Planner judgment call — left as Claude's Discretion |

### Test Doctrine

| Assumption | Confidence | Evidence |
|---|---|---|
| Vitest / Playwright / Chromatic per V4.0.0-TESTING-ENVIRONMENT-PLAN.md | Confident | CONTEXT.md "Codebase-Specific Constraints" + testing-environment-plan exists |
| Replaceable-adapter swap test pattern follows `lib/markos/outbound/providers/` | Confident | CONTEXT.md + 228-RESEARCH.md "Files inspected" |
| Single Playwright suite covers full CRM → channel → conversion → analytics → sales → ecosystem chain | Likely | Specifics — most efficient way to prove Gate 9 + Gate 10 jointly |

### Done Criteria

| Assumption | Confidence | Evidence |
|---|---|---|
| F-IDs across 221-227 enumerated explicitly: CDP-01..05, CRM-01..05, EML-01..05, MSG-01..05, CNV-01..05, LCH-01..05, ANL-01..05, SEN-01..05, ECO-01..05, COM-01..06, QA-01..15 | Confident | CONTEXT.md "Done Means" |
| SOC2-I posture (not Type II) is the v4.2.0 milestone target | Confident | ROADMAP.md "Locked SaaS Decisions 2026-04-16" — SOC 2 Type I 6mo |
| Final readiness matrix is machine-verifiable, not prose-only | Likely | Specifics — derived from "machine-verifiable" wording in Done criteria |

### Code Reuse / Integration Points

| Assumption | Confidence | Evidence |
|---|---|---|
| Contract registry extends `lib/markos/plugins/registry.js`, no parallel store | Confident | CONTEXT.md "Non-Negotiables" + 228-RESEARCH.md "Existing support" |
| Adapter contracts extend `lib/markos/outbound/providers/base-adapter.ts` | Confident | 228-RESEARCH.md "Files inspected" |
| Test gates extend V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md (add columns, no fork) | Confident | CONTEXT.md "Codebase-Specific Constraints" |

### Deferral Boundary

| Assumption | Confidence | Evidence |
|---|---|---|
| New MCP verb families for cross-engine orchestration → 229+ | Confident | Non-negotiables: no new MCP verb families in 228 |
| Pricing Engine implementation is gated separately, 228 only enforces routing | Confident | Pricing Engine Canon + placeholder rule |
| SOC2 Type II is future-milestone concern | Confident | Locked SaaS Decisions: Type I 6mo |

## Corrections Made

No corrections — all assumptions sourced from already-hardened artifacts and locked SaaS decisions. User invoked `--chain --auto` over an already-prepared CONTEXT/RESEARCH/DISCUSS triad, signaling intent to advance to plan-phase with current scope.

## Auto-Resolved

- Slice 228-06 fold-vs-keep decision auto-resolved as **Claude's Discretion** for the planner (D-21b) — defers the call to plan-phase based on doc-churn discovery during execution.
- Registry schema format (JSON vs TS module vs both) auto-resolved as **Claude's Discretion** — planner aligns with existing `lib/markos/plugins/registry.js`.
- Test file structure (per-slice vs per-engine) auto-resolved as **Claude's Discretion** — planner aligns with existing testing-environment-plan.
- Readiness matrix render format (table vs structured + view) auto-resolved as **Claude's Discretion**.

## External Research

Skipped — codebase + planning artifacts provided sufficient evidence. 228-RESEARCH.md already captured the relevant architectural research findings (replaceable-adapter doctrine, plugin registry, testing doctrine).

## Sibling Phase Cross-References Loaded

- 221-CONTEXT.md (CDP) — D-07 Gate 1 anchor
- 222-CONTEXT.md (CRM) — D-08 Gate 2 anchor
- 223-CONTEXT.md (email/messaging) — D-09 Gate 3 channel coverage
- 224-CONTEXT.md (conversion/launch) — D-09 Gate 3 + D-11 Gate 5 + D-14 Gate 8
- 225-CONTEXT.md (analytics) — D-10 Gate 4 + D-12 Gate 6
- 226-CONTEXT.md (sales enablement) — D-08 Gate 2 + D-11 Gate 5 + D-12 Gate 6
- 227-CONTEXT.md (ecosystem) — D-09 Gate 3 + D-10 Gate 4 + D-13 Gate 7

All sibling phases assumed to ship per their CONTEXT.md decisions before 228 closes.
