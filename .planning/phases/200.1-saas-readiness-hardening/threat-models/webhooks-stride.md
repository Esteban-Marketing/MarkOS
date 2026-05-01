# STRIDE Threat Model - Webhooks

**Phase:** 200.1-saas-readiness-hardening
**Domain scope:** `api/webhooks/*`, `lib/markos/webhooks/*`, migration 70 substrate, outbound delivery to third-party receivers
**Authored:** 2026-04-29
**Last reviewed:** 2026-04-29

## Trust boundaries

| Boundary | Description |
|----------|-------------|
| tenant -> subscribe API | Untrusted tenant input proposes a receiver URL and event set. |
| subscribe API -> database | Validated subscription rows cross into tenant-scoped persistence. |
| delivery worker -> public internet | Signed payloads leave MarkOS and cross an untrusted network. |
| delivery worker -> redirect target | A receiver may redirect to an unexpected destination mid-dispatch. |
| delivery worker -> secret store | Signing requires privileged secret access after Phase 200.1-06. |

## Assumptions and scope notes

- Webhook delivery remains outbound-only; receivers never call back into privileged internal APIs.
- Tenant identity is derived from auth context, not request body fields.
- Delivery rows are immutable evidence after dispatch except for retry-state transitions.
- Replay resistance is treated as a platform control, not a receiver responsibility.
- Secret rotation and nonce retention are phase-owned hardening controls, not optional add-ons.
- Future follow-up items stay documented in Phase 200.1 plan files even when implementation is deferred.

## Threat register

### Spoofing

Scope notes:
- Primary surface: subscription creation and outbound receiver trust.
- Primary mitigations: `200.1-01`, `200.1-05`, `200.1-06`.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-webhooks-S-01 | A caller forges tenant identity at subscribe time to create a cross-tenant receiver. | Tenant context is resolved server-side and Phase 200 membership-backed RLS remains in force; `200.1-01` keeps the hardened URL path inside the same subscribe flow. | low | `api/webhooks/subscribe.js` |
| T-200.1-webhooks-S-02 | A receiver hostname is spoofed through DNS rebinding or mixed-resolution answers. | `200.1-01` adds `url-validator.cjs` with deny-list filtering, multi-answer inspection, and pinned-IP dispatch. | low | `node --test test/webhooks/url-validator.test.js` |
| T-200.1-webhooks-S-03 | An attacker forges webhook signatures after secret disclosure or stale key reuse. | `200.1-06` moves secrets to Vault and rotation becomes a first-class endpoint; Phase 203 dual-sign overlap remains bounded by rotation policy. | low | `200.1-06-PLAN.md` |

### Tampering

Scope notes:
- Primary surface: payload integrity, row mutation, and replay of captured deliveries.
- Primary mitigations: `200.1-05` plus existing HMAC signing.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-webhooks-T-01 | Payload content is modified in transit between MarkOS and the receiver. | Existing HMAC signing stays in place; `200.1-05` strengthens the signed material with nonce and freshness data. | low | `lib/markos/webhooks/signing.cjs` |
| T-200.1-webhooks-T-02 | Stored webhook URLs or event arrays are edited outside tenant authority. | Migration 70 RLS policies keep mutations tenant-scoped and Phase 200.1 leaves that boundary intact. | low | `supabase/migrations/70_markos_webhook_subscriptions.sql` |
| T-200.1-webhooks-T-03 | A captured valid delivery is replayed to a receiver to tamper with state twice. | `200.1-05` introduces nonce persistence plus a 300-second freshness window so replay attempts fail deterministically. | low | `200.1-05-PLAN.md` |

### Repudiation

Scope notes:
- Primary surface: proving who subscribed, rotated, replayed, or received webhook activity.
- Primary mitigations: audit rows and delivery-log persistence.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-webhooks-R-01 | A tenant disputes having created a subscription. | Subscribe and unsubscribe flows already emit `source_domain='webhooks'` audit rows; Phase 200.1 preserves this path while hardening the inputs. | low | `lib/markos/webhooks/engine.cjs` |
| T-200.1-webhooks-R-02 | An operator rotates a secret and later denies it occurred. | `200.1-06` requires an inline audit emit before the rotate-secret response completes. | low | `200.1-06-PLAN.md` |
| T-200.1-webhooks-R-03 | A receiver disputes that a delivery attempt happened at all. | Delivery rows persist attempt count, response status, and error state across retries and final failure. | low | `lib/markos/webhooks/delivery.cjs` |

### Information Disclosure

Scope notes:
- Primary surface: outbound SSRF, secret storage, and log exposure.
- Primary mitigations: `200.1-01` and `200.1-06`.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-webhooks-I-01 | SSRF exposes cloud metadata or internal services through attacker-controlled URLs. | `200.1-01` denies `169.254.169.254`, RFC1918 ranges, loopback, link-local, and denied protocols before subscribe and before dispatch. | low | `node --test test/webhooks/url-validator.test.js` |
| T-200.1-webhooks-I-02 | Plaintext HMAC secrets are exposed through database reads or snapshots. | `200.1-06` backfills to Supabase Vault, stores `secret_vault_ref`, and drops the plaintext column. | low | `200.1-06-PLAN.md` |
| T-200.1-webhooks-I-03 | Secrets or payload bodies leak through logging and observability drains. | Existing webhook logging focuses on ids and status; `200.1-06` keeps secret reads inside the delivery worker and `200.1-09` adds attribute-only OTEL spans. | medium | `lib/markos/webhooks/log-drain.cjs` |

### Denial of Service

Scope notes:
- Primary surface: slow receivers, redirect loops, test-fire abuse, and replay-store growth.
- Primary mitigations: `200.1-01`, `200.1-05`, and existing breaker/rate-limit controls.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-webhooks-D-01 | Redirect loops or redirect chains exhaust worker time. | `200.1-01` enforces `DEFAULT_MAX_REDIRECTS = 3` and re-validates each redirect destination. | low | `lib/markos/webhooks/url-validator.cjs` |
| T-200.1-webhooks-D-02 | Replay-protection state grows without cleanup and degrades inserts. | `200.1-05` adds a purge cron and a `created_at` index to bound nonce-table growth. | low | `200.1-05-PLAN.md` |
| T-200.1-webhooks-D-03 | Test-fire or repeated delivery attempts amplify outbound cost during customer outage. | Existing webhook breaker, retry backoff, and dispatch gates stay in force; `200.1-09` later adds telemetry so abuse is visible quickly. | medium | `lib/markos/webhooks/breaker.cjs` |

### Elevation of Privilege

Scope notes:
- Primary surface: cross-tenant read/write paths and overly-trusted replay or demo flows.
- Primary mitigations: migration 70 RLS plus future secret and replay hardening.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-webhooks-E-01 | A tenant reads another tenant's subscription or delivery rows. | Migration 70 enforces membership-backed RLS on both tables and Phase 200.1 keeps those policies intact. | low | `supabase/migrations/70_markos_webhook_subscriptions.sql` |
| T-200.1-webhooks-E-02 | A stolen secret is used to impersonate privileged webhook traffic across rotation boundaries. | `200.1-06` rotates secrets on demand and `200.1-05` narrows replay lifetime with nonce validation. | low | `200.1-05-PLAN.md` |
| T-200.1-webhooks-E-03 | Test-fire output is treated as authoritative business state by a receiver. | The risk remains documented and isolated as follow-up `M8`; receiver guidance and a later 200.2 hardening patch own the stronger guard. | medium | `200.1-11-PLAN.md` |

## Control inventory

- `200.1-01` is the core SSRF, DNS-pin, and redirect-cap control.
- `200.1-05` owns freshness, nonce persistence, and replay cleanup.
- `200.1-06` owns secret encryption-at-rest and rotation.
- Existing Phase 203 controls still matter: breaker, retry backoff, log drain, sentry capture.
- Existing migration 70 RLS policies remain the tenant-isolation backbone.
- `200.1-09` later adds OTEL spans so delivery failures are observable without exposing payload bodies.

## Residual risk acceptance

| Risk | Severity | Owner | Acceptance rationale | Re-review trigger |
|------|----------|-------|----------------------|-------------------|
| T-200.1-webhooks-I-03 log leakage via future code drift | medium | platform | Current logging paths are id-only and secret-free, but new log lines could regress this. | Any edit under `lib/markos/webhooks/log-drain.cjs` or `delivery.cjs` |
| T-200.1-webhooks-D-03 outbound cost amplification during receiver outage | medium | platform | Breaker and retry caps already exist; OTEL follow-up adds clearer abuse visibility without blocking this phase. | Repeated DLQ spikes or breaker-open incidents |
| T-200.1-webhooks-E-03 test-fire event misuse | medium | platform | Explicitly documented follow-up `M8`; not silently accepted as closed in this phase. | Phase 200.2 hardening or receiver incident report |

## Review cadence

- Review with every webhook surface expansion or new event namespace.
- Revisit the deny-list when platform networking or egress model changes.
- Revisit replay protection if exactly-once delivery semantics become a product promise.
- Revisit Vault integration when connector or BYOD secrets reuse the same abstraction.
