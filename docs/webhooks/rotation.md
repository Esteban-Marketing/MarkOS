# Webhook Secret Rotation

MarkOS webhook subscriptions support 30-day **dual-sign rotation** so subscribers
have a safe window to update their verification secret without downtime.

> **Canonical references:** decisions D-09 (rotation cadence), D-10 (dual-sign
> grace shape), D-11 (notification schedule), and D-12 (post-grace purge) are
> locked in [Phase 203 DISCUSS.md](https://github.com/estebanooortz/markos/blob/main/.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md)
> and cited in `.planning/phases/203-webhook-subscription-engine-ga/203-CONTEXT.md`
> canonical_refs. Pattern follows Stripe's industry-standard rotation UX.

## When to rotate

- **Credentials leaked** — rotate immediately, skip the 30-day grace if you trust
  the new key and can cut subscribers over within 24h.
- **Compliance cadence** — SOC 2 recommends quarterly rotation for signing keys.
- **Team change** — after a developer with access to the secret leaves the team.

## 30-day grace mechanics

1. **Admin clicks Rotate** in `/settings/webhooks/[sub_id]` → Settings tab → Signing Secret panel.
2. MarkOS generates a new `secret_v2` and writes both to the subscription row.
3. Every delivery during the next 30 days carries BOTH:
   - `x-markos-signature-v1` (current `secret`)
   - `x-markos-signature-v2` (new `secret_v2`)
   ...sharing a single `x-markos-timestamp`.
4. Subscribers verify against either V1 or V2 during the grace window.
5. On day 30, MarkOS promotes `secret_v2` to `secret` and **hard-deletes** the old
   value (D-12 — unrecoverable after grace closes).

## Notification schedule

| Checkpoint | Channel | Copy |
|---|---|---|
| T-7 days | Email to tenant owner + dashboard banner | "Secret rotation finalizes in 7 days. Update your subscriber to use the new secret." |
| T-1 day  | Email + dashboard banner (elevated) | "Secret rotation finalizes in 24 hours. Rollback no longer possible after T-0." |
| T-0      | Email + dashboard banner cleared | "Rotation complete. The previous secret has been purged." |

See `lib/markos/webhooks/rotation-notify.cjs` (Plan 203-06) + cron entry in
`vercel.ts`.

## Rollback

Rollback is possible **any time within the 30-day grace window**. In `/settings/webhooks/[sub_id]`:

1. Click Rollback in the Signing Secret panel.
2. `secret_v2` is discarded; `secret` (original) stays in force.
3. Deliveries stop emitting `x-markos-signature-v2` on the next dispatch.
4. After grace closes, rollback is impossible — the old secret has been purged.

## Subscriber implementation hint

During grace, always try V1 first; fall through to V2 only when V1 fails. Keep
your NEW secret in staging/production until the T-0 notification clears, then
you may remove the old value:

```javascript
if (verify(OLD_SECRET, body, v1, ts)) return 'v1';
if (v2 && verify(NEW_SECRET, body, v2, ts)) return 'v2';
return 'invalid';
```

## Related

- [webhooks.md](../webhooks.md) — signature verification snippets
- [dlq.md](./dlq.md) — DLQ behavior during rotation-induced failures
- F-97 `contracts/F-97-webhook-rotation-v1.yaml` — rotation API contract
