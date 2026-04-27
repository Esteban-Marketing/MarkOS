---
phase: 210
slug: connector-wow-loop-and-recovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 210 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/connectors/phase-210/preflight/` |
| **Full suite command** | `npm test -- test/connectors/phase-210/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/connectors/phase-210/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/connectors/phase-210/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 210-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/connectors/phase-210/preflight/` | W0 missing | pending |
| 210-01-01 | 01 | 1 | CONN-01 | connector-install-contract | `npm test -- test/connectors/phase-210/domain-1/` | W0 missing | pending |
| 210-02-01 | 02 | 2 | CONN-06 | adapter-matrix | `npm test -- test/connectors/phase-210/domain-2/` | W0 missing | pending |
| 210-03-01 | 03 | 3 | CONN-02 | onboarding-recommendation | `npm test -- test/connectors/phase-210/domain-3/` | W0 missing | pending |
| 210-04-01 | 04 | 4 | CONN-03, CONN-05 | wow-audit | `npm test -- test/connectors/phase-210/domain-4/` | W0 missing | pending |
| 210-05-01 | 05 | 5 | CONN-04 | pause-and-recovery | `npm test -- test/connectors/phase-210/domain-5/` | W0 missing | pending |
| 210-06-01 | 06 | 6 | CONN-01, CONN-04 | sync-and-recovery-evidence | `npm test -- test/connectors/phase-210/domain-6/sync-evidence.test.js` | W0 missing | pending |
| 210-06-02 | 06 | 6 | CONN-05, CONN-06 | future-connector-compatibility | `npm test -- test/connectors/phase-210/domain-6/future-compatibility.test.js` | W0 missing | pending |

---

## Wave 0 Requirements

- [ ] `.planning/connectors/210-upstream-readiness.md` - authoritative readiness checklist for Phases 206-209 with blocker ownership.
- [ ] `scripts/connectors/check-connector-upstream-readiness.mjs` - hard and soft preflight for compliance, run linkage, task routing, and evidence posture.
- [ ] `scripts/connectors/check-connector-architecture-lock.mjs` - forbidden-pattern detector for plain-text secrets, silent degradation, too-many recommendations, and write-capable first-wow posture.
- [ ] `scripts/connectors/assert-connector-contract-baseline.mjs` - baseline validator for plan-to-validation coverage and connector doctrine assumptions.
- [ ] `test/connectors/phase-210/preflight/upstream-readiness.test.js`
- [ ] `test/connectors/phase-210/preflight/architecture-lock.test.js`
- [ ] `test/connectors/phase-210/preflight/contract-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Secret redaction sanity check | CONN-01 | Contract tests can pass while logs or prompts still expose sensitive connector details in practice. | Review one ConnectorInstall payload and one recovery task payload and confirm only `credential_ref` is present, never raw tokens or secrets. |
| Wow-audit usefulness sanity check | CONN-03, CONN-05 | The audit can be structurally valid while still not delivering a useful operator outcome. | Review one `ready` wow audit and one `recovery_needed` outcome and confirm the operator either gets actionable insight or a precise recovery task, not a passive status card. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, and plan-to-validation baseline
- **Domain 1:** ConnectorInstall contract, status transitions, auth types, secret redaction
- **Domain 2:** adapter decision matrix, provider rows, official-doc traceability, decision vocabulary
- **Domain 3:** onboarding recommendation logic, max-3 enforcement, wow-promise copy, failure-task generation
- **Domain 4:** first wow audit outcomes, fallback paths, time-to-connect and time-to-wow posture
- **Domain 5:** dependent-agent pause, impacted-run linkage, recovery-task creation, safe resumption
- **Domain 6:** sync/backfill/retry/DLQ evidence, freshness posture, future connector compatibility map

Architecture lock runs first in every wave. It should verify:

- required posture exists: `createSession`, `revokeSession`, `subscribe`, `unsubscribe`, `getOutboundChannelCapabilities`, and the Phase 206-209 planning artifacts
- forbidden Phase 210 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `plain text access token`, `silent connector degradation`, `recommend four connectors`, `write-capable first wow`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `CONN-01..06` and `QA-01..15` are distributed across Plans 01-06; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, secret-handling guardrails, and nonstandard-surface lock |
| 4. Compliance enforcement | LOCKED | Plans 01, 04, and 06 require privacy, consent, evidence, and recovery posture before connector outputs are trusted |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates Phase 210 on P206-P209 readiness rather than letting connector work absorb missing upstream systems |
| 6. Single-writer / governance posture | LOCKED | Phase 210 creates connector contracts and recovery rules; it does not re-own run, task, evidence, or compliance substrate |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 210-connector-wow-loop-and-recovery*
*Validation strategy created: 2026-04-27*
*Source: 210-RESEARCH.md + 210-REVIEWS.md*
