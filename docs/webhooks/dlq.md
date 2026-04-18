# Webhook Dead-Letter Queue (DLQ)

When a delivery fails 24 times in a row, MarkOS moves it into the tenant's DLQ
where an admin can inspect, triage, and replay.

> **Canonical references:** decisions D-05 (single + batch replay CTAs),
> D-06 (replay signs with fresh HMAC + current timestamp — no original-sig reuse),
> D-07 (no auto-retry loops — replay only from `status='failed'`), and D-08
> (7-day retention window) are locked in
> [Phase 203 DISCUSS.md](https://github.com/estebanooortz/markos/blob/main/.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md)
> and cross-referenced in `.planning/phases/203-webhook-subscription-engine-ga/203-CONTEXT.md`
> canonical_refs.

## What lands in the DLQ

A delivery is flagged as DLQ when:

- `attempt >= 24` (exponential backoff: 5s → 24h across ~7 days)
- **AND** the subscriber has not returned a 2xx on the final attempt

The row transitions to `status='failed'` with `dlq_at = now()` and a `dlq_reason`
(`ssrf_blocked:*`, `http_5xx`, `timeout`, `rate_limit_exhausted`, or similar).

## 7-day retention

Failed deliveries stay queryable for **7 days** after `dlq_at`. After that the
daily purge cron (`api/cron/webhooks-dlq-purge.js`, scheduled `30 3 * * *`)
hard-deletes them and emits a system-scope audit row `source_domain='webhooks' +
action='dlq.purged' + tenant_id='system'`. The audit row is retained forever.

## Single replay (row-level)

In `/settings/webhooks/[sub_id]` → Deliveries tab → click a failed row to expand
→ click Replay. The system:

1. Reads the original `body` (raw bytes).
2. Inserts a NEW delivery row with `replayed_from` pointing at the original
   and `attempt=0`.
3. Signs with a fresh HMAC + current timestamp (D-06 prevents replay-attack
   via the 300s skew window).
4. Re-dispatches through Vercel Queues.
5. Adds `x-markos-replayed-from` header so subscribers can correlate with their
   own logs.

## Batch replay (DLQ tab)

In `/settings/webhooks/[sub_id]` → DLQ tab → select up to **100 rows** → Replay.
The engine:

- Dedupes by `delivery_id`.
- Applies a 5-minute idempotency bucket — rapid re-clicks inside the window
  produce identical queue idempotencyKeys, so Vercel Queues dedupes server-side
  (RESEARCH §Pitfall 7).
- Returns per-row outcomes: `replayed` vs. `skipped` with one of the codes:
  `not_found | not_failed | cross_tenant_forbidden | cross_subscription`.

## What replay is NOT

- **Not auto-retry (D-07).** MarkOS will NEVER re-enqueue a DLQ row on its own.
  All replay is tenant-admin initiated.
- **Not a re-send of the original signature.** Every replay carries a fresh
  HMAC + current timestamp. Subscribers that verify against a stored timestamp
  WILL see a different value.
- **Not indefinite.** After 7 days, the row is purged along with its body.

## API surface (F-98)

- `POST /api/tenant/webhooks/subscriptions/{sub_id}/deliveries/{delivery_id}/replay`
  — single-row replay.
- `POST /api/tenant/webhooks/subscriptions/{sub_id}/dlq/replay`
  — batch replay; body `{ delivery_ids: string[] }` (max 100).

See `contracts/F-98-webhook-dlq-v1.yaml` for the full contract.

## Related

- [webhooks.md](../webhooks.md) — subscriber integration & header reference
- [rotation.md](./rotation.md) — how rotation interacts with in-flight DLQ rows
- [status.md](./status.md) — public status page shows aggregate DLQ counts
