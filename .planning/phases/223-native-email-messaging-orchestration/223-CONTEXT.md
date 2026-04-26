# Phase 223: Native Email and Messaging Orchestration - Context

**Gathered:** 2026-04-24
**Revised:** 2026-04-26 (review-driven; D-42..D-55 added; rejected escape hatches moved to `<deferred>`)
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain) + reviews (cross-AI replan iter 1)

<domain>
## Phase Boundary

Phase 223 ships the native owned-channel execution layer for MarkOS: email (transactional/lifecycle/broadcast/revenue), WhatsApp, SMS, push, and in-app — with shared consent (P221 ConsentState), shared audience (P221 AudienceSnapshot), shared approval (P208 Approval Inbox), shared commercial memory (P222 Customer360 + MessagingThread + Opportunity), shared deliverability posture, and shared dispatch governance. Replaces the current `lib/markos/outbound/*` CRM-bound surface with a tenant-wide Channel Engine, but reuses every working primitive (Resend + Twilio adapters, scheduler, conversation normalization, eligibility evaluator) by promoting them into channel-agnostic contracts.

**In scope:** SenderIdentity + DeliverabilityPosture, EmailCampaign + MessagingThread + LifecycleJourney program models, channel_templates with Handlebars personalization, AgentRun-wrapped dispatch with Vercel Queues fan-out, full ConsentState cutover (P221 D-12 mandate), per-recipient double-gate at dispatch (consent + suppression + frequency cap + quiet hours + jurisdiction), layered approval triggers (class + count + content + manual), inbound reply → thread + Customer360 timeline + CRM task + owner escalation, Knock/OneSignal push provider, full read-write `/v1/channels/*` API + 5 MCP tools, evolved CRM outbound workspace.

**Out of scope (deferred phases, not this phase):**
- Conversion surfaces, landing pages, forms, launch orchestration — P224.
- Semantic attribution, journey analytics, narrative intelligence — P225.
- Sales enablement (battlecards, proof packs, proposals) — P226.
- Ecosystem/partner/affiliate workflows — P227.
- CDP identity/consent SOR (P221) and CRM Customer360 SOR (P222) — already planned upstream.
- Workspace/household consent ingest — P218/P225.

Phase 223 is a SUBSTITUTION phase (not purely additive): it deprecates `outboundConsentRecords` writes (legacy table becomes derived view); it deprecates `api/crm/outbound/*` direct send paths in favor of `/v1/channels/*` + program-based dispatch (current paths kept as legacy adapter during transition).
</domain>

<decisions>
## Implementation Decisions

### Program model
- **D-01:** Separate per-channel program models — three new tables: `email_campaigns`, `messaging_threads`, `lifecycle_journeys`. Each table mirrors operator mental model + provider semantics (broadcast 1:many vs thread 1:1 vs trigger-driven automation).
- **D-02:** `email_campaigns` shape (doc 19 §Part 1): `campaign_id, tenant_id, campaign_type ∈ {transactional, lifecycle, broadcast, revenue}`, `objective ∈ {activation, nurture, launch, newsletter, renewal, expansion, winback, sales_followup, announcement, transactional_receipt}`, `audience_snapshot_id` (FK → P221), `template_id` (FK → channel_templates), `sender_identity_id` (FK → sender_identities), `schedule_at`, `throttle_per_minute`, `time_zone_strategy ∈ {tenant_default, recipient_local, fixed_utc}`, `frequency_cap_override`, `approval_ref` (nullable, FK → approval_package), `status ∈ {draft, pending_approval, approved, scheduled, dispatching, dispatched, paused, cancelled, completed, failed}`, `dispatch_run_id` (FK → markos_agent_runs from P207), tenant RLS.
- **D-03:** `messaging_threads` shape (doc 21 §Part 1): `thread_id, tenant_id, profile_id` (FK → P221 cdp_identity_profiles), `account_id` (nullable), `channel ∈ {whatsapp, sms, push, in_app}`, `current_status ∈ {open, waiting, escalated, resolved, blocked, reply_pending}`, `owner_user_id`, `last_message_at`, `last_direction`, `sentiment`, `related_crm_id` (FK → P222 customer_360_records), `related_opportunity_id`, `related_support_case_id`, `related_nba_id` (FK → P222 nba_records, nullable), tenant RLS.
- **D-04:** `lifecycle_journeys` shape: `journey_id, tenant_id, name, trigger_event_envelope` (matches cdp_events shape — event_name + event_domain + filter), `target_audience_id` (nullable — null = "any profile matching trigger"), `step_definitions[]` (ordered with channel + template_id + delay + branch_logic), `status, paused_at, version`. Each journey instance for a given profile creates a `lifecycle_journey_runs` row with current_step + state + due_at.
- **D-05:** Email channel sends a `revenue` class campaign for sales_followup that is otherwise a per-deal one-off — `email_campaigns.audience_snapshot_id` may be a single-row snapshot for 1:1 sends; this preserves the audience-double-gate posture without fragmenting program models.

### Channel + sender + deliverability
- **D-06:** New `sender_identities` table: `sender_id, tenant_id, label, from_name, from_email, reply_to_email, sending_domain, subdomain, verification_status ∈ {pending, verified, failed}, dkim_status, spf_status, dmarc_status, reputation_status ∈ {warming, healthy, watch, at_risk}, daily_send_limit, class_permissions ∈ EmailClass[], created_at, last_warmed_at`. Email-only in v1 (SMS/WhatsApp use Twilio account-level sender; push uses Knock app).
- **D-07:** New `deliverability_posture` table: `(tenant_id, channel, sender_id, window_24h_start)` composite key, with `bounce_rate, complaint_rate, reply_rate, open_rate, click_rate, unsubscribe_rate, hard_bounce_count, soft_bounce_count, complaint_count, sample_size, reputation_score (0-100), trend ∈ {improving, stable, watch, degrading}`. Rolling 24h windows recomputed hourly via cron. Operator-visible workspace surface.
- **D-08:** Channel capabilities expanded in `lib/markos/outbound/providers/base-adapter.ts` from current 3 (email/sms/whatsapp) to 5 (email/sms/whatsapp/push/in_app). New adapter contract methods: `send`, `normalizeEvent`, `verifyWebhookSignature`, `getRateLimitState`, `getReputationSnapshot` (optional).

### Push + in_app provider
- **D-09:** Push provider = Knock (Vercel Marketplace partner) for v1. Adapter: `lib/markos/outbound/providers/knock-adapter.ts` implementing same base contract. FCM/APNS abstracted by Knock. ConsentState `push_enabled` field already exists from P221 D-11.
- **D-10:** in_app channel = MarkOS-internal (no external provider). Adapter: `lib/markos/outbound/providers/in-app-adapter.ts` writes to `in_app_messages` table read by operator shell. ConsentState `in_app_enabled` field gates dispatch.

### Consent shim cutover (P221 D-12 mandate)
- **D-11:** Full cutover lands in P223. `lib/markos/outbound/consent.ts::evaluateOutboundEligibility` reads `cdp_consent_states` ONLY (via P221 adapter `getConsentState(profile_id, channel)`). Legacy `outboundConsentRecords` becomes a derived view backed by `cdp_consent_states` for backward compatibility. **Per D-51 (review-driven):** cutover is HARD via DB trigger — no `workflow.outbound_consent_legacy_view` config flag fallback (rejected escape hatch — see `<deferred>`).
- **D-12:** Writes to `outboundConsentRecords` go through `setConsentState` (P221) which is the only writer; legacy direct writes are blocked at the table level via **BEFORE INSERT/UPDATE trigger** (per D-51 — RLS-only is rejected because service-role bypasses). Drift audit cron from P221 D-26 covers any divergence during the deprecation window.
- **D-13:** Channel eligibility evaluation extends ConsentState fields: in addition to channel `opted_in/out`, dispatch checks `legal_basis` (consent vs legitimate_interest), `quiet_hours` per recipient, `preference_tags[]` (frequency/category opt-outs), and `jurisdiction` (per tenant config — some jurisdictions require explicit consent for marketing).

### Send execution architecture
- **D-14:** Each program dispatch = one AgentRun (P207) wrapping a Vercel Queues fan-out:
  - `markos_agent_runs` row created with run_type='channel_dispatch', subject_type='email_campaign'|'messaging_thread'|'lifecycle_journey_run', subject_id.
  - Vercel Queues handles per-recipient enqueueing (at-least-once delivery, max_concurrency = sender.daily_send_limit / 24).
  - Per-recipient handler runs the double-gate (D-19) → calls adapter.send() → emits dispatch_events row.
  - Idempotency via `dispatch_attempt_id` (UUID per recipient per attempt; deduplication on retry).
  - Run-level cancel/pause/resume via P207 AgentRun semantics.
- **D-15 (REVISED per D-45/RH6):** P207 is a HARD prerequisite. Phase 223 Plan 01 Task 0.5 invokes `assertUpstreamReady(['P207', ...])` and throws `UpstreamPhaseNotLandedError` if `markos_agent_runs` table is absent. **No bridge stub. No `workflow.agentrun_v2_available` config flag** (rejected escape hatch — see `<deferred>`). Channel dispatch IS the run-tracked operation; soft-skipping AgentRun would break the audit chain (D-37). Execute-phase will halt with a clear error pointing to P207 if the upstream phase has not landed.

### Approval threshold model
- **D-16 (REVISED per D-52/D-53):** Layered approval triggers — fail-CLOSED at first triggering layer:
  - **Class:** `broadcast` and `revenue` ALWAYS require approval. `transactional` auto-approves within sender.class_permissions. `lifecycle` auto-approves within sender.class_permissions UNLESS another layer triggers.
  - **Count:** any send to ≥500 recipients ALWAYS requires approval (configurable per tenant; default 500).
  - **Content classifier (P223-OWNED greenfield, NOT carry from P211):** runs at template-render time, implemented in `lib/markos/channels/templates/content-classifier.ts` (NEW file owned by P223 per D-44 + D-53):
    - **Pricing/packaging copy:** AST/allowlist enforcement (NOT 5-line regex per D-52). Uses `@babel/parser` to parse content_blocks; ALLOWLISTED_ACCESSORS = `['getPricingFor', 'formatPrice', 'usePricing', 'pricingFromEngine']`. Any pricing-shaped value not produced by an allowlisted accessor and not the literal `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder → block. Catches cross-module assembly (Pitfall 6 + P226 RM3 carry).
    - **Factual claim:** P209 EvidenceMap check (every claim variable must have evidence_ref + freshness within TTL) — graceful flag (not block) when P209 EvidenceMap adapter is absent; hard block when present and stale.
    - **Competitor mention:** flag for review (severity='flag', not 'block').
    - Failure of any 'block' check → require approval.
  - **Manual override:** operator can flag any program for approval via `email_campaigns.requires_approval = true`.
- **D-17 (REVISED per D-43/RH1):** Approvals route through P208 Approval Inbox via existing approval-package pattern (`lib/markos/crm/agent-actions.ts::buildApprovalPackage` — NOT `createApprovalPackage`, which does not exist anywhere in the codebase per D-43 verified). Approver actions: approve / reject / request changes. Approved campaign transitions `status: pending_approval → approved`. Approval revocation pre-dispatch is supported; mid-dispatch sends a pause signal to AgentRun. F-131 contract description reads "extends P105 `buildApprovalPackage`".
- **D-18:** Re-engagement campaigns (sender.last_send_at to a recipient > 90 days OR recipient.lifecycle_stage = 'lost') ALWAYS require approval regardless of class.

### Audience double-gate dispatch
- **D-19 (REVISED per D-50/D-54):** Per-recipient gate at send time (P221 D-18 explicit — re-validated, not just snapshot membership):
  1. **ConsentState lookup** (`getConsentState(profile_id, channel)` via P221 adapter) — channel `opted_in`? if `unknown` and tenant policy = `legitimate_interest` → allow; else block.
  2. **Suppression list check** — tenant-level suppression table (`channel_suppressions`) — any row blocks.
  3. **WhatsApp 24-hour session window check** (channel='whatsapp' only — per D-54): if outside session window → require template message (failover to template path) OR fail-closed `reason='whatsapp_session_lost'`. **MUST run BEFORE quiet-hours layer to avoid lost-session deferral.**
  4. **Frequency cap check** — enforced at DB layer (per D-50): `BEFORE INSERT ON dispatch_events` trigger counts rolling-window dispatches per `(profile_id, channel, campaign_class IN ('lifecycle','broadcast','revenue'))` and rejects when over cap. Tenant cap configurable via `tenant_config.frequency_caps[channel]` (default: 2 marketing per channel per 7d, transactional unlimited). App-layer pre-check is optional optimization, but DB trigger is the authoritative gate.
  5. **Quiet hours check** — recipient timezone (from CDP TraitSnapshot `time_zone`) + ConsentState `quiet_hours` window. If now in quiet hours → defer until next send window (re-enqueue with delay). **For WhatsApp (per D-54): if quiet-hours defer would push past 24-hour session boundary → fail-closed (skip with reason='whatsapp_session_lost') instead of deferring.**
  6. **Jurisdiction check** — tenant config: `(jurisdiction, channel, marketing_legal_basis)` matrix — e.g., EU + email + marketing requires `legal_basis='consent'`. Mismatch → block.
- **D-20:** Skipped/blocked recipients write `dispatch_skips` audit row (campaign_id, profile_id, gate_failed, evidence_ref, attempted_at). Dispatch summary surfaces skip counts in the deliverability workspace.
- **D-21:** Bounce events propagate: hard_bounce → add to suppression list + emit cdp_events with `event_name='channel.suppression_added'`. Complaint events → same path with reason='complaint'. Soft_bounce → retry with backoff (max 3 attempts over 7 days), then promote to hard.

### Inbound reply + thread continuity
- **D-22:** Reply normalization in `lib/markos/outbound/events.ts::normalizeOutboundEventForLedger` extended to handle email replies (currently SMS/WhatsApp only). Email reply detection via Resend webhook `inbound_message` events (configure inbound parsing per sender_identity).
- **D-23:** Reply event flow:
  1. Look up or create `messaging_threads` row by `(tenant_id, profile_id, channel)` — single thread per profile per channel (email gets one thread per profile per sender_identity).
  2. Set `thread.current_status = 'reply_pending'`, `last_message_at = now()`, `last_direction = 'inbound'`, sentiment from classifier (P209 audit_claim style).
  3. Append `crm_activity` row (P222 D-05/D-22): `source_domain` matches channel, `commercial_signal` from classifier (positive→interest, negative→risk, mention of pricing→pricing).
  4. Emit `cdp_events` envelope (P221 D-08 + P222 D-22): `event_domain='messaging'|'email'`, shared `source_event_ref` threading the entire chain.
  5. Create CRM task assigned to `thread.owner_user_id` (or fallback `customer_360.primary_owner_user_id` per P222 D-16).
  6. Fire opt-out detector (existing `events.ts::optOut` regex) — if matched, set ConsentState channel = `opted_out` via P221 setConsentState.
- **D-24:** Cross-channel thread continuity: thread.related_crm_id links all per-channel threads for the same profile to one Customer360 record. Operator shell shows "all threads for this customer" view.

### Templates + personalization
- **D-25:** New `channel_templates` table: `template_id, tenant_id, name, channel ∈ {email, sms, whatsapp, push, in_app}, template_type ∈ {marketing, transactional, lifecycle, support}, subject` (nullable per channel), `content_blocks[]` (typed: text/html/markdown/mjml — channel-appropriate), `variables_schema` (JSON Schema), `evidence_bindings[]` (variable → P209 EvidenceMap claim_id), `pricing_bindings[]` (variable → Pricing Engine context — placeholder enforcement), `locale ∈ ISO`, `parent_template_id` (for locale variants), `version, status ∈ {draft, approved, archived}, approved_by, approved_at`. Composite uniqueness on `(tenant_id, name, locale, version)`.
- **D-26:** Personalization via Handlebars `{{var}}` substitution at dispatch time. Variables resolved from: (1) CDP TraitSnapshot, (2) Customer360 record, (3) Opportunity record, (4) explicit per-recipient `dispatch_context_overrides`. Missing variable → fail-closed (skip recipient with `dispatch_skip` reason='missing_variable'). Operator preview UI shows resolved sample.
- **D-27 (REVISED per D-52):** Pricing copy enforcement. Any variable bound to pricing context MUST resolve to either (a) approved Pricing Engine record reachable via an allowlisted accessor (per D-16 ALLOWLISTED_ACCESSORS), or (b) literal `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder. Content classifier (D-16) blocks dispatch if pricing variable resolves through any other path. AST scan via `@babel/parser` catches cross-file pricing assembly that 5-line regex would miss.
- **D-28:** Locale variants: `parent_template_id` chains a primary template to localized children. Recipient locale resolved from CDP TraitSnapshot `preferred_locale` → pick child template; fallback to parent if no match.

### Channel event → downstream writeback
- **D-29:** Single fan-out emit() function in `lib/markos/channels/events/emit.ts` called by every webhook normalizer:
  1. Insert `cdp_events` row (event_domain='email'|'messaging', shared source_event_ref).
  2. Insert `crm_activity` row (source_domain matches channel, commercial_signal mapped from event_type: open→interest, click→interest, reply→interest|risk per sentiment, bounce→risk, complaint→risk, unsubscribe→risk).
  3. Update aggregate state: thread (status, last_message_at) OR campaign (delivered_count, opened_count, clicked_count, replied_count, bounced_count, complained_count, unsubscribed_count).
  4. Insert `dispatch_events` row (deliverability rollup source for D-07).
  5. If event affects ConsentState (unsubscribe, opt-out reply, complaint) → call P221 setConsentState (single writer rule).
  6. Fail-closed per RD-10 from P222 — partial failures throw; full transaction rollback.

### API + MCP surface
- **D-30:** Read-write v1 `/v1/channels/*` API:
  - **Email:** GET/POST `/v1/channels/email/programs`, GET/POST/DELETE `/v1/channels/email/sends/{id}`, GET/POST `/v1/channels/email/senders`, GET `/v1/channels/email/deliverability`.
  - **Messaging:** GET/POST `/v1/channels/messaging/threads`, GET/POST `/v1/channels/messaging/sends`, POST `/v1/channels/messaging/threads/{id}/escalate`.
  - **Lifecycle:** GET/POST `/v1/channels/lifecycle/journeys`, POST `/v1/channels/lifecycle/journeys/{id}/pause`, POST `/v1/channels/lifecycle/journeys/{id}/resume`.
  - **Templates:** GET/POST `/v1/channels/templates`, POST `/v1/channels/templates/{id}/preview`.
  - **Approvals:** GET `/v1/channels/approvals` (pending), POST `/v1/channels/approvals/{id}/{approve|reject}`.
  - **Suppressions:** GET/POST `/v1/channels/suppressions`.
  - **Convention (per D-42):** legacy flat `api/v1/channels/*.js` (NOT App Router `route.ts`). All routes use `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491`.
- **D-31:** MCP tools (5):
  - `send_email_program` — dispatch an EmailCampaign by id (validates approval state).
  - `send_messaging` — send a single MessagingThread message (1:1).
  - `get_thread` — fetch a MessagingThread with last N messages.
  - `get_deliverability_posture` — current 24h DeliverabilityPosture per sender per channel.
  - `list_pending_approvals` — pending channel approvals for the operator.
  - **Convention (per D-48):** registry registration goes through `lib/markos/mcp/tools/index.cjs` (NOT `.ts`).
- **D-32:** All write APIs honor approval-package pattern (D-17 — buildApprovalPackage). High-risk mutations (approval_ref required for: campaign create with class=broadcast or revenue, send to ≥500 recipients, pricing-touching template publish, sender_identity verification update, suppression bulk add).

### UI surface
- **D-33:** Evolve existing CRM outbound workspace + add channel-engine surfaces (P208 single-shell rule):
  - `components/markos/crm/outbound/outbound-workspace.tsx` consumes new program models via legacy adapter `lib/markos/channels/adapters/legacy-outbound.ts` (P223-owned greenfield per D-44).
  - New: `ChannelProgramsList` (kanban-by-status of campaigns + lifecycle journeys), `MessagingThreadsList` (queue of threads with reply_pending priority, by owner), `DeliverabilityWorkspace` (sender + 24h posture + reputation trend + suppression count), `TemplateEditor` (per-channel preview + variables + evidence + pricing bindings), `ApprovalReviewPanel` (P208 inbox entries for channel approvals).
- **D-34:** TimelineDetailView from P222 D-25 gains channel event chips (open/click/reply/bounce per send).

### Observability + operator posture
- **D-35:** Operator surfaces (no new dashboards beyond D-33):
  - DeliverabilityWorkspace shows reputation_status per sender (warming/healthy/watch/at_risk) with concrete operator next-actions.
  - Approval Inbox (P208) shows channel approval entries with class + count + content-flag reasons.
  - Morning Brief (P208) shows top reply_pending threads by primary_owner + at_risk senders requiring action.
  - Bounce/complaint spike alerts (>2σ from 7-day baseline) emit operator task.

### Security + tenancy
- **D-36:** RLS on all new tables (`email_campaigns`, `messaging_threads`, `lifecycle_journeys`, `lifecycle_journey_runs`, `sender_identities`, `deliverability_posture`, `channel_templates`, `channel_suppressions`, `dispatch_events`, `dispatch_skips`, `in_app_messages`). Fail closed on missing tenant context. **Note (per D-50/D-51):** RLS is the baseline; trigger-level enforcement is layered on top for compliance-grade single-writer gates (frequency cap, consent writes) where service-role bypass of RLS would be a compliance gap.
- **D-37:** Audit trail mandatory on all approvals + ConsentState mutations + suppression mutations + sender_identity verification changes + program dispatches + manual overrides. Reuses unified `markos_audit_log` (P201 hash chain).
- **D-38:** Webhook signature verification mandatory on every provider event (Resend/Twilio/Knock all support signed webhooks). Verification failure → 401 + audit log row.
- **D-39:** No raw provider secrets in logs/prompts/MCP payloads (P210 non-negotiable carried).

### Contracts + migrations
- **D-40 (REVISED per D-55):** F-ID slot table pre-allocated in Plan 01 truths block (per P226 B6 lesson — pre-allocation prevents cross-plan slot collision):
  | F-ID | Name | Plan | Description |
  |------|------|------|-------------|
  | F-122 | channel-email-campaign-v1 | 01 | EmailCampaign read-write (CRUD + status lifecycle + approval gate) |
  | F-123 | channel-messaging-thread-v1 | 01 | MessagingThread read-write (CRUD + status + related_crm_id) |
  | F-124 | channel-lifecycle-journey-v1 | 01 | LifecycleJourney read-write (CRUD + pause/resume + run management) |
  | F-125 | channel-sender-identity-v1 | 02 | SenderIdentity CRUD + verification + reputation status |
  | F-126 | channel-deliverability-posture-v1 | 02 | DeliverabilityPosture 24h rolling window (read-only) |
  | F-127 | channel-template-v1 | 03 | ChannelTemplate CRUD + locale variants + approval + preview |
  | F-128 | channel-suppression-v1 | 02 | channel_suppressions CRUD + bulk add + DSR-sourced blocks |
  | F-129 | channel-dispatch-event-v1 | 02 | dispatch_events + dispatch_skips read surface |
  | F-130 | channel-program-dispatch-write | 05 | campaign/thread/journey send trigger + approval gate + fan-out write API (MCP write-bearing) |
  | F-131 | channel-approval-flow | 03 | extends P105 `buildApprovalPackage` (NOT createApprovalPackage); subject_types email_campaign/lifecycle_journey/channel_template; triggerReason enum |
  Plan 06 closeout includes `qa-gates-coverage.test.ts` F-ID-collision regression test (asserts no flow_id appears in two contracts).
- **D-41:** New migrations allocated by planner (continue after P222 migration 112). Slot allocation table:
  | Migration | Slot | Plan | Purpose |
  |-----------|------|------|---------|
  | 113 | sender_identity + deliverability_posture | 01 | sender_identities + deliverability_posture tables + RLS |
  | 114 | channel_templates | 01 | channel_templates + locale variants + RLS |
  | 115 | channel_programs | 01 | email_campaigns + messaging_threads + lifecycle_journeys + lifecycle_journey_runs + RLS |
  | 116 | channel_suppressions | 01 | channel_suppressions + RLS |
  | 117 | channel_dispatch_tracking | 02 | dispatch_events + dispatch_skips + RLS + UNIQUE(dispatch_attempt_id, event_type) + freq_cap_idx |
  | 118 | channel_in_app_messages | 02 | in_app_messages + RLS |
  | 119 | consent_cutover_view_swap_with_trigger | 02 | rename outbound_consent_records → outbound_consent_records_legacy + CREATE VIEW + **BEFORE INSERT/UPDATE trigger blocking direct legacy writes (per D-51)** |
  | 120 | channel_indexes_rls_hardening | 02 | cross-table FK indexes + audit_log event-type registrations + RLS policy review pass |
  | 121 | channel_frequency_cap_trigger | 02 | **BEFORE INSERT trigger on dispatch_events enforcing rolling-window frequency cap (per D-50)** — counts dispatches per (profile_id, channel, marketing_class) in tenant-configurable window; rejects when count >= cap |

### Review-driven decisions (D-42..D-55, added 2026-04-26)

- **D-42 — Architecture lock (Plan 01 Task 0.5).** Repo conventions pinned for Phase 223:
  - HTTP routes: legacy `api/*.js` flat (NOT App Router `route.ts`, NOT `api/v1/.../route.ts`).
  - Auth wrapper: `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` (NOT `requireSupabaseAuth`, which does not exist).
  - Test runner: `npm test` → `node --test test/**/*.test.js` (NOT vitest, NOT playwright runtime — see D-46).
  - OpenAPI spec: `contracts/openapi.json` (NOT `public/openapi.json`).
  - MCP tools registry: `lib/markos/mcp/tools/index.cjs` (NOT `.ts`).
  - Plugin registry helper: `resolvePlugin` (NOT `lookupPlugin`, which does not exist).
  - Plan 01 Task 0.5 ships an architecture-lock test that scans 223-*-PLAN.md files for forbidden patterns; CI fails if any forbidden pattern reappears.

- **D-43 — `buildApprovalPackage` replaces `createApprovalPackage` (verified).** Real export at `lib/markos/crm/agent-actions.ts:68` is `buildApprovalPackage`. `createApprovalPackage` does NOT exist anywhere in the codebase (verified by grep across `lib/markos/crm/copilot.ts`, `lib/markos/crm/agent-actions.ts`, and entire `lib/markos/`). All Plans 03/04/05 + F-131 contract description updated to reference `buildApprovalPackage`. Verification gate: `grep -c "createApprovalPackage" .planning/phases/223-*-PLAN.md` returns 0 positive invocations (only doctrinal "rejected" mentions in CONTEXT/REVIEWS allowed).

- **D-44 — Greenfield ownership map.**
  - `lib/markos/cdp/*` — **upstream-owned (P221)**, NOT P223. P223 references via assertUpstreamReady.
  - `lib/markos/crm360/*` — **upstream-owned (P222)**, NOT P223. Same posture.
  - `lib/markos/channels/*` — **P223-OWNED greenfield**. Tree is NEW; "evolve existing" narrative replaced with "CREATE NEW" task language. Subdirectories created by P223: `programs/`, `senders/`, `templates/`, `gate/`, `dispatch/`, `events/`, `suppression/`, `adapters/`, `deliverability/`, `preflight/`, `mcp/`, `api/`. None of these exist before P223.

- **D-45 — Hard-fail upstream preflight gate.** Plan 01 Task 0.5 invokes `assertUpstreamReady(REQUIRED_UPSTREAM)` where `REQUIRED_UPSTREAM = ['P205', 'P207', 'P208', 'P209', 'P210', 'P211', 'P221', 'P222']`. Throws `UpstreamPhaseNotLandedError` listing missing phases if any are absent. **No bridge stubs. No "if exists / fallback if absent" patterns.** All soft-skip language in Plans 02/03/04/05/06 removed in this iteration. The check runs at execute-phase boot; user is expected to land upstream phases first.

- **D-46 — `npm test` runner (Node `--test`).** All test files use `node:test` + `node:assert/strict`; filenames end `.test.js` (NOT `.test.ts`). All `<verify><automated>` commands use `npm test --` or `node --test <files>` (NOT `vitest run`, NOT `playwright test`). vitest + playwright + supabase-types + openapi-generate toolchain are deferred to a dedicated future toolchain phase (see `<deferred>`). Existing `axe-playwright` devDep is preserved for accessibility tests but no new playwright runtime is added by P223.

- **D-47 — `contracts/openapi.json`.** OpenAPI spec lives at `contracts/openapi.json` (verified path). Plan 05 OpenAPI regen step writes here; `public/openapi.json` does not exist and is not used.

- **D-48 — `lib/markos/mcp/tools/index.cjs`.** MCP tool registry is a CommonJS file (`.cjs`). Plan 05 extends this file (NOT `.ts`).

- **D-49 — Cron handlers convention (legacy `api/cron/*.js`).** Plan 06 ships 5 cron handlers under `api/cron/channels-{deliverability-rollup,lifecycle-journey-poll,bounce-spike-alert,tombstone-cascade,soft-bounce-promote}.js`. Auth: shared-secret header `x-markos-cron-secret` matched against `process.env.MARKOS_WEBHOOK_CRON_SECRET` (mirrors existing `api/cron/webhooks-dlq-purge.js` pattern verified at `api/cron/webhooks-dlq-purge.js:20-30`). NO App Router `route.ts`. NO fictional `app/api/cron/crm360-drift/route.ts` reference. `vercel.json` cron entries use `/api/cron/channels-*` paths.

- **D-50 — Frequency cap = DB trigger (compliance-grade enforcement).** Migration 121 ships `BEFORE INSERT ON dispatch_events` trigger that:
  - Counts existing `dispatch_events` rows for `(tenant_id, profile_id, channel)` in rolling window (default 7 days, tenant-configurable via `tenant_config.frequency_caps[channel]`).
  - Filters by marketing class (`event_type IN ('queued','delivered')` AND `campaign_class IN ('lifecycle','broadcast','revenue')`); transactional class is unlimited per D-19.
  - Rejects insert with `RAISE EXCEPTION 'frequency_cap_exceeded'` when count >= cap.
  - App-layer pre-check (per Plan 02) emits a `dispatch_skip` row with `gate_failed='frequency_cap'` BEFORE the INSERT attempt, but the trigger is the authoritative gate. Replaces previous "Claude's Discretion" service-layer rolling-window approach (rejected — see `<deferred>`).

- **D-51 — Consent-write single-writer = DB trigger (compliance-grade).** Migration 119 ships `BEFORE INSERT OR UPDATE ON outbound_consent_records_legacy` trigger that:
  - Inspects `current_setting('app.consent_writer_source', true)` GUC.
  - Allows the write if GUC == 'p221_setConsentState' (set by P221 `setConsentState` before its DB write).
  - Rejects with `RAISE EXCEPTION 'consent_writes_must_route_through_setConsentState'` otherwise.
  - **RLS rejected** because service-role bypasses RLS by default; trigger fires for service-role too. Plan 02 Task 1 ships migration. Test: SQL test attempts direct INSERT outside `setConsentState`, asserts trigger rejection.

- **D-52 — AST/allowlist pricing classifier (Plan 03 Task 2).** Replaces 5-line regex heuristic. Implementation:
  - Parse template content_blocks via `@babel/parser` (verify dep in package.json or add via Plan 01 Task 0.5 `npm install @babel/parser`).
  - For each call expression in JS-ish content blocks: assert callee name is in `ALLOWLISTED_ACCESSORS = ['getPricingFor', 'formatPrice', 'usePricing', 'pricingFromEngine']`.
  - For raw text content blocks: scan for pricing patterns (`$N`, `$N/mo`, `per month`, `per year`, `tier`, `plan`); if matched AND no allowlisted accessor produced the value, block.
  - The regex stays as a complementary cheap pre-filter, but the AST pass is the gate. Catches cross-module assembly (e.g., `subject = '$' + price; sendEmail({subject})` would fail the AST check).

- **D-53 — Content classifier owned by P223 (NOT carry from P211).** New file `lib/markos/channels/templates/content-classifier.ts` ships in Plan 03 Task 2. Although P211 introduced the placeholder rule (`{{MARKOS_PRICING_ENGINE_PENDING}}`), the classifier IMPLEMENTATION belongs to P223. P211 is in REQUIRED_UPSTREAM (D-45) only because the placeholder rule itself is referenced — but the classifier is greenfield owned here. No "carry from P211" language in Plan 03.

- **D-54 — WhatsApp 24-hour session window ordering.** Per D-19 revision: WhatsApp gate ordering is `Consent → Suppression → SessionWindow → FrequencyCap → QuietHours → Jurisdiction`. Quiet-hours deferral that would push past session boundary becomes fail-closed (`reason='whatsapp_session_lost'`). Plan 02 Task 2 ships this ordering rule and a test asserting that a deferred-past-session attempt skips with the correct reason.

- **D-55 — F-ID slot table (D-40 above).** F-122..F-131 pre-allocated in Plan 01 truths. Plan 06 closeout includes a regression test asserting flow_id uniqueness across `contracts/F-*.yaml`.

### Claude's Discretion (REVISED — review-driven trims)
- Module boundary under `lib/markos/channels/*` (campaigns vs threads vs journeys vs templates vs senders vs deliverability vs adapters) — locked at the Plan 01 task scaffolding step.
- Exact Handlebars helper set (escapes, conditionals, loops) — pick conservative subset to limit attack surface.
- Lifecycle journey trigger evaluation: pure event-driven via cdp_events tail vs scheduled poll. Plan 06 picks scheduled poll (cron, 60s) per RESEARCH §Decision 4.
- ~~Frequency cap implementation: rolling window in dispatch_events vs Redis sliding window. Planner decides per scale.~~ **REJECTED — pinned to DB trigger per D-50 (compliance grade).**
- ~~Vercel Queues vs alternative: confirm at plan time if Vercel Queues available at tenant tier; fallback to Supabase pg_boss if not.~~ **TRIMMED — Vercel Queues is the only path; pg_boss fallback is deferred to a future scaling phase if vendor lock becomes a concern. P223 ships with Vercel Queues only; no flag.**
- TemplateEditor + DeliverabilityWorkspace component implementation details — follow repo CSS module patterns.

### Folded Todos
None — no pending todos matched Phase 223 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Doctrine (product shape — precedence 1-2)
- `obsidian/work/incoming/19-EMAIL-ENGINE.md` — Email doctrine (informational; canonical = `obsidian/reference/*` when distillation lands). 7 core rules, 4 EmailClass values (transactional/lifecycle/broadcast/revenue), 6 architecture layers, SenderIdentity + EmailCampaign shapes (§Part 1).
- `obsidian/work/incoming/21-MESSAGING-ENGINE.md` — Messaging doctrine (informational). 7 core rules, MessagingChannel enum (whatsapp/sms/push/in_app), MessagingUseCase enum (8 values), MessagingThread shape (§Part 1).
- `obsidian/work/incoming/26-LAUNCH-ENGINE.md` — informational; downstream P224 launch consumer of channel programs.
- `obsidian/brain/MarkOS Canon.md` — product north star.
- `obsidian/brain/Brand Stance.md` — voice/tone for operator-facing copy.
- `obsidian/brain/Pricing Engine Canon.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` rule for pricing-touching templates + content classifier (D-16, D-27, D-52).
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — v2 loop; channel engine = the dispatch + measure layer.
- `obsidian/reference/Contracts Registry.md` — F-ID allocation pattern.
- `obsidian/reference/Database Schema.md` — RLS + hash-chain + trigger patterns.
- `obsidian/reference/Core Lib.md` — `lib/markos/*` module conventions.
- `obsidian/reference/HTTP Layer.md` — `/v1/channels/*` API conventions.
- `obsidian/reference/UI Components.md` — workspace + component conventions.

### Planning lane (precedence 3)
- `.planning/ROADMAP.md` — Phase 223 section + v4.2.0 milestone + dependency graph (205, 207, 208, 209, 210, 221, 222).
- `.planning/REQUIREMENTS.md` — EML-01..05, MSG-01..05, CDP-01..05 (read-side carry-forward), CRM-01..05 (read-side carry-forward), QA-01..15 targets.
- `.planning/STATE.md` — current execution state.
- `.planning/V4.2.0-INCOMING-18-26-GSD-DISCUSS-RESEARCH-ROUTING.md` — routing for docs 18-26.
- `.planning/V4.2.0-DISCUSS-RESEARCH-REFRESH-221-228.md` — cross-phase additive posture; "Email/messaging already has an adapter seam" finding.
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` — substrate inventory.
- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md` + `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md` — mandatory testing doctrine.
- `.planning/phases/223-native-email-messaging-orchestration/DISCUSS.md` — scope + 6 proposed slices.
- `.planning/phases/223-native-email-messaging-orchestration/223-RESEARCH.md` — refresh at plan-phase.
- `.planning/phases/223-native-email-messaging-orchestration/223-REVIEWS.md` — cross-AI review (Claude runtime override) — drove iter 1 replan to D-42..D-55.

### Prior phase decisions Channel Engine must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — D-09/D-10 RLS + audit.
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — D-01 high-signal projection (preserved via D-29 fan-out).
- `.planning/phases/104-native-outbound-execution/104-CONTEXT.md` — D-04 channel-specific consent fail-closed (preserved via D-19 + D-13). D-06 CRM-native posture (evolved in D-33). D-07 timeline writeback (evolved in D-29).
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — D-05/D-06 approval-package pattern (reused in D-17/D-32 via `buildApprovalPackage` per D-43).
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md` — AgentRun v2 wraps dispatch (D-14). **Hard prereq per D-45.**
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md` — Approval Inbox + Morning Brief + single shell (D-17/D-35).
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + claim TTL for content classifier (D-16, D-25, D-52).
- `.planning/phases/210-connector-wow-loop-and-recovery/210-CONTEXT.md` — connector secrets non-negotiable (D-39).
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md` — strategy/brief/draft/audit/approval/dispatch loop; `{{MARKOS_PRICING_ENGINE_PENDING}}` rule (D-16, D-27, D-52). Classifier IMPL is P223-owned per D-53.
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — D-11 ConsentState SOR (D-11/D-12 cutover); D-12 outbound shim cutover MANDATE; D-18 audience double-gate (D-19); D-19 audience snapshot audit; D-20 dispatch skip audit; D-22 read-only CDP API.
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` — D-05/D-22 cdp_events emit; D-08 nba_records (related_nba_id on threads); D-16 primary_owner derivation; D-25 TimelineDetailView (D-34 channel chips); D-29 reporting cockpit gain channel rollups.

### Existing code + test anchors (read before planning) — VERIFIED
- `lib/markos/outbound/providers/base-adapter.ts` — channel capabilities + send + normalizeEvent contract (extended in D-08). **EXISTS.**
- `lib/markos/outbound/providers/resend-adapter.ts` — email provider adapter. **EXISTS.**
- `lib/markos/outbound/providers/twilio-adapter.ts` — SMS + WhatsApp provider adapter. **EXISTS.**
- `lib/markos/outbound/consent.ts` — eligibility evaluator (cutover target D-11). **EXISTS.**
- `lib/markos/outbound/scheduler.ts` — sequence scheduling (replaced by D-14 AgentRun + Queues). **EXISTS.**
- `lib/markos/outbound/events.ts` — provider event normalization (extended in D-22 + D-29). **EXISTS.**
- `lib/markos/outbound/conversations.ts` — conversation state (replaced by messaging_threads in D-03). **EXISTS.**
- `lib/markos/outbound/drafts.ts` — draft message handling (preserved). **EXISTS.**
- `lib/markos/outbound/workspace.ts` — outbound workspace (evolved D-33). **EXISTS.**
- `api/crm/outbound/{send,sequences,bulk-send,templates}.js` — current ops API (kept as legacy adapter in D-33). **EXISTS.**
- `api/webhooks/{resend-events,twilio-events,subscribe,unsubscribe}.js` — webhook handlers (extended in D-29; add knock-events). **EXISTS.**
- `api/cron/webhooks-dlq-purge.js` — cron handler legacy pattern reference for D-49 (verified at `api/cron/webhooks-dlq-purge.js:20-30` for shared-secret header pattern). **EXISTS.**
- `lib/markos/cdp/adapters/crm-projection.ts` — P221 adapter consumed by D-11/D-19/D-26. **DOES NOT EXIST YET — P221 owns; hard prereq per D-45.**
- `lib/markos/crm360/*` — P222 SOR consumed by D-23/D-26/D-29. **DOES NOT EXIST YET — P222 owns; hard prereq per D-45.**
- `lib/markos/crm/agent-actions.ts::buildApprovalPackage` — P105 approval pattern reused by D-17/D-32 (per D-43). **EXISTS at line 68.**
- `onboarding/backend/runtime-context.cjs::requireHostedSupabaseAuth` — auth wrapper (per D-42). **EXISTS at line 491.**
- `markos_audit_log` (P201 hash chain) — consumes all new mutation events. **EXISTS.**
- `lib/markos/mcp/tools/index.cjs` — MCP registry (per D-48). **EXISTS as `.cjs`.**
- `contracts/openapi.json` — OpenAPI spec (per D-47). **EXISTS.**

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets (verified at review time)
- `lib/markos/outbound/providers/base-adapter.ts` — extend CHANNEL_CAPABILITIES from 3 → 5 channels (add push + in_app); add `verifyWebhookSignature` and `getRateLimitState` to adapter contract (D-08).
- `lib/markos/outbound/providers/resend-adapter.ts` — preserved; add inbound parsing handler (D-22).
- `lib/markos/outbound/providers/twilio-adapter.ts` — preserved.
- `lib/markos/outbound/consent.ts::evaluateOutboundEligibility` — refactored to read ConsentState only via P221 adapter (D-11). Keep return shape identical for backward compat.
- `lib/markos/outbound/events.ts::normalizeOutboundEventForLedger` — extended to handle email replies + Knock push events + emit single fan-out (D-22 + D-29).
- `lib/markos/outbound/scheduler.ts` — replaced by AgentRun + Queues dispatch (D-14); legacy file kept as adapter during transition.
- `lib/markos/outbound/conversations.ts` — replaced by messaging_threads (D-03); legacy hydration via adapter.
- `api/webhooks/resend-events.js` + `api/webhooks/twilio-events.js` — extended to call new fan-out emit() (D-29). New `api/webhooks/knock-events.js`.
- `api/cron/webhooks-dlq-purge.js` — cron pattern reference for D-49 (legacy `api/cron/*.js` + shared-secret header).
- `lib/markos/crm/agent-actions.ts::buildApprovalPackage` — approval package factory (D-43, verified at line 68).

### P221/P222-owned (hard prereq, NOT P223)
- `lib/markos/cdp/*` — ConsentState + TraitSnapshot reads (P221 owns; D-44).
- `lib/markos/crm360/*` — Customer360 + MessagingThread cross-link target (P222 owns; D-44).

### Established patterns
- Adapter-based provider integration (Resend, Twilio); base-adapter.ts is the contract surface.
- Provider event normalization → ConversationState (replaced by messaging_threads).
- Eligibility evaluator returns `buildEligibilityResult()` with reason_code (preserved in D-11).
- Webhook signature verification per provider (preserved + standardized in D-38).
- AgentRun durable runs (P207) wrapping long-running ops (D-14).
- Vercel Queues for at-least-once fan-out (P203 webhook engine pattern).
- Approval-package per high-risk mutation (P105 + P208 inbox) — via `buildApprovalPackage` per D-43.
- `cdp_events` envelope as canonical event ledger (P221 + P222 D-22).
- HIGH_SIGNAL filter for operator-visible CRM activity (P101 D-01 → preserved via commercial_signal mapping in D-29).
- Tombstone propagation (P221 D-24 → P222 D-32 → channel suppressions add row on tombstone).
- `markos_audit_log` hash chain for governance events.
- Cron with shared-secret header (`x-markos-cron-secret` + `MARKOS_WEBHOOK_CRON_SECRET` env) — see `api/cron/webhooks-dlq-purge.js`.
- DB-trigger compliance gates — used for consent-write single-writer (D-51) and frequency-cap (D-50).

### Integration points
- **Upstream (HARD prereq per D-45):** ConsentState + AudienceSnapshot + TraitSnapshot from P221; Customer360 + Opportunity + nba_records from P222; AgentRun v2 from P207. Phase 223 will not execute if any of [P205, P207, P208, P209, P210, P211, P221, P222] is absent.
- **Provider:** Resend (email + inbound parsing) + Twilio (SMS/WhatsApp) + Knock (push + in_app fanout).
- **CRM legacy:** `api/crm/outbound/*` paths kept as legacy adapter `lib/markos/channels/adapters/legacy-outbound.ts` (P223-owned greenfield per D-44) during deprecation window; rewrite consumers post-P223.
- **Downstream P224 launches:** read EmailCampaign + LifecycleJourney shapes for launch orchestration.
- **Downstream P225 analytics:** read dispatch_events + cdp_events for attribution + journey + narrative.
- **Downstream P226 sales enablement:** uses MCP `send_messaging` for sales-assist outreach with Opportunity context.
- **Pricing Engine:** all pricing-bound template variables resolve through Pricing Engine context (via allowlisted accessors per D-52) or fail with `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- **Approval Inbox (P208):** channel approvals = first-class entry type (`buildApprovalPackage` per D-43).
- **Morning Brief (P208):** reply_pending threads + at_risk senders surfaced.

</code_context>

<specifics>
## Specific Ideas

- "Deliverability before scale" (doc 19 rule 1) — operator workspace surfaces sender reputation status FIRST; warming senders cannot send broadcast class until verified + reputation_status='healthy'.
- "Replies are signals, not residue" (doc 19 rule 6) — D-22/D-23 reply flow creates CRM task + escalates to thread.owner; reply is never a silent log entry.
- "Permission before reach" (doc 21 rule 1) + "Channel-specific compliance before automation" (doc 21 rule 5) — D-19 layered gate; jurisdiction matrix per channel; quiet hours per recipient.
- "Operator override before risky external mutation" (doc 21 rule 6) — D-16 manual override + dispatch pause/cancel; no autonomous send.
- "Every send must feed CRM, CDP, and Analytics" (doc 19 rule 7 / doc 21 rule 7) — D-29 single fan-out enforces this on every event.
- Email subject + sender are the highest-impact spam signals — D-06 SenderIdentity warming flow + D-07 reputation_status gate prevents new senders from broadcasting.
- WhatsApp 24-hour session window: existing twilio-adapter handles; D-19 + D-54 explicit ordering ensures session checks run BEFORE quiet-hours deferral; defer-past-session is fail-closed.
- Push channel via Knock: chosen because Vercel Marketplace partner (per /vercel:marketplace), unified API across FCM + APNS + web push, free tier suitable for v1, opensource SDK.
- in_app messages stored in `in_app_messages` table read by operator shell on next page load — no SSE/websocket required for v1; recipient sees messages on next nav. SSE optional in P224.
- DB-layer enforcement for compliance gates (frequency cap D-50, consent-write D-51) — service-role bypasses RLS; triggers fire for service-role too.

</specifics>

<deferred>
## Deferred Ideas

### For future commercial-engine phases
- Conversion surfaces (landing pages, forms, CTA), launch orchestration, post-launch feedback → P224 (consumes EmailCampaign + LifecycleJourney shapes).
- Semantic attribution + customer journey analytics + narrative + anomaly intelligence → P225 (consumes dispatch_events + cdp_events).
- Sales enablement (battlecards, proof packs, proposals, win/loss capture) → P226 (uses MCP send_messaging for outreach).
- Ecosystem + partner + affiliate + referral + community → P227.
- Commercial OS integration closure → P228.

### For future enrichment
- A/B testing on EmailCampaign + LifecycleJourney + MessagingThread — defer to P225 analytics + experiment registry from P218 D-05.
- AI-generated subject + body — defer to P226 deal-execution copilot integration.
- Real-time SSE/websocket for in_app messages — defer to P224 conversion surfaces (live forms + in-app workflow).
- Inbound voice / IVR — defer; out of v1 scope.
- iMessage Business / Apple Business Chat — defer.
- Bring-your-own-provider (custom SMTP, MessageBird, Postmark) — defer; v1 = Resend/Twilio/Knock fixed.
- Multi-region send routing for compliance (EU residency for EU recipients) — defer to P228 integration closure.
- Send-time optimization (best-time-to-send ML) — defer to P225 analytics + P207 AgentRun routing.
- Email engagement scoring per recipient (open/click history) feeding back into Customer360 score envelope — partially flows via D-29 commercial_signal; full scoring deferred to P225.
- Sender warmup automation → defer to ops; v1 surfaces warming status, operator drives warmup manually.

### Toolchain / convention deferrals (review-driven)
- **App Router migration of `api/` → `api/v1/.../route.ts`** — deferred to a dedicated framework-migration phase. P223 stays on legacy `api/*.js` flat per D-42/D-49.
- **vitest + playwright + supabase-types + openapi-generate toolchain** — deferred unless an explicit toolchain-introduction task lands first. P223 uses `npm test` (Node `--test`) per D-46.

### REJECTED escape hatches (review-driven; supersedes prior CONTEXT/RESEARCH/Plans language)
The following were present in iter-0 plans/CONTEXT or RESEARCH and are explicitly rejected by D-42..D-55:
- **AgentRun bridge stub config flag `workflow.agentrun_v2_available` (was D-15 iter-0)** — REJECTED. Replaced by D-15-revised hard-fail via assertUpstreamReady (D-45). No bridge stub. Channel dispatch IS the run-tracked operation.
- **`workflow.outbound_consent_legacy_view` config flag (was D-11 iter-0)** — REJECTED. Replaced by D-51 trigger model. Trigger fires regardless of any flag.
- **Frequency cap "rolling window in dispatch_events vs Redis sliding window" Claude's Discretion (was line 165 iter-0)** — REJECTED. Pinned to DB trigger per D-50.
- **Vercel Queues fallback to Supabase pg_boss `workflow.vercel_queues_available` flag (was line 166 iter-0)** — TRIMMED. Vercel Queues is the only path for P223; fallback deferred unless vendor lock becomes a documented concern.
- **Soft-skip dependency posture for P205/P207/P208/P209/P210/P211/P221/P222** (escape hatches across iter-0 plans/CONTEXT) — REJECTED. Replaced by D-45 hard preflight.
- **Plan 06 fictional `app/api/cron/crm360-drift/route.ts` reference** — REJECTED. Replaced by real `api/cron/webhooks-dlq-purge.js` legacy pattern citation per D-49.
- **`createApprovalPackage` everywhere** (~14 invocations across iter-0 Plans 03/04/05 + CONTEXT) — REJECTED. Replaced by `buildApprovalPackage` per D-43. The symbol `createApprovalPackage` does not exist in the codebase.
- **`lib/markos/{cdp,crm360,channels}/*` cited as "evolve existing"** — REJECTED. Greenfield ownership clarified per D-44 (P221/P222 own cdp/crm360; P223 owns channels).
- **App Router cron handlers `app/api/cron/channels-*/route.ts`** (Plan 06 iter-0) — REJECTED. Replaced by legacy `api/cron/channels-*.js` per D-49.
- **vitest + playwright in `<verify><automated>` blocks** (~226 references iter-0) — REJECTED. Replaced by `npm test`/`node --test` per D-46.
- **5-line regex pricing classifier (CONTEXT D-16/D-27 iter-0)** — REJECTED. Replaced by AST/allowlist via `@babel/parser` per D-52.
- **"Carry from P211" content classifier framing (CONTEXT D-16 iter-0)** — REJECTED. Classifier is P223-owned greenfield per D-53.
- **RLS-only consent-write blocking (D-12 iter-0 ambiguity)** — REJECTED. Pinned to BEFORE INSERT/UPDATE trigger per D-51 (service-role bypasses RLS).

### Reviewed Todos (not folded)
None — no pending todos matched Phase 223 scope.

</deferred>

---

*Phase: 223-native-email-messaging-orchestration*
*Context gathered: 2026-04-24*
*Context revised: 2026-04-26 (review-driven; D-42..D-55 + rejected escape hatches)*
