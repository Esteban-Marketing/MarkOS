---
phase: 216
slug: saas-suite-health-churn-support-usage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 216 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` (matches P204 D-49 / P217 / P218 / P219 / P220 / P226 D-82 architecture-lock) |
| **Config file** | none — uses Node built-in test runner |
| **Quick run command** | `npm test -- test/saas-216/preflight/` |
| **Full suite command** | `npm test -- test/saas-216/ test/api-contracts/saas-216-*` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/saas-216/<domain>/<task>.test.js`
- **After every plan wave:** Run `npm test -- test/saas-216/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map (will populate during planning)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 216-01-00 | 01 | 1 | QA-01,02 | preflight | `npm test -- test/saas-216/preflight/` | ❌ W0 | ⬜ pending |
| 216-01-01 | 01 | 1 | SAS-07 | schema+trigger | `npm test -- test/saas-216/health/` | ❌ W0 | ⬜ pending |
| 216-02-01 | 02 | 2 | SAS-07 | schema+trigger | `npm test -- test/saas-216/usage/` | ❌ W0 | ⬜ pending |
| 216-03-01 | 03 | 2 | SAS-08 | schema+trigger | `npm test -- test/saas-216/support/` | ❌ W0 | ⬜ pending |
| 216-04-01 | 04 | 3 | SAS-08 | schema+trigger | `npm test -- test/saas-216/churn/` | ❌ W0 | ⬜ pending |
| 216-05-01 | 05 | 3 | SAS-07,08 (privacy substrate) | schema+trigger | `npm test -- test/saas-216/privacy/` | ❌ W0 | ⬜ pending |
| 216-06-01 | 06 | 4 | translation-gate + closeout | regression | `npm test -- test/saas-216/handoff/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## Wave 0 Requirements

- [ ] `scripts/preconditions/216-check-upstream.cjs` — assertUpstreamReady CLI for HARD upstreams (P207 CRM tasks/customers/accounts + P208 approvals + P209 evidence + P210 connector substrate + P214 SaaSSuiteActivation) + SOFT (P205 Pricing Engine, P211, P212, P213)
- [ ] `lib/markos/saas/preflight/upstream-gate.ts` — runtime helper
- [ ] `lib/markos/saas/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/saas/preflight/errors.ts` — UpstreamPhaseNotLandedError
- [ ] `test/saas-216/preflight/architecture-lock.test.js`
- [ ] `test/saas-216/preflight/upstream-gate.test.js`
- [ ] `test/saas-216/preflight/helper-presence.test.js` — verifies buildApprovalPackage / requireHostedSupabaseAuth / resolvePlugin exist; createApprovalPackage / requireSupabaseAuth / lookupPlugin DO NOT
- [ ] Test fixtures under `test/fixtures/saas-216/*.js` (NOT `.ts`)
- [ ] APPEND row to `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (P217 Plan 01 Task 0.1 CREATES doc; P216 Plan 01 Task 0.1 APPENDS P216 reservation slots 112-117 + F-259..F-270)
  - Document Q-7 Slot Ordering Crisis: P216 execution-order BEFORE P217 but slot-order AFTER P219 (slots 112-117); FK direction strictly P217/P218/P219/P220 READ P216 (no reverse FKs); execution gating via assertUpstreamReady not migration slot numbers
- [ ] `data_retention_classes` table seed (foundational for P217-P228) — Plan 05 ships in slot 116; Plan 01 references via ENUM `pii_classification`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Health-score weight tuning | SAS-07 | Default weights from canon are starting point; per-tenant tuning requires CS judgment for weight allocation across usage/billing/engagement/relationship/support dimensions | Operator reviews `saas_health_score_weights_overrides` per tenant; signs off via approval inbox |
| PII classification audit | SAS-07, SAS-08 | First execution surfaces all PII columns across health/usage/support/churn — operator reviews classification ENUM values + retention_class assignments before broader rollout | Operator reviews `data_retention_classes` seed + spot-checks PII columns on `saas_health_scores`, `product_usage_events`, `saas_support_tickets`, `saas_churn_interventions`; confirms `retention_class` matches data sensitivity |
| Support response auto-mode safety review | SAS-08 | Tenant flipping `tenant_safe_auto_response_enabled=true` triggers automated CS responses; needs operator validation before per-tenant flag | Operator reviews tenant request + KB grounding evidence + first 24h of auto-responses before broader auto-mode rollout |
| Churn playbook outcome review | SAS-08 | Save offer outcomes (accepted/rejected/declined) need human pattern-recognition before refining playbook templates | Operator reviews `saas_churn_intervention_outcomes` quarterly; refines templates + Pricing Engine save-offer thresholds |
| Growth handoff signal map review | translation_gate_for [P218,P219,P220] | Confirms growth modules (PLG/EXP/ABM/etc.) consume P216 signals correctly; assures no premature activation in P216 | Operator reviews translation-gate test output + confirms 0 growth-module agents `runnable=true` in any registry pre-P218 |

---

## Validation Architecture (carry from RESEARCH.md)

Source: `216-RESEARCH.md` §Validation Architecture (Wave 0 surface; all tests are gaps)

**Per-domain test strategy:**
- **Domain 1 (SaaSHealthScore + explainability):** unit (RLS, schema, raw_facts JSONB validators, weight math, confidence calculation), integration (DB-trigger `HEALTH_SCORE_REQUIRES_RAW_FACTS`; cron health-score-recompute), regression (no migration-slot 100/foundation collision)
- **Domain 2 (Product usage events + PLG signal map):** unit (RLS, schema, event taxonomy validators, PLG signal mapping), integration (DB-trigger `PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH`; P210 connector substrate read), regression (P210 backwards-compat; connector_installs read)
- **Domain 3 (SaaSSupportTicket + KB grounding):** unit (RLS, schema, classification validators, response drafting + KB grounding), integration (DB-trigger `SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG`), regression (P207 customer/account FK)
- **Domain 4 (Churn intervention playbooks):** unit (RLS, schema, playbook selection logic, save-offer Pricing Engine routing), integration (DB-trigger `CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL` accepts pricing FK or sentinel; P208 approval inbox), regression (Pricing Engine sentinel pattern parity with P218/P219)
- **Domain 5 (Privacy + retention substrate):** unit (RLS, schema, PII classification ENUM, retention_class validators), integration (DB-trigger `SUPPORT_DATA_REQUIRES_RETENTION_POLICY` on every PII-containing table; foundational for P217-P228), regression (downstream consumer matrix coverage)
- **Domain 6 (Growth handoff signal map + closeout):** unit (signal map schema), integration (translation-gate test asserts SG-* growth modules planned_only=true + 0 growth-module agents `runnable=true` across all registries), regression (slot-collision regression — assert P216 owns 112-117 + foundation/P220/P217/P218/P219 untouched; all-domains architecture-lock RE-RUN; requirements-coverage assertion for SAS-07/SAS-08 + QA-01..15)

**Architecture-lock regression:** `test/saas-216/preflight/architecture-lock.test.js` runs FIRST in every wave; scans 216-*-PLAN.md bodies + lib/markos/saas/health|usage|support|churn|privacy|handoff/* + api/v1/saas/* + api/cron/saas-* for forbidden patterns (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(saas), api/v1/.../route.ts, vitest, playwright, .test.ts, .ts MCP files). Fails wave on positive invocation.

**Helper-presence regression:** verifies buildApprovalPackage @ `lib/markos/crm/agent-actions.ts:68`, requireHostedSupabaseAuth @ `onboarding/backend/runtime-context.cjs:491`, resolvePlugin @ `lib/markos/plugins/registry.js:102`, `lib/markos/mcp/tools/index.cjs` (NOT .ts), `contracts/openapi.json` (NOT public/openapi.json) all exist; forbidden aliases NOT present anywhere in `lib/markos/`.

---

## Dimensions Coverage (Nyquist 8 dimensions per RESEARCH §Validation Architecture)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | All P216-OWNED IDs (SAS-07, SAS-08, QA-01..15) mapped to plans during planning iteration; SAS-09 = `integrates_with: P217`; EVD-01..06 = `integrates_with: P209`; TASK-01..05 = `integrates_with: P207`; CONN-01..06 = `integrates_with: P210`; SG-* in Plan 06 = `translation_gate_for: [P218, P219, P220]` |
| 2. Anti-shallow execution | DRAFT | Every task has `<read_first>` + grep/test-verifiable `<acceptance_criteria>` + concrete `<action>` per planning iteration |
| 3. Architecture-lock | LOCKED | Plan 01 Task 0.5 forbidden-pattern detector + helper-presence + assertUpstreamReady |
| 4. Compliance enforcement | LOCKED | DB-trigger compliance per domain (HEALTH_SCORE_REQUIRES_RAW_FACTS / PRODUCT_USAGE_INGEST_REQUIRES_TENANT_AUTH / SUPPORT_RESPONSE_REQUIRES_CS_APPROVAL_OR_SAFE_AUTO_FLAG / CHURN_SAVE_OFFER_REQUIRES_PRICING_AND_APPROVAL / SUPPORT_DATA_REQUIRES_RETENTION_POLICY) |
| 5. Cross-phase coordination | DRAFT | Q-1..Q-7 resolved in research; Slot Ordering Crisis Q-6 documented (P216 = 112-117 post-P219; FK direction P217+ READ P216 only); P216 APPENDS to V4.1.0-MIGRATION-SLOT-COORDINATION.md (P217 created); downstream consumer matrix for `data_retention_classes` |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Per RESEARCH §Compliance Enforcement Boundary Summary (5 DB-triggers across 5 active-schema domains; Plan 06 closeout regression test only) |
| 7. Test runner pinned | LOCKED | Node `--test` + `node:assert/strict`; NO vitest/playwright |
| 8. Validation strategy (this doc) | DRAFT | Will be filled during planning iteration |

---

*Phase: 216-saas-suite-health-churn-support-usage*
*Validation strategy created: 2026-04-26*
*Source: 216-RESEARCH.md + 216-REVIEWS.md*
