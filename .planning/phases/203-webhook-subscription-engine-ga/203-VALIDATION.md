---
phase: 203
slug: webhook-subscription-engine-ga
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-18
---

# Phase 203 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node --test (built-in) — consistent with 202 |
| **Config file** | none — test/webhooks/ + test/audit/ discovered by pattern |
| **Quick run command** | `node --test test/webhooks/<current-suite>.test.js` |
| **Full suite command** | `node --test test/webhooks/*.test.js test/audit/hash-chain.test.js` |
| **Estimated runtime** | ~15 seconds (quick) / ~45 seconds (full 203 + 200-03/201/202 regression) |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/webhooks/<plan-scope>.test.js`
- **After every plan wave:** Run `node --test test/webhooks/*.test.js` + 200-03 regression
- **Before `/gsd:verify-work`:** Full suite must be green + openapi build 15/16 (pre-existing gap)
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

To be populated by planner per plan. Placeholder rows by expected wave:

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 203-01-* | 01 | 1 | WHK-01 | unit + integration | `node --test test/webhooks/adapter-supabase.test.js test/webhooks/adapter-queues.test.js` | ❌ W0 | ⬜ pending |
| 203-02-* | 02 | 1 | WHK-01, QA-10 | unit | `node --test test/webhooks/ssrf-guard.test.js test/webhooks/migration-72.test.js` | ❌ W0 | ⬜ pending |
| 203-03-* | 03 | 2 | WHK-01 | unit | `node --test test/webhooks/dlq.test.js` | ❌ W0 | ⬜ pending |
| 203-04-* | 04 | 2 | WHK-01 | unit + integration | `node --test test/webhooks/replay.test.js test/webhooks/replay-idempotency.test.js` | ❌ W0 | ⬜ pending |
| 203-05-* | 05 | 3 | WHK-01, QA-13 | unit | `node --test test/webhooks/rotation.test.js test/webhooks/dual-sign.test.js` | ❌ W0 | ⬜ pending |
| 203-06-* | 06 | 3 | WHK-01 | unit | `node --test test/webhooks/rotation-notify.test.js` | ❌ W0 | ⬜ pending |
| 203-07-* | 07 | 4 | WHK-01, QA-04 | unit | `node --test test/webhooks/rate-limit.test.js test/webhooks/429-breach.test.js` | ❌ W0 | ⬜ pending |
| 203-08-* | 08 | 4 | WHK-01 | unit | `node --test test/webhooks/circuit-breaker.test.js` | ❌ W0 | ⬜ pending |
| 203-09-* | 09 | 5 | WHK-01, QA-03 | unit + a11y | `node --test test/webhooks/settings-api.test.js test/webhooks/settings-ui-a11y.test.js` | ❌ W0 | ⬜ pending |
| 203-10-* | 10 | 5 | WHK-01, QA-07, QA-09 | unit + smoke | `node --test test/webhooks/status-page.test.js test/webhooks/observability.test.js test/openapi/openapi-build.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/webhooks/adapter-supabase.test.js` — stubs for Supabase store adapter (WHK-01)
- [ ] `test/webhooks/adapter-queues.test.js` — stubs for Vercel Queues delivery adapter (WHK-01)
- [ ] `test/webhooks/ssrf-guard.test.js` — SSRF denylist + private-IP block (QA-10)
- [ ] `test/webhooks/migration-72.test.js` — DLQ + rotation migration idempotency (WHK-01)
- [ ] `test/webhooks/dlq.test.js` — DLQ store + 7-day TTL purge (WHK-01)
- [ ] `test/webhooks/replay.test.js` + `replay-idempotency.test.js` — batch/single replay, fresh HMAC, audit headers (WHK-01)
- [ ] `test/webhooks/rotation.test.js` + `dual-sign.test.js` — admin trigger + v1/v2 headers + grace window (QA-13)
- [ ] `test/webhooks/rotation-notify.test.js` — T-7/T-1/T-0 email cron (WHK-01)
- [ ] `test/webhooks/rate-limit.test.js` + `429-breach.test.js` — plan-tier + per-sub override + 429 envelope (QA-04)
- [ ] `test/webhooks/circuit-breaker.test.js` — Redis sliding-window trip + half-open re-probe (WHK-01)
- [ ] `test/webhooks/settings-api.test.js` + `settings-ui-a11y.test.js` — `/settings/webhooks` APIs + a11y grep-shape (QA-03)
- [ ] `test/webhooks/status-page.test.js` — `/status/webhooks` public page shape (WHK-01)
- [ ] `test/webhooks/observability.test.js` — log-drain + Sentry + correlation_id (QA-09)
- [ ] `test/webhooks/smoke-load.test.js` (or `scripts/load/webhook-smoke.mjs`) — 99.9% SLO smoke (QA-07)
- [ ] `test/openapi/openapi-build.test.js` — F-72/F-73 updates + F-96..F-100 merged (QA-09)

No framework install — `node --test` built-in already used by 200-03 + 202 test suites.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard visual polish | QA-03 | UI-SPEC compliance beyond a11y grep shapes — hero numeral 32px, tab underline 2px, table column widths | Load `/settings/webhooks` + sub detail + DLQ tab + Settings tab. Verify tokens against 203-UI-SPEC.md. |
| Public status page render | QA-03 | CSS + dark mono code block visual — grep cannot assert pixel-level | Load `/status/webhooks` in browser. Verify hero 4 numerals, no shell chrome, dark mono code block if present. |
| Rotation email appearance | QA-03 | Email HTML rendering in Gmail/Outlook — automated snapshot not in scope this phase | Trigger rotation → receive T-7 email → verify subject + body + Dashboard link renders. |
| Rollback flow end-to-end | WHK-01 | Sequence spans DB migration + cron trigger + admin click — integration beyond unit coverage | Rotate secret → within grace window click Rollback → verify old secret reactivated + new secret purged + audit log entry. |
| Circuit-breaker UI state sync | WHK-01 | Redis state → UI chip visual (healthy/half-open/tripped) — requires live infra | Trip breaker via forced 5xx failures → verify chip updates in dashboard within 2s polling. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
