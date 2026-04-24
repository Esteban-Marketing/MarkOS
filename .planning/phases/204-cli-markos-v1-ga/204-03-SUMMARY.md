---
phase: 204-cli-markos-v1-ga
plan: 03
subsystem: cli
tags: [cli, api-keys, crud, keychain, sha256, audit, tenant-rls, role-gate, openapi, F-102]

# Dependency graph
requires:
  - phase: 204-01 (Plan 01)
    provides: "bin/lib/cli/{keychain,http,output,errors,config}.cjs primitives + migration 74 (markos_cli_api_keys RLS tenant-isolated, sha256-hashed)"
  - phase: 204-02 (Plan 02)
    provides: "lib/markos/cli/device-flow.cjs mintApiKey helper — refactored in this plan to import from the new shared api-keys.cjs primitive (single source of truth)"
provides:
  - "lib/markos/cli/api-keys.cjs — 4 primitives (mintKey, listKeys, revokeKey, resolveKeyByHash)"
  - "lib/markos/cli/api-keys.ts — TS twin facade"
  - "3 tenant endpoints: GET + POST /api/tenant/api-keys and POST /api/tenant/api-keys/{key_id}/revoke"
  - "bin/commands/keys.cjs — markos keys list|create|revoke CLI with --yes gate + interactive confirm"
  - "contracts/F-102-cli-api-keys-v1.yaml — API-keys F-NN contract with 3 paths + 5 error envelopes + block-form tags"
  - "openapi regenerated (65 → 66 flows, 100 → 102 paths)"
  - "Audit surface: source_domain='cli', action='api_key.created|revoked' with key_fingerprint payload — NEVER key_hash"
  - "resolveKeyByHash foundation for Phase 205 Bearer auth middleware"
  - "Bin parser: positional[] collection + --name value flag"
affects:
  - "204-04 (whoami) — consumes resolveKeyByHash for token → tenant/user resolution"
  - "204-05 (init) + 204-06 (plan/run) + 204-07 (eval) + 204-08 (env) + 204-09 (status) — all authed commands now have key lifecycle (create/rotate/revoke) via markos keys"
  - "Phase 205 (Bearer auth middleware) — imports resolveKeyByHash directly"
  - "Phase 206 (audit compliance filter) — api_key.created / api_key.revoked rows carry source_domain='cli'"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Twin export .cjs + .ts with identical signatures (same as Plan 204-02 device-flow)"
    - "Endpoint-level authoritative audit emit (actor_role = real resolved role) + library-level belt-and-suspenders emit"
    - "Explicit column allow-list in both library (LIST_COLUMNS) + endpoint (response shape) — NEVER key_hash"
    - "Idempotent revoke: second call to revokeKey on already-revoked row returns existing revoked_at, no error"
    - "Per-test fetch mock pattern for CLI integration tests — avoids node:test interaction with async http server cleanup"
    - "CLI --yes gate + interactive readline prompt fallback in TTY — refuses in non-TTY without --yes (T-204-03-07)"
    - "Positional args collection in cli-runtime.cjs for subcommand-style operators (keys list/create/revoke)"

key-files:
  created:
    - "lib/markos/cli/api-keys.cjs — 4 primitives + sha256Hex + constants"
    - "lib/markos/cli/api-keys.ts — TS twin facade"
    - "api/tenant/api-keys/list.js — GET list, tenant-scoped, no role gate"
    - "api/tenant/api-keys/create.js — POST create, role gate owner|admin, 201 with access_token once"
    - "api/tenant/api-keys/[key_id]/revoke.js — POST revoke, role gate owner|admin, 200 revoked_at"
    - "contracts/F-102-cli-api-keys-v1.yaml — F-NN contract (block-form tags)"
    - "test/cli/api-keys.test.js — 11 unit tests (ak-01..ak-10 + ak-meta)"
    - "test/cli/api-keys-endpoints.test.js — 8 endpoint tests (ep-01..ep-08)"
    - "test/cli/keys.test.js — 12 CLI integration tests (keys-01..keys-11 + keys-meta)"
  modified:
    - "bin/commands/keys.cjs — replaced Plan 01 stub with full list|create|revoke dispatcher"
    - "bin/cli-runtime.cjs — added positional[] + --name value flag"
    - "lib/markos/cli/device-flow.cjs — mintApiKey refactored to delegate to shared mintKey from api-keys.cjs"
    - "contracts/openapi.json — regenerated (66 flows / 102 paths)"
    - "contracts/openapi.yaml — regenerated (66 flows / 102 paths)"

key-decisions:
  - "Library (api-keys.cjs) is the single source of truth for crypto + hash + fingerprint; device-flow.cjs now delegates via mintApiKey wrapper → mintKey for backward compat."
  - "Endpoint-level audit emit (with actor_role = real resolved role) is authoritative; library-level emit is belt-and-suspenders for direct-library consumers. Redundant count acceptable because 'api_key.created' / 'api_key.revoked' are count-once events in compliance reports."
  - "Name validation range 1-64 chars (per F-102 contract); name is fully optional — null when omitted."
  - "Revoke is idempotent: a second revoke on an already-revoked key returns the existing revoked_at timestamp instead of throwing 'already_revoked'. Simpler caller semantics, audit row still captures the second actor event."
  - "CLI integration tests mock global fetch per-test instead of spinning up real http.createServer. Earlier attempt with real stub servers caused node:test to silently drop 2-6 tests (likely server close async race); fetch mock is deterministic."
  - "--yes gate is a hard fail in non-TTY (exit 1 with 'refusing to revoke') — prevents foot-guns in CI scripts."

patterns-established:
  - "Pattern: Library-endpoint audit layering — library emits best-effort with a generic actor_role; endpoint re-emits with the resolved role. Compliance filter can dedupe on (tenant_id, action, payload.key_id) if needed."
  - "Pattern: Per-test fetch mock for CLI command tests (test/cli/keys.test.js installFetchMock). Replaces the real http.createServer stub when tests involve error-flow paths that trigger process.exit."
  - "Pattern: Bin runtime positional[] collection — first token after command becomes positional[0] (subcommand), subsequent non-flag tokens become positional[1..n]. Future CLI operators reuse this."

requirements-completed:
  - CLI-01
  - QA-01
  - QA-02
  - QA-04
  - QA-11
  - QA-15

# Metrics
duration: ~50min
completed: 2026-04-23
---

# Phase 204 Plan 03: API-Key CRUD End-to-End Summary

**4 library primitives + 3 tenant endpoints + markos keys CLI + F-102 contract shipped; 31 new tests green, zero regression on 204-01/204-02 suites. `resolveKeyByHash` ready for Phase 205 Bearer auth middleware.**

## Performance

- **Tasks:** 3 of 3 complete
- **Commits:** 3 atomic (one per task)
- **Tests:** 31 new passing (11 library + 8 endpoint + 12 CLI); 31 Plan 204-02 tests remain green
- **Phase 204-01/02 regressions:** 0

## Accomplishments

- Shipped `lib/markos/cli/api-keys.cjs` with 4 primitives: `mintKey` (32-byte entropy plaintext `mks_ak_<64 hex>`, sha256 hash, 8-char fingerprint, `cak_<hex>` primary key); `listKeys` (tenant-scoped, explicit column allow-list that excludes `key_hash`); `revokeKey` (SELECT+tenant compare throws `cross_tenant_forbidden`, conditional UPDATE, best-effort audit emit); `resolveKeyByHash` (Bearer auth resolver — returns row with revoked_at so callers can deny). Refactored `lib/markos/cli/device-flow.cjs` to import `mintKey` from the shared primitive instead of duplicating crypto + hash logic.
- Landed 3 tenant endpoints: `GET /api/tenant/api-keys` (any authed member); `POST /api/tenant/api-keys` (role `owner|admin`, body `{name?}`, 201 returns `{key_id, access_token, key_fingerprint, name, created_at}` — `access_token` is plaintext and returned ONLY here); `POST /api/tenant/api-keys/{key_id}/revoke` (role `owner|admin`, sets `revoked_at=now()`, idempotent, 200 returns `{revoked_at}`). All three emit authoritative audit rows with `source_domain='cli'` action `api_key.created|revoked` and payload `{key_id, key_fingerprint, name}` — NEVER key_hash or plaintext.
- Shipped `bin/commands/keys.cjs` implementing `markos keys list`, `markos keys create [--name=X]`, and `markos keys revoke <key_id> [--yes]`. The create path prints `access_token` ONCE with an explicit TTY warning `"This is the only time the full token is shown. Store it securely."`. The revoke path enforces the `--yes` gate: non-TTY without `--yes` exits 1 with `refusing to revoke without --yes flag in non-interactive mode`; TTY without `--yes` prompts `Revoke key <id>? This cannot be undone. [y/N]` and aborts on anything but `y`. Exit codes follow D-10: 0 success, 1 user error, 2 transient, 3 auth failure, 4 quota/permission, 5 internal.
- Added `contracts/F-102-cli-api-keys-v1.yaml` declaring 3 paths + 5 error envelopes (`UnauthorizedError`, `InsufficientRoleError`, `CrossTenantForbiddenError`, `KeyNotFoundError`, `InvalidNameError`, `MethodNotAllowedError`) with block-form `tags:` syntax (prevents the 203 tags-missing regression). Regenerated `contracts/openapi.json` + `openapi.yaml` via `node scripts/openapi/build-openapi.cjs`: 65 → 66 flows, 100 → 102 paths.
- Extended `bin/cli-runtime.cjs` with `positional[]` collection (non-flag tokens captured for subcommand routing) and the `--name` value flag.
- Wired STRIDE mitigations T-204-03-01 (key_hash never echoed — explicit column allow-list in both library + endpoint), T-204-03-02 (plaintext returned only from POST create), T-204-03-03 (role gate owner|admin on create + revoke before library delegation), T-204-03-04 (cross_tenant_forbidden on revoke SELECT+compare), T-204-03-05 (audit emit with key_fingerprint payload — NEVER key_hash or plaintext), T-204-03-07 (CLI --yes gate + interactive confirm fallback).

## Task Commits

Each task was committed atomically (hooks ON, sequential execution, no --no-verify):

1. **Task 1: api-keys library primitives + device-flow refactor + 11 unit tests** — `1f7c77b` (feat)
2. **Task 2: 3 tenant api-key endpoints + F-102 contract + openapi regen + 8 endpoint tests** — `fa2b5f3` (feat)
3. **Task 3: markos keys CLI (list|create|revoke) + positional args + 12 integration tests** — `27c19bb` (feat)

## Files Created/Modified

### Created (8)

Library (2):
- `lib/markos/cli/api-keys.cjs` — 4 primitives + sha256Hex + constants
- `lib/markos/cli/api-keys.ts` — TS twin facade

Server endpoints (3):
- `api/tenant/api-keys/list.js`
- `api/tenant/api-keys/create.js`
- `api/tenant/api-keys/[key_id]/revoke.js`

Contract (1):
- `contracts/F-102-cli-api-keys-v1.yaml`

Tests (3):
- `test/cli/api-keys.test.js` — 11 tests (ak-01..ak-10 + ak-meta)
- `test/cli/api-keys-endpoints.test.js` — 8 tests (ep-01..ep-08)
- `test/cli/keys.test.js` — 12 tests (keys-01..keys-11 + keys-meta)

### Modified (5)

- `bin/commands/keys.cjs` — replaced Plan 01 stub with full list|create|revoke dispatcher
- `bin/cli-runtime.cjs` — positional[] collection + --name value flag
- `lib/markos/cli/device-flow.cjs` — mintApiKey now delegates to shared mintKey from api-keys.cjs
- `contracts/openapi.json` — regenerated (66 flows / 102 paths)
- `contracts/openapi.yaml` — regenerated (66 flows / 102 paths)

## Exported APIs (Stable — Wave 2-3 consumers)

### lib/markos/cli/api-keys.cjs
```
mintKey({ client, tenant_id, user_id, name?, scope='cli' })
  -> { key_id, access_token, key_fingerprint, name, created_at }
  // access_token (plaintext) is the ONLY point plaintext leaves the library

listKeys({ client, tenant_id })
  -> { keys: [{ id, name, key_fingerprint, scope, created_at, last_used_at }] }
  // Explicit column allow-list excludes key_hash (T-204-03-01)

revokeKey({ client, tenant_id, user_id, key_id })
  -> { revoked_at }
  // throws: key_not_found | cross_tenant_forbidden

resolveKeyByHash({ client, key_hash })
  -> { key_id, tenant_id, user_id, scope, revoked_at } | null
  // Bumps last_used_at on active rows; returns revoked row so caller can deny

TABLE = 'markos_cli_api_keys'
KEY_PLAINTEXT_PREFIX = 'mks_ak_'
KEY_ID_PREFIX = 'cak_'
FINGERPRINT_LENGTH = 8
LIST_COLUMNS = 'id, name, key_fingerprint, scope, created_at, last_used_at'
RESOLVE_COLUMNS = 'id, tenant_id, user_id, scope, revoked_at'
```

### CLI surface (bin/commands/keys.cjs)
```
markos keys list                         # any authed member
markos keys create [--name=LABEL]        # owner|admin only; prints token ONCE
markos keys revoke <key_id> [--yes]      # owner|admin only; --yes or TTY confirm
```

## Decisions Made

- **Single source of truth for crypto.** `lib/markos/cli/api-keys.cjs::mintKey` owns plaintext generation + sha256 + fingerprint + INSERT. `lib/markos/cli/device-flow.cjs::mintApiKey` now a thin wrapper that delegates. This removes duplication identified in Plan 204-02's inline helper.
- **Endpoint-level authoritative audit.** The library emits a best-effort audit row with `actor_role='tenant_admin'` (the library doesn't know the real role). The endpoint re-emits with the resolved role. Future compliance filter (Phase 206) can dedupe on (tenant_id, action, payload.key_id, payload.key_fingerprint) if needed, but duplicate events for a once-per-lifecycle action are low cost.
- **Idempotent revoke.** A second revoke on an already-revoked key returns the existing `revoked_at` instead of throwing. Matches the common user mental model — "revoke this key" — and simplifies retries in flaky networks.
- **CLI tests mock `globalThis.fetch` directly.** An earlier harness that spun up a real `http.createServer` per test caused node:test to silently drop 2-6 tests (likely a race between `server.close()` async completion and test teardown). The fetch-mock approach is deterministic and 80× faster (~8ms vs ~500ms per test) with no observable flakiness.
- **`--yes` is a hard fail in non-TTY.** The plan allows interactive TTY confirm as a fallback but explicitly refuses in non-TTY — prevents footguns like `echo "" | markos keys revoke cak_abc` from silently proceeding.
- **openapi path count: 102 not 103.** The plan estimate was 103 (+3 new paths for list/create/revoke) but the OpenAPI merger consolidates GET and POST under the shared `/api/tenant/api-keys` key, yielding 100 + 2 = 102. All three operations are present.

## Deviations from Plan

**1. [Task 3 test-harness refactor] CLI tests use fetch mocking instead of real http.createServer stubs.**

- **Found during:** Task 3 test execution — the initial harness using `http.createServer` stub servers caused node:test to register only 10 of 12 declared `test()` calls in the same file run; the missing 2 always matched the `403` response scenarios.
- **Issue:** Reproducible but not explainable — individual tests passed in isolation but were dropped without warning/cancelled/skipped counters when run together. JUnit/tap/spec reporters all reported `tests 10` with the two 403 tests absent.
- **Fix:** Replaced the http.createServer harness with a per-test `installFetchMock` that shadows `globalThis.fetch`. All 12 tests now register and pass deterministically.
- **Files modified:** `test/cli/keys.test.js` (fixture rewrite)
- **Verification:** `node --test test/cli/keys.test.js` now reports `tests 12 / pass 12`. Full regression run across api-keys.test.js + keys.test.js + api-keys-endpoints.test.js + login.test.js + device-flow.test.js + oauth-endpoints.test.js shows `tests 62 / pass 62`.
- **Committed in:** `27c19bb` (Task 3 commit)

**Total deviations:** 1 (test-harness refactor, no production-code impact)
**Impact on plan:** None — the CLI implementation matches the plan exactly; only the test harness changed.

## Issues Encountered

1. **node:test silently drops tests that spin up `http.createServer` in scenarios with `process.exit` unwinding.** Worked around via fetch mocking (above). Root cause likely involves the interaction between server socket cleanup and the `process.on('uncaughtException')` handler needed to swallow `ExitError` from the stubbed `process.exit`. Login.test.js (Plan 204-02) uses the same stub-server approach without issue — the difference is likely that login.cjs uses `globalThis.fetch` directly while keys.cjs uses `authedFetch` which has a retry loop that may complicate timing.

## Next Phase Readiness

- Plan 204-04 (whoami): UNBLOCKED — `resolveKeyByHash` is exported from api-keys.cjs and resolves Bearer token → `{key_id, tenant_id, user_id, scope, revoked_at}` in a single DB round-trip.
- Plan 204-05 (init): UNBLOCKED — operators can now provision a dedicated CLI key via `markos keys create` after first login.
- Plan 204-06+ (plan/run/eval/env/status/doctor): all authed commands now have the full key-lifecycle CLI needed for production-grade ops.
- Phase 205 (Bearer auth middleware): UNBLOCKED — `resolveKeyByHash` returns a revoked row with `revoked_at` so middleware can distinguish "no such key" (→ 401) from "key exists but revoked" (→ 401 with hint `Key was revoked on <date>`).

## Verification

```
$ node --test test/cli/api-keys.test.js test/cli/keys.test.js test/cli/api-keys-endpoints.test.js
ℹ tests 31
ℹ pass 31
ℹ fail 0

$ node --test test/cli/api-keys.test.js test/cli/keys.test.js test/cli/api-keys-endpoints.test.js test/cli/login.test.js test/cli/device-flow.test.js test/cli/oauth-endpoints.test.js
ℹ tests 62
ℹ pass 62
ℹ fail 0
# Plans 204-01 + 204-02 regression clean
```

- `grep -c '"F-102"' contracts/openapi.json` → 6 (flow index + operation annotations)
- `openapi.json` flow count: 66 (was 65); path count: 102 (was 100; 2 new path keys: `/api/tenant/api-keys` shared by GET+POST, `/api/tenant/api-keys/{key_id}/revoke` for POST).

---
*Phase: 204-cli-markos-v1-ga*
*Plan: 03*
*Completed: 2026-04-23*
