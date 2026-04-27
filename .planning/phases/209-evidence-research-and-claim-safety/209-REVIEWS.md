---
phase: 209
phase_name: evidence-research-and-claim-safety
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
  - 209-01-PLAN.md
  - 209-02-PLAN.md
  - 209-03-PLAN.md
  - 209-04-PLAN.md
  - 209-05-PLAN.md
  - 209-06-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 209

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 209 is supposed to become the shared truth layer for claims, research, freshness, and approval safety, but it is still planned in the old stub format and cannot yet move through executable GSD flow. The doctrine is strong, especially around unsupported-claim blocking, source quality, TTL, and evidence reuse, but the current phase mixes its true evidence ownership with loop, pricing, and approval-interface systems owned by other phases. As written, the phase can look complete even if the pricing substrate, compliance posture, and approval surfaces it depends on are not yet real.

## Strengths

- The phase goal is foundational and well scoped: EvidenceMap plus freshness, TTL, and unsupported-claim blocking is exactly the right substrate for later loops and public proof.
- `209-RESEARCH.md` identifies the right model pieces: source quality score, freshness TTL, known gaps, inference labels, and research-context reuse.
- The non-negotiables in `209-CONTEXT.md` align well with the vault doctrine and later Tenant 0 and growth-proof needs.

## Concerns

### HIGH

- Plans are still stubs and fail the current executable-plan schema. `gsd-tools` frontmatter validation on `209-01-PLAN.md` reports every required plan field missing (`phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`), and the same stub shape repeats across all six plans. In the current state, these files cannot pass the normal plan-check or execute flow.

- Requirement ownership is mixed across the evidence phase and upstream systems. The roadmap gives Phase 209 ownership of `LOOP-02..04`, `PRC-03`, and `PRC-04`, while the plan set also reaches into `TASK-04`. `.planning/REQUIREMENTS.md` assigns those families to Phases 211, 205, and 208. Phase 209 should directly own `EVD-01..06` and quality gates, then expose contracts that loop, pricing, and approval phases consume via `integrates_with`, not absorb their requirement ownership.

### MEDIUM

- The phase has no `209-VALIDATION.md`, even though research already names the key proof surface: supported versus unsupported claims, TTL and stale-context handling, approval blocking, pricing evidence, and research-context reuse. That leaves no Nyquist verification map, no sampling cadence, and no explicit runner contract for the evidence substrate.

- The roadmap dependency model is too narrow. `ROADMAP.md` lists only Phases 207 and 208, but the phase explicitly relies on Pricing Engine evidence flows from Phase 205 and on governance or compliance posture from Phase 206 for public claims, pricing evidence, and approval safety. Without widening dependencies or adding an upstream preflight, the evidence phase can plan central claim safety before pricing and compliance foundations are actually ready.

## Suggestions

- Replan Phase 209 in the same richer format now used by the replanned later phases:
  - add executable frontmatter
  - assign waves and dependencies
  - list owned files and artifacts
  - add XML task blocks with `read_first`, `action`, `acceptance_criteria`, `verify`, and `done`

- Restrict direct ownership to `EVD-01..06` and `QA-01..15`. Convert the rest to `integrates_with`:
  - `PRC-01..09`, `BILL-02` from P205
  - `COMP-01` from P206
  - `RUN-01..08` from P207
  - `TASK-01..05` from P208
  - `LOOP-01..08` from P211

- Add `209-VALIDATION.md` with a Node `--test` sampling plan and domain suites for EvidenceMap contracts, source-quality policy, TTL and stale-context handling, approval blocking, research reuse, and citation/inference defenses.

- Make Plan 01 own a Wave 0.5 upstream preflight:
  - Pricing Engine evidence-readiness check
  - compliance and public-claim posture check
  - approval-surface readiness check
  - architecture lock against unsupported-claim bypass and stale-evidence shortcuts

## Risk Assessment

**Overall risk: HIGH**

Phase 209 is where MarkOS stops treating evidence as loose metadata and starts using it as a real safety substrate. If this phase stays stubbed and keeps borrowing pricing, loop, and approval ownership from elsewhere, later phases can inherit a false sense that claims are grounded and governable when the actual substrate is still incomplete.

## Suggested next move

`/gsd-plan-phase 209 --research`
