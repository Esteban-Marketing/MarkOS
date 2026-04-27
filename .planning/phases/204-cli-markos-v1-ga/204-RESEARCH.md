# Phase 204: CLI `markos` v1 GA — Research

**Researched:** 2026-04-18; gap-closure addendum 2026-04-27
**Domain:** Cross-platform Node.js CLI · OAuth device flow · OS keychain · package distribution (npm + Homebrew + Scoop) · SSE streaming
**Confidence:** HIGH on stack/patterns · MEDIUM on distribution CI matrix · ASSUMED on a few server-side endpoint shapes not yet defined

## Summary

Phase 204 graduates `markos` from a single `generate` command to an 11-command GA CLI distributed on 3 channels (npm + Homebrew + Scoop). The user's CONTEXT.md locks ten decisions (flat command surface, OAuth device flow + OS keychain via keytar, Node 22 LTS + zero-dep hand-rolled UX, pure Node CJS, wave-1 distribution channels). Research here fills the gaps: concrete RFC 8628 endpoint contracts, the keytar-vs-@napi-rs/keyring fallback tree, ready-to-fill Homebrew and Scoop manifest templates, SSE reconnection mechanics for `markos run --watch`, the CI matrix that fans out to 3 registries atomically, and a Nyquist validation map covering 12 behaviors. The late `204-13` gap closure is now treated as a bounded compatibility lock, not a fresh dependency chain on future implementation phases.

**One sharpening recommendation against CONTEXT.md D-08**: CONTEXT locks `keytar` as the only allowed new dep. The npm registry shows `keytar` last published 2025-07-30 at v7.9.0 and the upstream atom/node-keytar repo was archived in March 2026 [CITED: https://github.com/atom/node-keytar]. A drop-in 100%-compatible replacement — `@napi-rs/keyring` v1.2.0 (active; Rust-backed; no libsecret requirement on Linux) [CITED: https://www.npmjs.com/package/@napi-rs/keyring] — exists. The user's locked decision is still honorable; the safe path is "keytar API, @napi-rs/keyring implementation" (they share function signatures). Flag for user confirmation before locking.

**Primary recommendation:** Ship in 4 waves plus 1 bounded compatibility gap-closure plan. **Wave 1** (foundation): extend the dispatch layer + OS keychain primitive + OAuth device flow endpoints + `login`/`whoami`/`keys` + `api/cli/oauth/*` + `api/tenant/api-keys/*` + `api/tenant/whoami`. **Wave 2** (workspace commands): `init`, `plan`, `run` (SSE stream), `eval`, `env pull|push|list`. **Wave 3** (operator tooling): `status`, `doctor`. **Wave 4** (distribution + docs): Homebrew tap · Scoop bucket · GitHub Actions release matrix · per-channel smoke CI · error-code doc page · help footer. The final gap-closure plan only translates already-known run/pricing/freshness doctrine into current CLI safeguards. This ordering lets 201's existing tenant-API foundations carry Wave 1 immediately, parks distribution behind functional verification so we never ship a broken brew install, and keeps the gap closure additive instead of cyclic.

**2026-04-27 gap-closure addendum:** `204-13` should consume later doctrine as compatibility input only.

- `pricing_engine_context` and `{{MARKOS_PRICING_ENGINE_PENDING}}` are current CLI placeholder contracts owned in Phase 204; Phase 205 becomes a later writer/consumer of that surface rather than a prerequisite for the CLI to define it.
- AgentRun v2 field posture is a schema-alignment target for CLI payloads and status projections; the CLI should align additively without pretending the full Phase 207 substrate already exists.
- `markos doctor` may flag stale incoming doctrine pages such as `16-SAAS-SUITE.md` and `17-SAAS-MARKETING-OS-STRATEGY.md`, but that is a content-health and freshness check only, not evidence that Phases 214 or 218 are implemented.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Command Surface: Flat, not nested.** Keep commands flat (`markos login`, `markos keys`, `markos whoami`) rather than grouped (`markos auth login …`). Matches the `gh` + `vercel` conventions the Target ICP already knows. `markos keys` takes a subcommand (`list` | `create` | `revoke`) since keys has multiple CRUD verbs; `login`/`whoami` stay single-verb.

**D-02 — Auth Model: OAuth device flow + API-key management.**
- `markos login` → OAuth device flow. CLI opens browser to `https://app.markos.com/cli/authorize?device_code=...`, polls `/api/cli/oauth/device/token`, on success issues a **new API key** bound to the tenant membership and stores it in the OS keychain. Non-interactive fallback: `markos login --token=<pasted-api-key>` writes directly to keychain (for CI).
- `markos keys list|create|revoke` → manual CRUD over `/api/tenant/api-keys/*` (new endpoints; Phase 201 `markos_tenant_memberships` role gate: owner/admin only).
- `markos whoami` → reads active keychain entry, calls `/api/tenant/whoami`, prints `{tenant_id, tenant_name, role, email, key_fingerprint, profile}`.
- Token storage: **OS keychain** via `keytar` (macOS Keychain / Windows Credential Vault / libsecret). Fallback to `$XDG_CONFIG_HOME/markos/credentials` (0600) if keytar native build fails.

**D-03 — `run` vs `eval`: Distinct responsibilities.**
- **`markos run <brief.yaml>`** → Submit brief to tenant API (`POST /api/tenant/runs`), returns `run_id`, then streams progress via SSE from `GET /api/tenant/runs/{run_id}/events`. Composable: exits 0 on success, non-zero on any run step failure. `--watch=false` returns run_id immediately (fire-and-forget for CI).
- **`markos eval <brief.yaml> [--draft=<path>]`** → Local LLM-rubric quality scoring over a generated draft. Produces `{score, dimensions, issues[]}` JSON. No tenant round-trip (fully local; pluggable LLM).
- **`markos plan <brief.yaml>`** → Dry-run: shows which steps `run` would execute without submitting. Uses `/api/tenant/runs/plan` (new endpoint; no state change).

**D-04 — `env` / `status` / `doctor` Scopes.**
- **`markos env pull [profile]`** → Pulls tenant env vars (`/api/tenant/env`) into `.markos-local/.env` (0600). `markos env push` symmetric. `markos env list` dumps redacted keys.
- **`markos status`** → Subscription tier · quota consumption · active rotations (Phase 203) · recent run summary. Exits 0 unless auth fails.
- **`markos doctor`** → Diagnose-and-fix: Node ≥22 LTS, config dir writable, active token valid, `.markos-local/` exists + gitignored, Supabase/Upstash/Vercel connectivity. Auto-fixes: create missing dirs, renew expired tokens, add `.markos-local/` to `.gitignore`. `--check-only` flag for CI.

**D-05 — Distribution: Phased rollout.**
- **Wave 1 (this phase):** npm · Homebrew tap (`markos/tap/markos`) · Scoop bucket (`markos/scoop-bucket`).
- **Wave 2 (deferred):** winget · apt.
- **CI automation:** Each release tag triggers a matrix job publishing atomically to all 3 Wave-1 channels.
- **Version parity:** All channels ship identical `package.json` version.

**D-06 — Config + Credentials Storage.**
- Config: `$XDG_CONFIG_HOME/markos/config.json` (defaults to `~/.config/markos/config.json` on Linux/Mac, `%APPDATA%\markos\config.json` on Windows). 0600 permissions.
- Credentials: OS keychain via `keytar` (service=`markos-cli`, account=`<profile>`).
- Profiles: `markos --profile=prod <cmd>` or `MARKOS_PROFILE=prod` env var.
- `.markos-local/` stays per-project.

**D-07 — Output Format: Auto-adaptive.**
- TTY default: colored tables (hand-rolled ANSI; no `chalk`/`cli-table` dep).
- Non-TTY default: auto-switches to JSON via `process.stdout.isTTY`.
- Explicit overrides: `--json`, `--format=table|json|yaml`, `--quiet`.
- Exit codes: `0`=success, `1`=user error, `2`=transient/retry, `3`=auth failure, `4`=quota/permission, `5`=internal/bug.

**D-08 — Packaging: Pure Node.**
- Pure Node.js CJS v1. Entry `bin/install.cjs`, dispatch `bin/cli-runtime.cjs`, subcommand modules `bin/commands/*.cjs`.
- **Node floor: Node 22 LTS.** `#!/usr/bin/env node` shebang.
- **Only new dep this phase: `keytar`.** All other UX hand-rolled.
- Homebrew/Scoop formulas wrap the npm tarball.

**D-09 — Test Strategy.**
- Unit: per-command module under `test/cli/<cmd>.test.js` using `node --test`. Stub `keytar`, HTTP, LLM.
- Integration: `test/cli-e2e.test.js` spawns `bin/install.cjs` subprocesses against local Supabase test branch + stub OAuth server.
- Distribution smoke: CI job per channel.
- QA gates: all 15 from QUALITY-BASELINE.md. Playwright E2E + LLM eval deferred per 203 precedent.

**D-10 — Error Messages.** Structured `{error: <code>, message: <human>, hint?: <fix>}` to stderr (JSON when non-TTY, boxed human when TTY). Error codes stable public API (`docs/cli/errors.md`). Rate-limit + auth + quota errors include `retry_after_seconds`.

### Claude's Discretion
- Exact ANSI color palette (WCAG AA against default terminal bg, no color-only signaling).
- Spinner animation characters (ASCII-safe fallback when `LANG=C` or Windows cmd.exe).
- Progress bar granularity.
- Internal module layout under `bin/commands/` beyond "one file per command".
- Shell completion script format — time-permitting `markos completions` command, otherwise defer.

### Deferred Ideas (OUT OF SCOPE)
- Single-binary packaging (esbuild/pkg/bun --compile) — v2.
- winget + apt distribution — Wave 2 / 204.1 / Phase 205 addendum.
- TUI / interactive dashboards — `plant-seed` backlog.
- CLI plugin system (`markos plugin install …`) — v4.1+ marketplace.
- Telemetry opt-in — post-204 privacy review.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLI-01 | Full MarkOS CLI — `init · generate · plan · run · eval · login · keys · whoami · env · status · doctor` (11 commands) across npm · Homebrew · Scoop · winget · apt (this phase ships Wave 1 = npm/brew/scoop per D-05) | §Command Surface Architecture · §OAuth Device Flow Contract · §Standard Stack · §Distribution Templates |
| QA-01 | Contract-first (OpenAPI 3.1) | §New API Surface Inventory — 5 new F-NN contracts (F-101..F-105) enumerated |
| QA-02 | Typed HTTP boundary (Zod on every handler) | §Pattern 2 — handler skeleton references `lib/markos/crm/api.cjs::writeJson` precedent |
| QA-03 | Semver-on-contract | Version sync across npm/brew/scoop anchored to `package.json` — §Release CI |
| QA-04 | Coverage floor 80% `lib/` · 100% auth paths | §Validation Architecture per-command test map |
| QA-05 | Integration-real (no boundary mocks) | §Testing CLI Subprocesses — spawn real subprocess + local Supabase branch |
| QA-06 | Playwright E2E smoke | **Deferred per 203-10 precedent** (documented in D-09) |
| QA-07 | Load tests before GA | CLI commands inherit server-side rate limits already load-tested in Phase 203 |
| QA-08 | Eval-as-test | **Deferred per 203-10 precedent** (documented in D-09) |
| QA-09 | OTEL from day 0 | CLI emits trace IDs via `x-markos-trace-id` header; server-side OTEL inherited |
| QA-10 | Per-tenant cost telemetry + kill-switch | CLI calls server endpoints; enforcement happens server-side per 201/203 pattern |
| QA-11 | Threat model (STRIDE) per new domain | §Security Domain — CLI-specific threats enumerated (device-flow theft, keychain leak, env-pull over-write, etc.) |
| QA-12 | Platform baseline | CSP/HSTS etc. — server-side; CLI uses `node:https` with standard cert validation |
| QA-13 | Idempotent migrations + rollback | New `markos_api_keys` migration + `markos_cli_device_sessions` migration; rollbacks in `supabase/migrations/rollback/` |
| QA-14 | Accessibility AA-min | N/A for headless CLI; TTY output respects `NO_COLOR` env var (§Pattern 7) |
| QA-15 | Docs-as-code + live | `docs/cli/errors.md` + per-command reference + `llms.txt` update |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Enforced directives from `./CLAUDE.md` (mandatory compliance):

| Directive | Source | Enforcement |
|-----------|--------|-------------|
| **`.markos-local/` is the only permitted private-local path** — NEVER `.mgsd-local/` | `./CLAUDE.md` §Split | All env-pull writes, credential file fallbacks, profile data MUST go under `.markos-local/`. Auto-gitignored by `bin/install.cjs::applyGitignoreProtections`. |
| **`npm test` = `node --test test/**/*.test.js`** | `./CLAUDE.md` §CLI/tests | All new tests go under `test/cli/*.test.js`. No vitest/jest. |
| **`npx markos` is the bin entrypoint** | `./CLAUDE.md` §CLI/tests + `package.json` `bin.markos` | All new subcommands dispatch through `bin/install.cjs → bin/cli-runtime.cjs`. |
| **GSD vs MarkOS split** | `./CLAUDE.md` §Split | CLI code stays under `bin/`, `.agent/markos/`, `lib/markos/`. No writes to `.agent/get-shit-done/`. |
| **Canonical mission state** | `./CLAUDE.md` §2 | Do not write live state to `.protocol-lore/STATE.md` (only routes). Phase docs live under `.planning/phases/`. |

Any recommendation in this RESEARCH.md that contradicts these directives is a bug — report it back to the planner instead of proceeding.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js runtime | ≥22 LTS | CLI runtime floor | Matches Vercel default, Active LTS until Oct 2025 → Maintenance LTS until Apr 2027 [CITED: https://nodejs.org/en/about/previous-releases]. Also aligned to `engines.node` ≥20.16 in current `package.json` — the phase lifts floor to 22 per D-08. [VERIFIED: `node --version` → v22.13.0 on dev machine] |
| `keytar` | 7.9.0 (last published 2025-07-30) | OS keychain primitive — macOS Keychain · Windows Credential Vault · libsecret | CONTEXT.md D-08 locks this choice. Native module. 100% API-compatible with `@napi-rs/keyring` so replacement is drop-in if keytar becomes unworkable. [VERIFIED: `npm view keytar version` → 7.9.0; `npm view keytar time` → modified 2025-07-30] |
| Existing hand-rolled parser | — | Flag parsing (zero-dep) | 200-02 precedent; avoids `yargs`/`commander`/`minimist`. Already handles `--key=value`, `--key value`, positional. Extend in `bin/cli-runtime.cjs::parseCliArgs`. |
| Existing `brief-parser.cjs` | — | YAML-subset + JSON parser | 200-02 precedent; used by `run`/`plan`/`eval`. [VERIFIED: bin/lib/brief-parser.cjs] |
| `openapi-fetch` (via SDK) | 0.17.0 | Typed HTTP client | Already in `package.json` deps (shipped with 200-07 SDK scaffold). CLI reuses the SDK client surface — see §SDK Integration Recommendation. [VERIFIED: package.json] |
| `node:readline` | builtin | Interactive prompts (`keys revoke --yes` fallback, `doctor` fix prompts) | Already used by `bin/install.cjs`. Zero-dep. |
| `node:child_process` | builtin | Browser launch (`markos login` opens `cmd /c start` on Windows, `open` on macOS, `xdg-open` on Linux) | Zero-dep cross-platform — we implement the switch statement ourselves (≈15 lines) vs pulling `sindresorhus/open` (which has 12,500+ dependents but is still a dep we don't need). [CITED: https://github.com/sindresorhus/open] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:crypto` | builtin | API-key hashing for `markos keys list` fingerprint display | `sha256(key).slice(0,8)` matches the existing `buildFileHashes` pattern in `bin/cli-runtime.cjs` |
| `node:https` | builtin | SSE streaming for `markos run --watch` | Node 22's undici `fetch()` supports streaming response bodies; `res.body.getReader()` reads `data:` chunks directly. No EventSource polyfill needed — hand-rolled 30-line parser matches the zero-dep pattern [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events] |
| `node:os` | builtin | `$XDG_CONFIG_HOME` / `%APPDATA%` resolution for `markos_config_path()` | Already used in `bin/cli-runtime.cjs` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `keytar` (D-08 locked) | `@napi-rs/keyring` 1.2.0 | Rust-backed, no libsecret dep on Linux, 100% API-compatible. Last published 3mo ago, actively maintained. [CITED: https://www.npmjs.com/package/@napi-rs/keyring] — **Recommended mitigation:** wrap keytar calls in `lib/markos/cli/keychain.cjs` with a single public API; if keytar native build fails at install, fall back to `@napi-rs/keyring` automatically. User sign-off recommended before locking either choice. |
| hand-rolled open-browser | `sindresorhus/open` npm pkg | Would require adding a dep. 15-line hand-rolled version covers win32/darwin/linux cleanly, and headless servers simply print the URL + do not spawn. |
| hand-rolled SSE parser | `eventsource` npm pkg or `sse.js` polyfill | Zero-dep precedent from 200-02 wins. SSE wire format is 4 lines per event (`event:`, `data:`, `id:`, `retry:`) — trivial to parse. Reconnection logic: on disconnect, reconnect with `Last-Event-ID` header. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events] |
| `open-cli` for browser | `node:child_process` + platform detect | Zero-dep; no child-dep footprint. |
| `yargs` / `commander` | Existing hand-rolled parser | 200-02 precedent locks this. Parser needs ~40 lines extension: add `--profile`, `--json`, `--format`, `--quiet`, `--watch`, `--token`, `--force`, `--yes`, `--check-only`. |

**Installation:**
```bash
npm install keytar@^7.9.0
# NO other new runtime deps. Hand-roll everything else.
```

**Version verification ran on 2026-04-18:**
```bash
npm view keytar version        → 7.9.0  (published 2025-07-30)
npm view @napi-rs/keyring version → 1.2.0 (fallback if keytar fails)
node --version                 → v22.13.0  (matches D-08 floor)
```
[VERIFIED: local npm registry query 2026-04-18]

## Architecture Patterns

### Recommended Project Structure
```
bin/
├── install.cjs                       # entry — PRESERVE as interactive install
├── cli-runtime.cjs                   # dispatch layer — EXTEND with 10 new commands
├── generate.cjs                      # existing; SHIPPED 200-02
├── commands/                         # NEW — one file per command
│   ├── init.cjs                      # delegates to bin/install.cjs --yes for now
│   ├── plan.cjs                      # calls /api/tenant/runs/plan
│   ├── run.cjs                       # calls /api/tenant/runs + SSE stream
│   ├── eval.cjs                      # local rubric scoring
│   ├── login.cjs                     # OAuth device flow
│   ├── keys.cjs                      # list|create|revoke over /api/tenant/api-keys/*
│   ├── whoami.cjs                    # /api/tenant/whoami
│   ├── env.cjs                       # pull|push|list over /api/tenant/env
│   ├── status.cjs                    # /api/tenant/status aggregation
│   └── doctor.cjs                    # local diagnostics + auto-fix
└── lib/
    ├── brief-parser.cjs              # existing; SHIPPED 200-02
    ├── generate-runner.cjs           # existing; SHIPPED 200-02
    ├── cli/                          # NEW — shared CLI primitives
    │   ├── keychain.cjs              # keytar wrapper + XDG fallback
    │   ├── config.cjs                # config.json + profile resolution
    │   ├── http.cjs                  # authed fetch + OAuth device flow client
    │   ├── sse.cjs                   # hand-rolled SSE parser + reconnection
    │   ├── output.cjs                # TTY-detect + table/JSON render + ANSI
    │   ├── open-browser.cjs          # cross-platform browser launch
    │   └── errors.cjs                # structured error envelope + exit codes
    └── preset-loader.cjs             # existing

api/
├── cli/                              # NEW — device flow lives outside /tenant
│   └── oauth/
│       └── device/
│           ├── start.js              # POST /api/cli/oauth/device/start → device_code
│           └── token.js              # POST /api/cli/oauth/device/token → polled
└── tenant/                           # EXTEND — new endpoints
    ├── api-keys/
    │   ├── list.js
    │   ├── create.js
    │   └── [key_id]/revoke.js
    ├── runs/
    │   ├── create.js                 # POST /api/tenant/runs
    │   ├── [run_id]/events.js        # GET /api/tenant/runs/{id}/events (SSE)
    │   └── plan.js                   # POST /api/tenant/runs/plan
    ├── env/
    │   ├── list.js                   # GET /api/tenant/env
    │   ├── pull.js                   # GET /api/tenant/env/pull
    │   └── push.js                   # POST /api/tenant/env/push
    ├── whoami.js
    └── status.js                     # aggregates quota + rotations + recent runs

contracts/                            # NEW — 5 F-NN contracts
├── F-101-cli-oauth-device-v1.yaml
├── F-102-cli-api-keys-v1.yaml
├── F-103-cli-runs-v1.yaml
├── F-104-cli-env-v1.yaml
└── F-105-cli-whoami-status-v1.yaml

test/cli/                             # NEW — one per command
├── login.test.js
├── keys.test.js
├── whoami.test.js
├── run.test.js
├── eval.test.js
├── plan.test.js
├── env.test.js
├── status.test.js
├── doctor.test.js
├── init.test.js
└── keychain.test.js                  # shared primitive
test/cli-e2e.test.js                  # subprocess spawning

Formula/markos.rb                     # NEW — Homebrew tap formula (tap pushed to markos/homebrew-tap)
bucket/markos.json                    # NEW — Scoop bucket manifest (pushed to markos/scoop-bucket)
.github/workflows/release.yml         # NEW — matrix publish to npm + brew + scoop on tag
```

### Pattern 1: Dispatch layer extension (low-risk, additive)

**What:** Extend `bin/cli-runtime.cjs::COMMAND_ALIASES` with the 10 new commands; extend `bin/install.cjs::run()`'s command dispatch block (already has switch-like arms for `generate`, `db:setup`, `vault:open`, etc.).

**When to use:** Any new top-level subcommand. Never add CLI-side parsing logic to `install.cjs` itself beyond dispatch.

**Example (bin/install.cjs extension — mirrors existing `generate` arm at line 668-673):**
```javascript
// Source: extends bin/install.cjs:668 pattern
if (cli.command === 'login') {
  rl.close();
  const { main: runLoginCLI } = require('./commands/login.cjs');
  await runLoginCLI({ cli });
  return;
}
// ... (same arm for each of 10 new commands)
```

### Pattern 2: Tenant endpoint skeleton (reuse 203 shape)

**What:** Every new `api/tenant/**` handler follows the structure shipped in `api/tenant/webhooks/subscriptions/[sub_id]/rotate.js`.

**When to use:** All new tenant endpoints. Never hand-roll auth/tenant-guard logic.

**Example (condensed from rotate.js):**
```javascript
// Source: api/tenant/webhooks/subscriptions/[sub_id]/rotate.js (SHIPPED 203-05)
'use strict';
const { writeJson } = require('../../../lib/markos/crm/api.cjs');

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  // 1. Header auth — Phase 201 pattern
  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  // 2. Tenant-scope guard (SELECT + compare)
  // 3. Role gate (markos_tenant_memberships.role check)
  // 4. Delegate to lib/markos/<domain>/<primitive>.cjs
  // 5. Audit emit via enqueueAuditStaging (D-08 MUST for mutating commands)
  // 6. Typed error → HTTP code mapping
}

module.exports = handler;
module.exports.handler = handler;
```

### Pattern 3: OAuth 2.0 Device Authorization Grant (RFC 8628)

**What:** Two-endpoint server-side dance + CLI-side polling with exponential backoff.

**When to use:** `markos login` flow. Fallback to `--token=<key>` paste for CI.

**Source:** RFC 8628 §3.5 [CITED: https://www.rfc-editor.org/rfc/rfc8628]. Implementation reference: GitHub CLI device flow [CITED: https://dev.to/ddebajyati/integrate-github-login-with-oauth-device-flow-in-js-cli-28fk].

**Step-by-step wire protocol:**

```
# Step 1 — Device code request (CLI → server)
POST /api/cli/oauth/device/start
Content-Type: application/json
{
  "client_id": "markos-cli",
  "scope": "cli"
}
  ↓
200 OK
{
  "device_code":      "djBhcXRfTExXSEtYN3BBaE5y",     // opaque, ≥20 bytes
  "user_code":        "WDJB-MJHT",                       // human-readable, 8 chars
  "verification_uri": "https://app.markos.com/cli/authorize",
  "verification_uri_complete":
                      "https://app.markos.com/cli/authorize?user_code=WDJB-MJHT",
  "expires_in":       900,                                // seconds (15 min)
  "interval":         5                                   // seconds between polls
}

# Step 2 — CLI opens browser to verification_uri_complete
#        — if isTTY + not isCI: spawn `open`/`start`/`xdg-open` + ALSO print URL
#        — if !isTTY or isCI:   print URL only (headless-friendly)
#        — print user_code prominently for visual confirmation

# Step 3 — CLI polls token endpoint (every `interval` seconds)
POST /api/cli/oauth/device/token
Content-Type: application/x-www-form-urlencoded
grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code=djBhcXRfTExXSEtYN3BBaE5y
&client_id=markos-cli

# Pending response (keep polling):
400 Bad Request
{
  "error": "authorization_pending"
}

# Slow-down response — MUST add 5s to interval:
400 Bad Request
{
  "error": "slow_down"
}

# Expired response — user waited too long:
400 Bad Request
{
  "error": "expired_token"
}

# User denied:
400 Bad Request
{
  "error": "access_denied"
}

# Success — server issued a fresh API key:
200 OK
{
  "access_token":       "mks_ak_<32-byte-hex>",  // the API key
  "token_type":         "bearer",
  "expires_in":         null,                      // API keys are long-lived
  "tenant_id":          "ten_...",
  "key_fingerprint":    "sha256:a1b2c3...8 chars",
  "scope":              "cli"
}
```

**Server-side session table** (new migration):
```sql
-- NEW: supabase/migrations/XX_markos_cli_device_sessions.sql
CREATE TABLE markos_cli_device_sessions (
  device_code       text PRIMARY KEY,
  user_code         text UNIQUE NOT NULL,
  tenant_id         text REFERENCES markos_tenants(id),
  user_id           text REFERENCES markos_users(id),
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  issued_at         timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL,
  approved_at       timestamptz,
  -- Anti-brute-force: record poll count + last-poll timestamp
  poll_count        int NOT NULL DEFAULT 0,
  last_poll_at      timestamptz,
  CONSTRAINT expires_after_issue CHECK (expires_at > issued_at)
);
CREATE INDEX idx_cli_device_user_code ON markos_cli_device_sessions(user_code)
  WHERE status = 'pending';
```

**Security notes (from RFC 8628 §5):**
- `user_code` MUST be human-readable uppercase letters + digits, grouped with dashes (e.g. `WDJB-MJHT`).
- Entropy of `user_code` should be ≥20 bits (8 chars from 26 letters + 10 digits ≈ 41 bits; plenty).
- `device_code` entropy ≥128 bits (≥16 bytes from `crypto.randomBytes`).
- Poll interval enforcement: server MUST return `slow_down` if `now() - last_poll_at < interval`. CLI MUST then increase local interval by 5 seconds [CITED: RFC 8628 §3.5].
- After 3 failed polls (interval violations), revoke the device_code.

### Pattern 4: Keychain primitive with XDG fallback (D-02 fallback tree)

**What:** Single wrapper module exports `get`/`set`/`delete`/`list` across backends.

**When to use:** All credential reads/writes. Never call `keytar` directly from command modules.

**Fallback decision tree:**

```
load keytar?
  ├─ YES → keytar.getPassword('markos-cli', profile)
  │         ├─ throws? → log to STDERR, fall through to XDG
  │         └─ returns null? → token not set (normal)
  └─ NO (native build failed) → XDG fallback
       ├─ $XDG_CONFIG_HOME/markos/credentials (0600)
       │   format: profile=<api_key>\n (one per line)
       ├─ exists? → parse + return
       └─ !exists? → return null
```

**When to fall back to XDG:**
1. `require('keytar')` throws `MODULE_NOT_FOUND` (native binary missing)
2. `keytar.getPassword` throws `Error: Secret Service not available` (Linux without libsecret)
3. `keytar.getPassword` throws `Error: The user name or password is incorrect` (CI env without keychain)

**Warning the user:** On first XDG fallback, print `warning: falling back to file-based credentials (~/.config/markos/credentials, 0600). Install libsecret (Linux) or run in a GUI session (macOS/Windows) to use the OS keychain.` to STDERR.

**`.gitignore` safety:** The XDG path is under `$XDG_CONFIG_HOME`, NOT under the project directory. It will never leak into git. But `markos env pull` writes to `.markos-local/.env` which IS under the project — `install.cjs::applyGitignoreProtections` already gitignores `.markos-local/` [VERIFIED: bin/install.cjs:109].

**CI-friendly override (D-02 explicit):** `markos login --token=<key>` skips OAuth entirely and writes the pasted key to the keychain. Also respects `MARKOS_API_KEY` env var at read time — keychain is a cache, env var wins.

### Pattern 5: SSE streaming for `markos run --watch`

**What:** Hand-rolled SSE parser on top of `node:https.get()` + response stream.

**When to use:** `markos run --watch` (default true), `markos status --watch` (future).

**Source:** MDN SSE spec [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events], 2026 Node.js SSE implementation guides.

**Wire format recap:**
```
event: run.step.started
data: {"run_id":"run_abc","step":"draft","started_at":"2026-04-18T..."}
id: 42

event: run.step.completed
data: {"run_id":"run_abc","step":"draft","draft":"...","duration_ms":1234}
id: 43

event: run.completed
data: {"run_id":"run_abc","status":"success"}
id: 44
```
(double-newline terminates each event)

**Hand-rolled parser skeleton (≈40 lines):**
```javascript
// lib/cli/sse.cjs
async function streamSSE(url, { token, onEvent, signal }) {
  const https = require('node:https');
  let lastEventId = null;
  let buffer = '';

  while (!signal?.aborted) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
          },
        }, resolve);
        req.on('error', reject);
      });
      if (res.statusCode !== 200) throw new Error(`sse: ${res.statusCode}`);

      for await (const chunk of res) {
        buffer += chunk.toString('utf8');
        let evtEnd;
        while ((evtEnd = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, evtEnd);
          buffer = buffer.slice(evtEnd + 2);
          const evt = {};
          for (const line of raw.split('\n')) {
            const idx = line.indexOf(':');
            if (idx === -1) continue;
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim();
            if (key === 'id') { evt.id = val; lastEventId = val; }
            else if (key === 'event') evt.event = val;
            else if (key === 'data') evt.data = (evt.data ? evt.data + '\n' : '') + val;
          }
          if (evt.data) {
            try { evt.payload = JSON.parse(evt.data); } catch {}
            onEvent(evt);
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) return;
      // Exponential backoff reconnect, capped at 30s
      await new Promise(r => setTimeout(r, Math.min(30_000, 1000 * Math.pow(2, retryCount++))));
    }
  }
}
```

**Ctrl+C handling:** `markos run` installs `process.on('SIGINT', ...)` → calls `controller.abort()` on the AbortController → closes the HTTPS socket cleanly → prints "run still executing; check status with `markos status run <run_id>`" → `process.exit(0)`.

### Pattern 6: Cross-platform browser launch (zero-dep)

**What:** Platform-detect + child_process.spawn. 15 lines.

**When to use:** `markos login` (device flow) · `markos status --open` (future).

**Source:** `sindresorhus/open` internals [CITED: https://github.com/sindresorhus/open] — we inline the platform switch.

```javascript
// lib/cli/open-browser.cjs
const { spawn } = require('node:child_process');

function openBrowser(url) {
  // Headless / CI: just print the URL
  if (!process.stdout.isTTY || process.env.CI) {
    console.log(`\n  Open this URL in a browser: ${url}\n`);
    return null;
  }

  let cmd, args;
  if (process.platform === 'win32') {
    // `start` is a cmd.exe builtin; must go through cmd /c
    cmd = 'cmd.exe';
    args = ['/c', 'start', '""', url];  // empty "" is the window title arg
  } else if (process.platform === 'darwin') {
    cmd = 'open';
    args = [url];
  } else {
    cmd = 'xdg-open';
    args = [url];
  }

  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.unref();
    return child;
  } catch {
    // Graceful: print URL even if spawn failed
    console.log(`\n  (browser didn't launch) Open: ${url}\n`);
    return null;
  }
}

module.exports = { openBrowser };
```

**Windows `.cmd` wrapper gotcha:** npm's `bin` field generates `.cmd` wrappers that invoke node via shebang on Unix but via cmd.exe on Windows. `process.platform === 'win32'` detection is reliable. No extra gotcha beyond using `cmd.exe /c start "" <url>` (the empty `""` is mandatory; otherwise `start` treats the URL as the window title).

### Pattern 7: TTY-adaptive output (`NO_COLOR` + `--json`)

**What:** `output.cjs` module with `table(rows, columns)`, `json(obj)`, `error(msg, hint)`, `banner(text)`.

**When to use:** Every command renders via this module; no `console.log` with ANSI codes scattered in command files.

**Rules:**
- `process.stdout.isTTY === true && !process.env.NO_COLOR && !args.json && !args.format === 'json'` → colored tables.
- `args.json || args.format === 'json' || !process.stdout.isTTY || process.env.NO_COLOR` → JSON one-object-per-line.
- `args.format === 'yaml'` → YAML (via existing `brief-parser.cjs` emit helpers).
- `args.quiet` → suppress INFO-level stderr, keep ERROR and final output.

**`NO_COLOR` compliance:** Environment variable standard at [no-color.org](https://no-color.org) mandates that ANY non-empty value of `NO_COLOR` disables color output. Honor per spec.

**Exit-code map (D-10 locked):**
```
0  success
1  user error (invalid flags, validation fail, no brief)
2  transient (network timeout, 5xx, queue backpressure) — retry safe
3  auth failure (401 from server, no keychain entry, expired token)
4  quota / permission (403, 429 quota)
5  internal / bug (unexpected exception)
```

### Anti-Patterns to Avoid

- **`chalk` / `cli-table` / `ora` dependency** — violates D-08 zero-dep rule. Hand-roll ANSI (≤50 LOC per primitive).
- **Writing API key plaintext to config.json** — D-06 explicitly forbids. Keychain is the only authoritative credential store; XDG fallback is opt-in with user warning.
- **Calling `keytar` from command modules directly** — goes around the fallback wrapper. Always import `lib/cli/keychain.cjs`.
- **Using `process.exit(1)` on network errors** — use exit code 2 (transient). A retry-loop caller should not treat network blip as "bad user input."
- **Omitting `enqueueAuditStaging` on mutating commands** — `specifics` in CONTEXT.md line 110 explicitly mandates audit emission on every mutating CLI command. Use `source_domain: 'auth'` for login/keys, `'tenancy'` for env push, `'crm'` for runs. [VERIFIED: `AUDIT_SOURCE_DOMAINS` in `lib/markos/audit/writer.cjs:5-9`]
- **Bundling `node` inside Homebrew formula** — Homebrew Node-for-Formula-Authors doc says formulas wrapping an npm pkg should `depends_on "node"` (not bundle) [CITED: https://docs.brew.sh/Node-for-Formula-Authors].
- **Pinning to `node@22` in Homebrew formula** — `node@22` has deprecation date 2026-10-28 on Homebrew [CITED: https://formulae.brew.sh/formula/node@22]. Use `depends_on "node"` (floating LTS) + runtime version check via `bin/cli-runtime.cjs::assertSupportedNodeVersion`.
- **Prompting during `--yes` / CI** — every mutating command must accept a `--yes` / `--force` flag; `markos keys revoke` requires one of these or an interactive TTY confirmation per CONTEXT.md line 109.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OS keychain API | Custom OS-specific code (WIN32 `CredRead`, macOS Security.framework, Linux libsecret FFI) | `keytar` (D-08 locked) — or `@napi-rs/keyring` as drop-in fallback | Cross-platform native is a multi-month effort. Both libs expose the same 4-function API (`getPassword`/`setPassword`/`deletePassword`/`findCredentials`). |
| OpenAPI schema validation | Custom schema checker | `ajv` + `ajv-formats` (already in deps) | Already used by 200-01 endpoints. CLI side just trusts server responses. |
| JWT/session verification (server-side) | Hand-roll JWT | Existing `lib/markos/auth/session.ts` | Phase 201 pattern. CLI endpoints use `req.markosAuth` helper. |
| HTTP client | Raw `node:http.request` with body assembly | `node:fetch` (Node 22 built-in) | Node 22 ships undici. No dep needed. Streaming for SSE works. |
| YAML parsing (brief files) | Custom YAML | Existing `bin/lib/brief-parser.cjs` | SHIPPED 200-02 as YAML subset; covers briefs. For richer YAML (config files), fall back to `.json` format. |
| Exponential backoff | Hand-roll | 10-line helper in `lib/cli/http.cjs` (MRO: 1s → 2s → 4s → 8s → cap 30s) | Trivial to inline; no library needed. |
| Browser launch | `sindresorhus/open` (3rd party) | Platform switch inlined in `lib/cli/open-browser.cjs` | 15 LOC; matches zero-dep rule. |
| Progress bar | `cli-progress` / `ora` | Hand-rolled `[====>    ] 50%` (see §Pattern 7) | 30 LOC; zero-dep rule. ASCII-safe for Windows cmd.exe. |
| Shell completion generation | Custom bash script emitter | **Defer** (Claude's Discretion, time-permitting) | Out of scope unless Wave 4 finishes early. |

**Key insight:** This is a CLI wrapping existing tenant APIs that already exist or will exist this phase. 90% of command-side logic is: parse flags → read keychain → HTTP call → render. Keep each command module ≤150 LOC by pushing shared concerns into `lib/cli/*`.

## Runtime State Inventory

> This is a greenfield phase (adding new commands + new endpoints). No rename, no refactor, no string replacement. The inventory is trivially empty because the 11-command surface is additive and the existing `generate` command contract is preserved.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — we are adding new tables (`markos_api_keys`, `markos_cli_device_sessions`), not renaming existing ones. | New migrations with forward + rollback scripts per QA-13. |
| Live service config | None. | — |
| OS-registered state | None. | — |
| Secrets/env vars | `MARKOS_API_KEY` (new env var CLI reads at auth time) — opt-in, no migration impact. `MARKOS_PROFILE` (new — overrides default profile). `MARKOS_OAUTH_DEVICE_ENDPOINT` (new — dev/stage override; defaults to production `https://app.markos.com`). | Document in `docs/cli/environment.md`. |
| Build artifacts / installed packages | `keytar` (new native module). First `npm install` will trigger `prebuild-install`; on Linux headless CI this may print a libsecret deprecation warning [CITED: https://github.com/google-gemini/gemini-cli/issues/21537]. | Document in `docs/cli/installation.md` troubleshooting: "If `keytar` build fails on CI, the CLI auto-falls back to `$XDG_CONFIG_HOME/markos/credentials` (0600). You can also set `MARKOS_API_KEY=<key>` env var to skip keychain entirely." |

**Nothing found in most categories.** This phase is purely additive.

## Common Pitfalls

### Pitfall 1: keytar native build fails on bare Linux / headless CI

**What goes wrong:** `npm install keytar` invokes `prebuild-install` which downloads a prebuilt binary; if none available for the platform/Node combo, falls back to `node-gyp` which requires libsecret-dev headers. Bare Ubuntu minimal images (including GitHub Actions `ubuntu-latest` in some configs) do NOT have libsecret-dev.

**Why it happens:** keytar is archived since Mar 2025 [CITED: https://github.com/atom/node-keytar], so new Node versions may lack prebuilt binaries.

**How to avoid:**
1. In `lib/cli/keychain.cjs`, wrap `require('keytar')` in try/catch. On failure, fall back to XDG file automatically.
2. In install docs: recommend `sudo apt-get install -y libsecret-1-dev` for Linux dev boxes that WANT keychain.
3. In CI install docs: recommend `MARKOS_API_KEY=<key>` env var (bypasses keychain entirely).
4. Evaluate `@napi-rs/keyring` as production drop-in replacement (same API; no libsecret dep).

**Warning signs:** `npm install` emits `prebuild-install WARN` or `gyp ERR!`; `markos login` exits with keychain error on first run.

### Pitfall 2: OAuth device flow race — user approves after `expires_in`

**What goes wrong:** User opens browser, pauses for coffee, returns after 15+ minutes. CLI has already received `expired_token` and exited. User clicks "Approve" → grants access to a dead device_code.

**Why it happens:** Device flow TTL is short for security (RFC 8628 recommends ≤15 min).

**How to avoid:**
1. Server-side: when user approves a device_code that's already `status='expired'`, show "This login attempt expired. Please run `markos login` again." in the web UI.
2. CLI side: on `expired_token`, print "Login expired before you approved. Run `markos login` again." (exit 3).
3. Server-side: include `expires_in` in the `device_code` response so CLI can locally pre-empt (exit cleanly with "Login expired; run `markos login` again" when local clock passes `expires_at`, even before server confirms).

**Warning signs:** Users report "I clicked approve but CLI said login failed."

### Pitfall 3: SSE silent disconnect on `markos run --watch`

**What goes wrong:** Client thinks the run is still progressing but the server closed the SSE connection (proxy idle timeout, network blip, server restart). CLI hangs silently.

**Why it happens:** TCP keepalives are OS-level and slow (default 2h on Linux). HTTP proxies kill idle connections at 30-60s.

**How to avoid:**
1. Server-side: emit `event: heartbeat\ndata: {"ts":...}` every 15 seconds.
2. CLI side: expect a heartbeat within `1.5 * interval`; if missed, reconnect using `Last-Event-ID` header.
3. CLI side: timeout the entire `run --watch` at 30 min by default (configurable via `--timeout=<sec>`).

**Warning signs:** CI jobs using `markos run --watch` hang indefinitely on flaky networks.

### Pitfall 4: `markos env pull` overwrites uncommitted secrets

**What goes wrong:** Developer has `.markos-local/.env` with their local SMTP override. Runs `markos env pull` to sync a new tenant var → local override vaporizes.

**Why it happens:** Naive pull overwrites.

**How to avoid:**
1. `markos env pull` refuses if target exists without `--force` (per CONTEXT.md line 108).
2. Diff-mode: `markos env pull --diff` prints what would change without writing.
3. Merge-mode: `markos env pull --merge` adds missing keys but preserves local-only keys.

**Warning signs:** Developers complaining "lost my local dev overrides."

### Pitfall 5: Windows `.cmd` wrapper + UNC paths break `npx markos`

**What goes wrong:** Running `npx markos login` from a UNC path (`\\server\share\project`) on Windows can cause `cmd.exe /c` to refuse to cd into the directory.

**Why it happens:** `cmd.exe` has historical issues with UNC paths; npm's generated `.cmd` wrapper invokes `cmd /c`.

**How to avoid:**
1. Detect UNC path in `bin/install.cjs` entrypoint; print "Run from a local drive or use PowerShell instead."
2. Recommend Scoop install (which drops a direct `node.exe markos.cjs` entry, no cmd wrapper).

**Warning signs:** Windows users on enterprise setups report "cmd.exe: '\\server\share' path not supported."

### Pitfall 6: Device flow phishing via `user_code` tricking

**What goes wrong:** Attacker runs `markos login` on their own machine, gets a `user_code`, then social-engineers the victim ("enter this code at markos.com/cli/authorize") → victim approves attacker's device.

**Why it happens:** RFC 8628 relies on the user visually confirming the code they enter matches the CLI screen, but phishing defeats this.

**How to avoid:**
1. Per RFC 8628 §5.1, make the approval page show **what the device will access** and **expire in 15 min**, and put user consent friction there.
2. Require the approval page to show the device's IP + rough geo ("You're approving a CLI session from Germany. Was this you?") — cross-check against authenticated browser session's IP.
3. Approval step requires re-authentication if the user session is > 1 hour old (reconfirm identity).

**Warning signs:** Support tickets about unauthorized `markos_api_keys` entries.

**Mitigation scope for 204:** Wire the server-side `/api/cli/oauth/device/authorize` UI to show IP + geo + "you're approving a CLI login" banner. Defer advanced heuristics to 206 (SOC 2).

## Code Examples

Verified patterns from the existing codebase + RFC 8628.

### Device flow — CLI polling loop

```javascript
// Source: bin/commands/login.cjs (NEW) — pattern derived from RFC 8628 §3.5
'use strict';
const { openBrowser } = require('../lib/cli/open-browser.cjs');
const { setToken } = require('../lib/cli/keychain.cjs');

async function runLogin({ cli }) {
  // 1. Request device code
  const start = await fetch('https://app.markos.com/api/cli/oauth/device/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: 'markos-cli', scope: 'cli' }),
  }).then(r => r.json());

  // 2. Display to user + open browser
  console.log(`\n  Go to: ${start.verification_uri}`);
  console.log(`  Code:  ${start.user_code}\n`);
  openBrowser(start.verification_uri_complete);

  // 3. Poll
  let interval = start.interval * 1000;
  const deadline = Date.now() + start.expires_in * 1000;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, interval));

    const tok = await fetch('https://app.markos.com/api/cli/oauth/device/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: start.device_code,
        client_id: 'markos-cli',
      }).toString(),
    });
    const body = await tok.json();

    if (tok.ok) {
      await setToken(cli.profile || 'default', body.access_token);
      console.log(`✓ Logged in as ${body.tenant_id}`);
      process.exit(0);
    }

    if (body.error === 'slow_down') { interval += 5000; continue; }
    if (body.error === 'authorization_pending') continue;
    if (body.error === 'expired_token') {
      console.error('Login expired. Run `markos login` again.');
      process.exit(3);
    }
    console.error(`Login failed: ${body.error}`);
    process.exit(3);
  }

  console.error('Login timed out.');
  process.exit(3);
}

module.exports = { main: runLogin };
```

### Keychain wrapper with XDG fallback

```javascript
// Source: bin/lib/cli/keychain.cjs (NEW) — D-02 + D-06 fallback tree
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SERVICE = 'markos-cli';

function xdgCredPath() {
  const base = process.env.XDG_CONFIG_HOME
    || (process.platform === 'win32'
         ? path.join(process.env.APPDATA || os.homedir(), 'markos')
         : path.join(os.homedir(), '.config', 'markos'));
  return path.join(base, 'credentials');
}

let keytar = null;
try { keytar = require('keytar'); } catch { /* XDG fallback */ }

async function getToken(profile) {
  // 0. Env-var override beats everything
  if (process.env.MARKOS_API_KEY) return process.env.MARKOS_API_KEY;

  // 1. Keychain
  if (keytar) {
    try {
      const v = await keytar.getPassword(SERVICE, profile);
      if (v) return v;
    } catch { /* fall through */ }
  }

  // 2. XDG file
  try {
    const p = xdgCredPath();
    if (!fs.existsSync(p)) return null;
    const text = fs.readFileSync(p, 'utf8');
    const line = text.split('\n').find(l => l.startsWith(`${profile}=`));
    return line ? line.slice(profile.length + 1) : null;
  } catch { return null; }
}

async function setToken(profile, token) {
  if (keytar) {
    try { await keytar.setPassword(SERVICE, profile, token); return; } catch {}
  }
  const p = xdgCredPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const existing = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  const lines = existing.split('\n').filter(l => l && !l.startsWith(`${profile}=`));
  lines.push(`${profile}=${token}`);
  fs.writeFileSync(p, lines.join('\n') + '\n', { mode: 0o600 });
}

module.exports = { getToken, setToken };
```

### Homebrew formula template (ready-to-fill)

```ruby
# Source: Formula/markos.rb — new file pushed to markos/homebrew-tap repo
# Template pattern: https://docs.brew.sh/Node-for-Formula-Authors
class Markos < Formula
  desc "Marketing Operating System — developer-native CLI"
  homepage "https://markos.esteban.marketing"
  url "https://registry.npmjs.org/markos/-/markos-<VERSION>.tgz"
  sha256 "<SHA256_FROM_NPM_REGISTRY>"
  license "MIT"

  depends_on "node"  # floating LTS — NOT node@22 (deprecation 2026-10-28)

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "markos", shell_output("#{bin}/markos --version")
  end
end
```

**Deployment flow (release.yml triggers):**
1. `npm publish` → new version on registry.
2. Compute sha256 of the tgz.
3. `bump-homebrew-formula` action pushes new version + sha256 to `markos/homebrew-tap/Formula/markos.rb` [CITED: https://github.com/marketplace/actions/bump-homebrew-formula].

### Scoop bucket manifest template (ready-to-fill)

```json
{
  "$schema": "https://raw.githubusercontent.com/ScoopInstaller/Scoop/master/schema.json",
  "version": "<VERSION>",
  "description": "Marketing Operating System — developer-native CLI",
  "homepage": "https://markos.esteban.marketing",
  "license": "MIT",
  "depends": "nodejs-lts",
  "url": "https://registry.npmjs.org/markos/-/markos-<VERSION>.tgz",
  "hash": "sha256:<SHA256_FROM_NPM_REGISTRY>",
  "extract_dir": "package",
  "post_install": [
    "npm install --production --prefix \"$dir\""
  ],
  "bin": "bin/install.cjs",
  "checkver": {
    "url": "https://registry.npmjs.org/markos/latest",
    "jsonpath": "$.version"
  },
  "autoupdate": {
    "url": "https://registry.npmjs.org/markos/-/markos-$version.tgz",
    "hash": {
      "url": "https://registry.npmjs.org/markos/$version"
    }
  }
}
```
[CITED: Scoop manifest schema — https://github.com/ScoopInstaller/Scoop/wiki/App-Manifest-Autoupdate]

### GitHub Actions release workflow (template outline)

```yaml
# Source: .github/workflows/release.yml (NEW)
# Triggers on: git tag vX.Y.Z push
# Matrix: parallel publish to npm + brew + scoop; fail-fast on any channel
name: Release markos CLI

on:
  push:
    tags: ['v*']

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm test                       # Nyquist full suite
      - run: npm run release:smoke          # existing pack-check

  npm:
    needs: [verify]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', registry-url: 'https://registry.npmjs.org' }
      - run: npm ci
      - run: npm publish --access public
        env: { NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}' }

  brew:
    needs: [npm]
    runs-on: ubuntu-latest
    steps:
      - uses: mislav/bump-homebrew-formula-action@v3
        with:
          formula-name: markos
          formula-path: Formula/markos.rb
          homebrew-tap: markos/homebrew-tap
          download-url: 'https://registry.npmjs.org/markos/-/markos-${{ github.ref_name }}.tgz'
        env: { COMMITTER_TOKEN: '${{ secrets.HOMEBREW_TAP_TOKEN }}' }

  scoop:
    needs: [npm]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { repository: markos/scoop-bucket, token: '${{ secrets.SCOOP_BUCKET_TOKEN }}' }
      - name: Bump manifest
        run: node scripts/scoop/bump-manifest.cjs '${{ github.ref_name }}'
      - name: Push
        run: |
          git config user.email "bot@markos.com"
          git config user.name  "markos-bot"
          git add bucket/markos.json
          git commit -m "markos: bump to ${{ github.ref_name }}"
          git push

  smoke:
    needs: [npm, brew, scoop]
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm install -g markos@${{ github.ref_name }}
      - run: markos --version
```

Secrets required: `NPM_TOKEN`, `HOMEBREW_TAP_TOKEN`, `SCOOP_BUCKET_TOKEN`. Existing `sdk-publish.yml` already uses `NPM_TOKEN` pattern — clone it.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Password prompt on every CLI run | OAuth device flow (RFC 8628) → long-lived API key in OS keychain | 2019+ (GitHub CLI, Vercel CLI, Supabase CLI all adopted) | Zero password exposure; keys revokable server-side; pairs well with MFA |
| `keytar` as dominant OS keychain lib | `@napi-rs/keyring` + `Secrets SDK` (Zowe) + Electron safeStorage | 2022-2025 (keytar archived Mar 2025) | We stay on keytar per D-08 but wrap for drop-in swap; keychain primitive is commodity |
| Node 18 LTS floor | Node 22 LTS floor | Node 18 EOL April 2025 [CITED: https://nodejs.org/en/blog/announcements/node-18-eol-support] | Aligns CLI with Vercel default + enables undici fetch streaming for SSE |
| `opn` / `opener` for browser launch | `sindresorhus/open` OR inline 15-LOC switch | 2020+ | We inline per zero-dep rule |
| EventSource browser polyfill in Node | Undici fetch streaming (Node 22 built-in) | Node 22 (Oct 2024) | Hand-rolled SSE parser becomes trivial; no polyfill dep |
| `yargs` / `commander` | Hand-rolled flag parser for constrained surfaces | 200-02 precedent | Works for 11 commands × ~5 flags each; scales until we hit 30+ commands |

**Deprecated/outdated:**
- `atom/node-keytar` — archived Mar 2025; still works at v7.9.0 but no new Node versions will have prebuilt binaries long-term. Evaluate `@napi-rs/keyring` migration in 205 or v2.
- `node@22` Homebrew formula — deprecation date 2026-10-28. Use `depends_on "node"` (floating LTS) instead.
- Node 18 — EOL April 2025. `package.json` engines floor MUST lift to `>=22.0.0` this phase (currently `>=20.16.0`).
- `opn` npm pkg — deprecated in favor of `sindresorhus/open`. We use neither.

## Assumptions Log

> Claims tagged `[ASSUMED]` that need user confirmation before locking into plan decisions.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `https://app.markos.com` is the production CLI OAuth origin | §Pattern 3 OAuth device flow | Wrong origin → every CLI command breaks in prod. Confirm the SaaS domain canonical in PROJECT.md §Core Value update. |
| A2 | Server-side OAuth device-flow endpoints are built in this phase (not deferred to 205) | §API Surface · §Pattern 3 | If deferred, `markos login` is non-functional at Wave 1 ship. Must include `/api/cli/oauth/*` endpoints in 204 plan. |
| A3 | `markos_api_keys` table does not exist today; we create it in a new migration | §Architecture + Migration 13 new tables | Duplicate migration would fail. [VERIFIED: `Glob api/tenant/api-keys/**` → no files found — confirms it's new.] |
| A4 | `/api/tenant/runs` endpoint does not exist yet — we create it (likely delegates to MIR pipeline) | §Pattern 2 · API Surface | If it exists under a different name, we risk forking the server logic. Phase 204 plan needs a grep audit before first task writes to confirm. |
| A5 | `/api/tenant/env` endpoint does not exist yet | §Architecture | Same as A4. Likely truly new. |
| A6 | `/api/tenant/whoami` does not exist yet | §Architecture | [VERIFIED: `Glob api/tenant/whoami*` → no files found.] |
| A7 | `/api/tenant/status` does not exist yet | §Architecture | Same. |
| A8 | Audit `source_domain` for CLI actions: `'auth'` for login/keys, `'tenancy'` for env, `'crm'` for runs | Anti-patterns table | If 'cli' should be added as a domain instead, need to extend `AUDIT_SOURCE_DOMAINS` in `lib/markos/audit/writer.cjs`. **Recommended:** add `'cli'` as an 8th domain for CLI-initiated actions — cleaner audit filter in Phase 206 compliance reports. Flag for user. |
| A9 | SDK (Phase 200-07) is mature enough by Phase 204 start that CLI should use `@markos/sdk` for HTTP calls | §SDK Integration Recommendation | 200-07 summary says "full codegen deferred until 200-01.1 lands." If that's still unshipped at 204 kickoff, CLI falls back to `node:fetch` + inline endpoint shapes, and a 204.1 follow-up wires the SDK when it's ready. **Recommendation:** use raw `fetch` (Node 22 built-in) in Wave 1; refactor to SDK in Wave 4 if 200-01.1 is green. Low cost to migrate later. |
| A10 | Homebrew tap repo `markos/homebrew-tap` is created + `HOMEBREW_TAP_TOKEN` PAT is provisioned before release workflow fires | §Release CI template | CI fails loudly. Document as pre-flight in plan: "User must create tap repo + provision PAT before first tagged release." |
| A11 | Scoop bucket repo `markos/scoop-bucket` is similarly provisioned + `SCOOP_BUCKET_TOKEN` set | §Release CI template | Same as A10. |
| A12 | Homebrew formula submission stays in the user's own tap (not pushed to homebrew-core) | §Distribution | Homebrew core requires >75 stars + acceptance review. Stay on our tap indefinitely; users install via `brew install markos/tap/markos`. |
| A13 | Error code `3` (auth failure) includes "no keychain entry" — meaning a fresh machine's first `markos status` (no login yet) exits 3 with a "run `markos login`" hint | §Pattern 7 exit codes | Acceptable UX for CI and humans. |
| A14 | Device-flow `user_code` format: 8 chars (AAAA-AAAA); `device_code` is 32+ bytes hex | §Pattern 3 | Standard per RFC 8628. Confirm OK with security review. |
| A15 | CLI does NOT implement token refresh — API keys are long-lived. Revocation is manual (`markos keys revoke`) or admin-initiated (via tenant dashboard) | §OAuth Contract | If product wants rotating short-lived tokens in 205, we revisit. Current simpler model matches `gh` + `vercel`. |

**If this table is empty:** It's not. Most items here are server-side API contracts that CONTEXT.md implies but doesn't fully nail down. Discuss-phase or planner should pressure-test each A1-A15 before first commit.

## Open Questions

1. **Is `markos doctor` autofix fully safe to run on prod machines?**
   - What we know: D-04 lists `markos doctor` as diagnose-and-fix with `--check-only` flag.
   - What's unclear: "renew expired tokens interactively" — should this auto-open the browser for re-login, or print instructions? Silent token renewal risks the phishing vector (Pitfall 6).
   - Recommendation: `markos doctor` detects + prompts; user runs `markos login` explicitly. `--auto-fix` flag for CI that whitelists only filesystem + gitignore fixes (never auth-related fixes).

2. **What tenant-role gates which commands?**
   - What we know: D-02 says "owner/admin only" for `markos keys create`.
   - What's unclear: `markos env push` — owner only? Admin? Member? Same for `markos run` (any member who has a valid API key with `scope=cli`?).
   - Recommendation: planner to enumerate per-endpoint role gate. Default: read-only commands (`list`, `status`, `whoami`, `plan`, `eval`, `env pull`, `env list`) → any member; write commands (`keys create/revoke`, `env push`, `run`) → owner/admin.

3. **SDK regen trigger — CLI uses SDK or raw fetch?**
   - What we know: Phase 200-07 ships SDK scaffold; full codegen gated on 200-01.1 parser hardening.
   - What's unclear: Whether 200-01.1 ships before 204 starts.
   - Recommendation (per A9): use raw `fetch` in Wave 1; migrate to SDK in Wave 4 if available. Each command calls 1-3 endpoints; migration is mechanical. If SDK is not ready by phase end, ship raw fetch and defer migration to 204.1. (Small cost; high schedule safety.)

4. **Shell completions — scope or defer?**
   - What we know: D-Discretion marks this as "time permitting."
   - Recommendation: defer cleanly to a `204.1-shell-completions` gap-closure mini-phase. Keep Wave 1-4 focused; tell users completions ship in a patch.

5. **Cross-domain audit correlation — CLI trace IDs?**
   - What we know: QA-09 mandates OTEL; QA-01 mandates hash-chained audit.
   - What's unclear: Should CLI generate a trace ID client-side (`x-markos-trace-id: tr_<uuid>`) that servers propagate into audit rows, so a single `markos run` maps to N audit entries via that trace ID?
   - Recommendation: YES. Cheap (UUID generation client-side); huge observability win. Add to Pattern 2. Planner to decide whether the audit row shape needs a new `trace_id` column (likely: add to `payload.trace_id` — no schema change needed).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥22 | All CLI commands | ✓ | v22.13.0 (dev machine) | — |
| `keytar` prebuilt binary | `markos login`, `whoami`, `keys`, auth-gated commands | ⚠ | 7.9.0 | `@napi-rs/keyring` fallback (not wired Wave 1; document trigger) + XDG 0600 file |
| libsecret (Linux only) | keytar on Linux | Unknown on CI | — | XDG fallback auto-activates (§Pattern 4) |
| `npm` registry (publish) | Release workflow | ✓ | npm 11.x via Node 22 | — |
| Homebrew tap repo `markos/homebrew-tap` | Release workflow Wave 4 | ✗ (not created) | — | **Block Wave 4** until user creates repo + provisions `HOMEBREW_TAP_TOKEN` |
| Scoop bucket repo `markos/scoop-bucket` | Release workflow Wave 4 | ✗ (not created) | — | **Block Wave 4** until user creates repo + provisions `SCOOP_BUCKET_TOKEN` |
| Supabase migrations infra | Migration 73+ for api-keys + cli sessions | ✓ | — | — |
| Existing tenant API auth helpers (`lib/markos/auth/session.ts`) | All new `api/tenant/*` handlers | ✓ | — | — |
| `lib/markos/audit/writer.cjs::enqueueAuditStaging` | Mutating commands audit emit | ✓ | — | — (AUDIT_SOURCE_DOMAINS includes 7 domains — §A8 asks whether to add 'cli' as 8th) |
| `openapi-fetch` (SDK) | Optional SDK-based HTTP calls | ✓ | 0.17.0 | raw `fetch` (Node 22 builtin) |

**Missing dependencies with no fallback:**
- Homebrew tap repo provisioning (user action)
- Scoop bucket repo provisioning (user action)
- `HOMEBREW_TAP_TOKEN` + `SCOOP_BUCKET_TOKEN` secrets (user action via GitHub repo settings)

**Missing dependencies with fallback:**
- libsecret on Linux → XDG 0600 file (silent auto-fallback with one-time stderr warning)
- Full SDK codegen not ready → raw `fetch` calls in Wave 1 (migration is mechanical in 204.1 if needed)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node --test` (Node 22 built-in test runner) |
| Config file | none — CLAUDE.md locks `npm test` = `node --test test/**/*.test.js` |
| Quick run command | `node --test test/cli/<cmd>.test.js` |
| Full suite command | `npm test` (runs every test file matching `test/**/*.test.js`) |
| Subprocess integration | `test/cli-e2e.test.js` spawns `bin/install.cjs` via `spawnSync` — pattern SHIPPED 200-02 [VERIFIED: `test/cli-generate.test.js:116-155`] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CLI-01 | `markos login` happy-path device flow | unit + e2e | `node --test test/cli/login.test.js -x` | ❌ Wave 1 |
| CLI-01 | `markos login` handles `slow_down` / `authorization_pending` / `expired_token` | unit | `node --test test/cli/login.test.js -x` | ❌ Wave 1 |
| CLI-01 | `markos login --token=<key>` (non-interactive CI path) | unit | `node --test test/cli/login.test.js -x` | ❌ Wave 1 |
| CLI-01 | `markos whoami` reads keychain + calls `/api/tenant/whoami` | unit | `node --test test/cli/whoami.test.js -x` | ❌ Wave 1 |
| CLI-01 | `markos keys list|create|revoke` CRUD over `/api/tenant/api-keys/*` | unit | `node --test test/cli/keys.test.js -x` | ❌ Wave 1 |
| CLI-01 | `markos keys revoke` requires `--yes` or interactive confirm | unit | `node --test test/cli/keys.test.js -x` | ❌ Wave 1 |
| CLI-01 | `markos init` (delegates to install.cjs --yes) | e2e | `node --test test/cli-e2e.test.js` | ❌ Wave 2 |
| CLI-01 | `markos plan <brief>` dry-run | unit + e2e | `node --test test/cli/plan.test.js` | ❌ Wave 2 |
| CLI-01 | `markos run <brief>` submits + streams SSE | unit + integration | `node --test test/cli/run.test.js` | ❌ Wave 2 |
| CLI-01 | `markos run --watch=false` returns run_id without waiting | unit | `node --test test/cli/run.test.js` | ❌ Wave 2 |
| CLI-01 | `markos eval <brief>` local scoring | unit | `node --test test/cli/eval.test.js` | ❌ Wave 2 |
| CLI-01 | `markos env pull` 0600 + `.markos-local/` + refuses overwrite without --force | unit + e2e | `node --test test/cli/env.test.js` | ❌ Wave 2 |
| CLI-01 | `markos env push` | unit | `node --test test/cli/env.test.js` | ❌ Wave 2 |
| CLI-01 | `markos env list` redacts values in TTY table | unit | `node --test test/cli/env.test.js` | ❌ Wave 2 |
| CLI-01 | `markos status` aggregates quota + rotations + recent runs | unit | `node --test test/cli/status.test.js` | ❌ Wave 3 |
| CLI-01 | `markos doctor --check-only` zero side-effects | unit | `node --test test/cli/doctor.test.js` | ❌ Wave 3 |
| CLI-01 | `markos doctor` auto-fixes missing `.markos-local/`, gitignore | unit + e2e | `node --test test/cli/doctor.test.js` | ❌ Wave 3 |
| CLI-01 | Keychain fallback: XDG file when keytar throws | unit | `node --test test/cli/keychain.test.js -x` | ❌ Wave 1 |
| CLI-01 | TTY output: colored table; non-TTY: JSON | unit | `node --test test/cli/output.test.js` | ❌ Wave 1 |
| CLI-01 | `NO_COLOR` env var disables color | unit | `node --test test/cli/output.test.js` | ❌ Wave 1 |
| CLI-01 | Exit codes 0/1/2/3/4/5 mapped correctly per D-10 | unit across commands | `npm test` | — |
| CLI-01 | `--profile` flag switches keychain entry | unit | `node --test test/cli/profiles.test.js` | ❌ Wave 1 |
| CLI-01 | npm publish smoke: `markos --version` prints from `package.json` | e2e | CI `smoke` job | ❌ Wave 4 |
| CLI-01 | brew install smoke | e2e | CI `smoke` matrix (macOS) | ❌ Wave 4 |
| CLI-01 | scoop install smoke | e2e | CI `smoke` matrix (Windows) | ❌ Wave 4 |
| QA-01 | All 5 F-NN contracts lint green in Spectral | CI | `npm run openapi:build + spectral lint` | — |
| QA-04 | Coverage ≥80% on `lib/cli/**` | CI | `node --test --experimental-test-coverage test/cli/**/*.test.js` | — |
| QA-13 | Migration forward + rollback tests | unit | `node --test test/migrations/<N>_markos_api_keys.test.js` | ❌ Wave 1 |

### Sampling Rate

- **Per task commit:** `node --test test/cli/<affected>.test.js` (only the touched command's unit suite — fast, <10s)
- **Per wave merge:** `node --test test/cli/**/*.test.js test/cli-e2e.test.js` (all CLI + e2e; <60s)
- **Phase gate:** `npm test` full suite green (≈20 test files including existing 199 webhook, 14 generate, 24+ rotation, etc.) before `/gsd-verify-work`
- **Release gate:** full suite + per-channel smoke matrix in CI

### Wave 0 Gaps

- [ ] `test/cli/login.test.js` — Wave 1
- [ ] `test/cli/whoami.test.js` — Wave 1
- [ ] `test/cli/keys.test.js` — Wave 1
- [ ] `test/cli/keychain.test.js` — Wave 1
- [ ] `test/cli/output.test.js` — Wave 1
- [ ] `test/cli/profiles.test.js` — Wave 1
- [ ] `test/cli/init.test.js` — Wave 2
- [ ] `test/cli/plan.test.js` — Wave 2
- [ ] `test/cli/run.test.js` — Wave 2
- [ ] `test/cli/eval.test.js` — Wave 2
- [ ] `test/cli/env.test.js` — Wave 2
- [ ] `test/cli/status.test.js` — Wave 3
- [ ] `test/cli/doctor.test.js` — Wave 3
- [ ] `test/cli-e2e.test.js` — Wave 1 (scaffold) → extend each wave
- [ ] `test/migrations/<N>_markos_api_keys.test.js` — Wave 1
- [ ] `test/migrations/<N>_markos_cli_device_sessions.test.js` — Wave 1
- [ ] Stub OAuth server fixture under `test/fixtures/oauth-server.cjs` — Wave 1
- [ ] No framework install needed (node --test is builtin; already in use by `test/cli-generate.test.js`)

## Security Domain

Security enforcement enabled (no `security_enforcement: false` override; CONTEXT.md explicitly invokes all 15 QA gates incl. QA-11 threat model).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | OAuth 2.0 Device Authorization Grant (RFC 8628) — CLI flow; API-key bearer for subsequent calls |
| V3 Session Management | yes | No CLI-side sessions (stateless API key). Server-side device_code sessions in new migration table, TTL 15 min, status machine `pending→approved|denied|expired` |
| V4 Access Control | yes | Tenant role gate (`markos_tenant_memberships.role IN ('owner','admin')`) on `keys create/revoke` + `env push`; member-level on read commands |
| V5 Input Validation | yes | YAML brief parser (existing 200-02); Ajv schemas on every new endpoint request+response (QA-02) |
| V6 Cryptography | yes | `crypto.randomBytes(32)` for API keys + device_code; `sha256(key).slice(0,8)` for key fingerprint display; never hand-roll signing (reuse `lib/markos/webhooks/signing.cjs` if request-signing needed later) |
| V7 Error Handling + Logging | yes | Audit-log on every mutating command (`enqueueAuditStaging`); structured JSON errors to stderr per D-10 |
| V8 Data Protection | yes | API key stored in OS keychain (plaintext is OS-secured); XDG fallback 0600 permissions + user warning; never written to config.json |
| V9 Communication Security | yes | HTTPS only; cert validation default Node behavior; no certificate pinning (complexity vs. value tradeoff); Bearer auth on all tenant calls |
| V10 Malicious Code | partial | `npm install` risk: keytar prebuild download. Mitigation: `npm ci` in CI; lockfile integrity check |
| V11 Business Logic | yes | Rate limits on device-flow token endpoint (mimic rotate.js 1-per-5-min pattern from Phase 203) |
| V13 API + Web Service | yes | OpenAPI 3.1 contracts for all 5 new F-NN; Spectral lint blocks PR |

### Known Threat Patterns for CLI-over-OAuth Stack

| Threat ID | STRIDE | Standard Mitigation |
|-----------|--------|---------------------|
| T-204-01 Device code phishing (Pitfall 6) | Spoofing | RFC 8628 §5.1: approval page shows IP + geo + "you're approving a CLI login"; session re-auth if > 1h old; display device hint to approver |
| T-204-02 Brute-force polling of device_code | DoS | Server-side rate limit: 1 poll per `interval`-seconds-window per device_code; emit `slow_down` on violation; revoke after 3 violations |
| T-204-03 Keychain leak via swap/backup (macOS Time Machine, Windows file hist) | Information Disclosure | keytar uses OS-managed storage — OS-level encryption applies. For XDG fallback: 0600 perms + warn user "file-based credentials are at-rest plaintext — install libsecret for keychain-backed." |
| T-204-04 `markos env pull` clobbers local `.env` with uncommitted secrets (Pitfall 4) | Tampering | Refuse overwrite without `--force`; offer `--diff` and `--merge` modes |
| T-204-05 Arbitrary code from compromised npm tgz | Tampering / Supply chain | npm signed publishes (npm has sigstore integration); users validate `package-lock.json` shasums; tap formula + bucket manifest both pin sha256 of tgz per release |
| T-204-06 API key in process env leaks via `/proc/<pid>/environ` (Linux) | Information Disclosure | Document: prefer keychain over `MARKOS_API_KEY` env; env-var use is CI-only. Key fingerprint display always masks to last 8 chars. |
| T-204-07 CLI user logs full HTTP response including API key accidentally | Information Disclosure | `lib/cli/http.cjs` NEVER logs request headers or response bodies at INFO level. `--debug` flag enables full logging with a stderr warning "debug mode: request/response including auth headers visible". |
| T-204-08 Replay of device_code approval (victim approves twice, attacker races for token) | Tampering | Server: `markos_cli_device_sessions.status` is a state machine; `approved→issued` is one-shot; second token-endpoint call returns `access_denied` |
| T-204-09 CSRF on approval page (attacker tricks victim into approving via CSRF) | Tampering | Approval POST requires an authenticated session cookie + CSRF token (Phase 201 platform baseline QA-12 applies) |
| T-204-10 Tenant-id confusion (user has multi-org; `markos keys create` creates for wrong tenant) | EoP | Every CLI write command prints "Writing to tenant: <tenant_name> (<tenant_id>). Press Ctrl+C to abort." with 2-second delay in TTY mode; in CI (non-TTY), requires `--tenant=<id>` explicit flag |
| T-204-11 Audit bypass (`markos env push` forgets `enqueueAuditStaging`) | Repudiation | Unit test per mutating command asserts a stub `enqueueAuditStaging` was called (mock injected); CI lint rule greps for `enqueueAuditStaging` in every new `api/tenant/*` mutating handler |
| T-204-12 Rotation grace-window collision ( `markos status` shows rotation; user runs `markos run` mid-rotation; does CLI sign with V1 or V2?) | Tampering | CLI doesn't sign — server signs outbound webhooks (Phase 203). `markos run` just submits a run; the server's dispatch path uses the current `secret + secret_v2` dual-sign logic already shipped. No CLI-side change. |

## New API Surface Inventory

**5 new F-NN contracts** (required by QA-01 contract-first):

| Contract | Endpoints | Purpose |
|----------|-----------|---------|
| F-101-cli-oauth-device-v1.yaml | `POST /api/cli/oauth/device/start` · `POST /api/cli/oauth/device/token` · `POST /api/cli/oauth/device/authorize` (server-side UI callback) | Device flow (D-02) |
| F-102-cli-api-keys-v1.yaml | `GET /api/tenant/api-keys` · `POST /api/tenant/api-keys` · `POST /api/tenant/api-keys/{key_id}/revoke` | CRUD (D-02) |
| F-103-cli-runs-v1.yaml | `POST /api/tenant/runs` · `POST /api/tenant/runs/plan` · `GET /api/tenant/runs/{run_id}/events` (SSE) | `run`/`plan` (D-03) |
| F-104-cli-env-v1.yaml | `GET /api/tenant/env` · `GET /api/tenant/env/pull` · `POST /api/tenant/env/push` | `env` (D-04) |
| F-105-cli-whoami-status-v1.yaml | `GET /api/tenant/whoami` · `GET /api/tenant/status` | `whoami`/`status` (D-04) |

**2 new migrations:**
- `supabase/migrations/XX_markos_api_keys.sql` — `markos_api_keys` table (tenant-scoped, role-gated, audit-emitting), with forward + rollback scripts (QA-13).
- `supabase/migrations/XX_markos_cli_device_sessions.sql` — `markos_cli_device_sessions` table (TTL + state machine), with rollbacks.

**1 new `AUDIT_SOURCE_DOMAINS` value (pending A8 confirmation):** `'cli'` added to `lib/markos/audit/writer.cjs` constant list so CLI-initiated actions are filterable.

## Wave Grouping Recommendation

Based on dependency analysis:

| Wave | Plans | Theme | Unblocks |
|------|-------|-------|----------|
| **Wave 1** — Foundation + Auth | 204-01 (dispatch + shared primitives + 2 migrations) · 204-02 (OAuth device flow server + `login` command + F-101) · 204-03 (API keys CRUD + `keys` command + F-102) · 204-04 (`whoami` command + F-105 partial) | Server-side auth surface for all other CLI commands | Waves 2+3 |
| **Wave 2** — Workspace commands | 204-05 (`init` delegates to install.cjs; `plan`; `eval`) · 204-06 (`run` + SSE + F-103) · 204-07 (`env` + F-104) | Full workspace UX | Wave 4 smoke tests |
| **Wave 3** — Operator tooling | 204-08 (`status` + F-105 complete) · 204-09 (`doctor`) | User self-service diagnostics | Wave 4 |
| **Wave 4** — Distribution + docs | 204-10 (Homebrew formula + tap) · 204-11 (Scoop bucket + manifest) · 204-12 (release.yml matrix CI + per-channel smoke + error-code doc + llms.txt update) | Phase closure | — |

Dependency rationale:
- Wave 1's device-flow endpoints are a hard gate — `whoami`, `keys`, and every authed command need them. Wave 1 `keychain.cjs` primitive is also consumed by all later waves.
- Wave 2 commands (run/plan/env) all call authed tenant endpoints → need Wave 1 keychain + HTTP wrappers.
- Wave 3 commands (`status`, `doctor`) consume the full surface, so parked last.
- Wave 4 ships distribution only after functional CLI is verified end-to-end — never push a broken brew install.

**Alternative reasonable ordering:** Collapse Waves 3+4 if bandwidth allows → 3 waves total. Keep Wave 1 separate (foundation critical path).

## SDK Integration Recommendation (A9)

**Recommendation:** use raw `fetch` (Node 22 built-in) in Wave 1. Refactor to `@markos/sdk` in Wave 4 if 200-01.1 (OpenAPI parser hardening) has shipped by then.

**Rationale:**
1. SDK is scaffolded but full codegen is gated on 200-01.1 [VERIFIED: sdk/typescript/src/index.ts:3-7 "schema.d.ts is generated by npm run generate…Full generation is gated on hardening"].
2. CLI must not depend on an unverified-typed SDK at launch.
3. Each CLI command calls 1-3 endpoints → switching to SDK is mechanical (one-line swap from `fetch(url)` to `client.GET('/path')`).
4. Node 22 built-in `fetch` (undici) gives us streaming response bodies out-of-the-box, which SSE needs. SDK's `openapi-fetch` wraps fetch without adding streaming ergonomics.

**Test coverage:** `test/cli/http.test.js` mocks `global.fetch`; migration to SDK would rewire the mock to mock `openapi-fetch`'s client. Mechanical change.

## Sources

### Primary (HIGH confidence)

- **RFC 8628** — OAuth 2.0 Device Authorization Grant [CITED: https://www.rfc-editor.org/rfc/rfc8628]
- **Node.js release schedule** [CITED: https://nodejs.org/en/about/previous-releases] — confirms Node 22 Active LTS till Oct 2025, Maintenance LTS till April 2027.
- **Homebrew Node for Formula Authors** [CITED: https://docs.brew.sh/Node-for-Formula-Authors] — the template pattern for wrapping npm pkg.
- **Homebrew node@22 formula** [CITED: https://formulae.brew.sh/formula/node@22] — explicit deprecation date 2026-10-28.
- **Scoop App Manifest Autoupdate** [CITED: https://github.com/ScoopInstaller/Scoop/wiki/App-Manifest-Autoupdate] — manifest auto-update schema.
- **MDN Server-Sent Events** [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events] — wire format + reconnection semantics.
- **keytar npm page** [CITED: https://www.npmjs.com/package/keytar] — v7.9.0 release metadata.
- **@napi-rs/keyring npm page** [CITED: https://www.npmjs.com/package/@napi-rs/keyring] — 1.2.0 drop-in alternative.
- **atom/node-keytar GitHub** [CITED: https://github.com/atom/node-keytar] — archive status confirmation.
- **node-18-eol announcement** [CITED: https://nodejs.org/en/blog/announcements/node-18-eol-support]
- **sindresorhus/open** [CITED: https://github.com/sindresorhus/open] — cross-platform browser launch commands table.

### Secondary (MEDIUM confidence — cross-verified)

- WorkOS OAuth device flow guide [CITED: https://workos.com/blog/nodejs-cli-authentication-workos-oauth] — Node.js CLI-specific patterns validated against RFC 8628.
- DEV.to GitHub CLI device flow tutorial [CITED: https://dev.to/ddebajyati/integrate-github-login-with-oauth-device-flow-in-js-cli-28fk] — cross-verifies polling loop shape.
- bump-homebrew-formula action marketplace [CITED: https://github.com/marketplace/actions/bump-homebrew-formula] — widely-used release automation.
- Gemini-CLI keytar deprecation issue [CITED: https://github.com/google-gemini/gemini-cli/issues/21537] — real-world evidence of keytar install pain.

### Tertiary (LOW confidence — informational)

- General SSE + polling technique blog posts (2026 refreshers) — cross-verified against MDN spec, so effectively MEDIUM.

### Verified against local codebase

- `bin/install.cjs`, `bin/cli-runtime.cjs`, `bin/generate.cjs`, `bin/lib/brief-parser.cjs` — dispatch + parser patterns.
- `lib/markos/audit/writer.cjs` — enqueueAuditStaging + AUDIT_SOURCE_DOMAINS.
- `api/tenant/webhooks/subscriptions/[sub_id]/rotate.js` — endpoint handler skeleton (Pattern 2).
- `test/cli-generate.test.js` — subprocess spawn pattern for CLI e2e (Pattern §Testing).
- `package.json` — current `engines.node`, `bin.markos`, existing deps.
- `.github/workflows/sdk-publish.yml`, `.github/workflows/openapi-ci.yml` — release + contract CI patterns to clone.
- `contracts/F-*.yaml` inventory — confirms F-101..105 are free slots.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — Node 22 LTS + keytar + zero-dep hand-roll pattern all grounded in D-08 and shipped 200-02 precedent.
- Architecture: **HIGH** — 201/203 tenant-handler patterns are the template; dispatch extension is trivial.
- OAuth device flow contract: **HIGH** — RFC 8628 is the spec; implementation patterns verified against GitHub CLI + Vercel CLI references.
- Distribution: **MEDIUM** — Homebrew + Scoop templates are verified, but tap/bucket repo provisioning + PAT setup is a user action not yet done.
- SDK integration: **MEDIUM** — decision hinges on whether 200-01.1 ships before 204 kickoff (A9 flag).
- Pitfalls: **HIGH** — all 6 pitfalls grounded in shipped Phase 203 learnings + cross-platform Node quirks.
- Validation strategy: **HIGH** — node --test patterns proven in 14-test `cli-generate.test.js`.

**Research date:** 2026-04-18
**Valid until:** 2026-05-18 (30 days — stable foundation choices) · the Homebrew node@22 deprecation (2026-10-28) is a 6-month horizon clock; revisit if 204 slips past October 2026.

## Codebase/Vault Refresh Addendum - 2026-04-23

### Additional files inspected

- `package.json`
- `bin/install.cjs`
- `bin/cli-runtime.cjs`
- `api/openapi.js`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`

### Current codebase truth

- The published `markos` binary still points to `bin/install.cjs`, so CLI GA must preserve installer/bootstrap behavior.
- `bin/cli-runtime.cjs` already routes a meaningful family of commands; Phase 204 is extending a living CLI, not creating one from zero.
- The installer already owns vault bootstrap, Obsidian/QMD detection, install profiles, preset installs, and onboarding-helper handoff.
- The repo already exposes OpenAPI artifacts and many hosted APIs, so Phase 204 should prefer consuming existing and planned tenant APIs rather than embedding business logic locally.

### New research decisions from the deep audit

- `markos run`, `status`, and `doctor` should be designed as doctrine-aware clients over server truth, not as local mini-platforms.
- Regression protection for install/update/vault/generate is a first-class acceptance requirement for this phase.
- winget and apt remain deferred; no new top-level distribution phase is required right now.
- `doctor` should include codebase/vault bootstrap checks because vault readiness is now part of MarkOS operational truth.
- Phase 204 must stay compatible with Phase 207; CLI run semantics should not preempt the shared run substrate.

### Additional tests implied

- Installer regression tests: `npx markos`, preset install, and vault bootstrap still work after command-surface expansion.
- Routing regression tests for existing `update`, `db:setup`, `llm:*`, `import:legacy`, `vault:open`, and `generate` aliases.
- `doctor` checks for vault/bootstrap/config drift in addition to runtime/env drift.

### Phase-plan impact

- `204-01` must explicitly include compatibility scaffolding for the current installer/runtime surface.
- `204-05`, `204-06`, `204-08`, and `204-09` should stay thin-client oriented.
- `204-13` must remain the doctrine-gap closer that binds CLI behavior to the deep audit and pricing-placeholder policy.

## RESEARCH COMPLETE
