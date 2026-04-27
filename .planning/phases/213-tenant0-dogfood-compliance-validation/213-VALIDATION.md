---
phase: 213
slug: tenant0-dogfood-compliance-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 213 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/tenant-zero/phase-213/preflight/` |
| **Full suite command** | `npm test -- test/tenant-zero/phase-213/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/tenant-zero/phase-213/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/tenant-zero/phase-213/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 213-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/tenant-zero/phase-213/preflight/` | ❌ W0 | ⬜ pending |
| 213-01-01 | 01 | 1 | T0-01, T0-02 | workspace+policy | `npm test -- test/tenant-zero/phase-213/preflight/` | ❌ W0 | ⬜ pending |
| 213-02-01 | 02 | 2 | T0-01, T0-02 | loop-flow | `npm test -- test/tenant-zero/phase-213/domain-2/` | ❌ W0 | ⬜ pending |
| 213-03-01 | 03 | 3 | T0-03 | pricing-gate | `npm test -- test/tenant-zero/phase-213/domain-3/` | ❌ W0 | ⬜ pending |
| 213-04-01 | 04 | 4 | T0-04 | claim-audit | `npm test -- test/tenant-zero/phase-213/domain-4/` | ❌ W0 | ⬜ pending |
| 213-05-01 | 05 | 5 | T0-05, QA-14 | matrix+gap-register | `npm test -- test/tenant-zero/phase-213/domain-5/requirement-matrix.test.js` | ❌ W0 | ⬜ pending |
| 213-05-02 | 05 | 5 | T0-05, QA-15 | go-no-go | `npm test -- test/tenant-zero/phase-213/domain-5/go-no-go-decision.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## Wave 0 Requirements

- [ ] `.planning/tenant-zero/213-upstream-readiness.md` - authoritative P205-P212 readiness checklist with blocker ownership.
- [ ] `scripts/tenant-zero/check-upstream-readiness.mjs` - hard and soft preflight for upstream execution outputs.
- [ ] `scripts/tenant-zero/check-architecture-lock.mjs` - forbidden-pattern detector for fake proof, invalid public-pricing release, and nonstandard test/router surfaces.
- [ ] `scripts/tenant-zero/assert-tenant-workspace-ready.mjs` - workspace-profile, connector inventory, and data-policy validator.
- [ ] `test/tenant-zero/phase-213/preflight/upstream-readiness.test.js`
- [ ] `test/tenant-zero/phase-213/preflight/architecture-lock.test.js`
- [ ] `test/tenant-zero/phase-213/preflight/workspace-baseline.test.js`
- [ ] `test/tenant-zero/phase-213/preflight/public-private-policy.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real connector publication sanity check | T0-02, CONN-01..06 | The first dogfood loop may end in `published` or `ready_to_publish` depending on live connector health. An operator must confirm the state is honest. | Review the loop dispatch artifact; confirm the connector status matches reality and that degraded connectors produce a recovery blocker instead of fake publication. |
| Public proof wording review | T0-04, COMP-01 | Evidence can be audited automatically, but final public language still needs human review for nuance and overclaim risk. | Read the public claim audit summary and the compliance language boundary doc; confirm every public sentence is classified as `implemented_verified`, `roadmap_only`, or `internal_only`. |
| 214-217 go/no-go readout | T0-05 | The gate is an operational decision, not just a parser result. | Review the final readiness summary with the unresolved-gap register and confirm the go/no-go artifact explicitly calls out green, yellow, or red status for Phases 214-217. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, workspace-profile integrity, public/private data classification
- **Domain 2:** first real loop artifact chain from brief -> claim map -> approval -> dispatch -> measurement -> learning handoff
- **Domain 3:** pricing placeholder regression, approved recommendation linkage, release gate classification
- **Domain 4:** public claim audit, case-study readiness policy, compliance language boundary
- **Domain 5:** requirement matrix completeness, unresolved-gap visibility, and 214-217 go/no-go determinism

Architecture lock runs first in every wave. It should verify:

- required posture exists: `{{MARKOS_PRICING_ENGINE_PENDING}}`, `buildGovernanceEvidencePack`, `buildReadinessReport`, `normalizeAgentRunUsageEvent`, and the Phase 205 Tenant 0 pricing dogfood artifacts
- forbidden phase-213 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `synthetic proof`, `fake case study`, `mock customer logo`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `T0-01..05` and `QA-01..15` are distributed across Plans 01-05; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, fake-proof guard, public-pricing guard, and test-surface lock |
| 4. Compliance enforcement | LOCKED | Plans 03-05 require evidence linkage, approval linkage, freshness status, and explicit go/no-go status |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates execution on Phases 205-212 outputs instead of letting P213 silently absorb upstream gaps |
| 6. Single-writer / governance posture | LOCKED | P213 validates and links upstream artifacts; it does not re-own upstream Pricing Engine, compliance, evidence, connector, or loop substrate |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 213-tenant0-dogfood-compliance-validation*
*Validation strategy created: 2026-04-27*
*Source: 213-RESEARCH.md + 213-REVIEWS.md*
