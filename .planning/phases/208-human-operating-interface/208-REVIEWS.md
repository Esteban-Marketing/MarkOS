---
phase: 208
phase_name: human-operating-interface
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
  - 208-01-PLAN.md
  - 208-02-PLAN.md
  - 208-03-PLAN.md
  - 208-04-PLAN.md
  - 208-05-PLAN.md
  - 208-06-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 208

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 208 is aiming at the right product shape: one operator cockpit for daily decisions, approvals, recovery, and narrative. But the current planning set is still in the old stub format and mixes true UI ownership with run, pricing, evidence, connector, loop, and learning substrates that belong to other phases. As written, the phase cannot pass executable GSD flow and risks locking interface contracts to systems that are either upstream dependencies or still future work.

## Strengths

- The research correctly identifies the existing shell and operations surfaces as migration assets instead of proposing a second dashboard product.
- The phase intent is strong: Morning Brief, Task Board, Approval Inbox, Recovery Center, and Weekly Narrative is the right human-facing operating model.
- The research already calls out reusable billing, MCP, governance, and webhook evidence patterns, which should reduce UI rework later.

## Concerns

### HIGH

- Plans are still stubs and fail the current executable-plan schema. `gsd-tools` frontmatter validation on `208-01-PLAN.md` reports every required plan field missing (`phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`), and the same stub shape repeats across all six plans. In the current state, these files cannot pass the normal plan-check or execute flow.

- Requirement ownership is mixed across the interface phase and neighboring substrates. The roadmap gives Phase 208 ownership of `RUN-01..08`, `CONN-04`, and `LOOP-01..08`, while individual plans also reach into `EVD-05`, `PRC-09`, and `LRN-02`. `.planning/REQUIREMENTS.md` assigns those families to Phases 207, 210, 211, 209, 205, and 212. Phase 208 should directly own `TASK-01..05` and operator-shell quality gates, then consume run, pricing, evidence, connector, loop, and learning contracts through `integrates_with` or explicit future translation points.

### MEDIUM

- The phase has no `208-VALIDATION.md`, even though research already defines concrete proof surfaces for persisted task creation, approval inbox behavior, mobile recovery flows, and evidence-gated approvals. That leaves no Nyquist verification map, no sampling cadence, and no explicit runner contract for the main human interface phase.

- The dependency and sequencing model is unstable. `ROADMAP.md` says Phase 208 depends only on Phase 207, but the plans explicitly rely on pricing approvals, evidence blocking, `ConnectorInstall` failures, `EvidenceMap`, and performance logs. Those belong to Phases 205, 209, 210, and 212. Without either widening dependencies or splitting 208 into shell-first contracts plus later integration tasks, the phase can hard-code UI expectations against substrates that are not ready yet.

## Suggestions

- Replan Phase 208 in the executable format already used by the replanned later phases:
  - add executable frontmatter
  - assign waves and dependencies
  - list owned files and artifacts
  - add XML task blocks with `read_first`, `action`, `acceptance_criteria`, `verify`, and `done`

- Restrict direct ownership to `TASK-01..05` and `QA-01..15`. Convert the rest to `integrates_with` or explicit future translation points:
  - `PRC-01..09`, `BILL-02` from P205
  - `COMP-01` from P206
  - `RUN-01..08` from P207
  - `EVD-01..06` from P209
  - `CONN-01..06` from P210
  - `LOOP-01..08` from P211
  - `LRN-01..05` from P212

- Add `208-VALIDATION.md` with a Node `--test` sampling plan and domain suites for:
  - shell and navigation migration
  - Morning Brief
  - persisted Task Board behavior
  - approval inbox behavior
  - recovery-center visibility
  - Weekly Narrative constraints

- Make Plan 01 own a Wave 0.5 architecture and dependency lock:
  - shell migration and route-map baseline
  - pricing and compliance input posture
  - task and run substrate readiness
  - explicit placeholders for future evidence, connector, and learning integrations

## Risk Assessment

**Overall risk: HIGH**

Phase 208 is where the human product experience becomes real. If this phase stays stubbed and keeps absorbing substrate ownership from pricing, evidence, connectors, loops, and learning, later phases can inherit a polished-looking cockpit that still sits on unstable or missing contracts.

## Suggested next move

`/gsd-plan-phase 208 --research`
