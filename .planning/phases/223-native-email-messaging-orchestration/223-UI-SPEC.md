---
phase: 223
slug: native-email-messaging-orchestration
status: draft
shadcn_initialized: false
preset: not-applicable-no-shadcn
domain: native-email-messaging-channel-engine-program-models-sender-deliverability-template-classifier-layered-approval-double-gate-dispatch-fanout-reply-continuity-knock-resend-twilio-in-app-architecture-lock-substrate
created: 2026-05-04
canonical_visual_contract: /DESIGN.md
design_md_version: v1.1.0
mode: hybrid (5 no-UI backend plans + 1 heavy-UI plan shipping 5 NEW components + 2 P208 entry-type renderers + 2 EVOLVED components)
ui_scope: 223-05 (19 /v1/channels/* API + 5 MCP tools + 5 NEW components under components/markos/crm/outbound/* + 2 P208 entry-type renderers under components/markos/operator/* + 2 EVOLVED — outbound-workspace.tsx + TimelineDetailView.tsx — + 5 Storybook stories + OpenAPI regen)
plans_in_scope: [223-01, 223-02, 223-03, 223-04, 223-05, 223-06]
plans_with_ui_surfaces: [223-05]
plans_no_ui: [223-01, 223-02, 223-03, 223-04, 223-06]
ui_components_new: [ChannelProgramsList, MessagingThreadsList, DeliverabilityWorkspace, TemplateEditor, ApprovalReviewPanel, MorningBriefChannelEntries, ApprovalInboxChannelEntries]
ui_components_evolved: [outbound-workspace, TimelineDetailView]
ui_components_replaced_as_default: []
chromatic_gate_owner: 223-06
playwright_e2e_status: REUSED-EXISTING (D-46 — existing axe-playwright accessibility infrastructure ONLY; NO new playwright runtime; Plan 06 ships 1 operator-journey E2E + Chromatic baselines)
milestone_position: v4.2.0-COMMERCIAL-ENGINES-LANE-CHANNEL-ENGINE-PHASE
parent_doctrine_chain:
  - 206-UI-SPEC.md (mutation-class doctrine — `external.send` for ALL channel dispatch paths (email_campaign dispatch + messaging_thread send + lifecycle_journey run-step + suppression bulk add); `data.export` for deliverability export; `default_approval_mode == single_approval` for class IN ('broadcast','revenue') OR audience_size >= 500 OR re-engagement >90d OR lifecycle_stage='lost' (D-18) OR pricing-touching template publish OR sender_identity verification update OR suppression bulk-add (D-32); `default_approval_mode == dual_approval` reserved for content-classifier-blocked dispatches when classifier finding has severity='block' AND pricing_binding involved; autonomy-ceiling on dispatch when `external.send` triggers without approval_ref; mutation-class binding via `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-43 — NEVER `createApprovalPackage` which does not exist)
  - 207-UI-SPEC.md (PARENT — `RunApiEnvelope.run_id` linked to channel dispatch runs (`createDispatchRun` for email_campaign dispatch + `handleRecipient` for single-recipient send + `pollDueJourneyRuns` lifecycle journey advancement) + 5 cron handlers per Plan 06 (`channels-deliverability-rollup` hourly + `channels-lifecycle-journey-poll` every 2 minutes + `channels-bounce-spike-alert` daily + `channels-tombstone-cascade` daily + `channels-soft-bounce-promote` daily); `AgentRunEventType` for `channel_dispatch_started` / `channel_dispatch_completed` / `channel_dispatch_paused` / `channel_dispatch_cancelled` / `channel_recipient_sent` / `channel_recipient_skipped` / `channel_recipient_bounced` / `channel_recipient_complained` / `channel_recipient_unsubscribed` / `channel_recipient_replied` / `channel_recipient_opened` / `channel_recipient_clicked` / `channel_template_classified_blocked` / `channel_template_classified_flagged` / `channel_approval_revoked` / `channel_lifecycle_journey_step_advanced` / `channel_lifecycle_journey_paused` / `channel_lifecycle_journey_resumed` / `channel_sender_reputation_degraded` / `channel_sender_reputation_at_risk` / `channel_deliverability_spike_detected` / `channel_suppression_added_from_bounce` / `channel_suppression_added_from_complaint` / `channel_suppression_added_from_tombstone` (P221 D-24 cascade); `AgentFailureClass` 7 literals on cron + dispatch failures; `ApprovalHandoffRecord` links 223 channel approvals to P208 inbox via `buildApprovalPackage`; `agent_run_id` linked to all 5 P223 cron handlers + all 19 read-write API handlers + all 5 MCP tools; D-15-revised hard-fail via `assertUpstreamReady(['P207'])` per D-45 — NO bridge stub, NO `workflow.agentrun_v2_available` config flag)
  - 208-UI-SPEC.md (PARENT — Approval Inbox at `/operations/approvals` + Morning Brief + Task Board + cockpit pattern; per D-35 the Approval Inbox gains 4 new channel entry types via `buildApprovalPackage` (D-43): `email_campaign` + `lifecycle_journey` + `channel_template` + `channel_suppression_bulk` — handled by `ApprovalInboxChannelEntries.tsx` renderer with `triggerReason` chips + `classifierFindings` list + `pricingRefs` + `evidenceRefs` panels + approve/reject/revoke buttons; the Morning Brief surfaces top reply_pending threads by `owner_user_id` + at_risk senders requiring action via `MorningBriefChannelEntries.tsx` renderer; CRM reporting cockpit (`lib/markos/crm/reporting.ts`) gains channel program rollups (campaigns by status by class + threads by reply_pending count + deliverability posture by sender); mobile_priority literals registered in `lib/markos/operator/shell.ts` `SurfaceRouteContract` per surface)
  - 209-UI-SPEC.md (PARENT — EvidenceMap binding + source quality + claim TTL on channel_templates `evidence_bindings[]`; D-29 fan-out emit() shared `source_event_ref` threads channel events ↔ cdp_events ↔ EvidenceMap (P209); the 209 `<KbGroundingPanel />` + `<EvidenceCitationChip />` extracted-component recipes from 217 D-15 are CONSUMED in production by TemplateEditor (template `evidence_bindings[]` rendering with claim TTL + source quality) and ApprovalReviewPanel (`evidenceRefs` panel for approval review context); EVD-01..06 doctrine carry — EVD-01 (template factual claim variables linked to evidence_ref) + EVD-02 (channel dispatch blocks when classifier finding severity='block' on factual_claim check) + EVD-04 (template re-render reuses non-stale evidence; classifier flags stale evidence) + EVD-05 (ApprovalReviewPanel exposes evidence + assumptions + classifier findings per template))
  - 213-UI-SPEC.md (PARENT — Tenant 0 readiness gate consumer; 213-04 public-proof boundary applies STRICTLY to outbound channel content — campaign body + template content_blocks + reply intelligence body + suppression operator-note + sender warming notes are PRIVATE doctrine forever; raw recipient email/phone/NIT/company_name from CDP IdentityProfile NEVER cited in case studies or public surfaces; recipient PII NEVER renders raw — always via `<PIIRedactedField />` per `pii_classification` ENUM; banned-lexicon zero-match required on every channel_template body + EmailCampaign subject + reply suggestions + classifier findings operator-note + sender warming notes BEFORE any `external.send` dispatch path; 213.4-VALIDATION.md carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary) carries verbatim into all 5 NEW + 2 P208 renderer + 2 EVOLVED components)
  - 214-UI-SPEC.md (PARENT — SaaS Suite Activation; per D-21 `cdp_identity_profiles.profile_id` is the canonical identity reader for channel dispatch consumed via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` per D-44 + D-45; channel dispatch eligibility honors P214 SaaS bridge architecture-lock; the 214 `<SaaSActivationPanel />` is NOT directly composed in 223 surfaces; **architecture-lock D-32 carries verbatim** — legacy `api/*.js` REST tree (NOT App Router `app/api/.../route.ts`) per D-42)
  - 215-UI-SPEC.md (PARENT — sentinel discipline + sensitive credential UI binding contract Layer 6 carries verbatim AND EXTENDS to recipient PII per 216 inheritance — every TemplateEditor preview rendering of CDP-resolved recipient PII (raw `primary_email` / `primary_phone` / `company_name`) renders via `<PIIRedactedField />` per `pii_classification` ENUM 5-value taxonomy; audit-log `event_type == 'identity_view'` mirrors `credential_view` pattern (every PII field render writes audit row); the 215 billing-correction modal recipe is REUSED VERBATIM for `channel_dispatch_approval` (when class IN ('broadcast','revenue') OR audience_size >= 500) AND `channel_template_publish_approval` (when content_classifier finding severity='block') AND `channel_suppression_bulk_approval` (when suppression bulk add > 100 rows) AND `channel_program_pause_approval` (when revoking approval mid-dispatch); sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim via `<PlaceholderBanner variant="billing_placeholder">` whenever channel_template `pricing_bindings[]` resolves through non-allowlisted accessor per D-27 + D-52)
  - 216-UI-SPEC.md (PARENT — Health Score binding for dispatch priority gate; the 216 `<HealthScoreBadge />` + `<RiskBandBadge />` + `<RetentionClassChip />` + `<PIIRedactedField />` + `<KbGroundingPanel />` + `<ClassifierChipRow />` extracted-component recipes are CONSUMED IN PRODUCTION by 223 surfaces — `<HealthScoreBadge />` reused in MessagingThreadsList per-row (when related_crm_id resolves to Customer360 with health_score; reply_pending priority bias) and ApprovalReviewPanel header (when subject is a reply-related approval); `<RiskBandBadge />` reused in MessagingThreadsList per-row + DeliverabilityWorkspace per-sender at_risk indicator; `<KbGroundingPanel />` reused in TemplateEditor (template `evidence_bindings[]` rendering); `<ClassifierChipRow />` reused in TemplateEditor (classifier findings rendering — 4 finding kinds: pricing_binding/pricing_text_scan/pricing_ast_violation/evidence_ttl/competitor_mention) and TimelineDetailView per-channel-event-row chip rendering; the 5 `pii_classification` ENUM badges carry verbatim and apply to every recipient PII field rendered in TemplateEditor preview, MessagingThreadsList per-row recipient name, ApprovalReviewPanel recipient sample list; banned-lexicon zero-match enforced on channel_template body + EmailCampaign subject + reply suggestions BEFORE `external.send` dispatch)
  - 217-UI-SPEC.md (PARENT — heavy-UI pattern reference; D-15 selective extraction recipe (7 components first consumed in 217-06 — REUSED in 223 surfaces NOT re-implemented); D-21 server/client boundary carries verbatim — the 5 NEW + 2 P208 renderer + 2 EVOLVED components live under `components/markos/crm/outbound/*` + `components/markos/operator/*` + `components/markos/crm/*` per D-33 (NOT under `app/(markos)/` which is FORBIDDEN as NEW path per D-35 BUT preserved for existing pages per D-43); **D-32 architecture-lock carries verbatim** — legacy `api/*.js` flat (NOT App Router `app/api/.../route.ts`) per D-42; `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` (NOT `requireSupabaseAuth`) per D-42; test runner is `npm test` (Node `--test`) with `*.test.js` files (`.test.ts` FORBIDDEN per D-46); OpenAPI lives at `contracts/openapi.json` (NOT `public/openapi.json`) per D-47; MCP registry at `lib/markos/mcp/tools/index.cjs` (NOT `.ts`) per D-48; cron in `api/cron/*.js` with `x-markos-cron-secret` header (NOT `app/api/cron/.../route.ts`) per D-49; helper canon `buildApprovalPackage` (NOT `createApprovalPackage`) per D-43)
  - 220-UI-SPEC.md (PARENT — END-OF-v4.1.0 milestone state; 26 P208 handoff_kind chips at v4.1.0 closeout; 221 EXTENDS to 29 chips; 222 EXTENDS to 32 chips; **223 EXTENDS the chain to 36 chips** with 4 new literals — `channel_dispatch_approval` 33rd + `channel_template_publish_approval` 34th + `channel_suppression_bulk_approval` 35th + `channel_program_pause_approval` 36th — start-of-v4.2.0-commercial-engines-lane CHANNEL-ENGINE state; 220 community/events/PR/partnership outbound substrate dissolves at the dispatch substrate layer — 220 program model patterns DEFER to 223 channel program models for any owned-channel outreach)
  - 221-UI-SPEC.md (PARENT — CDP IdentityProfile + ConsentState + TraitSnapshot + AudienceSnapshot via P221 read-through adapter per D-44 + D-45; **221 D-12 mandate** — full ConsentState cutover lands in P223 — `outboundConsentRecords` becomes derived view backed by `cdp_consent_states`; per D-51 cutover is HARD via DB trigger (no `workflow.outbound_consent_legacy_view` config flag fallback — rejected escape hatch); legacy `outbound_consent_legacy_view` exists ONLY for backward-compat read; 221 D-32 architecture-lock carries verbatim; 221 D-18 audience double-gate (snapshot membership + current ConsentState re-validation) is the AUTHORITY for D-19 per-recipient 6-layer dispatch gate (Consent → Suppression → SessionWindow [WhatsApp only, per D-54] → FrequencyCap [DB trigger per D-50] → QuietHours → Jurisdiction); 221 D-24 tombstone cascade propagates via D-21 → channel_suppressions row across all 5 channels (cron `channels-tombstone-cascade.js` Plan 06))
  - 222-UI-SPEC.md (PARENT — CRM Timeline + Commercial Memory; D-15 reuse manifest VERBATIM (7 components first consumed in 217-06 REUSED in 222 + REUSED in 223); 222 commercial_signal taxonomy 7-enum (`interest`/`risk`/`expansion`/`renewal`/`support`/`pricing`/`silence`) is the AUTHORITY for D-29 fan-out emit() commercial_signal mapping (open→interest, click→interest, reply (positive)→interest, reply (negative)→risk, bounce→risk, complaint→risk, unsubscribe→risk); 222 source_domain 11-enum (verbatim: `website`/`email`/`messaging`/`meeting`/`crm`/`billing`/`support`/`product`/`social`/`research`/`agent`) is the AUTHORITY for TimelineDetailView (D-34) channel-event-chip source_domain rendering — `email` and `messaging` are channel events emitted by 223; **TimelineDetailView is EVOLVED in 223-05** (D-34) — gains channel-event-chips section per row when source_domain IN ('email','messaging','push','in_app') showing icons for opened/clicked/replied/bounced/complained/unsubscribed; chips read from dispatch_events keyed on source_event_ref; 222 `messaging_threads.related_crm_id` FK → `customer_360_records` is the AUTHORITY for thread.related_crm_id link in MessagingThreadsList per-row "Open Customer360 →" mint-text inline link; 222 `messaging_threads.related_nba_id` FK → `nba_records` is the AUTHORITY for "Open NBA →" mint-text inline link when thread has active NBA)
  - 213.4-VALIDATION.md §Carry-forward (D-08 token-only, D-09 mint-as-text, D-09b `.c-notice` mandatory, D-13 `.c-card--feature` reserved, D-14 no `.c-table`, D-15 selective extraction, D-21 server/client boundary)
translation_gates_dissolved_by_223:
  - "222-UI-SPEC §future_phase_223_dispatch_substrate (anticipated future commercial-engines lane consumer placeholder for P223 messaging engine consuming 222 substrate) — DISSOLVED. 223 ships the dispatch substrate (5 NEW components + 2 P208 entry-type renderers + 2 EVOLVED + 19 API + 5 MCP + 11 SOR tables + 4 provider adapters + single fan-out emit + per-recipient 6-layer gate); 223 reads `customer_360_records` + `messaging_threads.related_crm_id` + `nba_records.action_type IN ('send_followup','propose_expansion','send_renewal_reminder','draft_outreach')` for NBA-driven outbound; 223 reads P221 `cdp_consent_states` (per 221 D-11/D-13/D-18 double-gate) + P221 `cdp_audience_snapshot_memberships` for activation; 222 lifecycle stages drive dispatch playbook selection; 222 commercial_signal enum drives subject-line + content-pack template selection in TemplateEditor. The `<PlaceholderBanner variant=\"future_phase_223_dispatch_substrate\">` is REMOVED from 222-consuming surfaces."
  - "104-CONTEXT D-04/D-07 + 105-CONTEXT D-05/D-06 (legacy CRM-bound outbound consent + outbound workspace placeholder for future tenant-wide Channel Engine) — DISSOLVED. 223 ships the tenant-wide Channel Engine (`lib/markos/channels/*` greenfield per D-44 — programs/senders/templates/gate/dispatch/events/suppression/adapters/deliverability/preflight/mcp/api subdirectories all NEW, none exist before P223). Legacy `lib/markos/outbound/*` PRESERVED VERBATIM (additive extension only — base-adapter.ts CHANNEL_CAPABILITIES extended 3→5 channels per D-08; resend-adapter.ts gains inbound parsing per D-22; twilio-adapter.ts gains verifyWebhookSignature per D-08; consent.ts refactored to read ConsentState only via P221 adapter per D-11; events.ts extended for email reply + Knock + fan-out per D-22 + D-29; conversations.ts replaced by messaging_threads via legacy adapter; scheduler.ts replaced by AgentRun + Queues via legacy adapter). Legacy `api/crm/outbound/*.js` paths PRESERVED as legacy adapter (`lib/markos/channels/adapters/legacy-outbound.ts` P223-owned greenfield per D-44) during deprecation window; rewrite consumers post-P223. `outboundConsentRecords` table renamed `outbound_consent_records_legacy` per migration 119; CREATE VIEW `outboundConsentRecords` backed by `cdp_consent_states` (P221 SOR); BEFORE INSERT/UPDATE trigger blocks direct legacy writes per D-51 (RLS rejected — service-role bypasses)."
  - "211-CONTEXT (content-classifier + `{{MARKOS_PRICING_ENGINE_PENDING}}` rule placeholder for owned-channel deployment) — DISSOLVED at the classifier-implementation layer per D-53. P211 introduced the placeholder rule but the classifier IMPLEMENTATION is P223-OWNED greenfield (NEW file `lib/markos/channels/templates/content-classifier.ts` per Plan 03 Task 2). P211 is in REQUIRED_UPSTREAM (D-45) only because the placeholder rule itself is referenced. The classifier uses AST/allowlist via `@babel/parser` (NOT 5-line regex per D-52); ALLOWLISTED_ACCESSORS = `['getPricingFor', 'formatPrice', 'usePricing', 'pricingFromEngine']` OR literal `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder. The `<PlaceholderBanner variant=\"future_phase_223_classifier_implementation\">` (if present in any 211-consuming surface) is REMOVED."
translation_gates_opened_by_223:
  - "future_phase_224_conversion_surfaces — Future commercial-engines lane consumer (P224 Conversion Surfaces — landing pages + forms + CTA + launch orchestration + post-launch feedback) consuming 223 substrate. P224 reads `email_campaigns` + `lifecycle_journeys` shapes for launch orchestration; consumes 223 single fan-out emit() for landing-page-form-submission → cdp_events + crm_activity + dispatch_events writeback; reuses 223 channel_templates for confirmation emails + form-submission acknowledgements; reuses 223 SenderIdentity for launch broadcast emails; SSE/websocket for in_app messages real-time delivery deferred from 223 D-10 (next-nav read) to P224 (live forms + in-app workflow). Future surfaces render `<PlaceholderBanner variant=\"future_phase_224_conversion_surfaces\">` until that phase ships."
  - "future_phase_225_attribution_journey_analytics — Future commercial-engines lane consumer (P225 Semantic Attribution + Customer Journey Analytics + Narrative + Anomaly Intelligence) consuming 223 substrate. P225 reads `dispatch_events` + `cdp_events` (via D-29 fan-out) for attribution + journey + narrative semantic layer; reads `email_campaigns.opened_count/clicked_count/replied_count` for engagement scoring; reads `messaging_threads.last_message_at` + sentiment for support narrative; reads `deliverability_posture.reputation_score` for sender narrative; A/B testing on EmailCampaign + LifecycleJourney + MessagingThread deferred from 223 to P225 (analytics + experiment registry from P218 D-05); send-time optimization (best-time-to-send ML) deferred from 223 to P225. Future surfaces render `<PlaceholderBanner variant=\"future_phase_225_attribution_journey_analytics\">` until that phase ships."
  - "future_phase_226_sales_enablement — Future commercial-engines lane consumer (P226 Sales Enablement — battlecards + proof packs + proposals + win/loss capture) consuming 223 substrate. P226 uses 223 MCP tool `send_messaging` for sales-assist outreach with Opportunity context; AI-generated subject + body deferred from 223 to P226 deal-execution copilot integration; reuses 223 ApprovalReviewPanel for sales-touch approval flows. Future surfaces render `<PlaceholderBanner variant=\"future_phase_226_sales_enablement\">` until that phase ships."
  - "future_phase_223_admin_ui — Multi-page Channel Engine admin surface composing dedicated routes (`app/(markos)/channels/{programs,threads,deliverability,templates,approvals,suppressions,senders}/page.tsx` future). 223 ships the COMPONENTS (5 NEW under components/markos/crm/outbound/* + 2 P208 entry-type renderers + 2 EVOLVED) but does NOT ship dedicated admin pages — components are CONSUMED by the existing CRM outbound workspace shell evolution (D-33). Future admin pages render the same components in dedicated routes. **D-32 architecture-lock holds** — all routes are LEGACY `api/*.js` per D-42. Future surfaces render `<PlaceholderBanner variant=\"future_phase_223_admin_ui\">` until those phases ship."
  - "future_phase_223_approval_inbox_renderers — P208 Approval Inbox at `/operations/approvals` rendering 4 NEW handoff_kind chips (`channel_dispatch_approval` 33rd + `channel_template_publish_approval` 34th + `channel_suppression_bulk_approval` 35th + `channel_program_pause_approval` 36th), filter chip set extends from 32 chips (post-222 — start-of-v4.2.0-commercial-engines-lane mid-state) to **36 chips post-223 — start-of-v4.2.0-commercial-engines-lane CHANNEL-ENGINE state**. Each chip renders the per-row classifier via `ApprovalInboxChannelEntries.tsx` renderer (channel_dispatch: subject_type + class chip + audience_size + sender_identity_label + triggerReason chips + classifierFindings list + sample render preview; channel_template_publish: template channel + classifier_findings + pricing_bindings + evidence_bindings; channel_suppression_bulk: suppression count + dsr_source flag; channel_program_pause: dispatch_run_id + recipients_already_sent counter + remaining_recipients counter). Row rendering ships in 223-05 — DISSOLVES the future_phase_222_approval_inbox_extensions placeholder for channel-related entry types. Future surfaces render `<PlaceholderBanner variant=\"future_phase_223_approval_inbox_renderers\">` ONLY until 223-05 ships (i.e., this gate dissolves WITH this UI-SPEC)."
  - "future_phase_223_morning_brief_renderers — P208 Morning Brief at `/operations/brief` rendering 2 NEW channel-related rollup sections via `MorningBriefChannelEntries.tsx` renderer: (1) top reply_pending threads by current operator's `owner_user_id` (limit 5; per D-23 reply continuity) and (2) at_risk senders requiring action (per D-35 — DeliverabilityWorkspace at_risk reputation_status). Renderer ships in 223-05 — DISSOLVES the future_phase_222_approval_inbox_extensions Morning Brief placeholder for channel-related rollups. Future surfaces render `<PlaceholderBanner variant=\"future_phase_223_morning_brief_renderers\">` ONLY until 223-05 ships."
  - "future_phase_223_chromatic_baselines — Chromatic visual baseline gate enforcement (5 NEW UI surfaces × 4+ named state stories each = 20+ snapshots) lives under Plan 06 (autonomous: false per Plan 06 RL1 — operator review on first batch + sender warming + DKIM/SPF/DMARC + Knock provisioning checkpoints). Future approval needed if visual diffs accepted on subsequent baselines without operator review. 223-06 Plan ships `chromatic.config.json` + 5 `*.stories.tsx` files; downstream phases (P224+) MUST NOT add components/markos/crm/outbound/* without registering corresponding Storybook stories + Chromatic snapshots."
  - "future_phase_223_ssl_realtime_in_app_messages — Real-time SSE/websocket for `in_app_messages` table read deferred from 223 D-10 (next-nav read suffices for v1) to P224 conversion surfaces (live forms + in-app workflow). Operator UI in 223 reads in_app_messages on next page load — no live push. P224 will add SSE for unread in_app_messages count + new-message toast. Future surfaces render `<PlaceholderBanner variant=\"future_phase_223_ssl_realtime_in_app_messages\">` until that phase ships."
---

# Phase 223 — UI Design Contract (HYBRID HEAVY-UI)

> Visual and interaction contract for the **Native Email + Messaging Orchestration (Channel Engine)** phase. Phase 223 is HYBRID HEAVY-UI: five backend plans (223-01, 223-02, 223-03, 223-04, 223-06) ship migrations + libs + handlers + provider adapters + cron + tests with **zero NEW UI surface** (Plan 06 ships the Chromatic gate + axe-playwright operator-journey reuse for the 5 surfaces shipped by Plan 05); ONE UI plan (223-05) ships **5 NEW components under `components/markos/crm/outbound/*` + 2 P208 entry-type renderers under `components/markos/operator/*` + 2 EVOLVED components (`components/markos/crm/outbound/outbound-workspace.tsx` + `components/markos/crm/TimelineDetailView.tsx`)**, plus 19 `api/v1/channels/*.js` legacy-flat HTTP route files (per D-42), 5 MCP tools registered via `lib/markos/mcp/tools/index.cjs` (per D-48), F-130 contract, regenerated `contracts/openapi.json` (per D-47), and 5 Storybook stories. Plan 05 collectively constitutes the FIRST tenant-wide Channel Engine operator workspace of the v4.2.0 commercial-engines lane.
>
> **Critical posture:** 223 EVOLVES the existing CRM outbound workspace (preserved per D-33; legacy `lib/markos/outbound/*` + `api/crm/outbound/*.js` PRESERVED as legacy adapter `lib/markos/channels/adapters/legacy-outbound.ts` P223-owned greenfield per D-44). The 5 NEW UI components live under `components/markos/crm/outbound/*` (NEW subdirectory; does not exist before this phase); the 2 P208 entry-type renderers live under `components/markos/operator/*` (NEW subdirectory; does not exist before this phase); the 1 EVOLVED parent shell `outbound-workspace.tsx` and the 1 EVOLVED `TimelineDetailView.tsx` (D-34 — extended for channel events from 222-03) live under their existing paths. Every approval gate cites 206 mutation-class doctrine; every approval-package call uses `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-43 (NEVER `createApprovalPackage` — verified non-existent in codebase).
>
> **Architecture-lock note:** Per D-42 architecture-lock — `createApprovalPackage`, `requireSupabaseAuth`, `requireTenantContext`, `serviceRoleClient` (outside `requireHostedSupabaseAuth` boundary), `lookupPlugin` (use `resolvePlugin`), `public/openapi.json` (use `contracts/openapi.json` per D-47), `app/(public)`, `app/(markos)` AS NEW FILE PATH (NOT as existing page tree which IS preserved per D-43), `route.ts` (outside doctrinal NO-X comments), `app/api/cron/.../route.ts` (use `api/cron/*.js` per D-49), `vitest run`, `from 'vitest'`, `.test.ts`, `"stub if missing"`, `"if exists"`, `workflow.agentrun_v2_available`, `workflow.outbound_consent_legacy_view` are all auto-FAIL tokens. Plan 01 Task 0.5 ships forbidden-pattern detector test that scans every `.planning/phases/223-*-PLAN.md` file for the rejected tokens.
>
> **D-46 axe-playwright reuse note:** Per D-46 test runner pinned to `npm test` (Node `--test`); **NO NEW vitest, NO NEW playwright runtime in P223**. Plan 06 reuses the EXISTING `axe-playwright` devDep (preserved for accessibility tests; existing infrastructure ONLY) for ONE operator-journey E2E test (campaign create → approve → dispatch → reply → bounce). All `*.test.js` files (NOT `.test.ts`) use `node:test` + `node:assert/strict`. The CHROMATIC SNAPSHOT GATE + EXISTING axe-playwright operator-journey + manual operator checkpoints (sender warming + DKIM/SPF/DMARC + Knock provisioning) replace any need for a new playwright runtime. Plan 06 closeout includes a meta-test that asserts `package.json` did not gain `vitest` or NEW `@playwright/test` keys during P223 execution.
>
> **D-29 single fan-out emit() UI binding note:** Every channel event (open/click/reply/bounce/complaint/unsubscribe + dispatch_started/dispatch_completed + suppression_added) emitted via `lib/markos/channels/events/emit.ts` writes 5 destinations transactionally (cdp_events + crm_activity + aggregate-counter + dispatch_events + setConsentState if consent-affecting). UI surfaces consume the 5-destination output as: (1) cdp_events feeds TimelineDetailView per-row chip rendering via P222 commercial_signal taxonomy; (2) crm_activity feeds Customer360 timeline (P222 surface — consumed by 222 D-25 TimelineDetailView via D-34 channel event chips); (3) aggregate-counter feeds ChannelProgramsList per-card delivered/opened/clicked/replied counters AND MessagingThreadsList per-row last_message_at; (4) dispatch_events feeds DeliverabilityWorkspace 24h posture metrics; (5) setConsentState (when consent-affecting) feeds the ConsentState UI in P221 surfaces (NOT 223; out of scope for 223-05). The D-51 BEFORE INSERT/UPDATE trigger on `outbound_consent_records_legacy` enforces single-writer rule via `app.consent_writer_source` GUC; UI surfaces NEVER write directly to consent table (always via P221 setConsentState).
>
> Authority chain: DESIGN.md v1.1.0 → 213.4-VALIDATION.md carry-forward (D-08..D-15 + D-21) → 206-UI-SPEC (mutation-class doctrine origin — `external.send` for ALL channel dispatch) → 207-UI-SPEC (RunApiEnvelope + AgentRunEventType + ApprovalHandoffRecord) → 208-UI-SPEC (cockpit pattern parent — Approval Inbox + Morning Brief gain channel renderers) → 209-UI-SPEC (EvidenceMap + KbGroundingPanel for template evidence) → 213-UI-SPEC (T0 gate consumer + public-proof boundary on outbound) → 214-UI-SPEC (PARENT — SaaS Suite Activation; CDP profile read-through adapter pattern; architecture-lock) → 215-UI-SPEC (PARENT — sentinel + sensitive credential UI binding Layer 6 EXTENDS to recipient PII; billing-correction modal recipe REUSED for 4 new approval kinds) → 216-UI-SPEC (PARENT — Health Score binding for dispatch priority + 6 extracted components REUSED in 223) → 217-UI-SPEC (PARENT — heavy-UI pattern reference; D-15 extracted components reused; D-21 server/client boundary; D-32 architecture-lock) → 220-UI-SPEC (END-OF-v4.1.0; 26 chips at v4.1.0 closeout; 220 community/events outbound substrate dissolves at dispatch substrate layer) → 221-UI-SPEC (PARENT — CDP read-through adapter; ConsentState SOR cutover; D-18 audience double-gate authority for D-19 6-layer dispatch gate; 29 chips post-221) → 222-UI-SPEC (PARENT — CRM Timeline + Commercial Memory; commercial_signal taxonomy; source_domain enum; TimelineDetailView EVOLVED for channel events per D-34; 32 chips post-222) → this document. Generated by gsd-ui-researcher 2026-05-04. Status: draft (checker upgrades to approved once 6-pillar audit passes).

---

## Plan Scope Classification

| Plan | Wave | Title | UI Scope | Primary Surface | Mobile Priority |
|------|------|-------|----------|-----------------|-----------------|
| **223-01** | 1 | Architecture-lock + assertUpstreamReady preflight + 11 SOR tables foundation | NO_UI | `supabase/migrations/113-116`, `lib/markos/channels/{programs,senders,templates,suppression,adapters,preflight}/*.ts`, `scripts/preconditions/223-check-upstream.cjs`, F-122..F-128 (7 contracts) + F-129 (dispatch-event read) | n/a |
| **223-02** | 2 | Dispatch infrastructure + ConsentState cutover (D-11/D-12/D-51 trigger) + per-recipient 6-layer gate (D-19/D-50/D-54) | NO_UI | `supabase/migrations/117-121` (dispatch tracking + in_app + consent view-swap-with-trigger + indexes-RLS-hardening + frequency-cap-trigger), `lib/markos/channels/{gate,dispatch,suppression}/*.ts`, `lib/markos/outbound/consent.ts` (refactor) | n/a |
| **223-03** | 3 | Templates + personalization + content classifier (D-52 AST/allowlist via @babel/parser) + layered approval engine (D-16 fail-CLOSED) + revocation flow | NO_UI | `lib/markos/channels/templates/{renderer,variable-resolver,content-classifier,preview,handlebars-helpers,approval-trigger}.ts`, `lib/markos/crm/agent-actions.ts` (extend buildApprovalPackage + add revokeApproval), F-131 | n/a |
| **223-04** | 3 | Provider adapters (Resend/Twilio/Knock/in_app) + inbound parse (Resend metadata-only — Pitfall 9/A11) + auto-reply detect (Pitfall 7) + Knock cascade (Pitfall 8) + single fan-out emit() (D-29) + reply continuity flow | NO_UI | `lib/markos/outbound/providers/{resend,twilio,knock,in-app}-adapter.ts` + `resend-inbound.ts`, `lib/markos/channels/events/{emit,auto-reply-detect,commercial-signal-map,reply-flow}.ts`, `api/webhooks/{resend-events,twilio-events,knock-events}.js` | n/a |
| **223-05** | 4 | 19 API + 5 MCP + **5 NEW UI** + **2 P208 entry-type renderers** + **2 EVOLVED** + OpenAPI regen + 5 Storybook stories | **IN_SCOPE** | 19 `api/v1/channels/*.js` (legacy flat per D-42) + `lib/markos/channels/{api,mcp}/*.js` + `lib/markos/mcp/tools/index.cjs` (extend per D-48) + F-130 + `contracts/openapi.json` (regen per D-47) + **5 NEW: `components/markos/crm/outbound/{ChannelProgramsList,MessagingThreadsList,DeliverabilityWorkspace,TemplateEditor,ApprovalReviewPanel}.tsx`** + **2 P208 renderers: `components/markos/operator/{MorningBriefChannelEntries,ApprovalInboxChannelEntries}.tsx`** + **2 EVOLVED: `components/markos/crm/outbound/outbound-workspace.tsx` + `components/markos/crm/TimelineDetailView.tsx`** + 5 module CSS + 5 Storybook stories | **secondary** for ChannelProgramsList / DeliverabilityWorkspace / TemplateEditor / ApprovalReviewPanel; **critical** for MessagingThreadsList (sales/CS field-of-view for reply-pending) and MorningBriefChannelEntries (operator daily start) |
| **223-06** | 5 | Closeout — 5 cron handlers (legacy api/cron/*.js per D-49) + 11-table RLS suite + bounce/complaint spike alert + tombstone cascade + soft-bounce promotion + axe-playwright operator-journey reuse + Chromatic gate + checkpoint:human-action for sender warming + DKIM/SPF/DMARC + Knock provisioning | NO_NEW_UI (gates existing surfaces) | `lib/markos/channels/deliverability/{posture-rollup,spike-alert}.ts` + `lib/markos/channels/dispatch/{lifecycle-journey-poll,soft-bounce-promotion}.ts` + 5 `api/cron/channels-*.js` + `chromatic.config.json` + axe-playwright operator-journey reuse + `vercel.json` cron entries + 223-SUMMARY.md | n/a |

**Hybrid scope rationale.** Plans 223-01/02/03/04/06 ship the durable substrate (11 SOR tables + ConsentState cutover with HARD trigger + 4 provider adapters + per-recipient 6-layer gate + content classifier with @babel/parser AST/allowlist + layered approval engine + 5 cron + 11-table RLS suite + axe-playwright operator-journey + Chromatic gate) without rendering any pixel. Plan 223-05 ships the operator-facing Channel Engine workspace with **5 NEW components first consumed in production** here, plus **2 P208 entry-type renderers** (Morning Brief + Approval Inbox extension), plus **2 EVOLVED existing components** (`outbound-workspace.tsx` parent shell evolution per D-33 — preserves outer shell + existing CRM-bound entry points + adds tab bar for Programs|Threads|Deliverability|Templates|Approvals + legacy sections remain mounted via legacy-outbound adapter tagged "Legacy (deprecating)"; `TimelineDetailView.tsx` extension per D-34 — gains channel-event-chips section per row when source_domain IN ('email','messaging','push','in_app')). The `<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />` extracted-component recipes from 216-UI-SPEC §D-15 (first consumed in 217-UI-SPEC §D-15; reused in 222) are **REUSED** in 223 surfaces.

**Mobile priority.** Per 208-01 mobile_priority literals (`critical | secondary | desktop_only`):

| Surface | mobile_priority | Rationale |
|---------|-----------------|-----------|
| `components/markos/crm/outbound/ChannelProgramsList.tsx` | `secondary` | Operator desk-work; campaign/journey kanban review |
| `components/markos/crm/outbound/MessagingThreadsList.tsx` | **`critical`** | **Sales/CS mobile field-of-view** for reply-pending threads (per D-23 reply continuity); inbound reply demands fast operator response |
| `components/markos/crm/outbound/DeliverabilityWorkspace.tsx` | `secondary` | Sender posture review; not field-emergency |
| `components/markos/crm/outbound/TemplateEditor.tsx` | `secondary` | Template authoring; desk-work |
| `components/markos/crm/outbound/ApprovalReviewPanel.tsx` | `secondary` | P208 inbox entry detail; opens from Approval Inbox critical-mobile path |
| `components/markos/operator/MorningBriefChannelEntries.tsx` | **`critical`** | **Operator daily start** — reply_pending + at_risk senders surface here; mobile-first per 208-02 inheritance |
| `components/markos/operator/ApprovalInboxChannelEntries.tsx` | `secondary` | Approval Inbox row renderer; opens ApprovalReviewPanel |
| `components/markos/crm/outbound/outbound-workspace.tsx` (EVOLVED) | `secondary` (parent inherits) | Shell chrome; tab bar for 5 surfaces |
| `components/markos/crm/TimelineDetailView.tsx` (EVOLVED) | `secondary` (parent inherits from 222) | Channel event chips additive; 222 baseline preserved |

`desktop_only` is FORBIDDEN as a `mobile_priority` value (208-01 architecture-lock). All surfaces meet WCAG 2.1 AA touch targets via the global `(pointer: coarse) { .c-button { min-height: 44px } }` rule already shipping per 213.2 cross-cutting fix. Each surface registers in `lib/markos/operator/shell.ts` `SurfaceRouteContract` via `surface_family: channels_*`.

All Acceptance Criteria below apply to plan 223-05 deliverables. Plans 223-01/02/03/04/06 are backend-only and produce no NEW UI artifacts (Plan 06 gates the 5 NEW + 2 renderer + 2 EVOLVED surfaces via Chromatic + axe-playwright operator-journey reuse + checkpoint:human-action for sender warming + DKIM/SPF/DMARC + Knock provisioning).

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
| Form authoring posture | Primitive-only. The 5 NEW components compose `.c-input`, `.c-button{,--*}`, `.c-field` + `.c-field__{label,help,error}`. No bespoke form CSS. ChannelProgramsList kanban filter chip group composes `.c-chip` (NOT custom buttons). MessagingThreadsList "Open thread →" composes `.c-button--tertiary` mint-text. DeliverabilityWorkspace per-sender card composes `.c-card`. TemplateEditor preview pane composes `.c-card` with `.c-code-block` for HTML/MJML preview. ApprovalReviewPanel `Approve` / `Reject` / `Revoke` CTAs compose `.c-button--primary` / `.c-button--destructive` / `.c-button--secondary`. |
| Banner authoring posture | **Primitive-only (D-09b carry).** Every gating state (campaign awaiting approval, classifier finding severity='block', sender at_risk, suppression cap reached, dispatch paused mid-flight, frequency cap exceeded, jurisdiction mismatch, WhatsApp session expired, evidence TTL stale, recipient PII redacted) composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes anywhere in `components/markos/crm/outbound/` or `components/markos/operator/`. |
| Card authoring posture | `.c-card` default for ChannelProgramsList kanban cards, MessagingThreadsList per-row cards, DeliverabilityWorkspace per-sender cards, TemplateEditor preview/variable-inspector/bindings panels, ApprovalReviewPanel header card. **`.c-card--feature` is PROHIBITED in this phase** (D-13 carry: reserved for hero panels in 404-workspace + 213.5 marketing only). |
| PII display posture | All recipient-PII fields (CDP-resolved `primary_email` / `primary_phone` / `company_name` / `display_name`) render via `<PIIRedactedField />` extracted component (216-UI-SPEC §D-15) consuming `pii_classification` ENUM 5-value taxonomy from P221 IdentityProfile resolved via `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact`. Audit-log `event_type == 'identity_view'` mirrors `credential_view` pattern (every PII field render writes audit row to `markos_audit_log` P201 hash chain). `<PIIRedactedField />` `onCopy` interceptor MUST `preventDefault()` to block PII clipboard exfiltration. Surfaces: TemplateEditor preview pane (resolved sample recipient render), MessagingThreadsList per-row recipient name, ApprovalReviewPanel recipient sample list, DeliverabilityWorkspace suppression list (per-row recipient identifier). |
| Pricing display posture | All template `pricing_bindings[]` references render via `<Money fromPricingRecommendation={pr_id} />` recipe consuming P205 PricingRecommendation context XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel via `<PlaceholderBanner variant="billing_placeholder">` whenever pricing variable resolves through non-allowlisted accessor per D-27 + D-52. Phase 223 MUST NOT take pricing ownership. Zero hard-coded dollar/peso literals in template body or campaign subject. JBM `font-feature-settings: 'tnum' 1` (tabular-numerals) for all monetary preview columns + classifier finding metadata + deliverability rate columns. |
| Table authoring posture | **Vanilla `<table>` semantic only (D-14 carry).** ChannelProgramsList kanban (vanilla `<section>` per column + `<ul>` per card list), MessagingThreadsList queue (vanilla `<ul>` per owner group), DeliverabilityWorkspace sender list (vanilla `<table>` for posture metrics: bounce_rate / complaint_rate / reply_rate / open_rate / click_rate / sample_size columns), TemplateEditor variable inspector (vanilla `<table>` for variable-name → resolved-value rows), ApprovalReviewPanel triggerReason chips + classifierFindings list (vanilla `<ul>`). The `.c-table` primitive remains deferred to Phase 218+. |
| Placeholder posture | Future-substrate placeholders render `<PlaceholderBanner variant="future_phase_{N}_{slug}">` composing `.c-notice c-notice--info` with literal `[info] Awaiting Phase {N} translation` body. Active variants in this phase: `future_phase_224_conversion_surfaces` (TemplateEditor "Confirmation email for landing-page form" footer DEFERRED), `future_phase_225_attribution_journey_analytics` (ApprovalReviewPanel "Attribution preview" panel DEFERRED), `future_phase_226_sales_enablement` (TemplateEditor "AI-suggest subject line" CTA DEFERRED), `future_phase_223_admin_ui` (deep-link hooks on outbound-workspace.tsx to a future dedicated Channel Engine admin page tree). Pricing placeholders render `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel verbatim per 205 + 215 inheritance. |
| Server/client boundary (D-21 carry) | The 5 NEW + 2 P208 renderer components are **client components** (`'use client'`) per existing convention in `components/markos/crm/*` since they own interactive state (kanban filter chips with local state, thread row click → detail panel, deliverability sender selector, template variable input + preview re-render, approve/reject/revoke optimistic update, Morning Brief refresh interval, Approval Inbox row expansion). The CONSUMING pages remain **server components** by default per D-21; they fetch data via `requireHostedSupabaseAuth` + tenant-scoped supabase client and pass server-fetched data to the client components as props. The `outbound-workspace.tsx` EVOLVED parent shell is `'use client'` (existing convention). The `TimelineDetailView.tsx` EVOLVED file inherits its existing 222 `'use client'` directive. The server/client boundary is named in each component's file header comment per D-21. |

---

## Spacing Scale

Authoring rule: every `padding`, `margin`, `gap`, `inset` MUST cite a `--space-*` token. No arbitrary px. Off-grid values are auto-FAIL.

| Token | Value | DESIGN.md citation | Usage in this phase |
|-------|-------|--------------------|---------------------|
| `--space-none` | 0 | `spacing.none` | Reset margins on `<h1>`, `<h2>`, `<p>`, `<table>`, `<ul>`, `<ol>` |
| `--space-xxs` | 2px | `spacing.xxs` | Badge inner padding, status-dot offset, chip group adjacency, classifier-finding severity-chip stacking |
| `--space-xs` | 8px | `spacing.xs` | ChannelProgramsList kanban card inner gap, MessagingThreadsList per-row metadata gap, DeliverabilityWorkspace per-sender chip gap, TemplateEditor variable-row gap, ApprovalReviewPanel triggerReason chip group gap |
| `--space-sm` | 16px | `spacing.sm` | Card vertical rhythm, notice padding-block, table `th`/`td` padding-block, mobile horizontal page padding ≤ 640px, kanban column inner gap, MorningBriefChannelEntries section vertical gap |
| `--space-md` | 24px | `spacing.md` | Card padding (via `.c-card`), gap between component sections (ChannelProgramsList header → kanban; DeliverabilityWorkspace header → sender list; TemplateEditor preview → variables → bindings → classifier-findings), modal padding |
| `--space-lg` | 32px | `spacing.lg` | Inter-section gap within each component (kanban column-to-column gap on desktop; tab content padding in outbound-workspace evolution) |
| `--space-xl` | 48px | `spacing.xl` | Component vertical padding ≥ lg breakpoint |
| `--space-xxl` | 96px | `spacing.xxl` | Reserved — not used in this phase |

**Allowed exceptions (DESIGN.md documented):**
1. `1px` for hairline borders (`var(--color-border)`).
2. `2px` for focus ring width and offset (`var(--focus-ring-width)`, `var(--focus-ring-offset)`).
3. `4px` for `.c-notice` `border-inline-start` accent — composed via `.c-notice` primitive; modules never declare directly.
4. `max-width: 1280px` for cockpit container (`--w-container`). Each component renders within its parent page's container.
5. `max-width: 560px` for confirmation modals (`--w-modal`) — applies to ApprovalReviewPanel `Approve` / `Reject` / `Revoke` confirm modals (reuses 215 billing-correction modal recipe per inheritance) and TemplateEditor "Publish template" approval modal.
6. `44px` mobile touch target via `--h-control-touch` on `.c-button` and `.c-chip` for `(pointer: coarse)` viewports — already declared globally per 213.2 cross-cutting fix. **Critical:** MessagingThreadsList per-row tap targets MUST hit ≥44px on coarse pointers (mobile_priority=critical surface).

---

## Typography

All text MUST cite a token from DESIGN.md `typography.*`. Heading typography is JetBrains Mono. Body typography is Inter. No third typeface.

| Role | DESIGN.md token | CSS variables / class | Usage in this phase |
|------|-----------------|------------------------|---------------------|
| Component heading | `typography.h2` | `<h2>` inheriting globals: `var(--font-mono)` + `var(--fs-h2)` (1.953rem) + `var(--fw-semibold)` | Per-component `<h2>`: "Programs" (ChannelProgramsList), "Threads" (MessagingThreadsList), "Deliverability" (DeliverabilityWorkspace), "Template" (TemplateEditor), "Channel approval" (ApprovalReviewPanel), "Channel signals" (MorningBriefChannelEntries section heading), "Channel approvals" (ApprovalInboxChannelEntries section heading) |
| Section sub-heading | `typography.h3` | `<h3>` inheriting globals: `var(--font-mono)` + `var(--fs-h3)` (1.563rem) + `var(--fw-semibold)` | Sub-section headings (kanban column headers in ChannelProgramsList — verbatim status enum: "Draft" / "Pending approval" / "Approved" / "Scheduled" / "Dispatching" / "Dispatched" / "Paused" / "Cancelled" / "Completed" / "Failed"; "Reply pending" / "Open" / "Waiting" / "Escalated" / "Resolved" / "Blocked" group headers in MessagingThreadsList; "Sender" / "Posture (24h)" / "Suppression" sections in DeliverabilityWorkspace; "Preview" / "Variables" / "Bindings" / "Classifier findings" sections in TemplateEditor; "Trigger reasons" / "Classifier findings" / "Pricing refs" / "Evidence refs" / "Sample render" sections in ApprovalReviewPanel) |
| Inline sub-heading | `typography.h4` | `<h4>` inheriting globals: `var(--font-mono)` + `var(--fs-h4)` (1.250rem) + `var(--fw-medium)` | Filter group fieldset legends (`<legend>Class</legend>`, `<legend>Status</legend>`, `<legend>Owner</legend>` in ChannelProgramsList; `<legend>Channel</legend>`, `<legend>Status</legend>` in MessagingThreadsList; `<legend>Reputation</legend>` in DeliverabilityWorkspace; `<legend>Channel</legend>`, `<legend>Locale</legend>` in TemplateEditor) |
| Surface descriptor / lead | `typography.lead` | `.t-lead` utility: `var(--font-sans)` + `var(--fs-lead)` (1.250rem) + `var(--fw-regular)` + `color: var(--color-on-surface-muted)` | Per-component descriptor under `<h2>` |
| Body copy | `typography.body-md` | inherited via `<p>`, `<td>` from globals | Template content body preview, reply suggestion body, classifier finding description, suppression operator-note body |
| Eyebrow / `t-label-caps` | `typography.label-caps` | `.t-label-caps` utility / `.c-field__label` primitive | Kanban card eyebrow ("Campaign" / "Journey" / "Thread"), thread row eyebrow ("Reply pending" / "Open"), sender card eyebrow ("Sender"), template eyebrow ("Template"), approval row eyebrow ("Approval") |
| Metadata / timestamps | `typography.body-sm` | `.c-field__help` primitive: `var(--fs-body-sm)` (0.800rem) + `color: var(--color-on-surface-muted)` | `schedule_at`, `last_message_at`, `last_send_at`, `window_24h_start`, `created_at`, `approved_at`, `dispatched_at`, `paused_at`, classifier-finding `detected_at`, suppression `added_at` |
| Form error inline | `typography.body-sm` | `.c-field__error` primitive: `var(--fs-body-sm)` + `color: var(--color-error)` + `var(--font-mono)` + `::before content "[err] "` | Reason-capture modal validation (≥20 chars per 216 carry) on revoke approval reason + reject approval reason + suppression bulk add reason |
| Monetary values | `typography.code-inline` + `font-feature-settings: 'tnum' 1` | `.c-code-inline` primitive | Template `pricing_bindings[]` rendered preview (when allowlisted accessor resolves), Money preview in TemplateEditor |
| Deliverability rates | `typography.code-inline` + `font-feature-settings: 'tnum' 1` | `.c-code-inline` primitive | DeliverabilityWorkspace per-sender posture metrics (bounce_rate, complaint_rate, reply_rate, open_rate, click_rate, unsubscribe_rate as percentage with tabular numerals; reputation_score 0-100 integer; sample_size as integer with thousands separator); ChannelProgramsList per-card counters (delivered_count, opened_count, clicked_count, replied_count, bounced_count, complained_count, unsubscribed_count) |
| IDs / tokens | `typography.code-inline` | `.c-chip-protocol` primitive | `campaign_id`, `thread_id`, `journey_id`, `journey_run_id`, `sender_id`, `template_id`, `dispatch_run_id` (FK markos_agent_runs P207), `dispatch_attempt_id` (UUID per recipient per attempt for idempotency D-14), `approval_ref`, `audience_snapshot_id` (FK P221), `profile_id` (FK cdp_identity_profiles P221), `related_crm_id` (FK customer_360_records P222), `related_opportunity_id` (FK opportunities P222), `related_nba_id` (FK nba_records P222), `related_support_case_id`, `provider_message_id` (Resend/Twilio/Knock external IDs — NOT secrets per D-39), `source_event_ref` (single-thread shared ID per D-29 fan-out), `evidence_ref` (FK EvidenceMap P209), `pricing_recommendation_id` (FK P205), `agent_run_id`, `parent_template_id` (locale variant chain per D-28), `mutation_request_id`. Each chip surrounds the value with `[ ]` per `.c-chip-protocol::before/::after`. |

**Forbidden (auto-FAIL):**
- Any third typeface (not JetBrains Mono or Inter).
- Inline `font-size`, `font-weight`, `color` literals — use tokens only.
- Hard-coded dollar/peso amounts — use `<Money />` + `--fs-code` or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Banned-lexicon tokens (CLAUDE.md) — `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener); zero exclamation points in product surface copy. Banned-lexicon zero-match enforced at CI on **template body content_blocks + EmailCampaign subject + reply suggestion body + classifier-finding operator-note + sender warming notes + suppression operator-note** BEFORE `external.send` dispatch path AND BEFORE TemplateEditor "Publish template" save (per D-25 status transition draft → approved).

---

## Color

Composition target per DESIGN.md "Composition proportion" (must hold per component, measured by visual mass not file LOC):

| Range | Token group | Channel Engine component usage |
|-------|-------------|--------------------------------|
| 70–80% | `surface` + `surface-raised` | Component background (`--color-surface`); `.c-card` kanban cards, thread rows, sender cards, template panels, approval cards (`--color-surface-raised`) |
| 15–20% | `on-surface` + `on-surface-muted` + `on-surface-subtle` | All headings, body copy, table content, eyebrows, metadata, timestamps, kanban card eyebrows, deliverability rate labels |
| 3–5% | `primary` + `primary-text` | Single primary CTA per component state ("Open thread →" mint-text inline on MessagingThreadsList, "Open template →" / "Publish template" on TemplateEditor, "Approve" on ApprovalReviewPanel, "Open approval →" mint-text inline on Morning Brief / Approval Inbox renderers), focus rings, `.c-chip-protocol` IDs, `[ok]` glyph, kernel-pulse status dot on dispatching campaign + improving-trend chip on DeliverabilityWorkspace, `[up]` improving-trend glyph |
| 0–2% | `error` + `warning` + `info` + `success` | `.c-notice` banners, `.c-badge` row state, `[err]`/`[warn]`/`[info]`/`[ok]`/`[block]` glyphs, sender reputation_status color-coding (`warming` → `--color-info`; `healthy` → `--color-success`; `watch` → `--color-warning`; `at_risk` → `--color-error`), commercial_signal color-coding inherited from 222 (`risk` → `--color-error`; `pricing` → `--color-warning`; `support` → `--color-info`; `interest`/`expansion`/`renewal` → `--color-success`; `silence` → `--color-on-surface-subtle`), classifier-finding severity color-coding (`block` → `--color-error`; `flag` → `--color-warning`; `info` → `--color-info`) |

| Role | Token | DESIGN.md citation | Channel Engine component usage |
|------|-------|--------------------|--------------------------------|
| Component background | `--color-surface` (`#0A0E14` Kernel Black) | `colors.surface` | Every component wrapper; never `#000000` |
| Cards / panels | `--color-surface-raised` (`#1A1F2A` Process Gray) | `colors.surface-raised` | All `.c-card` instances across all 5 NEW + 2 P208 renderer components |
| Modal / popover surface | `--color-surface-overlay` (`#242B38`) | `colors.surface-overlay` | `.c-modal` confirm dialogs (ApprovalReviewPanel approve/reject/revoke modals; TemplateEditor "Publish template" approval modal — all reuse 215 billing-correction modal recipe per inheritance) |
| Hairline borders | `--color-border` (`#2D3441` Border Mist) | `colors.border` | All `.c-card` borders (1px), kanban column dividers, table `th`/`td` border-bottom, MessagingThreadsList per-row dividers, DeliverabilityWorkspace per-sender card border |
| Strong borders | `--color-border-strong` (`#3A4250`) | `colors.border-strong` | Composed via `.c-input` on hover/focus — not authored locally |
| Primary text | `--color-on-surface` (`#E6EDF3` Terminal White) | `colors.on-surface` | All headings, body copy, table content |
| Muted secondary text | `--color-on-surface-muted` (`#7B8DA6` Vault Slate) | `colors.on-surface-muted` | `.t-lead` descriptors, table `th` text, eyebrows (when not state-coded), metadata, timestamps |
| Subtle / disabled text | `--color-on-surface-subtle` (`#6B7785` Comment Gray) | `colors.on-surface-subtle` | `.c-input::placeholder`, dimmed `silence` commercial_signal rows, dimmed `cancelled`/`completed` kanban cards, dimmed `resolved`/`blocked` thread rows, dimmed inactive senders, dimmed historical template versions |
| Signal — single mint | `--color-primary` (`#00D9A3` Protocol Mint) | `colors.primary` | Primary CTA fills (one per component state), focus rings, `.c-status-dot--live` kernel-pulse on dispatching campaign + improving-trend chip on DeliverabilityWorkspace + reply_pending pulse on MessagingThreadsList top item, `[ok]` glyph |
| Mint as text (D-09 carry) | `--color-primary-text` | `tokens.css` line 186 | `.c-button--tertiary` text, `.c-chip-protocol` text, `[ok]` glyph color, `[up]` improving-trend glyph, "Open thread →" / "Open Customer360 →" / "Open NBA →" / "Open template →" / "Open approval →" / "View evidence →" / "Recompute posture →" / "Refresh queue →" inline action links. **Never as fill on surfaces larger than a button or chip** (DESIGN.md mint rule). |
| Mint subtle wash | `--color-primary-subtle` | `colors.primary-subtle` | `.c-button--tertiary:hover` background, `.c-chip--mint` background, `.c-chip--mint` improving-trend chip background |
| Error | `--color-error` (`#F85149`) | `colors.error` | `.c-notice c-notice--error` (classifier finding severity='block' on TemplateEditor; sender reputation_status='at_risk' on DeliverabilityWorkspace; campaign status='failed' on ChannelProgramsList; thread current_status='blocked' on MessagingThreadsList; approval status='rejected' on ApprovalReviewPanel; jurisdiction mismatch on dispatch skip; consent opted_out hard block; whatsapp_session_lost dispatch skip per D-54), `.c-button--destructive` (`Reject` on ApprovalReviewPanel; `Cancel campaign` on ChannelProgramsList; `Block sender` on DeliverabilityWorkspace), `.c-badge--error` (`commercial_signal == 'risk'` per 222 inheritance; sender `reputation_status == 'at_risk'`; thread `current_status == 'blocked'`; campaign `status == 'failed'`; classifier finding `severity == 'block'`; bounce hard event), `[err]` glyph, `.c-status-dot--error` (campaign dispatch failed; sender at_risk pulse) |
| Warning | `--color-warning` (`#FFB800`) | `colors.warning` | `.c-notice c-notice--warning` (classifier finding severity='flag'; sender reputation_status='watch'; campaign status='pending_approval'; deliverability spike detected per D-35 >2σ; soft-bounce promotion threshold reached; suppression list cap approaching; pricing-touching template publish requires approval), `.c-badge--warning` (`commercial_signal == 'pricing'` per 222; sender `reputation_status == 'watch'`; classifier finding `severity == 'flag'`; campaign `status == 'pending_approval'`; soft_bounce event; competitor mention finding), `[warn]` glyph, `[down]` declining-trend deliverability glyph |
| Success | `--color-success` (`#3FB950`) | `colors.success` | `.c-notice c-notice--success` (campaign approved; campaign dispatched successfully; sender reputation_status='healthy'; thread current_status='resolved'; suppression added from DSR; deliverability trend='improving'), `.c-badge--success` (`commercial_signal == 'interest'`/`'expansion'`/`'renewal'` per 222; sender `reputation_status == 'healthy'`; campaign `status == 'approved'` / `'dispatched'` / `'completed'`; thread `current_status == 'resolved'`; reply event with positive sentiment), `[ok]` glyph |
| Info | `--color-info` (`#58A6FF`) | `colors.info` | `.c-notice c-notice--info` (sender reputation_status='warming' — operator next-action: "send <500/day for 7 days"; campaign status='draft'; thread current_status='waiting' / 'open'; classifier finding severity='info' — competitor mention flag for review; lifecycle journey paused awaiting operator review; in_app message pending operator delivery on next nav per D-10), `.c-badge--info` (`commercial_signal == 'support'` per 222; sender `reputation_status == 'warming'`; thread `current_status == 'waiting'` / `'open'`; campaign `status == 'draft'` / `'scheduled'`; channel chip `email` / `messaging` source_domain per 222; `single_approval` mode chip), `[info]` glyph |

**Accent reserved-for list (the 3–5% mint slice):**
1. **Single primary CTA per component state** (`.c-button--primary`):
   - ChannelProgramsList: `Create campaign` (top-right header CTA when status filter='draft' or no filter); `Schedule dispatch →` mint-text inline link on per-card "Approved" status (when scheduled_at is null)
   - MessagingThreadsList: per-row `Open thread →` mint-text inline link; `Open Customer360 →` mint-text inline link when related_crm_id present; `Open NBA →` mint-text inline link when related_nba_id present (per 222 D-08)
   - DeliverabilityWorkspace: per-sender `Recompute posture →` mint-text inline link (delegates to Plan 06 cron `channels-deliverability-rollup` manual trigger); `Open suppression list →` mint-text inline link
   - TemplateEditor: `Publish template` primary CTA (when status='draft' AND classifier_findings does not contain severity='block'); `Save draft` secondary CTA; `Render preview` mint-text inline link; `Open evidence →` mint-text inline link per evidence_binding row
   - ApprovalReviewPanel: `Approve` primary CTA (gated by approval state); `Open subject →` mint-text inline link to the underlying campaign/journey/template; `View evidence →` mint-text inline link per evidence_ref
   - MorningBriefChannelEntries: per-row `Open thread →` mint-text inline link (top reply_pending threads); per-row `Open sender →` mint-text inline link (at_risk senders)
   - ApprovalInboxChannelEntries: per-row `Open approval →` mint-text inline link (deep-link to ApprovalReviewPanel for the entry's approval_ref)
   - outbound-workspace.tsx (EVOLVED): tab-bar active-tab indicator (mint underline on selected tab)
2. Focus rings — globally inherited; never suppressed in module.css.
3. Protocol chip text — `.c-chip-protocol` for all 22 ID classes (campaign_id, thread_id, journey_id, journey_run_id, sender_id, template_id, dispatch_run_id, dispatch_attempt_id, approval_ref, audience_snapshot_id, profile_id, related_crm_id, related_opportunity_id, related_nba_id, related_support_case_id, provider_message_id, source_event_ref, evidence_ref, pricing_recommendation_id, agent_run_id, parent_template_id, mutation_request_id).
4. Status dot live — `.c-status-dot--live` on dispatching campaigns (kernel-pulse on ChannelProgramsList per-card when status='dispatching') + improving-trend chip on DeliverabilityWorkspace (when trend='improving') + reply_pending top item on MessagingThreadsList.
5. `[ok]` and `[up]` glyphs.
6. `::selection` — global.

**NOT used as fill anywhere:** card borders, table headers, page background, body copy, kanban-card eyebrows, sender-card backgrounds, template-preview backgrounds (these use `.c-badge--{state}` per status class, NOT mint). Mint is the Channel Engine workspace's single signal — every other affordance is token-only neutral or state-class.

---

## Inheritance Bindings (load-bearing)

Every approval, dispatch, mutation, pricing, classification, evidence, consent, and grounding field rendered in any 223 surface MUST cite the upstream contract verbatim. Auto-FAIL: any field name re-derived without citation; any state literal not enumerated below; any approval gate omitting 206 mutation-class binding; any pricing render that hard-codes a literal or tier-name string; any credential render that violates §Sensitive Credential UI Binding (Layer 6); any consent render that bypasses P221 setConsentState single writer; any `createApprovalPackage` reference (must be `buildApprovalPackage` per D-43).

### From 205-UI-SPEC §Pricing Engine ownership (P223 must NOT take pricing ownership)

| 223 surface element | 205 contract source | Binding |
|---------------------|---------------------|---------|
| Template `pricing_bindings[]` rendered preview (TemplateEditor) | `PricingRecommendation` (205-01-CONTRACT-LOCK) | `<Money fromPricingRecommendation={pr_id} />` recipe XOR `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel via `<PlaceholderBanner>`. Zero hard-coded dollar literals. Resolved server-side via `template.pricing_bindings[].pr_id` FK ONLY when classifier (D-52) confirms allowlisted accessor. |
| EmailCampaign subject line containing pricing pattern | 205-UI-SPEC §sentinel + per D-27 | `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim until Pricing Engine context attached; classifier finding severity='block' on pricing_text_scan blocks dispatch |
| ApprovalReviewPanel `pricingRefs` panel | 205 + 215 §sentinel | Each pricing_ref rendered as `<.c-chip-protocol>` `pricing_recommendation_id` + `<.c-badge--info>` allowlisted accessor name + `<Money>` resolved value; sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim when accessor not allowlisted |

### From 206-UI-SPEC §Mutation-class doctrine

| 223 surface element | 206 contract source | Binding |
|---------------------|---------------------|---------|
| Channel dispatch trigger (campaign dispatch / messaging send / lifecycle journey run-step / bulk send) | `external.send` root + `single_approval` (when class IN ('broadcast','revenue') OR audience_size >= 500 OR re-engagement >90d OR lifecycle_stage='lost' per D-18) | Modal carries `.c-chip-protocol` "Root: `external.send`"; reason capture (≥20 chars per 216 carry); `evidence_pack_ref` REQUIRED when `external.send`; calls `buildApprovalPackage(kind='channel_dispatch_approval', ...)` per D-43 (NEVER `createApprovalPackage`) |
| Template publish (TemplateEditor "Publish template" CTA when status='draft' → 'approved') | `external.send` indirect (templates feed dispatch) + `single_approval` when content_classifier finding severity='block' on pricing_binding/factual_claim OR `dual_approval` when both pricing_binding AND factual_claim block | Modal renders `.c-chip-protocol` "Root: `channel.template_publish`"; reason capture (≥20 chars); classifier_findings rendered via `<ClassifierChipRow />`; pricingRefs rendered via `<Money>` XOR sentinel; calls `buildApprovalPackage(kind='channel_template_publish_approval', ...)` per D-43 |
| Suppression bulk add (DeliverabilityWorkspace "Bulk add suppressions" CTA when count > 100) | `external.send` indirect (suppression blocks dispatch) + `single_approval` per D-32 | Modal renders cascade target counts + DSR-source flag; `<PIIRedactedField />` per affected recipient row; calls `buildApprovalPackage(kind='channel_suppression_bulk_approval', ...)` per D-43 |
| Approval revocation mid-dispatch (ApprovalReviewPanel "Revoke" CTA when campaign.status='dispatching') | `external.send` interrupt + `single_approval` per D-17 (approval revocation pre-dispatch flips status approved→pending_approval; mid-dispatch sends pause signal to AgentRun) | Modal renders `<RunStatusBadge run_id={dispatch_run_id}>` (P207) + recipients_already_sent counter + remaining_recipients counter; reason capture (≥20 chars); calls `buildApprovalPackage(kind='channel_program_pause_approval', ...)` per D-43; on confirm sends pause signal via P207 AgentRun pause API |
| Sender_identity verification update (DeliverabilityWorkspace "Mark sender verified" CTA — admin path) | `external.send` indirect + `single_approval` per D-32 | Modal renders DKIM/SPF/DMARC current values + reason capture; calls `buildApprovalPackage(kind='channel_dispatch_approval', subject_type='sender_identity', ...)` per D-43 |
| Autonomy ceiling reached (channel dispatch when external.send triggers without approval_ref) | `mutation-class-policy.md` autonomy_ceiling | `.c-notice c-notice--error` `[block] Autonomy ceiling reached for channel_dispatch_approval` above the dispatch CTA on ChannelProgramsList per-card |

### From 207-UI-SPEC §Orchestration substrate

| 223 surface element | 207 contract source | Binding |
|---------------------|---------------------|---------|
| Dispatch run lineage (ChannelProgramsList per-card + ApprovalReviewPanel) | `RunApiEnvelope` (207-01) | Every campaign/journey/thread row renders `<RunStatusBadge run_id={dispatch_run_id}>` (P207); dispatching campaigns render `<.c-status-dot--live>` kernel-pulse; failed campaigns render `<.c-badge--error>` "[err] Dispatch failed" with link to `<RunDetailLink run_id={dispatch_run_id}>` |
| Recipient handler run lineage (MessagingThreadsList per-row when single-message send) | `RunApiEnvelope` | Every messaging send row renders `<.c-chip-protocol>` `dispatch_attempt_id` (UUID per recipient per attempt for idempotency D-14); failed attempts after retry render `<.c-badge--error>` "[err] Send failed after 3 attempts" |
| Lifecycle journey run lineage (ChannelProgramsList per-card when type='lifecycle_journey') | `RunApiEnvelope` | Every journey row renders `<.c-chip-protocol>` `journey_run_id` + current_step indicator + due_at timestamp; paused journeys render `<.c-notice c-notice--info>` "[info] Journey paused at step {N} pending operator review" |
| 5 cron handler run lineage (Plan 06) | `RunApiEnvelope` + `AgentFailureClass` 7 literals | DeliverabilityWorkspace per-sender `last_rollup_at` derived from `channels-deliverability-rollup` cron; MessagingThreadsList per-row `last_journey_advance_at` derived from `channels-lifecycle-journey-poll`; spike alerts surface in MorningBriefChannelEntries via `channels-bounce-spike-alert`; suppression rows from `channels-tombstone-cascade` (P221 D-24) + `channels-soft-bounce-promote` annotated with `cron_run_id` chip |
| AgentRunEventType registration | `AgentRunEventType` (207-02) | All 23 NEW event types registered (see frontmatter `parent_doctrine_chain` 207 entry); each rendered as channel-event-chip on the relevant component |
| D-15-revised hard-fail upstream gate | `assertUpstreamReady(['P207'])` per D-45 | `createDispatchRun` calls `assertUpstreamReady(['P207'])` and throws `UpstreamPhaseNotLandedError` if `markos_agent_runs` table absent. NO bridge stub. NO `workflow.agentrun_v2_available` config flag (rejected per D-15-revised). UI surfaces NEVER attempt to call dispatch when P207 absent. |

### From 208-UI-SPEC §PARENT cockpit pattern

| 223 surface element | 208 contract source | Binding |
|---------------------|---------------------|---------|
| Approval Inbox handoff_kind filter chips extension | 208-04 + 220 26th + 221 27/28/29 + 222 30/31/32nd literals | **36 chips total** post-223: 4 P207 + 5th P214 + 6th P215 + 7-8th P216 + 9-20th P218..P220 (12 active) + 21st P220 partner_payout_export_approval + 22-26th P220 placeholders + 27th P221 consent_drift_resolution + 28th P221 audience_activation_approval + 29th P221 dsr_export_approval + 30th P222 crm360_nba_execute_approval + 31st P222 crm360_lifecycle_transition_approval + 32nd P222 crm360_tombstone_cascade_approval + **33rd P223 `channel_dispatch_approval`** + **34th P223 `channel_template_publish_approval`** + **35th P223 `channel_suppression_bulk_approval`** + **36th P223 `channel_program_pause_approval`**. 223 ADDS 4 new literals. Row rendering ships in 223-05 via `ApprovalInboxChannelEntries.tsx` renderer. |
| Morning Brief rollups | 208-02 + D-35 carry | `MorningBriefChannelEntries.tsx` renderer ships in 223-05 — adds 2 channel-related rollup sections to existing 208-02 Morning Brief: (1) "Reply pending threads" — top 5 reply_pending threads where `owner_user_id == current_operator_user_id` (per D-23); per-row renders `<.c-chip>` channel kind + `<PIIRedactedField />` recipient name + `last_message_at` timestamp + `[warn]` glyph if escalated + `Open thread →` mint-text inline link to MessagingThreadsList row. (2) "At-risk senders" — all senders with reputation_status='at_risk' across tenant; per-row renders `<.c-badge--error>` reputation_status + sender label + concrete operator next-action ("Pause broadcast class until reputation recovers"); `Open sender →` mint-text inline link to DeliverabilityWorkspace per-sender card. |
| Approval Inbox row rendering (channel entry types) | 208-04 + D-35 | `ApprovalInboxChannelEntries.tsx` renderer ships in 223-05 — renders 4 entry types (`email_campaign` / `lifecycle_journey` / `channel_template` / `channel_suppression_bulk` / `channel_program_pause`); per-row renders `<.c-chip>` handoff_kind chip + `<.c-badge>` triggerReason chips (e.g., `class_broadcast`, `count_500_plus`, `content_classifier_block`, `re_engagement_90d`, `manual_override`) + `<PIIRedactedField />` recipient sample + audience_snapshot_id chip + `Open approval →` mint-text inline link to ApprovalReviewPanel. |
| CRM reporting cockpit | D-29 + Plan 05 carry | `lib/markos/crm/reporting.ts` gains `computeChannelProgramRollup` (campaigns by status by class) + `computeMessagingThreadRollup` (threads by reply_pending count by owner) + `computeDeliverabilityRollup` (senders by reputation_status). Existing P105 reporting cockpit consumes additively; 223 does NOT modify the cockpit UI itself. |
| Mobile priority registration | 208-01 mobile_priority literals | All 9 surfaces register in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: channels_*`; **MessagingThreadsList + MorningBriefChannelEntries are `critical`**; 7 surfaces `secondary` |

### From 209-UI-SPEC §Evidence + claim safety

| 223 surface element | 209 contract source | Binding |
|---------------------|---------------------|---------|
| Template `evidence_bindings[]` rendering (TemplateEditor "Bindings" panel) | EVD-01 + EVD-04 | Template `evidence_bindings[]` (FK → EvidenceMap) rendered via `<KbGroundingPanel />` extracted component (216 §D-15 — REUSED here); top-3 sources with `chunk_id` chips, `source_type` badge, `relevance_score` badge, `claim_ttl_remaining` countdown; aggregate `confidence` notice. Classifier finding severity='block' on evidence_ttl when claim TTL expired. |
| ApprovalReviewPanel `evidenceRefs` panel | EVD-05 | Each evidence_ref rendered as `<.c-chip-protocol>` evidence_ref UUID + `<KbGroundingPanel />` preview + `<.c-badge--info>` claim_ttl_status + `View evidence →` mint-text inline link to `/evidence/{evidence_ref}` (existing P209 surface) |
| Classifier finding rendering (TemplateEditor "Classifier findings" overlay) | EVD-02 | `<ClassifierChipRow />` (216 §D-15) renders 5 finding kinds: `pricing_binding` / `pricing_text_scan` / `pricing_ast_violation` / `evidence_ttl` / `competitor_mention`; per-finding `<.c-badge>` severity (`block` → `--color-error`; `flag` → `--color-warning`; `info` → `--color-info`); per-finding `<.c-code-block>` AST violation excerpt with `@babel/parser` line/col reference (per D-52); aggregate `blocks_dispatch: boolean` notice (when true → `<.c-notice c-notice--error>` "[err] Template publish blocked — resolve {N} severity=block findings before save") |
| Banned-lexicon zero-match | 213-04 + 216 §banned-lexicon | CI assertion enforces zero-match on template body content_blocks + EmailCampaign subject + reply suggestion body + classifier-finding operator-note + sender warming notes + suppression operator-note BEFORE TemplateEditor "Publish template" save AND BEFORE `external.send` dispatch path; runs `scripts/marketing-loop/check-banned-lexicon.mjs` server-side. |

### From 213-UI-SPEC §Tenant 0 readiness gate consumer

| 223 surface element | 213 contract source | Binding |
|---------------------|---------------------|---------|
| 223 substrate is PRIVATE doctrine | 213-04 §Public-Proof Boundary | All UUIDs (campaign_id, thread_id, journey_id, sender_id, template_id, dispatch_run_id, dispatch_attempt_id, approval_ref, audience_snapshot_id, evidence_ref, pricing_recommendation_id, agent_run_id, provider_message_id) MAY be cited in case-studies via `<.c-chip-protocol>`; outcome content (campaign body, template content_blocks, reply intelligence body, classifier-finding text, sender warming notes, suppression operator-note, recipient PII, raw email/phone/NIT/company_name, commercial_signal classification) is NEVER published. Banned-phrases (`unlimited`, `instant`, `guaranteed`, `100%`, `bank-grade`, `military-grade`) zero-match enforced. |
| Tenant 0 readiness gate consumer | 213-05 go/no-go | Phase 223 does NOT directly render the tenant_0 gate; existing CRM outbound page tree continues to consume the gate via existing layout chrome. |

### From 214-UI-SPEC §PARENT — SaaS Suite Activation

| 223 surface element | 214 contract source | Binding |
|---------------------|---------------------|---------|
| CDP profile read for dispatch eligibility | 214 §SaaS bridge + D-44 | `lib/markos/cdp/adapters/crm-projection.ts::getProfileForContact` (P221-owned per D-44) is the canonical reader — channel dispatch NEVER stores identity/consent/trait data, ONLY consumes via adapter. The 214 `<SaaSActivationPanel />` is NOT directly composed in 223 surfaces. |
| Architecture-lock D-32 | 214-06 §architecture-lock | All 223 routes are LEGACY `api/*.js` flat per D-42; helper canon `buildApprovalPackage` per D-43 |

### From 215-UI-SPEC §PARENT — SaaS Billing + Sensitive Credential UI Binding

| 223 surface element | 215 contract source | Binding |
|---------------------|---------------------|---------|
| Sensitive Credential UI Binding (Layer 6) | 215 §6-layer defense-in-depth | **Inherited verbatim**. Provider secrets (RESEND_API_KEY / TWILIO_AUTH_TOKEN / KNOCK_API_KEY) NEVER rendered in any UI surface (D-39); MCP tool responses sanitized via existing `sanitizeBillingResponse` + new `sanitizeProviderSecretResponse`. |
| Sentinel discipline | 215 §sentinel + 216 §save-offer | `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim via `<PlaceholderBanner variant="billing_placeholder">` whenever template pricing_bindings resolves through non-allowlisted accessor per D-27 + D-52 |
| 5 PII field constants | 215-01 `lib/markos/saas/billing/log-redaction.ts` | All STRIPE_PII_FIELDS, MP_PII_FIELDS, QB_PII_FIELDS, SIIGO_PII_FIELDS, DIAN_PII_FIELDS render `[REDACTED]` via `<PIIRedactedField />`. Webhook payloads (Resend/Twilio/Knock inbound) logged as `payload_redacted` only. |
| 215 billing-correction modal recipe | 215 + 216 §approval handoff filter chip set | REUSED VERBATIM for all 4 NEW 223 approval kinds: `channel_dispatch_approval` AND `channel_template_publish_approval` AND `channel_suppression_bulk_approval` AND `channel_program_pause_approval`; modal renders `<PricingContextChip />` (when `pricing_bindings[]` present), `<PIIRedactedField />` per recipient PII row, audit log preview, classifier_findings panel |

### From 216-UI-SPEC §PARENT — SaaS Health/Churn/Support/Usage

| 223 surface element | 216 contract source | Binding |
|---------------------|---------------------|---------|
| Health score rendering (dispatch priority gate + MessagingThreadsList per-row) | 216 §UI Binding Contract 1 | `<HealthScoreBadge />` extracted component (D-15 — REUSED here) on MessagingThreadsList per-row when related_crm_id resolves to Customer360 with health_score (reply_pending priority bias); ApprovalReviewPanel header when subject is reply-related approval |
| Risk band rendering | 216 §UI Binding Contract 1 | `<RiskBandBadge />` extracted component on MessagingThreadsList per-row + DeliverabilityWorkspace per-sender at_risk indicator |
| Trend rendering (deliverability trend on DeliverabilityWorkspace) | 216 §UI Binding Contract 1 | 4 trend literals + bracketed glyph: `improving` `[up]` mint, `stable` `[flat]` neutral, `degrading` `[down]` warning, `watch` `[warn]` warning |
| Recompute posture CTA (DeliverabilityWorkspace) | 216 §UI Binding Contract 1 inherited pattern | `.c-button--secondary` "Recompute posture"; emits AgentRun `kind='channels-deliverability-rollup'` (manual trigger of Plan 06 cron); success state `<.c-notice c-notice--success>` "[ok] Posture recomputed for sender {sender_label}"; failure state `<.c-notice c-notice--error>` "[err] Posture recompute failed — {error_message}" |
| Classifier rendering (TemplateEditor + TimelineDetailView per-channel-event-row) | 216 §UI Binding Contract 2 | `<ClassifierChipRow />` extracted component (216 §D-15 — REUSED) on TemplateEditor "Classifier findings" overlay AND on TimelineDetailView per-channel-event-row chip rendering |
| KB grounding panel (TemplateEditor + ApprovalReviewPanel) | 216 §UI Binding Contract 2 | `<KbGroundingPanel />` extracted component on TemplateEditor "Bindings" panel AND on ApprovalReviewPanel `evidenceRefs` panel |
| 5 PII classification badges | 216 §UI Binding Contract 4 | `<RetentionClassChip />` extracted component on every PII-displaying surface; renders `pii_classification` ENUM literal: `no_pii`, `pseudonymous`, `personal`, `sensitive`, `highly_sensitive` |
| PII redacted field | 216 §UI Binding Contract 4 | `<PIIRedactedField />` extracted component on CDP-resolved recipient identity (resolved via P221 adapter); renders `[REDACTED]` placeholder via `.c-code-inline` + `--color-on-surface-subtle` |

### From 217-UI-SPEC §PARENT — SaaS Suite Revenue + Heavy-UI Pattern

| 223 surface element | 217 contract source | Binding |
|---------------------|---------------------|---------|
| D-15 selective extraction recipe | 217-06 §D-15 | The 7 components first consumed in 217-06 (`<HealthScoreBadge />`, `<RiskBandBadge />`, `<KbGroundingPanel />`, `<SaveOfferPricingBlock />`, `<RetentionClassChip />`, `<PIIRedactedField />`, `<ClassifierChipRow />`) are REUSED in 223 surfaces — NOT re-implemented. 223 Storybook stories register UNDER `Channels/*` path and IMPORT the extracted components. |
| D-21 server/client boundary | 217-06 §D-21 carry | The 5 NEW + 2 P208 renderer + 2 EVOLVED components live under `components/markos/crm/outbound/*` + `components/markos/operator/*` + `components/markos/crm/*`; all 9 surfaces are CLIENT components (`'use client'`); CONSUMING `app/(markos)/crm/**` page tree pages remain server-component default. |
| D-32 architecture-lock | 217-06 §architecture-lock | All 223 routes are LEGACY `api/*.js` flat per D-42; auth via `requireHostedSupabaseAuth` per D-42; tests `*.test.js` only per D-46; OpenAPI at `contracts/openapi.json` per D-47; MCP registry at `lib/markos/mcp/tools/index.cjs` per D-48; cron at `api/cron/*.js` with `x-markos-cron-secret` per D-49; helper canon `buildApprovalPackage` per D-43 |

### From 220-UI-SPEC §PARENT — Community/Events/PR/Partnership/DevRel/Growth

| 223 surface element | 220 contract source | Binding |
|---------------------|---------------------|---------|
| 220 outbound substrate dissolves at dispatch substrate layer | 220-06 closeout + 223-CONTEXT line 18 | 220 community/events/PR/partnership outbound substrate (legacy 211 dispatch substrate carry-forward) DISSOLVES — 220 program model patterns DEFER to 223 channel program models for any owned-channel outreach. 220 mutation classes remain in P208 chain but the DISPATCH path now goes through 223 ChannelProgramsList + ApprovalReviewPanel via the `external.send` mutation root. |
| 220 mutation classes inherited | 220-06 closeout | 220 mutation classes remain registered in `mutation-class-policy.md`; 223 dispatch paths reuse the same `external.send` root + `single_approval` posture |

### From 221-UI-SPEC §PARENT — CDP Substrate

| 223 surface element | 221 contract source | Binding |
|---------------------|---------------------|---------|
| ConsentState SOR cutover | 221 D-12 mandate + 223 D-11 + D-51 | Full cutover lands in P223 — `outboundConsentRecords` becomes derived view backed by `cdp_consent_states` (P221 SOR) per migration 119. Per D-51: cutover is HARD via DB trigger — BEFORE INSERT/UPDATE trigger on `outbound_consent_records_legacy` blocks direct legacy writes (RLS rejected because service-role bypasses); only `setConsentState` (P221) sets the `app.consent_writer_source = 'p221_setConsentState'` GUC that the trigger inspects. NO `workflow.outbound_consent_legacy_view` config flag fallback (rejected per D-51). UI surfaces NEVER write directly to consent table. |
| Audience double-gate at dispatch | 221 D-18 + 223 D-19 | Per-recipient 6-layer gate at send time: (1) ConsentState lookup via `getConsentState(profile_id, channel)` from P221 adapter; (2) Suppression list check (`channel_suppressions`); (3) **WhatsApp 24-hour session window check** (per D-54: MUST run BEFORE quiet-hours; defer-past-session is fail-closed `reason='whatsapp_session_lost'`); (4) Frequency cap check via DB trigger per D-50 (BEFORE INSERT ON dispatch_events; counts rolling-window per (profile_id, channel, marketing_class); rejects when over cap; tenant-configurable via `tenant_config.frequency_caps[channel]`); (5) Quiet hours check (recipient timezone from CDP TraitSnapshot + ConsentState quiet_hours window); (6) Jurisdiction check (tenant config matrix). Skipped recipients write `dispatch_skips` audit row with `gate_failed` reason; ChannelProgramsList per-card surfaces skip counts. |
| CDP events emit on channel mutation | 221 D-08 + 223 D-29 fan-out emit | Channel dispatch events emit `EventEnvelope` rows to `cdp_events` with `event_domain='email'|'messaging'` + shared `source_event_ref` threading channel events ↔ cdp_events ↔ EvidenceMap (P209) ↔ crm_activity (P222). Per D-29 single fan-out emit() function in `lib/markos/channels/events/emit.ts`: writes 5 destinations transactionally (cdp_events + crm_activity + aggregate-counter + dispatch_events + setConsentState if consent-affecting); fail-closed: any step fails → full rollback. |
| CDP tombstone cascade propagation to suppressions | 221 D-24 + 223 D-21 | Profile tombstone → channel_suppressions row added across all 5 channels (cron `channels-tombstone-cascade.js` Plan 06). DeliverabilityWorkspace surfaces tombstone-sourced suppressions with `[info]` glyph + "DSR cascade" badge. |
| AudienceSnapshot consumed at dispatch | 221 D-19 audience snapshot audit | EmailCampaign `audience_snapshot_id` FK → P221 `cdp_audience_snapshot_memberships` consumed at dispatch; ChannelProgramsList per-card renders `<.c-chip-protocol>` audience_snapshot_id + audience_size badge + `Open audience →` mint-text inline link to `/cdp/audiences/{audience_snapshot_id}` (P221 surface) |

### From 222-UI-SPEC §PARENT — CRM Timeline + Commercial Memory

| 223 surface element | 222 contract source | Binding |
|---------------------|---------------------|---------|
| TimelineDetailView extension for channel events (D-34) | 222 D-25 + 223 D-34 | TimelineDetailView (P222 D-25 — first shipped in 222-03; EVOLVED in 223-05) gains channel-event-chips section per row when source_domain IN ('email','messaging','push','in_app'). Chips render: opened (`[ok]` + green), clicked (`[ok]` + green), replied (`[ok]` + sentiment-coded), bounced (`[err]` + red), complained (`[err]` + red), unsubscribed (`[warn]` + warning), suppressed (`[block]` + neutral). Chips read from `dispatch_events` keyed on `source_event_ref` (per D-29 fan-out). Click chip → opens lightweight detail pop showing `<.c-chip-protocol>` `dispatch_attempt_id` + `provider_message_id` (NOT secrets — public IDs per D-39). |
| commercial_signal taxonomy (7-enum) | 222 D-05 | D-29 fan-out emit() commercial_signal mapping: open→interest, click→interest, reply (positive)→interest, reply (negative)→risk, bounce→risk, complaint→risk, unsubscribe→risk. ChannelProgramsList per-card aggregate counter rollup respects 7-enum. MessagingThreadsList per-row sentiment chip uses 222 sentiment 3-enum (positive/neutral/negative) verbatim. |
| source_domain 11-enum | 222 D-05 | TimelineDetailView channel-event-chips render source_domain chip with verbatim labels — `email` (Resend), `messaging` (Twilio SMS/WhatsApp + Knock push + in_app). Per D-29 fan-out emit() writes `cdp_events.event_domain='email'|'messaging'` per channel kind. |
| messaging_threads.related_crm_id link | 222 D-03 | MessagingThreadsList per-row "Open Customer360 →" mint-text inline link when `related_crm_id` present (FK → `customer_360_records`); ApprovalReviewPanel header renders `<.c-chip-protocol>` related_crm_id when subject is a reply-related approval |
| messaging_threads.related_nba_id link | 222 D-08 | MessagingThreadsList per-row "Open NBA →" mint-text inline link when `related_nba_id` present (FK → `nba_records` — nullable); deep-link to NBAExplainPanel for the row's nba_id |
| D-15 reuse manifest VERBATIM | 222 §D-15 reuse manifest | The 7 components first consumed in 217-06 + REUSED in 222 are REUSED in 223 (NOT re-implemented). 223 Storybook stories register UNDER `Channels/*` path and IMPORT the extracted components from their 217-06 origin. |

### From 213.4-VALIDATION.md (carry-forward decisions)

| Decision | Phase 223 enforcement |
|----------|----------------------|
| **D-08** (token-only) | Zero inline hex literals in any of `components/markos/crm/outbound/*.{tsx,module.css}` + `components/markos/operator/*.tsx` + EVOLVED files. Every color via `var(--color-*)`. Every spacing via `var(--space-*)`. Every typography via DESIGN.md `typography.*`. Auto-FAIL on any `#[0-9a-fA-F]` literal. The closeout `architecture-lock-rerun.test.js` (Plan 06) asserts zero matches. |
| **D-09** (mint-as-text) | `[ok]` and `[up]` glyph color, all action-link inline CTAs, all `.c-chip-protocol` IDs use `--color-primary-text`. Mint never used as fill on kanban-card, thread-row, sender-card, template-preview, approval-card, or any surface > button or chip. |
| **D-09b** (`.c-notice` mandatory) | Every gating state composes `<div class="c-notice c-notice--{state}">`. Zero local `.banner`/`.alert`/`.warning`/`.callout` classes. |
| **D-13** (`.c-card--feature` reserved) | **Forbidden in this phase.** All cards use `.c-card` default. |
| **D-14** (no `.c-table` primitive) | All 5 NEW + 2 P208 renderer components use vanilla `<table>` / `<ol>` / `<ul>` semantic + token-only recipe + `.c-badge--{state}`. |
| **D-15** (selective extraction) | The 7 extracted components first consumed in 217-06 + REUSED in 222 are REUSED in 223 (NOT re-implemented). Storybook stories register `Channels/{ChannelProgramsList,MessagingThreadsList,DeliverabilityWorkspace,TemplateEditor,ApprovalReviewPanel}` named-state CSF3 stories (≥4 per component; TemplateEditor adds ClassifierFindings + PricingFlagged variants for ≥6). Plan 06 ships `chromatic.config.json` covering all 5. |
| **D-21** (server/client boundary) | The 5 NEW + 2 P208 renderer + 2 EVOLVED components are **client components** (`'use client'`). The CONSUMING pages remain **server components** by default. The boundary is named in each component's file header comment. |

---

## Sensitive Credential UI Binding (Layer 6 — inherited verbatim from 215, EXTENDED to recipient PII per 216 + provider-secret enforcement per D-39)

This section inherits 215-UI-SPEC §Sensitive Credential Handling — UI Binding Contract verbatim. It applies to TemplateEditor (preview pane resolves CDP IdentityProfile recipient PII per D-26), MessagingThreadsList (per-row recipient name from related_crm_id + CDP IdentityProfile), ApprovalReviewPanel (recipient sample list rendering), DeliverabilityWorkspace (suppression list per-row recipient identifier), MorningBriefChannelEntries (reply_pending threads recipient name).

### Defense-in-depth posture (6 layers — 215 ships layers 1-5; 223 surfaces enforce Layer 6 + provider-secret extension)

| Layer | Component | Provider | Enforcement |
|-------|-----------|----------|-------------|
| 1. Storage | P221 `cdp_identity_profiles` PII columns + provider API keys in env (`RESEND_API_KEY` / `TWILIO_AUTH_TOKEN` / `KNOCK_API_KEY`) | 221-01 + Plan 04 task 1 | Plaintext recipient PII never persisted in 223 tables; only `profile_id` UUID + P221 reads via adapter. Provider secrets never persisted in DB; env-only access via `process.env.*` in adapter modules. |
| 2. DB-trigger | P221 consent-write trigger (D-51) + frequency-cap trigger (D-50) on `dispatch_events` | 223-02 migration 119 + 121 | INSERT direct to `outbound_consent_records_legacy` blocked at DB level (only `setConsentState` writer); INSERT to `dispatch_events` over frequency cap blocked at DB level. |
| 3. MCP sanitization | `sanitizeProviderSecretResponse` (NEW — Plan 04 task 1) + `sanitizeCdpResponse` (P221 — `pii-guard.cjs`) | 223-04 + 221-05 | All MCP tool output strips RESEND_API_KEY, TWILIO_AUTH_TOKEN, KNOCK_API_KEY, RESEND_SIGNING_SECRET, TWILIO_AUTH_TOKEN webhook hash + raw recipient PII. The 5 P223 MCP tools (`send_email_program`, `send_messaging`, `get_thread`, `get_deliverability_posture`, `list_pending_approvals`) sanitize CDP-resolved PII via P221 pii-guard + provider secrets via new sanitizer. |
| 4. Log redaction | `redactWebhookPayload` (extended for Resend inbound metadata-only payload per Pitfall 9 — fetches body via Resend Received Emails API D-22) | 215-01 + 223-04 | Webhook payloads (Resend/Twilio/Knock inbound) logged as `payload_redacted` only; reply body fetched via authenticated Resend Received Emails API call (Pitfall 9 + A11). |
| 5. Prompt-injection defense | `stripCredentialsForLLM` (P215) + classifier banned-lexicon zero-match BEFORE template publish AND BEFORE dispatch | 215-01 + 223 §banned-lexicon | LLM context filtered upstream of any agent prompt; template body + EmailCampaign subject + reply suggestion body checked at CI before publish + dispatch. |
| **6. UI surface enforcement** | **All 5 NEW + 2 P208 renderer + 2 EVOLVED components consuming recipient PII + provider secrets** | **THIS PHASE** | **Bindings B-1..B-9 below (B-9 NEW for provider secrets per D-39)** |

### UI binding contract for 223 surfaces consuming 215/216/221 PII + provider secrets (verbatim from 215, extended)

| Binding | Rule | Verification |
|---------|------|--------------|
| **B-1. Allowed display fields** | Render ONLY: campaign_id + thread_id + journey_id + sender_id + template_id + dispatch_run_id + dispatch_attempt_id + approval_ref + audience_snapshot_id + provider_message_id (public ID) + source_event_ref + status enum + counters (delivered_count, opened_count, etc.) + reputation_score + bounce_rate + sample_size + last_message_at + sentiment chip + commercial_signal chip + channel kind chip. NEVER render: raw recipient `display_name` / `primary_email` / `primary_phone` / `company_name` (use `<PIIRedactedField />`); raw provider API keys; raw webhook signing secrets; raw provider HMAC payloads. | Architecture-lock test asserts `grep -P '\b(RESEND_API_KEY=|TWILIO_AUTH_TOKEN=|KNOCK_API_KEY=|primary_email|primary_phone|company_name)\b' components/markos/crm/outbound/*.tsx components/markos/operator/*.tsx` returns ONLY uses inside `<PIIRedactedField />` props |
| **B-2. ID chip rendering** | All UUIDs (campaign_id, thread_id, etc.) render via `<.c-chip-protocol>` (D-09 mint-as-text). Never as fill. | Storybook visual regression test asserts mint text only |
| **B-3. PII-field redaction** | For any field with `pii_classification IN ('sensitive', 'highly_sensitive')` per 216 inheritance, render via `<PIIRedactedField />` extracted component → `.c-code-inline` + `--color-on-surface-subtle` reading `[REDACTED]` verbatim. Examples: `display_name: [REDACTED]`, `email: [REDACTED]`, `phone: [REDACTED]`, `recipient_name: [REDACTED]`. | Architecture-lock test asserts `grep -c '\[REDACTED\]' components/markos/crm/outbound/*.tsx components/markos/operator/*.tsx` >= count of PII display fields |
| **B-4. Clipboard copy block on PII displays** | `onCopy` event handler MUST `preventDefault()` for any DOM node containing a PII display. The `<PIIRedactedField />` `'use client'` subcomponent exposes the `onCopy` interceptor. The `<.c-chip-protocol>` chip itself MAY be copied (it contains only the public UUID). | Storybook interaction test asserts `clipboard.writeText` is never invoked on PII block |
| **B-5. Audit-log every identity view** | Every render of a CDP-resolved IdentityProfile field MUST emit a `markos_audit_log` row (P201 hash chain) with `event_type == 'identity_view'`, `actor == requesting_user.id`, `profile_id == displayed_profile_id`, `payload_redacted == { displayed_fields: [...] }`. Audit emit happens server-side in the API handler. | API handler test asserts `INSERT INTO markos_audit_log` row count == 1 per identity view fetch |
| **B-6. No raw identity round-trip** | 223 reads recipient PII only — TemplateEditor preview fetches via POST `/v1/channels/templates/{id}/preview` (Plan 05); MessagingThreadsList via GET `/v1/channels/messaging/threads`; ApprovalReviewPanel via GET `/v1/channels/approvals`. Response body NEVER echoes raw PII for `pii_classification IN ('sensitive', 'highly_sensitive')` rows; uses `<PIIRedactedField />` server-side hint or `[REDACTED]` literal. | API handler test asserts response body shape excludes raw PII fields |
| **B-7. Channel mutations are approval-gated per D-32** | High-risk mutations (campaign create with class IN ('broadcast','revenue'), audience_size >= 500, pricing-touching template publish, sender_identity verification update, suppression bulk-add) call `buildApprovalPackage` per D-43. Low-risk (draft save, NBA dismiss, label update) proceed within role limits. | Plan 03 + Plan 05 ship integration tests asserting buildApprovalPackage called when threshold breached |
| **B-8. Banned-lexicon zero-match on doctrine prose + redaction strings** | The PII-field-list constants + 5 redaction strings (`'[REDACTED]'`) are doctrine prose; banned-lexicon enforced at zero-match. Same enforcement applies to template body + EmailCampaign subject + reply suggestion body + classifier-finding operator-note + sender warming notes + suppression operator-note BEFORE TemplateEditor save AND BEFORE `external.send` dispatch. | CI assertion `scripts/marketing-loop/check-banned-lexicon.mjs` runs against `components/markos/crm/outbound/**/*.{tsx,module.css}` + `components/markos/operator/**/*.{tsx,module.css}` + lib/markos/channels/ — zero matches required |
| **B-9. Provider secrets NEVER in UI surface (NEW per D-39)** | RESEND_API_KEY, TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID, KNOCK_API_KEY, RESEND_SIGNING_SECRET, TWILIO_WEBHOOK_SECRET, KNOCK_WEBHOOK_SECRET, MARKOS_WEBHOOK_CRON_SECRET NEVER appear in any UI surface, MCP response, or audit_log payload. Only `provider_message_id` (public per-message ID returned by provider API) is rendered. The webhook signature verification result (boolean) MAY be rendered in DeliverabilityWorkspace audit panel; the signature itself MUST NOT. | Architecture-lock test asserts `grep -P '\b(RESEND_API_KEY|TWILIO_AUTH_TOKEN|KNOCK_API_KEY|RESEND_SIGNING_SECRET|TWILIO_WEBHOOK_SECRET|KNOCK_WEBHOOK_SECRET|MARKOS_WEBHOOK_CRON_SECRET)\b' components/markos/crm/outbound/*.tsx components/markos/operator/*.tsx api/v1/channels/*.js lib/markos/channels/mcp/*.js` returns 0 matches outside import/env-access boundary |

---

## Surface Inventory — 5 NEW components + 2 P208 entry-type renderers + 2 EVOLVED components

### Surface A — `components/markos/crm/outbound/ChannelProgramsList.tsx` (NEW)

**Files:**
- `components/markos/crm/outbound/ChannelProgramsList.tsx` — NEW; **`'use client'`**; kanban-by-status of EmailCampaign + LifecycleJourney programs.
- `components/markos/crm/outbound/ChannelProgramsList.module.css` — NEW; token-only.
- `.storybook/stories/ChannelProgramsList.stories.tsx` — NEW; CSF3 named-state stories.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <header>                                                 |
|   <h2>Programs</h2>                                      |
|   <c-button--primary>Create campaign</c-button>          |
|   <fieldset><legend>Class</legend>                       |
|     <c-chip>broadcast</c-chip><c-chip>lifecycle</c-chip> |
|     <c-chip>transactional</c-chip><c-chip>revenue</c-chip>|
|   </fieldset>                                            |
|   <fieldset><legend>Channel</legend>                     |
|     <c-chip>email</c-chip><c-chip>sms</c-chip>           |
|     <c-chip>whatsapp</c-chip><c-chip>push</c-chip>       |
|     <c-chip>in_app</c-chip>                              |
|   </fieldset>                                            |
|   <fieldset><legend>Owner</legend>                       |
|     <c-chip>me</c-chip><c-chip>all</c-chip>              |
|   </fieldset>                                            |
| </header>                                                |
+----------------------------------------------------------+
| <main class="kanban">                                    |
|   <section><h3>Draft</h3><ul><li class="c-card">         |
|     <eyebrow>Campaign</eyebrow>                          |
|     <chip-class>broadcast</chip-class>                   |
|     <chip-channel>email</chip-channel>                   |
|     <h4>{name}</h4>                                      |
|     <chip-protocol>campaign_id</chip-protocol>           |
|     <audience-size>1,247 recipients</audience-size>      |
|     <chip-protocol>audience_snapshot_id</chip-protocol>  |
|     <sender>{sender_label}</sender>                      |
|     <approval-state>{state badge}</approval-state>       |
|     <RunStatusBadge run_id={dispatch_run_id} />          |
|     <c-button--tertiary>Schedule dispatch →</c-button>   |
|   </li></ul></section>                                   |
|   <section><h3>Pending approval</h3>...</section>        |
|   <section><h3>Approved</h3>...</section>                |
|   <section><h3>Scheduled</h3>...</section>               |
|   <section><h3>Dispatching</h3>...</section>             |
|   <section><h3>Dispatched</h3>...</section>              |
|   <section><h3>Paused</h3>...</section>                  |
|   <section><h3>Cancelled</h3>...</section>               |
|   <section><h3>Completed</h3>...</section>               |
|   <section><h3>Failed</h3>...</section>                  |
| </main>                                                  |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Single column. Filter chips wrap. Kanban columns stack vertically (one column visible at a time with horizontal swipe nav). Each card stacks vertically with reduced metadata.

**Components used:** `<RunStatusBadge />` (P207), `.c-card`, `.c-chip` for filter chips + class chips + channel chips, `.c-chip-protocol` for `campaign_id` / `journey_id` / `audience_snapshot_id` / `sender_id` / `template_id` / `dispatch_run_id` / `approval_ref`, `.c-badge--{state}` for status (draft → info; pending_approval → warning; approved → success; scheduled → info; dispatching → info+kernel-pulse; dispatched → success; paused → warning; cancelled → subtle; completed → success; failed → error), `.c-notice c-notice--info` empty state, vanilla `<section>` per kanban column, vanilla `<ul>` per card list, `.c-button--primary` (`Create campaign`), `.c-button--tertiary` for `Schedule dispatch →` mint-text inline.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Programs" |
| `<p class="t-lead">` | "{N} program(s) — {M} active" |
| Class filter legend | "Class" |
| Channel filter legend | "Channel" |
| Owner filter legend | "Owner" |
| 4 class chip labels (verbatim per D-02) | "broadcast", "lifecycle", "transactional", "revenue" |
| 5 channel chip labels (verbatim per D-03 + D-08) | "email", "sms", "whatsapp", "push", "in_app" |
| 10 status column headers (verbatim per D-02) | "Draft", "Pending approval", "Approved", "Scheduled", "Dispatching", "Dispatched", "Paused", "Cancelled", "Completed", "Failed" |
| Card eyebrow | "Campaign" or "Journey" or "Thread" |
| Audience size label | "{N} recipient(s)" with tabular numerals |
| Sender label | "{sender_label}" (e.g., "ops@markos.io") |
| Schedule dispatch CTA (mint-text inline; renders only when status='approved' AND scheduled_at IS NULL) | "Schedule dispatch →" |
| Create campaign CTA | "Create campaign" |
| Empty (no programs) | `[info] No channel programs yet. Create campaign →` |
| Empty (filter applied) | `[info] No programs match filter. Clear filters to see all programs.` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load programs. {error_message}.` |
| Tombstoned (legacy migrated) | `[info] Migrated from legacy outbound. Read-only.` |
| Approval-required pending | `[warn] Awaiting approval — {triggerReason}.` |
| Autonomy ceiling reached | `[block] Autonomy ceiling reached for channel_dispatch_approval.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty` | Zero programs | Empty notice with "Create campaign" CTA |
| `populated` | Programs > 0 | Full kanban with 10 columns |
| `filtered` | Filter chip(s) selected, filtered count > 0 | Filtered kanban |
| `filtered-empty` | Filter applied, count == 0 | Filter-empty notice with "Clear filters" mint-text inline |
| `dispatching-live` | Any card with status='dispatching' | Per-card `<.c-status-dot--live>` kernel-pulse (freezes under prefers-reduced-motion) |
| `tombstoned` | Legacy outbound migrated row (per legacy adapter) | Card rendered with deprecated indicator |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `email_campaigns` table (per D-02) — 10 status enum + 4 class enum
- `lifecycle_journeys` + `lifecycle_journey_runs` (per D-04)
- `messaging_threads` (per D-03) — read for thread cards
- `sender_identities` (per D-06) — read for sender_label
- F-130 POST `/v1/channels/email/programs/{id}/dispatch` (Plan 05)
- 4 channel kinds verbatim (email/sms+voice/whatsapp/push/in_app) — note: SMS and WhatsApp share Twilio adapter (D-08)
- 4 provider adapters: Resend (email), Twilio (SMS+WhatsApp), Knock (push), in_app (internal D-10)
- buildApprovalPackage (D-43) for high-risk dispatch (class IN ('broadcast','revenue') OR audience_size >= 500 OR re-engagement >90d OR lifecycle_stage='lost' per D-18)

**Accessibility focus order:** (1) `<h2>Programs</h2>` (programmatic focus on route change) → (2) Create campaign CTA → (3) Class filter chip group → (4) Channel filter chip group → (5) Owner filter chip group → (6) Kanban column headers (`<h3>`) keyboard navigable → (7) Per-card list (`<ul>`) keyboard nav with arrow keys; Enter to expand card detail.

**Motion:** `<.c-status-dot--live>` kernel-pulse on `dispatching-live` state (freezes under prefers-reduced-motion). Filter chip toggle: 100ms color transition; 0ms under reduced-motion. Kanban column reorder on filter: 150ms slide; 0ms under reduced-motion. Card expand: NO scroll-into-view auto-scroll.

**Acceptance Criteria:**
- AC CPL-1: Component is a client component (`'use client'` directive)
- AC CPL-2: Component renders all 10 status column headers verbatim
- AC CPL-3: Component renders all 4 class filter chips verbatim
- AC CPL-4: Component renders all 5 channel filter chips verbatim (email/sms/whatsapp/push/in_app)
- AC CPL-5: Component fetches `/v1/channels/email/programs?class=X&channel=Y&owner=Z&status=W` with proper URL encoding
- AC CPL-6: Per-card aggregate counters (delivered/opened/clicked/replied/bounced/complained/unsubscribed) render with tabular numerals
- AC CPL-7: Per-card `<RunStatusBadge run_id={dispatch_run_id} />` renders for dispatching/completed/failed cards (P207 lineage)
- AC CPL-8: Dispatching cards render `<.c-status-dot--live>` kernel-pulse (freezes under prefers-reduced-motion)
- AC CPL-9: Empty state renders `[info] No channel programs yet. Create campaign →` verbatim
- AC CPL-10: Per-card `Schedule dispatch →` mint-text inline link renders ONLY when status='approved' AND scheduled_at IS NULL
- AC CPL-11: Approval-required notice renders verbatim "Awaiting approval — {triggerReason}." with triggerReason from buildApprovalPackage payload (D-43)
- AC CPL-12: Autonomy ceiling notice renders `[block] Autonomy ceiling reached for channel_dispatch_approval.` when external.send triggers without approval_ref
- AC CPL-13: Per-card audience_snapshot_id chip renders + `Open audience →` mint-text inline link to P221 surface
- AC CPL-14: Per-card sender_identity label renders (read from sender_identities D-06)
- AC CPL-15: D-21 server/client boundary noted in file header comment
- AC CPL-16: D-08 token-only enforced (zero hex literals in module.css)
- AC CPL-17: Banned-lexicon zero-match on campaign name + sender_label (CI assertion)
- AC CPL-18: Storybook story `Channels/ChannelProgramsList` registers ≥4 named-state stories (Empty / Populated / Tombstoned / Filtered)
- AC CPL-19: Mobile breakpoint stacks kanban columns vertically with horizontal swipe nav

---

### Surface B — `components/markos/crm/outbound/MessagingThreadsList.tsx` (NEW; mobile_priority=critical)

**Files:**
- `components/markos/crm/outbound/MessagingThreadsList.tsx` — NEW; **`'use client'`**; queue grouped by owner_user_id; reply_pending pinned with red dot.
- `components/markos/crm/outbound/MessagingThreadsList.module.css` — NEW; token-only.
- `.storybook/stories/MessagingThreadsList.stories.tsx` — NEW; CSF3 named-state stories.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <header>                                                 |
|   <h2>Threads</h2>                                       |
|   <p class="t-lead">{N} thread(s) — {M} reply pending</p>|
|   <c-button--secondary>Refresh queue →</c-button>        |
|   <fieldset><legend>Channel</legend>                     |
|     <c-chip>email</c-chip><c-chip>sms</c-chip>           |
|     <c-chip>whatsapp</c-chip><c-chip>push</c-chip>       |
|     <c-chip>in_app</c-chip>                              |
|   </fieldset>                                            |
|   <fieldset><legend>Status</legend>                      |
|     <c-chip>reply_pending</c-chip><c-chip>open</c-chip>  |
|     <c-chip>waiting</c-chip><c-chip>escalated</c-chip>   |
|     <c-chip>resolved</c-chip><c-chip>blocked</c-chip>    |
|   </fieldset>                                            |
| </header>                                                |
+----------------------------------------------------------+
| <main>                                                   |
|   <section><h3>Reply pending</h3>                        |
|     <ul> threads (newest reply first):                   |
|       <li class="c-card">                                |
|         <c-status-dot--live /> (mint pulse)              |
|         <chip-channel>email</chip-channel>               |
|         <PIIRedactedField pii_classification="personal"  |
|           value={recipient_name} />                      |
|         <HealthScoreBadge score={...} />                 |
|         <RiskBandBadge band={...} />                     |
|         <body>{last_message_snippet}</body>              |
|         <c-badge sentiment-coded>{sentiment}</c-badge>   |
|         <last_message_at> 2 minutes ago</last_message_at>|
|         <chip-protocol>thread_id</chip-protocol>         |
|         [if related_crm_id] <c-button--tertiary>         |
|           Open Customer360 →</c-button>                  |
|         [if related_nba_id] <c-button--tertiary>         |
|           Open NBA →</c-button>                          |
|         <c-button--tertiary>Open thread →</c-button>     |
|         [if opt_out_detected] <c-badge--warning>         |
|           Opt-out detected</c-badge>                     |
|       </li>                                              |
|     </ul>                                                |
|   </section>                                             |
|   <section><h3>Open</h3>...</section>                    |
|   <section><h3>Waiting</h3>...</section>                 |
|   <section><h3>Escalated</h3>...</section>               |
|   <section><h3>Resolved</h3>...</section>                |
|   <section><h3>Blocked</h3>...</section>                 |
| </main>                                                  |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Single column. **mobile_priority=critical** — reply_pending section pinned to top with sticky header; per-row tap target ≥44px (already global per 213.2). Per-row collapses last_message_snippet to 2 lines with "…more" affordance. Health/risk badges shown inline.

**Components used:** `<HealthScoreBadge />` (216 §D-15 reused), `<RiskBandBadge />` (216 §D-15 reused), `<PIIRedactedField />` (216 §D-15 reused), `.c-card`, `.c-status-dot--live` (mint pulse on top reply_pending), `.c-chip` for channel chip + status chip, `.c-chip-protocol` for `thread_id` / `related_crm_id` / `related_nba_id` / `related_opportunity_id` / `related_support_case_id` / `profile_id` / `dispatch_attempt_id` / `provider_message_id`, `.c-badge--{state}` for sentiment (positive→success; neutral→info; negative→error), `.c-badge--{state}` for current_status (reply_pending→error; open→info; waiting→info; escalated→warning; resolved→success; blocked→error), `.c-button--secondary` (`Refresh queue`), `.c-button--tertiary` for `Open thread →` / `Open Customer360 →` / `Open NBA →` mint-text inline.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Threads" |
| `<p class="t-lead">` | "{N} thread(s) — {M} reply pending" |
| Channel filter legend | "Channel" |
| Status filter legend | "Status" |
| 5 channel chip labels (verbatim per D-03) | "email", "sms", "whatsapp", "push", "in_app" |
| 6 status group headers (verbatim per D-03) | "Reply pending", "Open", "Waiting", "Escalated", "Resolved", "Blocked" |
| Last_message_at format | "{N} {unit} ago" (e.g., "2 minutes ago", "1 hour ago", "3 days ago") |
| Open thread CTA (mint-text inline) | "Open thread →" |
| Open Customer360 CTA (mint-text inline; renders only when related_crm_id present) | "Open Customer360 →" |
| Open NBA CTA (mint-text inline; renders only when related_nba_id present) | "Open NBA →" |
| Refresh queue CTA | "Refresh queue →" |
| Sentiment chip (3 verbatim per 222 inheritance) | "positive", "neutral", "negative" |
| Opt-out detected badge | "Opt-out detected" |
| WhatsApp session expired badge (per D-54) | "Session expired" |
| Empty (no threads) | `[info] No messaging threads yet.` |
| Empty (reply_pending filter, count == 0) | `[ok] All threads attended.` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load threads. {error_message}.` |
| Tombstoned (DSR cascade) | `[info] Recipient tombstoned per DSR — thread preserved for legal trail.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty` | Zero threads | Empty notice |
| `populated` | Threads > 0 | Full grouped list |
| `reply-pending-fresh` | Top reply_pending row last_message_at < 5 min | `<.c-status-dot--live>` mint pulse on row |
| `opt-out-detected` | Opt-out detector matched (per D-23 step 6) | Per-row `<.c-badge--warning>` + downstream ConsentState mutation logged |
| `whatsapp-session-expired` | thread.channel='whatsapp' AND last_message_at > 24h ago (per D-54) | Per-row `<.c-badge--error>` "Session expired" + dispatch attempts fail-closed `whatsapp_session_lost` |
| `tombstoned` | recipient profile tombstoned (per P221 D-24 cascade) | Per-row info notice |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `messaging_threads` table (per D-03) — 6 current_status enum + 4 channel enum
- `customer_360_records` (P222) — read for related_crm_id health_score + risk_band rendering
- `nba_records` (P222) — read for related_nba_id "Open NBA →" link
- F-123 GET `/v1/channels/messaging/threads?owner_user_id=X&status=Y&channel=Z` (Plan 05)
- 4 channel kinds verbatim (email/sms+voice via Twilio/whatsapp via Twilio/push via Knock/in_app internal)
- Reply continuity flow (D-22 + D-23): inbound → MessagingThread → Customer360 → CRM task → opt-out detector
- Pitfall 7 auto-reply detection (Plan 04 — auto-replies log only, no thread.reply_pending transition)
- Pitfall 8 Knock cascade (Plan 04 — push delivery_failed → handleBounceEvent('hard') → suppression chain)

**Accessibility focus order:** (1) `<h2>Threads</h2>` (programmatic focus on route change) → (2) Refresh queue CTA → (3) Channel filter chip group → (4) Status filter chip group → (5) Group headers (`<h3>`) keyboard navigable → (6) Per-row list (`<ul>`) keyboard nav with arrow keys; Enter to open thread.

**Motion:** `<.c-status-dot--live>` kernel-pulse on top reply_pending row when last_message_at < 5 min (freezes under prefers-reduced-motion). Filter chip toggle: 100ms color transition; 0ms under reduced-motion. Group reorder on filter: 150ms slide; 0ms under reduced-motion.

**Acceptance Criteria:**
- AC MTL-1: Component is a client component (`'use client'` directive)
- AC MTL-2: Component renders all 6 status group headers verbatim
- AC MTL-3: Component renders all 5 channel filter chips verbatim
- AC MTL-4: Component fetches `/v1/channels/messaging/threads?owner_user_id=X&status=Y` with proper URL encoding
- AC MTL-5: Reply_pending group pinned to top of list (sort order)
- AC MTL-6: Per-row recipient name rendered via `<PIIRedactedField pii_classification="personal" />`
- AC MTL-7: Per-row `<HealthScoreBadge />` renders when related_crm_id resolves to Customer360 with health_score (216 §D-15 reuse)
- AC MTL-8: Per-row `<RiskBandBadge />` renders when related_crm_id resolves to Customer360 with risk_band (216 §D-15 reuse)
- AC MTL-9: Per-row sentiment chip renders 3 verbatim labels per 222 sentiment 3-enum
- AC MTL-10: Per-row "Open Customer360 →" mint-text inline link renders ONLY when related_crm_id present (222 D-03)
- AC MTL-11: Per-row "Open NBA →" mint-text inline link renders ONLY when related_nba_id present (222 D-08)
- AC MTL-12: Per-row "Open thread →" mint-text inline link always renders
- AC MTL-13: Opt-out detected badge renders when ConsentState mutated to opted_out via D-23 step 6
- AC MTL-14: WhatsApp session expired badge renders when channel='whatsapp' AND last_message_at > 24h (per D-54)
- AC MTL-15: Auto-reply rows excluded from reply_pending group (Plan 04 Pitfall 7 — auto-replies log only)
- AC MTL-16: mobile_priority=critical registered in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: channels_threads`
- AC MTL-17: Touch target ≥44px on coarse pointers (already global per 213.2)
- AC MTL-18: D-21 server/client boundary noted in file header comment
- AC MTL-19: D-08 token-only enforced (zero hex literals in module.css)
- AC MTL-20: Banned-lexicon zero-match on last_message_snippet preview (CI assertion)
- AC MTL-21: Storybook story `Channels/MessagingThreadsList` registers ≥4 named-state stories (Empty / ReplyPending / Mixed / Tombstoned)

---

### Surface C — `components/markos/crm/outbound/DeliverabilityWorkspace.tsx` (NEW)

**Files:**
- `components/markos/crm/outbound/DeliverabilityWorkspace.tsx` — NEW; **`'use client'`**; per-sender reputation panel + 24h posture metrics + suppression count + concrete next-action.
- `components/markos/crm/outbound/DeliverabilityWorkspace.module.css` — NEW; token-only.
- `.storybook/stories/DeliverabilityWorkspace.stories.tsx` — NEW; CSF3 named-state stories.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <header>                                                 |
|   <h2>Deliverability</h2>                                |
|   <p class="t-lead">{N} sender(s) — {M} at risk</p>     |
|   <fieldset><legend>Reputation</legend>                  |
|     <c-chip>warming</c-chip><c-chip>healthy</c-chip>     |
|     <c-chip>watch</c-chip><c-chip>at_risk</c-chip>       |
|   </fieldset>                                            |
| </header>                                                |
+----------------------------------------------------------+
| <main>                                                   |
|   <ul> per-sender cards:                                 |
|     <li class="c-card">                                  |
|       <header>                                           |
|         <h3>{sender_label}</h3>                          |
|         <chip-protocol>sender_id</chip-protocol>         |
|         <chip-channel>email</chip-channel>               |
|         <c-badge reputation-coded>                       |
|           {reputation_status}                            |
|         </c-badge>                                       |
|         <RiskBandBadge band={...} />                     |
|       </header>                                          |
|       <h4>Sender</h4>                                    |
|         <dl>                                             |
|           <dt>From</dt><dd>{from_email}</dd>             |
|           <dt>Reply-to</dt><dd>{reply_to_email}</dd>     |
|           <dt>Sending domain</dt><dd>{sending_domain}</dd>|
|           <dt>DKIM</dt><dd>{dkim_status}</dd>            |
|           <dt>SPF</dt><dd>{spf_status}</dd>              |
|           <dt>DMARC</dt><dd>{dmarc_status}</dd>          |
|           <dt>Daily limit</dt><dd>{daily_send_limit}</dd>|
|           <dt>Last warmed</dt><dd>{last_warmed_at}</dd>  |
|         </dl>                                            |
|       <h4>Posture (24h)</h4>                             |
|         <table>                                          |
|           <tr><th>Metric</th><th>Rate</th><th>Sample</th></tr>|
|           <tr><td>Bounce</td><td>{rate}%</td><td>{n}</td></tr>|
|           <tr><td>Complaint</td><td>{rate}%</td><td>{n}</td></tr>|
|           <tr><td>Reply</td><td>{rate}%</td><td>{n}</td></tr>|
|           <tr><td>Open</td><td>{rate}%</td><td>{n}</td></tr>|
|           <tr><td>Click</td><td>{rate}%</td><td>{n}</td></tr>|
|           <tr><td>Unsubscribe</td><td>{rate}%</td><td>{n}</td></tr>|
|         </table>                                         |
|         <reputation-score>{0-100}</reputation-score>     |
|         <trend-chip>{trend} {bracketed-glyph}</trend>    |
|         <window-start>{window_24h_start}</window-start>  |
|         <last-rollup>{last_rollup_at}</last-rollup>      |
|         <c-button--secondary>Recompute posture →</c-button>|
|       <h4>Suppression</h4>                               |
|         <suppression-count>{N} suppressed</suppression>  |
|         <c-button--tertiary>Open suppression list →</c-button>|
|         [if at_risk] <c-notice c-notice--error>          |
|           [err] At-risk: pause broadcast class until     |
|             reputation recovers.</c-notice>              |
|         [if watch] <c-notice c-notice--warning>          |
|           [warn] Watch: review last 7 days bounces.</c-notice>|
|         [if warming] <c-notice c-notice--info>           |
|           [info] Warming: send <500/day for 7 days.</c-notice>|
|         [if healthy] <c-notice c-notice--success>        |
|           [ok] Healthy: full class permissions.</c-notice>|
|         [if spike_detected per D-35]                     |
|           <c-notice c-notice--warning>                   |
|           [warn] Bounce spike detected — {N}σ above 7d   |
|             baseline.</c-notice>                         |
|     </li>                                                |
|   </ul>                                                  |
| </main>                                                  |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Single column. Per-sender card stacks vertically. Posture table collapses to 2-column key-value list. Trend chip pinned to header.

**Components used:** `<RiskBandBadge />` (216 §D-15 reused — for at_risk indicator), `.c-card`, `.c-chip` for filter chips, `.c-chip-protocol` for `sender_id` / `dispatch_run_id` (when posture rollup AgentRun completed) / `cron_run_id` (last rollup), `.c-badge--{state}` for reputation_status (warming→info; healthy→success; watch→warning; at_risk→error), `.c-code-inline` (tabular numerals on rate columns + sample_size + reputation_score), vanilla `<dl>` / `<table>` semantic, `.c-button--secondary` (`Recompute posture`), `.c-button--tertiary` for `Open suppression list →` mint-text inline, `.c-notice c-notice--{state}` for next-action notices.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Deliverability" |
| `<p class="t-lead">` | "{N} sender(s) — {M} at risk" |
| Reputation filter legend | "Reputation" |
| 4 reputation chip labels (verbatim per D-06) | "warming", "healthy", "watch", "at_risk" |
| Per-sender section headings | "Sender", "Posture (24h)", "Suppression" |
| 6 metric labels (verbatim per D-07) | "Bounce", "Complaint", "Reply", "Open", "Click", "Unsubscribe" |
| 4 trend literals (verbatim per D-07) + glyph | "improving" `[up]`, "stable" `[flat]`, "watch" `[warn]`, "degrading" `[down]` |
| 8 sender-detail labels | "From", "Reply-to", "Sending domain", "DKIM", "SPF", "DMARC", "Daily limit", "Last warmed" |
| Reputation-score format | "{N}/100" with tabular numerals |
| Suppression-count format | "{N} suppressed" with tabular numerals |
| Recompute posture CTA | "Recompute posture →" |
| Open suppression list CTA (mint-text inline) | "Open suppression list →" |
| At-risk next-action notice | `[err] At-risk: pause broadcast class until reputation recovers.` |
| Watch next-action notice | `[warn] Watch: review last 7 days bounces.` |
| Warming next-action notice | `[info] Warming: send <500/day for 7 days.` |
| Healthy next-action notice | `[ok] Healthy: full class permissions.` |
| Spike detected notice (per D-35) | `[warn] Bounce spike detected — {N}σ above 7d baseline.` |
| DKIM/SPF/DMARC verified | `[ok] Verified` |
| DKIM/SPF/DMARC pending | `[info] Pending` |
| DKIM/SPF/DMARC failed | `[err] Failed — fix DNS records` |
| Empty (no senders) | `[info] No senders configured. Configure sender →` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load deliverability. {error_message}.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty` | Zero senders | Empty notice with "Configure sender →" CTA |
| `populated` | Senders > 0 | Full per-sender card list |
| `warming` | Per-sender reputation_status='warming' | Card with info notice + warming next-action |
| `healthy` | Per-sender reputation_status='healthy' | Card with success notice + healthy next-action |
| `watch` | Per-sender reputation_status='watch' | Card with warning notice + watch next-action |
| `at_risk` | Per-sender reputation_status='at_risk' | Card with error notice + at_risk next-action |
| `improving-trend` | Per-sender trend='improving' | `<.c-status-dot--live>` + `[up]` glyph + mint chip |
| `degrading-trend` | Per-sender trend='degrading' | Warning chip + `[down]` glyph |
| `spike-detected` | Per-sender bounce_rate > baseline + 2σ (per D-35) | Per-card warning notice; spike alert in MorningBriefChannelEntries |
| `dns-pending` | Per-sender DKIM/SPF/DMARC any pending | Per-row info notice "Pending" |
| `dns-failed` | Per-sender DKIM/SPF/DMARC any failed | Per-row error notice with DNS-fix concrete instructions |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `sender_identities` table (per D-06) — verification_status enum + reputation_status enum + DKIM/SPF/DMARC + class_permissions
- `deliverability_posture` table (per D-07) — composite key (tenant_id, channel, sender_id, window_24h_start) + bounce_rate/complaint_rate/reply_rate/open_rate/click_rate/unsubscribe_rate + sample_size + reputation_score (0-100) + trend
- `channel_suppressions` table (per D-21) — read for per-sender suppression_count
- F-125 `/v1/channels/email/senders` GET (Plan 05)
- F-126 `/v1/channels/email/deliverability` GET (Plan 05)
- F-128 `/v1/channels/suppressions` GET (Plan 05)
- Plan 06 cron `channels-deliverability-rollup.js` (hourly) populates deliverability_posture
- Plan 06 cron `channels-bounce-spike-alert.js` (daily) detects spike (>2σ from 7-day baseline) per D-35

**Accessibility focus order:** (1) `<h2>Deliverability</h2>` → (2) Reputation filter chip group → (3) Per-sender card list (`<ul>`) keyboard navigable → (4) Per-card `<h3>` sender label → (5) Per-card "Sender" / "Posture (24h)" / "Suppression" section headings → (6) Per-card "Recompute posture →" / "Open suppression list →" CTAs.

**Motion:** `<.c-status-dot--live>` kernel-pulse on improving-trend chip (freezes under prefers-reduced-motion). Trend chip color transition: 100ms; 0ms under reduced-motion. Posture rollup recompute success: 150ms toast slide; 0ms under reduced-motion.

**Acceptance Criteria:**
- AC DLW-1: Component is a client component (`'use client'` directive)
- AC DLW-2: Component renders all 4 reputation_status filter chips verbatim
- AC DLW-3: Component renders all 6 deliverability metric labels verbatim per D-07
- AC DLW-4: Component renders all 4 trend literals + bracketed glyph per D-07
- AC DLW-5: Component renders all 8 sender-detail labels (From/Reply-to/Sending domain/DKIM/SPF/DMARC/Daily limit/Last warmed)
- AC DLW-6: All rate columns + sample_size + reputation_score render with tabular numerals (`.c-code-inline` + `font-feature-settings: 'tnum' 1`)
- AC DLW-7: Per-sender at_risk next-action notice renders verbatim "At-risk: pause broadcast class until reputation recovers."
- AC DLW-8: Per-sender warming next-action notice renders verbatim "Warming: send <500/day for 7 days."
- AC DLW-9: Spike detected notice renders when bounce_rate > baseline + 2σ (per D-35); references σ value verbatim
- AC DLW-10: DKIM/SPF/DMARC status renders with bracketed glyph pairing ([ok]/[info]/[err])
- AC DLW-11: Component fetches `/v1/channels/email/deliverability?sender_id=X&channel=Y` with proper URL encoding
- AC DLW-12: `<RiskBandBadge />` reused from 216 §D-15 (NOT re-implemented)
- AC DLW-13: Per-card `Recompute posture →` CTA emits AgentRun `kind='channels-deliverability-rollup'` (manual trigger of Plan 06 cron)
- AC DLW-14: D-21 server/client boundary noted in file header comment
- AC DLW-15: D-08 token-only enforced (zero hex literals in module.css)
- AC DLW-16: Banned-lexicon zero-match on sender warming notes (CI assertion)
- AC DLW-17: Storybook story `Channels/DeliverabilityWorkspace` registers ≥4 named-state stories (Warming / Healthy / Watch / AtRisk)

---

### Surface D — `components/markos/crm/outbound/TemplateEditor.tsx` (NEW)

**Files:**
- `components/markos/crm/outbound/TemplateEditor.tsx` — NEW; **`'use client'`**; per-channel preview + variables + bindings + classifier findings.
- `components/markos/crm/outbound/TemplateEditor.module.css` — NEW; token-only.
- `.storybook/stories/TemplateEditor.stories.tsx` — NEW; CSF3 named-state stories.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <header>                                                 |
|   <h2>Template</h2>                                      |
|   <h4>{template.name} · v{version}</h4>                  |
|   <chip-protocol>template_id</chip-protocol>             |
|   <chip-channel>{channel}</chip-channel>                 |
|   <c-badge>{template_type}</c-badge>                     |
|   <c-badge>{status}</c-badge>                            |
|   <fieldset><legend>Channel</legend>                     |
|     <c-chip>email</c-chip><c-chip>sms</c-chip>           |
|     <c-chip>whatsapp</c-chip><c-chip>push</c-chip>       |
|     <c-chip>in_app</c-chip>                              |
|   </fieldset>                                            |
|   <fieldset><legend>Locale</legend>                      |
|     <c-chip>{locale}</c-chip>                            |
|     [if parent_template_id] <chip-protocol>              |
|       parent_template_id</chip-protocol>                 |
|   </fieldset>                                            |
|   <c-button--primary>Publish template</c-button>         |
|   <c-button--secondary>Save draft</c-button>             |
|   <c-button--tertiary>Render preview →</c-button>        |
| </header>                                                |
+----------------------------------------------------------+
| <main class="grid-2col">                                 |
|   <section class="c-card">                               |
|     <h3>Preview</h3>                                     |
|     [if channel='email']                                 |
|       <subject>{subject_rendered}</subject>              |
|       <preview-pane class="c-code-block">                |
|         {content_html_rendered}                          |
|       </preview-pane>                                    |
|     [if channel='sms' or 'whatsapp']                     |
|       <preview-pane>                                     |
|         {content_text_rendered}                          |
|       </preview-pane>                                    |
|     [if channel='push']                                  |
|       <push-preview>                                     |
|         <title>{push_title_rendered}</title>             |
|         <body>{push_body_rendered}</body>                |
|       </push-preview>                                    |
|     [if channel='in_app']                                |
|       <in-app-preview>                                   |
|         {content_html_rendered}                          |
|       </in-app-preview>                                  |
|     <PIIRedactedField pii_classification="personal"      |
|       value={sample_recipient_name} />                   |
|     <c-button--tertiary>Refresh preview →</c-button>     |
|   </section>                                             |
|                                                          |
|   <section class="c-card">                               |
|     <h3>Variables</h3>                                   |
|     <table>                                              |
|       <tr><th>Variable</th><th>Source</th><th>Sample value</th></tr>|
|       <tr><td>{var_name}</td><td>{source}</td><td>{value}</td></tr>|
|       ...                                                |
|     </table>                                             |
|     [if missing_variables.length > 0]                    |
|       <c-notice c-notice--error>                         |
|         [err] {N} required variable(s) missing.          |
|       </c-notice>                                        |
|   </section>                                             |
| </main>                                                  |
+----------------------------------------------------------+
| <section class="c-card">                                 |
|   <h3>Bindings</h3>                                      |
|   <h4>Evidence bindings</h4>                             |
|     <KbGroundingPanel evidence_refs={template.evidence_bindings} />|
|     <chip-protocol>evidence_ref</chip-protocol> per row  |
|     <claim-ttl-remaining>{N} days remaining</ttl>        |
|   <h4>Pricing bindings</h4>                              |
|     <ul>                                                 |
|       <li><chip-protocol>pricing_recommendation_id</chip>|
|         <accessor-name>getPricingFor</accessor-name>     |
|         <c-badge--info>allowlisted</c-badge>             |
|         <Money fromPricingRecommendation={pr_id} />     |
|       </li>                                              |
|       [if non-allowlisted]                               |
|         <PlaceholderBanner variant="billing_placeholder">|
|           {{MARKOS_PRICING_ENGINE_PENDING}}             |
|         </PlaceholderBanner>                             |
|     </ul>                                                |
| </section>                                               |
+----------------------------------------------------------+
| <section class="c-card">                                 |
|   <h3>Classifier findings</h3>                           |
|   <ClassifierChipRow findings={classifier_findings} />   |
|   <ul>                                                   |
|     <li>                                                 |
|       <c-badge severity-coded>{severity}</c-badge>       |
|       <chip-finding-kind>{kind}</chip-finding-kind>      |
|       <p>{description}</p>                               |
|       [if pricing_ast_violation]                         |
|         <c-code-block>                                   |
|           {ast_excerpt} (line {N}, col {M})              |
|         </c-code-block>                                  |
|     </li>                                                |
|   </ul>                                                  |
|   [if blocks_dispatch=true]                              |
|     <c-notice c-notice--error>                           |
|       [err] Template publish blocked — resolve {N}       |
|         severity=block findings before save.             |
|     </c-notice>                                          |
| </section>                                               |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Single column. Preview + Variables stack vertically. Bindings + Classifier findings stack below. Per-channel preview pane caps height with internal scroll.

**Components used:** `<KbGroundingPanel />` (216 §D-15 reused), `<ClassifierChipRow />` (216 §D-15 reused), `<PIIRedactedField />` (216 §D-15 reused — sample recipient render in preview), `<Money />` recipe + `<PlaceholderBanner variant="billing_placeholder">` for pricing, `.c-card` (per section), `.c-chip` for filter chips, `.c-chip-protocol` for `template_id` / `parent_template_id` / `evidence_ref` / `pricing_recommendation_id`, `.c-badge--{state}` for template_type / status / classifier severity (block→error; flag→warning; info→info), `.c-code-block` for HTML preview + AST excerpt, `.c-code-inline` for `.c-chip-protocol` IDs, vanilla `<table>` for variable inspector, `.c-button--primary` (`Publish template`), `.c-button--secondary` (`Save draft`), `.c-button--tertiary` for `Render preview →` / `Refresh preview →` / `Open evidence →` mint-text inline.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Template" |
| Sub-section headings | "Preview", "Variables", "Bindings", "Classifier findings", "Evidence bindings", "Pricing bindings" |
| Channel filter legend | "Channel" |
| Locale filter legend | "Locale" |
| 5 channel chip labels (verbatim per D-25) | "email", "sms", "whatsapp", "push", "in_app" |
| 4 template_type labels (verbatim per D-25) | "marketing", "transactional", "lifecycle", "support" |
| 3 status labels (verbatim per D-25) | "draft", "approved", "archived" |
| Variable table column headers | "Variable", "Source", "Sample value" |
| 4 variable source labels | "TraitSnapshot", "Customer360", "Opportunity", "dispatch_context_overrides" |
| 5 classifier finding kinds (verbatim per D-52) | "pricing_binding", "pricing_text_scan", "pricing_ast_violation", "evidence_ttl", "competitor_mention" |
| 3 classifier severity labels (verbatim per D-52) | "block", "flag", "info" |
| Publish template CTA | "Publish template" |
| Save draft CTA | "Save draft" |
| Render preview CTA (mint-text inline) | "Render preview →" |
| Refresh preview CTA (mint-text inline) | "Refresh preview →" |
| Open evidence CTA (mint-text inline; per evidence_ref row) | "Open evidence →" |
| Allowlisted pricing accessor badge | "allowlisted" |
| Pricing sentinel rendered verbatim | "{{MARKOS_PRICING_ENGINE_PENDING}}" |
| Missing variables notice | `[err] {N} required variable(s) missing.` |
| Classifier blocks dispatch notice | `[err] Template publish blocked — resolve {N} severity=block findings before save.` |
| Classifier flags only notice | `[warn] {N} finding(s) flagged for review.` |
| Locale variant fallback notice | `[info] Locale {locale} falls back to parent template.` |
| Empty (no template loaded) | `[info] Select a template to edit.` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load template. {error_message}.` |
| Banned-lexicon detected (CI fail before publish) | `[err] Template body contains banned lexicon — replace before save.` |
| Future phase placeholder (AI-suggest subject) | `[info] AI-suggest subject — DEFERRED to P226 sales enablement.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty` | No template selected | Empty notice |
| `editing` | template loaded, no classifier run yet | Editor with preview + variables |
| `preview-rendered` | renderPreview returned successfully | Full preview pane populated |
| `missing-variables` | resolveVariables returned missing > 0 | Per-variable row warning + summary error notice; preview shows `{{var}}` placeholders |
| `classifier-clean` | classifier.findings.length == 0 | Success notice "[ok] Classifier passed — ready to publish." |
| `classifier-flag-only` | findings exist with severity in (flag, info) ONLY | Warning notice with finding count; Publish CTA enabled |
| `classifier-block` | findings exist with severity='block' | Error notice; Publish CTA disabled until findings resolved |
| `pricing-allowlisted` | pricing_binding accessor in ALLOWLISTED_ACCESSORS | `<.c-badge--info>` "allowlisted" + `<Money>` resolved value |
| `pricing-non-allowlisted` | pricing_binding accessor NOT in allowlist | `<PlaceholderBanner variant="billing_placeholder">` `{{MARKOS_PRICING_ENGINE_PENDING}}` + classifier finding severity='block' on pricing_ast_violation |
| `evidence-ttl-stale` | evidence_binding claim_ttl_remaining <= 0 | Per-row `<.c-badge--warning>` "TTL expired"; classifier finding severity='block' on evidence_ttl |
| `competitor-mention-flag` | classifier detected competitor mention | Per-row `<.c-badge--warning>` "Competitor mention" (severity='flag', not block) |
| `locale-fallback` | recipient locale has no child template | Info notice "[info] Locale {locale} falls back to parent template." |
| `banned-lexicon-detected` | banned-lexicon CI check fails before publish | Error notice; Publish CTA disabled |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `channel_templates` table (per D-25) — channel + template_type + content_blocks[] + variables_schema + evidence_bindings[] + pricing_bindings[] + locale + parent_template_id + version + status enum
- F-127 GET / POST / PATCH `/v1/channels/templates` (Plan 05)
- F-127 POST `/v1/channels/templates/{id}/preview` returns rendered preview + classifier findings + missing_variables (Plan 05 task 1 test 11)
- 4 variable sources (per D-26 precedence): dispatch_context_overrides > Opportunity > Customer360 > TraitSnapshot
- 5 classifier finding kinds (per D-52): pricing_binding (AST allowlist) + pricing_text_scan (raw regex) + pricing_ast_violation + evidence_ttl (P209 EvidenceMap freshness) + competitor_mention
- 3 classifier severity (per D-52): block / flag / info
- ALLOWLISTED_ACCESSORS (per D-16/D-52): `['getPricingFor', 'formatPrice', 'usePricing', 'pricingFromEngine']`
- Sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` rendered verbatim per CLAUDE.md placeholder rule
- buildApprovalPackage (D-43) for high-risk publish (when classifier finding severity='block' on pricing_binding/factual_claim)
- Banned-lexicon zero-match BEFORE save AND BEFORE dispatch (per 213-04 + 216 §banned-lexicon)
- Locale variant chain via parent_template_id (per D-28); fallback to parent if no recipient locale match

**Accessibility focus order:** (1) `<h2>Template</h2>` (programmatic focus on open) → (2) Channel + Locale filter chip groups → (3) `Publish template` / `Save draft` / `Render preview →` CTAs → (4) Preview pane → (5) Variables table (keyboard navigable) → (6) Evidence bindings panel (`<KbGroundingPanel />` keyboard nav) → (7) Pricing bindings panel → (8) Classifier findings list (`<ClassifierChipRow />` keyboard nav).

**Motion:** Preview re-render after variable change: 150ms fade; 0ms under prefers-reduced-motion. Classifier severity chip color transition: 100ms; 0ms under reduced-motion. Publish modal open: 150ms fade; 0ms under reduced-motion. NO scroll-into-view auto-scroll on classifier finding click.

**Acceptance Criteria:**
- AC TPE-1: Component is a client component (`'use client'` directive)
- AC TPE-2: Component renders all 5 channel filter chips verbatim per D-25
- AC TPE-3: Component renders all 4 template_type labels verbatim per D-25
- AC TPE-4: Component renders all 5 classifier finding kinds verbatim per D-52
- AC TPE-5: Component renders all 3 classifier severity labels verbatim per D-52
- AC TPE-6: Per-channel preview pane renders correctly: email shows subject + content_html_rendered; sms/whatsapp shows content_text_rendered; push shows title + body; in_app shows content_html_rendered
- AC TPE-7: Variable inspector table renders all 4 variable source labels verbatim per D-26 precedence
- AC TPE-8: Missing variables notice renders verbatim "[err] {N} required variable(s) missing."
- AC TPE-9: Classifier blocks_dispatch=true renders verbatim "[err] Template publish blocked — resolve {N} severity=block findings before save."
- AC TPE-10: Classifier flags only renders verbatim "[warn] {N} finding(s) flagged for review."
- AC TPE-11: Pricing allowlisted accessor renders `<.c-badge--info>` "allowlisted" + `<Money>` resolved value
- AC TPE-12: Pricing non-allowlisted renders `<PlaceholderBanner variant="billing_placeholder">` with `{{MARKOS_PRICING_ENGINE_PENDING}}` verbatim
- AC TPE-13: Evidence binding TTL stale renders `<.c-badge--warning>` "TTL expired" + classifier finding severity='block' on evidence_ttl
- AC TPE-14: `<KbGroundingPanel />` reused from 216 §D-15 (NOT re-implemented) for evidence_bindings rendering
- AC TPE-15: `<ClassifierChipRow />` reused from 216 §D-15 (NOT re-implemented) for classifier findings rendering
- AC TPE-16: Sample recipient name in preview rendered via `<PIIRedactedField pii_classification="personal" />`
- AC TPE-17: Publish template CTA disabled when classifier_findings contains severity='block' OR banned-lexicon CI check fails
- AC TPE-18: Publish template CTA opens approval modal (215 billing-correction modal recipe) when classifier finding severity='block' on pricing_binding/factual_claim; calls `buildApprovalPackage(kind='channel_template_publish_approval')` per D-43
- AC TPE-19: Locale variant chain rendered: `<.c-chip-protocol>` parent_template_id when present; fallback notice when locale has no child
- AC TPE-20: Component fetches `/v1/channels/templates/{id}/preview` POST to render preview
- AC TPE-21: AST violation excerpt rendered with `@babel/parser` line/col reference per D-52
- AC TPE-22: Future phase placeholder "AI-suggest subject" renders `<PlaceholderBanner variant="future_phase_226_sales_enablement">`
- AC TPE-23: D-21 server/client boundary noted in file header comment
- AC TPE-24: D-08 token-only enforced (zero hex literals in module.css)
- AC TPE-25: Banned-lexicon zero-match on template body content_blocks + EmailCampaign subject (CI assertion BEFORE save)
- AC TPE-26: Storybook story `Channels/TemplateEditor` registers ≥6 named-state stories (Empty / Preview / ClassifierFindings / PricingFlagged / EvidenceTtlStale / LocaleFallback)

---

### Surface E — `components/markos/crm/outbound/ApprovalReviewPanel.tsx` (NEW)

**Files:**
- `components/markos/crm/outbound/ApprovalReviewPanel.tsx` — NEW; **`'use client'`**; renders P208 inbox entry detail for channel approvals.
- `components/markos/crm/outbound/ApprovalReviewPanel.module.css` — NEW; token-only.
- `.storybook/stories/ApprovalReviewPanel.stories.tsx` — NEW; CSF3 named-state stories.

**Layout grid (desktop ≥ md):**
```
+----------------------------------------------------------+
| <header class="c-card">                                  |
|   <h2>Channel approval</h2>                              |
|   <chip-protocol>approval_ref</chip-protocol>            |
|   <c-chip handoff-kind>{handoff_kind}</c-chip>           |
|   <c-badge>{status}</c-badge>                            |
|   <subject-link>                                         |
|     <c-button--tertiary>Open subject →</c-button>        |
|   </subject-link>                                        |
|   [if related_crm_id]                                    |
|     <chip-protocol>related_crm_id</chip-protocol>        |
|     <HealthScoreBadge score={...} />                     |
| </header>                                                |
+----------------------------------------------------------+
| <h3>Trigger reasons</h3>                                 |
| <ul>                                                     |
|   <li><c-badge>{triggerReason}</c-badge>                 |
|     <p>{triggerReason description}</p>                   |
|   </li>                                                  |
| </ul>                                                    |
+----------------------------------------------------------+
| <h3>Classifier findings</h3>                             |
| <ClassifierChipRow findings={...} />                     |
| <ul>                                                     |
|   <li><c-badge severity-coded>{severity}</c-badge>       |
|     <chip-finding-kind>{kind}</chip-finding-kind>        |
|     <p>{description}</p>                                 |
|   </li>                                                  |
| </ul>                                                    |
+----------------------------------------------------------+
| <h3>Pricing refs</h3>                                    |
| <ul>                                                     |
|   <li><chip-protocol>pricing_recommendation_id</chip>    |
|     <c-badge--info>{accessor_name}</c-badge>             |
|     <Money fromPricingRecommendation={pr_id} />         |
|   </li>                                                  |
|   [if non-allowlisted]                                   |
|     <PlaceholderBanner variant="billing_placeholder">    |
|       {{MARKOS_PRICING_ENGINE_PENDING}}                 |
|     </PlaceholderBanner>                                 |
| </ul>                                                    |
+----------------------------------------------------------+
| <h3>Evidence refs</h3>                                   |
| <KbGroundingPanel evidence_refs={...} />                 |
| <c-button--tertiary>View evidence →</c-button>           |
+----------------------------------------------------------+
| <h3>Sample render</h3>                                   |
| <preview-pane class="c-code-block">                      |
|   {sample_rendered_template}                             |
|   <PIIRedactedField pii_classification="personal"        |
|     value={sample_recipient_name} />                     |
| </preview-pane>                                          |
| <recipient-count>{N} recipient(s)</recipient-count>      |
| <chip-protocol>audience_snapshot_id</chip-protocol>      |
+----------------------------------------------------------+
| <h3>Action</h3>                                          |
| [if status='pending']                                    |
|   <c-button--primary>Approve</c-button>                  |
|   <c-button--destructive>Reject</c-button>               |
|   [if dispatch_run_id present AND campaign.status=       |
|     'dispatching']                                       |
|     <c-button--secondary>Revoke</c-button>               |
|     <RunStatusBadge run_id={dispatch_run_id} />          |
|     <recipients_already_sent>{N} sent</counter>          |
|     <remaining_recipients>{M} remaining</counter>        |
| [if status='approved']                                   |
|   <c-notice c-notice--success>                           |
|     [ok] Approved at {ts} by {actor}.                    |
|   </c-notice>                                            |
| [if status='rejected']                                   |
|   <c-notice c-notice--error>                             |
|     [err] Rejected at {ts} by {actor} — {reason}.        |
|   </c-notice>                                            |
| [if status='revoked']                                    |
|   <c-notice c-notice--info>                              |
|     [info] Revoked at {ts} by {actor} — {reason};        |
|     dispatch paused.                                     |
|   </c-notice>                                            |
| [if autonomy_ceiling]                                    |
|   <c-notice c-notice--error>                             |
|     [block] Autonomy ceiling reached for                 |
|       channel_dispatch_approval.                         |
|   </c-notice>                                            |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Single column. Trigger reasons / classifier / pricing / evidence / sample / action sections stack vertically. Sample render preview caps height with internal scroll. Approve/Reject/Revoke CTAs sticky to bottom of viewport.

**Components used:** `<HealthScoreBadge />` (216 §D-15 reused — when subject is reply-related approval), `<ClassifierChipRow />` (216 §D-15 reused), `<KbGroundingPanel />` (216 §D-15 reused), `<PIIRedactedField />` (216 §D-15 reused — sample recipient + recipient count), `<RunStatusBadge />` (P207 — when revoke modal active), `<Money />` recipe + `<PlaceholderBanner variant="billing_placeholder">`, `.c-card` (header card), `.c-chip` for handoff_kind chip, `.c-chip-protocol` for `approval_ref` / `related_crm_id` / `audience_snapshot_id` / `pricing_recommendation_id` / `evidence_ref` / `dispatch_run_id` / `agent_run_id`, `.c-badge--{state}` for status (pending→warning; approved→success; rejected→error; revoked→info), `.c-badge` for triggerReason chips + classifier severity chips, `.c-code-block` for sample render, `.c-button--primary` (`Approve`), `.c-button--destructive` (`Reject`), `.c-button--secondary` (`Revoke`), `.c-button--tertiary` for `Open subject →` / `View evidence →` mint-text inline, `.c-notice c-notice--{state}` for action result.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Channel approval" |
| Sub-section headings | "Trigger reasons", "Classifier findings", "Pricing refs", "Evidence refs", "Sample render", "Action" |
| 4 handoff_kind chip labels (verbatim NEW per 223) | "channel_dispatch_approval", "channel_template_publish_approval", "channel_suppression_bulk_approval", "channel_program_pause_approval" |
| 4 status labels (verbatim) | "pending", "approved", "rejected", "revoked" |
| 5 triggerReason labels (verbatim per D-16) | "class_broadcast", "class_revenue", "count_500_plus", "content_classifier_block", "manual_override" |
| Additional triggerReason labels per D-18 | "re_engagement_90d", "lifecycle_stage_lost" |
| Approve CTA | "Approve" |
| Reject CTA | "Reject" |
| Revoke CTA | "Revoke" |
| Open subject CTA (mint-text inline) | "Open subject →" |
| View evidence CTA (mint-text inline) | "View evidence →" |
| Recipient count format | "{N} recipient(s)" with tabular numerals |
| Recipients already sent counter | "{N} sent" with tabular numerals |
| Remaining recipients counter | "{M} remaining" with tabular numerals |
| Approved notice | `[ok] Approved at {timestamp} by {actor}.` |
| Rejected notice | `[err] Rejected at {timestamp} by {actor} — {reason}.` |
| Revoked notice | `[info] Revoked at {timestamp} by {actor} — {reason}; dispatch paused.` |
| Autonomy ceiling notice | `[block] Autonomy ceiling reached for channel_dispatch_approval.` |
| Reason capture validation (≥20 chars per 216 carry) | `[err] Reason must be at least 20 characters.` |
| Empty (no approval loaded) | `[info] Select an approval to review.` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load approval. {error_message}.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty` | No approval selected | Empty notice |
| `pending` | approval.status='pending' | Full panel + Approve/Reject/Revoke CTAs |
| `approved` | approval.status='approved' | Full panel + success notice; CTAs disabled |
| `rejected` | approval.status='rejected' | Full panel + error notice with reason; CTAs disabled |
| `revoked-pre-dispatch` | approval.status='revoked' AND dispatch_run_id IS NULL | Info notice "Revoked"; campaign returned to pending_approval per D-17 |
| `revoked-mid-dispatch` | approval.status='revoked' AND dispatch_run_id present AND recipients_already_sent > 0 | Info notice "Revoked; dispatch paused" + recipients_already_sent counter + remaining_recipients counter |
| `autonomy-ceiling` | autonomy ceiling reached | Block notice above action menu |
| `pricing-allowlisted` | All pricing_refs resolve through allowlisted accessor | `<Money>` rendered values; no sentinel |
| `pricing-non-allowlisted` | Any pricing_ref non-allowlisted | `<PlaceholderBanner variant="billing_placeholder">` sentinel; classifier finding severity='block' |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `approval_packages` table (P208 SOR) — read for approval_ref + handoff_kind + triggerReason + status + classifier_findings + pricing_refs + evidence_refs + sample_render + recipient_count + audience_snapshot_id
- `email_campaigns` / `lifecycle_journeys` / `channel_templates` (per subject_type) — read for subject metadata
- `markos_agent_runs` (P207) — read for dispatch_run_id when revoke mid-dispatch
- F-131 `/v1/channels/approvals` GET (Plan 05) + POST `/v1/channels/approvals/{id}/{approve,reject,revoke}` (Plan 05)
- buildApprovalPackage (D-43 — from `lib/markos/crm/agent-actions.ts:68`)
- revokeApproval (NEW per D-17 + Plan 03 task 1 export from same file) — flips approved→pending_approval pre-dispatch; sends pause signal to AgentRun mid-dispatch
- Reason capture (≥20 chars per 216 carry) on Reject + Revoke
- Banned-lexicon zero-match on reason capture (CI assertion)

**Accessibility focus order:** (1) `<h2>Channel approval</h2>` (programmatic focus on open) → (2) handoff_kind chip + `Open subject →` CTA → (3) Trigger reasons heading + list → (4) Classifier findings heading + list → (5) Pricing refs heading + list → (6) Evidence refs heading + `<KbGroundingPanel />` → (7) Sample render heading + preview pane → (8) Action heading → (9) Primary CTA (Approve) → (10) Secondary CTAs (Reject, Revoke when applicable).

**Motion:** Approve/Reject/Revoke modal open: 150ms fade; 0ms under prefers-reduced-motion. Status transition animation (pending → approved/rejected/revoked): 100ms color transition; 0ms under reduced-motion. NO scroll-into-view auto-scroll on action click.

**Acceptance Criteria:**
- AC ARP-1: Component is a client component (`'use client'` directive)
- AC ARP-2: Component renders all 4 handoff_kind chip labels verbatim (33-36th chips per 208-04 chain extension)
- AC ARP-3: Component renders all 4 status labels verbatim (pending/approved/rejected/revoked)
- AC ARP-4: Component renders all 7 triggerReason labels verbatim per D-16 + D-18 (class_broadcast/class_revenue/count_500_plus/content_classifier_block/manual_override/re_engagement_90d/lifecycle_stage_lost)
- AC ARP-5: Approve CTA opens approval modal (215 billing-correction modal recipe per inheritance); on confirm POST `/v1/channels/approvals/{id}/approve`
- AC ARP-6: Reject CTA opens reject modal with reason capture (≥20 chars validation per 216 carry); on confirm POST `/v1/channels/approvals/{id}/reject`
- AC ARP-7: Revoke CTA opens revoke modal with reason capture (≥20 chars); when dispatch_run_id present AND campaign.status='dispatching', shows recipients_already_sent + remaining_recipients counters via `<RunStatusBadge run_id={dispatch_run_id}>` (P207); on confirm POST `/v1/channels/approvals/{id}/revoke` AND sends pause signal via P207 AgentRun pause API per D-17
- AC ARP-8: All approval-package CTAs call `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-43 (NEVER `createApprovalPackage`)
- AC ARP-9: `<ClassifierChipRow />` reused from 216 §D-15 (NOT re-implemented) for classifier_findings rendering
- AC ARP-10: `<KbGroundingPanel />` reused from 216 §D-15 (NOT re-implemented) for evidence_refs rendering
- AC ARP-11: `<HealthScoreBadge />` reused from 216 §D-15 when subject is reply-related approval AND related_crm_id present
- AC ARP-12: Sample recipient name in sample render rendered via `<PIIRedactedField pii_classification="personal" />`
- AC ARP-13: Pricing refs allowlisted accessor renders `<Money>` resolved value; non-allowlisted renders `<PlaceholderBanner variant="billing_placeholder">` with `{{MARKOS_PRICING_ENGINE_PENDING}}` verbatim
- AC ARP-14: Autonomy ceiling notice renders verbatim "[block] Autonomy ceiling reached for channel_dispatch_approval."
- AC ARP-15: Approved/Rejected/Revoked notices render verbatim with timestamp + actor + reason
- AC ARP-16: Recipient count + audience_snapshot_id chip + `Open audience →` mint-text inline link to P221 surface
- AC ARP-17: Component fetches `/v1/channels/approvals/{id}` GET to load approval detail
- AC ARP-18: D-21 server/client boundary noted in file header comment
- AC ARP-19: D-08 token-only enforced (zero hex literals in module.css)
- AC ARP-20: Banned-lexicon zero-match on reason capture (CI assertion)
- AC ARP-21: Storybook story `Channels/ApprovalReviewPanel` registers ≥4 named-state stories (Pending / Approved / Rejected / Revoked)

---

### Surface F — `components/markos/operator/MorningBriefChannelEntries.tsx` (NEW P208 entry-type renderer; mobile_priority=critical)

**Files:**
- `components/markos/operator/MorningBriefChannelEntries.tsx` — NEW; **`'use client'`**; renders 2 channel-related rollup sections inside existing 208-02 Morning Brief.
- `components/markos/operator/MorningBriefChannelEntries.module.css` — NEW; token-only.
- (NO standalone Storybook story — rendered as part of 208 Morning Brief story set; covered by ChannelProgramsList + DeliverabilityWorkspace + MessagingThreadsList stories upstream)

**Layout grid (desktop + mobile — same; mobile_priority=critical):**
```
+----------------------------------------------------------+
| <section>                                                |
|   <h2>Channel signals</h2>                               |
|   [Section 1: Reply pending threads (top 5)]             |
|   <h3>Reply pending threads</h3>                         |
|   <p class="t-lead">{N} thread(s) awaiting your reply</p>|
|   <ul>                                                   |
|     <li class="c-card">                                  |
|       <c-chip channel-coded>{channel}</c-chip>           |
|       <PIIRedactedField pii_classification="personal"    |
|         value={recipient_name} />                        |
|       <last-message-at>{N} {unit} ago</last>             |
|       [if escalated] <c-badge--warning>                  |
|         [warn] Escalated</c-badge>                       |
|       <body>{last_message_snippet}</body>                |
|       <chip-protocol>thread_id</chip-protocol>           |
|       <c-button--tertiary>Open thread →</c-button>       |
|     </li>                                                |
|     ...up to 5 rows                                      |
|   </ul>                                                  |
|   [if N == 0] <c-notice c-notice--success>               |
|     [ok] All threads attended.</c-notice>                |
|                                                          |
|   [Section 2: At-risk senders]                           |
|   <h3>At-risk senders</h3>                               |
|   <p class="t-lead">{N} sender(s) need attention</p>     |
|   <ul>                                                   |
|     <li class="c-card">                                  |
|       <c-badge--error>at_risk</c-badge>                  |
|       <h4>{sender_label}</h4>                            |
|       <chip-protocol>sender_id</chip-protocol>           |
|       <reputation-score>{N}/100</score>                  |
|       <next-action>Pause broadcast class until           |
|         reputation recovers.</next-action>               |
|       [if spike_detected]                                |
|         <c-notice c-notice--warning>                     |
|           [warn] Bounce spike — {N}σ above 7d baseline.  |
|         </c-notice>                                      |
|       <c-button--tertiary>Open sender →</c-button>       |
|     </li>                                                |
|     ...                                                  |
|   </ul>                                                  |
|   [if N == 0] <c-notice c-notice--success>               |
|     [ok] All senders healthy.</c-notice>                 |
| </section>                                               |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Same vertical layout (mobile_priority=critical — operator daily start). Each card stacks vertically with reduced metadata. Touch target ≥44px.

**Components used:** `<PIIRedactedField />` (216 §D-15 reused), `.c-card` (per row), `.c-chip` for channel chip, `.c-chip-protocol` for `thread_id` / `sender_id`, `.c-badge--{state}` for at_risk reputation_status + escalated thread, `.c-code-inline` (tabular numerals on reputation_score), `.c-button--tertiary` for `Open thread →` / `Open sender →` mint-text inline, `.c-notice c-notice--{state}` for empty state success notices + spike detected warning.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| `<h2>` | "Channel signals" |
| Section 1 heading | "Reply pending threads" |
| Section 1 lead | "{N} thread(s) awaiting your reply" |
| Section 2 heading | "At-risk senders" |
| Section 2 lead | "{N} sender(s) need attention" |
| Last_message_at format | "{N} {unit} ago" |
| Escalated badge | "Escalated" |
| At-risk next-action (verbatim per D-35) | "Pause broadcast class until reputation recovers." |
| Spike detected notice (verbatim per D-35) | `[warn] Bounce spike — {N}σ above 7d baseline.` |
| Reputation score format | "{N}/100" with tabular numerals |
| Open thread CTA | "Open thread →" |
| Open sender CTA | "Open sender →" |
| Empty Section 1 (no reply_pending) | `[ok] All threads attended.` |
| Empty Section 2 (no at_risk) | `[ok] All senders healthy.` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load channel signals. {error_message}.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty-both` | Both sections empty | Both success notices ("[ok] All threads attended." + "[ok] All senders healthy.") |
| `populated-threads` | Section 1 > 0 | Up to 5 reply_pending thread cards (newest reply first) |
| `populated-senders` | Section 2 > 0 | All at_risk sender cards |
| `populated-both` | Both sections > 0 | Both populated |
| `escalated-thread` | Per-thread current_status='escalated' | Per-row escalated badge with `[warn]` glyph |
| `spike-detected` | Per-sender spike alert active (cron `channels-bounce-spike-alert` daily detected >2σ) | Per-row warning notice |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `messaging_threads` (per D-03) — read top 5 reply_pending for current_operator_user_id
- `sender_identities` + `deliverability_posture` (per D-06 + D-07) — read all at_risk senders with reputation_status='at_risk'
- F-123 GET `/v1/channels/messaging/threads?owner_user_id=ME&status=reply_pending&limit=5` (Plan 05)
- F-126 GET `/v1/channels/email/deliverability?reputation_status=at_risk` (Plan 05)
- Plan 06 cron `channels-bounce-spike-alert.js` (daily) detects spike (>2σ) per D-35 — surfaces via spike_detected flag on sender row

**Accessibility focus order:** (1) `<h2>Channel signals</h2>` → (2) Section 1 heading "Reply pending threads" → (3) Per-thread cards (`<ul>`) keyboard nav → (4) Per-thread "Open thread →" CTA → (5) Section 2 heading "At-risk senders" → (6) Per-sender cards (`<ul>`) keyboard nav → (7) Per-sender "Open sender →" CTA.

**Motion:** Refresh interval (30s polling): 100ms toast slide on update; 0ms under prefers-reduced-motion.

**Acceptance Criteria:**
- AC MBC-1: Component is a client component (`'use client'` directive)
- AC MBC-2: Component renders 2 sections: "Reply pending threads" + "At-risk senders" verbatim
- AC MBC-3: Section 1 reply_pending threads limited to top 5 newest reply first
- AC MBC-4: Section 1 filtered by `owner_user_id == current_operator_user_id` (per D-23 reply continuity)
- AC MBC-5: Section 2 includes ALL senders with reputation_status='at_risk' (no limit)
- AC MBC-6: Per-thread recipient name rendered via `<PIIRedactedField pii_classification="personal" />`
- AC MBC-7: Per-sender at_risk next-action renders verbatim "Pause broadcast class until reputation recovers."
- AC MBC-8: Spike detected notice renders verbatim "[warn] Bounce spike — {N}σ above 7d baseline." when cron `channels-bounce-spike-alert` detected >2σ
- AC MBC-9: Empty Section 1 renders verbatim "[ok] All threads attended."
- AC MBC-10: Empty Section 2 renders verbatim "[ok] All senders healthy."
- AC MBC-11: Per-thread "Open thread →" mint-text inline link deep-links to MessagingThreadsList row
- AC MBC-12: Per-sender "Open sender →" mint-text inline link deep-links to DeliverabilityWorkspace per-sender card
- AC MBC-13: Per-thread escalated badge renders when current_status='escalated' (per D-23)
- AC MBC-14: Reputation score renders with tabular numerals (`.c-code-inline`)
- AC MBC-15: mobile_priority=critical registered in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: channels_brief`
- AC MBC-16: Touch target ≥44px on coarse pointers (already global per 213.2)
- AC MBC-17: Component fetches both endpoints in parallel; renders independently
- AC MBC-18: Renders alongside existing 208-02 Morning Brief sections (additive — does NOT replace existing content)
- AC MBC-19: D-21 server/client boundary noted in file header comment
- AC MBC-20: D-08 token-only enforced (zero hex literals in module.css)

---

### Surface G — `components/markos/operator/ApprovalInboxChannelEntries.tsx` (NEW P208 entry-type renderer)

**Files:**
- `components/markos/operator/ApprovalInboxChannelEntries.tsx` — NEW; **`'use client'`**; renders 4 NEW handoff_kind entry types in P208 Approval Inbox row list.
- `components/markos/operator/ApprovalInboxChannelEntries.module.css` — NEW; token-only.
- (NO standalone Storybook story — rendered as part of 208-04 Approval Inbox story set; covered by ApprovalReviewPanel stories upstream)

**Layout grid (desktop + mobile — same row layout):**
```
+----------------------------------------------------------+
| <ul> P208 Approval Inbox rows for channel entries:       |
|   <li class="c-card">                                    |
|     <header>                                             |
|       <c-chip handoff-kind-coded>{handoff_kind}</c-chip> |
|       <chip-protocol>approval_ref</chip-protocol>        |
|       <c-badge>{status}</c-badge>                        |
|       <created-at>{N} {unit} ago</created-at>            |
|     </header>                                            |
|     <body>                                               |
|       [if subject_type='email_campaign']                 |
|         <h4>Email campaign: {campaign_name}</h4>         |
|         <c-badge class-coded>{class}</c-badge>           |
|         <chip-channel>email</chip-channel>               |
|         <recipient-count>{N}</count>                     |
|         <chip-protocol>audience_snapshot_id</chip>       |
|       [if subject_type='lifecycle_journey']              |
|         <h4>Lifecycle journey: {journey_name}</h4>       |
|         <chip-channel>{channel}</chip-channel>           |
|         <step-count>{N} step(s)</step>                   |
|       [if subject_type='channel_template']               |
|         <h4>Template publish: {template_name}</h4>       |
|         <chip-channel>{channel}</chip-channel>           |
|         <c-badge>{template_type}</c-badge>               |
|       [if subject_type='channel_suppression_bulk']       |
|         <h4>Suppression bulk add: {N} recipients</h4>    |
|         <c-badge dsr-coded>{dsr_source}</c-badge>        |
|       [if subject_type='channel_program_pause']          |
|         <h4>Pause dispatch: {campaign_name}</h4>         |
|         <RunStatusBadge run_id={dispatch_run_id} />      |
|         <recipients-already-sent>{N} sent</counter>      |
|         <remaining-recipients>{M} remaining</counter>    |
|       <h5>Trigger reasons</h5>                           |
|       <ul>                                               |
|         <li><c-badge>{triggerReason}</c-badge></li>      |
|       </ul>                                              |
|       <h5>Recipient sample</h5>                          |
|       <PIIRedactedField pii_classification="personal"    |
|         value={sample_recipient_name} />                 |
|     </body>                                              |
|     <footer>                                             |
|       <c-button--tertiary>Open approval →</c-button>     |
|     </footer>                                            |
|   </li>                                                  |
|   ...repeat per channel approval entry                   |
| </ul>                                                    |
+----------------------------------------------------------+
```

**Layout grid (mobile < 640px):** Same vertical card layout. Per-card sections stack with reduced metadata. Touch target ≥44px on "Open approval →" CTA.

**Components used:** `<PIIRedactedField />` (216 §D-15 reused), `<RunStatusBadge />` (P207 — when subject_type='channel_program_pause'), `.c-card` (per row), `.c-chip` for handoff_kind chip + class chip + channel chip, `.c-chip-protocol` for `approval_ref` / `audience_snapshot_id` / `dispatch_run_id` / `template_id` / `campaign_id` / `journey_id`, `.c-badge--{state}` for status (pending→warning) + class (broadcast→error; revenue→warning; lifecycle→info; transactional→success), `.c-code-inline` (tabular numerals on counters), `.c-button--tertiary` for `Open approval →` mint-text inline.

**Copy register (verbatim):**
| Element | Copy |
|---------|------|
| 4 handoff_kind chip labels (verbatim NEW per 223) | "channel_dispatch_approval", "channel_template_publish_approval", "channel_suppression_bulk_approval", "channel_program_pause_approval" |
| 5 subject_type-specific row titles | "Email campaign: {name}", "Lifecycle journey: {name}", "Template publish: {name}", "Suppression bulk add: {N} recipients", "Pause dispatch: {name}" |
| 4 class chip labels (verbatim per D-02) | "broadcast", "lifecycle", "transactional", "revenue" |
| 5 channel chip labels (verbatim) | "email", "sms", "whatsapp", "push", "in_app" |
| Sub-row headings | "Trigger reasons", "Recipient sample" |
| 7 triggerReason labels (verbatim per D-16 + D-18) | "class_broadcast", "class_revenue", "count_500_plus", "content_classifier_block", "manual_override", "re_engagement_90d", "lifecycle_stage_lost" |
| Recipient count format | "{N}" with tabular numerals |
| Recipients already sent counter | "{N} sent" |
| Remaining recipients counter | "{M} remaining" |
| Open approval CTA (mint-text inline) | "Open approval →" |
| Empty (no channel approvals pending) | `[info] No channel approvals pending.` |
| Loading | (server-rendered) |
| Error | `[err] Failed to load approvals. {error_message}.` |

**State matrix:**
| State | Trigger | Render |
|-------|---------|--------|
| `loading` | Initial server render | (server-rendered) |
| `empty` | No channel approvals pending | Empty notice |
| `populated` | Channel approvals > 0 | Full row list |
| `email-campaign` | Per-row subject_type='email_campaign' | Campaign-specific render with class chip + audience |
| `lifecycle-journey` | Per-row subject_type='lifecycle_journey' | Journey-specific render with step count |
| `channel-template` | Per-row subject_type='channel_template' | Template-specific render with template_type |
| `channel-suppression-bulk` | Per-row subject_type='channel_suppression_bulk' | Suppression-specific render with DSR-source flag |
| `channel-program-pause` | Per-row subject_type='channel_program_pause' | Pause-specific render with `<RunStatusBadge>` + counters |
| `error` | Fetch error | Error notice |

**Data dependencies:**
- `approval_packages` table (P208 SOR) — read for channel-related entries (handoff_kind starts with 'channel_')
- `email_campaigns` / `lifecycle_journeys` / `channel_templates` / `channel_suppressions` / `markos_agent_runs` (per subject_type) — read for subject metadata
- F-131 GET `/v1/channels/approvals?status=pending` (Plan 05)

**Accessibility focus order:** (1) Per-row card heading (`<h4>`) keyboard navigable → (2) Trigger reasons section → (3) Recipient sample → (4) "Open approval →" CTA.

**Motion:** Status transition (pending → approved/rejected/revoked) on inbox refresh: 100ms color transition; 0ms under prefers-reduced-motion. NO scroll-into-view auto-scroll.

**Acceptance Criteria:**
- AC AIC-1: Component is a client component (`'use client'` directive)
- AC AIC-2: Component renders all 4 handoff_kind chip labels verbatim (33-36th chips per 208-04 chain extension)
- AC AIC-3: Component renders 5 subject_type-specific row titles correctly
- AC AIC-4: Component renders all 4 class chip labels verbatim per D-02 (when subject_type='email_campaign')
- AC AIC-5: Component renders all 5 channel chip labels verbatim
- AC AIC-6: Component renders all 7 triggerReason labels verbatim per D-16 + D-18
- AC AIC-7: Per-row recipient sample rendered via `<PIIRedactedField pii_classification="personal" />`
- AC AIC-8: Subject_type='channel_program_pause' renders `<RunStatusBadge run_id={dispatch_run_id}>` (P207) + recipients_already_sent + remaining_recipients counters with tabular numerals
- AC AIC-9: Subject_type='channel_suppression_bulk' renders DSR-source flag chip when applicable
- AC AIC-10: Per-row `Open approval →` mint-text inline link deep-links to ApprovalReviewPanel for the row's approval_ref
- AC AIC-11: Empty state renders verbatim "[info] No channel approvals pending."
- AC AIC-12: Component fetches `/v1/channels/approvals?status=pending` GET to load approval list
- AC AIC-13: Renders alongside existing 208-04 Approval Inbox row renderers (additive — handles 4 new handoff_kind chips; CRM kinds remain DEFERRED to future P208 admin extension per `future_phase_222_approval_inbox_extensions` translation gate)
- AC AIC-14: D-21 server/client boundary noted in file header comment
- AC AIC-15: D-08 token-only enforced (zero hex literals in module.css)

---

### Surface H — `components/markos/crm/outbound/outbound-workspace.tsx` (EVOLVED per D-33)

**Files modified:** `components/markos/crm/outbound/outbound-workspace.tsx` (EVOLVED; existing CRM outbound shell)

**Note:** As of 2026-05-04, the file `components/markos/crm/outbound/outbound-workspace.tsx` does NOT yet exist on disk; the existing CRM outbound surface lives at `components/markos/crm/outbound-workspace.tsx` (verified — components/markos/crm/outbound/ directory does not yet exist). Plan 05 task 2 step 6 either CREATES the new path under `components/markos/crm/outbound/` (preferred — matches the 5 NEW components co-located there) OR EVOLVES the existing path. The 223-05 PLAN frontmatter `files_modified` lists the new path `components/markos/crm/outbound/outbound-workspace.tsx`, indicating the parent shell relocates to live alongside the 5 NEW components in the new subdirectory. Legacy callers from `components/markos/crm/*` continue to work via re-export (read-through adapter pattern preserved).

**Scope of evolution (NOT a new component):**
- Outer shell PRESERVED VERBATIM (existing CRM outbound entry points + tenant context wrapper)
- Tab bar ADDED: "Programs | Threads | Deliverability | Templates | Approvals" with mint-underline on active tab
- Each tab renders the corresponding NEW component (ChannelProgramsList / MessagingThreadsList / DeliverabilityWorkspace / TemplateEditor / ApprovalReviewPanel)
- Legacy sections (existing CRM sequences/templates/conversations from `lib/markos/outbound/scheduler.ts` + `conversations.ts`) REMAIN MOUNTED via legacy adapter `lib/markos/channels/adapters/legacy-outbound.ts` (P223-owned greenfield per D-44) and tagged "Legacy (deprecating)"
- mobile_priority=secondary (parent inherits)

**Non-regression assertions:**
- AC OWE-1: Outer shell tenant context wrapper preserved verbatim
- AC OWE-2: Existing CRM outbound entry points (`api/crm/outbound/*.js` legacy paths) continue to function via legacy adapter (NOT broken)
- AC OWE-3: Tab bar renders 5 tabs verbatim: "Programs", "Threads", "Deliverability", "Templates", "Approvals"
- AC OWE-4: Active tab indicator uses mint underline (`--color-primary-text` per D-09)
- AC OWE-5: Each tab content renders the corresponding NEW component (ChannelProgramsList / MessagingThreadsList / DeliverabilityWorkspace / TemplateEditor / ApprovalReviewPanel)
- AC OWE-6: Legacy sections render with "Legacy (deprecating)" badge composed from `<.c-badge--info>` + bracketed glyph
- AC OWE-7: Legacy adapter `lib/markos/channels/adapters/legacy-outbound.ts` (P223-owned greenfield per D-44) bridges legacy outbound → new channel program models
- AC OWE-8: Mobile breakpoint behavior unchanged; tab bar collapses to dropdown on mobile < 640px
- AC OWE-9: D-21 server/client boundary noted in file header comment
- AC OWE-10: D-08 token-only enforced (zero hex literals in module.css)
- AC OWE-11: outbound-workspace integration test asserts tab bar renders all 5 tabs AND legacy sections remain mounted

---

### Surface I — `components/markos/crm/TimelineDetailView.tsx` (EVOLVED per D-34)

**Files modified:** `components/markos/crm/TimelineDetailView.tsx` (EVOLVED; first shipped in 222-03)

**Scope of evolution (per 222 D-25 + 223 D-34):**
- 222 baseline rendering PRESERVED VERBATIM (11 source_domain filter chips + 7 commercial_signal filter chips + Customer360 header + per-row event chips + tombstoned state + filter empty state + error state)
- Channel-event-chips section ADDED per row when source_domain IN ('email','messaging','push','in_app')
- Per-row chips: opened ([ok] + green), clicked ([ok] + green), replied ([ok] + sentiment-coded), bounced ([err] + red), complained ([err] + red), unsubscribed ([warn] + warning), suppressed ([block] + neutral)
- Chips read from `dispatch_events` keyed on `source_event_ref` (per D-29 fan-out — shared ID threads channel events ↔ cdp_events ↔ EvidenceMap ↔ crm_activity)
- Click chip → opens lightweight detail pop showing `<.c-chip-protocol>` `dispatch_attempt_id` + `provider_message_id` (NOT secrets — public IDs per D-39)
- mobile_priority=secondary (parent inherits from 222 baseline)

**Non-regression assertions:**
- AC TDE-1: 222 baseline TimelineDetailView functionality preserved (all 15 222 ACs continue to pass)
- AC TDE-2: Channel-event-chips section renders ONLY when source_domain IN ('email','messaging','push','in_app')
- AC TDE-3: Per-row chips render 7 event types verbatim (opened/clicked/replied/bounced/complained/unsubscribed/suppressed)
- AC TDE-4: Per-row chip color coding: opened/clicked → success; replied → sentiment-coded (positive→success, negative→error, neutral→info); bounced/complained → error; unsubscribed → warning; suppressed → subtle neutral
- AC TDE-5: Per-row chip bracketed-glyph pairing: opened/clicked/replied[positive] → `[ok]`; bounced/complained → `[err]`; unsubscribed → `[warn]`; suppressed → `[block]`; replied[negative] → `[err]`; replied[neutral] → `[info]`
- AC TDE-6: Chips read from `dispatch_events` keyed on `source_event_ref` (per D-29 fan-out)
- AC TDE-7: Click chip opens detail pop showing `<.c-chip-protocol>` `dispatch_attempt_id` + `provider_message_id`
- AC TDE-8: Provider secrets NEVER appear in detail pop (only public IDs per D-39)
- AC TDE-9: 222 commercial_signal taxonomy 7-enum verbatim (interest/risk/expansion/renewal/support/pricing/silence) honored in chip color coding
- AC TDE-10: 222 source_domain 11-enum verbatim labels honored ("email", "messaging" — per D-05)
- AC TDE-11: D-21 server/client boundary preserved (existing 222 `'use client'` directive)
- AC TDE-12: D-08 token-only enforced (zero NEW hex literals introduced by 223 evolution)
- AC TDE-13: TimelineDetailView integration test asserts channel-event-chips render for source_domain IN ('email','messaging','push','in_app') AND do NOT render for other source_domains
- AC TDE-14: Storybook story `Crm360/TimelineDetailView` (existing 222 story) gains new variant "WithChannelEvents" demonstrating chip rendering

---

## Cross-Surface Acceptance Criteria

### X-cutting (XC-N)

- AC XC-1: All 5 NEW components + 2 P208 entry-type renderers register Storybook CSF3 named-state stories under `Channels/*` path; 223-06 Plan ships `chromatic.config.json` covering 5 NEW components × ≥4 variants each (≥20 snapshots)
- AC XC-2: All 5 NEW + 2 P208 renderer + 2 EVOLVED components honor D-08 token-only (zero hex literals in module.css files)
- AC XC-3: All 5 NEW + 2 P208 renderer components honor D-09 mint-as-text + D-09b `.c-notice` mandatory + D-13 `.c-card--feature` reserved + D-14 no `.c-table`
- AC XC-4: All 5 NEW + 2 P208 renderer components are `'use client'` per existing convention; consuming pages remain server components per D-21
- AC XC-5: All 5 NEW + 2 P208 renderer components consume `<PIIRedactedField />` (216 §D-15) for any CDP-resolved IdentityProfile recipient PII field
- AC XC-6: All 5 NEW + 2 P208 renderer + 2 EVOLVED components register in `lib/markos/operator/shell.ts` `SurfaceRouteContract` with `surface_family: channels_*` and correct `mobile_priority` literal (MessagingThreadsList + MorningBriefChannelEntries = `critical`; 7 surfaces = `secondary`)
- AC XC-7: Banned-lexicon zero-match enforced on **template body content_blocks + EmailCampaign subject + reply suggestion body + classifier-finding operator-note + sender warming notes + suppression operator-note + ApprovalReviewPanel reason capture** BEFORE TemplateEditor "Publish template" save AND BEFORE `external.send` dispatch
- AC XC-8: All approval-package call paths use `buildApprovalPackage` from `lib/markos/crm/agent-actions.ts:68` per D-43 (NEVER `createApprovalPackage`); grep `createApprovalPackage` across `components/markos/crm/outbound/` + `components/markos/operator/` returns 0 matches
- AC XC-9: All 5 cron handlers (Plan 06) ship under `api/cron/channels-*.js` (NOT `app/api/cron/channels-*/route.ts`) per D-49; auth via `x-markos-cron-secret` header
- AC XC-10: All 19 REST handlers ship under `api/v1/channels/*.js` (NOT `app/api/v1/channels/*/route.ts`) per D-42; auth via `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` per D-42
- AC XC-11: Test runner is `npm test` (Node `--test`) per D-46; all `*.test.js` files (NOT `.test.ts`); imports `node:test` + `node:assert/strict`; NO NEW vitest, NO NEW playwright runtime install in P223
- AC XC-12: Plan 06 closeout meta-test asserts `package.json` did not gain `vitest` or NEW `@playwright/test` keys during P223 execution (existing axe-playwright devDep is preserved per D-46)
- AC XC-13: Plan 01 Task 0.5 architecture-lock detector test scans every `.planning/phases/223-*-PLAN.md` for forbidden tokens (`createApprovalPackage`, `requireSupabaseAuth`, `requireTenantContext`, `serviceRoleClient` outside auth boundary, `lookupPlugin`, `public/openapi.json`, `app/(public)`, `app/(markos)` AS NEW PATH, `route.ts` outside doctrinal NO-X comments, `vitest run`, `from 'vitest'`, `.test.ts`, `"stub if missing"`, `"if exists"`, `workflow.agentrun_v2_available`, `workflow.outbound_consent_legacy_view`)
- AC XC-14: Hard preflight upstream gate via `assertUpstreamReady(['P205', 'P207', 'P208', 'P209', 'P210', 'P211', 'P221', 'P222'])` per D-45; NO soft-skip, NO "stub if missing"
- AC XC-15: All 9 migrations slot-pre-allocated per D-41 (P223 owns 113..121; 9 slots; no gaps); closeout `migration-slot-collision.test.js` (Plan 06) asserts no overlap
- AC XC-16: All 10 F-IDs slot-pre-allocated per D-40 (P223 owns F-122..F-131; 10 slots; no gaps); closeout `f-id-collision.test.js` (Plan 06) asserts no overlap
- AC XC-17: All 11 new tables (sender_identities, deliverability_posture, channel_templates, email_campaigns, messaging_threads, lifecycle_journeys, lifecycle_journey_runs, channel_suppressions, dispatch_events, dispatch_skips, in_app_messages) have RLS verified cross-tenant denied via Plan 06 `test/channels/closeout/rls-suite.test.js`
- AC XC-18: D-50 frequency-cap BEFORE INSERT trigger on `dispatch_events` enforces rolling-window cap (default 7 days, tenant-configurable); rejects when count >= cap; replaces previous "Claude's Discretion" service-layer approach
- AC XC-19: D-51 consent-write trigger on `outbound_consent_records_legacy` enforces single-writer rule via `app.consent_writer_source` GUC; only `setConsentState` (P221) writes
- AC XC-20: D-52 AST/allowlist content classifier via `@babel/parser` (NOT 5-line regex); ALLOWLISTED_ACCESSORS = `['getPricingFor', 'formatPrice', 'usePricing', 'pricingFromEngine']`
- AC XC-21: D-29 single fan-out emit() function in `lib/markos/channels/events/emit.ts` writes 5 destinations transactionally (cdp_events + crm_activity + aggregate-counter + dispatch_events + setConsentState if consent-affecting); fail-closed
- AC XC-22: D-19 per-recipient 6-layer dispatch gate enforced (Consent → Suppression → SessionWindow [WhatsApp only per D-54] → FrequencyCap [DB trigger per D-50] → QuietHours → Jurisdiction); skipped recipients write `dispatch_skips` row with `gate_failed` reason
- AC XC-23: D-54 WhatsApp 24-hour session window check runs BEFORE quiet-hours layer; defer-past-session is fail-closed `reason='whatsapp_session_lost'`
- AC XC-24: Pitfall 7 auto-reply detection (Plan 04) — vacation responder + Auto-Submitted header + In-Reply-To + min body length filters BEFORE reply flow; auto-replies log only, no thread.reply_pending transition
- AC XC-25: Pitfall 8 Knock cascade (Plan 04) — push delivery_failed event maps to `handleBounceEvent('hard')` → suppression chain
- AC XC-26: Pitfall 9 + A11 Resend metadata-only webhook (Plan 04) — inbound webhook payload contains METADATA only; reply handler MUST call Resend Received Emails API to fetch body BEFORE opt-out detection / sentiment classification
- AC XC-27: Reply continuity flow (D-22 + D-23) — inbound reply → lookupOrCreateThread → set thread.current_status='reply_pending' → append crm_activity → emit cdp_events → create CRM task → fire opt-out detector → if matched, setConsentState (single writer rule D-12 + D-51 trigger)
- AC XC-28: Plan 06 ships Chromatic snapshot gate covering 5 NEW UI surfaces with Empty / Populated / Error / Tombstoned variants (≥4 named-state stories per surface; TemplateEditor adds ClassifierFindings + PricingFlagged for ≥6)
- AC XC-29: Plan 06 ships ONE operator-journey E2E test using EXISTING `axe-playwright` devDep per D-46 (campaign create → approve → dispatch → reply → bounce); NOT a new playwright runtime
- AC XC-30: Plan 06 closeout regression — P100-P105 + P102 Kanban default + P103 urgency bias + P105 record brief + P101 HIGH_SIGNAL + P221 consent + P222 customer360/NBA/lifecycle/committee all green
- AC XC-31: Plan 06 `autonomous: false` per Plan 06 RL1 — operator review checkpoint:human-action for sender warming + DKIM/SPF/DMARC verification + Knock app provisioning + Resend dashboard webhook configuration

---

## Approval Inbox Handoff Chain Extension (post-223 = 36 chips)

```
Pre-223 chain (post-222 = 32 chips):
1.  approval (P207)
2.  recovery (P207)
3.  follow_up (P207)
4.  manual_input (P207)
5.  billing_charge_approval (P214)
6.  billing_correction_approval (P215)
7.  support_response_approval (P216)
8.  save_offer_approval (P216)
9-20. P218..P220 12 chips (218×4 + 219×8 + 220×7 trimmed to 12 active per 220 closeout)
21. partner_payout_export_approval (P220 26th)
22-26. (P220 placeholders for ecosystem motions)
27. consent_drift_resolution (P221)
28. audience_activation_approval (P221)
29. dsr_export_approval (P221)
30. crm360_nba_execute_approval (P222)
31. crm360_lifecycle_transition_approval (P222)
32. crm360_tombstone_cascade_approval (P222)

POST-223 NEW (start-of-v4.2.0-commercial-engines-lane CHANNEL-ENGINE state):
33. channel_dispatch_approval               ← P223-05 ApprovalReviewPanel "Approve" path when class IN ('broadcast','revenue') OR audience_size >= 500 OR re-engagement >90d (D-18) OR lifecycle_stage='lost' (D-18); calls buildApprovalPackage per D-43
34. channel_template_publish_approval       ← P223-05 TemplateEditor "Publish template" path when content_classifier finding severity='block' on pricing_binding/factual_claim (D-16/D-52); calls buildApprovalPackage per D-43
35. channel_suppression_bulk_approval       ← P223-05 DeliverabilityWorkspace "Bulk add suppressions" path when count > 100 (D-32); calls buildApprovalPackage per D-43
36. channel_program_pause_approval          ← P223-05 ApprovalReviewPanel "Revoke" path mid-dispatch (D-17); calls buildApprovalPackage per D-43; on confirm sends pause signal via P207 AgentRun pause API
```

Row rendering of these 4 new chips ships in 223-05 via `ApprovalInboxChannelEntries.tsx` renderer — DISSOLVES the `future_phase_222_approval_inbox_extensions` placeholder for channel-related entry types. CRM kinds (30/31/32) remain DEFERRED to future P208 admin extension.

---

## Future-Surface UI Binding Contracts

### Future-Surface 1 — `future_phase_223_admin_ui` (multi-page Channel Engine admin)

**Anticipated path:** `app/(markos)/channels/{programs,threads,deliverability,templates,approvals,suppressions,senders}/page.tsx` future surfaces. (Note: `app/(markos)/` is PRESERVED per D-43 for existing routes; future admin pages MAY use this tree.)

**Contract:** When the future admin phase ships, it composes the 5 NEW 223 components (ChannelProgramsList, MessagingThreadsList, DeliverabilityWorkspace, TemplateEditor, ApprovalReviewPanel) in dedicated routes. Server components fetch via `requireHostedSupabaseAuth` per D-42; render via the same client components shipping in 223. **D-32 architecture-lock holds** — legacy `api/*.js` routes; auth canon; test runner `npm test`; OpenAPI at `contracts/openapi.json`; MCP registry `lib/markos/mcp/tools/index.cjs`; cron at `api/cron/*.js`; helper canon `buildApprovalPackage`. Future surfaces render `<PlaceholderBanner variant="future_phase_223_admin_ui">` until those phases ship.

### Future-Surface 2 — `future_phase_224_conversion_surfaces` (P224 landing pages + forms + launch)

**Anticipated path:** `app/(markos)/conversion/{landing,forms,launches}/page.tsx` future surfaces.

**Contract:** When P224 conversion surfaces ship, they consume 223 substrate (`email_campaigns` + `lifecycle_journeys` shapes for launch orchestration; D-29 single fan-out emit() for landing-page-form-submission → cdp_events + crm_activity + dispatch_events writeback; 223 channel_templates for confirmation emails + form-submission acknowledgements; 223 SenderIdentity for launch broadcast emails). SSE/websocket for in_app messages real-time delivery (currently `next-nav read` per D-10) deferred from 223 to P224. Future surfaces render `<PlaceholderBanner variant="future_phase_224_conversion_surfaces">` until that phase ships.

### Future-Surface 3 — `future_phase_225_attribution_journey_analytics` (P225 attribution + journey + narrative)

**Anticipated path:** `app/(markos)/analytics/{attribution,journey,narrative,anomaly}/page.tsx` future surfaces.

**Contract:** When P225 attribution surfaces ship, they consume 223 substrate (`dispatch_events` + `cdp_events` via D-29 fan-out for attribution + journey + narrative semantic layer; `email_campaigns.opened_count/clicked_count/replied_count` for engagement scoring; `messaging_threads.last_message_at` + sentiment for support narrative; `deliverability_posture.reputation_score` for sender narrative). A/B testing on EmailCampaign + LifecycleJourney + MessagingThread deferred from 223 to P225. Send-time optimization (best-time-to-send ML) deferred. Future surfaces render `<PlaceholderBanner variant="future_phase_225_attribution_journey_analytics">` until that phase ships.

### Future-Surface 4 — `future_phase_226_sales_enablement` (P226 battlecards + proof packs + proposals)

**Anticipated path:** `app/(markos)/sales/{battlecards,proof,proposals,winloss}/page.tsx` future surfaces.

**Contract:** When P226 sales enablement surfaces ship, they consume 223 substrate (MCP `send_messaging` for sales-assist outreach with Opportunity context; ApprovalReviewPanel reused for sales-touch approval flows). AI-generated subject + body deferred from 223 to P226 deal-execution copilot integration. Future surfaces render `<PlaceholderBanner variant="future_phase_226_sales_enablement">` until that phase ships.

### Future-Surface 5 — `future_phase_223_chromatic_baselines` (Plan 06 gate enforcement)

**Anticipated path:** `chromatic.config.json` + 5 `*.stories.tsx` files (ChannelProgramsList, MessagingThreadsList, DeliverabilityWorkspace, TemplateEditor, ApprovalReviewPanel).

**Contract:** Plan 06 ships the gate; future approval needed if visual diffs accepted on subsequent baselines without operator review. Downstream phases (P224+) MUST NOT add `components/markos/crm/outbound/*` without registering corresponding Storybook stories + Chromatic snapshots. Per Plan 06 RL1 `autonomous: false`; first batch requires operator review.

### Future-Surface 6 — `future_phase_223_ssl_realtime_in_app_messages` (P224 SSE for in_app)

**Anticipated phase:** P224 conversion surfaces (live forms + in-app workflow).

**Contract:** Real-time SSE/websocket for `in_app_messages` table read deferred from 223 D-10 (next-nav read suffices for v1) to P224. Operator UI in 223 reads in_app_messages on next page load — no live push. P224 will add SSE for unread in_app_messages count + new-message toast. Future surfaces render `<PlaceholderBanner variant="future_phase_223_ssl_realtime_in_app_messages">` until that phase ships.

### Future-Surface 7 — `future_phase_223_legacy_outbound_cutover` (post-223 cleanup)

**Anticipated phase:** Once all consumers migrate via legacy adapter, legacy `lib/markos/outbound/*` cutover to derived-shim-only.

**Contract:** 223 SHIM WINDOW preserves dual-write per legacy adapter; downstream phase (likely P224+) will drop the legacy adapter path and demote `lib/markos/outbound/scheduler.ts` + `conversations.ts` to thin wrappers around `lib/markos/channels/*`. `outbound_consent_records` view continues to back legacy reads via P221 SOR. Future surfaces render `<PlaceholderBanner variant="future_phase_223_legacy_outbound_cutover">` until that phase ships.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable (no `components.json`) |
| Third-party registries | none | not applicable |

Phase 223 introduces **zero third-party blocks**. All UI primitives compose from `styles/components.css` v1.1.0 (project-owned). The 7 D-15 extracted components (HealthScoreBadge, RiskBandBadge, KbGroundingPanel, SaveOfferPricingBlock, RetentionClassChip, PIIRedactedField, ClassifierChipRow) are project-owned (first shipped in 217-06; reused in 222; reused here).

**Vetting gate:** Not applicable — no third-party registry surfaces ship in 223.

---

## D-15 Extracted Component Reuse Manifest (load-bearing)

The following 7 components are FIRST CONSUMED IN PRODUCTION by 217-06, REUSED in 222, and REUSED in 223 (NOT re-implemented):

| Component | Origin | 223 consumers |
|-----------|--------|---------------|
| `<HealthScoreBadge />` | 216 §D-15 (recommended); 217-06 (first shipped) | MessagingThreadsList per-row (when related_crm_id resolves to Customer360 with health_score; reply_pending priority bias); ApprovalReviewPanel header (when subject is reply-related approval AND related_crm_id present) |
| `<RiskBandBadge />` | 216 §D-15; 217-06 (first shipped) | MessagingThreadsList per-row (related_crm_id risk band); DeliverabilityWorkspace per-sender at_risk indicator |
| `<KbGroundingPanel />` | 216 §D-15; 217-06 (first shipped) | TemplateEditor "Bindings" panel (template `evidence_bindings[]` rendering); ApprovalReviewPanel `evidenceRefs` panel |
| `<RetentionClassChip />` | 216 §D-15; 217-06 (first shipped) | Per-PII-field rendering on TemplateEditor preview, MessagingThreadsList per-row, ApprovalReviewPanel recipient sample, DeliverabilityWorkspace suppression list |
| `<PIIRedactedField />` | 216 §D-15; 217-06 (first shipped) | TemplateEditor preview pane (sample recipient); MessagingThreadsList per-row recipient name; ApprovalReviewPanel recipient sample list; DeliverabilityWorkspace suppression list per-row recipient identifier; MorningBriefChannelEntries reply_pending recipient name; ApprovalInboxChannelEntries recipient sample |
| `<ClassifierChipRow />` | 216 §D-15; 217-06 (first shipped) | TemplateEditor "Classifier findings" overlay (5 finding kinds: pricing_binding/pricing_text_scan/pricing_ast_violation/evidence_ttl/competitor_mention); ApprovalReviewPanel classifier_findings panel; TimelineDetailView per-channel-event-row chip rendering (D-34) |
| `<SaveOfferPricingBlock />` | 216 §D-15; 217-06 (first shipped) | NOT consumed in 223 (deferred to P224+ when conversion-surface save-offer flows ship) |

Storybook stories for these components remain registered under their original 217-06 `Saas/*` path; 223 stories register UNDER `Channels/*` path and IMPORT the extracted components.

---

## Operator-Journey E2E (Plan 06 — D-46 axe-playwright REUSE, NOT new playwright runtime)

The following ONE operator-journey E2E test ships in Plan 06 closeout using the EXISTING `axe-playwright` devDep (preserved per D-46 — accessibility-test infrastructure ONLY; NO NEW playwright runtime). The Chromatic snapshot gate + this single operator-journey E2E + manual operator checkpoints (sender warming + DKIM/SPF/DMARC + Knock provisioning + Resend dashboard webhook configuration per Plan 06 Task 4) replace any need for a new playwright runtime.

### Journey 1 — Campaign create → approve → dispatch → reply → bounce (E2E via axe-playwright)

1. **Create campaign** (ChannelProgramsList → "Create campaign" CTA)
   - Verify form renders class chip group (4 verbatim labels)
   - Verify form renders channel chip group (5 verbatim labels)
   - Submit campaign with class='broadcast' + audience_size > 500
   - Verify campaign status='pending_approval' (D-16 fail-CLOSED layered approval triggers)
   - Verify approval-package created via `buildApprovalPackage(kind='channel_dispatch_approval')` per D-43
   - Verify P208 Approval Inbox row appears via `ApprovalInboxChannelEntries.tsx` renderer with `<.c-chip>` "channel_dispatch_approval"
2. **Approve campaign** (ApprovalReviewPanel → "Approve" CTA)
   - Verify modal opens (215 billing-correction modal recipe)
   - Verify reason capture (≥20 chars) validation
   - Submit reason — verify approval-package status='approved'; campaign status='approved'
3. **Dispatch campaign** (ChannelProgramsList per-card → "Schedule dispatch →" mint-text inline link)
   - Verify dispatch_run_id assigned; campaign status='dispatching'
   - Verify `<RunStatusBadge run_id={dispatch_run_id}>` (P207) renders + `<.c-status-dot--live>` kernel-pulse
   - Verify per-recipient 6-layer gate runs (D-19): consent → suppression → session window → frequency cap (DB trigger per D-50) → quiet hours → jurisdiction
   - Verify D-29 single fan-out emit() writes 5 destinations per delivered_event (cdp_events + crm_activity + aggregate-counter + dispatch_events + setConsentState if consent-affecting)
4. **Reply received** (MessagingThreadsList → reply_pending top item)
   - Verify thread.current_status='reply_pending' (per D-23)
   - Verify thread.related_crm_id linked to Customer360 record (per 222 D-03)
   - Verify auto-reply detection (Pitfall 7 per Plan 04) — vacation responder filtered out; legitimate reply pinned to top with mint pulse
   - Verify Resend metadata-only webhook (Pitfall 9 + A11) — body fetched via Resend Received Emails API
   - Verify CRM task created assigned to thread.owner_user_id
   - Verify opt-out detector fires; if matched, setConsentState (P221 single writer rule via D-51 trigger)
   - Verify TimelineDetailView (P222 D-25 — EVOLVED in 223-05) renders channel-event-chip "replied" per D-34
   - Verify MorningBriefChannelEntries renders reply_pending in "Reply pending threads" section (mobile_priority=critical surface)
5. **Bounce received** (DeliverabilityWorkspace → per-sender card)
   - Verify hard_bounce → channel_suppressions row added (per D-21)
   - Verify Knock cascade (Pitfall 8 per Plan 04) — push delivery_failed maps to handleBounceEvent('hard') → suppression chain
   - Verify cdp_events emit with event_name='channel.suppression_added'
   - Verify deliverability_posture rolling 24h recomputed via cron `channels-deliverability-rollup` (Plan 06 hourly)
   - Verify sender reputation_status='at_risk' if bounce_rate > threshold; MorningBriefChannelEntries renders sender in "At-risk senders" section
   - Verify spike alert (Plan 06 cron `channels-bounce-spike-alert`) fires if bounce_rate > baseline + 2σ; operator task created
   - Verify TimelineDetailView renders channel-event-chip "bounced" per D-34
6. **Accessibility audit** (axe-playwright run on each surface)
   - Verify zero accessibility violations on ChannelProgramsList / MessagingThreadsList / DeliverabilityWorkspace / TemplateEditor / ApprovalReviewPanel
   - Verify focus order matches per-component focus order spec
   - Verify touch target ≥44px on coarse pointers (already global per 213.2)

### Manual operator checkpoints (Plan 06 Task 4 — `autonomous: false` per RL1)

The following manual checkpoints require operator action OUTSIDE the codebase (external dashboards) and cannot be automated by Claude:

1. **Sender warming**: Operator monitors warming senders for 7 days at <500/day per D-06; reviews reputation_status transition warming → healthy
2. **DKIM/SPF/DMARC verification**: Operator configures DNS records at registrar; verifies all 3 statuses transition pending → verified per sender_identities D-06
3. **Knock app provisioning**: Operator creates Knock workspace at knock.app; configures FCM + APNS push providers; copies Knock API key to env (`KNOCK_API_KEY`); registers webhook signing secret (`KNOCK_WEBHOOK_SECRET`) per D-09 + Plan 04
4. **Resend dashboard webhook configuration**: Operator configures Resend inbound parsing per sender_identity at resend.com dashboard; sets webhook URL to `/api/webhooks/resend-events`; copies signing secret (`RESEND_SIGNING_SECRET`) to env per D-22 + Plan 04
5. **Twilio messaging service configuration**: Operator configures Twilio messaging service for SMS + WhatsApp at twilio.com dashboard; sets webhook URL to `/api/webhooks/twilio-events`; copies auth token (`TWILIO_AUTH_TOKEN`) to env

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (verbatim copy contracts per surface; banned-lexicon zero-match enforced on template body + EmailCampaign subject + reply suggestion body + classifier-finding operator-note + sender warming notes + suppression operator-note + ApprovalReviewPanel reason capture)
- [ ] Dimension 2 Visuals: PASS (vanilla `<table>` / `<ol>` / `<ul>` semantic; `.c-card` default; D-13 `.c-card--feature` reserved; D-14 no `.c-table`)
- [ ] Dimension 3 Color: PASS (60/30/10 split honored; mint reserved for primary CTA + focus + chip-protocol + status-dot-live + `[ok]`/`[up]` glyphs; commercial_signal color-coding verbatim per 222; sender reputation_status color-coding verbatim per D-06; classifier severity color-coding verbatim per D-52)
- [ ] Dimension 4 Typography: PASS (JetBrains Mono headings + Inter body; tabular numerals on monetary + percentage + counter columns; banned-lexicon zero-match)
- [ ] Dimension 5 Spacing: PASS (8-point grid; --space-* tokens only; off-grid auto-FAIL)
- [ ] Dimension 6 Registry Safety: PASS (no third-party blocks; D-15 extracted components project-owned; provider secrets NEVER in UI per D-39 + B-9)

**Approval:** pending (checker upgrades to `approved YYYY-MM-DD` once 6-pillar audit passes; 223-06 ships gate enforcement)

---

*Phase: 223-native-email-messaging-orchestration*
*UI-SPEC drafted: 2026-05-05 by gsd-ui-researcher*
*Heavy-UI hybrid: 5 backend plans (01/02/03/04/06) + 1 UI plan (05) shipping 5 NEW components + 2 P208 entry-type renderers + 2 EVOLVED components*
*Architecture-lock: D-42 (legacy api/v1/channels/*.js NOT App Router) + D-43 (buildApprovalPackage NOT createApprovalPackage) + D-44 (lib/markos/channels/* greenfield owned by P223; lib/markos/cdp/* P221-owned; lib/markos/crm360/* P222-owned) + D-45 (assertUpstreamReady hard-fail; NO bridge stubs) + D-46 (npm test Node --test; existing axe-playwright reuse only — NO new playwright runtime) + D-47 (contracts/openapi.json NOT public/openapi.json) + D-48 (lib/markos/mcp/tools/index.cjs NOT .ts) + D-49 (api/cron/channels-*.js NOT App Router) + D-50 (frequency-cap DB trigger NOT service-layer) + D-51 (consent-write DB trigger via app.consent_writer_source GUC; RLS rejected) + D-52 (AST/allowlist via @babel/parser NOT 5-line regex) + D-53 (content classifier P223-OWNED greenfield NOT carry from P211) + D-54 (WhatsApp 24-hour session window check BEFORE quiet-hours; defer-past-session fail-closed) + D-55 (F-ID slot table pre-allocated F-122..F-131; closeout collision regression test)*
*Approval helper canon: `buildApprovalPackage` per D-43 (NEVER `createApprovalPackage` — verified non-existent)*
*Test runner: `npm test` (Node `--test`) per D-46; existing axe-playwright devDep preserved for 1 operator-journey E2E; NO NEW vitest, NO NEW playwright runtime in P223*
*Chromatic gate + axe-playwright operator-journey E2E + manual operator checkpoints (sender warming + DKIM/SPF/DMARC + Knock provisioning + Resend dashboard webhook configuration) replace any need for a new playwright runtime*
*Approval Inbox handoff chip count: 32 (post-222) → 36 (post-223) — 4 new literals (channel_dispatch_approval, channel_template_publish_approval, channel_suppression_bulk_approval, channel_program_pause_approval)*
*4 channel kinds verbatim (per D-08): email (Resend) / sms+whatsapp (Twilio) / push (Knock) / in_app (internal D-10)*
*4 provider adapters: Resend (email + inbound parsing per D-22), Twilio (SMS + WhatsApp + signed webhooks per D-08), Knock (push via Vercel Marketplace per D-09), in_app-adapter (internal write to in_app_messages table per D-10)*
*Pitfall 7 auto-reply detection (vacation responders filtered) + Pitfall 8 Knock cascade (push delivery_failed → suppression) + Pitfall 9 + A11 Resend metadata-only webhook (body fetched via Resend Received Emails API)*
*D-29 single fan-out emit() writes 5 destinations transactionally per channel event (cdp_events + crm_activity + aggregate-counter + dispatch_events + setConsentState if consent-affecting) with D-51 trigger compliance for consent writes*
*Reply continuity flow: inbound → MessagingThread → Customer360 → CRM task → opt-out detector → setConsentState (P221 single writer per D-12 + D-51 trigger model)*
