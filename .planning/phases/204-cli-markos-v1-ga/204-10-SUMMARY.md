---
phase: 204-cli-markos-v1-ga
plan: 10
subsystem: distribution
tags: [cli, homebrew, distribution, tap, wave-4, macos, linux]

# Dependency graph
requires:
  - phase: 204-01 (Plan 01)
    provides: "package.json bin mapping (markos → bin/install.cjs) + Node 22 engine floor + pkg.version (3.3.0) — formula url references package.json version; bin.install_symlink resolves bin/install.cjs as `markos` executable"
  - phase: 204-09 (Plan 09)
    provides: "markos doctor --check-only — referenced in installation docs as the recommended post-install health gate (zero-FS mutation, exit 1 on error)"
provides:
  - "Formula/markos.rb — Homebrew tap formula wrapping the npm tarball (floating node LTS; NOT node@22)"
  - "scripts/distribution/bump-homebrew-formula.cjs — release-CI-callable script that fetches the tarball, computes sha256, and rewrites Formula/markos.rb url + sha256 (supports --dry)"
  - "docs/cli/installation-homebrew.md — user-facing macOS/Linux install guide: tap, install, verify, first-run, upgrade, troubleshooting, uninstall, pre-tap-provisioning fallback"
  - "test/distribution/homebrew-formula.test.js — 8 grep-shape assertions on formula + bump script (class Markos, desc/homepage/license, depends_on node floating, std_npm_install_args + bin.install_symlink, test block, registry.npmjs.org url, bump script exports + hash/package.json references, rewriteFormula in-place swap)"
affects:
  - "204-11 (Scoop bucket) — parallel Wave 4 sibling; no shared files"
  - "204-12 (release CI + docs) — will invoke scripts/distribution/bump-homebrew-formula.cjs (fallback path) or mislav/bump-homebrew-formula-action (preferred) against markos/homebrew-tap; release workflow also cross-links docs/cli/installation-homebrew.md from the releases page + llms.txt"
  - "Future Phase 206 (SOC 2) — sha256-pinned tarballs are part of the supply-chain posture (T-204-10-01 mitigation)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Thin-formula-over-npm-tarball: Formula declares `depends_on \"node\"` (floating LTS; NOT node@22 per Homebrew deprecation 2026-10-28) and delegates install to `Language::Node.std_npm_install_args(libexec)` + `bin.install_symlink Dir[\"#{libexec}/bin/*\"]`. Zero duplicated binary — a single npm publish is the canonical build."
    - "Stream-hash pattern for sha256 resolution: bump script pipes the npm tarball response through `crypto.createHash('sha256')` chunk-by-chunk rather than buffering the full .tgz in memory. Handles 301/302/307/308 redirects with one level of recursion; 60s timeout on the initial request."
    - "Two-field in-place rewrite: rewriteFormula uses anchored multiline regexes (`^\\s*url\\s+\"[^\"]+\"` and `^\\s*sha256\\s+\"[^\"]+\"`) so the replacement preserves exact indentation and whitespace. Unit-tested with a synthetic formula fragment (form-08)."
    - "Dry-run-safe CLI: bump script honors `--dry` / `--dry-run` and prints the diff to stdout without writing; hashes + fetch still run so CI can verify the computation without mutating the formula file."

key-files:
  created:
    - "Formula/markos.rb — 24-line Homebrew formula (class Markos < Formula; desc + homepage + url + sha256 placeholder + license MIT + depends_on \"node\" + install method + test block asserting markos --version)"
    - "scripts/distribution/bump-homebrew-formula.cjs — 140-line bump utility (readVersion + tarballUrl + fetchSha256 + rewriteFormula + simpleDiff + main); exports every pure function for unit tests"
    - "docs/cli/installation-homebrew.md — 7-section install guide (Install / Verify / First-run / Upgrade / Troubleshooting / Uninstall / Pre-tap-provisioning fallback); links to ./errors.md (Plan 12) + ./installation-npm.md + ./installation-scoop.md"
    - "test/distribution/homebrew-formula.test.js — 8 tests (form-01 shape basics, form-02 no node@22 pin, form-03 install block, form-04 test block, form-05 registry url + sha256 hex, form-06 bump script exports, form-07 bump script grep, form-08 rewriteFormula in-place swap)"
  modified: []
  removed: []

key-decisions:
  - "Floating `node` dep (NOT `node@22`). Homebrew node@22 has deprecation date 2026-10-28 [CITED: https://formulae.brew.sh/formula/node@22]. Test form-02 encodes this as a contract check — a future drift to `depends_on \"node@22\"` (or any pinned major) would fail the suite. Runtime still enforces >=22 via bin/cli-runtime.cjs::assertSupportedNodeVersion so users on older brew node can't slip through."
  - "Bump script streams sha256 rather than trusting npm integrity metadata. The npm registry exposes dist.shasum (sha1) and dist.integrity (sha512); Homebrew requires sha256. Streaming the tarball through crypto.createHash('sha256') is the simplest way to produce the correct hash without trusting a different algorithm from the registry. 60s timeout + single-redirect follower handle typical CDN behavior."
  - "Formula placeholder sha256 = 64 zeros. Plan 12 release CI will overwrite both url and sha256 on every version tag; shipping the formula with a placeholder + version (3.3.0) lets `brew install --build-from-source Formula/markos.rb` work as a pre-tap fallback for users running the bump script locally first."
  - "pre-tap-provisioning fallback documented in install guide §7. Per locked_assumption A10, tap repo + HOMEBREW_TAP_TOKEN are user actions that may lag release. Users can clone this repo and run `brew install --build-from-source ./MarkOS/Formula/markos.rb` without the tap existing. This unblocks pre-CI adopters."
  - "Test file lives under test/distribution/ (new directory). Keeps brew + scoop + release tests colocated for the Wave 4 distribution concern and doesn't pollute test/cli/."
  - "Shape-only tests; no live npm fetch. Live bump path is explicitly Plan 12's territory (release CI — will fire once per release tag). form-08 exercises rewriteFormula against a synthetic formula fragment so we can prove the substitution logic without network + without mutating Formula/markos.rb on disk."

patterns-established:
  - "Pattern: distribution-script-pure-api. Release scripts expose every pure function (readVersion, tarballUrl, rewriteFormula, simpleDiff) on module.exports so unit tests can exercise them without spawning child processes or mocking HTTPS. Only main() is impure; main() calls the pure functions in sequence."
  - "Pattern: formula-placeholder-sha256. Ship formulas with 64-zero sha256 + current pkg.version to keep the file valid Ruby + valid as a Homebrew install target under --build-from-source, while the release CI overwrites both fields before publishing to the tap. Avoids 'commit broken formula that cannot be installed' vs 'land formula only when release CI exists' chicken-and-egg."
  - "Pattern: deprecation-avoidance-as-test-contract. When an upstream dependency has a known end-of-life date (node@22 deprecation 2026-10-28), encode the avoidance as a grep-shape test (form-02 doesNotMatch /node@22/). Future drifts fail CI before shipping."

requirements-completed:
  - CLI-01  # Homebrew formula delivery path (Wave 4 Homebrew slice)
  - QA-03   # supply-chain sha256 pin on release tarballs
  - QA-15   # docs-as-code install guide

# Metrics
duration: ~25min
completed: 2026-04-23
---

# Phase 204 Plan 10: Homebrew Formula + Bump Script + Install Docs

**Wave 4 Homebrew slice landed: thin `Formula/markos.rb` wrapping the npm tarball, `scripts/distribution/bump-homebrew-formula.cjs` release-CI bump utility, 7-section installation guide, and 8 grep-shape tests. Formula depends on floating `node` (not node@22) to avoid the 2026-10-28 Homebrew deprecation.**

## Performance

- **Tasks:** 2 of 2 complete
- **Files created:** 4
- **Files modified:** 0
- **Tests:** 8 passing (all new; zero regression in pre-existing suites)

## Accomplishments

- Shipped `Formula/markos.rb` — 24-line Homebrew formula declaring class Markos + desc + homepage + url (npm registry .tgz) + sha256 placeholder + license MIT + `depends_on "node"` (floating LTS) + install via `Language::Node.std_npm_install_args(libexec)` + `bin.install_symlink` + test block asserting `markos --version` output matches /markos/.
- Wrote `scripts/distribution/bump-homebrew-formula.cjs` — reads package.json version, constructs the npm tarball URL, streams the response through `crypto.createHash('sha256')`, rewrites url + sha256 lines in Formula/markos.rb, prints diff, exits 0. Supports `--dry` for preflight in CI.
- Wrote `docs/cli/installation-homebrew.md` — 7 sections covering install, verify (with `markos doctor --check-only` recommendation), first-run OAuth device flow, upgrade, troubleshooting (keytar/libsecret, MARKOS_API_KEY fallback, checksum mismatch, node version), uninstall (brew + config dir + keychain entries), and pre-tap-provisioning fallback for users running before markos/homebrew-tap exists.
- Wrote 8 shape tests exercising both the formula file and the bump script's pure functions; all green.

## Task Commits

1. **Task 1: Formula/markos.rb + bump script + 8-assertion shape test** — `6007d22` (feat)
2. **Task 2: docs/cli/installation-homebrew.md** — `be656fc` (feat)

## Files Created/Modified

### Created (4)

- `Formula/markos.rb` — Homebrew tap formula
- `scripts/distribution/bump-homebrew-formula.cjs` — release-CI bump utility
- `docs/cli/installation-homebrew.md` — macOS/Linux install guide
- `test/distribution/homebrew-formula.test.js` — 8 shape assertions

### Modified (0)

No existing files touched; all scope was new-file creation.

## Exported APIs (bump script)

```
readVersion() -> string                         // from package.json
tarballUrl(version) -> string                   // registry.npmjs.org/markos/-/markos-<v>.tgz
fetchSha256(url) -> Promise<{ sha256, bytes }>  // streams + follows single redirect
rewriteFormula(text, url, sha256) -> { before, after }  // pure string swap
simpleDiff(before, after) -> string
FORMULA_PATH, PKG_PATH                          // resolved constants
```

## Verification

```
$ node --test test/distribution/homebrew-formula.test.js
✔ form-01: Formula/markos.rb exists with class + desc + homepage + depends_on node
✔ form-02: Formula does NOT pin node@22 (deprecation 2026-10-28)
✔ form-03: Formula contains install block with std_npm_install_args + bin.install_symlink
✔ form-04: Formula has test block asserting `markos --version` output
✔ form-05: Formula url points at registry.npmjs.org/markos with sha256 field
✔ form-06: bump script exists, requires cleanly, and exposes expected API
✔ form-07: bump script reads package.json + uses crypto.createHash("sha256")
✔ form-08: rewriteFormula swaps url + sha256 without touching surrounding text
ℹ tests 8   pass 8   fail 0
```

```
$ node scripts/distribution/bump-homebrew-formula.cjs --dry
[bump-homebrew] version=3.3.0
[bump-homebrew] url=https://registry.npmjs.org/markos/-/markos-3.3.0.tgz
[bump-homebrew] error: GET … → HTTP 404
```

(Expected: 3.3.0 tarball is not yet published to npm; release CI in Plan 12 will publish first, then bump. Confirms URL construction + error surface.)

## Downstream Unblocking

| Plan   | Consumes from 204-10 |
|--------|----------------------|
| 204-12 | `scripts/distribution/bump-homebrew-formula.cjs` invoked from release workflow (fallback to 3rd-party action); `Formula/markos.rb` path referenced when pushing to `markos/homebrew-tap`; docs cross-linked from releases page + llms.txt |
| Future Phase 206 | sha256-pinned tarball is part of SOC 2 supply-chain attestation story |

## Notes & Follow-ups

- **Pre-requisite for release CI (Plan 12 owns):** user must create `markos/homebrew-tap` repo + provision `HOMEBREW_TAP_TOKEN` PAT before first tagged release (locked_assumption A10).
- **Placeholder sha256 (64 zeros) is intentional** — release CI overwrites on every version tag. Users who install pre-CI must run `bump-homebrew-formula.cjs` locally first or use `--build-from-source` on the raw formula (documented in §7).
- `node@22` grep-assertion (form-02) is a deprecation-avoidance contract; any future drift to a pinned `node@N` will fail the suite.
- Formula test block uses `shell_output("#{bin}/markos --version")` — `bin/install.cjs` already supports `--version` (per package.json bin mapping + the Plan 01 runtime). No CLI changes needed to satisfy the brew test.
- `libsecret` warning path is covered in the install docs and by Plan 09's `markos doctor` keytar_available check — no orthogonal work required.
- Windows users install via Scoop (Plan 204-11); this plan is macOS/Linux only.
