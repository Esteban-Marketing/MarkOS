---
phase: 204-cli-markos-v1-ga
plan: 02
subsystem: cli
tags: [cli, oauth-device-flow, rfc-8628, keychain, api-keys, login, audit, fetch, node22, openapi]

# Dependency graph
requires:
  - phase: 204-01 (Plan 01)
    provides: "bin/lib/cli/{keychain,http,open-browser,output,errors,config}.cjs primitives + migrations 73 (markos_cli_device_sessions) + 74 (markos_cli_api_keys) + test/cli/_fixtures/oauth-device-server.cjs scriptable RFC 8628 stub"
provides:
  - "lib/markos/cli/device-flow.cjs — RFC 8628 state machine primitives (createDeviceSession + pollToken + approveDeviceSession + mintApiKey helper)"
  - "3 server endpoints: POST /api/cli/oauth/device/{start,token,authorize}"
  - "bin/commands/login.cjs — `markos login` device flow + --token paste mode + --profile + --no-browser + SIGINT"
  - "contracts/F-101-cli-oauth-device-v1.yaml — OAuth device grant F-NN contract"
  - "openapi.json + openapi.yaml regenerated (64 → 65 flows, 97 → 100 paths)"
  - "Audit source_domain='cli' action='device.approved' surface (T-204-02-08)"
  - "One-shot approved → consumed transition (T-204-02-03 replay-defence)"
affects:
  - "204-03 (keys) — consumes mintApiKey helper + markos_cli_api_keys shape"
  - "204-04 (whoami) — consumes device-flow-issued access_token"
  - "204-05 (init) — requires `markos login` success before first run"
  - "204-06 (plan/run) — requires access_token in keychain"
  - "204-07 (eval) — requires access_token in keychain"
  - "204-08 (env) — requires access_token in keychain"
  - "204-09 (status) — requires access_token in keychain"
  - "204-11 (doctor) — inspects keychain entries for troubleshooting"
  - "Phase 206 (audit compliance) — filters on source_domain='cli' action='device.approved'"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RFC 8628 device authorization state machine: pending → approved → consumed (one-shot) | denied | expired"
    - "Public OAuth endpoint rate-limit: Upstash slidingWindow(10, '1 m') keyed by source IP"
    - "sha256-hashed API key at rest + 8-char fingerprint + plaintext returned once only (D-06 echo-once)"
    - "Dual-body parsing on /token: accepts both application/x-www-form-urlencoded (RFC 6749) and application/json (CLI convenience)"
    - "F-NN contract block-form `tags:` syntax (not inline) — prevents Phase 203 tags-missing regression"
    - "Twin export .cjs + .ts with identical runtime — .ts is a TypeScript facade re-exporting the CJS module"
    - "Best-effort audit emit wrapped in try/catch (approval success never blocked on audit DB failure)"

key-files:
  created:
    - "lib/markos/cli/device-flow.cjs — 3 state-machine primitives + mintApiKey helper + GRACE constants"
    - "lib/markos/cli/device-flow.ts — TS twin-export facade"
    - "api/cli/oauth/device/start.js — public device code request endpoint"
    - "api/cli/oauth/device/token.js — public CLI polling endpoint"
    - "api/cli/oauth/device/authorize.js — authenticated approval endpoint"
    - "contracts/F-101-cli-oauth-device-v1.yaml — F-NN contract with 3 paths + 8 error envelopes"
    - "test/cli/device-flow.test.js — 11 state-machine unit tests"
    - "test/cli/oauth-endpoints.test.js — 11 endpoint tests + F-101 shape assertion"
    - "test/cli/login.test.js — 9 integration tests via stub OAuth server"
  modified:
    - "bin/commands/login.cjs — replaced Plan 01 stub with full device-flow + --token paste implementation"
    - "contracts/openapi.json — regenerated (65 flows / 100 paths)"
    - "contracts/openapi.yaml — regenerated (65 flows / 100 paths)"

key-decisions:
  - "Dual content-type on /token: accept both application/x-www-form-urlencoded (RFC 6749 spec) and application/json (CLI convenience; zero-dep implementation)"
  - "One-shot approved → consumed via conditional UPDATE `WHERE status='approved'` — prevents T-204-02-03 replay even under race"
  - "Preemptive deadline check in CLI polling loop (`if Date.now() >= deadline break;` after sleep) — prevents pitfall 2 expired-token race where server says pending but CLI knows it will never succeed"
  - "Global exit-sink pattern in login.test.js — swallows late `process.exit` from leaked polling loops in prior tests without false-positive suite failure"
  - "Inline-deferred SIGINT invocation in login-08: look up registered listener and call synchronously from the test body (not a timer), which avoids node:test's 'thrown ExitError from listOnTimeout' uncaught-error reporting"

patterns-established:
  - "Pattern: Device-flow library split — state machine + DB writes in lib/markos/cli/device-flow.cjs; HTTP envelopes + rate-limit + auth-gate in api/cli/oauth/device/*.js; CLI UX in bin/commands/login.cjs. Mirrors 203 webhook split (rotation.cjs lib + rotate.js endpoint + /settings/webhooks UI)"
  - "Pattern: F-101 block-form tags — `tags:\\n  - cli\\n  - oauth` instead of inline array, per 203 deferred-items.md regression note"
  - "Pattern: Stub Supabase client for state-machine tests — fluent `.from().select().eq().maybeSingle()` thenable that filters in-memory arrays; reusable across 204-02, 204-03, 204-04 test suites"

requirements-completed:
  - CLI-01
  - QA-01
  - QA-02
  - QA-09
  - QA-11
  - QA-15

# Metrics
duration: ~60min
completed: 2026-04-23
---

# Phase 204 Plan 02: OAuth Device Flow End-to-End Summary

**RFC 8628 device authorization grant live on 3 endpoints + `markos login` command shipped with browser-approval + --token paste fallback + OS keychain storage; 31 tests green across state machine, endpoint, and integration suites.**

## Performance

- **Tasks:** 3 of 3 complete
- **Commits:** 3 atomic (one per task)
- **Tests:** 31 new passing (11 state-machine + 11 endpoint + 9 integration)
- **Phase 203 regressions:** 0 (rotation suite 20/20 green)

## Accomplishments

- Shipped `lib/markos/cli/device-flow.cjs` implementing the full RFC 8628 §3.5 state machine: `createDeviceSession` mints device_code (≥128-bit entropy, `djNhcl8` prefix) + user_code (8-char 32-alphabet with I/O/0/1 removed for 40-bit entropy); `pollToken` enforces slow_down + authorization_pending + expired_token + access_denied + one-shot approved→consumed replay defence; `approveDeviceSession` atomically flips pending→approved guarded by `WHERE status='pending'` and emits `cli/device.approved` audit row.
- Landed 3 server endpoints: `POST /api/cli/oauth/device/start` (public, rate-limited 10/min per IP, validates `client_id='markos-cli'` + `scope='cli'`); `POST /api/cli/oauth/device/token` (public, accepts `application/x-www-form-urlencoded` + `application/json`, maps typed errors per §3.5); `POST /api/cli/oauth/device/authorize` (authenticated via x-markos-user-id + x-markos-tenant-id; enforces `tenant_id` match + role IN ('owner', 'admin'); maps already_approved→409, expired→410, user_code_not_found→404).
- Replaced the Plan 01 stub at `bin/commands/login.cjs` with a full device-flow implementation: POSTs /start, opens the browser (unless `--no-browser` or `MARKOS_NO_BROWSER=1` or non-TTY), prints user_code, polls /token honoring slow_down (interval += 5s) + expired_token + access_denied; on success writes access_token to OS keychain via `setToken(profile, token)` with XDG fallback; also ships `--token=<mks_ak_...>` non-interactive mode with regex validation for CI use.
- Added `contracts/F-101-cli-oauth-device-v1.yaml` declaring 3 paths + 8 error envelopes (authorization_pending, slow_down, expired_token, access_denied, invalid_grant, invalid_client, already_approved, user_code_not_found) with block-form `tags:` to prevent the Phase 203 tags-missing regression. Regenerated `contracts/openapi.json` + `openapi.yaml` via `node scripts/openapi/build-openapi.cjs`: 64 → 65 flows, 97 → 100 paths.
- Wired STRIDE mitigations T-204-02-02 (per-IP rate-limit on /start), T-204-02-03 (one-shot approved→consumed), T-204-02-06 (header/body tenant match), T-204-02-07 (role check on /authorize), T-204-02-08 (audit emit on every approval).

## Task Commits

Each task was committed atomically (hooks ON, sequential execution, no --no-verify):

1. **Task 1: device-flow library + state machine + 11 RED unit tests** — `3e1fb42` (feat)
2. **Task 2: 3 OAuth device endpoints + F-101 contract + openapi regen + 11 endpoint tests** — `da815a0` (feat)
3. **Task 3: markos login command (device flow + --token paste) + 9 integration tests** — `5327064` (feat)

## Files Created/Modified

### Created (9)

Library (2):
- `lib/markos/cli/device-flow.cjs` — 3 state-machine exports + mintApiKey helper
- `lib/markos/cli/device-flow.ts` — TS twin facade

Server endpoints (3):
- `api/cli/oauth/device/start.js` — RFC 8628 §3.1 Device Authorization Request
- `api/cli/oauth/device/token.js` — RFC 8628 §3.4 Device Access Token Request
- `api/cli/oauth/device/authorize.js` — Approval endpoint (authenticated)

Contract (1):
- `contracts/F-101-cli-oauth-device-v1.yaml` — F-NN flow for OAuth device grant

Tests (3):
- `test/cli/device-flow.test.js` — 11 unit tests (df-01..df-10 + df-meta)
- `test/cli/oauth-endpoints.test.js` — 11 endpoint tests (oauth-01..oauth-10 + oauth-09b)
- `test/cli/login.test.js` — 9 integration tests (login-01..login-08 + login-meta)

### Modified (3)

- `bin/commands/login.cjs` — replaced Plan 01 stub with device-flow + --token implementation
- `contracts/openapi.json` — regenerated (65 flows / 100 paths)
- `contracts/openapi.yaml` — regenerated (65 flows / 100 paths)

## Exported APIs (Stable — Wave 1-3 consumers)

### lib/markos/cli/device-flow.cjs
```
createDeviceSession({ client, client_id, scope })
  -> { device_code, user_code, verification_uri,
       verification_uri_complete, expires_in, interval }

pollToken({ client, device_code, client_id })
  -> { error: 'authorization_pending' | 'slow_down' | 'expired_token'
              | 'access_denied' | 'invalid_grant' }
   | { access_token, token_type: 'bearer', tenant_id, key_fingerprint, scope: 'cli' }

approveDeviceSession({ client, user_code, tenant_id, user_id, user_role? })
  -> { approved: true, device_code }
  // throws: user_code_not_found | already_approved | expired

mintApiKey(client, tenant_id, user_id, name?)    // helper exposed for 204-03 reuse
  -> { access_token, key_fingerprint, id }

DEVICE_CODE_TTL_SEC = 900
DEFAULT_INTERVAL_SEC = 5
MAX_POLL_COUNT_BEFORE_REVOKE = 180
MAX_SLOW_DOWN_VIOLATIONS = 3
VERIFICATION_URI = 'https://app.markos.com/cli/authorize'
USER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
USER_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-…{4}$/
```

### CLI surface (bin/commands/login.cjs)
```
markos login                                  # device flow (default)
markos login --token=mks_ak_<32+hex>          # CI / non-interactive paste
markos login --profile=prod                   # writes to 'prod' keychain entry
markos login --no-browser                     # suppress openBrowser
markos login --json                           # JSON stdout output
markos login --timeout=120                    # override 900s default
MARKOS_NO_BROWSER=1 markos login              # env-var equivalent
```

## Decisions Made

- **Dual-body /token parser:** accepts both `application/x-www-form-urlencoded` (RFC 6749 standard) and `application/json` (CLI convenience). Zero-dep — inline URLSearchParams + JSON.parse.
- **Preemptive deadline check in CLI loop:** `if (Date.now() >= deadline) break;` after each sleep prevents the pitfall 2 race where the server reports pending but the CLI knows the session will never succeed (TTL already elapsed).
- **Global exit-sink in login.test.js:** a single `process.exit` override stays installed across all tests; each `captureExit` call records the first post-start exit code. Prevents false-positive "uncaught ExitError" suite failures from polling loops that leak across tests.
- **Inline SIGINT invocation in login-08:** instead of `setTimeout(() => process.emit('SIGINT'), 200)` — which reports the stub's thrown ExitError as uncaught to node:test — the test looks up login's registered SIGINT listener and invokes it synchronously from the test body.

## Deviations from Plan

None — plan executed exactly as written. The plan's assumed `slow_down` behaviour (interval += 5000ms) was implemented exactly; the one-shot approved→consumed was implemented via conditional UPDATE rather than raw SQL TX (both satisfy T-204-02-03; conditional-UPDATE is cheaper and composable with Supabase).

## Issues Encountered

1. **login-08 SIGINT-via-timer reported as uncaught in node:test:** fixed by switching from `setTimeout(() => process.emit('SIGINT'))` to direct listener lookup + synchronous invocation. The root cause is node:test intercepting uncaughtException from timer callbacks before user handlers, so the stubbed `process.exit`'s thrown ExitError must escape inside a promise chain, not a timer.
2. **Late `process.exit` calls from prior tests leaking into suite teardown:** fixed by installing a permanent global exit-sink that swallows late exits after the active captureExit has resolved.

## Next Phase Readiness

- Plan 204-03 (keys CRUD): UNBLOCKED — `mintApiKey` helper is exported from device-flow.cjs and the `markos_cli_api_keys` table shape is stable. Reuse the fingerprint convention (first 8 hex of sha256).
- Plan 204-04 (whoami): UNBLOCKED — access tokens minted by this plan can be passed to `/api/tenant/whoami` via `authedFetch`.
- Plan 204-05 (init): UNBLOCKED — `markos login` success is the prerequisite for first-run init.
- Plan 204-06+ (plan/run/eval/env/status/doctor): all consume keychain-stored tokens now produced by this plan.

## Verification

```
$ node --test test/cli/device-flow.test.js test/cli/oauth-endpoints.test.js test/cli/login.test.js
ℹ tests 31
ℹ pass 31
ℹ fail 0

$ node --test test/webhooks/rotation.test.js
ℹ tests 20
ℹ pass 20
ℹ fail 0
# Phase 203 regression clean
```

- `grep -c '"F-101"' contracts/openapi.json` → 4 (flow index + 3 operation annotations)
- `openapi.json` flow count: 65 (was 64); path count: 100 (was 97; 3 new `/api/cli/oauth/device/...` paths).

---
*Phase: 204-cli-markos-v1-ga*
*Plan: 02*
*Completed: 2026-04-23*
