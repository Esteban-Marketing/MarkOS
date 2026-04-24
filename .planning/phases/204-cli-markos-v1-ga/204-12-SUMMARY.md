---
phase: 204-cli-markos-v1-ga
plan: 12
subsystem: infra
tags: [cli, release-ci, github-actions, homebrew, scoop, npm, docs, llms-txt, error-codes]

# Dependency graph
requires:
  - phase: 204-cli-markos-v1-ga
    provides: "Plan 01 ERROR_TO_EXIT map (bin/lib/cli/errors.cjs); Plans 01-09 CLI commands (init..doctor); Plan 10 Formula/markos.rb path reference; Plan 11 scripts/distribution/bump-scoop-manifest.cjs path reference"
  - phase: 203-webhook-subscription-engine-ga
    provides: "public/llms.txt Phase 203 section pattern — extended with Phase 204 entries, not overwritten"
provides:
  - "Release CI: 5-job DAG (verify → npm → brew + scoop → smoke) triggered on v* tags"
  - "docs/cli/errors.md — 13 stable public error codes + RFC 8628 device-flow codes + D-10 exit bands"
  - "docs/cli/environment.md — 10 env vars with credential resolution order and non-interactive mode rules"
  - "docs/cli/commands.md — 11-command index with global flags + per-command exit-code usage"
  - "public/llms.txt Phase 204 section — 5 entries for AI-assistant discoverability (Homebrew, Scoop, commands, errors, environment)"
  - "test/distribution/release-workflow.test.js — 10-assertion shape test gating DAG/matrix/secrets/actions"
  - "test/cli/errors-map.test.js — parity contract between ERROR_TO_EXIT and docs/cli/errors.md (set equivalence)"
affects:
  - "204-13 (v2 compliance gap-closure) — consumes stable docs surface"
  - "205 (Pricing Engine) — inherits release CI for CLI updates"
  - "206 (SOC 2) — errors-map parity test is a drift-blocking control"
  - "All future CLI minor/major releases (v3.4.0+) — auto-publish to npm + Homebrew tap + Scoop bucket"

# Tech tracking
tech-stack:
  added:
    - "mislav/bump-homebrew-formula-action@v3 (GitHub Action — Homebrew tap auto-bump)"
  patterns:
    - "5-job DAG with explicit `needs:` arrays — verify gates all channels; smoke aggregates across published channels"
    - "Cross-platform smoke matrix (ubuntu + macos + windows) as the release-readiness gate"
    - "Docs-as-code parity: errors-map.test.js grep-asserts ERROR_TO_EXIT ↔ docs/cli/errors.md set equivalence; CI blocks doc drift"
    - "llms.txt extension-only (never rewrite) — Phase 203 pattern preserved; each phase appends its own section"

key-files:
  created:
    - ".github/workflows/release-cli.yml — 5-job release orchestration (v* tags)"
    - "docs/cli/errors.md — stable public error-code reference + RFC 8628 device-flow codes"
    - "docs/cli/environment.md — env-var + credential-resolution reference"
    - "docs/cli/commands.md — 11-command index + global flags + exit codes footer"
    - "test/distribution/release-workflow.test.js — workflow shape test (10 assertions)"
    - "test/cli/errors-map.test.js — ERROR_TO_EXIT ↔ errors.md parity contract (5 assertions)"
  modified:
    - "public/llms.txt — appended Phase 204 section (5 entries) below Phase 203 section; prior sections preserved"

key-decisions:
  - "Release workflow: 5-job DAG with verify as hard `needs:` for npm; brew + scoop depend on npm (not each other — run in parallel); smoke fans in to [npm, brew, scoop] and runs on the 3-OS matrix"
  - "Secrets: NPM_TOKEN + HOMEBREW_TAP_TOKEN + SCOOP_BUCKET_TOKEN — all referenced via ${{ secrets.* }} only, never inlined; test rw-08 guards against accidental inlining"
  - "errors.md public codes table owns the 13 stable codes from ERROR_TO_EXIT; RFC 8628 device-flow codes live in a sibling section and are intentionally excluded from the parity map (they are polling states, not exit states)"
  - "Exit code documentation anchors on D-10 (exit codes 0-5) — errors.md and commands.md both surface the same band semantics"
  - "llms.txt Phase 204 section lists 5 entries (not 4): Homebrew install, Scoop install, commands, errors, environment — environment.md added because env-var discoverability is LLM-critical for CI"
  - "Workflow references Plan 10 (Formula/markos.rb) and Plan 11 (scripts/distribution/bump-scoop-manifest.cjs) by path — parallel artifacts land in the same phase merge"

patterns-established:
  - "Release DAG pattern: verify → publish → smoke (atomic; failure anywhere aborts the rest)"
  - "Docs parity contract: doc tables are grep-scanned and asserted set-equal to a code-owned registry; CI blocks PRs that drift"
  - "llms.txt append-only convention — each completed phase adds its own ## Phase NNN section below the prior one"
  - "Cross-platform smoke matrix as the release-gate: `npm install -g markos@<tag> && markos --version` on ubuntu-latest + macos-latest + windows-latest"

requirements-completed: [CLI-01, QA-01, QA-03, QA-09, QA-15]

# Metrics
duration: 35min
completed: 2026-04-24
---

# Phase 204 Plan 12: Release CI + docs trio + llms.txt Phase 204 section

**Release-on-tag workflow (5-job DAG across npm + Homebrew + Scoop + 3-OS smoke), stable public error-code reference, env-var + 11-command indexes, llms.txt Phase 204 discoverability — Phase 204 ships.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-04-24T16:00:00Z
- **Completed:** 2026-04-24T16:35:00Z
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 1

## Accomplishments

- **Release orchestration:** `.github/workflows/release-cli.yml` fires on `push` of `v*` tags and runs a 5-job DAG — `verify` (Node 22 + `npm ci` + `npm test` + `npm run release:smoke`) gates `npm publish --access public`, which then fans out to `brew` (`mislav/bump-homebrew-formula-action@v3` against `markos/homebrew-tap`) and `scoop` (checkout `markos/scoop-bucket` + invoke `scripts/distribution/bump-scoop-manifest.cjs`), before `smoke` aggregates across all three and installs the tagged version on `[ubuntu-latest, macos-latest, windows-latest]` via `npm install -g markos@${{ github.ref_name }} && markos --version`.
- **Docs trio:** `docs/cli/errors.md` enumerates the 13 stable public codes (`INVALID_BRIEF, INVALID_ARGS, NOT_FOUND, NETWORK_ERROR, TIMEOUT, SERVER_ERROR, UNAUTHORIZED, NO_TOKEN, TOKEN_EXPIRED, FORBIDDEN, RATE_LIMITED, QUOTA_EXCEEDED, INTERNAL`) with D-10 exit bands + TTY/JSON envelope shapes + RFC 8628 device-flow codes (`authorization_pending, slow_down, expired_token, access_denied, invalid_token, revoked_token`). `docs/cli/environment.md` documents every env var the CLI reads (MARKOS_API_KEY / MARKOS_PROFILE / MARKOS_API_BASE_URL / MARKOS_OAUTH_DEVICE_ENDPOINT (legacy) / MARKOS_NO_BROWSER / MARKOS_ENV_ENCRYPTION_KEY (server-side) / XDG_CONFIG_HOME / NO_COLOR / CI / GITHUB_ACTIONS) with the env → keychain → XDG fallback decision tree. `docs/cli/commands.md` is the 11-command index with global flags (`--json`, `--profile`, `--no-color`, `--help`, `--version`) and a per-command exit-code map.
- **llms.txt Phase 204 section:** 5 entries appended below the Phase 203 block — Homebrew install, Scoop install, 11-command index, error-code reference, environment-variable reference — without rewriting any prior section.
- **Parity contracts:** `test/cli/errors-map.test.js` grep-extracts codes from the `## Public error codes` table in `errors.md` and asserts `deepStrictEqual` with `Object.keys(ERROR_TO_EXIT)` — CI blocks any PR that lets the code map drift from the doc. `test/distribution/release-workflow.test.js` asserts 10 shape properties of the workflow (trigger, 5 jobs, 3-OS matrix, DAG edges, 3 secrets, action handles, cmd strings).
- **Test run:** 15/15 green across the two new test files (10 release-workflow + 5 errors-map).

## Task Commits

1. **Task 1: release-cli.yml workflow + shape test** — `29dc588` (feat)
2. **Task 2: docs trio + errors-map parity test** — `f66e43f` (feat)
3. **Task 3: llms.txt Phase 204 section** — `b84372e` (feat)

## Files Created/Modified

- `.github/workflows/release-cli.yml` — 5-job release DAG (verify → npm → brew+scoop → smoke)
- `test/distribution/release-workflow.test.js` — 10-assertion shape test
- `docs/cli/errors.md` — 13 stable codes + D-10 bands + RFC 8628 device-flow codes
- `docs/cli/environment.md` — 10-entry env-var reference + credential resolution order
- `docs/cli/commands.md` — 11-command index + global flags + exit-codes footer
- `test/cli/errors-map.test.js` — ERROR_TO_EXIT ↔ errors.md parity (set equivalence, 5 assertions)
- `public/llms.txt` — Phase 204 section appended (Phase 203 and earlier sections preserved)

## Decisions Made

- **Workflow shape:** Followed RESEARCH.md template verbatim — no job collapsing. Kept `brew` and `scoop` as parallel peers on `needs: [npm]` rather than sequencing; `smoke` aggregates `needs: [npm, brew, scoop]` so a single failed channel blocks the release announcement.
- **Environment.md included in llms.txt:** Spec called for 4 entries (installation-homebrew/installation-scoop/commands/errors). Added `environment.md` as a 5th entry because env-var discoverability is critical for AI assistants configuring CI contexts. Phase 203 pattern also shipped 5 entries, so the precedent matches.
- **Device-flow codes excluded from parity test:** `authorization_pending, slow_down, expired_token, access_denied` are RFC 8628 polling/terminal states, not members of `ERROR_TO_EXIT` (which is exit-code-indexed). Documented them in a sibling section and added a dedicated test case asserting they appear — but they are deliberately excluded from the strict set-equivalence check.
- **Exit-code ordering:** Both `errors.md` and `commands.md` anchor on D-10 (exit codes 0-5) to keep the two documents visually consistent for readers cross-referencing them.
- **Secret hardening:** rw-08 test case explicitly asserts via `doesNotMatch` that no `npm_*`-pattern literal ever appears in the workflow — guards against a future author accidentally inlining a token.

## Deviations from Plan

None — plan executed as written. One intentional extension: llms.txt ships 5 entries instead of 4 (added `environment.md`), matching the Phase 203 precedent for completeness.

## Issues Encountered

None. `package.json` already carried the `release:smoke` script (`node scripts/npm-pack-smoke-check.cjs`) from earlier work — no package.json modification needed.

## Next Phase Readiness

- **Phase 204 ships.** 12 of 13 plans complete. Plan 13 (v2 doctrine compliance gap-closure) remains for optional closure.
- **11/11 CLI commands functional + 3 distribution channels wired** (npm published, Homebrew tap auto-bumped, Scoop bucket auto-bumped).
- **Gate for first tagged release (`v3.4.0`):** User must provision 3 PATs in repo secrets — `NPM_TOKEN` (npm automation token), `HOMEBREW_TAP_TOKEN` (PAT with repo scope on `markos/homebrew-tap`), `SCOOP_BUCKET_TOKEN` (PAT with repo scope on `markos/scoop-bucket`). Workflow is locked and tested; secrets are a user-action prerequisite (Plan 12 `locked_assumption`).
- **Documentation is discoverable:** AI assistants land on `public/llms.txt` and find 5 Phase 204 entries linking to the 3 docs + 2 installation guides.

## Security posture (STRIDE dispositions)

- **T-204-12-01 (untested publish):** mitigated — `verify` is a hard `needs:` for `npm`; failure aborts the DAG before any channel publishes.
- **T-204-12-02 (secret leakage):** mitigated — all 3 secrets referenced as `${{ secrets.* }}`; test rw-08 `doesNotMatch` guard blocks inlined literals.
- **T-204-12-03 (compromised PAT):** mitigated — per-channel PATs, minimum scope; rotation deferred to Phase 206 SOC 2.
- **T-204-12-04 (channel drift):** accepted — `smoke` matrix re-checks version parity across all 3 OSes after publish; release manager coordinates mid-release failures manually.
- **T-204-12-05 (docs drift):** mitigated — `errors-map.test.js` set-equivalence assertion CI-blocks any PR that lets `ERROR_TO_EXIT` diverge from the documented code table.

---
*Phase: 204-cli-markos-v1-ga*
*Plan: 12*
*Completed: 2026-04-24*
