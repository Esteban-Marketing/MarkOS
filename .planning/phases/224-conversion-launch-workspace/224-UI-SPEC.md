---
phase: 224
slug: conversion-launch-workspace
status: draft
shadcn_initialized: false
preset: not-applicable-no-shadcn
domain: conversion-page-form-cta-event-experiment-launch-brief-surface-gate-runbook-outcome-readiness-public-render-isr-cache-tag-bot-id-rate-limit-honeypot-consent-double-gate-sticky-hash-architecture-lock-substrate
created: 2026-05-05
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: hybrid (5 no-UI backend plans + 2 heavy-UI plans shipping 15 NEW block components + 2 NEW renderers + 2 NEW form sub-components + 1 public dynamic route + N operator surfaces under app/(markos)/)
ui_scope: 224-03 (15 block components + 2 renderers + 2 form sub-components + public route under app/(marketing)/conversion-page/[[...slug]]/) + 224-07 (operator UI under app/(markos)/conversion + app/(markos)/launches with 9 surfaces + Approval Inbox + Morning Brief PATCHes)
plans_in_scope: [224-01, 224-02, 224-03, 224-04, 224-05, 224-06, 224-07]
plans_with_ui_surfaces: [224-03, 224-07]
plans_no_ui: [224-01, 224-02, 224-04, 224-05, 224-06]
ui_components_new_blocks: [HeroBlock, ContentBlock, PricingBlock, CtaBlock, TestimonialBlock, FaqBlock, FooterBlock, ImageBlock, VideoBlock, ComparisonBlock, SocialProofBlock, EvidenceBlockComponent, SignupWidgetBlock, FormBlock, CustomHtmlBlock]
ui_components_new_renderers: [page-renderer, form-renderer]
ui_components_new_form_sub: [FormField, FormFieldGroup]
ui_components_new_operator: [ConversionWorkspace, PageEditor, FormEditor, LaunchCockpit, RunbookEditor, LaunchReadinessBoard, GatesPanel, OutcomesDashboard]
ui_components_p208_renderers: [ApprovalInboxConversionEntries (entry-types PATCH), MorningBriefLaunchesSection]
ui_components_evolved: []
ui_routes_new_public: [app/(marketing)/conversion-page/[[...slug]]/page.tsx]
ui_routes_new_operator: [app/(markos)/conversion/page.tsx, app/(markos)/launches/page.tsx]
chromatic_gate_owner: 224-07
playwright_e2e_status: DEFERRED (D-61 — Chromatic snapshot gate via existing chromatic devDep + manual operator-journey checklist for new surfaces; existing axe-playwright devDep MAY be reused per 223 D-46 carry but P224 ships ZERO new playwright runtime)
milestone_position: v4.2.0-COMMERCIAL-ENGINES-LANE-CONVERSION-LAUNCH-PHASE
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `external.send` for ConversionPage publish + ConversionForm publish + LaunchSurface publish + LaunchRunbook execute + LaunchRunbook rollback + LaunchGate waiver per D-20; `default_approval_mode == single_approval` for page_publish + form_publish + launch_arm + launch_execute + gate_waiver + rollback per D-44; autonomy-ceiling on launch_execute when AgentRun substrate gates the run; mutation-class binding via `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` — NEVER `createApprovalPackage` per D-58 architecture-lock)
  - 207-UI-SPEC.md (PARENT — `RunApiEnvelope.run_id` linked to LaunchRunbook execute runs (`executeRunbook` per Plan 06) + LaunchRunbook rollback runs (`rollbackRunbook` per Plan 06) + LaunchOutcome compute runs (`computeLaunchOutcome` per Plan 04) + 4 cron handlers (`launches-surface-health-audit` daily 04:00 UTC + `launches-gate-evaluation-poll` every 15 min + `launches-outcome-computation` daily 06:00 UTC + `launches-bounce-spike-alert` hourly per Plan 06); `AgentRunEventType` for `conversion_event_emit` / `conversion_page_publish` / `conversion_page_archive` / `conversion_form_publish` / `conversion_form_archive` / `public_form_submit` / `bot_id_block` / `rate_limit_block` / `honeypot_block` / `consent_revoked_at_submit` / `idempotency_replay` / `conversion_page_stale_render` (D-69 freshness fail) / `experiment_assigned` / `experiment_traffic_split_immutable_violation` (D-70 trigger fired) / `launch_brief_publish` / `launch_surface_approve` / `launch_surface_publish` / `launch_surface_archive` / `launch_gate_evaluation` / `launch_gate_waived` / `launch_runbook_arm` / `launch_runbook_execute` / `launch_runbook_step_executed` / `launch_runbook_step_skipped` / `launch_runbook_rollback` / `launch_runbook_rollback_step` / `launch_outcome_computed` / `launch_readiness_required_violation` (D-65 trigger fired) / `launch_runbook_execute_required_violation` (D-66 trigger fired) / `consent_state_required_violation` (D-67 trigger fired); `AgentFailureClass` 7 literals on cron + runbook executor + emit failures; `ApprovalHandoffRecord` links 224 page_publish + form_publish + launch_arm + launch_execute + gate_waiver + rollback to P208 inbox; `agent_run_id` linked to all 4 P224 cron handlers + 14 read-write API handlers + 6 MCP tools)
  - 208-UI-SPEC.md (PARENT — Approval Inbox at `/operations/approvals` + Morning Brief + Task Board + cockpit pattern; per D-46 the Approval Inbox gains 6 P224 entry types via `buildApprovalPackage` calls in page-publish path + form-publish path + launch-arm path + launch-execute path + gate-waiver path + rollback path; the Morning Brief surfaces top-3 in-flight launches + readiness countdown + blocking gates per launch + recent ConversionEvent volume via `lib/markos/operating/morning-brief/launches-section.ts` registering `launches_inflight_summary` + `conversion_volume_summary` entry types into `lib/markos/brief/registry.ts` extension-point per D-47; ConversionWorkspace + LaunchCockpit add as new sub-routes under EXISTING `app/(markos)/` tree per D-45 + D-64; mobile_priority literals registered in `lib/markos/operator/shell.ts` `SurfaceRouteContract` per surface)
  - 209-UI-SPEC.md (PARENT — EvidenceMap binding + source quality + claim TTL + LaunchGate(kind='evidence') checks every claim has `evidence_ref` AND freshness within TTL via P209 EvidenceMap (D-16); D-19 belt-and-suspenders pricing/evidence enforcement (pre-publish gate + runtime template-variable scan + render-time fail-closed return 503 + render-time freshness re-validation per D-69); the 209 `<EvidenceMapPanel />` + `<EvidenceCitationChip />` + `<KbGroundingPanel />` extracted-component recipes are CONSUMED in production by EvidenceBlockComponent (block-level evidence_pack_id rendering) and PageEditor "Evidence binding inspector" tab and GatesPanel evidence-gate row evidence_refs[] preview; EVD-01..06 doctrine carry — EVD-01 (block factual claims linked to citations via `evidence_pack_id`) + EVD-02 (page publish blocks dispatch without evidence_ref when content-classifier flags claim-shape pattern per D-72) + EVD-04 (page render-time freshness re-validation reuses non-stale evidence per D-69) + EVD-05 (PageEditor exposes evidence + assumptions + claim risk per binding))
  - 213-UI-SPEC.md (PARENT — Tenant 0 readiness gate consumer; 213-04 public-proof boundary applies STRICTLY to PUBLIC conversion surfaces — ConversionPage block bodies + ConversionForm field labels/help/error + CTA target_url copy + Testimonial body + Evidence claims + LaunchBrief positioning_summary + LaunchRunbook step.name body + LaunchOutcome narrative_summary are all SUBJECT to the public-proof boundary because public landing pages are user-visible production output; raw customer NIT, customer email, primary phone, opportunity amount NEVER cited in public block content; banned-lexicon zero-match required on every block body + form field label/help + page seo_meta.title + page seo_meta.description + LaunchBrief positioning_summary + runbook step.name + LaunchOutcome.narrative_summary BEFORE any approval-package dispatch (page-publish + form-publish path AND BEFORE launch_brief_publish path); 213.4-VALIDATION.md carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary) carries verbatim into all 15 block components + 2 form sub-components + operator UI surfaces)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; per D-21 `cdp_identity_profiles.profile_id` is the canonical identity reader for SaaS bridge consumed via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`; ConversionEvent.identity_ref carries `anonymous_identity_id` OR `profile_id` per D-09 — when `surface_kind='form'` AND submit succeeds, `api/tracking/identify.js` stitches anonymous → known per D-08 BEFORE emit() per D-33 step 4; the 214 `<SaaSActivationPanel />` extracted component is NOT directly composed in 224 surfaces but the activation gate `isSaaSSurfaceEnabled` 3-condition pattern is REUSED by SignupWidgetBlock when block targets a SaaS-only conversion path (deferred); architecture-lock D-32 carries verbatim — legacy `api/*.js` REST tree, NOT App Router `app/api/.../route.ts`)
  - 215-UI-SPEC.md (PARENT — sensitive credential UI binding contract Layer 6 carries verbatim AND EXTENDS to PII data per 216 inheritance — every form field label/help that names a CDP-resolved identity field (raw `primary_email` / `primary_phone` / `company_name` from P221 IdentityProfile via `getProfileForContact`) renders via `<PIIRedactedField />` per `pii_classification` ENUM 5-value taxonomy in PageEditor preview pane + FormEditor preview pane + Testimonial render + Evidence render; audit-log `event_type == 'identity_view'` mirrors `credential_view` pattern (every PII field render writes audit row); `<PIIRedactedField />` `onCopy` interceptor MUST `preventDefault()` to block PII clipboard exfiltration; the 215 billing-correction modal recipe is REUSED VERBATIM for `page_publish_approval` (when content-classifier finds severity='block' on pricing_binding/factual_claim per D-72) AND `form_publish_approval` (when classifier flags) AND `launch_arm_approval` AND `launch_execute_approval` (D-37 + D-66 trigger gating) AND `gate_waiver_approval` (D-18 admin RBAC) AND `rollback_approval` (D-38) — all 6 P224 modal flows reuse the recipe per D-44)
  - 216-UI-SPEC.md (PARENT — Health Score binding for SignupWidget urgency; the 216 `<HealthScoreBadge />` + `<RiskBandBadge />` + `<RetentionClassChip />` + `<PIIRedactedField />` + `<KbGroundingPanel />` + `<ClassifierChipRow />` extracted-component recipes are CONSUMED IN PRODUCTION by 224 surfaces — `<KbGroundingPanel />` reused in EvidenceBlockComponent (block evidence_pack_id rendering with top-3 sources + `chunk_id` chips + `source_type` badge + `relevance_score`) AND in GatesPanel evidence-gate row evidence_refs[] rendering AND in PageEditor "Evidence binding inspector" panel; `<ClassifierChipRow />` reused in PageEditor "Content classifier findings" overlay (per D-72 P224-owned greenfield content classifier — currency_pattern + claim_shape_pattern → severity='block'/'flag'/'info') + FormEditor "Content classifier findings" overlay; `<PIIRedactedField />` reused in PageEditor preview (sample recipient render in form preview), TestimonialBlock attribution name (when CDP-resolved), SocialProofBlock customer logo + name, EvidenceBlock claim author, FormBlock confirmation thank-you-page recipient name; the 5 `pii_classification` ENUM badges (`no_pii`/`pseudonymous`/`personal`/`sensitive`/`highly_sensitive`) carry verbatim and apply to public-facing rendering anywhere a CDP-resolved PII field surfaces; banned-lexicon zero-match enforced on block bodies + form field labels + page seo_meta + LaunchBrief positioning + runbook step.name + outcome narrative_summary BEFORE approval-package dispatch)
  - 217-UI-SPEC.md (PARENT — heavy-UI pattern reference; D-15 selective extraction recipe (7 components first consumed in production: `<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />`); D-21 server/client boundary doctrine carries verbatim — `app/(markos)/` tree was preserved per D-43 + 222 D-43 + 223 D-43 (NOT deleted, NOT migrated to `app/saas/`); the 224 NEW UI components live under `components/markos/conversion/blocks/*` + `components/markos/conversion/forms/*` (NOT under `app/(markos)/`) per the same D-43 doctrine — `app/(markos)/` is FORBIDDEN as a NEW file path EXCEPT for the 2 NEW operator-shell sub-routes Plan 07 ships (`app/(markos)/conversion/` + `app/(markos)/launches/`) which CONSUME existing operator-shell layout — those sub-routes are NEW paths per D-45 + D-64 PERMITTED carve-out; the public dynamic route ships under EXISTING `app/(marketing)/conversion-page/[[...slug]]/page.tsx` per D-64 (NOT a new `app/(public)/` group — that route-group migration is DEFERRED per CONTEXT §Deferred Ideas); **D-57 architecture-lock carries verbatim** — legacy `api/*.js` (NOT App Router `app/api/.../route.ts`); `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` (NOT `requireSupabaseAuth` / NOT `requireTenantContext`); test runner is `npm test` (Node `--test`) with `node:test` + `node:assert/strict` imports, `*.test.js` files (`.test.ts` FORBIDDEN per D-61); OpenAPI lives at `contracts/openapi.json` per D-62 (NOT `public/openapi.json`); MCP registry at `lib/markos/mcp/tools/index.cjs` per D-63 (NOT `.ts`); cron in `api/cron/*.js` with `x-markos-cron-secret` header (NOT `app/api/cron/.../route.ts`); helper canon `buildApprovalPackage` per D-58 (NOT `createApprovalPackage`))
  - 220-UI-SPEC.md (PARENT — END-OF-v4.1.0 milestone state; 26 P208 handoff_kind chips at v4.1.0 closeout; 221 opens v4.2.0 commercial-engines lane and EXTENDS to 29 chips; 222 EXTENDS to 32 chips; 223 EXTENDS to 36 chips; 224 EXTENDS the chain to **42 chips** with 6 new literals — `page_publish_approval` 37th + `form_publish_approval` 38th + `launch_arm_approval` 39th + `launch_execute_approval` 40th + `gate_waiver_approval` 41st + `rollback_approval` 42nd — start-of-v4.2.0-commercial-engines-lane mid-state)
  - 221-UI-SPEC.md (PARENT — CDP IdentityProfile + ConsentState + TraitSnapshot via P221 read-through adapter per D-67; 221 D-32 architecture-lock carries verbatim; 221 dissolved its `future_phase_222_attribution_substrate` translation gate at the substrate-feed layer; 224 `lib/markos/conversion/forms/consent-double-gate.ts` (Plan 02) calls `assertUpstreamReady(['P221'])` then re-reads ConsentState (P221 adapter) BEFORE emit(); 224 `lib/markos/conversion/events/emit.ts` (Plan 02) writes ConsentState (P221 setConsentState) IF `consent_capture_block_id IS NOT NULL` BEFORE writing `conversion_events` row — D-67 BEFORE INSERT trigger on conversion_events REJECTS row when consent_capture_block_id present AND no matching consent_state row in same transaction; D-22 CDP mutations emit `EventEnvelope` rows to `cdp_events` with `event_domain='website'|'product'` — shared `source_event_ref` threads conversion_events ↔ cdp_events ↔ crm_activity ↔ EvidenceMap (P209))
  - 222-UI-SPEC.md (PARENT — Customer360 + Opportunity + lifecycle progression; 222 D-43 architecture-lock carries verbatim; 224 `lib/markos/conversion/events/emit.ts` (Plan 02) D-33 step 6 calls Customer360 lifecycle progression (anonymous → known on form submit; known → engaged on CTA click) via P222 adapter at `lib/markos/crm360/*` (upstream-owned greenfield; hard-fail per D-60 if absent); D-33 step 7 NBA recompute trigger via P222 D-08 for affected Customer360 record; LaunchOutcome.pipeline_created reads opportunities table linked via launch_id per D-40 (D-71 hard-fails if P222 absent); 222 dissolved its `future_phase_223_dispatch_substrate` and 222 opened `future_phase_222_admin_ui` placeholder which 224 partially DISSOLVES via app/(markos)/conversion + app/(markos)/launches new sub-routes per D-45 + D-64)
  - 223-UI-SPEC.md (PARENT — END-OF-v4.2.0 channel-engine state; 223 D-42 architecture-lock carries verbatim; 224 LaunchSurface polymorphic surface_target_kind enum 9 values (`email_campaign` / `messaging_thread` / `lifecycle_journey` / `conversion_page` / `social_pack` / `sales_enablement` / `partner_pack` / `support_pack` / `docs_update`) per D-14 — when surface_target_kind IN ('email_campaign', 'messaging_thread', 'lifecycle_journey'), surface_target_id FK targets P223 `lib/markos/channels/*` substrate (upstream-owned greenfield; hard-fail per D-60 if absent); when surface_target_kind='conversion_page', FK targets THIS phase's `conversion_pages.page_id`; LaunchOutcome.signups + .pipeline_created reads `dispatch_events` (P223) joined by launch_id per D-40 (D-71 hard-fails if P223 absent); 223 opened `future_phase_224_conversion_surfaces` placeholder which 224 DISSOLVES; 36 P208 handoff chips post-223 — 224 extends to 42 chips with 6 new literals; D-46 axe-playwright reuse pattern carries verbatim — 224 reuses existing axe-playwright devDep, NEVER installs new playwright runtime per D-61)
  - 213.4-VALIDATION.md §Carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary)
translation_gates_dissolved_by_224:
  - "223-UI-SPEC §future_phase_224_conversion_surfaces (anticipated future P224 conversion surfaces consumer placeholder) — DISSOLVED at the substrate-feed layer for the conversion-page + form + launch contract. 224-01 ships ConversionPage + ConversionForm + ConversionCTA + ConversionExperiment SOR (per D-01..D-07, D-21..D-23) which P223 channel templates target via LaunchSurface(surface_target_kind='conversion_page') per D-14 read-through; 224-03 ships block-based renderer + 15 block React components + 2 form sub-components + public dynamic route under existing app/(marketing)/ tree per D-29 + D-64; 224-07 ships operator workspaces under existing app/(markos)/ tree per D-45 + D-64. The future P224 substrate is now LIVE (not placeholder); P223 LaunchSurface readers + P225 attribution + P226 sales enablement + P227 partner amplification consume `conversion_pages` + `conversion_forms` + `conversion_events` + `experiment_assignments` + `launch_briefs` + `launch_surfaces` + `launch_outcomes` for downstream attribution + journey + narrative + statistical winner detection + sales play + partner amplification per ANL-01..05 and SAL-01..05. The `<PlaceholderBanner variant=\"future_phase_224_conversion_surfaces\">` is REMOVED from 223-consuming surfaces."
  - "222-UI-SPEC §future_phase_222_admin_ui (multi-page CRM 360 admin surface placeholder) — PARTIALLY DISSOLVED at the operator-UI extension layer. 224-07 ships TWO new sub-routes under existing `app/(markos)/` tree (D-45 + D-64): `app/(markos)/conversion/page.tsx` (ConversionWorkspace shell) + `app/(markos)/launches/page.tsx` (LaunchCockpit shell) WITH dedicated editor/viewer components (PageEditor, FormEditor, RunbookEditor, LaunchReadinessBoard, GatesPanel, OutcomesDashboard). 222 CRM admin surfaces (`app/(markos)/crm/customer360/`, `.../opportunities/`, `.../committees/`, `.../nba/`, `.../funnel/`) remain DEFERRED — 224 only DISSOLVES the conversion + launch admin sub-trees of the placeholder. The `<PlaceholderBanner variant=\"future_phase_222_admin_ui\">` continues to render on 222 surfaces UNTIL P226+ ships the CRM admin sub-tree."
  - "100-CONTEXT D-01..D-10 + 101-CONTEXT D-01..D-04 (legacy CRM workspace + tracking placeholder for the to-be-shipped Conversion + Launch substrate) — DISSOLVED. P100-P105 substrate (`crm_entities`, `crm_activity_ledger`, `lib/markos/crm/{workspace,execution,timeline,tracking,attribution,identity,merge,copilot,reporting,agent-actions,api,contracts,entities,tracking}.ts`) is PRESERVED VERBATIM (additive extension only — `api/tracking/ingest.js` retrofit per D-11 emits ConversionEvent + cdp_events alongside existing crm_activity row WHEN payload carries surface_id + surface_kind; legacy event_family taxonomy preserved via alias mapping; legacy regression test ships in 224-07 closeout per `test/regression/existing-marketing-routes.regression.test.js`). 224 does NOT replace P100-P105; it OVERLAYS Conversion + Launch substrate via shared `source_event_ref` thread per D-09 + D-33."
translation_gates_opened_by_224:
  - "future_phase_225_attribution_journey_analytics — Future commercial-engines lane consumer (P225 Attribution + Journey + Narrative Engine) consuming 224 substrate. P225 reads `conversion_events` + `experiment_assignments` + `launch_outcomes` for attribution + journey + narrative + statistical winner detection per ANL-01..05; consumes `conversion_events.experiment_variant_id` per D-23 (sticky bucket capture) + `conversion_events.launch_id` per D-09 (launch attribution thread); 224 D-24 explicitly DEFERS decision rules + winner detection + ICE backlog to P225 — 224 ships native registry + assignment + bucket capture only. Future surfaces render `<PlaceholderBanner variant=\"future_phase_225_attribution_journey_analytics\">` until that phase ships."
  - "future_phase_224_visual_page_builder — Drag-and-drop visual page builder (Figma-like block editor) DEFERRED per D-04. v1 ships JSON-mode TemplateEditor pattern (mirrors P223 D-25 channel template editor pattern) — operators edit `content_blocks` JSONB array via PageEditor JSON editor + preview pane (renders D-03 page-renderer SSR output). Visual builder v2 deferred. Future surfaces render `<PlaceholderBanner variant=\"future_phase_224_visual_page_builder\">` until that phase ships."
  - "future_phase_226_sales_enablement_launch_surface — P226 sales enablement consumer of LaunchSurface(surface_target_kind='sales_enablement'). P226 ships battlecards + proof packs + proposals; LaunchSurface registers the polymorphic kind in 224 per D-14 but P224 ships ZERO content — only the registry slot. P226 fills the slot by writing `surface_target_id` UUID linking to P226 sales-enablement record. Future surfaces render `<PlaceholderBanner variant=\"future_phase_226_sales_enablement_launch_surface\">` until that phase ships."
  - "future_phase_227_partner_pack_launch_surface — P227 ecosystem/partner consumer of LaunchSurface(surface_target_kind='partner_pack'). P227 ships ecosystem + partner + affiliate + community + developer-growth content; LaunchSurface registers the polymorphic kind in 224 per D-14 but P224 ships ZERO content — only the registry slot. P227 fills the slot by writing `surface_target_id` UUID linking to P227 partner-pack record. Future surfaces render `<PlaceholderBanner variant=\"future_phase_227_partner_pack_launch_surface\">` until that phase ships."
  - "future_phase_224_chromatic_baselines — Chromatic visual baseline gate enforcement (15 block components × ≥2 named-state stories each = 30+ snapshots LIMITED to PublicPageRender story per Plan 03 + 4 operator workspace stories per Plan 07 = ≥34 snapshots) lives under Plan 07 (autonomous: false per D-45 RL1 — operator review on first batch with checkpoint per Phase 226 W1 model). Future approval needed if visual diffs accepted on subsequent baselines without operator review. 224-07 Plan ships the `chromatic.config.json` + `*.stories.tsx` files; downstream phases (P225+) MUST NOT add components/markos/conversion/* OR app/(markos)/conversion + app/(markos)/launches sub-routes without registering corresponding Storybook stories + Chromatic snapshots."
  - "future_phase_224_route_group_migration — Migration of public conversion route from `app/(marketing)/conversion-page/[[...slug]]/page.tsx` to a dedicated `app/(public)/[[...slug]]/page.tsx` route group is DEFERRED per CONTEXT §Deferred Ideas. Current marketing routes (signup, integrations, docs) live under `app/(marketing)/` — creating a separate `app/(public)/` group is a breaking refactor of existing user-visible URLs. P224 D-64 keeps the new dynamic catch-all under `app/(marketing)/` to avoid double scope. Future route-group migration phase will move `conversion-page/` to `(public)/` group AND migrate existing marketing routes simultaneously. Future surfaces render `<PlaceholderBanner variant=\"future_phase_224_route_group_migration\">` until that phase ships."
---

# Phase 224 — UI Design Contract (HYBRID HEAVY-UI)

> Visual and interaction contract for the **Conversion + Launch Workspace** phase. Phase 224 is HYBRID HEAVY-UI: five backend plans (224-01, 224-02, 224-04, 224-05, 224-06) ship migrations + libs + handlers + cron + tests with **zero NEW UI surface**; two UI plans (224-03, 224-07) ship **15 NEW block components + 2 NEW renderers (page-renderer + form-renderer) + 2 NEW form sub-components (FormField + FormFieldGroup) under `components/markos/conversion/*` + 1 NEW public dynamic route under existing `app/(marketing)/conversion-page/[[...slug]]/` + 9 NEW operator workspace surfaces under existing `app/(markos)/conversion/` + `app/(markos)/launches/` + 2 P208 inbox/brief PATCHes** (D-45 + D-46 + D-47 + D-64). Plans 03+07 collectively constitute the FIRST conversion-and-launch operator workspace AND the FIRST native public landing-page substrate of the v4.2.0 commercial-engines lane.
>
> **Critical posture:** 224 EVOLVES the existing `app/(marketing)/` tree (preserved per D-64; NOT migrated to `app/(public)/` per architecture-lock + CONTEXT §Deferred Ideas) AND extends the existing `app/(markos)/` tree (preserved per D-45 + 222 D-43 + 223 D-43; NOT migrated to `app/saas/`). The 15 NEW block components + 2 NEW renderers + 2 NEW form sub-components live under `components/markos/conversion/*` per D-43 carry. The 9 NEW operator workspace surfaces live under `app/(markos)/conversion/` + `app/(markos)/launches/` — these are NEW PATHS but PERMITTED per D-45 + D-64 carve-out (operator-shell sub-routes consume existing layout-shell). The public dynamic route lives at `app/(marketing)/conversion-page/[[...slug]]/page.tsx` — sibling to existing `app/(marketing)/{signup,integrations,docs}/` per D-64. Every approval gate cites 206 mutation-class doctrine; every approval-package call uses `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-58 (NEVER `createApprovalPackage` — verified non-existent in the codebase per `224-REVIEWS.md` HIGH-1). Every page publish + form publish + launch arm + launch execute + gate waiver + rollback path calls `buildApprovalPackage` with the corresponding `kind` literal per D-44.
>
> **Architecture-lock note:** Per D-57 forbidden-pattern detector (Plan 01 Task 0.5) — `createApprovalPackage`, `requireSupabaseAuth`, `requireTenantContext`, `serviceRoleClient` (outside `requireHostedSupabaseAuth` boundary), `lookupPlugin` (use `resolvePlugin` per D-57), `public/openapi.json` (use `contracts/openapi.json` per D-62), `app/(public)`, `app/(markos)` AS NEW FILE PATH (the 2 PERMITTED new sub-routes — `conversion/` + `launches/` — are the explicit carve-out per D-45 + D-64; ALL OTHER new `app/(markos)/*` paths remain forbidden), `route.ts` (outside doctrinal NO-X comments + outside the NO-route.ts narrative band of CONTEXT D-57..D-72), `vitest run`, `from 'vitest'`, `.test.ts`, `"stub if missing"`, `"if exists"`, `"bridge stub"` are all auto-FAIL tokens. The forbidden-pattern detector test scans every `.planning/phases/224-*-PLAN.md` file for the rejected tokens.
>
> **D-61 axe-playwright reuse note:** Per D-61 test runner pinned to `npm test` (Node `--test`); **NO new vitest, NO new playwright install in P224**. All `*.test.js` files (NOT `.test.ts`) use `node:test` + `node:assert/strict`. The CHROMATIC SNAPSHOT GATE (existing `chromatic` devDep) + EXISTING `axe-playwright` devDep (preserved per 223 D-46 carry — accessibility-test infrastructure ONLY; reused for ZERO or ONE optional operator-journey E2E if needed by Plan 07) + MANUAL OPERATOR-JOURNEY CHECKLIST replaces any Playwright e2e for the new UI surfaces. Plan 07 closeout includes a meta-test that asserts `package.json` did not gain `vitest` or NEW `@playwright/test` keys during P224 execution (the existing axe-playwright devDep IS preserved per 223 D-46 carry).
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md carry-forward (D-08..D-15 + D-21) → 206-UI-SPEC (mutation-class doctrine origin) → 207-UI-SPEC (RunApiEnvelope + AgentRunEventType + ApprovalHandoffRecord) → 208-UI-SPEC (cockpit pattern parent + Approval Inbox + Morning Brief extension points) → 209-UI-SPEC (EvidenceMap + KbGroundingPanel) → 213-UI-SPEC (T0 gate consumer + public-proof boundary — STRICT for public landing pages) → 214-UI-SPEC (PARENT — SaaS Suite Activation; CDP profile read-through adapter pattern) → 215-UI-SPEC (PARENT — sensitive credential UI binding Layer 6 EXTENDS to PII) → 216-UI-SPEC (PARENT — Health Score binding for SignupWidget urgency + 6 extracted components first consumed in 217 NOW REUSED in 224) → 217-UI-SPEC (PARENT — heavy-UI pattern reference; D-15 extracted components reused; D-21 server/client boundary; D-32 architecture-lock) → 220-UI-SPEC (END-OF-v4.1.0; 26 chips at v4.1.0 closeout) → 221-UI-SPEC (PARENT — CDP read-through adapter; opens v4.2.0; 29 chips post-221) → 222-UI-SPEC (PARENT — CRM 360 + Customer360 lifecycle; 32 chips post-222) → 223-UI-SPEC (PARENT — Channel Engine; 36 chips post-223) → this document. Generated by gsd-ui-researcher 2026-05-05. Status: draft (checker upgrades to approved once 6-pillar audit passes).

---

## Plan Scope Classification

| Plan | Wave | Title | UI Scope | Primary Surface | Mobile Priority |
|------|------|-------|----------|-----------------|-----------------|
| **224-01** | 1 (incl. Wave 0.5) | Architecture-lock + assertUpstreamReady + 10 of 13 SOR foundation + 10 F-IDs + block schema | NO_UI | `supabase/migrations/121_conversion_pages.sql` through `126_launch_surfaces.sql`, `lib/markos/conversion/preflight/{upstream-gate,errors}.ts`, `lib/markos/conversion/blocks/schema.ts` (15 Zod validators), `lib/markos/{conversion,launches}/contracts/*.ts`, `scripts/preconditions/224-check-upstream.cjs`, `test/conversion/preflight/architecture-lock.test.js`, F-132..F-136 + F-139..F-141 + F-143..F-144 | n/a |
| **224-02** | 2 | emit() 7-sink fan-out + ConsentState DB trigger + rate-limit primitive + public form submit | NO_UI | `supabase/migrations/130_ingest_retrofit_emit_consent_trigger.sql`, `lib/markos/conversion/events/{emit,identity-stitch,idempotency}.ts`, `lib/markos/conversion/forms/{bot-id-gate,rate-limit-public-form,honeypot,consent-double-gate,submit-handler}.ts`, `api/v1/public/conversion/forms-submit.js`, `api/tracking/ingest.js` retrofit, F-137 + F-138 | n/a |
| **224-03** | 2 | Public renderers + 15 block components + 2 form sub + dynamic public route + ISR + freshness + classifier | **IN_SCOPE (PUBLIC)** | `lib/markos/conversion/render/{page-renderer,binding-resolver,cache-tags,freshness-check,seo-meta}.ts(x)`, `lib/markos/conversion/forms/form-renderer.tsx`, `lib/markos/conversion/blocks/content-classifier.ts`, **15 block components** at `components/markos/conversion/blocks/*.tsx` (`HeroBlock`, `ContentBlock`, `PricingBlock`, `CtaBlock`, `TestimonialBlock`, `FaqBlock`, `FooterBlock`, `ImageBlock`, `VideoBlock`, `ComparisonBlock`, `SocialProofBlock`, `EvidenceBlockComponent`, `SignupWidgetBlock`, `FormBlock`, `CustomHtmlBlock`), **2 form sub-components** at `components/markos/conversion/forms/{FormField,FormFieldGroup}.tsx`, **public dynamic route** at `app/(marketing)/conversion-page/[[...slug]]/page.tsx` + `loading.tsx`, `app/sitemap.ts`, `api/v1/conversion/pages-publish.js` + `pages-archive.js`, 1 Storybook story `PublicPageRender.stories.tsx` (ALL block variants × ≥2 states each ≥30 snapshots) | **critical** for FormBlock + SignupWidgetBlock + CtaBlock interactive islands; **secondary** for static blocks (Hero/Content/Pricing/Testimonial/Faq/Footer/Image/Video/Comparison/SocialProof/Evidence/CustomHtml) |
| **224-04** | 3 | Launch gates + outcomes + 4 evaluators + waivers + readiness DB trigger | NO_UI | `supabase/migrations/127_launch_gates.sql` + `129_launch_outcomes.sql` + `133_launch_readiness_required_trigger.sql`, `lib/markos/launches/gates/{pricing,evidence,readiness,approval,evaluate-all,waiver}-evaluator.ts`, `lib/markos/launches/surfaces/{surface-coordinator,state-machine}.ts`, `lib/markos/launches/outcomes/{compute,metrics}.ts`, 7 `api/v1/launches/*.js` endpoints, F-141 + F-143 active | n/a |
| **224-05** | 3 | A/B experiments + SHA-256 sticky-hash + traffic_split immutability trigger | NO_UI | `supabase/migrations/131_experiment_hash_indexes.sql`, `lib/markos/conversion/experiments/{hash,sticky-hash,traffic-split,assignment,lifecycle}.ts`, page-renderer.tsx PATCH (variant overrides), 3 `api/v1/conversion/experiments*.js`, F-136 active | n/a |
| **224-06** | 4 | Runbook executor + reverse-rollback + 4 cron + execute DB trigger | NO_UI | `supabase/migrations/128_launch_runbooks.sql` + `132_launch_cron_state_and_execute_trigger.sql`, `lib/markos/launches/runbook/{executor,step-handlers,rollback,idempotency}.ts`, `lib/markos/launches/cron/{surface-health-audit,gate-evaluation-poll,outcome-computation,bounce-spike-alert}.ts`, 4 `api/v1/launches/runbooks*.js` + 4 `api/crons/launches-*.js`, `vercel.json` PATCH, F-142 active | n/a |
| **224-07** | 5 | Closeout — 6 MCP tools + 7 legacy *.js conversion APIs + operator UI under app/(markos)/ + Approval Inbox + Morning Brief PATCHes + chromatic gate | **IN_SCOPE (OPERATOR)** | 6 MCP tools at `lib/markos/mcp/tools/*.cjs` (publish-page, submit-form, evaluate-launch-gates, execute-runbook, rollback-launch, get-launch-outcome), 7 `api/v1/conversion/*.js` + 1 internal endpoint, **9 operator UI surfaces** at `app/(markos)/conversion/{page,PageEditor,FormEditor}.tsx` + `app/(markos)/launches/{page,LaunchCockpit,RunbookEditor,LaunchReadinessBoard,GatesPanel,OutcomesDashboard}.tsx`, 2 module CSS, `lib/markos/operating/approvals/entry-types.ts` PATCH (6 new entry types), `lib/markos/operating/morning-brief/launches-section.ts`, F-145 + F-146 contracts + F-132..F-146 graduate active in `contracts/openapi.json` per D-62, 4 chromatic stories, slot-collision regression test, OpenAPI parity test, RLS suite, P221/P222/P223 regression, existing-marketing-routes regression | **critical** for ConversionWorkspace events stream (operator field-of-view); **secondary** for PageEditor + FormEditor + LaunchCockpit + RunbookEditor + LaunchReadinessBoard + GatesPanel + OutcomesDashboard |

**Hybrid scope rationale.** Plans 224-01/02/04/05/06 ship the durable substrate (architecture-lock + 13 SOR + emit() fan-out + ConsentState DB trigger + 4 launch gates + outcomes + sticky-hash experiments + runbook executor + 4 cron) without rendering any pixel. Plans 224-03/07 ship the operator-facing AND PUBLIC-facing Conversion + Launch experience with **15 NEW block components + 2 NEW renderers + 2 NEW form sub-components first consumed in production** under `components/markos/conversion/*` + **1 NEW public dynamic route** under existing `app/(marketing)/` + **9 NEW operator workspace surfaces** under existing `app/(markos)/` + **2 P208 PATCHes** (Approval Inbox entry-types + Morning Brief launches section). The `<KbGroundingPanel />`, `<ClassifierChipRow />`, `<PIIRedactedField />` extracted-component recipes from 216-UI-SPEC §D-15 (first consumed in 217-UI-SPEC §D-15) are **REUSED** in 224 surfaces (in EvidenceBlockComponent + PageEditor binding inspector + GatesPanel evidence-gate row + content-classifier findings overlay).

**Mobile priority.** Per 208-01 mobile_priority literals (`critical | secondary | desktop_only`):

| Surface | mobile_priority | Rationale |
|---------|-----------------|-----------|
| `components/markos/conversion/blocks/FormBlock.tsx` (PUBLIC) | `critical` | Public conversion form — primary mobile conversion path |
| `components/markos/conversion/blocks/SignupWidgetBlock.tsx` (PUBLIC) | `critical` | Public signup — primary mobile conversion path |
| `components/markos/conversion/blocks/CtaBlock.tsx` (PUBLIC) | `critical` | Public CTA — primary mobile conversion path |
| `components/markos/conversion/blocks/HeroBlock.tsx` (PUBLIC) | `secondary` | Above-fold hero; mobile renders stacked |
| `components/markos/conversion/blocks/{Content,Pricing,Testimonial,Faq,Footer,Image,Video,Comparison,SocialProof,EvidenceBlockComponent,CustomHtml}Block.tsx` (PUBLIC) | `secondary` | Static block content; mobile renders stacked |
| `components/markos/conversion/forms/{FormField,FormFieldGroup}.tsx` (PUBLIC) | `critical` (parent inherits FormBlock + SignupWidgetBlock) | Form input field; touch target ≥44px on coarse pointers |
| `app/(markos)/conversion/page.tsx` ConversionWorkspace + recent ConversionEvents stream | **`critical`** | Operator field-of-view for live form submits + live ConversionEvents |
| `app/(markos)/conversion/PageEditor.tsx` | `secondary` | Operator desk-work; JSON edit + preview |
| `app/(markos)/conversion/FormEditor.tsx` | `secondary` | Operator desk-work; field config |
| `app/(markos)/launches/page.tsx` LaunchCockpit + RunbookEditor + LaunchReadinessBoard + GatesPanel + OutcomesDashboard | `secondary` | Operator desk-work; launch coordination |

`desktop_only` is FORBIDDEN as a `mobile_priority` value (208-01 architecture-lock). All surfaces meet WCAG 2.1 AA touch targets via the global `(pointer: coarse) { .c-button { min-height: 44px } }` rule already shipping per 213.2 cross-cutting fix. Each surface registers in `lib/markos/operator/shell.ts` `SurfaceRouteContract` via `surface_family: conversion_*` OR `launches_*` (operator UI) OR `surface_family: public_conversion_*` (public-facing render path; registered for telemetry + mobile_priority enforcement, NOT for shell layout consumption).

All Acceptance Criteria below apply to plans 224-03/07 deliverables. Plans 224-01/02/04/05/06 are backend-only and produce no NEW UI artifacts.

---

## Surface Inventory

| ID | Surface | Plan | Path | Kind | Mobile | Storybook |
|----|---------|------|------|------|--------|-----------|
| **B1** | HeroBlock | 03 | `components/markos/conversion/blocks/HeroBlock.tsx` | block-static (RSC) | secondary | PublicPageRender#Hero |
| **B2** | ContentBlock | 03 | `components/markos/conversion/blocks/ContentBlock.tsx` | block-static (RSC) | secondary | PublicPageRender#Content |
| **B3** | PricingBlock | 03 | `components/markos/conversion/blocks/PricingBlock.tsx` | block-static (RSC) — pricing-binding inspector + `{{pricing.*}}` resolution + `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel | secondary | PublicPageRender#Pricing#Resolved + PublicPageRender#Pricing#PendingSentinel |
| **B4** | CtaBlock | 03 | `components/markos/conversion/blocks/CtaBlock.tsx` | block-interactive (`'use client'`) — CTA with state | **critical** | PublicPageRender#Cta#Idle + PublicPageRender#Cta#ClickedAndStitched |
| **B5** | TestimonialBlock | 03 | `components/markos/conversion/blocks/TestimonialBlock.tsx` | block-static (RSC) — author rendered via `<PIIRedactedField />` | secondary | PublicPageRender#Testimonial |
| **B6** | FaqBlock | 03 | `components/markos/conversion/blocks/FaqBlock.tsx` | block-static (RSC) | secondary | PublicPageRender#Faq |
| **B7** | FooterBlock | 03 | `components/markos/conversion/blocks/FooterBlock.tsx` | block-static (RSC) | secondary | PublicPageRender#Footer |
| **B8** | ImageBlock | 03 | `components/markos/conversion/blocks/ImageBlock.tsx` | block-static (RSC) | secondary | PublicPageRender#Image |
| **B9** | VideoBlock | 03 | `components/markos/conversion/blocks/VideoBlock.tsx` | block-static (RSC) — `<video>` with `playsinline` + `preload='none'` for mobile data-saver | secondary | PublicPageRender#Video |
| **B10** | ComparisonBlock | 03 | `components/markos/conversion/blocks/ComparisonBlock.tsx` | block-static (RSC) — vanilla `<table>` per D-14 | secondary | PublicPageRender#Comparison |
| **B11** | SocialProofBlock | 03 | `components/markos/conversion/blocks/SocialProofBlock.tsx` | block-static (RSC) — customer logo + name via `<PIIRedactedField />` | secondary | PublicPageRender#SocialProof |
| **B12** | EvidenceBlockComponent | 03 | `components/markos/conversion/blocks/EvidenceBlockComponent.tsx` | block-static (RSC) — composes `<KbGroundingPanel />` from 216 §D-15 | secondary | PublicPageRender#Evidence |
| **B13** | SignupWidgetBlock | 03 | `components/markos/conversion/blocks/SignupWidgetBlock.tsx` | block-interactive (`'use client'`) — embedded mini-form (email + cta) for content-download/waitlist objectives | **critical** | PublicPageRender#SignupWidget#Empty + PublicPageRender#SignupWidget#Submitted |
| **B14** | FormBlock | 03 | `components/markos/conversion/blocks/FormBlock.tsx` | block-interactive (`'use client'`) — full form composition delegating to FormRenderer | **critical** | PublicPageRender#Form#Empty + PublicPageRender#Form#WithErrors + PublicPageRender#Form#Submitted |
| **B15** | CustomHtmlBlock | 03 | `components/markos/conversion/blocks/CustomHtmlBlock.tsx` | block-static (RSC) — admin-approved markup via DOMPurify SSR sanitization | secondary | PublicPageRender#CustomHtml |
| **R1** | page-renderer | 03 | `lib/markos/conversion/render/page-renderer.tsx` | renderer (server) — composes all 15 blocks; RSC orchestrator | n/a | (covered by all PublicPageRender stories) |
| **R2** | form-renderer | 03 | `lib/markos/conversion/forms/form-renderer.tsx` | renderer (server + client island) — dynamic form composition; auto-injects honeypot | n/a | (covered by FormBlock + SignupWidgetBlock stories) |
| **F1** | FormField | 03 | `components/markos/conversion/forms/FormField.tsx` | form sub-component (`'use client'`) — single field; 11 field types per D-06 | **critical** (parent inherits) | (covered by FormBlock stories) |
| **F2** | FormFieldGroup | 03 | `components/markos/conversion/forms/FormFieldGroup.tsx` | form sub-component (`'use client'`) — fieldset wrapper for grouped fields | **critical** (parent inherits) | (covered by FormBlock stories) |
| **PR1** | PublicConversionRoute | 03 | `app/(marketing)/conversion-page/[[...slug]]/page.tsx` + `loading.tsx` + `app/sitemap.ts` | dynamic catch-all route (RSC) — slug → ConversionPage → page-renderer; ISR cached via `cacheTag(tenant:${tenant_id}:page:${page_id})`; `updateTag` on publish/archive; D-69 freshness re-validation on cache hit | inherits per-block | (n/a — route coverage via integration test) |
| **OPE1** | ConversionWorkspace | 07 | `app/(markos)/conversion/page.tsx` | operator workspace shell (server component) — Pages list + Forms list + CTAs + Experiments + ConversionEvents stream + DeliverabilityWorkspace cross-link to P223 | **critical** (events stream) | ConversionWorkspace |
| **OPE2** | PageEditor | 07 | `app/(markos)/conversion/PageEditor.tsx` | operator editor (`'use client'`) — JSON content_blocks editor + per-block JSON editor + preview pane (renders D-03 page-renderer) + Pricing/Evidence binding inspector + content-classifier findings + Publish CTA (gates approval) | secondary | PageEditor |
| **OPE3** | FormEditor | 07 | `app/(markos)/conversion/FormEditor.tsx` | operator editor (`'use client'`) — field list + variables_schema editor + identity_stitch toggle + thank_you_page link + preview | secondary | (covered by PageEditor combined story) |
| **OPL1** | LaunchCockpit | 07 | `app/(markos)/launches/page.tsx` | operator workspace shell (server component) — Briefs kanban + Surface board per launch + Gates panel + Runbook viewer + Outcomes dashboard | secondary | LaunchCockpit |
| **OPL2** | RunbookEditor | 07 | `app/(markos)/launches/RunbookEditor.tsx` | operator editor (`'use client'`) — ordered steps[] + rollback_steps[] + dependency graph + AgentRun status panel | secondary | (covered by LaunchCockpit combined story) |
| **OPL3** | LaunchReadinessBoard | 07 | `app/(markos)/launches/LaunchReadinessBoard.tsx` | operator viewer (`'use client'`) — dependency graph of readiness_checks + LaunchGate status + countdown to launch_date | secondary | LaunchReadinessBoard |
| **OPL4** | GatesPanel | 07 | `app/(markos)/launches/GatesPanel.tsx` | operator viewer (`'use client'`) — 4 gate kinds (pricing/evidence/readiness/approval) status panel + Waive CTA + Re-evaluate CTA | secondary | (covered by LaunchCockpit combined story) |
| **OPL5** | OutcomesDashboard | 07 | `app/(markos)/launches/OutcomesDashboard.tsx` | operator viewer (`'use client'`) — T+7 / T+14 / T+30 outcome rows × 5 metrics each (reach/signups/pipeline_created/influenced_revenue/activation_lift) | secondary | (covered by LaunchCockpit combined story) |
| **AIE1** | ApprovalInboxConversionEntries | 07 | `lib/markos/operating/approvals/entry-types.ts` PATCH | P208 entry-type renderer extension (6 new entry types: `page_publish_approval`, `form_publish_approval`, `launch_arm_approval`, `launch_execute_approval`, `gate_waiver_approval`, `rollback_approval`) | inherits P208 | (covered by P208 inbox story extension) |
| **MBL1** | MorningBriefLaunchesSection | 07 | `lib/markos/operating/morning-brief/launches-section.ts` | P208 morning-brief renderer extension — top-3 in-flight launches + readiness countdown + blocking gates per launch + recent ConversionEvent volume | inherits P208 | (covered by P208 morning-brief story extension) |

**Total NEW surfaces in P224: 15 blocks + 2 renderers + 2 form sub-components + 1 public route + 9 operator surfaces + 2 P208 PATCHes = 31 NEW UI artifacts** (component count; line-count budget ≈ 2 surfaces × ≈600 lines + 15 blocks × ≈80 lines + 2 form sub × ≈120 lines + 9 operator × ≈250 lines ≈ 5800 LOC across UI files; well within 224-03 + 224-07 budget).


---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (vanilla CSS Modules consuming `var(--*)` tokens from `app/tokens.css` + composing `.c-*` primitives from `styles/components.css` v1.1.0) |
| Preset | not applicable — repository is not shadcn-initialized (verified 2026-05-05: no `components.json` at repo root) |
| Component library | none — primitives in `styles/components.css` v1.1.0 (`.c-card`, `.c-button{,--primary,--secondary,--tertiary,--destructive,--icon}`, `.c-input`, `.c-field{,__label,__help,__error}`, `.c-notice c-notice--{info,warning,success,error}`, `.c-badge--{info,warning,success,error}`, `.c-modal`, `.c-backdrop`, `.c-status-dot{,--live,--error}`, `.c-chip{,--mint}`, `.c-chip-protocol`, `.c-code-inline`, `.c-code-block`, `.c-terminal`, `.c-toast--{success,warning,error,info}`) |
| Icon library | Lucide (default) · Phosphor Regular (only allowed substitute) — DESIGN.md "Iconography". Bracketed glyphs (`[ok]`, `[warn]`, `[err]`, `[info]`, `[block]`, `[up]`, `[down]`, `[flat]`, `[—]`, `[#]`) carry every state signal per CLAUDE.md "no emoji in product UI". |
| Heading font | JetBrains Mono (`var(--font-mono)`) — DESIGN.md `typography.h1`–`h4` |
| Body font | Inter (`var(--font-sans)`) — DESIGN.md `typography.body-md`, `lead`, `body-sm`, `label-caps` |
| Default theme | dark (`color-scheme: dark`); light opt-in via `[data-theme="light"]` (per `app/tokens.css` lines 191–204) |
| Form authoring posture | Primitive-only. The 15 block components + 2 form sub-components + 9 operator surfaces compose `.c-input`, `.c-button{,--*}`, `.c-field` + `.c-field__{label,help,error}`. No bespoke form CSS. FormField composes `.c-field` + `.c-input` (or `<select>` / `<textarea>` mapped to `.c-input` token recipe per field_type per D-06). FormFieldGroup composes vanilla `<fieldset>` with `<legend>` (no custom group CSS). PageEditor "Publish" CTA composes `.c-button--primary`. PageEditor "Save draft" composes `.c-button--secondary`. RunbookEditor "Arm runbook" / "Execute runbook" / "Rollback launch" CTAs compose `.c-button--primary` / `.c-button--secondary` / `.c-button--destructive`. GatesPanel "Re-evaluate gates" composes `.c-button--secondary`; "Waive gate" composes `.c-button--destructive`. |
| Banner authoring posture | **Primitive-only (D-09b carry).** Every gating state (page publish blocked by content-classifier severity='block', form publish blocked, launch arm blocked by readiness gate failure D-65, launch execute blocked by D-66 trigger, gate waived, runbook step skipped, runbook rollback dead-lettered, ConsentState revoked at submit, BotID outage 503, rate-limit 429, honeypot silent reject (audit-only), unresolved `{{pricing.*}}` 503, stale pricing_context_id D-69, stale evidence_pack_id D-69, content-classifier flag, content-classifier block, experiment traffic_split mutation BLOCKED post-activation D-70, idempotency replay 200 cached, AgentRun unavailable, P207/P221/P222/P223 absent UpstreamPhaseNotLandedError) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `components/markos/conversion/` or `app/(markos)/{conversion,launches}/` or `app/(marketing)/conversion-page/`. |
| Card authoring posture | `.c-card` default for ConversionWorkspace lists, PageEditor panels, FormEditor panels, LaunchCockpit kanban cards, RunbookEditor per-step cards, LaunchReadinessBoard per-check cards, GatesPanel per-gate cards, OutcomesDashboard per-period rows. **`.c-card--feature` is PROHIBITED in this phase** (D-13 carry). HeroBlock public render does NOT use `.c-card--feature`; vanilla `<section>` + token-based padding only. |
| PII display posture | All form field labels/help referencing CDP-resolved identity in PageEditor + FormEditor preview render via `<PIIRedactedField />` (216 §D-15). TestimonialBlock author_name + SocialProofBlock customer_name + EvidenceBlockComponent claim_author + FormBlock confirmation recipient name render via `<PIIRedactedField pii_classification="personal" />` when CDP-resolved. Audit-log `event_type == 'identity_view'` per render. `<PIIRedactedField />` `onCopy` `preventDefault()`. PUBLIC RENDERING posture: when ConversionPage block content renders public-facing (NOT in PageEditor preview), CDP-resolved PII fields ARE redacted by default — public landing pages NEVER expose un-redacted PII unless block schema explicitly authorizes via `pii_classification: 'no_pii'`. |
| Pricing display posture | All PricingBlock `pricing_context_id` references render via `<Money fromPricingRecommendation={pr_id} />` recipe XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel via `<PlaceholderBanner variant="billing_placeholder">`. CtaBlock `target_url` MUST NOT contain hard-coded pricing in query string. Phase 224 MUST NOT take pricing ownership. Zero hard-coded dollar/peso literals. JBM `font-feature-settings: 'tnum' 1` for all monetary columns in PricingBlock + PageEditor binding inspector + GatesPanel pricing-gate row + OutcomesDashboard `influenced_revenue`. Render-time enforcement per D-19: `binding-resolver.ts` scans `{{pricing.*}}`; unresolved → 503 + audit. Render-time freshness re-validation per D-69: on cache HIT, `assertPricingFresh(pricing_context_id)` re-checks; stale → 503 + audit. |
| Table authoring posture | **Vanilla `<table>` semantic only (D-14 carry).** ComparisonBlock public render uses vanilla `<table>`. PricingBlock plan-comparison renders vanilla `<table>` for plan tier × feature matrix. ConversionWorkspace events stream + PageEditor variable inspector + RunbookEditor steps[]/rollback_steps[] dependency table + LaunchReadinessBoard per-check matrix + GatesPanel per-gate row + OutcomesDashboard period × metric matrix all use vanilla `<table>`. The `.c-table` primitive remains deferred. |
| Placeholder posture | Future-substrate placeholders render `<PlaceholderBanner variant="future_phase_{N}_{slug}">` composing `.c-notice c-notice--info`. Active variants: `future_phase_225_attribution_journey_analytics` (OutcomesDashboard "Attribution preview" — first-touch v1 only per D-40), `future_phase_224_visual_page_builder` (PageEditor "Drag-and-drop layout" — JSON-mode only per D-04), `future_phase_226_sales_enablement_launch_surface` (LaunchCockpit "Sales enablement surface" tab — registry slot only per D-14), `future_phase_227_partner_pack_launch_surface` (LaunchCockpit "Partner pack surface" tab — registry slot only per D-14), `future_phase_224_route_group_migration` (PUBLIC route under `(marketing)/`; future migration to `(public)/` deferred). Pricing placeholders render `{{MARKOS_PRICING_ENGINE_PENDING}}` verbatim per 205 + 215 inheritance. Evidence placeholders render `{{MARKOS_EVIDENCE_PENDING}}` verbatim per 209 + D-19. |
| Server/client boundary (D-21 carry) | The 13 STATIC blocks (`HeroBlock`, `ContentBlock`, `PricingBlock`, `TestimonialBlock`, `FaqBlock`, `FooterBlock`, `ImageBlock`, `VideoBlock`, `ComparisonBlock`, `SocialProofBlock`, `EvidenceBlockComponent`, `CustomHtmlBlock`) ship as **RSC** per D-32. The 3 INTERACTIVE blocks (`CtaBlock`, `SignupWidgetBlock`, `FormBlock`) ship as **client components** (`'use client'`). The 2 form sub-components (`FormField`, `FormFieldGroup`) are **client components**. `page-renderer.tsx` is a **server function**; `form-renderer.tsx` ships **server-rendered shell + client island**. Operator UI: `page.tsx` shells are **server components** passing fetched data to **client components** (PageEditor, FormEditor, RunbookEditor, LaunchReadinessBoard, GatesPanel, OutcomesDashboard, LaunchCockpit). PUBLIC route `app/(marketing)/conversion-page/[[...slug]]/page.tsx` is **RSC** — calls page-renderer at SSR; client islands hydrate post-paint. Boundary named in each component's file header comment per D-21. |

---

## Spacing Scale

Authoring rule: every `padding`, `margin`, `gap`, `inset` MUST cite a `--space-*` token. No arbitrary px. Off-grid auto-FAIL.

| Token | Value | DESIGN.md citation | Usage |
|-------|-------|--------------------|-------|
| `--space-none` | 0 | `spacing.none` | Reset margins on `<h1>`, `<h2>`, `<p>`, `<table>`, `<ul>`, `<ol>`, `<form>`, `<fieldset>`, `<legend>` |
| `--space-xxs` | 2px | `spacing.xxs` | Badge inner padding, status-dot offset, chip group adjacency, classifier-finding stacking, FormField error-message offset |
| `--space-xs` | 8px | `spacing.xs` | FormFieldGroup inner gap, FormField label → input gap, ConversionWorkspace event row gap, PageEditor block-list gap, LaunchCockpit kanban card chip gap, RunbookEditor depends_on chip gap, GatesPanel evidence_refs chip gap, OutcomesDashboard metric gap |
| `--space-sm` | 16px | `spacing.sm` | Card vertical rhythm, notice padding-block, table padding-block, mobile horizontal page padding ≤ 640px, FormBlock per-field gap, SignupWidget email→CTA gap, HeroBlock title→subtitle gap, PricingBlock plan-card inner gap |
| `--space-md` | 24px | `spacing.md` | Card padding (via `.c-card`), gap between component sections, modal padding |
| `--space-lg` | 32px | `spacing.lg` | Inter-section gap (block→block on PUBLIC page; tab→tab on operator UI) |
| `--space-xl` | 48px | `spacing.xl` | Component vertical padding ≥ lg breakpoint, HeroBlock above-fold padding, FooterBlock padding-block, PUBLIC page top-of-fold |
| `--space-xxl` | 96px | `spacing.xxl` | Reserved — not used (DESIGN.md `--space-xl` 48px max) |

**Allowed exceptions (DESIGN.md documented):**
1. `1px` for hairline borders (`var(--color-border)`).
2. `2px` for focus ring width and offset.
3. `4px` for `.c-notice` `border-inline-start` accent (composed via primitive).
4. `max-width: 1280px` for cockpit container (`--w-container`) — operator UI surfaces.
5. `max-width: 720px` for PUBLIC ConversionPage main column on desktop (`--w-prose`); HeroBlock + FullBleedImageBlock + ComparisonBlock MAY exceed up to `--w-container`.
6. `max-width: 560px` for confirmation modals (`--w-modal`) — 6 modal flows reuse 215 billing-correction modal recipe.
7. `44px` mobile touch target via `--h-control-touch` for `(pointer: coarse)` viewports (already global per 213.2). **Critical:** FormField input + CTA button + SignupWidgetBlock submit + FormBlock submit MUST hit ≥44px on coarse pointers.

---

## Typography

| Role | DESIGN.md token | CSS class | Usage |
|------|-----------------|-----------|-------|
| PUBLIC page H1 | `typography.h1` | `<h1>` JBM + `--fs-h1` (2.441rem) + `--fw-semibold` | HeroBlock `<h1>` (ONE per page; from `seo_meta.title` or first hero block `title`) |
| Component heading | `typography.h2` | `<h2>` JBM + `--fs-h2` (1.953rem) + `--fw-semibold` | Per-block `<h2>` for ContentBlock + PricingBlock + TestimonialBlock + FaqBlock + ComparisonBlock + SocialProofBlock + EvidenceBlockComponent; per-operator-surface `<h2>`: "Conversion" (ConversionWorkspace), "Page editor", "Form editor", "Launches", "Runbook", "Readiness", "Gates", "Outcomes" |
| Section sub-heading | `typography.h3` | `<h3>` JBM + `--fs-h3` (1.563rem) + `--fw-semibold` | FaqBlock per-question; PricingBlock per-plan-tier; ConversionWorkspace tab headers ("Pages" / "Forms" / "CTAs" / "Experiments" / "Events"); LaunchCockpit kanban headers verbatim ("Planning" / "Pending approval" / "Ready" / "Live" / "Completed" / "Rolled back"); GatesPanel sub-headings ("Pricing" / "Evidence" / "Readiness" / "Approval"); OutcomesDashboard period headers ("T+7" / "T+14" / "T+30") |
| Inline sub-heading | `typography.h4` | `<h4>` JBM + `--fs-h4` (1.250rem) + `--fw-medium` | Filter group `<legend>` (ConversionWorkspace, PageEditor, FormEditor, LaunchCockpit, GatesPanel) |
| Surface descriptor | `typography.lead` | `.t-lead` Inter + `--fs-lead` (1.250rem) + `--fw-regular` + `--color-on-surface-muted` | HeroBlock `subtitle`, ContentBlock `lead_paragraph`, ConversionWorkspace "{N} page(s) — {M} published", LaunchCockpit "{N} launch(es) — {M} in flight" |
| Body copy | `typography.body-md` | inherited via `<p>`, `<td>`, `<li>` | Block body content, CTA description, FormField label + help, PageEditor JSON body, RunbookEditor step description, LaunchReadinessBoard check description, GatesPanel blocking_reasons, OutcomesDashboard narrative_summary |
| Eyebrow | `typography.label-caps` | `.t-label-caps` / `.c-field__label` | HeroBlock `eyebrow`, CtaBlock eyebrow ("Action"), FormField `<label>`, kanban card eyebrows ("Page" / "Form" / "Launch" / "Surface" / "Runbook"), events stream eyebrow ("Event"), GatesPanel eyebrow ("Gate"), OutcomesDashboard eyebrow ("Outcome") |
| Metadata / timestamps | `typography.body-sm` | `.c-field__help` `--fs-body-sm` (0.800rem) + `--color-on-surface-muted` | `published_at`, `archived_at`, `approved_at`, `created_at`, `updated_at`, `started_at`, `ended_at`, `launch_date`, `assigned_at`, `occurred_at`, `evaluated_at`, `waived_at`, `computed_at`, `expires_at`, `due_at`, FormField help when below body-sm |
| Form error inline | `typography.body-sm` | `.c-field__error` `--fs-body-sm` + `--color-error` + JBM + `::before content "[err] "` | FormField inline validation, reason-capture modal validation (≥20 chars per 216 carry) on PageEditor / FormEditor / RunbookEditor / GatesPanel modals |
| Monetary values | `typography.code-inline` + `font-feature-settings: 'tnum' 1` | `.c-code-inline` | PricingBlock plan price, PageEditor pricing-binding resolved value, GatesPanel pricing-gate amount, OutcomesDashboard `influenced_revenue`, ConversionWorkspace events `pricing_context_id` resolved chip |
| IDs / tokens | `typography.code-inline` | `.c-chip-protocol` | `page_id`, `form_id`, `cta_id`, `event_id`, `experiment_id`, `variant_id`, `assignment_id`, `launch_id`, `surface_id`, `gate_id`, `runbook_id`, `outcome_id` (composite launch_id+period_days), `check_id`, `source_event_ref` (single-thread shared ID per D-09 fan-out — threads conversion_events ↔ cdp_events ↔ crm_activity ↔ EvidenceMap), `audience_id` (FK P221), `pricing_context_id` (FK P205), `evidence_pack_id` (FK P209), `experiment_set_id`, `parent_page_id` (locale variant chain per D-01), `agent_run_id` (FK markos_agent_runs P207), `approval_ref` (FK Approval Inbox P208), `mutation_request_id`, `idempotency_key`, `submit_idempotency_key`. Each chip surrounds value with `[ ]` per `.c-chip-protocol::before/::after`. |

**Forbidden (auto-FAIL):**
- Any third typeface (not JetBrains Mono or Inter).
- Inline `font-size`, `font-weight`, `color` literals — use tokens only.
- Hard-coded dollar/peso amounts in any block body or form copy.
- Banned-lexicon tokens (CLAUDE.md). Banned-lexicon zero-match enforced at CI on **block bodies (all 15 block types) + ConversionPage `seo_meta.title` + `seo_meta.description` + ConversionForm field labels/help/error + LaunchBrief `positioning_summary` + LaunchRunbook `step.name` + LaunchOutcome `narrative_summary` + content-classifier flagged copy + waiver_reason + reason-capture modal copy** BEFORE `pages-publish.js` save AND BEFORE `forms-publish.js` save AND BEFORE `briefs-transition.js` AND BEFORE `runbooks-execute.js` AND BEFORE `gates-waive.js` AND BEFORE `external.send` (when LaunchSurface targets P223 channel substrate).

---

## Color

Composition target per DESIGN.md "Composition proportion":

| Range | Token group | Conversion + Launch component usage |
|-------|-------------|-------------------------------------|
| 70–80% | `surface` + `surface-raised` | Component background; `.c-card` block-content cards, kanban cards, per-launch surface cards, per-runbook step cards, per-gate cards, per-outcome rows; PUBLIC page background `--color-surface` (Kernel Black) |
| 15–20% | `on-surface` + `on-surface-muted` + `on-surface-subtle` | All headings, body copy, table content, eyebrows, metadata, timestamps, FormField labels + help |
| 3–5% | `primary` + `primary-text` | Single primary CTA per state (PUBLIC: HeroBlock CTA + FormBlock submit + SignupWidgetBlock submit + CtaBlock primary; OPERATOR: PageEditor "Publish page" + FormEditor "Publish form" + RunbookEditor "Arm" / "Execute" + GatesPanel "Re-evaluate" + ConversionWorkspace "Create page/form/CTA/experiment" + LaunchCockpit "Create launch"), focus rings, `.c-chip-protocol` IDs, `[ok]` glyph, kernel-pulse on `runbook.state='executing'` + `launch_brief.status='live'` + ConversionWorkspace events-stream live dot |
| 0–2% | `error` + `warning` + `info` + `success` | `.c-notice` banners, `.c-badge` row state, glyphs, content-classifier severity coding (block→error; flag→warning; info→info), launch_gate status coding (pending→info; passing→success; blocking→error; waived→warning), launch_brief status coding (planning→info; pending_approval→warning; ready→success; live→success+kernel-pulse; completed→success; rolled_back→error), conversion_page status coding (draft→info; pending_approval→warning; published→success; archived→subtle), runbook state coding (draft→info; armed→warning; executing→info+kernel-pulse; executed→success; rolling_back→warning; rolled_back→error+`[err]`; failed→error+`[err]`) |

| Role | Token | DESIGN.md | Component usage |
|------|-------|-----------|-----------------|
| Component background | `--color-surface` (`#0A0E14`) | `colors.surface` | Every wrapper; never `#000000` |
| Cards / panels | `--color-surface-raised` (`#1A1F2A`) | `colors.surface-raised` | All `.c-card` instances |
| Modal / popover | `--color-surface-overlay` (`#242B38`) | `colors.surface-overlay` | `.c-modal` confirm dialogs (6 modals reuse 215 billing-correction modal recipe) |
| Hairline borders | `--color-border` (`#2D3441`) | `colors.border` | `.c-card` borders (1px), table border-bottom, FormField input border, kanban dividers, RunbookEditor + LaunchReadinessBoard connectors |
| Strong borders | `--color-border-strong` (`#3A4250`) | `colors.border-strong` | Composed via `.c-input` on hover/focus |
| Primary text | `--color-on-surface` (`#E6EDF3`) | `colors.on-surface` | All headings, body copy, table content, FormField input value text |
| Muted secondary | `--color-on-surface-muted` (`#7B8DA6`) | `colors.on-surface-muted` | `.t-lead`, table `<th>`, eyebrows, metadata, timestamps, FormField help |
| Subtle / disabled | `--color-on-surface-subtle` (`#6B7785`) | `colors.on-surface-subtle` | `.c-input::placeholder`, dimmed `archived` / `completed` / `rolled_back` rows |
| Mint signal | `--color-primary` (`#00D9A3`) | `colors.primary` | Primary CTA fills, focus rings, `.c-status-dot--live` kernel-pulse on `runbook.state='executing'` + `launch_brief.status='live'` + ConversionWorkspace events-stream new-event dot, `[ok]` glyph |
| Mint as text (D-09) | `--color-primary-text` | tokens.css | `.c-button--tertiary`, `.c-chip-protocol`, `[ok]`/`[up]` glyphs, "Open page →" / "Open form →" / "Open launch →" / "Open runbook →" / "View evidence →" / "Open approval →" / "View experiment →" / "Re-evaluate gates →" / "Recompute outcome →" / "Open audience →" inline links. Never as fill on surfaces larger than a button or chip. |
| Mint subtle wash | `--color-primary-subtle` | `colors.primary-subtle` | `.c-button--tertiary:hover`, `.c-chip--mint` |
| Error | `--color-error` (`#F85149`) | `colors.error` | `.c-notice c-notice--error` (classifier severity='block', binding-resolver 503, freshness-check 503, ConsentState revoked 422, BotID outage 503, D-65/D-66/D-67 trigger violations, D-70 traffic_split immutability, UpstreamPhaseNotLandedError, runbook critical-step failure), `.c-button--destructive` (Reject, Rollback launch, Waive gate, Archive page), `.c-badge--error` (status='archived' after rejection, status='rolled_back', status='failed', gate status='blocking', classifier severity='block'), `[err]` glyph, `.c-status-dot--error` (runbook execution failed) |
| Warning | `--color-warning` (`#FFB800`) | `colors.warning` | `.c-notice c-notice--warning` (classifier severity='flag', rate-limit 429, gate status='waived', runbook step skipped, experiment status='paused', bounce_spike >2σ, activation_lift declining, readiness check overdue), `.c-badge--warning` (status='pending_approval', gate status='waived', classifier severity='flag', runbook state='rolling_back', experiment status='paused'), `[warn]` glyph, `[down]` declining-trend |
| Success | `--color-success` (`#3FB950`) | `colors.success` | `.c-notice c-notice--success` (page published, form published, launch live, runbook executed, gate status='passing', experiment positive variant uplift, outcome computed at T+30), `.c-badge--success` (status='published'/'approved'/'ready'/'live'/'completed', gate status='passing', runbook state='executed'), `[ok]` glyph |
| Info | `--color-info` (`#58A6FF`) | `colors.info` | `.c-notice c-notice--info` (idempotency replay, experiment.status='draft', placeholder banner, locale fallback, classifier severity='info', ISR cache hit fresh, AgentRun pending), `.c-badge--info` (status='draft'/'planning', gate status='pending', runbook state='draft'/'armed', classifier severity='info', identity_ref='anonymous_identity_id'), `[info]` glyph |

**Accent reserved-for list (3–5% mint slice):**
1. **Single primary CTA per component state** (`.c-button--primary`):
   - PUBLIC blocks: HeroBlock CTA (when `cta_url` present); FormBlock submit-button (one per form); SignupWidgetBlock submit-button; CtaBlock primary CTA (one per block instance — when `type='button'` OR `'banner'`).
   - PUBLIC route loading: none (server-rendered).
   - ConversionWorkspace: `Create page` / `Create form` / `Create CTA` / `Create experiment` (per active tab).
   - PageEditor: `Publish page` (gates approval modal); `Open audience →` mint-text inline; `View evidence →` per-binding row; `Recompute classifier →`.
   - FormEditor: `Publish form` (gates approval modal); `Open thank-you page →` mint-text inline.
   - LaunchCockpit: `Create launch`; `Open launch →` per-card.
   - RunbookEditor: `Arm runbook` (state='draft'); `Execute runbook` (state='armed'); `Rollback launch` (state='executed'; `.c-button--destructive`); `View AgentRun →` per-step.
   - LaunchReadinessBoard: `Mark complete →` per-check (when actor matches owner); `View evidence →` per-check.
   - GatesPanel: `Re-evaluate gates` (`.c-button--secondary`); `Waive gate` (admin-only; `.c-button--destructive`); `View evidence refs →` per-gate.
   - OutcomesDashboard: `Recompute outcome →` per-period (when last_computed_at > 24h); `View narrative →` per-period.
2. Focus rings — globally inherited; never suppressed in module.css.
3. `.c-chip-protocol` ID values — render `var(--color-primary-text)` text on `[ ]`-wrapped ID.
4. `.c-status-dot--live` kernel-pulse on `runbook.state='executing'` AND `launch_brief.status='live'` AND ConversionWorkspace events-stream live dot when ConversionEvent arrives in last 60s — freezes under `prefers-reduced-motion: reduce`.
5. `[ok]` / `[up]` bracketed glyphs render `var(--color-primary-text)`.

---

## Copywriting

| Element | Verbatim copy | Source |
|---------|---------------|--------|
| **Public block CTA labels (default per block_type)** | HeroBlock CTA: `cta_label` field (operator-provided, banned-lexicon zero-matched); CtaBlock: `cta_label` field; FormBlock submit: `submit_label` field (default if blank: "Submit"); SignupWidgetBlock submit: `submit_label` field (default if blank: "Sign up") | D-02 + D-05 |
| **Public form field validation errors** | `[err] {field_label} is required.` / `[err] {field_label} must be a valid {field_type}.` / `[err] {field_label} must be at least {min} characters.` / `[err] {field_label} must be at most {max} characters.` | D-06 |
| **Public form submit success** | `[ok] Submitted. Redirecting to thank-you page…` (1500ms then router push to `thank_you_page_id` slug) | D-05 + D-08 |
| **Public form submit failure (BotID)** | (silent — server returns 403 + audit row per D-25) | D-25 |
| **Public form submit failure (rate-limit)** | `[warn] Too many submissions. Try again in {retry_after_seconds}s.` | D-26 + D-68 |
| **Public form submit failure (honeypot)** | (silent — server returns 200 with no-op + audit row per D-27) | D-27 |
| **Public form submit failure (consent revoked)** | `[err] Your consent has been revoked. Update preferences to continue.` (links to `/preferences`) | D-28 + D-67 |
| **Public form submit failure (idempotency replay)** | (silent — server returns 200 with cached result; audit row only) | Plan 02 truths |
| **Public page render fail-closed (unresolved `{{pricing.*}}`)** | (server returns 503; fallback page from existing app/error) | D-19 |
| **Public page render fail-closed (stale per D-69)** | (server returns 503; same fallback) | D-69 |
| **Operator empty states** | `[info] No pages yet. Create page →` (and analogous for forms/CTAs/experiments/launches/events/surfaces/checks/gates/outcomes); `[info] All gates passing. Ready to publish.` (GatesPanel all-green); `[info] Outcome will be computed at T+7 days post-launch.` (pre-T+7) | per-tab |
| **Operator filter-empty** | `[info] No pages match filter. Clear filters to see all pages.` | per-tab |
| **Operator loading** | (server-rendered; no spinner) | D-32 RSC |
| **Operator error** | `[err] Failed to load {entity}. {error_message}.` | per-surface |
| **PageEditor "Publish page" CTA** | `Publish page` | D-44 |
| **PageEditor classifier finding (block)** | `[err] Page publish blocked — resolve {N} severity=block findings before save.` | D-72 |
| **PageEditor classifier finding (flag)** | `[warn] {N} finding(s) flagged for review.` | D-72 |
| **PageEditor unresolved binding** | `[err] {N} unresolved variable(s): {variable_names}.` | D-19 |
| **PageEditor stale pricing** | `[err] Pricing context superseded. Re-bind to current PricingRecommendation before publish.` | D-69 |
| **PageEditor stale evidence** | `[warn] Evidence pack TTL expired. Re-validate claims before publish.` | D-69 + P209 |
| **PageEditor banned-lexicon detected** | `[err] Page body contains banned lexicon — replace before save.` | 213-04 + 216 |
| **PageEditor approval-required modal title** | `Publish page (approval required)` | D-44 + 215 modal recipe |
| **PageEditor approval-required modal body** | `This page requires approval before publishing. Provide a reason (≥20 characters):` | 215 modal recipe |
| **FormEditor "Publish form" CTA** | `Publish form` | D-44 |
| **FormEditor identity_stitch toggle** | `Stitch anonymous → known identity on submit` (default ON) | D-05 + D-08 |
| **FormEditor thank_you_page label** | `Thank-you page` | D-05 |
| **LaunchCockpit "Create launch" CTA** | `Create launch` | D-12 |
| **LaunchCockpit kanban column headers** | "Planning", "Pending approval", "Ready", "Live", "Completed", "Rolled back" | D-12 |
| **LaunchCockpit per-card status badge labels** | `planning` / `pending_approval` / `ready` / `live` / `completed` / `rolled_back` | D-12 |
| **RunbookEditor "Arm runbook" CTA** | `Arm runbook` (state='draft' → 'armed') | D-37 |
| **RunbookEditor "Execute runbook" CTA** | `Execute runbook` (state='armed' → 'executing'; D-66 trigger gates if blocking gates exist) | D-37 + D-66 |
| **RunbookEditor "Rollback launch" CTA** | `Rollback launch` (state='executed' → 'rolling_back'; destructive) | D-38 |
| **RunbookEditor step-skipped notice** | `[warn] Step "{step.name}" skipped — reversible: false. Operator task created.` | D-36 + Pitfall 6 |
| **RunbookEditor execute-blocked notice** | `[err] Cannot execute — {N} blocking gate(s): {gate_kinds}. Resolve gates first.` | D-66 |
| **GatesPanel gate-kind labels** | "Pricing", "Evidence", "Readiness", "Approval", "Custom (deferred)" | D-16 |
| **GatesPanel gate-status labels** | `pending`, `passing`, `blocking`, `waived` | D-16 |
| **GatesPanel "Waive gate" CTA** | `Waive gate` (admin RBAC; opens approval modal with required `waiver_reason` ≥20 chars per D-18) | D-18 |
| **GatesPanel waiver modal title** | `Waive {gate_kind} gate` | D-18 + 215 modal recipe |
| **GatesPanel waiver modal body** | `Waiving this gate is a signed audit event. Reason (≥20 characters):` | D-18 |
| **GatesPanel "Re-evaluate gates" CTA** | `Re-evaluate gates` (admin OR launch_owner; triggers all 4 evaluators per D-17) | D-17 |
| **OutcomesDashboard period labels** | "T+7 days", "T+14 days", "T+30 days" | D-39 |
| **OutcomesDashboard metric labels** | "Reach", "Signups", "Pipeline created", "Influenced revenue", "Activation lift" | D-40 |
| **OutcomesDashboard activation_lift placeholder** | `{{MARKOS_ACTIVATION_LIFT_PENDING}}` (renders `[info] Activation lift — DEFERRED to P218 PLG metrics.`) | D-40 |
| **OutcomesDashboard upstream-absent error** | `[err] Outcome compute requires P222 + P223. UpstreamPhaseNotLandedError. Contact admin.` | D-71 |
| **ConversionWorkspace events-stream filter chips** | "All", "Page views", "Form submits", "CTA clicks" | D-09 + D-33 |
| **Approval Inbox 6 new entry-type chip labels** | `page_publish_approval`, `form_publish_approval`, `launch_arm_approval`, `launch_execute_approval`, `gate_waiver_approval`, `rollback_approval` | D-46 |
| **Morning Brief launches section heading** | `Launches in flight` | D-47 |
| **Morning Brief readiness countdown** | `{N} launch(es) — {M} blocking gate(s)` (top-3 in flight) | D-47 |
| **Morning Brief recent ConversionEvent volume** | `{N} conversion event(s) in last 24h ({M} signups)` | D-47 |

**Banned strings (auto-FAIL on CI):**
- All 19 banned-lexicon tokens from CLAUDE.md.
- Hard-coded currency values in any block body or operator copy.
- Exclamation points in product surface copy.
- "Click here" / "Read more" / "Learn more" without specific verb-noun (CTA labels MUST be specific; defaults "Submit" / "Sign up" only when no operator-provided label).

---

## Public Block Family Tables

### Block Family A — Static blocks (RSC; 12 components)

12 of the 15 D-02 block types ship as RSC server components (no `'use client'`). All compose `.c-card` (where stand-alone) or vanilla `<section>` (HeroBlock, FullBleedImageBlock).

| Block | AC range | Block schema fields (per D-02 + Plan 01 Zod validators) | Verbatim copy / state matrix highlights |
|-------|----------|--------------------------------------------------------|-----------------------------------------|
| HeroBlock (B1) | HRO-1..HRO-7 (7 ACs) | `eyebrow`, `title`, `subtitle`, `cta_label`, `cta_url`, `image_url?`, `alignment ∈ {left,center}` | Eyebrow uses `.t-label-caps`; H1 inside hero MUST be the page-level `<h1>`; CTA renders `.c-button--primary` (one per hero); banned-lexicon zero-match on title/subtitle/cta_label; Image renders `next/image` `priority` prop; State matrix: `loaded` (default; image rendered with `next/image`) / `image-missing` (renders title-only fallback per Zod) / `cta-missing` (renders text-only hero) |
| ContentBlock (B2) | CNT-1..CNT-5 (5 ACs) | `lead_paragraph?`, `body_html` (DOMPurify SSR sanitized), `alignment` | Body HTML sanitized via DOMPurify SSR pass per Plan 03 Task 1; `{{pricing.*}}` resolved via binding-resolver; renders `.t-lead` for lead_paragraph; State: `loaded` / `unresolved-pricing` (503 fail-closed at renderer level) |
| PricingBlock (B3) | PRI-1..PRI-9 (9 ACs) | `plans[]` (each: `name`, `price_pricing_context_id?`, `price_placeholder?`, `features[]`, `is_featured`), `comparison_table?` (vanilla `<table>` per D-14) | Per-plan price renders via `<Money fromPricingRecommendation={pr_id} />` XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel; `is_featured` plan composes `.c-card` border-strong (NOT `.c-card--feature`); D-19 binding-resolver scans every plan; State: `pricing-resolved` / `pricing-pending-sentinel` / `pricing-unresolved-503` (renderer fail-closed) / `pricing-stale-503` (D-69 fail-closed) |
| TestimonialBlock (B5) | TST-1..TST-5 (5 ACs) | `quote_body`, `author_name`, `author_title?`, `author_company?`, `author_avatar_url?`, `pii_classification ∈ {no_pii, pseudonymous, personal}` | author_name + author_company render via `<PIIRedactedField pii_classification />` when CDP-resolved; if `pii_classification='personal'`, render redacts on PUBLIC unless explicitly authorized (block schema `public_authorized=true`); banned-lexicon zero-match on quote_body |
| FaqBlock (B6) | FAQ-1..FAQ-4 (4 ACs) | `questions[]` (each: `question`, `answer_html`) | Each question renders `<h3>`; answer_html sanitized via DOMPurify SSR; uses `<details>/<summary>` semantic for expand/collapse (NO custom JS — RSC) |
| FooterBlock (B7) | FTR-1..FTR-4 (4 ACs) | `links[]` (each: `label`, `url`), `legal_text?`, `copyright_year?` | Composes vanilla `<footer>`; padding-block `--space-xl`; banned-lexicon zero-match on legal_text |
| ImageBlock (B8) | IMG-1..IMG-4 (4 ACs) | `image_url`, `alt_text`, `caption?`, `width?`, `height?` | Renders `next/image` with `loading='lazy'` (NOT priority; only HeroBlock image is priority); alt_text REQUIRED (Zod refuses block without alt); caption renders `.c-field__help` |
| VideoBlock (B9) | VID-1..VID-5 (5 ACs) | `video_url`, `poster_url?`, `caption?`, `autoplay`, `controls` | Renders `<video>` with `playsinline` + `preload='none'` for mobile data-saver; `autoplay=true` requires `muted` per browser policy (Zod enforces); accessibility caption track strongly recommended (warning if absent in classifier) |
| ComparisonBlock (B10) | CMP-1..CMP-5 (5 ACs) | `headers[]`, `rows[][]`, `caption?` | Vanilla `<table>` per D-14; `<th scope='col'>` for headers + `<th scope='row'>` for first cell of each row; renders within `--w-container` (allowed exception for table content) |
| SocialProofBlock (B11) | SOP-1..SOP-5 (5 ACs) | `logos[]` (each: `customer_name`, `logo_url`, `pii_classification`), `metric?` (e.g., "10000+ teams") | customer_name renders via `<PIIRedactedField />` when CDP-resolved; logo_url uses `next/image`; metric renders `.c-code-inline` with tabular numerals |
| EvidenceBlockComponent (B12) | EVI-1..EVI-7 (7 ACs) | `evidence_pack_id` (FK P209), `display_mode ∈ {compact, detailed}` | Composes `<KbGroundingPanel evidence_refs={pack.evidence_refs} />` from 216 §D-15 (NOT re-implemented); each evidence_ref renders `.c-chip-protocol` `chunk_id` + `<.c-badge--info>` source_type + `relevance_score` with tabular numerals; D-69 freshness re-validation at render time |
| CustomHtmlBlock (B15) | CHT-1..CHT-4 (4 ACs) | `html_body` (admin-approved markup ONLY), `admin_approved_by` (UUID), `admin_approved_at` | DOMPurify SSR sanitization with strict allowlist; `admin_approved_by` MUST be set OR render fails closed with `[err] CustomHtml block not approved.`; banned-lexicon zero-match on html_body |

**Cross-block static rules (apply to all 12):**
- Banned-lexicon zero-match enforced on every operator-authored text field BEFORE save (page-publish handler) AND on every render-time-resolved binding output.
- D-69 render-time freshness re-validation runs on EVERY render (cache hit OR miss) per Plan 03 page-renderer.tsx truths.
- D-72 content-classifier scans block bodies pre-publish for currency_pattern + claim_shape_pattern not bound to evidence_pack_id; flagged → severity='block' for pricing-touching, severity='flag' for claim-shape.

### Block Family B — Interactive blocks (`'use client'` islands; 3 components)

3 of the 15 D-02 block types ship as client components hydrated post-paint.

| Block | AC range | Block schema fields | Interactive contract |
|-------|----------|--------------------|--------------------------|
| CtaBlock (B4) | CTA-1..CTA-7 (7 ACs) | `cta_label`, `cta_url`, `type ∈ {button, banner, sticky_bar, exit_intent, inline, modal}`, `audience_id?`, `pricing_context_id?` | Click handler emits ConversionEvent with `surface_kind='cta'` + `surface_id=cta_id` via `lib/markos/conversion/events/emit.ts` (Plan 02); identity stitch fires per D-08; `type='exit_intent'` uses `mouseleave` listener; `type='sticky_bar'` uses CSS `position: sticky` (NOT JS scroll listener); `type='modal'` opens `.c-modal` with focus-trap; state matrix: `idle` / `clicked-and-stitched` (post-emit) / `consent-blocked` (D-67 trigger violation 422) |
| SignupWidgetBlock (B13) | SWG-1..SWG-7 (7 ACs) | `objective ∈ {trial_signup, content_download, waitlist}`, `email_field_label`, `submit_label`, `consent_capture_block?`, `thank_you_page_id?`, `pricing_context_id?` | Mini-form: 1 email FormField + 1 submit-button; submits to `/api/v1/public/conversion/forms-submit` (Plan 02 endpoint) with implicit `form_id` synthesized per widget instance OR using parent ConversionForm if linked; identity stitch on submit per D-08; ConsentState double-gate per D-28 + D-67; rate-limit per D-26 + D-68; honeypot per D-27; state matrix: `empty` / `validating` / `submitting` / `submitted` (success notice + redirect) / `error-rate-limited` / `error-consent-revoked` / `error-bot-id` (silent) / `error-honeypot` (silent) |
| FormBlock (B14) | FRM-1..FRM-9 (9 ACs) | `form_id` (FK conversion_forms), `inline_render` (vs link to standalone form page) | Delegates rendering to `ConversionFormRenderer` from `lib/markos/conversion/forms/form-renderer.tsx` (Plan 03 Task 2); auto-injects honeypot field via `honeypotFieldNameForForm()` from Plan 02; renders all D-06 field_types via FormField; submits to `/api/v1/public/conversion/forms-submit`; full 6-layer dispatch gate (BotID → rate-limit → honeypot → variables_schema validation → identity stitch → ConsentState double-gate → emit) per Plan 02 submit-handler; state matrix: `empty` / `partially-filled` / `validating` / `submitting` / `submitted` / `error-validation` / `error-rate-limited` / `error-consent-revoked` / `error-bot-id` (silent) / `error-honeypot` (silent) |

**Cross-block interactive rules (apply to all 3):**
- Touch target ≥44px on coarse pointers (already global per 213.2) — strictly enforced for FormField + submit-button + CTA button.
- ConsentState double-gate at submit per D-28 + D-67 BEFORE writing ConversionEvent.
- Idempotency: duplicate submit within 60s returns 200 with cached result per Plan 02 truths.
- BotID + rate-limit + honeypot fail-closed; outage on BotID → 503 (NEVER accept traffic during outage) per Plan 02 truths.
- ConversionEvent.experiment_variant_id captured at emit-time per D-23 (Plan 05 wire site).

---

## Renderers + Form Sub-components

### Renderer R1 — page-renderer (server function)

**File:** `lib/markos/conversion/render/page-renderer.tsx` (Plan 03 Task 1).

**Contract:**
- Composes `content_blocks` array into React tree via `validateBlock` (Plan 01 Zod) → `BlockComponents[block_type]` lookup.
- Calls `applyPageCacheTag(tenant_id, page_id)` per D-30; cache-tag format `tenant:${tenant_id}:page:${page_id}`.
- Calls `assertPricingFresh(pricing_context_id)` + `assertEvidenceFresh(evidence_pack_id)` on EVERY render (cache hit OR miss) per D-69.
- Applies experiment variant `content_overrides` AFTER base block resolution per D-22 (Plan 05 wires `getOrAssignVariant`).
- Returns React tree consumed by `app/(marketing)/conversion-page/[[...slug]]/page.tsx` RSC route.
- On unresolved binding OR stale freshness → throws → route translates to 503 + audit row.

**ACs:** PR1-1..PR1-9 (9 ACs).

### Renderer R2 — form-renderer (server-rendered shell + client island)

**File:** `lib/markos/conversion/forms/form-renderer.tsx` (Plan 03 Task 2).

**Contract:**
- Consumes `ConversionForm` definition; renders `<form>` with action `/api/v1/public/conversion/forms-submit` + method `POST`.
- Auto-injects honeypot field via `honeypotFieldNameForForm(form_id)` (Plan 02 honeypot.ts).
- Renders ordered `fields[]` via FormField + FormFieldGroup composition.
- Renders `consent_capture_block` if `form.consent_capture_block_id IS NOT NULL` per D-28.
- Client-side validation mirrors server-side via shared `variables_schema` per D-07.
- Evidence/pricing bindings resolved at render time per D-19 binding-resolver.
- SSR-safe: ships server-rendered shell + hydrates as client island for input state.

**ACs:** FR1-1..FR1-7 (7 ACs).

### Form sub-component F1 — FormField (client component)

**File:** `components/markos/conversion/forms/FormField.tsx` (Plan 03 Task 2).

**Contract:**
- Accepts `field` prop conforming to D-06 field_types: `email`, `text`, `phone`, `number`, `select`, `multi_select`, `checkbox`, `textarea`, `country`, `jurisdiction`, `custom_typed`.
- Composes `.c-field` + `.c-field__label` + `.c-input` + `.c-field__help` + `.c-field__error`.
- Per-field-type renders correct primitive: `email` / `phone` / `text` / `number` → `.c-input`; `select` / `country` / `jurisdiction` → `<select>` mapped to `.c-input` token; `multi_select` → `<select multiple>`; `checkbox` → `<input type='checkbox'>`; `textarea` → `.c-input` with `<textarea>` semantic.
- Inline validation per D-06 server-side validator mirror; `.c-field__error` renders `[err] {field_label} ...` per copywriting.
- Touch target ≥44px on coarse pointers (already global per 213.2).
- `'use client'` per D-21.

**ACs:** FF1-1..FF1-8 (8 ACs).

### Form sub-component F2 — FormFieldGroup (client component)

**File:** `components/markos/conversion/forms/FormFieldGroup.tsx` (Plan 03 Task 2).

**Contract:**
- Wraps grouped fields in vanilla `<fieldset>` + `<legend>`.
- Composes child FormField components without bespoke CSS.
- Used for grouped fields like address (street + city + state + zip) or consent block (multiple checkboxes).
- `'use client'` per D-21.

**ACs:** FFG1-1..FFG1-4 (4 ACs).

---

## Public Dynamic Route — `app/(marketing)/conversion-page/[[...slug]]/`

**Files:**
- `app/(marketing)/conversion-page/[[...slug]]/page.tsx` (NEW; **server component / RSC**)
- `app/(marketing)/conversion-page/[[...slug]]/loading.tsx` (NEW; minimal skeleton)
- `app/sitemap.ts` (NEW; dynamic from published ConversionPage rows)

**Contract:**
- Catch-all route resolves slug → ConversionPage row via tenant resolution from Host header (P201 BYOD pattern); slug NOT FOUND → 404 (Next.js notFound()).
- ConversionPage.status MUST equal 'published' for public access; 'draft' / 'pending_approval' / 'archived' → 404 (NEVER expose preview to public).
- Calls `renderConversionPage(page, ctx)` from page-renderer.
- ISR cached via `cacheTag(tenant:${tenant_id}:page:${page_id})` per D-30; `updateTag` invalidates on publish/archive (Plan 03 publish/archive handlers call `invalidatePageCache` synchronously before returning 200).
- `generateMetadata` exports SEO from `page.seo_meta` per D-31.
- D-69 render-time freshness re-validation runs on EVERY render (renderer call); stale → 503 + audit.
- `loading.tsx` ships minimal skeleton (no spinner; bracketed `[#]` glyph placeholder per CLAUDE.md no-emoji posture).
- `app/sitemap.ts` exports dynamic sitemap.xml from published pages; regenerated on publish per D-31 (cron OR Next.js metadata config).
- Existing legacy marketing routes (`/signup`, `/integrations/claude`, `/docs`) remain functional unchanged — additive sibling per D-64.

**ACs:** PCR-1..PCR-12 (12 ACs).

---

## Operator Surfaces (Plan 07)

### Surface OPE1 — ConversionWorkspace (`app/(markos)/conversion/page.tsx`)

**Type:** Server component shell (server fetch via `requireHostedSupabaseAuth` + tenant-scoped supabase client) passing data to client components.

**Layout:** Tabbed interface with 5 tabs: Pages (kanban-by-status — 4 columns: draft/pending_approval/published/archived) + Forms list + CTAs list + Experiments list + ConversionEvents stream (live feed; `<.c-status-dot--live>` mint pulse on new event last 60s). Cross-link CTA "Open DeliverabilityWorkspace →" links to P223 surface.

**Verbatim labels:**
- Tab labels: `Pages`, `Forms`, `CTAs`, `Experiments`, `Events`.
- Pages kanban headers: `Draft`, `Pending approval`, `Published`, `Archived`.
- Per-card eyebrow: `Page` / `Form` / `CTA` / `Experiment`.
- Events filter chips: `All`, `Page views`, `Form submits`, `CTA clicks`.

**State matrix:** `loading` (server-rendered) / `empty-tab` / `populated` / `filter-empty` / `events-streaming` (mint kernel-pulse on live events) / `error`.

**Mobile priority:** **critical** (events stream — operator field-of-view).

**ACs:** CW-1..CW-12 (12 ACs).

### Surface OPE2 — PageEditor (`app/(markos)/conversion/PageEditor.tsx`)

**Type:** Client component (`'use client'`).

**Layout:** Block list (left column; ordered list of content_blocks) + per-block JSON editor (center; `.c-code-block` JSON syntax) + preview pane (right; renders via Plan 03 page-renderer SSR output) + Pricing/Evidence binding inspector panel + content-classifier findings panel (composes `<ClassifierChipRow />` from 216 §D-15) + Publish CTA gating approval modal.

**Verbatim labels:** `Publish page`, `Save draft`, `Block list`, `Preview`, `Bindings`, `Evidence binding inspector`, `Pricing binding inspector`, `Classifier findings`, `Add block`, `Move up`, `Move down`, `Delete block`, `Open audience →`, `View evidence →`, `Recompute classifier →`.

**State matrix:** `loading` / `editing` / `preview-rendered` / `unresolved-binding` (render-time scan flagged) / `stale-pricing` / `stale-evidence` / `classifier-block` / `classifier-flag-only` / `classifier-clean` / `banned-lexicon-detected` / `publish-pending-approval` / `error`.

**Mobile priority:** secondary.

**ACs:** PE-1..PE-18 (18 ACs).

### Surface OPE3 — FormEditor (`app/(markos)/conversion/FormEditor.tsx`)

**Type:** Client component.

**Layout:** Field list (drag-reorder DEFERRED per D-04 — JSON-mode reorder via Move up/Move down only) + variables_schema editor + identity_stitch toggle + thank_you_page link + preview pane (renders via Plan 03 form-renderer) + content-classifier findings + Publish CTA.

**Verbatim labels:** `Publish form`, `Save draft`, `Field list`, `Add field`, `Field type`, `Variables schema`, `Stitch anonymous → known identity on submit`, `Thank-you page`, `Preview`, `Classifier findings`.

**State matrix:** `loading` / `editing` / `preview-rendered` / `field-validation-error` / `classifier-block` / `classifier-flag-only` / `classifier-clean` / `banned-lexicon-detected` / `publish-pending-approval` / `error`.

**Mobile priority:** secondary.

**ACs:** FE-1..FE-12 (12 ACs).

### Surface OPL1 — LaunchCockpit (`app/(markos)/launches/page.tsx`)

**Type:** Server component shell.

**Layout:** Briefs kanban (6 columns: planning/pending_approval/ready/live/completed/rolled_back) + per-launch Surface board (vanilla `<table>` per D-14; columns: surface_type/status/published_at/blocking_reasons[]) + Gates panel cross-link + Runbook viewer cross-link + Outcomes dashboard cross-link.

**Verbatim labels:** `Create launch`, `Planning`, `Pending approval`, `Ready`, `Live`, `Completed`, `Rolled back`. Per-card eyebrow: `Launch`. Per-surface row: 9 surface_type literals verbatim per D-14.

**State matrix:** `loading` / `empty` / `populated` / `filter-empty` / `live-pulse` (kernel-pulse on `status='live'` cards) / `error`.

**Mobile priority:** secondary.

**ACs:** LC-1..LC-14 (14 ACs).

### Surface OPL2 — RunbookEditor (`app/(markos)/launches/RunbookEditor.tsx`)

**Type:** Client component.

**Layout:** Steps[] vanilla `<table>` (columns: step_id/name/kind/depends_on/expected_duration_seconds/idempotency_key) + rollback_steps[] vanilla `<table>` (reverse-order; columns: same + reversible flag) + dependency graph (composed from depends_on; SVG with token colors) + AgentRun status panel (P207 RunStatusBadge) + Arm/Execute/Rollback CTAs.

**Verbatim labels:** `Arm runbook`, `Execute runbook`, `Rollback launch` (destructive), `Steps`, `Rollback steps`, `Dependency graph`, `AgentRun status`, `View AgentRun →`. Step kind labels (verbatim per D-35): `publish_surface`, `dispatch_email_campaign`, `send_messaging`, `post_social`, `notify_team`, `custom`. Reversible flag verbatim: `reversible: true` / `reversible: false`.

**State matrix:** `loading` / `state-draft` / `state-armed` / `state-executing` (kernel-pulse) / `state-executed` / `state-rolling_back` / `state-rolled_back` / `state-failed` / `execute-blocked-by-gates` (D-66 trigger violation; renders error notice with `gate_kinds` listed) / `step-skipped` (operator task created for reversible:false) / `error`.

**Mobile priority:** secondary.

**ACs:** RE-1..RE-16 (16 ACs).

### Surface OPL3 — LaunchReadinessBoard (`app/(markos)/launches/LaunchReadinessBoard.tsx`)

**Type:** Client component.

**Layout:** Per-check vanilla `<table>` (columns: check_kind/owner/due_at/status/evidence_ref) + dependency graph (cross-launch_brief.internal_readiness_checks[]) + countdown to launch_date (computed; `--space-md` block-level prominence).

**Verbatim labels:** `Readiness checks`, `Dependency graph`, `Countdown`. Check kind labels verbatim per D-13: `legal_approved`, `support_ready`, `sales_trained`, `docs_published`, `partner_briefed`, `custom`. Status labels: `pending`, `in_progress`, `completed`, `overdue`, `blocked`.

**State matrix:** `loading` / `populated` / `all-completed` (success notice; ready to advance brief.status) / `overdue-checks` (warning notice with `[warn]` per overdue check) / `error`.

**Mobile priority:** secondary.

**ACs:** LRB-1..LRB-9 (9 ACs).

### Surface OPL4 — GatesPanel (`app/(markos)/launches/GatesPanel.tsx`)

**Type:** Client component.

**Layout:** 4 gate-kind sub-panels (Pricing / Evidence / Readiness / Approval); per-gate row (gate_kind, status badge, blocking_reasons[], evidence_refs[], evaluated_at, waived_by, waived_at, waiver_reason) + Re-evaluate CTA + Waive CTA (admin-only). Composes `<KbGroundingPanel />` from 216 §D-15 for evidence-gate row evidence_refs[].

**Verbatim labels:** `Pricing`, `Evidence`, `Readiness`, `Approval`, `Custom (deferred)`, `Re-evaluate gates`, `Waive gate` (destructive). Status labels: `pending`, `passing`, `blocking`, `waived`. Waiver modal: `Waive {gate_kind} gate` + `Waiving this gate is a signed audit event. Reason (≥20 characters):`.

**State matrix:** `loading` / `all-passing` (success notice + ready-to-publish indicator) / `gates-blocking` (per-blocking-gate error notice with blocking_reasons listed) / `gates-waived-warning` / `evaluating` / `error`.

**Mobile priority:** secondary.

**ACs:** GP-1..GP-13 (13 ACs).

### Surface OPL5 — OutcomesDashboard (`app/(markos)/launches/OutcomesDashboard.tsx`)

**Type:** Client component.

**Layout:** Vanilla `<table>` (rows: T+7/T+14/T+30 periods; columns: reach/signups/pipeline_created/influenced_revenue/activation_lift/computed_at/narrative_summary). Period-over-period delta with `[up]`/`[down]`/`[flat]` glyphs. Recompute CTA per period (mint-text inline).

**Verbatim labels:** `T+7 days`, `T+14 days`, `T+30 days`, `Reach`, `Signups`, `Pipeline created`, `Influenced revenue`, `Activation lift`, `Recompute outcome →`, `View narrative →`. Activation_lift placeholder: `{{MARKOS_ACTIVATION_LIFT_PENDING}}` (renders `[info] Activation lift — DEFERRED to P218 PLG metrics.`).

**State matrix:** `loading` / `pre-T+7` (info notice — outcome will be computed at T+7) / `T+7-computed` / `T+14-computed` / `T+30-computed` (full table) / `upstream-absent` (D-71 error notice — P222/P223 missing) / `error`.

**Mobile priority:** secondary.

**ACs:** OD-1..OD-11 (11 ACs).

### Approval Inbox extension AIE1 — `lib/markos/operating/approvals/entry-types.ts` PATCH

**Patch contract:** Append 6 new entry types to existing module.exports (NEVER replace existing): `page_publish_approval`, `form_publish_approval`, `launch_arm_approval`, `launch_execute_approval`, `gate_waiver_approval`, `rollback_approval`. Each entry-type renderer composes existing P208 inbox row pattern; deep-link to corresponding workspace surface. Verify via grep before+after.

**ACs:** AIE-1..AIE-7 (7 ACs).

### Morning Brief extension MBL1 — `lib/markos/operating/morning-brief/launches-section.ts`

**Section contract:** Section heading `Launches in flight`. Renders top-3 in-flight launches (status='live' OR 'ready') sorted by launch_date + readiness countdown + blocking gates per launch + recent ConversionEvent volume (last 24h count + signups count).

**ACs:** MBL-1..MBL-6 (6 ACs).

---

## Cross-Surface Acceptance Criteria

### X-cutting (XC-N)

- AC XC-1: All 15 NEW block components + 2 renderers + 2 form sub-components + 9 operator surfaces register Storybook CSF3 named-state stories under `Conversion/*` OR `Launches/*` paths; 224-07 Plan ships `chromatic.config.json` covering ≥1 PublicPageRender story (≥30 snapshots — 15 blocks × ≥2 named states) + 4 operator surface stories (ConversionWorkspace, PageEditor, LaunchCockpit, LaunchReadinessBoard) per Surface Inventory `Storybook` column
- AC XC-2: All 15 blocks + 2 renderers + 2 form sub + 9 operator surfaces honor D-08 token-only (zero hex literals in module.css files)
- AC XC-3: All blocks + operator surfaces honor D-09 mint-as-text + D-09b `.c-notice` mandatory + D-13 `.c-card--feature` reserved + D-14 no `.c-table`
- AC XC-4: 13 STATIC blocks + page-renderer ship as RSC (no `'use client'`); 3 INTERACTIVE blocks + 2 form sub-components + 9 operator surfaces ship as `'use client'` per existing convention; consuming pages remain server components per D-21
- AC XC-5: All blocks + operator surfaces consume `<PIIRedactedField />` (216 §D-15) for any CDP-resolved IdentityProfile field; PUBLIC pages NEVER expose un-redacted PII unless block schema authorizes via `pii_classification: 'no_pii'`
- AC XC-6: All operator surfaces register in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: conversion_*` OR `launches_*` and correct `mobile_priority` literal (ConversionWorkspace events stream + 3 INTERACTIVE PUBLIC blocks + 2 form sub-components = `critical`; all other surfaces = `secondary`)
- AC XC-7: Banned-lexicon zero-match enforced on **block bodies (15 block types) + ConversionPage `seo_meta.title` + `seo_meta.description` + ConversionForm field labels/help/error + LaunchBrief `positioning_summary` + LaunchRunbook `step.name` + LaunchOutcome `narrative_summary` + content-classifier flagged copy + waiver_reason + reason-capture modal copy + CTA labels + thank-you-page slugs** BEFORE every approval-package dispatch path (page_publish, form_publish, launch_arm, launch_execute, gate_waiver, rollback)
- AC XC-8: All approval-package call paths use `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-58 (NEVER `createApprovalPackage`); grep `createApprovalPackage` across `components/markos/conversion/` + `app/(markos)/{conversion,launches}/` + `lib/markos/{conversion,launches}/` + `api/v1/{conversion,launches}/` returns 0 matches
- AC XC-9: All 4 cron handlers (Plan 06) ship under `api/crons/launches-*.js` (NOT `app/api/cron/launches-*/route.ts`) per D-42; auth via `x-markos-cron-secret` header; 4 vercel.json cron entries shipped
- AC XC-10: All 14 read-write API handlers ship under `api/v1/{conversion,launches}/*.js` + 1 public unauthenticated POST under `api/v1/public/conversion/forms-submit.js` (NOT `app/api/v1/.../route.ts`) per D-42; auth via `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` per D-42 (public form submit uses Host-header tenant resolution per D-52)
- AC XC-11: Test runner is `npm test` (Node `--test`) per D-61; all `*.test.js` files (NOT `.test.ts`); imports `node:test` + `node:assert/strict`; NO NEW vitest, NO NEW playwright runtime install in P224
- AC XC-12: Plan 07 closeout meta-test asserts `package.json` did not gain `vitest` or NEW `@playwright/test` keys during P224 execution (existing axe-playwright devDep IS preserved per 223 D-46 carry)
- AC XC-13: Plan 01 Task 0.5 architecture-lock detector test scans every `.planning/phases/224-*-PLAN.md` for forbidden tokens (`createApprovalPackage`, `requireSupabaseAuth`, `requireTenantContext`, `serviceRoleClient` outside auth boundary, `lookupPlugin`, `public/openapi.json`, `app/(public)`, `route.ts` outside doctrinal NO-X comments, `vitest run`, `from 'vitest'`, `.test.ts`, `"stub if missing"`, `"if exists"`, `"bridge stub"`)
- AC XC-14: Hard preflight upstream gate via `assertUpstreamReady(['P205', 'P207', 'P208', 'P209', 'P221', 'P222', 'P223'])` per D-60; NO soft-skip, NO "stub if missing", NO "bridge stub" — UpstreamPhaseNotLandedError thrown if any required phase absent
- AC XC-15: All 13 migrations slot-pre-allocated per D-56 (P224 owns 121..133; 13 slots; no gaps); closeout `migration-slot-collision.test.js` (Plan 07) asserts no overlap
- AC XC-16: All 15 F-IDs slot-pre-allocated per D-55 (P224 owns F-132..F-146; 15 slots; no gaps); closeout `f-id-collision.test.js` (Plan 07) asserts no overlap; OpenAPI parity test asserts every F-ID maps to actual path
- AC XC-17: All 13 new tables (conversion_pages, conversion_forms, conversion_ctas, conversion_events, conversion_experiments, experiment_variants, experiment_assignments, launch_briefs, launch_surfaces, launch_gates, launch_runbooks, launch_outcomes, launch_readiness_checks) have RLS verified cross-tenant denied via Plan 07 `test/conversion/rls-suite.test.js`
- AC XC-18: D-65 readiness-required BEFORE UPDATE trigger on `launch_surfaces` enforces `status='published'` block when any `launch_gates` row for the same `launch_id` has `status='blocking'`; service-role + alternative-API write paths cannot bypass; `test/launches/triggers/readiness-required.test.js` asserts trigger fires
- AC XC-19: D-66 runbook-execute-required BEFORE UPDATE trigger on `launch_runbooks.state` enforces `'executing'` block when blocking gates exist; service-role write paths cannot bypass; `test/launches/triggers/runbook-execute-required.test.js` asserts trigger fires
- AC XC-20: D-67 ConsentState-required BEFORE INSERT trigger on `conversion_events` enforces row rejection when `consent_capture_block_id IS NOT NULL` AND no matching `consent_state` row in same transaction; closes the soft-fail-closed → DB-fail-closed gap; `test/conversion/triggers/consent-state-required.test.js` asserts trigger fires
- AC XC-21: D-68 purpose-built rate-limit primitive at `lib/markos/conversion/forms/rate-limit-public-form.ts` backed by `@upstash/ratelimit` (already in package.json); 3 independent buckets (per-form, per-IP, per-email) per submit; defaults 10/IP/60s + 3/email/60s + 100/form/60s; per-form override via ConversionForm metadata
- AC XC-22: D-69 render-time freshness re-validation runs on EVERY render (cache hit OR miss); `assertPricingFresh(pricing_context_id)` + `assertEvidenceFresh(evidence_pack_id)` from `lib/markos/conversion/render/freshness-check.ts`; stale → 503 + audit row with `event_type='conversion_page_stale_render'`
- AC XC-23: D-70 SHA-256-truncated sticky-hash via Node stdlib `crypto.createHash('sha256').update(...).digest('hex').substring(0, 16)`; NO xxhash-wasm dependency added to package.json
- AC XC-24: D-71 LaunchOutcome compute fail-closed on missing P222/P223 — `computeLaunchOutcome` calls `assertUpstreamReady(['P222','P223'])` BEFORE reading `crm_activity` or `dispatch_events`; throws UpstreamPhaseNotLandedError; NO silent empty-row write
- AC XC-25: D-72 P224-owned greenfield content classifier at `lib/markos/conversion/blocks/content-classifier.ts`; currency_pattern + claim_shape_pattern → severity='block'/'flag'/'info'; NOT extended from P223 (P223 not landed)
- AC XC-26: Pitfall 5 traffic_split immutability post-activation — Migration 131 ships BEFORE-UPDATE trigger blocking traffic_split mutation when experiment.status='active'; operator must transition to paused/completed before reweighting
- AC XC-27: Pitfall 6 reverse-runbook rollback — rollback_steps[] executed in REVERSE order; reversible:true reversed; reversible:false → operator task + CONTINUE (never abort entire rollback)
- AC XC-28: ISR cache invalidation synchronous in publish/archive handlers — `invalidatePageCache(tenant_id, page_id)` called BEFORE returning 200 (Pitfall 3 — Plan 03 publish/archive + Plan 06 rollback for `surface_target_kind='conversion_page'` archive step)
- AC XC-29: Plan 07 ships Chromatic snapshot gate covering ≥34 snapshots (15 blocks × ≥2 states + 4 operator surfaces × ≥4 states); first batch requires operator review per Plan 07 `autonomous: false` + RL1
- AC XC-30: Plan 07 ships ZERO new playwright runtime; existing `axe-playwright` devDep MAY be reused for ONE optional operator-journey E2E (page-publish-approve-render-submit-event-emit) per 223 D-46 carry; meta-test asserts package.json unchanged
- AC XC-31: Plan 07 closeout regression — P100-P105 + P102 Kanban default + P103 urgency bias + P105 record brief + P101 HIGH_SIGNAL + P201 marketing routes (`/signup`, `/integrations/claude`, `/docs`) + P221 consent + P222 customer360/NBA/lifecycle/committee + P223 channels all green
- AC XC-32: Plan 07 `autonomous: false` per RL1 — operator review checkpoint:human-action for first Chromatic baseline batch (15 blocks × ≥2 states + 4 operator surfaces) AND visual verification of public ConversionPage render at staging slug

---

## Approval Inbox Handoff Chain Extension (post-224 = 42 chips)

```
Pre-224 chain (post-223 = 36 chips):
1.  approval (P207)
2.  recovery (P207)
3.  follow_up (P207)
4.  manual_input (P207)
5.  billing_charge_approval (P214)
6.  billing_correction_approval (P215)
7.  support_response_approval (P216)
8.  save_offer_approval (P216)
9-20. P218..P220 12 chips
21. partner_payout_export_approval (P220 26th)
22-26. (P220 placeholders for ecosystem motions)
27. consent_drift_resolution (P221)
28. audience_activation_approval (P221)
29. dsr_export_approval (P221)
30. crm360_nba_execute_approval (P222)
31. crm360_lifecycle_transition_approval (P222)
32. crm360_tombstone_cascade_approval (P222)
33. channel_dispatch_approval (P223)
34. channel_template_publish_approval (P223)
35. channel_suppression_bulk_approval (P223)
36. channel_program_pause_approval (P223)

POST-224 NEW (start-of-v4.2.0-commercial-engines-lane CONVERSION-LAUNCH state):
37. page_publish_approval                ← P224-03 PageEditor "Publish page" path when content-classifier finding severity='block' on pricing_binding/factual_claim (D-19/D-72) OR Pricing Engine pricing_context_id NOT approved at publish time (D-19) OR banned-lexicon detected (213-04 + 216 carry); calls buildApprovalPackage per D-58; approval entry-type renders in ApprovalInboxConversionEntries via Plan 07 entry-types.ts PATCH
38. form_publish_approval                ← P224-07 FormEditor "Publish form" path when classifier flags OR consent_capture_block_id required AND not configured OR variables_schema missing required field; calls buildApprovalPackage per D-58
39. launch_arm_approval                  ← P224-04 LaunchCockpit "Arm runbook" / brief.status='ready' transition path when launch_brief.evidence_pack_id has stale claims OR pricing_context_id pending OR readiness gate evaluator returned 'blocking' OR approval gate returned 'pending' (D-16 evaluator output); calls buildApprovalPackage per D-58
40. launch_execute_approval              ← P224-06 RunbookEditor "Execute runbook" path; D-66 trigger fires if blocking_gates exist (BEFORE UPDATE on launch_runbooks.state='executing'); approval-aware mutation per D-44; calls buildApprovalPackage per D-58
41. gate_waiver_approval                 ← P224-04 GatesPanel "Waive gate" path; admin-only RBAC per D-18; waiver_reason ≥20 chars required; signed audit event written to markos_audit_log; calls buildApprovalPackage per D-58
42. rollback_approval                    ← P224-06 RunbookEditor "Rollback launch" path; reversible:true steps reversed; reversible:false → operator task + CONTINUE per Pitfall 6; ISR cache invalidation on conversion_page archive step per Pitfall 3; calls buildApprovalPackage per D-58
```

Row rendering of these 6 new chips ships in 224-07 via `lib/markos/operating/approvals/entry-types.ts` PATCH (NEVER replace existing entry types). Each chip renders the per-row classifier (page_publish_approval: page_id + page_type + classifier_findings_count + pricing_context_id badge + evidence_pack_id badge + `<PIIRedactedField />` per affected sample render; form_publish_approval: form_id + objective + classifier_findings_count + consent_capture_block_id badge + variables_schema_completeness badge; launch_arm_approval: launch_id + launch_type + brief.status + pending_gate_kinds[] + readiness_check_completion_count; launch_execute_approval: launch_id + runbook_id + step_count + blocking_gate_kinds[] + AgentRun preview; gate_waiver_approval: gate_id + gate_kind + blocking_reasons[] + evidence_refs[] + waiver_reason; rollback_approval: launch_id + runbook_id + reversible_step_count + non_reversible_step_count + ISR-cache-tag-list-to-invalidate). DISSOLVES the `future_phase_222_admin_ui` placeholder partially — for Conversion + Launch admin sub-trees only. CRM admin sub-tree (`crm360_*` chips 30/31/32) remain DEFERRED to future P208 admin extension OR P226+ phase.

---

## Future-Surface UI Binding Contracts

### Future-Surface 1 — `future_phase_225_attribution_journey_analytics`

**Anticipated path:** `app/(markos)/analytics/{attribution,journey,narrative,anomaly}/page.tsx` future surfaces.

**Contract:** When P225 attribution surfaces ship, they consume 224 substrate (`conversion_events` + `experiment_assignments` + `launch_outcomes` for attribution + journey + narrative semantic layer; `conversion_events.experiment_variant_id` per D-23 sticky bucket capture; `conversion_events.launch_id` per D-09 launch attribution thread; `launch_outcomes.influenced_revenue` first-touch v1 → P225 multi-touch refinement; `launch_outcomes.activation_lift` deferred to P218 PLG metrics). 224 D-24 explicitly DEFERS decision rules + winner detection + ICE backlog to P225. Future surfaces render `<PlaceholderBanner variant="future_phase_225_attribution_journey_analytics">` until that phase ships. **D-57 architecture-lock holds** — legacy `api/*.js` routes; `buildApprovalPackage` helper canon; test runner `npm test`; OpenAPI at `contracts/openapi.json`; MCP registry `lib/markos/mcp/tools/index.cjs`; cron at `api/crons/*.js`.

### Future-Surface 2 — `future_phase_224_visual_page_builder`

**Anticipated phase:** P226+ visual page builder (Figma-like drag-and-drop block editor).

**Contract:** v1 ships JSON-mode TemplateEditor pattern (mirrors P223 D-25); v2 visual builder DEFERRED per D-04. Future surfaces render `<PlaceholderBanner variant="future_phase_224_visual_page_builder">` in PageEditor "Drag-and-drop layout" CTA position until that phase ships.

### Future-Surface 3 — `future_phase_226_sales_enablement_launch_surface`

**Anticipated consumer:** P226 sales enablement consumer of LaunchSurface(surface_target_kind='sales_enablement').

**Contract:** P226 ships battlecards + proof packs + proposals; LaunchSurface registers polymorphic kind in 224 per D-14 but P224 ships ZERO content — only registry slot. P226 fills the slot by writing `surface_target_id` UUID linking to P226 sales-enablement record. Future surfaces render `<PlaceholderBanner variant="future_phase_226_sales_enablement_launch_surface">` in LaunchCockpit Surface board "sales_enablement" surface_type column until that phase ships.

### Future-Surface 4 — `future_phase_227_partner_pack_launch_surface`

**Anticipated consumer:** P227 ecosystem/partner consumer of LaunchSurface(surface_target_kind='partner_pack').

**Contract:** P227 ships ecosystem + partner + affiliate + community + developer-growth content; LaunchSurface registers polymorphic kind in 224 per D-14 but P224 ships ZERO content — only registry slot. Future surfaces render `<PlaceholderBanner variant="future_phase_227_partner_pack_launch_surface">` in LaunchCockpit Surface board "partner_pack" surface_type column until that phase ships.

### Future-Surface 5 — `future_phase_224_chromatic_baselines`

**Anticipated path:** `chromatic.config.json` + 1 PublicPageRender story (`*.stories.tsx`) covering 15 block × ≥2 named states + 4 operator surface stories.

**Contract:** Plan 07 ships the gate; future approval needed if visual diffs accepted on subsequent baselines without operator review. Downstream phases (P225+) MUST NOT add `components/markos/conversion/*` OR new sub-routes under `app/(markos)/conversion` + `app/(markos)/launches` without registering corresponding Storybook stories + Chromatic snapshots. Per Plan 07 RL1 `autonomous: false`; first batch requires operator review.

### Future-Surface 6 — `future_phase_224_route_group_migration`

**Anticipated phase:** P229+ infrastructure phase migrating `(marketing)/` routes to dedicated `(public)/` group.

**Contract:** Public ConversionPage route lives at `app/(marketing)/conversion-page/[[...slug]]/page.tsx` per D-64 (sibling to existing `signup` / `integrations` / `docs`). Future migration phase will move `conversion-page/` to `(public)/[[...slug]]/page.tsx` AND migrate existing marketing routes simultaneously (breaking refactor of user-visible URLs). Future surfaces render `<PlaceholderBanner variant="future_phase_224_route_group_migration">` until that phase ships.

### Future-Surface 7 — `future_phase_224_legacy_tracking_cutover`

**Anticipated phase:** Once all consumers migrate via D-11 ingest retrofit, legacy `api/tracking/ingest.js` cutover to derived-shim-only; legacy `event_family` taxonomy alias mapping demoted to thin wrapper around `surface_id + surface_kind` envelope.

**Contract:** 224 SHIM WINDOW preserves dual-write per D-11 (existing tracked events without `surface_id` continue to write crm_activity-only; new events with `surface_id + surface_kind` ALSO write conversion_events + cdp_events via fan-out). Future cutover phase will drop the dual-write path. Future surfaces render `<PlaceholderBanner variant="future_phase_224_legacy_tracking_cutover">` until that phase ships.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable (no `components.json`) |
| Third-party registries | none | not applicable |

Phase 224 introduces **zero third-party blocks**. All UI primitives compose from `styles/components.css` v1.1.0 (project-owned). The 6 D-15 extracted components (HealthScoreBadge, RiskBandBadge, KbGroundingPanel, RetentionClassChip, PIIRedactedField, ClassifierChipRow) are project-owned (first shipped in 217-06; reused in 222 + 223 + 224). `<SaveOfferPricingBlock />` is NOT consumed in 224 (deferred to P226+).

**Vetting gate:** Not applicable — no third-party registry surfaces ship in 224.

---

## D-15 Extracted Component Reuse Manifest (load-bearing)

The following 7 components are FIRST CONSUMED IN PRODUCTION by 217-06, REUSED in 222 + 223, and REUSED in 224 (NOT re-implemented):

| Component | Origin | 224 consumers |
|-----------|--------|---------------|
| `<HealthScoreBadge />` | 216 §D-15; 217-06 | NOT consumed in 224 (deferred to operator-side health-aware NBA-driven CTAs in future phases) |
| `<RiskBandBadge />` | 216 §D-15; 217-06 | NOT consumed in 224 (deferred to P225 attribution risk-band) |
| `<KbGroundingPanel />` | 216 §D-15; 217-06 | EvidenceBlockComponent (block evidence_pack_id rendering with top-3 sources + `chunk_id` chips + `source_type` badge + `relevance_score`); GatesPanel evidence-gate row evidence_refs[] rendering; PageEditor "Evidence binding inspector" panel |
| `<RetentionClassChip />` | 216 §D-15; 217-06 | NOT consumed in 224 (deferred to P225 retention analytics) |
| `<PIIRedactedField />` | 216 §D-15; 217-06 | TestimonialBlock author_name + author_company; SocialProofBlock customer_name; EvidenceBlockComponent claim_author; FormBlock confirmation thank-you-page recipient name; PageEditor + FormEditor preview pane (sample recipient render); ConversionWorkspace events stream identity_ref column when `profile_id` resolved |
| `<ClassifierChipRow />` | 216 §D-15; 217-06 | PageEditor "Content classifier findings" overlay (per D-72 P224-owned greenfield content-classifier — currency_pattern + claim_shape_pattern → severity='block'/'flag'/'info'); FormEditor "Content classifier findings" overlay |
| `<SaveOfferPricingBlock />` | 216 §D-15; 217-06 | NOT consumed in 224 (deferred to P226 sales enablement save-offer flows) |

Storybook stories for these components remain registered under their original 217-06 `Saas/*` path; 224 stories register UNDER `Conversion/*` OR `Launches/*` paths and IMPORT the extracted components.

---

## Operator-Journey E2E (Plan 07 — D-61 axe-playwright REUSE OR DEFERRED)

Per D-61 + 223 D-46 carry: the EXISTING `axe-playwright` devDep MAY be reused for ONE optional operator-journey E2E if Plan 07 needs it; OTHERWISE the Chromatic snapshot gate + manual operator-journey checklist fully replace any new playwright runtime. Plan 07 closeout meta-test asserts `package.json` did not gain `vitest` or NEW `@playwright/test` keys during P224 execution.

### Optional Journey 1 — Page publish → render → submit → event-emit → outcome (axe-playwright if scoped)

1. **Create page** (ConversionWorkspace → Pages tab → "Create page" CTA)
   - Verify form renders 10 page_type chips (verbatim per D-01)
   - Verify content_blocks JSON editor renders all 15 block_type validators
   - Submit page with content_blocks containing PricingBlock + FormBlock
   - Verify status='draft'
2. **Edit page** (PageEditor)
   - Verify Pricing/Evidence binding inspector renders
   - Verify content-classifier scans block bodies for currency_pattern + claim_shape (D-72)
   - Verify banned-lexicon zero-match BEFORE save
   - Verify approval-package created via `buildApprovalPackage(kind='page_publish_approval')` per D-58 when classifier finds severity='block' on pricing_binding
3. **Approve page** (Approval Inbox → ApprovalInboxConversionEntries renderer → "Approve")
   - Verify modal opens (215 billing-correction modal recipe)
   - Verify reason capture (≥20 chars) validation
   - Submit reason → verify status='published' + invalidatePageCache fired synchronously (D-30)
4. **Render public page** (visit `app/(marketing)/conversion-page/{slug}`)
   - Verify all 15 block components render correctly
   - Verify ISR cacheTag set (`tenant:${tenant_id}:page:${page_id}`)
   - Verify D-69 freshness re-validation runs (mock stale pricing → 503)
   - Verify D-19 binding-resolver substitutes `{{pricing.*}}` (mock unresolved → 503)
5. **Submit form** (FormBlock public render → fill fields → submit)
   - Verify BotID gate runs (mock allow → continue; mock 5xx → 503)
   - Verify rate-limit gate runs (D-26 + D-68 — 3 buckets per-form/per-IP/per-email)
   - Verify honeypot field auto-injected with HMAC-derived name (D-27)
   - Verify variables_schema validation runs server-side (D-06)
   - Verify identity stitch fires via `api/tracking/identify.js` BEFORE emit (D-08)
   - Verify ConsentState double-gate fires per D-28 + D-67 BEFORE writing conversion_events
   - Verify emit() writes 7 sinks transactionally (D-33: conversion_events + cdp_events + crm_activity + identity stitch + ConsentState + Customer360 + NBA recompute)
   - Verify D-67 BEFORE INSERT trigger rejects conversion_events row when consent_capture_block present AND no consent_state row in same tx
   - Verify ConversionEvent.experiment_variant_id captured at emit-time (D-23)
   - Verify D-32 idempotency replay returns 200 cached on duplicate within 60s
6. **Render thank-you page** (redirect after submit)
   - Verify 1500ms delay then router push to `thank_you_page_id` slug
   - Verify ConversionWorkspace events stream renders new event with `[ok]` glyph + `<.c-status-dot--live>` mint pulse for 60s
7. **Compute launch outcome** (T+7 days post-launch.live; cron triggers `computeLaunchOutcome`)
   - Verify `assertUpstreamReady(['P222','P223'])` runs BEFORE reading crm_activity + dispatch_events (D-71)
   - Verify metrics computed: reach + signups + pipeline_created + influenced_revenue (first-touch v1) + activation_lift (`{{MARKOS_ACTIVATION_LIFT_PENDING}}` placeholder per D-40)
   - Verify OutcomesDashboard renders T+7 row with computed values
8. **Accessibility audit** (axe-playwright run on each surface)
   - Verify zero accessibility violations on PUBLIC ConversionPage render + ConversionWorkspace + PageEditor + LaunchCockpit + GatesPanel + OutcomesDashboard
   - Verify focus order matches per-component focus order
   - Verify touch target ≥44px on coarse pointers (already global per 213.2)

### Manual operator checkpoints (Plan 07 Task 2 — `autonomous: false` per RL1)

1. **First Chromatic baseline batch** (15 blocks × ≥2 states + 4 operator surfaces × ≥4 states = ≥34 snapshots): operator reviews + approves first batch BEFORE accepting any visual diffs
2. **Public ConversionPage staging render**: operator visits staging slug for each page_type (10 page_types per D-01) and verifies visual fidelity
3. **AgentRun substrate verification**: operator confirms P207 substrate landed (`assertUpstreamReady(['P207'])` succeeds) BEFORE Plan 06 runbook execute path can run
4. **CDP + CRM360 + Channels substrate verification**: operator confirms P221/P222/P223 substrate landed BEFORE Plan 02 emit() fan-out can run
5. **Pricing Engine + Approval Inbox + EvidenceMap substrate verification**: operator confirms P205/P208/P209 substrate landed BEFORE Plan 04 gate evaluators can run

---

## Acceptance Criteria — Per-Surface AC Range Map

Total AC count: **~145 ACs** across 31 NEW UI artifacts + 32 X-cutting ACs.

| Surface family | Surface | AC range | AC count |
|----------------|---------|----------|----------|
| Static blocks | HeroBlock | HRO-1..HRO-7 | 7 |
| Static blocks | ContentBlock | CNT-1..CNT-5 | 5 |
| Static blocks | PricingBlock | PRI-1..PRI-9 | 9 |
| Static blocks | TestimonialBlock | TST-1..TST-5 | 5 |
| Static blocks | FaqBlock | FAQ-1..FAQ-4 | 4 |
| Static blocks | FooterBlock | FTR-1..FTR-4 | 4 |
| Static blocks | ImageBlock | IMG-1..IMG-4 | 4 |
| Static blocks | VideoBlock | VID-1..VID-5 | 5 |
| Static blocks | ComparisonBlock | CMP-1..CMP-5 | 5 |
| Static blocks | SocialProofBlock | SOP-1..SOP-5 | 5 |
| Static blocks | EvidenceBlockComponent | EVI-1..EVI-7 | 7 |
| Static blocks | CustomHtmlBlock | CHT-1..CHT-4 | 4 |
| Interactive blocks | CtaBlock | CTA-1..CTA-7 | 7 |
| Interactive blocks | SignupWidgetBlock | SWG-1..SWG-7 | 7 |
| Interactive blocks | FormBlock | FRM-1..FRM-9 | 9 |
| Renderers | page-renderer | PR1-1..PR1-9 | 9 |
| Renderers | form-renderer | FR1-1..FR1-7 | 7 |
| Form sub | FormField | FF1-1..FF1-8 | 8 |
| Form sub | FormFieldGroup | FFG1-1..FFG1-4 | 4 |
| Public route | PublicConversionRoute | PCR-1..PCR-12 | 12 |
| Operator | ConversionWorkspace | CW-1..CW-12 | 12 |
| Operator | PageEditor | PE-1..PE-18 | 18 |
| Operator | FormEditor | FE-1..FE-12 | 12 |
| Operator | LaunchCockpit | LC-1..LC-14 | 14 |
| Operator | RunbookEditor | RE-1..RE-16 | 16 |
| Operator | LaunchReadinessBoard | LRB-1..LRB-9 | 9 |
| Operator | GatesPanel | GP-1..GP-13 | 13 |
| Operator | OutcomesDashboard | OD-1..OD-11 | 11 |
| P208 PATCH | ApprovalInboxConversionEntries | AIE-1..AIE-7 | 7 |
| P208 PATCH | MorningBriefLaunchesSection | MBL-1..MBL-6 | 6 |
| Cross-cutting | XC-1..XC-32 | 32 |
| **TOTAL** | | | **~145 ACs across surfaces + 32 X-cutting = ~177 ACs** |

Per-AC enumeration is OUT-OF-SCOPE for this UI-SPEC; the AC range table delegates per-AC content to the implementing plans (224-03 + 224-07) which materialize each AC as a test assertion using the Plan 03/07 must_haves.truths + the `<acceptance_criteria>` block per task. Individual ACs are NOT enumerated here to keep this UI-SPEC tight (per 222 + 223 parent UI-SPEC tightness pattern). Each AC range above is materialized as `node:test` assertions in the `test/conversion/blocks/`, `test/conversion/render/`, `test/conversion/forms/`, `test/launches/api/`, `test/mcp/`, `test/regression/`, and `test/chromatic/` test directories per Plan 03 + Plan 07 files_modified.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (verbatim copy contracts per surface; banned-lexicon zero-match enforced on block bodies + form labels + page seo_meta + LaunchBrief positioning + runbook step.name + LaunchOutcome narrative_summary + content-classifier flagged copy + waiver_reason + reason-capture modal copy + CTA labels + thank-you-page slugs)
- [ ] Dimension 2 Visuals: PASS (vanilla `<table>` / `<ol>` / `<ul>` semantic; `.c-card` default; D-13 `.c-card--feature` reserved; D-14 no `.c-table`; HeroBlock vanilla `<section>` (NOT `.c-card--feature`))
- [ ] Dimension 3 Color: PASS (60/30/10 split honored; mint reserved for primary CTA + focus + chip-protocol + status-dot-live + `[ok]`/`[up]` glyphs; conversion_page status color-coding verbatim per D-01; launch_brief status color-coding verbatim per D-12; runbook state color-coding verbatim per D-37; gate status color-coding verbatim per D-16; classifier severity color-coding verbatim per D-72)
- [ ] Dimension 4 Typography: PASS (JetBrains Mono headings + Inter body; tabular numerals on monetary + percentage + counter columns; banned-lexicon zero-match)
- [ ] Dimension 5 Spacing: PASS (8-point grid; --space-* tokens only; off-grid auto-FAIL; `--space-xxl` reserved unused)
- [ ] Dimension 6 Registry Safety: PASS (no third-party blocks; D-15 extracted components project-owned; PII NEVER exposed un-redacted on PUBLIC pages unless block schema authorizes via `pii_classification: 'no_pii'`)

**Approval:** pending (checker upgrades to `approved YYYY-MM-DD` once 6-pillar audit passes; 224-07 ships gate enforcement)

---

*Phase: 224-conversion-launch-workspace*
*UI-SPEC drafted: 2026-05-05 by gsd-ui-researcher*
*Heavy-UI hybrid: 5 backend plans (01/02/04/05/06) + 2 UI plans (03/07) shipping 15 NEW block components + 2 NEW renderers + 2 NEW form sub-components + 1 NEW public dynamic route + 9 NEW operator workspace surfaces + 2 P208 PATCHes (Approval Inbox entry-types + Morning Brief launches section)*
*Architecture-lock: D-57 (forbidden-pattern detector at Plan 01 Task 0.5) + D-58 (buildApprovalPackage canonical helper at lib/markos/crm/agent-actions.ts:68; NEVER createApprovalPackage — verified non-existent) + D-59 (lib/markos/{conversion,launches}/* P224-owned greenfield; P221/P222/P223 upstream-owned greenfield hard-fail per D-60) + D-60 (assertUpstreamReady hard-fail; NO bridge stubs) + D-61 (npm test Node --test; ZERO new vitest, ZERO new playwright runtime in P224; existing axe-playwright reuse-only per 223 D-46 carry) + D-62 (contracts/openapi.json NOT public/openapi.json) + D-63 (lib/markos/mcp/tools/index.cjs NOT .ts) + D-64 (public route under app/(marketing)/conversion-page/[[...slug]]/; operator UI under EXISTING app/(markos)/ with 2 PERMITTED new sub-routes conversion/ + launches/ per D-45 carve-out) + D-65 (launch_readiness_required BEFORE UPDATE trigger on launch_surfaces — DB-level enforcement) + D-66 (launch_runbook_execute_required BEFORE UPDATE trigger on launch_runbooks.state — DB-level enforcement) + D-67 (consent_state_required BEFORE INSERT trigger on conversion_events — DB-level enforcement closes app-only fail-closed gap) + D-68 (purpose-built rate-limit primitive @upstash/ratelimit; NO reuse of checkSignupRateLimit) + D-69 (render-time freshness re-validation on EVERY render; protects updateTag failure mode) + D-70 (SHA-256-truncated sticky-hash via Node stdlib; NO xxhash-wasm dep) + D-71 (LaunchOutcome compute fail-closed on missing P222/P223; NO silent empty-row write) + D-72 (P224-owned greenfield content classifier; NOT carry from P223)*
*Approval helper canon: `buildApprovalPackage` per D-58 (NEVER `createApprovalPackage` — verified non-existent in codebase per 224-REVIEWS.md HIGH-1)*
*Test runner: `npm test` (Node `--test`) per D-61; ZERO new vitest, ZERO new playwright runtime in P224; existing axe-playwright devDep MAY be reused for ONE optional operator-journey E2E*
*Chromatic snapshot gate + manual operator-journey checklist replace any new Playwright runtime for 31 new UI artifacts*
*Approval Inbox handoff chip count: 36 (post-223) → 42 (post-224) — 6 new literals (page_publish_approval, form_publish_approval, launch_arm_approval, launch_execute_approval, gate_waiver_approval, rollback_approval)*
*15 block types verbatim per D-02: hero, content, pricing, cta, testimonial, faq, footer, image, video, comparison, social_proof, evidence_block, signup_widget, form, custom_html (admin-approved only)*
*13 SOR tables: conversion_pages + conversion_forms + conversion_ctas + conversion_events + conversion_experiments + experiment_variants + experiment_assignments + launch_briefs + launch_surfaces + launch_gates + launch_runbooks + launch_outcomes + launch_readiness_checks*
*9 LaunchSurface polymorphic surface_target_kind values per D-14: email_campaign (P223) + messaging_thread (P223) + lifecycle_journey (P223) + conversion_page (P224) + social_pack (P224 shell) + sales_enablement (P226) + partner_pack (P227) + support_pack (P224 shell) + docs_update (P224 shell)*
*4 LaunchGate kinds per D-16: pricing (P205) + evidence (P209) + readiness (D-13 first-class table) + approval (P208); custom (deferred to v2)*
*Pitfall 5 traffic_split immutability post-activation (DB trigger Migration 131) + Pitfall 6 reverse-runbook rollback non-reversible step → operator task + CONTINUE*
*D-33 single fan-out emit() writes 7 sinks transactionally per ConversionEvent (conversion_events + cdp_events + crm_activity + identity stitch + ConsentState + Customer360 + NBA recompute) with D-67 BEFORE INSERT trigger compliance for ConsentState writes*
