# Phase 204: CLI `markos` v1 GA - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning
**Milestone:** v4.0.0 SaaS Readiness 1.0

<domain>
## Phase Boundary

Graduate MarkOS CLI from the single `generate` command (shipped in Phase 200-02) to a full GA surface with **11 commands** and **5-channel cross-platform distribution**, all respecting tenant-scoped auth (Phase 201) and the API/SDK contracts (Phase 200-01 OpenAPI + 200-07 SDK CI).

**Command surface (11):**
- Workspace: `init` · `generate` (already shipped) · `plan` · `run` · `eval`
- Identity: `login` · `keys` · `whoami`
- Environment: `env` · `status` · `doctor`

**Distribution channels (5):** npm (existing) · Homebrew · Scoop · winget · apt

**Requirements addressed:** CLI-01, QA-01..15

**Not in scope (belongs elsewhere):**
- Single-binary bundled CLI (`esbuild`/`pkg`/`bun build --compile`) — deferred to post-GA v2 once install friction data is collected
- TUI / interactive dashboards — `/gsd:plant-seed` backlog
- CLI plugin system (`markos plugin install`) — deferred (v2 marketplace track per PROJECT.md)

</domain>

<decisions>
## Implementation Decisions

### D-01: Command Surface — Flat, not nested
Keep commands flat (`markos login`, `markos keys`, `markos whoami`) rather than grouped (`markos auth login …`). Matches the `gh` + `vercel` conventions the Target ICP already knows. Fewer keystrokes; aligns with brand stance "developer-native · quietly confident". `markos keys` takes a subcommand (`list` | `create` | `revoke`), since keys has multiple CRUD verbs; `login`/`whoami` stay single-verb.

### D-02: Auth Model — OAuth device flow + API-key management
- `markos login` → OAuth device flow. CLI opens browser to `https://app.markos.com/cli/authorize?device_code=...`, polls `/api/cli/oauth/device/token`, on success issues a **new API key** bound to the tenant membership and stores it in the OS keychain. Non-interactive fallback: `markos login --token=<pasted-api-key>` writes directly to keychain (for CI).
- `markos keys list|create|revoke` → manual CRUD over `/api/tenant/api-keys/*` (new endpoints; Phase 201 `markos_tenant_memberships` role gate: owner/admin only).
- `markos whoami` → reads active keychain entry, calls `/api/tenant/whoami`, prints `{tenant_id, tenant_name, role, email, key_fingerprint, profile}`.
- Token storage: **OS keychain** via `keytar` (macOS Keychain / Windows Credential Vault / libsecret). Fallback to `$XDG_CONFIG_HOME/markos/credentials` (0600) if keytar native build fails.

### D-03: `run` vs `eval` — Distinct responsibilities
- **`markos run <brief.yaml>`** → Submit brief to tenant API (`POST /api/tenant/runs`), returns `run_id`, then streams progress via SSE from `GET /api/tenant/runs/{run_id}/events`. Composable: exits 0 on success, non-zero on any run step failure. `--watch=false` returns run_id immediately (fire-and-forget for CI).
- **`markos eval <brief.yaml> [--draft=<path>]`** → Local LLM-rubric quality scoring over a generated draft (or re-generates one). Runs the same audit layer as `generate` plus a scoring pass. Produces `{score, dimensions, issues[]}` JSON. No tenant round-trip (fully local; pluggable LLM).
- **`markos plan <brief.yaml>`** → Dry-run: shows which steps `run` would execute without submitting to tenant. Uses `/api/tenant/runs/plan` (new endpoint; no state change).

### D-04: `env` / `status` / `doctor` Scopes
- **`markos env pull [profile]`** → Pulls tenant env vars (`/api/tenant/env`) into `.markos-local/.env` (0600). `markos env push` symmetric. `markos env list` dumps redacted keys. Mirrors `vercel env pull` UX.
- **`markos status`** → Shows tenant subscription tier, quota consumption (runs/month, deliveries, tokens), active rotations (via Phase 203 webhook rotation endpoint), and recent run summary. Exits 0 always unless auth fails.
- **`markos doctor`** → Diagnose-**and**-fix mode. Checks: Node version (≥22 LTS), config dir writable, active token valid, `.markos-local/` exists + gitignored, Supabase/Upstash/Vercel connectivity (when used). Auto-fixes: create missing dirs, renew expired tokens interactively, add `.markos-local/` to `.gitignore`. `--check-only` flag for diagnose-only in CI.

### D-05: Distribution — Phased rollout
- **Wave 1 (this phase):** npm (existing) · Homebrew tap (`markos/tap/markos`) · Scoop bucket (`markos/scoop-bucket`). Covers macOS + Linux devs + Windows dev-focused users (~95% of target ICP per PROJECT.md).
- **Wave 2 (deferred to 205 or separate 204.x gap-closure):** winget (Microsoft Store manifest submission) · apt (Debian PPA via `reprepro`). Long-tail; requires additional signing + hosting infra.
- **CI automation:** Each release tag triggers a matrix job that publishes to all 3 Wave-1 channels atomically. Rollback = untag + re-publish previous version.
- **Version parity:** All channels ship identical `package.json` version; `markos --version` returns it.

### D-06: Config + Credentials Storage
- **Config:** `$XDG_CONFIG_HOME/markos/config.json` (defaults to `~/.config/markos/config.json` on Linux/Mac, `%APPDATA%\markos\config.json` on Windows). Non-sensitive: active profile, default output format, telemetry opt-in. 0600 permissions.
- **Credentials:** OS keychain via `keytar` (service=`markos-cli`, account=`<profile>`). Keychain value is the API key plaintext; no caching in config file.
- **Profiles:** `markos --profile=prod <cmd>` or `MARKOS_PROFILE=prod` env var. Each profile = independent keychain entry + config section. Default profile name = `default`.
- **`.markos-local/`** stays per-project, never global. Already established by prior MarkOS protocol (never `.mgsd-local/`).

### D-07: Output Format — Auto-adaptive
- **TTY default:** Human-readable — colored tables (via hand-rolled ANSI; no `chalk`/`cli-table` dep to match 200-02 zero-dep pattern), section headers, progress spinners for long ops.
- **Non-TTY default:** Auto-switches to JSON (compact, newline-terminated per record for streamable piping). Detected via `process.stdout.isTTY`.
- **Explicit overrides:** `--json` (force JSON even in TTY), `--format=table|json|yaml`, `--quiet` (suppress non-essential stderr).
- **Exit codes:** `0` = success, `1` = user error (bad args, failed validation), `2` = transient/retry (network, 5xx), `3` = auth failure, `4` = quota/permission, `5` = internal/bug. Documented in `markos --help` footer.

### D-08: Packaging — Pure Node
- Stay pure Node.js CJS for v1. Entry stays `bin/install.cjs` with dispatch via `bin/cli-runtime.cjs`. Subcommand modules in `bin/commands/*.cjs`.
- **Node floor:** Node 22 LTS (matches Vercel default; Node 18 deprecated). `#!/usr/bin/env node` shebang.
- **Only deps added this phase:** `keytar` (OS keychain — native module, allowed because alternative is plaintext on disk). All other UX (colors, tables, spinners, flag parsing) stays hand-rolled per 200-02 precedent.
- **Homebrew/Scoop formulas:** Wrap the npm tarball — no re-implementation. Formula runs `npm install -g markos@<version>` under a managed prefix. Zero duplicate binary drift.

### D-09: Test Strategy
- **Unit:** Per-command module under `test/cli/<cmd>.test.js` using `node --test` (matches project CLAUDE.md convention). Stub `keytar`, HTTP, LLM.
- **Integration:** `test/cli-e2e.test.js` spawns actual `bin/install.cjs` subprocesses against a local Supabase test branch + stub OAuth server.
- **Distribution smoke:** CI job per channel (`brew install --formula ./Formula/markos.rb`, `scoop install ./bucket/markos.json`) confirms install succeeds + `markos --version` prints expected value.
- **QA gates:** All 15 QA baseline gates from `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` apply. Playwright E2E (QA-06) + LLM eval (QA-08) deferred per 202-10/203-10 precedent.

### D-10: Error Messages
- Always structured `{error: <code>, message: <human>, hint?: <fix>}` to stderr (JSON when non-TTY, boxed human when TTY). Error codes are stable public API (documented in `docs/cli/errors.md`) so CI consumers can `grep`.
- Rate-limit + auth + quota errors include `retry_after_seconds` when server provides it.

### Claude's Discretion
- Exact ANSI color palette (must stay accessible — WCAG AA against default terminal bg, no color-only signaling).
- Spinner animation characters (ASCII-safe fallback when `LANG=C` or Windows cmd.exe).
- Progress bar granularity.
- Internal module layout under `bin/commands/` beyond "one file per command".
- Shell completion script format (bash/zsh/fish) — if time permits as a separate `markos completions` command; otherwise defer.

</decisions>

<specifics>
## Specific Ideas

**Developer-native UX references (all match PROJECT.md brand stance "developer-native · AI-first · quietly confident"):**
- `gh` CLI → flat command surface, `gh auth login` device flow, colored tables in TTY, JSON in pipes, stable exit codes
- `vercel` CLI → `vercel env pull/push`, `vercel login` browser-opens flow, `.vercel/` per-project dir
- `supabase` CLI → keychain-backed `supabase login`, `supabase status` for local stack health

**Developer delight touches (scope-permitting, under Claude's Discretion):**
- `markos doctor` prints a final checklist with ✓/✗ and 1-line fix hints per issue (like `brew doctor`)
- `markos status` in a TTY auto-refreshes once (poll → diff → redraw) if `--watch` flag, else one-shot snapshot
- First-run nudge: if no config exists when any non-`login`/`doctor` command runs, print one-line hint "Run `markos login` to get started" and exit 3

**Safety rails:**
- Never write API key plaintext to disk (keychain only, XDG fallback file is 0600 + warned)
- `markos env pull` refuses if target file exists without `--force` (prevents overwriting local uncommitted secrets)
- `markos keys revoke` requires `--yes` or interactive confirmation
- All mutating commands emit audit-log entries via existing `lib/markos/audit/writer.cjs` `enqueueAuditStaging`

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + Requirements
- `.planning/ROADMAP.md` §"Phase 204: CLI `markos` v1 GA" — phase goal + requirement IDs (CLI-01, QA-01..15) + depends_on
- `.planning/ROADMAP.md` §"Locked SaaS Decisions (2026-04-16)" — brand stance, Target ICP, developer-native priority
- `.planning/PROJECT.md` §Core Value + §Constraints — tenant-safety, approval, provenance guarantees
- `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` — all 15 QA gates apply to this phase

### Prior foundations (MUST preserve contracts)
- `.planning/phases/200-saas-readiness-wave-0/200-02-cli-generate-SUMMARY.md` — existing `generate` command, flag parser pattern, pluggable LLM contract
- `bin/generate.cjs` + `bin/lib/brief-parser.cjs` + `bin/lib/generate-runner.cjs` — reuse these; `generate` command signature is locked
- `bin/cli-runtime.cjs` — dispatch layer extended for 10 new commands
- `bin/install.cjs` — entry point extended; `npx markos` default behavior (interactive install) preserved
- `.planning/phases/201-saas-tenancy-hardening/201-CONTEXT.md` — tenant roles, membership model, session tokens
- `.planning/phases/201-saas-tenancy-hardening/` SUMMARYs — `markos_tenant_memberships` schema + role enforcement pattern
- `.planning/phases/203-webhook-subscription-engine-ga/203-05-SUMMARY.md` — rotation state machine (for `markos status` rotation surface)

### API contracts (MUST honor or extend)
- `contracts/openapi.json` — current contract the CLI consumes (64 flows / 97 paths as of Phase 203)
- `contracts/F-73-webhook-delivery-v1.yaml` + F-96 + F-97 + F-98 + F-99 — webhook surface the `status`/`env` may surface
- New contracts this phase creates: `F-1XX-cli-oauth-device-v1.yaml` · `F-1XX-cli-runs-v1.yaml` · `F-1XX-cli-api-keys-v1.yaml` · `F-1XX-cli-env-v1.yaml` · `F-1XX-cli-status-v1.yaml`

### Patterns to replicate (from prior CLI-adjacent work)
- `lib/markos/audit/writer.cjs` — `enqueueAuditStaging(client, entry)` 2-arg pattern (documented in 203-03 SUMMARY deviation §1)
- `lib/markos/webhooks/signing.cjs` — HMAC primitive if API keys need request signing
- `api/cron/webhooks-rotation-notify.js` — MARKOS_*_CRON_SECRET gate pattern (for any CLI-triggered cron adjacent to rotation)

### Distribution references
- `package.json` `bin` field — current `npx markos` entry
- (new) `Formula/markos.rb` — Homebrew formula
- (new) `bucket/markos.json` — Scoop bucket manifest
- (Wave 2 deferred) winget + apt manifests

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`bin/cli-runtime.cjs`** — Dispatch layer. Extend with 10 new command entries; routing pattern is `cmd → module.run(argv, opts)`.
- **`bin/install.cjs`** — Interactive installer (preserve as default `npx markos` behavior). Detects `npx markos <subcmd>` and delegates.
- **`bin/generate.cjs` + `bin/lib/brief-parser.cjs` + `bin/lib/generate-runner.cjs`** — `generate` command contract is locked; `run`/`plan`/`eval` consume the same brief parser.
- **Hand-rolled flag parser** (documented in 200-02-SUMMARY decisions) — reuse for all new commands; zero-dep.
- **`lib/markos/audit/writer.cjs::enqueueAuditStaging`** — emit audit entries for every mutating CLI command.
- **`api/tenant/*/` endpoints** shipped in Phases 201/202/203 — already tenant-scoped + role-gated; CLI just consumes them.

### Established Patterns
- **Tenant-scoped API** — every write endpoint requires `tenant_id` from session (Phase 201). CLI passes Bearer API key → server resolves tenant.
- **OpenAPI auto-gen** — contracts → `contracts/openapi.json` → SDK regen (Phase 200-07 CI). New CLI endpoints MUST add F-NN contracts + regen.
- **Audit hash-chain** — every privileged action writes `markos_audit_staging` (preserves 200-03 regression 7/7).
- **RLS in Supabase** — CLI endpoints operate with service-role inside guarded handlers; RLS enforced on read paths per 201 patterns.
- **Stub fallbacks** — feature modules check env vars; if absent, graceful degrade (matches 203-01 `resolveMode` pattern).

### Integration Points
- New tenant API handlers under `api/tenant/api-keys/*`, `api/tenant/runs/*`, `api/cli/oauth/device/*`, `api/tenant/env/*`, `api/tenant/whoami.js`, `api/tenant/status.js`.
- New bin modules under `bin/commands/{init,plan,run,eval,login,keys,whoami,env,status,doctor}.cjs`.
- Tests under `test/cli/*.test.js` + `test/cli-e2e.test.js`.
- Contracts under `contracts/F-1XX-cli-*-v1.yaml` (5 new) + openapi regen.
- CI: `.github/workflows/release.yml` matrix job publishing to npm + brew + scoop.

</code_context>

<deferred>
## Deferred Ideas

- **Single-binary packaging (esbuild/pkg/bun --compile)** — Captured for v2 CLI evolution once install-friction telemetry shows it's needed. Phase 204 ships pure Node.
- **winget + apt distribution** — Wave 2 deferred to 204.1 gap-closure or Phase 205 addendum depending on release schedule. Signing infra + Microsoft Store submission adds complexity beyond npm/brew/scoop.
- **TUI / interactive dashboards** — `markos status --watch` with full-screen redraw is scope-creep beyond Phase 204. Log for backlog (`/gsd:plant-seed`).
- **CLI plugin system (`markos plugin install …`)** — Marketplace track per PROJECT.md. Deferred to v4.1+ once first-party commands are mature.
- **Shell completion scripts** — `markos completions bash|zsh|fish` is a "Claude's Discretion, time permitting" item; formal plan only if Wave-1 commands finish early.
- **Telemetry opt-in** — `markos telemetry on/off` + anonymous usage pings. Deferred; privacy/brand review needed first.

</deferred>

---

*Phase: 204-cli-markos-v1-ga*
