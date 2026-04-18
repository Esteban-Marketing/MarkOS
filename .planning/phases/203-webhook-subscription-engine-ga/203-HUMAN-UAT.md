---
status: partial
phase: 203-webhook-subscription-engine-ga
source: [203-VERIFICATION.md]
started: 2026-04-18T14:30:00Z
updated: 2026-04-18T14:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end signing-secret rotation UX
expected: After calling POST /api/tenant/webhooks/subscriptions/{sub_id}/rotate, an admin browsing any (markos) route sees the T-7 banner with locked copy "Signing-secret rotation in progress. 7 days remain in the grace window." and a link to /settings/webhooks/{sub_id}?tab=settings. Banner persists across navigation (no dismiss button), transitions to T-1 / T-0 variants as grace_ends_at approaches, and disappears after finalize.
why_human: Requires live Next.js app + real Supabase with rotation seeded; multi-page nav + visual stage-specific color transitions (#fef3c7→#fef2f2 palette escalation). 203-11 unblocked wiring (banner mounted in shell via RotationBannerMount) — UX feel + color transitions still require browser.
result: [pending]

### 2. Surface 1 dashboard data freshness under active traffic
expected: Hero card refreshes every 30s (setInterval). With live delivery stream, total_24h + success_rate + avg_latency_ms + dlq_count update between refreshes without flicker. "Firing…" busy state on Test fire resolves to toast (polite aria-live).
why_human: Live delivery stream against Supabase fleet-metrics view + visual observation of 30s cadence + toast animations. setInterval verified via grep; human confirms UX feel.
result: [pending]

### 3. Surface 2 DLQ batch replay end-to-end
expected: With >1 DLQ row present, selecting 2+ checkboxes enables sticky Replay (N) primary button; click submits POST /api/tenant/webhooks/subscriptions/{sub_id}/dlq/replay with delivery_ids; confirm dialog renders aria-labelledby h2; on success toast appears, rows reload, Vercel Queues idempotencyKey=replay-{id}-{5min-bucket} prevents double-dispatch.
why_human: Idempotency key dedup only observable against live Vercel Queues; idempotencyKey passed verified via grep; infra required to confirm no duplicate deliveries to subscriber.
result: [pending]

### 4. Public status page freshness under cache
expected: GET /status/webhooks returns 200 with 4 hero numbers; response headers include Cache-Control: public, max-age=60. Repeat fetch within 60s returns cached response.
why_human: 60s s-maxage cache behavior is edge-layer; requires deployed Vercel environment to confirm CDN semantics.
result: [pending]

### 5. Rotation email delivery via Resend
expected: When api/cron/webhooks-rotation-notify runs and a tenant has ≥1 rotation crossing T-7/T-1/T-0, tenant admins receive Resend email with stage-specific subject + body. Idempotency log (rotation_notifications_sent) prevents second send for same rotation_id + stage.
why_human: Live Resend API key + mail receipt confirmation + DB log inspection. Module structure verified via grep.
result: [pending]

### 6. Per-subscription rate-limit actual Redis-backed throttling
expected: With plan_tier='free' (RPS=10), sending 20 deliveries/sec to one subscription produces ≥10 rate_limited gate blocks (status=retrying + next_attempt_at set). With rps_override=5, cap lowers. Override >10 rejects at subscribe-time with { error: 'rps_override_exceeds_plan' }.
why_human: Live Upstash Redis + subscriber test-fire at >10/sec; resolvePerSubRps + checkWebhookRateLimit wiring verified; Redis SDK behavior + actual sliding-window enforcement only provable at runtime.
result: [pending]

### 7. Circuit breaker trip + half-open probe + reset
expected: After 11 consecutive 5xx responses to one subscription within WINDOW_SIZE=20, breaker trips (state='open'); at HALF_OPEN_BACKOFF_SEC[0]=30s one probe call allowed (state='half-open'); on probe success, recordOutcome('success') returns state to 'closed'. 4xx responses do NOT trip.
why_human: Requires orchestrating flaky subscriber under live Redis + observing sliding-window state transitions. Unit tests confirm classifyOutcome logic; end-to-end trip-and-recover loop needs live integration.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
