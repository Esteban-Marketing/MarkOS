# Public Webhook Status Page

MarkOS publishes a public, unauthenticated webhook status page at
**[/status/webhooks](https://markos.dev/status/webhooks)**.

> **Canonical references:** Surface 3 spec is locked in
> [203-UI-SPEC.md §Surface 3](https://github.com/estebanooortz/markos/blob/main/.planning/phases/203-webhook-subscription-engine-ga/203-UI-SPEC.md).
> The data shape + cache contract are declared in F-99
> (`contracts/F-99-webhook-status-v1.yaml`). Both are cross-referenced in the
> [Phase 203 DISCUSS.md](https://github.com/estebanooortz/markos/blob/main/.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md)
> canonical_refs list.

## What it shows

Four platform-wide rolled-up numbers across the last 24 hours:

| Metric | Meaning |
|---|---|
| **Deliveries 24h** | Total webhook deliveries attempted across every tenant. |
| **Success rate** | Percentage of attempts that returned 2xx (or 4xx treated as ACK) within 24h. |
| **Avg latency** | Mean round-trip latency (MarkOS dispatch → subscriber 2xx) in ms. |
| **DLQ count** | Current count of failed deliveries in the 7-day DLQ window. |

Plus a one-line status summary with three variants:

- **All systems operational.** — success_rate ≥ 99.9% AND dlq_count = 0
- **Some deliveries are being retried.** — success_rate ≥ 95%
- **Elevated failure rate.** — below 95%

## Cache + CDN

- **60-second cache** (`Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=60`).
- CDN-fronted; origin hits are proportional to cache warm-up, not traffic.
- No authentication required.
- CORS-open (`Access-Control-Allow-Origin: *`) so it can embed in third-party dashboards.

## What it does NOT show

- **No per-tenant metrics.** Data is aggregated platform-wide; no `tenant_id`
  appears in the response body (T-203-10-01 information-disclosure mitigation).
- **No per-subscription detail.** For that, tenant admins use
  `/settings/webhooks/[sub_id]` (Surface 2, workspace-shell, auth-required).

## Underlying API

```
GET https://markos.dev/api/public/webhooks/status
```

Response shape:

```json
{
  "total_24h": 12345,
  "success_rate": 0.988,
  "avg_latency_ms": 215,
  "dlq_count": 3,
  "last_updated": "2026-04-18T12:34:56.000Z"
}
```

Lineage matches Stripe's and Vercel's public status page patterns.

## Related

- F-99 contract: `contracts/F-99-webhook-status-v1.yaml`
- [webhooks.md](../webhooks.md) — subscriber integration
- [dlq.md](./dlq.md) — how DLQ count is calculated
- [rotation.md](./rotation.md) — how rotation events surface in success-rate dips
