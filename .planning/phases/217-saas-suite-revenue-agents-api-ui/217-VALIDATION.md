---
phase: 217
slug: saas-suite-revenue-agents-api-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 217 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` (matches P204 D-49 / P218 / P219 / P220 / P226 D-82 architecture-lock) |
| **Config file** | none — uses Node built-in test runner |
| **Quick run command** | `npm test -- test/saas-217/preflight/` |
| **Full suite command** | `npm test -- test/saas-217/ test/api-contracts/saas-217-*` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/saas-217/<domain>/<task>.test.js`
- **After every plan wave:** Run `npm test -- test/saas-217/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map (will populate during planning)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 217-01-00 | 01 | 1 | QA-01,02 | preflight | `npm test -- test/saas-217/preflight/` | ❌ W0 | ⬜ pending |
| 217-01-01 | 01 | 1 | SAS-09 | schema+trigger | `npm test -- test/saas-217/domain-1/` | ❌ W0 | ⬜ pending |
| 217-02-01 | 02 | 2 | SAS-09 | schema+trigger | `npm test -- test/saas-217/domain-2/` | ❌ W0 | ⬜ pending |
| 217-03-01 | 03 | 2 | SAS-10 | schema+trigger | `npm test -- test/saas-217/domain-3/` | ❌ W0 | ⬜ pending |
| 217-04-01 | 04 | 3 | API-01 | api-contract | `npm test -- test/saas-217/domain-4/ test/api-contracts/saas-217-*` | ❌ W0 | ⬜ pending |
| 217-05-01 | 05 | 3 | MCP-01 | mcp-tool | `npm test -- test/saas-217/domain-5/` | ❌ W0 | ⬜ pending |
| 217-06-01 | 06 | 4 | translation-gate + closeout | regression | `npm test -- test/saas-217/domain-6/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

Detailed per-task map populates during planning iteration; planner expands rows per Plan task.

---

## Wave 0 Requirements

- [ ] `scripts/preconditions/217-check-upstream.cjs` — assertUpstreamReady CLI for HARD upstreams (P202 MCP + P208 approvals + P214 SaaSSuiteActivation + P215 billing + P216 product usage/health) + SOFT (P205, P207, P209-P213)
- [ ] `lib/markos/saas/preflight/upstream-gate.ts` — runtime helper
- [ ] `lib/markos/saas/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/saas/preflight/errors.ts` — UpstreamPhaseNotLandedError
- [ ] `test/saas-217/preflight/architecture-lock.test.js`
- [ ] `test/saas-217/preflight/upstream-gate.test.js`
- [ ] `test/saas-217/preflight/helper-presence.test.js` — verifies buildApprovalPackage / requireHostedSupabaseAuth / resolvePlugin exist; createApprovalPackage / requireSupabaseAuth / lookupPlugin DO NOT
- [ ] Test fixtures under `test/fixtures/saas-217/*.js` (NOT `.ts` per architecture-lock)
- [ ] CREATE `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (P217 is FIRST upstream phase to ship the doc — P218 will append once P217 executes; P217 row claims slots 98-99 + F-247..F-258)
  - Document collision history: foundation 82-89 + slot 96 + crm slot 100 ON DISK; P220 90-95+97 reserved; P218 101-106 reserved; P219 107-111 reserved (Q-7 fix from P218 review)
  - Forward-allocation: P217 = 98, 99 (only 2 free slots upstream; multi-table per slot consolidation)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Revenue metric formula audit | SAS-09 | Formulas (MRR/ARR/NRR/GRR/churn/expansion/contraction/cohorts/forecast) require finance-ops sign-off; canonical correctness goes beyond automated tests | Operator reviews `saas_revenue_metric_definitions` formulas + source_precedence + reconciliation_state per metric; signs-off via approval inbox |
| MRR reconciliation operator review | SAS-09 | Source disagreement (billing vs processor vs accounting vs CRM vs manual) requires human judgment for `reconciled` vs `degraded` state | Operator reviews `saas_mrr_snapshots.reconciliation_state` for `degraded` rows before downstream consumers (P219 expansion-signal-scanner) read |
| First SaaS tenant nav activation | SAS-10 | First tenant flipping `saas_suite_activations.active=true` triggers visible UI; needs operator validation that nav routes appear correctly | Operator reviews `saas_nav_visibility` for first tenant after activation; confirms nav appears + activation-gate trigger fires |
| API/MCP UI gate validation | API-01, MCP-01 | API endpoints + MCP tools surface for activated tenants only; needs validation in staging before customer rollout | Operator activates test tenant + smoke-tests `/v1/saas/*` endpoints + `markos-saas` MCP tools via UI before broader rollout |
| Post-217 translation gate confirmation | SAS-10, translation-gate-for [P218,P219,P220] | Confirms growth modules (PLG/EXP/ABM/VRL/IAM/CMT/EVT/XP/PR/PRT/DEV/REV) remain `planned_only=true` and `runnable=false` in registry; assures premature activation cannot occur | Operator reviews translation-gate test output + confirms all 12 SG nav rows have `planned_only=true` + 0 growth-module agents `runnable=true` |

---

## Validation Architecture (carry from RESEARCH.md)

Source: `217-RESEARCH.md` §Validation Architecture (Wave 0 surface; all tests are gaps)

**Per-domain test strategy:**
- **Domain 1 (Revenue metric defs + source precedence):** unit (RLS, schema, formula validators, source_precedence array), integration (DB-trigger `REVENUE_METRIC_REQUIRES_PROVENANCE` requires formula+source+timestamp+reconciliation_state non-null), regression (no migration-slot 96/100 collision)
- **Domain 2 (MRR snapshots + waterfall):** unit (RLS, schema, MRR/NRR/expansion math, snapshot-builder), integration (DB-trigger `MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE`; cron nightly snapshot reads P215 billing), regression (P215 backwards-compat — schema unchanged)
- **Domain 3 (SAS agent readiness registry):** unit (8-flag readiness GENERATED column), integration (DB-trigger `SAS_AGENT_ACTIVATION_REQUIRES_READINESS`; SAS-01..06 seeded `runnable=false`), regression (no naming collision with P218/P219/P220 growth-agent tables)
- **Domain 4 (`/v1/saas/*` API contracts):** unit (handler shape, RLS, auth via requireHostedSupabaseAuth), contract (OpenAPI F-247..F-254 paths exist + reference schemas), regression (no api/v1/.../route.ts; legacy api/*.js)
- **Domain 5 (`markos-saas` MCP tool family):** unit (tool registration, tenant-session-bound, mutating: false), integration (lib/markos/mcp/tools/saas.cjs registered in index.cjs), regression (no .ts MCP files)
- **Domain 6 (UI nav + activation gate + translation gate + closeout):** unit (saas_nav_visibility schema), integration (DB-trigger `SAAS_NAV_REQUIRES_ACTIVATION`; reads `saas_suite_activations.active` from P214), regression (translation-gate test asserts SG-01..12 nav rows planned_only=true; slot-collision regression asserts P217 didn't touch P218-P220 slots; all-domains architecture-lock RE-RUN; requirements-coverage assertion)

**Architecture-lock regression:** `test/saas-217/preflight/architecture-lock.test.js` runs FIRST in every wave; scans 217-*-PLAN.md bodies + lib/markos/saas/* + lib/markos/{revenue,mrr,sas-agents,api,mcp-saas,nav}/* + api/v1/saas/* + api/cron/saas-* for forbidden patterns (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(saas), api/v1/.../route.ts, vitest, playwright, .test.ts, .ts MCP files). Fails wave if any positive invocation found.

**Helper-presence regression:** verifies buildApprovalPackage @ `lib/markos/crm/agent-actions.ts:68`, requireHostedSupabaseAuth @ `onboarding/backend/runtime-context.cjs:491`, resolvePlugin @ `lib/markos/plugins/registry.js:102`, `lib/markos/mcp/tools/index.cjs` (NOT .ts), `contracts/openapi.json` (NOT public/openapi.json) all exist; forbidden aliases NOT present anywhere in `lib/markos/`.

---

## Dimensions Coverage (Nyquist 8 dimensions per RESEARCH §Validation Architecture)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | All P217-owned IDs (SAS-09, SAS-10, MCP-01, API-01, QA-01..15) mapped to plans during planning iteration; LOOP-01..08 = `integrates_with: P211` (NOT requirements); SG-01..12 in Plan 06 = `translation_gate_for: [P218, P219, P220]` (NOT requirements) |
| 2. Anti-shallow execution | DRAFT | Every task has `<read_first>` + grep/test-verifiable `<acceptance_criteria>` + concrete `<action>` per planning iteration |
| 3. Architecture-lock | LOCKED | Plan 01 Task 0.5 forbidden-pattern detector + helper-presence + assertUpstreamReady |
| 4. Compliance enforcement | LOCKED | DB-trigger compliance per domain (REVENUE_METRIC_REQUIRES_PROVENANCE, MRR_SNAPSHOT_REQUIRES_RECONCILIATION_STATE, SAS_AGENT_ACTIVATION_REQUIRES_READINESS, SAAS_NAV_REQUIRES_ACTIVATION) + arch-lock tests for API/MCP (file-artifact domains) |
| 5. Cross-phase coordination | DRAFT | Q-1..Q-8 resolved in research; P217 → P218+P219+P220 contract documented (`saas_mrr_snapshots`, `saas_suite_activations` consumption); P217 first phase to CREATE V4.1.0-MIGRATION-SLOT-COORDINATION.md |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Per RESEARCH §Compliance Enforcement Boundary Summary (4 DB-triggers + 2 architecture-lock tests for file-artifact domains) |
| 7. Test runner pinned | LOCKED | Node `--test` + `node:assert/strict`; NO vitest/playwright |
| 8. Validation strategy (this doc) | DRAFT | Will be filled during planning iteration |

---

*Phase: 217-saas-suite-revenue-agents-api-ui*
*Validation strategy created: 2026-04-26*
*Source: 217-RESEARCH.md + 217-REVIEWS.md*
