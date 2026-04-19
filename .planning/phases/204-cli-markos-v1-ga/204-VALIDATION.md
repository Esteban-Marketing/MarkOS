---
phase: 204
slug: cli-markos-v1-ga
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-18
last_updated: 2026-04-18
---

# Phase 204 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Full behavioral matrix in `204-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node --test` (Node 22 LTS built-in) — matches CLAUDE.md + 200-02 precedent |
| **Config file** | none (convention-based) |
| **Quick run command** | `node --test test/cli/*.test.js` |
| **Full suite command** | `npm test` (runs `node --test test/**/*.test.js`) |
| **Estimated runtime** | ~25 seconds quick, ~120 seconds full |

---

## Sampling Rate

- **After every task commit:** Run quick command (plan-scoped tests only, parallelized)
- **After every plan wave:** Run full suite command (catches cross-wave regressions)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds for quick; 150 seconds for full

---

## Per-Task Verification Map

*Populated by Phase 204 planner (2026-04-18). Every task has an `<automated>` command OR a Wave 0 dependency OR is manual-only with justification.*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| T1-01.1 | 01 | 1 | CLI-01, QA-13 | migration | `node --test test/migrations/73_markos_cli_device_sessions.test.js test/migrations/74_markos_cli_api_keys.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-01.2 | 01 | 1 | CLI-01, QA-02, QA-04 | unit | `node --test test/cli/keychain.test.js test/cli/output.test.js test/cli/profiles.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-01.3 | 01 | 1 | CLI-01 | inline | `node -e "const r = require('./bin/cli-runtime.cjs').parseCliArgs(['login','--profile=prod','--token=abc']); if (r.command !== 'login') process.exit(1)"` | ❌ Wave 0 | ⬜ pending |
| T1-02.1 | 02 | 1 | CLI-01, QA-02, QA-11 | unit | `node --test test/cli/device-flow.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-02.2 | 02 | 1 | CLI-01, QA-01, QA-11 | integration | `node --test test/cli/oauth-endpoints.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-02.3 | 02 | 1 | CLI-01, QA-04 | integration | `node --test test/cli/login.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-03.1 | 03 | 1 | CLI-01, QA-04, QA-11 | unit | `node --test test/cli/api-keys.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-03.2 | 03 | 1 | CLI-01, QA-01, QA-11 | integration | `node --test test/cli/api-keys-endpoints.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-03.3 | 03 | 1 | CLI-01 | integration | `node --test test/cli/keys.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-04.1 | 04 | 1 | CLI-01, QA-01, QA-02, QA-11 | integration | `node --test test/cli/whoami-endpoint.test.js` | ❌ Wave 0 | ⬜ pending |
| T1-04.2 | 04 | 1 | CLI-01 | integration | `node --test test/cli/whoami.test.js` | ❌ Wave 0 | ⬜ pending |
| T2-05.1 | 05 | 2 | CLI-01 | integration | `node --test test/cli/init.test.js` | ❌ Wave 2 | ⬜ pending |
| T2-05.2 | 05 | 2 | CLI-01, QA-01, QA-02 | integration | `node --test test/cli/plan.test.js test/cli/runs-plan-endpoint.test.js` | ❌ Wave 2 | ⬜ pending |
| T2-05.3 | 05 | 2 | CLI-01, QA-04 | unit | `node --test test/cli/eval.test.js` | ❌ Wave 2 | ⬜ pending |
| T2-06.1 | 06 | 2 | CLI-01, QA-13 | unit + migration | `node --test test/cli/runs-endpoints.test.js` | ❌ Wave 2 | ⬜ pending |
| T2-06.2 | 06 | 2 | CLI-01, QA-01, QA-11 | integration | `node --test test/cli/sse-parser.test.js` | ❌ Wave 2 | ⬜ pending |
| T2-06.3 | 06 | 2 | CLI-01, QA-09 | integration | `node --test test/cli/run.test.js` | ❌ Wave 2 | ⬜ pending |
| T2-07.1 | 07 | 2 | CLI-01, QA-13 | unit + migration | `node --test test/cli/env-lib.test.js` | ❌ Wave 2 | ⬜ pending |
| T2-07.2 | 07 | 2 | CLI-01, QA-01, QA-11 | integration | `node --test test/cli/env-endpoints.test.js` | ❌ Wave 2 | ⬜ pending |
| T2-07.3 | 07 | 2 | CLI-01 | integration | `node --test test/cli/env.test.js` | ❌ Wave 2 | ⬜ pending |
| T3-08.1 | 08 | 3 | CLI-01, QA-01, QA-10 | integration | `node --test test/cli/status-endpoint.test.js` | ❌ Wave 3 | ⬜ pending |
| T3-08.2 | 08 | 3 | CLI-01 | integration | `node --test test/cli/status.test.js` | ❌ Wave 3 | ⬜ pending |
| T3-09.1 | 09 | 3 | CLI-01, QA-04, QA-11 | unit | `node --test test/cli/doctor-checks.test.js` | ❌ Wave 3 | ⬜ pending |
| T3-09.2 | 09 | 3 | CLI-01 | integration | `node --test test/cli/doctor.test.js` | ❌ Wave 3 | ⬜ pending |
| T4-10.1 | 10 | 4 | CLI-01, QA-03 | shape | `node --test test/distribution/homebrew-formula.test.js` | ❌ Wave 4 | ⬜ pending |
| T4-10.2 | 10 | 4 | QA-15 | docs | inline: 6 sections present | ❌ Wave 4 | ⬜ pending |
| T4-11.1 | 11 | 4 | CLI-01, QA-03 | shape | `node --test test/distribution/scoop-manifest.test.js` | ❌ Wave 4 | ⬜ pending |
| T4-11.2 | 11 | 4 | QA-15 | docs | inline: 6 sections present | ❌ Wave 4 | ⬜ pending |
| T4-12.1 | 12 | 4 | CLI-01, QA-03 | shape | `node --test test/distribution/release-workflow.test.js` | ❌ Wave 4 | ⬜ pending |
| T4-12.2 | 12 | 4 | QA-15 | doc-parity | `node --test test/cli/errors-map.test.js` | ❌ Wave 4 | ⬜ pending |
| T4-12.3 | 12 | 4 | QA-15 | docs | inline: 4 llms.txt entries | ❌ Wave 4 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Nyquist check:** 30 task rows across 12 plans; NO stretch of 3 consecutive tasks lacks an `<automated>` command. All 4 doc-only tasks (T4-10.2, T4-11.2, T4-12.3) are paired with same-plan shape tests so the plan-scoped `npm test test/cli/**/*.test.js test/distribution/**/*.test.js` catches doc regressions via errors-map parity gate (T4-12.2).

---

## Wave 0 Requirements

*Shared infrastructure that MUST exist before Wave 1 plans execute. Owned by Plan 204-01.*

- [ ] `test/cli/_fixtures/keychain-stub.cjs` — in-memory keytar mock (**Plan 01 Task 2**)
- [ ] `test/cli/_fixtures/oauth-device-server.cjs` — local HTTP stub for `/api/cli/oauth/device/*` endpoints (**Plan 01 Task 3**)
- [ ] `test/cli/_fixtures/sse-event-server.cjs` — stub `/api/tenant/runs/{id}/events` SSE emitter (**Plan 01 Task 3**)
- [ ] `test/cli/_fixtures/xdg-tmp.cjs` — isolated `$XDG_CONFIG_HOME` + `%APPDATA%` temp root per test (**Plan 01 Task 2**)
- [ ] `supabase/migrations/73_markos_cli_device_sessions.sql` — device-code session table (**Plan 01 Task 1**)
- [ ] `supabase/migrations/74_markos_cli_api_keys.sql` — API key CRUD table (**Plan 01 Task 1**)

*All 6 infrastructure items OWNED by Plan 204-01 Tasks 1-3. No separate Wave 0 plan needed — bootstrap is part of Wave 1 first plan.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `markos login` browser auto-opens on macOS/Windows/Linux | CLI-01 | OS-level process launch (xdg-open / open / start) — can't automate reliably in CI without a real DE | Run `markos login` on each OS. Confirm browser tab appears within 2s pointing to `https://app.markos.com/cli/authorize?user_code=XXXXXXXX`. Headless fallback: `MARKOS_NO_BROWSER=1 markos login` prints URL only. |
| `keytar` native module builds on fresh Linux (libsecret absent) | QA-13 | Package manager setup varies; tests can't stub system-level builds | On Ubuntu minimal container: `apt install -y libsecret-1-dev`; then `npm install markos`. If libsecret absent, CLI falls back to XDG 0600 file with warn log. |
| Homebrew formula installs on Apple Silicon + Intel macOS | CLI-01 | Can't run `brew install` in GitHub Actions macOS job reliably without flaky network | `brew tap markos/tap && brew install markos && markos --version` on real macOS 14+ hardware — both arch64 + x86_64. |
| Scoop bucket installs on Windows 10/11 | CLI-01 | Scoop requires actual Windows shell (pwsh); GitHub Actions `windows-latest` works but flakes under concurrent tap adds | `scoop bucket add markos https://github.com/markos/scoop-bucket && scoop install markos && markos --version`. |
| `markos status --watch` redraws without flicker | QA-14 | Terminal redraw visual polish requires human eyes | Run `markos status --watch` during active delivery stream. Confirm no TTY cursor artifacts, no flicker, no color bleed on resize. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies listed
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (6 items above; owned by Plan 204-01)
- [x] No watch-mode flags in CI (tests run to completion, not `--watch`)
- [x] Feedback latency < 150s for full suite
- [x] `nyquist_compliant: true` set in frontmatter (planner confirmed map complete)

**Approval:** planner-signed 2026-04-18; executor + reviewer to re-verify post-Wave-1 merge.
