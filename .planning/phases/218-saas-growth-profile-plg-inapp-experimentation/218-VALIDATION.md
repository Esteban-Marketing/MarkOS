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

---

## UI-SPEC AC Coverage Map (no-UI variant fold)

Source: `218-UI-SPEC.md` (no-UI-scope variant; mode = `no-ui-surface-phase`; `plans_with_ui_surfaces: []`). The UI-SPEC ships **5 future-surface UI binding contracts** (PQL Score / Upgrade Trigger / InApp Campaign / Marketing Experiment / 9 PLG Agents Readiness) that are LOAD-BEARING for future P208 admin extensions, P217-06 agents-page extension, and future P218 admin/tenant frontend phases. This map enumerates the backend doctrine assertions and downstream UI binding contracts each plan owns.

### Backend doctrine assertions (verbatim grep gates)

| Assertion category | Plan | Owning artifact | Closeout grep gate |
|---------------------|------|-----------------|--------------------|
| 7 DB-triggers verbatim | 01..06 | 6 migrations + 1 doc | `MODE_REQUIRES_SAAS_ACTIVATION` (101) + `PQL_SCORE_REQUIRES_EVIDENCE` (102) + `UPGRADE_TRIGGER_PRICING_REQUIRED` (103, 5-clause) + `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` (104) + `INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK` (104) + `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING` (105, 5-field) + `AGENT_ACTIVATION_REQUIRES_READINESS` (106) appear as RAISE EXCEPTION literals; `grep -cE "(MODE_REQUIRES_SAAS_ACTIVATION\|PQL_SCORE_REQUIRES_EVIDENCE\|UPGRADE_TRIGGER_PRICING_REQUIRED\|INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING\|INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK\|EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING\|AGENT_ACTIVATION_REQUIRES_READINESS)" supabase/migrations/10[1-6]_growth_*.sql` >= 7 |
| 4 NEW handoff_kind literals | 02, 03, 04, 05 | lib/markos/{pql,upgrade-triggers,inapp,experiments}/ | `pql_hot_transition_review` (8th) + `upgrade_trigger_activate` (9th) + `inapp_campaign_activate` (10th) + `experiment_activate` (11th) — `grep -E "pql_hot_transition_review\|upgrade_trigger_activate\|inapp_campaign_activate\|experiment_activate" lib/markos/{pql,upgrade-triggers,inapp,experiments}/*.ts` returns at least 4 distinct matches |
| Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` | 03, 04 | lib/markos/upgrade-triggers/triggers.ts + lib/markos/inapp/campaigns.ts | `grep -E "MARKOS_PRICING_ENGINE_PENDING" lib/markos/upgrade-triggers/triggers.ts lib/markos/inapp/campaigns.ts` returns at least 2 matches; `upgrade_triggers.pricing_context_sentinel` and `in_app_campaigns.pricing_context_sentinel` columns exist |
| Banned-lexicon zero-match (pre-dispatch) | 04, 03 | lib/markos/inapp/campaigns.ts `validateContentBeforeDispatch()` + lib/markos/upgrade-triggers/triggers.ts `validatePromptCopyBeforeDispatch()` | `grep -E "validateContentBeforeDispatch\|validatePromptCopyBeforeDispatch" lib/markos/{inapp,upgrade-triggers}/*.ts` returns at least 2 matches; cron handlers MUST NOT enqueue when match count > 0 |
| 5-clause UPGRADE_TRIGGER_PRICING_REQUIRED defense | 03 | supabase/migrations/103_growth_upgrade_triggers.sql | `pricing_recommendation_id IS NOT NULL OR pricing_context_sentinel = '{{MARKOS_PRICING_ENGINE_PENDING}}'` AND `approved_at IS NOT NULL` verbatim in trigger function |
| 5-field EXPERIMENT_ACTIVATION constraint | 05 | supabase/migrations/105_growth_experiments.sql | `owner_id IS NOT NULL` + `decision_criteria` non-empty + `learning_handoff` non-empty + `>=1 experiment_guardrail` + `approved_at IS NOT NULL` verbatim in trigger function (matches CONTEXT.md non-negotiable) |
| 6 suppression rule_types | 04 | lib/markos/inapp/contracts.ts `INAPP_SUPPRESSION_RULE_TYPES` | `user_level`, `account_level`, `campaign_level`, `global_quiet_hours`, `cs_active_override`, `email_coordination_window` verbatim 6-value list |
| 9 verbatim agent_ids + 3-value tier + 8-boolean checklist + GENERATED runnable | 06 | supabase/migrations/106_growth_agents_readiness.sql + lib/markos/growth-agents/contracts.ts | `MARKOS-AGT-PLG-01..06` + `MARKOS-AGT-IAM-01` + `MARKOS-AGT-XP-01..02` (9 INSERT ON CONFLICT rows); `PLG_AGENT_TIERS = ['PLG','IAM','XP']`; 8 boolean columns verbatim; `runnable` GENERATED ALWAYS AS (8-boolean AND chain) STORED |
| 60-row module_mode_eligibility seed | 01 | supabase/migrations/101_growth_saas_profile.sql | `SELECT count(*) FROM module_mode_eligibility` returns 60 (12 modules × 5 modes); `SELECT count(*) WHERE eligible=true` returns 39 |
| 5 markos_growth_mode ENUM values | 01 | supabase/migrations/101_growth_saas_profile.sql | `b2b`, `b2c`, `plg_b2b`, `plg_b2c`, `b2b2c` — `SELECT enumlabel FROM pg_enum WHERE enumtypid='markos_growth_mode'::regtype` returns 5 rows |

### 5 future-surface UI binding contracts (load-bearing for future P208/P217/P218 frontends)

| Contract | UI-SPEC §section | Owning Plan | Backend assertions | Future surface |
|----------|------------------|-------------|---------------------|----------------|
| **UI Binding 1: PQL Score** | §Future-Surface UI Binding Contract 1: PQL Score | 218-02 | 4-value `pql_status` + 6-value `recommended_action` + 5 explainable signals + `PQL_SCORE_REQUIRES_EVIDENCE` trigger + 8th handoff_kind `pql_hot_transition_review` | future P218 admin PQL viewer + P208 hot-transition approval modal |
| **UI Binding 2: Upgrade Trigger** | §Future-Surface UI Binding Contract 2: Upgrade Trigger | 218-03 | 4-value `status` + 7-value `trigger_type` + 6-value `prompt_format` + 5-clause `UPGRADE_TRIGGER_PRICING_REQUIRED` + sentinel + 9th handoff_kind `upgrade_trigger_activate` + banned-lexicon pre-dispatch | future P218 admin upgrade-trigger configuration wizard + P208 activation modal |
| **UI Binding 3: InApp Campaign** | §Future-Surface UI Binding Contract 3: InApp Campaign | 218-04 | 5-value `status` + 7-value `format` + 7-value `primary_goal` (with pricing-gating) + 6 suppression rule_types + 2 DB-triggers + 10th handoff_kind `inapp_campaign_activate` + banned-lexicon pre-dispatch + 213-04 public-proof boundary | future P218 tenant InAppCampaign editor + P208 activation modal + P218 admin suppression rule browser |
| **UI Binding 4: Marketing Experiment** | §Future-Surface UI Binding Contract 4: Marketing Experiment | 218-05 | 6-value `status` + 4-value `experiment_type` + 5-field `EXPERIMENT_ACTIVATION_REQUIRES_*` + ICE GENERATED column + 13-value `surface` + 2-value `direction` + 4-value `decision` + LRN SOFT FK chain + 11th handoff_kind `experiment_activate` | future P218 tenant experiment registry + guardrails editor + P208 activation modal + P218 admin decision log viewer |
| **UI Binding 5: 9 PLG Agents Readiness** | §Future-Surface UI Binding Contract 5: 9 PLG Agents Readiness | 218-06 | 9 verbatim agent_ids + 3-value `agent_tier` + 8-boolean checklist + GENERATED `runnable` + `AGENT_ACTIVATION_REQUIRES_READINESS` + checkpoint:human-action first-run | future P217-06 `app/saas/agents/page.tsx` extension |

### Translation gate dissolutions (substrate-layer, this phase) + opens (UI-layer, deferred)

| Action | Gate | Owning Plan | Status |
|--------|------|-------------|--------|
| DISSOLVED (backend) | `217-UI-SPEC §future_phase_218_growth_dashboards` | 01..06 | Backend substrate complete; 3 P218 `saas_nav_visibility` namespaces (`saas_plg`, `saas_inapp`, `saas_experiments`) flipped `planned_only=false` by 218-06 closeout |
| DISSOLVED (backend) | `216-UI-SPEC §future_phase_218_growth_signal_consumer` | 01..04 | 9-row `growth_signal_map` reservation consumed; `EVENT_CATEGORIES` + `saas_health_scores.risk_level` consumed |
| DISSOLVED (backend) | `214-UI-SPEC §future_phase_217 growth-extension activation wizard` | 01 | `markos_growth_mode` ENUM + `saas_growth_profiles` + 60-row `module_mode_eligibility` + `MODE_REQUIRES_SAAS_ACTIVATION` ship in migration 101 |
| OPENED (UI-layer deferred) | `future_phase_218_admin_ui` | 06 | 12-surface admin frontend (PLG dashboard / PQL viewer / upgrade-trigger wizard / InApp editor / suppression browser / experiment registry / guardrails editor / activation-definition wizard / milestone funnel viewer / mode-eligibility browser / growth profile editor / decision log viewer) |
| OPENED (UI-layer deferred) | `future_phase_218_tenant_ui` | 06 | Tenant-facing growth profile editor + activation-definition wizard + experiment registry browser + InAppCampaign editor with frequency-cap preview |
| OPENED (UI-layer deferred) | `future_phase_218_approval_inbox_extensions` | 02..05 | P208 Approval Inbox extends from 8 to 12 chips (4 NEW handoff_kind literals) — row rendering deferred |
| OPENED (UI-layer deferred) | `future_phase_218_agents_page_extension` | 06 | 217-06 `app/saas/agents/page.tsx` extension renders 9 P218 PLG agent readiness rows |

### Downstream UI inheritance citations (≥10 future surfaces)

The 5 UI binding contracts collectively bind ≥10 future surfaces:

1. `app/saas/plg/page.tsx` (PLG dashboard — Plan 01 substrate)
2. `app/saas/plg/pql/page.tsx` (PQL scoring viewer — Plan 02 substrate; UI Binding 1)
3. `app/saas/plg/upgrade-triggers/page.tsx` (upgrade-trigger configuration wizard — Plan 03 substrate; UI Binding 2)
4. `app/saas/inapp/campaigns/[id]/edit/page.tsx` (InAppCampaign editor — Plan 04 substrate; UI Binding 3)
5. `app/saas/inapp/suppression/page.tsx` (suppression rule browser — Plan 04 substrate; UI Binding 3)
6. `app/saas/experiments/page.tsx` (experiment registry with ICE-ranked backlog — Plan 05 substrate; UI Binding 4)
7. `app/saas/experiments/[id]/guardrails/page.tsx` (experiment guardrails editor — Plan 05 substrate; UI Binding 4)
8. `app/saas/plg/activation/page.tsx` (activation-definition wizard — Plan 02 substrate)
9. `app/saas/plg/milestones/page.tsx` (milestone funnel viewer — Plan 02 substrate)
10. `app/saas/admin/mode-eligibility/page.tsx` (growth-mode eligibility browser — Plan 01 substrate)
11. `app/saas/admin/growth-profile/page.tsx` (growth profile editor — Plan 01 substrate)
12. `app/saas/experiments/decisions/page.tsx` (experiment decision log viewer — Plan 05 substrate; UI Binding 4)
13. `/operations/approvals` 4 NEW chips (P208 Approval Inbox — UI Bindings 1/2/3/4)
14. `app/saas/agents/page.tsx` 9 readiness rows (P217-06 extension — UI Binding 5)

### 213.4 Carry-Forward (D-08..D-15) + 217 D-21 binding

| Decision | Substrate enforcement | Future-surface enforcement |
|----------|------------------------|----------------------------|
| D-08 token-only | 218 ships zero CSS — substrate-only phase | Future surfaces use `var(--*)` tokens only; `grep -P '(?<![\w-])#[0-9a-fA-F]{3,8}\b'` returns 0 |
| D-09 mint-as-text | 218 ships zero JSX — substrate-only phase | `<.c-chip-protocol>` for IDs (`profile_id`, `score_id`, `trigger_id`, `campaign_id`, `experiment_id`, `agent_id`, etc.); CTAs ("Activate trigger →", "Approve activation →") mint-as-text per D-09 |
| D-09b `.c-notice` mandatory | 218 ships zero gating notices — substrate-only phase | Every gating state composes `<.c-notice c-notice--{state}>`; zero `.banner`/`.alert`/`.warning`/`.callout` |
| D-13 `.c-card--feature` reserved | 218 ships zero cards — substrate-only phase | All future 218 list rows + detail cards use `.c-card` default; `.c-card--feature` forbidden |
| D-14 no `.c-table` primitive | 218 ships zero tables — substrate-only phase | All future 218 lists use vanilla `<table>` + `.c-badge--{state}` row state |
| D-15 selective extraction | 218 ships zero components — substrate-only phase | 13 recommended D-15 extracted components (`<GrowthModeBadge />`, `<PqlScoreBadge />`, `<PqlSignalChipRow />`, `<UpgradeTriggerStatusBadge />`, `<PricingDefenseStatusBadge />`, `<InAppFormatBadge />`, `<SuppressionRuleBadge />`, `<FrequencyCapPreview />`, `<ExperimentStatusBadge />`, `<IceScoreChip />`, `<GuardrailDirectionBadge />`, `<ActivationConstraintChecklist />`, `<PlgAgentReadinessBadge />`) |
| D-21 server/client boundary (217 carry) | 218 ships zero server/client surfaces — substrate-only phase | Every future 218 admin/tenant surface defaults to server component reading via `requireHostedSupabaseAuth(request)`; `'use client'` opt-in for `<FrequencyCapPreview />` + `<IceScoreScrubber />` + `<SegmentTargetingEditor />` + `<PqlSignalThresholdConfigurator />` only |

### Cross-cutting doctrine binding (9 parent UI-SPECs)

The 218-UI-SPEC `parent_doctrine_chain` cites 9 PARENT UI-SPECs verbatim:

| Parent | What 218 inherits | Cited in plan(s) |
|--------|-------------------|------------------|
| 206-UI-SPEC | mutation-class doctrine (`external.send` for InAppCampaign delivery; `billing.charge` for upgrade-trigger activation; `data.export` for experiment_decisions LRN-bridge writes; `default_approval_mode`) | 03, 04, 05 |
| 207-UI-SPEC | `RunApiEnvelope` + `AgentRunEventType` + `ApprovalHandoffRecord` for cron + scorer + dispatch + activation runs | 02..06 |
| 208-UI-SPEC | Approval Inbox 4 NEW handoff_kind literals (8th-11th) | 02, 03, 04, 05 |
| 212-UI-SPEC | LRN-02/LRN-03/LRN-05 SOFT FK + lrn-bridge SOFT degradation | 05 |
| 213-UI-SPEC | 213-04 public-proof boundary + banned-lexicon zero-match | 03, 04 |
| 214-UI-SPEC | `MODE_REQUIRES_SAAS_ACTIVATION` DB-trigger + 214 future_phase_217 dissolution | 01 |
| 215-UI-SPEC | sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline | 03, 04 |
| 216-UI-SPEC | `saas_health_scores` consumer + `growth_signal_map` 9-row reservation dissolution + `EVENT_CATEGORIES` taxonomy | 01..04 |
| 217-UI-SPEC | `saas_nav_visibility` 12-row planned-only seed + 7 NEW extracted components reference + 217-06 agents page extension target | 01, 06 |

*Phase: 218-saas-growth-profile-plg-inapp-experimentation*
*Validation strategy created: 2026-04-26*
*Source: 218-RESEARCH.md + 218-REVIEWS.md*
