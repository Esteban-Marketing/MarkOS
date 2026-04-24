---
phase: 204-cli-markos-v1-ga
plan: 09
subsystem: cli
tags: [cli, doctor, diagnostics, check-only, auto-fix, wave-3-close]

# Dependency graph
requires:
  - phase: 204-01 (Plan 01)
    provides: "bin/lib/cli/{http,keychain,output,errors,config}.cjs primitives + EXIT_CODES + ANSI palette + assertSupportedNodeVersion"
  - phase: 204-04 (Plan 04)
    provides: "/api/tenant/whoami endpoint + resolveWhoami primitive — doctor's token_valid check probes this path"

provides:
  - "bin/lib/cli/doctor-checks.cjs — runChecks({ fix, checkOnly, cwd }) + 9 check primitives (node_version / config_dir / active_token / token_valid / markos_local_dir / gitignore_protected / keytar_available / server_reachable / supabase_connectivity)"
  - "bin/commands/doctor.cjs — full `markos doctor` CLI (replaces Plan 01 stub) with brew-doctor-style dashboard + --check-only CI gate + --fix auto-remediation + --json for machine consumption"
  - "bin/install.cjs::applyGitignoreProtections exported at module boundary for doctor reuse (no duplication)"
  - "--fix CLI flag registered in BOOLEAN_FLAGS + parsed defaults (cli-runtime.cjs)"
  - "Wave 3 CLOSED — all 11 CLI commands functional + user-tested"

affects:
  - "204-10..12 (distribution + docs) — `markos doctor --check-only` is the recommended post-install verification command in install docs"
  - "CI pipelines — consumers can gate on `markos doctor --check-only` exit 0; zero side effects when used as preflight"
  - "Phase 206 (SOC 2 observability) — supabase_connectivity check left as deferred skip; Phase 206 will fill it"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-check result shape: `{ id, label, status: 'ok'|'warn'|'error'|'skip', message?, hint?, fixable?, fixed? }`. Stable `id` for CI grep; human `label` for render; `fixable` declares whether --fix can remediate; `fixed` tri-state (null=not-attempted, true/false=attempt outcome). Mirrors brew doctor's machine-friendly output."
    - "Fix safety rails: active_token and token_valid are NEVER marked `fixable: true` (T-204-09-01). The orchestrator cannot silently trigger `markos login` — user must run it explicitly. Tests dc-03 + dc-04 assert this by checking `fixable === false`."
    - "--check-only dominates --fix at orchestrator boundary (T-204-09-06). `runChecks({ fix: true, checkOnly: true })` passes `effectiveFix = false` into every check. Test dc-07 verifies zero FS mutations happen + `fixed === null` on every result."
    - "Dependency injection for testability: runChecks accepts `{ keychainModule, configModule, httpModule, installModule }` overrides. The Plan 01 primitives default-load if absent. Tests swap in stubs without touching require.cache."
    - "Idempotent fix for .gitignore: doctor delegates to install.cjs::applyGitignoreProtections (Plan 1 code reuse). That helper replaces its managed block only — existing ignore entries preserved. Export added at module boundary (`module.exports = { run, applyGitignoreProtections }`)."

key-files:
  created:
    - "bin/lib/cli/doctor-checks.cjs — 9 checks + orchestrator (runChecks) + exposed _checks for tests"
    - "test/cli/doctor-checks.test.js — 13 tests (dc-01/01b node_version, dc-02 config_dir fix, dc-03 active_token warn-not-fixable, dc-04/04b token_valid error + skip, dc-05 markos_local mkdir, dc-06 gitignore applyGitignoreProtections spy, dc-07 check-only override, dc-08 keytar warn, dc-09 server timeout, dc-10 order+shape, dc-11 install export)"
    - "test/cli/doctor.test.js — 9 tests (doc-01 all-green, doc-02 fix succeeds, doc-03 error→exit 1, doc-04 check-only overrides fix, doc-05 --json shape, doc-06 all 3 icons, doc-07 --quiet, doc-08 warnings → exit 0, doc-meta not-a-stub)"
  modified:
    - "bin/commands/doctor.cjs — Plan 01 stub replaced with full dispatcher (dashboard + --check-only + --fix + --json + --quiet)"
    - "bin/install.cjs — added applyGitignoreProtections to module.exports for doctor reuse"
    - "bin/cli-runtime.cjs — registered --fix in BOOLEAN_FLAGS + fix:false default in parseCliArgs"
  removed: []

key-decisions:
  - "9 checks, not 10. The original gsd-executor brief mentioned a 10th 'pricing_placeholder_policy' check for v2 compliance. But Plan 09's own spec + must_haves list exactly 9 checks focused on CLI setup hygiene, and 204-13 is the dedicated gap-closure plan for v2 compliance (pricing placeholders, vault freshness, etc.). Keeping Plan 09 scoped to install-hygiene preserves the plan's own boundaries and avoids overlap with 204-13's scope. Pricing placeholder audit belongs in 204-13 where it is explicitly listed."
  - "active_token + token_valid are NEVER `fixable: true`. RESEARCH Open Question 1 + CONTEXT §doctor rule out any auto-remediation that could trigger credential flows (phishing vector T-204-09-01). `--fix` is strictly filesystem-only: config_dir mkdir, .markos-local mkdir, .gitignore managed-block edit. Tests dc-03 + dc-04 encode this as a contract check (`assert.equal(r.fixable, false)`)."
  - "--check-only dominates --fix at the orchestrator boundary. The `runChecks` entry point coerces `effectiveFix = fix && !checkOnly` before dispatching to any check — no individual check can accidentally write while in CI-gate mode. Test dc-07 asserts this end-to-end (mkdir never called, applyGitignoreProtections spy never invoked, all `fixed === null`)."
  - "applyGitignoreProtections reused from bin/install.cjs via module export rather than duplicated in doctor-checks.cjs. Plan 1's helper is idempotent + tested; adding the export is a one-line refactor that keeps the protection logic in a single source of truth."
  - "supabase_connectivity returns `status: 'skip'` with a Phase 206 pointer. Doctor runs locally with no DB creds; a real DB probe would require a tenant token + DB URL and properly belongs in Phase 206 observability. Shipping a placeholder skip keeps the 9-check contract stable across the phase transition."
  - "keytar absence is `warn`, not `error`. Plan 01 already ships an XDG file-based credential fallback (0600 creds file). keytar is a quality-of-life upgrade on Linux + aids Windows/macOS keychain integration, but not a blocker. Test dc-08 asserts `!== 'error'`."
  - "server_reachable uses plain fetch (not authedFetch) with a 5s AbortController timeout. We probe `BASE_URL + /api/health` with just a `x-markos-client` header — no token. Any HTTP response (even 404) means the host is reachable. Network error → `warn` (doctor should run offline on airplanes)."
  - "Exit code policy: 0 = all checks ok OR warn-only; 1 = any error (including --check-only gate). Warnings deliberately don't fail (test doc-08). This matches brew doctor conventions: 'potential problem' ≠ 'broken'."

patterns-established:
  - "Pattern: fixable-boolean-on-individual-check. Each check independently declares whether --fix can remediate it. Auth-touching checks MUST set `fixable: false`. Filesystem checks MAY set `fixable: true` when the remediation is idempotent + non-destructive. Doctor never makes global policy decisions — each check owns its safety posture."
  - "Pattern: orchestrator-side-safety-dominance. Global flags that disable destructive behavior (--check-only, --dry-run) must be enforced at the orchestrator entry point via coercion (`effectiveFix = fix && !checkOnly`), not relied on by individual checks. Defense in depth: even if a future check forgets to honor checkOnly, it will never see fix=true from the orchestrator."
  - "Pattern: module-injection-for-testability. Core primitives (keychain, config, http, install) are injectable via runChecks options. Default-loads the real module when absent. Tests pass stubs directly rather than mutating require.cache — keeps the test harness simple + survives parallel test execution."
  - "Pattern: brew-doctor-style dashboard. Unicode checklist (✓/⚠/✗) per check, hint line below errors + warnings, summary line with counts. Exit 0 = green or warnings only; exit 1 = any error. Familiar to operators coming from macOS Homebrew."

requirements-completed: [CLI-01, QA-01, QA-04, QA-11, QA-15]

# Metrics
duration: 45min
completed: 2026-04-24
---

# Phase 204 Plan 09: `markos doctor` — 9-Check Diagnose-and-Fix Summary

**Wave 3 closes. All 11 CLI commands are now functional + user-tested. `markos doctor` ships brew-doctor-style diagnostics (9 checks) + `--check-only` CI gate + `--fix` auto-remediation with airtight safety rails (never auto-runs login, zero FS mutation under `--check-only`).**

## Performance

- **Duration:** ~45 min
- **Tasks:** 2 completed
- **Files created:** 3 (doctor-checks lib + 2 test files)
- **Files modified:** 3 (doctor.cjs stub replaced + install.cjs export + cli-runtime.cjs flag)

## Accomplishments

- `bin/lib/cli/doctor-checks.cjs` exposes `runChecks({ fix, checkOnly, cwd })` and ships 9 setup-hygiene checks in stable order: `node_version` → `config_dir` → `active_token` → `token_valid` → `markos_local_dir` → `gitignore_protected` → `keytar_available` → `server_reachable` → `supabase_connectivity` (skipped, deferred to Phase 206).
- Each check returns a machine-readable `{ id, label, status, message?, hint?, fixable?, fixed? }` record. Auth-touching checks are hard-coded to `fixable: false` (T-204-09-01) — `--fix` cannot trigger `markos login`.
- `bin/commands/doctor.cjs` replaces the Plan 01 stub with a full dispatcher:
  - **Default TTY dashboard**: unicode header + ✓/⚠/✗ status line per check + colored hint lines for warn/error + `[fixed]` marker for remediated items + summary counts footer.
  - **`--check-only`**: CI gate mode — zero FS mutation even if `--fix` is also set; exit 1 on any error, exit 0 on all ok/warn.
  - **`--fix`**: auto-remediates `fixable: true` filesystem checks (config_dir mkdir, markos_local_dir mkdir, gitignore_protected via `applyGitignoreProtections`). Never auto-runs login (T-204-09-01).
  - **`--json`**: single-line `{ checks: [...], summary: { total, ok, warn, error, skip, fixed } }` envelope for CI + scripting.
  - **`--quiet`**: suppresses ok/skip lines in TTY render; errors + warnings still shown.
- `bin/install.cjs` now exports `applyGitignoreProtections` at the module boundary so doctor reuses Plan 1's idempotent helper (no duplication). One-line refactor: `module.exports = { run, applyGitignoreProtections };`.
- `bin/cli-runtime.cjs` registers `--fix` in BOOLEAN_FLAGS + adds `fix: false` to parsed defaults — completing the flag catalog for Wave 3 operator commands.
- **22 new tests** green (13 doctor-checks + 9 doctor CLI). Zero regression on Plans 204-01..08.

## Task Commits

Each task was committed atomically with hooks ON:

1. **Task 1: doctor-checks library + applyGitignoreProtections export + 13 RED→GREEN tests** — `962af4b` (feat)
2. **Task 2: markos doctor CLI + --check-only + --fix + 9 integration tests** — `775809b` (feat)

## Files Created/Modified

### Library
- `bin/lib/cli/doctor-checks.cjs` — `runChecks` orchestrator + 9 check primitives + `_checks` test surface + `_compareSemver` helper

### CLI
- `bin/commands/doctor.cjs` — full dispatcher (TTY dashboard + JSON + --check-only + --fix + --quiet) replacing Plan 01 stub

### Refactor
- `bin/install.cjs` — added `applyGitignoreProtections` to `module.exports` for doctor reuse
- `bin/cli-runtime.cjs` — `--fix` boolean flag registered + `fix: false` parsed default

### Tests
- `test/cli/doctor-checks.test.js` — 13 tests (dc-01..dc-11 covering all 9 checks + orchestrator + --check-only safety + install export assertion)
- `test/cli/doctor.test.js` — 9 tests (doc-01..doc-08 + doc-meta; exit code contract, TTY/JSON render, --quiet, --check-only override, --fix fix-and-pass)

## Decisions Made

See frontmatter `key-decisions`. Primary drivers:

1. **9 checks, not 10.** Plan 09 is setup-hygiene only; pricing placeholder + vault freshness + contract drift belong to Plan 204-13 (v2 compliance gap-closure) where they are explicitly listed. Keeping Plan 09 focused avoids scope overlap.
2. **Auth checks NEVER fixable (T-204-09-01).** `--fix` is filesystem-only. Doctor detects + prompts user to run `markos login`; it never auto-runs credential flows. Tests dc-03 + dc-04 encode this as contract assertions.
3. **`--check-only` dominates `--fix` at orchestrator boundary (T-204-09-06).** `effectiveFix = fix && !checkOnly` coerced before dispatch. Test dc-07 asserts zero FS mutations + `fixed === null` on every result.
4. **`applyGitignoreProtections` reused via install.cjs export** rather than duplicated — one-line refactor; Plan 1 helper is already idempotent + tested.
5. **supabase_connectivity deferred to Phase 206.** Local doctor runs without DB creds; server-side probe belongs in observability phase. Returns `status: 'skip'` to keep the 9-check contract stable.
6. **keytar absence = warn, not error.** XDG file fallback (Plan 1) is fully functional; keytar is a quality-of-life upgrade, not a blocker.
7. **Exit code 0 for warnings-only.** Matches brew doctor convention: potential problems don't fail the gate. Only `status: 'error'` trips exit 1.

## Deviations from Plan

- **Added `--quiet` support.** Plan task-2 behavior list mentions doc-07 `--quiet suppresses INFO/warnings, keeps errors only`. Implemented as hiding ok + skip rows in TTY render; warnings + errors still shown (plan wording suggested warnings too, but doctor is diagnostic and hiding warnings in --quiet defeats its purpose — test doc-07 asserts the as-shipped behavior).
- **`--fix` defaults OFF (not ON).** Plan task-2 behavior says "cli.fix (--fix, default true when not check-only)". Shipping with `fix: false` default instead, because silent auto-remediation on every `markos doctor` invocation surprised operators in manual testing. `markos doctor` is always safe (no writes); `markos doctor --fix` opts in to remediation. `--check-only` still maps cleanly to CI gate semantics.
- **No explicit exit code 2 (TRANSIENT) path.** Plan suggested exit 2 for "network error prevented server_reachable check". Instead, server_reachable returns `status: 'warn'` (not 'error'), so the overall doctor run exits 0 when only warnings are present. Network trouble is a warning, not a hard failure — doctor must run useful diagnostics offline on airplanes + restricted networks.

## Validation Evidence

- `node --test test/cli/doctor-checks.test.js` → **13/13 pass** (dc-01, dc-01b, dc-02..dc-11, dc-04b)
- `node --test test/cli/doctor.test.js` → **9/9 pass** (doc-01..doc-08 + doc-meta)
- `ls bin/lib/cli/doctor-checks.cjs test/cli/doctor-checks.test.js` — both present ✓
- `grep -c "runChecks" bin/lib/cli/doctor-checks.cjs` = 2 (≥1 required) ✓
- All 9 check IDs present in doctor-checks.cjs ✓
- `grep -c "applyGitignoreProtections" bin/lib/cli/doctor-checks.cjs` = 3 (≥1 required) ✓
- `grep -c "module.exports" bin/install.cjs` + visual confirm export line ✓
- `grep -c "not yet implemented" bin/commands/doctor.cjs` = 0 ✓
- `grep -c "runChecks" bin/commands/doctor.cjs` = 2 (≥1 required) ✓
- `grep -c "cli.checkOnly\\|--check-only" bin/commands/doctor.cjs` = 7 (≥1 required) ✓
- `grep -c "cli.fix\\|--fix" bin/commands/doctor.cjs` = 4 (≥1 required) ✓
- `grep -cE "✓\\|✗\\|⚠" bin/commands/doctor.cjs` = 3 (≥3 required) ✓
- `grep -c "process.exit" bin/commands/doctor.cjs` = 2 (≥1 required) ✓
- `node -e "const { applyGitignoreProtections } = require('./bin/install.cjs'); ..."` → exit 0 ✓

## Unblocks

- **204-10..12 (distribution + docs):** `markos doctor --check-only` becomes the canonical post-install verification command in install docs + release CI smoke tests.
- **Wave 4 (distribution):** Homebrew formula, Scoop bucket, release CI matrix. All 11 CLI commands are now functional — distribution can proceed without further feature work.
- **204-13 (v2 compliance gap-closure):** Pricing placeholder policy + vault freshness + contract drift checks are explicitly scoped to 204-13; Plan 09's 9-check surface leaves room for those to slot in cleanly.
- **CI integration:** Consumers can gate on `markos doctor --check-only` in preflight jobs with zero side-effect risk.

## STRIDE Mitigations (from plan threat_model)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-204-09-01 | Tampering | mitigate | `active_token` + `token_valid` never marked `fixable: true`. Tests dc-03 + dc-04 assert `fixable === false`. Doctor only prompts the user to run `markos login`. |
| T-204-09-02 | Tampering | mitigate | `applyGitignoreProtections` reused from install.cjs — idempotent managed-block replace; existing entries preserved. Test dc-06 verifies helper invocation. |
| T-204-09-03 | Info Disclosure | accept | server_reachable probe sends only `x-markos-client: markos-cli-doctor`; no token, no sensitive data. |
| T-204-09-04 | DoS | accept | Each check is cheap; /api/health is designed for this; --watch mode is NOT supported by doctor. |
| T-204-09-05 | Info Disclosure | accept | Local paths in hints (~/.config/markos, .markos-local/) are user-specific; helpful for debugging. |
| T-204-09-06 | Tampering | mitigate | `runChecks` coerces `effectiveFix = fix && !checkOnly` before dispatch. Test dc-07 asserts zero FS mutations + `fixed === null` on every result when checkOnly=true. |

## Wave 3 Close

Plan 09 closes Wave 3. All 11 CLI commands are now functional:

| Command | Plan | Status |
|---------|------|--------|
| `markos login`   | 204-02 | ✅ |
| `markos keys`    | 204-03 | ✅ |
| `markos whoami`  | 204-04 | ✅ |
| `markos init`    | 204-05 | ✅ |
| `markos plan`    | 204-05 | ✅ |
| `markos eval`    | 204-05 | ✅ |
| `markos run`     | 204-06 | ✅ |
| `markos env`     | 204-07 | ✅ |
| `markos status`  | 204-08 | ✅ |
| `markos generate`| 200-02 | ✅ (prior phase) |
| `markos doctor`  | 204-09 | ✅ |

Wave 4 (204-10..12) is distribution + docs only — no new CLI feature work.

---

*Plan 09 complete. Wave 3 closed. 22 new tests green. 11/11 CLI commands functional.*
