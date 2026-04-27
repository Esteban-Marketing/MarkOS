---
phase: 206
slug: soc2-type1-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 206 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` + `vitest` |
| **Config file** | repo default test config; phase suites live under `test/compliance/phase-206/` |
| **Quick run command** | `npm test -- test/compliance/phase-206/preflight/` |
| **Full suite command** | `npm test -- test/compliance/phase-206/` |
| **Estimated runtime** | ~45-90s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/compliance/phase-206/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/compliance/phase-206/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~90s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 206-01-00 | 01 | 1 | COMP-01, QA-01 | preflight | `npm test -- test/compliance/phase-206/preflight/` | W0 missing | pending |
| 206-01-01 | 01 | 1 | COMP-01, QA-02 | control-registry-baseline | `npm test -- test/compliance/phase-206/domain-1/` | W0 missing | pending |
| 206-02-01 | 02 | 2 | COMP-01, QA-03 | ai-governance-approval | `npm test -- test/compliance/phase-206/domain-2/` | W0 missing | pending |
| 206-03-01 | 03 | 3 | COMP-01, QA-04 | pricing-billing-controls | `npm test -- test/compliance/phase-206/domain-3/` | W0 missing | pending |
| 206-04-01 | 04 | 4 | COMP-01, QA-05 | connector-vendor-review | `npm test -- test/compliance/phase-206/domain-4/` | W0 missing | pending |
| 206-05-01 | 05 | 5 | COMP-01, QA-06 | evidence-automation | `npm test -- test/compliance/phase-206/domain-5/` | W0 missing | pending |
| 206-06-01 | 06 | 6 | COMP-01, QA-07 | incident-bcp-dr | `npm test -- test/compliance/phase-206/domain-6/` | W0 missing | pending |
| 206-07-01 | 07 | 7 | COMP-01, QA-08 | auditor-package | `npm test -- test/compliance/phase-206/domain-7/` | W0 missing | pending |

---

## Wave 0 Requirements

- [ ] `.planning/compliance/206-upstream-readiness.md` - authoritative readiness checklist for Phases 200-205 plus translation posture for 207-217 and future placeholders for 218-220.
- [ ] `scripts/compliance/check-upstream-readiness.mjs` - hard and soft preflight for current platform, tenancy, webhook, CLI, pricing, and billing substrate.
- [ ] `scripts/compliance/check-architecture-lock.mjs` - forbidden-pattern detector for shadow compliance stores, ownership drift, fake implementation coverage, unsupported enterprise claims, and approval-bypass doctrine.
- [ ] `scripts/compliance/assert-control-registry-baseline.mjs` - baseline validator for control registry, translation-map coverage, and validation rows.
- [ ] `test/compliance/phase-206/preflight/upstream-readiness.test.js`
- [ ] `test/compliance/phase-206/preflight/architecture-lock.test.js`
- [ ] `test/compliance/phase-206/preflight/control-registry-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public enterprise-claim sanity check | COMP-01 | Static tests can pass while human-facing compliance positioning still overstates reality. | Review one enterprise-facing claim path and confirm it is either evidence-backed, placeholder-bound, or explicitly blocked. |
| Subprocessor and privacy classification sanity check | COMP-01 | Vendor classifications often require legal or operator judgement beyond code-level assertions. | Review one connector/provider entry and confirm data class, retention, revocation, and export posture are understandable and bounded. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, and control-registry baseline
- **Domain 1:** control registry, object inventory, and translation-map doctrine
- **Domain 2:** AI governance, mutation classes, unsupported-claim policy, and approval posture
- **Domain 3:** pricing, billing, and SaaS financial control mapping
- **Domain 4:** connector privacy, vendor posture, retention, and recovery evidence
- **Domain 5:** evidence automation, claim safety, learning governance, and public-proof boundaries
- **Domain 6:** incident response, BCP, DR, and pen-test posture
- **Domain 7:** auditor workspace, exception register, and Type I package readiness

Architecture lock runs first in every wave. It should verify:

- required posture exists: tenancy and audit substrate, MCP approval middleware, webhook evidence, CLI diagnostics, pricing placeholder doctrine, and billing evidence posture
- forbidden Phase 206 patterns do not appear: `shadow compliance store`, `implementation ownership equals compliance ownership`, `future module treated as implemented`, `enterprise claim without proof`, and `approval bypass exception`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `COMP-01` and `QA-01..15` are distributed across Plans 01-07; downstream product families are treated as translation gates or integrations instead of re-owned scope |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, registry baseline, and future-scope versus active-scope separation |
| 4. Compliance enforcement | LOCKED | Phase 206 is the direct owner of governance doctrine for dangerous mutations, public claims, and evidence posture |
| 5. Cross-phase coordination | LOCKED | Phase 206 integrates with 200-205 and defines translation posture for 207-217 plus future placeholders for 218-220 |
| 6. Single-writer / governance posture | LOCKED | Phase 206 owns compliance doctrine; downstream phases own implementation of their respective product families |
| 7. Test runner pinned | LOCKED | Node `--test` + `vitest` per domain; no ambiguous runner drift |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 206-soc2-type1-foundation*
*Validation strategy created: 2026-04-27*
*Source: 206-RESEARCH.md + 206-REVIEWS.md*
