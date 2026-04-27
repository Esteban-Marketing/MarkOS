---
phase: 212
phase_name: learning-literacy-evolution
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
  - 212-01-PLAN.md
  - 212-02-PLAN.md
  - 212-03-PLAN.md
  - 212-04-PLAN.md
  - 212-05-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 212

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 212 is still in the old stub-planning format and is not ready for executable GSD flow. The doctrine in `212-CONTEXT.md` and `212-RESEARCH.md` is good, especially around privacy, admin review, and controlled literacy promotion, but the phase currently mixes its true learning ownership with upstream requirement families owned by earlier phases. As written, it can blur whether EvidenceMap, loop measurement, compliance, and task-routing systems are prerequisites or whether Phase 212 is now implicitly claiming to complete them.

## Strengths

- The phase goal is important and sharply scoped: turn real outcomes into governed learning without leaking tenant data.
- `212-RESEARCH.md` identifies the right control points: tenant overlays, promotion review, anonymization thresholds, and recommendation handoff.
- The non-negotiables in `212-CONTEXT.md` are strong and align with the vault doctrine.

## Concerns

### HIGH

- Plans are still stubs and fail the current executable-plan schema. `gsd-tools` frontmatter validation on `212-01-PLAN.md` reports every required plan field missing (`phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`), and the same format repeats across all five plans. In the current state, these plans cannot pass the normal plan-check or execute flow.

- Requirement ownership is mixed up. The roadmap and plan files assign Phase 212 upstream families such as `EVD-01..06`, `LOOP-08`, `COMP-01`, and `TASK-01`, but `.planning/REQUIREMENTS.md` assigns those families to Phases 209, 211, 206, and 208 respectively. Phase 212 should consume those systems as learning inputs and validation dependencies, not absorb them as primary ownership. Leaving this as-is creates audit ambiguity around whether learning is being planned on top of real evidence and loop substrate or replacing missing upstream work.

### MEDIUM

- The phase has no `212-VALIDATION.md`, even though research already defines concrete tests for performance logs, tenant-overlay RLS/expiry, promotion thresholds, admin review, and recommendation-task handoff. That leaves no Nyquist verification map and no sampling contract for a privacy-sensitive learning phase.

- The roadmap dependency model is too narrow. `ROADMAP.md` says Phase 212 depends only on Phase 211, but the phase text explicitly relies on EvidenceMap/source-quality records from Phase 209, privacy/compliance posture from Phase 206, and task handoff substrate from Phase 208. Without widening those dependencies or adding an upstream preflight, the learning phase can execute before critical evidence or routing systems are actually ready.

## Suggestions

- Replan Phase 212 in the same richer format now used by the replanned later phases:
  - add executable frontmatter
  - assign waves and dependencies
  - list owned files and artifacts
  - add XML task blocks with `read_first`, `action`, `acceptance_criteria`, `verify`, and `done`

- Restrict direct ownership to `LRN-01..05` and `QA-01..15`. Convert the rest to `integrates_with`:
  - `EVD-01..06` from P209
  - `LOOP-01..08` from P211
  - `COMP-01` from P206
  - `TASK-01..05` from P208

- Add `212-VALIDATION.md` with a Node `--test` sampling plan and explicit domain suites for performance logs, overlays, promotion review, anonymization, and recommendation handoff.

- Make Plan 01 own a Wave 0.5 upstream preflight:
  - EvidenceMap/source-quality readiness
  - loop-measurement readiness
  - privacy/compliance helper presence
  - architecture lock against unsafe cross-tenant promotion shortcuts

## Risk Assessment

**Overall risk: HIGH**

Phase 212 is where MarkOS turns outcomes into evolving doctrine. If the planning layer is still stubbed and the dependency graph is blurry, it becomes too easy for later phases to claim the system "learns" without proving privacy controls, evidence quality, or admin review are actually in place.

## Suggested next move

`/gsd-plan-phase 212 --research`
