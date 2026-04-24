---
phase: 204-cli-markos-v1-ga
plan: 01
subsystem: cli
tags: [cli, oauth-device-flow, keychain, xdg, sse, rls, node22, keytar]

# Dependency graph
requires:
  - phase: 200-saas-readiness-wave-0
    provides: "bin/install.cjs dispatch pattern (mirrored for 10 new commands); bin/lib/brief-parser.cjs zero-dep convention"
  - phase: 202-mcp-foundation
    provides: "AUDIT_SOURCE_DOMAINS pattern — extended with 'cli' as 13th domain"
provides:
  - "Wave 1 foundation for all Phase 204 downstream plans"
  - "7 shared CLI primitives (keychain, config, http, output, errors, open-browser, sse)"
  - "2 migrations + rollbacks (73 device sessions, 74 api keys)"
  - "10 command stubs wired into install.cjs dispatch"
  - "4 test fixtures (keychain-stub, xdg-tmp, oauth-device-server, sse-event-server)"
  - "Node 22 engine floor + keytar@^7.9.0 dependency"
  - "AUDIT_SOURCE_DOMAINS includes 'cli' (enables Phase 206 compliance filter)"
  - "parseCliArgs extended with 13 new flags (--profile, --json, --watch, --force, etc.)"
affects:
  - "204-02 (login)"
  - "204-03 (keys)"
  - "204-04 (whoami)"
  - "204-05 (init)"
  - "204-06 (plan/run)"
  - "204-07 (eval)"
  - "204-08 (env)"
  - "204-09 (status)"
  - "204-11 (doctor)"
  - "All Phase 204 test files (consume fixtures)"
  - "Phase 206 (audit filter on source_domain='cli')"

# Tech tracking
tech-stack:
  added: ["keytar@^7.9.0 (OS keychain; archived upstream but still ships for Node 22)"]
  patterns:
    - "Fallback decision tree: env-var > keytar > XDG file (D-02/D-06)"
    - "TTY-adaptive rendering via shouldUseJson() (D-10 exit codes)"
    - "Hand-rolled SSE parser with Last-Event-ID reconnect + heartbeat watchdog"
    - "Dual-purpose --profile flag: install profile (full/cli/minimal) OR CLI auth profile, context-sensitive by command"

key-files:
  created:
    - "bin/lib/cli/keychain.cjs — getToken/setToken/deleteToken/listProfiles + xdgCredPath"
    - "bin/lib/cli/config.cjs — loadConfig/saveConfig/resolveProfile + DEFAULT_CONFIG"
    - "bin/lib/cli/http.cjs — authedFetch + generateTraceId + AuthError/TransientError"
    - "bin/lib/cli/output.cjs — EXIT_CODES + shouldUseJson + renderTable/renderJson"
    - "bin/lib/cli/errors.cjs — formatError + ERROR_TO_EXIT + exitCodeFor"
    - "bin/lib/cli/open-browser.cjs — openBrowser (cross-platform spawn)"
    - "bin/lib/cli/sse.cjs — streamSSE (Last-Event-ID + heartbeat + reconnect)"
    - "bin/commands/{init,plan,run,eval,login,keys,whoami,env,status,doctor}.cjs — 10 stubs"
    - "supabase/migrations/73_markos_cli_device_sessions.sql"
    - "supabase/migrations/74_markos_cli_api_keys.sql"
    - "supabase/migrations/rollback/73_markos_cli_device_sessions.down.sql"
    - "supabase/migrations/rollback/74_markos_cli_api_keys.down.sql"
    - "test/cli/_fixtures/keychain-stub.cjs — in-memory keytar shim"
    - "test/cli/_fixtures/xdg-tmp.cjs — isolated XDG_CONFIG_HOME helper"
    - "test/cli/_fixtures/oauth-device-server.cjs — scriptable RFC 8628 stub"
    - "test/cli/_fixtures/sse-event-server.cjs — scriptable SSE event emitter"
    - "test/cli/keychain.test.js, test/cli/output.test.js, test/cli/profiles.test.js"
    - "test/migrations/73_markos_cli_device_sessions.test.js, test/migrations/74_markos_cli_api_keys.test.js"
  modified:
    - "bin/cli-runtime.cjs — MIN_NODE_VERSION bumped to 22.0.0; COMMAND_ALIASES +10; VALUE_FLAGS +5; BOOLEAN_FLAGS +10; parseCliArgs extended with CLI defaults; dual-purpose --profile"
    - "bin/install.cjs — 10 alphabetical dispatch arms between 'generate' arm and loadProjectEnv"
    - "lib/markos/audit/writer.cjs — AUDIT_SOURCE_DOMAINS appended with 'cli' (13 entries)"
    - "package.json — engines.node >=22.0.0; dependencies.keytar ^7.9.0"

key-decisions:
  - "A3 locked: markos_api_keys table is NEW (no migration conflict)"
  - "A8 locked: extend AUDIT_SOURCE_DOMAINS with 'cli' (cleaner Phase 206 filter) rather than reuse 'auth'/'tenancy'/'crm'"
  - "A9 locked: raw node:fetch (Node 22 built-in undici); SDK migration deferred to 204.1 if 200-01.1 ships"
  - "A14 locked: device_code = base64url(randomBytes(16)) >=128-bit; user_code = 8 chars AAAA-AAAA"
  - "Dual-purpose --profile flag: context-sensitive by command (install profile vs CLI auth profile) to avoid breaking existing install flows"
  - "Keytar fallback: silent MODULE_NOT_FOUND swallow; first XDG write emits one-time stderr warning"
  - "Stub commands exit 5 (INTERNAL_BUG) until business logic ships — matches D-10 for 'not implemented' state"

patterns-established:
  - "Command stub pattern: module.exports = { main } with 8-LOC shell that prints NOT_IMPLEMENTED and exits 5"
  - "install.cjs dispatch arm: if (cli.command === X) { rl.close(); require('./commands/X.cjs').main({ cli }); return; }"
  - "Migration test: grep-shape assertion on file contents via fs.readFileSync + assert.match (no DB required)"
  - "Keychain primitive: env > keytar > XDG fallback tree; keytar loaded via try/catch require"
  - "TTY output: shouldUseJson() drives render() branch; EXIT_CODES frozen per D-10"
  - "Fixture pattern: startStubXxxServer({ scenario }) returns { port, url, close() }"

requirements-completed:
  - CLI-01
  - QA-01
  - QA-02
  - QA-04
  - QA-09
  - QA-11
  - QA-13

# Metrics
duration: ~35min
completed: 2026-04-23
---

# Phase 204 Plan 01: CLI Dispatch Foundation + Shared Primitives Summary

**Wave 1 foundation landed: 7 shared CLI primitives, 2 migrations + rollbacks, 10 command stubs wired into dispatch, and 4 test fixtures — unblocking Plans 204-02 through 204-11.**

## Performance

- **Tasks:** 3 of 3 complete
- **Files created:** 27
- **Files modified:** 4
- **Tests:** 42 passing (22 migration + 20 primitive)

## Accomplishments

- Shipped 7 shared CLI primitives covering auth (keychain), preferences (config), HTTP (authedFetch + retries + trace-id), streaming (SSE with Last-Event-ID reconnect + heartbeat), UX (TTY-adaptive output + D-10 exit codes), error envelope (formatError + ERROR_TO_EXIT), and cross-platform browser launch (openBrowser).
- Created migrations 73 (markos_cli_device_sessions, RFC 8628 state machine) and 74 (markos_cli_api_keys, RLS tenant-isolated, sha256-hashed) with matching .down.sql rollbacks.
- Wired 10 operator subcommands (init/plan/run/eval/login/keys/whoami/env/status/doctor) as stubs into bin/install.cjs dispatch. Business logic lands in Plans 204-02 through 204-11.
- Extended AUDIT_SOURCE_DOMAINS with 'cli' so Phase 206 compliance reports can filter on CLI-initiated actions.
- Lifted Node engine floor to 22.0.0 (undici fetch + SSE streaming); added keytar@^7.9.0.
- Delivered 4 test fixtures (keychain-stub, xdg-tmp, oauth-device-server, sse-event-server) that downstream plans consume.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrations 73/74 + audit domain + Node 22 + dispatch flags** — `1dedf7a` (feat)
2. **Task 2: Shared CLI primitives + fixtures + keychain/output/profiles tests** — `5ee6a38` (feat)
3. **Task 3: 10 command stubs + install.cjs dispatch arms + OAuth/SSE fixtures** — `293b564` (feat)

## Files Created/Modified

### Created (27)

Primitives (7):
- `bin/lib/cli/keychain.cjs` — OS keychain + XDG fallback
- `bin/lib/cli/config.cjs` — non-secret preferences + profile resolution
- `bin/lib/cli/http.cjs` — authed fetch with retry/backoff + trace-id
- `bin/lib/cli/output.cjs` — TTY-adaptive rendering + EXIT_CODES
- `bin/lib/cli/errors.cjs` — structured error envelope + ERROR_TO_EXIT
- `bin/lib/cli/open-browser.cjs` — cross-platform launcher
- `bin/lib/cli/sse.cjs` — SSE parser + Last-Event-ID reconnect + heartbeat

Command stubs (10): `bin/commands/{init,plan,run,eval,login,keys,whoami,env,status,doctor}.cjs`

Migrations (4):
- `supabase/migrations/73_markos_cli_device_sessions.sql`
- `supabase/migrations/74_markos_cli_api_keys.sql`
- `supabase/migrations/rollback/73_markos_cli_device_sessions.down.sql`
- `supabase/migrations/rollback/74_markos_cli_api_keys.down.sql`

Test fixtures (4): `test/cli/_fixtures/{keychain-stub,xdg-tmp,oauth-device-server,sse-event-server}.cjs`

Tests (5): `test/cli/{keychain,output,profiles}.test.js` + `test/migrations/{73,74}_*.test.js`

### Modified (4)

- `bin/cli-runtime.cjs` — MIN_NODE_VERSION 22.0.0; COMMAND_ALIASES +10; VALUE_FLAGS +5; BOOLEAN_FLAGS +10; parseCliArgs defaults for new keys; dual-purpose --profile (install vs CLI auth)
- `bin/install.cjs` — 10 alphabetical dispatch arms between 'generate' and loadProjectEnv
- `lib/markos/audit/writer.cjs` — appended 'cli' to AUDIT_SOURCE_DOMAINS (13 entries)
- `package.json` — engines.node >=22.0.0; dependencies.keytar ^7.9.0

## Exported APIs (Stable — Wave 1-3 consumers)

### keychain.cjs
```
SERVICE = 'markos-cli'
async getToken(profile) -> string | null  // env > keytar > XDG > null
async setToken(profile, token) -> void    // keytar, XDG fallback with one-time stderr warning
async deleteToken(profile) -> void
async listProfiles() -> string[]          // merged set from keytar + XDG
xdgCredPath() -> string                   // testing
```

### config.cjs
```
DEFAULT_CONFIG = { active_profile: 'default', format: 'auto', telemetry: false }
configPath() -> string
loadConfig() -> { active_profile, format, telemetry }
saveConfig(patch) -> merged config        // writes 0o600
resolveProfile(cli) -> string             // --profile > MARKOS_PROFILE > config > 'default'
```

### http.cjs
```
BASE_URL                                  // MARKOS_API_BASE_URL || 'https://app.markos.com'
CLIENT_VERSION                            // pkg.version
class AuthError extends Error (code: 'UNAUTHORIZED')
class TransientError extends Error (code: 'SERVER_ERROR')
generateTraceId() -> 'tr_<16-hex>'
async authedFetch(pathOrUrl, opts, { token, trace_id?, retries=4 }) -> Response
  // retries 5xx/429/network with 1s->2s->4s->8s backoff capped at 30s
  // throws AuthError on 401/403; TransientError on persistent 5xx/network
```

### output.cjs
```
EXIT_CODES = Object.freeze({ SUCCESS:0, USER_ERROR:1, TRANSIENT:2,
                              AUTH_FAILURE:3, QUOTA_PERMISSION:4, INTERNAL_BUG:5 })
shouldUseJson(opts) -> boolean            // !isTTY | opts.json | opts.format==='json' | NO_COLOR
shouldUseColor(opts) -> boolean
renderJson(obj) -> void                   // one object per line to stdout
renderTable(rows, columns, opts) -> void  // hand-rolled ANSI, NO_COLOR-aware
render(data, opts) -> void                // auto-switch json/table
```

### errors.cjs
```
ERROR_TO_EXIT = Object.freeze({ INVALID_BRIEF:1, ..., INTERNAL:5 })  // 13 codes
exitCodeFor(code) -> int
formatError({ error, message, hint?, retry_after_seconds? }, opts) -> envelope
  // stderr JSON if non-TTY; unicode box if TTY; optional { exit: true }
```

### open-browser.cjs
```
openBrowser(url) -> ChildProcess | null   // win32: cmd /c start | darwin: open | linux: xdg-open
  // headless/CI/!TTY prints URL only; never throws
```

### sse.cjs
```
async streamSSE(url, { token, onEvent, signal, heartbeatMs=22500, maxRetries=Infinity })
  // parses event/data/id lines; tracks Last-Event-ID; reconnects on disconnect;
  // heartbeat watchdog aborts stream if no event within heartbeatMs
```

## Downstream Unblocking

| Plan   | Consumes from 204-01 |
|--------|----------------------|
| 204-02 (login)  | keychain.cjs, http.cjs, open-browser.cjs; migration 74; oauth-device-server fixture |
| 204-03 (keys)   | keychain.cjs, http.cjs, output.cjs; migration 74 |
| 204-04 (whoami) | http.cjs, output.cjs |
| 204-05 (init)   | config.cjs, output.cjs |
| 204-06 (plan/run) | http.cjs, sse.cjs, output.cjs; sse-event-server fixture |
| 204-07 (eval)   | http.cjs, output.cjs |
| 204-08 (env)    | http.cjs, output.cjs, errors.cjs |
| 204-09 (status) | http.cjs, output.cjs |
| 204-11 (doctor) | output.cjs, errors.cjs |

## Tests

```
$ node --test test/cli/*.test.js test/migrations/7{3,4}_*.test.js
ℹ tests 42
ℹ pass 42
ℹ fail 0
```

## Verification

- `node -e "require('./bin/install.cjs')"` — loads clean (no syntax errors from dispatch arms)
- `node -e "require('./bin/cli-runtime.cjs'); ...parseCliArgs(['login','--profile=prod','--token=abc'])"` — returns `{ command: 'login', profile: 'prod', token: 'abc' }`
- All 10 command stubs export `{ main }` and exit 5 with NOT_IMPLEMENTED message
- Fixtures (keychain-stub, xdg-tmp, oauth-device-server, sse-event-server) load without error

## Notes & Follow-ups

- `warning: in the working copy ..., LF will be replaced by CRLF` — benign Windows line-ending notice on `git add`; files committed with Unix LF per .gitattributes if present.
- keytar is archived upstream (Mar 2025) but continues to ship prebuilt binaries for Node 22. If prebuild-install fails on headless Linux CI, the XDG fallback auto-activates — this is documented in keychain.cjs header. Evaluate `@napi-rs/keyring` drop-in replacement in 205 or v2.
- Dual-purpose --profile flag: when `cli.command` is one of the 10 new operator commands, `--profile=<name>` names an auth profile; otherwise legacy install profile (full/cli/minimal). `CLI_OPERATOR_COMMANDS` Set in cli-runtime.cjs is the single source of truth.
- Stub commands exit with code 5 (INTERNAL_BUG) — per D-10 this is correct for "not yet implemented" state. Downstream plans will replace each stub with real logic and map errors to appropriate D-10 codes.
