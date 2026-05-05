---
phase: 220
slug: saas-community-events-pr-partnership-devrel-growth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 220 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` (matches P204 D-49 / P221 D-36 / P226 D-82 architecture-lock) |
| **Config file** | none — uses Node built-in test runner |
| **Quick run command** | `npm test -- test/growth-220/preflight/` |
| **Full suite command** | `npm test -- test/growth-220/ test/api-contracts/220-*` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- test/growth-220/<domain>/<task>.test.js`
- **After every plan wave:** Run `npm test -- test/growth-220/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map (will populate during planning)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 220-01-00 | 01 | 1 | QA-01,02 | preflight | `npm test -- test/growth-220/preflight/` | ❌ W0 | ⬜ pending |
| 220-01-01 | 01 | 1 | SG-04,11,12 | schema | `npm test -- test/growth-220/referral/` | ❌ W0 | ⬜ pending |
| 220-02-01 | 02 | 2 | SG-06,09 | schema | `npm test -- test/growth-220/community/` | ❌ W0 | ⬜ pending |
| 220-03-01 | 03 | 2 | SG-06, LOOP-06,08 | schema | `npm test -- test/growth-220/events/` | ❌ W0 | ⬜ pending |
| 220-04-01 | 04 | 3 | SG-06, EVD-01..06 | schema | `npm test -- test/growth-220/pr/` | ❌ W0 | ⬜ pending |
| 220-05-01 | 05 | 3 | SG-06,11,12 | schema | `npm test -- test/growth-220/partners/` | ❌ W0 | ⬜ pending |
| 220-06-01 | 06 | 4 | SG-10, API-01, MCP-01 | api+mcp | `npm test -- test/api-contracts/220-* test/growth-220/mcp/` | ❌ W0 | ⬜ pending |
| 220-06-1b | 06 | 4 | SG-07 | schema+seed | `npm test -- test/growth-220/agents-readiness/sg-07-experimentation-classification.test.js` | ❌ W0 | ⬜ pending |
| 220-06-02 | 06 | 4 | RUN-01..08, QA-03..15 | closeout | `npm test -- test/growth-220/closeout/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

Detailed per-task map populates during planning iteration; planner expands rows per Plan task.

---

## Wave 0 Requirements

- [ ] `scripts/preconditions/220-check-upstream.cjs` — assertUpstreamReady CLI for P214/P215/P218 (hard) + P205/P207-212/P216/P217/P219 (soft)
- [ ] `lib/markos/growth/preflight/upstream-gate.ts` — runtime helper
- [ ] `lib/markos/growth/preflight/architecture-lock.ts` — forbidden-pattern detector
- [ ] `lib/markos/growth/preflight/errors.ts` — UpstreamPhaseNotLandedError
- [ ] `test/growth-220/preflight/architecture-lock.test.js`
- [ ] `test/growth-220/preflight/upstream-gate.test.js`
- [ ] `test/growth-220/preflight/helper-presence.test.js` — verifies buildApprovalPackage/requireHostedSupabaseAuth/resolvePlugin exist; createApprovalPackage/requireSupabaseAuth/lookupPlugin DO NOT
- [ ] Test fixtures under `test/fixtures/growth-220/*.js` (NOT `.ts` per architecture-lock)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator review of fraud signals (referral payout) | SG-04, SG-11 | Anti-fraud judgment requires human; cannot automate decision boundary | Operator reviews `fraud_review_queue` entries; approves/rejects via approval inbox |
| Public PR claim evidence freshness | SG-06, EVD-01..06 | Evidence freshness in journalistic context requires editorial judgment | Operator reviews stale evidence claims via P208 approval inbox before public dispatch |
| First-batch drift (community moderation) | SG-06, SG-09 | Community moderation thresholds need operator validation | Plan 06 Task X `checkpoint:human-action` — operator validates first batch of moderation actions before unattended cron |
| Affiliate fraud thresholds | SG-04, SG-11, SG-12 | Cross-tenant fraud detection requires human cross-check before payout | Operator reviews fraud_signals via approval inbox before payout export |

---

## Validation Architecture (carry from RESEARCH.md)

Source: `220-RESEARCH.md` §Validation Architecture (Wave 0 surface; all tests are gaps)

**Per-domain test strategy:**
- **Domain 1 (Referral/Viral):** unit (RLS, schema, fraud evaluators), integration (DB-trigger payout single-writer), regression (P204 backwards-compat)
- **Domain 2 (Community):** unit (RLS, signal classifier), integration (Slack/Discord webhook handlers — replay-safe), regression
- **Domain 3 (Events):** unit (schema, attribution evaluators), integration (Eventbrite/Lu.ma webhook handlers), regression
- **Domain 4 (PR):** unit (RLS, evidence FK constraint), integration (G2/Capterra webhook handlers), regression
- **Domain 5 (Partners + Devrel):** unit (RLS, payout DB-trigger), integration (P215 billing/payout hooks), regression
- **Domain 6 (Growth API + MCP + UI + Agent readiness):** unit (cross-tenant isolation), integration (MCP tool registration .cjs), regression (P204 backwards-compat); checkpoint:human-action for first-run agent activation

**Architecture-lock regression:** `test/growth-220/preflight/architecture-lock.test.js` runs FIRST in every wave; scans 220-*-PLAN.md bodies for forbidden patterns (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient, lookupPlugin, public/openapi.json, app/(public), app/(markos), api/v1/.../route.ts, vitest run, from 'vitest', .test.ts, "stub if missing", "if exists"). Test fails wave if any positive invocation found.

---

## Dimensions Coverage (Nyquist 8 dimensions per RESEARCH §Validation Architecture)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | All 24 IDs (SG-04/06/07/09-12 + API-01 + MCP-01 + QA-01..15) mapped to plans during planning iteration |
| 2. Anti-shallow execution | DRAFT | Every task has `<read_first>` + grep/test-verifiable `<acceptance_criteria>` + concrete `<action>` per planning iteration |
| 3. Architecture-lock | LOCKED | Plan 01 Task 0.5 forbidden-pattern detector + helper-presence + assertUpstreamReady |
| 4. Compliance enforcement | LOCKED | DB-trigger compliance gates per domain (referral payout single-writer, affiliate commission immutability, evidence FK constraint, etc.) |
| 5. Cross-phase coordination | DRAFT | P220 → P227 ALTER TABLE additive specified (5 SaaS-mode tables); Q-1 + Q-3 collisions resolved during planning |
| 6. Single-writer / DB-trigger enforcement | LOCKED | Per RESEARCH §Compliance enforcement boundary |
| 7. Test runner pinned | LOCKED | Node `--test` + `node:assert/strict`; NO vitest/playwright |
| 8. Validation strategy (this doc) | DRAFT | Will be filled during planning iteration |

---

---

## UI-SPEC AC Coverage Map (220-UI-SPEC fold — light fold; no-UI variant)

> Per orchestrator UI-SPEC fold directive (2026-05-04). 220-UI-SPEC.md (no-UI-scope variant) folded into 6 plans. Plan-by-plan backend doctrine ACs + 6 future-surface UI binding contracts + cross-cutting carry-forward. END OF v4.1.0 SaaS Suite Activation milestone UI-SPEC sweep.

### Plan-to-UI-SPEC binding map

| Plan | UI-SPEC §UI Binding | Backend doctrine ACs added | NEW handoff_kind chips | Sentinel carry | Banned-lexicon validator placement |
|------|---------------------|----------------------------|------------------------|----------------|------------------------------------|
| 220-01 | §UI Binding 1 — Referral | 2 DB-triggers (fn_referral_reward_requires_approval + fn_referral_program_requires_pricing_context); 5-rule fraud-evaluator verbatim; reward-issuance buildApprovalPackage kind='referral_reward_issuance' (billing P215 HARD wired); 215 billing-correction modal recipe REUSED | 0 (referral_reward_issuance predates 220 expansion) | YES — referral_programs.reward_description sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` | lib/markos/referral/reward-issuance.ts BEFORE buildApprovalPackage call (mutation-class billing.charge) |
| 220-02 | §UI Binding 2 — Community | 1 DB-trigger (fn_community_action_moderation_gate); 8-value signal_kind ENUM verbatim; Pitfall 5 dedup UNIQUE INDEX + ON CONFLICT DO NOTHING; consumed_at + consumed_by_phase fan-out tracking | 1 — `community_moderation_approval` (20th literal) | NO | lib/markos/community/moderation-approvals.ts BEFORE buildApprovalPackage call (mutation-class external.send) |
| 220-03 | §UI Binding 3 — Event Marketing | 1 DB-trigger (fn_event_promoting_requires_approval); 9-window reminder schedule verbatim; Pitfall 6 buffer (never dispatch when scheduled_at < now - 1h); EventPromotionPlan auto-generation per doc 17 line 996-1048; SOFT_UPSTREAM graceful degrade against P222 + P225 | 1 — `event_promotion_approval` (21st literal) | NO | lib/markos/events/approval-gates.ts + lib/markos/events/reminders.ts BEFORE buildApprovalPackage / dispatchPendingReminders (mutation-class external.send) |
| 220-04 | §UI Binding 4 — PR-Analyst-Review | 3 DB-triggers (fn_pr_outreach_requires_approval + fn_pr_pitch_requires_evidence Pitfall 3 EVD-02 + fn_review_request_g2_pricing_context Pitfall 4 SG-11); LLM sentiment classifier; Pitfall 3 evidence-binding cardinality + Q-5 SOFT FK upgrade once P209 ships; 213-04 public-proof boundary applied | 2 — `pr_pitch_approval` (22nd literal) + `g2_review_pricing_approval` (23rd literal) | YES — review_requests pricing-profile-sync sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` | lib/markos/pr/outreach.ts + lib/markos/pr/reviews.ts BEFORE buildApprovalPackage call (mutation-class external.send) |
| 220-05 | §UI Binding 5 — Partnership-Affiliate-Developer | 4 DB-triggers (fn_partnership_activation_requires_approval + fn_affiliate_program_requires_pricing_context SG-11 + fn_affiliate_program_prohibited_methods_required + fn_affiliate_commission_immutability); prohibited-methods 3 strings verbatim (paid_search_brand_terms / email_spam / trademark_misuse); Pitfall 8 pricing-drift detector; commission-immutability post-lock; Pitfall 2 fix (billing P215 HARD wired); 5 ALTERable tables WITHOUT ecosystem columns | 3 — `partnership_activation_approval` (24th literal) + `affiliate_commission_issuance_approval` (25th literal — billing P215 HARD wired) + `partner_payout_export_approval` (26th literal — billing P215 HARD wired + dual_approval > $1,000) | YES — affiliate_programs.commission_rate_jsonb + developer_content.body sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` | lib/markos/partnerships/payout-compliance.ts + lib/markos/partnerships/developer-marketing.ts BEFORE buildApprovalPackage / billing.charge dispatch (mutation-class external.send / billing.charge / data.export) |
| 220-06 | §UI Binding 6 — 28 Growth Agents Readiness | 1 DB-trigger (fn_growth_agent_activation_gate); 7-tier P220-relevant verbatim (P220_AGENT_TIERS); 8-boolean readiness checklist verbatim; SG-10 GENERATED runnable column (Pitfall 9); SG-07 experimentation_kind ENUM 6 values verbatim; ON CONFLICT DO UPDATE seed (Pitfall 12); 19 API + 6 cron + 12 read MCP + 3 write-gated MCP tools registered in HANDLERS map; checkpoint:human-action for first-run agent activation | 0 (Plan 06 is closeout — no NEW handoff_kind; END-OF-v4.1.0 chip total = 26 verified) | NO (system-level registry) | n/a (no external mutation; system-level registry) |

### Backend doctrine assertions (12 DB-triggers + 7 NEW handoff_kinds + sentinel + 8-value taxonomy + 9-window schedule + 28 agents + 7-tier + 8-boolean + prohibited-methods + 5 ALTERable + Pitfall 6 buffer + 11 banned-lexicon validators)

| # | Assertion | Source | Verified by |
|---|-----------|--------|-------------|
| 1 | 12 DB-trigger names verbatim across migrations 90-95 + 97 (referral×2 + community×1 + events×1 + PR×3 + partnerships×4 + agents×1 = 12) | UI-SPEC §UI Bindings 1-6 | grep gates per plan `<acceptance_criteria_additions>`; psql pg_trigger count |
| 2 | 7 NEW handoff_kind literals (20th-26th in P208 canonical chain): community_moderation_approval / event_promotion_approval / pr_pitch_approval / g2_review_pricing_approval / partnership_activation_approval / affiliate_commission_issuance_approval / partner_payout_export_approval | UI-SPEC §Copywriting Contract rows 20-26 | grep gates in 220-02/03/04/05 fold blocks |
| 3 | Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` carry on referral / PR / partnerships / developer marketing surfaces (4 of 6 plans cite — 220-01 + 220-04 + 220-05) | UI-SPEC §Sentinel Discipline Carry rows 1-4 | grep gates in 220-01/04/05 fold blocks |
| 4 | 8-value signal_kind taxonomy verbatim (active_member_signal / feature_confusion_signal / competitor_mention_signal / content_gap_signal / advocacy_candidate_signal / churn_risk_signal / feature_request_signal / review_signal) | UI-SPEC §UI Binding 2 §8-value signal_kind filter chips row | 220-02 fold block grep gate |
| 5 | 9-window reminder schedule verbatim (T-28d / T-21d / T-14d / T-7d / T-2d / T-1d / T-1h / day_of / post_replay) | UI-SPEC §UI Binding 3 §9-window reminder schedule timeline row | 220-03 fold block grep gate |
| 6 | 28 agents pre-populated runnable=false (canonical aggregate per orchestrator directive — preserved verbatim) | UI-SPEC §UI Binding 6 §Per-agent tier population table | 220-06 fold block grep gate; psql count |
| 7 | 7-tier P220-relevant verbatim P220_AGENT_TIERS = ['VRL','CMT','EVT','PR','PRT','DEV','REV'] | UI-SPEC §UI Binding 6 §28 growth agents readiness viewer row | 220-06 fold block grep gate |
| 8 | 8-boolean readiness checklist verbatim (contracts_assigned + cost_estimated + approval_posture_defined + tests_implemented + api_surface_defined + mcp_surface_defined + ui_surface_defined + failure_behavior_defined) | UI-SPEC §UI Binding 6 §8-readiness-boolean checklist row | 220-06 fold block grep gate |
| 9 | Prohibited-methods 3 strings verbatim (paid_search_brand_terms / email_spam / trademark_misuse) | UI-SPEC §UI Binding 5 §Prohibited-methods list row | 220-05 fold block grep gate |
| 10 | 5 ALTERable tables (partner_profiles + referral_programs + community_profiles + marketing_events + partnerships) WITHOUT ecosystem columns | UI-SPEC §future_phase_227_ecosystem_alter translation gate | 220-05 fold block grep gate + p220-p227-altertable-readiness.test.js |
| 11 | Pitfall 6 buffer (never dispatch when scheduled_at < now - 1h) | UI-SPEC §UI Binding 3 §Pitfall 6 buffer indicator row | 220-03 fold block grep gate |
| 12 | 11 banned-lexicon validators across Domains 1-5 (mutation classes added: referral_reward_issuance + community_moderation_action + event_activation + event_external_invite + event_post_sequence + pr_pitch_send + pr_review_response + pr_pricing_profile_sync + pr_review_request_send + partnership_activation + affiliate_commission_issuance) | UI-SPEC §Banned-Lexicon Enforcement Summary §Total new mutation classes pre-dispatch validated = 11 | Per-plan banned-lexicon validator placement notes in fold blocks; Plan 06 architecture-passive-system-detector.test.js |

### 6 Future-Surface UI Binding Contracts table

| # | Contract | UI-SPEC § | Plan implementing backend substrate | Future translation gate |
|---|----------|-----------|-------------------------------------|-------------------------|
| 1 | Referral | §168-187 | 220-01 | future_phase_220_referral_console |
| 2 | Community | §190-206 | 220-02 | future_phase_220_admin_ui (community subset) |
| 3 | Event Marketing | §211-231 | 220-03 | future_phase_220_event_marketing_console |
| 4 | PR-Analyst-Review | §234-253 | 220-04 | future_phase_220_pr_console |
| 5 | Partnership-Affiliate-Developer | §256-278 | 220-05 | future_phase_220_partnership_console + future_phase_220_affiliate_console + future_phase_220_developer_marketing_console |
| 6 | 28 Growth Agents Readiness | §283-316 | 220-06 | future_phase_220_agents_page_extension + future_phase_220_approval_inbox_extensions |

### Translation gate dissolutions (4 dissolved by P220)

| # | Translation gate | Source | Dissolution layer |
|---|------------------|--------|-------------------|
| 1 | 217 future_phase_220_referral_console | 217-UI-SPEC | DISSOLVED at backend-substrate layer by 220 plans 01-06 |
| 2 | 217 saas_nav_visibility 12 SG planned-only seed (community/events/PR/partnership rows) | 217-UI-SPEC | PARTIALLY DISSOLVED at backend-substrate layer for growth namespaces |
| 3 | 218 + 219 future_phase_220_* placeholders | 218-UI-SPEC + 219-UI-SPEC | CONSUMED by 220 substrate |
| 4 | 213-04 public-proof boundary on PR pitches + G2 reviews | 213-UI-SPEC | DISSOLVED at substrate-layer for PR + review governance (220-04 ships pr_outreach.evidence_refs uuid[] NOT NULL + fn_pr_pitch_requires_evidence + review_records.response_approval_id + review_requests.pricing_engine_context_id + fn_review_request_g2_pricing_context) |

### Translation gates opened (9 opened by P220)

| # | Translation gate | Description | Opened by Plan |
|---|------------------|-------------|----------------|
| 1 | future_phase_220_admin_ui | Multi-page community/events/PR/partnership/affiliate/developer admin surface | Plans 02-05 (closeout = Plan 06) |
| 2 | future_phase_220_referral_console | Tenant-facing referral console | Plan 01 |
| 3 | future_phase_220_event_marketing_console | Event marketing planner + 9-window reminder timeline | Plan 03 |
| 4 | future_phase_220_pr_console | PR + analyst + review pipeline | Plan 04 |
| 5 | future_phase_220_partnership_console | Partner profile + partnership editor | Plan 05 |
| 6 | future_phase_220_affiliate_console | Affiliate program + commission tracker + payout export | Plan 05 |
| 7 | future_phase_220_developer_marketing_console | Developer content + events + pricing-drift detector | Plan 05 |
| 8 | future_phase_220_approval_inbox_extensions | 7 NEW handoff_kind chips render (20th-26th) | Plan 06 (closeout) |
| 9 | future_phase_220_agents_page_extension | 28 growth agents readiness rows render on 217-06 agents page | Plan 06 (closeout) |
| + | future_phase_227_ecosystem_alter | 5 P220-owned tables ALTERable for ecosystem columns (Q-1 + Q-2 RESOLUTION) | Plan 05 (migration-shape readiness test) |

### Downstream UI inheritance citations (≥20 future surfaces)

Future P220+ admin/tenant frontend phases compose the following primitive recipes (all DEFERRED — Plan 220 ships substrate ONLY):

1. <ReferralProgramEditor /> — 220-01
2. <ViralLoopMetricsDashboard /> — 220-01
3. <ReferralFraudEvaluatorQueue /> — 220-01
4. <ReferralRewardIssuanceModal /> (reuses 215 billing-correction modal) — 220-01
5. <CommunityProfileEditor /> — 220-02
6. <CommunitySignalsBrowser /> with 8-chip signal_kind filter — 220-02
7. <CommunityActionModerationQueue /> — 220-02
8. <ModerationApprovalModal /> — 220-02
9. <EventMarketingPlanner /> — 220-03
10. <EventReminderScheduleTimeline /> with 9-window verbatim — 220-03
11. <EventPromotionPlanRender /> — 220-03
12. <EventStatusTransitionApprovalModal /> — 220-03
13. <PrTargetRelationshipPipeline /> — 220-04
14. <PrPitchApprovalModal /> with <EvidenceMapPanel /> + <EvidenceCitationChip /> (209 inheritance) — 220-04
15. <SentimentClassifierBadge /> (LLM -1.0 to +1.0 + confidence) — 220-04
16. <G2ReviewPricingContextModal /> with <PricingContextChip /> (215 inheritance) — 220-04
17. <CoverageMentionsBrowser /> + <BrandAwarenessRollup /> — 220-04
18. <PartnerProfileEditor /> + <PartnershipActivationQueue /> — 220-05
19. <AffiliateProgramEditor /> + <AffiliateCommissionIssuanceModal /> (reuses 215 billing-correction modal — 25th chip) — 220-05
20. <PartnerPayoutExportModal /> (reuses 215 billing-correction modal — 26th chip; dual_approval > $1,000) — 220-05
21. <ProhibitedMethodsList /> + <ProhibitedMethodsViolationViewer /> — 220-05
22. <DeveloperContentEditor /> with <PricingDriftDetectorBadge /> (Pitfall 8) — 220-05
23. <DeveloperEventsIngestionView /> — 220-05
24. 28-agent readiness viewer extension on 217-06 app/saas/agents/page.tsx with <AgentReadinessBadge /> (218 inheritance) + 7-tier P220-relevant chip + 12-tier full chip + SG-07 experimentation_kind chip — 220-06

### 213.4 carry-forward + 217 D-21

- D-08 token-only — applies to all future P220+ surfaces
- D-09 mint-as-text — Protocol Mint reserved for primary action / focus only
- D-09b `.c-notice` mandatory — banned-lexicon Pitfall 6 buffer + sentinel acceptance indicators
- D-13 `.c-card--feature` reserved — EventPromotionPlan auto-render + first-run validation checklist
- D-14 no `.c-table` — partnership / affiliate tables use card-row layout
- D-15 selective extraction — 215 + 216 + 217 + 218 + 219 extracted-component recipes referenced as load-bearing primitives
- D-21 server/client boundary — every future P220+ admin/tenant surface MUST be default server component reading via requireHostedSupabaseAuth(request) + tenant-scoped supabase client

### 217 D-21 carry: server/client boundary

Per UI-SPEC §217 inheritance: every future P220+ admin/tenant surface MUST be a default server component; client components opt in via `'use client'` only for interactive primitives (referral program editor, viral loop K-factor visualization, fraud-evaluator queue filter, community profile editor, community moderation approval modal, event marketing planner with 9-window reminder timeline, EventPromotionPlan auto-render, PR target relationship-graph editor, PR pitch evidence-binding modal, G2 review pricing-context modal, sentiment classifier confidence indicator, partner profile editor, partnership editor, affiliate program editor, affiliate commission tracker, prohibited-methods violation viewer, developer content editor, developer events ingestion viewer, 28-agent readiness viewer).

### 217 D-21 carry: 28 agents page rendering

The 28 P220 growth agents readiness rows render on the existing 217-06 `app/saas/agents/page.tsx` agents-page surface alongside 9 P218 PLG + 9 P219 B2B + 12 P217 SAS rows (TOTAL 58 visible end-of-v4.1.0; 46 SaaS-tier aggregate per orchestrator-cited 9+9+28 = 46 SaaS-tier agents). The prompt-cited "28 growth agents" canonical figure is the P220-relevant aggregate per 220-06 Plan must_haves §28 agent rows (canonical figure preserved verbatim per orchestrator directive without re-litigating count).

### Cross-cutting doctrine binding (11 parent UI-SPECs)

| Parent | UI-SPEC § | Doctrine bound to P220 |
|--------|-----------|------------------------|
| 206-UI-SPEC | mutation-class doctrine | external.send for community moderation + event reminders + PR pitch + review request + partner outreach + developer marketing; billing.charge for referral reward + affiliate commission + partner payout (P215 HARD wired); data.export for partner payout CSV; default_approval_mode = single_approval for 6 of 7 new chips, dual_approval for partner_payout_export_approval when payout > $1,000 |
| 207-UI-SPEC | RunApiEnvelope | run_id linked to 6 cron handlers + 32 new AgentRunEventType values across Domains 1-6; ApprovalHandoffRecord links 7 new handoff_kinds to P208 inbox |
| 208-UI-SPEC (PARENT) | Approval Inbox | 7 NEW handoff_kind literals (20th-26th); chip count grows from 19 (post-219) to 26 (post-220 — END-OF-v4.1.0); rendering deferred to future_phase_220_approval_inbox_extensions |
| 209-UI-SPEC (PARENT) | EvidenceMap | Pitfall 3 PR pitch evidence-binding cardinality > 0 enforced via fn_pr_pitch_requires_evidence (220-04); Q-5 SOFT FK upgrade once P209 ships; immutable evidence_refs pattern; EVD-01 + EVD-02 carry; Pitfall 8 developer marketing pricing-drift applies EVD-01 |
| 213-UI-SPEC (PARENT) | T0-04 + 213-04 public-proof boundary + 213.4 carry-forward | banned-lexicon zero-match BEFORE external.send / billing.charge dispatch on 11 mutation classes; 213-04 public-proof boundary applies to PR pitches + G2 reviews + reviews; D-08 + D-09 + D-09b + D-13 + D-14 + D-15 + D-21 carry verbatim |
| 214-UI-SPEC (PARENT) | SaaS Suite Activation | every 220 SOR table FK to markos_orgs(tenant_id); module-mode-eligibility per canon line 50-60 (referral_engine for b2c/plg_b2c/b2b2c, community_engine for b2c/plg_b2b/plg_b2c/b2b2c, event_marketing for all-modes, pr_analyst_relations for b2b/b2b2c, partnership_ecosystem for b2b/b2b2c, developer_marketing for plg_b2b/b2b2c) |
| 215-UI-SPEC (PARENT) | Sentinel discipline + billing-correction modal recipe | sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` accepted on 4 surfaces (referral_programs.reward_description, affiliate_programs.commission_rate_jsonb, review_requests.request_template_id, developer_content.body); billing-correction modal recipe REUSED for 3 modals (<ReferralRewardIssuanceModal />, <AffiliateCommissionIssuanceModal /> 25th chip, <PartnerPayoutExportModal /> 26th chip); billing P215 HARD wired for referral_reward_issuance + affiliate_commission_issuance + partner_payout_export |
| 216-UI-SPEC (PARENT) | saas_health_scores consumer + extracted-component recipes | <HealthScoreBadge /> + <RiskBandBadge /> + <RetentionClassChip /> referenced as load-bearing primitives by 220 future surfaces; 9-row growth_signal_map seed activated for community/PR consumers |
| 217-UI-SPEC (PARENT) | saas_nav_visibility + agents-page extension + D-21 server/client boundary | future_phase_220_referral_console DISSOLVED at backend-contract layer; 28 P220 agents extend 217-06 app/saas/agents/page.tsx; D-21 server/client boundary carries verbatim |
| 218-UI-SPEC (PARENT) | markos_growth_mode ENUM eligibility + 218 9-PLG-agents readiness pattern | 6 of 12 P218 modules now reference 220 substrate; 28-growth-agents readiness pattern reused verbatim from 218 9-PLG-agents pattern (system-level registry, GENERATED runnable, ON CONFLICT DO UPDATE seed, 8-boolean checklist, AGENT_ACTIVATION_REQUIRES_APPROVAL_AND_READINESS DB-trigger) |
| 219-UI-SPEC (PARENT) | 9 B2B agents readiness pattern + 19th handoff_kind chain predecessor + 6-future-surface UI binding contracts pattern | 219 19th chip `save_offer_approval` is immediate predecessor; 220 extends to 26 chips (19+7); 6 parallel UI binding contracts pattern reused verbatim |

### END-OF-MILESTONE state table (v4.1.0 SaaS Suite Activation closeout)

| Metric | Pre-220 (post-219) | Post-220 (END-OF-v4.1.0) | Notes |
|--------|---------------------|---------------------------|-------|
| P208 Approval Inbox handoff_kind chips | 19 | 26 | 7 NEW chips from P220 (20th-26th); rendering deferred to future_phase_220_approval_inbox_extensions |
| 217-06 agents-page visible rows | 30 (12 P217 + 9 P218 + 9 P219) | 58 (12 + 9 + 9 + 28) | 28 P220 growth agents added; 46 SaaS-tier aggregate per orchestrator-cited 9+9+28 |
| F-IDs (P220) | 0 | 19 (F-209..F-227) | F-226 + F-227 are FINAL P220 contracts |
| Migration slots (P220) | 0 | 7 (90/91/92/93/94/95/97 — skip 96 = neuro_literacy_metadata) | per V4.1.0-MIGRATION-SLOT-COORDINATION.md slot allocation |
| DB-trigger compliance functions (P220) | 0 | 12 (referral×2 + community×1 + events×1 + PR×3 + partnerships×4 + agents×1) | defense-in-depth per RESEARCH §Compliance enforcement boundary |
| API handlers under api/v1/growth/* | 0 | 19 (legacy *.js per architecture-lock §13) | Plan 06 ships |
| Cron handlers under api/cron/growth-* | 0 | 6 (matching api/cron/webhooks-dlq-purge.js pattern) | Plan 06 ships |
| MCP tools (growth namespace) | 0 | 12 read + 3 write-gated = 15 (registered in HANDLERS map) | Plan 06 ships |
| Translation gates dissolved by P220 | 0 | 4 (217 future_phase_220_referral_console + 217 saas_nav_visibility + 218/219 future_phase_220_* + 213-04 public-proof boundary) | UI-SPEC §translation_gates_dissolved_by_220 frontmatter |
| Translation gates opened by P220 | 0 | 9 (future_phase_220_admin_ui + 6 console gates + future_phase_220_approval_inbox_extensions + future_phase_220_agents_page_extension + future_phase_227_ecosystem_alter) | UI-SPEC §translation_gates_opened_by_220 frontmatter |
| v4.1.0 milestone status | open | CLOSED | v4.2.0 Ecosystem Engine (P227 + P228 commercial-engines) begins |

*Phase: 220-saas-community-events-pr-partnership-devrel-growth*
*Validation strategy created: 2026-04-26*
*Source: 220-RESEARCH.md + 220-REVIEWS.md*
