# Phase 223 - Native Email and Messaging Orchestration (Discussion)

**Milestone:** v4.2.0 Commercial Engines 1.0
**Depends on:** Phases 205, 207, 208, 209, 210, 211, 221, 222
**Quality baseline applies:** all 15 gates
**Last revised:** 2026-04-26 (review-driven replan iter 1; D-42..D-55 + slice scope sync)

## Goal

Add first-party owned-channel execution for email, WhatsApp, SMS, and push with shared consent, approvals, deliverability controls, templates, and commercial memory.

## Scope

- Native email programs for transactional, lifecycle, broadcast, and behavioral sends.
- Messaging programs for WhatsApp, SMS, and push.
- Shared suppression, consent, quiet hours, locale, and approval model.
- Deliverability, bounce, complaint, reply, and reputation posture.
- Channel events flowing back into CRM, CDP, analytics, and learning.
- **Architecture-lock per D-42:** legacy `api/*.js` flat (no App Router), `requireHostedSupabaseAuth`, `npm test` (Node `--test`), `contracts/openapi.json`, `lib/markos/mcp/tools/index.cjs`, `resolvePlugin`.
- **Hard upstream preflight per D-45:** REQUIRED_UPSTREAM = [P205, P207, P208, P209, P210, P211, P221, P222]. NO bridge stubs. NO soft-skip flags.
- **DB-trigger compliance gates per D-50/D-51:** frequency-cap + consent-write enforcement at DB layer (service-role bypasses RLS; triggers fire for service-role too).

## Non-Goals

- CDP identity and consent substrate belongs to Phase 221.
- CRM timeline and customer memory belong to Phase 222.
- Conversion surfaces and launch orchestration belong to Phase 224.

## Discuss Focus

- Provider strategy and replaceable adapter contracts.
- Campaign vs conversation boundaries.
- Deliverability, opt-in, and fallback rules by channel.
- Approval model for high-risk or pricing-sensitive messaging via `buildApprovalPackage` (D-43).
- WhatsApp 24-hour session window ordering vs quiet-hours deferral (D-54).

## Proposed Plan Slices (revised post-review iter 1)

| Slice | Purpose | Owns Migrations | Owns Contracts | Tasks |
|---|---|---|---|---|
| 223-01 | Architecture-lock + upstream preflight (Task 0.5 NEW per D-42/D-45); F-ID + migration baseline; 9 fixture factories; migrations 113-116 (sender/deliverability/templates/programs/suppressions); base-adapter 3->5 channels; lib/markos/channels/* P223-OWNED greenfield tree CREATED NEW (D-44); legacy-outbound bridge | 113, 114, 115, 116 | F-122, F-123, F-124, F-125, F-126, F-127 | 4 (incl Task 0.5) |
| 223-02 | Migrations 117-121 (dispatch tracking + view-swap with D-51 single-writer trigger + RLS hardening + D-50 frequency-cap trigger); consent.ts cutover via P221 getConsentState; 6-layer per-recipient gate (D-19 + D-54 — adds whatsapp_session_check Layer 3); dispatch-coordinator HARD prereq via assertUpstreamReady(['P207']) per D-15-revised; Vercel Queues only (D-45 trim); idempotency + bounce-handler + suppression | 117, 118, 119, 120, 121 | F-128, F-129 | 3 |
| 223-03 | Templates: Handlebars conservative renderer + 4-source variable resolver + locale chain; content classifier P223-OWNED greenfield (D-53) using @babel/parser AST/allowlist (D-52) — replaces 5-line regex; 5-layer approval trigger (class + count + content + reengagement + manual); buildApprovalPackage extended (D-43 — NOT createApprovalPackage which does not exist); revocation flow | (none — Wave 3 parallel) | F-131 | 3 |
| 223-04 | Provider adapters complete contract: resend extended + twilio extended + knock NEW (@knocklabs/node) + in_app NEW; Resend inbound body-fetch (Pitfall 9); single fan-out emit() with D-51 GUC compliance; commercial_signal map; auto-reply detect (Pitfall 7); reply-flow with single-detection contract (OPT_OUT_REGEX in reply-flow.ts only); 3 webhook handlers signed + replay-safe + secret-clean | (none — Wave 3 parallel) | (none — uses F-128/F-129 from Plan 02) | 3 |
| 223-05 | API: 19 route files (legacy flat api/v1/channels/*.js per D-42; NOT App Router); MCP tools at lib/markos/mcp/tools/index.cjs (D-48 — .cjs); F-130 published; OpenAPI regen at contracts/openapi.json (D-47); UI: 5 new components + outbound-workspace evolution + TimelineDetailView extension (D-34) + Morning Brief + Approval Inbox channel entries; 5 Storybook stories | (none) | F-130 | 2 |
| 223-06 | Crons: 5 legacy api/cron/channels-*.js per D-49 (deliverability rollup, lifecycle journey poll, bounce spike alert, tombstone cascade, soft-bounce promote); RLS suite (11 tables × 4 ops × 2 tenants = 44 assertions); legacy regression P100-P105 + P221 + P222; QA-01..15 coverage meta-test; F-ID-collision regression (RL2 / D-55); cron-routes architecture-lock regression (D-49); Chromatic gate; SUMMARY/STATE/ROADMAP closeout. **autonomous: false per RL1** — Task 4 NEW = checkpoint:human-action gate for sender warming + DKIM/SPF/DMARC + Knock provisioning + Resend dashboard webhook configuration | (none) | (none — F-ID collision regression only) | 4 (incl checkpoint) |

## Wave Structure

| Wave | Plans (parallel) | Blocking on |
|---|---|---|
| 1 | 223-01 | (none — but Task 0.5 architecture-lock + upstream preflight is the FIRST step) |
| 2 | 223-02 | 223-01 |
| 3 | 223-03 + 223-04 | 223-01, 223-02 (Wave 3 plans run in parallel; no file conflicts per D-44 ownership map) |
| 4 | 223-05 | 223-01 + 223-02 + 223-03 + 223-04 |
| 5 | 223-06 | 223-01 + 223-02 + 223-03 + 223-04 + 223-05 |

## F-ID Slot Allocation (D-40 / D-55 — pre-allocated to prevent cross-plan slot collisions)

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

## Migration Slot Allocation (D-41 — pre-allocated)

| Migration | Plan | Purpose |
|-----------|------|---------|
| 113 | 01 | sender_identities + deliverability_posture |
| 114 | 01 | channel_templates |
| 115 | 01 | email_campaigns + messaging_threads + lifecycle_journeys + lifecycle_journey_runs |
| 116 | 01 | channel_suppressions |
| 117 | 02 | dispatch_events + dispatch_skips |
| 118 | 02 | in_app_messages |
| 119 | 02 | consent view swap + D-51 single-writer trigger |
| 120 | 02 | RLS hardening + audit_log event-type registrations |
| 121 | 02 | D-50 frequency-cap trigger on dispatch_events |

## Review-Driven Decisions (added 2026-04-26 iter 1)

D-42..D-55 — see `223-CONTEXT.md` `<decisions>` block. Summary:

- **D-42** Architecture-lock (legacy api/*.js, requireHostedSupabaseAuth, npm test, contracts/openapi.json, mcp/tools/index.cjs, resolvePlugin)
- **D-43** buildApprovalPackage replaces createApprovalPackage (verified at agent-actions.ts:68; createApprovalPackage does NOT exist)
- **D-44** Greenfield ownership map (cdp/crm360 = upstream; channels = P223)
- **D-45** Hard upstream preflight gate (no bridge stubs)
- **D-46** npm test runner (Node --test); .test.js files
- **D-47** contracts/openapi.json (NOT public/openapi.json)
- **D-48** lib/markos/mcp/tools/index.cjs (NOT .ts)
- **D-49** Legacy api/cron/*.js (NOT App Router)
- **D-50** Frequency-cap = DB trigger (compliance-grade)
- **D-51** Consent-write single-writer = DB trigger (NOT RLS)
- **D-52** AST/allowlist pricing classifier via @babel/parser
- **D-53** Content classifier owned by P223 (NOT carry from P211)
- **D-54** WhatsApp 24-hour session window ordering rule
- **D-55** F-ID slot table (above)
