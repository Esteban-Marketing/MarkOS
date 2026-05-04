---
phase: 218
slug: saas-growth-profile-plg-inapp-experimentation
status: draft
shadcn_initialized: false
preset: not-applicable-no-ui-phase
domain: saas-growth-substrate-saas-growth-profile-5-mode-enum-60-row-mode-eligibility-seed-activation-definition-pql-score-evidence-trigger-upgrade-trigger-5-clause-pricing-defense-inapp-campaign-6-suppression-rule-types-frequency-caps-marketing-experiment-5-field-activation-constraint-9-plg-agents-readiness-registry
created: 2026-05-04
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: no-ui-surface-phase
ui_scope: zero-surface
plans_in_scope: [218-01, 218-02, 218-03, 218-04, 218-05, 218-06]
plans_with_ui_surfaces: []
plans_no_ui: [218-01, 218-02, 218-03, 218-04, 218-05, 218-06]
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `external.send` for InAppCampaign delivery dispatch (`primary_goal IN ('activation','feature_adoption','upgrade_prompt','retention','re_engagement','upsell')`); `billing.charge` for upgrade-trigger activation transitions when `pricing_recommendation_id NOT NULL`; `data.export` for experiment_decisions LRN-bridge writes + ICE-ranked backlog export; `default_approval_mode == single_approval` for `inapp_campaign_activate` + `upgrade_trigger_activate` + `pql_hot_transition_review`; `default_approval_mode == single_approval` for `experiment_activate` (5-field constraint; not dual_approval — guardrails encode dual-direction risk in-band); autonomy-ceiling on `external.send` for in-app delivery to all customer-facing surfaces; autonomy-ceiling on `billing.charge` for upgrade-trigger activation paths)
  - 207-UI-SPEC.md (`RunApiEnvelope`; `run_id` linked to PQL scorer cron runs (`growth-pql-scorer.js` daily) + upgrade-trigger condition-evaluator runs (`growth-upgrade-trigger-monitor.js` hourly) + InAppCampaign dispatch runs (`growth-inapp-campaign-dispatch.js` every 5min) + experiment activation runs + experiment decision recording runs + readiness-flag flip runs; `AgentRunEventType` for `pql_score_calculated` / `pql_hot_transition_detected` / `upgrade_trigger_fired` / `inapp_campaign_dispatched` / `inapp_delivery_suppressed` / `experiment_activated` / `experiment_decision_recorded` / `lrn_artifact_written` / `plg_agent_readiness_flag_flipped`; `ApprovalHandoffRecord` links 218 PQL hot-transitions + upgrade-trigger activations + InAppCampaign activations + experiment activations to P208 inbox)
  - 208-UI-SPEC.md (PARENT — Approval Inbox at `/operations/approvals` extends with FOUR new handoff_kind literals: `pql_hot_transition_review` (8th literal in the canonical chain — 218-02 PQL scorer transitions to `hot_pql` requiring CS review when `score >= 80` AND no prior hot_pql in 30d), `upgrade_trigger_activate` (9th literal — 218-03 `requestActivation` calls `buildApprovalPackage`), `inapp_campaign_activate` (10th literal — 218-04 `requestActivation`), `experiment_activate` (11th literal — 218-05 `requestActivation` per 5-field constraint); the 4 P207 literals + 5th P214 `billing_charge_approval` + 6th P215 `billing_correction_approval` + 7th P216 `support_response_approval` + 8th P216 `save_offer_approval` form the legacy 8-chip set; 218 extends to 12 chips; rendering of those four new chips is deferred to a future P208 admin extension that displays per-row classifier output, signal evidence, pricing context, frequency-cap preview, suppression status, and 5-field activation checklist)
  - 212-UI-SPEC.md (PARENT — `experiment_decisions` FK chain to `artifact_performance_logs` (LRN-02 SOFT FK) + `literacy_update_candidates` (LRN-05 SOFT FK) + `tenant_overlay_candidates` (LRN-03 SOFT FK); 218-05 `lib/markos/experiments/lrn-bridge.ts` writes to LRN substrate via INSERT-only path with SOFT degradation when P212 tables absent — try/catch + warning log on `relation does not exist`; `frontmatter integrates_with: [LRN-01, LRN-02, LRN-03, LRN-05]` not `requirements_addressed`; consume-only schema posture — never `.update()` on LRN tables, never DDL modification; future P212 learning admin surfaces consume the 218 experiment decision feed via the LRN-bridge anonymized output)
  - 213-UI-SPEC.md (Tenant 0 readiness gate consumer — 213-04 public-proof boundary applies to InAppCampaign content; 218 InAppCampaign `content_jsonb` + `prompt_copy` + experiment hypothesis + experiment decision rationale + PQL signals + upgrade-trigger prompt copy + intervention save-offer copy authored under 218 are PRIVATE doctrine and never published as public proof; raw segment-targeting JSONB, suppression scope, and account-level eligibility data are NEVER cited in case-studies or external surfaces; banned-lexicon (`synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` as softener) zero-match required on `in_app_campaigns.content_jsonb` + `in_app_campaigns.prompt_copy` + `upgrade_triggers.prompt_copy` BEFORE any `external.send` mutation dispatches the content; mirrors 216-03 support-response banned-lexicon pre-dispatch gate)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; `saas_growth_profiles.tenant_id` FK to `markos_orgs` UNIQUE; `saas_growth_profiles.profile_id` referenced by `activation_definitions`, `upgrade_triggers`, `in_app_campaigns`, `marketing_experiments`; `MODE_REQUIRES_SAAS_ACTIVATION` BEFORE INSERT OR UPDATE on `saas_growth_profiles` checks tenant has active SaaSSuiteActivation in 214 `saas_suite_activations` table; 218 inherits the `business_type != 'saas'` gating contract for all future growth surfaces; the 214 `<SaaSActivationPanel />` + `<SaaSSubscriptionsTable />` extracted components are downstream consumers of 218 PLG / experiment / InAppCampaign metadata-only signals; 214 `future_phase_217` placeholder for growth-extension activation wizard is FULLY DISSOLVED at the backend layer by 218 (UI surface still future))
  - 215-UI-SPEC.md (PARENT — sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline for `upgrade_triggers.pricing_context_sentinel` column; the 5-clause `UPGRADE_TRIGGER_PRICING_REQUIRED` DB-trigger accepts EITHER `pricing_recommendation_id NOT NULL` OR `pricing_context_sentinel = '{{MARKOS_PRICING_ENGINE_PENDING}}'` per Pricing Engine Canon; `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` extends sentinel acceptance to `in_app_campaigns.pricing_context_sentinel` for `primary_goal='upgrade'` campaigns; 215 sensitive-credential UI binding contract Layer 6 (`[REDACTED]` for STRIPE/MP/SIIGO/DIAN/QB PII fields) does NOT extend into 218 (no payment processor PII in scope); 215 evidence-pack pattern reused for experiment_decisions audit chain)
  - 216-UI-SPEC.md (PARENT — `saas_health_scores` FK consumed by 218-02 `lib/markos/pql/scorer.ts` via `from('saas_health_scores').select(...)`; `saas_health_scores.risk_level` consumed by 218-01 module mode eligibility; the 9-row `growth_signal_map` reservation seed in 216-06 (planned_only=true) is DISSOLVED by 218 — 218-01 + 218-02 + 218-03 + 218-04 UPDATE `growth_signal_map` rows to `planned_only=false + activated_at=now()` per consumer wired; 216 `<HealthScoreBadge />` + `<RiskBandBadge />` + `<ClassifierChipRow />` + `<KbGroundingPanel />` + `<SaveOfferPricingBlock />` + `<RetentionClassChip />` + `<PIIRedactedField />` extracted-component recipes from 216 §D-15 are referenced by future 218 admin surfaces but NOT consumed by 218 itself; the 216 `EVENT_CATEGORIES = ['activation','adoption','depth','stickiness','expansion','plg_readiness','churn_signal','other']` taxonomy is consumed by 218-04 InAppCampaign `target_segment_jsonb` + 218-02 PQL scorer signal sources)
  - 217-UI-SPEC.md (PARENT — `saas_nav_visibility` 12-row planned-only seed with 3 P218 namespaces (`saas_plg`, `saas_inapp`, `saas_experiments`) reserved for 218 Plan 06 dissolution; `SAAS_NAV_REQUIRES_ACTIVATION` DB-trigger validates 218 nav rows can flip `planned_only=false + is_active=true` only when associated `saas_growth_profiles` row exists with `active_modules` matching the SG namespace; 217-06 `<SaaSActivationPanel />` + `<SaaSSubscriptionsTable />` + 7 NEW extracted components (`<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />`) are first-class production primitives that future 218 admin surfaces compose; 217 D-21 server/client boundary doctrine carries forward verbatim — every future 218 admin surface MUST be a default server component reading via `requireHostedSupabaseAuth(request)` + tenant-scoped supabase client; client components opt in via `'use client'` only for interactive primitives (frequency-cap preview slider, ICE-score scrubber, segment-targeting JSON editor); 217 `app/saas/agents/page.tsx` agents-page is the surface where the 9 P218 PLG agents readiness rows render with `runnable=false` badges until criteria met)
  - 213.4-VALIDATION.md §Carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary)
translation_gates_dissolved_by_218:
  - "217-UI-SPEC §future_phase_218_growth_dashboards — DISSOLVED at the backend-substrate layer by 218 plans 01-06 shipping `saas_growth_profiles` + `module_mode_eligibility` (60-row seed) + `activation_definitions` + `pql_scores` + `upgrade_triggers` + `in_app_campaigns` + `marketing_experiments` + `plg_growth_agent_readiness` + 17-18 `/v1/growth/*` API handlers + 12 MCP tools + 5 cron handlers. The P217-06 `saas_nav_visibility` 12-row planned-only seed has 3 P218 namespaces (`saas_plg`, `saas_inapp`, `saas_experiments`) which 218-06 closeout UPDATEs to `planned_only=false + is_active=true` per consumer wiring. The frontend admin / tenant surfaces (PLG dashboard, PQL scoring viewer, upgrade-trigger configuration wizard, InAppCampaign editor with frequency-cap preview, suppression rule browser, experiment registry browser with ICE-ranked backlog, experiment guardrails editor, activation-definition wizard, milestone funnel viewer, growth-mode eligibility browser, growth profile editor, experiment decision log viewer, InAppCampaign approval modal, upgrade-trigger approval modal, experiment-activate approval modal, 9 PLG agents readiness viewer extension on 217-06 `app/saas/agents/page.tsx`) are DEFERRED to future P218+ admin/tenant phases. 218 ships substrate ONLY. The `<PlaceholderBanner variant=\"future_phase_218_growth_dashboards\">` is REMOVED from 217-consuming surfaces at the backend-contract layer; UI-layer placeholder removal requires the future admin/tenant frontend phase."
  - "217-UI-SPEC §future_phase_218_pii_audit_log_admin — STAYS DEFERRED. 218 does NOT ship the SOC2 admin PII audit log. The `data_retention_classes` 15-row catalog from 216-05 + retention sweep timeline + per-tenant PII class summary is reserved for a future SOC2 admin extension phase. (Translation gate kept open; not dissolved by 218.)"
  - "217-UI-SPEC §future_phase_218_dian_wizard_ui_extension — STAYS DEFERRED. 218 does NOT ship the DIAN setup wizard. The wizard surface composes 217-06 `app/saas/invoices/page.tsx` Settings link to a future admin route. (Translation gate kept open; not dissolved by 218.)"
  - "216-UI-SPEC §future_phase_218_growth_signal_consumer — DISSOLVED at the backend-substrate layer. 218-01 `lib/markos/profile/mode-eligibility.ts` + 218-02 `lib/markos/pql/scorer.ts` consume the 216 `EVENT_CATEGORIES` taxonomy + `saas_health_scores.risk_level`; 218-01..218-04 plan execution UPDATEs `growth_signal_map` rows (`planned_only=false` + `activated_at=now()`) when each consumer wires. The 9-row reservation in 216-06 is fully consumed by 218 substrate. UI-layer placeholder removal in any future 216-consuming surface requires the future P218 admin extension phase that surfaces the consumed signals."
  - "214-UI-SPEC §future_phase_217 (growth-extension activation wizard) — DISSOLVED at the backend-substrate layer by 218 ENUM `markos_growth_mode = ['b2b','b2c','plg_b2b','plg_b2c','b2b2c']` + `saas_growth_profiles` table + 60-row `module_mode_eligibility` seed + `MODE_REQUIRES_SAAS_ACTIVATION` DB-trigger + `lib/markos/profile/mode-eligibility.ts` runtime helper. The 214 `future_phase_217` placeholder is FULLY DISSOLVED at the backend layer. UI-layer wizard surface (growth-mode selection wizard with 5-mode preview + module activation matrix viewer + has-sales-team / has-cs-team / has-developer-audience toggles + plg_enabled / b2b_enabled / b2c_enabled GENERATED column preview + GTM motion selection) remains DEFERRED to a future P218+ admin/tenant frontend phase."
  - "215-UI-SPEC §future_phase_218_payout_dispatch — STAYS DEFERRED. 218 does NOT ship affiliate / partner / referral payout dispatch. The 215-06 `saas_future_payout_policies` table 4 seed rows (`referral_reward`, `affiliate_commission`, `partner_payout`, `incentive_experiment`) remain `planned_only=true`. P218 plans do touch `incentive_experiment` policy in `marketing_experiments.experiment_type='holdout'` shape but do NOT wire payout dispatch — that wiring is P220's domain. (Translation gate kept open; not dissolved by 218.)"
translation_gates_opened_by_218:
  - "future_phase_218_admin_ui — Multi-page admin surface composing PLG dashboard (`app/saas/plg/page.tsx` future) + PQL scoring viewer (`app/saas/plg/pql/page.tsx` future) + upgrade-trigger configuration wizard (`app/saas/plg/upgrade-triggers/page.tsx` future) + InAppCampaign editor (`app/saas/inapp/campaigns/[id]/edit/page.tsx` future) + suppression rule browser (`app/saas/inapp/suppression/page.tsx` future) + experiment registry browser (`app/saas/experiments/page.tsx` future) + experiment guardrails editor (`app/saas/experiments/[id]/guardrails/page.tsx` future) + activation-definition wizard (`app/saas/plg/activation/page.tsx` future) + milestone funnel viewer (`app/saas/plg/milestones/page.tsx` future) + growth-mode eligibility browser (`app/saas/admin/mode-eligibility/page.tsx` future) + growth profile editor (`app/saas/admin/growth-profile/page.tsx` future) + experiment decision log viewer (`app/saas/experiments/decisions/page.tsx` future). All read via 218 `/v1/growth/*` API contracts (F-238..F-245); all gate via 217-06 `isSaaSSurfaceEnabled` 3-condition gate; all extend 217-06 `saas_nav_visibility` 12-row seed (`saas_plg`, `saas_inapp`, `saas_experiments` namespaces). Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_admin_ui\">` until those phases ship."
  - "future_phase_218_tenant_ui — Tenant-facing growth surfaces composing growth profile editor (operator/CSO selecting growth mode + GTM motion + active modules with mode-eligibility validation), activation-definition wizard (CSO/PM authoring aha-moment description + event_name + minimum_count + window_days + 4 baseline rates with operator approval gate on threshold change), experiment registry browser with ICE-ranked backlog (PM/Growth ranking experiments by ICE score), InAppCampaign editor with frequency-cap preview (Marketing authoring `target_segment_jsonb` + `trigger_jsonb` + `content_jsonb` + format/goal selection + frequency-cap visualization with overlap warnings + 6 suppression rule indicator chips). All consume 218 substrate; all gate via 214 SaaSSuiteActivation. Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_tenant_ui\">` until those phases ship."
  - "future_phase_218_approval_inbox_extensions — P208 Approval Inbox at `/operations/approvals` rendering 4 new handoff_kind chips (`pql_hot_transition_review` 8th + `upgrade_trigger_activate` 9th + `inapp_campaign_activate` 10th + `experiment_activate` 11th), filter chip set extends from 8 chips to 12 chips. Each chip renders the per-row classifier (PQL signals badge row, upgrade-trigger 5-clause pricing-defense status, InAppCampaign frequency-cap preview + 6 suppression rule indicators, experiment 5-field activation checklist). Row rendering extension is DEFERRED to a future P208 admin extension phase. Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_approval_inbox_extensions\">` until that phase ships."
  - "future_phase_218_agents_page_extension — 217-06 `app/saas/agents/page.tsx` agents page extension rendering 9 P218 PLG agents readiness rows (`MARKOS-AGT-PLG-01..06` + `MARKOS-AGT-IAM-01` + `MARKOS-AGT-XP-01..02`) with `runnable=false` badges until criteria met; per-agent 8-readiness-boolean checklist visible (contracts_assigned + cost_estimated + approval_posture_defined + tests_implemented + api_surface_defined + mcp_surface_defined + ui_surface_defined + failure_behavior_defined); `[block] Agent not yet runnable` paired with `--color-error` badge for `runnable=false`; `[ok] Agent ready` paired with `--color-success` badge when GENERATED `runnable=true`. PLG-06 (Viral Loop Designer) renders `blocking_phase='P220-confirm'` indicator. Future surfaces render `<PlaceholderBanner variant=\"future_phase_218_agents_page_extension\">` until that phase ships."
  - "future_phase_219_partner_console — P219 partner console UI surface (already opened by 217). 218 does NOT modify this gate. Future surfaces render `<PlaceholderBanner variant=\"future_phase_219_partner_console\">` until P219 Plan 06 ships."
  - "future_phase_220_referral_console — P220 referral console UI surface (already opened by 217). 218 does NOT modify this gate. Future surfaces render `<PlaceholderBanner variant=\"future_phase_220_referral_console\">` until P220 Plan 06 ships."
---

# Phase 218 — UI Design Contract (no-UI-scope)

> **Phase 218 ships zero UI surfaces.** This document is the explicit
> no-surface declaration for the SaaS Growth Profile, PLG, In-App
> Marketing, and Experimentation phase. There is no `app/`, no
> `components/`, no `*.stories.tsx`, no `page.tsx`, no `layout.tsx`,
> no `*.module.css`, and no `*.css` modified or created in any of the
> six plans (218-01 through 218-06).
>
> **Critical posture:** Phase 218 is the **growth substrate** of the
> SaaS Suite — 5-mode `markos_growth_mode` ENUM (`b2b | b2c | plg_b2b
> | plg_b2c | b2b2c`) + `saas_growth_profiles` (one per tenant) + 60-row
> `module_mode_eligibility` seed (12 modules × 5 modes; 39 eligible /
> 21 ineligible); ActivationDefinition (one per tenant — aha-moment
> specification + 4 baseline rates) + milestone funnels + PQLScore
> (append-only with explainable signals across usage / intent / fit
> dimensions) + the strictest evidence trigger of the 6 P218 DB-triggers
> (`PQL_SCORE_REQUIRES_EVIDENCE` blocks pql/hot_pql transitions when
> ALL 5 explainable signal columns false); UpgradeTrigger configuration
> + 5-clause `UPGRADE_TRIGGER_PRICING_REQUIRED` defense
> (`pricing_recommendation_id NOT NULL OR pricing_context_sentinel =
> '{{MARKOS_PRICING_ENGINE_PENDING}}' AND approved_at NOT NULL` on
> activation transition) + condition evaluator reading P215
> `tenant_billing_subscriptions` + P216 `saas_health_scores` (consume-
> only); InAppCampaign with frequency caps + cooldown windows + 6
> suppression rule_types (user_level / account_level / campaign_level
> / global_quiet_hours / cs_active_override / email_coordination_window)
> + `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` (activation gate +
> upgrade-goal pricing gate) + `INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK`
> (per-user delivery cap defense); MarketingExperiment registry with
> ICE scoring (`ice_score = ice_impact * ice_confidence * ice_ease`
> GENERATED column) + experiment_guardrails (≥1 required for
> activation) + experiment_decisions with LRN-02/LRN-03/LRN-05 SOFT FK
> integration via lrn-bridge + 5-field
> `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING`
> DB-trigger matching CONTEXT.md non-negotiable verbatim; 9 PLG agents
> readiness registry (`plg_growth_agent_readiness` system-level table
> with `MARKOS-AGT-PLG-01..06` + `MARKOS-AGT-IAM-01` + `MARKOS-AGT-XP-01..02`
> rows; `runnable` GENERATED ALWAYS AS (8 boolean AND chain) STORED;
> `AGENT_ACTIVATION_REQUIRES_READINESS` DB-trigger; `runnable=false`
> until operator-approved). The phase's risk posture is HIGH on three
> dimensions — **customer-facing in-app delivery autonomy** (CS approval
> default; safe-auto-response only when operator explicitly enables
> tenant flag), **upgrade-trigger pricing integrity** (Pricing Engine
> context or sentinel; no tier-name or dollar literals authored anywhere
> in 218), and **experiment activation discipline** (5-field
> constraint — guardrails + owner + decision_criteria + learning_handoff
> + approved_at; missing any field blocks activation at DB layer).
>
> The existing P208 Approval Inbox + Recovery Center + Task Board + the
> P217-06 `app/saas/agents/page.tsx` agents page consume 218 contracts
> as downstream readers — they are NOT modified by this phase. The four
> new Approval Inbox handoff_kind literals (`pql_hot_transition_review`
> + `upgrade_trigger_activate` + `inapp_campaign_activate` +
> `experiment_activate`) extend the P208 filter chip set from 8 to 12
> literals; rendering of those four new chips is deferred to a future
> P208 admin extension that displays per-row classifier output (PQL
> signals badge row, upgrade-trigger 5-clause pricing-defense status,
> InAppCampaign frequency-cap preview + 6 suppression indicators,
> experiment 5-field activation checklist), pricing context, and
> approval CTAs. The 9 PLG agents readiness rows append into the
> existing 217-06 `app/saas/agents/page.tsx` rendering — that surface
> extension is also deferred. The P217-06 `saas_nav_visibility` 12-row
> planned-only seed has 3 P218 namespaces (`saas_plg`, `saas_inapp`,
> `saas_experiments`) which 218-06 closeout UPDATEs to `planned_only=false
> + is_active=true` (substrate-layer dissolution) — actual nav row
> rendering activation requires the future admin frontend phase.
>
> What Phase 218 *does* ship is the **growth substrate** — **Supabase
> migrations** (`supabase/migrations/{101_growth_saas_profile,
> 102_growth_activation_pql, 103_growth_upgrade_triggers,
> 104_growth_inapp_campaigns, 105_growth_experiments,
> 106_growth_agents_readiness}.sql` — 6 DDL slots covering `markos_growth_mode`
> ENUM, `saas_growth_profiles`, `module_mode_eligibility` (60-row seed),
> `activation_definitions`, `activation_milestones`, `pql_scores`,
> `upgrade_triggers`, `upgrade_trigger_events`, `in_app_campaigns`,
> `in_app_campaign_deliveries`, `in_app_suppression_rules`,
> `marketing_experiments`, `experiment_guardrails`, `experiment_decisions`,
> `plg_growth_agent_readiness`), **6 DB-triggers**
> (`MODE_REQUIRES_SAAS_ACTIVATION` /
> `PQL_SCORE_REQUIRES_EVIDENCE` /
> `UPGRADE_TRIGGER_PRICING_REQUIRED` (5-clause) /
> `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` /
> `INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK` /
> `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING`
> (5-field) +
> `AGENT_ACTIVATION_REQUIRES_READINESS`), **typed growth modules**
> under `lib/markos/{growth,profile,activation,pql,upgrade-triggers,
> inapp,experiments,growth-agents,mcp}/**` (~50 lib files; TS source +
> CommonJS twins + index.cjs barrels), **MCP tools** (`lib/markos/mcp/
> tools/growth.cjs` — 12 tool descriptors total: 9 read-mostly + 3
> write-gated), **Node API handlers** (`api/v1/growth/*.js` — 17-18
> server-side route modules; legacy `api/*.js` with no JSX, no rendering),
> **5 cron handlers** (`api/cron/growth-{profile-sync,pql-scorer,
> upgrade-trigger-monitor,inapp-campaign-dispatch,experiment-stale-monitor}.js`),
> **F-ID contracts** (`contracts/F-{238..246}-growth-*.yaml` — 9 IDs
> total: F-238 saas-profile + F-239 mode-eligibility + F-240 activation-
> definition + F-241 pql-score + F-242 upgrade-trigger + F-243 inapp-
> campaign + F-244 inapp-suppression + F-245 experiment + F-246 agents-
> readiness), **migration coordination registry update**
> (`.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` CREATE; first phase
> to ship the doc; reserves slots 101-106 + F-238..F-246), **growth
> agent readiness registry** (9-agent INSERT ON CONFLICT seed; PLG-06
> Viral Loop Designer with `blocking_phase='P220-confirm'`), and
> **tests** (`test/growth-218/{preflight,profile,activation,pql,
> upgrade-triggers,inapp,experiments,agents,api,cron,mcp,rls,closeout,
> openapi}/*.test.js`). None of those files compose, import, or render
> any visual primitive from `styles/components.css` or any token from
> `app/tokens.css`. The Node API handlers under `api/v1/growth/*.js`
> and the 5 cron handlers under `api/cron/growth-*.js` are flat
> versioned legacy `api/*.js` handlers per the 218 architecture-lock
> pin (forbidden patterns include `route.ts`, `app/api/cron/.../route.ts`,
> `app/(saas)/`, `app/(growth)/`, `app/(plg)/`). They emit JSON envelopes
> only; the cron handlers ack with HTTP 200 and emit `markos_agent_runs`
> events.
>
> However, **every downstream phase (P208 admin extensions for the 4
> new approval handoff_kind chips, P217-06 `app/saas/agents/page.tsx`
> 9 PLG agents readiness viewer extension, future P218 admin/tenant
> frontends for PLG dashboard / PQL viewer / upgrade-trigger wizard /
> InAppCampaign editor / experiment registry / 218 admin/tenant phases,
> P219 / P220 growth-mode-gated module surfaces) that consumes a Phase
> 218 contract WILL eventually need a UI surface** — PLG dashboard
> with mode-routing visualization, PQL scoring viewer with 3-dimension
> signal breakdown, upgrade-trigger configuration wizard with 5-clause
> pricing-defense preview, InAppCampaign editor with frequency-cap
> overlap visualization, suppression rule browser, experiment registry
> browser with ICE-ranked backlog, experiment guardrails editor,
> activation-definition wizard, milestone funnel viewer, growth-mode
> eligibility browser, growth profile editor, experiment decision log
> viewer, InAppCampaign approval modal, upgrade-trigger approval modal,
> experiment-activate approval modal, 9 PLG agents readiness viewer.
> This UI-SPEC therefore also serves as a forward-looking inheritance
> map so future UI-SPECs can cite their lineage back to the growth
> substrate doctrine defined here, AND as the load-bearing binding
> contract for **five future-surface UI binding contracts** (PQL score
> / upgrade trigger / InApp campaign / experiment / 9 PLG agents
> readiness).
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md
> carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice`
> mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`,
> D-15 selective extraction, D-21 server/client boundary) → 206-UI-SPEC
> (mutation-class origin: `external.send` for InAppCampaign delivery,
> `billing.charge` for upgrade-trigger activation, `data.export` for
> experiment_decisions LRN-bridge writes; `default_approval_mode` per
> handoff_kind) → 207-UI-SPEC (`RunApiEnvelope`, `AgentRunEventType`,
> `ApprovalHandoffRecord`; PQL scorer + upgrade-trigger evaluator +
> InAppCampaign dispatch + experiment activation runs link via
> `agent_run_id`) → 208-UI-SPEC (PARENT — Approval Inbox extends
> `pql_hot_transition_review` 8th + `upgrade_trigger_activate` 9th +
> `inapp_campaign_activate` 10th + `experiment_activate` 11th
> handoff_kind literals; Recovery Center reads cron failure rows;
> Task Board reads PLG signal handoff tasks) → 212-UI-SPEC (PARENT —
> experiment_decisions FK to artifact_performance_logs / literacy_update_candidates
> / tenant_overlay_candidates; LRN-bridge SOFT degradation; LRN-02 +
> LRN-03 + LRN-05 INTEGRATES not OWNS) → 213-UI-SPEC (Tenant 0 readiness
> gate consumer; 213-04 public-proof boundary applies to InAppCampaign
> content as PRIVATE doctrine; banned-lexicon zero-match BEFORE
> `external.send` dispatch) → 214-UI-SPEC (PARENT — SaaS Suite
> Activation; `MODE_REQUIRES_SAAS_ACTIVATION` DB-trigger; 214
> `future_phase_217` placeholder dissolved at backend) → 215-UI-SPEC
> (PARENT — sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline for
> upgrade-trigger pricing + InAppCampaign upgrade-goal pricing) →
> 216-UI-SPEC (PARENT — `saas_health_scores` consumed by PQL scorer;
> 216 EVENT_CATEGORIES taxonomy consumed by InAppCampaign segments;
> 216 9-row growth_signal_map reservation dissolved by 218) →
> 217-UI-SPEC (PARENT — `saas_nav_visibility` 12-row seed; 3 P218
> namespaces dissolved at substrate layer; 217-06 agents page extension
> deferred; 7 NEW extracted components referenced) → this document.
> Generated by gsd-ui-researcher 2026-05-04. Status: draft (checker
> upgrades to approved once the no-UI declaration is verified).

---

## Scope Verification

The orchestrator's preliminary finding has been verified by reading all
six plans plus context, research, reviews, and validation. The full
file set declared in `files_modified` across 218-01..218-06 is
enumerated below, with surface classification per file:

| File class | Path glob | Plan(s) | UI surface? |
|------------|-----------|---------|-------------|
| Phase doctrine | `.planning/phases/218-saas-growth-profile-plg-inapp-experimentation/{218-CONTEXT, 218-RESEARCH, 218-REVIEWS, 218-VALIDATION, 218-{01..06}-PLAN, 218-{01..06}-SUMMARY, DISCUSS}.md` | 218-01..218-06 | NO |
| Migration coordination | `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (CREATE; P218 first) | 218-01 | NO |
| Preflight surface | `lib/markos/growth/preflight/{upstream-gate.ts, architecture-lock.ts, errors.ts, index.cjs}` (4 files) | 218-01 | NO (TS/CJS modules; no JSX) |
| Profile domain modules | `lib/markos/profile/{contracts.ts, contracts.cjs, growth-profiles.ts, growth-profiles.cjs, mode-eligibility.ts, mode-eligibility.cjs, index.cjs}` (7 files) | 218-01 | NO |
| Activation domain modules | `lib/markos/activation/{contracts.ts, contracts.cjs, definitions.ts, milestones.ts, index.cjs}` (5 files) | 218-02 | NO |
| PQL domain modules | `lib/markos/pql/{contracts.ts, contracts.cjs, scorer.ts, scorer.cjs, index.cjs}` (5 files) | 218-02 | NO |
| Upgrade-triggers domain modules | `lib/markos/upgrade-triggers/{contracts.ts, contracts.cjs, triggers.ts, triggers.cjs, condition-evaluator.ts, index.cjs}` (6 files) | 218-03 | NO |
| In-app domain modules | `lib/markos/inapp/{contracts.ts, contracts.cjs, campaigns.ts, campaigns.cjs, suppression.ts, coordinator.ts, index.cjs}` (7 files) | 218-04 | NO |
| Experiments domain modules | `lib/markos/experiments/{contracts.ts, contracts.cjs, registry.ts, registry.cjs, guardrails.ts, decisions.ts, decisions.cjs, backlog.ts, lrn-bridge.ts, index.cjs}` (10 files) | 218-05 | NO |
| Growth-agents domain modules | `lib/markos/growth-agents/{contracts.ts, contracts.cjs, readiness-registry.ts, readiness-gate.ts, index.cjs}` (5 files) | 218-06 | NO |
| MCP tools | `lib/markos/mcp/tools/growth.cjs` + `lib/markos/mcp/tools/index.cjs` (registry append) | 218-06 | NO (CommonJS MCP descriptors; no JSX) |
| Migrations | `supabase/migrations/{101_growth_saas_profile, 102_growth_activation_pql, 103_growth_upgrade_triggers, 104_growth_inapp_campaigns, 105_growth_experiments, 106_growth_agents_readiness}.sql` (6 files) | 218-01..218-06 | NO (SQL DDL) |
| Node API handlers | `api/v1/growth/{saas-growth-profiles, saas-growth-profiles/mode-eligibility, activation-definitions, activation-definitions/milestones, pql-scores, pql-scores/recalculate, upgrade-triggers, upgrade-triggers/activate, upgrade-triggers/events, in-app-campaigns, in-app-campaigns/activate, in-app-campaigns/deliveries, in-app-suppression-rules, experiments, experiments/guardrails, experiments/decisions, experiments/backlog, agents/readiness}.js` (17-18 files) | 218-06 | NO (legacy `api/*.js` route modules; no JSX, no rendering) |
| Cron handlers | `api/cron/growth-{profile-sync, pql-scorer, upgrade-trigger-monitor, inapp-campaign-dispatch, experiment-stale-monitor}.js` (5 files) | 218-06 | NO (cron routes; no JSX) |
| Preflight scripts | `scripts/preconditions/218-{01..06}-check-upstream.cjs` (6 files) | 218-01..218-06 | NO (Node CLI assertion runners) |
| F-ID contract YAMLs | `contracts/F-{238..246}-growth-*.yaml` (9 files) + `contracts/flow-registry.json` updates | 218-01..218-06 | NO |
| Test fixtures | `test/fixtures/growth-218/{index.js, saas-growth-profile.js, module-mode-eligibility.js, activation-definition.js, pql-score.js, upgrade-trigger.js, in-app-campaign.js, marketing-experiment.js, experiment-guardrail.js, plg-agent-readiness.js}` (10 files) | 218-01 | NO |
| Test files | `test/growth-218/{preflight, profile, activation, pql, upgrade-triggers, inapp, experiments, agents, api, cron, mcp, rls, closeout, openapi}/*.test.js` | 218-01..218-06 | NO |

**Search assertions** (verified during scope confirmation by direct
read of every `files_modified` block in 218-01..218-06):

| Assertion | Result |
|-----------|--------|
| `files_modified` glob `app/**` across 218-01..218-06 | 0 matches |
| `files_modified` glob `app/(markos)/**` across 218-01..218-06 | 0 matches |
| `files_modified` glob `app/(saas)/**` across 218-01..218-06 | 0 matches (P218 architecture-lock forbidden path) |
| `files_modified` glob `app/(growth)/**` across 218-01..218-06 | 0 matches (P218 architecture-lock forbidden path) |
| `files_modified` glob `app/(plg)/**` across 218-01..218-06 | 0 matches (P218 architecture-lock forbidden path) |
| `files_modified` glob `components/**` across 218-01..218-06 | 0 matches |
| `files_modified` glob `*.stories.tsx` across 218-01..218-06 | 0 matches |
| `files_modified` glob `stories/**` or `.storybook/**` across 218-01..218-06 | 0 matches |
| `files_modified` glob `*.module.css` or `*.css` across 218-01..218-06 | 0 matches |
| `files_modified` containing `page.tsx`, `layout.tsx`, or `route.tsx` | 0 matches |
| `files_modified` containing `route.ts` (218 architecture-lock forbidden string) | 0 matches |
| `files_modified` containing `*.scss`, `*.sass`, `tailwind.config.*`, `app/globals.css`, `app/tokens.css`, `styles/components.css` | 0 matches |

**Disambiguation note (legacy Node API path syntax):** The 17-18 files
under `api/v1/growth/*.js` and the 5 files under `api/cron/growth-*.js`
are flat versioned legacy `api/*.js` handlers per the 218 architecture-
lock pin (forbidden patterns include `route.ts`, `app/api/cron/.../route.ts`,
`app/(saas)/`, `app/(growth)/`, `app/(plg)/`). They emit JSON envelopes
only; the cron handlers ack with HTTP 200 and emit `markos_agent_runs`
events. Visual rendering of the PLG dashboard, PQL scoring viewer,
upgrade-trigger configuration wizard, InAppCampaign editor, suppression
rule browser, experiment registry browser, experiment guardrails editor,
activation-definition wizard, milestone funnel viewer, growth-mode
eligibility browser, growth profile editor, experiment decision log
viewer, 9 PLG agents readiness viewer is downstream phases'
responsibility (future P208 admin extensions for 4 new approval chips,
future P217-06 agents-page extension for 9 readiness rows, future P218
admin/tenant frontend phases for the 12 listed surfaces, future P219 /
P220 growth-mode-gated module surfaces).

**Disambiguation note (existing surfaces NOT modified by 218):** The
operator-cockpit surfaces shipped in P208 (`app/(markos)/operations/{tasks,
approvals, recovery, narrative}/page.tsx`) read 218 outputs as
downstream consumers via the P208 substrate. The P217-06 SaaS dashboard
tree (`app/saas/{layout, page, subscriptions, plans, revenue, revenue/
waterfall, churn, invoices, support, agents}/page.tsx`) reads 218
outputs but does NOT render new growth-specific UI in this phase. The
Approval Inbox filter chip set extends from 8 to 12 chips when 218
ships (`pql_hot_transition_review` + `upgrade_trigger_activate` +
`inapp_campaign_activate` + `experiment_activate`); the row rendering
for those four new handoff_kind literals is deferred to a future P208
admin extension. The 217-06 agents page extension for 9 P218 PLG
readiness rows is deferred to a future P217-06 admin extension. Phase
218 ships the substrate; the placeholder dissolutions on those existing
surfaces require future P208 / P217-06 extension phases. **218 itself
does not modify any P208, P212, P213.x, P214, P215, P216, or P217 file.**

**Conclusion:** No-UI-surface declaration **CONFIRMED**. This phase
is pure growth substrate authoring + contracts + Node API handlers +
migrations + MCP tools + CI scripts + tests + migration coordination
registry + 9-agent readiness seed. There are no visual decisions to
specify, no typography choices to lock, no copywriting copy to draft
for end-user surfaces, and no component primitives to compose. **If
the checker finds ANY UI surface in plan files_modified blocks,
BLOCK.**

---

## Design System

| Property | Value |
|----------|-------|
| Tool | not applicable — no UI surface authored in this phase |
| Preset | not applicable |
| Component library | not applicable |
| Icon library | not applicable |
| Heading font | not applicable |
| Body font | not applicable |
| Default theme | not applicable |
| Form authoring posture | not applicable — no forms (the legacy `api/*.js` POST handlers accept JSON request bodies; the only multipart paths are deferred to future InAppCampaign content authoring UIs and segment-targeting JSON editor surfaces) |
| Banner authoring posture | not applicable — no banners |
| Card authoring posture | not applicable — no cards |
| Money / pricing display posture | not applicable — money flows through `upgrade_triggers.recommended_plan_id` + `upgrade_triggers.pricing_recommendation_id` + `upgrade_triggers.pricing_context_sentinel` (5-clause defense; Pricing Engine context OR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel); rendering of monetary values is downstream phases' responsibility (future P218 admin upgrade-trigger configuration wizard renders via `<Money fromPricingRecommendation={pr_id} />` recipe per 215-UI-SPEC; sentinel persists on `upgrade_triggers.pricing_context_sentinel` until P205 Pricing Engine lands per CLAUDE.md Pricing Engine Canon). **Phase 218 MUST NOT take pricing ownership.** |
| Table authoring posture | not applicable — registry tables in F-ID contract YAMLs are doctrine prose only; the 60-row `module_mode_eligibility` seed is INSERT block in migration 101 (raw SQL DDL, not React tables); the 9-agent `plg_growth_agent_readiness` seed is INSERT ON CONFLICT block in migration 106 |
| Placeholder posture | `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel is accepted by the `pricing_context_sentinel = '{{MARKOS_PRICING_ENGINE_PENDING}}'` clause of the 5-clause `UPGRADE_TRIGGER_PRICING_REQUIRED` DB-trigger (218-03 migration 103) AND the 4-clause `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` DB-trigger (218-04 migration 104) per CLAUDE.md Pricing Engine Canon; appears verbatim in `test/growth-218/upgrade-triggers/pricing-sentinel-trigger.test.js` + `test/growth-218/inapp/approval-pricing-trigger.test.js`; `lib/markos/upgrade-triggers/triggers.ts` exports `PRICING_SENTINEL = '{{MARKOS_PRICING_ENGINE_PENDING}}'` constant; never rendered into a UI surface in this phase |
| API handler posture | `api/v1/growth/*.js` (17-18 files) are legacy Node `api/*.js` route modules. They emit JSON envelopes (paginated growth-profile lists, mode-eligibility browser payloads, paginated PQL score lists with explainable signals, upgrade-trigger config payloads, InAppCampaign config + delivery + suppression payloads, experiment registry + guardrails + decisions + ICE-ranked backlog payloads, 9 PLG agents readiness rows) and accept POST mutations gated by `requireHostedSupabaseAuth` + tenant-scoped supabase client. The cron handlers under `api/cron/growth-*.js` are gated by `x-markos-cron-secret` matching `MARKOS_GROWTH_CRON_SECRET` env per `api/cron/webhooks-dlq-purge.js` pattern; `crypto.timingSafeEqual` on token compare. They DO NOT render HTML, JSX, or any visual surface. Each cron handler is registered in dispatcher HANDLERS map (per P226 iter 2 lesson). |
| MCP tool posture | `lib/markos/mcp/tools/growth.cjs` registers 12 tool descriptors total (9 read-mostly + 3 write-gated) per RESEARCH §6 Domains 1-6 MCP tools sections: read-mostly (`get_saas_growth_profile`, `list_module_eligibility`, `get_activation_definition`, `get_pql_score`, `list_at_risk_pql_users`, `get_upgrade_trigger`, `list_in_app_campaigns`, `get_experiment`, `list_backlog_by_ice`); write-gated (`request_pql_recalculation`, `request_upgrade_trigger_activation`, `request_experiment_activation` — each routes through `buildApprovalPackage`). `request_*` MCP tools return approval-handoff metadata but DO NOT activate — they surface the approval requirement. MCP tools emit structured JSON; they do NOT render. |
| Doctrine prose posture | `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (CREATE) and the F-{238..246} contract YAMLs are markdown / YAML only; no rendered components inside. They are read by humans (auditor, planner, executor, P219 / P220 future planners) and parsed by CI scripts for forbidden-string and contract-baseline assertions. **Banned-lexicon enforcement applies to all doctrine prose** per CLAUDE.md "Banned lexicon" — zero-match required for `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener). No exclamation points in any doctrine surface. **InAppCampaign content output (`in_app_campaigns.content_jsonb` + `in_app_campaigns.prompt_copy` + `upgrade_triggers.prompt_copy`) is also banned-lexicon-checked BEFORE `external.send` mutation dispatches the content** — this mirrors the 216-03 support-response banned-lexicon pre-dispatch gate. The check runs in `lib/markos/inapp/campaigns.ts` `validateContentBeforeDispatch()` and `lib/markos/upgrade-triggers/triggers.ts` `validatePromptCopyBeforeDispatch()`; zero-match REQUIRED. |

---

## Spacing / Typography / Color

**Not applicable.** Phase 218 emits no CSS, no JSX, no terminal output
beyond `node --test` format from preflight CLI scripts (the Node API
handlers emit JSON envelopes, not rendered markup; the five crons
write to `markos_agent_runs` and structured logs only). Every spacing,
typography, and color decision is deferred to the downstream phases
that will surface this growth substrate. When those phases ship, they
MUST cite DESIGN.md v1.1.0 token canon directly:

| Token canon citation chain | DESIGN.md v1.1.0 source |
|----------------------------|--------------------------|
| `--space-{none,xxs,xs,sm,md,lg,xl,xxl}` | `spacing.{none,xxs,xs,sm,md,lg,xl,xxl}` (8px base, on-grid only — 0/2/8/16/24/32/48/96) |
| `--font-mono` (JetBrains Mono) for headings + IDs (`profile_id`, `definition_id`, `milestone_id`, `score_id`, `trigger_id`, `event_id`, `campaign_id`, `delivery_id`, `rule_id`, `experiment_id`, `guardrail_id`, `decision_id`, `agent_id`, `task_id`, `approval_id`, `agent_run_id`, `pricing_recommendation_id`, `evidence_refs`) + monetary code | `typography.h1..h4`, `typography.code-inline` |
| `--font-sans` (Inter) for body + lead + caption | `typography.body-md`, `typography.lead`, `typography.body-sm`, `typography.label-caps` |
| `--color-surface` (`#0A0E14` Kernel Black) page background; `--color-surface-raised` (`#1A1F2A` Process Gray) cards; `--color-surface-overlay` (`#242B38`) modals; `--color-border` (`#2D3441` Border Mist) hairlines; `--color-on-surface` (`#E6EDF3` Terminal White), `--color-on-surface-muted` (`#7B8DA6` Vault Slate), `--color-on-surface-subtle` (`#6B7785` Comment Gray) text; `--color-primary` (`#00D9A3` Protocol Mint) signal; `--color-primary-text` mint-as-text per D-09; `--color-primary-subtle` mint wash; `--color-error` (`#F85149`), `--color-warning` (`#FFB800`), `--color-success` (`#3FB950`), `--color-info` (`#58A6FF`) state colors | `colors.{surface,surface-raised,surface-overlay,border,on-surface,on-surface-muted,on-surface-subtle,primary,primary-text,primary-subtle,error,warning,success,info}` |
| `.c-card`, `.c-button{,--primary,--secondary,--tertiary,--destructive}`, `.c-input`, `.c-field{,__label,__help,__error}`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-modal`, `.c-backdrop`, `.c-status-dot{,--live,--error}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-code-inline`, `.c-code-block` primitives | `styles/components.css` v1.1.0 |
| `--focus-ring-width: 2px` solid `var(--color-primary)` with `--focus-ring-offset: 2px`, never suppressed | `app/tokens.css` lines per DESIGN.md "Focus" |
| `prefers-reduced-motion` collapses transitions to 0ms; kernel-pulse status dot freezes at full opacity | DESIGN.md "Motion" |

Future surfaces consuming 218 substrate MUST honor the **213.4
carry-forward decisions** verbatim (D-08 token-only, D-09
mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature`
reserved, D-14 no `.c-table`, D-15 selective extraction, D-21
server/client boundary). See the five UI binding contracts below for
load-bearing additions specific to 218 surfaces.

---

## 213.4 Carry-Forward Decisions (D-08..D-15) + 217 D-21

| Carry-forward decision | Future-surface enforcement for 218-consuming surfaces |
|-------------------------|------------------------------------------------------|
| **D-08** (token-only) | Every future 218 surface module CSS uses `var(--*)` tokens only — zero hex literals, zero hard-coded `font-size`/`font-weight`/`color`. Architecture-lock test asserts `grep -P '(?<![\w-])#[0-9a-fA-F]{3,8}\b' app/saas/{plg,inapp,experiments}/**/*.module.css` returns 0 in any 218-consuming surface. |
| **D-09** (mint-as-text) | `[ok]` glyph color, action-link inline CTAs ("Activate trigger →", "Activate campaign →", "Activate experiment →", "Recalculate PQL score →", "Open Approval Inbox →", "View frequency-cap preview →", "View ICE-ranked backlog →", "View 5-field activation checklist →"), and `.c-chip-protocol` IDs (`profile_id`, `definition_id`, `milestone_id`, `score_id`, `trigger_id`, `event_id`, `campaign_id`, `delivery_id`, `rule_id`, `experiment_id`, `guardrail_id`, `decision_id`, `agent_id`, `task_id`, `approval_id`, `agent_run_id`, `pricing_recommendation_id`, `evidence_refs`, `artifact_performance_log_id`, `literacy_update_candidate_id`, `tenant_overlay_candidate_id`) use `--color-primary-text`. **Never as fill on surfaces larger than a button or chip** (DESIGN.md mint rule). |
| **D-09b** (`.c-notice` mandatory) | Every gating state in future 218 surfaces (mode-not-set, mode-not-eligible-for-module, definition-pending-approval, pql-not-ready, pql-warming, pql-pql, pql-hot-pql-pending-review, upgrade-trigger-pricing-pending, upgrade-trigger-pending-approval, inapp-campaign-pending-approval, inapp-campaign-frequency-cap-warning, inapp-suppression-active, inapp-cs-active-override, inapp-quiet-hours-active, experiment-missing-guardrails, experiment-missing-owner, experiment-missing-decision-criteria, experiment-missing-learning-handoff, experiment-pending-approval, agent-not-runnable, sentinel-active, future_phase_218_admin_ui-placeholder, future_phase_218_tenant_ui-placeholder, future_phase_218_approval_inbox_extensions-placeholder, future_phase_218_agents_page_extension-placeholder, future_phase_219_partner_console-placeholder, future_phase_220_referral_console-placeholder) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes. |
| **D-13** (`.c-card--feature` reserved) | **Forbidden in any 218-consuming surface.** PLG dashboard rows, PQL score rows, upgrade-trigger config rows, InAppCampaign rows, suppression rule rows, experiment rows, guardrail rows, decision log rows, agent readiness rows ALL use `.c-card` default. The `.c-card--feature` variant remains reserved for hero panels in 404-workspace + 213.5 marketing only. |
| **D-14** (no `.c-table` primitive) | Future 218 PLG dashboard list, PQL score list, upgrade-trigger list, InAppCampaign list, suppression rule list, experiment list, ICE-ranked backlog list, decision log list, agent readiness list ALL use vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred. |
| **D-15** (selective extraction) | Future 218-consuming components extract to `components/markos/tenant/` or `components/markos/admin/` only when reuse is proven across ≥2 surfaces. Recommended extracted components (when downstream phases ship): `<GrowthModeBadge />` (reused by growth profile editor + module eligibility browser + Morning Brief + nav), `<PqlScoreBadge />` (reused by PQL viewer + Approval Inbox row + Task Board row + at-risk users list), `<PqlSignalChipRow />` (reused by PQL viewer + hot-transition approval modal + KB review modal), `<UpgradeTriggerStatusBadge />` (reused by upgrade-trigger list + activation approval modal + cron event log), `<PricingDefenseStatusBadge />` (reused by upgrade-trigger config + InAppCampaign config + Approval Inbox row), `<InAppFormatBadge />` (reused by InAppCampaign list + activation modal + delivery log), `<SuppressionRuleBadge />` (reused by InAppCampaign config + suppression browser + delivery log + Approval Inbox row), `<FrequencyCapPreview />` (reused by InAppCampaign editor + activation approval modal — visualizes cooldown_days + max_shows_per_user overlap), `<ExperimentStatusBadge />` (reused by experiment list + activation approval modal + decision log), `<IceScoreChip />` (reused by experiment list + ICE-ranked backlog + Approval Inbox row), `<GuardrailDirectionBadge />` (reused by experiment guardrails editor + activation approval modal), `<ActivationConstraintChecklist />` (reused by experiment activation modal + experiment list — renders 5-field constraint with each field as `[ok]` or `[block]`), `<PlgAgentReadinessBadge />` (reused by 217-06 agents page + per-agent detail view + Morning Brief). |
| **D-21** (server/client boundary; 217 carry) | Every future 218 admin / tenant surface MUST be a default server component reading via `requireHostedSupabaseAuth(request)` + tenant-scoped supabase client (per 217-06 D-21 contract). Client components opt in via `'use client'` only for interactive primitives — `<FrequencyCapPreview />` (slider scrubbing the cooldown_days + max_shows_per_user values), `<IceScoreScrubber />` (interactive scrubber on `ice_impact * ice_confidence * ice_ease` GENERATED preview), `<SegmentTargetingEditor />` (JSON editor on `target_segment_jsonb`), `<PqlSignalThresholdConfigurator />` (operator threshold tuning UI). Architecture-lock test asserts no `'use client'` in any non-listed file under `app/saas/{plg,inapp,experiments}/`. |

---

## Future-Surface UI Binding Contract 1: PQL Score

**Load-bearing for future P218 admin/tenant frontend phases that surface
PQL scoring.** Every future surface that renders a PQL score
(`pql_scores` row from 218-02 migration 102) MUST honor this binding
contract verbatim.

### Score-Dimension Rendering

PQL is computed from 3 explainable signal dimensions per RESEARCH §6
Domain 2 (canon source: `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`
line 237):

| Dimension | Signals (column names verbatim) | Future-surface render contract |
|-----------|----------------------------------|--------------------------------|
| **Usage** (highest weight) | `hit_usage_limit` (bool) + `high_frequency_user` (bool) + `feature_breadth_pct` (numeric 0-1) + `daily_active_days_7` (int) + `usage_pct` (numeric 0-1) + `feature_adoption_score` (numeric 0-100) | Each true / non-zero signal renders as `<.c-badge c-badge--info>` row with verbatim signal name + `[ok]` glyph; each false / zero signal as `<.c-badge>` muted variant + `[—]` glyph. Numeric signals render with bracketed value (e.g., `[feature_breadth_pct: 0.45]`). |
| **Intent** (medium weight) | `visited_pricing_page` (bool) + `visited_upgrade_page` (bool) + `clicked_upgrade_cta` (bool) + `requested_demo` (bool) + `viewed_pricing_compare` (bool) | Each true signal renders as `<.c-badge c-badge--success>` row with verbatim signal name + `[ok]` glyph; each false as `<.c-badge>` muted variant + `[—]` glyph. |
| **Fit** (contextual weight) | `company_size_match` (bool) + `industry_match` (bool) + `role_match` (bool) + `geo_match` (bool) | Each true signal renders as `<.c-badge c-badge--info>` row with verbatim signal name + `[ok]` glyph. |

### `pql_status` ENUM Binding

The `pql_status` column has exactly 4 values (canon: `lib/markos/pql/contracts.ts`
`PQL_STATUSES = ['not_ready','warming','pql','hot_pql'] as const`). Each
value MUST render as `<.c-badge>` with the exact mapping below — never
substitute, never reorder, never localize:

| `pql_status` | Badge variant | Bracketed glyph | Future copy |
|--------------|---------------|-----------------|-------------|
| `not_ready` | `<.c-badge>` muted | `[—]` | `[—] Not ready (score < 30)` |
| `warming` | `<.c-badge--info>` | `[info]` | `[info] Warming (score 30-59)` |
| `pql` | `<.c-badge--success>` | `[ok]` | `[ok] PQL (score 60-79)` |
| `hot_pql` | `<.c-badge--warning>` | `[warn]` | `[warn] Hot PQL (score 80-100) — review required` |

### `recommended_action` ENUM Binding

The `recommended_action` column has exactly 6 values (canon: `lib/markos/pql/
contracts.ts` `PQL_RECOMMENDED_ACTIONS = ['in_app_upgrade_prompt',
'targeted_email_sequence','sales_outreach','self_serve_offer',
'feature_unlock','continue_monitoring'] as const`). Each value MUST
render as `<.c-chip>` with the exact mapping below:

| `recommended_action` | Chip variant | Future copy |
|----------------------|--------------|-------------|
| `in_app_upgrade_prompt` | `<.c-chip>` | `In-app upgrade prompt` |
| `targeted_email_sequence` | `<.c-chip>` | `Targeted email sequence` |
| `sales_outreach` | `<.c-chip>` | `Sales outreach` |
| `self_serve_offer` | `<.c-chip>` | `Self-serve offer` |
| `feature_unlock` | `<.c-chip>` | `Feature unlock` |
| `continue_monitoring` | `<.c-chip>` muted | `Continue monitoring` |

### Hot-Transition Approval Inbox Binding

When `pql_status` transitions to `hot_pql` AND no prior `hot_pql` row
exists for the same `account_id` within 30 days, 218-02 scorer creates
an approval row routed through P208 Approval Inbox via `handoff_kind =
'pql_hot_transition_review'` (8th literal in canonical chain). The
future P208 admin extension renders this row with:

- `<.c-chip-protocol>` for `score_id` + `account_id` + `user_id`
- `<.c-badge--warning>` `[warn] Hot PQL` from the status mapping above
- `<.c-chip>` row with each of 5 explainable signal columns rendered per the score-dimension table
- `<.c-chip>` for `recommended_action` from the action mapping above
- `<.c-button c-button--primary>` "Approve and route to in-app upgrade prompt →" (mint-as-text per D-09; bracketed `→` glyph)
- `<.c-button c-button--secondary>` "Defer to email sequence"
- `<.c-button c-button--tertiary>` "Reject (score appears spurious)"

### Evidence-Trigger Defense Surface Binding

When the `PQL_SCORE_REQUIRES_EVIDENCE` DB-trigger raises EXCEPTION
(`pql_status IN ('pql','hot_pql')` AND ALL 5 signals false), the
future surface MUST render `<.c-notice c-notice--error>` with verbatim
copy: `[err] PQL score blocked: pql_status='{pql_status}' requires at
least one explainable signal. Signal columns checked:
hit_usage_limit, high_frequency_user, feature_breadth_pct (≥ 0.3),
visited_pricing_page, visited_upgrade_page. All currently false.`
The future surface MUST NOT bypass this check on the client side; the
DB-trigger is the source of truth.

---

## Future-Surface UI Binding Contract 2: Upgrade Trigger

**Load-bearing for future P218 admin frontend phases that surface
upgrade-trigger configuration and activation.** Every future surface
that renders an UpgradeTrigger (`upgrade_triggers` row from 218-03
migration 103) MUST honor this binding contract verbatim.

### `status` ENUM Binding (4 values)

The `upgrade_triggers.status` column has exactly 4 values (canon:
`lib/markos/upgrade-triggers/contracts.ts` `UPGRADE_TRIGGER_STATUSES =
['active','paused','draft','archived']`). Each value MUST render as
`<.c-badge>` with the exact mapping below:

| `status` | Badge variant | Bracketed glyph | Future copy |
|----------|---------------|-----------------|-------------|
| `draft` | `<.c-badge>` muted | `[—]` | `[—] Draft` |
| `paused` | `<.c-badge--info>` | `[info]` | `[info] Paused` |
| `active` | `<.c-badge--success>` | `[ok]` | `[ok] Active` |
| `archived` | `<.c-badge>` muted | `[—]` | `[—] Archived` |

### 5-Clause Pricing Defense Surface Binding

The `UPGRADE_TRIGGER_PRICING_REQUIRED` DB-trigger blocks `status='active'`
transition unless ALL of the following resolve TRUE on the row:

1. `pricing_recommendation_id NOT NULL` **OR** `pricing_context_sentinel
   = '{{MARKOS_PRICING_ENGINE_PENDING}}'` (Pricing Engine substitution
   discipline per 215-UI-SPEC sentinel inheritance)
2. `approved_at NOT NULL` (single_approval gate per 206 mutation-class
   `billing.charge` `default_approval_mode`)

The future upgrade-trigger configuration wizard MUST visually surface
the 5-clause defense state on every row:

| 5-clause status | Notice variant | Verbatim copy |
|-----------------|----------------|---------------|
| `pricing_recommendation_id` populated AND `approved_at` populated | `<.c-notice c-notice--success>` | `[ok] Pricing recommendation linked. Activation approved on {approved_at}. Trigger may be activated.` |
| `pricing_context_sentinel = '{{MARKOS_PRICING_ENGINE_PENDING}}'` AND `approved_at` populated | `<.c-notice c-notice--warning>` | `[warn] Pricing Engine sentinel active ({{MARKOS_PRICING_ENGINE_PENDING}}). Activation approved on {approved_at}. Trigger may be activated; review pricing copy when P205 lands.` |
| `pricing_recommendation_id` populated AND `approved_at IS NULL` | `<.c-notice c-notice--warning>` | `[warn] Pricing recommendation linked. Activation approval still required. → Open Approval Inbox` |
| `pricing_recommendation_id IS NULL` AND `pricing_context_sentinel != '{{MARKOS_PRICING_ENGINE_PENDING}}'` AND `approved_at IS NULL` | `<.c-notice c-notice--error>` | `[err] Pricing not linked, sentinel not set, activation not approved. Trigger cannot be activated. Link a Pricing Engine recommendation OR set sentinel to `{{MARKOS_PRICING_ENGINE_PENDING}}` AND request activation approval.` |
| Other combinations (mixed) | `<.c-notice c-notice--warning>` | Render which clauses are missing as a `<.c-chip>` row with each missing clause as `[block] {clause}`. |

### Activation CTA Disabling Contract

The future surface activation CTA `<.c-button c-button--primary>`
"Activate trigger →" MUST be `disabled` (not just visually muted; HTML
`disabled` attribute) when ANY of the 5-clause checks fails. Clicking
the disabled state MUST surface a `<.c-notice c-notice--info>` with the
verbatim copy from the row above. Architecture-lock test asserts
`grep -E 'aria-disabled="true"' app/saas/plg/upgrade-triggers/**/*.tsx`
matches the count of disabled-state nodes.

### `trigger_type` ENUM Binding (7 values)

The `upgrade_triggers.trigger_type` column has exactly 7 values (canon:
`lib/markos/upgrade-triggers/contracts.ts` `UPGRADE_TRIGGER_TYPES = 7
values`). Render as `<.c-chip>` with verbatim type literal (no
localization). The 7 values per RESEARCH §6 Domain 3:
`hard_limit_reached`, `soft_limit_warning`, `value_recognition_moment`,
`pricing_page_visit`, `competitor_signal`, `upgrade_page_visit`,
`feature_attempt_blocked`.

### `prompt_format` ENUM Binding (6 values)

The `upgrade_triggers.prompt_format` column has exactly 6 values:
`tooltip`, `banner`, `modal`, `toast`, `inline_card`, `interstitial`.
Render as `<.c-chip>` with verbatim literal. The future configuration
wizard previews each format using the existing primitive (`.c-modal`,
`.c-toast--info`, `.c-notice c-notice--info` for banner, `.c-card` for
inline_card; tooltip + interstitial render in deferred recipes).

### Approval Inbox Binding

When `requestActivation` calls `buildApprovalPackage` with `kind =
'upgrade_trigger_activate'`, P208 Approval Inbox renders a row with:

- `<.c-chip-protocol>` for `trigger_id` + `tenant_id` + `pricing_recommendation_id` (or sentinel chip)
- `<UpgradeTriggerStatusBadge />` from the `status` mapping above
- `<PricingDefenseStatusBadge />` rendering the 5-clause status
- `<.c-chip>` for `trigger_type` + `prompt_format`
- `<.c-code-block>` for `prompt_copy` (banned-lexicon-checked before render; see Banned-Lexicon Enforcement section)
- `<.c-button c-button--primary>` "Approve activation →"
- `<.c-button c-button--tertiary>` "Reject (request changes)"

### Banned-Lexicon Enforcement Surface Binding

The `prompt_copy` field is banned-lexicon-checked by
`lib/markos/upgrade-triggers/triggers.ts` `validatePromptCopyBeforeDispatch()`
BEFORE the cron handler `growth-upgrade-trigger-monitor.js` fires the
trigger. The future approval modal MUST render banned-lexicon match
results as `<.c-notice c-notice--error>` with verbatim copy:
`[err] Prompt copy contains banned phrase: '{phrase}'. Edit copy to
remove. Banned phrases: synergy, leverage, empower, unlock, transform,
revolutionize, supercharge, holistic, seamless, cutting-edge,
innovative, game-changer, next-generation, world-class, best-in-class,
reimagine, disrupt, just (as softener). No exclamation points.`
Activation CTA MUST be disabled when banned-lexicon match count > 0.

---

## Future-Surface UI Binding Contract 3: InApp Campaign

**Load-bearing for future P218 tenant frontend phases that surface
InApp campaign authoring, activation, and dispatch.** Every future
surface that renders an InAppCampaign (`in_app_campaigns` row from
218-04 migration 104) MUST honor this binding contract verbatim.

### `status` ENUM Binding (5 values)

The `in_app_campaigns.status` column has exactly 5 values (canon:
`lib/markos/inapp/contracts.ts` `INAPP_STATUSES = 5 values`). Render as
`<.c-badge>` with verbatim literal: `draft`, `pending_approval`,
`active`, `paused`, `archived`.

### `format` ENUM Binding (7 values)

The `in_app_campaigns.format` column has exactly 7 values (canon:
`lib/markos/inapp/contracts.ts` `INAPP_FORMATS = 7 values`). Render as
`<.c-chip>` with verbatim literal:

| `format` | Future preview primitive |
|----------|--------------------------|
| `tooltip` | Deferred recipe (positioned on anchor element) |
| `banner` | `<.c-notice c-notice--info>` |
| `modal` | `<.c-modal>` + `<.c-backdrop>` |
| `toast` | `<.c-toast--info>` |
| `inline_card` | `<.c-card>` (default; never `<.c-card--feature>` per D-13) |
| `checklist` | `<.c-card>` with `<.c-chip>` row per checklist item |
| `spotlight` | Deferred recipe (overlay highlighting target element) |

### `primary_goal` ENUM Binding (7 values; pricing-gating)

The `in_app_campaigns.primary_goal` column has exactly 7 values (canon:
`lib/markos/inapp/contracts.ts` `INAPP_PRIMARY_GOALS = 7 values`):
`activation`, `feature_adoption`, `upgrade_prompt`, `retention`,
`re_engagement`, `upsell`, `onboarding`. Render as `<.c-chip>` with
verbatim literal.

**Pricing gating:** Goals `upgrade_prompt` AND `upsell` REQUIRE
`pricing_recommendation_id NOT NULL` OR `pricing_context_sentinel =
'{{MARKOS_PRICING_ENGINE_PENDING}}'` per the
`INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` DB-trigger. Goals
`activation`, `feature_adoption`, `retention`, `re_engagement`,
`onboarding` are NOT gated by pricing. The future editor surface
renders pricing-required goals with a `<.c-chip c-chip--mint>` (mint
text-only per D-09) "Pricing-gated" indicator chip; non-pricing-gated
goals render as plain `<.c-chip>`.

### Frequency-Cap Preview Binding

The `in_app_campaigns.max_shows_per_user` (default 3) and
`cooldown_days` (default 14) columns drive the
`INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK` DB-trigger. The future editor
ships `<FrequencyCapPreview />` (D-15 extracted; `'use client'` per
D-21) which renders:

- `<.c-card>` with two-column layout: left column shows current
  `max_shows_per_user` + `cooldown_days` values; right column shows
  delivery timeline visualization
- `<input type="range">` styled with `.c-input` for `max_shows_per_user`
  (1-10) and `cooldown_days` (0-30)
- Visualization timeline renders 30 days of `[ok]` glyphs (eligible
  delivery slots) and `[block]` glyphs (cooldown-blocked slots) based
  on the current values
- Overlap warning: when slider values would create >70% blocked-slot
  ratio, render `<.c-notice c-notice--warning>` with verbatim copy:
  `[warn] Frequency cap may suppress over 70% of delivery attempts in
  any 30-day window. Reduce max_shows_per_user or cooldown_days, or
  expand target_segment_jsonb to dilute per-user load.`
- `<.c-status-dot c-status-dot--live>` on the live preview frame

### 6 Suppression Rule Types Binding

The `in_app_suppression_rules.rule_type` column has exactly 6 values
(canon: `lib/markos/inapp/contracts.ts` `INAPP_SUPPRESSION_RULE_TYPES`).
The future InAppCampaign editor renders an active-suppression-overlay
row showing each rule_type as `<.c-badge--info>` indicator:

| `rule_type` | Badge variant | Bracketed glyph | Future copy when active |
|-------------|---------------|-----------------|-------------------------|
| `user_level` | `<.c-badge--info>` | `[block]` | `[block] User-level suppression — user opted out` |
| `account_level` | `<.c-badge--info>` | `[block]` | `[block] Account-level suppression — account paused` |
| `campaign_level` | `<.c-badge--info>` | `[block]` | `[block] Campaign-level suppression — campaign paused` |
| `global_quiet_hours` | `<.c-badge--info>` | `[—]` | `[—] Global quiet hours — outside business hours` |
| `cs_active_override` | `<.c-badge--warning>` | `[warn]` | `[warn] CS active — open ticket; in-app dispatch suspended` |
| `email_coordination_window` | `<.c-badge--warning>` | `[warn]` | `[warn] Recent email send (within suppress_if_email_sent_days window)` |

The `cs_active_override` and `email_coordination_window` rule types
render with `--warning` color band per D-09b mandatory `.c-notice`
discipline. The future editor MUST render an active-suppression count
chip when any rules are active: `<.c-chip>` with verbatim copy
`{N}/6 suppression rules active`.

### Activation Approval Inbox Binding

When `requestActivation` calls `buildApprovalPackage` with `kind =
'inapp_campaign_activate'` (10th literal), P208 Approval Inbox renders
a row with:

- `<.c-chip-protocol>` for `campaign_id` + `tenant_id` + `pricing_recommendation_id` (or sentinel chip when sentinel active)
- `<.c-badge>` from `status` mapping
- `<.c-chip>` for `format` + `primary_goal` (with pricing-gated indicator if applicable)
- `<FrequencyCapPreview />` (read-only preview rendering)
- `<SuppressionRuleBadge />` row showing 6 rule_types with active indicators
- `<.c-code-block>` for `content_jsonb` (banned-lexicon-checked)
- `<.c-button c-button--primary>` "Approve activation →"
- `<.c-button c-button--tertiary>` "Reject (request changes)"

### Banned-Lexicon Enforcement Surface Binding

The `content_jsonb` field is banned-lexicon-checked by
`lib/markos/inapp/campaigns.ts` `validateContentBeforeDispatch()`
BEFORE the cron handler `growth-inapp-campaign-dispatch.js` enqueues
delivery. Same enforcement contract as Upgrade Trigger Banned-Lexicon
Enforcement Surface Binding above. Activation CTA MUST be disabled when
banned-lexicon match count > 0.

---

## Future-Surface UI Binding Contract 4: Marketing Experiment

**Load-bearing for future P218 tenant frontend phases that surface
experiment registry, ICE-ranked backlog, guardrails editing, and
decision recording.** Every future surface that renders a
MarketingExperiment (`marketing_experiments` row from 218-05 migration
105) MUST honor this binding contract verbatim.

### `status` ENUM Binding (6 values)

The `marketing_experiments.status` column has exactly 6 values (canon:
`lib/markos/experiments/contracts.ts` `EXPERIMENT_STATUSES = 6 values`).
Render as `<.c-badge>` with verbatim literal:

| `status` | Badge variant | Bracketed glyph | Future copy |
|----------|---------------|-----------------|-------------|
| `backlog` | `<.c-badge>` muted | `[—]` | `[—] Backlog` |
| `designed` | `<.c-badge--info>` | `[info]` | `[info] Designed` |
| `pending_approval` | `<.c-badge--warning>` | `[warn]` | `[warn] Pending approval` |
| `running` | `<.c-badge--success>` | `[ok]` | `[ok] Running` |
| `concluded` | `<.c-badge--info>` | `[info]` | `[info] Concluded` |
| `abandoned` | `<.c-badge>` muted | `[—]` | `[—] Abandoned` |

### `experiment_type` ENUM Binding (4 values)

The `marketing_experiments.experiment_type` column has exactly 4
values: `ab_test`, `multivariate`, `holdout`, `bandit`. Render as
`<.c-chip>` with verbatim literal.

### 5-Field Activation Constraint Surface Binding

The `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING`
DB-trigger blocks `status='running'` transition unless ALL 5 fields
resolve TRUE on the row (CONTEXT.md non-negotiable verbatim):

1. `owner_id NOT NULL`
2. `decision_criteria` non-empty
3. `learning_handoff` non-empty
4. `count(experiment_guardrails WHERE experiment_id=NEW.experiment_id) >= 1`
5. `approved_at NOT NULL`

The future experiment activation modal MUST render
`<ActivationConstraintChecklist />` (D-15 extracted) showing each of
the 5 fields as a row:

| Field | Pass state | Fail state |
|-------|-----------|------------|
| Owner assigned | `[ok] Owner: {owner_id}` (mint-as-text per D-09) | `[block] Owner not assigned — assign owner before activation` (red `--color-error`) |
| Decision criteria | `[ok] Decision criteria documented` | `[block] Decision criteria empty — document criteria before activation` |
| Learning handoff | `[ok] Learning handoff documented` | `[block] Learning handoff empty — document handoff before activation` |
| At least 1 guardrail | `[ok] {N} guardrail(s) configured` | `[block] No guardrails configured — add at least one guardrail before activation` |
| Approval | `[ok] Activation approved on {approved_at}` | `[block] Activation approval pending — request approval before activation` |

The activation CTA `<.c-button c-button--primary>` "Activate experiment
→" MUST be `disabled` when ANY of the 5 fields fails. Architecture-lock
test asserts the 5-row checklist renders even when all 5 pass (so
operators always see the discipline contract).

### ICE Score Rendering

The `marketing_experiments.ice_score` column is `GENERATED ALWAYS AS
(ice_impact * ice_confidence * ice_ease) STORED` with `ice_impact`,
`ice_confidence`, `ice_ease` each `int CHECK 1-10`. Score range:
1-1000.

The future ICE-ranked backlog surface renders ICE score as
`<.c-chip-protocol>` (mint-as-text per D-09) with verbatim format:
`ICE {ice_score} ({ice_impact} × {ice_confidence} × {ice_ease})`. The
backlog list orders by `ice_score DESC NULLS LAST`. Each row also
renders `<IceScoreChip />` (D-15 extracted).

The `<IceScoreScrubber />` (D-15 extracted; `'use client'` per D-21)
allows operators to interactively adjust the 3 inputs while previewing
the resulting score; the scrubber MUST display the GENERATED column
preview (DB-side computed; client just renders the math) and disable
direct `ice_score` editing per the GENERATED column constraint (test:
`test/growth-218/experiments/ice-score-computed.test.js` asserts direct
SET is silently overridden).

### Surface ENUM Binding (13 values)

The `marketing_experiments.surface` column has exactly 13 values
(canon: `lib/markos/experiments/contracts.ts` `EXPERIMENT_SURFACES =
13 values`). Render as `<.c-chip>` with verbatim literal. Examples:
`marketing_site_landing`, `pricing_page`, `signup_flow`, `onboarding`,
`activation`, `in_app_prompt`, `email`, `pql_scoring`, `upgrade_trigger`,
`save_offer`, `support_response`, `feature_announcement`, `community`.

### Guardrail Direction Binding

The `experiment_guardrails.direction` column has exactly 2 values
(`must_not_decrease`, `must_not_increase`). Render as
`<GuardrailDirectionBadge />` (D-15 extracted) with verbatim copy:

| `direction` | Badge variant | Verbatim copy |
|-------------|---------------|---------------|
| `must_not_decrease` | `<.c-badge--success>` | `[ok] Must not decrease — guardrail blocks rollout if metric decreases past threshold` |
| `must_not_increase` | `<.c-badge--success>` | `[ok] Must not increase — guardrail blocks rollout if metric increases past threshold` |

### Decision ENUM Binding (4 values)

The `experiment_decisions.decision` column has exactly 4 values
(canon: `lib/markos/experiments/contracts.ts` `EXPERIMENT_DECISIONS =
['rollout','reject','extend','redesign']`). Render as `<.c-chip>` with
verbatim literal. Each decision routes to LRN substrate per
`lib/markos/experiments/lrn-bridge.ts`:

| `decision` | LRN-bridge action | Future surface signal |
|------------|-------------------|----------------------|
| `rollout` | INSERT `artifact_performance_logs` row (LRN-02) IF P212 substrate present | `<.c-chip-protocol>` linking `artifact_performance_log_id` |
| `reject` | No LRN write (decision recorded only) | `<.c-chip>` muted |
| `extend` | No LRN write (decision recorded only) | `<.c-chip c-chip--info>` |
| `redesign` | INSERT `literacy_update_candidates` row (LRN-05) IF learning non-empty AND P212 substrate present | `<.c-chip-protocol>` linking `literacy_update_candidate_id` |

LRN-bridge SOFT degradation: when P212 tables absent, `lrn-bridge.ts`
catches `relation does not exist` and logs warning; the future surface
renders `<.c-notice c-notice--info>` with verbatim copy: `[info] LRN
substrate not yet present — decision recorded; learning artifact
deferred until P212 ships.`

### Activation Approval Inbox Binding

When `requestActivation` calls `buildApprovalPackage` with `kind =
'experiment_activate'` (11th literal), P208 Approval Inbox renders a
row with:

- `<.c-chip-protocol>` for `experiment_id` + `tenant_id` + `owner_id`
- `<ExperimentStatusBadge />` from `status` mapping
- `<IceScoreChip />` from ICE rendering
- `<.c-chip>` for `experiment_type` + `surface`
- `<ActivationConstraintChecklist />` rendering 5-field constraint
- `<GuardrailDirectionBadge />` row showing N guardrails with directions
- `<.c-code-block>` for `hypothesis` + `decision_criteria` + `learning_handoff`
- `<.c-button c-button--primary>` "Approve activation →"
- `<.c-button c-button--tertiary>` "Reject (request changes)"

---

## Future-Surface UI Binding Contract 5: 9 PLG Agents Readiness

**Load-bearing for the future P217-06 `app/saas/agents/page.tsx` admin
extension that surfaces the 9 P218 PLG / IAM / XP agents.** Every
future surface that renders a `plg_growth_agent_readiness` row from
218-06 migration 106 MUST honor this binding contract verbatim.

### Agent Identity Binding

The `plg_growth_agent_readiness.agent_id` column carries one of exactly
9 verbatim literals (canon: 218-06 migration 106 `INSERT ON CONFLICT`
seed):

| `agent_id` | `agent_tier` | `agent_name` | `blocking_phase` (default `'P218-06'` unless noted) |
|------------|--------------|--------------|------------------------------------------------------|
| `MARKOS-AGT-PLG-01` | `PLG` | Activation Definition Agent | `P218-06` |
| `MARKOS-AGT-PLG-02` | `PLG` | PQL Scoring Agent | `P218-06` |
| `MARKOS-AGT-PLG-03` | `PLG` | Upgrade Trigger Agent | `P218-06` |
| `MARKOS-AGT-PLG-04` | `PLG` | Milestone Funnel Agent | `P218-06` |
| `MARKOS-AGT-PLG-05` | `PLG` | Mode Eligibility Agent | `P218-06` |
| `MARKOS-AGT-PLG-06` | `PLG` | Viral Loop Designer | **`P220-confirm`** (per Q-8 cross-phase coordination — P220 confirms viral-loop substrate before this agent can flip readiness flags) |
| `MARKOS-AGT-IAM-01` | `IAM` | InApp Campaign Agent | `P218-06` |
| `MARKOS-AGT-XP-01` | `XP` | Experiment Registry Agent | `P218-06` |
| `MARKOS-AGT-XP-02` | `XP` | Experiment Decision Agent | `P218-06` |

Each agent renders on the future 217-06 agents page extension as a
`<.c-card>` row (default; never `<.c-card--feature>` per D-13). Future
copy: `<.c-chip-protocol>` for `agent_id`; `<.c-badge>` for `agent_tier`
(`PLG` / `IAM` / `XP`); body text for `agent_name`. PLG-06 renders an
additional `<.c-notice c-notice--warning>` row with verbatim copy:
`[warn] Blocked on P220 confirmation — viral-loop substrate must land
before this agent can flip readiness flags.`

### `agent_tier` ENUM Binding

The `agent_tier` column has exactly 3 values: `PLG`, `IAM`, `XP`
(canon: `lib/markos/growth-agents/contracts.ts` `PLG_AGENT_TIERS`).
Render as `<.c-badge>` with verbatim literal:

| `agent_tier` | Badge variant | Verbatim copy |
|--------------|---------------|---------------|
| `PLG` | `<.c-badge--info>` | `PLG` |
| `IAM` | `<.c-badge--info>` | `IAM` |
| `XP` | `<.c-badge--info>` | `XP` |

### 8-Boolean Readiness Checklist Surface Binding

Each agent has 8 readiness boolean columns gated by SG-10 invariant:

1. `contracts_assigned`
2. `cost_estimated`
3. `approval_posture_defined`
4. `tests_implemented`
5. `api_surface_defined`
6. `mcp_surface_defined`
7. `ui_surface_defined`
8. `failure_behavior_defined`

The `runnable` column is `GENERATED ALWAYS AS (contracts_assigned AND
cost_estimated AND approval_posture_defined AND tests_implemented AND
api_surface_defined AND mcp_surface_defined AND ui_surface_defined AND
failure_behavior_defined) STORED` — cannot be set directly per
`test/growth-218/agents/registry-non-runnable.test.js`.

The future surface MUST render the 8-boolean checklist as a `<.c-chip>`
row per agent with each boolean's state:

| Boolean state | Chip rendering | Bracketed glyph |
|---------------|----------------|-----------------|
| `true` | `<.c-chip c-chip--mint>` mint-as-text per D-09 | `[ok] {column_name}` |
| `false` | `<.c-chip>` muted | `[block] {column_name}` |

Field rendering must be EXACTLY 8 chips per agent — never collapse,
never reorder (the test `readiness-progression.test.js` asserts
deterministic field order).

### `runnable` GENERATED Column Surface Binding

The `runnable` column drives the agent's runnability status:

| `runnable` | Badge variant | Bracketed glyph | Future copy |
|------------|---------------|-----------------|-------------|
| `false` | `<.c-badge--error>` | `[block]` | `[block] Agent not yet runnable` |
| `true` | `<.c-badge--success>` | `[ok]` | `[ok] Agent ready` |

The future agents-page extension (217-06 surface extension) MUST render
this badge prominently per agent row. Operators MUST be able to scan
"which agents are blocked from running and why" without expanding any
detail panel.

### Activation Gate DB-Trigger Surface Binding

The `AGENT_ACTIVATION_REQUIRES_READINESS` DB-trigger blocks any
readiness-flag flip to `true` unless `activation_approval_id IS NOT
NULL`. The future surface MUST render flag-flip CTAs as
`<.c-button c-button--secondary>` "Mark `{column_name}` complete" with
the following discipline:

- CTA disabled when `activation_approval_id IS NULL`; clicking the
  disabled state surfaces `<.c-notice c-notice--warning>` with verbatim
  copy: `[warn] Operator approval required to flip readiness flag.
  Request activation approval first. → Open Approval Inbox`
- CTA enabled when `activation_approval_id IS NOT NULL`; clicking
  POSTs to `api/v1/growth/agents/readiness.js` with the boolean column
  name + value + evidence_ref payload
- Per Plan 06 closeout, this CTA path is for `autonomous=false`
  `checkpoint:human-action` first-run agent activation — operator
  validates first-batch readiness criteria before unattended cron
  permits agent activation flips per RESEARCH §6 Domain 6 Manual-Only
  Verifications

### Per-Agent Detail View Binding

When an operator clicks an agent row, the future surface opens a
`<.c-modal>` with:

- `<.c-chip-protocol>` for `agent_id` + `agent_tier` chip + `runnable` badge
- 8-boolean readiness chip row from the checklist surface binding above
- `<.c-code-block>` for `notes` field
- `<.c-chip-protocol>` for `activation_approval_id` (when present) + `readiness_check_id`
- `<.c-button c-button--primary>` "Request activation approval →" (when `activation_approval_id IS NULL`)
- `<.c-button c-button--secondary>` "View activation approval" (when `activation_approval_id IS NOT NULL`)

Modal close: `<.c-button c-button--tertiary>` "Close".

---

## Banned-Lexicon Enforcement (218-Specific Pre-Dispatch Gate)

Phase 218 ships InApp campaign content + upgrade-trigger prompt copy
storage. Per CLAUDE.md "Banned lexicon" doctrine and 213-04 public-
proof boundary, the following surfaces MUST be banned-lexicon-checked
BEFORE any `external.send` mutation dispatches the content:

| Storage location | Pre-dispatch validator | Test file |
|------------------|------------------------|-----------|
| `in_app_campaigns.content_jsonb` | `lib/markos/inapp/campaigns.ts` `validateContentBeforeDispatch()` | `test/growth-218/inapp/banned-lexicon-pre-dispatch.test.js` |
| `in_app_campaigns.prompt_copy` | `lib/markos/inapp/campaigns.ts` `validateContentBeforeDispatch()` | (same) |
| `upgrade_triggers.prompt_copy` | `lib/markos/upgrade-triggers/triggers.ts` `validatePromptCopyBeforeDispatch()` | `test/growth-218/upgrade-triggers/banned-lexicon-pre-dispatch.test.js` |
| Doctrine prose in `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (CREATE; 218-01 first ship) | CI grep | `test/growth-218/closeout/doctrine-banned-lexicon.test.js` |
| Doctrine prose in F-{238..246} contract YAMLs | CI grep | (same) |

Banned phrases (zero-match required): `synergy`, `leverage`, `empower`,
`unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`,
`seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-
generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`,
`just` (as softener). No exclamation points in product surface copy.

The `growth-inapp-campaign-dispatch.js` cron handler MUST NOT enqueue
delivery when `validateContentBeforeDispatch()` returns banned-lexicon
match count > 0. The `growth-upgrade-trigger-monitor.js` cron handler
MUST NOT fire trigger when `validatePromptCopyBeforeDispatch()` returns
banned-lexicon match count > 0. Dispatch failure paths emit
`markos_agent_runs.failure_class = 'banned_lexicon_violation'` event
(per RUN-05 task creation invariant) and create a P208 task for the
content author to revise.

---

## Sentinel Discipline Carry (218-Specific)

The `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel discipline (originated
in 215-UI-SPEC; canonical doctrine in CLAUDE.md Pricing Engine Canon)
extends into 218 for two specific contracts:

1. **`upgrade_triggers.pricing_context_sentinel`** (column type `text`).
   The 5-clause `UPGRADE_TRIGGER_PRICING_REQUIRED` DB-trigger accepts
   the sentinel string as substitute for `pricing_recommendation_id`.
   Test: `test/growth-218/upgrade-triggers/pricing-sentinel-trigger.test.js`
   verifies (a) UPDATE status='active' WITHOUT pricing_recommendation_id
   AND WITHOUT sentinel → EXCEPTION; (b) with sentinel
   `'{{MARKOS_PRICING_ENGINE_PENDING}}'` → succeeds; (c) with
   pricing_recommendation_id NOT NULL → succeeds; (d) wrong sentinel
   string (e.g., `'PENDING'`) → EXCEPTION.

2. **`in_app_campaigns.pricing_context_sentinel`** (column type `text`).
   The 4-clause `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING`
   DB-trigger accepts the sentinel string for `primary_goal IN
   ('upgrade_prompt', 'upsell')` campaigns. Test:
   `test/growth-218/inapp/approval-pricing-trigger.test.js` mirrors
   the upgrade-trigger sentinel test cases for the upgrade-goal branch.

The sentinel persists on those columns until P205 Pricing Engine
lands. Per the 215-UI-SPEC sentinel inheritance chain: when P205 lands,
operators MUST link `pricing_recommendation_id` and clear
`pricing_context_sentinel` per the 215-05
`saas_billing_corrections.offer_details` discipline pattern. **Phase
218 MUST NOT take pricing ownership** — the sentinel is the only
acceptable substitute, and all monetary rendering is downstream
phases' responsibility.

---

## Inheritance Citations

Authority chain (verbatim; checker enforces every link):

| Inheritance link | What 218 inherits | Citation |
|------------------|-------------------|----------|
| 206 mutation-class | `external.send` (InAppCampaign delivery), `billing.charge` (upgrade-trigger activation), `data.export` (experiment_decisions LRN-bridge writes); `default_approval_mode == single_approval` per handoff_kind; autonomy-ceiling on `external.send` for customer-facing in-app delivery; autonomy-ceiling on `billing.charge` for upgrade-trigger activation | 206-UI-SPEC §Mutation Classification |
| 207 RunApiEnvelope | `run_id` linked to PQL scorer + upgrade-trigger evaluator + InAppCampaign dispatch + experiment activation + experiment decision recording + readiness-flag flip runs; AgentRunEventType for 9 new event names; ApprovalHandoffRecord for 4 new handoff_kind literals | 207-UI-SPEC §RunApiEnvelope + §AgentRunEventType + §ApprovalHandoffRecord |
| 208 Approval Inbox | 4 NEW handoff_kind literals (`pql_hot_transition_review` 8th + `upgrade_trigger_activate` 9th + `inapp_campaign_activate` 10th + `experiment_activate` 11th) extending the 207's 4-set + 214's 5th `billing_charge_approval` + 215's 6th `billing_correction_approval` + 216's 7th `support_response_approval` + 8th `save_offer_approval` chain | 208-UI-SPEC §Approval Inbox handoff filter |
| 212 Learning | `experiment_decisions` FK chain to `artifact_performance_logs` (LRN-02) + `literacy_update_candidates` (LRN-05) + `tenant_overlay_candidates` (LRN-03); SOFT degradation via `lib/markos/experiments/lrn-bridge.ts`; integrates_with not requirements_addressed | 212-UI-SPEC §ArtifactPerformanceLog learning-handoff |
| 213 Tenant 0 | 213-04 public-proof boundary applies to InAppCampaign content + experiment hypothesis + decision rationale + PQL signals as PRIVATE doctrine; banned-lexicon zero-match BEFORE `external.send` dispatch | 213-UI-SPEC §Public-Proof Boundary |
| 214 SaaS Suite Activation | `saas_growth_profiles.tenant_id` FK chain to `markos_orgs` UNIQUE; `MODE_REQUIRES_SAAS_ACTIVATION` DB-trigger; 214 `future_phase_217` placeholder dissolved at backend layer | 214-UI-SPEC §SaaSSuiteActivation |
| 215 Sentinel discipline | `{{MARKOS_PRICING_ENGINE_PENDING}}` accepted on `upgrade_triggers.pricing_context_sentinel` AND `in_app_campaigns.pricing_context_sentinel`; 5-clause UPGRADE_TRIGGER_PRICING_REQUIRED defense documents the OR sentinel acceptance | 215-UI-SPEC §Sentinel Discipline |
| 216 Health-score consumer | `saas_health_scores` FK consumed by 218-02 `lib/markos/pql/scorer.ts`; 216 `EVENT_CATEGORIES` taxonomy consumed by InAppCampaign segments; 216 9-row `growth_signal_map` reservation dissolved by 218 substrate | 216-UI-SPEC §future_phase_218_growth_signal_consumer |
| 217 SaaS UI parent | `saas_nav_visibility` 12-row planned-only seed with 3 P218 namespaces (`saas_plg`, `saas_inapp`, `saas_experiments`); `SAAS_NAV_REQUIRES_ACTIVATION` DB-trigger; 217-06 7 NEW extracted components are first-class production primitives consumed by future 218 admin surfaces | 217-UI-SPEC §saas_nav_visibility seed |

---

## Copywriting Contract

**Not applicable.** Phase 218 ships zero customer-facing copy strings.
Future P218 admin/tenant surfaces will author copy gated by:

- DESIGN.md v1.1.0 banned-lexicon doctrine (zero-match)
- 213-04 public-proof boundary (PRIVATE doctrine — never published)
- 215 sentinel discipline (`{{MARKOS_PRICING_ENGINE_PENDING}}` only acceptable pricing substitute)
- 216 KB-grounding pattern (suggested copy must cite evidence chunks)
- 217 D-21 server/client boundary (default server components)
- The 5 future-surface UI binding contracts above (verbatim ENUM literal rendering)

The future approval-modal copy templates (CTAs, gating notices,
banned-lexicon error messages, sentinel warnings, 5-field activation
checklist labels) are specified verbatim in the 5 UI binding contracts
above. Future surfaces MUST use those verbatim strings — no
localization, no substitution, no abridgment.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | not applicable — repository is not shadcn-initialized; 218 ships zero UI surfaces | not required |
| Third-party | not applicable | not required |

**218 ships zero UI surfaces.** The DB-trigger registry is the only
"registry" 218 ships:

| 218 DB-trigger registry | Triggers shipped | Defense | Source migration |
|-------------------------|------------------|---------|------------------|
| `MODE_REQUIRES_SAAS_ACTIVATION` | 1 trigger on `saas_growth_profiles` | Mode change requires 214 SaaSSuiteActivation | 218-01 migration 101 |
| `PQL_SCORE_REQUIRES_EVIDENCE` | 1 trigger on `pql_scores` | pql/hot_pql transition requires ≥1 explainable signal across 5 columns | 218-02 migration 102 |
| `UPGRADE_TRIGGER_PRICING_REQUIRED` | 1 trigger on `upgrade_triggers` | 5-clause defense — pricing_recommendation_id NOT NULL OR sentinel + approved_at NOT NULL | 218-03 migration 103 |
| `INAPP_CAMPAIGN_REQUIRES_APPROVAL_AND_PRICING` | 1 trigger on `in_app_campaigns` | activation gate + upgrade-goal pricing gate | 218-04 migration 104 |
| `INAPP_DISPATCH_REQUIRES_FREQUENCY_CHECK` | 1 trigger on `in_app_campaign_deliveries` | frequency-cap defense — N deliveries per cooldown window | 218-04 migration 104 |
| `EXPERIMENT_ACTIVATION_REQUIRES_GUARDRAILS_OWNER_DECISION_CRITERIA_LEARNING` | 1 trigger on `marketing_experiments` | 5-field constraint matching CONTEXT.md non-negotiable verbatim | 218-05 migration 105 |
| `AGENT_ACTIVATION_REQUIRES_READINESS` | 1 trigger on `plg_growth_agent_readiness` | readiness flag flip requires activation_approval_id NOT NULL | 218-06 migration 106 |

**Total DB-triggers: 7** (MODE_REQUIRES_SAAS_ACTIVATION + 6 P218
domain triggers).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: not applicable — no customer-facing copy in this phase. Future surfaces use verbatim strings from the 5 UI binding contracts above. PASS-by-scope.
- [ ] Dimension 2 Visuals: not applicable — no visual surface in this phase. Future surfaces compose `styles/components.css` v1.1.0 primitives via `<.c-card>`, `<.c-button>`, `<.c-input>`, `<.c-notice>`, `<.c-badge>`, `<.c-modal>`, `<.c-chip>`, `<.c-chip-protocol>`, `<.c-code-block>`. PASS-by-scope.
- [ ] Dimension 3 Color: not applicable — no color in this phase. Future surfaces consume `--color-*` tokens from `app/tokens.css`. PASS-by-scope.
- [ ] Dimension 4 Typography: not applicable — no typography in this phase. Future surfaces consume `--font-mono` (JetBrains Mono) for headings + IDs and `--font-sans` (Inter) for body + lead + caption. PASS-by-scope.
- [ ] Dimension 5 Spacing: not applicable — no spacing in this phase. Future surfaces consume `--space-*` tokens (8px base; on-grid only). PASS-by-scope.
- [ ] Dimension 6 Registry Safety: not applicable for shadcn (no UI shipped). Applicable for 7 DB-trigger registry entries (above). All 7 triggers verified by direct read of plan `files_modified` blocks. PASS.

**Approval:** pending — checker upgrades to `approved` once the
no-UI declaration is verified by re-reading every `files_modified`
block in 218-01..218-06 and confirming zero matches against the search
assertion table.

**No-UI verification block:** if the checker finds ANY UI surface in
plan files_modified blocks (`app/`, `components/`, `*.stories.tsx`,
`page.tsx`, `layout.tsx`, `*.module.css`, `*.css`, `*.scss`, `*.sass`,
`tailwind.config.*`, `app/globals.css`, `app/tokens.css`,
`styles/components.css`, `route.ts`), **BLOCK** and return UI-SPEC
BLOCKED to the orchestrator.
