---
phase: 203
slug: webhook-subscription-engine-ga
status: human_needed
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-18
last_updated: 2026-04-27
---

# Phase 203 - Validation Strategy

> Historical validation contract reconciled with executed code, the `203-11` gap closure, and the current live-UAT boundary. This phase is code-verified but still `human_needed` until the remaining real-infrastructure checks are signed off.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node --test` (built-in) - consistent with 202 |
| **Config file** | none - `test/webhooks/` and `test/audit/` discovered by pattern |
| **Quick run command** | `node --test test/webhooks/<current-suite>.test.js` |
| **Full suite command** | `node --test test/webhooks/*.test.js test/audit/hash-chain.test.js` |
| **Estimated runtime** | ~15 seconds quick / ~45 seconds full |

## Historical Sampling Rate

- After every task commit: run the plan-scoped suite.
- After every plan wave: run the full webhook suite plus inherited regression checks.
- Before `/gsd:verify-work`: full suite plus contract/openapi checks.
- Max feedback latency target: 45 seconds.

## Current Reconciliation Status

| Surface | Evidence | Status |
|---------|----------|--------|
| Wave 1 substrate swap and schema foundation | `203-01-SUMMARY.md`, `203-02-SUMMARY.md` | complete |
| Wave 2 DLQ and replay | `203-03-SUMMARY.md`, `203-04-SUMMARY.md` | complete |
| Wave 3 rotation and notifications | `203-05-SUMMARY.md`, `203-06-SUMMARY.md` | complete |
| Wave 4 throttling and circuit breaker | `203-07-SUMMARY.md`, `203-08-SUMMARY.md` | complete |
| Wave 5 tenant surfaces, public status, observability, docs | `203-09-SUMMARY.md`, `203-10-SUMMARY.md` | complete |
| Wave 6 gap closure (`203-11`) | `203-11-SUMMARY.md`, `test/webhooks/layout-shell-banner.test.js`, `203-VERIFICATION.md` | complete |
| Live-environment signoff | `203-VERIFICATION.md`, `203-HUMAN-UAT.md` | pending |

## Reconciled Verification Map

| Plan | Wave | Requirement Focus | Automated Evidence | Status |
|------|------|-------------------|--------------------|--------|
| `203-01` | 1 | `WHK-01` | `node --test test/webhooks/adapter-supabase.test.js test/webhooks/adapter-queues.test.js` | complete |
| `203-02` | 1 | `WHK-01`, `QA-10`, `QA-11` | `node --test test/webhooks/ssrf-guard.test.js test/webhooks/migration-72.test.js` | complete |
| `203-03` | 2 | `WHK-01`, `QA-05` | `node --test test/webhooks/dlq.test.js` | complete |
| `203-04` | 2 | `WHK-01`, `QA-01`, `QA-02` | `node --test test/webhooks/replay.test.js test/webhooks/replay-idempotency.test.js` | complete |
| `203-05` | 3 | `WHK-01`, `QA-13` | `node --test test/webhooks/rotation.test.js test/webhooks/dual-sign.test.js` | complete |
| `203-06` | 3 | `WHK-01`, `QA-03`, `QA-14` | `node --test test/webhooks/rotation-notify.test.js` | complete |
| `203-07` | 4 | `WHK-01`, `QA-04`, `QA-12` | `node --test test/webhooks/rate-limit.test.js test/webhooks/429-breach.test.js` | complete |
| `203-08` | 4 | `WHK-01`, `QA-04` | `node --test test/webhooks/circuit-breaker.test.js` | complete |
| `203-09` | 5 | `WHK-01`, `QA-03`, `QA-14` | `node --test test/webhooks/settings-api.test.js test/webhooks/settings-ui-a11y.test.js` | complete |
| `203-10` | 5 | `WHK-01`, `QA-07`, `QA-09`, `QA-15` | `node --test test/webhooks/status-page.test.js test/webhooks/observability.test.js test/webhooks/public-status.test.js test/webhooks/ui-s3-a11y.test.js` plus `node scripts/load/webhooks-smoke.mjs` in smoke mode | complete |
| `203-11` | 6 | `WHK-01`, closure of Surface 4 visibility gap | `node --test test/webhooks/layout-shell-banner.test.js` | complete |

The verification report also records a green full-suite run of `359` passing, `0` failing, and `2` skipped webhook tests after `203-11`. One contract/openapi build check remains a pre-existing deferred caveat rather than a Phase 203 regression.

## Residual Manual UAT Still Required

| Behavior | Why Manual | Signoff Owner |
|----------|------------|---------------|
| End-to-end signing-secret rotation UX across workspace routes | Requires live Next.js app, seeded rotation, and visual confirmation of stage transitions | product / QA |
| Surface 1 dashboard freshness under active traffic | Requires live traffic and visual refresh behavior | product / QA |
| Surface 2 DLQ batch replay idempotency | Requires real Vercel Queues deduplication behavior | platform / QA |
| Public status page edge-cache behavior | Requires deployed CDN semantics | platform |
| Rotation email delivery via Resend | Requires live mail delivery and receipt confirmation | ops |
| Per-subscription Redis-backed throttling | Requires live Upstash Redis and subscriber load | platform |
| Circuit-breaker trip / half-open / reset loop | Requires live flaky subscriber and Redis state observation | platform |

## Validation Sign-Off

- [x] All executed plans now have explicit automated evidence.
- [x] Wave 0 bootstrap is reconciled as complete.
- [x] `203-11` is represented in the formal validation map.
- [x] Validation metadata is aligned with the verification verdict.
- [x] `nyquist_compliant: true` is justified by the reconciled map.
- [ ] Live-environment UAT is still pending, so the phase remains `human_needed`.

**Approval:** reconciled on 2026-04-27 against `203-VERIFICATION.md`, `203-HUMAN-UAT.md`, the 11 plan summaries, and the gap-closure review.
