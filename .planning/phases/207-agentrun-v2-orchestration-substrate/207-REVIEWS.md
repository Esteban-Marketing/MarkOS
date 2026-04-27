---
phase: 207
phase_name: agentrun-v2-orchestration-substrate
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
  - 207-01-PLAN.md
  - 207-02-PLAN.md
  - 207-03-PLAN.md
  - 207-04-PLAN.md
  - 207-05-PLAN.md
  - 207-06-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 207

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 207 is closer to executable planning than the later stub phases because it already has detailed task blocks, contract-lock mechanics, migration allocation, and file ownership. But it is still not aligned with the current GSD plan schema, it has no validation contract, and it mixes pure orchestration ownership with task-system ownership that the canonical requirement map assigns to Phase 208. As written, this phase contains strong implementation detail, but it still cannot pass the normal plan-check flow and can over-claim completion of downstream operator-work requirements.

## Strengths

- The plan set already contains unusually concrete execution detail for contracts, migrations, tests, and adoption sequencing.
- `207-RESEARCH.md` identifies the right v2 substrate pieces: state machine, AgentChain, retry/DLQ, cost bridge, task handoff, and adoption order.
- The phase correctly treats existing CRM playbooks, MCP pipeline behavior, and billing normalization as migration assets instead of rewrite targets.

## Concerns

### HIGH

- The plans are only partially migrated into the current executable schema. All six files fail `gsd-tools frontmatter validate ... --schema plan` because they are missing required keys such as `type` and `must_haves`, while still using legacy keys like `title`, `solo`, and `requirements_addressed`. This means the phase has rich content, but it still cannot pass the current plan-check and execute flow as written.

- Requirement ownership is mixed between orchestration and the downstream human interface phase. The roadmap maps `TASK-01` into Phase 207, and `207-04-PLAN.md` goes further by saying the v2 substrate "OWNS task persistence" while Phase 208 becomes a read-only consumer. `.planning/REQUIREMENTS.md` assigns `TASK-01..05` to Phase 208. If 207 keeps `TASK-01` as a primary owned requirement instead of exposing orchestration hooks consumed by 208, the substrate phase can appear to satisfy the unified-task requirement before the human interface contract is actually delivered.

### MEDIUM

- The phase has no `207-VALIDATION.md`, even though research already defines concrete proof surfaces for state transitions, DAG scheduling, idempotency, cost reconciliation, and recovery-task creation. That leaves no Nyquist verification map, no sampling cadence, and no explicit runner contract for the phase that later UI, evidence, connector, and learning work all depend on.

- The dependency model omits the compliance foundation it expects to enforce. `ROADMAP.md` lists Phases 201, 202, 204, and 205, but not Phase 206, even though `207-04-PLAN.md` standardizes approval behavior for `external.send`, `billing.charge`, `connector.mutate`, and `price.change`. Without adding Phase 206 or an upstream preflight, Phase 207 can normalize dangerous-mutation orchestration before the governance and compliance posture is actually ready.

## Suggestions

- Replan Phase 207 into the same current executable format now used by replanned later phases:
  - add `type`
  - add `must_haves`
  - normalize `plan` values
  - convert legacy frontmatter keys to the current schema

- Keep direct ownership centered on `RUN-01..08` and the orchestration QA surface. Treat task-system behavior as an integration contract with Phase 208:
  - orchestration can own run-to-task hooks and task-link metadata
  - Phase 208 should remain the owner of the human task/approval system requirement family

- Add `207-VALIDATION.md` with a Node `--test` sampling plan and domain suites for:
  - contract/schema lock
  - durable run API and event stream
  - retry/DLQ/state-machine behavior
  - approval/task handoff
  - cost estimate/actual and billing bridge
  - agent adoption compatibility

- Add a Wave 0.5 upstream preflight for:
  - tenancy/runtime substrate readiness
  - pricing context posture from Phase 205
  - compliance and governance posture from Phase 206
  - CLI/MCP integration assumptions from Phases 202 and 204

## Risk Assessment

**Overall risk: HIGH**

Phase 207 is the substrate phase that many later phases assume is trustworthy. If it stays partially migrated and keeps borrowing task-system ownership from the operator interface phase, later planning can inherit a false sense that durable runs and human-visible work routing are already solved by the same layer.

## Suggested next move

`/gsd-plan-phase 207 --research`
