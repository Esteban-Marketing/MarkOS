# Phase 223: Native Email and Messaging Orchestration — Research

**Researched:** 2026-04-24
**Domain:** Owned-channel execution engine — email (transactional/lifecycle/broadcast/revenue), WhatsApp, SMS, push (Knock), in_app; shared consent (P221), shared audience (P221), shared approval (P208), shared commercial memory (P222); AgentRun-wrapped dispatch + Vercel Queues fan-out; full ConsentState cutover; per-recipient double-gate; layered approval; channel templates with Handlebars; `/v1/channels/*` API + 5 MCP tools
**Confidence:** HIGH (all architectural claims verified against codebase + 41 locked decisions in 223-CONTEXT.md + P221/P222 RESEARCH cross-reference + live web verification for Knock/Vercel Queues/Resend inbound)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Program model
- D-01: Separate per-channel program models: `email_campaigns`, `messaging_threads`, `lifecycle_journeys`. Each mirrors operator mental model.
- D-02: `email_campaigns` shape: campaign_id, tenant_id, campaign_type IN {transactional, lifecycle, broadcast, revenue}, objective, audience_snapshot_id (FK P221), template_id (FK channel_templates), sender_identity_id (FK sender_identities), schedule_at, throttle_per_minute, time_zone_strategy IN {tenant_default, recipient_local, fixed_utc}, frequency_cap_override, approval_ref (nullable), status IN {draft, pending_approval, approved, scheduled, dispatching, dispatched, paused, cancelled, completed, failed}, dispatch_run_id (FK markos_agent_runs).
- D-03: `messaging_threads` shape: thread_id, tenant_id, profile_id (FK cdp_identity_profiles), account_id (nullable), channel IN {whatsapp, sms, push, in_app}, current_status IN {open, waiting, escalated, resolved, blocked, reply_pending}, owner_user_id, last_message_at, last_direction, sentiment, related_crm_id (FK customer_360_records), related_opportunity_id, related_support_case_id, related_nba_id (FK nba_records nullable).
- D-04: `lifecycle_journeys` shape: journey_id, tenant_id, name, trigger_event_envelope (JSONB — event_name + event_domain + filter), target_audience_id (nullable), step_definitions[] (ordered: channel + template_id + delay + branch_logic), status, paused_at, version. Each journey instance = `lifecycle_journey_runs` row with current_step + state + due_at.
- D-05: Revenue class campaign may use single-row audience_snapshot for 1:1 sends; preserves audience double-gate posture.

#### Channel + sender + deliverability
- D-06: `sender_identities` table: sender_id, tenant_id, label, from_name, from_email, reply_to_email, sending_domain, subdomain, verification_status IN {pending, verified, failed}, dkim_status, spf_status, dmarc_status, reputation_status IN {warming, healthy, watch, at_risk}, daily_send_limit, class_permissions IN EmailClass[], created_at, last_warmed_at. Email-only v1.
- D-07: `deliverability_posture` table: composite key (tenant_id, channel, sender_id, window_24h_start), bounce_rate, complaint_rate, reply_rate, open_rate, click_rate, unsubscribe_rate, hard_bounce_count, soft_bounce_count, complaint_count, sample_size, reputation_score (0-100), trend IN {improving, stable, watch, degrading}. Rolling 24h windows recomputed hourly via cron.
- D-08: Channel capabilities in base-adapter.ts expanded from 3 → 5 (add push + in_app). New contract methods: send, normalizeEvent, verifyWebhookSignature, getRateLimitState, getReputationSnapshot (optional).

#### Push + in_app provider
- D-09: Push = Knock (Vercel Marketplace partner) v1. Adapter: `lib/markos/outbound/providers/knock-adapter.ts`. FCM/APNS abstracted by Knock.
- D-10: in_app = MarkOS-internal. Adapter writes to `in_app_messages` table. ConsentState `in_app_enabled` gates dispatch. No SSE/websocket v1 (next nav read).

#### Consent shim cutover
- D-11: Full cutover in P223. `evaluateOutboundEligibility` reads `cdp_consent_states` ONLY via P221 adapter `getConsentState(profile_id, channel)`. `outboundConsentRecords` becomes derived view. Config flag `workflow.outbound_consent_legacy_view = true` for 3-month deprecation window.
- D-12: Writes to `outboundConsentRecords` blocked at table level via RLS or trigger. Only `setConsentState` (P221) is the writer.
- D-13: Eligibility extends to legal_basis + quiet_hours + preference_tags[] + jurisdiction matrix.

#### Send execution architecture
- D-14: AgentRun (P207) wraps dispatch. `markos_agent_runs` row with run_type='channel_dispatch'. Vercel Queues fan-out at-least-once. `dispatch_attempt_id` UUID per recipient per attempt for idempotency.
- D-15: P207 bridge — if `markos_agent_runs` absent, wrapper writes to `markos_audit_log`. Config flag `workflow.agentrun_v2_available`.

#### Approval threshold model
- D-16: Layered fail-CLOSED approval triggers: (1) Class: broadcast + revenue always require approval; transactional auto-approves within class_permissions; lifecycle auto-approves unless another layer triggers. (2) Count: ≥500 recipients always requires approval (tenant-configurable). (3) Content classifier: pricing/packaging copy detection, factual claim check, competitor mention → block. (4) Manual: operator override `requires_approval=true`.
- D-17: Approvals route through P208 Approval Inbox via `createApprovalPackage`. Actions: approve/reject/request changes. Revocation supported mid-dispatch (sends pause signal to AgentRun).
- D-18: Re-engagement >90d or lifecycle_stage='lost' ALWAYS requires approval.

#### Audience double-gate dispatch
- D-19: Per-recipient 5-layer gate at send time: (1) ConsentState opted_in check. (2) Suppression list check (channel_suppressions). (3) Frequency cap check via dispatch_events rolling window (default: ≤2 marketing/channel/recipient/7d, transactional unlimited). (4) Quiet hours check via CDP TraitSnapshot time_zone. (5) Jurisdiction check via tenant config matrix.
- D-20: Skipped recipients write `dispatch_skips` audit row.
- D-21: Bounce → suppression + cdp_events with event_name='channel.suppression_added'. Soft bounce: 3 retries over 7 days, then promote to hard.

#### Inbound reply + thread continuity
- D-22: `normalizeOutboundEventForLedger` extended for email replies. Detection via Resend inbound webhook `email.received` event.
- D-23: Reply flow: (1) lookup/create messaging_threads row. (2) set thread.current_status='reply_pending'. (3) append crm_activity row. (4) emit cdp_events envelope. (5) create CRM task. (6) fire opt-out detector.
- D-24: thread.related_crm_id links all per-channel threads for same profile to one Customer360 record.

#### Templates + personalization
- D-25: `channel_templates` table: template_id, tenant_id, name, channel, template_type, subject (nullable), content_blocks[] JSONB, variables_schema JSONB (JSON Schema), evidence_bindings[], pricing_bindings[], locale ISO, parent_template_id (locale variants), version, status IN {draft, approved, archived}, approved_by, approved_at. Composite unique: (tenant_id, name, locale, version).
- D-26: Handlebars substitution at dispatch time. Variables from: CDP TraitSnapshot + Customer360 + Opportunity + explicit dispatch_context_overrides. Missing variable → fail-closed (dispatch_skip reason='missing_variable').
- D-27: Pricing variables MUST resolve to approved Pricing Engine record OR `{{MARKOS_PRICING_ENGINE_PENDING}}`. Content classifier blocks non-approved pricing values.
- D-28: Locale variants via parent_template_id chain. Fallback to parent if no locale match.

#### Channel event → downstream writeback
- D-29: Single fan-out `emit()` in `lib/markos/channels/events/emit.ts`: (1) cdp_events row. (2) crm_activity row with commercial_signal mapping. (3) aggregate state update (thread/campaign counters). (4) dispatch_events row. (5) if consent-affecting → setConsentState (P221 writer). Fail-closed full transaction rollback.

#### API + MCP surface
- D-30: Read-write `/v1/channels/*`: email programs/sends/senders/deliverability; messaging threads/sends/escalate; lifecycle journeys/pause/resume; templates/preview; approvals; suppressions.
- D-31: 5 MCP tools: send_email_program, send_messaging, get_thread, get_deliverability_posture, list_pending_approvals.
- D-32: Write APIs honor approval-package pattern. High-risk mutations require approval_ref.

#### UI surface
- D-33: Evolve existing CRM outbound workspace. Legacy adapter `lib/markos/channels/adapters/legacy-outbound.ts`. New components: ChannelProgramsList, MessagingThreadsList, DeliverabilityWorkspace, TemplateEditor, ApprovalReviewPanel.
- D-34: TimelineDetailView from P222 gains channel event chips (open/click/reply/bounce per send).
- D-35: DeliverabilityWorkspace shows per-sender reputation. Approval Inbox shows channel approval entries. Morning Brief shows reply_pending threads + at_risk senders.

#### Security + tenancy
- D-36: RLS on all 11 new tables. Fail closed on missing tenant context.
- D-37: Audit trail on approvals, ConsentState mutations, suppression mutations, sender_identity changes, dispatches, manual overrides. Reuses `markos_audit_log` P201 hash chain.
- D-38: Webhook signature verification mandatory (Resend/Twilio/Knock). Failure → 401 + audit row.
- D-39: No raw provider secrets in logs/prompts/MCP payloads.

#### Contracts + migrations
- D-40: 9-12 new contracts continuing after F-121.
- D-41: 7-10 new migrations continuing after migration 112.

### Claude's Discretion
- Module boundary under `lib/markos/channels/*` (campaigns vs threads vs journeys vs templates vs senders vs deliverability vs adapters).
- Exact Handlebars helper set — conservative subset to limit attack surface.
- Lifecycle journey trigger evaluation: event-driven vs scheduled poll.
- Frequency cap implementation: rolling window in dispatch_events vs Redis sliding window.
- Vercel Queues vs alternative: confirm at plan time; fallback to Supabase pg_boss if not available.
- TemplateEditor + DeliverabilityWorkspace component implementation details.

### Deferred Ideas (OUT OF SCOPE)
- P224: Conversion surfaces, landing pages, forms, launch orchestration. SSE/websocket for in_app.
- P225: Semantic attribution, journey analytics, narrative intelligence. A/B testing on campaigns/journeys/threads. Send-time optimization ML.
- P226: Sales enablement (battlecards, proof packs, proposals). AI-generated subject + body.
- P227: Ecosystem/partner/affiliate workflows.
- P228: Commercial OS integration closure. Multi-region send routing.
- Inbound voice/IVR, iMessage Business, bring-your-own-provider (custom SMTP/MessageBird/Postmark).
- Sender warmup automation (v1 surfaces status, operator drives manually).
- Email engagement scoring per recipient (partial via D-29 commercial_signal; full deferred to P225).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EML-01 | Native email programs: transactional, lifecycle, broadcast, revenue with governed class controls | `email_campaigns` D-01/D-02 + `sender_identities` D-06 + layered approval D-16 |
| EML-02 | Sender identity, domain authentication, DKIM/SPF/DMARC, reputation, warmup posture | `sender_identities` D-06 + `deliverability_posture` D-07 + DeliverabilityWorkspace D-35 |
| EML-03 | Lifecycle email with trigger-based journey runs | `lifecycle_journeys` + `lifecycle_journey_runs` D-04 + scheduled poll trigger D-8 |
| EML-04 | Reply intelligence: inbound parse, thread creation, CRM task, opt-out detection | D-22/D-23 + Resend inbound webhook [VERIFIED: resend.com/docs/dashboard/receiving] |
| EML-05 | Full ConsentState cutover — outboundConsentRecords becomes derived view | D-11/D-12/D-13 + consent.ts refactor + view-swap migration 119 |
| MSG-01 | WhatsApp, SMS, push, in_app channels with channel-specific compliance rules | D-08/D-09/D-10 + base-adapter.ts extension + Knock adapter D-09 [VERIFIED: knock.app] |
| MSG-02 | Per-recipient 5-layer dispatch gate: consent + suppression + frequency cap + quiet hours + jurisdiction | D-19/D-20 + `channel_suppressions` + `dispatch_skips` |
| MSG-03 | MessagingThread SOR with cross-channel continuity via related_crm_id | D-03/D-24 + P222 customer_360_records FK |
| MSG-04 | Webhook normalization + reply flow + CRM task + escalation | D-22/D-23 + single fan-out emit D-29 + `api/webhooks/knock-events.js` |
| MSG-05 | Push via Knock (Vercel Marketplace): FCM + APNS abstracted, signed webhooks | D-09 [VERIFIED: vercel.com/marketplace/knock + docs.knock.app/integrations/push] |
| CDP-01 | First-party identity read (carry-forward P221) | Satisfied by P221 adapter; consumed via getConsentState + getAudienceSnapshot |
| CDP-02 | Merge/split/provenance explainability (carry-forward P221) | Satisfied by P221; tombstone cascade into channel_suppressions D-21 |
| CDP-03 | Governed audience products (carry-forward P221) | AudienceSnapshot consumed at campaign dispatch; double-gate D-19 |
| CDP-04 | CDP events flowing into channels and back (carry-forward) | D-29 fan-out emit closes cdp_events ↔ channels loop |
| CDP-05 | Privacy/retention/consent/deletion enforced (carry-forward) | D-12 write-block + D-21 bounce→suppression + D-19 jurisdiction gate |
| CRM-01 | Timeline-first CRM (carry-forward P222) | D-29 commercial_signal writeback; thread.related_crm_id; channel chips D-34 |
| CRM-02 | Customer360 actionable (carry-forward P222) | D-23 reply → CRM task; NBA related_nba_id on threads D-03 |
| CRM-03 | Shared commercial memory (carry-forward P222) | thread.related_opportunity_id + emitCrmEventEnvelope in D-29 |
| CRM-04 | Opportunity/renewal/risk workflows create tasks (carry-forward P222) | CRM task from reply D-23; approval revocation → AgentRun pause D-17 |
| CRM-05 | CRM-generated outreach approval-aware (carry-forward P222) | D-16/D-17 approval gates; `{{MARKOS_PRICING_ENGINE_PENDING}}` D-27 |
| QA-01 | Contracts remain current | F-122..F-131 allocated; flow-registry.json updated |
| QA-02 | Tenancy, RLS, auth, audit remain production-safe | RLS all 11 new tables D-36; audit_log D-37; webhook sig D-38; no raw secrets D-39 |
| QA-03..15 | Quality baseline gates | Vitest (business logic 100% decision branches) + Playwright (operator journeys) + Chromatic (channel workspace states) |

</phase_requirements>

---

## Summary

Phase 223 is the largest execution-layer phase in the v4.2.0 commercial engines milestone. It promotes the existing `lib/markos/outbound/*` seam into a tenant-wide Channel Engine by introducing five new program model tables, two governance tables (sender_identities + deliverability_posture), five channel/dispatch tracking tables, and one template table — 13 total SQL objects — plus a derived-view swap of the legacy consent table. The P221 and P222 substrates are consumed read-only via adapters; P223 closes the loop by emitting back into cdp_events and crm_activity via a single fan-out emit() function.

The codebase already contains every reusable primitive: `base-adapter.ts` (extend from 3 to 5 channels), `consent.ts` (refactor to read ConsentState only), `events.ts` (extend for email reply + Knock + fan-out), `resend-adapter.ts` (add inbound handling), `twilio-adapter.ts` (preserved), and `createApprovalPackage` from copilot.ts (reused for all approval gates). The main net-new engineering work is: (1) the channel program tables and migrations, (2) the `lib/markos/channels/*` module tree, (3) the per-recipient double-gate library, (4) the Knock adapter, (5) the Handlebars rendering + content classifier pipeline, (6) the fan-out dispatch infrastructure (AgentRun wrapper + Vercel Queues), and (7) the `/v1/channels/*` API surface + 5 MCP tools.

The highest technical risk in this phase is the ConsentState cutover (D-11): a live substitution of the consent backend for all dispatch paths. The mitigation strategy (derived view + config flag + drift audit cron from P221 D-26) is already designed. The second highest risk is dispatch retry storms from Vercel Queues at-least-once delivery without `dispatch_attempt_id` deduplication — the idempotency key must be implemented before the queue handler is enabled.

**Primary recommendation:** Build in 5 waves. Wave 1 lays the schema + adapter foundation and completes the consent cutover. Waves 2-4 run in dependency order (dispatch infra → templates/approval → providers/webhooks). Wave 5 adds API/MCP/UI surface. Wave 6 is closeout with full RLS suite, deliverability crons, and operator journey tests.

---

## Standard Stack

### Core (existing — reused and extended)

| Module / Library | Location | Purpose | Reuse Strategy |
|-----------------|----------|---------|----------------|
| `lib/markos/outbound/providers/base-adapter.ts` | repo | Channel capabilities + send + normalizeEvent contract | Extend CHANNEL_CAPABILITIES 3→5; add verifyWebhookSignature + getRateLimitState to contract [VERIFIED: codebase read] |
| `lib/markos/outbound/providers/resend-adapter.ts` | repo | Email send + normalizeEvent | Preserve; add inbound parse handler (D-22); extend normalizeEvent for email reply detection [VERIFIED: codebase read] |
| `lib/markos/outbound/providers/twilio-adapter.ts` | repo | SMS + WhatsApp send + normalizeEvent | Preserved; add verifyWebhookSignature method |
| `lib/markos/outbound/consent.ts` | repo | evaluateOutboundEligibility — cutover target | Refactor to call getConsentState(profile_id, channel) from P221 adapter; preserve buildEligibilityResult() shape [VERIFIED: codebase read — current implementation reads outboundConsentRecords directly] |
| `lib/markos/outbound/events.ts` | repo | normalizeOutboundEventForLedger + buildConversationStateUpdate | Extend for email reply (Resend inbound_message) + Knock push events + wire fan-out emit() [VERIFIED: codebase read] |
| `lib/markos/outbound/conversations.ts` | repo | Legacy conversation state | Preserved via legacy adapter; replaced by messaging_threads for new writes [VERIFIED: codebase read — thread-per-record model; replaced by profile-scoped messaging_threads] |
| `lib/markos/outbound/scheduler.ts` | repo | Sequence scheduling | Replaced by AgentRun + Queues dispatch; file kept as legacy adapter during transition |
| `lib/markos/cdp/adapters/crm-projection.ts` | repo (P221) | getConsentState + getProfileForContact + TraitSnapshot reads | Consumed by evaluateOutboundEligibility (D-11) + variable resolution (D-26) |
| `lib/markos/crm360/*` | repo (P222) | Customer360 + NBA + Opportunity reads | Consumed by reply thread creation (D-23) + variable resolution (D-26) |
| `lib/markos/crm/copilot.ts::createApprovalPackage` | repo (P105) | Approval package factory | Reused for all layered approval triggers (D-17) |
| `markos_audit_log` | Supabase (P201) | Hash-chain audit | All new mutation types appended here (D-37) |

### New Channel Engine Modules (to be created in P223)

| Module | Path | Purpose |
|--------|------|---------|
| channels-programs | `lib/markos/channels/programs/` | EmailCampaign + LifecycleJourney + MessagingThread CRUD |
| channels-senders | `lib/markos/channels/senders/` | SenderIdentity CRUD + verification + reputation |
| channels-deliverability | `lib/markos/channels/deliverability/` | DeliverabilityPosture 24h rollup cron |
| channels-templates | `lib/markos/channels/templates/` | ChannelTemplate CRUD + Handlebars renderer + variable resolver + content classifier |
| channels-gate | `lib/markos/channels/gate/` | Per-recipient double-gate library (5 layers D-19) |
| channels-dispatch | `lib/markos/channels/dispatch/` | AgentRun wrapper + Vercel Queues fan-out + dispatch_attempt_id idempotency |
| channels-events | `lib/markos/channels/events/emit.ts` | Single fan-out emit() function (D-29) |
| channels-suppression | `lib/markos/channels/suppression/` | channel_suppressions CRUD + bounce handler |
| channels-adapters | `lib/markos/channels/adapters/` | legacy-outbound.ts bridge + consent-shim adapter |
| knock-adapter | `lib/markos/outbound/providers/knock-adapter.ts` | Knock push adapter implementing base contract |
| in-app-adapter | `lib/markos/outbound/providers/in-app-adapter.ts` | Internal in_app adapter (writes in_app_messages table) |
| channels-api | `lib/markos/channels/api/` | /v1/channels/* handler implementations |
| channels-mcp | `lib/markos/channels/mcp/` | 5 MCP tool implementations |

### Supporting Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| handlebars | ^4.7.8 | Template rendering with `{{var}}` substitution | Industry standard; sandboxed; no code execution; existing ecosystem [ASSUMED — verify npm view handlebars] |
| @knocklabs/node | ^1.x | Knock push notification SDK | Official Knock Node.js SDK; Vercel Marketplace partner [CITED: docs.knock.app/integrations/push + vercel.com/marketplace/knock] |
| zod | existing | Schema validation for variables_schema JSONB | Already in project per P222 patterns [ASSUMED — verify existing usage] |

### Test Stack

| Layer | Tool | Config | Command |
|-------|------|--------|---------|
| Business logic | Vitest (Phase 204+ doctrine) | `vitest.config.ts` (Wave 0 gap if not yet created by P221/P222) | `vitest run` |
| Browser journeys | Playwright | `playwright.config.ts` (Wave 0 gap if not yet created) | `playwright test` |
| Visual regression | Chromatic/Storybook | `.storybook/` (exists) | `chromatic` |
| Legacy regression | `node --test` | `package.json` scripts | `npm test` |

**Installation (Wave 0, if P221/P222 did not already install):**

```bash
npm install --save-dev vitest @vitest/coverage-v8 playwright @playwright/test
npm install handlebars @knocklabs/node
```

---

## F-ID + Migration Allocation

### Baseline Confirmed

P222 allocated F-113..F-121 (9 contracts) and migrations 106-112 (7 migrations). [VERIFIED: 222-RESEARCH.md module structure section shows F-113..F-121 + migrations 106-112 explicitly]

### P223 Allocation

#### Contracts: F-122..F-131 (10 contracts)

| F-ID | Name | Flow Type | Purpose |
|------|------|-----------|---------|
| F-122 | channel-email-campaign-v1 | program-config | EmailCampaign CRUD + status lifecycle + approval gate |
| F-123 | channel-messaging-thread-v1 | conversation-read-write | MessagingThread CRUD + status + related_crm linkage |
| F-124 | channel-lifecycle-journey-v1 | journey-config | LifecycleJourney CRUD + pause/resume + run management |
| F-125 | channel-sender-identity-v1 | sender-config | SenderIdentity CRUD + verification + reputation status |
| F-126 | channel-deliverability-posture-v1 | posture-read | DeliverabilityPosture 24h rolling window per sender/channel |
| F-127 | channel-template-v1 | template-config | ChannelTemplate CRUD + locale variants + approval + preview |
| F-128 | channel-suppression-v1 | suppression-config | channel_suppressions CRUD + bulk add + DSR-sourced blocks |
| F-129 | channel-dispatch-event-v1 | dispatch-read | dispatch_events + dispatch_skips read surface (deliverability source) |
| F-130 | channel-program-dispatch-write | dispatch-write | Campaign/thread/journey send trigger + approval gate + fan-out |
| F-131 | channel-approval-flow | approval-flow | Channel approval-package entry type extending P105/P208 approval inbox |

#### Migrations: 113..120 (8 migrations)

| Migration # | Name | Content |
|------------|------|---------|
| 113 | `113_channel_sender_identity.sql` | sender_identities + deliverability_posture tables + RLS |
| 114 | `114_channel_templates.sql` | channel_templates table + composite unique + RLS |
| 115 | `115_channel_programs.sql` | email_campaigns + messaging_threads + lifecycle_journeys + lifecycle_journey_runs tables + RLS |
| 116 | `116_channel_suppressions.sql` | channel_suppressions table + RLS |
| 117 | `117_channel_dispatch_tracking.sql` | dispatch_events + dispatch_skips tables + indexes for rolling-window frequency cap lookup + RLS |
| 118 | `118_channel_in_app_messages.sql` | in_app_messages table + RLS |
| 119 | `119_consent_cutover_view_swap.sql` | Convert outboundConsentRecords → derived view backed by cdp_consent_states; add trigger blocking direct writes; backfill view query |
| 120 | `120_channel_indexes_rls_hardening.sql` | Cross-table FK indexes; RLS policy review; audit_log event-type registrations for all 11 new tables |

---

## Schema Sketches

### Migration 113: `sender_identities` + `deliverability_posture`

```sql
-- sender_identities
CREATE TABLE sender_identities (
  sender_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES markos_tenants(id),
  label              TEXT NOT NULL,
  from_name          TEXT NOT NULL,
  from_email         TEXT NOT NULL,
  reply_to_email     TEXT,
  sending_domain     TEXT NOT NULL,
  subdomain          TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
                     CHECK (verification_status IN ('pending','verified','failed')),
  dkim_status        TEXT NOT NULL DEFAULT 'pending',
  spf_status         TEXT NOT NULL DEFAULT 'pending',
  dmarc_status       TEXT NOT NULL DEFAULT 'pending',
  reputation_status  TEXT NOT NULL DEFAULT 'warming'
                     CHECK (reputation_status IN ('warming','healthy','watch','at_risk')),
  daily_send_limit   INTEGER NOT NULL DEFAULT 0,
  class_permissions  TEXT[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_warmed_at     TIMESTAMPTZ,
  UNIQUE (tenant_id, from_email)
);
ALTER TABLE sender_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sender_identities
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- deliverability_posture
CREATE TABLE deliverability_posture (
  tenant_id          UUID NOT NULL REFERENCES markos_tenants(id),
  channel            TEXT NOT NULL,
  sender_id          UUID REFERENCES sender_identities(sender_id),
  window_24h_start   TIMESTAMPTZ NOT NULL,
  bounce_rate        NUMERIC(6,4) NOT NULL DEFAULT 0,
  complaint_rate     NUMERIC(6,4) NOT NULL DEFAULT 0,
  reply_rate         NUMERIC(6,4) NOT NULL DEFAULT 0,
  open_rate          NUMERIC(6,4) NOT NULL DEFAULT 0,
  click_rate         NUMERIC(6,4) NOT NULL DEFAULT 0,
  unsubscribe_rate   NUMERIC(6,4) NOT NULL DEFAULT 0,
  hard_bounce_count  INTEGER NOT NULL DEFAULT 0,
  soft_bounce_count  INTEGER NOT NULL DEFAULT 0,
  complaint_count    INTEGER NOT NULL DEFAULT 0,
  sample_size        INTEGER NOT NULL DEFAULT 0,
  reputation_score   INTEGER NOT NULL DEFAULT 0 CHECK (reputation_score BETWEEN 0 AND 100),
  trend              TEXT NOT NULL DEFAULT 'stable'
                     CHECK (trend IN ('improving','stable','watch','degrading')),
  computed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, channel, sender_id, window_24h_start)
);
ALTER TABLE deliverability_posture ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON deliverability_posture
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### Migration 114: `channel_templates`

```sql
CREATE TABLE channel_templates (
  template_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES markos_tenants(id),
  name               TEXT NOT NULL,
  channel            TEXT NOT NULL
                     CHECK (channel IN ('email','sms','whatsapp','push','in_app')),
  template_type      TEXT NOT NULL
                     CHECK (template_type IN ('marketing','transactional','lifecycle','support')),
  subject            TEXT,          -- nullable for non-email channels
  content_blocks     JSONB NOT NULL DEFAULT '[]',
  variables_schema   JSONB NOT NULL DEFAULT '{}',   -- JSON Schema
  evidence_bindings  JSONB NOT NULL DEFAULT '[]',   -- [{variable, claim_id, freshness_ttl}]
  pricing_bindings   JSONB NOT NULL DEFAULT '[]',   -- [{variable, pricing_context_id}]
  locale             TEXT NOT NULL DEFAULT 'en',
  parent_template_id UUID REFERENCES channel_templates(template_id),
  version            INTEGER NOT NULL DEFAULT 1,
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','approved','archived')),
  approved_by        UUID,
  approved_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name, locale, version)
);
ALTER TABLE channel_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON channel_templates
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### Migration 115: `email_campaigns` + `messaging_threads` + `lifecycle_journeys` + `lifecycle_journey_runs`

```sql
-- email_campaigns
CREATE TABLE email_campaigns (
  campaign_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  campaign_type        TEXT NOT NULL
                       CHECK (campaign_type IN ('transactional','lifecycle','broadcast','revenue')),
  objective            TEXT NOT NULL,
  audience_snapshot_id UUID NOT NULL,     -- FK → AudienceSnapshot (P221)
  template_id          UUID NOT NULL REFERENCES channel_templates(template_id),
  sender_identity_id   UUID NOT NULL REFERENCES sender_identities(sender_id),
  schedule_at          TIMESTAMPTZ,
  throttle_per_minute  INTEGER NOT NULL DEFAULT 100,
  time_zone_strategy   TEXT NOT NULL DEFAULT 'tenant_default'
                       CHECK (time_zone_strategy IN ('tenant_default','recipient_local','fixed_utc')),
  frequency_cap_override JSONB,
  approval_ref         UUID,              -- FK → approval_package (nullable)
  requires_approval    BOOLEAN NOT NULL DEFAULT false,
  status               TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','pending_approval','approved','scheduled',
                                         'dispatching','dispatched','paused','cancelled',
                                         'completed','failed')),
  dispatch_run_id      UUID,              -- FK → markos_agent_runs (P207) nullable bridge
  delivered_count      INTEGER NOT NULL DEFAULT 0,
  opened_count         INTEGER NOT NULL DEFAULT 0,
  clicked_count        INTEGER NOT NULL DEFAULT 0,
  replied_count        INTEGER NOT NULL DEFAULT 0,
  bounced_count        INTEGER NOT NULL DEFAULT 0,
  complained_count     INTEGER NOT NULL DEFAULT 0,
  unsubscribed_count   INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON email_campaigns
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- messaging_threads
CREATE TABLE messaging_threads (
  thread_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  profile_id           UUID NOT NULL,    -- FK → cdp_identity_profiles (P221)
  account_id           UUID,
  channel              TEXT NOT NULL
                       CHECK (channel IN ('whatsapp','sms','push','in_app')),
  current_status       TEXT NOT NULL DEFAULT 'open'
                       CHECK (current_status IN ('open','waiting','escalated','resolved',
                                                  'blocked','reply_pending')),
  owner_user_id        UUID,
  last_message_at      TIMESTAMPTZ,
  last_direction       TEXT CHECK (last_direction IN ('inbound','outbound')),
  sentiment            TEXT CHECK (sentiment IN ('positive','neutral','negative')),
  related_crm_id       UUID,             -- FK → customer_360_records (P222)
  related_opportunity_id UUID,
  related_support_case_id UUID,
  related_nba_id       UUID,             -- FK → nba_records (P222)
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE messaging_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON messaging_threads
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- lifecycle_journeys
CREATE TABLE lifecycle_journeys (
  journey_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  name                 TEXT NOT NULL,
  trigger_event_envelope JSONB NOT NULL,  -- {event_name, event_domain, filter_conditions}
  target_audience_id   UUID,              -- nullable = any profile matching trigger
  step_definitions     JSONB NOT NULL DEFAULT '[]',
  -- [{step_order, channel, template_id, delay_seconds, branch_logic}]
  status               TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','active','paused','archived')),
  paused_at            TIMESTAMPTZ,
  version              INTEGER NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE lifecycle_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON lifecycle_journeys
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- lifecycle_journey_runs
CREATE TABLE lifecycle_journey_runs (
  run_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES markos_tenants(id),
  journey_id           UUID NOT NULL REFERENCES lifecycle_journeys(journey_id),
  profile_id           UUID NOT NULL,    -- FK → cdp_identity_profiles (P221)
  current_step         INTEGER NOT NULL DEFAULT 0,
  state                TEXT NOT NULL DEFAULT 'pending'
                       CHECK (state IN ('pending','in_progress','paused','completed',
                                         'cancelled','failed')),
  due_at               TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (journey_id, profile_id)  -- one active run per profile per journey
);
ALTER TABLE lifecycle_journey_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON lifecycle_journey_runs
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### Migration 116: `channel_suppressions`

```sql
CREATE TABLE channel_suppressions (
  suppression_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES markos_tenants(id),
  profile_id       UUID NOT NULL,    -- FK → cdp_identity_profiles (P221)
  channel          TEXT NOT NULL
                   CHECK (channel IN ('email','sms','whatsapp','push','in_app')),
  reason           TEXT NOT NULL
                   CHECK (reason IN ('hard_bounce','complaint','manual_op',
                                      'dsr_deletion','jurisdiction','opt_out')),
  suppressed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_ref     TEXT,             -- provider_message_id or audit ref
  UNIQUE (tenant_id, profile_id, channel)  -- one suppression row per profile+channel
);
ALTER TABLE channel_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON channel_suppressions
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### Migration 117: `dispatch_events` + `dispatch_skips`

```sql
-- dispatch_events (deliverability rollup source)
CREATE TABLE dispatch_events (
  event_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES markos_tenants(id),
  dispatch_attempt_id UUID NOT NULL,   -- idempotency key per recipient per attempt
  campaign_id        UUID,             -- FK → email_campaigns (nullable if thread dispatch)
  thread_id          UUID,             -- FK → messaging_threads (nullable if campaign)
  journey_run_id     UUID,             -- FK → lifecycle_journey_runs (nullable)
  profile_id         UUID NOT NULL,
  channel            TEXT NOT NULL,
  event_type         TEXT NOT NULL,
  -- {queued, delivered, opened, clicked, replied, bounced_soft, bounced_hard,
  --  complained, unsubscribed, failed}
  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_message_id TEXT,
  UNIQUE (dispatch_attempt_id, event_type)  -- dedup provider webhook re-delivery
);
ALTER TABLE dispatch_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON dispatch_events
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
-- Frequency cap index
CREATE INDEX dispatch_events_freq_cap_idx
  ON dispatch_events (tenant_id, profile_id, channel, occurred_at)
  WHERE event_type IN ('delivered','queued');

-- dispatch_skips (audit of gate failures)
CREATE TABLE dispatch_skips (
  skip_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES markos_tenants(id),
  campaign_id     UUID,
  journey_run_id  UUID,
  profile_id      UUID NOT NULL,
  gate_failed     TEXT NOT NULL
                  CHECK (gate_failed IN ('consent','suppression','frequency_cap',
                                          'quiet_hours','jurisdiction','missing_variable',
                                          'pricing_unresolved','approval_revoked')),
  evidence_ref    TEXT,
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dispatch_skips ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON dispatch_skips
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### Migration 118: `in_app_messages`

```sql
CREATE TABLE in_app_messages (
  message_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES markos_tenants(id),
  profile_id     UUID NOT NULL,
  thread_id      UUID REFERENCES messaging_threads(thread_id),
  content        JSONB NOT NULL,   -- {title, body, cta_url, cta_label, image_url}
  read_at        TIMESTAMPTZ,      -- null = unread
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE in_app_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON in_app_messages
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### Migration 119: `outboundConsentRecords` → derived view swap

```sql
-- 1. Rename legacy table (keep data for 3-month deprecation window)
ALTER TABLE outbound_consent_records RENAME TO outbound_consent_records_legacy;

-- 2. Create derived view backed by cdp_consent_states
CREATE VIEW outbound_consent_records AS
  SELECT
    profile_id                          AS contact_id,
    tenant_id,
    channel,
    CASE
      WHEN email_marketing = 'opted_in'  THEN 'subscribed'
      WHEN email_marketing = 'opted_out' THEN 'opted_out'
      ELSE 'pending'
    END                                 AS status,
    legal_basis                         AS lawful_basis,
    created_at                          AS verified_at,
    updated_at
  FROM cdp_consent_states
  WHERE channel IN ('email','sms','whatsapp');

-- 3. Block direct writes to legacy table via trigger
CREATE FUNCTION block_direct_consent_writes()
  RETURNS trigger AS $$
  BEGIN
    RAISE EXCEPTION 'Direct writes to outbound_consent_records are blocked. Use setConsentState (P221).';
  END;
  $$ LANGUAGE plpgsql;

CREATE TRIGGER block_outbound_consent_insert
  BEFORE INSERT OR UPDATE ON outbound_consent_records_legacy
  FOR EACH ROW EXECUTE FUNCTION block_direct_consent_writes();
```

---

## Architecture Patterns

### Recommended Module Structure

```text
lib/markos/channels/
├── programs/
│   ├── email-campaign.ts         # EmailCampaign CRUD + status machine + approval trigger eval
│   ├── lifecycle-journey.ts      # LifecycleJourney CRUD + step definitions validator
│   └── journey-run.ts            # LifecycleJourneyRun CRUD + step advance
├── senders/
│   ├── sender-identity.ts        # SenderIdentity CRUD + verification status handler
│   └── reputation.ts             # Reputation status derivation from posture
├── deliverability/
│   ├── posture.ts                 # DeliverabilityPosture read + aggregate + cron rollup
│   └── spike-alert.ts            # Bounce/complaint spike detector (>2σ baseline)
├── templates/
│   ├── channel-template.ts       # ChannelTemplate CRUD + locale chain resolver
│   ├── renderer.ts               # Handlebars rendering + variable resolution
│   ├── variable-resolver.ts      # CDP TraitSnapshot + Customer360 + Opportunity + overrides
│   └── content-classifier.ts     # Pricing placeholder enforcement + claim check + competitor flag
├── gate/
│   ├── eligibility-gate.ts       # Per-recipient 5-layer gate function
│   ├── consent-check.ts          # Layer 1: getConsentState via P221 adapter
│   ├── suppression-check.ts      # Layer 2: channel_suppressions lookup
│   ├── frequency-cap.ts          # Layer 3: dispatch_events rolling window count
│   ├── quiet-hours.ts            # Layer 4: TraitSnapshot time_zone + quiet_hours window
│   └── jurisdiction-check.ts     # Layer 5: tenant config jurisdiction matrix
├── dispatch/
│   ├── dispatch-coordinator.ts   # AgentRun wrapper (or audit_log bridge if P207 absent)
│   ├── fan-out.ts                 # Vercel Queues per-recipient enqueue or pg_boss fallback
│   ├── recipient-handler.ts      # Per-recipient: double-gate → adapter.send → dispatch_events row
│   └── idempotency.ts            # dispatch_attempt_id generation + dedup check
├── suppression/
│   ├── suppression.ts            # channel_suppressions CRUD
│   └── bounce-handler.ts         # Bounce → suppression + cdp_events emit
├── events/
│   └── emit.ts                   # Single fan-out emit() (D-29): cdp + crm + aggregate + dispatch
├── adapters/
│   └── legacy-outbound.ts        # Bridge: api/crm/outbound/* → /v1/channels/* adapter
├── api/
│   └── handlers.ts               # /v1/channels/* route implementations
└── mcp/
    └── tools.ts                  # 5 MCP tool implementations

lib/markos/outbound/providers/
├── base-adapter.ts               # EXTENDED: 5 channels + verifyWebhookSignature + getRateLimitState
├── resend-adapter.ts             # EXTENDED: add inbound parse + verifyWebhookSignature
├── twilio-adapter.ts             # EXTENDED: add verifyWebhookSignature
├── knock-adapter.ts              # NEW: Knock push adapter (FCM + APNS via Knock)
└── in-app-adapter.ts             # NEW: internal in_app adapter (writes in_app_messages)

api/webhooks/
├── resend-events.js              # EXTENDED: call fan-out emit()
├── twilio-events.js              # EXTENDED: call fan-out emit()
└── knock-events.js               # NEW: Knock push event webhook

api/v1/channels/
├── email/programs.js
├── email/senders.js
├── email/deliverability.js
├── messaging/threads.js
├── messaging/sends.js
├── lifecycle/journeys.js
├── templates/index.js
├── approvals/index.js
└── suppressions/index.js

components/markos/crm/outbound/
├── outbound-workspace.tsx        # EVOLVED: consumes legacy-outbound adapter
├── ChannelProgramsList.tsx       # NEW: kanban-by-status campaigns + lifecycle journeys
├── MessagingThreadsList.tsx      # NEW: thread queue by owner, reply_pending priority
├── DeliverabilityWorkspace.tsx   # NEW: sender reputation + 24h posture + suppression count
├── TemplateEditor.tsx            # NEW: per-channel preview + variables + evidence + pricing bindings
└── ApprovalReviewPanel.tsx       # NEW: P208 inbox entries for channel approvals

supabase/migrations/
├── 113_channel_sender_identity.sql
├── 114_channel_templates.sql
├── 115_channel_programs.sql
├── 116_channel_suppressions.sql
├── 117_channel_dispatch_tracking.sql
├── 118_channel_in_app_messages.sql
├── 119_consent_cutover_view_swap.sql
└── 120_channel_indexes_rls_hardening.sql

contracts/
├── F-122-channel-email-campaign-v1.yaml
├── F-123-channel-messaging-thread-v1.yaml
├── F-124-channel-lifecycle-journey-v1.yaml
├── F-125-channel-sender-identity-v1.yaml
├── F-126-channel-deliverability-posture-v1.yaml
├── F-127-channel-template-v1.yaml
├── F-128-channel-suppression-v1.yaml
├── F-129-channel-dispatch-event-v1.yaml
├── F-130-channel-program-dispatch-write.yaml
└── F-131-channel-approval-flow.yaml

test/vitest/channels/
├── fixtures/
│   ├── channel_templates.ts
│   ├── sender_identities.ts
│   ├── email_campaigns.ts
│   ├── messaging_threads.ts
│   ├── dispatch_events.ts
│   ├── dispatch_skips.ts
│   ├── channel_suppressions.ts
│   ├── lifecycle_journeys.ts
│   └── in_app_messages.ts
├── gate/
│   ├── consent-check.test.ts
│   ├── suppression-check.test.ts
│   ├── frequency-cap.test.ts
│   ├── quiet-hours.test.ts
│   └── jurisdiction-check.test.ts
├── dispatch/
│   ├── dispatch-coordinator.test.ts
│   ├── recipient-handler.test.ts
│   └── idempotency.test.ts
├── templates/
│   ├── renderer.test.ts
│   ├── variable-resolver.test.ts
│   └── content-classifier.test.ts
├── providers/
│   ├── base-adapter.test.ts
│   ├── resend-adapter.test.ts
│   ├── twilio-adapter.test.ts
│   ├── knock-adapter.test.ts
│   └── in-app-adapter.test.ts
├── events/
│   └── emit.test.ts
└── consent/
    └── eligibility-cutover.test.ts
```

### Pattern 1: Per-Recipient Double-Gate

**What:** A synchronous 5-layer gate executed per recipient before adapter.send() is called.

**When to use:** Executed by `recipient-handler.ts` inside the Vercel Queues per-recipient job. Never batched; always per-profile.

```typescript
// lib/markos/channels/gate/eligibility-gate.ts
export async function evaluateDispatchEligibility(
  ctx: DispatchContext
): Promise<EligibilityResult> {
  // Layer 1: ConsentState via P221 adapter
  const consent = await getConsentState(ctx.tenantId, ctx.profileId, ctx.channel);
  if (!isConsentAllowed(consent, ctx.legalBasisPolicy)) {
    return buildSkipResult('consent', consent.consentId);
  }
  // Layer 2: Suppression list
  const suppression = await getSuppression(ctx.tenantId, ctx.profileId, ctx.channel);
  if (suppression) {
    return buildSkipResult('suppression', suppression.suppressionId);
  }
  // Layer 3: Frequency cap (rolling window over dispatch_events)
  const freqResult = await checkFrequencyCap(ctx.tenantId, ctx.profileId, ctx.channel, ctx.campaignType);
  if (!freqResult.allowed) {
    return buildSkipResult('frequency_cap', freqResult.windowRef);
  }
  // Layer 4: Quiet hours
  const quietResult = await checkQuietHours(ctx.tenantId, ctx.profileId);
  if (quietResult.inQuietHours) {
    return buildDeferResult(quietResult.nextSendWindow);
  }
  // Layer 5: Jurisdiction
  const jxResult = await checkJurisdiction(ctx.tenantId, ctx.profileId, ctx.channel, consent.legalBasis);
  if (!jxResult.allowed) {
    return buildSkipResult('jurisdiction', jxResult.reason);
  }
  return buildAllowedResult();
}
```

### Pattern 2: Single Fan-Out Emit

**What:** A transactional function called by every webhook normalizer. Writes to cdp_events, crm_activity, aggregate counters, dispatch_events, and optionally calls setConsentState — in one transaction.

**When to use:** Called at the tail of every provider webhook handler.

```typescript
// lib/markos/channels/events/emit.ts
export async function emitChannelEvent(ctx: ChannelEventContext): Promise<void> {
  await db.transaction(async (trx) => {
    // 1. cdp_events row
    await insertCdpEvent(trx, buildCdpEventEnvelope(ctx));
    // 2. crm_activity row with commercial_signal mapping
    await insertCrmActivity(trx, buildCrmActivityRow(ctx));
    // 3. aggregate state update on campaign or thread
    await updateAggregateCounter(trx, ctx);
    // 4. dispatch_events row
    await insertDispatchEvent(trx, ctx);
    // 5. Consent-affecting events → setConsentState (P221 single-writer)
    if (isConsentAffecting(ctx.eventType)) {
      await setConsentState(ctx.tenantId, ctx.profileId, ctx.channel, buildConsentUpdate(ctx));
    }
  });
  // Fail-closed: any exception propagates; no partial state
}
```

### Pattern 3: AgentRun Bridge (D-15)

**What:** Conditional AgentRun wrapper — writes to `markos_agent_runs` if P207 table exists; falls back to `markos_audit_log` if not.

**When to use:** Called at the start of every campaign/journey dispatch to create a durable run context.

```typescript
// lib/markos/channels/dispatch/dispatch-coordinator.ts
export async function createDispatchRun(
  tenantId: string,
  subjectType: string,
  subjectId: string,
): Promise<DispatchRun> {
  const agentRunAvailable = config.get('workflow.agentrun_v2_available');
  if (agentRunAvailable) {
    return createAgentRun({ tenantId, runType: 'channel_dispatch', subjectType, subjectId });
  }
  // Bridge: write audit entry and return stub run context
  await appendAuditLog({ tenantId, eventType: 'channel_dispatch_start', subjectType, subjectId });
  return buildStubDispatchRun(subjectId);
}
```

### Anti-Patterns to Avoid

- **Consent store bypass:** Never read `outboundConsentRecords` directly after migration 119. Always call `getConsentState` from P221 adapter.
- **Batch gate evaluation:** Never evaluate the double-gate for a batch of recipients simultaneously. Gate is always per-profile, serialized at the queue handler level.
- **Provider-specific dispatch logic:** No channel-specific business logic in `recipient-handler.ts`. All channel-specific behavior lives in the adapter (base-adapter.ts contract).
- **Pricing variable hardcoding:** Template content must never contain literal pricing values. All pricing references must go through `pricing_bindings` → content classifier before dispatch.
- **Silent skip:** Every skipped recipient MUST write a `dispatch_skips` row. Skips that do not write audit rows violate D-20.

---

## Integration Contracts

### P221 Adapter Reads

| Function | Purpose | Called By |
|----------|---------|-----------|
| `getConsentState(tenantId, profileId, channel)` | D-11 consent gate | eligibility-gate.ts Layer 1 |
| `getAudienceSnapshot(tenantId, snapshotId)` | Campaign recipient iteration | dispatch-coordinator.ts fan-out seed |
| `getTraitSnapshot(tenantId, profileId)` | Variable resolution (time_zone, locale, name) | variable-resolver.ts |
| `setConsentState(tenantId, profileId, channel, update)` | D-12 single-writer | emit.ts on consent-affecting events |

### P222 Adapter Reads

| Function | Purpose | Called By |
|----------|---------|-----------|
| `getCustomer360ByProfileId(tenantId, profileId)` | Variable resolution + thread crm link | variable-resolver.ts + reply flow |
| `getOpportunityById(tenantId, opportunityId)` | Revenue email variable resolution | variable-resolver.ts |
| `getNbaRecord(tenantId, nbaId)` | Thread related_nba_id read | messaging-threads.ts |
| `emitCrmEventEnvelope(ctx)` | CRM activity row + cdp_events row | emit.ts (crm_activity step) |

### Approval Package (P105 Reuse)

```typescript
// Called by email-campaign.ts + lifecycle-journey.ts + channel-template.ts
createApprovalPackage({
  tenantId,
  subjectType: 'email_campaign' | 'lifecycle_journey' | 'channel_template',
  subjectId,
  triggerReason: 'class_broadcast' | 'count_threshold' | 'content_classifier' | 'manual' | 'reengagement',
  evidenceRefs: [],
  pricingRefs: [],
  contentClassifierFindings: [],
});
```

### Vercel Queues Fan-Out

```typescript
// lib/markos/channels/dispatch/fan-out.ts
export async function enqueueRecipients(
  campaignId: string,
  recipients: AudienceSnapshotMember[],
  dispatchAttemptIdSeed: string,
): Promise<void> {
  for (const recipient of recipients) {
    const dispatchAttemptId = deriveDispatchAttemptId(dispatchAttemptIdSeed, recipient.profileId);
    await vercelQueue.send({
      type: 'channel_dispatch',
      campaignId,
      profileId: recipient.profileId,
      dispatchAttemptId,  // idempotency key
    });
  }
}
// Handler: idempotent on dispatch_attempt_id — skip if dispatch_events row already exists
```

### Fallback to pg_boss (if Vercel Queues unavailable)

```typescript
// Conditional import based on config.workflow.vercel_queues_available
// pg_boss runs against Supabase Postgres (same connection pool)
// Boss instance created with pgboss.new(connectionString)
// Job handler: identical to Vercel Queues handler
// Idempotency: same dispatch_attempt_id unique constraint on dispatch_events
```

---

## Push Provider Recommendation: Knock

**Decision: Knock (D-09) — CONFIRMED** [CITED: vercel.com/marketplace/knock + docs.knock.app/integrations/push]

### Rationale

- Knock is an official Vercel Marketplace partner with documented integration. Vercel uses Knock in production for its own notification system.
- FCM + APNS are abstracted: Knock's push channel group handles both iOS (APNs) and Android (FCM) from a single API call, eliminating dual-provider registration complexity.
- Free tier: up to 10,000 messages/month at $0 — suitable for v1 capacity.
- Webhook signatures: Knock supports signed webhooks for delivery status callbacks.
- Environment variable auto-injection: connecting Knock to a Vercel project automatically sets `KNOCK_API_KEY` and `KNOCK_PUBLIC_API_KEY`.
- ConsentState gate: `push_enabled` field on P221 ConsentState gates dispatch before Knock API call; no Knock-level subscription management needed.

### Adapter Contract

```typescript
// lib/markos/outbound/providers/knock-adapter.ts
export function createKnockAdapter(options = {}) {
  return {
    provider: 'knock',
    channels: ['push'],
    async send(message) {
      // Validate ConsentState push_enabled before calling (D-09 + D-19 Layer 1)
      // Call Knock Notify API with workflow_key = push_dispatch
      // Return { provider: 'knock', channel: 'push', provider_message_id, status }
    },
    normalizeEvent(payload) {
      // Normalize Knock push delivery webhook → standard event shape
      // Map Knock event types to: delivered, opened, bounced, failed
    },
    verifyWebhookSignature(payload, signature, secret) {
      // Knock HMAC SHA-256 signature verification (D-38)
    },
    getRateLimitState() {
      // Return current daily push limit from Knock account
    },
  };
}
```

### OneSignal Alternative (NOT CHOSEN)

OneSignal is more feature-rich for v1 but is NOT on the Vercel Marketplace as a direct partner. Knock's Vercel integration, simpler developer experience, and free tier make it the correct choice for v1. OneSignal can be added as an alternative adapter in a future phase.

---

## Frequency Cap Implementation

**Recommendation: Rolling window via `dispatch_events` table** (Claude's Discretion)

### Rationale

- `dispatch_events` table is already created in migration 117 with a composite index on `(tenant_id, profile_id, channel, occurred_at)` optimized for rolling-window count queries.
- Default cap: ≤2 marketing sends per channel per recipient per 7 days (transactional unlimited). Configurable per-tenant and per-campaign.
- Scale: at 100k recipients/day, a 7-day window holds ~700k rows per tenant per channel. With the index, a per-recipient count query is a single indexed range scan (~1ms).
- No Redis dependency: no additional infrastructure cost or operational complexity.
- Idempotency: retry-safe because `dispatch_attempt_id` deduplication prevents double-counting.

### Implementation

```typescript
// lib/markos/channels/gate/frequency-cap.ts
export async function checkFrequencyCap(
  tenantId: string,
  profileId: string,
  channel: string,
  campaignType: string,
): Promise<FreqCapResult> {
  if (campaignType === 'transactional') {
    return { allowed: true };  // transactional is uncapped
  }
  const policy = await getTenantFreqCapPolicy(tenantId, channel);
  const windowStart = subDays(new Date(), policy.windowDays);
  const count = await db.count(
    'dispatch_events',
    { tenantId, profileId, channel,
      eventType: ['delivered', 'queued'],
      occurredAt: { gte: windowStart } }
  );
  return {
    allowed: count < policy.maxSends,
    windowRef: `${channel}:${profileId}:${windowStart.toISOString()}`,
  };
}
```

### Redis Alternative (NOT CHOSEN for v1)

A Redis sliding window counter would offer lower latency (~0.1ms vs ~1ms) but requires an additional Redis instance, operational overhead, and adds complexity to the idempotency story. At v1 scale (100k recipients/day), the Postgres rolling window is sufficient. Redis becomes relevant at >5M recipients/day; that threshold belongs to a future phase.

---

## Vercel Queues Availability + Fallback

### Status

Vercel Queues is in public beta as of 2025/2026, available for all teams (Hobby + Pro tiers). [CITED: vercel.com/changelog/vercel-queues-now-in-public-beta] Billing is per API operation; includes credits per plan. The system is built on Vercel Fluid compute.

### P223 Usage

- Fan-out mode: per-recipient job enqueue (one message per AudienceSnapshot member).
- Idempotency key: `dispatch_attempt_id` passed as Vercel Queues idempotency key.
- max_concurrency: derived from `sender_identity.daily_send_limit / 24` (stay within hourly send budget).

### Fallback: pg_boss on Supabase Postgres

If `config.workflow.vercel_queues_available === false`:

- **pg_boss** (`npm install pg-boss`) runs on the existing Supabase Postgres connection.
- Job table: `pgboss.job` (created by pg_boss install).
- Handler: identical worker function — `dispatch_attempt_id` deduplication via the `dispatch_events` unique constraint is the same.
- Limitation: requires a persistent Node process or cron invocation; Vercel serverless does not run pg_boss continuously. Use Vercel Cron + `pg-boss.fetch(1)` polling pattern for v1 fallback.
- Flag: `workflow.vercel_queues_available` in `.planning/config.json` (same pattern as `workflow.agentrun_v2_available`).

---

## Lifecycle Journey Trigger Strategy

**Recommendation: Scheduled poll (every 60s) for v1** (Claude's Discretion)

### Rationale

| Dimension | Scheduled Poll (recommended v1) | Event-Driven (Supabase Realtime) |
|-----------|--------------------------------|----------------------------------|
| Latency | ~60s trigger delay | <1s trigger |
| Complexity | Low — Vercel Cron + SQL query | Medium — Realtime subscription + concurrency handling |
| Fan-out safety | Simple — one cron worker polls pending journey_runs | Requires dedup to prevent double-processing |
| Failure recovery | Natural — next cron cycle picks up missed runs | Requires DLQ for missed realtime events |
| Infrastructure | Zero additional | Supabase Realtime channel overhead |

### v1 Poll Pattern

```typescript
// Vercel Cron: every 60 seconds
// api/cron/lifecycle-journey-poll.ts
export async function pollDueJourneyRuns(tenantId: string) {
  const dueRuns = await db.query(
    'SELECT * FROM lifecycle_journey_runs WHERE state = $1 AND due_at <= $2 AND tenant_id = $3',
    ['pending', new Date(), tenantId]
  );
  for (const run of dueRuns) {
    await advanceJourneyRun(run); // runs double-gate → send → update step
  }
}
```

### v2 Event-Driven Upgrade (P225 or later)

Subscribe to Supabase Realtime on `cdp_events` for `event_name = trigger_event_envelope.event_name`. Insert matching `lifecycle_journey_runs` row with `state='pending', due_at=now()` and let the 60s poll handle dispatch. This hybrid approach avoids replacing the cron while adding near-real-time triggering.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FCM/APNS push delivery | Custom push layer | Knock SDK | Token management, certificate rotation, platform API versioning, delivery receipts — solved by Knock [CITED: docs.knock.app] |
| Template engine | Custom string interpolation | Handlebars | Sandboxed, battle-tested, partials, helpers, HTML escaping, XSS protection |
| Queue fan-out | Custom loop dispatcher | Vercel Queues (or pg_boss) | At-least-once delivery, retry, concurrency control, observability |
| Consent evaluation | Channel-local consent flags | P221 getConsentState adapter | Single SOR; avoid drift; P221 D-12 mandate |
| Webhook deduplication | Custom per-provider dedup table | `provider_message_id` UNIQUE on dispatch_events | Already part of schema; no custom table needed |
| Approval flow | New approval UI | P208 Approval Inbox + P105 createApprovalPackage | Already exists; extend with channel entry types |
| Frequency cap | Redis sliding window | dispatch_events rolling window query | Zero added infrastructure at v1 scale |

---

## Common Pitfalls

### Pitfall 1: Dispatch Retry Storm (CRITICAL)

**What goes wrong:** Vercel Queues at-least-once delivery retries the same recipient handler 3+ times. Without `dispatch_attempt_id` deduplication, the recipient receives multiple messages.

**Why it happens:** Network timeout between queue dispatch and `dispatch_events` row write causes the queue to assume failure and re-enqueue.

**How to avoid:** Check for existing `dispatch_events` row with matching `dispatch_attempt_id` at the START of the handler before any external API call. Return success (idempotent) if row exists.

**Warning signs:** `dispatch_events` row count > `audience_snapshot.membership_count`; duplicate `provider_message_id` values.

### Pitfall 2: ConsentState / Legacy View Drift

**What goes wrong:** During the 3-month deprecation window, code that still queries `outbound_consent_records_legacy` sees stale data while `cdp_consent_states` has been updated.

**Why it happens:** The trigger blocks writes but legacy readers are not yet migrated to `getConsentState`.

**How to avoid:** Migration 119 creates the trigger immediately. The P221 drift audit cron (D-26) detects divergence and emits an operator task. All P223 code MUST call `getConsentState` from day one — no `outbound_consent_records` reads.

**Warning signs:** P221 drift audit cron firing > 0 divergence events per day during migration window.

### Pitfall 3: Webhook Delivery Duplication

**What goes wrong:** Provider sends the same webhook event (e.g., `email.delivered`) twice. Two `crm_activity` rows, two `cdp_events` rows, double-incremented campaign counters.

**Why it happens:** Provider retry on timeout; webhook handler is not idempotent.

**How to avoid:** `dispatch_events` UNIQUE constraint on `(dispatch_attempt_id, event_type)` rejects the second insert. The webhook handler must catch the unique constraint violation and return 200 (not 500) to prevent infinite provider retry.

**Warning signs:** Campaign `delivered_count` > `audience_snapshot.membership_count`.

### Pitfall 4: Sender Warmup + Broadcast Class Collision

**What goes wrong:** A new sender in `reputation_status='warming'` dispatches a `broadcast` class campaign and triggers deliverability damage before DMARC is configured.

**Why it happens:** `class_permissions` on `sender_identities` not checked at campaign creation time — only checked at dispatch time.

**How to avoid:** Check `sender_identity.class_permissions.includes(campaign.campaign_type)` at campaign CREATE time (before approval) AND at dispatch time. Surface warning in TemplateEditor + ChannelProgramsList when sender warming status is not `healthy`.

**Warning signs:** Campaign stuck in `dispatching` status with `dispatch_skips` showing `gate_failed='suppression'` for >10% of recipients.

### Pitfall 5: Template Variable Resolution Failure Mid-Batch

**What goes wrong:** One recipient is missing a required variable (e.g., `{{company_name}}` not in CDP TraitSnapshot). Without handling, the entire batch may abort or the recipient receives a garbled message.

**Why it happens:** Variable resolver throws on missing required variable; error propagates to fan-out coordinator without per-recipient isolation.

**How to avoid:** Missing variable → fail-closed PER RECIPIENT only: write `dispatch_skips` row with `gate_failed='missing_variable'`, continue to next recipient. Never abort the entire batch. Log the specific variable name in `evidence_ref` for operator review.

**Warning signs:** `dispatch_skips.gate_failed = 'missing_variable'` > 5% of audience → indicates CDP TraitSnapshot gap, not individual anomaly.

### Pitfall 6: Pricing Copy Bypass

**What goes wrong:** Operator hardcodes pricing in template body text (e.g., "Get started for $49/month") bypassing the `pricing_bindings` variable check. Content classifier misses it because it only checks bound variables.

**Why it happens:** Content classifier only validates bound variable values; does not scan raw template body text for price-shaped strings.

**How to avoid:** Content classifier MUST also scan `content_blocks[].content` body text for price-pattern regex (`/\$\d+|pricing|per month|per year|plan|tier/i`) and flag matches for approval. This is in addition to `pricing_bindings` validation.

**Warning signs:** Template approved without pricing_bindings but body contains price strings.

### Pitfall 7: Reply Detection False Positive on Auto-Replies

**What goes wrong:** Vacation responders and auto-reply emails trigger the full reply-intelligence pipeline: CRM task created, thread status set to `reply_pending`, owner notified — for a non-human response.

**Why it happens:** Resend inbound webhook fires for all `email.received` events regardless of sender.

**How to avoid:** Apply heuristics in the inbound handler BEFORE the reply flow: check `In-Reply-To` header presence, check `Auto-Submitted` header (RFC 3834), require minimum body length >20 chars, check for common auto-reply subject patterns. Only proceed to full reply flow if passes all checks.

**Warning signs:** `messaging_threads.current_status = 'reply_pending'` for threads where the last `crm_activity.commercial_signal = null` and body contains "out of office".

### Pitfall 8: Knock Push Silent Failure

**What goes wrong:** FCM/APNS device token is expired or invalid. Knock returns 200 to the send API but the webhook reports `delivery_failed`. The push channel suppression is never added.

**Why it happens:** Push delivery failure via Knock webhook is not wired to the bounce → suppression handler (D-21).

**How to avoid:** `knock-events.js` webhook handler MUST map Knock `delivery_failed` events to the same bounce → suppression propagation path used for email/SMS bounces. Permanent push delivery failures (invalid token) → `channel_suppressions` with reason='hard_bounce'.

**Warning signs:** High push `dispatch_events.event_type = 'failed'` rate without corresponding `channel_suppressions` growth.

### Pitfall 9: Resend Inbound Body Not in Webhook Payload

**What goes wrong:** Resend inbound webhook `email.received` does NOT include email body, headers, or attachments in the POST payload — only metadata. Code expecting `payload.body` to contain the reply text finds it null.

**Why it happens:** Resend docs clarify that body/attachments must be fetched separately via the Received Emails API. [CITED: resend.com/docs/dashboard/receiving/introduction]

**How to avoid:** The inbound handler in `resend-events.js` MUST call the Resend Received Emails API (`GET /emails/received/{id}`) to fetch the actual body before opt-out detection and sentiment classification. Cache the result per event_id to avoid duplicate fetches on webhook retry.

**Warning signs:** Opt-out regex returning `false` for all inbound emails; reply sentiment always `null`.

---

## Slice Boundaries

### Recommended 6 Slices Across 5 Waves

```text
Wave 1
  223-01  Schema foundation + adapter contract extensions + consent cutover + legacy adapter

Wave 2
  223-02  ConsentState cutover + per-recipient double-gate + dispatch infra (depends 01)

Wave 3 (parallel)
  223-03  Templates + Handlebars rendering + content classifier + layered approval (depends 01)
  223-04  Provider adapters + Knock + webhook normalization + reply continuity + push (depends 01)

Wave 4
  223-05  API + MCP surface + UI evolution + Morning Brief / Approval Inbox wiring (depends 01-04)

Wave 5
  223-06  Closeout: RLS full suite + deliverability cron + spike alerts + Playwright journeys +
          Chromatic gates + SUMMARY/STATE/ROADMAP updates (depends 01-05)
```

### Slice 223-01: Schema Foundation

**Wave:** 1
**F-IDs:** F-122..F-126 (scaffolds for programs/sender/deliverability/templates/suppressions)
**Migrations:** 113, 114, 115, 116 (sender_identities, channel_templates, email_campaigns, messaging_threads, lifecycle_journeys, lifecycle_journey_runs, channel_suppressions)
**Decisions:** D-01..D-08 (schema shapes), D-36 (RLS on new tables)
**Key tasks:**
1. Write migrations 113-116
2. Extend `base-adapter.ts`: 3 → 5 channels, add `verifyWebhookSignature` + `getRateLimitState` to interface
3. Create `lib/markos/channels/adapters/legacy-outbound.ts` bridge (api/crm/outbound/* → /v1/channels/*)
4. Create empty module stubs for `lib/markos/channels/*` tree
5. Write F-122..F-126 contract YAML stubs

### Slice 223-02: ConsentState Cutover + Double-Gate + Dispatch Infra

**Wave:** 2 (depends 223-01)
**F-IDs:** F-128..F-130 (suppression, dispatch-event, dispatch-write)
**Migrations:** 117, 118, 119, 120 (dispatch_events, dispatch_skips, in_app_messages, consent view swap, indexes)
**Decisions:** D-11..D-21, D-14..D-15 (dispatch infra)
**Key tasks:**
1. Write migrations 117-120 (dispatch tracking + consent view swap)
2. Refactor `lib/markos/outbound/consent.ts::evaluateOutboundEligibility` to call `getConsentState` via P221 adapter
3. Create `lib/markos/channels/gate/eligibility-gate.ts` with 5-layer gate
4. Create `lib/markos/channels/dispatch/` (AgentRun bridge + Vercel Queues fan-out + dispatch_attempt_id)
5. Eligibility regression tests: all existing P104 consent tests must remain green

### Slice 223-03: Templates + Personalization + Approval Gating

**Wave:** 3 (parallel with 223-04; depends 223-01)
**F-IDs:** F-127 (channel-template-v1), F-131 (channel-approval-flow)
**Migrations:** none new (templates table in 223-01)
**Decisions:** D-25..D-28, D-16..D-18, D-32
**Key tasks:**
1. Create `lib/markos/channels/templates/renderer.ts` (Handlebars, conservative helper set: escaping + conditionals only, no partials v1)
2. Create `lib/markos/channels/templates/variable-resolver.ts` (CDP TraitSnapshot + Customer360 + Opportunity + overrides)
3. Create `lib/markos/channels/templates/content-classifier.ts` (pricing pattern scan + `{{MARKOS_PRICING_ENGINE_PENDING}}` enforcement + evidence_bindings TTL check + competitor mention flag)
4. Extend `createApprovalPackage` call sites for channel entry types + trigger reason mapping
5. Template preview endpoint + operator sample render

### Slice 223-04: Provider Adapters + Webhook Normalization + Reply Continuity + Push

**Wave:** 3 (parallel with 223-03; depends 223-01)
**F-IDs:** F-122 extensions, F-123 (messaging-thread)
**Migrations:** none new
**Decisions:** D-08..D-10, D-22..D-24, D-38, D-29
**Key tasks:**
1. Create `lib/markos/outbound/providers/knock-adapter.ts` (Knock push: FCM+APNS via Knock)
2. Create `lib/markos/outbound/providers/in-app-adapter.ts` (writes in_app_messages)
3. Extend `resend-adapter.ts`: add inbound parse handler (fetch body from Received Emails API), add `verifyWebhookSignature`
4. Extend `twilio-adapter.ts`: add `verifyWebhookSignature`
5. Create `api/webhooks/knock-events.js`
6. Extend `lib/markos/outbound/events.ts::normalizeOutboundEventForLedger` for email reply + Knock events
7. Create `lib/markos/channels/events/emit.ts` (single fan-out D-29)
8. Implement reply flow: lookup/create messaging_thread + crm_activity + cdp_events + CRM task + opt-out detection
9. Webhook signature verification tests per provider

### Slice 223-05: API + MCP Surface + UI Evolution

**Wave:** 4 (depends 223-01..223-04)
**F-IDs:** F-122..F-131 (complete all YAML specs)
**Migrations:** none new
**Decisions:** D-30..D-35
**Key tasks:**
1. Create `api/v1/channels/*` route handlers (11 route files per D-30)
2. Create `lib/markos/channels/mcp/tools.ts` (5 MCP tools per D-31)
3. Build `ChannelProgramsList.tsx` (kanban by status for campaigns + lifecycle journeys)
4. Build `MessagingThreadsList.tsx` (queue by owner, reply_pending priority)
5. Build `DeliverabilityWorkspace.tsx` (sender reputation + 24h posture panels)
6. Build `TemplateEditor.tsx` (channel preview + variable inspector + evidence + pricing binding panel)
7. Build `ApprovalReviewPanel.tsx` (P208 inbox entries for channel approvals)
8. Extend `TimelineDetailView.tsx` (P222 D-34): channel event chips (open/click/reply/bounce)
9. Wire Morning Brief (P208): top reply_pending threads by primary_owner + at_risk senders
10. Update `flow-registry.json` with F-122..F-131

### Slice 223-06: Closeout

**Wave:** 5 (depends 223-01..223-05)
**Decisions:** D-36..D-39, D-07 cron, D-35 spike alerts
**Key tasks:**
1. RLS stress tests for all 11 new tables (cross-tenant isolation)
2. Deliverability cron (hourly 24h rollup into deliverability_posture)
3. Lifecycle journey cron (60s poll due journey_runs)
4. Bounce/complaint spike alert (>2σ baseline emits operator task)
5. Full Playwright journeys: campaign create → approve → dispatch → reply → bounce
6. Chromatic stories: campaign builder, blocked send, deliverability warning, suppressed/recovered, template editor, approval review
7. SUMMARY.md + STATE.md + ROADMAP.md updates

### Dependency Graph

```text
223-01 (schema + adapters + consent view)
  └── 223-02 (dispatch infra + double-gate)       [depends 01]
  └── 223-03 (templates + approval)                [depends 01, parallel with 04]
  └── 223-04 (providers + webhooks + reply)         [depends 01, parallel with 03]
         └── 223-05 (API + MCP + UI)                [depends 01-04]
                └── 223-06 (closeout)               [depends 01-05]
```

---

## Tests Implied (Per Slice)

### 223-01: Schema Foundation

- Migration idempotency tests for 113-116 (re-runnable without error)
- Base-adapter.ts contract: 5 channels resolved correctly; invalid channel throws; new methods exist
- Legacy adapter bridge: api/crm/outbound/* paths return 200 via legacy-outbound.ts

### 223-02: ConsentState Cutover + Double-Gate

- **Consent cutover regression:** All existing P104 `evaluateOutboundEligibility` tests pass against new ConsentState backend (no behavior change for caller)
- **Layer 1 (consent):** opted_in → allow; opted_out → skip; unknown + legitimate_interest policy → allow; unknown + strict policy → skip
- **Layer 2 (suppression):** suppressed profile → skip with reason='suppression'; unsuppressed → pass
- **Layer 3 (frequency cap):** count < cap → allow; count == cap → skip; transactional → always allow
- **Layer 4 (quiet hours):** in quiet window → defer (re-enqueue with delay); outside → pass
- **Layer 5 (jurisdiction):** EU + email + marketing + legitimate_interest → skip; EU + email + transactional → allow; US + any → allow (per default config)
- **dispatch_attempt_id idempotency:** second handler invocation with same dispatch_attempt_id → no new dispatch_events row, returns success
- **Migration 119 (view swap):** direct INSERT to outbound_consent_records_legacy → trigger raises exception; SELECT on view returns correct ConsentState data

### 223-03: Templates + Approval

- **Handlebars rendering:** all variables resolved from TraitSnapshot/Customer360/Opportunity; missing required variable → dispatch_skip with reason='missing_variable'
- **Pricing binding enforcement:** template with pricing_binding pointing to pending value → content classifier flags; dispatch blocked until `{{MARKOS_PRICING_ENGINE_PENDING}}` used or approved value
- **Pricing text scan:** body containing literal "$49/month" without binding → content classifier detects and flags
- **Evidence binding TTL:** evidence_binding with freshness_ttl expired → content classifier flags; content_classifier_findings populated
- **Competitor mention detection:** body containing competitor name → flagged for review
- **Locale variant resolution:** recipient locale = 'fr-FR' → picks French child template; no child → falls back to parent
- **Approval trigger: class=broadcast** → approval required created
- **Approval trigger: count ≥500** → approval required created
- **Approval trigger: re-engagement >90d** → approval required created
- **Approval trigger: manual override** → approval required regardless of class/count
- **Approval revocation mid-dispatch** → AgentRun pause signal sent

### 223-04: Providers + Webhooks + Reply

- **Resend adapter inbound:** `email.received` webhook with metadata → calls Received Emails API → body fetched; opt-out regex applied
- **Resend webhook signature verification:** valid signature → passes; tampered payload → 401 + audit row
- **Twilio webhook signature verification:** valid Twilio X-Twilio-Signature → passes; missing → 401 + audit row
- **Knock adapter send:** valid push token → Knock API called; Knock push delivery webhook → normalizeEvent maps correctly
- **Knock webhook signature:** valid → passes; invalid → 401 + audit row
- **in_app adapter:** send() writes in_app_messages row; no external API called
- **Reply flow (full):** inbound email received → messaging_threads row created/updated → crm_activity row written → cdp_events row written → CRM task created → opt-out detected and setConsentState called if opt-out keyword found
- **Auto-reply filter:** vacation responder message → does NOT trigger reply flow (auto_submitted header or empty body)
- **emit() transaction:** any failure in steps 1-5 → full rollback, no partial state
- **Fan-out emit commercial_signal mapping:** open → interest; click → interest; reply (positive sentiment) → interest; bounce → risk; complaint → risk; unsubscribe → risk

### 223-05: API + MCP Surface + UI

- **API: POST /v1/channels/email/programs** with class=broadcast without approval_ref → 422 with reason='approval_required'
- **API: POST /v1/channels/email/programs** with class=transactional → 201 without approval gate
- **API: POST /v1/channels/email/sends/{id}** → triggers dispatch coordinator; returns run reference
- **API: GET /v1/channels/email/deliverability** → returns current posture per sender
- **API tenant isolation:** request with tenant_A token cannot read tenant_B campaigns
- **MCP send_email_program:** approved campaign → dispatches; unapproved → returns approval_required error
- **MCP get_thread:** returns thread with N messages; non-existent thread → not_found
- **MCP list_pending_approvals:** returns only channel approvals for requesting tenant
- **Approval Inbox integration:** channel approval entry appears in P208 inbox after create; approve → campaign status transitions to 'approved'

### 223-06: Closeout

- **RLS all 11 new tables:** cross-tenant SELECT returns empty; cross-tenant INSERT fails; correct tenant operations succeed
- **Deliverability cron:** hourly run creates new deliverability_posture window row; reputation_score correctly derived from bounce_rate/complaint_rate
- **Spike alert:** bounce_rate exceeds 2σ baseline → operator task created
- **Legacy regression:** all P100-P105 tests green; all P221 tests green; all P222 tests green
- **Playwright: campaign create → approve → dispatch → reply → bounce:**
  - Operator creates broadcast email campaign with valid template
  - Approval Inbox shows pending entry; approver approves
  - Campaign status transitions to 'approved' → 'dispatching' → 'dispatched'
  - Simulated inbound reply → thread shows 'reply_pending'; CRM task visible in execution queue
  - Simulated hard bounce → suppression list gains new entry; dispatch_events shows bounced; cdp_events shows suppression_added

---

## Validation Architecture (Nyquist Dimension 8 — MANDATORY)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (Phase 204+ doctrine per V4.0.0-TESTING-ENVIRONMENT-PLAN.md) |
| Config file | `vitest.config.ts` — Wave 0 gap if not yet created by P221/P222 |
| Quick run command | `vitest run test/vitest/channels/` |
| Full suite command | `vitest run && npm test` |
| Browser proof | `playwright test tests/playwright/channels/` |
| Visual regression | `chromatic` (Storybook .storybook/ exists) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EML-01 | Email campaign class permissions enforced | unit | `vitest run test/vitest/channels/gate/` | Wave 0 gap |
| EML-02 | Sender reputation gates warmup→broadcast | unit | `vitest run test/vitest/channels/providers/` | Wave 0 gap |
| EML-03 | Lifecycle journey runs advance on poll | unit | `vitest run test/vitest/channels/dispatch/` | Wave 0 gap |
| EML-04 | Inbound reply creates thread + task | unit+integration | `vitest run test/vitest/channels/events/` | Wave 0 gap |
| EML-05 | ConsentState cutover: no behavior regression | unit | `vitest run test/vitest/channels/consent/` | Wave 0 gap |
| MSG-01 | All 5 channels dispatch via correct adapter | unit | `vitest run test/vitest/channels/providers/` | Wave 0 gap |
| MSG-02 | Double-gate: all 5 layers tested independently | unit | `vitest run test/vitest/channels/gate/` | Wave 0 gap |
| MSG-03 | MessagingThread cross-channel related_crm_id | unit | `vitest run test/vitest/channels/events/` | Wave 0 gap |
| MSG-04 | Webhook normalization + fan-out emit() | unit | `vitest run test/vitest/channels/events/emit.test.ts` | Wave 0 gap |
| MSG-05 | Knock push adapter: FCM+APNS via Knock | unit | `vitest run test/vitest/channels/providers/knock-adapter.test.ts` | Wave 0 gap |
| CDP-01..05 | Carry-forward from P221 | carry | `npm test` (P221 tests) | Exists (P221) |
| CRM-01..05 | Carry-forward from P222 | carry | `npm test` (P222 tests) | Exists (P222) |
| QA-01 | F-122..F-131 YAML contracts valid | unit | `node bin/validate-flow-contracts.cjs` | Exists |
| QA-02 | RLS 11 new tables cross-tenant isolation | unit | `vitest run test/vitest/channels/ --grep rls` | Wave 0 gap |
| QA-03..15 | Quality baseline | all | `vitest run && playwright test && chromatic` | Partial |

### Coverage Targets

| Domain | Target | Justification |
|--------|--------|---------------|
| RLS policies (11 new tables) | 100% — all tables have cross-tenant SELECT + INSERT tests | Security-critical; fail-closed per D-36 |
| Double-gate branches | 100% — all 5 layers × allow/skip/defer paths | Legal/compliance-critical; no partial coverage |
| Content classifier variants | 100% — pricing text, pricing_binding, evidence TTL, competitor | Approval gate integrity; `{{MARKOS_PRICING_ENGINE_PENDING}}` rule |
| dispatch_attempt_id idempotency | 100% — first call + retry call paths | Duplicate send prevention |
| Consent cutover regression | 100% — all existing P104 test vectors | Backward compatibility mandate D-11 |
| Legacy regression (P100-P105, P221, P222) | 100% green | Non-regression on shared substrates |
| Webhook signature verification (3 providers) | 100% — valid + tampered + missing per provider | D-38 mandatory |
| Provider adapter contract | 100% — send + normalizeEvent + verifyWebhookSignature per adapter | D-08 contract compliance |

### Fixtures (Wave 0)

All fixtures live under `test/vitest/channels/fixtures/`:

```typescript
// channel_templates.ts — valid template, missing variable template, pricing-bound template, locale-variant pair
// sender_identities.ts — warming sender, healthy sender, at_risk sender, verified/pending/failed
// email_campaigns.ts — draft, broadcast pending_approval, transactional auto-approved, dispatching
// messaging_threads.ts — open, reply_pending, escalated, with related_crm_id
// dispatch_events.ts — delivered, opened, bounced_hard, complained; with dispatch_attempt_id
// dispatch_skips.ts — gate_failed for each of 5 layers + missing_variable + pricing_unresolved
// channel_suppressions.ts — hard_bounce, complaint, manual_op, dsr_deletion, jurisdiction
// lifecycle_journeys.ts — active with 3 steps, paused, draft
// in_app_messages.ts — unread, read, expired
```

### Wave 0 Gaps (Must be created before Wave 1 implementation begins)

- [ ] `vitest.config.ts` — if not created by P221/P222 (install: `npm install --save-dev vitest @vitest/coverage-v8`)
- [ ] `playwright.config.ts` — if not created by P221/P222 (install: `npm install --save-dev playwright @playwright/test`)
- [ ] `test/vitest/channels/` directory tree + fixture files
- [ ] `tests/playwright/channels/` directory for operator journey tests
- [ ] Storybook stories for: ChannelProgramsList, MessagingThreadsList, DeliverabilityWorkspace, TemplateEditor, ApprovalReviewPanel

### Per-Slice Validation

| Slice | Quick Run | Wave Merge | Notes |
|-------|-----------|------------|-------|
| 223-01 | `vitest run test/vitest/channels/ --grep schema` | Full suite | Migration idempotency tests |
| 223-02 | `vitest run test/vitest/channels/gate/ test/vitest/channels/consent/` | Full suite + legacy P104 regression | Consent cutover + 5-layer gate |
| 223-03 | `vitest run test/vitest/channels/templates/` | Full suite | Content classifier + pricing |
| 223-04 | `vitest run test/vitest/channels/providers/ test/vitest/channels/events/` | Full suite | Providers + webhook sig + emit() |
| 223-05 | `vitest run test/vitest/channels/` | Full suite + playwright | API + MCP + UI coverage |
| 223-06 | Full vitest + playwright + chromatic | Phase gate: full suite green | Before `/gsd-verify-work` |

**Phase gate:** Full suite green (`vitest run && playwright test && npm test`) before invoking `/gsd-verify-work`.

---

## Requirement Mapping

| Requirement | Slice | Key F-IDs | Key Migrations | Test File(s) |
|------------|-------|-----------|----------------|--------------|
| EML-01 (email program classes) | 223-01, 223-03 | F-122 | 115 | `gate/consent-check.test.ts`, `templates/content-classifier.test.ts` |
| EML-02 (sender identity + deliverability) | 223-01, 223-06 | F-125, F-126 | 113 | `providers/resend-adapter.test.ts`, `deliverability cron test` |
| EML-03 (lifecycle journeys) | 223-01, 223-02 | F-124 | 115 | `dispatch/dispatch-coordinator.test.ts` |
| EML-04 (reply intelligence) | 223-04 | F-123 | 115 | `events/emit.test.ts`, `providers/resend-adapter.test.ts` |
| EML-05 (ConsentState cutover) | 223-02 | — | 119 | `consent/eligibility-cutover.test.ts` |
| MSG-01 (5 channels) | 223-01, 223-04 | F-123 | 113 | `providers/base-adapter.test.ts`, `providers/knock-adapter.test.ts` |
| MSG-02 (double-gate) | 223-02 | F-130 | 117 | `gate/eligibility-gate.test.ts` (all 5 layers) |
| MSG-03 (thread continuity) | 223-04 | F-123 | 115 | `events/emit.test.ts` |
| MSG-04 (webhook normalization) | 223-04 | F-129 | 117 | `events/emit.test.ts`, `providers/*.test.ts` |
| MSG-05 (Knock push) | 223-04 | F-123 | 113 | `providers/knock-adapter.test.ts` |
| CDP-01..05 (carry-forward) | 223-02 (cutover) | — | 119 | P221 regression suite |
| CRM-01..05 (carry-forward) | 223-04, 223-05 | F-122, F-123 | — | P222 regression suite + `events/emit.test.ts` |
| QA-01 (contracts) | 223-05, 223-06 | F-122..F-131 | — | `validate-flow-contracts.cjs` |
| QA-02 (RLS + audit) | 223-06 | all | 120 | `vitest --grep rls` + audit_log emit tests |
| QA-03..15 (quality baseline) | 223-06 | all | all | Full Vitest + Playwright + Chromatic |

---

## Scope Guardrails

The following items are explicitly deferred and MUST NOT appear in any P223 plan task:

| Deferred Item | Phase | Reason |
|--------------|-------|--------|
| A/B testing on campaigns/journeys/threads | P225 | Experiment registry + analytics substrate |
| AI-generated email subject + body | P226 | Deal-execution copilot integration |
| Real-time SSE/websocket for in_app messages | P224 | Conversion surfaces / live forms |
| Inbound voice / IVR | Future | Out of v1 scope |
| iMessage Business / Apple Business Chat | Future | Out of v1 scope |
| Bring-your-own-provider (custom SMTP, MessageBird, Postmark) | Future | v1 = Resend/Twilio/Knock fixed |
| Multi-region send routing (EU residency) | P228 | Integration closure |
| Send-time optimization ML | P225 | Analytics + AgentRun routing |
| Sender warmup automation | Future ops | v1 surfaces status; operator drives manually |
| Email engagement scoring per recipient (full) | P225 | Partial flows via commercial_signal in D-29 |
| Conversion surfaces, landing pages, forms, launch orchestration | P224 | Downstream consumer of EmailCampaign + LifecycleJourney |
| Semantic attribution, journey analytics, narrative | P225 | Downstream consumer of dispatch_events + cdp_events |
| Sales enablement (battlecards, proposals) | P226 | Uses MCP send_messaging for outreach |
| Ecosystem/partner/affiliate workflows | P227 | |
| Commercial OS integration closure | P228 | |

**Planner note:** If a task description would implement any item in this table, raise it as a scope drift flag before proceeding.

---

## UI Compatibility Note

P223 evolves the CRM outbound workspace (`components/markos/crm/outbound/outbound-workspace.tsx`) via a legacy adapter — no rewrite of existing CRM shell (D-33). All new components (ChannelProgramsList, MessagingThreadsList, DeliverabilityWorkspace, TemplateEditor, ApprovalReviewPanel) are additive under `components/markos/crm/outbound/` and follow the same CSS module patterns established in P102/P103/P105.

No new `UI-SPEC.md` is required — this matches the P222 disposition. Component implementation details are Claude's Discretion; follow repo CSS module patterns from existing outbound workspace + P102/P103 workspace-shell for style consistency.

TimelineDetailView from P222 gains channel event chips (D-34): these are rendered within the existing timeline event row shell, not as new layout sections.

Morning Brief and Approval Inbox (P208) are extended with channel entry types — no new shell components; new entry type renderers only.

---

## Research Decisions

1. **Slice boundaries:** DISCUSS.md proposed 6 slices; CONTEXT.md proposes the same count but with different groupings. Resolved in favor of CONTEXT.md locked decisions, with slices aligned to dependency order: schema → consent/dispatch → templates/providers (parallel) → API/UI → closeout. This ensures Wave 1 schema work gates all subsequent waves cleanly.

2. **Handlebars helper set:** Conservative set for v1: `{{var}}` substitution + `{{#if}}` + `{{#each}}` + HTML escape (default). No custom helpers, no partials, no `{{> partial}}` — limits attack surface per D-08 content security posture.

3. **Frequency cap:** Rolling window via `dispatch_events` table. No Redis added. Rationale in dedicated section above.

4. **Lifecycle journey trigger:** Scheduled poll (60s) for v1. Event-driven upgrade path documented for P225. No Supabase Realtime dependency in v1.

5. **Vercel Queues fallback:** pg_boss on Supabase Postgres via `workflow.vercel_queues_available` config flag. Identical handler code; same idempotency contract.

6. **Resend inbound body fetch:** The webhook `email.received` does NOT include the email body. The handler MUST call the Received Emails API to fetch the body before opt-out detection. This is a non-obvious API behavior that must be explicit in the plan task.

7. **outboundConsentRecords → view swap:** Migration 119 uses a rename-then-CREATE-VIEW pattern rather than ALTER TABLE. This preserves the legacy data in the renamed table for the 3-month deprecation window and allows operators to query both `outbound_consent_records_legacy` (historical) and `outbound_consent_records` (current derived view) during the transition.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | P222 allocated F-113..F-121 (last F-ID = F-121) | F-ID Allocation | P223 would conflict with existing contracts; must re-verify at plan time |
| A2 | P222 last migration = 112 (`112_crm360_drift_reconciliation_audit.sql`) | F-ID Allocation | P223 migrations 113+ would conflict; must re-verify at plan time |
| A3 | `lib/markos/cdp/adapters/crm-projection.ts` exists (P221 delivered) | Integration Contracts | evaluateOutboundEligibility cutover (D-11) cannot proceed without it; P221 must ship first |
| A4 | `customer_360_records` table exists (P222 delivered) | Integration Contracts | D-23/D-24 thread → CRM link cannot be created; messaging_threads.related_crm_id FK would fail |
| A5 | P207 `markos_agent_runs` table may not exist at P223 plan time | Dispatch Infra | D-15 bridge stub is the mitigation; plan must include bridge path |
| A6 | Handlebars npm package v4.7.x is current and available | Standard Stack | Verify: `npm view handlebars version` before plan |
| A7 | `@knocklabs/node` SDK is current and compatible with Node.js version in use | Push Provider | Verify at plan time; Knock SDK API may have changed from training data |
| A8 | Vitest + Playwright are not yet installed (P221/P222 did not install them) | Validation Architecture | Wave 0 must install if not present; if already installed, skip installation step |
| A9 | Knock is available on Vercel Marketplace with free tier ≤10K messages/month | Push Provider | [VERIFIED: vercel.com/marketplace/knock + knock.app/pricing] — LOW RISK |
| A10 | Vercel Queues is in public beta, available for all teams (Hobby + Pro) | Vercel Queues | [VERIFIED: vercel.com/changelog/vercel-queues-now-in-public-beta] — LOW RISK; pricing per operation |
| A11 | Resend inbound parsing requires separate API call to fetch email body (not in webhook payload) | Resend Inbound | [VERIFIED: resend.com/docs/dashboard/receiving/introduction — "webhooks do not include the email body"] — CONFIRMED PITFALL |
| A12 | Existing P104 `evaluateOutboundEligibility` tests will pass against the new ConsentState backend after the cutover refactor | Consent Cutover | If test vectors assume `outboundConsentRecords` in-memory store, tests will need fixture migration; regression test file must be updated to inject ConsentState via P221 adapter mock |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase (Postgres) | All migrations | ✓ | Existing | — |
| Node.js | All lib/markos modules | ✓ | Existing | — |
| Resend API | Email send + inbound | ✓ | Existing adapter | Sandbox mode (no API key needed for tests) |
| Twilio API | SMS + WhatsApp send | ✓ | Existing adapter | Sandbox mode |
| Knock API | Push notifications | ✓ (Vercel Marketplace) [CITED] | @knocklabs/node SDK | None — install required |
| Vercel Queues | Fan-out dispatch | ✓ (public beta all teams) [CITED] | Public beta | pg_boss on Supabase Postgres |
| Handlebars | Template rendering | Unknown | ~4.7.x | None — install required |
| Vitest | Business logic tests | Unknown (may be installed by P221/P222) | ~2.x | node --test (existing, acceptable fallback) |
| Playwright | Browser journey tests | Unknown (may be installed by P221/P222) | ~1.x | Manual QA (unacceptable for phase gate) |

**Missing dependencies with no fallback:**
- Knock SDK (`@knocklabs/node`) — required for D-09; Wave 0 install task
- Handlebars — required for D-25 template rendering; Wave 0 install task

**Missing dependencies with fallback:**
- Vercel Queues — pg_boss fallback available per `workflow.vercel_queues_available` flag

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing `requireHostedSupabaseAuth` pattern; all `/v1/channels/*` routes require bearer token |
| V3 Session Management | yes | Existing session pattern inherited; no new session mechanism |
| V4 Access Control | yes | RLS on all 11 new tables (D-36); tenant_id column enforced via `current_setting('app.tenant_id')` |
| V5 Input Validation | yes | Zod schema validation on all API request bodies; variables_schema JSON Schema validation on template inputs |
| V6 Cryptography | yes | Webhook signature verification via HMAC SHA-256 per provider (D-38); `markos_operator_api_keys` encrypted at rest (P210) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Webhook replay attack (same Resend/Twilio/Knock event submitted twice) | Spoofing | `provider_message_id` UNIQUE constraint + `dispatch_attempt_id` dedup |
| Cross-tenant campaign read via guessed UUID | Information Disclosure | RLS on all tables; `tenant_id = current_setting('app.tenant_id')` |
| Pricing value injection via template variable | Tampering | Content classifier scans body text + pricing_bindings validation |
| Consent bypass (direct write to legacy consent table) | Elevation of Privilege | Trigger on `outbound_consent_records_legacy` blocks all direct writes (D-12, migration 119) |
| Provider secret exposure in MCP payload | Information Disclosure | D-39: no raw secrets in MCP tool responses; adapter returns only normalized status + provider_message_id |
| Suppression list bypass (sending to suppressed profile) | Tampering | Layer 2 of double-gate queries channel_suppressions before every send; no cache that could be stale |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: codebase read] `lib/markos/outbound/consent.ts` — current outboundConsentRecords implementation confirmed; evaluateOutboundEligibility return shape verified
- [VERIFIED: codebase read] `lib/markos/outbound/providers/base-adapter.ts` — CHANNEL_CAPABILITIES (3 channels), existing contract methods confirmed
- [VERIFIED: codebase read] `lib/markos/outbound/events.ts` — normalizeOutboundEventForLedger, buildConversationStateUpdate confirmed
- [VERIFIED: codebase read] `lib/markos/outbound/providers/resend-adapter.ts` — send + normalizeEvent + sandbox mode confirmed
- [VERIFIED: codebase read] `lib/markos/outbound/conversations.ts` — thread-per-CRM-record model (record_kind + record_id); replaced by profile-scoped messaging_threads
- [VERIFIED: 222-RESEARCH.md] P222 F-IDs F-113..F-121 + migrations 106-112 allocation confirmed in module structure section
- [VERIFIED: obsidian/reference/Contracts Registry.md] F-121 is the last allocated F-ID; F-122 is the correct starting point for P223

### Secondary (MEDIUM confidence)

- [CITED: vercel.com/marketplace/knock] Knock on Vercel Marketplace confirmed
- [CITED: docs.knock.app/integrations/push/overview] Knock FCM + APNS abstraction via channel group confirmed
- [CITED: knock.app/pricing] Knock free tier: up to 10K messages/month at $0 confirmed
- [CITED: vercel.com/changelog/vercel-queues-now-in-public-beta] Vercel Queues public beta all teams confirmed
- [CITED: vercel.com/docs/queues/pricing] Vercel Queues billed per API operation
- [CITED: resend.com/docs/dashboard/receiving/introduction] Resend inbound: webhook does NOT include email body; must call Received Emails API separately
- [CITED: resend.com/blog/inbound-emails] Resend inbound feature confirmed as launched (2025)

### Tertiary (LOW confidence — requires verification at plan time)

- [ASSUMED] Handlebars v4.7.x availability; verify with `npm view handlebars version`
- [ASSUMED] `@knocklabs/node` SDK API surface; verify with official Knock docs before implementing adapter
- [ASSUMED] Vitest/Playwright installation status in repo (depends on P221/P222 execution)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase read confirmed all reused modules; Knock/Vercel/Resend verified via web sources
- Architecture: HIGH — all 41 locked decisions mapped to concrete implementation patterns; no speculative design
- Schema sketches: HIGH — DDL follows existing migration patterns (migration 58, 62, 100); RLS pattern identical to prior migrations
- F-ID + migration allocation: HIGH — P222 baseline confirmed in 222-RESEARCH.md
- Pitfalls: HIGH — most pitfalls are directly implied by CONTEXT.md decisions (retry storm → D-14 idempotency; view drift → D-11/D-12; Resend body absence → VERIFIED)
- Validation Architecture: HIGH — follows V4.0.0-TESTING-ENVIRONMENT-PLAN.md + V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md exactly

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30 days for stable architecture; earlier if Knock SDK or Vercel Queues API changes)

---

## RESEARCH COMPLETE
