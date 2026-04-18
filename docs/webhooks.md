# MarkOS Webhooks — Subscriber Integration Guide

MarkOS webhooks deliver signed, idempotent HTTP callbacks to your endpoint on
domain events (CRM updates, approvals, pipeline transitions, and more). This guide
describes the contract subscribers must implement to accept, verify, and acknowledge
MarkOS webhook deliveries.

> **Canonical references:** This guide cites the locked decisions in the
> [Phase 203 DISCUSS.md](https://github.com/estebanooortz/markos/blob/main/.planning/phases/203-webhook-subscription-engine-ga/DISCUSS.md)
> and the 200-03 `SUMMARY.md` (subscription primitive lineage). See the
> canonical_refs block in `.planning/phases/203-webhook-subscription-engine-ga/203-CONTEXT.md`
> for the full list.

## Overview

- **Events published**: `crm.deal.updated`, `crm.contact.created`, `approval.requested`,
  `approval.granted`, `approval.revoked`, `pipeline.completed`, and more — see the
  OpenAPI `x-markos-flows` index at `/api/openapi.json`.
- **Signing**: HMAC-SHA256 of `${timestamp}.${body}` with the subscription secret.
- **Retries**: up to 24 attempts with exponential backoff (5s → 24h).
- **Rotation**: 30-day dual-sign grace window when a secret is rotated.
- **DLQ**: failed deliveries retained for 7 days; tenant admins can replay via the
  dashboard or API.

## Headers on every delivery

| Header | Meaning |
|---|---|
| `x-markos-event` | Event name (e.g. `crm.deal.updated`). |
| `x-markos-timestamp` | Unix seconds, bound into the signature. |
| `x-markos-signature-v1` | HMAC-SHA256 with your current subscription secret. |
| `x-markos-signature-v2` | **Only during the 30-day rotation grace window.** HMAC-SHA256 with your NEW secret. |
| `x-markos-attempt` | 1-indexed attempt counter; value goes up with each retry. |
| `x-markos-replayed-from` | Present only when an admin replayed a DLQ delivery — identifies the original `delivery_id`. |

## Verify signatures (Node.js)

```javascript
const crypto = require('node:crypto');

function verify(secret, body, signature, timestamp) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) return false; // 5-min skew window (D-06)
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false; // length mismatch → invalid
  }
}

// In your request handler:
const v1 = req.headers['x-markos-signature-v1'];
const v2 = req.headers['x-markos-signature-v2']; // only during rotation grace
const ts = req.headers['x-markos-timestamp'];
const body = rawBody.toString('utf8'); // MUST be raw bytes — no JSON.parse-then-stringify!

if (verify(SECRET, body, v1, ts) || (v2 && verify(NEW_SECRET, body, v2, ts))) {
  // Accept the delivery
  res.status(200).send('ok');
} else {
  res.status(401).send('invalid_signature');
}
```

## Verify signatures (Python)

```python
import hmac, hashlib, time

def verify(secret: bytes, body: bytes, signature: str, timestamp: str) -> bool:
    now = int(time.time())
    if abs(now - int(timestamp)) > 300:  # 5-min skew window
        return False
    expected = 'sha256=' + hmac.new(secret, f"{timestamp}.{body.decode()}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)
```

## Verify signatures (Go)

```go
import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
  "strconv"
  "time"
)

func verify(secret, body []byte, signature, timestamp string) bool {
  ts, err := strconv.ParseInt(timestamp, 10, 64)
  if err != nil { return false }
  if abs64(time.Now().Unix() - ts) > 300 { return false }
  mac := hmac.New(sha256.New, secret)
  mac.Write([]byte(timestamp + "." + string(body)))
  expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
  return hmac.Equal([]byte(signature), []byte(expected))
}
```

## Responding to deliveries

| Response | MarkOS behavior |
|---|---|
| `2xx` | Delivery marked `delivered`. Stops retrying. |
| `4xx` (except 429) | MarkOS treats as subscriber ACK (your 4xx is a conscious rejection; we do NOT retry). |
| `429` | Honored as backpressure; MarkOS retries after exponential backoff. |
| `5xx` or timeout | Retry with exponential backoff; up to 24 attempts over ~7 days. |
| No response (timeout) | Treated as `5xx`. |

## Durability & idempotency

- **At-least-once delivery.** Your handler MUST be idempotent keyed on `id` from the
  payload. A delivery may arrive more than once (retry, replay, or the 24-attempt
  bound during transient failures).
- **Body is the source of truth.** Re-sign `${timestamp}.${rawBody}`, not a
  parsed-then-reserialized view.
- **Replayed deliveries** carry `x-markos-replayed-from` — you can log this for your
  own audit trail without treating it as a new event.

## Rotation, DLQ, and status

- Rotation: see [rotation.md](./webhooks/rotation.md)
- DLQ: see [dlq.md](./webhooks/dlq.md)
- Public status page: see [status.md](./webhooks/status.md)

## Links

- OpenAPI: `/api/openapi.json` (F-72, F-73, F-96..F-100 cover the webhook surface)
- Phase 203 LLM overview: [phase-203-webhooks](./llms/phase-203-webhooks.md)
