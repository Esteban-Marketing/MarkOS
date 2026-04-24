---
phase: 204-cli-markos-v1-ga
plan: 07
subsystem: cli
tags: [cli, env, pgcrypto, encryption, dotenv, F-104, markos-cli-tenant-env, .markos-local]

# Dependency graph
requires:
  - phase: 204-01 (Plan 01)
    provides: "bin/lib/cli/{http,keychain,output,errors,config}.cjs primitives + EXIT_CODES + .markos-local/ gitignore protection via bin/install.cjs::applyGitignoreProtections"
  - phase: 204-03 (Plan 03)
    provides: "role-gate + audit-emit pattern on api/tenant/api-keys/* endpoints — mirrored verbatim for env endpoints"
  - phase: 204-04 (Plan 04)
    provides: "lib/markos/cli/whoami.cjs — resolveWhoami + resolveSessionWhoami dual-auth Bearer-to-tenant resolver (including role field) consumed by all 4 env endpoints"
  - phase: 204-05 (Plan 05)
    provides: "lib/markos/cli/plan.cjs::hashToken reused for Bearer sha256 derivation on env endpoints"
  - phase: 201 (Plan 02)
    provides: "pgcrypto extension loaded via migration 82 + audit staging + source_domain='cli' allow-list"
provides:
  - "supabase/migrations/76_markos_cli_tenant_env.sql + rollback — pgcrypto-encrypted tenant env table (RLS tenant isolation + composite PK + 2 SECURITY DEFINER RPCs for encrypt/decrypt)"
  - "lib/markos/cli/env.cjs + .ts — 6 exports: listEnv, pullEnv, pushEnv, deleteEnv + parseDotenv + serializeDotenv"
  - "api/tenant/env/list.js — GET /api/tenant/env (member-accessible; value_preview only)"
  - "api/tenant/env/pull.js — GET /api/tenant/env/pull (owner/admin only; decrypts + returns; audit env.pulled)"
  - "api/tenant/env/push.js — POST /api/tenant/env/push (owner/admin only; 100 entries + 8192 char value caps; audit env.pushed with keys only)"
  - "api/tenant/env/delete.js — POST /api/tenant/env/delete (owner/admin only; bulk; audit env.deleted)"
  - "bin/commands/env.cjs — replaces Plan 01 stub with full 4-subcommand CLI (list|pull|push|delete) + --force/--diff/--merge/--dry-run/--yes"
  - "contracts/F-104-cli-env-v1.yaml — new contract (4 paths + 10 error envelope schemas)"
  - "openapi regen: 69 flows / 112 paths (68 → 69 flows; +4 new CLI env paths)"
  - "Wave 2 COMPLETE — unblocks Wave 3 (204-08 status, 204-09+ doctor/distribution/hardening)"
affects:
  - "204-08 (markos status) — can list env-pushed audit events alongside run history"
  - "204-11 (markos doctor) — will surface 'env vars not configured' hint when /env list is empty"
  - "204-12 (security hardening + E2E) — must drill pgcrypto key rotation + null-key guard + audit payload for value leakage"
  - "205 (Pricing engine) — will consume tenant env for billing-provider API keys (Stripe, etc.) via markos env push"
  - "206 (SOC 2) — env encryption key lifecycle + rotation policy + audit retention will fold into SOC 2 controls"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pgcrypto pgp_sym_encrypt at rest with per-call encryption key argument: the encryption key is threaded from process.env into SECURITY DEFINER RPC parameters rather than hardcoded as a SQL literal, so postgres query logs never capture the key bytes."
    - "Dual audit emit (library + endpoint): library pushEnv emits with generic actor_role='tenant_admin', endpoint push.js re-emits authoritatively with resolved role='owner'|'admin'. Downstream audit replay sees both; compliance can filter on the endpoint-authored row."
    - "Explicit-column allow-list defense-in-depth: listEnv SELECTs `key, value_preview, updated_at, updated_by` never value_encrypted. Defeats RLS-bypass + driver-misuse attack paths in one grep-verifiable line (Test lib-10 asserts the constant directly)."
    - "Secret-preview redaction: value_preview = first 4 chars + '…' stored alongside encrypted blob at write time. Operators can recognise rotating secrets in the list view without triggering the privileged decrypt path."
    - ".markos-local/.env safety contract: pull refuses to clobber without --force/--diff/--merge; write paths chmod 0o600; the path is auto-gitignored by bin/install.cjs::applyGitignoreProtections. Three tamper vectors (overwrite, exposure, accidental commit) closed in one file."
    - "Zero-dep dotenv parser + serializer round-trip: hand-rolled parseDotenv/serializeDotenv in lib/markos/cli/env.cjs honor KEY=, KEY=\"q v\", KEY='s v', # comments, blank lines, trailing comments, and backslash-escapes in double-quoted values so pull/push files survive a full round trip."

key-files:
  created:
    - "supabase/migrations/76_markos_cli_tenant_env.sql — markos_cli_tenant_env table + pgcrypto guard + set_env_entry + get_env_entries RPCs + RLS"
    - "supabase/migrations/rollback/76_markos_cli_tenant_env.down.sql — drops RPCs + policy + index + table (NOT pgcrypto)"
    - "lib/markos/cli/env.cjs — 6 exports: 4 data primitives + parseDotenv + serializeDotenv"
    - "lib/markos/cli/env.ts — TS twin for typed consumers"
    - "api/tenant/env/list.js — GET /api/tenant/env (member; redacted list)"
    - "api/tenant/env/pull.js — GET /api/tenant/env/pull (owner/admin; decrypt + audit env.pulled)"
    - "api/tenant/env/push.js — POST /api/tenant/env/push (owner/admin; 100/8192 caps; audit env.pushed)"
    - "api/tenant/env/delete.js — POST /api/tenant/env/delete (owner/admin; bulk; audit env.deleted)"
    - "contracts/F-104-cli-env-v1.yaml — new 4-path + 10-envelope contract"
    - "bin/commands/env.cjs — full CLI dispatch replacing the Plan 01 stub"
    - "test/cli/env-lib.test.js — 10 tests (migration shape + library primitives + dotenv round trip)"
    - "test/cli/env-endpoints.test.js — 12 tests (auth gates + role gates + validation + encryption round trip + F-104 contract shape)"
    - "test/cli/env.test.js — 13 tests (list/pull/push/delete + file-safety modes + --dry-run/--yes)"
  modified:
    - "contracts/openapi.json — regenerated (69 flows / 112 paths)"
    - "contracts/openapi.yaml — regenerated (69 flows / 112 paths)"
    - "bin/commands/env.cjs — replaced 'not yet implemented' stub with full implementation"
  removed: []

key-decisions:
  - "pgcrypto encryption key lives in process.env.MARKOS_ENV_ENCRYPTION_KEY (server-side secret, not a tenant secret). Rotation is deferred to Phase 206 SOC 2 controls — out of scope for v1 GA, but the endpoint pull.js + push.js guard with explicit 500 encryption_key_missing (no silent null-key fallback) so a misconfigured deploy fails loud rather than writing null-encrypted blobs."
  - "4th endpoint — DELETE equivalent — shipped as POST /api/tenant/env/delete (not DELETE /api/tenant/env/{key}) so the endpoint accepts a bulk `{ keys: [...] }` body and mirrors the push/delete pair's body shape. Single key deletes go through the same path with a one-element array. Avoids URL-param encoding edge cases + keeps the REST surface small."
  - "F-104 declares 4 paths (not the 3 originally sketched in must_haves). Plan body explicitly called out the 4th endpoint expansion in Task 3 (`CLIENT-SIDE calls a new endpoint POST /api/tenant/env/delete`) — materialised as api/tenant/env/delete.js during Task 2 so the CLI's `markos env delete` subcommand has a real server path to hit. F-104 header 'four paths' matches Task 2 + Task 3 scope."
  - "List endpoint is member-accessible (no role gate). Rationale: value_preview is 4 chars + ellipsis — treated as non-secret metadata. Mutations (pull/push/delete) keep owner/admin gate because they expose full plaintext or modify the tenant state."
  - "Audit payload for env.pushed includes keys array (which keys were mutated) + count — never values. env.deleted mirrors. env.pulled carries only key_count (list catalogs keys separately). Hard rail: Test lib-05 asserts the payload JSON does not contain the plaintext secret bytes."
  - "Dotenv parser lives in the same library file as the data primitives so the server push endpoint can reuse DOTENV_KEY_RE for its regex validation instead of drifting. Constant exported; push.js + delete.js import directly."

patterns-established:
  - "Pattern: pgcrypto-at-rest with SECURITY DEFINER RPCs — new tables that need encrypted columns add 2 RPCs (set_xxx + get_xxx) in the same migration. JS layer never runs raw pgp_sym_encrypt/decrypt; RPC signature keeps key bytes out of SQL literals and therefore out of postgres query logs."
  - "Pattern: dual-audit emit (library + endpoint) — library emits with generic actor_role; endpoint emits authoritatively with resolved role. Compliance drains see both; reports filter on endpoint rows."
  - "Pattern: .markos-local/.env as the CLI-client persistence surface — any command that writes client state writes here, mode 0o600, parent auto-created. .gitignore already covers .markos-local/ via Plan 01 install.cjs."
  - "Pattern: file-safety tri-mode on CLI pull/sync — --force/--diff/--merge. --force clobbers, --diff previews without writing, --merge keeps local-only keys. Default without any flag refuses to overwrite with a typed error envelope + hint."

requirements-completed: [CLI-01, QA-01, QA-02, QA-04, QA-11, QA-13]

# Metrics
duration: 90min
completed: 2026-04-24
---

# Phase 204 Plan 07: `markos env` — CLI Tenant Env Sync Summary

**Wave 2 closes with pgcrypto-encrypted tenant env vars, a 4-subcommand CLI, and the F-104 contract — operators can now `markos env pull/push/diff/merge` without touching the dashboard.**

## Performance

- **Duration:** ~90 min
- **Tasks:** 3 completed
- **Files created:** 11 (migration + rollback + library + TS twin + 4 endpoints + contract + 3 test files + replaced CLI dispatcher)
- **Files modified:** 2 (openapi regen)

## Accomplishments

- Migration 76 ships `markos_cli_tenant_env` with pgcrypto pgp_sym_encrypt at rest + 2 SECURITY DEFINER RPCs (`set_env_entry`, `get_env_entries`) + RLS tenant isolation + composite PK `(tenant_id, key)`.
- 4 endpoints materialise the list/pull/push/delete surface with the dual-auth (Bearer OR legacy session) pattern inherited from Wave 2 endpoints. Role gate (`owner`|`admin`) on pull/push/delete; list is member-accessible because it returns only `value_preview`.
- `lib/markos/cli/env.cjs` exports 6 primitives — 4 data ops + a zero-dep dotenv parser/serializer that round-trips through the stdlib without adding a runtime dependency.
- `bin/commands/env.cjs` replaces the Plan 01 stub with a full dispatcher. `env pull` lands values in `.markos-local/.env` at mode `0o600`, refuses silent overwrite (file_exists error), and offers `--force`/`--diff`/`--merge` for power users. `env push` reads the same file, parses via `parseDotenv`, and POSTs. `env delete <key> [--yes]` mirrors the `markos keys revoke` --yes gate.
- F-104 contract documents 4 paths + 10 error envelope schemas. openapi regen ticks to **69 flows / 112 paths** (from 68 / 108).
- **35 new tests** green (lib-01..10 + ep-01..12 + env-01..12 + env-meta); full CLI suite (203 tests) green → zero regression on 204-01..06.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 76 + env library + RED tests** — `0e08203` (feat)
2. **Task 2: 4 env endpoints + F-104 + openapi regen** — `c63a2d3` (feat)
3. **Task 3: `markos env` CLI with .markos-local safety** — `3a27025` (feat)

## Files Created/Modified

### Migration + Rollback
- `supabase/migrations/76_markos_cli_tenant_env.sql` — encrypted env table + RPCs + RLS
- `supabase/migrations/rollback/76_markos_cli_tenant_env.down.sql` — drops RPCs + policy + table (NOT pgcrypto)

### Library
- `lib/markos/cli/env.cjs` — 6 exports (listEnv, pullEnv, pushEnv, deleteEnv, parseDotenv, serializeDotenv)
- `lib/markos/cli/env.ts` — TS twin

### Endpoints
- `api/tenant/env/list.js` — member-accessible list (value_preview only)
- `api/tenant/env/pull.js` — owner/admin decrypt + audit env.pulled
- `api/tenant/env/push.js` — owner/admin upsert + validation + audit env.pushed
- `api/tenant/env/delete.js` — owner/admin bulk delete + audit env.deleted

### Contract + Regen
- `contracts/F-104-cli-env-v1.yaml` — new 4-path contract
- `contracts/openapi.json` — regen (69 flows / 112 paths)
- `contracts/openapi.yaml` — regen

### CLI
- `bin/commands/env.cjs` — full dispatcher replacing Plan 01 stub

### Tests
- `test/cli/env-lib.test.js` — 10 library + migration tests
- `test/cli/env-endpoints.test.js` — 12 endpoint + F-104 tests
- `test/cli/env.test.js` — 13 CLI integration tests

## Decisions Made

See frontmatter `key-decisions`. Primary drivers:

1. **pgcrypto-with-per-call-key RPCs** keep the encryption key out of SQL literals (and therefore postgres query logs).
2. **4th endpoint shipped** (`POST /api/tenant/env/delete`) to back the CLI's delete subcommand — F-104 declares 4 paths accordingly.
3. **Member-accessible list** is safe because `value_preview` is 4 chars + ellipsis; never full plaintext. All mutations stay owner/admin-gated.
4. **Audit payload keys-only, never values** — hard rail enforced by Test lib-05 (grep asserts plaintext bytes absent from payload JSON).
5. **`.markos-local/.env` tri-mode safety** (`--force`/`--diff`/`--merge`) mirrors `vercel env pull` UX while closing the clobber vector RESEARCH §Pitfall 4 flagged.

## Deviations from Plan

None — plan executed exactly as written. The 4th endpoint (delete) was explicitly flagged in the plan body's Task 3 decision note and materialised during Task 2 so the CLI had a server path to hit before Task 3.

## Issues Encountered

**1. Dotenv round-trip broke on pre-quoted values**
- **Found during:** Task 1 test lib-08 (serialize → parse round trip)
- **Issue:** `QUOTED_VALUE` field containing `"already quoted"` was serialized as `QUOTED_VALUE="\"already quoted\""` and the original parseDotenv (naive indexOf('"')) stopped at the first escaped quote, giving `\` as the value.
- **Fix:** Re-wrote the double-quoted value scanner to honor `\"`, `\\`, `\n`, `\t` escapes during parse. Now symmetric with serializeDotenv's escape pass.
- **Files modified:** `lib/markos/cli/env.cjs`
- **Verification:** All 10 lib tests green; round-trip + invalid-key + comment cases all covered.
- **Committed in:** `0e08203` (Task 1)

## User Setup Required

**External services require manual configuration** for production deployment:

- `MARKOS_ENV_ENCRYPTION_KEY` — random 32+ byte secret (hex or base64). Must be set identically across all app servers. Loss of this value renders all stored env values unrecoverable. Rotation policy deferred to Phase 206 SOC 2.

No dashboard configuration needed — the pgcrypto extension is already loaded via migration 82.

## Testing

- **Task 1:** `node --test test/cli/env-lib.test.js` → 10 / 10 green
- **Task 2:** `node --test test/cli/env-endpoints.test.js` → 12 / 12 green
- **Task 3:** `node --test test/cli/env.test.js` → 13 / 13 green
- **Regression:** `node --test test/cli/*.test.js` → 203 / 203 green (Wave 1 + Wave 2 + Plan 07)

## Success Criteria (from plan)

- [x] Migration 76 applies; pgcrypto loaded; RLS + composite PK verified
- [x] 4 endpoints implement contract; encrypted storage + reveal gate
- [x] `bin/commands/env.cjs` wired; all 4 subcommands work
- [x] `lib/markos/cli/env.cjs` + `.ts` export primitives
- [x] F-104 + openapi regen
- [x] All new tests pass + prior 204-01..06 green
- [x] Audit emits on push/delete/pull; no plaintext leakage
- [x] Atomic commits + SUMMARY + STATE + ROADMAP

## What's Next

**Wave 2 is CLOSED.** Wave 3 unblocked:

- **204-08 — markos status:** consumes `listRuns` + `getRun` from Plan 06 + `listEnv` from this plan for a unified tenant-status overview
- **204-09..12:** distribution (npm/Homebrew/Scoop), `markos doctor`, security hardening + E2E, v2 doctrine compliance gap-closure
- **204-13:** v2 doctrine compliance gap-closure (the final plan before Phase 205 pricing engine handoff)
