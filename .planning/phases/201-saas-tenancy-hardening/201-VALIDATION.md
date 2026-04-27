---
phase: 201
slug: saas-tenancy-hardening
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-17
last_updated: 2026-04-27
---

# Phase 201 - Validation Strategy

> Historical validation contract reconciled with executed code, the passed verification artifact, and the current closeout boundary. Phase 201 remains verified for its code and contract hardening scope; the remaining live-platform smokes are informational follow-up for staging or launch confidence rather than execution blockers.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node --test` (built-in Node runner) |
| **Config file** | none |
| **Quick run command** | `node --test test/tenancy/*.test.js` |
| **Full phase suite** | `node --test test/tenancy/*.test.js test/audit/*.test.js test/auth/*.test.js` |
| **Full repo sweep** | `node --test test/**/*.test.js` |
| **Estimated runtime** | ~15-20 seconds phase-targeted / ~60 seconds repo-wide |

## Historical Sampling Rate

- After every task commit: run the plan-scoped suite.
- After every wave: run the broader tenancy, audit, and auth suites.
- Before `/gsd:verify-work`: run the full phase suite plus artifact existence checks.
- Max quick-feedback target during execution: under 60 seconds.

## Current Reconciliation Status

| Surface | Evidence | Status |
|---------|----------|--------|
| Wave 1 org model and audit-log foundation | `201-01-SUMMARY.md`, `201-02-SUMMARY.md` | complete |
| Wave 2 signup, passkey, middleware, BYOD, members, lifecycle, and GDPR surfaces | `201-03-SUMMARY.md` through `201-07-SUMMARY.md` | complete |
| Wave 3 docs, OpenAPI merge, cross-domain audit emitters, slug cache, and crons | `201-08-SUMMARY.md`, `201-VERIFICATION.md` | complete |
| Historical closeout verdict | `201-VERIFICATION.md`, `ROADMAP.md` | verified |
| Live-platform smoke follow-up | this file, `201-VERIFICATION.md` | informational only |

## Reconciled Verification Map

| Plan | Wave | Requirement Focus | Automated Evidence | Status |
|------|------|-------------------|--------------------|--------|
| `201-01` | 1 | `QA-01`, `QA-02`, `QA-04`, `QA-13` | `node --test test/tenancy/reserved-slugs.test.js test/tenancy/org-model.test.js` | complete |
| `201-02` | 1 | `QA-02`, `QA-04`, `QA-11`, `QA-13` | `node --test test/audit/canonical.test.js test/audit/hash-chain.test.js test/audit/chain-checker.test.js` | complete |
| `201-03` | 2 | `QA-01`, `QA-02`, `QA-04`, `QA-12`, `QA-14` | `node --test test/auth/botid.test.js test/auth/rate-limit.test.js test/auth/signup.test.js test/auth/provisioner.test.js` | complete |
| `201-04` | 2 | `QA-01`, `QA-11`, `QA-12`, `QA-13`, `QA-14` | `node --test test/auth/passkey.test.js test/auth/passkey-prompt.test.js` | complete |
| `201-05` | 2 | `API-02`, `QA-01`, `QA-04`, `QA-12`, `QA-13`, `QA-14` | `node --test test/tenancy/resolver.test.js test/tenancy/cookie-scope.test.js test/tenancy/middleware.test.js test/tenancy/sessions-api.test.js` | complete |
| `201-06` | 2 | `API-02`, `QA-01`, `QA-02`, `QA-12`, `QA-13`, `QA-14` | `node --test test/tenancy/vercel-domains-client.test.js test/tenancy/byod.test.js test/tenancy/branding.test.js` | complete |
| `201-07` | 2 | `QA-01`, `QA-04`, `QA-11`, `QA-13`, `QA-15` | `node --test test/tenancy/invites.test.js test/tenancy/lifecycle.test.js test/tenancy/gdpr-export.test.js test/tenancy/switcher.test.js` | complete |
| `201-08` | 3 | `API-02`, `QA-01`, `QA-09`, `QA-11`, `QA-15` | `node --test test/tenancy/audit-emitter-wiring.test.js test/tenancy/openapi-merge.test.js test/tenancy/docs-mirror.test.js test/tenancy/slug-cache.test.js` | complete |

The verification artifact records `206` new passing assertions (`122` tenancy, `23` audit, `61` auth) plus one pre-existing unrelated regression outside Phase 201 ownership. It also preserves four explicit non-applicability decisions: `QA-06`, `QA-07`, `QA-08`, and `QA-10`.

## Operational Hardening Smokes (Not Phase Gates)

These checks depend on real DNS, Vercel platform behavior, Supabase Auth delivery, physical authenticators, object storage, or wall-clock staging time. Because Phase 201 closed as a hardening phase and later phases already advanced on top of its substrate, they are retained as operational smoke tests instead of reopening the execution gate.

| Check | Why It Exists | Gate Status |
|-------|---------------|-------------|
| Wildcard DNS propagation plus Vercel Domains API end-to-end | Confirms real BYOD DNS and auto-SSL behavior outside CI | informational only |
| Real magic-link delivery plus double opt-in click-through | Confirms live email provider and redirect behavior | informational only |
| BotID token issuance and production verification | Confirms live Vercel attestation path | informational only |
| GDPR export zip retrieval and signed URL expiry | Confirms object storage and expiry behavior | informational only |
| Passkey ceremony on a real device | Confirms WebAuthn behavior against physical authenticators | informational only |
| Middleware performance under staging load | Useful latency confidence before larger launch traffic | informational only |
| 30-day purge cron correctness | Confirms long-horizon lifecycle timing with a time-traveled tenant | informational only |
| Cookie SameSite=Lax behavior across subdomains | Confirms browser behavior across real subdomain navigation | informational only |

## Validation Sign-Off

- [x] All executed plans now have explicit automated evidence.
- [x] Wave 0 bootstrap is reconciled as complete.
- [x] `nyquist_compliant: true` remains justified by the executed test map.
- [x] Manual live-platform checks are explicitly separated from true phase gates.
- [x] Validation metadata now matches the verified hardening scope in `201-VERIFICATION.md` and `ROADMAP.md`.
- [x] The historical non-applicability decisions remain preserved rather than silently dropped.

**Approval:** reconciled on 2026-04-27 against `201-VERIFICATION.md`, `201-REVIEWS.md`, the 8 plan summaries, and the existing roadmap closeout state.
