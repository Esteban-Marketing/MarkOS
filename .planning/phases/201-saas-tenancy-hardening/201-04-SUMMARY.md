---
phase: 201-saas-tenancy-hardening
plan: "04"
subsystem: passkey-opt-in
tags: [webauthn, passkey, simplewebauthn, surface-1, wave-2]
dependency_graph:
  requires: [201-01, 201-02]
  provides:
    - supabase/migrations/84_markos_passkey_credentials.sql
    - lib/markos/auth/passkey.cjs
    - api/auth/passkey/
    - components/markos/auth/PasskeyPrompt.tsx
    - contracts/F-81-passkey-webauthn-v1.yaml
  affects: [201-07]
tech_stack:
  added: ["@simplewebauthn/server@^13.3.0", "@simplewebauthn/browser@^13.3.0"]
  patterns: [dual-export-ts-cjs, one-time-challenge, do-not-hand-roll-crypto, dependency-injection-for-tests, inline-dismissible-card]
key_files:
  created:
    - supabase/migrations/84_markos_passkey_credentials.sql
    - supabase/migrations/rollback/84_markos_passkey_credentials.down.sql
    - lib/markos/auth/passkey.ts
    - lib/markos/auth/passkey.cjs
    - api/auth/passkey/register-options.js
    - api/auth/passkey/register-verify.js
    - api/auth/passkey/authenticate-options.js
    - api/auth/passkey/authenticate-verify.js
    - components/markos/auth/PasskeyPrompt.tsx
    - components/markos/auth/PasskeyPrompt.module.css
    - contracts/F-81-passkey-webauthn-v1.yaml
    - test/auth/passkey.test.js
    - test/auth/passkey-prompt.test.js
  modified:
    - package.json
    - package-lock.json
decisions:
  - "@simplewebauthn/server wrapped behind lib/markos/auth/passkey.cjs — every import funnels through the wrapper. No hand-rolled CBOR/COSE/attestation. Tests inject deps.webauthn to run without the real SDK."
  - "Challenges are one-time: consumeChallenge deletes the row inside the verify path (replay-proof). 2-min TTL enforced at insert + verified on read."
  - "Audit rows on register + authenticate (source_domain='auth'). Keyed on user_id today; Plan 08 backfills org_id when sessions carry it."
  - "PasskeyPrompt is inline dismissible card (NOT modal) per UI-SPEC Surface 1. 30-day cookie dismissal. role=region + aria-labelledby + aria-label on × dismiss."
  - "shouldPromptPasskey ties D-01 semantics together: 2+ login events + 0 passkeys + no dismiss cookie. All three must hold."
metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 13
  files_modified: 2
  tests_passing: 18
---

# Phase 201 Plan 04: Passkey Opt-In Summary

Shipped full WebAuthn opt-in: schema + library wrapper + 4 HTTP handlers +
F-81 contract + UI prompt component + 18 tests.

## Tasks

| # | Task | Status | Tests |
|---|------|--------|-------|
| 1 | Migration 84 + passkey lib + lib tests | ✓ | 12/12 |
| 2 | 4 HTTP handlers + F-81 + PasskeyPrompt UI + component test | ✓ | 6/6 |

## Verification

- `node --test test/auth/passkey.test.js` → 12/12
- `node --test test/auth/passkey-prompt.test.js` → 6/6
- Regression: test/auth/signup.test.js (Plan 03) still 12/12

## Commits

- `chore(201-04): add @simplewebauthn/{server,browser} v13.3.0 deps`
- `feat(201-04): migration 84 + passkey lib wrapper + test suite (Task 1, 12 tests)`
- `feat(201-04): 4 passkey HTTP handlers + F-81 contract + PasskeyPrompt UI (Task 2, 6 new tests)`

## REQ Coverage

`QA-01` · `QA-02` · `QA-04` · `QA-05` · `QA-11` · `QA-12` · `QA-14`

## Deferred (201-04.1)

- Real-device ceremony on staging (depends on NEXT_PUBLIC_RP_ID + NEXT_PUBLIC_ORIGIN being set — listed in Manual-Only Verifications of 201-VALIDATION.md)
- Session cookie write on authenticate-verify success (depends on Plan 05 middleware session primitives)

## Self-Check: PASSED (18/18 tests, 3 atomic commits, 13 files shipped)
