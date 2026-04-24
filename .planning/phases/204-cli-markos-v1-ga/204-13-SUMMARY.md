---
phase: 204-cli-markos-v1-ga
plan: 13
subsystem: cli
tags: [cli, v2-compliance, agentrun-v2, pricing-engine, vault-freshness, gap-closure, contract-lock]

# Dependency graph
requires:
  - phase: 204-06 (Plan 06)
    provides: "markos_cli_runs table (migration 75) + submitRun/listRuns/cancelRun primitives + POST /api/tenant/runs"
  - phase: 204-08 (Plan 08)
    provides: "aggregateStatus envelope + recent_runs panel"
  - phase: 204-09 (Plan 09)
    provides: "bin/lib/cli/doctor-checks.cjs + runChecks orchestrator with DI hooks"
  - phase: 207-01 (CONTRACT-LOCK)
    provides: "AgentRun v2 Zod schemas + 15-state enum + cost model + priority enum (P0..P4)"

provides:
  - "supabase/migrations/77_markos_cli_runs_v2_align.sql — additive migration adding 15 v2 columns (idempotency_key, parent_run_id, task_id, approval_policy, provider_policy, tool_policy, pricing_engine_context, cost_currency, tokens_input/output, retry_count, retry_after, last_error_code, closed_at, v2_state) + CHECK on v2_state + back-fill from v1 status + 3 indexes. Rollback at rollback/77_*.down.sql."
  - "lib/markos/cli/runs.cjs v2-aware writer: buildV2Payload, assertV2PayloadShape, deriveIdempotencyKey, V2_REQUIRED_FIELDS, V2_STATES, STATE_V1_TO_V2_MAP, PRICING_PLACEHOLDER_SENTINEL. submitRun writes v2 shape + graceful pre-migration-77 fallback. runStubExecutor + cancelRun write v2_state + closed_at best-effort. listRuns synthesizes v2_state for legacy rows."
  - "lib/markos/cli/status.cjs recent_runs panel now surfaces v2_state, priority, estimated_cost_usd_micro, closed_at."
  - "bin/lib/cli/doctor-checks.cjs 3 new compliance checks: agentrun_v2_alignment (migration 77 + V2_REQUIRED_FIELDS + buildV2Payload probe), pricing_placeholder_policy (hard-price grep of public docs, sentinel-exempt), vault_freshness (obsidian/work/incoming >30d without brain distillation). Total check count 9 → 12."
  - "contracts/F-103-cli-runs-v1.yaml — request body gains idempotency_key + parent_run_id; PlanEnvelope.priority enum extended to P4. openapi.json/yaml regenerated."
  - "test/cli/v2-compliance.test.js — 14 new tests covering every guardrail."

affects:
  - "Phase 205 (Pricing Engine) — the pricing_engine_context column is ready to receive approved PricingRecommendation payloads; the pricing_placeholder_policy doctor check enforces the interim sentinel."
  - "Phase 207 (AgentRun v2 substrate) — Plan 207-06 adoption adapter can now lift markos_cli_runs rows directly into v2 tables without a CLI migration. CONTRACT-LOCK §11 notes_for_phase_204 satisfied."
  - "Phase 208 (Human Operating Interface) — task_id column is in place; once Phase 207-04 lands markos_agent_tasks, the FK + approval handoff flow light up without CLI-side changes."

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive-only alignment migrations. Instead of rewriting migration 75 in place (which would break existing rows), Plan 204-13 adds 77 as an ALTER-only migration with all new columns nullable or default-backed. v1 columns (status/steps_completed/steps_total) remain untouched so 204-06's stub executor continues to pass tests."
    - "Dual-column state (v1 status + v2_state) with a canonical STATE_V1_TO_V2_MAP. The CLI lib writes both columns on insert + on every transition (best-effort on v2_state to survive pre-migration-77 DBs). listRuns synthesizes v2_state from status for legacy rows so downstream consumers never see a null. Phase 207-06's adapter will collapse the two columns."
    - "Graceful schema-drift fallback in submitRun. The primary INSERT uses the full v2 payload; on PostgREST unknown-column error the code retries with a v1-only subset and emits no error. The doctor agentrun_v2_alignment check flags drift at CI time so the fallback never silently becomes permanent."
    - "Pricing placeholder sentinel as a first-class constant. lib/markos/cli/runs.cjs exports PRICING_PLACEHOLDER_SENTINEL = '{{MARKOS_PRICING_ENGINE_PENDING}}'. The pricing_engine_context jsonb column carries it by default; the doctor check greps docs for hard prices and makes sentinel-bearing files compliant by construction. Source: obsidian/brain/Pricing Engine Canon.md + D-207-05."
    - "Compliance-check-as-contract. agentrun_v2_alignment both (a) verifies migration 77 exists on disk AND (b) calls runs.buildV2Payload + runs.assertV2PayloadShape to prove the writer emits the canonical field set. Drift on either side fails CI. V2_REQUIRED_FIELDS is exported from runs.cjs and the check imports it + asserts by name — schema and code evolve together."

key-files:
  created:
    - "supabase/migrations/77_markos_cli_runs_v2_align.sql — additive v2 schema alignment for markos_cli_runs"
    - "supabase/migrations/rollback/77_markos_cli_runs_v2_align.down.sql — idempotent rollback"
    - "test/cli/v2-compliance.test.js — 14 tests (vc-01..14) covering every 204-13 guardrail"
  modified:
    - "lib/markos/cli/runs.cjs — v2 payload builder, idempotency_key derivation, v2_state lockstep writes, listRuns v2 projection + legacy synthesis, cancelRun v2 transition"
    - "lib/markos/cli/status.cjs — recent_runs surfaces v2_state/priority/estimated_cost_usd_micro/closed_at"
    - "bin/lib/cli/doctor-checks.cjs — 3 new checks (agentrun_v2_alignment, pricing_placeholder_policy, vault_freshness) + exports"
    - "test/cli/doctor-checks.test.js — dc-10 expects 12 checks (was 9)"
    - "contracts/F-103-cli-runs-v1.yaml — request body + PlanEnvelope priority enum"
    - "contracts/openapi.json, contracts/openapi.yaml — regenerated"
  removed: []

key-decisions:
  - "Migration numbered 77 (not 75.1). Used the next available contiguous slot 77 per reserved range for 204 gap-closure (CONTRACT-LOCK §3 says 77-80, 90-95 reserved). Keeping migration numbers contiguous across the CLI subsystem means operators run them in a single pass."
  - "v1 status column preserved alongside new v2_state column. Rewriting migration 75 in place would risk breaking any pre-existing rows AND require rebuilding the 204-06 stub executor. Dual-column approach lets 204-13 land without touching the executor state-machine; 207-06 adapter will collapse them."
  - "Phase 207 §4 mandates cost_currency as TEXT NOT NULL DEFAULT 'USD'. Migration 77 applies that constraint; existing NULL-currency rows don't exist yet (migration 75 didn't have the column), so the default is free to apply cleanly."
  - "pricing_engine_context seeded with { placeholder: '{{MARKOS_PRICING_ENGINE_PENDING}}' } by default rather than just empty {}. This makes the sentinel visible at data-browser inspection time without requiring readers to know the placeholder is implicit. The doctor check tolerates either shape in docs (presence of the token anywhere is enough)."
  - "Doctor check for vault_freshness emits warn, not error. Vault hygiene is a process concern, not a CI-gate concern; operators should see the signal but not fail deploys on it. Matches brew doctor convention: 'potential problem' ≠ 'broken'."
  - "Doctor check for pricing_placeholder_policy emits error, not warn. Hard-coded prices in public docs are a commitment/brand risk (D-207-05: prices are Pricing-Engine-owned until approved). CI gate is the right level."
  - "Doctor check for agentrun_v2_alignment emits error. Schema drift between CLI writer and DB is a deployment hazard — pointing hard at it during --check-only is the whole reason 204-13 exists."
  - "pricing_engine_context column added even though Plan 204-13 does not consume it. Per CONTRACT-LOCK §11 notes_for_phase_205, Pricing Engine will write into this column via its approved recommendation emit path; having the column live now means Phase 205 doesn't trigger a CLI migration."
  - "No contract-level breaking changes. F-103 additions are purely additive (new optional request-body fields, enum extension P3→P4 that never invalidated prior callers). No F-105/F-102 drift detected — their response shapes don't touch v2 fields."

patterns-established:
  - "Pattern: migration-77-style additive alignment. When a downstream-phase contract (here 207-01) locks schemas the current-phase table doesn't yet reflect, add a new migration that ALTERs with all new columns nullable or default-backed AND back-fills deterministic values from the legacy column(s). Rollback is a single DROP-block reversal. Captured in this plan's migration 77 + rollback 77.down as a reference."
  - "Pattern: v2-required-fields-shared-constant. The list of v2 required fields lives in exactly one place (lib/markos/cli/runs.cjs::V2_REQUIRED_FIELDS) and is consumed by (a) the writer's assertV2PayloadShape helper, (b) the tests, and (c) the doctor agentrun_v2_alignment check. Adding a new required field requires a single edit and the whole compliance surface picks it up."
  - "Pattern: sentinel-token-in-jsonb-default. Pricing placeholder is a jsonb object { placeholder: '{{MARKOS_PRICING_ENGINE_PENDING}}' } rather than a NULL or an empty object. This makes grep-based policy checks trivial (presence of the string anywhere in the file/value) and lets row-browsers surface the placeholder without needing app-level knowledge."

requirements-completed: []

# Metrics
duration: ~55min
completed: 2026-04-23
---

# Phase 204 Plan 13: v2 Compliance Guardrails for CLI GA Summary

**markos_cli_runs schema aligned with Phase 207 AgentRun v2 contract-lock (15 new columns, back-filled), CLI writer emits canonical v2 payload with deterministic idempotency_key + pricing-engine placeholder sentinel, and markos doctor gains 3 compliance checks that fail CI on schema drift, hard-coded prices, or stale vault intake.**

## Performance

- **Duration:** ~55 min
- **Tasks:** 7 (task 7 = full-suite regression verification; no commit)
- **Files modified/created:** 10
- **Commits:** 6 atomic

## Accomplishments
- Additive migration 77 brings `markos_cli_runs` into alignment with Phase 207 CONTRACT-LOCK §4 without breaking any existing rows (15 new columns, 3 new indexes, CHECK on v2_state, v1→v2 back-fill).
- `lib/markos/cli/runs.cjs::submitRun` now writes the canonical AgentRun v2 payload (priority P2, trigger_kind 'cli', source_surface 'cli:markos run', agent_id, agent_registry_version '2026-04-23-r1', deterministic idempotency_key, approval_policy default, pricing_engine_context with placeholder sentinel, v2_state 'requested'). Graceful fallback keeps CLI working on pre-migration-77 DBs.
- `markos status` recent_runs panel surfaces the v2 columns (v2_state, priority, estimated_cost_usd_micro, closed_at).
- `markos doctor` gains 3 new v2 compliance checks (agentrun_v2_alignment, pricing_placeholder_policy, vault_freshness), total 12 checks. All 3 support `--check-only` CI gating.
- Contract F-103 + regenerated openapi.json/yaml reflect v2 request-body fields without breaking shape.
- 14-test v2-compliance suite (`test/cli/v2-compliance.test.js`) added; all 204-01..12 tests remain green.

## Task Commits

1. **Task 1: migration 77 additive v2 alignment** — `c7dfa86` (fix)
2. **Task 2: lib/markos/cli/runs.cjs v2-shaped payload** — `505bb91` (fix)
3. **Task 3: markos status surfaces v2 columns** — `45c8040` (fix)
4. **Task 4: doctor gains 3 v2 compliance checks** — `5c87575` (fix)
5. **Task 5: v2 compliance test suite (14 tests)** — `f27710a` (fix)
6. **Task 6: F-103 + OpenAPI regen** — `ae6f6c6` (fix)

## Files Created/Modified

- `supabase/migrations/77_markos_cli_runs_v2_align.sql` — v2 alignment migration (additive)
- `supabase/migrations/rollback/77_markos_cli_runs_v2_align.down.sql` — idempotent rollback
- `lib/markos/cli/runs.cjs` — v2 payload builder, v2_state writes, exports (V2_REQUIRED_FIELDS, buildV2Payload, assertV2PayloadShape, deriveIdempotencyKey, STATE_V1_TO_V2_MAP, PRICING_PLACEHOLDER_SENTINEL)
- `lib/markos/cli/status.cjs` — recent_runs surfaces v2_state/priority/cost/closed_at
- `bin/lib/cli/doctor-checks.cjs` — 3 new checks + registry wiring + exports
- `test/cli/doctor-checks.test.js` — dc-10 updated for 12 checks
- `test/cli/v2-compliance.test.js` — 14 new tests (vc-01..14)
- `contracts/F-103-cli-runs-v1.yaml` — additive v2 request-body + priority enum extension
- `contracts/openapi.json` — regenerated
- `contracts/openapi.yaml` — regenerated

## Decisions Made

See frontmatter `key-decisions` for the full list. Most material:
- Migration 77 is additive, not an in-place rewrite of 75 → preserves 204-06 executor behavior and all 55 existing tests.
- Dual-column state (v1 status + v2_state) via STATE_V1_TO_V2_MAP → Phase 207-06 adapter will collapse.
- pricing_engine_context column added NOW even though 204-13 doesn't use it → Phase 205 lands without a CLI migration.
- pricing_placeholder_policy doctor check is error-level, vault_freshness is warn-level → reflects brand-risk vs hygiene-concern split.

## Deviations from Plan

None — plan executed as written. The plan's "10th check deferred from 204-09" was interpreted to mean the 3-check v2-compliance bundle was always the intended delivery for 204-13 (Plan 09's summary explicitly says pricing_placeholder_policy belongs in 204-13). Doctor total went 9 → 12, not 9 → 10.

## Issues Encountered

- `test/cli/doctor-checks.test.js` has a pre-existing file-level timeout (60s) that was already failing before 204-13 — verified via `git stash`. All 13 individual tests inside pass.
- `test/api-contracts/phase-45-flow-inventory.test.js` pre-existing unrelated failure (expects 17 phase-45 flows, repo has 23 from downstream phases). Not introduced by 204-13.

## User Setup Required

None. Migration 77 is applied by the standard Supabase migration runner. `npx markos doctor --check-only` runs the new checks with no config changes.

## Next Phase Readiness

Phase 204 GA is ready for verification. The CLI surface is now aligned with Phase 207 CONTRACT-LOCK such that Phase 205 (Pricing Engine) and Phase 207 (AgentRun v2 substrate) can land without requiring a CLI-schema migration.

Remaining cross-phase dependencies (unblocked by 204-13):
- Phase 205 writes approved PricingRecommendation into `markos_cli_runs.pricing_engine_context` — column is ready.
- Phase 207-06 adoption adapter lifts `markos_cli_runs` rows to `markos_agent_runs` — columns align with CONTRACT-LOCK §4.
- Phase 208 Human Operating Interface reads `markos_agent_tasks` — `task_id` column in place; FK lights up when migration 104 lands.

---
*Phase: 204-cli-markos-v1-ga*
*Completed: 2026-04-23*
