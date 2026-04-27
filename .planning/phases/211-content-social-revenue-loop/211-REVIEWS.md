---
phase: 211
phase_name: content-social-revenue-loop
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
  - 211-01-PLAN.md
  - 211-02-PLAN.md
  - 211-03-PLAN.md
  - 211-04-PLAN.md
  - 211-05-PLAN.md
  - 211-06-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 211

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 211 is the first place MarkOS is supposed to prove the complete operating loop, but the phase is still planned in the old stub format and cannot yet move through executable GSD flow. The doctrine is directionally strong, especially around pricing safety, evidence-gated claims, approval before dispatch, and learning handoff, but the current plan set mixes Phase 211's true loop ownership with prerequisite systems from pricing, approvals, evidence, connectors, and learning. That makes it too easy for the phase to look "complete" even if the underlying governance and dispatch substrate is not.

## Strengths

- The phase goal is exactly the right one for v4.0.0: prove one real strategy-to-measurement loop before expanding into growth modules.
- `211-CONTEXT.md` has strong non-negotiables around pricing placeholders, evidence-backed claims, approval gates, and action-generating measurement.
- `211-RESEARCH.md` identifies the right loop objects and correctly treats connector-backed dispatch as a controlled, later proof rather than an assumption.

## Concerns

### HIGH

- Plans are still stubs and fail the current executable-plan schema. `gsd-tools` frontmatter validation on `211-01-PLAN.md` reports every required plan field missing (`phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`), and the same plain stub shape repeats across all six plans. In the current state, these files cannot pass the normal plan-check or execute flow.

- Requirement ownership is mixed across upstream and downstream families. The roadmap gives Phase 211 `TASK-01..05`, `EVD-01..06`, `CONN-01..06`, and `PRC-09`, while individual plans also claim future learning requirements such as `LRN-01` and `LRN-02`. `.planning/REQUIREMENTS.md` assigns those families to Phases 208, 209, 210, 205, and 212. Phase 211 should consume those systems as prerequisites or `integrates_with` inputs, not absorb them as primary ownership.

### MEDIUM

- The phase has no `211-VALIDATION.md`, even though research already names the exact proof surface: end-to-end loop, evidence block, pricing gate, connector gate, and attribution linkback. That leaves no Nyquist verification map, no sampling cadence, and no explicit runner contract for the first "complete loop" phase.

- The roadmap dependency model omits the compliance foundation it expects to enforce. `ROADMAP.md` lists Phases 205, 207, 208, 209, and 210, but not Phase 206, even though the phase text requires compliance-aware audits and approval-gated external mutations. Without an explicit Phase 206 dependency or an upstream preflight, Phase 211 can plan dispatch behavior before the AI-governance and compliance posture is actually ready.

## Suggestions

- Replan Phase 211 in the same richer format now used by the replanned later phases:
  - add executable frontmatter
  - assign waves and dependencies
  - list owned files and artifacts
  - add XML task blocks with `read_first`, `action`, `acceptance_criteria`, `verify`, and `done`

- Restrict direct ownership to `LOOP-01..08` and `QA-01..15`. Convert the rest to `integrates_with`:
  - `PRC-01..09`, `BILL-02` from P205
  - `COMP-01` from P206
  - `RUN-01..08` from P207
  - `TASK-01..05` from P208
  - `EVD-01..06` from P209
  - `CONN-01..06` from P210
  - `LRN-01..05` from P212

- Add `211-VALIDATION.md` with a per-plan verification map and explicit Node `--test` assumptions for loop object contracts, audit gates, approval/dispatch state, social routing, attribution, and learning handoff.

- Make Plan 01 own a Wave 0.5 upstream preflight:
  - Pricing Engine readiness
  - approval/task substrate readiness
  - evidence/claim gate readiness
  - connector dispatch readiness
  - compliance/approval architecture lock

## Risk Assessment

**Overall risk: HIGH**

Phase 211 is where MarkOS stops being a collection of useful tools and starts proving it can run a real governed operating loop. If this phase stays stubbed and keeps borrowing other phases' requirement families as if they are local ownership, later learning, dogfood, and SaaS phases can inherit a false proof of readiness.

## Suggested next move

`/gsd-plan-phase 211 --research`
