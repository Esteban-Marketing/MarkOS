---
phase: 201
slug: saas-tenancy-hardening
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-17
populated_by: gsd-planner (2026-04-17)
---

# Phase 201 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Filled from 201-RESEARCH.md §Validation Architecture + all 8 PLAN.md files during planner run.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node --test` (node:test — already in use across project) |
| **Config file** | none — node:test needs no config |
| **Quick run command** | `node --test test/<domain>/*.test.js` (per-plan domain) |
| **Full suite command** | `node --test test/**/*.test.js` (project-wide regression sweep) |
| **Estimated runtime** | ~5–15 seconds per domain; ~60s full sweep |

---

## Sampling Rate

- **After every task commit:** Run the plan's `<automated>` verify command (domain-scoped)
- **After every plan wave:** Run `node --test test/**/*.test.js` full regression
- **Before `/gsd:verify-work`:** Full suite green + new-surface smoke tests green
- **Max feedback latency:** ~15 seconds per task, ~60s per wave

---

## Per-Task Verification Map

*Populated by gsd-planner. Each task across all 8 plans maps to one verifier row here.*

| Task ID | Plan | Wave | Requirement(s) | Test Type | Automated Command | File Exists | Status |
|---------|------|------|----------------|-----------|-------------------|-------------|--------|
| 201-01-T1 | 01 | 1 | QA-01, QA-04, QA-13 | unit | `node --test test/tenancy/reserved-slugs.test.js test/tenancy/org-model.test.js` | ❌ W0 | ⬜ pending |
| 201-01-T2 | 01 | 1 | QA-02, QA-04 | unit | `node --test test/tenancy/org-model.test.js test/tenancy/reserved-slugs.test.js` | ❌ W0 | ⬜ pending |
| 201-02-T1 | 02 | 1 | QA-02, QA-04, QA-11, QA-13 | unit | `node --test test/audit/canonical.test.js` | ❌ W0 | ⬜ pending |
| 201-02-T2 | 02 | 1 | QA-02, QA-04, QA-11 | unit | `node --test test/audit/canonical.test.js test/audit/hash-chain.test.js test/audit/chain-checker.test.js` | ❌ W0 | ⬜ pending |
| 201-03-T1 | 03 | 2 | QA-04, QA-12, QA-13 | unit+integration | `node --test test/auth/botid.test.js test/auth/rate-limit.test.js test/auth/signup.test.js test/auth/provisioner.test.js` | ❌ W0 | ⬜ pending |
| 201-03-T2 | 03 | 2 | QA-01, QA-02, QA-12 | unit | `node --test test/auth/signup.test.js` | ❌ W0 | ⬜ pending |
| 201-03-T3 | 03 | 2 | QA-14 | unit (grep+shape) | `node --test test/auth/signup.test.js` | ❌ W0 | ⬜ pending |
| 201-04-T1 | 04 | 2 | QA-11, QA-12, QA-13 | unit | `node --test test/auth/passkey.test.js` | ❌ W0 | ⬜ pending |
| 201-04-T2 | 04 | 2 | QA-01, QA-14 | unit (grep+shape) | `node --test test/auth/passkey.test.js test/auth/passkey-prompt.test.js` | ❌ W0 | ⬜ pending |
| 201-05-T1 | 05 | 2 | API-02, QA-04, QA-12, QA-13 | unit | `node --test test/tenancy/resolver.test.js test/tenancy/cookie-scope.test.js test/tenancy/middleware.test.js` | ❌ W0 | ⬜ pending |
| 201-05-T2 | 05 | 2 | QA-01, QA-14 | unit+integration | `node --test test/tenancy/sessions-api.test.js` | ❌ W0 | ⬜ pending |
| 201-06-T1 | 06 | 2 | API-02, QA-02, QA-13 | unit | `node --test test/tenancy/vercel-domains-client.test.js test/tenancy/byod.test.js test/tenancy/branding.test.js` | ❌ W0 | ⬜ pending |
| 201-06-T2 | 06 | 2 | QA-01, QA-12, QA-14 | unit (grep+shape) | `node --test test/tenancy/byod.test.js` | ❌ W0 | ⬜ pending |
| 201-07-T1 | 07 | 2 | QA-04, QA-11, QA-13 | unit | `node --test test/tenancy/invites.test.js test/tenancy/lifecycle.test.js test/tenancy/switcher.test.js` | ❌ W0 | ⬜ pending |
| 201-07-T2 | 07 | 2 | QA-04, QA-15 | unit (injected stubs) | `node --test test/tenancy/gdpr-export.test.js` | ❌ W0 | ⬜ pending |
| 201-07-T3a | 07 | 2 | QA-01, QA-14 | unit (grep+shape) | `node --test test/tenancy/invites.test.js test/tenancy/lifecycle.test.js test/tenancy/gdpr-export.test.js test/tenancy/switcher.test.js` | ❌ W0 | ⬜ pending |
| 201-07-T3b | 07 | 2 | QA-01, QA-14 | unit (grep+shape) | `node --test test/tenancy/invites.test.js test/tenancy/lifecycle.test.js test/tenancy/switcher.test.js` | ❌ W0 | ⬜ pending |
| 201-08-T1 | 08 | 3 | QA-11, QA-15 | unit (grep+shape) | `node --test test/tenancy/audit-emitter-wiring.test.js` | ❌ W0 | ⬜ pending |
| 201-08-T2 | 08 | 3 | QA-01, QA-15 | unit (grep+shape) | `node --test test/tenancy/openapi-merge.test.js test/tenancy/docs-mirror.test.js` | ❌ W0 | ⬜ pending |
| 201-08-T3 | 08 | 3 | API-02, QA-09 | unit | `node --test test/tenancy/slug-cache.test.js` | ❌ W0 | ⬜ pending |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*All listed test files are created by their owning plan's Task 1 (TDD — test + minimum code
together). Phase execution begins with Wave 1 plans which write these files as part of their
first task output.*

Wave 1:
- [ ] `test/tenancy/org-model.test.js` — Plan 01 (6 schema regex + 6 library shape tests)
- [ ] `test/tenancy/reserved-slugs.test.js` — Plan 01 (9 blocklist-coverage tests)
- [ ] `test/audit/canonical.test.js` — Plan 02 (10 deterministic JSON tests)
- [ ] `test/audit/hash-chain.test.js` — Plan 02 (7 writer + staging tests)
- [ ] `test/audit/chain-checker.test.js` — Plan 02 (6 replay + break detection tests)

Wave 2:
- [ ] `test/auth/botid.test.js` — Plan 03 (7 BotID fail-closed tests)
- [ ] `test/auth/rate-limit.test.js` — Plan 03 (7 IP + email rate-limit tests)
- [ ] `test/auth/signup.test.js` — Plan 03 (6 enqueueSignup + 4 handler-shape tests)
- [ ] `test/auth/provisioner.test.js` — Plan 03 (6 slug + provisioning tests)
- [ ] `test/auth/passkey.test.js` — Plan 04 (12 passkey ceremony tests)
- [ ] `test/auth/passkey-prompt.test.js` — Plan 04 (6 UI + handler presence tests)
- [ ] `test/tenancy/resolver.test.js` — Plan 05 (10 resolveHost + resolveTenantBy* tests)
- [ ] `test/tenancy/cookie-scope.test.js` — Plan 05 (5 cookie domain chooser tests)
- [ ] `test/tenancy/middleware.test.js` — Plan 05 (4 middleware shape-lock tests)
- [ ] `test/tenancy/sessions-api.test.js` — Plan 05 (6 revoke + surface shape tests)
- [ ] `test/tenancy/vercel-domains-client.test.js` — Plan 06 (8 fetch-wrapper tests)
- [ ] `test/tenancy/byod.test.js` — Plan 06 (8 CRUD + quota tests + 4 surface/contract tests)
- [ ] `test/tenancy/branding.test.js` — Plan 06 (5 get/upsert + hex validation tests)
- [ ] `test/tenancy/invites.test.js` — Plan 07 (8 invite lifecycle tests + 2 F-85 shape tests)
- [ ] `test/tenancy/lifecycle.test.js` — Plan 07 (5 offboarding state machine tests + 2 F-86 shape tests)
- [ ] `test/tenancy/gdpr-export.test.js` — Plan 07 (3 BUNDLE_DOMAINS + streaming + signed URL tests)
- [ ] `test/tenancy/switcher.test.js` — Plan 07 (4 listTenants + createTenantInOrg tests)

Wave 3:
- [ ] `test/tenancy/audit-emitter-wiring.test.js` — Plan 08 (5 grep-based contract-lock tests)
- [ ] `test/tenancy/openapi-merge.test.js` — Plan 08 (2 openapi.json path coverage tests)
- [ ] `test/tenancy/docs-mirror.test.js` — Plan 08 (5 docs + llms.txt coverage tests)
- [ ] `test/tenancy/slug-cache.test.js` — Plan 08 (6+ slug-cache tests: read-hit, read-miss+backfill, write-through, invalidate on rename, 60s TTL contract, fail-closed on edge-config error) — fulfils Plan 05 T-201-05-06 promise

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wildcard DNS propagation + Vercel Domains API end-to-end | API-02 | External DNS timing + Vercel platform integration can't run in CI | Deploy to staging, `dig` + `curl` the subdomain and a BYOD CNAME, verify auto-SSL cert issuance |
| Real magic-link email delivery + double opt-in click-through | QA-01..15 (signup) | Depends on Supabase Auth + outbound email provider | Sign up with a real mailbox, click link, confirm session lands on correct tenant |
| BotID token issuance + server verification in production | QA-12 | Vercel BotID requires live platform attestation | Attempt signup without BotID token, expect 403; then with valid token, expect 200 |
| GDPR export zip content correctness | QA-15 | Zip shape + signed URL expiry integration with S3/R2 | Trigger offboarding, download zip, verify every domain JSON present + URL expires at 7d |
| Passkey authenticator ceremony on real device | QA-12 | WebAuthn requires a platform authenticator (Touch ID / Windows Hello) | On staging, register + authenticate with a real passkey; verify markos_passkey_credentials row + counter increments |
| Middleware performance under load | QA-09 | Need k6/Artillery in staging to measure p50/p95 | Run k6 script against `*.markos.dev` with 100 RPS for 5 min; verify p95 < 200ms including Supabase round-trip |
| 30-day purge cron correctness | QA-13 | Needs multi-day wall-clock to exercise; use time-traveled test tenant | Create test tenant; run cron with `--now=now+31d`; verify export bundle + status flip |
| Cookie SameSite=Lax cross-subdomain behavior | QA-12 | Requires real browser cross-origin navigation test | Manual Playwright check: open two tabs on different `*.markos.dev` subdomains; verify session isolation per cookie domain |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (verified by enumerating tasks above — every task has a verify command)
- [x] Wave 0 covers all MISSING references (22 test files listed above, all created by Task 1 of their owning plan with Nyquist TDD pattern)
- [x] No watch-mode flags
- [x] Feedback latency < 60s (individual domain-scoped runs 5-15s; full suite < 60s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** populated 2026-04-17 by gsd-planner; ready for execution.
