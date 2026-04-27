---
phase: 204
slug: cli-markos-v1-ga
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-18
last_updated: 2026-04-27
---

# Phase 204 - Validation Strategy

> Historical validation contract reconciled with completed execution on 2026-04-27. The original plan-time sampling posture remains here for audit traceability; live execution evidence is summarized below and fully captured in `204-VERIFICATION.md`.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node --test` (Node 22 LTS built-in) - matches CLAUDE.md + 200-02 precedent |
| **Config file** | none (convention-based) |
| **Quick run command** | `node --test test/cli/*.test.js` |
| **Full suite command** | `npm test` (runs `node --test test/**/*.test.js`) |
| **Estimated runtime** | ~25 seconds quick, ~120 seconds full |

## Historical Sampling Rate

- After every task commit: run the plan-scoped quick command.
- After every plan wave: run the full suite command.
- Before `/gsd:verify-work`: full suite must be green.
- Max feedback latency: 30 seconds for quick; 150 seconds for full.

## Current Reconciliation Status

| Surface | Evidence | Status |
|---------|----------|--------|
| Wave 0 bootstrap | `204-01-SUMMARY.md`, migrations `73` and `74`, test fixtures under `test/cli/_fixtures/` | complete |
| Wave 1 auth and identity | `204-02-SUMMARY.md`, `204-03-SUMMARY.md`, `204-04-SUMMARY.md` | verified |
| Wave 2 run, eval, and env surfaces | `204-05-SUMMARY.md`, `204-06-SUMMARY.md`, `204-07-SUMMARY.md` | verified |
| Wave 3 operator tooling | `204-08-SUMMARY.md`, `204-09-SUMMARY.md` | verified |
| Wave 4 distribution and docs | `204-10-SUMMARY.md`, `204-11-SUMMARY.md`, `204-12-SUMMARY.md` | verified |
| Gap closure `204-13` | `204-13-SUMMARY.md`, `test/cli/v2-compliance.test.js`, `204-VERIFICATION.md` | verified |

## Reconciled Verification Map

| Task ID | Plan | Wave | Requirement | Automated Evidence | Status |
|---------|------|------|-------------|--------------------|--------|
| `204-01-V` | 01 | 1 | `CLI-01`, `QA-02`, `QA-09`, `QA-13` | `node --test test/migrations/73_markos_cli_device_sessions.test.js test/migrations/74_markos_cli_api_keys.test.js test/cli/keychain.test.js test/cli/output.test.js test/cli/profiles.test.js` | complete |
| `204-02-V` | 02 | 1 | `CLI-01`, `QA-01`, `QA-11` | `node --test test/cli/device-flow.test.js test/cli/oauth-endpoints.test.js test/cli/login.test.js` | complete |
| `204-03-V` | 03 | 1 | `CLI-01`, `QA-01`, `QA-11` | `node --test test/cli/api-keys.test.js test/cli/api-keys-endpoints.test.js test/cli/keys.test.js` | complete |
| `204-04-V` | 04 | 1 | `CLI-01`, `QA-01`, `QA-11` | `node --test test/cli/whoami-endpoint.test.js test/cli/whoami.test.js` | complete |
| `204-05-V` | 05 | 2 | `CLI-01`, `QA-01`, `QA-04` | `node --test test/cli/init.test.js test/cli/plan.test.js test/cli/runs-plan-endpoint.test.js test/cli/eval.test.js` | complete |
| `204-06-V` | 06 | 2 | `CLI-01`, `QA-01`, `QA-09`, `QA-13` | `node --test test/cli/runs-endpoints.test.js test/cli/sse-parser.test.js test/cli/run.test.js` | complete |
| `204-07-V` | 07 | 2 | `CLI-01`, `QA-01`, `QA-11`, `QA-13` | `node --test test/cli/env-lib.test.js test/cli/env-endpoints.test.js test/cli/env.test.js` | complete |
| `204-08-V` | 08 | 3 | `CLI-01`, `QA-01`, `QA-10` | `node --test test/cli/status-endpoint.test.js test/cli/status.test.js` | complete |
| `204-09-V` | 09 | 3 | `CLI-01`, `QA-04`, `QA-11`, `QA-15` | `node --test test/cli/doctor-checks.test.js test/cli/doctor.test.js` | complete |
| `204-10-V` | 10 | 4 | `CLI-01`, `QA-03`, `QA-15` | `node --test test/distribution/homebrew-formula.test.js` | complete |
| `204-11-V` | 11 | 4 | `CLI-01`, `QA-03`, `QA-15` | `node --test test/distribution/scoop-manifest.test.js` | complete |
| `204-12-V` | 12 | 4 | `CLI-01`, `QA-03`, `QA-15` | `node --test test/distribution/release-workflow.test.js test/cli/errors-map.test.js` | complete |
| `204-13-V` | 13 | 4-gap | `CLI-01`, `QA-01`, `QA-04`, `QA-09`, `QA-11`, `QA-13`, `QA-15` | `node --test test/cli/v2-compliance.test.js test/cli/doctor-checks.test.js` | complete |

Observed execution evidence is captured in `204-VERIFICATION.md` as `313+` passing checks across scoped batches, with the only caveat being a pre-existing file-level timeout wrapper around `test/cli/doctor-checks.test.js` while the inner assertions still passed.

## Residual Manual Checks

| Behavior | Requirement | Why Manual | Release-operator note |
|----------|-------------|------------|-----------------------|
| `markos login` browser auto-opens on macOS/Windows/Linux | `CLI-01` | OS-level process launch remains environment-specific | Keep as a real-hardware smoke check for release operators. |
| `keytar` native module builds on fresh Linux | `QA-13` | Package-manager and libsecret setup varies by environment | Keep as a packaging smoke check when changing install guidance. |
| Homebrew formula installs on Apple Silicon and Intel macOS | `CLI-01` | Real brew environment still matters more than CI text assertions | Retained as a release-channel smoke step. |
| Scoop bucket installs on Windows 10/11 | `CLI-01` | Real Windows shell behavior can differ from static manifest tests | Retained as a release-channel smoke step. |
| `markos status --watch` redraws cleanly | `QA-14` | Visual terminal polish still benefits from human eyes | Retained as a manual UX check. |

## Validation Sign-Off

- [x] Wave 0 is reconciled as complete.
- [x] Plans `204-01` through `204-13` are represented in the validation map.
- [x] `204-13` is now part of the formal validation contract.
- [x] Validation metadata is aligned with `204-VERIFICATION.md`.
- [x] `nyquist_compliant: true` remains justified by the retained coverage map.

**Approval:** reconciled on 2026-04-27 against `204-VERIFICATION.md`, the Phase 204 summaries, and the executable plan refresh for `204-13`.
