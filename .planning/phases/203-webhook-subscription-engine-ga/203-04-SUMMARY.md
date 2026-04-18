---
phase: 203
plan: 04
subsystem: webhooks
tags: [wave-2, replay, dlq, signing, dual-sign, idempotency, D-06, D-07]
dependency-graph:
  requires:
    - 203-01 (Supabase adapters + Vercel Queues)
    - 203-02 (migration 72 replayed_from + dlq_at columns)
  provides:
    - "lib/markos/webhooks/signing.cjs::signPayloadDualSign"
    - "lib/markos/webhooks/replay.cjs::replaySingle + replayBatch + BATCH_CAP + IDEMPOTENCY_BUCKET_MS"
    - "POST /api/tenant/webhooks/subscriptions/{sub_id}/deliveries/{delivery_id}/replay"
    - "POST /api/tenant/webhooks/subscriptions/{sub_id}/dlq/replay"
    - "contracts/F-98-webhook-dlq-v1.yaml (2 replay paths + 5 error envelopes)"
    - "contracts/F-73-webhook-delivery-v1.yaml (extended with replayed_from + dlq_at + final_attempt + dlq_reason + outbound_headers block)"
  affects: [203-05, 203-08]
tech-stack:
  added: []
  patterns:
    - dual-sign-primitive
    - idempotency-bucket-dedup
    - defense-in-depth-cross-tenant-check
    - typed-error-code-to-http-mapping
    - block-form-yaml-tags
key-files:
  created:
    - "lib/markos/webhooks/replay.cjs"
    - "lib/markos/webhooks/replay.ts"
    - "api/tenant/webhooks/subscriptions/[sub_id]/deliveries/[delivery_id]/replay.js"
    - "api/tenant/webhooks/subscriptions/[sub_id]/dlq/replay.js"
    - "contracts/F-98-webhook-dlq-v1.yaml"
    - "test/webhooks/replay.test.js"
    - "test/webhooks/replay-idempotency.test.js"
    - ".planning/phases/203-webhook-subscription-engine-ga/deferred-items.md"
  modified:
    - "lib/markos/webhooks/signing.cjs"
    - "lib/markos/webhooks/signing.ts"
    - "test/webhooks/signing.test.js"
    - "contracts/F-73-webhook-delivery-v1.yaml"
    - "contracts/openapi.json"
    - "contracts/openapi.yaml"
decisions:
  - "signPayloadDualSign defensively requires v1Secret but allows v2Secret=null — returns V1+Timestamp only when not rotating; both V1+V2 share the SAME timestamp so subscribers can verify with either secret during the 30-day grace (D-10 foundation for Plan 203-05)."
  - "Replay library stores raw body only (no pre-signed HMAC blob); signing happens at delivery.cjs dispatch time so each attempt of each replay gets a CURRENT timestamp + fresh HMAC (D-06 prevents replay-attack via 300s skew window)."
  - "Batch idempotency uses 5-minute bucket = Math.floor(nowMs / 300_000) so rapid re-clicks inside the window produce the SAME key — Vercel Queues dedupes server-side (RESEARCH §Pitfall 7, T-203-04-04)."
  - "Defense-in-depth cross-tenant check in replaySingle on top of the .eq('tenant_id', ...) filter — any adapter drift that bypasses the filter surfaces as an explicit throw rather than silent success (T-203-04-02)."
  - "Typed error codes as Error messages (not_found, cross_tenant_forbidden, cross_subscription, not_failed, batch_too_large) with handler-layer code→HTTP mapping — keeps the library HTTP-agnostic and the handler thin."
  - "Skipped rows in replayBatch carry { original_id, reason } with reason in the same typed vocabulary — surfaces per-row outcomes for the UI toast without throwing."
  - "F-98 uses block-form tags (tags: \\n  - webhooks\\n  - tenant) because the repo's minimal YAML parser in scripts/openapi/build-openapi.cjs does not tokenize inline-array syntax. Pre-existing 35 paths from earlier phases still fail the tag test; logged to deferred-items.md per scope boundary."
metrics:
  duration_minutes: 32
  tasks_completed: 2
  tests_added: 13
  tests_total_green_in_plan: 32
  tests_total_green_full_suite: 143
  completed_date: "2026-04-18"
requirements: [WHK-01, QA-01, QA-02, QA-05]
---

# Phase 203 Plan 04: Webhook Delivery Replay + Dual-Sign Foundation

Wave-2 follow-up to 203-02 (schema substrate) + 203-03 (DLQ reads): ships the admin-triggered
**DLQ replay path** (single + batch) and the **signPayloadDualSign primitive** that Plan 203-05
will wire into outbound dispatch during rotation grace. Closes D-06 (fresh HMAC on replay) + D-07
(replay only from failed) + RESEARCH §Pitfall 7 (idempotency-bucket dedup) and delivers the
S2 DLQ tab's backing endpoints.

## What Shipped

### Task 1 — signPayloadDualSign + replay library (commits `d175def` RED → `a8f071b` GREEN)

**`lib/markos/webhooks/signing.cjs` + `.ts`** — added `signPayloadDualSign(v1Secret, v2Secret, body, now = Date.now)`.
Returns `{ headers: { 'X-Markos-Signature-V1', 'X-Markos-Signature-V2'?, 'X-Markos-Timestamp' } }`.
When `v2Secret` is null/undefined, V2 header is omitted — backwards-compatible with pre-rotation traffic.
Existing `signPayload` untouched; V1 output is **byte-for-byte identical** to `signPayload` when
called with the same `(secret, body, now)` tuple (verified by test 1c).

**`lib/markos/webhooks/replay.cjs` + `.ts`** — net-new library.
- `replaySingle(client, queue, { tenant_id, subscription_id, delivery_id, actor_id, deps })`
  fetches the original delivery via `.eq('id', did).eq('tenant_id', tid).maybeSingle()`,
  validates D-07 (`status === 'failed'`), inserts a new row `{ id: del_<uuid>, status: 'pending',
  attempt: 0, replayed_from: orig.id, body: orig.body (raw) }`, calls `queue.push(newRow.id)`,
  emits audit row with `source_domain='webhooks', action='delivery.replay_single'`.
- `replayBatch(client, queue, { tenant_id, subscription_id, delivery_ids, actor_id, deps })` —
  validates `BATCH_CAP = 100`, dedupes `delivery_ids`, returns `{ batch_id, count, replayed[],
  skipped[] }`. Skipped rows carry `{ original_id, reason }` rather than throwing. Calls
  `queue.push(newRow.id, { idempotencyKey: 'replay-{original_id}-{5min-bucket}' })` —
  `IDEMPOTENCY_BUCKET_MS = 300_000`.
- Typed errors: `not_found | cross_tenant_forbidden | cross_subscription | not_failed | batch_too_large`.
- Dual-export TS stub mirrors CJS behavior.

**`test/webhooks/signing.test.js`** — extended with 3 new tests (total 11). All 8 existing regression tests pass.
**`test/webhooks/replay.test.js`** — net-new, 11 tests: replaySingle happy path + cross_tenant_forbidden +
not_failed (D-07) + audit emission; replayBatch with idempotencyKey bucket + return shape + batch_too_large +
dedup + skipped collection + raw-body storage invariant + attempt=0 invariant.

**22/22 Task 1 tests green.**

### Task 2 — Tenant-admin endpoints + F-98 contract + F-73 extension (commits `428eff1` RED → `9104daa` GREEN)

**`api/tenant/webhooks/subscriptions/[sub_id]/deliveries/[delivery_id]/replay.js`** — mirrors
`api/tenant/mcp/sessions/revoke.js` (202-09) verbatim: POST-only gate, x-markos-user-id +
x-markos-tenant-id headers (401), `SELECT subscription.tenant_id` before delegating (403 on
mismatch), `replaySingle` delegate, typed-error→HTTP code mapper (`not_found → 404`,
`cross_tenant_forbidden → 403`, `cross_subscription → 400`, `not_failed → 409`, else `500`).
Returns `{ ok: true, original_id, new_id }`.

**`api/tenant/webhooks/subscriptions/[sub_id]/dlq/replay.js`** — batch handler. Body `{ delivery_ids: string[] }`;
400 `empty_batch` on zero, 400 `batch_too_large` on >100 (defense-in-depth — library also enforces).
Delegates to `replayBatch`; returns `{ ok, batch_id, count, replayed, skipped }`.

**`contracts/F-98-webhook-dlq-v1.yaml`** — net-new contract:
- 2 paths (single + batch replay) with full request/response schemas per status code.
- 5 error envelopes: `empty_batch` (400), `batch_too_large` (400), `cross_tenant_forbidden` (403),
  `not_failed` (409, D-07), `already_replayed` (409, documented for queue-dedup semantics).
- References F-73 delivery contract + plan + RESEARCH pitfall + CONTEXT decisions.
- Block-form tags so `parseContractYaml` tokenizes them as arrays.

**`contracts/F-73-webhook-delivery-v1.yaml`** — extended:
- `outbound_headers:` block documents `X-Markos-Signature-V1/V2`, `X-Markos-Timestamp`,
  `x-markos-replayed-from`, `x-markos-attempt`.
- `WebhookDelivery` schema gains `replayed_from`, `dlq_at`, `final_attempt`, `dlq_reason`
  (migration 72 columns from Plan 203-02).

**`contracts/openapi.json` + `.yaml`** — regenerated via `node scripts/openapi/build-openapi.cjs`.
60 F-NN flows (up from 59) merged into 87 paths (up from 85).

**`test/webhooks/replay-idempotency.test.js`** — 10 tests: auth 401 (2a), cross_tenant_forbidden
403 (2b), single happy 200 (2c), not_failed 409 (2d), empty_batch 400 (2e), batch_too_large 400
(2f), batch happy 200 (2g), **idempotencyKey stability across 5-min bucket (2h)**, F-98 path +
error-envelope declarations (2i), F-73 extension declarations (2j).

**10/10 Task 2 tests green.**

## Tests

| Suite                                    | File                                   | Tests     | Status       |
| ---------------------------------------- | -------------------------------------- | --------- | ------------ |
| Signing (8 existing + 3 new)             | `test/webhooks/signing.test.js`        | 11        | green        |
| Replay library                           | `test/webhooks/replay.test.js`         | 11        | green        |
| Replay endpoints + contracts             | `test/webhooks/replay-idempotency.test.js` | 10    | green        |
| **Full webhook regression**              | `test/webhooks/*.test.js`              | 143 + 2s  | green        |
| OpenAPI build                            | `test/openapi/openapi-build.test.js`   | 15/16     | 1 pre-existing tag gap (deferred) |

Plan-level new tests: **32 green, 0 red.** No existing webhook or Phase 202 suite broke.

## Performance

- **Started:** 2026-04-18T06:35:00Z (approx)
- **Completed:** 2026-04-18
- **Tasks:** 2
- **Files created:** 8
- **Files modified:** 6
- **Commits:** 4 (2 RED + 2 GREEN pairs)

| Metric | Before | After | Delta |
| --- | --- | --- | --- |
| F-NN flows | 59 | 60 | +1 (F-98) |
| openapi paths | 85 | 87 | +2 (replay endpoints) |
| webhook tests (pass + skip) | 124 + 2 | 143 + 2 | +19 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Relative-path depth for single-replay endpoint**

- **Found during:** Task 2 first test run (MODULE_NOT_FOUND from `../../../../../../lib/markos/crm/api.cjs`)
- **Issue:** The single-replay file lives at `api/tenant/webhooks/subscriptions/[sub_id]/deliveries/[delivery_id]/replay.js`
  — 7 path components from repo root, not 6. Initial require used 6 `../`; needed 7.
- **Fix:** `../../../../../../lib/...` → `../../../../../../../lib/...` across 3 require sites in that file only.
  The batch-replay file (6 components deep) kept 6 `../` correctly.
- **Files modified:** `api/tenant/webhooks/subscriptions/[sub_id]/deliveries/[delivery_id]/replay.js`
- **Commit:** `9104daa`

**2. [Rule 3 — Blocking] F-98 tags parsed as string instead of array**

- **Found during:** Task 2 openapi-build test run
- **Issue:** `tags: [webhooks, tenant]` in YAML was kept as literal string `"[webhooks, tenant]"`
  by `parseContractYaml`'s minimal parser — failed the `all path operations carry at least one tag` test.
- **Fix:** Converted F-98 `tags` to block form (`tags:\n  - webhooks\n  - tenant`). F-98 paths now contribute
  correctly. Delta on the failing test: 37 → 35 missing tags (all 35 remaining are pre-existing from
  earlier phases, logged to `deferred-items.md`).
- **Files modified:** `contracts/F-98-webhook-dlq-v1.yaml`
- **Commit:** `9104daa`

### Deferred (Out of Scope)

**Pre-existing `tags:` missing on 35 openapi paths** — inherited from Phases 201/202; see
`.planning/phases/203-webhook-subscription-engine-ga/deferred-items.md`. F-98 is NOT in
the offending set; this plan's delta to the failing-path count was `−2`, not `+2`.

## Threat Model Alignment

| Threat ID | Mitigation shipped |
|-----------|---------------------|
| T-203-04-01 Tampering (replay preserving original sig) | Library stores raw body; dispatch re-signs per attempt (D-06). `signPayload` callers all signed fresh; tests 1m/1n assert no baked signature on replay rows. |
| T-203-04-02 EoP cross-tenant replay | Handler SELECTs subscription first; library re-checks `orig.tenant_id !== tenant_id` after `.eq()` filter. Tests 2b + cross_subscription covered. |
| T-203-04-03 DoS batch replay | `BATCH_CAP = 100` enforced at handler + library. Test 2f + 1k. |
| T-203-04-04 Double-dispatch rapid-click | Vercel Queues `idempotencyKey = 'replay-{orig_id}-{5min-bucket}'`. Test 2h asserts key stability across two calls in same bucket. |
| T-203-04-05 Repudiation (no audit) | Both endpoints' handlers delegate to library, which emits `source_domain='webhooks', action='delivery.replay_(single|batch)'` via `enqueueAuditStaging`. Tests 1h + batch-level audit payload. |
| T-203-04-06 Disclosure (body in OpenAPI) | Accepted — F-98 declares by-ref to F-73 delivery schema; no secrets inline. |

## Known Stubs

None. All code paths are fully wired; `signPayloadDualSign` is a shipping primitive (Plan 203-05
wires the caller in dispatch), `replaySingle`/`replayBatch` have tenant-admin callers, and the
two endpoints route to production infrastructure when `WEBHOOK_STORE_MODE=supabase`.

## Downstream Unlocks

- **Plan 203-05 (secret rotation)** — can now wire `signPayloadDualSign(secret_v1, secret_v2, body)`
  into `delivery.cjs` during grace; primitive + test suite ready.
- **Plan 203-08 (dashboard UI)** — DLQ tab has row-level (single) and bulk (batch) replay endpoints
  to wire; both return typed shapes for toast + row updates.
- **Plan 203-09 (fleet metrics)** — `replayed_from` column (F-73 extension) lets the metrics view
  distinguish original vs replayed deliveries.

## Self-Check: PASSED

Verified files exist:
- `lib/markos/webhooks/signing.cjs` (extended)
- `lib/markos/webhooks/signing.ts` (extended)
- `lib/markos/webhooks/replay.cjs` (new)
- `lib/markos/webhooks/replay.ts` (new)
- `api/tenant/webhooks/subscriptions/[sub_id]/deliveries/[delivery_id]/replay.js` (new)
- `api/tenant/webhooks/subscriptions/[sub_id]/dlq/replay.js` (new)
- `contracts/F-98-webhook-dlq-v1.yaml` (new)
- `contracts/F-73-webhook-delivery-v1.yaml` (extended)
- `test/webhooks/signing.test.js` (extended)
- `test/webhooks/replay.test.js` (new)
- `test/webhooks/replay-idempotency.test.js` (new)

Verified commits:
- `d175def` test(203-04): add failing tests for signPayloadDualSign + replay library
- `a8f071b` feat(203-04): signPayloadDualSign + replay library (replaySingle + replayBatch)
- `428eff1` test(203-04): add failing tests for replay endpoints + F-98 + F-73 extensions
- `9104daa` feat(203-04): tenant-admin replay endpoints + F-98 + F-73 extension
