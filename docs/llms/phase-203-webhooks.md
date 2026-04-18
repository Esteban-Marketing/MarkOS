# Phase 203 — Webhook Subscription Engine GA

MarkOS graduates the 200-03 webhook primitive to full GA with Supabase-backed
durability, Vercel Queues push-mode delivery, per-subscription rate limiting,
circuit breakers, dead-letter replay, 30-day dual-sign rotation, a tenant-admin
dashboard surface, a public status page, full observability (Sentry + Vercel
Log Drains), and OpenAPI-first contracts for every new endpoint.

## Key contracts

- **F-72** (extended) — webhook subscription schema (adds `secret_v2`, rotation state, `rps_override`)
- **F-73** (extended) — webhook delivery schema (adds `replayed_from`, `dlq_at`, `dlq_reason`, `final_attempt`)
- **F-96** — fleet metrics (`/api/tenant/webhooks/fleet-metrics`)
- **F-97** — rotation API (`/api/tenant/webhooks/subscriptions/{sub_id}/rotate|rollback|finalize`)
- **F-98** — DLQ replay (single + batch)
- **F-99** — public status page (`/api/public/webhooks/status`, no auth, 60s cache)
- **F-100** — breaker + rate-limit read surface (RateLimitState + BreakerState)

## Key decisions (16 locked in DISCUSS.md)

- D-01 event types expanded incrementally; `x-markos-event` header carries name
- D-05 DLQ replay: admin-initiated (single + batch), never auto-retry
- D-06 replay signs with fresh HMAC + current timestamp; NO original-sig reuse (300s skew defense)
- D-07 replay only from `status='failed'`; no auto-retry loops
- D-08 7-day DLQ retention window
- D-09..D-12 rotation (30-day grace, dual-sign shape, T-7/T-1/T-0 notification, post-grace hard purge)
- D-13 plan-tier RPS caps (free 10 / team 60 / enterprise 300); override may only LOWER
- D-14 breaker trip threshold (50% failures over 20-sample sliding window)
- D-15 breaker half-open exponential backoff
- D-16 durability: Supabase + Vercel Queues replaces the 200-03 in-memory singleton

## Surfaces

- **Surface 1** `/settings/webhooks` — workspace shell; fleet metrics hero + subscriptions table + Create CTA
- **Surface 2** `/settings/webhooks/[sub_id]` — workspace shell; Deliveries / DLQ / Settings tabs
- **Surface 3** `/status/webhooks` — **standalone** (no shell); public, 60s cache, platform-wide hero numbers
- **Surface 4** global-rotation-banner — injected into tenant-admin layout shell during rotation grace

## Canonical references

Per `.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md` canonical_refs:

- `.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md` — phase scope + locked decisions
- `.planning/phases/203-webhook-subscription-engine-ga/203-CONTEXT.md` — D-01..D-16 rationale
- `.planning/phases/203-webhook-subscription-engine-ga/203-UI-SPEC.md` — all 4 surface specs
- `.planning/phases/203-webhook-subscription-engine-ga/203-RESEARCH.md` — pitfalls + code patterns
- `.planning/phases/203-webhook-subscription-engine-ga/203-01..10-SUMMARY.md` — per-plan shipping manifests
- `.planning/phases/200-saas-readiness-wave-0/200-03-webhooks-SUMMARY.md` — primitive lineage
- `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` — inherited 15 quality gates
- `contracts/F-72-webhook-subscription-v1.yaml` through `contracts/F-100-webhook-breaker-v1.yaml`
- `obsidian/brain/MarkOS Canon.md` — cross-project truth

## Migrations

- `72_markos_webhook_dlq_and_rotation.sql` — DLQ columns + rotation ledger + fleet-metrics view

## Cron entries (vercel.ts)

- `30 3 * * *` — `webhooks-dlq-purge` (7-day retention enforcement)
- `0 9 * * *` — `webhooks-rotation-notify` (T-7/T-1/T-0 emails + banners)

## Docs

- [Subscriber integration](/docs/webhooks)
- [Rotation](/docs/webhooks/rotation)
- [DLQ](/docs/webhooks/dlq)
- [Public status page](/docs/webhooks/status)

## See also

- [Phase 202 MCP LLM summary](./phase-202-mcp.md)
- [Phase 201 Tenancy LLM summary](./phase-201-tenancy.md)
