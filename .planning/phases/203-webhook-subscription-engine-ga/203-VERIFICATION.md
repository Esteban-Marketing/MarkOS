---
phase: 203-webhook-subscription-engine-ga
verified: 2026-04-18T14:00:00Z
status: human_needed
score: 12/12 code-verifiable must-haves green
human_uat_remaining: 7
last_reconciled: 2026-04-27
re_verification:
  previous_status: gaps_found
  previous_score: 11/12
  gaps_closed:
    - "Surface 4 rotation grace banner is visible to tenant-admins across (markos) routes when an active rotation is within its T-7/T-1/T-0 window"
  gaps_remaining: []
  regressions: []
  closure_plan: "203-11"
  closure_commits:
    - "ec6ca5c test(203-11): RED — layout-shell banner wiring contract test"
    - "812124d feat(203-11): GREEN — mount RotationGraceBanner in workspace shell via RotationBannerMount"
    - "139f9be docs(203-11): complete Surface 4 banner gap-closure plan"
human_verification:
  - test: "End-to-end signing-secret rotation UX"
    expected: "After calling POST /api/tenant/webhooks/subscriptions/{sub_id}/rotate, an admin browsing any (markos) route sees the T-7 banner with locked copy 'Signing-secret rotation in progress. 7 days remain in the grace window.' and a link to /settings/webhooks/{sub_id}?tab=settings. Banner persists across navigation (no dismiss button), transitions to T-1 / T-0 variants as grace_ends_at approaches, and disappears after finalize."
    why_human: "Requires running the full Next.js app against a real Supabase instance with a rotation seeded, exercising multi-page navigation, and visually confirming the stage-specific color transitions (#fef3c7→#fef2f2 palette escalation). Now unblocked by 203-11 shell mount — spot-checks confirm layout-shell imports RotationBannerMount and renders it inside <section className={styles.content}>; RotationBannerMount fetches /api/tenant/webhooks/rotations/active on mount and passes rotations to <RotationGraceBanner />. UX feel + color transitions still require a live browser."
  - test: "Surface 1 dashboard data freshness under active traffic"
    expected: "Hero card refreshes every 30s (setInterval). With a live delivery stream, total_24h + success_rate + avg_latency_ms + dlq_count update between refreshes without flicker. 'Firing…' busy state on Test fire resolves to a toast (polite aria-live)."
    why_human: "Requires a live delivery stream against the Supabase fleet-metrics view and visual observation of the 30s refresh cadence and toast animations. Grep confirms setInterval exists (verified); human must confirm UX feel."
  - test: "Surface 2 DLQ batch replay end-to-end"
    expected: "With >1 DLQ row present, selecting 2+ checkboxes enables the sticky Replay (N) primary button; clicking submits POST /api/tenant/webhooks/subscriptions/{sub_id}/dlq/replay with delivery_ids; the confirm dialog renders aria-labelledby h2; on success toast appears, rows reload, and Vercel Queues idempotencyKey=replay-{id}-{5min-bucket} prevents double-dispatch."
    why_human: "Idempotency key deduplication only observable against live Vercel Queues; grep confirms idempotencyKey is passed (verified). Requires infra to confirm no duplicate deliveries to subscriber."
  - test: "Public status page freshness under cache"
    expected: "GET /status/webhooks returns 200 with 4 hero numbers; response headers include Cache-Control: public, max-age=60. Repeat fetch within 60s returns cached response (grep confirms header set; human confirms cache behavior at edge)."
    why_human: "60s s-maxage cache behavior is edge-layer; requires deployed Vercel environment to confirm CDN caching semantics."
  - test: "Rotation email delivery via Resend"
    expected: "When api/cron/webhooks-rotation-notify runs and a tenant has ≥1 rotation crossing T-7/T-1/T-0, tenant admins receive a Resend email with stage-specific subject + body. Idempotency log (rotation_notifications_sent) prevents second send for same rotation_id + stage."
    why_human: "Requires live Resend API key + mail receipt confirmation + DB log inspection. Grep confirms module structure (verified)."
  - test: "Per-subscription rate-limit actual Redis-backed throttling"
    expected: "With plan_tier='free' (RPS=10), sending 20 deliveries/sec to one subscription produces ≥10 rate_limited gate blocks (status=retrying + next_attempt_at set). With rps_override=5, the cap lowers. Override >10 rejects at subscribe-time with { error: 'rps_override_exceeds_plan' }."
    why_human: "Requires live Upstash Redis + subscriber test-fire at >10/sec; grep confirms resolvePerSubRps + checkWebhookRateLimit wiring (verified); Redis SDK behavior + actual sliding-window enforcement only provable at runtime."
  - test: "Circuit breaker trip + half-open probe + reset"
    expected: "After 11 consecutive 5xx responses to one subscription within WINDOW_SIZE=20, breaker trips (state='open'); at HALF_OPEN_BACKOFF_SEC[0]=30s one probe call is allowed (state='half-open'); on probe success, recordOutcome('success') returns state to 'closed'. 4xx responses do NOT trip."
    why_human: "Requires orchestrating a flaky subscriber under live Redis and observing sliding-window state transitions. Unit tests confirm classifyOutcome logic (verified); end-to-end trip-and-recover loop needs live integration."
---

# Phase 203: Webhook Subscription Engine GA Verification Report

**Phase Goal:** Graduate 200-03 webhook primitive to GA: durable Supabase + Vercel Queues substrate, tenant-admin dashboard (2 surfaces), DLQ + replay, signing-secret rotation with 30-day grace + T-7/T-1/T-0 notifications + Surface 4 banner, per-subscription rate-limits + circuit breaker, public status page, full observability + docs.

**Verified:** 2026-04-18T14:00:00Z
**Status:** human_needed (12/12 code-verifiable truths green; 7 live-UAT items pending)
**Re-verification:** Yes — after gap closure (plan 203-11)

## Re-Verification Summary

| Metric              | Initial (13:00Z)          | Re-verify (14:00Z)                                                                |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| Status              | `gaps_found`              | `human_needed`                                                                    |
| Score               | 11/12                     | **12/12**                                                                         |
| Blocker gaps        | 1 (Surface 4 banner)      | **0**                                                                             |
| Human UAT items     | 7                         | 7 (unchanged — persisted)                                                         |
| Deferred items      | 2 (QA-06 E2E, QA-08 LLM)  | 2 (unchanged — pre-existing)                                                      |
| Closure plan        | —                         | **203-11** (3 commits: RED test → GREEN mount → docs)                             |

**Gap closed:** Truth #12 (Surface 4 banner visibility). Plan 203-11 shipped `RotationBannerMount.tsx` (47 LoC client component) + modified `layout-shell.tsx` to import and render it inside `<section className={styles.content}>` above `{children}`, per UI-SPEC §Surface 4 placement contract. New grep-shape test `test/webhooks/layout-shell-banner.test.js` ships with 7 assertions enforcing the wiring contract — all green. No regressions: full webhook suite runs 359 pass / 0 fail / 2 skipped (unchanged from initial verification).

## Goal Achievement

### Observable Truths (phase-level, derived from ROADMAP goal + 10 plan frontmatter must_haves)

| #  | Truth                                                                                                                                                                                                   | Status     | Evidence                                                                                                                                                                                                                                                                           |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Durable substrate: getWebhookStores() returns Supabase-backed subscriptions+deliveries + Vercel Queues push consumer (replacing 200-03 in-memory adapters).                                             | VERIFIED   | `lib/markos/webhooks/store.cjs:74-82` wires createSupabaseSubscriptionsStore + createSupabaseDeliveriesStore. `api/webhooks/queues/deliver.js:14-15,38,69` wires handleCallback → processDelivery. `vercel.ts:46-47` registers `queue/v2beta` trigger. `package.json:74` pins `@vercel/queue`. |
| 2  | SSRF guard blocks private IP ranges + enforces HTTPS on subscribe + at dispatch time.                                                                                                                   | VERIFIED   | `api/webhooks/subscribe.js:35` calls `assertUrlIsPublic`. `lib/markos/webhooks/delivery.cjs:143` calls at dispatch. `lib/markos/webhooks/ssrf-guard.cjs` (111 lines) covers 127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, 0.0.0.0/8, ::1, fc00::/7, fe80::/10 + HTTPS enforcement.       |
| 3  | Migration 72 adds DLQ + rotation + view DDL with rollback; secret_v2 + grace + rps_override columns; markos_webhook_secret_rotations table; markos_webhook_fleet_metrics_v1 view.                         | VERIFIED   | `supabase/migrations/72_markos_webhook_dlq_and_rotation.sql` (328 lines, 73 matches for key DDL tokens). `rollback/72_markos_webhook_dlq_and_rotation.rollback.sql` present.                                                                                                           |
| 4  | DLQ library + 7-day TTL purge cron: listDLQ/countDLQ/markFailed/markDelivered/purgeExpired exist; cron gates MARKOS_WEBHOOK_CRON_SECRET; registered in vercel.ts at 03:30 UTC.                               | VERIFIED   | `lib/markos/webhooks/dlq.cjs:159` exports purgeExpired; `api/cron/webhooks-dlq-purge.js:13` requires it; `vercel.ts:36` registers `{ path: '/api/cron/webhooks-dlq-purge', schedule: '30 3 * * *' }`; audit emit via `enqueueAuditStaging`.                                           |
| 5  | Replay endpoints: single + batch with fresh HMAC + idempotencyKey + x-markos-replayed-from header; F-98 contract + F-73 extension shipped.                                                               | VERIFIED   | `lib/markos/webhooks/replay.cjs:72,111` define replaySingle + replayBatch. `api/tenant/webhooks/subscriptions/[sub_id]/deliveries/[delivery_id]/replay.js` + `api/tenant/webhooks/subscriptions/[sub_id]/dlq/replay.js` exist. `replay.cjs:153` sets idempotencyKey. `contracts/F-98/F-73` shipped. |
| 6  | Signing-secret rotation: startRotation/rollbackRotation/finalizeExpiredRotations/listActiveRotations; 30-day grace; rotate + rotate/rollback + rotations/active endpoints; F-97 contract.                   | VERIFIED   | `lib/markos/webhooks/rotation.cjs:134-137` exports all 4 functions. 3 API endpoints exist. `contracts/F-97-webhook-rotation-v1.yaml` present. Dual-sign wired via `delivery.cjs:229` calling signPayloadDualSign with `subscription.secret_v2`.                                        |
| 7  | T-7/T-1/T-0 notification cron: Resend-backed emails + Surface 4 banner component renders 4 variants with locked copy and role=status.                                                                   | VERIFIED   | `lib/markos/webhooks/rotation-notify.cjs:262-263` exports notifyRotations + sendRotationNotification; `api/cron/webhooks-rotation-notify.js` + `vercel.ts:39` (04:00 UTC) wired. `RotationGraceBanner.tsx` renders T-7/T-1/T-0/multi variants with locked copy. **Banner now mounted in shell via 203-11 — see truth #12.** |
| 8  | Per-subscription rate-limit (plan-tier + override): PLAN_TIER_RPS locked {free:10, team:60, enterprise:300}; checkWebhookRateLimit sliding-window via @upstash/ratelimit; rps_override validated at subscribe-time. | VERIFIED   | `rate-limit.cjs:15` PLAN_TIER_RPS frozen object. Line 48 `Ratelimit.slidingWindow(resolved_rps, '1 s')`. `api/webhooks/subscribe.js:46-62` validates rps_override ≤ ceiling. Exports resolvePerSubRps + checkWebhookRateLimit + buildRateLimitedEnvelope.                        |
| 9  | Circuit breaker (Redis sliding-window): WINDOW_SIZE=20, TRIP_THRESHOLD=0.5, HALF_OPEN_BACKOFF_SEC=[30,60,120,300,600]; canDispatch + recordOutcome + classifyOutcome exported; wired via runDispatchGates as FIRST gate. | VERIFIED   | `breaker.cjs:35-37` constants exact match. Lines 128-131 canDispatch; 78-90 recordOutcome; 66-76 classifyOutcome. `dispatch-gates.cjs:42` calls canDispatch FIRST, line 57 checkWebhookRateLimit second. `delivery.cjs:199` invokes runDispatchGates pre-fetch; lines 104-105 post-fetch recordOutcome inside observability wrapper. |
| 10 | Tenant dashboard Surface 1 + Surface 2 with 5 APIs (fleet-metrics, subscriptions list, detail, update, delete) + F-96 contract; a11y markers + 3 new 203 CSS conventions.                             | VERIFIED   | 5 API handlers + 2 pages (page.tsx 419 lines, [sub_id]/page.tsx 813 lines) present. Surface 1 fetches fleet-metrics + subscriptions in parallel (page.tsx:98,105). Surface 2 fetches 8 endpoints (detail/dlq/replay/rotate/rollback/delete/update). F-96 contract declares 5 paths. |
| 11 | Public status page (Surface 3) + Sentry + log-drain + smoke harness + docs; F-99 contract; openapi.json regenerated; public/llms.txt updated.                                                           | VERIFIED   | `api/public/webhooks/status.js:39` Cache-Control header; returns {total_24h, success_rate, avg_latency_ms, dlq_count, last_updated}. Standalone Surface 3 (no workspace shell). `log-drain.cjs` + `sentry.cjs` triple-safety pattern mirrors 202-05. `scripts/load/webhooks-smoke.mjs` ships. 5 docs pages + llms overview. `public/llms.txt:42-48` Phase 203 section. |
| 12 | **Surface 4 banner is visible to tenant-admins across (markos) routes during rotation grace.**                                                                                                           | **VERIFIED** | **Plan 203-11 closed the gap.** `app/(markos)/layout-shell.tsx:4` imports `RotationBannerMount`; line 65 renders `<RotationBannerMount />` inside `<section className={styles.content}>` above `{children}` — per UI-SPEC §Surface 4 placement contract. `app/(markos)/_components/RotationBannerMount.tsx` (47 L, `'use client'`) performs one-shot fetch of `/api/tenant/webhooks/rotations/active` inside `useEffect`, stores result in `useState<Rotation[]>`, and renders `<RotationGraceBanner rotations={rotations} />`. Silent on 401/500 (credentials=same-origin; banner self-hides on empty list). `test/webhooks/layout-shell-banner.test.js` — 7 grep-shape assertions, all green. Full webhook suite: 359 pass, 0 fail (no regressions). |

**Score:** 12/12 truths verified (0 failed, 0 uncertain)

### Required Artifacts

All 50+ artifacts across the 10 plans exist on disk and are substantive (100-800+ LoC each). Plan 203-11 adds 1 new artifact (47 LoC client component) + 1 modification (+2 LoC in layout-shell.tsx) + 1 new test (72 LoC).

| Plan  | Artifacts                                                                                                                                                                                                                                                              | Exists | Substantive | Wired       | Status                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- | ----------- | ---------------------------- |
| 01    | store-supabase.cjs/ts, store-vercel-queue.cjs/ts, store.cjs (139 L), api/webhooks/queues/deliver.js, vercel.ts                                                                                                                                                          | ✓ (7/7) | ✓           | ✓ WIRED     | VERIFIED                     |
| 02    | ssrf-guard.cjs/ts, migrations/72 + rollback (328 + 37 L)                                                                                                                                                                                                                | ✓ (4/4) | ✓           | ✓ WIRED     | VERIFIED                     |
| 03    | dlq.cjs/ts (161 L), api/cron/webhooks-dlq-purge.js                                                                                                                                                                                                                      | ✓ (3/3) | ✓           | ✓ WIRED     | VERIFIED                     |
| 04    | signing.cjs, replay.cjs (185 L), 2 replay endpoints, F-98 + F-73 contracts                                                                                                                                                                                              | ✓ (6/6) | ✓           | ✓ WIRED     | VERIFIED                     |
| 05    | rotation.cjs (140 L), 3 rotation endpoints, F-97 contract                                                                                                                                                                                                               | ✓ (5/5) | ✓           | ✓ WIRED     | VERIFIED                     |
| 06    | rotation-notify.cjs (269 L), cron, RotationGraceBanner.tsx (117 L), RotationGraceBanner.module.css (109 L)                                                                                                                                                             | ✓ (4/4) | ✓           | ✓ WIRED     | VERIFIED (was ORPHANED; fixed by 203-11) |
| 07    | rate-limit.cjs (113 L), dispatch-gates.cjs (89 L), F-100 contract                                                                                                                                                                                                       | ✓ (3/3) | ✓           | ✓ WIRED     | VERIFIED                     |
| 08    | breaker.cjs/ts (171 L), dispatch-gates.cjs (extended)                                                                                                                                                                                                                   | ✓ (3/3) | ✓           | ✓ WIRED     | VERIFIED                     |
| 09    | 5 api/tenant/webhooks/* handlers, metrics.cjs (164 L), settings/webhooks/page.tsx (419 L), settings/webhooks/[sub_id]/page.tsx (813 L), F-96 contract                                                                                                                   | ✓ (9/9) | ✓           | ✓ WIRED     | VERIFIED                     |
| 10    | api/public/webhooks/status.js, status/webhooks/page.tsx, log-drain.cjs, sentry.cjs, F-99, smoke harness, 5 docs                                                                                                                                                         | ✓ (11/11) | ✓        | ✓ WIRED     | VERIFIED                     |
| **11** | **RotationBannerMount.tsx (47 L), layout-shell.tsx (+2 L edit), test/webhooks/layout-shell-banner.test.js (72 L)**                                                                                                                                                     | ✓ (3/3) | ✓           | ✓ WIRED     | VERIFIED                     |

**Previously-orphaned artifact now rescued:** `app/(markos)/_components/RotationGraceBanner.tsx` (117 L) + `RotationGraceBanner.module.css` (109 L) are now imported by exactly one caller — `RotationBannerMount.tsx` — which is itself mounted in `layout-shell.tsx`. Grep `RotationGraceBanner` under `app/(markos)` returns 3 files (component + banner module + mount), closing the previous "0 importers" finding.

### Key Link Verification

Only changes from initial verification: the previously-NOT_WIRED link from `RotationGraceBanner.tsx` to `/api/tenant/webhooks/rotations/active` is now WIRED via the new `RotationBannerMount.tsx` intermediary. All other links are unchanged and still WIRED.

| From                                                               | To                                                            | Via                                               | Status     | Details                                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| store.cjs                                                          | store-supabase.cjs                                            | require() createSupabase(Subs\|Deliv)Store        | WIRED      | Lines 74-75, 81-82.                                                                                                                          |
| api/webhooks/queues/deliver.js                                     | @vercel/queue handleCallback                                  | require('@vercel/queue').handleCallback           | WIRED      | Line 14 + line 69 exports handleCallback(asyncHandler, options).                                                                             |
| api/webhooks/queues/deliver.js                                     | delivery.cjs processDelivery                                  | require('../../../lib/...')                       | WIRED      | Line 15 + line 38.                                                                                                                           |
| api/webhooks/subscribe.js                                          | ssrf-guard.cjs                                                | require + assertUrlIsPublic                       | WIRED      | Line 6 import + line 35 call pre-insert.                                                                                                     |
| lib/markos/webhooks/delivery.cjs                                   | ssrf-guard.cjs                                                | dispatch-time call                                | WIRED      | Line 5 import + line 143 call at dispatch (DNS-rebinding mitigation).                                                                        |
| api/cron/webhooks-dlq-purge.js                                     | dlq.cjs purgeExpired                                          | require + delegate                                | WIRED      | Line 13 require + line 55 call.                                                                                                              |
| dlq.cjs                                                            | audit/writer.cjs enqueueAuditStaging                          | audit emit on purge batch                         | WIRED      | Line 27 require + line 131 call inside purgeExpired.                                                                                         |
| replay endpoints                                                   | replay.cjs replaySingle/replayBatch                           | require + tenant-guard delegate                   | WIRED      | Both endpoint files delegate cleanly.                                                                                                        |
| replay.cjs                                                         | signing.cjs signPayload                                       | fresh HMAC at replay                              | WIRED      | Line references in header; signing.cjs (67 L) exports signPayload + signPayloadDualSign.                                                     |
| replay.cjs                                                         | store.queue.push idempotencyKey                               | batch idempotency                                 | WIRED      | Line 153 `replay-${orig.id}-${bucket}`.                                                                                                      |
| rotate endpoints                                                   | rotation.cjs startRotation/rollbackRotation                   | require + delegate                                | WIRED      | Cross-tenant guard + audit emit confirmed.                                                                                                   |
| delivery.cjs                                                       | signing.cjs signPayloadDualSign                               | require + inject both secrets                     | WIRED      | Line 4 import + line 229 call with `subscription.secret_v2 \|\| null`.                                                                       |
| api/cron/webhooks-rotation-notify.js                               | rotation-notify.cjs notifyRotations                           | daily cron                                        | WIRED      | vercel.ts:39 registers `{ path: '/api/cron/webhooks-rotation-notify', schedule: '0 4 * * *' }`.                                              |
| rotation-notify.cjs                                                | Resend SDK                                                    | require('resend').Resend                          | WIRED      | Line 137 lazy-require with dry-run fallback when RESEND_API_KEY absent.                                                                      |
| **layout-shell.tsx**                                               | **RotationBannerMount**                                       | **import + render inside `<section>.content`**   | **WIRED**  | **layout-shell.tsx:4 imports from `./_components/RotationBannerMount`; line 65 renders `<RotationBannerMount />` above `{children}`. 7-assertion grep test enforces this contract (green).** |
| **RotationBannerMount.tsx**                                        | **/api/tenant/webhooks/rotations/active**                     | **useEffect one-shot fetch → useState → prop**   | **WIRED**  | **Line 25 fetch call; line 35 setRotations; line 45 `<RotationGraceBanner rotations={rotations} />`. credentials=same-origin; silent on !res.ok; cancellation guard on unmount.** |
| **RotationBannerMount.tsx**                                        | **RotationGraceBanner**                                       | **import + prop injection**                      | **WIRED**  | **Line 15 import default; line 16 import type { Rotation }; line 45 render with `rotations={rotations}`.**                                  |
| delivery.cjs                                                       | dispatch-gates.cjs runDispatchGates                           | single pre-fetch gate                             | WIRED      | Line 6 import + line 199 call; handleGateBlock on non-allowed.                                                                                |
| dispatch-gates.cjs                                                 | rate-limit.cjs checkWebhookRateLimit                          | rate-limit gate                                   | WIRED      | Line 28 import + line 57 call.                                                                                                               |
| dispatch-gates.cjs                                                 | breaker.cjs canDispatch                                       | breaker gate (FIRST, before rate-limit)            | WIRED      | Line 29 import + line 42 call before rate-limit on line 57.                                                                                   |
| api/webhooks/subscribe.js                                          | rate-limit.cjs resolvePerSubRps                               | subscribe-time validation                         | WIRED      | Line 7 import + line 46-62 validateRpsOverride.                                                                                               |
| delivery.cjs                                                       | breaker.cjs recordOutcome + classifyOutcome                   | post-fetch outcome in finally                     | WIRED      | Line 14 import + lines 104-105 inside observability wrapper.                                                                                  |
| delivery.cjs                                                       | log-drain.cjs emitLogLine                                     | finally-block emit                                | WIRED      | Line 12 import + lines 125/303 calls.                                                                                                        |
| delivery.cjs                                                       | sentry.cjs captureToolError                                   | catch-block capture                               | WIRED      | Line 13 import + line 290 call.                                                                                                              |
| app/(markos)/settings/webhooks/page.tsx (S1)                       | fleet-metrics + subscriptions endpoints                       | parallel fetch on mount + 30s setInterval          | WIRED      | Lines 98, 105.                                                                                                                               |
| app/(markos)/settings/webhooks/[sub_id]/page.tsx (S2)              | 8 plan-203 endpoints                                          | tab-driven fetch                                  | WIRED      | Lines 114, 128, 204, 241, 265, 290, 309, 344 — all 8 endpoints fetched.                                                                      |

### Data-Flow Trace (Level 4)

Surface 4 is now FLOWING end-to-end. All other surfaces unchanged.

| Artifact                                                 | Data Variable  | Source                                             | Produces Real Data                        | Status       |
| -------------------------------------------------------- | -------------- | -------------------------------------------------- | ----------------------------------------- | ------------ |
| app/(markos)/settings/webhooks/page.tsx (Surface 1)      | metrics + subs | /api/tenant/webhooks/fleet-metrics + /subscriptions | Yes — view + table queries in Supabase     | ✓ FLOWING    |
| app/(markos)/settings/webhooks/[sub_id]/page.tsx (Surface 2) | detail        | /api/tenant/webhooks/subscriptions/{sub_id}        | Yes — full join of deliveries + rotation   | ✓ FLOWING    |
| app/(markos)/status/webhooks/page.tsx (Surface 3)         | snapshot       | /api/public/webhooks/status                        | Yes — view-based computation + DLQ count   | ✓ FLOWING    |
| **app/(markos)/_components/RotationBannerMount.tsx (Surface 4 fetcher)** | **rotations**  | **/api/tenant/webhooks/rotations/active (listActiveRotations via rotation.cjs)** | **Yes — DB-backed rotation query** | **✓ FLOWING** |
| **app/(markos)/_components/RotationGraceBanner.tsx (Surface 4 display)** | **rotations (prop)** | **Passed from RotationBannerMount state**   | **Yes — flows from live endpoint**          | **✓ FLOWING** |

### Behavioral Spot-Checks

All previously passing checks re-run green. Banner-importer check that previously failed now passes.

| Behavior                                  | Command                                                                                                | Result                       | Status    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- | --------- |
| Full webhook test suite runs green         | `node --test test/webhooks/*.test.js`                                                                  | 359 pass, 0 fail, 2 skipped (DB-integration only) | ✓ PASS    |
| 203-11 wiring contract test green          | `node --test test/webhooks/layout-shell-banner.test.js`                                                | 7/7 pass                     | ✓ PASS    |
| openapi-build regression                   | `node --test test/openapi/openapi-build.test.js`                                                       | 19 pass, 1 fail (35 pre-existing tag-less paths; deferred-items.md #1 — Phase 202 inherited) | ℹ️ DEFERRED |
| 5 webhook paths in openapi.json            | `grep -c "/api/tenant/webhooks/subscriptions/{sub_id}/(.*)/replay\|fleet-metrics\|rotations/active\|/api/public/webhooks/status" contracts/openapi.json` | 5                            | ✓ PASS    |
| @vercel/queue pinned                      | `grep @vercel/queue package.json`                                                                      | `"@vercel/queue": "^0.1.6"`   | ✓ PASS    |
| **Banner component importers**             | **`grep -r "import.*RotationGraceBanner" app/`**                                                        | **1 match (RotationBannerMount.tsx:15)** | **✓ PASS (was FAIL in initial verification)** |
| **Banner mount importers**                 | **`grep -r "import.*RotationBannerMount" app/`**                                                        | **1 match (layout-shell.tsx:4)** | **✓ PASS** |
| **Banner JSX in shell**                    | **`grep "<RotationBannerMount" app/(markos)/layout-shell.tsx`**                                         | **1 match (line 65)**        | **✓ PASS** |
| **Endpoint URL literal in mount**          | **`grep "/api/tenant/webhooks/rotations/active" app/(markos)/_components/RotationBannerMount.tsx`**    | **1 match (line 25)**        | **✓ PASS** |

### Requirements Coverage

All Phase 203 requirement mappings updated to reflect closure of the Surface 4 banner gap. QA-14 (Accessibility) moves from PARTIAL → SATISFIED because Surface 4 is now rendered; keyboard navigation is possible once there is an active rotation.

| Requirement | Source Plans                                      | Area                                                        | Status     | Evidence                                                                                                                                                      |
| ----------- | ------------------------------------------------- | ----------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WHK-01      | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, **11**    | Webhook primitive graduated to GA                           | **SATISFIED** | All 12 truths VERIFIED. Surface 4 banner (previously blocking) shipped via 203-11; full webhook pipeline end-to-end functional from API + cron + durable substrate through all 4 tenant-admin surfaces. |
| QA-01       | 04, 05, 09                                        | API hardening (replay + rotation + dashboard APIs)          | SATISFIED  | 5 replay/rotation endpoints + 5 dashboard endpoints with cross-tenant guards, audit emit, and input validation.                                                |
| QA-02       | 04, 09                                            | Contract coverage (F-98, F-96)                              | SATISFIED  | F-96 + F-98 shipped + integrated into openapi.json (5 paths present). F-73 extended.                                                                           |
| QA-03       | 06, 09, **11**                                    | Notification + email integration                            | **SATISFIED** | rotation-notify.cjs cron + Resend integration + idempotency log. Surface 4 banner now user-visible (203-11 shell mount) — previously partial UI gap closed.  |
| QA-04       | 07, 08                                            | Rate-limit + circuit breaker                                | SATISFIED  | PLAN_TIER_RPS + @upstash/ratelimit sliding window + breaker WINDOW_SIZE=20 / threshold 0.5 / HALF_OPEN_BACKOFF_SEC[5] all wired.                               |
| QA-05       | 01, 03, 04                                        | Durability + DLQ                                            | SATISFIED  | Supabase + Vercel Queues + DLQ library + 7-day TTL purge cron.                                                                                                 |
| QA-06       | 10                                                | Playwright E2E                                              | DEFERRED   | Explicitly documented in `deferred-items.md` §2: milestone-wide deferral inherited from Phase 202-10 precedent. Grep-based a11y tests ship in lieu.             |
| QA-07       | 10                                                | Load harness                                                | SATISFIED  | `scripts/load/webhooks-smoke.mjs` 60-concurrent × 60s; p95 ≤ 500ms + err_rate ≤ 1% gates; dry-run when base URL unset.                                          |
| QA-08       | 10                                                | LLM eval-as-test                                            | NOT_APPLICABLE | `deferred-items.md` §3: webhook domain produces no LLM output; pure I/O + HMAC + Redis paths.                                                                 |
| QA-09       | 10                                                | Docs + OpenAPI + llms.txt                                   | SATISFIED  | 4 docs pages + llms-friendly overview + openapi.json regen + public/llms.txt Phase 203 section (lines 42-48).                                                  |
| QA-10       | 02                                                | Security (SSRF guard)                                       | SATISFIED  | assertUrlIsPublic blocks 6 IPv4 ranges + 3 IPv6 ranges + enforces HTTPS; called at subscribe AND dispatch.                                                      |
| QA-11       | 02                                                | Migration + rollback                                        | SATISFIED  | Migration 72 + rollback (328 + 37 LoC); idempotent re-apply; RLS enabled on new rotations table.                                                               |
| QA-12       | 07                                                | Per-sub rate-limit override validation                      | SATISFIED  | rps_override ≤ plan ceiling enforced at subscribe-time (400 rps_override_exceeds_plan); resolvePerSubRps applies Math.min at runtime.                           |
| QA-13       | 01, 02, 03, 05                                    | Service-role client + audit hooks                           | SATISFIED  | Supabase service-role pattern in store-supabase.cjs; enqueueAuditStaging integration in dlq.cjs + rotation endpoints.                                          |
| QA-14       | 06, 09, **11**                                    | Accessibility (Surfaces 1, 2, 4)                            | **SATISFIED** | Surface 1 + Surface 2 + Surface 3 + Surface 4 component all carry WCAG 2.2 AA markers (role=status, data-stage, role=tablist, role=meter, 44px tap target, #0d9488 focus ring, reduced-motion support). **Surface 4 is now rendered via 203-11 shell mount — keyboard-navigable when an active rotation exists.** |
| QA-15       | 06, 10                                            | Observability (Sentry + log-drain)                          | SATISFIED  | log-drain.cjs + sentry.cjs triple-safety pattern (env gate + lazy import + try/catch); delivery.cjs observability wrapper calls both.                          |

**Orphaned requirements check:** Same as initial verification — no unmapped requirements orphaned.

### Anti-Patterns Found

The only blocker anti-pattern from initial verification is now resolved. The deferral comment at the top of `RotationGraceBanner.tsx` is now informational context (it still says "deferred to Plan 203-09", which is historically accurate; 203-09 handed off to 203-11). Not a blocker — just stale comment.

| File                                          | Line | Pattern                                                                                                  | Severity   | Impact                                                                                            |
| --------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `app/(markos)/_components/RotationGraceBanner.tsx` | 7-8  | Header comment references deferral to "Plan 203-09" but closure actually happened in Plan 203-11. | ℹ️ Info    | Stale history comment — no functional impact; component is now mounted correctly. Optional cleanup. |
| `app/(markos)/settings/webhooks/page.tsx`     | 378, 388 | HTML `placeholder="..."` attributes on form inputs.                                                 | ℹ️ Info    | Legitimate HTML placeholder attributes (not stub comments). Not a concern.                         |

**Other scans:** No TODO / FIXME / XXX / HACK / "Not implemented" / `return null` / `return []` stubs in any of the 50+ new files under `lib/markos/webhooks/`, `api/(public\|tenant\|webhooks\|cron)/webhooks/**`, `app/(markos)/(settings\|status)/webhooks/**`, including the new `_components/RotationBannerMount.tsx`.

### Human Verification Required

7 items need human testing in a live environment with real infra (Supabase + Upstash Redis + Vercel Queues + Resend). These are UNCHANGED from initial verification — they always required human UAT regardless of gap closure. The end-to-end rotation UX test (item 1) is now UNBLOCKED by the 203-11 shell mount: once an admin seeds a rotation and navigates to any workspace route, the banner will render.

1. End-to-end rotation UX (now unblocked; spot-checks verify wiring; human confirms visual/feel).
2. Surface 1 dashboard data freshness under active traffic.
3. Surface 2 DLQ batch replay idempotency with Vercel Queues.
4. Public status page CDN cache behavior.
5. Rotation email delivery via Resend.
6. Per-subscription rate-limit Redis-backed throttling (10/60/300 rps ceilings).
7. Circuit breaker trip + half-open probe + reset in live integration.

### Gaps Summary

**0 blocker gaps, 7 items awaiting human verification, 2 deferred items (documented pre-existing):**

All phase goals programmatically verifiable from the codebase are satisfied. The webhook engine ships end-to-end from HTTP ingress through durable Supabase + Vercel Queues substrate, dispatch gates (circuit breaker → rate-limit), dual-sign HMAC with 30-day rotation grace, DLQ with 7-day TTL purge, observability (log-drain + Sentry), public status, and **all 4 user-visible surfaces** — Surface 1 fleet dashboard, Surface 2 subscription detail, Surface 3 public status, and (as of 203-11) Surface 4 ambient rotation grace banner mounted in the tenant workspace shell.

Status returns `human_needed` (not `passed`) solely because 7 UAT items require a live environment with Supabase + Upstash Redis + Vercel Queues + Resend to observe behavioral contracts (UX feel, color transitions, idempotency at the queue layer, edge cache, email receipt, Redis rate-limit enforcement, breaker state transitions) that cannot be asserted from static grep alone.

---

_Initial verification: 2026-04-18T13:00:00Z_
_Re-verification (after gap closure): 2026-04-18T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
