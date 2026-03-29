---
phase: 28-runtime-integrity
verified: 2026-03-28T00:00:00Z
status: passed
score: 3/3 must-haves verified
---

# Phase 28: Runtime Integrity Verification Report

**Phase Goal:** Eliminate onboarding-blocking runtime failures and private-data protection gaps before external rollout.
**Verified:** 2026-03-28T00:00:00Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | POST /approve resolves MIR output path and writes without runtime reference crashes for valid local approvals | VERIFIED | `handleApprove` resolves `mirOutputPath`, creates path, and writes via `writeMIR.applyDrafts`; local approve tests return 200 and pass: onboarding/backend/handlers.cjs:320-323, test/onboarding-server.test.js:334-335, test/onboarding-server.test.js:459-460, test/write-mir.test.js (6/6 pass) |
| 2 | Node runtime floor is enforced at >=20.16.0 with explicit guidance | VERIFIED | Runtime guard constants and early-exit checks in installer/updater; package metadata + README aligned: bin/install.cjs:38,73-82,162; bin/update.cjs:37,65-74,120; package.json:18; README.md:35 |
| 3 | Installer auto-injects .gitignore protections idempotently | VERIFIED | Installer managed-block implementation + test assertions for single insertion across repeated runs: bin/install.cjs:85-134,276; test/install.test.js:64-84 |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| onboarding/backend/runtime-context.cjs | Canonical MIR output path resolver with fallback | VERIFIED | `resolveMirOutputPath` uses configured `mir_output_path` and fallback to `.markos-local/MIR`: onboarding/backend/runtime-context.cjs:107-112 |
| onboarding/backend/handlers.cjs | Approve flow uses resolver and performs write path | VERIFIED | `handleApprove` calls resolver + mkdir + `writeMIR.applyDrafts`: onboarding/backend/handlers.cjs:320-323 |
| bin/install.cjs | Node guard + .gitignore injection | VERIFIED | `assertSupportedNodeVersion` + `applyGitignoreProtections`: bin/install.cjs:73-82,85-134 |
| bin/update.cjs | Node guard parity for update flow | VERIFIED | `assertSupportedNodeVersion` on startup: bin/update.cjs:65-74,120 |
| package.json | Node engines floor set | VERIFIED | `engines.node` is `>=20.16.0`: package.json:18 |
| README.md | Explicit Node guidance | VERIFIED | Install section requires Node.js `>=20.16.0`: README.md:35 |
| test/install.test.js | Guard + idempotent gitignore test coverage | VERIFIED | Runtime guard and block uniqueness tests: test/install.test.js:10-22,64-84 |
| test/onboarding-server.test.js | Hosted approve guard + local approve success coverage | VERIFIED | Hosted 501 guard + local 200 approve tests: test/onboarding-server.test.js:171-174,334-335,459-460 |
| test/write-mir.test.js | MIR write behavior coverage for valid draft merges | VERIFIED | Apply/write tests pass 6/6: test/write-mir.test.js:47,85,114,137,151 |
| test/setup.js | CLI harness used for runtime guard/idempotency tests | VERIFIED | `runCLI` helper drives install command assertions: test/setup.js:173 |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| onboarding/backend/handlers.cjs | onboarding/backend/runtime-context.cjs | `resolveMirOutputPath(runtime.config)` | WIRED | Used in approve path before writes: onboarding/backend/handlers.cjs:320 |
| onboarding/backend/handlers.cjs | onboarding/backend/write-mir.cjs | `writeMIR.applyDrafts(mirOutputPath, MIR_TEMPLATES, approvedDrafts)` | WIRED | Write call present and return values consumed: onboarding/backend/handlers.cjs:323 |
| bin/install.cjs | Runtime version contract | `assertSupportedNodeVersion()` gate in `run()` | WIRED | Gate executes before install mutations: bin/install.cjs:162 |
| bin/install.cjs | .gitignore protections | `applyGitignoreProtections(CWD)` | WIRED | Called in install flow with change-aware output: bin/install.cjs:276-279 |
| package.json + README.md | Runtime requirement communication | `engines.node` and install prerequisites text | WIRED | Metadata/docs aligned at >=20.16.0: package.json:18, README.md:35 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| onboarding/backend/handlers.cjs approve flow | `mirOutputPath` | `resolveMirOutputPath(runtime.config)` | Yes | FLOWING |
| onboarding/backend/handlers.cjs approve flow | `written/stateUpdated/errors/mergeEvents` | `writeMIR.applyDrafts(...)` | Yes | FLOWING |
| bin/install.cjs runtime gate | `nodeVersion` | `MARKOS_NODE_VERSION_OVERRIDE` or `process.versions.node` | Yes | FLOWING |
| bin/install.cjs gitignore block | `next/changed` | Existing `.gitignore` content + managed block replacement/append | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Syntax validity for installer | `node --check bin/install.cjs` | Exit code 0 | PASS |
| Syntax validity for updater | `node --check bin/update.cjs` | Exit code 0 | PASS |
| MIR write behavior tests | `node --test test/write-mir.test.js` | 6 passed, 0 failed | PASS |
| Onboarding server behavior tests | `node --test test/onboarding-server.test.js` | 9 passed, 0 failed | PASS |
| Installer behavior tests | `node --test test/install.test.js` | 6 passed, 0 failed | PASS |
| Update runtime guard rejection | `MARKOS_NODE_VERSION_OVERRIDE=20.15.0 node bin/update.cjs` | Prints minimum-version guidance and exits 1 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| P0-01 | 28-01-PLAN.md | POST /approve path safety + no runtime reference crashes on valid approval writes | SATISFIED | Resolver + write path wired: onboarding/backend/runtime-context.cjs:107-112, onboarding/backend/handlers.cjs:320-323; local approve tests pass: test/onboarding-server.test.js:334-335,459-460 |
| P0-02 | 28-02-PLAN.md | Node.js >=20.16.0 enforced in installer/package metadata + explicit guidance | SATISFIED | Guards in install/update + package engines + README text + failing runtime test: bin/install.cjs:38,73-82; bin/update.cjs:37,65-74; package.json:18; README.md:35; test/install.test.js:10-22 |
| P0-03 | 28-03-PLAN.md | Installer injects private-artifact gitignore block idempotently | SATISFIED | Managed block function + one-time/unique insertion tests: bin/install.cjs:85-134,276; test/install.test.js:64-84 |

Notes: `.planning/REQUIREMENTS.md` was not present in this repository, so requirement cross-reference used Phase 28 scoped requirements/plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| bin/install.cjs | 289 | TODO(MARKOS-LEGACY-PATH-MIGRATION) | INFO | Tracking note only; no direct runtime failure in Phase 28 scope |

### Human Verification Required

None for Phase 28 P0 acceptance; requirements are backend/runtime and covered via automated checks.

### Gaps Summary

No blocker gaps found for P0-01, P0-02, or P0-03. Requirements are implemented, wired, and covered by passing automated evidence.

---

_Verified: 2026-03-28T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
