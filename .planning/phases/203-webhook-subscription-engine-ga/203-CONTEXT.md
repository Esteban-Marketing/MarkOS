# Phase 203: Webhook Subscription Engine GA - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Graduate the 200-03 webhook primitive (HMAC signing, pluggable queue adapter, 4 endpoints, migration 70) to GA: tenant-admin dashboard (`/settings/webhooks`), DLQ with replay, signing-secret rotation with 30-day grace, per-subscription rate limits with circuit breaker, webhook status page, telemetry to Sentry.

Out of scope: custom payload transformations (deferred to Phase 210 connector framework per DISCUSS.md).

</domain>

<decisions>
## Implementation Decisions

### Dashboard UX (`/settings/webhooks`)

- **D-01:** Subscription list is a **table** — columns: URL, events, status, last delivery, success rate, actions. Mirrors `/settings/mcp` sessions table pattern from 202-09.
- **D-02:** Delivery log uses **inline row expand** — click delivery row → expand shows request/response/headers inline. No drawer, no separate page. Keeps context.
- **D-03:** DLQ pane lives as a **tab on each sub's detail** — `Deliveries | DLQ | Settings` tabs. Scoped to the sub where the problem exists.
- **D-04:** Fleet metrics render as a **hero banner on the index** — 4 hero numbers (24h deliveries / success % / avg latency / DLQ count). Mirrors cost-meter hero from `/settings/mcp`.

### DLQ + Replay

- **D-05:** Replay supports **single + batch select** — checkbox rows → Replay button, plus single-row replay. No time-range filter (deferred).
- **D-06:** Replay **re-signs with fresh HMAC + current timestamp**. Adds headers `x-markos-replayed-from: {original_ts}` and `x-markos-attempt: {n}` for subscriber audit. Original signature/ts NOT preserved (would force bypassing the 300s skew window from 200-03 — replay-attack vector).
- **D-07:** **No auto-retry from DLQ.** DLQ is terminal after the 24-attempt cap (from 200-03). Replay is always human-triggered. Prevents replay→fail→replay loops.
- **D-08:** **DLQ TTL: 7 days.** Matches Stripe/GitHub replay windows. After 7 days entries are purged from DLQ storage.

### Signing-Secret Rotation

- **D-09:** Rotation is **admin-triggered only** — tenant admin clicks Rotate. No scheduler. SOC2 expects human-in-loop on secret events.
- **D-10:** Overlap window uses **outbound dual-sign** — during the 30-day grace both secrets sign every webhook. Two headers: `x-markos-signature-v1` (current) + `x-markos-signature-v2` (new). Subscribers verify either. Stripe pattern.
- **D-11:** Notifications at **T-7 + T-1 + T-0 via email to tenant admins** plus dashboard banner during grace. Covers async teams, prevents 401 surprise.
- **D-12:** **Rollback = promote old secret back to active** during the 30-day grace window only. After grace, old secret is purged and unrecoverable. No emergency-restore post-grace (security: secrets never live forever).

### Rate-Limit + Circuit Breaker

- **D-13:** Per-subscription RPS: **plan-tier default + per-sub override (cap, not raise)** — Free 10rps, Team 60rps, Enterprise 300rps. Tenant admin may lower per-sub; cannot exceed plan ceiling. Shares `@upstash/ratelimit` sliding-window instance with 202-04 pipeline.
- **D-14:** Circuit breaker trips on **error-rate window**: >50% of last 20 deliveries fail (5xx or timeout). Sliding window survives single-deploy blips.
- **D-15:** Half-open re-probe uses **exponential backoff 30s → 1m → 2m → 5m → 10m, capped at 10m**. Aligns with existing 200-03 delivery-retry shape.

### Store Adapter

- **D-16:** **Swap in-memory store → Supabase (durable state) + Vercel Queues (delivery queue) in Wave 1** — per 200-03.1 deferred note. Process-local singleton won't survive Vercel Fluid concurrency across instances. All GA features (DLQ, dashboard, rotation, metrics) need durable state; swap first, build features on it. Avoids double-migrate.

### Claude's Discretion

- Internal telemetry schema for Sentry (req_id, sub_id, event_type, delivery_attempt, duration_ms, outcome) — match 202-05 log-drain shape.
- Test-fire flow visual (button placement, payload preview) — follow 200-03 `test-fire.js` endpoint contract.
- Egress SSRF guard for subscriber URLs (DNS rebinding, private-IP block, localhost deny) — standard implementation.
- Event-type filtering at subscribe time — reuse existing `events: string[]` from migration 70 schema.
- Public webhook status page shape (covered by fleet metrics hero; public version = same numbers without per-sub detail).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 203 discussion inputs
- `.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md` — phase-level scope, pre-locked decisions, success criteria, threat-model focus
- `obsidian/thinking/2026-04-16-markos-saas-roadmap.md` — roadmap synthesis document
- `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` — all 15 quality gates apply to 203

### Existing webhook primitive (200-03 output)
- `.planning/phases/200-saas-readiness-wave-0/200-03-webhooks-PLAN.md` — primitive plan
- `.planning/phases/200-saas-readiness-wave-0/200-03-webhooks-SUMMARY.md` — shipped artifacts + decisions
- `lib/markos/webhooks/signing.cjs` — HMAC-SHA256 signing (ts+body bind, 300s skew window)
- `lib/markos/webhooks/engine.cjs` — delivery engine + 24-attempt exponential backoff
- `lib/markos/webhooks/delivery.cjs` — delivery worker
- `lib/markos/webhooks/store.cjs` — process-local singleton (swap target — D-16)
- `api/webhooks/subscribe.js`, `api/webhooks/unsubscribe.js`, `api/webhooks/list.js`, `api/webhooks/test-fire.js`
- `supabase/migrations/70_markos_webhook_subscriptions.sql` — subscriptions table
- `contracts/F-72-webhook-subscription-v1.yaml` — subscription contract (extend for rotation + RPS override)
- `contracts/F-73-webhook-delivery-v1.yaml` — delivery contract (extend for DLQ + replay headers)

### Prior-phase patterns to reuse
- `.planning/phases/202-mcp-server-ga-claude-marketplace/202-09-SUMMARY.md` — `/settings/mcp` dashboard pattern (mirror for `/settings/webhooks`)
- `lib/markos/mcp/rate-limit.cjs` — Upstash sliding-window + plan-tier caps (reuse instance for D-13)
- `lib/markos/mcp/log-drain.cjs` + `lib/markos/mcp/sentry.cjs` — Sentry correlation_id + req_id envelope from 202-05
- `lib/markos/audit/writer.cjs` — AUDIT_SOURCE_DOMAINS; add `'webhook'` for rotation + replay audit events
- `app/(markos)/settings/mcp/page.tsx` + `.module.css` — UI convention reference
- `api/tenant/mcp/usage.js`, `api/tenant/mcp/sessions/revoke.js` — API handler pattern for tenant-scoped actions

### Cross-project canon (from DISCUSS.md References)
- `obsidian/brain/MarkOS Canon.md`
- `obsidian/brain/Target ICP.md` — seed-to-A B2B SaaS + modern DTC + solopreneurs
- `obsidian/brain/Brand Stance.md` — developer-native, AI-first, quietly confident
- `obsidian/reference/MarkOS Codebase Atlas.md`

### Required migrations (planned)
- `supabase/migrations/72_markos_webhook_dlq_and_rotation.sql` — DLQ columns on webhook_deliveries + secret_rotations table

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`lib/markos/webhooks/*`** — signing, engine, delivery, store already shipped. Extend, don't rebuild.
- **`lib/markos/mcp/rate-limit.cjs`** — Upstash sliding-window with plan-tier caps. D-13 shares instance; ratelimit keys: `rl:webhook:sub:{sub_id}`.
- **`lib/markos/mcp/log-drain.cjs` + `sentry.cjs`** — 202-05 observability wiring. Webhook delivery emits same shape.
- **`app/(markos)/settings/mcp/page.tsx`** — visual reference for `/settings/webhooks` page (table + hero banner + tab layout).
- **`lib/markos/audit/writer.cjs`** — AUDIT_SOURCE_DOMAINS allowlist. Add `'webhook'` before logging rotation + DLQ replay events.
- **`api/.well-known/oauth-protected-resource.js` pattern** — `/api/.well-known/webhooks` status document (public status page uses this convention).
- **`@upstash/redis` + `@upstash/ratelimit`** already in package.json from 202-03/04.

### Established Patterns
- **Dual-export (.cjs + .ts)** — every webhook lib module must export both (matches governance/billing/identity/mcp modules).
- **Tenant-scoped RLS** — all new tables MUST have tenant_id + RLS policies (established across 200/201/202).
- **Atomic RPC for budget/rate state** — `check_and_charge_mcp_budget` pattern from 202-03; webhooks' RPS cap uses same atomic-RPC approach to prevent race-double-spend.
- **Contracts as source of truth** — F-72, F-73 YAML updated BEFORE implementation; OpenAPI regen via existing `scripts/openapi/build-mcp-schemas.mjs`.
- **TDD RED → GREEN per task** — every executor follows (202 regression = 362/362 green).
- **Bearer + req_id envelope** — all new tenant-admin APIs (from 202-05).
- **`--no-verify` commits in parallel waves** — orchestrator validates hooks after.

### Integration Points
- **`/settings` sidebar** — add Webhooks entry alongside existing MCP link.
- **Sentry `sentry.server.config.ts`** — extend `beforeSend` to capture webhook tags.
- **`vercel.ts` crons** — add DLQ purge cron (daily) + rotation T-7/T-1 notification cron (daily).
- **Audit writer** — extend `AUDIT_SOURCE_DOMAINS` to include `'webhook'` (13th entry).
- **Plan-tier resolver** — reuse from 202-03 cost-table plan-tier caps pattern.

</code_context>

<specifics>
## Specific Ideas

- Dashboard visual lineage: `/settings/mcp` (202-09) is the reference. Match table density, hero banner, tab layout, CSS module pattern.
- Rotation pattern canon: Stripe's webhook signing-secret rotation (dual-sign + grace window + email). Signal: "standard Stripe pattern" invoked explicitly in D-10.
- DLQ terminology + 7-day TTL: Stripe/GitHub webhook retry windows as precedent.
- Circuit-breaker + half-open pattern: standard resilience idiom; implementation should follow Release It! / Netflix Hystrix shape.

</specifics>

<deferred>
## Deferred Ideas

- **Custom payload transformations** — Phase 210 connector framework (pre-declared out-of-scope in DISCUSS.md).
- **Time-range replay filter** — single + batch select covers 90% (D-05). Power-user feature deferred.
- **Auto-rotation scheduler (90-day rotate)** — admin-triggered only for now (D-09). Revisit if SOC2 Type 2 compliance demands.
- **Compromise-triggered rotation** — needs anomaly-detection signal source, not in this phase.
- **Post-grace secret restore** — security anti-pattern, explicitly rejected in D-12.
- **Per-sub auto-drain on circuit close** — opt-in flag deferred; manual-only replay for now (D-07).

</deferred>

---

*Phase: 203-webhook-subscription-engine-ga*
*Context gathered: 2026-04-17*
