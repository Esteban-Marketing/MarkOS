---
phase: 213
phase_name: tenant0-dogfood-compliance-validation
reviewers: [codex-runtime-only]
reviewers_attempted: [gemini, claude, codex]
reviewers_skipped:
  - gemini: not installed
  - claude: not installed
  - codex: current runtime only; not independent for cross-AI review
reviewer_note: |
  Fallback single-reviewer pass created because no independent local AI CLI was available.
  This is useful planning feedback, but it is not a true cross-AI review.
reviewed_at: 2026-04-27
plans_reviewed:
  - 213-01-PLAN.md
  - 213-02-PLAN.md
  - 213-03-PLAN.md
  - 213-04-PLAN.md
  - 213-05-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 213

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 213 is still in the same stub state that previously blocked replanning for later SaaS phases. The intent and doctrine are solid, but the plans are not yet executable: they lack GSD frontmatter, wave/dependency structure, file-level ownership, task breakdown, and a validation contract. More importantly, the phase is currently claiming ownership of upstream requirement families that the repo traceability matrix assigns to Phases 205-211. If executed as written, Phase 213 could incorrectly "close" Tenant 0 readiness by absorbing missing Pricing Engine, loop, evidence, connector, or compliance work that should remain visible as upstream blockers.

## Strengths

- The phase goal is sharp and important: real MarkOS-on-MarkOS proof before enterprise positioning is the right v4.0.0 closeout.
- `213-CONTEXT.md` defines strong non-negotiables around synthetic proof, unsupported claims, pricing placeholders, and enterprise-readiness language.
- `213-RESEARCH.md` already identifies the right proof boundaries: real tenant setup, evidence-backed public claims, placeholder-safe pricing, and a go/no-go artifact for phases 214-217.

## Concerns

### HIGH

- Plans are still stubs and fail the current executable-plan schema. `gsd-tools` frontmatter validation on `213-01-PLAN.md` reports every required plan field missing (`phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`), and the same shape repeats across all five plans. In the current state, these plans cannot pass the normal plan-check flow or drive `/gsd-execute-phase`.

- Requirement ownership is inverted. The roadmap and plan files assign Phase 213 the upstream families `PRC-01..09`, `COMP-01`, `EVD-01..06`, `CONN-01..06`, and `LOOP-01..08`, but `.planning/REQUIREMENTS.md` assigns those to Phases 205, 206, 209, 210, and 211 respectively. Phase 213 should consume and validate those outputs, not re-own them. Leaving this as-is creates a serious audit risk because Tenant 0 "go/no-go" could be marked green even if core upstream systems are still missing.

### MEDIUM

- The phase has no `213-VALIDATION.md`, even though this is the milestone-closeout gate for vault/codebase compliance. That leaves no Nyquist verification map, no sampling contract, and no explicit automation plan for the claimed go/no-go decision.

- There is no upstream preflight or architecture-lock step even though the roadmap says Phase 213 depends on Phases 205-212. Without an `assertUpstreamReady` gate, the dogfood/compliance phase can silently proceed against missing Pricing Engine, evidence, connector, loop, or learning substrate and produce a misleading readiness conclusion.

## Suggestions

- Replan Phase 213 in the same richer format now used by the later SaaS replans:
  - add full frontmatter
  - assign waves and dependencies
  - list owned files and artifacts
  - add XML task blocks with `read_first`, `action`, `verify`, and `done`

- Restrict primary ownership to `T0-01..05` and `QA-01..15`. Convert the rest to `integrates_with`:
  - `PRC-01..09`, `BILL-02` from P205
  - `COMP-01` from P206
  - `RUN-01..08` from P207
  - `TASK-01..05` from P208
  - `EVD-01..06` from P209
  - `CONN-01..06` from P210
  - `LOOP-01..08` from P211
  - `LRN-01..05` from P212

- Add `213-VALIDATION.md` with a per-plan verification map and Node `--test` runner assumptions, matching the newer late-phase planning pattern.

- Make Plan 01 own a Wave 0.5 preflight:
  - upstream gate for 205-212
  - architecture-lock against deprecated helpers/patterns
  - fixture barrel and baseline guard tests

- Make Plan 05 produce named closeout artifacts, not just a generic "final audit artifact":
  - requirement-to-implementation matrix
  - proof-claim audit summary
  - unresolved-gap register
  - explicit 214-217 go/no-go decision doc

## Risk Assessment

**Overall risk: HIGH**

The doctrine is good, but the current planning shape is not trustworthy enough for a milestone-closeout phase. Tenant 0 is supposed to certify that earlier phases actually work together in reality. If the phase keeps stub plans, broad borrowed requirement ownership, and no validation contract, it can create a false sense of readiness exactly where the repo most needs a hard gate.

## Specific Questions For Replan

1. Should Phase 213 create a `213-VALIDATION.md` and follow the same Wave 0.5 architecture-lock/preflight pattern as the replanned SaaS phases?
2. Should Phase 213 claim only `T0-01..05` directly and move all upstream families to `integrates_with`?
3. Which artifact is the authoritative go/no-go output for phases 214-217: a new `213-GO-NO-GO.md`, `213-VERIFICATION.md`, or a section inside `213-05-SUMMARY.md`?
4. Which single real dogfood loop is the first required proof path: a public proof content asset, a GTM page update, or a pricing page audit plus approved narrative?

## Suggested next move

`/gsd-plan-phase 213 --research`

Phase 213 should be replanned before review is treated as complete. Once replanned, it would be worth re-running a true cross-AI review from a machine that has at least one independent CLI installed besides the current runtime.
