---
phase: 219
slug: saas-b2b-expansion-abm-revenue-alignment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 219 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` (matches P204 D-49 / P220 / P221 D-36 / P226 D-82 architecture-lock) |
| **Config file** | none — uses Node built-in test runner |
| **Quick run command** | `npm test -- test/b2b-219/preflight/` |
| **Full suite command** | `npm test -- test/b2b-219/ test/api-contracts/219-*` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/b2b-219/<domain>/<task>.test.js`
- **After every plan wave:** Run `npm test -- test/b2b-219/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map (will populate during planning)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 219-01-00 | 01 | 1 | QA-01,02 | preflight | `npm test -- test/b2b-219/preflight/` | ❌ W0 | ⬜ pending |
| 219-01-01 | 01 | 1 | SG-08, LOOP-06 | schema+trigger | `npm test -- test/b2b-219/revenue-team/` | ❌ W0 | ⬜ pending |
| 219-02-01 | 02 | 2 | SG-03, SG-09 | schema+trigger | `npm test -- test/b2b-219/expansion/` | ❌ W0 | ⬜ pending |
| 219-03-01 | 03 | 2 | SG-03, EVD-01,03,04 | schema+trigger | `npm test -- test/b2b-219/abm/` | ❌ W0 | ⬜ pending |
| 219-04-01 | 04 | 3 | SG-03, SG-12, T0-04, EVD-01,02,05 | schema+trigger | `npm test -- test/b2b-219/advocacy/` | ❌ W0 | ⬜ pending |
| 219-05-01 | 05 | 3 | SG-11, EVD-06 | schema+trigger | `npm test -- test/b2b-219/pricing/` | ❌ W0 | ⬜ pending |
| 219-06-01 | 06 | 4 | SG-10, API-01, MCP-01 | api+mcp | `npm test -- test/api-contracts/219-* test/b2b-219/agents/` | ❌ W0 | ⬜ pending |
| 219-06-02 | 06 | 4 | RUN-01..08, QA-03..15 | closeout | `npm test -- test/b2b-219/closeout/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

Detailed per-task map populates during planning iteration; planner expands rows per Plan task.

---

## Wave 0 Requirements

- [ ] `scripts/preconditions/219-check-upstream.cjs` — assertUpstreamReady CLI for P214/P215/P217/P218 (hard — Q-7 fix added P217 for SAS-09 saas_mrr_snapshots) + P205/P207-212/P216 (soft)
- [ ] `lib/markos/b2b/preflight/upstream-gate.ts` — runtime helper
- [ ] `lib/markos/b2b/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/b2b/preflight/errors.ts` — UpstreamPhaseNotLandedError + PricingEnginePendingError
- [ ] `test/b2b-219/preflight/architecture-lock.test.js`
- [ ] `test/b2b-219/preflight/upstream-gate.test.js`
- [ ] `test/b2b-219/preflight/helper-presence.test.js` — verifies buildApprovalPackage / requireHostedSupabaseAuth / resolvePlugin exist; createApprovalPackage / requireSupabaseAuth / lookupPlugin DO NOT
- [ ] Test fixtures under `test/fixtures/b2b-219/*.js` (NOT `.ts` per architecture-lock)
- [ ] Append-or-create row in `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` reserving slots 85-89 + F-IDs F-228..F-236

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SLA breach operator review | SG-08, LOOP-06 | SLA thresholds = business decisions; automated detection creates tasks but human judgment for action | Operator reviews `lead_qualification_sla_events` breach queue; acts via approval inbox |
| Expansion offer pricing copy editorial judgment | SG-11 | Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` requires editorial review before activation | Operator reviews `expansion_offers.offer_copy`; replaces sentinel or confirms P205 routing |
| Advocacy consent confirmation | SG-12, T0-04 | Public proof consent requires human judgment | Operator reviews `proof_consent_records` before mark-as-given |
| First-run B2B agent activation | SG-10 | No B2B growth agent runs without human checkpoint | Plan 06 `checkpoint:human-action` — operator reviews `b2b_growth_agent_readiness` registry; sets `contracts_assigned=true` per agent only after full readiness |
| ABM enrichment source validation | EVD-03, EVD-04 | Inferred buying-committee fields require human validation pre-outreach | Operator reviews `abm_buying_committee_members` where `is_inferred=true` before approval advance |
| Proof privacy review | T0-04, EVD-02 | `privacy_approved=true` requires human privacy posture review | Operator reviews proof asset content + consent before flipping `privacy_approved=true` |

---

## Validation Architecture (carry from RESEARCH.md)

Source: `219-RESEARCH.md` §Validation Architecture (Wave 0 surface; all tests are gaps)

**Per-domain test strategy:**
- **Domain 1 (Revenue Team / SLA):** unit (RLS, schema, SLA validators), integration (DB-trigger SLA-config approval; cron MQL aging), regression (no migration-slot 96 collision)
- **Domain 2 (Expansion / Customer Marketing):** unit (RLS, schema, enrollment dedup), integration (DB-trigger outreach gate; signal scanner cron), regression (P215 billing soft-degrade)
- **Domain 3 (ABM / Buying Committee):** unit (RLS, schema, enrichment audit + is_inferred flag), integration (DB-trigger enrichment audit; stage gate), regression (P218 SaaSGrowthProfile mode gate)
- **Domain 4 (Advocacy / Review / Proof):** unit (RLS, schema, consent revocation cascade), integration (DB-trigger review send gate; proof publish gate; T0-04 posture), regression (P208 approval inbox payload shape)
- **Domain 5 (Pricing Controls):** unit (RLS, schema, sentinel detection), integration (DB-trigger pricing immutability; discount authorization chain), regression (P205 sentinel upgrade path)
- **Domain 6 (B2B Agent Readiness):** unit (all 9 agents `runnable=false` seed), integration (activation-gate trigger), regression (P220 `growth_agent_readiness` coordination — no table-name collision; P219 owns `b2b_growth_agent_readiness`)

**Architecture-lock regression:** `test/b2b-219/preflight/architecture-lock.test.js` runs FIRST in every wave; scans 219-*-PLAN.md bodies + lib/markos/b2b/* + lib/markos/{revenue-team,expansion,abm,advocacy,b2b-pricing,b2b-agents}/* + api/v1/b2b/* + api/cron/b2b-* for forbidden patterns (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(b2b), app/(growth), api/v1/.../route.ts, vitest, playwright, .test.ts, "stub if missing", "if exists"). Fails wave if any positive invocation found.

**Helper-presence regression:** verifies buildApprovalPackage @ `lib/markos/crm/agent-actions.ts:68`, requireHostedSupabaseAuth @ `onboarding/backend/runtime-context.cjs:491`, resolvePlugin @ `lib/markos/plugins/registry.js:102`, `lib/markos/mcp/tools/index.cjs` (NOT .ts), `contracts/openapi.json` (NOT public/openapi.json) all exist; forbidden aliases NOT present anywhere in `lib/markos/`.

---

## Dimensions Coverage (Nyquist 8 dimensions per RESEARCH §Validation Architecture)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | All phase IDs (SG-03/08/09/10/11/12 + LOOP-06 + EVD-01..06 + T0-04 + QA-01..15) mapped to plans during planning iteration |
| 2. Anti-shallow execution | DRAFT | Every task has `<read_first>` + grep/test-verifiable `<acceptance_criteria>` + concrete `<action>` per planning iteration |
| 3. Architecture-lock | LOCKED | Plan 01 Task 0.5 forbidden-pattern detector + helper-presence + assertUpstreamReady |
| 4. Compliance enforcement | LOCKED | DB-trigger compliance per domain (SLA-config approval, expansion outreach, ABM enrichment audit, review/proof consent + evidence FK, pricing immutability, B2B agent activation gate) |
| 5. Cross-phase coordination | DRAFT | Q-1 (P218 ICP vs P219 ABM committee) + Q-4 (P205 Pricing Engine sentinel fallback) resolved in research; planner must finalize migration-slot-coordination append |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Per RESEARCH §Compliance Enforcement Boundary Summary (6 triggers, one per domain) |
| 7. Test runner pinned | LOCKED | Node `--test` + `node:assert/strict`; NO vitest/playwright |
| 8. Validation strategy (this doc) | DRAFT | Will be filled during planning iteration |

---

*Phase: 219-saas-b2b-expansion-abm-revenue-alignment*
*Validation strategy created: 2026-04-26*
*Source: 219-RESEARCH.md + 219-REVIEWS.md*
