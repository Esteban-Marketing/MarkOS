---
phase: 201-saas-tenancy-hardening
plan: "03"
subsystem: public-signup
tags: [auth, magic-link, botid, rate-limit, double-opt-in, surface-1, wave-2]
dependency_graph:
  requires: [201-01, 201-02]
  provides:
    - supabase/migrations/83_markos_unverified_signups.sql
    - lib/markos/auth/botid.cjs
    - lib/markos/auth/rate-limit.cjs
    - lib/markos/auth/signup.cjs
    - lib/markos/auth/provisioner.cjs
    - api/auth/signup.js
    - api/auth/callback.js
    - contracts/F-80-public-signup-v1.yaml
    - app/(marketing)/signup/page.tsx
  affects: [201-04, 201-07]
tech_stack:
  added: []
  patterns: [double-opt-in-buffer, fail-closed-botid, hashed-ip-rate-limit, supabase-auth-service-role]
key_files:
  created:
    - supabase/migrations/83_markos_unverified_signups.sql
    - supabase/migrations/rollback/83_markos_unverified_signups.down.sql
    - lib/markos/auth/botid.ts
    - lib/markos/auth/botid.cjs
    - lib/markos/auth/rate-limit.ts
    - lib/markos/auth/rate-limit.cjs
    - lib/markos/auth/signup.ts
    - lib/markos/auth/signup.cjs
    - lib/markos/auth/provisioner.ts
    - lib/markos/auth/provisioner.cjs
    - api/auth/signup.js
    - api/auth/callback.js
    - contracts/F-80-public-signup-v1.yaml
    - app/(marketing)/signup/layout.tsx
    - app/(marketing)/signup/page.tsx
    - app/(marketing)/signup/page.module.css
    - test/auth/botid.test.js
    - test/auth/rate-limit.test.js
    - test/auth/signup.test.js
    - test/auth/provisioner.test.js
  modified: []
decisions:
  - "Pitfall 1 mitigation: markos_orgs + markos_tenants NEVER created before verifyOtp. markos_unverified_signups is the app-layer gate; Supabase Auth's auth.users row is expected but not trusted as provisioning trigger."
  - "Fail-closed BotID: any network error → ok=false (D-03). Endpoint configurable via BOTID_VERIFY_ENDPOINT env. skipInTest path for tests only."
  - "GDPR-safe rate-limit: raw IP never persisted — only sha256(ip) lands in markos_signup_rate_limits. Hourly window snapped by table boundaries (cheap upsert)."
  - "Provisioner is idempotent: if owner_user_id already has an org, return it without inserts. Supports retry after network failure mid-provision."
  - "CSS Modules only for Surface 1 (no shadcn, no Tailwind) — matches UI-SPEC Design System declaration. 44px touch targets, 28px card radius, #0d9488 accent, outline 2px focus ring all locked by test."
  - "F-80 contract cites D-01/D-02/D-03/D-06 explicitly in decisions: block; security_considerations enumerates BotID, GDPR, Pitfall 1, reserved-slug, magic-link TTL."
metrics:
  tasks_completed: 3
  tasks_total: 3
  files_created: 20
  tests_passing: 26
---

# Phase 201 Plan 03: Public Signup Summary

Shipped the Wave-2 public signup flow. Magic-link primary (D-01), double opt-in
via email buffer (D-02), Vercel BotID pre-submit + 5/hour/IP rate-limit (D-03),
1 org → 1 tenant provisioning on verify (D-06). Surface 1 UI ships per UI-SPEC
tokens with WCAG 2.2 AA accessibility.

## Tasks

| # | Task | Status | Tests |
|---|------|--------|-------|
| 1 | Migration 83 + 4 auth libs + 4 test suites | ✓ | 26/26 pass |
| 2 | api/auth/signup.js + callback.js + F-80 contract | ✓ | 4 presence tests |
| 3 | Surface 1 page.tsx + page.module.css + layout.tsx | ✓ | 2 shape-lock tests |

## Verification

- `node --test test/auth/botid.test.js` → 7/7
- `node --test test/auth/rate-limit.test.js` → 7/7
- `node --test test/auth/signup.test.js` → 12/12 (6 helper + 4 handler + 2 UI)
- `node --test test/auth/provisioner.test.js` → 6/6
- Regression: wave-1 test/tenancy/* + test/audit/* untouched (44/44 still pass)

## Commits

- `feat(201-03): migration 83 + auth libs + 4 test suites (Task 1, 26 tests pass)`
- `feat(201-03): signup + callback handlers + F-80 contract + Surface 1 UI (Tasks 2+3, 12 tests)`

## REQ Coverage

`QA-01` · `QA-02` · `QA-03` · `QA-04` · `QA-05` · `QA-09` · `QA-11` · `QA-12` · `QA-14`

## Unblocks

- Plan 201-04 passkey opt-in (hooks into same auth.users after verifyOtp)
- Plan 201-07 invite accept flow (reuses provisioner's org-membership + audit-staging patterns)

## Known Follow-ups

- Vercel BotID exact endpoint + script tag shape — documented assumption in RESEARCH.md open-questions RESOLVED; first-task of live deploy should verify current API and adjust `BOTID_VERIFY_ENDPOINT` env if needed.
- PostgREST increment-on-conflict in `recordSignupAttempt` is best-effort upsert — real counter increment lands with Plan 08 via SQL function `increment_signup_rate` (tracked).

## Self-Check: PASSED (26 + 2 regression suites green, 20 files, 2 atomic commits)
