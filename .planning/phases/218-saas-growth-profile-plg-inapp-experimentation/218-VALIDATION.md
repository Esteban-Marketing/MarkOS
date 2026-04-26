---
phase: 218
slug: saas-growth-profile-plg-inapp-experimentation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 218 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` (matches P204 D-49 / P219 / P220 / P221 D-36 / P226 D-82 architecture-lock) |
| **Config file** | none — uses Node built-in test runner |
| **Quick run command** | `npm test -- test/growth-218/preflight/` |
| **Full suite command** | `npm test -- test/growth-218/ test/api-contracts/218-*` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/growth-218/<domain>/<task>.test.js`
- **After every plan wave:** Run `npm test -- test/growth-218/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map (will populate during planning)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 218-01-00 | 01 | 1 | QA-01,02 | preflight | `npm test -- test/growth-218/preflight/` | ❌ W0 | ⬜ pending |
| 218-01-01 | 01 | 1 | SG-01, SG-09 | schema+trigger | `npm test -- test/growth-218/profile/` | ❌ W0 | ⬜ pending |
| 218-02-01 | 02 | 2 | SG-02, SG-09 | schema+trigger | `npm test -- test/growth-218/activation/ test/growth-218/pql/` | ❌ W0 | ⬜ pending |
| 218-03-01 | 03 | 2 | SG-02, SG-11, PRC-09 | schema+trigger | `npm test -- test/growth-218/upgrade-triggers/` | ❌ W0 | ⬜ pending |
| 218-04-01 | 04 | 3 | SG-05, SG-11, SG-12, PRC-09 | schema+trigger | `npm test -- test/growth-218/inapp/` | ❌ W0 | ⬜ pending |
| 218-05-01 | 05 | 3 | SG-07, SG-12 | schema+trigger | `npm test -- test/growth-218/experiments/` | ❌ W0 | ⬜ pending |
| 218-06-01 | 06 | 4 | SG-10, API-01, MCP-01 | api+mcp | `npm test -- test/api-contracts/218-* test/growth-218/agents/` | ❌ W0 | ⬜ pending |
| 218-06-02 | 06 | 4 | RUN-01..08, QA-03..15 | closeout | `npm test -- test/growth-218/closeout/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

Detailed per-task map populates during planning iteration; planner expands rows per Plan task.

---

## Wave 0 Requirements

- [ ] `scripts/preconditions/218-check-upstream.cjs` — assertUpstreamReady CLI for P214/P215/P216/P217 (hard) + P205/P207-P212 (soft)
- [ ] `lib/markos/growth/preflight/upstream-gate.ts` — runtime helper
- [ ] `lib/markos/growth/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/growth/preflight/errors.ts` — UpstreamPhaseNotLandedError + PricingEnginePendingError
- [ ] `test/growth-218/preflight/architecture-lock.test.js`
- [ ] `test/growth-218/preflight/upstream-gate.test.js`
- [ ] `test/growth-218/preflight/helper-presence.test.js` — verifies buildApprovalPackage / requireHostedSupabaseAuth / resolvePlugin exist; createApprovalPackage / requireSupabaseAuth / lookupPlugin DO NOT
- [ ] Test fixtures under `test/fixtures/growth-218/*.js` (NOT `.ts` per architecture-lock)
- [ ] CREATE `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` reserving P218 slots (recommended 101-103) + F-IDs estimated F-220..F-227
  - **NOTE Q-7:** Existing supabase/migrations/82-89 occupied by foundation (markos_audit_log/unverified_signups/passkey/sessions_devices/custom_domains/invites/mcp_sessions/mcp_cost_window). P219 reservation 85-89 collides — flagged for P219 cross-phase replan.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mode change operator review | SG-01 | Mode flip changes module activation across tenant — irreversible business decision; needs approval | Operator reviews `saas_growth_profiles.mode` change via approval inbox before commit |
| PQL threshold validation | SG-02 | PQL thresholds are tenant-specific; operator validates before automated scoring | Operator reviews `activation_definitions` thresholds + first 24h of PQL scores before scaling |
| Pricing copy editorial judgment (UpgradeTrigger) | SG-11, PRC-09 | Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` requires editorial review before activation | Operator reviews `upgrade_triggers.pricing_context_sentinel` content; replaces sentinel or confirms P205 routing |
| InApp campaign approval | SG-05, SG-12 | Customer-facing dispatch with monetization angle requires CX approval per CONTEXT non-negotiable #3 | Operator reviews `in_app_campaigns` activation via approval inbox; confirms suppression rules + frequency caps |
| Experiment guardrail validation | SG-07 | Guardrail metrics + decision criteria + learning handoff need owner sign-off before activation per CONTEXT non-negotiable #2 | Operator reviews `marketing_experiments` 5-field constraint (guardrails+owner+decision_criteria+learning_handoff+approval) before flip to active |
| First-run growth agent activation | SG-10 | No PLG/in-app/experiment agent runs without human checkpoint | Plan 06 `checkpoint:human-action` — operator reviews `growth_agent_readiness` per agent before flipping `contracts_assigned=true` |

---

## Validation Architecture (carry from RESEARCH.md)

Source: `218-RESEARCH.md` §Validation Architecture (Wave 0 surface; all tests are gaps)

**Per-domain test strategy:**
- **Domain 1 (SaaSGrowthProfile + ModeRouting):** unit (RLS, schema, mode ENUM, eligibility matrix 55 rows), integration (DB-trigger `MODE_REQUIRES_SAAS_ACTIVATION` + `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE`), regression (P214 SaaSSuiteActivation FK)
- **Domain 2 (ActivationDefinition + PQLScore):** unit (RLS, schema, milestone funnel UNIQUE, PQL scorer math), integration (DB-trigger `PQL_SCORE_REQUIRES_EVIDENCE`; cron PQL aging), regression (P216 product usage signal handoff)
- **Domain 3 (UpgradeTrigger):** unit (RLS, schema, condition DSL), integration (DB-trigger `UPGRADE_TRIGGER_PRICING_REQUIRED` accepts FK or sentinel; cron condition evaluation), regression (P205 sentinel upgrade path)
- **Domain 4 (InAppCampaign):** unit (RLS, schema, suppression rule evaluation, frequency cap math), integration (DB-trigger `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` + `INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK`; email coordination), regression (P208 approval inbox; messaging substrate from P223)
- **Domain 5 (MarketingExperiment):** unit (RLS, schema, ICE math, 5-field activation constraint), integration (DB-trigger `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING`; learning handoff writes to ArtifactPerformanceLog/TenantOverlay/LiteracyUpdateCandidate via P212), regression (P212 LRN-01..05 substrate integration)
- **Domain 6 (Growth Agent Readiness):** unit (PLG/in-app/experiment agents seeded `runnable=false` GENERATED column), integration (activation-gate trigger), regression (P217 SAS agent registry coordination — separate `growth_agent_readiness` table from `sas_agent_readiness`)

**Architecture-lock regression:** `test/growth-218/preflight/architecture-lock.test.js` runs FIRST in every wave; scans 218-*-PLAN.md bodies + lib/markos/growth/* + lib/markos/{profile,activation,pql,upgrade-triggers,inapp,experiments,growth-agents}/* + api/v1/growth/* + api/cron/growth-* for forbidden patterns (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(growth), api/v1/.../route.ts, vitest, playwright, .test.ts). Fails wave if any positive invocation found.

**Helper-presence regression:** verifies buildApprovalPackage @ `lib/markos/crm/agent-actions.ts:68`, requireHostedSupabaseAuth @ `onboarding/backend/runtime-context.cjs:491`, resolvePlugin @ `lib/markos/plugins/registry.js:102`, `lib/markos/mcp/tools/index.cjs` (NOT .ts), `contracts/openapi.json` (NOT public/openapi.json) all exist; forbidden aliases NOT present anywhere in `lib/markos/`.

---

## Dimensions Coverage (Nyquist 8 dimensions per RESEARCH §Validation Architecture)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | All phase IDs (SG-01/02/05/07/09/10/11/12 + SAS-09 [integrates_with P217] + PRC-09 + QA-01..15) mapped to plans during planning iteration; LRN-01..05 in Plan 05 = `integrates_with: P212` (NOT requirements) |
| 2. Anti-shallow execution | DRAFT | Every task has `<read_first>` + grep/test-verifiable `<acceptance_criteria>` + concrete `<action>` per planning iteration |
| 3. Architecture-lock | LOCKED | Plan 01 Task 0.5 forbidden-pattern detector + helper-presence + assertUpstreamReady |
| 4. Compliance enforcement | LOCKED | DB-trigger compliance per domain (mode-saas-activation + module-eligibility, PQL evidence, UpgradeTrigger pricing, InApp approval+pricing+frequency, Experiment 5-field constraint, agent activation gate) |
| 5. Cross-phase coordination | DRAFT | Q-1..Q-6 resolved in research; Q-7 BLOCKING (slot collision — P218 recommended 101-103, P219 needs cross-phase replan from 85-89 → 104-108); planner must finalize migration-slot allocation |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Per RESEARCH §Compliance Enforcement Boundary Summary (8 triggers across 6 domains) |
| 7. Test runner pinned | LOCKED | Node `--test` + `node:assert/strict`; NO vitest/playwright |
| 8. Validation strategy (this doc) | DRAFT | Will be filled during planning iteration |

---

*Phase: 218-saas-growth-profile-plg-inapp-experimentation*
*Validation strategy created: 2026-04-26*
*Source: 218-RESEARCH.md + 218-REVIEWS.md*
