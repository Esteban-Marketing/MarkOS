---
phase: 201-saas-tenancy-hardening
plan: "04"
subsystem: passkey-opt-in
tags: [webauthn, passkey, simplewebauthn, wave-2, partial]
status: partial
dependency_graph:
  requires: [201-01, 201-02]
  provides:
    - supabase/migrations/84_markos_passkey_credentials.sql
    - lib/markos/auth/passkey.cjs
  affects: [201-07]
tech_stack:
  added: ["@simplewebauthn/server@^13.3.0", "@simplewebauthn/browser@^13.3.0"]
  patterns: [dual-export-ts-cjs, one-time-challenge, do-not-hand-roll-crypto, dependency-injection-for-tests]
key_files:
  created:
    - supabase/migrations/84_markos_passkey_credentials.sql
    - supabase/migrations/rollback/84_markos_passkey_credentials.down.sql
    - lib/markos/auth/passkey.ts
    - lib/markos/auth/passkey.cjs
    - test/auth/passkey.test.js
  modified:
    - package.json
    - package-lock.json
decisions:
  - "@simplewebauthn/server wrapped behind lib/markos/auth/passkey.cjs — no other module imports it directly. Eliminates scattered version drift + centralises attestation handling."
  - "Challenges are one-time: consumeChallenge() deletes the row inside the verify path, prevents replay. 2-minute TTL enforced at insert + verified on read."
  - "Dependency injection (deps.webauthn) in every public function: lets tests run without the real library while production paths use the real SDK."
  - "shouldPromptPasskey ties D-01 semantics together: 2+ login events + 0 passkeys + no dismiss cookie. All three conditions must hold."
  - "Audit rows use tenant_id=user_id for auth events (no tenant context yet at registration time). Plan 08 will backfill org_id once sessions carry it."
metrics:
  tasks_completed: 1
  tasks_total: 2
  files_created: 5
  tests_passing: 12
  remaining: "Task 2 (4 HTTP handlers + F-81 contract + PasskeyPrompt component + component test) deferred to fresh session"
---

# Phase 201 Plan 04: Passkey Opt-In Summary (Task 1 complete; Task 2 deferred)

Task 1 ships the passkey schema + library wrapper + 12-test suite. Migration 84
creates three tables (credentials, challenges, login_events), RLS-locked to the
owning user. `lib/markos/auth/passkey.{cjs,ts}` wraps `@simplewebauthn/server`
v13 with one-time challenge semantics, audit staging on register + authenticate,
and the D-01 "prompt on second successful login" predicate.

## Tasks

| # | Task | Status | Tests |
|---|------|--------|-------|
| 1 | Migration 84 + passkey lib + tests | ✓ | 12/12 pass |
| 2 | 4 HTTP handlers + F-81 contract + PasskeyPrompt UI | **deferred to fresh session** | — |

## Commits

- `chore(201-04): add @simplewebauthn/{server,browser} v13.3.0 deps`
- `feat(201-04): migration 84 + passkey lib wrapper + test suite (Task 1, 12 tests)`

## Next Session

Resume with `/gsd:execute-phase 201 --wave 2 --interactive` (fresh context). Task 2
adds:
- `api/auth/passkey/{register,authenticate}-{options,verify}.js` (4 Vercel Functions)
- `components/markos/auth/PasskeyPrompt.{tsx,module.css}` (UI-SPEC Surface 1 inline dismissible card)
- `contracts/F-81-passkey-webauthn-v1.yaml`
- `test/auth/passkey-prompt.test.js`

Library contract is frozen + test-locked, so Task 2 is purely HTTP + UI wiring
with no re-engineering risk.

## Self-Check: Task 1 PASSED (12/12 tests, 2 atomic commits, 5 files + deps). Task 2 pending.
