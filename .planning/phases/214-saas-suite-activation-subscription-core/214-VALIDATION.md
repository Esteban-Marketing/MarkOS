---
phase: 214
slug: saas-suite-activation-subscription-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 214 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/saas-214/preflight/` |
| **Full suite command** | `npm test -- test/saas-214/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/saas-214/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/saas-214/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 214-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/saas-214/preflight/` | ❌ W0 | ⬜ pending |
| 214-01-01 | 01 | 1 | SAS-01, SAS-02 | schema+trigger | `npm test -- test/saas-214/domain-1/` | ❌ W0 | ⬜ pending |
| 214-02-01 | 02 | 2 | SAS-02, SAS-03 | schema+contract | `npm test -- test/saas-214/domain-2/` | ❌ W0 | ⬜ pending |
| 214-03-01 | 03 | 3 | SAS-03 | lifecycle+trigger | `npm test -- test/saas-214/domain-3/` | ❌ W0 | ⬜ pending |
| 214-04-01 | 04 | 3 | SAS-03 | bridge+rls | `npm test -- test/saas-214/domain-4/` | ❌ W0 | ⬜ pending |
| 214-05-01 | 05 | 4 | SAS-03 | governance+audit | `npm test -- test/saas-214/domain-5/` | ❌ W0 | ⬜ pending |
| 214-06-01 | 06 | 5 | SAS-01, SAS-02, SAS-03 | api+mcp+ui gating | `npm test -- test/saas-214/domain-6/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## Wave 0 Requirements

- [ ] `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` - Phase 214 creates the v4.1.0 coordination document because it is first in execution order.
- [ ] `lib/markos/saas/core/preflight/upstream-gate.ts` - hard/soft upstream assertions for Pricing Engine, AgentRun, approvals, and CRM substrate.
- [ ] `lib/markos/saas/core/preflight/architecture-lock.ts` - forbidden-pattern and helper-presence detector.
- [ ] `lib/markos/saas/core/preflight/errors.ts` - typed preflight error surface.
- [ ] `lib/markos/saas/core/preflight/index.cjs` - CommonJS bridge for legacy handlers.
- [ ] `scripts/preconditions/214-01-check-upstream.cjs` - CLI preflight entrypoint.
- [ ] `test/saas-214/preflight/wave-0-baseline.test.js`
- [ ] `test/saas-214/preflight/architecture-lock.test.js`
- [ ] `test/saas-214/preflight/upstream-gate.test.js`
- [ ] `test/saas-214/preflight/helper-presence.test.js`
- [ ] `test/fixtures/saas-214/*.js` fixture barrel and per-domain factories.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| First activation wizard walkthrough | SAS-01, SAS-02 | Operator confirmation copy, defaults, and blocking states need UX review | Activate a SaaS tenant and a non-SaaS tenant in staging; confirm the SaaS tenant can complete the wizard and the non-SaaS tenant remains blocked. |
| Approval posture on risky lifecycle changes | SAS-03 | Approver language and escalation routing need operator sign-off | Simulate pause, cancel, upgrade, and downgrade requests; confirm each creates the expected approval/task path and visible audit trail. |
| Growth extension non-activation review | SAS-03 | Phase 214 intentionally stores extension metadata without activation | Confirm `saas_growth_extension_points.is_runnable = false` for every seed row and that no growth nav/routes appear. |

---

## Validation Architecture

- **Domain 1:** activation gate, `business_type` normalization, activation trigger, activation-table RLS
- **Domain 2:** SaaS profile/plan/subscription/event schema, plan pricing sentinel enforcement, append-only event log
- **Domain 3:** state machine validity, approval-required transitions, idempotency, rollback records
- **Domain 4:** CRM identity bridge linking, conflict review, orphan handling, merge-review task creation
- **Domain 5:** mutation-request linkage, audit/evidence requirements, approval-package visibility
- **Domain 6:** API/MCP/operator gating plus growth-extension non-activation regression

Architecture-lock runs first in every wave. It should verify:

- `buildApprovalPackage`, `requireHostedSupabaseAuth`, `resolvePlugin`, `lib/markos/mcp/tools/index.cjs`, and `contracts/openapi.json` exist
- `createApprovalPackage`, `requireSupabaseAuth`, `lookupPlugin`, `route.ts`, `vitest`, `playwright`, and `.test.ts` do not appear in the planned Phase 214 surface

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | SAS-01..03 mapped across Plans 01-06; PRC-09, RUN-01..08, TASK-01..05, and EVD-01..06 remain integration surfaces rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan has explicit `<read_first>`, `<action>`, `<verify>`, and `<done>` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns preflight, helper-presence, and forbidden-pattern detection |
| 4. Compliance enforcement | LOCKED | Activation, pricing-sentinel, lifecycle approval, bridge identity, and evidence-pack enforcement triggers are specified in research and plans |
| 5. Cross-phase coordination | DRAFT | P214 owns creation of the v4.1.0 coordination doc and documents its execution-order/slot-order split |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Subscription transitions and risky lifecycle mutations are forced through request/event tables and trigger checks |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 214-saas-suite-activation-subscription-core*
*Validation strategy created: 2026-04-27*
*Source: 214-RESEARCH.md + 214-REVIEWS.md*
