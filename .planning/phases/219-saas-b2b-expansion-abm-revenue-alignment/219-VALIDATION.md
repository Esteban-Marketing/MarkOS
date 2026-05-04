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


---

## AC Coverage Map (UI-SPEC Fold — added 2026-05-04 per 219-UI-SPEC.md no-UI variant)

> Per UI-SPEC §Registry Safety closeout grep gates, this section enumerates the backend doctrine assertions, future-surface UI binding contracts, translation gate dissolutions/openings, downstream UI inheritance citations, and 213.4 carry-forward + 217 D-21 decisions that bind across the 6 no-UI plans.

### Backend Doctrine Assertions (Per-Plan Grep Gates)

| Plan | Assertion | Verbatim doctrine | Grep gate command |
|------|-----------|-------------------|-------------------|
| 219-01 | DB-trigger | `SLA_CONFIG_REQUIRES_APPROVAL` exception name | `grep -E "SLA_CONFIG_REQUIRES_APPROVAL" supabase/migrations/107_b2b_revenue_team.sql \| wc -l` ≥1 |
| 219-01 | DB-trigger | `FEEDBACK_PERIOD_INVALID` + `FEEDBACK_CONFIG_NOT_FOUND_FOR_TENANT` exception names | `grep -E "FEEDBACK_PERIOD_INVALID\|FEEDBACK_CONFIG_NOT_FOUND_FOR_TENANT" supabase/migrations/107_b2b_revenue_team.sql \| wc -l` ≥2 |
| 219-01 | ENUM | 4 `REVENUE_SALES_MODELS` values (self_serve_only, sales_assisted, enterprise_sales, hybrid) | `grep -E "REVENUE_SALES_MODELS" lib/markos/revenue-team/contracts.ts` |
| 219-01 | ENUM | 2 `REVENUE_FEEDBACK_CADENCES` values (weekly, bi_weekly) | `grep -E "REVENUE_FEEDBACK_CADENCES" lib/markos/revenue-team/contracts.ts` |
| 219-01 | ENUM | 7 `REVENUE_ATTRIBUTION_MODELS` values | `grep -E "REVENUE_ATTRIBUTION_MODELS" lib/markos/revenue-team/contracts.ts` |
| 219-01 | ENUM | 5 `REVENUE_SLA_EVENT_TYPES` values | `grep -E "REVENUE_SLA_EVENT_TYPES" lib/markos/revenue-team/contracts.ts` |
| 219-01 | LOOP-06 wiring | `task_created_id NOT NULL` for every `mql_sla_breach` row | test/b2b-219/revenue-team/sla-breach-monitor.test.js asserts |
| 219-02 | DB-trigger | `EXPANSION_OUTREACH_REQUIRES_APPROVAL` | `grep -E "EXPANSION_OUTREACH_REQUIRES_APPROVAL" supabase/migrations/108_b2b_expansion_customer_marketing.sql \| wc -l` ≥1 |
| 219-02 | DB-trigger | `PROGRAM_ACTIVATION_REQUIRES_APPROVAL` | `grep -E "PROGRAM_ACTIVATION_REQUIRES_APPROVAL" supabase/migrations/108_b2b_expansion_customer_marketing.sql \| wc -l` ≥1 |
| 219-02 | handoff_kind 12th | `account_expansion_outreach` | `grep -E "kind:.*account_expansion_outreach" lib/markos/expansion/opportunities.ts \| wc -l` ≥1 |
| 219-02 | handoff_kind 13th | `customer_marketing_program_activation` | `grep -E "kind:.*customer_marketing_program_activation" lib/markos/expansion/customer-marketing.ts \| wc -l` ≥1 |
| 219-02 | ENUM | 9 `EXPANSION_TRIGGER_SIGNALS` taxonomy values verbatim | `grep -E "EXPANSION_TRIGGER_SIGNALS" lib/markos/expansion/contracts.ts` |
| 219-02 | ENUM | 10 `CUSTOMER_MARKETING_PROGRAM_TYPES` taxonomy values verbatim | `grep -E "CUSTOMER_MARKETING_PROGRAM_TYPES" lib/markos/expansion/contracts.ts` |
| 219-02 | ENUM | 8 `EXPANSION_OPPORTUNITY_STATUSES` values verbatim | `grep -E "EXPANSION_OPPORTUNITY_STATUSES" lib/markos/expansion/contracts.ts` |
| 219-02 | ENUM | 5 `EXPANSION_TYPES` values verbatim | `grep -E "EXPANSION_TYPES" lib/markos/expansion/contracts.ts` |
| 219-02 | banned-lexicon validator 1 | `validateOutreachCopyBeforeDispatch` exported | `grep -E "validateOutreachCopyBeforeDispatch" lib/markos/expansion/opportunities.ts \| wc -l` ≥1 |
| 219-02 | banned-lexicon validator 2 | `validateProgramCopyBeforeActivation` exported | `grep -E "validateProgramCopyBeforeActivation" lib/markos/expansion/customer-marketing.ts \| wc -l` ≥1 |
| 219-02 | UNIQUE constraint | `UNIQUE(tenant_id, program_id, account_id)` enrollment dedup | `grep -E "UNIQUE.*tenant_id.*program_id.*account_id" supabase/migrations/108_b2b_expansion_customer_marketing.sql \| wc -l` ≥1 |
| 219-03 | DB-trigger | `ABM_ENRICHMENT_AUDIT_REQUIRED` | `grep -E "ABM_ENRICHMENT_AUDIT_REQUIRED" supabase/migrations/109_b2b_abm.sql \| wc -l` ≥1 |
| 219-03 | DB-trigger | `ABM_EXTERNAL_OUTREACH_REQUIRES_APPROVAL` | `grep -E "ABM_EXTERNAL_OUTREACH_REQUIRES_APPROVAL" supabase/migrations/109_b2b_abm.sql \| wc -l` ≥1 |
| 219-03 | handoff_kind 14th | `abm_external_outreach` | `grep -E "kind:.*abm_external_outreach" lib/markos/abm/packages.ts \| wc -l` ≥1 |
| 219-03 | ENUM | 7 `ABM_STAGES` values verbatim | `grep -E "ABM_STAGES" lib/markos/abm/contracts.ts` |
| 219-03 | ENUM | 3 `ABM_TIERS` values verbatim (1, 2, 3) | `grep -E "ABM_TIERS" lib/markos/abm/contracts.ts` |
| 219-03 | ENUM | 5 `ABM_PERSONAS` values verbatim | `grep -E "ABM_PERSONAS" lib/markos/abm/contracts.ts` |
| 219-03 | ENUM | 10 `ABM_EVENT_TYPES` values verbatim | `grep -E "ABM_EVENT_TYPES" lib/markos/abm/contracts.ts` |
| 219-03 | ENUM | 4 `ABM_ENRICHMENT_SOURCES` values verbatim | `grep -E "ABM_ENRICHMENT_SOURCES" lib/markos/abm/contracts.ts` |
| 219-03 | EVD-03 | `is_inferred` auto-set TRUE on `known_to_us=false` | test/b2b-219/abm/committee-inferred-flag.test.js asserts |
| 219-03 | EVD-04 | `listStalePackages` + `isStale` exported (max_age_days=90) | `grep -E "listStalePackages\|isStale" lib/markos/abm/enrichment.ts \| wc -l` ≥2 |
| 219-03 | EVD-06 | 4 source-quality fields verbatim in zod | `grep -E "source_quality\|extraction_method\|extracted_at\|compliance_posture" lib/markos/abm/contracts.ts \| wc -l` ≥4 |
| 219-03 | banned-lexicon validator 3 | `validateAbmOutreachBeforeDispatch` exported | `grep -E "validateAbmOutreachBeforeDispatch" lib/markos/abm/packages.ts \| wc -l` ≥1 |
| 219-04 | DB-trigger | `REVIEW_REQUEST_REQUIRES_APPROVAL` | `grep -E "REVIEW_REQUEST_REQUIRES_APPROVAL" supabase/migrations/110_b2b_advocacy.sql \| wc -l` ≥1 |
| 219-04 | DB-trigger | `PROOF_REQUIRES_CONSENT_AND_EVIDENCE` | `grep -E "PROOF_REQUIRES_CONSENT_AND_EVIDENCE" supabase/migrations/110_b2b_advocacy.sql \| wc -l` ≥1 |
| 219-04 | handoff_kind 15th | `advocacy_review_request_dispatch` | `grep -E "kind:.*advocacy_review_request_dispatch" lib/markos/advocacy/review-requests.ts \| wc -l` ≥1 |
| 219-04 | handoff_kind 16th | `advocacy_proof_publish` | `grep -E "kind:.*advocacy_proof_publish" lib/markos/advocacy/proof-assets.ts \| wc -l` ≥1 |
| 219-04 | ENUM | 6 `ADVOCACY_RELATIONSHIP_STAGES` values verbatim | `grep -E "ADVOCACY_RELATIONSHIP_STAGES" lib/markos/advocacy/contracts.ts` |
| 219-04 | ENUM | 5 `ADVOCACY_CONSENT_STATES` values verbatim | `grep -E "ADVOCACY_CONSENT_STATES" lib/markos/advocacy/contracts.ts` |
| 219-04 | ENUM | 9 `ADVOCACY_PLATFORMS` values verbatim | `grep -E "ADVOCACY_PLATFORMS" lib/markos/advocacy/contracts.ts` |
| 219-04 | ENUM | 9 `PROOF_ASSET_TYPES` values verbatim | `grep -E "PROOF_ASSET_TYPES" lib/markos/advocacy/contracts.ts` |
| 219-04 | ENUM | 5 `PROOF_ASSET_STATUSES` values verbatim | `grep -E "PROOF_ASSET_STATUSES" lib/markos/advocacy/contracts.ts` |
| 219-04 | EVD-05 payload | 6 fields verbatim (asset_id + evidence_refs + consent_state + privacy_approved + assumptions + claim_risk) | test/b2b-219/advocacy/approval-payload-shape.test.js asserts |
| 219-04 | T0-04 SQL view | `tenant_zero_proof_posture` ships in migration 110 | `grep -E "CREATE.*VIEW.*tenant_zero_proof_posture" supabase/migrations/110_b2b_advocacy.sql \| wc -l` ≥1 |
| 219-04 | banned-lexicon validator 4 | `validateReviewRequestCopyBeforeDispatch` exported | `grep -E "validateReviewRequestCopyBeforeDispatch" lib/markos/advocacy/review-requests.ts \| wc -l` ≥1 |
| 219-04 | banned-lexicon validator 5 | `validateProofCopyBeforePublish` exported | `grep -E "validateProofCopyBeforePublish" lib/markos/advocacy/proof-assets.ts \| wc -l` ≥1 |
| 219-04 | consent revocation cascade | `revokeConsent` exported; transactional cascade flips `proof_assets.status='archived'` | `grep -E "revokeConsent" lib/markos/advocacy/consent.ts \| wc -l` ≥1 |
| 219-05 | DB-trigger pack #1 | `EXPANSION_OFFER_PRICING_REQUIRED` (shared name) | `grep -E "EXPANSION_OFFER_PRICING_REQUIRED" supabase/migrations/111_b2b_pricing.sql \| wc -l` ≥2 |
| 219-05 | DB-trigger pack #2 | `DISCOUNT_REQUIRES_APPROVAL` | `grep -E "DISCOUNT_REQUIRES_APPROVAL" supabase/migrations/111_b2b_pricing.sql \| wc -l` ≥1 |
| 219-05 | DB-trigger pack #3 | `DISCOUNT_REQUIRES_AUTHORIZATION` | `grep -E "DISCOUNT_REQUIRES_AUTHORIZATION" supabase/migrations/111_b2b_pricing.sql \| wc -l` ≥1 |
| 219-05 | 4-fn pricing pack | 4 fn names verbatim (`fn_expansion_offer_pricing_required` + `fn_save_offer_pricing_required` + `fn_discount_requires_approval` + `fn_expansion_discount_requires_authorization`) | `grep -E "fn_expansion_offer_pricing_required\|fn_save_offer_pricing_required\|fn_discount_requires_approval\|fn_expansion_discount_requires_authorization" supabase/migrations/111_b2b_pricing.sql \| wc -l` ≥4 |
| 219-05 | handoff_kind 17th | `discount_authorization_request` (dual_approval when discount_pct > 25) | `grep -E "kind:.*discount_authorization_request" lib/markos/b2b-pricing/discount-authorizations.ts \| wc -l` ≥1 |
| 219-05 | handoff_kind 18th | `expansion_offer_activation` | `grep -E "kind:.*expansion_offer_activation" lib/markos/b2b-pricing/expansion-offers.ts \| wc -l` ≥1 |
| 219-05 | handoff_kind 19th | `save_offer_presentation` (REUSES 215 billing-correction modal) | `grep -E "kind:.*save_offer_presentation" lib/markos/b2b-pricing/save-offers.ts \| wc -l` ≥1 |
| 219-05 | sentinel | `{{MARKOS_PRICING_ENGINE_PENDING}}` verbatim | `grep -E "MARKOS_PRICING_ENGINE_PENDING" lib/markos/b2b-pricing/pricing-context-resolver.ts \| wc -l` ≥1 |
| 219-05 | sentinel constant | `MARKOS_PRICING_ENGINE_PENDING_SENTINEL` exported | `grep -E "MARKOS_PRICING_ENGINE_PENDING_SENTINEL" lib/markos/b2b-pricing/pricing-context-resolver.ts \| wc -l` ≥1 |
| 219-05 | resolver branches | `resolvePricingContext` returns `source='pricing_engine'` OR `source='sentinel'` | test/b2b-219/pricing/sentinel-detection.test.js asserts |
| 219-05 | ENUM | 5 `B2B_EXPANSION_OFFER_TYPES` values verbatim | `grep -E "B2B_EXPANSION_OFFER_TYPES" lib/markos/b2b-pricing/contracts.ts` |
| 219-05 | ENUM | 8 `B2B_EXPANSION_OFFER_STATUSES` values verbatim | `grep -E "B2B_EXPANSION_OFFER_STATUSES" lib/markos/b2b-pricing/contracts.ts` |
| 219-05 | ENUM | 6 `B2B_SAVE_TYPES` values verbatim | `grep -E "B2B_SAVE_TYPES" lib/markos/b2b-pricing/contracts.ts` |
| 219-05 | ENUM | 7 `B2B_SAVE_OFFER_STATUSES` values verbatim | `grep -E "B2B_SAVE_OFFER_STATUSES" lib/markos/b2b-pricing/contracts.ts` |
| 219-05 | ENUM | 6 `B2B_DISCOUNT_TYPES` values verbatim | `grep -E "B2B_DISCOUNT_TYPES" lib/markos/b2b-pricing/contracts.ts` |
| 219-05 | banned-lexicon validator 6 | `validateOfferCopyBeforeActivation` exported (sentinel-substring excluded) | `grep -E "validateOfferCopyBeforeActivation" lib/markos/b2b-pricing/expansion-offers.ts \| wc -l` ≥1 |
| 219-05 | banned-lexicon validator 7 | `validateSaveOfferCopyBeforePresentation` exported (sentinel-substring excluded) | `grep -E "validateSaveOfferCopyBeforePresentation" lib/markos/b2b-pricing/save-offers.ts \| wc -l` ≥1 |
| 219-06 | DB-trigger | `AGENT_ACTIVATION_REQUIRES_READINESS` | `grep -E "AGENT_ACTIVATION_REQUIRES_READINESS" supabase/migrations/107_b2b_revenue_team*.sql \| wc -l` ≥1 |
| 219-06 | 9 verbatim agent IDs | `MARKOS-AGT-(EXP\|ABM\|REV\|IAM)-0[1-3]` | `grep -E "MARKOS-AGT-(EXP\|ABM\|REV\|IAM)-0[1-3]" supabase/migrations/107_b2b_revenue_team*.sql \| wc -l` ≥9 |
| 219-06 | 4-tier ENUM | `B2B_AGENT_TIERS = ['EXP','ABM','REV','IAM']` verbatim | `grep -E "B2B_AGENT_TIERS" lib/markos/b2b-agents/contracts.ts \| wc -l` ≥1 |
| 219-06 | 8-boolean checklist | columns verbatim (contracts_assigned + cost_estimated + approval_posture_defined + tests_implemented + api_surface_defined + mcp_surface_defined + ui_surface_defined + failure_behavior_defined) | `grep -E "contracts_assigned\|cost_estimated\|approval_posture_defined\|tests_implemented\|api_surface_defined\|mcp_surface_defined\|ui_surface_defined\|failure_behavior_defined" supabase/migrations/107_b2b_revenue_team*.sql \| wc -l` ≥8 |
| 219-06 | GENERATED column | `runnable bool GENERATED ALWAYS AS (...) STORED` | `grep -E "GENERATED ALWAYS AS.*STORED" supabase/migrations/107_b2b_revenue_team*.sql \| wc -l` ≥1 |
| 219-06 | IAM-01 cross-phase | `MARKOS-AGT-IAM-01.blocking_phase='P218-06-CONFIRM'` | `grep -E "P218-06-CONFIRM" supabase/migrations/107_b2b_revenue_team*.sql \| wc -l` ≥1 |
| 219-06 | API legacy | 14 `api/v1/b2b/*.js` handlers; 0 `route.ts` | test/b2b-219/api/architecture-lock-api-handlers.test.js asserts |
| 219-06 | cron | 5 `api/cron/b2b-*.js` handlers + HANDLERS map registration | test/b2b-219/cron/cron-token-auth.test.js asserts |
| 219-06 | MCP | 12 tools in `lib/markos/mcp/tools/b2b.cjs`; required from index.cjs | test/b2b-219/mcp/tool-registration.test.js asserts |
| 219-06 | architecture-lock RE-RUN | full forbidden-pattern scan returns 0 violations | test/b2b-219/closeout/all-domains-architecture-lock-rerun.test.js asserts |

### 6 Future-Surface UI Binding Contracts (Load-Bearing for Future Phases)

| Contract | UI-SPEC §UI Binding | Future surface(s) | Plans implementing substrate |
|----------|---------------------|-------------------|------------------------------|
| 1. Revenue Team Config | §UI Binding 1 | future_phase_219_revenue_team_ui (revenue team config wizard, SLA monitoring dashboard, marketing-sales feedback browser) | 219-01 (substrate) |
| 2. Account Expansion + Customer Marketing | §UI Binding 2 | future_phase_219_b2b_admin_ui (account expansion opportunities queue, customer marketing program editor) + future_phase_219_approval_inbox_extensions (12th + 13th chips) | 219-02 (substrate) |
| 3. ABM Account Package + Buying Committee + EVD-03/04/06 | §UI Binding 3 | future_phase_219_b2b_admin_ui (ABM account package browser, ABM buying committee mapper, inferred-member review queue) + future_phase_219_approval_inbox_extensions (14th chip with EVD-03/04/06 indicators) | 219-03 (substrate) |
| 4. Advocacy + Review Request + Proof + T0-04 | §UI Binding 4 | future_phase_219_advocacy_ui (advocacy candidate queue, review request dispatch approval modal, proof asset library, proof publish approval modal, consent revocation viewer, T0-04 indicator) + future_phase_219_approval_inbox_extensions (15th + 16th chips) | 219-04 (substrate) |
| 5. B2B Pricing — Expansion + Save + Discount + Sentinel | §UI Binding 5 | future_phase_219_b2b_admin_ui (discount authorization queue, expansion offer authoring, save offer presentation page, 4-DB-trigger pricing compliance pack monitor) + future_phase_219_approval_inbox_extensions (17th + 18th + 19th chips) | 219-05 (substrate) |
| 6. 9 B2B Agents Readiness Registry | §UI Binding 6 | future_phase_219_agents_page_extension (217-06 `app/saas/agents/page.tsx` extension rendering 9 P219 B2B agents alongside 9 P218 PLG + 12 P217 SAS = 30 total) | 219-06 (substrate) |

### Translation Gate Dissolutions (4) and Openings (5)

| Gate | State | Notes |
|------|-------|-------|
| 217-UI-SPEC §future_phase_219_partner_console | DISSOLVED at backend-substrate | 219 plans 01-06 ship full B2B substrate; UI-layer dissolution requires future P219+ admin/tenant frontend phase |
| 218-UI-SPEC §future_phase_218_admin_ui (B2B portion) | PARTIALLY DISSOLVED | ABM module backend substrate ships; PLG dashboard / PQL viewer / upgrade-trigger wizard / InAppCampaign editor / experiment registry remain DEFERRED |
| 218-UI-SPEC §future_phase_219_agents_page_extension | OPENED by 219 | sibling gate to 218 future_phase_218_agents_page_extension |
| 213-UI-SPEC §public-proof boundary on advocacy_proof_assets | DISSOLVED at substrate-layer | 219-04 ships proof_consent_records + proof_assets.privacy_approved + evidence_refs + tenant_zero_proof_posture SQL view |
| future_phase_219_b2b_admin_ui | OPENED by 219 | 14-page B2B admin surface (revenue-team / expansion / customer-marketing / abm / advocacy / pricing); future P219+ admin frontend phase |
| future_phase_219_revenue_team_ui | OPENED by 219 | tenant-facing revenue team config + SLA monitoring + LOOP-06 evidence panel; future P219+ tenant frontend phase |
| future_phase_219_advocacy_ui | OPENED by 219 | tenant-facing advocacy candidate queue + review request modal + proof asset library + consent revocation viewer + T0-04 indicator; future P219+ tenant frontend phase |
| future_phase_219_approval_inbox_extensions | OPENED by 219 | P208 Approval Inbox extends from 11 chips (post-218) to 19 chips (post-219 final state) — 8 NEW handoff_kind literals (12th-19th) per UI-SPEC §UI Binding 2-5 + 208-UI-SPEC PARENT entry |
| future_phase_219_agents_page_extension | OPENED by 219 | 217-06 `app/saas/agents/page.tsx` agents page extension renders 9 P219 B2B agents alongside 9 P218 PLG + 12 P217 SAS = 30 total |

### 8 NEW Handoff_Kind Literals (12th-19th in canonical chain post-219)

| # | Literal | Plan | Source lib helper | Default approval mode |
|---|---------|------|-------------------|-----------------------|
| 12th | `expansion_outreach_approval` | 219-02 | `lib/markos/expansion/opportunities.ts` `requestOutreachApproval` (kind=`account_expansion_outreach`) | `single_approval` |
| 13th | `program_activation_approval` | 219-02 | `lib/markos/expansion/customer-marketing.ts` `activateProgram` (kind=`customer_marketing_program_activation`) | `single_approval` |
| 14th | `abm_outreach_approval` | 219-03 | `lib/markos/abm/packages.ts` `requestExternalOutreachApproval` (kind=`abm_external_outreach`) | `single_approval` |
| 15th | `review_request_dispatch_approval` | 219-04 | `lib/markos/advocacy/review-requests.ts` `dispatchReviewRequest` (kind=`advocacy_review_request_dispatch`) | `single_approval` |
| 16th | `proof_publish_approval` | 219-04 | `lib/markos/advocacy/proof-assets.ts` `publishProofAsset` (kind=`advocacy_proof_publish`) + EVD-05 6-field payload | `single_approval` |
| 17th | `discount_authorization_approval` | 219-05 | `lib/markos/b2b-pricing/discount-authorizations.ts` `requestDiscountAuthorization` (kind=`discount_authorization_request`) | `single_approval` if `discount_pct ≤ 25` / `dual_approval` if `discount_pct > 25` |
| 18th | `expansion_offer_approval` | 219-05 | `lib/markos/b2b-pricing/expansion-offers.ts` `activateExpansionOffer` (kind=`expansion_offer_activation`) | `single_approval` |
| 19th | `save_offer_approval` | 219-05 | `lib/markos/b2b-pricing/save-offers.ts` `presentSaveOffer` (kind=`save_offer_presentation`) — REUSES 215 billing-correction modal recipe | `single_approval` |

### 7 Banned-Lexicon Validators (Pre-Dispatch Gate Functions)

| # | Validator | Plan | Field validated | Mutation class |
|---|-----------|------|-----------------|----------------|
| 1 | `validateOutreachCopyBeforeDispatch` | 219-02 | `account_expansion_opportunities.outreach_message` | `external.send` |
| 2 | `validateProgramCopyBeforeActivation` | 219-02 | `customer_marketing_programs.goal` | `external.send` |
| 3 | `validateAbmOutreachBeforeDispatch` | 219-03 | `abm_account_packages.messaging_jsonb.outreach_text` | `external.send` |
| 4 | `validateReviewRequestCopyBeforeDispatch` | 219-04 | `advocacy_review_requests.message_preview` | `external.send` |
| 5 | `validateProofCopyBeforePublish` | 219-04 | `proof_assets.title` + `proof_assets.content_draft` | `external.send` |
| 6 | `validateOfferCopyBeforeActivation` | 219-05 | `expansion_offers.offer_copy` (sentinel substring excluded) | `billing.charge` |
| 7 | `validateSaveOfferCopyBeforePresentation` | 219-05 | `save_offers.offer_copy` (sentinel substring excluded) | `billing.charge` |

All 7 validators check 17 banned phrases verbatim (`synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` as softener) + zero exclamation points BEFORE every `buildApprovalPackage` call dispatching to `external.send` OR `billing.charge`. Future approval modals MUST disable approval CTA when banned-lexicon match count > 0.

### Downstream UI Inheritance Citations (≥10 future surfaces)

| Future surface | UI-SPEC binding | Substrate plan |
|----------------|------------------|----------------|
| Revenue team config wizard | §UI Binding 1 | 219-01 |
| SLA monitoring dashboard | §UI Binding 1 (5-event-type SLA timeline) | 219-01 |
| Marketing-sales feedback browser | §UI Binding 1 (feedback period browser) | 219-01 |
| LOOP-06 marketing-to-pipeline evidence panel | §UI Binding 1 | 219-01 |
| Account expansion opportunities queue | §UI Binding 2 (9-trigger-signal taxonomy + 8-status + 5-expansion-type) | 219-02 |
| Customer marketing program editor | §UI Binding 2 (10-program-type taxonomy) | 219-02 |
| ABM account package browser | §UI Binding 3 (7-stage + 3-tier + EVD-04 + EVD-06) | 219-03 |
| ABM buying committee mapper | §UI Binding 3 (5-persona + EVD-03 is_inferred) | 219-03 |
| Inferred-member review queue | §UI Binding 3 (EVD-03 operator review path) | 219-03 |
| Advocacy candidate queue | §UI Binding 4 (6-relationship-stage + 5-consent-state) | 219-04 |
| Review request dispatch approval modal | §UI Binding 4 (9-platform + 4-ask-type) | 219-04 |
| Proof asset library | §UI Binding 4 (9-asset-type + 5-status + EVD-05 + T0-04) | 219-04 |
| Proof publish approval modal | §UI Binding 4 (EVD-05 6-field payload) | 219-04 |
| Proof consent revocation viewer | §UI Binding 4 (cascade preview) | 219-04 |
| Tenant 0 proof posture indicator | §UI Binding 4 (T0-04 3-condition invariant via `tenant_zero_proof_posture` SQL view) | 219-04 |
| Discount authorization queue | §UI Binding 5 (6-discount-type + dual-approval threshold) | 219-05 |
| Expansion offer authoring | §UI Binding 5 (5-offer-type + 8-status + sentinel-or-recommendation) | 219-05 |
| Save offer presentation page | §UI Binding 5 (6-save-type + 7-status + REUSES 215 billing-correction modal) | 219-05 |
| 4-DB-trigger pricing compliance pack monitor | §UI Binding 5 (4-trigger pack status panel) | 219-05 |
| 9 B2B agents readiness viewer | §UI Binding 6 (217-06 agents page extension; 9 verbatim agent IDs + 4-tier + 8-boolean + GENERATED runnable) | 219-06 |
| P208 Approval Inbox 19-chip extension | §parent_doctrine_chain 208-UI-SPEC PARENT (12th-19th literals) | 219-02 + 219-03 + 219-04 + 219-05 |

### 213.4 Carry-Forward Decisions (D-08..D-15) + 217 D-21

| Decision ID | Doctrine | Plans citing |
|-------------|----------|--------------|
| D-08 | token-only (zero CSS authored in 219; future 219 admin/tenant phases inherit token-only rule) | 219-01..06 |
| D-09 | mint-as-text (UUID rendering, mint accent for `[ok]` states) | 219-01..06 |
| D-09b | `.c-notice` mandatory (errors + warnings + success notices for SLA / outreach / activation / consent / pricing / activation gates) | 219-01..06 |
| D-13 | `.c-card--feature` reserved (default `.c-card` rendering for all future 219 surface rows) | 219-01..06 |
| D-14 | no `.c-table` primitive (vanilla `<table>` + `<.c-badge--{state}>` recipe for all future 219 queue/list surfaces) | 219-01..06 |
| D-15 | selective extraction (recommended extractions per UI-SPEC §UI Binding 1-6 component recipes — `<RevenueTeamSlaEventBadge />`, `<ExpansionTriggerSignalChip />`, `<AbmStageBadge />`, `<AdvocacyConsentStateBadge />`, `<PricingContextChip />`, `<B2bAgentReadinessBadge />`, etc.) | 219-01..06 |
| D-21 | server/client boundary (default server component reading via `requireHostedSupabaseAuth(request)`; client `use client` only for interactive primitives) | 219-01..06 |
| 217 D-21 | inherited verbatim from 217-UI-SPEC PARENT — every future 219 admin/tenant surface MUST be a default server component | 219-01..06 |

### 217 D-21 Server/Client Boundary (Inherited Verbatim)

Per UI-SPEC §parent_doctrine_chain 217-UI-SPEC PARENT entry: every future 219 admin / tenant surface MUST be a default server component reading via `requireHostedSupabaseAuth(request)` + tenant-scoped supabase client; client components opt in via `'use client'` only for interactive primitives — buying-committee relationship-graph editor (Plan 03), EVD-06 source-quality scrubber (Plan 03), advocacy candidate queue filter (Plan 04), discount-pct authorization input (Plan 05), banned-lexicon-checked outreach copy editor (Plan 02 + 04 + 05), proof asset content editor with evidence_refs picker (Plan 04), consent revocation cascade preview (Plan 04), sentinel-detection chip indicator (Plan 05).

### Cross-Cutting Doctrine Binding (10 Parent UI-SPECs)

| Parent UI-SPEC | Inherited doctrine | Plans inheriting |
|----------------|---------------------|------------------|
| 206-UI-SPEC | mutation-class doctrine (external.send + billing.charge + data.export); default_approval_mode (single_approval for 7 of 8 new handoff_kinds, dual_approval for `discount_authorization_approval` when `discount_pct > 25`); autonomy-ceiling on B2B outreach + discount + expansion + save offer paths | 219-02..06 |
| 207-UI-SPEC | RunApiEnvelope + AgentRunEventType + ApprovalHandoffRecord; agent_run_id link for 5 cron handlers + 14 API handlers + B2B agent readiness flag flips | 219-01..06 |
| 208-UI-SPEC | Approval Inbox extends from 11 chips to 19 chips post-219 (8 NEW handoff_kind literals 12th-19th) | 219-02..06 |
| 209-UI-SPEC | EVD-03 is_inferred labeling + EVD-04 stale-package detection + EVD-05 approval payload shape + EVD-06 source-quality fields + immutable evidence_refs pattern | 219-02..05 |
| 213-UI-SPEC | Tenant 0 proof posture invariant T0-04; 213-04 public-proof boundary applies to all 219 outreach + advocacy + proof + B2B pricing copy as PRIVATE doctrine; banned-lexicon zero-match BEFORE external.send / billing.charge | 219-02..05 |
| 214-UI-SPEC | SaaS Suite Activation HARD upstream gate; every 219 SOR table FK to markos_orgs(tenant_id); MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE trigger via P218 fn_check_module_mode_eligibility | 219-01..06 |
| 215-UI-SPEC | sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline; 4-DB-trigger pricing compliance pack mirror; 215 billing-correction modal recipe REUSED for save_offer_approval | 219-05 |
| 216-UI-SPEC | saas_health_scores SOFT consumer for expansion + advocacy signal scanners; EVENT_CATEGORIES taxonomy consumed by 219-02 9-trigger_signal taxonomy | 219-02 + 219-04 |
| 217-UI-SPEC | saas_nav_visibility eventually extended; 217-06 agents page consumed by future P219 agents-page extension; 7 NEW extracted components from 217 referenced as load-bearing primitives; D-21 server/client boundary | 219-01..06 |
| 218-UI-SPEC | markos_growth_mode ENUM b2b/plg_b2b eligibility for ABM module; 60-row module_mode_eligibility seed; 9-PLG-agents readiness pattern reused verbatim in 9-B2B-agents readiness | 219-03 + 219-06 |
*Phase: 219-saas-b2b-expansion-abm-revenue-alignment*
*Validation strategy created: 2026-04-26*
*Source: 219-RESEARCH.md + 219-REVIEWS.md*
