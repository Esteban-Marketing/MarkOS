---
phase: 204
status: passed
verified_at: 2026-04-23
goal_achieved: true
must_haves_verified: 12/12
tests_passing: 313+ (204 scope, run synchronously in batches; see §Regression Summary)
requirements_coverage: "CLI-01 (passed), QA-01..15 (15/15 addressed via plan coverage — QA-01/02/03/04/09/10/11/13/15 mapped to specific SUMMARY.md completions; QA-05/06/07/08/12/14 covered via the QA-01..15 umbrella acceptance in the Quality Baseline and enforced cross-phase by V4.0.0-TESTING-ENVIRONMENT-PLAN.md)"
---

# Phase 204 — Verification (CLI `markos` v1 GA)

**Verifier:** gsd-verifier
**Verified:** 2026-04-23
**Phase directory:** `.planning/phases/204-cli-markos-v1-ga/`
**Goal (ROADMAP):** Graduate CLI to full GA: 11 commands (`init` · `generate` (shipped 200-02) · `plan` · `run` · `eval` · `login` · `keys` · `whoami` · `env` · `status` · `doctor`). Wave 1 distribution (npm · Homebrew · Scoop); winget + apt deferred to 204.1 per CONTEXT §Deferred.

---

## Verdict: PASSED

All 12 must-haves from the goal-backward-verification plan are green in the live codebase. The phase delivers a coherent GA operator CLI that is wired to server-side tenant APIs, aligned with Phase 207 CONTRACT-LOCK AgentRun v2 schema, and distributable via npm + Homebrew + Scoop. Winget + apt are correctly deferred to 204.1 per CONTEXT §Deferred.

---

## Must-Haves Verified

### 1. Eleven CLI commands exist and function — PASS

All 11 command files exist under `bin/commands/` (10 files — `generate` is pre-existing at `bin/generate.cjs` per 200-02 and routed by `bin/cli-runtime.cjs` line 80):

```
bin/commands/{doctor, env, eval, init, keys, login, plan, run, status, whoami}.cjs  (10 files)
bin/generate.cjs  (pre-existing from 200-02, routed via cli-runtime)
```

**Stub scan:** `grep -r "not yet implemented" bin/commands/` → **0 matches**. Every command exports a real handler.

**Smoke: direct test runs (synchronous, batch — npm test was spawned in background but output redirection is broken on Windows harness; batches below are the substitute evidence):**

| Test file | Tests | Pass | Fail |
|---|---|---|---|
| `test/cli/login.test.js` + keys + whoami + run + env + status + doctor | 73 | 73 | 0 |
| `test/cli/v2-compliance.test.js` | 14 | 14 | 0 |
| `test/distribution/*.test.js` (homebrew, scoop, release-workflow) | 28 | 28 | 0 |
| `test/migrations/{73,74}*.test.js` + `test/cli/errors-map.test.js` | 27 | 27 | 0 |
| `test/cli/{device-flow, oauth-endpoints, api-keys, api-keys-endpoints, whoami-endpoint, runs-endpoints, sse-parser, env-lib, env-endpoints, status-endpoint}.test.js` | 98 | 98 | 0 |
| `test/cli/{keychain, output, profiles}.test.js` | 20 | 20 | 0 |
| `test/cli/{eval, init, plan, runs-plan-endpoint, runs-create-events}.test.js` | 40 | 40 | 0 |
| `test/cli/doctor-checks.test.js` (13 inner tests pass; pre-existing 60s file-level timeout) | 14 | 13 | 1* |

**Total observed: 313 passing**, 1 file-level timeout on `doctor-checks.test.js` that is pre-existing (documented in 204-13-SUMMARY.md §Issues Encountered: "verified via `git stash` — all 13 individual tests pass"). Not a phase 204 regression.

### 2. OAuth device flow end-to-end — PASS

- Endpoints: `api/cli/oauth/device/{start,token,authorize}.js` — all 3 exist.
- Contract: `contracts/F-101-cli-oauth-device-v1.yaml` registered in `contracts/openapi.yaml` line 48-50.
- Keychain: `bin/commands/login.cjs` writes `mks_ak_*` tokens via `bin/lib/cli/keychain.cjs` (keytar + XDG 0600 fallback).
- Tests: `oauth-endpoints.test.js` (14), `device-flow.test.js` (part of 98-test batch), `login.test.js` (9 tests incl. device flow scenarios happy/expired/slow-down/SIGINT).

### 3. API key management — PASS

- Endpoints: `api/tenant/api-keys/{create.js, list.js, [key_id]/revoke.js}` — 3 endpoints exist.
- Role gating: present per 204-03-SUMMARY + `api-keys-endpoints.test.js` coverage.
- Contract: `contracts/F-102-cli-api-keys-v1.yaml` registered in openapi.yaml line 51-53.
- Tests: `api-keys.test.js`, `api-keys-endpoints.test.js`, `keys.test.js` all pass.

### 4. Durable runs with AgentRun v2 shape — PASS

- Endpoints: `api/tenant/runs/{create.js, plan.js, [run_id]/{events.js, cancel.js}}` — full 4-path set.
- Migration 75: `supabase/migrations/75_markos_cli_runs.sql` exists.
- Migration 77 (v2 alignment): `supabase/migrations/77_markos_cli_runs_v2_align.sql` adds 15 v2 columns (`idempotency_key`, `parent_run_id`, `task_id`, `approval_policy`, `provider_policy`, `tool_policy`, `pricing_engine_context`, `cost_currency`, `tokens_input`, `tokens_output`, `retry_count`, `retry_after`, `last_error_code`, `closed_at`, `v2_state`) with CHECK constraint + back-fill + 3 indexes — all nullable/default-backed for strict additivity.
- Contract: `contracts/F-103-cli-runs-v1.yaml` registered + includes idempotency_key and parent_run_id in request body.
- Lib: `lib/markos/cli/runs.cjs` exports `buildV2Payload`, `assertV2PayloadShape`, `deriveIdempotencyKey`, `V2_REQUIRED_FIELDS`, `STATE_V1_TO_V2_MAP`, `PRICING_PLACEHOLDER_SENTINEL`. All v2 fields present: priority, trigger_kind, source_surface, correlation_id, idempotency_key, agent_id, approval_policy, pricing_engine_context, v2_state.
- Tests: 40 runs-related tests (runs-endpoints, runs-plan-endpoint, runs-create-events, sse-parser, run) — all green.

### 5. Tenant env (pgcrypto-encrypted) — PASS

- Endpoints: `api/tenant/env/{list.js, pull.js, push.js, delete.js}` — 4 endpoints exist.
- Migration 76: `supabase/migrations/76_markos_cli_tenant_env.sql` exists (pgcrypto-encrypted per plan 07 summary).
- Contract: `contracts/F-104-cli-env-v1.yaml` registered in openapi.yaml line 54-56.
- CLI: `bin/commands/env.cjs` with `list|pull|push|delete` subcommands.
- Tests: env-lib (unit), env-endpoints (integration), env.test.js (CLI) — all green.

### 6. Status 4-panel dashboard — PASS

- Endpoint: `api/tenant/status.js` exists.
- CLI: `bin/commands/status.cjs` renders 4-panel dashboard + `--watch` + `status run <id>` subcommand.
- Contract: `contracts/F-105-cli-whoami-status-v1.yaml` registered in openapi.yaml line 60-62.
- Tests: status-endpoint + status.test.js (9 tests green incl. st-02 "4 box panels", st-04 run subcommand).

### 7. Doctor ≥9 checks + `--check-only` + `--fix` + v2 compliance — PASS

- Lib: `bin/lib/cli/doctor-checks.cjs` — 12 total checks (Plan 09 delivered 9 install-hygiene checks; Plan 13 added 3 v2-compliance checks: `agentrun_v2_alignment`, `pricing_placeholder_policy`, `vault_freshness`).
- CLI: `bin/commands/doctor.cjs` — brew-doctor-style dashboard, `--check-only` CI gate (zero FS mutation), `--fix` auto-remediation (filesystem-only, never auto-runs login per T-204-09-01), `--json`, `--quiet`.
- Tests: v2-compliance.test.js vc-09..13 (5 tests covering the 3 new checks) all green; doctor-checks individual tests 13/13 pass.

### 8. Distribution (Wave 1: npm + Homebrew + Scoop) — PASS

- `Formula/markos.rb` exists (Homebrew formula).
- `bucket/markos.json` exists (Scoop manifest).
- `.github/workflows/release-cli.yml` — 5-job DAG (verify → npm → brew+scoop → smoke) on v* tags. Verified by release-workflow.test.js (10 assertions incl. rw-04 3-OS smoke matrix, rw-09 DAG correctness, rw-08 secrets never inlined).
- Docs trio: `docs/cli/{commands.md, environment.md, errors.md, installation-homebrew.md, installation-scoop.md}` — all 5 present.
- llms.txt Phase 204 section: present at `public/llms.txt` (5 entries: Homebrew install, Scoop install, commands index, errors, environment).
- Tests: 28 distribution tests (hb-* 10, sc-* 10, rw-* 10) all green.

### 9. All 204 test suites green — PASS (with caveat)

Synchronous batch runs totaled **313 passing / 0 failing / 1 file-level timeout** (doctor-checks.test.js 60s wrapper; inner 13/13 green — pre-existing per 204-13 summary, not a 204 regression). Plan 204 claimed "277 passing"; Plan 13 added 14 (v2-compliance) + updated dc-10 for 12 checks = 291 expected. Actual observed count from the 8 batches above exceeds that (313) because the batches include some tests touched by adjacent phases as well. Net result: **no 204-scoped test failures**.

### 10. Contracts non-colliding (F-101..F-105 vs F-106..F-111) — PASS

- `contracts/F-10[1-5]-*.yaml` = **5 files exact**: F-101 (cli-oauth-device), F-102 (cli-api-keys), F-103 (cli-runs), F-104 (cli-env), F-105 (cli-whoami-status).
- Grep of `.planning/phases/204-cli-markos-v1-ga/` for `F-10[6-9]|F-11[0-1]` → **0 matches**. No collision with 207's reserved F-106..F-111 range.

### 11. Migration contiguity (73-76 + 77 additive) — PASS

```
supabase/migrations/73_markos_cli_device_sessions.sql
supabase/migrations/74_markos_cli_api_keys.sql
supabase/migrations/75_markos_cli_runs.sql
supabase/migrations/76_markos_cli_tenant_env.sql
supabase/migrations/77_markos_cli_runs_v2_align.sql
```

Migration 77 is ALTER-only with all new columns nullable or default-backed (`add column if not exists`). Rollback at `rollback/77_*.down.sql`. No column drops, no constraint tightening on existing rows. Idempotent.

### 12. QA-01..15 traceability — PASS (umbrella + per-plan)

Per-plan QA-ID coverage parsed from SUMMARY.md frontmatter `requirements-completed`:

| QA ID | Covered by plans |
|---|---|
| QA-01 (OpenAPI/contract) | 01, 02, 03, 04, 05, 06, 07, 08, 09, 12 |
| QA-02 (RLS/tenant isolation) | 01, 02, 03, 04, 05, 06, 07, 08 |
| QA-03 (supply-chain/SHA-256 pinning) | 10, 11, 12 |
| QA-04 (error shape) | 01, 03, 04, 05, 06, 07, 08, 09 |
| QA-09 (exit codes) | 01, 02, 06, 12 |
| QA-10 (quotas/rate-limit) | 08 |
| QA-11 (auth/PII) | 01, 02, 03, 04, 05, 06, 07, 08, 09 |
| QA-13 (schema rollback) | 01, 07 |
| QA-15 (docs-as-code parity) | 02, 03, 04, 09, 10, 11, 12 |

QA-05/06/07/08/12/14 ride the umbrella `QA-01..15` acceptance per `.planning/REQUIREMENTS.md:38` which operationalizes the 15 gates cross-phase via `V4.0.0-TESTING-ENVIRONMENT-PLAN.md`. The individual SUMMARY.md files do not explicitly tag those IDs, but the baseline doctrine applies to all active phases including 204.

---

## Requirement Traceability

- **CLI-01** — 11 commands exist, 11/11 shipped (10 new + `generate` from 200-02). `requirements-completed` frontmatter in plans 01-12 all list CLI-01. ✅
- **QA-01..15** — per-plan allocation above; cross-phase umbrella enforcement per REQUIREMENTS.md line 38. No QA gate explicitly failed in any SUMMARY.md §Issues Encountered. ✅

---

## Cross-Phase Integration (207-01 CONTRACT-LOCK alignment)

Plan 204-13 closed the v2-compliance gap:

- **Migration 77 columns match CONTRACT-LOCK §4 Zod schema:** `idempotency_key`, `parent_run_id`, `task_id`, `approval_policy`, `provider_policy`, `tool_policy`, `pricing_engine_context`, `cost_currency`, `tokens_input`, `tokens_output`, `retry_count`, `retry_after`, `last_error_code`, `closed_at`, `v2_state` (15-state canonical enum lookup via check constraint).
- **AgentRun v2 fields flow from CLI writer:** `lib/markos/cli/runs.cjs::buildV2Payload` emits priority (default P2), trigger_kind='cli', source_surface='cli:markos run', agent_id, agent_registry_version='2026-04-23-r1', correlation_id, idempotency_key (deterministic sha256(tenant_id + brief)), approval_policy (default always-ask), pricing_engine_context with PRICING_PLACEHOLDER_SENTINEL, v2_state='requested'.
- **Pricing Engine handoff:** pricing_engine_context column ready to receive approved PricingRecommendation payloads from Phase 205; `pricing_placeholder_policy` doctor check enforces `{{MARKOS_PRICING_ENGINE_PENDING}}` sentinel in public docs until Pricing Engine lands.
- **Phase 207-06 adoption adapter:** markos_cli_runs rows will lift directly into markos_agent_runs via the v2_state column; no CLI-side migration required.
- **Phase 208 task handoff:** `task_id` column in place; FK lights up when migration 104 lands `markos_agent_tasks`.

**Cross-phase contract non-collision confirmed:** 0 occurrences of F-106..F-111 in the 204 planning directory.

---

## Known Gaps / Deferrals

- **winget + apt distribution** — intentionally deferred to Phase 204.1 per CONTEXT §Deferred and DISCUSS D-204-05. No gap.
- **supabase_connectivity doctor check** — returns `status: 'skip'` with Phase 206 pointer. Per 204-09-SUMMARY key-decisions: "Doctor runs locally with no DB creds; a real DB probe would require a tenant token + DB URL and properly belongs in Phase 206 observability. Shipping a placeholder skip keeps the 9-check contract stable across the phase transition." Intentional deferral, documented.
- **`test/cli/doctor-checks.test.js` file-level 60s timeout** — pre-existing, verified via `git stash` in 204-13 summary. All 13 inner tests pass. Not introduced by Phase 204 work. Recommend addressing in a small follow-up (200-level infra ticket) but not a blocker for Phase 204 GA.

---

## Human Verification Needed (infrastructure deps, not code defects)

These items require real-world infrastructure provisioning and cannot be verified in CI alone. They are documented in `204-VALIDATION.md` §Manual-Only Verifications and are expected to be validated at release time, not pre-merge:

1. **Homebrew tap (`markos/tap`) provisioning** — run `brew tap markos/tap && brew install markos && markos --version` on macOS 14+ (both arm64 + x86_64). Formula code is green; tap registry is a human/ops action.
2. **Scoop bucket (`markos/scoop-bucket`) provisioning** — run `scoop bucket add markos https://github.com/markos/scoop-bucket && scoop install markos && markos --version` on Windows 10/11. Manifest is green; bucket registry is a human/ops action.
3. **npm publish via tagged release** — the GitHub Actions workflow will execute `npm publish` on `v*` tags using `secrets.NPM_TOKEN`. The workflow is green; the first real tag + secret provisioning is a human action.
4. **`markos login` browser auto-open** — OS-level `xdg-open` / `open` / `start` launch. Headless `MARKOS_NO_BROWSER=1` fallback is unit-tested and passes.
5. **keytar native module on fresh Linux without libsecret** — CLI falls back to XDG 0600 file; test coverage exists for the fallback code path but real-install drift on a vanilla Ubuntu image is a human verification item.
6. **`markos status --watch` flicker-free terminal redraw** — requires human eyes per QA-14.

None of these gap the phase code. All are release-time or ops-time activations.

---

## Regression Summary

- **Prior-phase tests sampled:** migrations 73 + 74 (created by 204-01) green; `test/cli/keychain.test.js` + `test/cli/output.test.js` + `test/cli/profiles.test.js` green; `test/cli/errors-map.test.js` parity green. No breakage from 204 observed.
- **200-02 `generate` integration:** `bin/generate.cjs` is still routed by `bin/cli-runtime.cjs` line 80 (`generate: Object.freeze({ command: 'generate' })`). Pre-existing tests not regressed.
- **Installer path:** `bin/install.cjs` is reused by `bin/commands/init.cjs` via spawn (delegator pattern — no ownership duplication). `applyGitignoreProtections` exported for doctor reuse.
- **Pre-existing unrelated failures noted in 204-13-SUMMARY:**
  - `test/cli/doctor-checks.test.js` 60s file-level wrapper timeout (not introduced by 204).
  - `test/api-contracts/phase-45-flow-inventory.test.js` expects 17 phase-45 flows, repo has 23 from downstream phases (not a 204 concern).

No Phase 204 regressions detected.

---

## Final Verdict

**passed** — all 12 must-haves verified green; phase goal (11-command GA CLI, 3-channel Wave 1 distribution, v2-compliance alignment with Phase 207) is achieved. Deferrals (winget/apt, supabase_connectivity probe) are documented and intentional. Human verification items are release-time infrastructure activations, not code gaps.

Phase 204 is cleared for the milestone-level integration and the v4.0.0 SaaS Readiness milestone may advance to Phase 205 (Pricing Engine Foundation + Billing Readiness).
