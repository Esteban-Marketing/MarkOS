---
phase: 210
phase_name: connector-wow-loop-and-recovery
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
  - 210-01-PLAN.md
  - 210-02-PLAN.md
  - 210-03-PLAN.md
  - 210-04-PLAN.md
  - 210-05-PLAN.md
  - 210-06-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 210

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 210 has the right mission for v4.0.0, but it is still planned in the old stub format and cannot yet participate in executable GSD flow. The doctrine around quick time-to-value, max-3 onboarding recommendations, read-only first-wow paths, and visible recovery is solid, but the current phase blurs connector-owned work with upstream run, task, evidence, and compliance systems. As written, the phase can look like it solves recovery and risk posture even when the system-of-record task UI, compliance posture, or evidence substrate is only assumed.

## Strengths

- The phase goal is well chosen: connectors should create live value and visible recovery, not passive dashboards.
- `210-CONTEXT.md` has strong non-negotiables around secret handling, silent degradation, connector list size, and consent/retention posture.
- `210-RESEARCH.md` identifies the right first-wow strategy: read-only, low-risk connectors first, with precise recovery tasks when live data is unavailable.

## Concerns

### HIGH

- Plans are still stubs and fail the current executable-plan schema. `gsd-tools` frontmatter validation on `210-01-PLAN.md` reports every required plan field missing (`phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`), and the same shape repeats across all six plans. In the current state, these plans cannot pass the normal plan-check or execute flow.

- Requirement ownership is mixed across the connector phase and upstream systems. The roadmap gives Phase 210 `RUN-01..08` and `TASK-01..05`, while the plan set also reaches into `RUN-05`, `TASK-01`, `EVD-03`, and `COMP-01`. `.planning/REQUIREMENTS.md` assigns those families to Phases 207, 208, 209, and 206. Phase 210 should directly own `CONN-01..06` plus quality gates, and consume run, task, evidence, and compliance substrate as prerequisites or `integrates_with` inputs.

### MEDIUM

- The phase has no `210-VALIDATION.md`, even though research already names concrete tests for ConnectorInstall safety, scope mismatch recovery, dependent-agent pause behavior, and first-wow or recovery-task proof. That leaves no Nyquist verification map, no sampling cadence, and no explicit runner contract for the connector phase.

- The roadmap dependency model is too narrow. `ROADMAP.md` lists Phases 207, 208, and 209, but omits Phase 206 even though the phase text explicitly requires consent, retention, privacy, and support-visible failure posture, and `210-06-PLAN.md` already references `COMP-01`. Without widening dependencies or adding an upstream preflight, the connector phase can plan live data ingestion before the governing compliance posture is actually ready.

## Suggestions

- Replan Phase 210 in the same richer format now used by the replanned later phases:
  - add executable frontmatter
  - assign waves and dependencies
  - list owned files and artifacts
  - add XML task blocks with `read_first`, `action`, `acceptance_criteria`, `verify`, and `done`

- Restrict direct ownership to `CONN-01..06` and `QA-01..15`. Convert the rest to `integrates_with`:
  - `COMP-01` from P206
  - `RUN-01..08` from P207
  - `TASK-01..05` from P208
  - `EVD-01..06` from P209

- Add `210-VALIDATION.md` with a Node `--test` sampling plan and domain suites for connector contract, adapter decision matrix, onboarding recommendation logic, wow audit, failure pause/recovery, and backfill evidence.

- Make Plan 01 own a Wave 0.5 upstream preflight:
  - compliance/privacy baseline
  - run linkage substrate
  - task and approval routing substrate
  - evidence posture for connector-backed outputs
  - architecture lock against silent connector degradation

## Risk Assessment

**Overall risk: HIGH**

Phase 210 is supposed to give MarkOS its first live-data credibility. If it stays stubbed and continues borrowing recovery, task, evidence, and compliance ownership from other phases, downstream planning can treat connector-backed work as safe and ready even when the system still lacks the governance layer that makes live integrations trustworthy.

## Suggested next move

`/gsd-plan-phase 210 --research`
