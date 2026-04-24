# Phase 223: Native Email and Messaging Orchestration - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (interactive, --chain)

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
- **D-11:** Full cutover lands in P223. `lib/markos/outbound/consent.ts::evaluateOutboundEligibility` reads `cdp_consent_states` ONLY (via P221 adapter `getConsentState(profile_id, channel)`). Legacy `outboundConsentRecords` becomes a derived view backed by `cdp_consent_states` for backward compatibility (3-month deprecation window flag in `.planning/config.json: workflow.outbound_consent_legacy_view = true`).
- **D-12:** Writes to `outboundConsentRecords` go through `setConsentState` (P221) which is the only writer; legacy direct writes are blocked at the table level via RLS or trigger. Drift audit cron from P221 D-26 covers any divergence during the deprecation window.
- **D-13:** Channel eligibility evaluation extends ConsentState fields: in addition to channel `opted_in/out`, dispatch checks `legal_basis` (consent vs legitimate_interest), `quiet_hours` per recipient, `preference_tags[]` (frequency/category opt-outs), and `jurisdiction` (per tenant config — some jurisdictions require explicit consent for marketing).

### Send execution architecture
- **D-14:** Each program dispatch = one AgentRun (P207) wrapping a Vercel Queues fan-out:
  - `markos_agent_runs` row created with run_type='channel_dispatch', subject_type='email_campaign'|'messaging_thread'|'lifecycle_journey_run', subject_id.
  - Vercel Queues handles per-recipient enqueueing (at-least-once delivery, max_concurrency = sender.daily_send_limit / 24).
  - Per-recipient handler runs the double-gate (D-19) → calls adapter.send() → emits dispatch_events row.
  - Idempotency via `dispatch_attempt_id` (UUID per recipient per attempt; deduplication on retry).
  - Run-level cancel/pause/resume via P207 AgentRun semantics.
- **D-15:** P207 not yet executed at P223 plan time. Bridge: AgentRun wrapper writes directly to `markos_audit_log` if `markos_agent_runs` table absent; flag in config `workflow.agentrun_v2_available` controls behavior. Execute-phase recheck after P207 lands.

### Approval threshold model
- **D-16:** Layered approval triggers — fail-CLOSED at first triggering layer:
  - **Class:** `broadcast` and `revenue` ALWAYS require approval. `transactional` auto-approves within sender.class_permissions. `lifecycle` auto-approves within sender.class_permissions UNLESS another layer triggers.
  - **Count:** any send to ≥500 recipients ALWAYS requires approval (configurable per tenant; default 500).
  - **Content classifier:** runs at template-render time:
    - Pricing/packaging copy → `{{MARKOS_PRICING_ENGINE_PENDING}}` detection (P211 rule + Pricing Engine Canon).
    - Factual claim → P209 EvidenceMap check (every claim variable must have evidence_ref + freshness within TTL).
    - Competitor mention → flag for review.
    - Failure of any check → require approval.
  - **Manual override:** operator can flag any program for approval via `email_campaigns.requires_approval = true`.
- **D-17:** Approvals route through P208 Approval Inbox via existing approval-package pattern (`lib/markos/crm/copilot.ts::createApprovalPackage`). Approver actions: approve / reject / request changes. Approved campaign transitions `status: pending_approval → approved`. Approval revocation pre-dispatch is supported; mid-dispatch sends a pause signal to AgentRun.
- **D-18:** Re-engagement campaigns (sender.last_send_at to a recipient > 90 days OR recipient.lifecycle_stage = 'lost') ALWAYS require approval regardless of class.

### Audience double-gate dispatch
- **D-19:** Per-recipient gate at send time (P221 D-18 explicit — re-validated, not just snapshot membership):
  1. **ConsentState lookup** (`getConsentState(profile_id, channel)` via P221 adapter) — channel `opted_in`? if `unknown` and tenant policy = `legitimate_interest` → allow; else block.
  2. **Suppression list check** — tenant-level suppression table (`channel_suppressions`: profile_id, channel, reason ∈ {hard_bounce, complaint, manual_op, dsr_deletion, jurisdiction}, suppressed_at) — any row blocks.
  3. **Frequency cap check** — tenant policy (default: ≤2 marketing sends per channel per recipient per 7d, transactional unlimited) + per-program override; reads `dispatch_events` rolling window.
  4. **Quiet hours check** — recipient timezone (from CDP TraitSnapshot `time_zone`) + ConsentState `quiet_hours` window. If now in quiet hours → defer until next send window (re-enqueue with delay).
  5. **Jurisdiction check** — tenant config: `(jurisdiction, channel, marketing_legal_basis)` matrix — e.g., EU + email + marketing requires `legal_basis='consent'`. Mismatch → block.
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
- **D-27:** Pricing copy: any variable bound to pricing context MUST resolve to either (a) approved Pricing Engine record, or (b) literal `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder. Content classifier (D-16) blocks dispatch if pricing variable resolves to a non-approved value.
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
- **D-31:** MCP tools (5):
  - `send_email_program` — dispatch an EmailCampaign by id (validates approval state).
  - `send_messaging` — send a single MessagingThread message (1:1).
  - `get_thread` — fetch a MessagingThread with last N messages.
  - `get_deliverability_posture` — current 24h DeliverabilityPosture per sender per channel.
  - `list_pending_approvals` — pending channel approvals for the operator.
- **D-32:** All write APIs honor approval-package pattern (D-17). High-risk mutations (approval_ref required for: campaign create with class=broadcast or revenue, send to ≥500 recipients, pricing-touching template publish, sender_identity verification update, suppression bulk add).

### UI surface
- **D-33:** Evolve existing CRM outbound workspace + add channel-engine surfaces (P208 single-shell rule):
  - `components/markos/crm/outbound/outbound-workspace.tsx` consumes new program models via legacy adapter `lib/markos/channels/adapters/legacy-outbound.ts`.
  - New: `ChannelProgramsList` (kanban-by-status of campaigns + lifecycle journeys), `MessagingThreadsList` (queue of threads with reply_pending priority, by owner), `DeliverabilityWorkspace` (sender + 24h posture + reputation trend + suppression count), `TemplateEditor` (per-channel preview + variables + evidence + pricing bindings), `ApprovalReviewPanel` (P208 inbox entries for channel approvals).
- **D-34:** TimelineDetailView from P222 D-25 gains channel event chips (open/click/reply/bounce per send).

### Observability + operator posture
- **D-35:** Operator surfaces (no new dashboards beyond D-33):
  - DeliverabilityWorkspace shows reputation_status per sender (warming/healthy/watch/at_risk) with concrete operator next-actions.
  - Approval Inbox (P208) shows channel approval entries with class + count + content-flag reasons.
  - Morning Brief (P208) shows top reply_pending threads by primary_owner + at_risk senders requiring action.
  - Bounce/complaint spike alerts (>2σ from 7-day baseline) emit operator task.

### Security + tenancy
- **D-36:** RLS on all new tables (`email_campaigns`, `messaging_threads`, `lifecycle_journeys`, `lifecycle_journey_runs`, `sender_identities`, `deliverability_posture`, `channel_templates`, `channel_suppressions`, `dispatch_events`, `dispatch_skips`, `in_app_messages`). Fail closed on missing tenant context.
- **D-37:** Audit trail mandatory on all approvals + ConsentState mutations + suppression mutations + sender_identity verification changes + program dispatches + manual overrides. Reuses unified `markos_audit_log` (P201 hash chain).
- **D-38:** Webhook signature verification mandatory on every provider event (Resend/Twilio/Knock all support signed webhooks). Verification failure → 401 + audit log row.
- **D-39:** No raw provider secrets in logs/prompts/MCP payloads (P210 non-negotiable carried).

### Contracts + migrations
- **D-40:** Fresh F-ID allocation by planner (continue after P222's F-121). Expect 9-12 new contracts:
  - F-xxx-channel-email-campaign-v1
  - F-xxx-channel-messaging-thread-v1
  - F-xxx-channel-lifecycle-journey-v1
  - F-xxx-channel-sender-identity-v1
  - F-xxx-channel-deliverability-posture-v1
  - F-xxx-channel-template-v1
  - F-xxx-channel-suppression-v1
  - F-xxx-channel-dispatch-event-v1
  - F-xxx-channel-program-dispatch-write (write contract for MCP tools)
  - F-xxx-channel-approval-flow (extends P105 approval-package)
- **D-41:** New migrations allocated by planner (continue after P222 migration 112). Expect 7-10:
  - email_campaigns + messaging_threads + lifecycle_journeys + lifecycle_journey_runs
  - sender_identities + deliverability_posture
  - channel_templates + channel_suppressions
  - dispatch_events + dispatch_skips + in_app_messages
  - extensions to existing crm_activity (already done in P222) + outbound_consent_records → derived view

### Claude's Discretion
- Module boundary under `lib/markos/channels/*` (campaigns vs threads vs journeys vs templates vs senders vs deliverability vs adapters).
- Exact Handlebars helper set (escapes, conditionals, loops) — pick conservative subset to limit attack surface.
- Lifecycle journey trigger evaluation: pure event-driven via cdp_events tail vs scheduled poll. Planner picks at plan time.
- Frequency cap implementation: rolling window in dispatch_events vs Redis sliding window. Planner decides per scale.
- Vercel Queues vs alternative: confirm at plan time if Vercel Queues available at tenant tier; fallback to Supabase pg_boss if not.
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
- `obsidian/brain/Pricing Engine Canon.md` — `{{MARKOS_PRICING_ENGINE_PENDING}}` rule for pricing-touching templates + content classifier (D-16, D-27).
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md` — v2 loop; channel engine = the dispatch + measure layer.
- `obsidian/reference/Contracts Registry.md` — F-ID allocation pattern.
- `obsidian/reference/Database Schema.md` — RLS + hash-chain patterns.
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

### Prior phase decisions Channel Engine must honor
- `.planning/phases/100-crm-schema-and-identity-graph-foundation/100-CONTEXT.md` — D-09/D-10 RLS + audit.
- `.planning/phases/101-behavioral-tracking-and-lifecycle-stitching/101-CONTEXT.md` — D-01 high-signal projection (preserved via D-29 fan-out).
- `.planning/phases/104-native-outbound-execution/104-CONTEXT.md` — D-04 channel-specific consent fail-closed (preserved via D-19 + D-13). D-06 CRM-native posture (evolved in D-33). D-07 timeline writeback (evolved in D-29).
- `.planning/phases/105-approval-aware-ai-copilot-and-reporting-closeout/105-CONTEXT.md` — D-05/D-06 approval-package pattern (reused in D-17/D-32).
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md` — AgentRun v2 wraps dispatch (D-14/D-15).
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md` — Approval Inbox + Morning Brief + single shell (D-17/D-35).
- `.planning/phases/209-evidence-research-and-claim-safety/209-CONTEXT.md` — EvidenceMap + claim TTL for content classifier (D-16, D-25).
- `.planning/phases/210-connector-wow-loop-and-recovery/210-CONTEXT.md` — connector secrets non-negotiable (D-39).
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md` — strategy/brief/draft/audit/approval/dispatch loop; `{{MARKOS_PRICING_ENGINE_PENDING}}` rule (D-16, D-27).
- `.planning/phases/221-cdp-identity-audience-consent-substrate/221-CONTEXT.md` — D-11 ConsentState SOR (D-11/D-12 cutover); D-12 outbound shim cutover MANDATE; D-18 audience double-gate (D-19); D-19 audience snapshot audit; D-20 dispatch skip audit; D-22 read-only CDP API.
- `.planning/phases/222-crm-timeline-commercial-memory-workspace/222-CONTEXT.md` — D-05/D-22 cdp_events emit; D-08 nba_records (related_nba_id on threads); D-16 primary_owner derivation; D-25 TimelineDetailView (D-34 channel chips); D-29 reporting cockpit gain channel rollups.

### Existing code + test anchors (read before planning)
- `lib/markos/outbound/providers/base-adapter.ts` — channel capabilities + send + normalizeEvent contract (extended in D-08).
- `lib/markos/outbound/providers/resend-adapter.ts` — email provider adapter.
- `lib/markos/outbound/providers/twilio-adapter.ts` — SMS + WhatsApp provider adapter.
- `lib/markos/outbound/consent.ts` — eligibility evaluator (cutover target D-11).
- `lib/markos/outbound/scheduler.ts` — sequence scheduling (replaced by D-14 AgentRun + Queues).
- `lib/markos/outbound/events.ts` — provider event normalization (extended in D-22 + D-29).
- `lib/markos/outbound/conversations.ts` — conversation state (replaced by messaging_threads in D-03).
- `lib/markos/outbound/drafts.ts` — draft message handling (preserved).
- `lib/markos/outbound/workspace.ts` — outbound workspace (evolved D-33).
- `api/crm/outbound/{send,sequences,bulk-send,templates}.js` — current ops API (kept as legacy adapter in D-33).
- `api/webhooks/{resend-events,twilio-events,subscribe,unsubscribe}.js` — webhook handlers (extended in D-29; add knock-events).
- `lib/markos/cdp/adapters/crm-projection.ts` — P221 adapter consumed by D-11/D-19/D-26.
- `lib/markos/crm360/*` — P222 SOR consumed by D-23/D-26/D-29.
- `lib/markos/crm/copilot.ts::createApprovalPackage` — P105 approval pattern reused by D-17/D-32.
- `markos_audit_log` (P201 hash chain) — consumes all new mutation events.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- `lib/markos/outbound/providers/base-adapter.ts` — extend CHANNEL_CAPABILITIES from 3 → 5 channels (add push + in_app); add `verifyWebhookSignature` and `getRateLimitState` to adapter contract (D-08).
- `lib/markos/outbound/providers/resend-adapter.ts` — preserved; add inbound parsing handler (D-22).
- `lib/markos/outbound/providers/twilio-adapter.ts` — preserved.
- `lib/markos/outbound/consent.ts::evaluateOutboundEligibility` — refactored to read ConsentState only via P221 adapter (D-11). Keep return shape identical for backward compat.
- `lib/markos/outbound/events.ts::normalizeOutboundEventForLedger` — extended to handle email replies + Knock push events + emit single fan-out (D-22 + D-29).
- `lib/markos/outbound/scheduler.ts` — replaced by AgentRun + Queues dispatch (D-14); legacy file kept as adapter during transition.
- `lib/markos/outbound/conversations.ts` — replaced by messaging_threads (D-03); legacy hydration via adapter.
- `api/webhooks/resend-events.js` + `api/webhooks/twilio-events.js` — extended to call new fan-out emit() (D-29). New `api/webhooks/knock-events.js`.
- `lib/markos/cdp/adapters/crm-projection.ts` (P221) — ConsentState + TraitSnapshot reads.
- `lib/markos/crm360/*` (P222) — Customer360 + MessagingThread cross-link target.
- `lib/markos/crm/copilot.ts::createApprovalPackage` — approval package factory.

### Established patterns
- Adapter-based provider integration (Resend, Twilio); base-adapter.ts is the contract surface.
- Provider event normalization → ConversationState (replaced by messaging_threads).
- Eligibility evaluator returns `buildEligibilityResult()` with reason_code (preserved in D-11).
- Webhook signature verification per provider (preserved + standardized in D-38).
- AgentRun durable runs (P207) wrapping long-running ops (D-14).
- Vercel Queues for at-least-once fan-out (P203 webhook engine pattern).
- Approval-package per high-risk mutation (P105 + P208 inbox).
- `cdp_events` envelope as canonical event ledger (P221 + P222 D-22).
- HIGH_SIGNAL filter for operator-visible CRM activity (P101 D-01 → preserved via commercial_signal mapping in D-29).
- Tombstone propagation (P221 D-24 → P222 D-32 → channel suppressions add row on tombstone).
- `markos_audit_log` hash chain for governance events.

### Integration points
- **Upstream:** ConsentState + AudienceSnapshot + TraitSnapshot from P221; Customer360 + Opportunity + nba_records from P222; AgentRun v2 from P207 (when live).
- **Provider:** Resend (email + inbound parsing) + Twilio (SMS/WhatsApp) + Knock (push + in_app fanout).
- **CRM legacy:** `api/crm/outbound/*` paths kept as legacy adapter `lib/markos/channels/adapters/legacy-outbound.ts` during deprecation window; rewrite consumers post-P223.
- **Downstream P224 launches:** read EmailCampaign + LifecycleJourney shapes for launch orchestration.
- **Downstream P225 analytics:** read dispatch_events + cdp_events for attribution + journey + narrative.
- **Downstream P226 sales enablement:** uses MCP `send_messaging` for sales-assist outreach with Opportunity context.
- **Pricing Engine:** all pricing-bound template variables resolve through Pricing Engine context or fail with `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- **Approval Inbox (P208):** channel approvals = first-class entry type.
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
- WhatsApp 24-hour session window: existing twilio-adapter handles; D-19 quiet-hours + frequency-cap layer composes with it (no override of WhatsApp rules).
- Push channel via Knock: chosen because Vercel Marketplace partner (per /vercel:marketplace), unified API across FCM + APNS + web push, free tier suitable for v1, opensource SDK.
- in_app messages stored in `in_app_messages` table read by operator shell on next page load — no SSE/websocket required for v1; recipient sees messages on next nav. SSE optional in P224.

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

### Reviewed Todos (not folded)
None — no pending todos matched Phase 223 scope.

</deferred>

---

*Phase: 223-native-email-messaging-orchestration*
*Context gathered: 2026-04-24*
