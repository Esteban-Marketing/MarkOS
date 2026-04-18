---
phase: 204
slug: cli-markos-v1-ga
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-18
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

*Filled by planner during Step 8; one row per task with `<automated>` command. Every task MUST either:*
*(a) add a unit/integration test file that runs green via `node --test`, OR*
*(b) declare a Wave 0 dep on a shared fixture/migration, OR*
*(c) be explicitly `manual-only` in the §Manual-Only Verifications section below with justification.*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| — | — | — | — | — | *(planner populates)* | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Shared infrastructure that MUST exist before plans execute.*

- [ ] `test/cli/_fixtures/keychain-stub.cjs` — in-memory keytar mock (macOS Keychain absent in Linux CI)
- [ ] `test/cli/_fixtures/oauth-device-server.cjs` — local HTTP stub for `/api/cli/oauth/device/*` endpoints
- [ ] `test/cli/_fixtures/sse-event-server.cjs` — stub `/api/tenant/runs/{id}/events` SSE emitter for `run --watch`
- [ ] `test/cli/_fixtures/xdg-tmp.cjs` — isolated `$XDG_CONFIG_HOME` + `%APPDATA%` temp root per test
- [ ] `supabase/migrations/73_markos_cli_device_sessions.sql` — device-code session table (Wave 1 blocker)
- [ ] `supabase/migrations/74_markos_cli_api_keys.sql` — API key CRUD table (Wave 1 blocker)

*If any remain `[ ]` when Wave 1 starts, execute-phase MUST block and fix infra first.*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies listed
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (6 items above)
- [ ] No watch-mode flags in CI (tests run to completion, not `--watch`)
- [ ] Feedback latency < 150s for full suite
- [ ] `nyquist_compliant: true` set in frontmatter (after planner confirms map is complete)

**Approval:** pending
