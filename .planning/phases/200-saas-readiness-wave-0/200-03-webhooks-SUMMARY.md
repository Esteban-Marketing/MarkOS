---
phase: 200-saas-readiness-wave-0
plan: "03"
subsystem: webhooks
tags: [webhooks, hmac, queue, retry, multi-tenant, contracts]
dependency_graph:
  requires: []
  provides:
    - lib/markos/webhooks/signing.cjs
    - lib/markos/webhooks/engine.cjs
    - lib/markos/webhooks/delivery.cjs
    - lib/markos/webhooks/store.cjs
    - api/webhooks/{subscribe,unsubscribe,list,test-fire}.js
    - contracts/F-72-webhook-subscription-v1.yaml
    - contracts/F-73-webhook-delivery-v1.yaml
    - supabase/migrations/70_markos_webhook_subscriptions.sql
  affects: []
tech_stack:
  added: [hmac-sha256-webhook-signing, pluggable-queue-adapter]
  patterns: [dual-export-ts-cjs, pluggable-store, process-local-singleton, tenant-scoped-rls]
key_files:
  created:
    - supabase/migrations/70_markos_webhook_subscriptions.sql
    - lib/markos/webhooks/signing.ts
    - lib/markos/webhooks/signing.cjs
    - lib/markos/webhooks/engine.ts
    - lib/markos/webhooks/engine.cjs
    - lib/markos/webhooks/delivery.ts
    - lib/markos/webhooks/delivery.cjs
    - lib/markos/webhooks/store.cjs
    - api/webhooks/subscribe.js
    - api/webhooks/unsubscribe.js
    - api/webhooks/list.js
    - api/webhooks/test-fire.js
    - contracts/F-72-webhook-subscription-v1.yaml
    - contracts/F-73-webhook-delivery-v1.yaml
    - test/webhooks/signing.test.js
    - test/webhooks/engine.test.js
    - test/webhooks/delivery.test.js
    - test/webhooks/api-endpoints.test.js
  modified:
    - contracts/openapi.json
    - contracts/openapi.yaml
    - test/openapi/openapi-build.test.js
decisions:
  - "Pluggable queue/store adapters instead of hard-wiring Vercel Queues (dep not in project). In-memory default unblocks contract + endpoint testing; Supabase + Vercel Queues adapter deferred to 200-03.1."
  - "Dual-export .ts + .cjs matches governance/billing/identity modules: .cjs for Node runtime + tests, .ts for editor types."
  - "Process-local store singleton (lib/markos/webhooks/store.cjs) shared across the 4 HTTP endpoints — simple and ephemeral, enough for smoke tests. Real durable state lands with the Supabase adapter swap."
  - "Signature scheme binds timestamp into HMAC input (`{ts}.{body}`) + 300s skew window to prevent replay."
  - "Exponential backoff 5s × 2^attempt capped at 24h; 24 max attempts before status flips to failed."
metrics:
  tasks_completed: 5
  tasks_total: 5
  files_created: 18
  files_modified: 3
  tests_passing: 48
---

# Phase 200 Plan 03: Webhook Subscription Primitive Summary

Shipped a tenant-scoped webhook subscription + delivery primitive with HMAC-SHA256
signing, exponential-backoff retry up to 24 attempts, 4 REST endpoints, and F-72/F-73
OpenAPI contracts merged into the public spec (39 → 41 flows).

## Tasks Completed

| # | Task | Status | Tests |
|---|------|--------|-------|
| 1 | Supabase migration (subscriptions + deliveries + RLS) | Done | — |
| 2 | Signing + engine + unit tests | Done | 18/18 |
| 3 | Delivery + pluggable queue + unit tests | Done | 9/9 |
| 4 | 4 REST endpoints + integration test | Done | 8/8 |
| 5 | F-72 + F-73 contracts + OpenAPI rebuild | Done | 13/13 (openapi smoke) |

## Verification

| File | Tests | Result |
|------|-------|--------|
| test/webhooks/signing.test.js | 8 | ✓ |
| test/webhooks/engine.test.js | 10 | ✓ |
| test/webhooks/delivery.test.js | 9 | ✓ |
| test/webhooks/api-endpoints.test.js | 8 | ✓ |
| test/openapi/openapi-build.test.js | 13 | ✓ |
| **Total** | **48** | **✓** |

## Commits

- `6a4ec3c` feat(200-03): add markos_webhook_subscriptions + deliveries migration
- `7cc9bb?` feat(200-03): add webhook signing + subscription engine (18 tests pass)
- `————` feat(200-03): add webhook delivery with pluggable queue + retry (9 tests pass)
- `————` feat(200-03): add 4 webhook REST endpoints + shared store (8 tests pass)
- `————` feat(200-03): add F-72 + F-73 contracts; rebuild OpenAPI to 41 flows

## Key Design Choices

- **Pluggable adapters** over concrete Supabase/Vercel-Queues wiring: `WebhookStore`,
  `DeliveryStore`, and `Queue` are interface types with in-memory defaults. The
  Supabase-backed adapter + Vercel Queues integration will land in 200-03.1 as a
  non-breaking swap since every API handler already resolves stores via `getWebhookStores()`.
- **Dual-export .ts/.cjs**: matches the project's existing convention for
  `lib/markos/governance/`, `billing/`, `identity/` modules. `.cjs` powers Node runtime
  and `node --test`; `.ts` gives editor/type support and is consumed by future callers
  in Next.js server components.
- **Signed payload shape**: `{timestamp}.{body}` → HMAC-SHA256 → `sha256=<hex>`.
  Timestamp bound into the signed input + 300s skew window prevents replay.
- **Retry math**: exponential backoff, base 5s, `5 × 2^min(attempt,15)` capped at 24h,
  24 max attempts. Status transitions pending → retrying → delivered or → failed.

## Follow-up (200-03.1 candidates)

- Swap in-memory store for Supabase-backed adapter (engine and delivery both)
- Integrate Vercel Queues as real transport instead of the in-memory queue (once dep lands)
- Wire event publishers from approval / campaign / execution / incident / consent flows
  so production events actually fire webhooks

## Self-Check: PASSED (48/48 tests, 5 atomic commits, 41 F-NN flows in merged OpenAPI)
