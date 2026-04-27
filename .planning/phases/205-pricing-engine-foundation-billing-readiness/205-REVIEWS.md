---
phase: 205
phase_name: pricing-engine-foundation-billing-readiness
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
  - 205-01-PLAN.md
  - 205-02-PLAN.md
  - 205-03-PLAN.md
  - 205-04-PLAN.md
  - 205-05-PLAN.md
  - 205-06-PLAN.md
  - 205-07-PLAN.md
  - 205-08-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 205

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 205 has much stronger product and implementation detail than the later stub phases. The research is prescriptive, the plan split is coherent, and the pricing doctrine is already thinking ahead to evidence, placeholders, approval gates, and Tenant 0. But the plan set is still only partially migrated into the current executable GSD schema, it overclaims one billing requirement family relative to the canonical traceability table, it lacks a validation contract, and it is sequenced against future Phase 207 substrate in ways the roadmap does not acknowledge. As written, this phase is rich in detail but still unstable as an executable plan set.

## Strengths

- `205-RESEARCH.md` is unusually concrete about money arithmetic, approval reuse, placeholder posture, source quality, Stripe handoff, and test expectations.
- The plan breakdown follows a sensible product sequence: contracts, cost model, knowledge store, approval engine, API/MCP, operator UI, billing handoff, and Tenant 0 dogfood.
- The docs correctly recognize that active billing surfaces already exist and must be migrated away from static pricing assumptions rather than ignored.

## Concerns

### HIGH

- The plans are only partially migrated into the executable schema. `node .agent/get-shit-done/bin/gsd-tools.cjs frontmatter validate ... --schema plan` on `205-01-PLAN.md` reports missing required fields `type` and `must_haves`, while the file still uses legacy keys such as `title`, `solo`, and `requirements_addressed`. The same shape repeats across the rest of the phase, so Phase 205 cannot pass the normal plan-check or execute flow as written.

- Requirement ownership is inconsistent with the canonical traceability table. `ROADMAP.md` maps Phase 205 to `BILL-01` in addition to `PRC-01..09` and `BILL-02`, and individual plans such as `205-02` and `205-07` also address `BILL-01`. But `.planning/REQUIREMENTS.md` only assigns `PRC-01..09, BILL-02` to Phase 205. If the pricing phase keeps claiming `BILL-01` as direct ownership, the roadmap can falsely imply that billing-ledger and entitlement reconciliation is solved here rather than remaining visibly owned by the appropriate billing substrate.

### MEDIUM

- The phase has no `205-VALIDATION.md`, even though research already defines a concrete proof surface with Vitest, Playwright, migration, placeholder-residue, RLS, pricing-context, and Stripe-handoff checks. That leaves no Nyquist verification map, no sampling cadence, and no explicit runner contract for a phase whose whole value depends on safe, observable pricing behavior.

- The sequencing model is internally inconsistent around Phase 207. Research gives doctrinal precedence to `207-01-CONTRACT-LOCK.md`, assumes Phase 207 already claimed migrations `101-106`, and `205-04-PLAN.md` writes to `markos_agent_runs.pricing_engine_context` and `markos_agent_tasks`, both described as Phase 207-owned surfaces. But the roadmap lists Phase 205 as depending only on 201, 202, and 204. As written, the phase is upstream in the roadmap while still relying on future orchestration substrate that may not exist yet, which creates a plan-ordering cycle or at least an unacknowledged contract dependency.

## Suggestions

- Replan Phase 205 into the current executable format:
  - add `type`
  - add `must_haves`
  - normalize `plan` values
  - convert legacy frontmatter keys into the current schema

- Narrow direct ownership to the canonical traceability map:
  - keep `PRC-01..09`
  - keep `BILL-02`
  - treat `BILL-01` as an integration boundary unless the requirements table is intentionally changed

- Add `205-VALIDATION.md` with domain suites for:
  - pricing contracts and RLS
  - cost-model math and readiness
  - knowledge/watch-list evidence posture
  - recommendation and price-test approval state machines
  - API/MCP placeholder behavior
  - UI migration and static-pricing residue checks
  - Stripe handoff safety
  - Tenant 0 pricing dogfood

- Resolve the Phase 207 dependency tension explicitly:
  - either move the required run-context and task-handoff substrate earlier into Phase 205 scope as placeholders only
  - or reframe those writes as future integration points that cannot be required for 205 execution
  - or widen the declared dependency story so the roadmap matches the actual contract assumptions

## Risk Assessment

**Overall risk: HIGH**

This phase is foundational for pricing truth, billing copy, Tenant 0 dogfood, and later SaaS growth motions. If it stays partially migrated and keeps depending on future Phase 207 substrate while also overclaiming billing ownership, later phases can inherit a pricing system that looks well-specified on paper but still has unstable execution order and unclear responsibility boundaries.

## Suggested next move

`/gsd-plan-phase 205 --research`
