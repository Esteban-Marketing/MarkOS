---
phase: 204-cli-markos-v1-ga
plan: 11
subsystem: distribution
tags: [scoop, windows, packaging, npm-registry, checkver, autoupdate, nodejs-lts, release-ci]

# Dependency graph
requires:
  - phase: 204-cli-markos-v1-ga
    plan: 01
    provides: "package.json bin.markos → bin/install.cjs (manifest bin field must match); Node 22 engine floor (nodejs-lts bucket package satisfies)"
  - phase: 204-cli-markos-v1-ga
    plan: 09
    provides: "CLI operator surface + doctor command referenced from install docs"
provides:
  - "Windows distribution channel: bucket/markos.json Scoop App Manifest"
  - "Automated bump script: scripts/distribution/bump-scoop-manifest.cjs (version + url + sha256 via JSON.parse/stringify)"
  - "User-facing install guide: docs/cli/installation-scoop.md (install/verify/first-run/upgrade/troubleshoot/uninstall/fallback)"
  - "10-assertion manifest shape test: test/distribution/scoop-manifest.test.js"
  - "checkver + autoupdate stanzas pointing at registry.npmjs.org/markos so Scoop auto-detects future releases"
affects:
  - "204-10 (Homebrew formula) — parallel sibling, same npm tarball URL pattern"
  - "204-12 (release CI matrix) — consumes bump-scoop-manifest.cjs in the scoop publish job"
  - "Phase 204 validation — CLI-01 Wave 4 distribution column flips green for Windows"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scoop bucket manifest wraps the npm tarball (parity with Homebrew formula); hash pinned per release"
    - "nodejs-lts Scoop dependency (floating-LTS; matches Homebrew `depends_on \"node\"` parity)"
    - "Bump script uses JSON.parse + JSON.stringify (structural rewrite) instead of regex (Homebrew bump uses regex because formulas are Ruby source)"
    - "Registry.npmjs.org as single source of truth for both the tarball AND the checkver endpoint — one URL pattern, two purposes"

key-files:
  created:
    - "bucket/markos.json — Scoop App Manifest (schema-conformant; version=3.3.0 + placeholder sha256)"
    - "scripts/distribution/bump-scoop-manifest.cjs — release-time bumper (reads package.json → fetches tarball → sha256 → rewrites manifest)"
    - "docs/cli/installation-scoop.md — 7-section Windows install guide"
    - "test/distribution/scoop-manifest.test.js — 10-assertion manifest + bump-script shape test"
  modified: []

key-decisions:
  - "depends: nodejs-lts (NOT nodejs@22) — floating-LTS parity with Homebrew formula's `depends_on \"node\"`. Locked per must_have + explicit assertion sc-03."
  - "Bump script uses JSON.parse + JSON.stringify (not regex) — manifest is structured data; this is safer than text rewriting and preserves schema on future field additions."
  - "Placeholder sha256 = 64 zeros with `sha256:` prefix — release CI (Plan 12) is responsible for replacing it on tag push. Unit test asserts format (64 hex) without asserting value (so future bumps don't break the shape test)."
  - "Docs recommend PowerShell + Scoop as the canonical Windows path — explicitly positions Scoop as the mitigation for Pitfall 5 (UNC + cmd /c wrapper) rather than merely documenting the workaround."
  - "Section 7 (pre-bucket-provisioning fallback) kept in docs — assumption A11 says the scoop-bucket repo may not exist at Plan 11 commit time; local-clone install path lets early adopters test the manifest before Plan 12 provisions the remote."

patterns-established:
  - "Bucket manifest shape: $schema + version + description + homepage + license + depends + url + hash + extract_dir + post_install + bin + checkver + autoupdate — all required by ScoopInstaller/Scoop/schema.json"
  - "Bump-script pattern: pure Node + node:https + node:crypto (no deps); streams hash (no full-buffer in memory); supports --dry-run + --version override for CI dry-run + manual bumps"
  - "Manifest shape test pattern: load JSON once per test; cross-check manifest.bin against package.json bin.markos (prevents drift between sibling distributions)"

requirements-completed:
  - CLI-01
  - QA-03
  - QA-15

# Metrics
duration: ~18min
completed: 2026-04-23
---

# Phase 204 Plan 11: Scoop Bucket Manifest + Bump Script + Docs Summary

**Windows distribution channel shipped: schema-conformant bucket/markos.json, automated version+sha256 bump script, 7-section user docs, and 10-assertion shape test — all wrapping the same npm tarball the Homebrew formula uses (Wave 4 parity).**

## Performance

- **Tasks:** 2 of 2 complete
- **Files created:** 4 (bucket manifest, bump script, install docs, shape test)
- **Files modified:** 0
- **Tests:** 10 of 10 passing (`node --test test/distribution/scoop-manifest.test.js`)

## Accomplishments

- **Scoop bucket manifest** `bucket/markos.json` — verbatim from RESEARCH.md template with `version=3.3.0`, `depends=nodejs-lts`, `bin=bin/install.cjs` (matches `package.json bin.markos`), `url=https://registry.npmjs.org/markos/-/markos-3.3.0.tgz`, placeholder `hash=sha256:0…0` (release CI fills on tag push), `post_install` runs `npm install --production --prefix "$dir"`, and both `checkver` (points at `/markos/latest` with `$.version` jsonpath) and `autoupdate` (uses `$version` placeholder) stanzas for Scoop's built-in release detection.
- **Bump script** `scripts/distribution/bump-scoop-manifest.cjs` — reads `package.json` version (locked source of truth per QA-03), streams sha256 of the tarball via `node:https` + `node:crypto` (no full-buffer; follows up to 5 redirects; 60 s timeout), then rewrites version + url + hash using `JSON.parse` + `JSON.stringify` (structural, not regex). Supports `--dry-run` and `--version <semver>` overrides. Exposes named exports (`readPackageVersion`, `tarballUrl`, `fetchSha256`, `readManifest`, `writeManifest`, `rewriteManifest`, `diffSummary`) for future unit testing + CI composition.
- **Install docs** `docs/cli/installation-scoop.md` — 7 sections: Install, Verify (PowerShell + cmd), First-run (`markos login` device flow + Windows Credential Vault behavior), Upgrade, Troubleshooting (UNC + cmd wrapper per Pitfall 5, Credential Vault permissions, `MARKOS_API_KEY` env fallback for CI, `markos doctor --check-only`, PowerShell execution policy), Uninstall, and pre-bucket-provisioning local-clone fallback (closes assumption A11 gap for early adopters).
- **Manifest shape test** `test/distribution/scoop-manifest.test.js` — 10 assertions (exceeds the 8-assertion acceptance floor): JSON validity, `$schema` URL, `depends` parity, `bin` parity with `package.json bin.markos`, `post_install` array contents, `checkver` URL + jsonpath, `autoupdate.url` `$version` placeholder, bump-script loads + exports, full required-fields presence + `hash` regex shape, and a pure-function test of `rewriteManifest()` confirming it doesn't mutate its input.

## Task Commits

Each task was committed atomically with `--no-verify` (parallel Wave 4):

1. **Task 1: Manifest + bump script + 10-assertion shape test** — `e0c49c0` (feat)
2. **Task 2: Scoop install docs with Windows UNC + Credential Vault guidance** — `b906764` (feat)

## Files Created/Modified

### Created (4)

- `bucket/markos.json` — Scoop bucket manifest (points at npm tarball; sha256-pinned per release)
- `scripts/distribution/bump-scoop-manifest.cjs` — version + sha256 bumper (JSON structural rewrite; zero deps)
- `docs/cli/installation-scoop.md` — 7-section Windows user guide (install through uninstall + fallback)
- `test/distribution/scoop-manifest.test.js` — 10-assertion shape test (manifest + bump-script)

### Modified (0)

None. Plan 11 is purely additive — no existing files touched, consistent with the "other Wave 4 agents running in parallel" constraint.

## Decisions Made

- **`nodejs-lts` dependency (NOT `nodejs@22`)** — matches Homebrew `depends_on "node"` floating-node policy. Future Node 24+ floors update both channels by editing one line each (Scoop `depends` + Homebrew `depends_on`), no version pinning churn.
- **JSON.parse + JSON.stringify over regex** — the manifest is structured data validated against `schema.json`; regex rewriting risks schema drift as future fields are added. JSON round-tripping preserves structure automatically.
- **`--dry-run` and `--version` CLI flags on the bump script** — lets CI assert the script parses a given version correctly before a publish is attempted, and lets humans bump out-of-band without waiting for a tag.
- **sha256 placeholder = 64 zeros** — Plan 12 release CI replaces on publish. Shape test asserts hash regex (`^sha256:[0-9a-f]{64}$`) without asserting the specific value, so the test stays green across future bumps.
- **Docs Section 7 (local-clone fallback) kept** — assumption A11 says scoop-bucket repo may not exist at commit time; early adopters can install directly from this repo without waiting for Plan 12.

## Deviations from Plan

None — plan executed exactly as written. Test count came in at 10 vs the 8-assertion acceptance floor (sc-09 required-fields + hash regex, and sc-10 `rewriteManifest` purity were added for defense-in-depth; both free asserts given the manifest was already loaded).

## Issues Encountered

None. Task 1 shape tests passed on first run (10/10 green). Task 2 docs-completeness script passed on first run (all 6 sections + all grep asserts).

## User Setup Required

**No action for Plan 11 itself.** The `markos/scoop-bucket` GitHub repository + `SCOOP_BUCKET_TOKEN` PAT secret remain a user action tracked by assumption A11; Plan 12 (release CI) will block at commit time if absent. Users wanting to test before Plan 12 can use the local-clone fallback in `docs/cli/installation-scoop.md` §7.

## Next Phase Readiness

- **Plan 10 (Homebrew)** — sibling Wave 4 plan; consumes the same `registry.npmjs.org/markos/-/markos-<VERSION>.tgz` URL pattern. Manifest + bump-script patterns established here are the canonical reference.
- **Plan 12 (release CI)** — wiring target: `node scripts/distribution/bump-scoop-manifest.cjs` in the scoop publish job after `npm publish` succeeds. Script's named exports let CI shell out to `readPackageVersion()` / `fetchSha256()` independently for matrix-style verification if needed.
- **Phase 204 CLI-01 Wave 4** — Windows distribution column now has the manifest + bump + docs + test quadfecta landed. Only blocker remaining: the scoop-bucket repo + PAT (user action tracked in A11).

---
*Phase: 204-cli-markos-v1-ga*
*Plan: 11*
*Completed: 2026-04-23*
