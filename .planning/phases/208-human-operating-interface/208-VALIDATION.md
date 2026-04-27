---
phase: 208
slug: human-operating-interface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 208 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/operator-cockpit/phase-208/preflight/` |
| **Full suite command** | `npm test -- test/operator-cockpit/phase-208/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/operator-cockpit/phase-208/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/operator-cockpit/phase-208/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 208-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/operator-cockpit/phase-208/preflight/` | W0 missing | pending |
| 208-01-01 | 01 | 1 | TASK-05 | shell-route-contract | `npm test -- test/operator-cockpit/phase-208/domain-1/` | W0 missing | pending |
| 208-02-01 | 02 | 2 | TASK-02 | morning-brief-contract | `npm test -- test/operator-cockpit/phase-208/domain-2/` | W0 missing | pending |
| 208-03-01 | 03 | 3 | TASK-01, TASK-03 | task-board-contract | `npm test -- test/operator-cockpit/phase-208/domain-3/` | W0 missing | pending |
| 208-04-01 | 04 | 4 | TASK-04 | approval-inbox-contract | `npm test -- test/operator-cockpit/phase-208/domain-4/` | W0 missing | pending |
| 208-05-01 | 05 | 5 | TASK-01 | recovery-center-contract | `npm test -- test/operator-cockpit/phase-208/domain-5/` | W0 missing | pending |
| 208-06-01 | 06 | 6 | TASK-02, TASK-05 | weekly-narrative-contract | `npm test -- test/operator-cockpit/phase-208/domain-6/weekly-narrative.test.js` | W0 missing | pending |
| 208-06-02 | 06 | 6 | QA-14, QA-15 | future-integration-boundaries | `npm test -- test/operator-cockpit/phase-208/domain-6/future-integrations.test.js` | W0 missing | pending |

---

## Wave 0 Requirements

- [ ] `.planning/operator-cockpit/208-upstream-readiness.md` - authoritative readiness checklist for Phases 205-207 with blocker ownership.
- [ ] `scripts/operator-cockpit/check-interface-upstream-readiness.mjs` - hard and soft preflight for pricing, compliance, and AgentRun substrate.
- [ ] `scripts/operator-cockpit/check-interface-architecture-lock.mjs` - forbidden-pattern detector for second-dashboard drift, desktop-only critical actions, and hidden future-phase assumptions.
- [ ] `scripts/operator-cockpit/assert-shell-baseline.mjs` - baseline validator for plan-to-validation coverage and shell doctrine assumptions.
- [ ] `test/operator-cockpit/phase-208/preflight/upstream-readiness.test.js`
- [ ] `test/operator-cockpit/phase-208/preflight/architecture-lock.test.js`
- [ ] `test/operator-cockpit/phase-208/preflight/shell-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shell posture sanity check | TASK-02, TASK-05 | Contract tests can pass while the shell still feels like a passive admin dashboard. | Review the landing route and nav labels and confirm the first screen prompts decisions, not generic monitoring. |
| Mobile operator action sanity check | TASK-05 | Contract tests can pass while approve/reject/recover actions still require desktop-only layouts in practice. | Review one Morning Brief item, one approval item, and one recovery item in narrow viewport design states and confirm they remain actionable. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, and plan-to-validation baseline
- **Domain 1:** shell route contract, default landing route, mobile-priority policy
- **Domain 2:** Morning Brief sections, urgency, owner, next action, and placeholder states
- **Domain 3:** Task Board record shape, grouping, status transitions, blocked state, approval-required state
- **Domain 4:** Approval Inbox preview, pricing/compliance posture, rejection reason, evidence placeholder states
- **Domain 5:** Recovery Center failure family, impacted-work visibility, owner, and translation gate handling
- **Domain 6:** Weekly Narrative contract, placeholder sections, and future integration boundary matrix

Architecture lock runs first in every wave. It should verify:

- required posture exists: `app/(markos)/layout-shell.tsx`, `app/(markos)/operations/page.tsx`, `PRC-09`, `COMP-01`, and `RUN-01..08`
- forbidden Phase 208 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `second dashboard shell`, `desktop-only approval`, `future-phase data assumption`, and `hidden rejection reason`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `TASK-01..05` and `QA-01..15` are distributed across Plans 01-06; evidence, connector, loop, and learning families remain translation gates or integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, shell-drift guardrails, and future-phase boundary lock |
| 4. Compliance enforcement | LOCKED | Plans 02 and 04 require pricing/compliance posture now and reserve evidence-specific blocking for Phase 209 translation |
| 5. Cross-phase coordination | LOCKED | Phase 208 depends on P205-P207 directly and defines explicit translation gates for P209-P212 instead of silently borrowing their substrate |
| 6. Single-writer / governance posture | LOCKED | Phase 208 creates cockpit contracts and operator surfaces; it does not re-own evidence, connector, loop, or learning engines |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 208-human-operating-interface*
*Validation strategy created: 2026-04-27*
*Source: 208-RESEARCH.md + 208-REVIEWS.md*
