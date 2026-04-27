---
phase: 207
slug: agentrun-v2-orchestration-substrate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 207 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` + `vitest` |
| **Config file** | repo default test config; phase suites live under `test/agentrun/phase-207/` |
| **Quick run command** | `npm test -- test/agentrun/phase-207/preflight/` |
| **Full suite command** | `npm test -- test/agentrun/phase-207/` |
| **Estimated runtime** | ~45-90s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/agentrun/phase-207/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/agentrun/phase-207/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~90s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 207-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/agentrun/phase-207/preflight/` | W0 missing | pending |
| 207-01-01 | 01 | 1 | RUN-01, RUN-02 | contract-lock-baseline | `npm test -- test/agentrun/phase-207/domain-1/` | W0 missing | pending |
| 207-02-01 | 02 | 2 | RUN-01, RUN-07, RUN-08 | durable-run-api | `npm test -- test/agentrun/phase-207/domain-2/` | W0 missing | pending |
| 207-03-01 | 03 | 3 | RUN-03, RUN-04, RUN-05 | scheduler-retry-dlq | `npm test -- test/agentrun/phase-207/domain-3/` | W0 missing | pending |
| 207-04-01 | 04 | 4 | RUN-05, RUN-06 | approval-handoff | `npm test -- test/agentrun/phase-207/domain-4/` | W0 missing | pending |
| 207-05-01 | 05 | 5 | RUN-02, RUN-07 | cost-billing-bridge | `npm test -- test/agentrun/phase-207/domain-5/` | W0 missing | pending |
| 207-06-01 | 06 | 6 | RUN-07, RUN-08 | adoption-registry | `npm test -- test/agentrun/phase-207/domain-6/registry.test.js` | W0 missing | pending |
| 207-06-02 | 06 | 6 | QA-14, QA-15 | compatibility-rollout | `npm test -- test/agentrun/phase-207/domain-6/compatibility.test.js` | W0 missing | pending |

---

## Wave 0 Requirements

- [ ] `.planning/orchestration/207-upstream-readiness.md` - authoritative readiness checklist for Phases 201, 202, 204, 205, and 206 with blocker ownership.
- [ ] `scripts/orchestration/check-run-upstream-readiness.mjs` - hard and soft preflight for tenancy, MCP, CLI, pricing, and compliance substrate.
- [ ] `scripts/orchestration/check-run-architecture-lock.mjs` - forbidden-pattern detector for second-run-substrate drift, approval bypass, unmetered run close, and client-owned task persistence.
- [ ] `scripts/orchestration/assert-contract-lock-baseline.mjs` - baseline validator for contract-lock, migration allocation, and validation coverage.
- [ ] `test/agentrun/phase-207/preflight/upstream-readiness.test.js`
- [ ] `test/agentrun/phase-207/preflight/architecture-lock.test.js`
- [ ] `test/agentrun/phase-207/preflight/contract-lock-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dangerous-mutation approval sanity check | RUN-06 | State-machine tests can pass while operator-facing approval posture is still unclear in practice. | Review one `external.send` or `price.change` run and confirm the approval policy, task handoff, and denial path are understandable. |
| CRM/MCP compatibility sanity check | RUN-07, RUN-08 | Integration tests can pass while legacy consumers still feel semantically different to operators. | Review one CRM-originated run and one MCP-originated run and confirm they share recognizable IDs, state semantics, and cost/approval traces. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, and contract-lock baseline
- **Domain 1:** contract lock, schema baseline, migration/F-ID allocation, shared runtime constants
- **Domain 2:** durable run API, event store, SSE/event stream, and CLI/UI/MCP consumer posture
- **Domain 3:** scheduler, priority, concurrency, starvation, retry, timeout, pause, cancel, and DLQ
- **Domain 4:** approval-aware side effects, run-to-task handoff hooks, and task-link invariants
- **Domain 5:** estimated cost, actual cost, pricing context, and billing usage bridge
- **Domain 6:** CRM/MCP/onboarding adapters, registry, runnability checks, and compatibility rollout

Architecture lock runs first in every wave. It should verify:

- required posture exists: `markos_agent_runs`, MCP pipeline approval/cost middleware, CLI run/status consumers, pricing context doctrine, and Phase 206 governance posture
- forbidden Phase 207 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `second run substrate`, `client-owned task persistence`, `approval bypass`, and `unmetered run close`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `RUN-01..08` and `QA-01..15` are distributed across Plans 01-06; task-system work is treated as downstream integration into Phase 208 instead of primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, contract-lock baseline, and second-substrate prevention |
| 4. Compliance enforcement | LOCKED | Phase 206 is an explicit upstream gate before dangerous-mutation approval posture becomes canonical |
| 5. Cross-phase coordination | LOCKED | Phase 207 integrates with 201/202/204/205/206 directly and hands clean substrate contracts to 208-212 and later agent families |
| 6. Single-writer / governance posture | LOCKED | Phase 207 owns orchestration substrate; Phase 208 owns the human task/approval system requirement family |
| 7. Test runner pinned | LOCKED | Node `--test` + `vitest` per domain; no ambiguous runner drift |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 207-agentrun-v2-orchestration-substrate*
*Validation strategy created: 2026-04-27*
*Source: 207-RESEARCH.md + 207-REVIEWS.md*
