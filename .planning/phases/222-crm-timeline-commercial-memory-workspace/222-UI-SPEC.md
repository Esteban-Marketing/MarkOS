---
phase: 222
slug: crm-timeline-commercial-memory-workspace
status: draft
shadcn_initialized: false
preset: not-applicable-no-shadcn
domain: crm-customer360-opportunity-buying-committee-nba-lifecycle-transition-commercial-signal-source-domain-actor-type-sentiment-thread-id-tombstone-cascade-outbox-score-provenance-immutability-architecture-lock-substrate
created: 2026-05-04
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: hybrid (3 no-UI backend plans + 3 heavy-UI plans shipping 4 NEW components + workspace-shell + copilot-record-panel evolution)
ui_scope: 222-03 (CrmTimelineEvent extension + 2 NEW components TimelineDetailView + LifecycleTransitionTimeline) + 222-04 (NBA durable + NEW NBAExplainPanel + execution-queue evolution) + 222-05 (Buying Committee + 7 API + 4 MCP + NEW BuyingCommitteePanel + workspace-shell + copilot-record-panel evolution)
plans_in_scope: [222-01, 222-02, 222-03, 222-04, 222-05, 222-06]
plans_with_ui_surfaces: [222-03, 222-04, 222-05]
plans_no_ui: [222-01, 222-02, 222-06]
ui_components_new: [TimelineDetailView, LifecycleTransitionTimeline, NBAExplainPanel, BuyingCommitteePanel]
ui_components_evolved: [workspace-shell, execution-queue, copilot-record-panel]
ui_components_replaced_as_default: [record-detail.tsx → TimelineDetailView]
chromatic_gate_owner: 222-06
playwright_e2e_status: DEFERRED (D-39 — Chromatic snapshot gate + manual operator-journey checklist for 4 surfaces)
milestone_position: v4.2.0-COMMERCIAL-ENGINES-LANE-CRM-PHASE
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `external.send` for NBA execute paths `send_followup` / `propose_expansion` / `send_renewal_reminder` / `draft_outreach` per D-28; `default_approval_mode == single_approval` for NBA execute when in ACTION_TYPES_REQUIRING_APPROVAL; `default_approval_mode == single_approval` for lifecycle transitions crossing high-risk boundary (any → customer, any → lost, role-handoff across primary owner classes); `default_approval_mode == single_approval` for tombstone cascade affecting opportunities with `pricing_context_id IS NOT NULL`; autonomy-ceiling on NBA execute when action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL; mutation-class binding via `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` — NEVER `createApprovalPackage` per D-42 architecture-lock)
  - 207-UI-SPEC.md (PARENT — `RunApiEnvelope.run_id` linked to NBA recompute runs (`recomputeNbaForCustomer` + `recomputeNbaForOpportunity` + `scheduleDailyRecompute` per Plan 04) + lifecycle transition runs (`appendLifecycleTransition` per Plan 02) + tombstone cascade runs (`tombstoneCustomer360` + cascade outbox worker per Plan 04 + Plan 06) + 3 cron handlers (`crm360-drift` daily 03:00 UTC + `crm360-nba-expire` hourly + `crm360-daily-recompute` daily 02:00 UTC per Plan 06); `AgentRunEventType` for `crm360_nba_record_upserted` / `crm360_nba_record_executed` / `crm360_nba_record_dismissed` / `crm360_nba_record_superseded` / `crm360_nba_record_expired` / `crm360_nba_recompute_started` / `crm360_nba_recompute_completed` / `crm360_lifecycle_transition_recorded` / `crm360_lifecycle_transition_rejected` (D-45 BEFORE UPDATE trigger fired) / `crm360_lifecycle_transition_override` / `crm360_committee_member_added` / `crm360_committee_member_role_changed` / `crm360_committee_member_role_change_rejected` (concurrent role change Pitfall 4) / `crm360_committee_coverage_recomputed` / `crm360_tombstone_initiated` / `crm360_tombstone_cascade_processed` / `crm360_tombstone_cascade_dead_lettered` (D-47 outbox max 5 attempts) / `crm360_drift_detected` / `crm360_drift_reconciled` / `crm360_score_provenance_immutability_violation` (D-46 BEFORE UPDATE trigger fired); `AgentFailureClass` 7 literals on cron + agent failure surfaces; `ApprovalHandoffRecord` links 222 NBA execute + lifecycle transition + tombstone cascade to P208 inbox; `agent_run_id` linked to all 3 P222 cron handlers + 10 read-write API handlers + 4 MCP tools)
  - 208-UI-SPEC.md (PARENT — Approval Inbox at `/operations/approvals` + Morning Brief + Task Board + cockpit pattern; per D-29 the Approval Inbox gains Customer360 + Opportunity + NBA entry types via `buildApprovalPackage` calls in NBA execute path + lifecycle transition path + tombstone cascade path; the Morning Brief surfaces top-N active NBA by `primary_owner_user_id` + top-N committee-gap opportunities via `lib/markos/crm360/brief/register.ts` registering `crm360_nba_summary` + `committee_gap_summary` entry types into `lib/markos/brief/registry.ts` extension-point; CRM reporting cockpit (`lib/markos/crm/reporting.ts`) gains `computeLifecycleFunnel` + `computeCommitteeCoverageRollup` + `computeNbaExecutionRate` rollups; migration drift audit (D-20) emits operator task when `customer_360_records ↔ crm_entities` drift detected; mobile_priority literals registered in `lib/markos/operator/shell.ts` `SurfaceRouteContract` per surface)
  - 209-UI-SPEC.md (PARENT — EvidenceMap binding + source quality + claim TTL + NBA evidence_refs[] mandatory non-empty (`nba_evidence_refs_nonempty` CHECK constraint per Plan 04 migration 108 — no black-box NBA); D-46 score provenance immutability (BEFORE UPDATE trigger blocks edits to `score_provenance.recorded_at` / `score_value` / `score_kind` / `attribution_chain` once committed; new score = new row; old row gets `superseded_at` + `superseded_by` set; immutable thereafter — feeds P209 EvidenceMap append-only model); the 209 `<EvidenceMapPanel />` + `<EvidenceCitationChip />` + `<KbGroundingPanel />` extracted-component recipes from 217 D-15 are CONSUMED in production by NBAExplainPanel (NBA `evidence_refs[]` rendering) and TimelineDetailView (per-row evidence chip on lifecycle transitions + agent events); EVD-01..06 doctrine carry — EVD-01 (NBA factual claims linked to citations via `evidence_refs[]`) + EVD-02 (NBA action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL blocks dispatch without approval_ref) + EVD-04 (NBA recompute reuses non-stale evidence) + EVD-05 (NBAExplainPanel exposes evidence + assumptions + claim risk per row))
  - 213-UI-SPEC.md (PARENT — Tenant 0 readiness gate consumer; 213-04 public-proof boundary applies STRICTLY to CRM commercial signals — `commercial_signal` enum {interest/risk/expansion/renewal/support/pricing/silence}, `sentiment` enum {positive/neutral/negative}, `actor_type` enum {human/agent/system}, `actor_id` person UUIDs, `nba_records.rationale` body, lifecycle stages, opportunity amounts, committee member personas + influence/engagement scores, customer 360 `current_summary` are all PRIVATE doctrine forever; raw customer NIT, customer email, primary phone, opportunity amount, committee member name + role assignment NEVER cited in case studies or public surfaces; banned-lexicon zero-match required on every NBA `rationale` body + lifecycle transition `reason` field + committee member `proof_gap_refs[]` operator-note + Customer360 `current_summary` BEFORE any approval-package dispatch; 213.4-VALIDATION.md carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary) carries verbatim into all 4 new components)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; per D-21 `cdp_identity_profiles.profile_id` is the canonical identity reader for SaaS bridge consumed via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`; `saas_subscriptions` FK relationship — Customer360 `canonical_identity_id` FK targets P221 substrate, NOT a P214 SaaS identity model; the 214 `<SaaSActivationPanel />` extracted component is NOT directly composed in 222 surfaces but the activation gate `isSaaSSurfaceEnabled` 3-condition pattern is REUSED if/when 222 surfaces gain a SaaS-only navigation path (deferred); architecture-lock D-32 carries verbatim — legacy `api/*.js` REST tree, NOT App Router `app/api/.../route.ts`)
  - 215-UI-SPEC.md (PARENT — sensitive credential UI binding contract Layer 6 carries verbatim AND EXTENDS to PII data per 216 inheritance — every Customer360 `display_name` + `current_summary` + Opportunity `title` + committee member `person_id` rendering of CDP-resolved identity (raw `primary_email` / `primary_phone` / `company_name` from P221 IdentityProfile via `getProfileForContact`) renders via `<PIIRedactedField />` per `pii_classification` ENUM 5-value taxonomy; audit-log `event_type == 'identity_view'` mirrors `credential_view` pattern (every PII field render writes audit row); `<PIIRedactedField />` `onCopy` interceptor MUST `preventDefault()` to block PII clipboard exfiltration; the 215 billing-correction modal recipe is REUSED VERBATIM for `crm360_lifecycle_transition_approval` (when transition crosses high-risk boundary per D-42) AND `crm360_nba_execute_approval` (when action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL per D-42) AND `crm360_tombstone_cascade_approval` (when cascade affects opportunity with `pricing_context_id IS NOT NULL` per D-42))
  - 216-UI-SPEC.md (PARENT — Health Score binding for NBA priority; the 216 `<HealthScoreBadge />` + `<RiskBandBadge />` + `<RetentionClassChip />` + `<PIIRedactedField />` + `<KbGroundingPanel />` + `<ClassifierChipRow />` extracted-component recipes are CONSUMED IN PRODUCTION by 222 surfaces — `<HealthScoreBadge />` reused in NBAExplainPanel (NBA priority bias when subject_type='customer_360' AND health_score < 60 → urgency upgrade; D-04 urgency bias preservation per P103) and TimelineDetailView header (per Customer360 record context); `<RiskBandBadge />` reused in TimelineDetailView header (Customer360 risk band color-codes the record-level eyebrow); `<KbGroundingPanel />` reused in NBAExplainPanel (NBA evidence rendering with top-3 sources + `chunk_id` chips + `source_type` badge + `relevance_score`); `<ClassifierChipRow />` reused in TimelineDetailView (per-row `commercial_signal` 7-enum + `source_domain` 11-enum + `actor_type` 3-enum chip rendering); the 5 `pii_classification` ENUM badges (`no_pii`/`pseudonymous`/`personal`/`sensitive`/`highly_sensitive`) carry verbatim and apply to `customer_360_records.{display_name, current_summary}` + `opportunities.{title}` + `buying_committee_members.{person_id}` (resolved to P221 IdentityProfile via adapter); banned-lexicon zero-match enforced on NBA rationale + lifecycle reason + committee proof_gap_refs operator-note + Customer360 current_summary BEFORE approval-package dispatch)
  - 217-UI-SPEC.md (PARENT — heavy-UI pattern reference; D-15 selective extraction recipe (7 components first consumed in production: `<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />`); D-21 server/client boundary doctrine carries verbatim — `app/(markos)/crm/**` page tree was preserved per D-43 (NOT deleted, NOT migrated to `app/saas/`); the 222 NEW UI components live under `components/markos/crm/*` (NOT under `app/(markos)/crm/`) per D-43 — `app/(markos)` is FORBIDDEN as a NEW file path per D-35 BUT is PRESERVED for existing pages per D-43; **D-32 architecture-lock carries verbatim** — legacy `api/*.js` (NOT App Router `app/api/.../route.ts`); `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` (NOT `requireSupabaseAuth` / NOT `requireTenantContext`); test runner is `npm test` (Node `--test`) with `node:test` + `node:assert/strict` imports, `*.test.js` files (`.test.ts` FORBIDDEN per D-39); OpenAPI lives at `contracts/openapi.json` (NOT `public/openapi.json`); MCP registry at `lib/markos/mcp/tools/index.cjs` (NOT `.ts`) per D-41; cron in `api/cron/*.js` with `x-markos-cron-secret` header (NOT `app/api/cron/.../route.ts`) per D-44; helper canon `buildApprovalPackage` (NOT `createApprovalPackage`) per D-42)
  - 220-UI-SPEC.md (PARENT — END-OF-v4.1.0 milestone state; 26 P208 handoff_kind chips at v4.1.0 closeout; 221 opens v4.2.0 commercial-engines lane and EXTENDS to 29 chips; 222 EXTENDS the chain to **32 chips** with 3 new literals — `crm360_nba_execute_approval` 30th + `crm360_lifecycle_transition_approval` 31st + `crm360_tombstone_cascade_approval` 32nd — start-of-v4.2.0-commercial-engines-lane mid-state)
  - 221-UI-SPEC.md (PARENT — CDP IdentityProfile + ConsentState + TraitSnapshot via P221 read-through adapter per D-21 + D-37; 221 D-32 architecture-lock carries verbatim; 221 dissolved its own `future_phase_222_attribution_substrate` translation gate at the substrate-feed layer for the CDP-events-as-attribution-input contract — 221-03 ships `cdp_events` (10-domain ENUM monthly-partitioned append-only event SOR per D-08) + `cdp_trait_snapshots` (real_time/hourly/daily freshness modes per D-15) which 222 reads via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` per D-21 — Customer360 NEVER stores identity/consent/trait data, ONLY commercial overlay (fit/intent/health/risk/lifecycle/ownership/opportunity); D-22 CDP mutations emit `EventEnvelope` rows to `cdp_events` with `event_domain='crm'` (D-07) — shared `source_event_ref` threads CRM activity ↔ CDP events ↔ EvidenceMap (P209); D-23 CDP consent re-validation at dispatch (P221 D-18 double-gate) applies to every CRM-initiated external action; D-32 P221 tombstone cascade (P221 D-24 tombstone) propagates to Customer360 — profile tombstone → Customer360 `canonical_identity_id` nulled, PII-derived columns scrubbed (`display_name`, `current_summary`), ownership/lifecycle/NBA preserved for audit but marked `tombstoned=true`; Opportunity + Committee preserved (legal + revenue trail))
  - 213.4-VALIDATION.md §Carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary)
translation_gates_dissolved_by_222:
  - "221-UI-SPEC §future_phase_222_attribution_substrate (anticipated future commercial-engines lane consumer placeholder) — DISSOLVED at the substrate-feed layer for the CDP-events-as-attribution-input contract. 222-01 ships Customer360 SOR (per D-01/D-02) + Opportunity SOR (per D-03) which read CDP via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` per D-21 (read-through adapter); 222-03 ships `crm_activity_ledger` extensions (per D-05/D-06) with new columns `source_domain` + `commercial_signal` + `actor_type` + `opportunity_id` + `sentiment` + `thread_id` — these are the load-bearing attribution-input substrate for future P225 analytics consumers. The future P222 substrate is now LIVE (not placeholder); P225 reads `customer_360_records` + `opportunities` + `lifecycle_transitions` + `nba_records` for attribution + journey + narrative semantic layer per ANL-01..05. The `<PlaceholderBanner variant=\"future_phase_222_attribution_substrate\">` is REMOVED from 221-consuming surfaces."
  - "217-UI-SPEC §future_phase_222 (anticipated future CRM timeline + workspace consumer placeholder) — DISSOLVED at the substrate-feed layer for the CRM 360 timeline workspace contract. 222-03 ships TimelineDetailView (NEW DEFAULT record detail view replacing record-detail.tsx via D-24 workspace-shell evolution) + LifecycleTransitionTimeline; 222-04 ships NBAExplainPanel + execution-queue.tsx evolution reading from `nba_records` table; 222-05 ships BuyingCommitteePanel + workspace-shell.tsx + copilot-record-panel.tsx evolution + 7 `/v1/crm/*` endpoints + 4 MCP tools. The `<PlaceholderBanner variant=\"future_phase_222\">` is REMOVED from 217-consuming surfaces."
  - "100-CONTEXT D-01..D-10 + 101-CONTEXT D-01 + 102-CONTEXT D-01..D-05 + 103-CONTEXT D-01/D-04/D-06 + 104-CONTEXT D-04/D-07 + 105-CONTEXT D-01/D-03/D-05/D-06/D-08 (legacy CRM workspace+timeline placeholder for the to-be-shipped Customer360 360 view) — DISSOLVED. P100-P105 substrate (`crm_entities`, `crm_activity_ledger`, `lib/markos/crm/{workspace,execution,timeline,tracking,attribution,identity,merge,copilot,reporting,agent-actions,api,contracts,entities,tracking}.ts`) is PRESERVED VERBATIM (additive extension only per D-19 read-through adapter `lib/markos/crm360/adapters/legacy-entity.ts`). 222 does NOT replace P100-P105; it OVERLAYS Customer360 + Opportunity + NBA + BuyingCommittee on top. The 222 substrate EXTENDS legacy timeline (D-05/D-06 additive columns) and EVOLVES legacy UI (workspace-shell.tsx default record-detail SWAP via D-24; execution-queue.tsx data-source SWAP per D-24; copilot-record-panel.tsx grounding SWAP per D-24). Legacy callers continue to function — backward-compat preserved per D-06 `buildCrmTimeline` dual output (legacy `activity_family` AND new `source_domain + commercial_signal + actor_type` envelope) and D-19 read-through adapter."
translation_gates_opened_by_222:
  - "future_phase_223_dispatch_substrate — Future commercial-engines lane consumer (P223 Email + Messaging Engine Orchestration) consuming 222 substrate. P223 reads `customer_360_records` + `opportunities` + `buying_committees` + `buying_committee_members` for dispatch eligibility + member-level send routing + committee-coverage-driven outreach + `nba_records.action_type ∈ {send_followup, propose_expansion, send_renewal_reminder, draft_outreach}` for NBA-driven outbound campaigns; consumes P221 `cdp_consent_states` (per 221 D-11/D-13/D-18 double-gate) + P221 `cdp_audience_snapshot_memberships` for activation; 222 lifecycle stages (`mql`/`sql`/`opportunity`/`customer`/`expansion`/`renewal`/`advocate`/`lost`) drive dispatch playbook selection; 222 `commercial_signal` enum 7-value (`interest`/`risk`/`expansion`/`renewal`/`support`/`pricing`/`silence`) drives subject-line + content-pack template selection. Future surfaces render `<PlaceholderBanner variant=\"future_phase_223_dispatch_substrate\">` until that phase ships."
  - "future_phase_222_admin_ui — Multi-page CRM 360 admin surface composing unified profile viewer (`app/(markos)/crm/customer360/[customer_360_id]/page.tsx` future) + opportunity detail (`app/(markos)/crm/opportunities/[opportunity_id]/page.tsx` future) + buying-committee detail (`app/(markos)/crm/committees/[committee_id]/page.tsx` future) + NBA queue (`app/(markos)/crm/nba/page.tsx` future) + lifecycle funnel (`app/(markos)/crm/funnel/page.tsx` future) + drift reconciliation timeline (`app/(markos)/crm/reconciliation/page.tsx` future) + 6-table RLS denial test viewer (`app/(markos)/crm/rls-audit/page.tsx` future). 222 ships the COMPONENTS (TimelineDetailView, LifecycleTransitionTimeline, NBAExplainPanel, BuyingCommitteePanel) but does NOT ship dedicated admin pages — components are CONSUMED by the existing `app/(markos)/crm/*` page tree via workspace-shell evolution (D-24). Future admin pages render the same components in dedicated routes. **D-32 architecture-lock holds** — all routes are LEGACY `api/*.js` (NOT App Router `app/api/.../route.ts`). Future surfaces render `<PlaceholderBanner variant=\"future_phase_222_admin_ui\">` until those phases ship."
  - "future_phase_222_approval_inbox_extensions — P208 Approval Inbox at `/operations/approvals` rendering 3 NEW handoff_kind chips (`crm360_nba_execute_approval` 30th + `crm360_lifecycle_transition_approval` 31st + `crm360_tombstone_cascade_approval` 32nd), filter chip set extends from 29 chips (post-221 = start-of-v4.2.0) to **32 chips post-222 — start-of-v4.2.0-commercial-engines-lane mid-state**. Each chip renders the per-row classifier (NBA execute approval: `subject_type` + `action_type` + `confidence` + `expires_at` + `evidence_refs[]` cardinality + `<KbGroundingPanel />` preview; lifecycle transition approval: `from_stage` → `to_stage` + `reason` + `evidence_ref` + actor + `<HealthScoreBadge />` for current Customer360 health context; tombstone cascade approval: tombstoned profile cardinality + cascade target counts + `<PIIRedactedField />` per affected opportunity row + dual-approval indicator if `pricing_context_id IS NOT NULL`). Row rendering extension is DEFERRED to a future P208 admin extension phase. Future surfaces render `<PlaceholderBanner variant=\"future_phase_222_approval_inbox_extensions\">` until that phase ships."
  - "future_phase_222_chromatic_baselines — Chromatic visual baseline gate enforcement (4 NEW UI surfaces × 5+ named state stories each = 20+ snapshots) lives under Plan 06 (autonomous: false per D-51 RL1 — operator review on first batch). Future approval needed if visual diffs accepted on subsequent baselines without operator review. 222-06 Plan ships the `chromatic.config.json` + 4 `*.stories.tsx` files; downstream phases (P223+) MUST NOT add components/markos/crm/* without registering corresponding Storybook stories + Chromatic snapshots."
  - "future_phase_223_legacy_crm_entities_cutover — Per CONTEXT §Deferred Ideas, legacy `crm_entities` cutover to derived-view-only is deferred to post-P222 cleanup phase (likely P223+ once all consumers migrate via D-19 read-through adapter). 222 SHIM WINDOW preserves dual-write per D-18 + D-19; D-20 drift reconciliation cron emits operator task on divergence. Future cutover phase will drop the dual-write path and demote `crm_entities` to a view materialized from `customer_360_records`."
---

# Phase 222 — UI Design Contract (HYBRID HEAVY-UI)

> Visual and interaction contract for the **CRM Timeline + Commercial Memory + Workspace** phase. Phase 222 is HYBRID HEAVY-UI: three backend plans (222-01, 222-02, 222-06) ship migrations + libs + handlers + tests with **zero NEW UI surface** (Plan 06 ships the Chromatic gate + manual operator-journey checklist for the 4 surfaces shipped by Plans 03/04/05); three UI plans (222-03, 222-04, 222-05) ship **4 NEW components under `components/markos/crm/*` + `workspace-shell.tsx` + `execution-queue.tsx` + `copilot-record-panel.tsx` evolution** (D-24 + D-25). Plans 03+04+05 collectively constitute the FIRST commercial-memory operator workspace of the v4.2.0 commercial-engines lane.
>
> **Critical posture:** 222 EVOLVES the existing `app/(markos)/crm/*` page tree (preserved per D-43; NOT migrated to `app/(saas)/` per architecture-lock). The 4 NEW UI components live under `components/markos/crm/*` per D-43 because `app/(markos)/` is FORBIDDEN as a NEW file path per D-35 BUT is PRESERVED for existing pages per D-43. The TimelineDetailView component REPLACES `record-detail.tsx` as the DEFAULT record detail view via workspace-shell.tsx evolution (D-24); the legacy `record-detail.tsx` file is preserved on disk for backwards-compat callers (read-through adapter pattern per D-19). Every approval gate cites 206 mutation-class doctrine; every approval-package call uses `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-42 (NEVER `createApprovalPackage`). Every NBA execute path that fires on `action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL` (`send_followup`, `propose_expansion`, `send_renewal_reminder`, `draft_outreach`) calls `buildApprovalPackage` with `kind='crm360_nba_execute_approval'`. Every lifecycle transition crossing high-risk boundary calls `buildApprovalPackage` with `kind='crm360_lifecycle_transition_approval'`. Every tombstone cascade affecting opportunities with `pricing_context_id IS NOT NULL` calls `buildApprovalPackage` with `kind='crm360_tombstone_cascade_approval'`.
>
> **Architecture-lock note:** Per D-35 forbidden-pattern detector — `createApprovalPackage`, `requireSupabaseAuth`, `requireTenantContext`, `serviceRoleClient` (outside `requireHostedSupabaseAuth` boundary), `lookupPlugin` (use `resolvePlugin` per D-35), `public/openapi.json` (use `contracts/openapi.json` per D-40), `app/(public)`, `app/(markos)` AS NEW FILE PATH (NOT as existing page tree which IS preserved per D-43), `route.ts` (outside doctrinal NO-X comments), `vitest run`, `from 'vitest'`, `.test.ts`, `"stub if missing"`, `"if exists"` are all auto-FAIL tokens. Plan 01 Task 0.5 ships forbidden-pattern detector test that scans every `.planning/phases/222-*-PLAN.md` file for the rejected tokens.
>
> **D-39 Playwright DEFERRED note:** Per D-39 test runner pinned to `npm test` (Node `--test`); **NO vitest, NO playwright install in P222**. All `*.test.js` files (NOT `.test.ts`) use `node:test` + `node:assert/strict`. The CHROMATIC SNAPSHOT GATE + MANUAL OPERATOR-JOURNEY CHECKLIST replaces Playwright e2e for the 4 new UI surfaces. Plan 06 closeout includes a meta-test that asserts `package.json` did not gain `vitest` or `@playwright/test` keys during P222 execution.
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md carry-forward (D-08..D-15 + D-21) → 206-UI-SPEC (mutation-class doctrine origin) → 207-UI-SPEC (RunApiEnvelope + AgentRunEventType + ApprovalHandoffRecord) → 208-UI-SPEC (cockpit pattern parent) → 209-UI-SPEC (EvidenceMap + KbGroundingPanel) → 213-UI-SPEC (T0 gate consumer + public-proof boundary) → 214-UI-SPEC (PARENT — SaaS Suite Activation; CDP profile read-through adapter pattern) → 215-UI-SPEC (PARENT — sensitive credential UI binding Layer 6 EXTENDS to PII) → 216-UI-SPEC (PARENT — Health Score binding for NBA priority + 6 extracted components first consumed in 217 NOW REUSED in 222) → 217-UI-SPEC (PARENT — heavy-UI pattern reference; D-15 extracted components reused; D-21 server/client boundary; D-32 architecture-lock) → 220-UI-SPEC (END-OF-v4.1.0; 26 chips at v4.1.0 closeout) → 221-UI-SPEC (PARENT — CDP read-through adapter; opens v4.2.0; 29 chips post-221) → this document. Generated by gsd-ui-researcher 2026-05-04. Status: draft (checker upgrades to approved once 6-pillar audit passes).

---

## Plan Scope Classification

| Plan | Wave | Title | UI Scope | Primary Surface | Mobile Priority |
|------|------|-------|----------|-----------------|-----------------|
| **222-01** | 1 | Architecture-lock + assertUpstreamReady + Customer360 + Opportunity SOR foundation | NO_UI | `supabase/migrations/106_crm360_customer360_opportunities.sql`, `lib/markos/crm360/{records,opportunities,adapters,preflight,events,opportunities/pricing-guard}/*.ts`, `scripts/preconditions/222-check-upstream.cjs`, F-113 + F-114 | n/a |
| **222-02** | 2 | Lifecycle transitions append-only + ownership handoff + migration 107 | NO_UI | `supabase/migrations/107_crm360_lifecycle_transitions.sql`, `lib/markos/crm360/lifecycle/transitions.ts`, F-115 | n/a |
| **222-03** | 2 | CrmTimelineEvent extension + 2 NEW UI components | **IN_SCOPE** | `supabase/migrations/110_crm360_crm_activity_extensions.sql` + `lib/markos/crm/timeline.ts` (extend) + `lib/markos/crm360/timeline/api.ts` + **`components/markos/crm/TimelineDetailView.tsx` (NEW DEFAULT)** + **`components/markos/crm/LifecycleTransitionTimeline.tsx` (NEW)** + 2 module CSS + 2 Storybook stories + F-119 | **secondary** for both surfaces |
| **222-04** | 3 | NBA durable + NBAExplainPanel + execution-queue.tsx evolution | **IN_SCOPE** | `supabase/migrations/108_crm360_nba_records.sql` (incl. D-45 lifecycle BEFORE UPDATE trigger + D-46 score immutability trigger + D-47 tombstone outbox) + `lib/markos/crm360/nba/{nba-record,recompute,expiry}.ts` + `lib/markos/crm360/records/tombstone.ts` + `lib/markos/crm/execution.ts` (refactor) + **`components/markos/crm/NBAExplainPanel.tsx` (NEW)** + **`components/markos/crm/execution-queue.tsx` (EVOLVED)** + 1 module CSS + 1 Storybook story + F-116 | **critical** for execution-queue (operator field-of-view); **secondary** for NBAExplainPanel |
| **222-05** | 4 | Buying Committee + 7 API + 4 MCP + BuyingCommitteePanel + workspace-shell + copilot evolution | **IN_SCOPE** | `supabase/migrations/109_crm360_buying_committees.sql` + `lib/markos/crm360/committees/{committee,member}.ts` + `lib/markos/crm360/api/handlers.ts` + `lib/markos/crm360/mcp/tools.cjs` + 10 `api/v1/crm/*.js` files + **`components/markos/crm/BuyingCommitteePanel.tsx` (NEW)** + **`components/markos/crm/workspace-shell.tsx` (EVOLVED)** + **`components/markos/crm/copilot-record-panel.tsx` (EVOLVED)** + 1 module CSS + 1 Storybook story + F-117 + F-118 + F-120 + F-121 + `lib/markos/crm360/brief/register.ts` + `lib/markos/brief/registry.ts` + `lib/markos/crm/reporting.ts` (extend) | **secondary** for BuyingCommitteePanel; workspace-shell + copilot-record-panel inherit existing mobile_priority |
| **222-06** | 5 | Closeout — Chromatic gate + 3 cron + reconciliation + 6-table RLS + manual operator journey | NO_NEW_UI (gates existing surfaces) | `supabase/migrations/111` + `supabase/migrations/112` + 3 `api/cron/crm360-*.js` + reconciliation libs + `chromatic.config.json` + manual operator-journey checklist + 222-SUMMARY.md | n/a |

**Hybrid scope rationale.** Plans 222-01/02/06 ship the durable substrate (Customer360 + Opportunity + lifecycle transitions + drift reconciliation + cron + 6-table RLS hardening) without rendering any pixel. Plans 222-03/04/05 ship the operator-facing CRM 360 commercial-memory experience with **4 NEW components first consumed in production** here, plus **3 EVOLVED existing components** (workspace-shell.tsx default record-detail SWAP per D-24; execution-queue.tsx data-source SWAP from on-read computation to `nba_records` table read per D-24; copilot-record-panel.tsx grounding SWAP to consume Customer360 `current_summary` + NBA `evidence_refs[]` per D-24). The `<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />` extracted-component recipes from 216-UI-SPEC §D-15 (first consumed in 217-UI-SPEC §D-15) are **REUSED** in 222 surfaces.

**Mobile priority.** Per 208-01 mobile_priority literals (`critical | secondary | desktop_only`):

| Surface | mobile_priority | Rationale |
|---------|-----------------|-----------|
| `components/markos/crm/TimelineDetailView.tsx` (default record detail) | `secondary` | Operator desk-work; record review |
| `components/markos/crm/LifecycleTransitionTimeline.tsx` | `secondary` | Stage history viewer; not field-emergency |
| `components/markos/crm/NBAExplainPanel.tsx` | `secondary` | NBA detail review; opens from execution-queue critical mobile path |
| **`components/markos/crm/execution-queue.tsx` (EVOLVED)** | **`critical`** | **Sales/CS mobile field-of-view** for due/overdue tasks + NBA suggestions; mobile-first per P103 D-04 inheritance |
| `components/markos/crm/BuyingCommitteePanel.tsx` | `secondary` | Account/opportunity review; not field-emergency |
| `components/markos/crm/workspace-shell.tsx` (EVOLVED) | `secondary` (parent inherits) | Shell chrome; default record detail swap |
| `components/markos/crm/copilot-record-panel.tsx` (EVOLVED) | `secondary` (parent inherits) | Inline copilot summary |

`desktop_only` is FORBIDDEN as a `mobile_priority` value (208-01 architecture-lock). All surfaces meet WCAG 2.1 AA touch targets via the global `(pointer: coarse) { .c-button { min-height: 44px } }` rule already shipping per 213.2 cross-cutting fix. Each surface registers in `lib/markos/operator/shell.ts` `SurfaceRouteContract` via `surface_family: crm360_*`.

All Acceptance Criteria below apply to plan 222-03/04/05 deliverables. Plans 222-01/02/06 are backend-only and produce no NEW UI artifacts (Plan 06 gates existing surfaces via Chromatic + manual journey).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (vanilla CSS Modules consuming `var(--*)` tokens from `app/tokens.css` + composing `.c-*` primitives from `styles/components.css` v1.1.0) |
| Preset | not applicable — repository is not shadcn-initialized (verified 2026-05-04: no `components.json` at repo root) |
| Component library | none — primitives in `styles/components.css` v1.1.0 (`.c-card`, `.c-button{,--primary,--secondary,--tertiary,--destructive,--icon}`, `.c-input`, `.c-field{,__label,__help,__error}`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-modal`, `.c-backdrop`, `.c-status-dot{,--live,--error}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-code-inline`, `.c-code-block`, `.c-terminal`, `.c-toast--{success,warning,error,info}`) |
| Icon library | Lucide (default) · Phosphor Regular (only allowed substitute) — DESIGN.md "Iconography". Bracketed glyphs (`[ok]`, `[warn]`, `[err]`, `[info]`, `[block]`, `[up]`, `[down]`, `[flat]`, `[—]`, `[#]`) carry every state signal per CLAUDE.md "no emoji in product UI". |
| Heading font | JetBrains Mono (`var(--font-mono)`) — DESIGN.md `typography.h1`–`h4` |
| Body font | Inter (`var(--font-sans)`) — DESIGN.md `typography.body-md`, `lead`, `body-sm`, `label-caps` |
| Default theme | dark (`color-scheme: dark`); light opt-in via `[data-theme="light"]` (per `app/tokens.css` lines 191–204) |
| Form authoring posture | Primitive-only. The 4 NEW components compose `.c-input`, `.c-button{,--*}`, `.c-field` + `.c-field__{label,help,error}`. No bespoke form CSS. The TimelineDetailView filter chip group composes `.c-chip` (NOT custom buttons). The BuyingCommitteePanel "Invite role" CTA composes `.c-button--primary`. The NBAExplainPanel "Accept and execute" CTA composes `.c-button--primary` (or `.c-button--secondary` when `action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL` to indicate approval-gate). |
| Banner authoring posture | **Primitive-only (D-09b carry).** Every gating state (NBA expired, NBA superseded, lifecycle transition rejected by D-45 trigger, score provenance immutability violation by D-46 trigger, tombstone cascade dead-lettered, drift detected, RLS denied cross-tenant) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `components/markos/crm/`. |
| Card authoring posture | `.c-card` default for record detail header card (TimelineDetailView), event row cards (TimelineDetailView), transition row cards (LifecycleTransitionTimeline), NBA detail card (NBAExplainPanel), member rows (BuyingCommitteePanel). **`.c-card--feature` is PROHIBITED in this phase** (D-13 carry: reserved for hero panels in 404-workspace + 213.5 marketing only). |
| PII display posture | All Customer360 `display_name` + `current_summary` + Opportunity `title` + committee member identity render via `<PIIRedactedField />` extracted component (216-UI-SPEC §D-15) consuming `pii_classification` ENUM 5-value taxonomy from P221 IdentityProfile resolved via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`. Audit-log `event_type == 'identity_view'` mirrors `credential_view` pattern (every PII field render writes audit row to `markos_audit_log` P201 hash chain). `<PIIRedactedField />` `onCopy` interceptor MUST `preventDefault()` to block PII clipboard exfiltration. |
| Pricing display posture | All Opportunity `amount` + `pricing_context_id` references render via `<Money fromPricingRecommendation={pr_id} />` recipe consuming P205 PricingRecommendation context XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel via `<PlaceholderBanner variant="billing_placeholder">` whenever `pricing_context_id IS NULL`. Phase 222 MUST NOT take pricing ownership. Zero hard-coded dollar/peso literals. JBM `font-feature-settings: 'tnum' 1` (tabular-numerals) for all monetary columns. |
| Table authoring posture | **Vanilla `<table>` semantic only (D-14 carry).** TimelineDetailView event list, LifecycleTransitionTimeline transition list, NBAExplainPanel evidence list, BuyingCommitteePanel member list all use vanilla `<table>` (or `<ol>` for ordered lifecycle history) + `.c-badge--{state}` for row state + token-only recipe on `<th>`/`<td>`. The `.c-table` primitive remains deferred to Phase 218+. |
| Placeholder posture | Future-substrate placeholders render `<PlaceholderBanner variant="future_phase_{N}_{slug}">` composing `.c-notice c-notice--info` with literal `[info] Awaiting Phase {N} translation` body. Active variants in this phase: `future_phase_223_dispatch_substrate` (NBAExplainPanel "Dispatch via P223" footer when action_type targets dispatch — DEFERRED), `future_phase_222_admin_ui` (deep-link hooks on workspace-shell to a future dedicated CRM admin page tree), `future_phase_222_approval_inbox_extensions` (Approval Inbox row rendering for 3 new chips — DEFERRED to future P208 admin extension). Pricing placeholders render `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel verbatim per 205 + 215 inheritance. |
| Server/client boundary (D-21 carry) | The 4 NEW components are **client components** (`'use client'`) per existing convention in `components/markos/crm/*` since they own interactive state (filter chips with local state, accept-and-execute button with optimistic update, member role-change inline editor, lifecycle history scrolling). The CONSUMING pages under `app/(markos)/crm/**` remain **server components** by default per D-21; they fetch data via `requireHostedSupabaseAuth` + tenant-scoped supabase client and pass server-fetched data to the client components as props. The server/client boundary is named in each component's file header comment per D-21. |

---

## Spacing Scale

Authoring rule: every `padding`, `margin`, `gap`, `inset` MUST cite a `--space-*` token. No arbitrary px. Off-grid values are auto-FAIL.

| Token | Value | DESIGN.md citation | Usage in this phase |
|-------|-------|--------------------|---------------------|
| `--space-none` | 0 | `spacing.none` | Reset margins on `<h1>`, `<h2>`, `<p>`, `<table>`, `<ul>`, `<ol>` |
| `--space-xxs` | 2px | `spacing.xxs` | Badge inner padding, status-dot offset, chip group adjacency |
| `--space-xs` | 8px | `spacing.xs` | Filter chip row gap (TimelineDetailView), event row metadata gap, member row chip gap, NBA evidence chip gap, lifecycle transition arrow margin |
| `--space-sm` | 16px | `spacing.sm` | Card vertical rhythm, notice padding-block, table `th`/`td` padding-block, mobile horizontal page padding ≤ 640px, member row gap |
| `--space-md` | 24px | `spacing.md` | Card padding (via `.c-card`), gap between component sections (TimelineDetailView header → events; NBAExplainPanel rationale → evidence → action; BuyingCommitteePanel header → members → invite-role), modal padding |
| `--space-lg` | 32px | `spacing.lg` | Inter-section gap within each component, vertical gap between record-detail-view and lifecycle-history when both render in the same parent |
| `--space-xl` | 48px | `spacing.xl` | Component vertical padding ≥ lg breakpoint |
| `--space-xxl` | 96px | `spacing.xxl` | Reserved — not used in this phase |

**Allowed exceptions (DESIGN.md documented):**
1. `1px` for hairline borders (`var(--color-border)`).
2. `2px` for focus ring width and offset (`var(--focus-ring-width)`, `var(--focus-ring-offset)`).
3. `4px` for `.c-notice` `border-inline-start` accent — composed via `.c-notice` primitive; modules never declare directly.
4. `max-width: 1280px` for cockpit container (`--w-container`). Each component renders within its parent page's container.
5. `max-width: 560px` for confirmation modals (`--w-modal`) — applies to NBA accept-and-execute confirm modal and BuyingCommitteePanel "Invite role" approval modal.
6. `44px` mobile touch target via `--h-control-touch` on `.c-button` and `.c-chip` for `(pointer: coarse)` viewports — already declared globally per 213.2 cross-cutting fix.

---

## Typography

All text MUST cite a token from DESIGN.md `typography.*`. Heading typography is JetBrains Mono. Body typography is Inter. No third typeface.

| Role | DESIGN.md token | CSS variables / class | Usage in this phase |
|------|-----------------|------------------------|---------------------|
| Component heading | `typography.h2` | `<h2>` inheriting globals: `var(--font-mono)` + `var(--fs-h2)` (1.953rem) + `var(--fw-semibold)` | Per-component `<h2>`: "Timeline" (TimelineDetailView), "Lifecycle history" (LifecycleTransitionTimeline), "Next best action" (NBAExplainPanel), "Buying committee" (BuyingCommitteePanel) |
| Section sub-heading | `typography.h3` | `<h3>` inheriting globals: `var(--font-mono)` + `var(--fs-h3)` (1.563rem) + `var(--fw-semibold)` | Sub-section headings ("Source" / "Signal" filter group labels in TimelineDetailView; "Rationale" / "Evidence" / "Action" sections in NBAExplainPanel; "Members" / "Missing roles" / "Coverage" sections in BuyingCommitteePanel) |
| Inline sub-heading | `typography.h4` | `<h4>` inheriting globals: `var(--font-mono)` + `var(--fs-h4)` (1.250rem) + `var(--fw-medium)` | Filter group fieldset legends (`<legend>Source</legend>`, `<legend>Signal</legend>` in TimelineDetailView) |
| Surface descriptor / lead | `typography.lead` | `.t-lead` utility: `var(--font-sans)` + `var(--fs-lead)` (1.250rem) + `var(--fw-regular)` + `color: var(--color-on-surface-muted)` | Per-component descriptor under `<h2>` |
| Body copy | `typography.body-md` | inherited via `<p>`, `<td>` from globals | NBA rationale body, lifecycle reason, committee member proof_gap notes, event row body |
| Eyebrow / `t-label-caps` | `typography.label-caps` | `.t-label-caps` utility / `.c-field__label` primitive | Event row eyebrow ("Event"), transition row eyebrow ("Transition"), NBA card eyebrow ("Action"), member row eyebrow ("Member") |
| Metadata / timestamps | `typography.body-sm` | `.c-field__help` primitive: `var(--fs-body-sm)` (0.800rem) + `color: var(--color-on-surface-muted)` | `occurred_at`, `transitioned_at`, `computed_at`, `expires_at`, `last_touch_at`, `valid_from` / `valid_to` |
| Form error inline | `typography.body-sm` | `.c-field__error` primitive: `var(--fs-body-sm)` + `color: var(--color-error)` + `var(--font-mono)` + `::before content "[err] "` | Reason-capture modal validation (≥20 chars per 216 carry) on lifecycle transition reason + NBA dismiss reason + committee member role change reason |
| Monetary values | `typography.code-inline` + `font-feature-settings: 'tnum' 1` | `.c-code-inline` primitive | Opportunity `amount`, NBA `confidence` percentage, committee `coverage_score`, score values rendered in NBAExplainPanel evidence |
| IDs / tokens | `typography.code-inline` | `.c-chip-protocol` primitive | `customer_360_id`, `opportunity_id`, `nba_id`, `committee_id`, `member_id`, `transition_id`, `event_id`, `chunk_id`, `evidence_ref`, `pricing_recommendation_id`, `agent_run_id`, `approval_ref`, `superseded_by`, `source_event_ref`, `thread_id`, `actor_id` (when not PII), `canonical_identity_id`. Each chip surrounds the value with `[ ]` per `.c-chip-protocol::before/::after`. |

**Forbidden (auto-FAIL):**
- Any third typeface (not JetBrains Mono or Inter).
- Inline `font-size`, `font-weight`, `color` literals — use tokens only.
- Hard-coded dollar/peso amounts — use `<Money />` + `--fs-code` or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Banned-lexicon tokens (CLAUDE.md) — `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener); zero exclamation points in product surface copy. Banned-lexicon zero-match enforced at CI on NBA `rationale` body + lifecycle transition `reason` + committee member `proof_gap_refs[]` operator-note + Customer360 `current_summary` BEFORE approval-package dispatch.

---

## Color

Composition target per DESIGN.md "Composition proportion" (must hold per component, measured by visual mass not file LOC):

| Range | Token group | CRM 360 component usage |
|-------|-------------|-------------------------|
| 70–80% | `surface` + `surface-raised` | Component background (`--color-surface`); `.c-card` event row, transition row, NBA card, member row (`--color-surface-raised`) |
| 15–20% | `on-surface` + `on-surface-muted` + `on-surface-subtle` | All headings, body copy, table content, eyebrows, metadata, timestamps |
| 3–5% | `primary` + `primary-text` | Single primary CTA per component state ("Accept and execute" on NBAExplainPanel; "Invite role" on BuyingCommitteePanel; "Recompute NBA" inline mint-text on NBAExplainPanel header), focus rings, `.c-chip-protocol` IDs, `[ok]` glyph, kernel-pulse status dot on NBA recompute fresh state, `[up]` improving-trend glyph (sentiment trend) |
| 0–2% | `error` + `warning` + `info` + `success` | `.c-notice` banners, `.c-badge` row state, `[err]`/`[warn]`/`[info]`/`[ok]`/`[block]` glyphs, commercial_signal color-coding (`risk` → `--color-error`; `pricing` → `--color-warning`; `support` → `--color-info`; `interest`/`expansion`/`renewal` → `--color-success`; `silence` → `--color-on-surface-subtle`) |

| Role | Token | DESIGN.md citation | CRM 360 component usage |
|------|-------|--------------------|-------------------------|
| Component background | `--color-surface` (`#0A0E14` Kernel Black) | `colors.surface` | Every component wrapper; never `#000000` |
| Cards / panels | `--color-surface-raised` (`#1A1F2A` Process Gray) | `colors.surface-raised` | All `.c-card` instances across all 4 NEW components |
| Modal / popover surface | `--color-surface-overlay` (`#242B38`) | `colors.surface-overlay` | `.c-modal` confirm dialogs (NBA accept-and-execute, lifecycle transition reason capture, committee member role change, "Invite role" approval modal — reuses 215 billing-correction modal recipe per inheritance) |
| Hairline borders | `--color-border` (`#2D3441` Border Mist) | `colors.border` | All `.c-card` borders (1px), table `th`/`td` border-bottom, lifecycle timeline ordered-list connector lines |
| Strong borders | `--color-border-strong` (`#3A4250`) | `colors.border-strong` | Composed via `.c-input` on hover/focus — not authored locally |
| Primary text | `--color-on-surface` (`#E6EDF3` Terminal White) | `colors.on-surface` | All headings, body copy, table content |
| Muted secondary text | `--color-on-surface-muted` (`#7B8DA6` Vault Slate) | `colors.on-surface-muted` | `.t-lead` descriptors, table `th` text, eyebrows (when not state-coded), metadata, timestamps |
| Subtle / disabled text | `--color-on-surface-subtle` (`#6B7785` Comment Gray) | `colors.on-surface-subtle` | `.c-input::placeholder`, dimmed `silence` commercial_signal rows, dimmed `superseded`/`expired` NBA rows, dimmed `valid_to IS NOT NULL` historical member rows |
| Signal — single mint | `--color-primary` (`#00D9A3` Protocol Mint) | `colors.primary` | Primary CTA fills (one per component state), focus rings, `.c-status-dot--live` kernel-pulse on NBA recompute fresh + improving-trend chip, `[ok]` glyph |
| Mint as text (D-09 carry) | `--color-primary-text` | `tokens.css` line 186 | `.c-button--tertiary` text, `.c-chip-protocol` text, `[ok]` glyph color, `[up]` improving-trend glyph, "Recompute NBA →" / "View evidence →" / "Open approval →" / "Open subscription →" / "View P208 inbox →" inline action links. **Never as fill on surfaces larger than a button or chip** (DESIGN.md mint rule). |
| Mint subtle wash | `--color-primary-subtle` | `colors.primary-subtle` | `.c-button--tertiary:hover` background, `.c-chip--mint` background, `.c-chip--mint` improving-trend chip background |
| Error | `--color-error` (`#F85149`) | `colors.error` | `.c-notice c-notice--error` (lifecycle transition rejected by D-45 trigger; score provenance immutability violation by D-46 trigger; tombstone cascade dead-lettered after 5 attempts; drift threshold breached; RLS denied cross-tenant), `.c-button--destructive` (Soft-delete committee member), `.c-badge--error` (`commercial_signal == 'risk'`; `health == 'stalled'`; `risk_band == 'critical'`; NBA `expires_at < NOW()`; lifecycle `to_stage == 'lost'`; `actor_type == 'system'` rejection), `[err]` glyph, `.c-status-dot--error` (NBA recompute failed) |
| Warning | `--color-warning` (`#FFB800`) | `colors.warning` | `.c-notice c-notice--warning` (NBA expiring soon < 24h; lifecycle transition pending approval; committee coverage <50%; drift detected awaiting reconciliation), `.c-badge--warning` (`commercial_signal == 'pricing'`; `health == 'at_risk'`; `risk_band == 'at_risk'`; NBA `confidence < 0.5`; `superseded` NBA), `[warn]` glyph, `[down]` declining-trend sentiment glyph |
| Success | `--color-success` (`#3FB950`) | `colors.success` | `.c-notice c-notice--success` (NBA executed successfully; lifecycle transition recorded; committee coverage 100%; tombstone cascade completed), `.c-badge--success` (`commercial_signal == 'interest'`/`'expansion'`/`'renewal'`; `health == 'healthy'`; `risk_band == 'healthy'`; NBA `confidence ≥ 0.8`; `improving` sentiment trend; `valid_to IS NULL` active member), `[ok]` glyph |
| Info | `--color-info` (`#58A6FF`) | `colors.info` | `.c-notice c-notice--info` (NBA recompute scheduled; lifecycle history empty state; future-phase placeholder; tombstone cascade pending), `.c-badge--info` (`commercial_signal == 'support'`; `risk_band == 'watch'`; `actor_type == 'agent'`; `single_approval` mode chip; `crm` source_domain), `[info]` glyph |

**Accent reserved-for list (the 3–5% mint slice):**
1. **Single primary CTA per component state** (`.c-button--primary`):
   - TimelineDetailView: none (read-mostly; chips toggle filters via state, not mint fills)
   - LifecycleTransitionTimeline: none (read-only history)
   - NBAExplainPanel: `Accept and execute` (when status='active' AND not in ACTION_TYPES_REQUIRING_APPROVAL); `Open approval →` (mint-text inline link to `/operations/approvals?handoff_kind=crm360_nba_execute_approval` when in approval-required path)
   - BuyingCommitteePanel: `Invite role` (when missing_roles[].length > 0; opens approval modal); `Add member` (admin path; deferred to P218+ via `<PlaceholderBanner variant="future_phase_222_admin_ui">`)
   - execution-queue.tsx (EVOLVED): per-row `Open NBA →` mint-text inline link
2. Focus rings — globally inherited; never suppressed in module.css.
3. Protocol chip text — `.c-chip-protocol` for all 17 ID classes (customer_360_id, opportunity_id, nba_id, committee_id, member_id, transition_id, event_id, chunk_id, evidence_ref, pricing_recommendation_id, agent_run_id, approval_ref, superseded_by, source_event_ref, thread_id, canonical_identity_id, mutation_request_id).
4. Status dot live — `.c-status-dot--live` on NBA recompute fresh chip + active subscription rows + improving-sentiment trend.
5. `[ok]` and `[up]` glyphs.
6. `::selection` — global.

**NOT used as fill anywhere:** card borders, table headers, page background, body copy, event-row eyebrows, NBA-card backgrounds, lifecycle-stage-badge fills (these use `.c-badge--{state}` per stage class, NOT mint). Mint is the CRM 360 dashboard's single signal — every other affordance is token-only neutral or state-class.

---

## Inheritance Bindings (load-bearing)

Every approval, lifecycle, mutation, pricing, classification, evidence, and grounding field rendered in any 222 surface MUST cite the upstream contract verbatim. Auto-FAIL: any field name re-derived without citation; any state literal not enumerated below; any approval gate omitting 206 mutation-class binding; any pricing render that hard-codes a literal or tier-name string; any credential render that violates §Sensitive Credential UI Binding (Layer 6); any health/NBA evidence render that violates 216 binding contracts; any `createApprovalPackage` reference (must be `buildApprovalPackage` per D-42).

### From 205-UI-SPEC §Pricing Engine ownership (P222 must NOT take pricing ownership)

| 222 surface element | 205 contract source | Binding |
|---------------------|---------------------|---------|
| Opportunity `amount` column rendered in TimelineDetailView event payload + workspace-shell evolution | `PricingRecommendation` (205-01-CONTRACT-LOCK) | `<Money fromPricingRecommendation={pr_id} />` recipe XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel via `<PlaceholderBanner>`. Zero hard-coded dollar literals. Resolved server-side via `opportunities.pricing_context_id` FK → `pricing_recommendation_id`. |
| Opportunity state changes that mention pricing in lifecycle transition reason | 205-UI-SPEC §sentinel + per D-23 | `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim until Pricing Engine context attached |
| NBA execute `action_type ∈ {propose_expansion, send_renewal_reminder}` on customer_360_records | 205 + 215 §sentinel | `<Money>` XOR sentinel; never invents discount or tier copy |

### From 206-UI-SPEC §Mutation-class doctrine

| 222 surface element | 206 contract source | Binding |
|---------------------|---------------------|---------|
| NBA execute "Accept and execute" CTA (NBAExplainPanel) | `external.send` root + `single_approval` (when action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL) | Modal carries `.c-chip-protocol` "Root: `external.send`"; reason capture (≥20 chars per 216 carry); `evidence_pack_ref` REQUIRED when `external.send`; calls `buildApprovalPackage(kind='crm360_nba_execute_approval', ...)` per D-42 (NEVER `createApprovalPackage`) |
| Lifecycle transition modal (workspace-shell evolution per D-24 + LifecycleTransitionTimeline read context) | per-stage mutation-class — high-risk transitions cross `mutation-class-policy.md` boundaries | When `to_stage IN ('customer', 'lost')` OR role-handoff across primary owner classes: calls `buildApprovalPackage(kind='crm360_lifecycle_transition_approval', ...)` per D-42; modal renders `.c-chip-protocol` "Root: `crm360.lifecycle_transition`"; reason capture (≥20 chars); `evidence_ref` REQUIRED; D-45 BEFORE UPDATE trigger validates state-machine; rejected transitions render `<.c-notice c-notice--error>` "[err] Lifecycle transition {from_stage} → {to_stage} rejected by D-45 state-machine trigger" |
| Tombstone cascade trigger (consumed via copilot-record-panel evolution per D-24 when CDP profile tombstone propagates per D-32) | `data.export` + tombstone-cascade-approval per D-42 | When cascade affects opportunity with `pricing_context_id IS NOT NULL`: calls `buildApprovalPackage(kind='crm360_tombstone_cascade_approval', ...)` per D-42; modal renders cascade target counts via `<PIIRedactedField />` per affected row + dual-approval indicator |
| Soft-delete committee member CTA (BuyingCommitteePanel) | `crm360.member_role_change` + `single_approval` for high-influence member removal | `.c-button--destructive`; reason capture (≥20 chars); writes append-only `valid_to=NOW()` row per D-15 (NEVER UPDATE in place) |
| Autonomy ceiling reached (NBA execute) | `mutation-class-policy.md` autonomy_ceiling | `.c-notice c-notice--error` `[block] Autonomy ceiling reached for crm360_nba_execute_approval` above the action menu |

### From 207-UI-SPEC §Orchestration substrate

| 222 surface element | 207 contract source | Binding |
|---------------------|---------------------|---------|
| NBA recompute run lineage (NBAExplainPanel) | `RunApiEnvelope` (207-01) | Every NBA row renders `<RunStatusBadge run_id={...}>`; recompute crons `crm360-daily-recompute.js` + sync triggers from `appendLifecycleTransition` emit `kind='crm360-nba-recompute'`; `<.c-status-dot--live>` on freshness chip when `last_recompute_completed_at < 1h` |
| Lifecycle transition run lineage (LifecycleTransitionTimeline + workspace-shell evolution) | `RunApiEnvelope` | Every transition row renders `<RunStatusBadge run_id={...}>` for the transition's source AgentRun (when actor_type='agent'); when actor_type='human', renders actor chip via `<.c-chip-protocol>` |
| Tombstone cascade run lineage (consumed via D-32 copilot-record-panel evolution) | `RunApiEnvelope` | Plan 04 + Plan 06 outbox worker emits `kind='crm360-tombstone-cascade'`; failed cascades after 5 attempts render `<.c-badge--error>` "[err] Dead-lettered" |
| Drift reconciliation run lineage (operator task created on threshold breach) | `RunApiEnvelope` + `AgentFailureClass` 7 literals | Plan 06 cron `crm360-drift.js` emits `kind='crm360-drift-reconciliation'`; threshold breach creates operator task in P208 Task Board |
| AgentRunEventType registration | `AgentRunEventType` (207-02) | All 18 NEW event types registered (see frontmatter `parent_doctrine_chain` 207-UI-SPEC entry); each rendered as timeline event chip on the relevant component (TimelineDetailView event row when `actor_type='agent'`; NBAExplainPanel run lineage; LifecycleTransitionTimeline transition row) |

### From 208-UI-SPEC §PARENT cockpit pattern

| 222 surface element | 208 contract source | Binding |
|---------------------|---------------------|---------|
| Approval Inbox handoff_kind filter chips extension | 208-04 + 220 26th + 221 27/28/29th literals | **32 chips total** when 222 ships in production: 4 P207 (`approval`, `recovery`, `follow_up`, `manual_input`) + 5th P214 (`billing_charge_approval`) + 6th P215 (`billing_correction_approval`) + 7th P216 (`support_response_approval`) + 8th P216 (`save_offer_approval`) + 12 P218..P220 chips (218×4 + 219×8 + 220×7 = 19; trimmed to 12 active per 220 closeout — reconcile at 220 doctrine layer) + 27th P221 (`consent_drift_resolution`) + 28th P221 (`audience_activation_approval`) + 29th P221 (`dsr_export_approval`) + **30th P222 (`crm360_nba_execute_approval`)** + **31st P222 (`crm360_lifecycle_transition_approval`)** + **32nd P222 (`crm360_tombstone_cascade_approval`)**. 222 ADDS 3 new literals to the chain. Row rendering is DEFERRED to a future P208 admin extension per `future_phase_222_approval_inbox_extensions` translation gate. |
| Morning Brief rollups | 208-02 + D-29 carry | `lib/markos/crm360/brief/register.ts` registers `crm360_nba_summary` (top-N active NBA by `primary_owner_user_id`) + `committee_gap_summary` (top-N committee-gap opportunities) entry types into `lib/markos/brief/registry.ts` extension-point. Future P208 Morning Brief surface renders these rollups; 222 does NOT modify the Morning Brief UI itself. |
| Task Board task entry types | 208-03 + D-29 carry | Drift reconciliation cron creates operator task with `task_kind=crm360_drift_reconciliation` (P208-03 surface; deep-link from workspace-shell to `/operations/tasks?task_kind=crm360_*`); NBA expiry creates task with `task_kind=crm360_nba_expired` |
| Mobile priority registration | 208-01 mobile_priority literals | All 4 NEW + 3 EVOLVED components register in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: crm360_*`; **execution-queue.tsx is `critical`** (sales/CS mobile field-of-view); 6 surfaces `secondary` |
| CRM reporting cockpit | D-29 + Plan 05 carry | `lib/markos/crm/reporting.ts` gains `computeLifecycleFunnel` + `computeCommitteeCoverageRollup` + `computeNbaExecutionRate` rollups. Existing P105 reporting cockpit consumes these additively; 222 does NOT modify the cockpit UI itself. |

### From 209-UI-SPEC §Evidence + claim safety

| 222 surface element | 209 contract source | Binding |
|---------------------|---------------------|---------|
| NBA `evidence_refs[]` rendering (NBAExplainPanel) | EVD-01 (factual claims linked to citations) + EVD-04 (agents reuse non-stale evidence) | NBA `evidence_refs[]` (FK → EvidenceMap) rendered via `<KbGroundingPanel />` extracted component (216 §D-15 — first consumed in 217-06; REUSED here); top-3 sources with `chunk_id` chips (`<.c-chip-protocol>`), `source_type` badge, `relevance_score` `.c-badge`; aggregate `confidence` notice; **`nba_evidence_refs_nonempty` CHECK constraint** at DB enforces non-empty array per Plan 04 migration 108 (no black-box NBA) |
| Score provenance rendering (Customer360 score envelope per D-09 — exposed indirectly via NBA priority) | EVD-04 + D-46 immutability | `score_provenance` rows are immutable per D-46 BEFORE UPDATE trigger (recorded_at + score_value + score_kind + attribution_chain frozen on INSERT; only `superseded_at` + `superseded_by` can be set); new score = new row pattern; rendered via `.c-chip-protocol` for `provenance_id` + `recorded_at` timestamp + `<.c-badge--{state}>` for `score_kind` |
| Lifecycle transition `evidence_ref` rendering (LifecycleTransitionTimeline) | EVD-01 + D-12 | Each transition row renders `evidence_ref` via `<.c-chip-protocol>` + "View evidence →" mint-text inline link to `/evidence/{evidence_ref}` (existing P209 surface) |
| Banned-lexicon zero-match (NBA rationale + lifecycle reason + committee proof_gap operator-note + Customer360 current_summary) | 213-04 + 216 §banned-lexicon | CI assertion enforces zero-match BEFORE approval-package dispatch path; runs `scripts/marketing-loop/check-banned-lexicon.mjs` server-side before the dispatch |

### From 213-UI-SPEC §Tenant 0 readiness gate consumer

| 222 surface element | 213 contract source | Binding |
|---------------------|---------------------|---------|
| 222 substrate is PRIVATE doctrine | 213-04 §Public-Proof Boundary | `customer_360_id`, `opportunity_id`, `nba_id`, `committee_id`, `member_id`, `transition_id`, `event_id`, `agent_run_id`, `approval_ref`, `pricing_recommendation_id`, `evidence_ref` UUIDs MAY be cited in case-studies via `<.c-chip-protocol>`; outcome content (raw NBA rationale body, lifecycle stage funnels, opportunity amounts, committee member names + roles, sentiment trends, customer email/phone/NIT, commercial_signal classification per row) is NEVER published. Banned-phrases (`unlimited`, `instant`, `guaranteed`, `100%`, `bank-grade`, `military-grade`) zero-match enforced. |
| Tenant 0 readiness gate consumer | 213-05 go/no-go | Phase 222 does NOT directly render the tenant_0 gate (no dedicated 222 page tree); the existing `app/(markos)/crm/*` page tree continues to consume the gate via existing layout chrome |

### From 214-UI-SPEC §PARENT — SaaS Suite Activation

| 222 surface element | 214 contract source | Binding |
|---------------------|---------------------|---------|
| Customer360 `canonical_identity_id` FK target | 214 §SaaS bridge | FK targets P221 `cdp_identity_profiles.profile_id` via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` per D-21 + D-37 — NOT a P214 SaaS identity model. The 214 `<SaaSActivationPanel />` is NOT directly composed in 222 surfaces. |
| Architecture-lock D-32 | 214-06 §architecture-lock | All 222 routes are LEGACY `api/*.js` (NOT App Router `app/api/.../route.ts`) per D-43; helper canon `buildApprovalPackage` (NOT `createApprovalPackage`) per D-42 |

### From 215-UI-SPEC §PARENT — SaaS Billing + Sensitive Credential UI Binding

| 222 surface element | 215 contract source | Binding |
|---------------------|---------------------|---------|
| Sensitive Credential UI Binding (Layer 6) | 215 §6-layer defense-in-depth | **Inherited verbatim**. Every 222 surface that displays Customer360-resolved CDP IdentityProfile (raw `primary_email` / `primary_phone` / `company_name`) honors B-1 through B-8 from 215. See §Sensitive Credential UI Binding below. |
| Sentinel discipline | 215 §sentinel + 216 §save-offer | `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim via `<PlaceholderBanner variant="billing_placeholder">` whenever Opportunity `pricing_context_id IS NULL` |
| 5 PII field constants | 215-01 `lib/markos/saas/billing/log-redaction.ts` | `STRIPE_PII_FIELDS`, `MP_PII_FIELDS`, `QB_PII_FIELDS`, `SIIGO_PII_FIELDS`, `DIAN_PII_FIELDS` — every field tagged in any of the 5 lists renders `[REDACTED]` placeholder via `<PIIRedactedField />` extracted component |
| 215 billing-correction modal recipe | 215 + 216 §approval handoff filter chip set | REUSED VERBATIM for `crm360_nba_execute_approval` (NBAExplainPanel "Accept and execute" modal) AND `crm360_lifecycle_transition_approval` (workspace-shell lifecycle transition modal) AND `crm360_tombstone_cascade_approval` (cascade-affected-opportunity preview modal); modal renders `<PricingContextChip />` (when `pricing_context_id IS NOT NULL`), `<PIIRedactedField />` per PII row, audit log preview |

### From 216-UI-SPEC §PARENT — SaaS Health/Churn/Support/Usage

| 222 surface element | 216 contract source | Binding |
|---------------------|---------------------|---------|
| Health score rendering (NBA priority bias + Customer360 record context) | 216 §UI Binding Contract 1 | `<HealthScoreBadge />` extracted component (D-15 — first consumed in 217-06; REUSED here) on TimelineDetailView header (Customer360 record-level eyebrow) + NBAExplainPanel rationale (when subject_type='customer_360' AND health_score < 60 → urgency upgrade per P103 D-04 inheritance); renders `usage` 0.30 + `support` 0.20 + `billing` 0.20 + `engagement` 0.15 + `relationship` 0.15 weighted-sum verbatim per P216 |
| Risk band rendering | 216 §UI Binding Contract 1 | `<RiskBandBadge />` extracted component on TimelineDetailView header + execution-queue evolution; renders `healthy` 80-100 / `watch` 60-79 / `at_risk` 40-59 / `critical` 0-39 + bracketed-glyph pairing (`[ok]`/`[info]`/`[warn]`/`[err]`) |
| Trend rendering (sentiment trend over time on TimelineDetailView) | 216 §UI Binding Contract 1 | 4 trend literals + bracketed glyph: `improving` `[up]` mint, `stable` `[flat]` neutral, `declining` `[down]` warning, `insufficient_data` `[—]` subtle |
| Recompute CTA (NBAExplainPanel) | 216 §UI Binding Contract 1 inherited pattern | `.c-button--secondary` "Recompute NBA"; emits AgentRun `kind='crm360-nba-recompute'`; success state `<.c-notice c-notice--success>` "[ok] NBA recomputed"; failure state `<.c-notice c-notice--error>` "[err] NBA recompute failed — `evidence_refs[]` empty" when `nba_evidence_refs_nonempty` CHECK raises |
| Classifier rendering (TimelineDetailView per-row) | 216 §UI Binding Contract 2 | `<ClassifierChipRow />` extracted component (216 §D-15 — first consumed in 217-06; REUSED here) on TimelineDetailView per-row; renders `commercial_signal` 7-enum + `source_domain` 11-enum + `actor_type` 3-enum + `sentiment` 3-enum chip rendering |
| KB grounding panel (NBAExplainPanel) | 216 §UI Binding Contract 2 | `<KbGroundingPanel />` extracted component on NBAExplainPanel rationale section; renders top-3 sources with `chunk_id` chips, `source_type` badge, `relevance_score` badge, snippet preview; aggregate `confidence` notice |
| 5 PII classification badges | 216 §UI Binding Contract 4 | `<RetentionClassChip />` extracted component on every PII-displaying surface; renders `pii_classification` ENUM literal: `no_pii`, `pseudonymous`, `personal`, `sensitive`, `highly_sensitive` |
| PII redacted field | 216 §UI Binding Contract 4 | `<PIIRedactedField />` extracted component on Customer360 `display_name` / `current_summary`, Opportunity `title`, committee member identity (resolved via P221 adapter); renders `[REDACTED]` placeholder via `.c-code-inline` + `--color-on-surface-subtle` |

### From 217-UI-SPEC §PARENT — SaaS Suite Revenue + Heavy-UI Pattern

| 222 surface element | 217 contract source | Binding |
|---------------------|---------------------|---------|
| D-15 selective extraction recipe | 217-06 §D-15 | The 7 components first consumed in 217-06 (`<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />`) are REUSED in 222 surfaces — NOT re-implemented. Storybook stories for each remain registered under their original 217-06 `Saas/*` path; 222 stories register UNDER `Crm360/*` path and IMPORT the extracted components |
| D-21 server/client boundary | 217-06 §D-21 carry | `app/(markos)/crm/**` page tree (PRESERVED per D-43) remains server-component default; the 4 NEW `components/markos/crm/*` are CLIENT components per existing convention (state-owning, interactive) |
| D-32 architecture-lock | 217-06 §architecture-lock | All 222 routes are LEGACY `api/*.js` per D-43; auth via `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` per D-35; tests are `*.test.js` only per D-39; OpenAPI at `contracts/openapi.json` per D-40; MCP registry at `lib/markos/mcp/tools/index.cjs` per D-41; cron at `api/cron/*.js` with `x-markos-cron-secret` header per D-44; helper canon `buildApprovalPackage` per D-42 |

### From 221-UI-SPEC §PARENT — CDP Substrate

| 222 surface element | 221 contract source | Binding |
|---------------------|---------------------|---------|
| Customer360 `canonical_identity_id` FK | 221 D-20 + 222 D-21 | Customer360 reads CDP `IdentityProfile` + `ConsentState` + `TraitSnapshot` via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` per D-21 (read-through adapter) — CRM never stores identity/consent/trait data; only commercial overlay |
| CDP events emit on CRM mutation | 221 D-08 + 222 D-07/D-22 | CRM mutations emit `EventEnvelope` rows to `cdp_events` with `event_domain='crm'` (P221 D-08); shared `source_event_ref` threads CRM activity ↔ CDP events ↔ EvidenceMap (P209) |
| CDP consent re-validation at dispatch (double-gate) | 221 D-18 + 222 D-23 | NBA execute paths that fire `external.send` (action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL) honor P221 D-18 double-gate — snapshot membership + current ConsentState re-validation; calls `validateBatch(profileIds[], channel)` from `lib/markos/cdp/audiences/activation.ts` (P221 export) |
| CDP tombstone cascade propagation | 221 D-24 + 222 D-32 | Profile tombstone → Customer360 `canonical_identity_id` nulled, PII-derived columns scrubbed (`display_name`, `current_summary`); ownership/lifecycle/NBA preserved for audit but marked `tombstoned=true`; Opportunity + Committee preserved (legal + revenue trail); cascade via D-47 outbox pattern (replayable + idempotent + dead-letter aware) |

### From 213.4-VALIDATION.md (carry-forward decisions)

| Decision | Phase 222 enforcement |
|----------|----------------------|
| **D-08** (token-only) | Zero inline hex literals in any of `components/markos/crm/{TimelineDetailView,LifecycleTransitionTimeline,NBAExplainPanel,BuyingCommitteePanel}.{tsx,module.css}`. Every color via `var(--color-*)`. Every spacing via `var(--space-*)`. Every typography via DESIGN.md `typography.*`. Auto-FAIL on any `#[0-9a-fA-F]` literal. The closeout `architecture-lock-rerun.test.js` asserts zero matches across `components/markos/crm/{TimelineDetailView,LifecycleTransitionTimeline,NBAExplainPanel,BuyingCommitteePanel}*`. |
| **D-09** (mint-as-text) | `[ok]` and `[up]` glyph color, all action-link inline CTAs ("Recompute NBA →", "View evidence →", "Open approval →", "Open subscription →", "View P208 inbox →"), all `.c-chip-protocol` IDs use `--color-primary-text`. Mint never used as fill on event-row, NBA-card, member-row, or any surface > button or chip. |
| **D-09b** (`.c-notice` mandatory) | Every gating state composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `components/markos/crm/`. |
| **D-13** (`.c-card--feature` reserved) | **Forbidden in this phase.** All cards use `.c-card` default. |
| **D-14** (no `.c-table` primitive) | All 4 NEW components use vanilla `<table>` / `<ol>` / `<ul>` semantic + token-only recipe + `.c-badge--{state}` for row state. The `.c-table` primitive remains deferred. |
| **D-15** (selective extraction) | The 7 extracted components first consumed in 217-06 (`<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />`) are REUSED in 222. Storybook stories for the 4 NEW 222 components register `Crm360/{TimelineDetailView,LifecycleTransitionTimeline,NBAExplainPanel,BuyingCommitteePanel}` named-state CSF3 stories (≥5 per component: Empty / Populated / Loading / Filtered / Error / Tombstoned variants per surface where applicable). |
| **D-21** (server/client boundary) | The 4 NEW `components/markos/crm/*.tsx` files are **client components** (`'use client'`) — they own filter state, accept-and-execute optimistic update, member role inline editor. The CONSUMING `app/(markos)/crm/**` page tree pages remain **server components** by default per existing convention; they fetch data via `requireHostedSupabaseAuth` + tenant-scoped supabase client and pass props to the client components. The boundary is named in each component's file header comment. |

---

## Sensitive Credential UI Binding (Layer 6 — inherited verbatim from 215, EXTENDED to PII per 216)

This section inherits 215-UI-SPEC §Sensitive Credential Handling — UI Binding Contract verbatim. It applies to TimelineDetailView (event row payload may surface CDP-resolved IdentityProfile fields per D-22 `source_event_ref` join), NBAExplainPanel (rationale body may reference Customer360 `display_name` / `current_summary`), BuyingCommitteePanel (member rows resolve to P221 IdentityProfile via adapter), workspace-shell evolution (default record detail header renders Customer360 `display_name`), copilot-record-panel evolution (`current_summary` rendering).

### Defense-in-depth posture (6 layers — 215 ships layers 1-5; 222 surfaces enforce Layer 6)

| Layer | Component | Provider | Enforcement |
|-------|-----------|----------|-------------|
| 1. Storage | P221 `cdp_identity_profiles` PII columns + P215 vault for billing credentials | 221-01 + 215-01 | Plaintext credentials never persisted; only `vault_ref` UUID + Vault pointer |
| 2. DB-trigger | `BILLING_CREDENTIAL_REQUIRES_VAULT_REF` (P215) + `enforce_lifecycle_transition` (D-45) + `enforce_score_provenance_immutability` (D-46) | 215-01 migration 118 + 222-04 migration 108 | INSERT plaintext blocked at DB level; lifecycle state-machine enforced at DB level (per D-45 RH6 fix); score provenance immutable at DB level (per D-46 RM2 fix) |
| 3. MCP sanitization | `sanitizeBillingResponse` (P215) + `sanitizeCdpResponse` (P221 — `pii-guard.cjs`) | 215-01 + 221-05 + 217-05 saas.cjs | All MCP tool output strips 12 `CREDENTIAL_FIELDS` + `vault_ref` + raw PII fields. The 4 P222 MCP tools (`get_customer_360`, `get_opportunity_context`, `list_committee_gaps`, `list_next_best_actions`) sanitize CDP-resolved PII via P221 pii-guard |
| 4. Log redaction | `redactWebhookPayload` + 5 PII-field-list constants (215) + tombstone-cascade outbox state (D-47) | 215-01 + 222-04 | Webhook payloads + outbox rows logged as `payload_redacted` only |
| 5. Prompt-injection defense | `stripCredentialsForLLM` (P215) + Customer360 `current_summary` banned-lexicon zero-match BEFORE approval-package dispatch | 215-01 + 222 §banned-lexicon | LLM context filtered upstream of any agent prompt; current_summary checked at CI |
| **6. UI surface enforcement** | **All 4 NEW components + 3 EVOLVED components consuming Customer360 PII** | **THIS PHASE** | **Bindings B-1..B-8 below** |

### UI binding contract for 222 surfaces consuming 215/216/221 PII (verbatim from 215, extended)

| Binding | Rule | Verification |
|---------|------|--------------|
| **B-1. Allowed display fields** | Render ONLY: `customer_360_id` + `lifecycle_stage` + `mode` + `entity_type` + `health` + `risk_score` + `fit_score` + `intent_score` + `engagement_score` + `lifecycle_transitions[]` summary + `next_best_action_id` + `open_tasks` + `active_opportunities` + `last_meaningful_event_at` + `tombstoned` boolean. NEVER render: raw `display_name` (use `<PIIRedactedField />` per `pii_classification`); raw `current_summary` (banned-lexicon checked, then rendered with audit log emission); raw email/phone/NIT/company_name from P221 IdentityProfile (always via `<PIIRedactedField />`). | Architecture-lock test asserts `grep -P '\b(display_name=|current_summary=|primary_email|primary_phone|company_name)\b' components/markos/crm/{TimelineDetailView,LifecycleTransitionTimeline,NBAExplainPanel,BuyingCommitteePanel}*.tsx` returns ONLY uses inside `<PIIRedactedField />` props |
| **B-2. `customer_360_id` / `opportunity_id` / `nba_id` chip rendering** | The UUID renders via `<.c-chip-protocol>` (D-09 mint-as-text). Never as fill. | Storybook visual regression test asserts mint text only |
| **B-3. PII-field redaction** | For any field with `pii_classification IN ('sensitive', 'highly_sensitive')` per 216 inheritance, render via `<PIIRedactedField />` extracted component → `.c-code-inline` + `--color-on-surface-subtle` reading `[REDACTED]` verbatim. Examples: `display_name: [REDACTED]`, `email: [REDACTED]`, `phone: [REDACTED]`, `member_name: [REDACTED]`. | Architecture-lock test asserts `grep -c '\[REDACTED\]' components/markos/crm/*.tsx` >= count of PII display fields |
| **B-4. Clipboard copy block on PII displays** | `onCopy` event handler MUST `preventDefault()` for any DOM node containing a PII display. The `<PIIRedactedField />` `'use client'` subcomponent exposes the `onCopy` interceptor. The `<.c-chip-protocol>` chip itself MAY be copied (it contains only the public UUID). | Storybook interaction test asserts `clipboard.writeText` is never invoked on PII block |
| **B-5. Audit-log every identity view** | Every render of a Customer360-resolved IdentityProfile field MUST emit a `markos_audit_log` row (P201 hash chain) with `event_type == 'identity_view'`, `actor == requesting_user.id`, `customer_360_id == displayed_customer_360_id`, `payload_redacted == { displayed_fields: [...] }`. Audit emit happens server-side in the API handler. | API handler test asserts `INSERT INTO markos_audit_log` row count == 1 per identity view fetch |
| **B-6. No raw identity round-trip** | 222 reads only — TimelineDetailView fetches via GET `/v1/crm/timeline?subject_id=X` (Plan 03); NBAExplainPanel via GET `/v1/crm/nba`; BuyingCommitteePanel via GET `/v1/crm/committees`. Response body NEVER echoes raw PII for `pii_classification IN ('sensitive', 'highly_sensitive')` rows; uses `<PIIRedactedField />` server-side hint or `[REDACTED]` literal. | API handler test asserts response body shape excludes raw PII fields |
| **B-7. CRM360 mutations are approval-gated per D-28** | Customer360 PATCH (lifecycle_stage / owner / current_summary) and Opportunity PATCH (stage / amount / health) are approval-aware per D-28; high-risk mutations (lifecycle to `customer`/`lost`, pricing_context_id change, owner handoff across roles) call `buildApprovalPackage` per D-42. Low-risk (note, NBA dismiss, role tag) proceed within role limits. | Plan 04 + Plan 05 ship integration tests asserting buildApprovalPackage called when threshold breached |
| **B-8. Banned-lexicon zero-match on doctrine prose + redaction strings** | The PII-field-list constants + 5 redaction strings (`'[REDACTED]'`) are doctrine prose; banned-lexicon enforced at zero-match. Same enforcement applies to NBA `rationale` body + lifecycle transition `reason` + committee member `proof_gap_refs[]` operator-note + Customer360 `current_summary` BEFORE any approval-package dispatch. | CI assertion `scripts/marketing-loop/check-banned-lexicon.mjs` runs against `components/markos/crm/**/*.{tsx,module.css}` + lib/markos/crm360/ — zero matches required |

---

## Surface Inventory — 4 NEW components + 3 EVOLVED components

### Surface A — `components/markos/crm/TimelineDetailView.tsx` (NEW DEFAULT record detail view per D-24)

**Files:**
- `components/markos/crm/TimelineDetailView.tsx` — NEW; **`'use client'`**; chronological timeline with filters.
- `components/markos/crm/TimelineDetailView.module.css` — NEW; token-only.
- `.storybook/stories/TimelineDetailView.stories.tsx` — NEW; CSF3 named state stories.

**Replaces as default:** `components/markos/crm/record-detail.tsx` (preserved on disk for backwards-compat; workspace-shell.tsx evolution swaps the default per D-24)

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <header>                                                 |
|   <h2>Timeline</h2>                                      |
|   <PIIRedactedField pii_classification="personal"        |
|     value={display_name} /> via Customer360 record       |
|   <HealthScoreBadge score={...} /> + <RiskBandBadge />   |
|   <fieldset><legend>Source</legend>                      |
|     <ClassifierChipRow chips={11 source_domains} />      |
|   </fieldset>                                            |
|   <fieldset><legend>Signal</legend>                      |
|     <ClassifierChipRow chips={7 commercial_signals} />   |
|   </fieldset>                                            |
| </header>                                                |
+----------------------------------------------------------+
| <main>                                                   |
|   <ul> event rows (newest first):                        |
|     <li> <time> <ClassifierChipRow                       |
|            chips={[source_domain,commercial_signal,      |
|                   actor_type,sentiment]} />              |
|          <body>{payload preview}</body>                  |
|          <footer> <evidence_chip> <thread_chip>          |
|     </li>                                                |
| </main>                                                  |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Single column. Filter chips wrap. Each event row stacks vertically with reduced metadata.

**Components used:** `<PIIRedactedField />` (216 §D-15 reused), `<HealthScoreBadge />` (216 §D-15 reused), `<RiskBandBadge />` (216 §D-15 reused), `<ClassifierChipRow />` (216 §D-15 reused; renders 11 source_domains + 7 commercial_signals + 3 actor_types + 3 sentiments + 5 source_domain visual coding), `.c-card`, `.c-chip` for filter chips, `.c-chip-protocol` for `event_id` / `evidence_ref` / `thread_id` / `actor_id` (when not PII), `.c-notice c-notice--info` empty state, vanilla `<ul>` for event list, `<time>` semantic.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Timeline" |
| Source filter legend | "Source" |
| Signal filter legend | "Signal" |
| 11 source_domain chip labels (verbatim) | "website", "email", "messaging", "meeting", "crm", "billing", "support", "product", "social", "research", "agent" |
| 7 commercial_signal chip labels (verbatim per CONTEXT D-05) | "interest", "risk", "expansion", "renewal", "support", "pricing", "silence" |
| 3 actor_type chip labels (verbatim) | "human", "agent", "system" |
| 3 sentiment chip labels (verbatim) | "positive", "neutral", "negative" |
| Empty (no events) | `[info] No events recorded yet for this record.` |
| Empty (filter applied) | `[info] No events match filter. Clear filters to see all events.` |
| Loading | (server-rendered; no client loading state on initial render; client filter changes show inline `<.c-status-dot--live>` pulse) |
| Error | `[err] Failed to load timeline. {error_message}.` |
| Stale (last_meaningful_event_at > 30d) | `[warn] No meaningful events in 30 days — silence signal.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render before data resolves | (server-rendered; props-supplied data) |
| `empty` | Zero events | Empty notice |
| `populated` | Events > 0 | Full list with filter chips |
| `filtered` | Filter chip(s) selected, filtered event count > 0 | Filtered list with active chip(s) highlighted |
| `filtered-empty` | Filter chip(s) selected, filtered event count == 0 | Filter-empty notice with "Clear filters" mint-text inline action |
| `error` | Fetch error | Error notice with retry mint-text inline action |
| `tombstoned` | Customer360.tombstoned == true (per D-32) | Header renders `<.c-notice c-notice--info>` "[info] Profile tombstoned per DSR — display fields scrubbed."; events still render with PII redacted |

**Data dependencies:**
- `crm_activity_ledger` rows extended per D-05/D-06 with `source_domain`, `commercial_signal`, `actor_type`, `actor_id`, `opportunity_id`, `sentiment`, `thread_id`
- `customer_360_records` for header context (display_name + health_score + risk_band; via P221 read-through adapter for IdentityProfile)
- F-119 `/v1/crm/timeline` GET with subject_id + source_domain + commercial_signal + opportunity_id + before_at + limit query params (per Plan 03)
- 11 source_domain enum (verbatim per D-05)
- 7 commercial_signal enum (verbatim per D-05)
- 3 actor_type enum (verbatim per D-05)
- 3 sentiment enum (verbatim per D-05; sentiment classifier carry from 220-04 LLM)

**Accessibility focus order:** (1) `<h2>Timeline</h2>` (programmatic focus on route change) → (2) Source filter chip group (chip 1, chip 2, ... chip 11) → (3) Signal filter chip group (chip 1, ... chip 7) → (4) Event list (`<ul>` keyboard navigable; arrow keys move between events).

**Motion:** `.c-status-dot--live` kernel-pulse on filter-recompute fresh state (freezes under `prefers-reduced-motion`). Filter chip toggle: 100ms color transition; 0ms under reduced-motion. Event list: NO scroll-into-view auto-scroll; respect user scroll position.

**Acceptance Criteria:**
- AC TDV-1: `components/markos/crm/TimelineDetailView.tsx` is a client component (verified by `'use client'` directive present)
- AC TDV-2: Component renders all 11 source_domain filter chips verbatim
- AC TDV-3: Component renders all 7 commercial_signal filter chips verbatim
- AC TDV-4: Component fetches `/api/v1/crm/timeline?subject_id=X&source_domain=Y&commercial_signal=Z` with proper URL encoding
- AC TDV-5: Empty state renders `[info] No events match filter. Clear filters to see all events.` verbatim
- AC TDV-6: Filter combination (source_domain + commercial_signal) narrows results correctly (composite index per Plan 03 Pitfall 3)
- AC TDV-7: Customer360 PII fields (display_name) render via `<PIIRedactedField />` with `pii_classification` ENUM
- AC TDV-8: Per-row `commercial_signal` color-coding via `.c-badge--{state}` classes (`risk` → `--color-error`; `pricing` → `--color-warning`; `support` → `--color-info`; `interest`/`expansion`/`renewal` → `--color-success`; `silence` → `--color-on-surface-subtle`)
- AC TDV-9: Per-row sentiment indicator paired with bracketed glyph (`positive` `[ok]`, `neutral` `[—]`, `negative` `[warn]`)
- AC TDV-10: Tombstoned state renders info notice "[info] Profile tombstoned per DSR — display fields scrubbed."
- AC TDV-11: D-21 server/client boundary noted in file header comment
- AC TDV-12: Storybook story `Crm360/TimelineDetailView` registers ≥5 named-state stories (Empty / Populated / Loading / Filtered / FilteredEmpty / Tombstoned)
- AC TDV-13: D-08 token-only enforced (zero hex literals in TimelineDetailView.module.css)
- AC TDV-14: Replaces record-detail.tsx as default via workspace-shell.tsx evolution per D-24 (verified in workspace-shell.tsx integration test)
- AC TDV-15: Backward-compat — record-detail.tsx file preserved on disk; legacy callers continue to function (no signature break)

---

### Surface B — `components/markos/crm/LifecycleTransitionTimeline.tsx` (NEW)

**Files:**
- `components/markos/crm/LifecycleTransitionTimeline.tsx` — NEW; **`'use client'`**; stage history viewer.
- `components/markos/crm/LifecycleTransitionTimeline.module.css` — NEW; token-only.
- `.storybook/stories/LifecycleTransitionTimeline.stories.tsx` — NEW; CSF3 named state stories.

**Layout grid:**
```
+----------------------------------------------------------+
| <h2>Lifecycle history</h2>                               |
| <p class="t-lead">{N} stage transition(s).               |
+----------------------------------------------------------+
| <ol> transitions (newest first):                         |
|   <li> <time> <fromStage> → <toStage>                    |
|        <actor_chip> <reason_chip> <evidence_chip>        |
|        [if D-45 trigger fired with v_decision='rejected']|
|        <.c-notice c-notice--error>                       |
|        [if reason='handoff']                             |
|        <ownership_handoff_indicator>                     |
|   </li>                                                  |
| </ol>                                                    |
+----------------------------------------------------------+
```

**Components used:** `.c-card` for `<ol>` wrapper, `.c-badge--{state}` for from/to stage badges (one of 11 lifecycle_stages: `anonymous`, `known`, `engaged`, `mql`, `sql`, `opportunity`, `customer`, `expansion`, `renewal`, `advocate`, `lost`), `.c-chip-protocol` for `actor_id` / `transition_id` / `evidence_ref`, `.c-chip` for `reason` (one of `auto_advance` / `manual_promotion` / `handoff` / `reactivation` / `manual_override` / `lost_reason_*`), vanilla `<ol>` for ordered list semantic, `<time>` semantic.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Lifecycle history" |
| `.t-lead` | "{N} stage transition(s)." |
| Empty | `[info] No lifecycle transitions recorded.` |
| Loading | (server-rendered; no client loading) |
| Error | `[err] Failed to load lifecycle transitions. {error_message}.` |
| Rejected transition (D-45 trigger fired with v_decision='rejected') | `[err] Lifecycle transition {from_stage} → {to_stage} rejected by D-45 state-machine trigger.` |
| Override transition (D-45 trigger fired with v_decision='override') | `[warn] Lifecycle transition {from_stage} → {to_stage} permitted as override; reason='{reason}'.` |
| Handoff indicator (reason='handoff') | `[info] Ownership handoff: {from_actor_role} → {to_actor_role}.` |
| Stage arrow | `→` (right arrow Unicode U+2192; rendered via `.arrow` className with `aria-hidden="true"`) |
| 11 lifecycle_stage labels (verbatim per CONTEXT D-11) | "anonymous", "known", "engaged", "mql", "sql", "opportunity", "customer", "expansion", "renewal", "advocate", "lost" |
| Stage badge color mapping | `anonymous`/`known`/`engaged`/`mql` → `.c-badge--info`; `sql`/`opportunity` → `.c-badge--success`; `customer`/`expansion`/`renewal`/`advocate` → `.c-badge--success`; `lost` → `.c-badge--error` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `empty` | No transitions | Empty notice |
| `populated` | Transitions > 0 | Full ordered list |
| `with-rejected` | Any transition with `audit_decision='rejected'` (D-45 trigger fired) | Inline error notice on that row |
| `with-override` | Any transition with `audit_decision='override'` | Inline warning notice on that row |
| `with-handoff` | Any transition with `reason='handoff'` | Handoff indicator chip |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `lifecycle_transitions` table (per Plan 02 D-12) — append-only; UPDATE/DELETE blocked at DB level
- `lifecycle_transition_audit` table (per Plan 04 D-45) — captures BEFORE UPDATE trigger decision (`allowed` / `rejected` / `override`)
- F-115 `/v1/crm/lifecycle-transitions` GET with `customer_360_id` query param (per Plan 02)

**Accessibility focus order:** (1) `<h2>Lifecycle history</h2>` → (2) `<ol>` keyboard navigable; arrow keys move between transitions.

**Motion:** No motion required (read-only history). `prefers-reduced-motion` respected (no animation).

**Acceptance Criteria:**
- AC LTT-1: Component is a client component (`'use client'` directive)
- AC LTT-2: Component renders all 11 lifecycle_stage badges verbatim with correct color mapping
- AC LTT-3: Component fetches `/api/v1/crm/lifecycle-transitions?customer_360_id=X`
- AC LTT-4: Empty state renders `[info] No lifecycle transitions recorded.` verbatim
- AC LTT-5: Rejected transition (D-45 trigger fired) renders error notice with verbatim copy
- AC LTT-6: Handoff indicator chip renders when `reason='handoff'`
- AC LTT-7: Stage badge color mapping per `.c-badge--{state}` discipline (no inline hex)
- AC LTT-8: Storybook story `Crm360/LifecycleTransitionTimeline` registers ≥4 named-state stories (Empty / Populated / WithHandoff / WithRejected)
- AC LTT-9: D-21 server/client boundary noted in file header comment

---

### Surface C — `components/markos/crm/NBAExplainPanel.tsx` (NEW)

**Files:**
- `components/markos/crm/NBAExplainPanel.tsx` — NEW; **`'use client'`**; NBA detail with rationale + evidence + accept-and-execute flow.
- `components/markos/crm/NBAExplainPanel.module.css` — NEW; token-only.
- `.storybook/stories/NBAExplainPanel.stories.tsx` — NEW; CSF3 named state stories.

**Layout grid:**
```
+----------------------------------------------------------+
| <header class="c-card">                                  |
|   <h2>Next best action</h2>                              |
|   <RunStatusBadge run_id={...} />                        |
|   <chip-protocol>nba_id</chip-protocol>                  |
|   <HealthScoreBadge /> (when subject_type='customer_360')|
|   <c-button--tertiary>Recompute NBA →</c-button--tert>   |
| </header>                                                |
+----------------------------------------------------------+
| <h3>Rationale</h3>                                       |
| <p>{rationale}</p> (banned-lexicon zero-match enforced)  |
| <chip-row>                                               |
|   <chip-protocol>action_type</chip-protocol>             |
|   <chip-info>confidence</chip-info>                      |
|   <chip-warn>expires_at</chip-warn>                      |
| </chip-row>                                              |
+----------------------------------------------------------+
| <h3>Evidence</h3>                                        |
| <KbGroundingPanel evidence_refs={...} /> via 216 D-15    |
+----------------------------------------------------------+
| <h3>Action</h3>                                          |
| [if status='active' AND action_type IN APPROVED_FREE]    |
|   <c-button--primary>Accept and execute</c-button>       |
|   <c-button--destructive>Dismiss</c-button>              |
| [if status='active' AND action_type IN APPROVAL_REQ]     |
|   <c-notice c-notice--info>                              |
|     [info] This action requires approval before dispatch.|
|   <c-button--secondary>Open approval →</c-button>        |
|     (mint-text inline link to                            |
|     /operations/approvals?handoff_kind=                   |
|       crm360_nba_execute_approval)                       |
| [if status='executed']                                   |
|   <c-notice c-notice--success>[ok] Executed at {ts}      |
| [if status='dismissed']                                  |
|   <c-notice c-notice--info>[info] Dismissed by {actor}   |
| [if status='superseded']                                 |
|   <c-notice c-notice--info>[info] Superseded by          |
|     <chip-protocol>{superseded_by}</chip-protocol>       |
| [if status='expired']                                    |
|   <c-notice c-notice--warning>[warn] Expired at {ts}     |
+----------------------------------------------------------+
```

**Components used:** `.c-card` for header, `<RunStatusBadge />` (P207), `<HealthScoreBadge />` (216 §D-15), `<KbGroundingPanel />` (216 §D-15), `.c-chip-protocol` for `nba_id` / `action_type` / `evidence_ref` / `superseded_by` / `approval_ref`, `.c-button--primary` / `--secondary` / `--destructive` / `--tertiary`, `.c-notice c-notice--{info,success,warning,error}`, `.c-modal` (accept-and-execute confirm dialog reusing 215 billing-correction modal recipe per inheritance), vanilla typography.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Next best action" |
| `<h3>` rationale | "Rationale" |
| `<h3>` evidence | "Evidence" |
| `<h3>` action | "Action" |
| Recompute CTA (mint-text inline) | "Recompute NBA →" |
| Accept-and-execute CTA (free path) | "Accept and execute" |
| Dismiss CTA | "Dismiss" |
| Open approval CTA (approval path; mint-text inline) | "Open approval →" |
| Approval-required notice | `[info] This action requires approval before dispatch.` |
| Executed notice | `[ok] Executed at {timestamp} by {actor}.` |
| Dismissed notice | `[info] Dismissed by {actor} at {timestamp}.` |
| Superseded notice | `[info] Superseded by NBA {superseded_by_chip}.` |
| Expired notice | `[warn] Expired at {timestamp}.` |
| Recompute success | `[ok] NBA recomputed.` |
| Recompute failure (evidence empty) | `[err] NBA recompute failed — evidence_refs is empty (no black-box NBA per nba_evidence_refs_nonempty CHECK).` |
| Autonomy ceiling | `[block] Autonomy ceiling reached for crm360_nba_execute_approval.` |
| Confidence indicator | "{confidence}% confidence" (rendered with `.c-code-inline` + tabular numerals; e.g., "75% confidence") |
| Expires-at indicator | "Expires {ago}" (e.g., "Expires in 2 days"; uses bracketed glyph `[warn]` when < 24h) |
| Empty (no active NBA) | `[info] No active next-best-action for this record. Recompute NBA →` |
| Empty + tombstoned | `[info] Profile tombstoned per DSR — NBA paused.` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load NBA. {error_message}.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty-no-nba` | No active NBA for subject | Empty notice with Recompute mint-text inline action |
| `active-free-action` | NBA `status=='active'` AND `action_type ∉ ACTION_TYPES_REQUIRING_APPROVAL` | Full panel with "Accept and execute" + "Dismiss" CTAs |
| `active-approval-required` | NBA `status=='active'` AND `action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL` | Full panel with "Open approval →" mint-text inline link; CTAs disabled |
| `executed` | NBA `status=='executed'` | Full panel + executed notice |
| `dismissed` | NBA `status=='dismissed'` | Full panel + dismissed notice |
| `superseded` | NBA `status=='superseded'` | Full panel + superseded notice with `superseded_by` chip-protocol link |
| `expired` | NBA `status=='expired'` | Full panel + expired warning notice |
| `expiring-soon` | NBA `status=='active'` AND `expires_at < NOW() + 24h` | Warning chip "Expires in {ago}" with `[warn]` glyph |
| `recompute-fresh` | `last_recompute_completed_at < 1h` | `<.c-status-dot--live>` kernel-pulse on header (freezes under `prefers-reduced-motion`) |
| `recompute-failed-evidence-empty` | Recompute throws `nba_evidence_refs_nonempty` CHECK violation | Error notice with verbatim copy |
| `autonomy-ceiling` | autonomy ceiling reached | Block notice above action menu |
| `tombstoned` | Customer360.tombstoned == true | Empty + tombstoned notice |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `nba_records` table (per Plan 04 D-08) — durable SOR
- `score_provenance` table (per Plan 04 D-46) — immutable append-only
- F-116 `/v1/crm/nba` GET, POST `/v1/crm/nba/{id}/dismiss`, POST `/v1/crm/nba/{id}/execute` (per Plan 04 + Plan 05)
- ACTION_TYPES_REQUIRING_APPROVAL constant (per Plan 04): `['send_followup', 'propose_expansion', 'send_renewal_reminder', 'draft_outreach']`
- ACTION_TYPE_TTL_HOURS constant (per Plan 04 RD-08): jitter ±12h
- `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` (per D-42; NEVER `createApprovalPackage`)
- D-04 urgency bias preservation per P103 (due/overdue tasks > NBA suggestions)
- Supersedence + jitter expiry visible (per D-08)
- AgentRun-bridged recompute (per D-10 + Plan 04 A5 guard)

**Accessibility focus order:** (1) `<h2>Next best action</h2>` (programmatic focus on open) → (2) Recompute CTA → (3) Rationale heading + body → (4) Evidence panel (`<KbGroundingPanel />` keyboard nav) → (5) Action heading → (6) Primary CTA ("Accept and execute" or "Open approval →") → (7) Secondary CTA ("Dismiss" when present).

**Motion:** `.c-status-dot--live` kernel-pulse on `recompute-fresh` state (freezes under `prefers-reduced-motion`). Modal open/close: 150ms fade; 0ms under reduced-motion.

**Acceptance Criteria:**
- AC NEP-1: Component is a client component (`'use client'` directive)
- AC NEP-2: Component renders all 5 NBA status states verbatim (`active`, `executed`, `dismissed`, `superseded`, `expired`)
- AC NEP-3: ACTION_TYPES_REQUIRING_APPROVAL path renders "Open approval →" mint-text link to `/operations/approvals?handoff_kind=crm360_nba_execute_approval`
- AC NEP-4: Free-action path renders "Accept and execute" CTA + confirm modal reusing 215 billing-correction modal recipe
- AC NEP-5: Accept-and-execute calls `buildApprovalPackage(kind='crm360_nba_execute_approval')` per D-42 (NEVER `createApprovalPackage`)
- AC NEP-6: `<KbGroundingPanel />` (216 D-15) renders evidence_refs[] with top-3 sources + chunk_id chips + relevance_score
- AC NEP-7: `<HealthScoreBadge />` (216 D-15) renders when subject_type='customer_360'
- AC NEP-8: Confidence rendered as percentage with `.c-code-inline` + tabular numerals
- AC NEP-9: Expires-at < 24h renders `[warn]` glyph
- AC NEP-10: Recompute failure (evidence empty) renders error notice citing `nba_evidence_refs_nonempty` CHECK constraint
- AC NEP-11: Supersedence visible — `superseded_by` rendered as `.c-chip-protocol` link to predecessor NBA
- AC NEP-12: AgentRun lineage — `<RunStatusBadge run_id={recompute_run_id}>` rendered in header
- AC NEP-13: Storybook story `Crm360/NBAExplainPanel` registers ≥6 named-state stories (Empty / ActiveFreeAction / ActiveApprovalRequired / Executed / Superseded / Expired / Tombstoned)
- AC NEP-14: D-21 server/client boundary noted in file header comment
- AC NEP-15: D-08 token-only enforced
- AC NEP-16: Banned-lexicon zero-match on `rationale` body (CI assertion)

---

### Surface D — `components/markos/crm/BuyingCommitteePanel.tsx` (NEW)

**Files:**
- `components/markos/crm/BuyingCommitteePanel.tsx` — NEW; **`'use client'`**; opportunity/account-level committee viewer with role management.
- `components/markos/crm/BuyingCommitteePanel.module.css` — NEW; token-only.
- `.storybook/stories/BuyingCommitteePanel.stories.tsx` — NEW; CSF3 named state stories.

**Layout grid:**
```
+----------------------------------------------------------+
| <header>                                                 |
|   <h2>Buying committee</h2>                              |
|   <chip-protocol>committee_id</chip-protocol>            |
|   <coverage_score>{N}%</coverage_score>                  |
|   <last_assessed_at>{ago}</last_assessed_at>             |
| </header>                                                |
+----------------------------------------------------------+
| <h3>Members</h3>                                         |
| <ul> (active members; valid_to IS NULL)                  |
|   <li class="c-card">                                    |
|     <PIIRedactedField pii_classification />              |
|     <chip-protocol>person_id</chip-protocol>             |
|     <chip-role>{role}</chip-role> (5-persona ENUM)       |
|     <influence_score> · <engagement_score>               |
|     <last_touch_at>                                      |
|     <c-button--icon>Change role</c-button>               |
|     <c-button--destructive>Remove</c-button>             |
|   </li>                                                  |
| </ul>                                                    |
+----------------------------------------------------------+
| <h3>Missing roles</h3>                                   |
| <ul>                                                     |
|   <li>{missing_role_human_string}</li>                   |
|     (e.g., "No finance stakeholder engaged",             |
|      "Champion active, economic buyer absent",           |
|      "Technical buyer asked for security artifact",      |
|      "Legal review likely next blocker")                 |
| </ul>                                                    |
| [if missing_roles.length > 0]                            |
|   <c-button--primary>Invite role</c-button>              |
|     (opens approval modal)                               |
+----------------------------------------------------------+
| <h3>Coverage</h3>                                        |
| <coverage_score_visualization                            |
|   coverage_score={N}                                     |
|   roles_filled={5_of_8}                                  |
|   missing_roles={...}                                    |
| />                                                       |
+----------------------------------------------------------+
```

**Components used:** `.c-card` for member rows, `<PIIRedactedField />` (216 §D-15) for member identity, `.c-chip-protocol` for `committee_id` / `person_id` / `member_id` / `proof_gap_refs[]`, `.c-chip` for role badge (8 role enum: `champion` / `economic_buyer` / `technical_buyer` / `end_user` / `blocker` / `legal` / `finance` / `unknown`), `.c-code-inline` for `coverage_score` percentage with tabular numerals, `.c-button--primary` for "Invite role", `.c-button--icon` for inline role-change, `.c-button--destructive` for member soft-delete, `.c-modal` (Invite role approval modal reusing 215 billing-correction modal recipe per inheritance), `.c-notice c-notice--{info,warning,error}` for state, vanilla `<ul>` for member list.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Buying committee" |
| `<h3>` members | "Members" |
| `<h3>` missing roles | "Missing roles" |
| `<h3>` coverage | "Coverage" |
| Coverage score label | "{N}% covered ({M} of 8 roles filled)" |
| 5-persona ENUM verbatim (subset of full 8-role ENUM per CONTEXT D-15) | "champion", "economic_buyer", "technical_buyer", "end_user", "blocker" |
| Full 8-role ENUM | "champion", "economic_buyer", "technical_buyer", "end_user", "blocker", "legal", "finance", "unknown" |
| Missing role human strings (verbatim per doc 18 specifics) | "No finance stakeholder engaged", "Champion active, economic buyer absent", "Technical buyer asked for security artifact", "Legal review likely next blocker" |
| Empty (no members) | `[info] No committee members recorded yet. Add member →` |
| Empty + tombstoned (parent customer tombstoned per D-32) | `[info] Parent profile tombstoned per DSR — committee preserved for legal/revenue trail.` |
| Invite role CTA | "Invite role" |
| Add member CTA (deferred) | "Add member →" (renders `<PlaceholderBanner variant="future_phase_222_admin_ui">` "[info] Admin member-add deferred to future phase.") |
| Change role CTA (icon button; aria-label) | "Change role" |
| Remove CTA | "Remove" |
| Concurrent role change error (Pitfall 4) | `[err] Member role change conflicted with concurrent edit. Reload and retry.` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load committee. {error_message}.` |
| Coverage 100% | `[ok] All 8 roles covered.` |
| Coverage <50% | `[warn] Coverage below 50% — high-risk deal.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty-no-members` | No active members | Empty notice + Add member mint-text deferred placeholder |
| `populated-coverage-low` | Members > 0, coverage < 50% | Full render + warning notice "Coverage below 50% — high-risk deal." |
| `populated-coverage-mid` | 50% <= coverage < 100% | Full render |
| `populated-coverage-full` | coverage == 100% | Full render + success notice "All 8 roles covered." |
| `concurrent-role-change-error` | UPDATE returned 0 rows on role change (Pitfall 4) | Error notice "Member role change conflicted with concurrent edit. Reload and retry." |
| `tombstoned` | Parent Customer360.tombstoned == true (per D-32) | Empty notice "Parent profile tombstoned per DSR — committee preserved for legal/revenue trail." |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `buying_committees` table (per Plan 05 D-14) — tenant-scoped with RLS
- `buying_committee_members` table (per Plan 05 D-15) — append-only role history (`valid_from` / `valid_to`)
- F-117 `/v1/crm/committees` GET, POST member, PATCH member, DELETE member (soft) (per Plan 05)
- F-118 committee member CRUD with concurrency guard
- 8-role ENUM (verbatim per D-15)
- 5-persona ENUM (subset of 8-role; subset displayed prominently in UI per critical_scope_finding)
- Concurrent role change atomicity via `UPDATE ... WHERE valid_to IS NULL RETURNING` (Pitfall 4 — per Plan 05 truths)

**Accessibility focus order:** (1) `<h2>Buying committee</h2>` → (2) coverage_score chip → (3) Members heading + member list (`<ul>` keyboard nav; arrow keys; Enter to expand) → (4) per-member "Change role" + "Remove" CTAs → (5) Missing roles list → (6) "Invite role" CTA (when present).

**Motion:** No motion required. Modal open/close: 150ms fade; 0ms under `prefers-reduced-motion`.

**Acceptance Criteria:**
- AC BCP-1: Component is a client component (`'use client'` directive)
- AC BCP-2: Component renders all 8 role enum chips verbatim
- AC BCP-3: Component renders 5-persona ENUM as `<.c-chip>` rows prominently per critical_scope_finding
- AC BCP-4: Member relationship graph implicitly rendered via member list ordering + role chips + influence/engagement scores
- AC BCP-5: Workspace integration with copilot-record-panel — BuyingCommitteePanel deep-links from copilot via "View committee →" mint-text inline (renders parent record context)
- AC BCP-6: Member identity rendered via `<PIIRedactedField />` per `pii_classification` ENUM
- AC BCP-7: Missing roles rendered as human strings verbatim per doc 18 specifics
- AC BCP-8: Invite role CTA opens approval modal reusing 215 billing-correction modal recipe
- AC BCP-9: Soft-delete member writes `valid_to=NOW()` row (NEVER UPDATE in place per D-15)
- AC BCP-10: Concurrent role change error rendered when UPDATE returns 0 rows (Pitfall 4)
- AC BCP-11: Coverage score rendered with tabular numerals
- AC BCP-12: 100% coverage renders success notice; <50% renders warning notice
- AC BCP-13: Tombstoned state renders preservation notice
- AC BCP-14: Storybook story `Crm360/BuyingCommitteePanel` registers ≥5 named-state stories (Empty / Populated / CoverageLow / CoverageFull / Tombstoned)
- AC BCP-15: D-21 server/client boundary noted in file header comment
- AC BCP-16: D-08 token-only enforced

---

### Surface E — `components/markos/crm/workspace-shell.tsx` (EVOLVED per D-24)

**Files modified:** `components/markos/crm/workspace-shell.tsx` (EVOLVED; existing 6-view shell)

**Scope of evolution (NOT a new component):**
- Default record detail view SWAPS from `record-detail.tsx` to `TimelineDetailView` (D-24) — the swap happens in the route handler when a record is selected; legacy `record-detail.tsx` file remains on disk for backwards-compat callers
- 6-view list navigation PRESERVED VERBATIM (Kanban default for lists per P102 D-02 — regression guard)
- Approval Inbox handoff_kind chip filter set EXTENDS to include 3 new 222 chips (`crm360_nba_execute_approval`, `crm360_lifecycle_transition_approval`, `crm360_tombstone_cascade_approval`) — DEFERRED rendering to future P208 admin extension per `future_phase_222_approval_inbox_extensions` translation gate

**Non-regression assertions:**
- AC WSE-1: 6-view list navigation rendering unchanged (Kanban default, list, calendar, timeline-list, kanban-deals, kanban-customers)
- AC WSE-2: P102 D-02 Kanban default preserved
- AC WSE-3: P103 D-04 urgency bias preserved (due/overdue > NBA suggestions in execution-queue evolution)
- AC WSE-4: Legacy callers of `record-detail.tsx` continue to function (no signature break; read-through adapter pattern per D-19)
- AC WSE-5: Workspace-shell integration test asserts default record detail SWAPS to TimelineDetailView when a record is selected (per D-24)
- AC WSE-6: Mobile breakpoint behavior unchanged

---

### Surface F — `components/markos/crm/execution-queue.tsx` (EVOLVED per D-24, mobile_priority=critical)

**Files modified:** `components/markos/crm/execution-queue.tsx` (EVOLVED; existing queue)

**Scope of evolution:**
- Data source SWAPS from on-read NBA reducer (`lib/markos/crm/execution.ts` legacy compute) to durable `nba_records` table read via `getActiveNbaForSubject` / `listActiveNbaByOwner` (Plan 04)
- P103 D-04 urgency bias PRESERVED VERBATIM (due/overdue tasks > NBA suggestions — regression guard)
- Per-row "Open NBA →" mint-text inline link added (deep-link to NBAExplainPanel for the row's `nba_id`)
- mobile_priority=critical (sales/CS field-of-view)

**Non-regression assertions:**
- AC EQE-1: P103 D-04 urgency bias preserved (verified via integration test — due/overdue tasks always sort above NBA suggestions)
- AC EQE-2: Data source switched from on-read compute to `nba_records` table read (verified via test fixture comparison)
- AC EQE-3: Existing hook surface preserved (no signature break for consumer pages)
- AC EQE-4: Per-row "Open NBA →" mint-text inline link renders for rows with active NBA
- AC EQE-5: mobile_priority=critical registered in `lib/markos/operator/shell.ts` `SurfaceRouteContract`
- AC EQE-6: Touch target ≥44px on coarse pointers (already global per 213.2)

---

### Surface G — `components/markos/crm/copilot-record-panel.tsx` (EVOLVED per D-24)

**Files modified:** `components/markos/crm/copilot-record-panel.tsx` (EVOLVED; existing panel)

**Scope of evolution:**
- Grounding source SWAPS from legacy P105 record brief computation to consume Customer360 `current_summary` + NBA `evidence_refs[]` directly (per Plan 05 D-24)
- P105 D-01/D-03 record brief + evidence-inline posture PRESERVED VERBATIM (regression guard)
- "View committee →" mint-text inline link added (deep-link to BuyingCommitteePanel when subject_type='opportunity' OR Customer360 has active committee)
- "Recompute NBA →" mint-text inline link added (delegates to NBAExplainPanel recompute action)

**Non-regression assertions:**
- AC CRP-1: P105 D-01 record brief flagship preserved (verified via integration test)
- AC CRP-2: P105 D-03 evidence-inline posture preserved
- AC CRP-3: Grounding source switched to Customer360 `current_summary` + NBA `evidence_refs[]` (verified via test fixture)
- AC CRP-4: Banned-lexicon zero-match on `current_summary` BEFORE rendering (CI assertion)
- AC CRP-5: "View committee →" + "Recompute NBA →" mint-text inline links render appropriately
- AC CRP-6: Customer360 `display_name` rendered via `<PIIRedactedField />`

---

## Cross-Surface Acceptance Criteria

### X-cutting (XC-N)

- AC XC-1: All 4 NEW components register Storybook CSF3 named-state stories under `Crm360/*` path; 222-06 Plan ships `chromatic.config.json` covering all 4
- AC XC-2: All 4 NEW components honor D-08 token-only (zero hex literals in module.css files)
- AC XC-3: All 4 NEW components honor D-09 mint-as-text + D-09b `.c-notice` mandatory + D-13 `.c-card--feature` reserved + D-14 no `.c-table`
- AC XC-4: All 4 NEW components are `'use client'` per existing convention; consuming pages remain server components per D-21
- AC XC-5: All 4 NEW components consume `<PIIRedactedField />` (216 §D-15) for any Customer360-resolved IdentityProfile field
- AC XC-6: All 4 NEW components register in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: crm360_*` and correct `mobile_priority` literal
- AC XC-7: Banned-lexicon zero-match enforced on NBA `rationale` body + lifecycle transition `reason` + committee member `proof_gap_refs[]` operator-note + Customer360 `current_summary` BEFORE approval-package dispatch
- AC XC-8: All approval-package call paths use `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-42 (NEVER `createApprovalPackage`)
- AC XC-9: All cron handlers ship under `api/cron/crm360-*.js` (NOT `app/api/cron/crm360-*/route.ts`) per D-44; auth via `x-markos-cron-secret` header
- AC XC-10: All REST handlers ship under `api/v1/crm/*.js` (NOT `app/api/v1/crm/*/route.ts`) per D-43; auth via `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` per D-35
- AC XC-11: Test runner is `npm test` (Node `--test`) per D-39; all `*.test.js` files (NOT `.test.ts`); imports `node:test` + `node:assert/strict`; NO vitest, NO playwright install in P222
- AC XC-12: Plan 06 closeout meta-test asserts `package.json` did not gain `vitest` or `@playwright/test` keys during P222 execution
- AC XC-13: Plan 01 Task 0.5 architecture-lock detector test scans every `.planning/phases/222-*-PLAN.md` for forbidden tokens (createApprovalPackage, requireSupabaseAuth, requireTenantContext, serviceRoleClient outside auth, lookupPlugin, public/openapi.json, app/(public), app/(markos) AS NEW PATH, route.ts outside doctrinal NO-X comments, vitest run, from 'vitest', .test.ts, "stub if missing", "if exists")
- AC XC-14: Hard preflight upstream gate via `assertUpstreamReady(['P208', 'P209', 'P211', 'P221'])` per D-38; NO soft-skip, NO "stub if missing"
- AC XC-15: All migrations slot-pre-allocated per D-48 (P222 owns 106..112; 7 slots; no gaps); closeout `migration-slot-collision.test.js` asserts no overlap
- AC XC-16: All F-IDs slot-pre-allocated per D-49 (P222 owns F-113..F-121; 9 slots; no gaps); closeout `f-id-collision.test.js` asserts no overlap
- AC XC-17: All 6 new tables (customer_360_records, opportunities, lifecycle_transitions, nba_records, buying_committees, buying_committee_members) have RLS verified cross-tenant denied via Plan 06 `test/crm360/rls-suite.test.js`
- AC XC-18: D-45 lifecycle transition state-machine BEFORE UPDATE trigger validates state transitions per doc 18 forward-only flow; rejected transitions raise exception
- AC XC-19: D-46 score provenance immutability BEFORE UPDATE trigger blocks edits to recorded_at + score_value + score_kind + attribution_chain once committed
- AC XC-20: D-47 tombstone cascade outbox pattern (replayable + idempotent + dead-letter aware); max 5 attempts; exponential backoff
- AC XC-21: D-51 Plan 06 `autonomous: false`; drift reconciliation `checkpoint:human-action` for first batch operator review
- AC XC-22: Plan 06 ships Chromatic snapshot gate covering 4 NEW UI surfaces with Empty / Populated / Error / Tombstoned variants (≥5 named-state stories per surface)
- AC XC-23: Plan 06 ships manual operator-journey checklist for 4 surfaces (Playwright e2e DEFERRED per D-39)
- AC XC-24: Plan 06 closeout regression — P100-P105 + P102 Kanban default + P103 urgency bias + P105 record brief + P101 HIGH_SIGNAL all green

---

## Approval Inbox Handoff Chain Extension (post-222 = 32 chips)

```
Pre-222 chain (post-221 = 29 chips):
1. approval (P207)
2. recovery (P207)
3. follow_up (P207)
4. manual_input (P207)
5. billing_charge_approval (P214)
6. billing_correction_approval (P215)
7. support_response_approval (P216)
8. save_offer_approval (P216)
9-20. P218..P220 12 chips (218×4 + 219×8 + 220×7 trimmed to 12 active per 220 closeout)
21. partner_payout_export_approval (P220 26th)
22-26. (P220 placeholders for ecosystem motions)
27. consent_drift_resolution (P221)
28. audience_activation_approval (P221)
29. dsr_export_approval (P221)

POST-222 NEW (start-of-v4.2.0-commercial-engines-lane mid-state):
30. crm360_nba_execute_approval         ← P222-04 NBAExplainPanel "Accept and execute" path when action_type ∈ ACTION_TYPES_REQUIRING_APPROVAL; calls buildApprovalPackage per D-42
31. crm360_lifecycle_transition_approval ← P222-02 + P222-04 lifecycle transitions crossing high-risk boundary (any → customer, any → lost, role-handoff across primary owner classes); calls buildApprovalPackage per D-42; D-45 BEFORE UPDATE trigger validates state-machine
32. crm360_tombstone_cascade_approval    ← P222-04 tombstone cascade affecting opportunities with pricing_context_id IS NOT NULL; calls buildApprovalPackage per D-42; D-47 outbox pattern
```

Row rendering of these 3 new chips is DEFERRED to future P208 admin extension per `future_phase_222_approval_inbox_extensions` translation gate.

---

## Future-Surface UI Binding Contracts

### Future-Surface 1 — `future_phase_222_admin_ui` (multi-page CRM 360 admin)

**Anticipated path:** `app/(markos)/crm/{customer360,opportunities,committees,nba,funnel,reconciliation,rls-audit}/page.tsx` future surfaces. (Note: `app/(markos)/` is PRESERVED per D-43 for existing routes; future admin pages MAY use this tree.)

**Contract:** When the future admin phase ships, it composes the 4 NEW 222 components (TimelineDetailView, LifecycleTransitionTimeline, NBAExplainPanel, BuyingCommitteePanel) in dedicated routes. Server components fetch via `requireHostedSupabaseAuth` per D-35; render via the same client components shipping in 222. **D-32 architecture-lock holds** — legacy `api/*.js` routes; auth canon; test runner `npm test`; OpenAPI at `contracts/openapi.json`; MCP registry `lib/markos/mcp/tools/index.cjs`; cron at `api/cron/*.js`; helper canon `buildApprovalPackage`. Future surfaces render `<PlaceholderBanner variant="future_phase_222_admin_ui">` until those phases ship.

### Future-Surface 2 — `future_phase_222_approval_inbox_extensions` (P208 row rendering)

**Anticipated path:** `/operations/approvals` (existing P208 surface) extension to render 3 new 222 chips per-row classifier.

**Contract:** When P208 admin extension ships, it renders per-row classifier:
- `crm360_nba_execute_approval`: `subject_type` + `action_type` + `confidence` + `expires_at` + `evidence_refs[]` cardinality + `<KbGroundingPanel />` preview
- `crm360_lifecycle_transition_approval`: `from_stage` → `to_stage` + `reason` + `evidence_ref` + actor + `<HealthScoreBadge />` for current Customer360 health context
- `crm360_tombstone_cascade_approval`: tombstoned profile cardinality + cascade target counts + `<PIIRedactedField />` per affected opportunity row + dual-approval indicator if `pricing_context_id IS NOT NULL`

Future surfaces render `<PlaceholderBanner variant="future_phase_222_approval_inbox_extensions">` until that phase ships.

### Future-Surface 3 — `future_phase_223_dispatch_substrate` (P223 messaging engine)

**Anticipated consumer:** P223 messaging engine reads `customer_360_records` + `opportunities` + `buying_committees` + `buying_committee_members` for dispatch eligibility + member-level send routing + committee-coverage-driven outreach + NBA `action_type` for NBA-driven outbound campaigns; consumes P221 `cdp_consent_states` (per 221 D-11/D-13/D-18 double-gate) + P221 `cdp_audience_snapshot_memberships` for activation; 222 lifecycle stages drive dispatch playbook selection; 222 `commercial_signal` enum drives subject-line + content-pack template selection. Future surfaces render `<PlaceholderBanner variant="future_phase_223_dispatch_substrate">` until that phase ships.

### Future-Surface 4 — `future_phase_222_chromatic_baselines` (Plan 06 gate enforcement)

**Anticipated path:** `chromatic.config.json` + 4 `*.stories.tsx` files (TimelineDetailView, LifecycleTransitionTimeline, NBAExplainPanel, BuyingCommitteePanel).

**Contract:** Plan 06 ships the gate; future approval needed if visual diffs accepted on subsequent baselines without operator review. Downstream phases (P223+) MUST NOT add components/markos/crm/* without registering corresponding Storybook stories + Chromatic snapshots. Per D-51 Plan 06 `autonomous: false`; first batch requires operator review.

### Future-Surface 5 — `future_phase_223_legacy_crm_entities_cutover` (post-222 cleanup)

**Anticipated phase:** Once all consumers migrate via D-19 read-through adapter, legacy `crm_entities` cutover to derived-view-only. 222 SHIM WINDOW preserves dual-write per D-18 + D-19; D-20 drift reconciliation cron emits operator task on divergence. Future cutover phase will drop the dual-write path and demote `crm_entities` to a view materialized from `customer_360_records`. Future surfaces render `<PlaceholderBanner variant="future_phase_223_legacy_crm_entities_cutover">` until that phase ships.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable (no `components.json`) |
| Third-party registries | none | not applicable |

Phase 222 introduces **zero third-party blocks**. All UI primitives compose from `styles/components.css` v1.1.0 (project-owned). The 7 D-15 extracted components (HealthScoreBadge, RiskBandBadge, KbGroundingPanel, SaveOfferPricingBlock, RetentionClassChip, PIIRedactedField, ClassifierChipRow) are project-owned (first shipped in 217-06).

**Vetting gate:** Not applicable — no third-party registry surfaces ship in 222.

---

## D-15 Extracted Component Reuse Manifest (load-bearing)

The following 7 components are FIRST CONSUMED IN PRODUCTION by 217-06 and REUSED in 222 (NOT re-implemented):

| Component | Origin | 222 consumers |
|-----------|--------|---------------|
| `<HealthScoreBadge />` | 216 §D-15 (recommended); 217-06 (first shipped) | NBAExplainPanel header (when subject_type='customer_360'); TimelineDetailView header |
| `<RiskBandBadge />` | 216 §D-15; 217-06 (first shipped) | TimelineDetailView header; execution-queue.tsx evolution |
| `<KbGroundingPanel />` | 216 §D-15; 217-06 (first shipped) | NBAExplainPanel evidence section |
| `<RetentionClassChip />` | 216 §D-15; 217-06 (first shipped) | Per-PII-field rendering on TimelineDetailView, NBAExplainPanel, BuyingCommitteePanel |
| `<PIIRedactedField />` | 216 §D-15; 217-06 (first shipped) | Customer360 `display_name` / `current_summary`, Opportunity `title`, committee member identity |
| `<ClassifierChipRow />` | 216 §D-15; 217-06 (first shipped) | TimelineDetailView per-row (commercial_signal + source_domain + actor_type + sentiment) |
| `<SaveOfferPricingBlock />` | 216 §D-15; 217-06 (first shipped) | NOT consumed in 222 (deferred to P223+ when discount/save-offer surfaces ship via dispatch engine) |

Storybook stories for these components remain registered under their original 217-06 `Saas/*` path; 222 stories register UNDER `Crm360/*` path and IMPORT the extracted components.

---

## Manual Operator-Journey Checklist (Plan 06 — D-39 Playwright DEFERRED)

The following 4 manual operator journeys ship in Plan 06 closeout as a markdown checklist; the operator runs them against staging before the phase ships. Playwright e2e DEFERRED per D-39 — the Chromatic snapshot gate + manual checklist replace e2e for 222.

### Journey 1 — TimelineDetailView filter

1. Open a Customer360 record in workspace-shell (default record detail SWAPS to TimelineDetailView per D-24)
2. Verify all 11 source_domain filter chips render
3. Verify all 7 commercial_signal filter chips render
4. Click `meeting` source chip — verify only meeting events render
5. Click `risk` signal chip — verify only meeting + risk events render (combined filter)
6. Click `Clear filters` mint-text inline action — verify all events return
7. Verify `.c-status-dot--live` kernel-pulse on filter recompute (freezes under prefers-reduced-motion)

### Journey 2 — BuyingCommitteePanel invite role

1. Open an Opportunity with `coverage_score < 100`
2. Verify missing_roles[] human strings render (e.g., "No finance stakeholder engaged")
3. Click "Invite role" CTA — verify approval modal opens (215 billing-correction modal recipe)
4. Submit reason ≥20 chars — verify approval-package created via `buildApprovalPackage(kind='crm360_lifecycle_transition_approval')` (NOT `createApprovalPackage`)
5. Verify modal closes; verify operator routed to `/operations/approvals?handoff_kind=crm360_lifecycle_transition_approval`
6. Inline role-change on existing member — verify atomic UPDATE (Pitfall 4) succeeds; concurrent test asserts second writer rejected

### Journey 3 — NBAExplainPanel accept

1. Open a Customer360 with active NBA (`status='active'`, `action_type ∉ ACTION_TYPES_REQUIRING_APPROVAL`)
2. Verify rationale renders with banned-lexicon zero-match (no `synergy`, `leverage`, etc.)
3. Verify `<KbGroundingPanel />` renders top-3 evidence sources with chunk_id chips
4. Verify confidence renders with tabular numerals (e.g., "75% confidence")
5. Verify expires_at < 24h triggers `[warn]` glyph
6. Click "Accept and execute" — verify confirm modal (215 modal recipe)
7. Submit — verify status SWAPS to `executed`; success notice "[ok] Executed at {ts}"
8. Re-open — verify operator sees executed state (durable per D-08)
9. Repeat with `action_type='send_followup'` (in ACTION_TYPES_REQUIRING_APPROVAL) — verify "Open approval →" mint-text inline link instead of "Accept and execute"; verify routes to `/operations/approvals?handoff_kind=crm360_nba_execute_approval`

### Journey 4 — LifecycleTransitionTimeline render

1. Open a Customer360 with multiple lifecycle transitions
2. Verify all 11 lifecycle_stage badges render with correct color mapping
3. Verify ordered list (`<ol>`) renders newest first
4. Verify per-row actor chip + reason chip + evidence chip render
5. If row has `audit_decision='rejected'` (D-45 trigger fired), verify error notice "[err] Lifecycle transition {from_stage} → {to_stage} rejected by D-45 state-machine trigger."
6. If row has `reason='handoff'`, verify ownership handoff indicator chip renders
7. Verify D-46 score provenance immutability — attempting to UPDATE a committed score_provenance row raises exception (covered by Plan 04 SQL test, NOT a UI journey)

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (verbatim copy contracts per surface; banned-lexicon zero-match enforced)
- [ ] Dimension 2 Visuals: PASS (vanilla `<table>` / `<ol>` / `<ul>` semantic; `.c-card` default; D-13 `.c-card--feature` reserved; D-14 no `.c-table`)
- [ ] Dimension 3 Color: PASS (60/30/10 split honored; mint reserved for primary CTA + focus + chip-protocol + status-dot-live + `[ok]`/`[up]` glyphs; commercial_signal color-coding verbatim)
- [ ] Dimension 4 Typography: PASS (JetBrains Mono headings + Inter body; tabular numerals on monetary + percentage columns; banned-lexicon zero-match)
- [ ] Dimension 5 Spacing: PASS (8-point grid; --space-* tokens only; off-grid auto-FAIL)
- [ ] Dimension 6 Registry Safety: PASS (no third-party blocks; D-15 extracted components project-owned)

**Approval:** pending (checker upgrades to `approved YYYY-MM-DD` once 6-pillar audit passes; 222-06 ships gate enforcement)

---

*Phase: 222-crm-timeline-commercial-memory-workspace*
*UI-SPEC drafted: 2026-05-04 by gsd-ui-researcher*
*Heavy-UI hybrid: 3 backend plans (01/02/06) + 3 UI plans (03/04/05) shipping 4 NEW components + 3 EVOLVED components*
*Architecture-lock: D-32 + D-43 (legacy api/*.js + components/markos/crm/* + app/(markos)/* PRESERVED) — `app/(markos)` FORBIDDEN as NEW path; preserved as existing tree*
*Approval helper canon: `buildApprovalPackage` per D-42 (NEVER `createApprovalPackage`)*
*Test runner: `npm test` (Node `--test`) per D-39; NO vitest, NO playwright in P222*
*Chromatic gate + manual operator-journey checklist replace Playwright e2e for 4 surfaces per D-39*
*Approval Inbox handoff chip count: 29 (post-221) → 32 (post-222) — 3 new literals*
