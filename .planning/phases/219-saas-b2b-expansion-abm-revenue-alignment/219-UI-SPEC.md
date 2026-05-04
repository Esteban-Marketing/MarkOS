---
phase: 219
slug: saas-b2b-expansion-abm-revenue-alignment
status: draft
shadcn_initialized: false
preset: not-applicable-no-ui-phase
domain: saas-b2b-substrate-revenue-team-config-sla-feedback-account-expansion-customer-marketing-9-trigger-signal-10-program-type-abm-account-package-buying-committee-evd-03-04-06-advocacy-review-request-proof-asset-consent-t0-04-b2b-pricing-expansion-save-discount-4-trigger-pricing-pack-9-b2b-agents-readiness-registry
created: 2026-05-04
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: no-ui-surface-phase
ui_scope: zero-surface
plans_in_scope: [219-01, 219-02, 219-03, 219-04, 219-05, 219-06]
plans_with_ui_surfaces: []
plans_no_ui: [219-01, 219-02, 219-03, 219-04, 219-05, 219-06]
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `external.send` for outreach (`account_expansion_outreach`), customer marketing program activation (`customer_marketing_program_activation`), ABM external outreach (`abm_external_outreach`), advocacy review-request dispatch (`advocacy_review_request_dispatch`), proof asset publish (`advocacy_proof_publish`), expansion offer activation (`expansion_offer_activation`), save offer presentation (`save_offer_presentation`); `billing.charge` for discount authorization request (`discount_authorization_request`), expansion offer activation (`expansion_offer_activation` when `discount_pct > 0`), save offer presentation (`save_offer_presentation`); `data.export` for marketing-sales feedback dispatch (`marketing_sales_feedback_dispatch`), revenue team config SLA change (`revenue_team_config_sla_change`), ABM enrichment audit (non-manual sources), advocacy proof evidence pack assembly; `default_approval_mode == single_approval` for `expansion_outreach_approval` + `program_activation_approval` + `abm_outreach_approval` + `review_request_dispatch_approval` + `proof_publish_approval` + `expansion_offer_approval` + `save_offer_approval`; `default_approval_mode == dual_approval` for `discount_authorization_approval` when `discount_pct > 25` (high-discount threshold per Pricing Engine Canon dual-approval pattern); autonomy-ceiling on `external.send` for all customer-facing B2B outreach; autonomy-ceiling on `billing.charge` for all discount + expansion + save offer paths)
  - 207-UI-SPEC.md (`RunApiEnvelope`; `run_id` linked to SLA breach monitor cron runs (`b2b-sla-breach-monitor.js` hourly) + expansion signal scanner cron runs (`b2b-expansion-signal-scanner.js` daily) + ABM enrichment refresh cron runs (`b2b-abm-enrichment-refresh.js` weekly) + advocacy signal scanner cron runs (`b2b-advocacy-signal-scanner.js` daily) + review request cadence cron runs (`b2b-review-request-cadence.js` daily) + pricing-context resolver runs + save offer evaluator runs + 9 B2B agent readiness-flag flip runs; `AgentRunEventType` for `mql_sla_breach_detected` / `mql_sla_warn_detected` / `feedback_record_dispatched` / `expansion_signal_detected` / `expansion_outreach_dispatched` / `customer_marketing_program_activated` / `program_enrollment_added` / `abm_package_enriched` / `abm_committee_member_added` / `abm_engagement_event_ingested` / `abm_external_outreach_dispatched` / `abm_stale_package_detected` / `advocacy_candidate_identified` / `review_request_dispatched` / `proof_asset_published` / `proof_consent_recorded` / `proof_consent_revoked` / `expansion_offer_activated` / `save_offer_presented` / `save_offer_outcome_recorded` / `discount_authorization_requested` / `discount_authorization_approved` / `pricing_sentinel_active` / `b2b_agent_readiness_flag_flipped`; `ApprovalHandoffRecord` links 219 expansion outreach + program activation + ABM outreach + review-request dispatch + proof publish + discount authorization + expansion offer + save offer to P208 inbox; `agent_run_id` linked to all 5 B2B cron handlers + 14 API handler write paths)
  - 208-UI-SPEC.md (PARENT — Approval Inbox at `/operations/approvals` extends with EIGHT new handoff_kind literals: `expansion_outreach_approval` (12th literal in canonical chain — 219-02 outreach_sent transition; `lib/markos/expansion/opportunities.ts` `requestOutreachApproval` calls `buildApprovalPackage` with `kind='account_expansion_outreach'`), `program_activation_approval` (13th literal — 219-02 customer marketing program draft→active transition; `lib/markos/expansion/customer-marketing.ts` `activateProgram` calls `buildApprovalPackage` with `kind='customer_marketing_program_activation'`), `abm_outreach_approval` (14th literal — 219-03 stage transition to `meeting_booked` or `opportunity`; `lib/markos/abm/packages.ts` `requestExternalOutreachApproval` calls `buildApprovalPackage` with `kind='abm_external_outreach'`), `review_request_dispatch_approval` (15th literal — 219-04 advocacy review-request dispatch; `lib/markos/advocacy/review-requests.ts` `dispatchReviewRequest` calls `buildApprovalPackage` with `kind='advocacy_review_request_dispatch'`), `proof_publish_approval` (16th literal — 219-04 proof asset publish; `lib/markos/advocacy/proof-assets.ts` `publishProofAsset` calls `buildApprovalPackage` with `kind='advocacy_proof_publish'` + EVD-05 payload), `discount_authorization_approval` (17th literal — 219-05 discount authorization request before INSERT; `lib/markos/b2b-pricing/discount-authorizations.ts` `requestDiscountAuthorization` calls `buildApprovalPackage` with `kind='discount_authorization_request'`; `default_approval_mode == dual_approval` when `discount_pct > 25`), `expansion_offer_approval` (18th literal — 219-05 expansion offer activation; `lib/markos/b2b-pricing/expansion-offers.ts` `activateExpansionOffer` calls `buildApprovalPackage` with `kind='expansion_offer_activation'`), `save_offer_approval` (19th literal — 219-05 save offer presentation; `lib/markos/b2b-pricing/save-offers.ts` `presentSaveOffer` calls `buildApprovalPackage` with `kind='save_offer_presentation'`; reuses 215 billing-correction modal approval pattern); the legacy 11-chip set (4 P207 literals + P214 `billing_charge_approval` + P215 `billing_correction_approval` + P216 `support_response_approval` + P216 `save_offer_approval` + 218's `pql_hot_transition_review` + `upgrade_trigger_activate` + `inapp_campaign_activate` + `experiment_activate`) extends to 19 chips after 219; rendering of those eight new chips is deferred to a future P208 admin extension that displays per-row classifier output, signal evidence (9 trigger_signal taxonomy), pricing context (sentinel-or-recommendation), buying-committee inferred-flag indicators, EVD-03 inferred labeling, EVD-04 stale-package warnings, EVD-05 approval payload (evidence_refs + consent_state + privacy_approved + assumptions + claim_risk), EVD-06 source-quality fields, T0-04 Tenant 0 proof posture invariant, and 4-trigger pricing pack status)
  - 209-UI-SPEC.md (PARENT — EVD-03 is_inferred labeling on `abm_buying_committee_members` rows; EVD-04 stale-package detection on `abm_account_packages` (`enriched_at < now() - 90d`); EVD-05 approval payload shape for `advocacy_proof_publish` `kind` containing `evidence_refs` + `consent_state` + `privacy_approved` + `assumptions` + `claim_risk`; EVD-06 source-quality fields embedded in `abm_account_packages.strategic_signals_jsonb` AND `abm_account_packages.company_profile_jsonb` (`source_quality numeric 0-1`, `extraction_method text`, `extracted_at timestamptz`, `compliance_posture text`); EVD-06 also embedded in `lib/markos/b2b-pricing/pricing-context-resolver.ts` returned `PricingContext` shape when `source='pricing_engine'`; the immutable-evidence pattern carries — once `evidence_refs` link is written on `account_expansion_opportunities` / `abm_account_packages` / `proof_assets`, the FK array is frozen; future surfaces never `.update()` evidence_refs in place; new evidence requires new evidence_map_records row + replace; the 209 doctrine `<EvidenceMapPanel />` + `<EvidenceCitationChip />` extracted-component recipes are referenced by future 219 admin surfaces as load-bearing primitives)
  - 213-UI-SPEC.md (PARENT — Tenant 0 proof posture invariant T0-04 enforced via `tenant_zero_proof_posture` SQL view in 219-04 migration 110; `proof_consent_records.consent_given=true AND consent_revoked_at IS NULL` AND `proof_assets.approved_at IS NOT NULL` AND `proof_assets.evidence_refs` non-empty are the 3 conditions for any public proof use; 213-04 public-proof boundary applies to `proof_assets` + `advocacy_review_requests` content; `proof_assets.title` + `proof_assets.content_draft` + `proof_assets.published_url` + `advocacy_review_requests.message_preview` + `customer_marketing_programs.goal` + `account_expansion_opportunities.outreach_message` + `expansion_offers.offer_copy` + `save_offers.offer_copy` authored under 219 are PRIVATE doctrine until consent + approval gates pass; raw buying-committee `key_concerns text[]` + `linkedin_url` + `last_interaction_at` + `health_score_at_identification` + `nps_score_at_identification` + `do_not_contact bool` are NEVER cited in case-studies or public surfaces; banned-lexicon zero-match required on every B2B outreach + advocacy + proof + pricing copy field BEFORE any `external.send` or `billing.charge` mutation dispatches the content; 213.4-VALIDATION.md carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary) carries verbatim into all future 219-consuming admin/tenant surfaces)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; `saas_suite_activations` HARD upstream gate; every 219 SOR table FK to `markos_orgs(tenant_id)` AND every 219 module-table INSERT fires `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` BEFORE-INSERT trigger via `fn_check_module_mode_eligibility` from P218 migration 101; 214 `<SaaSActivationPanel />` + `<SaaSSubscriptionsTable />` extracted components are downstream consumers of 219 revenue-team / expansion / ABM / advocacy / pricing metadata-only signals; 219 inherits the `business_type != 'saas'` gating contract for all future B2B admin/tenant surfaces; `expansion_offers.opportunity_id` nullable FK to `account_expansion_opportunities` AND nullable FK to `tenant_billing_subscriptions` per 215 substrate inheritance)
  - 215-UI-SPEC.md (PARENT — sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline for `expansion_offers.offer_copy` (when `pricing_recommendation_id IS NULL`) + `save_offers.offer_copy` (when `pricing_recommendation_id IS NULL`) per Q-4 SOFT P205 fallback; the 4-DB-trigger pricing compliance pack from 219-05 migration 111 mirrors 215 sentinel-acceptance pattern: `fn_expansion_offer_pricing_required` BEFORE-UPDATE accepts EITHER `pricing_recommendation_id NOT NULL` OR `offer_copy LIKE '%MARKOS_PRICING_ENGINE_PENDING%'`; `fn_save_offer_pricing_required` shares the exception name `EXPANSION_OFFER_PRICING_REQUIRED` per RESEARCH §Compliance shared-error doctrine; `fn_discount_requires_approval` BEFORE-INSERT requires `approved_at NOT NULL AND approved_by NOT NULL` (defense-in-depth on top of approval gate); `fn_expansion_discount_requires_authorization` BEFORE-INSERT requires `discount_authorization_id NOT NULL` when `discount_pct > 0`; 215 sensitive-credential UI binding contract Layer 6 (`[REDACTED]` for STRIPE/MP/SIIGO/DIAN/QB PII fields) does NOT extend into 219 (no payment processor PII in scope); 215 evidence-pack pattern carries forward — every B2B pricing approval payload includes `pricing_context` resolved via `lib/markos/b2b-pricing/pricing-context-resolver.ts` which returns either EVD-06 fields when `source='pricing_engine'` OR sentinel object when `source='sentinel'`; 215 billing-correction modal approval recipe is REUSED for `save_offer_approval` per 218 + 219 Approval Inbox extension)
  - 216-UI-SPEC.md (PARENT — `saas_health_scores.risk_level` + `saas_health_scores.health_score` consumed by 219-02 `lib/markos/expansion/signal-scanner.ts` (SOFT degrade — `health_score_high` trigger_signal when `health_score >= 85`) + 219-04 `lib/markos/advocacy/signal-scanner.ts` (SOFT degrade — `trigger_criteria=['health_score_high']` when `health_score >= 85`); the 216 `EVENT_CATEGORIES = ['activation','adoption','depth','stickiness','expansion','plg_readiness','churn_signal','other']` taxonomy is consumed by 219-02 `lib/markos/expansion/contracts.ts` `EXPANSION_TRIGGER_SIGNALS = 9 values` (which includes `health_score_high` from this taxonomy); 216 `<HealthScoreBadge />` + `<RiskBandBadge />` + `<RetentionClassChip />` extracted-component recipes are referenced by future 219 admin surfaces as load-bearing primitives — `<HealthScoreBadge />` reused on advocacy candidate queue + ABM package detail; `<RiskBandBadge />` reused on save offer presentation modal; `<RetentionClassChip />` reused on save offer outcome recording; the 216 9-row `growth_signal_map` reservation seed (planned_only=true) has rows that 219-02 + 219-04 signal scanners CONSUME at read-only — 219 plans do NOT modify the 216 seed; the existing 218 dissolutions of those rows already flipped `planned_only=false + activated_at=now()`; 219 inherits the post-218 state)
  - 217-UI-SPEC.md (PARENT — `saas_nav_visibility` 12-row planned-only seed has B2B-related namespaces (`saas_revenue` (10), `saas_subscriptions` (1), `saas_invoices` (3), `saas_support` (8), `saas_agents` (12)) that 219-06 closeout does NOT directly modify because the planned 219 admin/tenant surfaces are deferred to future phases; however, future 219 admin/tenant frontend phases that compose `app/saas/b2b/{revenue-team,expansion,abm,advocacy,pricing}/page.tsx` MUST extend `saas_nav_visibility` with new rows — each row gated by `SAAS_NAV_REQUIRES_ACTIVATION` DB-trigger; 217-06 `<SaaSActivationPanel />` + `<SaaSSubscriptionsTable />` + 7 NEW extracted components (`<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />`) are first-class production primitives that future 219 admin surfaces compose; 217 D-21 server/client boundary doctrine carries forward verbatim — every future 219 admin / tenant surface MUST be a default server component reading via `requireHostedSupabaseAuth(request)` + tenant-scoped supabase client; client components opt in via `'use client'` only for interactive primitives (buying-committee relationship-graph editor, EVD-06 source-quality scrubber, advocacy candidate queue filter, discount-pct authorization input); 217 `app/saas/agents/page.tsx` agents-page is the surface where the 9 P219 B2B agents readiness rows render with `runnable=false` badges until criteria met; 217 `future_phase_219_partner_console` placeholder is REMOVED from 217-consuming surfaces at the backend-contract layer — 219 ships substrate; UI-layer placeholder removal requires the future 219 admin frontend phase)
  - 218-UI-SPEC.md (PARENT — `markos_growth_mode` ENUM + `saas_growth_profiles` consumer; `module_mode_eligibility` 60-row seed enforces b2b/plg_b2b mode access for `abm_engine` module per 219-03 Plan must_haves; every 219 module-table INSERT fires `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE` trigger via `lib/markos/profile/mode-eligibility.ts` `isModuleEligible(tenantId, moduleKey)`; 218 9-PLG-agents readiness pattern is REUSED verbatim in 219 9-B2B-agents readiness — system-level (not tenant-scoped) registry, GENERATED `runnable` column, `AGENT_ACTIVATION_REQUIRES_READINESS` DB-trigger, INSERT ON CONFLICT seed, 8-boolean checklist, 3-tier (EXP/ABM/REV/IAM) classification; 218 `<PlgAgentReadinessBadge />` extracted-component recipe is the load-bearing primitive that future 219 agent surfaces compose — same `[block]` / `[ok]` glyph pairing, same per-readiness-boolean checklist visualization; the 218 `future_phase_218_agents_page_extension` translation gate carries forward as a sibling pattern — 219 opens `future_phase_219_agents_page_extension` for the 9 B2B agents)
  - 213.4-VALIDATION.md §Carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary)
translation_gates_dissolved_by_219:
  - "217-UI-SPEC §future_phase_219_partner_console — DISSOLVED at the backend-substrate layer by 219 plans 01-06 shipping `revenue_team_configs` + `lead_qualification_sla_events` + `marketing_sales_feedback_records` + `account_expansion_opportunities` + `customer_marketing_programs` + `program_enrollments` + `abm_account_packages` + `abm_buying_committee_members` + `abm_engagement_events` + `advocacy_candidates` + `advocacy_review_requests` + `proof_assets` + `proof_consent_records` + `discount_authorizations` + `expansion_offers` + `save_offers` + `b2b_growth_agent_readiness` + 14 `/v1/b2b/*` API handlers + 12 MCP tools + 5 cron handlers + F-228..F-237 contracts + 4-DB-trigger pricing compliance pack + 4-DB-trigger advocacy/expansion/ABM compliance pack + 9 B2B agent readiness rows. The frontend admin / tenant surfaces (revenue team config wizard, SLA monitoring dashboard, marketing-sales feedback browser, account expansion opportunities queue, customer marketing program editor, ABM account package browser with EVD-03/04 indicators, ABM buying committee mapper, advocacy candidate queue, review request dispatch approval modal, proof asset library with consent indicators, proof publish approval modal, discount authorization queue, expansion offer approval modal, save offer approval modal, 9 B2B agents readiness viewer extension on 217-06 `app/saas/agents/page.tsx`) are DEFERRED to future P219+ admin/tenant phases. 219 ships substrate ONLY. The `<PlaceholderBanner variant=\"future_phase_219_partner_console\">` is REMOVED from 217-consuming surfaces at the backend-contract layer; UI-layer placeholder removal requires the future admin/tenant frontend phase."
  - "218-UI-SPEC §future_phase_218_admin_ui (B2B portion) — PARTIALLY DISSOLVED at the backend-substrate layer by 219 module-table substrate that the future P218+ admin UI for `b2b/plg_b2b` mode tenants will consume. The 218 `module_mode_eligibility` 60-row seed enforces b2b/plg_b2b access on the 219 ABM module (1 of 12 P218 modules). 219 substrate makes the eligibility runtime check load-bearing — future 218 admin UI surfaces that show a `b2b` mode tenant the ABM module CAN read 219 `abm_account_packages` data via 219 API handlers. (Translation gate kept open for non-B2B portions — PLG dashboard, PQL viewer, upgrade-trigger wizard, InAppCampaign editor, experiment registry remain DEFERRED.)"
  - "218-UI-SPEC §future_phase_219_agents_page_extension — OPENED by 219 (sibling gate to 218's `future_phase_218_agents_page_extension`). The 217-06 `app/saas/agents/page.tsx` agents page extension renders 9 P219 B2B agents readiness rows alongside the 9 P218 PLG agents readiness rows + the 12 P217 SAS agents readiness rows. (Translation gate documented under translation_gates_opened_by_219 below.)"
  - "213-UI-SPEC §public-proof boundary on advocacy_proof_assets — DISSOLVED at the substrate-layer for advocacy proof governance. 219-04 ships `proof_consent_records` + `proof_assets.privacy_approved` + `proof_assets.evidence_refs` + `proof_assets.approved_at` + `tenant_zero_proof_posture` SQL view that operationalizes T0-04. The 213.4 `<PlaceholderBanner variant=\"future_phase_advocacy_proof\">` (if existed) is REMOVED from 213-consuming surfaces at the backend-contract layer. The future advocacy proof UI surface (proof asset library with consent indicators, proof publish approval modal, T0-04 Tenant 0 proof posture invariant viewer) requires a future P219+ tenant frontend phase."
translation_gates_opened_by_219:
  - "future_phase_219_b2b_admin_ui — Multi-page B2B admin surface composing revenue team config wizard (`app/saas/b2b/revenue-team/page.tsx` future) + SLA monitoring dashboard (`app/saas/b2b/revenue-team/sla/page.tsx` future) + marketing-sales feedback browser (`app/saas/b2b/revenue-team/feedback/page.tsx` future) + account expansion opportunities queue (`app/saas/b2b/expansion/page.tsx` future) + customer marketing program editor (`app/saas/b2b/customer-marketing/[id]/edit/page.tsx` future) + ABM account package browser (`app/saas/b2b/abm/page.tsx` future) + ABM buying committee mapper (`app/saas/b2b/abm/[id]/committee/page.tsx` future) + advocacy candidate queue (`app/saas/b2b/advocacy/page.tsx` future) + proof asset library (`app/saas/b2b/advocacy/proof/page.tsx` future) + proof consent revocation viewer (`app/saas/b2b/advocacy/consent/page.tsx` future) + discount authorization queue (`app/saas/b2b/pricing/discounts/page.tsx` future) + expansion offer authoring + save offer presentation page (`app/saas/b2b/pricing/expansion-offers/page.tsx` + `app/saas/b2b/pricing/save-offers/page.tsx` future) + 4-DB-trigger pricing compliance pack monitor (`app/saas/b2b/pricing/compliance/page.tsx` future). All read via 219 `/v1/b2b/*` API contracts (F-228..F-237); all gate via 217-06 `isSaaSSurfaceEnabled` 3-condition gate; all extend 217-06 `saas_nav_visibility` with new rows under namespace `saas_b2b` (eligible for `b2b` and `plg_b2b` modes per 218 `module_mode_eligibility`). Future surfaces render `<PlaceholderBanner variant=\"future_phase_219_b2b_admin_ui\">` until those phases ship."
  - "future_phase_219_revenue_team_ui — Tenant-facing revenue team configuration surface composing growth profile editor extension (CRO/Growth lead authoring `revenue_team_configs.sales_model` + `mql_definition` + `sql_definition` + `mql_to_sql_sla_hours` + `feedback_cadence` + `attribution_model` + `shared_pipeline_target` + `marketing_sourced_pct_target`) + SLA breach approval gate viewer + 5-event-type SLA timeline viewer + LOOP-06 marketing-to-pipeline evidence linkage panel. Approval gate fires when SLA hours change (`fn_revenue_team_sla_requires_approval` BEFORE-UPDATE trigger raises `SLA_CONFIG_REQUIRES_APPROVAL`). All consume 219 substrate via `/v1/b2b/revenue-team-config*` API; all gate via 214 SaaSSuiteActivation. Future surfaces render `<PlaceholderBanner variant=\"future_phase_219_revenue_team_ui\">` until those phases ship."
  - "future_phase_219_advocacy_ui — Tenant-facing advocacy / proof / review-request surface composing advocacy candidate queue with 6-relationship-stage filter chips + 5-consent-state filter chips (CSO/Customer Marketing operator) + review request dispatch approval modal with 9-platform selection + 4-ask-type taxonomy + result tracking + proof asset library with 9-asset-type browser + 7-consent-type tracking + 4-consent-method audit + T0-04 Tenant 0 proof posture invariant indicator + proof publish approval modal with EVD-05 approval payload (evidence_refs + consent_state + privacy_approved + assumptions + claim_risk) + consent revocation cascade viewer (revoke → all linked proof_assets transition status='archived' atomically). All consume 219 substrate via `/v1/b2b/advocacy/*` API contracts (F-234, F-235); all gate via 214 SaaSSuiteActivation. Future surfaces render `<PlaceholderBanner variant=\"future_phase_219_advocacy_ui\">` until those phases ship."
  - "future_phase_219_approval_inbox_extensions — P208 Approval Inbox at `/operations/approvals` rendering 8 new handoff_kind chips (`expansion_outreach_approval` 12th + `program_activation_approval` 13th + `abm_outreach_approval` 14th + `review_request_dispatch_approval` 15th + `proof_publish_approval` 16th + `discount_authorization_approval` 17th + `expansion_offer_approval` 18th + `save_offer_approval` 19th), filter chip set extends from 11 chips (post-218) to 19 chips (post-219). Each chip renders the per-row classifier (expansion 9-trigger-signal taxonomy badge + outreach copy preview, customer marketing 10-program-type taxonomy badge + program goal preview, ABM 7-stage badge + EVD-03 inferred-flag indicators on buying committee + EVD-04 stale-package warnings + EVD-06 source-quality fields chip row, advocacy 6-relationship-stage badge + 9-platform chip + 5-consent-state badge + T0-04 invariant indicator on Tenant 0 proof, proof asset 5-status badge + EVD-05 approval payload preview + 9-asset-type chip, discount 6-discount-type chip + dual-approval indicator when `discount_pct > 25` + pricing-context resolved + 4-DB-trigger compliance pack status, expansion offer 5-offer-type chip + 8-status badge + sentinel-or-recommendation indicator, save offer 6-save-type chip + 7-status badge + 215 billing-correction modal recipe inheritance). Row rendering extension is DEFERRED to a future P208 admin extension phase. Future surfaces render `<PlaceholderBanner variant=\"future_phase_219_approval_inbox_extensions\">` until that phase ships."
  - "future_phase_219_agents_page_extension — 217-06 `app/saas/agents/page.tsx` agents page extension rendering 9 P219 B2B agents readiness rows alongside 9 P218 PLG + 12 P217 SAS agents readiness rows. Per-agent 8-readiness-boolean checklist visible (contracts_assigned + cost_estimated + approval_posture_defined + tests_implemented + api_surface_defined + mcp_surface_defined + ui_surface_defined + failure_behavior_defined); `[block] Agent not yet runnable` paired with `--color-error` badge for `runnable=false`; `[ok] Agent ready` paired with `--color-success` badge when GENERATED `runnable=true`. The 9 B2B agents (TBD per 219-06 — `MARKOS-AGT-EXP-01..03` + `MARKOS-AGT-ABM-01..03` + `MARKOS-AGT-REV-01..02` + `MARKOS-AGT-IAM-01` cross-phase visibility row marked `blocking_phase='P218-06-CONFIRM'`) are pre-populated `runnable=false` until criteria met (SG-10). 3-tier classification badge (`B2B_AGENT_TIERS = ['EXP','ABM','REV','IAM']`) renders as `<.c-chip>` per row. Future surfaces render `<PlaceholderBanner variant=\"future_phase_219_agents_page_extension\">` until that phase ships."
  - "future_phase_220_referral_console — P220 referral console UI surface (already opened by 217). 219 does NOT modify this gate. Future surfaces render `<PlaceholderBanner variant=\"future_phase_220_referral_console\">` until P220 Plan 06 ships."
---

# Phase 219 — UI Design Contract (no-UI-scope)

> **Phase 219 ships zero UI surfaces.** This document is the explicit
> no-surface declaration for the SaaS B2B Expansion, ABM, and Revenue
> Alignment phase. There is no `app/`, no `components/`, no
> `*.stories.tsx`, no `page.tsx`, no `layout.tsx`, no `*.module.css`,
> and no `*.css` modified or created in any of the six plans
> (219-01 through 219-06).
>
> **Critical posture:** Phase 219 is the **B2B revenue substrate** of
> the SaaS Suite — `revenue_team_configs` (one per tenant, with
> 4-sales-model ENUM + MQL/SQL/PQL definitions + `mql_to_sql_sla_hours`
> + 2-feedback-cadence ENUM + 7-attribution-model ENUM + shared
> pipeline target + marketing-sourced-percent target) +
> `lead_qualification_sla_events` (5-event-type ENUM:
> `mql_raised`/`sql_accepted`/`sql_rejected`/`mql_sla_breach`/`mql_sla_warn`;
> LOOP-06 connect-marketing-to-pipeline-evidence wiring) +
> `marketing_sales_feedback_records` (period rollup + dispatch via
> `buildApprovalPackage`); `account_expansion_opportunities` with
> 9-trigger_signal taxonomy verbatim
> (`usage_growth`/`seat_pressure`/`champion_role_change`/`company_growth_news`/`contract_renewal`/`qbr_upcoming`/`budget_cycle`/`pql_signal`/`health_score_high`)
> + 5-expansion-type ENUM
> (`seat_expansion`/`plan_upgrade`/`add_on_adoption`/`annual_conversion`/`custom`)
> + 8-status-ENUM (draft → outreach → meeting_booked → closed_won/lost
> / deferred); `customer_marketing_programs` with 10-program_type
> taxonomy verbatim
> (`customer_success_sequence`/`expansion_campaign`/`advocacy_recruitment`/`referral_program`/`beta_program`/`customer_advisory_board`/`community_champion`/`case_study_pipeline`/`review_generation`/`co_marketing`)
> + `program_enrollments` with `UNIQUE(tenant_id, program_id, account_id)`
> dedup constraint; `abm_account_packages` (3-abm-tier ENUM:
> `1`/`2`/`3`; 7-stage ENUM:
> `identified`/`aware`/`engaged`/`meeting_booked`/`opportunity`/`customer`/`expansion_target`;
> 4-enrichment-source ENUM: `manual`/`research_engine`/`intent_data_import`/`operator`;
> EVD-06 source-quality fields embedded in `strategic_signals_jsonb` +
> `company_profile_jsonb`) + `abm_buying_committee_members` (5-persona
> ENUM:
> `economic_buyer`/`champion`/`user`/`gatekeeper`/`influencer`; EVD-03
> `is_inferred bool` auto-set when `known_to_us=false`) +
> `abm_engagement_events` (10-event-type ENUM); `advocacy_candidates`
> (6-relationship-stage ENUM:
> `identified`/`warming`/`warm`/`asked`/`committed`/`advocate`;
> 5-consent-state ENUM:
> `not_requested`/`requested`/`given`/`declined`/`revoked`) +
> `advocacy_review_requests` (9-platform ENUM:
> `g2`/`capterra`/`trustpilot`/`app_store`/`google_play`/`product_hunt`/`getapp`/`software_advice`/`custom`;
> 4-ask-type + 4-result ENUMs) + `proof_assets` (9-asset-type ENUM;
> 5-status ENUM: `draft` → `pending_approval` → `approved` →
> `published` / `archived`; `evidence_refs uuid[] NOT NULL` immutable
> array) + `proof_consent_records` (7-consent-type ENUM; 4-consent-method
> ENUM); `discount_authorizations` (6-discount-type ENUM; approval +
> approved_by NOT NULL on insert per `fn_discount_requires_approval`)
> + `expansion_offers` (5-offer-type ENUM; 8-status ENUM; `discount_pct
> > 0` requires `discount_authorization_id` per
> `fn_expansion_discount_requires_authorization`; pricing context via
> `lib/markos/b2b-pricing/pricing-context-resolver.ts` returning
> EVD-06 fields when `source='pricing_engine'` OR sentinel
> `{{MARKOS_PRICING_ENGINE_PENDING}}` when `source='sentinel'`) +
> `save_offers` (6-save-type ENUM:
> `temporary_discount`/`plan_downgrade_alternative`/`pause_subscription`/`feature_unlock_trial`/`cs_callback_offer`/`annual_conversion_incentive`;
> 7-status ENUM; reuses 215 billing-correction approval recipe);
> `b2b_growth_agent_readiness` (system-level, not tenant-scoped — 9
> B2B agent rows pre-populated `runnable=false`; `runnable` GENERATED
> ALWAYS AS (8-boolean AND chain) STORED;
> `AGENT_ACTIVATION_REQUIRES_READINESS` DB-trigger; `B2B_AGENT_TIERS =
> ['EXP','ABM','REV','IAM']` 4-tier classification). The phase's risk
> posture is HIGH on four dimensions — **customer-facing B2B outreach
> autonomy** (8 new approval handoff_kinds; `default_approval_mode ==
> single_approval` for 7 of 8, `dual_approval` for
> `discount_authorization_approval` when `discount_pct > 25`),
> **advocacy / proof governance** (T0-04 Tenant 0 proof posture
> invariant; consent revocation cascade; EVD-05 approval payload
> shape), **pricing integrity** (4-DB-trigger compliance pack:
> `EXPANSION_OFFER_PRICING_REQUIRED` + `EXPANSION_OFFER_PRICING_REQUIRED`
> shared on save offers + `DISCOUNT_REQUIRES_APPROVAL` +
> `DISCOUNT_REQUIRES_AUTHORIZATION`; sentinel
> `{{MARKOS_PRICING_ENGINE_PENDING}}` Q-4 SOFT P205 fallback per
> Pricing Engine Canon), and **ABM evidence discipline** (EVD-03
> is_inferred labeling on non-known committee members; EVD-04 stale-
> package detection at 90 days; EVD-06 source-quality fields embedded
> in strategic_signals_jsonb).
>
> The existing P208 Approval Inbox + Recovery Center + Task Board +
> the P217-06 `app/saas/agents/page.tsx` agents page consume 219
> contracts as downstream readers — they are NOT modified by this
> phase. The eight new Approval Inbox handoff_kind literals
> (`expansion_outreach_approval` + `program_activation_approval` +
> `abm_outreach_approval` + `review_request_dispatch_approval` +
> `proof_publish_approval` + `discount_authorization_approval` +
> `expansion_offer_approval` + `save_offer_approval`) extend the P208
> filter chip set from 11 literals (post-218) to 19 literals (post-219);
> rendering of those eight new chips is deferred to a future P208
> admin extension that displays per-row classifier output (9-trigger-
> signal taxonomy badge for expansion, 10-program-type taxonomy badge
> for customer marketing, 7-stage badge + EVD-03 inferred-flag
> indicators + EVD-04 stale-package warnings + EVD-06 source-quality
> chip row for ABM, 6-relationship-stage badge + 9-platform chip +
> 5-consent-state badge + T0-04 invariant indicator for advocacy,
> 5-status badge + EVD-05 approval payload preview for proof, 6-discount-
> type chip + dual-approval indicator + 4-DB-trigger compliance pack
> status for pricing). The 9 B2B agents readiness rows append into
> the existing 217-06 `app/saas/agents/page.tsx` rendering — that
> surface extension is also deferred. The P217-06 `saas_nav_visibility`
> 12-row planned-only seed has B2B-related namespaces that future P219
> admin frontend phases will extend (the 219-06 closeout does NOT
> modify the 217 seed because the planned 219 admin/tenant surfaces
> are deferred).
>
> What Phase 219 *does* ship is the **B2B revenue substrate** —
> **Supabase migrations** (`supabase/migrations/{107_b2b_revenue_team,
> 108_b2b_expansion_customer_marketing, 109_b2b_abm, 110_b2b_advocacy,
> 111_b2b_pricing}.sql` + `107_b2b_revenue_team_part2.sql` for
> `b2b_growth_agent_readiness` table — 5 (or 6 with part2) DDL slots
> covering 17 SOR tables: `revenue_team_configs`,
> `lead_qualification_sla_events`, `marketing_sales_feedback_records`,
> `account_expansion_opportunities`, `customer_marketing_programs`,
> `program_enrollments`, `abm_account_packages`,
> `abm_buying_committee_members`, `abm_engagement_events`,
> `advocacy_candidates`, `advocacy_review_requests`, `proof_assets`,
> `proof_consent_records`, `discount_authorizations`,
> `expansion_offers`, `save_offers`, `b2b_growth_agent_readiness`),
> **DB-triggers** (`fn_revenue_team_sla_requires_approval` +
> `fn_feedback_period_integrity` +
> `fn_expansion_outreach_requires_approval` +
> `fn_program_activation_requires_approval` +
> `fn_abm_enrichment_audit_required` +
> `fn_abm_external_outreach_requires_approval` +
> `fn_advocacy_review_request_requires_approval` +
> `fn_proof_publish_requires_consent_and_evidence` +
> `fn_expansion_offer_pricing_required` (5-clause shared with save
> offers via `EXPANSION_OFFER_PRICING_REQUIRED` exception name) +
> `fn_save_offer_pricing_required` (4-clause) +
> `fn_discount_requires_approval` (BEFORE-INSERT) +
> `fn_expansion_discount_requires_authorization` (BEFORE-INSERT) +
> `fn_b2b_agent_activation_gate`), **typed B2B modules** under
> `lib/markos/{revenue-team,expansion,abm,advocacy,b2b-pricing,b2b-agents,b2b/preflight}/**`
> (~60 lib files; TS source + CommonJS twins + index.cjs barrels),
> **MCP tools** (`lib/markos/mcp/tools/b2b.cjs` — 12 tool descriptors:
> 9 read-mostly + 3 write-gated), **Node API handlers**
> (`api/v1/b2b/*.js` — 14 server-side route modules; legacy `api/*.js`
> with no JSX, no rendering), **5 cron handlers**
> (`api/cron/b2b-{sla-breach-monitor,expansion-signal-scanner,abm-enrichment-refresh,advocacy-signal-scanner,review-request-cadence}.js`),
> **F-ID contracts** (`contracts/F-{228..237}-b2b-*.yaml` — 10 IDs:
> F-228 revenue-team-config + F-229 marketing-sales-feedback + F-230
> account-expansion + F-231 customer-marketing + F-232 abm-account-
> package + F-233 abm-buying-committee + F-234 advocacy-candidate +
> F-235 advocacy-proof + F-236 pricing-controls + F-237 b2b-agents-
> readiness), **migration coordination registry update**
> (`.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` APPEND; reserves
> slots 107-111 + F-228..F-237; Q-7 RESOLVED slot reallocation from
> 85-89 to 107-111), **B2B agent readiness registry** (9-agent INSERT
> ON CONFLICT seed; `MARKOS-AGT-IAM-01` row marked
> `blocking_phase='P218-06-CONFIRM'` for cross-phase visibility), and
> **tests** (`test/b2b-219/{preflight,revenue-team,expansion,abm,
> advocacy,pricing,agents,api,cron,mcp,rls,closeout,openapi}/*.test.js`).
> None of those files compose, import, or render any visual primitive
> from `styles/components.css` or any token from `app/tokens.css`. The
> Node API handlers under `api/v1/b2b/*.js` and the 5 cron handlers
> under `api/cron/b2b-*.js` are flat versioned legacy `api/*.js`
> handlers per the 219 architecture-lock pin (forbidden patterns
> include `route.ts`, `app/api/cron/.../route.ts`, `app/(b2b)/`,
> `app/(growth)/`). They emit JSON envelopes only; the cron handlers
> ack with HTTP 200 and emit `markos_agent_runs` events.
>
> However, **every downstream phase (P208 admin extensions for the 8
> new approval handoff_kind chips, P217-06 `app/saas/agents/page.tsx`
> 9 B2B agents readiness viewer extension, future P219 admin/tenant
> frontends for revenue team config wizard / SLA monitoring dashboard
> / marketing-sales feedback browser / account expansion opportunities
> queue / customer marketing program editor / ABM account package
> browser with EVD-03/04 indicators / ABM buying committee mapper /
> advocacy candidate queue / review request dispatch approval modal /
> proof asset library with consent indicators / proof publish approval
> modal / discount authorization queue / expansion offer approval
> modal / save offer approval modal, P220 community/PR/event/devrel
> growth-mode-gated module surfaces) that consumes a Phase 219
> contract WILL eventually need a UI surface** — revenue team config
> wizard with 4-sales-model ENUM picker + MQL/SQL/PQL definition
> editor + SLA breach approval gate viewer + 5-event-type SLA timeline,
> account expansion opportunities queue with 9-trigger-signal filter
> chips + 8-status badges + outreach approval modal, customer marketing
> program editor with 10-program-type badges + activation gate via
> `buildApprovalPackage`, ABM account package browser with EVD-03
> is_inferred labeling on committee + EVD-04 stale-package warnings
> + EVD-06 source-quality fields chip row, ABM buying committee mapper
> with relationship-graph editor + 5-persona ENUM, advocacy candidate
> queue with consent state indicators + 6-relationship-stage filter,
> review request dispatch approval modal with 9-platform selection,
> proof asset library with consent revocation cascade + T0-04 Tenant
> 0 proof posture invariant indicator, proof publish approval modal
> with EVD-05 approval payload (evidence_refs + consent_state +
> privacy_approved + assumptions + claim_risk), discount authorization
> queue with threshold-based dual-approval (`discount_pct > 25`),
> expansion offer authoring with `<Money fromPricingRecommendation />`
> XOR sentinel, save offer presentation reusing 215 billing-correction
> modal, 9 B2B agents readiness viewer. This UI-SPEC therefore also
> serves as a forward-looking inheritance map so future UI-SPECs can
> cite their lineage back to the B2B substrate doctrine defined here,
> AND as the load-bearing binding contract for **six future-surface
> UI binding contracts** (Revenue Team Config / Account Expansion +
> Customer Marketing / ABM Account Package / Advocacy + Proof / B2B
> Pricing + Save + Discount / 9 B2B Agents Readiness).
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md
> carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice`
> mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`,
> D-15 selective extraction, D-21 server/client boundary) → 206-UI-SPEC
> (mutation-class origin: `external.send` for B2B outreach + advocacy
> review-request + proof publish + customer marketing program
> activation, `billing.charge` for discount + expansion + save offer,
> `data.export` for feedback dispatch + ABM enrichment audit + advocacy
> evidence pack; `default_approval_mode == single_approval` for 7 of 8
> new handoff_kinds, `dual_approval` for `discount_authorization_approval`
> when `discount_pct > 25`) → 207-UI-SPEC (`RunApiEnvelope`,
> `AgentRunEventType`, `ApprovalHandoffRecord`; SLA breach monitor +
> expansion signal scanner + ABM enrichment refresh + advocacy signal
> scanner + review request cadence cron runs link via `agent_run_id`)
> → 208-UI-SPEC (PARENT — Approval Inbox extends 8 new handoff_kind
> literals 12th-19th in canonical chain) → 209-UI-SPEC (PARENT —
> EVD-03 is_inferred labeling + EVD-04 stale-package detection +
> EVD-05 approval payload shape + EVD-06 source-quality fields +
> immutable evidence_refs pattern) → 213-UI-SPEC (Tenant 0 proof
> posture invariant T0-04 enforcement; 213-04 public-proof boundary
> applies to advocacy + proof + B2B outreach copy as PRIVATE doctrine;
> banned-lexicon zero-match BEFORE `external.send` / `billing.charge`
> dispatch) → 214-UI-SPEC (PARENT — SaaS Suite Activation; every 219
> SOR table FK to `markos_orgs(tenant_id)`; `MODULE_REQUIRES_ELIGIBLE_GROWTH_MODE`
> trigger via P218 fn_check_module_mode_eligibility) → 215-UI-SPEC
> (PARENT — sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` discipline
> for expansion offer + save offer copy; 4-DB-trigger pricing
> compliance pack; 215 billing-correction modal recipe REUSED for
> save_offer_approval) → 216-UI-SPEC (PARENT — `saas_health_scores`
> consumed by expansion signal scanner (`health_score_high` trigger)
> + advocacy signal scanner (`health_score_high` candidate trigger);
> EVENT_CATEGORIES taxonomy consumed by 219-02 trigger_signal taxonomy)
> → 217-UI-SPEC (PARENT — `saas_nav_visibility` consumer eventually;
> 9 B2B agents extend 217-06 agents page; 7 NEW extracted components
> referenced as load-bearing primitives) → 218-UI-SPEC (PARENT —
> `markos_growth_mode` ENUM b2b/plg_b2b eligibility for ABM module;
> 60-row module_mode_eligibility seed enforces b2b/plg_b2b mode
> access; 9 B2B agents readiness pattern reused verbatim from 218 9
> PLG agents pattern; `<PlgAgentReadinessBadge />` component recipe
> generalized to `<B2bAgentReadinessBadge />`) → this document.
> Generated by gsd-ui-researcher 2026-05-04. Status: draft (checker
> upgrades to approved once the no-UI declaration is verified).

---

## Scope Verification

The orchestrator's preliminary finding has been verified by reading
all six plans plus context, research, and reviews. The full file set
declared in `files_modified` across 219-01..219-06 is enumerated
below, with surface classification per file:

| File class | Path glob | Plan(s) | UI surface? |
|------------|-----------|---------|-------------|
| Phase doctrine | `.planning/phases/219-saas-b2b-expansion-abm-revenue-alignment/{219-CONTEXT, 219-RESEARCH, 219-REVIEWS, 219-VALIDATION, 219-{01..06}-PLAN, DISCUSS}.md` | 219-01..219-06 | NO |
| Migration coordination | `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (APPEND P219 reservation; P218 already created the file) | 219-01 | NO |
| Preflight surface | `lib/markos/b2b/preflight/{upstream-gate.ts, architecture-lock.ts, errors.ts, index.cjs}` (4 files) | 219-01 | NO (TS/CJS modules; no JSX) |
| Revenue-team domain modules | `lib/markos/revenue-team/{contracts.ts, contracts.cjs, config.ts, config.cjs, sla-monitor.ts, feedback.ts, index.cjs}` (7 files) | 219-01 | NO |
| Expansion domain modules | `lib/markos/expansion/{contracts.ts, contracts.cjs, opportunities.ts, opportunities.cjs, customer-marketing.ts, enrollment.ts, signal-scanner.ts, index.cjs}` (8 files) | 219-02 | NO |
| ABM domain modules | `lib/markos/abm/{contracts.ts, contracts.cjs, packages.ts, packages.cjs, buying-committee.ts, engagement.ts, enrichment.ts, index.cjs}` (8 files) | 219-03 | NO |
| Advocacy domain modules | `lib/markos/advocacy/{contracts.ts, contracts.cjs, candidates.ts, candidates.cjs, review-requests.ts, proof-assets.ts, consent.ts, signal-scanner.ts, index.cjs}` (9 files) | 219-04 | NO |
| B2B-pricing domain modules | `lib/markos/b2b-pricing/{contracts.ts, contracts.cjs, expansion-offers.ts, expansion-offers.cjs, save-offers.ts, discount-authorizations.ts, pricing-context-resolver.ts, index.cjs}` (8 files) | 219-05 | NO |
| B2B-agents domain modules | `lib/markos/b2b-agents/{contracts.ts, contracts.cjs, readiness-registry.ts, readiness-gate.ts, index.cjs}` (5 files) | 219-06 | NO |
| MCP tools | `lib/markos/mcp/tools/b2b.cjs` + `lib/markos/mcp/tools/index.cjs` (registry append) | 219-06 | NO (CommonJS MCP descriptors; no JSX) |
| Migrations | `supabase/migrations/{107_b2b_revenue_team, 107_b2b_revenue_team_part2, 108_b2b_expansion_customer_marketing, 109_b2b_abm, 110_b2b_advocacy, 111_b2b_pricing}.sql` (5-6 files) | 219-01..219-06 | NO (SQL DDL) |
| Node API handlers | `api/v1/b2b/{revenue-team-config, revenue-team-config/sla-events, revenue-team-config/feedback, expansion/opportunities, customer-marketing/programs, customer-marketing/programs/enrollments, abm/packages, abm/packages/committee, abm/packages/engagement, advocacy/candidates, advocacy/review-requests, advocacy/proof, advocacy/consent, pricing/expansion-offers, pricing/save-offers, pricing/discount-authorizations, agents/readiness}.js` (14 files) | 219-06 | NO (legacy `api/*.js` route modules; no JSX, no rendering) |
| Cron handlers | `api/cron/b2b-{sla-breach-monitor, expansion-signal-scanner, abm-enrichment-refresh, advocacy-signal-scanner, review-request-cadence}.js` (5 files) | 219-06 | NO (cron routes; no JSX) |
| Preflight scripts | `scripts/preconditions/219-{01..06}-check-upstream.cjs` (6 files) | 219-01..219-06 | NO (Node CLI assertion runners) |
| F-ID contract YAMLs | `contracts/F-{228..237}-b2b-*.yaml` (10 files) + `contracts/flow-registry.json` updates | 219-01..219-06 | NO |
| Test fixtures | `test/fixtures/b2b-219/{index.js, revenue-team-config.js, sla-event.js, feedback-record.js, expansion-opportunity.js, customer-marketing-program.js, abm-account-package.js, abm-buying-committee-member.js, advocacy-candidate.js, proof-asset.js, expansion-offer.js, b2b-agent-readiness.js}` (12 files) | 219-01 | NO |
| Test files | `test/b2b-219/{preflight, revenue-team, expansion, abm, advocacy, pricing, agents, api, cron, mcp, rls, closeout, openapi}/*.test.js` | 219-01..219-06 | NO |

**Search assertions** (verified during scope confirmation by direct
read of every `files_modified` block in 219-01..219-06):

| Assertion | Result |
|-----------|--------|
| `files_modified` glob `app/**` across 219-01..219-06 | 0 matches |
| `files_modified` glob `app/(markos)/**` across 219-01..219-06 | 0 matches |
| `files_modified` glob `app/(saas)/**` across 219-01..219-06 | 0 matches |
| `files_modified` glob `app/(b2b)/**` across 219-01..219-06 | 0 matches (P219 architecture-lock forbidden path) |
| `files_modified` glob `app/(growth)/**` across 219-01..219-06 | 0 matches (P219 architecture-lock forbidden path) |
| `files_modified` glob `components/**` across 219-01..219-06 | 0 matches |
| `files_modified` glob `*.stories.tsx` across 219-01..219-06 | 0 matches |
| `files_modified` glob `stories/**` or `.storybook/**` across 219-01..219-06 | 0 matches |
| `files_modified` glob `*.module.css` or `*.css` across 219-01..219-06 | 0 matches |
| `files_modified` containing `page.tsx`, `layout.tsx`, or `route.tsx` | 0 matches |
| `files_modified` containing `route.ts` (219 architecture-lock forbidden string) | 0 matches |
| `files_modified` containing `*.scss`, `*.sass`, `tailwind.config.*`, `app/globals.css`, `app/tokens.css`, `styles/components.css` | 0 matches |
| `files_modified` containing forbidden lib paths `lib/markos/(sales|cdp|conversion|launches|analytics|channels|ecosystem)/` | 0 matches (P226-P227 not yet shipped) |

**Disambiguation note (legacy Node API path syntax):** The 14 files
under `api/v1/b2b/*.js` and the 5 files under `api/cron/b2b-*.js` are
flat versioned legacy `api/*.js` handlers per the 219 architecture-
lock pin (forbidden patterns include `route.ts`,
`app/api/cron/.../route.ts`, `app/(b2b)/`, `app/(growth)/`). They emit
JSON envelopes only; the cron handlers ack with HTTP 200 and emit
`markos_agent_runs` events. Visual rendering of the revenue team
config wizard, SLA monitoring dashboard, marketing-sales feedback
browser, account expansion opportunities queue, customer marketing
program editor, ABM account package browser with EVD-03/04
indicators, ABM buying committee mapper, advocacy candidate queue,
review request dispatch approval modal, proof asset library with
consent indicators, proof publish approval modal, discount
authorization queue, expansion offer approval modal, save offer
approval modal, 9 B2B agents readiness viewer is downstream phases'
responsibility (future P208 admin extensions for 8 new approval
chips, future P217-06 agents-page extension for 9 readiness rows,
future P219+ admin/tenant frontend phases for the 14 listed surfaces,
future P220 growth-mode-gated module surfaces).

**Disambiguation note (existing surfaces NOT modified by 219):** The
operator-cockpit surfaces shipped in P208
(`app/(markos)/operations/{tasks, approvals, recovery,
narrative}/page.tsx`) read 219 outputs as downstream consumers via
the P208 substrate. The P217-06 SaaS dashboard tree
(`app/saas/{layout, page, subscriptions, plans, revenue,
revenue/waterfall, churn, invoices, support, agents}/page.tsx`)
reads 219 outputs but does NOT render new B2B-specific UI in this
phase. The Approval Inbox filter chip set extends from 11 to 19
chips when 219 ships (`expansion_outreach_approval` +
`program_activation_approval` + `abm_outreach_approval` +
`review_request_dispatch_approval` + `proof_publish_approval` +
`discount_authorization_approval` + `expansion_offer_approval` +
`save_offer_approval`); the row rendering for those eight new
handoff_kind literals is deferred to a future P208 admin extension.
The 217-06 agents page extension for 9 P219 B2B readiness rows is
deferred to a future P217-06 admin extension. Phase 219 ships the
substrate; the placeholder dissolutions on those existing surfaces
require future P208 / P217-06 extension phases. **219 itself does
not modify any P208, P209, P212, P213.x, P214, P215, P216, P217, or
P218 file.**

**Conclusion:** No-UI-surface declaration **CONFIRMED**. This phase
is pure B2B revenue substrate authoring + contracts + Node API
handlers + migrations + MCP tools + CI scripts + tests + migration
coordination registry append + 9 B2B agent readiness seed. There are
no visual decisions to specify, no typography choices to lock, no
copywriting copy to draft for end-user surfaces, and no component
primitives to compose. **If the checker finds ANY UI surface in plan
files_modified blocks, BLOCK.**

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
| Form authoring posture | not applicable — no forms (the legacy `api/*.js` POST handlers accept JSON request bodies; the only multipart paths are deferred to future B2B outreach copy editing UIs, ABM committee relationship-graph editor, EVD-06 source-quality scrubber, and proof asset content authoring surfaces) |
| Banner authoring posture | not applicable — no banners |
| Card authoring posture | not applicable — no cards |
| Money / pricing display posture | not applicable — money flows through `expansion_offers.estimated_arr_delta_cents` (bigint cents per 215 inheritance) + `expansion_offers.pricing_recommendation_id` (Pricing Engine FK SOFT) + `expansion_offers.discount_authorization_id` (FK to `discount_authorizations`) + `expansion_offers.discount_pct numeric(5,2)` + `save_offers.pricing_recommendation_id` + `save_offers.discount_authorization_id` + `discount_authorizations.discount_pct numeric(5,2)` (4-DB-trigger pricing compliance pack); rendering of monetary values is downstream phases' responsibility (future P219 admin pricing surfaces render via `<Money fromPricingRecommendation={pr_id} />` recipe per 215-UI-SPEC for `source='pricing_engine'` branch; sentinel chip per 215 sentinel-acceptance pattern for `source='sentinel'` branch; `expansion_offers.offer_copy` + `save_offers.offer_copy` accept either Pricing Engine context OR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel substring). **Phase 219 MUST NOT take pricing ownership.** |
| Table authoring posture | not applicable — registry tables in F-ID contract YAMLs are doctrine prose only; no React tables; the 9-trigger_signal taxonomy + 10-program_type taxonomy + 7-stage taxonomy + 9-platform taxonomy + 9-asset-type taxonomy + 6-discount-type taxonomy + 6-save-type taxonomy ENUMs are CHECK constraints in raw SQL DDL (migrations 108-111) and TS const arrays in `lib/markos/{expansion,abm,advocacy,b2b-pricing}/contracts.ts`; the 9-agent `b2b_growth_agent_readiness` seed is INSERT ON CONFLICT block in migration 107 (or 107_part2.sql) |
| Placeholder posture | `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel is accepted by `fn_expansion_offer_pricing_required` BEFORE-UPDATE clause (`offer_copy LIKE '%MARKOS_PRICING_ENGINE_PENDING%'`) AND `fn_save_offer_pricing_required` (shared exception name `EXPANSION_OFFER_PRICING_REQUIRED` per RESEARCH §Compliance) per CLAUDE.md Pricing Engine Canon; appears verbatim in `test/b2b-219/pricing/sentinel-detection.test.js` + `test/b2b-219/pricing/expansion-offer-pricing-trigger.test.js`; `lib/markos/b2b-pricing/pricing-context-resolver.ts` exports `MARKOS_PRICING_ENGINE_PENDING_SENTINEL = '{{MARKOS_PRICING_ENGINE_PENDING}}'` constant; `resolvePricingContext()` returns `{ source: 'sentinel', sentinel: '{{MARKOS_PRICING_ENGINE_PENDING}}' }` when `pricing_recommendation_id IS NULL` AND P205 missing (Q-4 SOFT P205 fallback); `detectSentinelInOfferCopy({ offer_copy })` returns boolean; never rendered into a UI surface in this phase |
| API handler posture | `api/v1/b2b/*.js` (14 files) are legacy Node `api/*.js` route modules. They emit JSON envelopes (paginated revenue-team-config payloads, 5-event-type SLA event lists, marketing-sales feedback period rollups, paginated account expansion opportunities with 9-trigger-signal evidence + 8-status badges, 10-program-type customer marketing program lists, ABM package lists with EVD-03 inferred-flag indicators + EVD-04 stale-package warnings + EVD-06 source-quality fields, 5-persona buying-committee member lists, 10-event-type ABM engagement timelines, 6-relationship-stage advocacy candidate lists with 5-consent-state badges, 9-platform review-request payloads, 9-asset-type proof asset payloads with 5-status badges + EVD-05 approval payload metadata, 7-consent-type proof consent records, 6-discount-type discount authorization queues with dual-approval-when-`>25%` indicators, 5-offer-type expansion offer payloads with sentinel-or-recommendation flag, 6-save-type save offer payloads with 7-status badges + 215 billing-correction inheritance metadata, 9 B2B agents readiness rows with 4-tier classification + 8-boolean checklist + GENERATED `runnable` flag) and accept POST/PATCH mutations gated by `requireHostedSupabaseAuth` + tenant-scoped supabase client. The cron handlers under `api/cron/b2b-*.js` are gated by `x-markos-cron-secret` matching `MARKOS_B2B_CRON_SECRET` env per `api/cron/webhooks-dlq-purge.js` pattern; `crypto.timingSafeEqual` on token compare. They DO NOT render HTML, JSX, or any visual surface. Each cron handler is registered in dispatcher HANDLERS map (per P226 iter 2 lesson). |
| MCP tool posture | `lib/markos/mcp/tools/b2b.cjs` registers 12 tool descriptors total (9 read-mostly + 3 write-gated) per RESEARCH §6 Domains 1-6 MCP tools sections: read-mostly (`b2b_revenue_team_config_get`, `b2b_mql_sla_status`, `b2b_feedback_record_get`, `b2b_expansion_opportunities_list`, `b2b_customer_marketing_programs_list`, `b2b_abm_packages_list`, `b2b_abm_buying_committee_get`, `b2b_advocacy_candidates_list`, `b2b_proof_assets_list`, `b2b_agents_readiness_get`); write-gated (`b2b_expansion_offer_draft`, `b2b_save_offer_draft` — each routes through `buildApprovalPackage`). Write-gated MCP tools return approval-handoff metadata but DO NOT activate — they surface the approval requirement. MCP tools emit structured JSON; they do NOT render. |
| Doctrine prose posture | `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` (APPEND P219 reservation) and the F-{228..237} contract YAMLs are markdown / YAML only; no rendered components inside. They are read by humans (auditor, planner, executor, P220 future planner) and parsed by CI scripts for forbidden-string and contract-baseline assertions. **Banned-lexicon enforcement applies to all doctrine prose** per CLAUDE.md "Banned lexicon" — zero-match required for `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener). No exclamation points in any doctrine surface. **B2B outreach + advocacy review-request + proof publish + customer marketing program + expansion offer + save offer copy output is also banned-lexicon-checked BEFORE `external.send` / `billing.charge` mutation dispatches the content** — this mirrors the 216-03 support-response banned-lexicon pre-dispatch gate AND 218 InAppCampaign banned-lexicon pre-dispatch gate. The check runs in `lib/markos/expansion/opportunities.ts` `validateOutreachCopyBeforeDispatch()`, `lib/markos/expansion/customer-marketing.ts` `validateProgramCopyBeforeActivation()`, `lib/markos/abm/packages.ts` `validateAbmOutreachBeforeDispatch()`, `lib/markos/advocacy/review-requests.ts` `validateReviewRequestCopyBeforeDispatch()`, `lib/markos/advocacy/proof-assets.ts` `validateProofCopyBeforePublish()`, `lib/markos/b2b-pricing/expansion-offers.ts` `validateOfferCopyBeforeActivation()`, `lib/markos/b2b-pricing/save-offers.ts` `validateSaveOfferCopyBeforePresentation()`; zero-match REQUIRED. |

---

## Spacing / Typography / Color

**Not applicable.** Phase 219 emits no CSS, no JSX, no terminal output
beyond `node --test` format from preflight CLI scripts (the Node API
handlers emit JSON envelopes, not rendered markup; the five crons
write to `markos_agent_runs` and structured logs only). Every spacing,
typography, and color decision is deferred to the downstream phases
that will surface this B2B substrate. When those phases ship, they
MUST cite DESIGN.md v1.1.0 token canon directly:

| Token canon citation chain | DESIGN.md v1.1.0 source |
|----------------------------|--------------------------|
| `--space-{none,xxs,xs,sm,md,lg,xl,xxl}` | `spacing.{none,xxs,xs,sm,md,lg,xl,xxl}` (8px base, on-grid only — 0/2/8/16/24/32/48/96) |
| `--font-mono` (JetBrains Mono) for headings + IDs (`config_id`, `event_id`, `record_id`, `opportunity_id`, `program_id`, `enrollment_id`, `package_id`, `member_id`, `engagement_id`, `candidate_id`, `request_id`, `asset_id`, `consent_id`, `authorization_id`, `offer_id`, `save_offer_id`, `agent_id`, `task_id`, `approval_id`, `agent_run_id`, `pricing_recommendation_id`, `evidence_refs`, `discount_authorization_id`) + monetary code | `typography.h1..h4`, `typography.code-inline` |
| `--font-sans` (Inter) for body + lead + caption | `typography.body-md`, `typography.lead`, `typography.body-sm`, `typography.label-caps` |
| `--color-surface` (`#0A0E14` Kernel Black) page background; `--color-surface-raised` (`#1A1F2A` Process Gray) cards; `--color-surface-overlay` (`#242B38`) modals; `--color-border` (`#2D3441` Border Mist) hairlines; `--color-on-surface` (`#E6EDF3` Terminal White), `--color-on-surface-muted` (`#7B8DA6` Vault Slate), `--color-on-surface-subtle` (`#6B7785` Comment Gray) text; `--color-primary` (`#00D9A3` Protocol Mint) signal; `--color-primary-text` mint-as-text per D-09; `--color-primary-subtle` mint wash; `--color-error` (`#F85149`), `--color-warning` (`#FFB800`), `--color-success` (`#3FB950`), `--color-info` (`#58A6FF`) state colors | `colors.{surface,surface-raised,surface-overlay,border,on-surface,on-surface-muted,on-surface-subtle,primary,primary-text,primary-subtle,error,warning,success,info}` |
| `.c-card`, `.c-button{,--primary,--secondary,--tertiary,--destructive}`, `.c-input`, `.c-field{,__label,__help,__error}`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-modal`, `.c-backdrop`, `.c-status-dot{,--live,--error}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-code-inline`, `.c-code-block` primitives | `styles/components.css` v1.1.0 |
| `--focus-ring-width: 2px` solid `var(--color-primary)` with `--focus-ring-offset: 2px`, never suppressed | `app/tokens.css` lines per DESIGN.md "Focus" |
| `prefers-reduced-motion` collapses transitions to 0ms; kernel-pulse status dot freezes at full opacity | DESIGN.md "Motion" |

Future surfaces consuming 219 substrate MUST honor the **213.4
carry-forward decisions** verbatim (D-08 token-only, D-09
mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature`
reserved, D-14 no `.c-table`, D-15 selective extraction, D-21
server/client boundary). See the six UI binding contracts below for
load-bearing additions specific to 219 surfaces.

---

## 213.4 Carry-Forward Decisions (D-08..D-15) + 217 D-21

| Carry-forward decision | Future-surface enforcement for 219-consuming surfaces |
|-------------------------|------------------------------------------------------|
| **D-08** (token-only) | Every future 219 surface module CSS uses `var(--*)` tokens only — zero hex literals, zero hard-coded `font-size`/`font-weight`/`color`. Architecture-lock test asserts `grep -P '(?<![\w-])#[0-9a-fA-F]{3,8}\b' app/saas/b2b/**/*.module.css` returns 0 in any 219-consuming surface. |
| **D-09** (mint-as-text) | `[ok]` glyph color, action-link inline CTAs ("Activate offer →", "Approve outreach →", "Approve activation →", "Approve dispatch →", "Approve publish →", "Approve authorization →", "Approve presentation →", "Open Approval Inbox →", "View 4-DB-trigger pricing pack status →", "View buying committee map →", "View EVD-03 inferred members →", "View EVD-04 stale packages →", "View 9-trigger-signal evidence →", "View 5-event-type SLA timeline →", "View Tenant 0 proof posture →", "Mark known →", "Revoke consent →", "Recompute health-score signal →"), and `.c-chip-protocol` IDs (`config_id`, `event_id`, `record_id`, `opportunity_id`, `program_id`, `enrollment_id`, `package_id`, `member_id`, `engagement_id`, `candidate_id`, `request_id`, `asset_id`, `consent_id`, `authorization_id`, `offer_id`, `save_offer_id`, `agent_id`, `task_id`, `approval_id`, `agent_run_id`, `pricing_recommendation_id`, `evidence_refs`, `discount_authorization_id`, `account_id`, `contact_id`) use `--color-primary-text`. **Never as fill on surfaces larger than a button or chip** (DESIGN.md mint rule). |
| **D-09b** (`.c-notice` mandatory) | Every gating state in future 219 surfaces (mode-not-eligible-for-abm-module, sla-config-pending-approval, feedback-period-integrity-violation, expansion-outreach-pending-approval, expansion-evidence-refs-empty, program-activation-pending-approval, abm-enrichment-audit-required, abm-external-outreach-pending-approval, abm-stale-package-warning, abm-committee-member-inferred, advocacy-do-not-contact-flag, review-request-pending-approval, proof-publish-pending-approval, proof-consent-not-given, proof-evidence-refs-empty, proof-consent-revoked-cascade, t0-04-tenant-zero-proof-posture-violation, expansion-offer-pricing-required, expansion-offer-sentinel-active, save-offer-pricing-required, save-offer-sentinel-active, discount-authorization-pending-approval, discount-dual-approval-required-when-pct-gt-25, expansion-discount-requires-authorization, b2b-agent-not-runnable, future_phase_219_b2b_admin_ui-placeholder, future_phase_219_revenue_team_ui-placeholder, future_phase_219_advocacy_ui-placeholder, future_phase_219_approval_inbox_extensions-placeholder, future_phase_219_agents_page_extension-placeholder, future_phase_220_referral_console-placeholder) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes. |
| **D-13** (`.c-card--feature` reserved) | **Forbidden in any 219-consuming surface.** Revenue team config wizard rows, SLA event timeline rows, feedback record rows, expansion opportunities rows, customer marketing program rows, ABM package rows, ABM committee member rows, ABM engagement event rows, advocacy candidate rows, review request rows, proof asset rows, proof consent rows, discount authorization rows, expansion offer rows, save offer rows, B2B agent readiness rows ALL use `.c-card` default. The `.c-card--feature` variant remains reserved for hero panels in 404-workspace + 213.5 marketing only. |
| **D-14** (no `.c-table` primitive) | Future 219 revenue team config list, SLA event timeline list, feedback record list, expansion opportunities list, customer marketing program list, ABM package list with EVD-03 indicators, ABM committee member list, ABM engagement event list, advocacy candidate list, review request list, proof asset list, proof consent list, discount authorization list, expansion offer list, save offer list, B2B agent readiness list ALL use vanilla `<table>` semantic + token-only recipe on `<th>`/`<td>` + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred. |
| **D-15** (selective extraction) | Future 219-consuming components extract to `components/markos/tenant/` or `components/markos/admin/` only when reuse is proven across ≥2 surfaces. Recommended extracted components (when downstream phases ship): `<RevenueSalesModelBadge />` (reused by revenue team config wizard + Approval Inbox row + Morning Brief), `<SlaEventTypeBadge />` (reused by SLA timeline + Approval Inbox row + LOOP-06 evidence panel), `<ExpansionTriggerSignalChip />` (reused by expansion opportunities queue + outreach approval modal + signal scanner cron run viewer; renders 9-trigger-signal taxonomy verbatim), `<ExpansionStatusBadge />` (reused by expansion list + activation approval modal + cron event log; renders 8-status ENUM), `<CustomerMarketingProgramTypeChip />` (reused by program list + activation approval modal; renders 10-program-type taxonomy verbatim), `<AbmTierBadge />` (reused by ABM list + package detail + Morning Brief), `<AbmStageBadge />` (reused by ABM list + outreach approval modal; renders 7-stage ENUM), `<EvdInferredFlag />` (reused by ABM committee mapper + outreach approval modal + Approval Inbox row; renders EVD-03 `[info] Inferred` indicator + EVD-04 `[warn] Stale package` indicator + EVD-06 source-quality fields chip row), `<AbmPersonaBadge />` (reused by committee mapper + member detail; renders 5-persona ENUM), `<AdvocacyRelationshipStageBadge />` (reused by candidate queue + ask approval modal; renders 6-relationship-stage ENUM), `<AdvocacyConsentStateBadge />` (reused by candidate queue + proof asset library + consent revocation viewer; renders 5-consent-state ENUM), `<ReviewRequestPlatformChip />` (reused by review request list + dispatch approval modal; renders 9-platform ENUM), `<ProofAssetTypeBadge />` (reused by proof library + publish approval modal; renders 9-asset-type ENUM), `<ProofAssetStatusBadge />` (reused by proof library + publish approval modal; renders 5-status ENUM), `<TenantZeroProofPostureIndicator />` (reused by proof library + publish approval modal + 213-04 public-proof boundary surface; renders T0-04 invariant), `<DiscountTypeBadge />` (reused by discount authorization queue + expansion offer detail + save offer detail; renders 6-discount-type ENUM), `<DualApprovalThresholdIndicator />` (reused by discount authorization queue + expansion offer activation modal + save offer presentation modal; renders `discount_pct > 25` dual-approval requirement per 206 mutation-class default_approval_mode), `<PricingContextChip />` (reused by expansion offer + save offer + discount authorization across all approval modals; renders sentinel-or-recommendation badge per 215 sentinel-acceptance pattern + 4-DB-trigger pricing compliance pack status), `<SaveOfferTypeBadge />` (reused by save offer list + presentation approval modal; renders 6-save-type ENUM), `<B2bAgentReadinessBadge />` (reused by 217-06 agents page + per-agent detail view + Morning Brief; mirrors `<PlgAgentReadinessBadge />` recipe from 218 with `B2B_AGENT_TIERS = ['EXP','ABM','REV','IAM']` 4-tier classification badge). |
| **D-21** (server/client boundary; 217 carry) | Every future 219 admin / tenant surface MUST be a default server component reading via `requireHostedSupabaseAuth(request)` + tenant-scoped supabase client (per 217-06 D-21 contract). Client components opt in via `'use client'` only for interactive primitives — `<BuyingCommitteeRelationshipGraphEditor />` (interactive editor on `abm_buying_committee_members` graph), `<EvdSourceQualityScrubber />` (interactive scrubber on `strategic_signals_jsonb.source_quality numeric 0-1`), `<DiscountPctAuthorizationInput />` (operator threshold tuning UI with dual-approval-when-`>25%` warning), `<FrequencyConsentRevocationViewer />` (interactive cascade-preview UI on `proof_consent_records.consent_revoked_at` setting), `<ExpansionTriggerSignalFilterChips />` (interactive 9-chip filter row on expansion opportunities queue), `<AdvocacyRelationshipStageFilterChips />` (interactive 6-chip filter row on advocacy candidate queue), `<SlaTimelineScrubber />` (interactive 5-event-type SLA event timeline scrubber). Architecture-lock test asserts no `'use client'` in any non-listed file under `app/saas/b2b/`. |

---

## Future-Surface UI Binding Contract 1: Revenue Team Config

**Load-bearing for future P219 admin/tenant frontend phases that
surface revenue team configuration, SLA monitoring, and marketing-
sales feedback.** Every future surface that renders a revenue team
config (`revenue_team_configs` row from 219-01 migration 107) MUST
honor this binding contract verbatim.

### `sales_model` ENUM Binding (4 values)

The `revenue_team_configs.sales_model` column has exactly 4 values
(canon: `lib/markos/revenue-team/contracts.ts` `REVENUE_SALES_MODELS
= ['self_serve_only','sales_assisted','enterprise_sales','hybrid']`).
Render as `<.c-chip>` with verbatim literal:

| `sales_model` | Chip variant | Future copy |
|---------------|--------------|-------------|
| `self_serve_only` | `<.c-chip>` | `Self-serve only` |
| `sales_assisted` | `<.c-chip>` | `Sales assisted` |
| `enterprise_sales` | `<.c-chip>` | `Enterprise sales` |
| `hybrid` | `<.c-chip>` | `Hybrid` |

### `feedback_cadence` ENUM Binding (2 values)

The `revenue_team_configs.feedback_cadence` column has exactly 2
values (canon: `REVENUE_FEEDBACK_CADENCES = ['weekly','bi_weekly']`).
Render as `<.c-chip>` with verbatim literal: `Weekly` / `Bi-weekly`.

### `attribution_model` ENUM Binding (7 values)

The `revenue_team_configs.attribution_model` column has exactly 7
values (canon: `REVENUE_ATTRIBUTION_MODELS = ['last_touch','first_touch',
'linear','time_decay','u_shaped','w_shaped','custom']`). Render as
`<.c-chip>` with verbatim literal.

### SLA Configuration Surface Binding

The future revenue team config wizard renders `mql_to_sql_sla_hours`
(int CHECK > 0) as a numeric input with operator-approval gating.
The `fn_revenue_team_sla_requires_approval` BEFORE-UPDATE DB-trigger
raises EXCEPTION `SLA_CONFIG_REQUIRES_APPROVAL` when
`NEW.mql_to_sql_sla_hours != OLD.mql_to_sql_sla_hours AND
NEW.approved_at IS NULL`. The future surface MUST visually surface
this approval gate state:

| SLA-config approval state | Notice variant | Verbatim copy |
|---------------------------|----------------|---------------|
| New SLA hours selected, approval pending | `<.c-notice c-notice--warning>` | `[warn] SLA hours change pending approval. Current: {OLD.mql_to_sql_sla_hours}h. New: {NEW.mql_to_sql_sla_hours}h. → Open Approval Inbox` |
| SLA hours approved | `<.c-notice c-notice--success>` | `[ok] SLA configuration updated. Marketing-sales SLA: {mql_to_sql_sla_hours}h on {approved_at}.` |
| SLA hours rejected | `<.c-notice c-notice--error>` | `[err] SLA hours change rejected. Reverting to {OLD.mql_to_sql_sla_hours}h. Reason: {rejection_reason}.` |

### 5-Event-Type SLA Timeline Surface Binding

The `lead_qualification_sla_events.event_type` column has exactly 5
values (canon: `REVENUE_SLA_EVENT_TYPES = ['mql_raised','sql_accepted',
'sql_rejected','mql_sla_breach','mql_sla_warn']`). Each value MUST
render as `<.c-badge>` with the exact mapping below, AND the future
surface MUST chronologically display events in `<.c-card>` rows
(NEVER `.c-card--feature` per D-13):

| `event_type` | Badge variant | Bracketed glyph | Future copy |
|--------------|---------------|-----------------|-------------|
| `mql_raised` | `<.c-badge--info>` | `[info]` | `[info] MQL raised at {created_at}` |
| `sql_accepted` | `<.c-badge--success>` | `[ok]` | `[ok] SQL accepted at {created_at}` |
| `sql_rejected` | `<.c-badge--error>` | `[err]` | `[err] SQL rejected: {rejection_reason}` |
| `mql_sla_warn` | `<.c-badge--warning>` | `[warn]` | `[warn] MQL approaching SLA breach (12h remaining of {mql_to_sql_sla_hours}h)` |
| `mql_sla_breach` | `<.c-badge--error>` | `[err]` | `[err] MQL SLA breached. Aging: {age_hours}h. Task created: {task_created_id}` |

### LOOP-06 Marketing-To-Pipeline Evidence Panel

When `mql_sla_breach` fires, the `lead_qualification_sla_events.task_created_id`
links to a task that the future surface MUST surface as a clickable
chip with `<.c-chip-protocol>` styling for `task_created_id`. The
LOOP-06 invariant requires this evidence linkage be visible — the
future SLA timeline surface MUST render `[ok] Marketing→pipeline
evidence linked` as `<.c-notice c-notice--success>` when at least
one `mql_sla_breach` event has non-null `task_created_id`. If
`task_created_id IS NULL` for any breach event, render `[err]
LOOP-06 evidence missing` as `<.c-notice c-notice--error>`.

### Marketing-Sales Feedback Period Browser

The `marketing_sales_feedback_records.period_start < period_end`
integrity check is enforced by `fn_feedback_period_integrity`
BEFORE-INSERT DB-trigger. The future feedback record browser MUST
render each period as `<.c-card>` with metrics
(`mql_acceptance_rate`, `rejection_reasons` text[],
`pipeline_coverage`, `attribution_breakdown_jsonb`,
`recommendations` text[]) AND a `<.c-button c-button--primary>`
"Dispatch feedback record →" CTA that calls
`buildApprovalPackage(kind='marketing_sales_feedback_dispatch')`. The
`approval_id` chip with `<.c-chip-protocol>` styling MUST be visible
on every dispatched record.

---

## Future-Surface UI Binding Contract 2: Account Expansion + Customer Marketing

**Load-bearing for future P219 admin/tenant frontend phases that
surface account expansion opportunities and customer marketing
program management.** Every future surface that renders an
`account_expansion_opportunities` row OR `customer_marketing_programs`
row from 219-02 migration 108 MUST honor this binding contract
verbatim.

### 9-Trigger-Signal Taxonomy Verbatim (Account Expansion)

The `account_expansion_opportunities.trigger_signal` column has
exactly 9 values (canon: `lib/markos/expansion/contracts.ts`
`EXPANSION_TRIGGER_SIGNALS = 9 values`). The future expansion
opportunities queue MUST render each value as a `<.c-chip>` filter
chip in a horizontal row, AND each opportunity row MUST show the
detected trigger signal as a `<.c-badge>`:

| `trigger_signal` | Filter chip + badge variant | Future copy |
|------------------|------------------------------|-------------|
| `usage_growth` | `<.c-chip>` filter / `<.c-badge--info>` row | `Usage growth (MRR uptick / feature breadth >0.5)` |
| `seat_pressure` | `<.c-chip>` filter / `<.c-badge--warning>` row | `Seat pressure (seat utilization >80%)` |
| `champion_role_change` | `<.c-chip>` filter / `<.c-badge--info>` row | `Champion role change (LinkedIn signal)` |
| `company_growth_news` | `<.c-chip>` filter / `<.c-badge--info>` row | `Company growth news (funding / hiring)` |
| `contract_renewal` | `<.c-chip>` filter / `<.c-badge--warning>` row | `Contract renewal (60-day lookahead)` |
| `qbr_upcoming` | `<.c-chip>` filter / `<.c-badge--info>` row | `QBR upcoming (calendar trigger)` |
| `budget_cycle` | `<.c-chip>` filter / `<.c-badge--info>` row | `Budget cycle (fiscal year-end)` |
| `pql_signal` | `<.c-chip>` filter / `<.c-badge--success>` row | `PQL signal (218 hot_pql consumed)` |
| `health_score_high` | `<.c-chip>` filter / `<.c-badge--success>` row | `Health score high (216 saas_health_scores ≥85)` |

The verbatim taxonomy is enforced by the migration 108 CHECK
constraint AND the `EXPANSION_TRIGGER_SIGNALS` const array AND the
`AccountExpansionOpportunitySchema` zod schema. Future surfaces
MUST NOT substitute, reorder, or localize these literals.

### 8-Status ENUM Binding (Account Expansion)

The `account_expansion_opportunities.status` column has exactly 8
values (canon: `EXPANSION_OPPORTUNITY_STATUSES = 8 values`). Render
as `<.c-badge>` with verbatim literal:

| `status` | Badge variant | Bracketed glyph | Future copy |
|----------|---------------|-----------------|-------------|
| `identified` | `<.c-badge>` muted | `[—]` | `[—] Identified` |
| `warming` | `<.c-badge--info>` | `[info]` | `[info] Warming` |
| `outreach_pending` | `<.c-badge--warning>` | `[warn]` | `[warn] Outreach pending approval` |
| `outreach_sent` | `<.c-badge--info>` | `[info]` | `[info] Outreach sent` |
| `meeting_booked` | `<.c-badge--success>` | `[ok]` | `[ok] Meeting booked` |
| `closed_won` | `<.c-badge--success>` | `[ok]` | `[ok] Closed won` |
| `closed_lost` | `<.c-badge--error>` | `[err]` | `[err] Closed lost` |
| `deferred` | `<.c-badge>` muted | `[—]` | `[—] Deferred` |

### 5-Expansion-Type ENUM Binding

The `account_expansion_opportunities.expansion_type` column has
exactly 5 values (canon: `EXPANSION_TYPES = ['seat_expansion',
'plan_upgrade','add_on_adoption','annual_conversion','custom']`).
Render as `<.c-chip>` with verbatim literal.

### Outreach Approval Modal Binding (Reuse 215 Billing-Correction Pattern)

When `outreach_pending → outreach_sent` transition fires,
`fn_expansion_outreach_requires_approval` BEFORE-UPDATE DB-trigger
raises EXCEPTION `EXPANSION_OUTREACH_REQUIRES_APPROVAL` unless
`approval_id NOT NULL`. The future approval modal MUST reuse the
215 billing-correction modal recipe (same `<.c-modal>` + `<.c-backdrop>`
+ approval CTA layout) and render:

- `<.c-chip-protocol>` for `opportunity_id` + `account_id` + `tenant_id`
- `<ExpansionTriggerSignalChip />` from the taxonomy mapping above (9 verbatim values)
- `<ExpansionStatusBadge />` from the status mapping above (current status: `outreach_pending`)
- `<.c-chip>` for `expansion_type` from the type mapping above
- `<.c-code-block>` for `outreach_message` (banned-lexicon-checked before render; see Banned-Lexicon Enforcement section)
- `<EvidenceMapPanel evidence_refs={evidence_refs} />` (209-UI-SPEC inheritance — `evidence_refs uuid[] NOT NULL` non-empty asserted at app-layer BEFORE buildApprovalPackage; if empty, render `<.c-notice c-notice--error>` `[err] Evidence required: at least one evidence_map_records FK before outreach can be sent.`)
- `<.c-button c-button--primary>` "Approve outreach →" (mint-as-text per D-09)
- `<.c-button c-button--tertiary>` "Reject (request changes)"

### Customer Marketing Program: 10-Program-Type Taxonomy Verbatim

The `customer_marketing_programs.program_type` column has exactly 10
values (canon: `lib/markos/expansion/contracts.ts`
`CUSTOMER_MARKETING_PROGRAM_TYPES = 10 values`). The future program
list MUST render each value as a `<.c-chip>` filter chip AND each
program row MUST show its program_type as a `<.c-badge>`:

| `program_type` | Filter chip + badge variant | Future copy |
|----------------|------------------------------|-------------|
| `customer_success_sequence` | `<.c-chip>` / `<.c-badge>` | `Customer success sequence` |
| `expansion_campaign` | `<.c-chip>` / `<.c-badge--info>` | `Expansion campaign` |
| `advocacy_recruitment` | `<.c-chip>` / `<.c-badge>` | `Advocacy recruitment` |
| `referral_program` | `<.c-chip>` / `<.c-badge>` | `Referral program` |
| `beta_program` | `<.c-chip>` / `<.c-badge>` | `Beta program` |
| `customer_advisory_board` | `<.c-chip>` / `<.c-badge>` | `Customer advisory board` |
| `community_champion` | `<.c-chip>` / `<.c-badge>` | `Community champion` |
| `case_study_pipeline` | `<.c-chip>` / `<.c-badge>` | `Case study pipeline` |
| `review_generation` | `<.c-chip>` / `<.c-badge>` | `Review generation` |
| `co_marketing` | `<.c-chip>` / `<.c-badge>` | `Co-marketing` |

### Program Activation Gate Surface Binding

When `draft → active` transition fires,
`fn_program_activation_requires_approval` BEFORE-UPDATE DB-trigger
raises EXCEPTION `PROGRAM_ACTIVATION_REQUIRES_APPROVAL` unless
`approved_at NOT NULL`. The future activation modal MUST render via
`buildApprovalPackage(kind='customer_marketing_program_activation')`
and surface:

| Activation gate state | Notice variant | Verbatim copy |
|------------------------|----------------|---------------|
| Program activation pending approval | `<.c-notice c-notice--warning>` | `[warn] Program activation pending approval. → Open Approval Inbox` |
| Program activation approved | `<.c-notice c-notice--success>` | `[ok] Program activated on {approved_at}. Enrolled count: {enrolled_count}.` |
| Program activation rejected | `<.c-notice c-notice--error>` | `[err] Program activation rejected. Reason: {rejection_reason}.` |

### Banned-Lexicon Enforcement Surface Binding

The `account_expansion_opportunities.outreach_message` +
`customer_marketing_programs.goal` fields are banned-lexicon-checked
by `lib/markos/expansion/opportunities.ts`
`validateOutreachCopyBeforeDispatch()` AND
`lib/markos/expansion/customer-marketing.ts`
`validateProgramCopyBeforeActivation()` BEFORE the
`buildApprovalPackage` call returns. The future approval modal MUST
render banned-lexicon match results as `<.c-notice c-notice--error>`
with verbatim copy: `[err] Outreach copy contains banned phrase:
'{phrase}'. Edit copy to remove. Banned phrases: synergy, leverage,
empower, unlock, transform, revolutionize, supercharge, holistic,
seamless, cutting-edge, innovative, game-changer, next-generation,
world-class, best-in-class, reimagine, disrupt, just (as softener).
No exclamation points.` Approval CTA MUST be disabled when
banned-lexicon match count > 0.

---

## Future-Surface UI Binding Contract 3: ABM Account Package + Buying Committee + EVD-03/04/06

**Load-bearing for future P219 admin/tenant frontend phases that
surface ABM account package management, buying committee mapping,
and EVD-03/04/06 evidence discipline.** Every future surface that
renders an `abm_account_packages` row OR `abm_buying_committee_members`
row OR `abm_engagement_events` row from 219-03 migration 109 MUST
honor this binding contract verbatim.

### 7-Stage ENUM Binding (`abm_account_packages.stage`)

The `abm_account_packages.stage` column has exactly 7 values (canon:
`lib/markos/abm/contracts.ts` `ABM_STAGES = 7 values`). Render as
`<.c-badge>` with verbatim literal:

| `stage` | Badge variant | Bracketed glyph | Future copy |
|---------|---------------|-----------------|-------------|
| `identified` | `<.c-badge>` muted | `[—]` | `[—] Identified` |
| `aware` | `<.c-badge--info>` | `[info]` | `[info] Aware` |
| `engaged` | `<.c-badge--info>` | `[info]` | `[info] Engaged` |
| `meeting_booked` | `<.c-badge--success>` | `[ok]` | `[ok] Meeting booked` |
| `opportunity` | `<.c-badge--success>` | `[ok]` | `[ok] Opportunity` |
| `customer` | `<.c-badge--success>` | `[ok]` | `[ok] Customer` |
| `expansion_target` | `<.c-badge--info>` | `[info]` | `[info] Expansion target` |

### 3-Tier ENUM Binding (`abm_account_packages.abm_tier`)

The `abm_account_packages.abm_tier` column has exactly 3 values
(canon: `ABM_TIERS = [1, 2, 3]`). Render as `<.c-chip>` with
verbatim literal:

| `abm_tier` | Chip variant | Future copy |
|------------|--------------|-------------|
| `1` | `<.c-chip c-chip--mint>` | `Tier 1` (most strategic; mint-as-text per D-09) |
| `2` | `<.c-chip>` | `Tier 2` |
| `3` | `<.c-chip>` muted | `Tier 3` |

### EVD-03 Inferred-Member Labeling Surface Binding

The `abm_buying_committee_members.is_inferred bool` column auto-sets
to TRUE when `addCommitteeMember()` is called with `known_to_us=false`
per `lib/markos/abm/buying-committee.ts` (EVD-03 enforcement). The
future ABM committee mapper MUST visually distinguish inferred
members:

| Member state | Badge variant + glyph | Future copy |
|--------------|------------------------|-------------|
| `is_inferred=true` | `<.c-badge--info>` | `[info] Inferred member — review required` |
| `is_inferred=false` AND `known_to_us=true` | `<.c-badge--success>` | `[ok] Known member` |
| `is_inferred=false` AND `known_to_us=false` (impossible per app-layer) | `<.c-badge--error>` | `[err] Data integrity error — escalate` |

The `getInferredMembers()` helper returns committee members where
`is_inferred=true`; the future surface MUST surface this list as an
operator review queue at `app/saas/b2b/abm/[id]/committee/inferred/page.tsx`
(future) with `<.c-button c-button--primary>` "Mark known →" CTA per
row that calls `markKnown({ member_id, last_interaction_at })`
flipping both `known_to_us=true` AND `is_inferred=false`.

### EVD-04 Stale-Package Detection Surface Binding

The `lib/markos/abm/enrichment.ts` `listStalePackages({ tenant_id,
max_age_days = 90 })` helper returns packages where `enriched_at <
now() - max_age_days`. The `isStale(package)` helper returns
boolean. The future ABM package browser MUST surface stale packages
with:

| Package staleness | Notice variant | Verbatim copy |
|--------------------|----------------|---------------|
| `enriched_at` within 90 days | `<.c-notice c-notice--success>` (subtle row indicator) | `[ok] Enriched {days_ago} days ago` |
| `enriched_at` > 90 days ago | `<.c-notice c-notice--warning>` | `[warn] Stale package — last enriched {days_ago} days ago. Re-enrichment task available. → Recompute` |
| `enriched_at IS NULL` | `<.c-notice c-notice--error>` | `[err] Package never enriched. Initial enrichment required.` |

### EVD-06 Source-Quality Fields Chip Row

The `abm_account_packages.strategic_signals_jsonb` AND
`abm_account_packages.company_profile_jsonb` columns embed EVD-06
source-quality fields per zod `AbmAccountPackageSchema` (canon:
`lib/markos/abm/contracts.ts`). Each signal renders as a `<.c-chip>`
with the four EVD-06 fields visible:

| Field | Chip render |
|-------|-------------|
| `source_quality numeric(0-1)` | `<.c-chip>` with bracketed value `[source_quality: 0.85]` |
| `extraction_method text` | `<.c-chip>` with verbatim string `[method: research_engine]` |
| `extracted_at timestamptz` | `<.c-chip>` with relative timestamp `[extracted: 3 days ago]` |
| `compliance_posture text` | `<.c-chip>` with verbatim string `[posture: tier_1_verified]` |

If any of the 4 fields is null/missing, render the chip as muted
variant with `[—]` glyph and copy `EVD-06 field missing — escalate`.

### Enrichment Audit Required DB-Trigger Surface Binding

The `fn_abm_enrichment_audit_required` BEFORE-UPDATE DB-trigger
raises EXCEPTION `ABM_ENRICHMENT_AUDIT_REQUIRED` when
`NEW.enriched_at IS NOT NULL AND NEW.enriched_at IS DISTINCT FROM
OLD.enriched_at AND NEW.enrichment_source NOT IN ('manual',
'operator')`. The future enrichment surface MUST render the audit
requirement as `<.c-notice c-notice--info>` BEFORE invoking the
non-manual enrichment source:

| Enrichment source | Audit requirement |
|-------------------|---------------------|
| `manual` | No audit required (`<.c-notice c-notice--info>` `[info] Manual enrichment — no audit row required.`) |
| `operator` | No audit required (same notice variant) |
| `research_engine` | Audit required (`<.c-notice c-notice--warning>` `[warn] Research engine enrichment — audit row will be written. Confirm to proceed.`) |
| `intent_data_import` | Audit required (same notice variant) |

### External Outreach Approval Gate Surface Binding

When `stage` transitions to `meeting_booked` OR `opportunity`,
`fn_abm_external_outreach_requires_approval` raises EXCEPTION
`ABM_EXTERNAL_OUTREACH_REQUIRES_APPROVAL` unless `approved_at NOT
NULL`. The future approval modal MUST render via
`buildApprovalPackage(kind='abm_external_outreach')` and surface:

- `<.c-chip-protocol>` for `package_id` + `account_id` + `tenant_id`
- `<AbmTierBadge tier={abm_tier} />` (3-tier ENUM)
- `<AbmStageBadge stage={stage} />` (7-stage ENUM; current stage requires approval)
- EVD-03 inferred-flag indicators on every committee member listed
- EVD-04 stale-package warning if package is stale
- EVD-06 source-quality fields chip row
- `<.c-button c-button--primary>` "Approve outreach →"
- `<.c-button c-button--tertiary>` "Reject (request changes)"

### Module Eligibility Surface Binding (b2b/plg_b2b ONLY)

The `module_mode_eligibility` 60-row seed from P218 enforces that
the `abm_engine` module is eligible for `b2b` AND `plg_b2b` modes
ONLY (not `b2c`/`plg_b2c`/`b2b2c`). The future ABM module surface
MUST render `<.c-notice c-notice--error>` if the tenant's
`saas_growth_profiles.mode` is not in the eligible set:

| Tenant mode | Surface state |
|-------------|---------------|
| `b2b` OR `plg_b2b` | ABM module accessible (`<.c-notice c-notice--success>` `[ok] ABM module enabled for {mode} mode.`) |
| `b2c` OR `plg_b2c` OR `b2b2c` | ABM module blocked (`<.c-notice c-notice--error>` `[err] ABM module not eligible for {mode} mode. Eligible modes: b2b, plg_b2b. Change growth profile mode to access this module.`) |

---

## Future-Surface UI Binding Contract 4: Advocacy + Review Request + Proof + T0-04

**Load-bearing for future P219 tenant frontend phases that surface
advocacy candidate management, review-request dispatch, proof asset
publishing, consent revocation cascade, and T0-04 Tenant 0 proof
posture invariant.** Every future surface that renders
`advocacy_candidates`, `advocacy_review_requests`, `proof_assets`,
or `proof_consent_records` row from 219-04 migration 110 MUST honor
this binding contract verbatim.

### 6-Relationship-Stage ENUM Binding

The `advocacy_candidates.relationship_stage` column has exactly 6
values (canon: `lib/markos/advocacy/contracts.ts`
`ADVOCACY_RELATIONSHIP_STAGES = 6 values`). Render as `<.c-badge>`
with verbatim literal:

| `relationship_stage` | Badge variant | Bracketed glyph | Future copy |
|----------------------|---------------|-----------------|-------------|
| `identified` | `<.c-badge>` muted | `[—]` | `[—] Identified` |
| `warming` | `<.c-badge--info>` | `[info]` | `[info] Warming` |
| `warm` | `<.c-badge--info>` | `[info]` | `[info] Warm` |
| `asked` | `<.c-badge--warning>` | `[warn]` | `[warn] Asked` |
| `committed` | `<.c-badge--success>` | `[ok]` | `[ok] Committed` |
| `advocate` | `<.c-badge--success>` | `[ok]` | `[ok] Advocate` |

### 5-Consent-State ENUM Binding

The `advocacy_candidates.consent_state` column has exactly 5 values
(canon: `ADVOCACY_CONSENT_STATES = 5 values`). Render as `<.c-badge>`
with verbatim literal:

| `consent_state` | Badge variant | Bracketed glyph | Future copy |
|------------------|---------------|-----------------|-------------|
| `not_requested` | `<.c-badge>` muted | `[—]` | `[—] Consent not requested` |
| `requested` | `<.c-badge--info>` | `[info]` | `[info] Consent requested` |
| `given` | `<.c-badge--success>` | `[ok]` | `[ok] Consent given` |
| `declined` | `<.c-badge--error>` | `[err]` | `[err] Consent declined` |
| `revoked` | `<.c-badge--error>` | `[err]` | `[err] Consent revoked` |

### 9-Platform Review Request Binding

The `advocacy_review_requests.platform` column has exactly 9 values
(canon: `ADVOCACY_PLATFORMS = ['g2','capterra','trustpilot',
'app_store','google_play','product_hunt','getapp','software_advice',
'custom']`). Render as `<.c-chip>` with verbatim literal in
`<ReviewRequestPlatformChip />`.

### Review Request Dispatch Approval Modal Binding

When `dispatchReviewRequest()` fires,
`fn_advocacy_review_request_requires_approval` BEFORE-UPDATE
DB-trigger raises EXCEPTION `REVIEW_REQUEST_REQUIRES_APPROVAL`
unless `approval_id NOT NULL`. The future approval modal MUST render
via `buildApprovalPackage(kind='advocacy_review_request_dispatch')`
and surface:

- `<.c-chip-protocol>` for `request_id` + `candidate_id` + `tenant_id`
- `<AdvocacyRelationshipStageBadge stage={candidate.relationship_stage} />`
- `<AdvocacyConsentStateBadge state={candidate.consent_state} />` (MUST be `given` per app-layer assertContactable check)
- `<ReviewRequestPlatformChip platform={platform} />` (9-platform ENUM)
- `<.c-chip>` for `ask_type` (4-ask-type ENUM)
- `<.c-code-block>` for `message_preview` (banned-lexicon-checked before render)
- `<.c-button c-button--primary>` "Approve dispatch →"
- `<.c-button c-button--tertiary>` "Reject (request changes)"

If `candidate.do_not_contact=true` OR `candidate.consent_state !=
'given'`, render `<.c-notice c-notice--error>` BEFORE the approval
CTAs:

| Pre-flight check | Notice variant | Verbatim copy |
|-------------------|----------------|---------------|
| `do_not_contact=true` | `<.c-notice c-notice--error>` | `[err] Candidate flagged do_not_contact. Review request blocked.` |
| `consent_state != 'given'` | `<.c-notice c-notice--error>` | `[err] Candidate consent_state is '{consent_state}'. Review request blocked. Required: 'given'.` |

### Proof Publish Approval Modal Binding (EVD-05 Payload)

When `publishProofAsset()` fires,
`fn_proof_publish_requires_consent_and_evidence` BEFORE-UPDATE
DB-trigger raises EXCEPTION `PROOF_REQUIRES_CONSENT_AND_EVIDENCE`
unless `privacy_approved=true AND array_length(evidence_refs, 1) >
0`. The future approval modal MUST render via
`buildApprovalPackage(kind='advocacy_proof_publish')` with the
EVD-05 approval payload shape:

```json
{
  "kind": "advocacy_proof_publish",
  "payload": {
    "asset_id": "uuid",
    "evidence_refs": ["evidence_map_records UUID array"],
    "consent_state": "given",
    "privacy_approved": true,
    "assumptions": ["text array of inferred claims"],
    "claim_risk": "low | medium | high"
  }
}
```

The future modal MUST visually surface ALL 6 EVD-05 fields:

- `<.c-chip-protocol>` for `asset_id`
- `<EvidenceMapPanel evidence_refs={evidence_refs} />` (209-UI-SPEC inheritance — non-empty array required)
- `<AdvocacyConsentStateBadge state={consent_state} />` (MUST be `given`)
- `<.c-chip c-chip--mint>` `[ok] Privacy approved` (when `privacy_approved=true`) OR `<.c-chip>` `[err] Privacy NOT approved` (when false)
- `<.c-card>` with `<.c-chip>` row per assumption — operator must review each before approval
- `<.c-badge--{success|warning|error}>` for `claim_risk` (`low`=success, `medium`=warning, `high`=error)
- `<.c-button c-button--primary>` "Approve publish →" (DISABLED if any of the 6 fields invalid; HTML `disabled` attribute, not just visually muted)
- `<.c-button c-button--tertiary>` "Reject (request changes)"

### T0-04 Tenant 0 Proof Posture Invariant Surface Binding

The `tenant_zero_proof_posture` SQL view from 219-04 migration 110
exposes the 3-condition T0-04 invariant verbatim:

1. `proof_consent_records.consent_given=true AND consent_revoked_at
   IS NULL` (consent currently valid for at least one consent_type)
2. `proof_assets.approved_at IS NOT NULL` (operator-approved)
3. `array_length(proof_assets.evidence_refs, 1) > 0` (sourced)

The future T0-04 indicator surface (`<TenantZeroProofPostureIndicator
/>` extracted component) MUST render at the top of every Tenant 0
proof asset detail view AND every public-proof boundary surface:

| T0-04 invariant state | Notice variant | Verbatim copy |
|------------------------|----------------|---------------|
| All 3 conditions true | `<.c-notice c-notice--success>` | `[ok] Tenant 0 proof posture: 3/3 conditions met. Public use authorized.` |
| 2/3 conditions true | `<.c-notice c-notice--warning>` | `[warn] Tenant 0 proof posture: 2/3 conditions met. Missing: {condition}. Public use blocked.` |
| 1/3 conditions true | `<.c-notice c-notice--error>` | `[err] Tenant 0 proof posture: 1/3 conditions met. Missing: {conditions}. Public use blocked.` |
| 0/3 conditions true | `<.c-notice c-notice--error>` | `[err] Tenant 0 proof posture invariant violated. Public use prohibited per 213-04 boundary.` |

The 213-04 public-proof boundary on advocacy `proof_assets` is
DISSOLVED at the substrate-layer by 219-04, but UI-layer enforcement
on T0-04 is mandatory in every future proof asset surface.

### Consent Revocation Cascade Surface Binding

The `lib/markos/advocacy/consent.ts` `revokeConsent({ consent_id })`
helper sets `consent_revoked_at` AND atomically transitions ALL
linked `proof_assets.status='archived'` (transactional cascade). The
future consent revocation viewer MUST surface this cascade
preview:

| Cascade preview state | Notice variant | Verbatim copy |
|------------------------|----------------|---------------|
| Revoke consent button hovered | `<.c-notice c-notice--warning>` | `[warn] Revoking consent will archive {N} linked proof_assets. This action is irreversible. Confirm to proceed.` |
| Revocation in progress | `<.c-notice c-notice--info>` | `[info] Revoking consent. {N} proof_assets transitioning to archived.` |
| Revocation complete | `<.c-notice c-notice--success>` | `[ok] Consent revoked. {N} proof_assets archived. Audit row written: {audit_id}.` |

The cascade preview MUST list each affected `proof_asset` as a
`<.c-card>` row with `<.c-chip-protocol>` for `asset_id` + current
`<ProofAssetStatusBadge />`.

### 9-Asset-Type ENUM Binding

The `proof_assets.asset_type` column has exactly 9 values (canon:
`PROOF_ASSET_TYPES = 9 values`). Render as `<.c-chip>` with verbatim
literal in `<ProofAssetTypeBadge />`.

### 5-Status ENUM Binding (Proof Assets)

The `proof_assets.status` column has exactly 5 values (canon:
`PROOF_ASSET_STATUSES = 5 values`). Render as `<.c-badge>` with
verbatim literal: `draft`, `pending_approval`, `approved`,
`published`, `archived`.

---

## Future-Surface UI Binding Contract 5: B2B Pricing — Expansion + Save + Discount + Sentinel

**Load-bearing for future P219 admin/tenant frontend phases that
surface B2B pricing controls, discount authorization, expansion
offers, and save offers with the 4-DB-trigger compliance pack.**
Every future surface that renders `discount_authorizations`,
`expansion_offers`, or `save_offers` row from 219-05 migration 111
MUST honor this binding contract verbatim.

### 4-DB-Trigger Pricing Compliance Pack Surface Binding

The 4 DB-triggers MUST be visually surfaced in every B2B pricing
surface as a `<.c-card>` "Compliance pack status" panel showing all
4 trigger states:

| DB-trigger | Trigger condition | Notice variant when ACTIVE |
|------------|-------------------|---------------------------|
| `fn_expansion_offer_pricing_required` | `EXPANSION_OFFER_PRICING_REQUIRED` raises when `status='active' AND pricing_recommendation_id IS NULL AND offer_copy NOT LIKE '%MARKOS_PRICING_ENGINE_PENDING%'` | `<.c-notice c-notice--error>` `[err] Expansion offer activation blocked: pricing context required. Link a pricing recommendation OR include `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel in offer_copy.` |
| `fn_save_offer_pricing_required` | `EXPANSION_OFFER_PRICING_REQUIRED` (shared exception name per RESEARCH §Compliance) raises when activation conditions identical to expansion offer | `<.c-notice c-notice--error>` `[err] Save offer presentation blocked: pricing context required.` |
| `fn_discount_requires_approval` | `DISCOUNT_REQUIRES_APPROVAL` raises BEFORE-INSERT when `approved_at IS NULL OR approved_by IS NULL` | `<.c-notice c-notice--error>` `[err] Discount authorization blocked: approved_at + approved_by both required on insert.` |
| `fn_expansion_discount_requires_authorization` | `DISCOUNT_REQUIRES_AUTHORIZATION` raises BEFORE-INSERT when `discount_pct > 0 AND discount_authorization_id IS NULL` | `<.c-notice c-notice--error>` `[err] Expansion discount blocked: link a discount_authorization_id OR set discount_pct=0.` |

The 4-DB-trigger compliance pack panel renders ALL 4 trigger states
as `<.c-card>` rows with `<.c-status-dot--{live|error}>` indicator;
green-on-mint when not active (compliant), red-on-error when active
(blocked).

### Sentinel Discipline Surface Binding (`{{MARKOS_PRICING_ENGINE_PENDING}}`)

The `lib/markos/b2b-pricing/pricing-context-resolver.ts`
`resolvePricingContext()` returns either:

```json
// source='pricing_engine' branch
{ "source": "pricing_engine", "recommendation": { "id", "headline", "justification", "evidence_quality", "extraction_method", "generated_at", "compliance_posture" } }

// source='sentinel' branch (Q-4 SOFT P205 fallback)
{ "source": "sentinel", "sentinel": "{{MARKOS_PRICING_ENGINE_PENDING}}" }
```

The future `<PricingContextChip />` extracted component MUST render
both branches with the exact mapping below:

| `source` | Chip variant | Bracketed glyph | Future copy |
|----------|--------------|-----------------|-------------|
| `pricing_engine` | `<.c-chip c-chip--mint>` | `[ok]` | `[ok] Pricing Engine: {recommendation.headline}` (mint-as-text per D-09; clickable to open recommendation detail) |
| `sentinel` | `<.c-chip>` muted with warning border | `[warn]` | `[warn] Pricing Engine sentinel active ({{MARKOS_PRICING_ENGINE_PENDING}}). Review pricing copy when P205 lands.` |

The future surfaces MUST NEVER author tier-name OR dollar literals
directly into `expansion_offers.offer_copy` OR `save_offers.offer_copy`
— ONLY the Pricing Engine recommendation OR the sentinel. The
`detectSentinelInOfferCopy({ offer_copy })` boolean MUST be
visualized as a chip indicator on every offer detail row.

### 5-Offer-Type ENUM Binding (Expansion Offers)

The `expansion_offers.offer_type` column has exactly 5 values
(canon: `lib/markos/b2b-pricing/contracts.ts`
`B2B_EXPANSION_OFFER_TYPES = ['seat_upgrade','plan_upgrade','add_on',
'annual_conversion','usage_expansion']`). Render as `<.c-chip>` with
verbatim literal.

### 8-Status ENUM Binding (Expansion Offers)

The `expansion_offers.status` column has exactly 8 values (canon:
`B2B_EXPANSION_OFFER_STATUSES = ['draft','pending_approval','approved',
'active','expired','accepted','declined']`). Render as `<.c-badge>`
with verbatim literal:

| `status` | Badge variant | Bracketed glyph | Future copy |
|----------|---------------|-----------------|-------------|
| `draft` | `<.c-badge>` muted | `[—]` | `[—] Draft` |
| `pending_approval` | `<.c-badge--warning>` | `[warn]` | `[warn] Pending approval` |
| `approved` | `<.c-badge--info>` | `[info]` | `[info] Approved (not yet active)` |
| `active` | `<.c-badge--success>` | `[ok]` | `[ok] Active` |
| `expired` | `<.c-badge>` muted | `[—]` | `[—] Expired` |
| `accepted` | `<.c-badge--success>` | `[ok]` | `[ok] Accepted` |
| `declined` | `<.c-badge--error>` | `[err]` | `[err] Declined` |

(8th value reserved per CHECK constraint — verify final value list at
checker time against migration 111 SQL.)

### 6-Save-Type ENUM Binding (Save Offers)

The `save_offers.save_type` column has exactly 6 values (canon:
`B2B_SAVE_TYPES = ['temporary_discount','plan_downgrade_alternative',
'pause_subscription','feature_unlock_trial','cs_callback_offer',
'annual_conversion_incentive']`). Render as `<.c-chip>` with verbatim
literal in `<SaveOfferTypeBadge />`.

### 7-Status ENUM Binding (Save Offers)

The `save_offers.status` column has exactly 7 values (canon:
`B2B_SAVE_OFFER_STATUSES`). Render as `<.c-badge>` with verbatim
literal: `draft`, `pending_approval`, `presented`, `accepted`,
`declined`, `expired`, `archived`.

### 6-Discount-Type ENUM Binding (Discount Authorizations)

The `discount_authorizations.discount_type` column has exactly 6
values (canon: `B2B_DISCOUNT_TYPES`). Render as `<.c-chip>` with
verbatim literal in `<DiscountTypeBadge />`.

### Dual-Approval Threshold Surface Binding (`discount_pct > 25`)

Per 206 mutation-class `default_approval_mode == dual_approval` for
`discount_authorization_approval` when `discount_pct > 25` (high-
discount threshold per Pricing Engine Canon dual-approval pattern).
The future discount authorization queue MUST render the dual-
approval requirement:

| `discount_pct` value | Approval mode | Surface render |
|----------------------|---------------|----------------|
| `discount_pct ≤ 25` | `single_approval` | `<.c-chip>` `Single approval` (default) |
| `discount_pct > 25` | `dual_approval` | `<.c-chip c-chip--mint>` `[warn] Dual approval required` (mint-as-text per D-09; warning glyph) |

The `<DualApprovalThresholdIndicator pct={discount_pct} />`
extracted component renders this state in the discount authorization
queue, expansion offer activation modal (when `discount_pct > 0`
inherited from FK to `discount_authorizations`), AND save offer
presentation modal (same FK inheritance).

### Save Offer Presentation Modal Binding (Reuse 215 Billing-Correction Modal)

When `presentSaveOffer()` fires,
`buildApprovalPackage(kind='save_offer_presentation')` is called.
The future approval modal MUST reuse the 215 billing-correction
modal recipe verbatim — same `<.c-modal>` + `<.c-backdrop>` + approval
CTA layout + same evidence-pack panel pattern. The save offer
presentation modal renders:

- `<.c-chip-protocol>` for `save_offer_id` + `account_id` + `subscription_id` (FK to `tenant_billing_subscriptions` per 215 inheritance)
- `<SaveOfferTypeBadge type={save_type} />` (6-save-type ENUM)
- `<PricingContextChip context={resolved_pricing_context} />` (sentinel-or-recommendation per 215 sentinel-acceptance pattern)
- `<DualApprovalThresholdIndicator pct={discount_pct} />` (when `discount_pct > 0`)
- `<.c-code-block>` for `offer_copy` (banned-lexicon-checked + sentinel-detection-checked before render)
- `<.c-button c-button--primary>` "Approve presentation →"
- `<.c-button c-button--tertiary>` "Reject"

### Expansion Offer Activation Modal Binding (Pricing-Defense Composite)

When `activateExpansionOffer()` fires,
`buildApprovalPackage(kind='expansion_offer_activation')` is called.
The future modal MUST render:

- `<.c-chip-protocol>` for `offer_id` + `opportunity_id` (FK to `account_expansion_opportunities` from 219-02) + `tenant_id`
- `<.c-chip>` for `offer_type` (5-offer-type ENUM)
- `<.c-badge>` `[bigint cents: {estimated_arr_delta_cents}]` (per 215 monetary-storage doctrine)
- `<PricingContextChip />` (sentinel-or-recommendation; 4-DB-trigger pricing compliance pack status visible)
- `<DualApprovalThresholdIndicator pct={discount_pct} />` (when `discount_pct > 0`; FK to `discount_authorizations`)
- `<.c-code-block>` for `offer_copy` (banned-lexicon-checked)
- 4-DB-trigger compliance pack panel showing all 4 trigger states
- `<.c-button c-button--primary>` "Approve activation →"
- `<.c-button c-button--tertiary>` "Reject"

### Banned-Lexicon Enforcement Surface Binding (B2B Pricing)

The `expansion_offers.offer_copy` + `save_offers.offer_copy` fields
are banned-lexicon-checked by
`lib/markos/b2b-pricing/expansion-offers.ts`
`validateOfferCopyBeforeActivation()` AND
`lib/markos/b2b-pricing/save-offers.ts`
`validateSaveOfferCopyBeforePresentation()` BEFORE the
`buildApprovalPackage` call returns. Sentinel-detection runs in
parallel; if sentinel present, banned-lexicon check skips that
substring (the sentinel itself is not banned). Approval CTA MUST be
disabled when banned-lexicon match count > 0.

---

## Future-Surface UI Binding Contract 6: 9 B2B Agents Readiness Registry

**Load-bearing for future P217-06 `app/saas/agents/page.tsx`
extension that surfaces 9 P219 B2B agents readiness rows.** Every
future surface that renders a `b2b_growth_agent_readiness` row from
219-06 migration 107 (or 107_part2.sql) MUST honor this binding
contract verbatim. Mirrors 218 `<PlgAgentReadinessBadge />` pattern.

### 9 Verbatim B2B Agent IDs

The 9 P219 B2B agents pre-populated `runnable=false` per
`b2b_growth_agent_readiness` INSERT ON CONFLICT seed (canon: 219-06
Plan must_haves):

| Agent ID | Tier | Domain | `blocking_phase` |
|----------|------|--------|--------------------|
| `MARKOS-AGT-EXP-01` | `EXP` | Account expansion signal scanner | (none — runnable when 8 booleans true) |
| `MARKOS-AGT-EXP-02` | `EXP` | Expansion outreach drafter | (none) |
| `MARKOS-AGT-EXP-03` | `EXP` | Customer marketing program orchestrator | (none) |
| `MARKOS-AGT-ABM-01` | `ABM` | ABM account package researcher | (none) |
| `MARKOS-AGT-ABM-02` | `ABM` | ABM buying committee mapper | (none) |
| `MARKOS-AGT-ABM-03` | `ABM` | ABM engagement event ingester | (none) |
| `MARKOS-AGT-REV-01` | `REV` | SLA breach monitor + LOOP-06 evidence | (none) |
| `MARKOS-AGT-REV-02` | `REV` | Marketing-sales feedback dispatcher | (none) |
| `MARKOS-AGT-IAM-01` | `IAM` | Identity-aware module router (cross-phase) | `P218-06-CONFIRM` (cross-phase visibility row; flagged as IAM owned by P218 per RESEARCH §6 Domain 6) |

### 4-Tier ENUM Binding (`B2B_AGENT_TIERS`)

The `B2B_AGENT_TIERS = ['EXP','ABM','REV','IAM']` constant is the
canonical 4-tier classification (canon:
`lib/markos/b2b-agents/contracts.ts`). Render as `<.c-chip>` with
verbatim literal:

| `tier` | Chip variant | Future copy |
|--------|--------------|-------------|
| `EXP` | `<.c-chip>` | `EXP — Account expansion` |
| `ABM` | `<.c-chip>` | `ABM — Account-based marketing` |
| `REV` | `<.c-chip>` | `REV — Revenue alignment` |
| `IAM` | `<.c-chip>` muted | `IAM — Identity-aware (cross-phase)` |

### 8-Boolean Readiness Checklist Surface Binding

The `b2b_growth_agent_readiness` schema includes 8 boolean readiness
flags (canon: 219-06 Plan must_haves verbatim):

1. `contracts_assigned` (F-ID contract YAML linked)
2. `cost_estimated` (token cost + dollar cost estimate)
3. `approval_posture_defined` (`buildApprovalPackage` kind verified)
4. `tests_implemented` (≥1 `.test.js` covering agent path)
5. `api_surface_defined` (≥1 `api/v1/b2b/*.js` handler)
6. `mcp_surface_defined` (≥1 MCP tool descriptor in `b2b.cjs`)
7. `ui_surface_defined` (NOT YET DEFINED — UI surface deferred to future P219+ admin frontend phase)
8. `failure_behavior_defined` (degradation + retry policy specified)

The future per-agent detail view MUST render all 8 booleans as a
checklist with each row as `<.c-card>` containing:

| Boolean state | Glyph + badge + copy |
|---------------|----------------------|
| `true` | `<.c-badge--success>` `[ok]` + verbatim flag name + `<.c-chip-protocol>` evidence ref |
| `false` | `<.c-badge>` muted `[—]` + verbatim flag name + `<.c-button c-button--tertiary>` `Set ready` (operator path) |

### GENERATED `runnable` Column Surface Binding

The `runnable` column is GENERATED ALWAYS AS (`contracts_assigned
AND cost_estimated AND approval_posture_defined AND tests_implemented
AND api_surface_defined AND mcp_surface_defined AND ui_surface_defined
AND failure_behavior_defined`) STORED. It cannot be set directly.
The future per-agent detail view MUST render the `runnable` flag as
`<B2bAgentReadinessBadge />`:

| `runnable` state | Badge variant | Bracketed glyph | Future copy |
|-------------------|---------------|-----------------|-------------|
| `false` (any of 8 booleans false) | `<.c-badge--error>` | `[block]` | `[block] Agent not yet runnable. {N} of 8 readiness criteria pending.` |
| `true` (all 8 booleans true) | `<.c-badge--success>` | `[ok]` | `[ok] Agent ready. All 8 readiness criteria met.` |

### Activation Gate DB-Trigger Surface Binding

The `fn_b2b_agent_activation_gate` BEFORE-UPDATE DB-trigger raises
EXCEPTION `AGENT_ACTIVATION_REQUIRES_READINESS` when `NEW.runnable=true
AND (NEW.activation_approval_id IS NULL OR NEW.readiness_check_id IS
NULL)`. Only operator-approved + ready agents can flip `runnable=true`
via app code path. The future activation surface MUST render:

| Activation state | Notice variant | Verbatim copy |
|-------------------|----------------|---------------|
| All 8 booleans true, activation pending | `<.c-notice c-notice--warning>` | `[warn] Agent ready. Activation pending operator approval. → Open Approval Inbox` |
| Activation approved | `<.c-notice c-notice--success>` | `[ok] Agent activated on {activation_approval_at}. Runnable: true.` |
| Activation rejected | `<.c-notice c-notice--error>` | `[err] Agent activation rejected. Runnable: false. Reason: {rejection_reason}.` |

The Plan 06 `checkpoint:human-action` for first-run agent activation
(operator validates first-batch readiness criteria before unattended
cron permits ongoing activations) is surfaced in the agents page
extension as a `<.c-notice c-notice--info>` `[info] First-run
activation checkpoint: operator confirmation required for first
{N} agents` row.

### IAM-01 Cross-Phase Blocking Indicator

`MARKOS-AGT-IAM-01` is included in the P219 readiness registry for
cross-phase visibility, but its `blocking_phase='P218-06-CONFIRM'`
field marks it as P218-owned. The future agents page extension MUST
render this row with:

- `<.c-chip>` muted `IAM — Identity-aware (cross-phase)` (4-tier ENUM badge)
- `<.c-badge--info>` `[info] Cross-phase row — owned by P218`
- `<.c-chip-protocol>` for `blocking_phase='P218-06-CONFIRM'`
- `<.c-button c-button--tertiary disabled>` `Activation deferred — P218 owns`

The `runnable` flag for IAM-01 MAY be true (if P218 ships before
P219 closeout) — but the row's `blocking_phase` indicator is
permanent visibility metadata.

---

## Banned-Lexicon Enforcement (Doctrine Prose + Outreach + Advocacy + Proof + Pricing Copy)

Per CLAUDE.md "Banned lexicon" rule, all 219 doctrine prose AND all
B2B outreach + advocacy review-request + proof publish + customer
marketing program + expansion offer + save offer copy fields are
banned-lexicon-checked. **Zero-match REQUIRED** for the following
17 phrases:

`synergy`, `leverage`, `empower`, `unlock`, `transform`,
`revolutionize`, `supercharge`, `holistic`, `seamless`,
`cutting-edge`, `innovative`, `game-changer`, `next-generation`,
`world-class`, `best-in-class`, `reimagine`, `disrupt`, `just`
(as softener)

**No exclamation points** in any product / outreach / advocacy /
proof / pricing surface copy.

The check runs in 7 lib helper functions BEFORE every
`buildApprovalPackage` call dispatching to `external.send` OR
`billing.charge`:

| Lib helper | Field validated | Mutation class |
|------------|-----------------|----------------|
| `lib/markos/expansion/opportunities.ts` `validateOutreachCopyBeforeDispatch()` | `account_expansion_opportunities.outreach_message` | `external.send` |
| `lib/markos/expansion/customer-marketing.ts` `validateProgramCopyBeforeActivation()` | `customer_marketing_programs.goal` | `external.send` |
| `lib/markos/abm/packages.ts` `validateAbmOutreachBeforeDispatch()` | `abm_account_packages.messaging_jsonb.outreach_text` | `external.send` |
| `lib/markos/advocacy/review-requests.ts` `validateReviewRequestCopyBeforeDispatch()` | `advocacy_review_requests.message_preview` | `external.send` |
| `lib/markos/advocacy/proof-assets.ts` `validateProofCopyBeforePublish()` | `proof_assets.title` + `proof_assets.content_draft` | `external.send` |
| `lib/markos/b2b-pricing/expansion-offers.ts` `validateOfferCopyBeforeActivation()` | `expansion_offers.offer_copy` (sentinel substring excluded from check) | `billing.charge` |
| `lib/markos/b2b-pricing/save-offers.ts` `validateSaveOfferCopyBeforePresentation()` | `save_offers.offer_copy` (sentinel substring excluded from check) | `billing.charge` |

**Future approval modals MUST disable the approval CTA when
banned-lexicon match count > 0.** The match results render as
`<.c-notice c-notice--error>` with verbatim copy: `[err] Copy
contains banned phrase: '{phrase}'. Edit copy to remove. Banned
phrases: {17-phrase list}. No exclamation points.`

This mirrors the 216-03 support-response banned-lexicon pre-dispatch
gate AND the 218 InAppCampaign + UpgradeTrigger pre-dispatch gates.
Pre-dispatch enforcement is the canonical 219 pattern — 219 ships
outreach + advocacy + proof + pricing copy fields, and zero-match
must be enforced BEFORE any `external.send` OR `billing.charge`
mutation dispatches the content.

---

## Sentinel Discipline Carry (`{{MARKOS_PRICING_ENGINE_PENDING}}`)

Per CLAUDE.md placeholder rule + 215-UI-SPEC sentinel-acceptance
pattern + 219-05 Q-4 SOFT P205 fallback, the
`{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel is the canonical
substitution for any pricing copy field where Pricing Engine context
is not yet available:

- `expansion_offers.offer_copy` (5-clause `EXPANSION_OFFER_PRICING_REQUIRED` DB-trigger accepts sentinel substring)
- `save_offers.offer_copy` (4-clause `EXPANSION_OFFER_PRICING_REQUIRED` shared-error DB-trigger accepts sentinel)
- Discount authorization metadata (when `pricing_recommendation_id IS NULL` at insert time — sentinel signals deferred Pricing Engine integration)

The `lib/markos/b2b-pricing/pricing-context-resolver.ts`
`resolvePricingContext()` runtime helper returns either:

```typescript
// source='pricing_engine' branch (P205 landed)
{ source: 'pricing_engine', recommendation: { id, headline, justification, evidence_quality, extraction_method, generated_at, compliance_posture } }

// source='sentinel' branch (Q-4 SOFT P205 fallback)
{ source: 'sentinel', sentinel: '{{MARKOS_PRICING_ENGINE_PENDING}}' }
```

The `MARKOS_PRICING_ENGINE_PENDING_SENTINEL` constant is exported
from `pricing-context-resolver.ts`. The `detectSentinelInOfferCopy({
offer_copy })` boolean helper enables the `<PricingContextChip />`
extracted component to render either branch deterministically.

**Phase 219 MUST NOT take pricing ownership.** The sentinel is the
escape hatch until P205 lands. When P205 lands, future surfaces
migrate from sentinel to recommendation by linking
`pricing_recommendation_id`; the sentinel substring is removed from
`offer_copy` and replaced with Pricing Engine recommendation prose.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | not applicable — no UI surface authored in this phase | not required |
| Third-party registries | not applicable | not required |

No registry vetting required because no UI components are composed
in this phase. Registry safety is deferred to the future P219+ admin
/ tenant frontend phases that compose the 6 future-surface UI binding
contracts above.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (no copy authored; banned-lexicon enforcement contract documented for downstream)
- [ ] Dimension 2 Visuals: PASS (no visuals authored; DESIGN.md v1.1.0 token canon citation chain documented)
- [ ] Dimension 3 Color: PASS (no color decisions; mint-as-text + 213.4 D-08 carry-forward documented)
- [ ] Dimension 4 Typography: PASS (no typography decisions; JetBrains Mono + Inter documented for downstream)
- [ ] Dimension 5 Spacing: PASS (no spacing decisions; 8-point on-grid documented for downstream)
- [ ] Dimension 6 Registry Safety: PASS (no registry usage; not applicable)

**Approval:** pending (gsd-ui-checker upgrades to `approved` after
verifying scope declaration matches `files_modified` blocks across
219-01..219-06)
