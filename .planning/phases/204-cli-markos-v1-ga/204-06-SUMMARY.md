---
phase: 204-cli-markos-v1-ga
plan: 06
subsystem: cli
tags: [cli, run, sse, durable-run, cancel, F-103, agent-run-v2-compat, markos-cli-runs]

# Dependency graph
requires:
  - phase: 204-01 (Plan 01)
    provides: "bin/lib/cli/{http,sse,keychain,output,errors,config}.cjs primitives + EXIT_CODES + test/cli/_fixtures/sse-event-server.cjs stub fixture"
  - phase: 204-04 (Plan 04)
    provides: "lib/markos/cli/whoami.cjs — resolveWhoami + resolveSessionWhoami dual-auth Bearer-to-tenant resolver"
  - phase: 204-05 (Plan 05)
    provides: "lib/markos/cli/plan.cjs::buildPlanEnvelope + hashToken + PLAN_STEPS + AGENT_ID (envelope shape reused verbatim by durable submit)"
  - phase: 207-01 (CONTRACT-LOCK)
    provides: "AgentRun v2 schema — priority enum, chain_id, correlation_id, trigger_kind, source_surface, estimated_cost_usd_micro BIGINT, agent_registry_version"
provides:
  - "supabase/migrations/75_markos_cli_runs.sql + rollback — durable run table (RLS tenant isolation + status enum + AgentRun v2 forward-compat columns)"
  - "lib/markos/cli/runs.cjs + .ts — 5 primitives (submitRun, streamRunEvents, listRuns, getRun, cancelRun) + internal runStubExecutor"
  - "api/tenant/runs/create.js — POST /api/tenant/runs durable submit handler"
  - "api/tenant/runs/[run_id]/events.js — GET /api/tenant/runs/{id}/events SSE stream handler"
  - "api/tenant/runs/[run_id]/cancel.js — POST /api/tenant/runs/{id}/cancel idempotent cancel handler"
  - "bin/commands/run.cjs — markos run <brief> CLI with --watch (default) + --no-watch + --json + --timeout + SIGINT graceful cancel"
  - "test/cli/_fixtures/run-cli-harness.cjs — child-process entrypoint for run.cjs tests (isolates from Node test runner subtest IPC)"
  - "contracts/F-103-cli-runs-v1.yaml — extended to 4 paths (plan + create + events SSE + cancel)"
  - "openapi regen: 68 flows / 108 paths (105 → 108; +3 new CLI paths)"
  - "Wave 2 complete for durable runs — unblocks 204-07 (env), 204-08 (status)"
affects:
  - "204-07 (env pull/push/diff/merge) — inherits the dual-auth endpoint pattern + F-103's run primitives for env presets"
  - "204-08 (status) — consumes lib/markos/cli/runs.cjs::{listRuns, getRun}"
  - "204-13 (v2 doctrine compliance gap-closure) — rows in markos_cli_runs are AgentRun v2 forward-compatible; column names align with 207-01 CONTRACT-LOCK"
  - "205 (Pricing engine) — populates pricing_engine_context on durable runs; estimated_cost_usd_micro already in place from this plan"
  - "207-06 (adoption adapters) — can wrap markos_cli_runs rows as AgentRun v2 without schema migration"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subprocess-harness CLI tests: spawn bin/commands/run.cjs in a child so Node 22 test runner's V8-serialized subtest IPC does not leak into in-process stdout capture (fixes opaque binary garbage bleeding into captured stdout with parallel awaits)."
    - "Server-sent events (SSE) with 15s heartbeat + 30-min hard cap + Last-Event-ID resume: writer contract { write(chunk), end() } in runs.cjs::streamRunEvents; request-close propagates to AbortController that unblocks the poll loop."
    - "process.exitCode on SSE-consuming CLI (not process.exit) lets undici fetch reader handles unwind cleanly on Windows — prevents UV_HANDLE_CLOSING libuv assertion under Node 22."
    - "AgentRun v2 forward-compat schema: markos_cli_runs columns (priority, chain_id, correlation_id, trigger_kind, source_surface, estimated_cost_usd_micro BIGINT, agent_id, agent_registry_version) match Phase 207 CONTRACT-LOCK so Plan 207-06 adapter ships zero-migration bridging."
    - "Stub executor + setImmediate scheduling: submitRun inserts the row, returns 201 to the caller, and spawns a runStubExecutor that walks status pending→running→success with 300ms per-step delays — Phase 205 replaces with real LLM-backed executor."
    - "SIGINT-as-flag (not exit-in-handler): the SIGINT handler sets sigintCaught + controller.abort() + fire-and-forget sendCancel, then the main flow observes sigintCaught after streamSSE unwinds and sets process.exitCode=0 — avoids race with the stream's 'ended without terminal event' exit path."

key-files:
  created:
    - "supabase/migrations/75_markos_cli_runs.sql — markos_cli_runs table (status enum + RLS + AgentRun v2 cols)"
    - "supabase/migrations/rollback/75_markos_cli_runs.down.sql — drops policy + indexes + table"
    - "lib/markos/cli/runs.cjs — 5 library primitives + runStubExecutor + SSE emit loop"
    - "lib/markos/cli/runs.ts — TS twin for typed consumers"
    - "api/tenant/runs/create.js — POST /runs (dual-auth, 201 on success)"
    - "api/tenant/runs/[run_id]/events.js — GET /runs/{id}/events SSE stream (cross-tenant → 404, Last-Event-ID resume, X-Accel-Buffering:no)"
    - "api/tenant/runs/[run_id]/cancel.js — POST /runs/{id}/cancel idempotent"
    - "bin/commands/run.cjs — replaces 204-01 stub with full CLI"
    - "contracts/F-103-cli-runs-v1.yaml — merged contract (4 paths)"
    - "test/cli/runs-endpoints.test.js — 14 tests (migration shape + library primitives + SSE emit paths)"
    - "test/cli/runs-create-events.test.js — 11 tests (rc-01..04 + ev-01..04 + ca-01..03)"
    - "test/cli/sse-parser.test.js — 4 tests (single/multi-line data + Last-Event-ID reconnect + abort)"
    - "test/cli/run.test.js — 11 tests (run-01..10 + run-meta) via subprocess harness"
    - "test/cli/_fixtures/run-cli-harness.cjs — child-process entrypoint"
  modified:
    - "contracts/openapi.json — regenerated (68 flows / 108 paths)"
    - "contracts/openapi.yaml — regenerated (68 flows / 108 paths)"
  removed:
    - "contracts/F-103-cli-runs-plan-v1.yaml — superseded by F-103-cli-runs-v1.yaml"

key-decisions:
  - "migration 75 is additive (new markos_cli_runs table) rather than extending migration 53's markos_agent_runs. Rationale: Phase 207 owns AgentRun v2; 204-06 ships a v1 GA surface today + rows are v2 forward-compatible via column alignment. Plan 207-06 adapter will bridge; Plan 204-13 gap-closure will migrate. Less coupling, faster GA ship."
  - "F-103 was renamed F-103-cli-runs-plan-v1.yaml → F-103-cli-runs-v1.yaml (dropping '-plan-' qualifier) because it now ships 4 paths (plan + create + events + cancel), not just plan. Old file deleted; openapi regenerated."
  - "cross-tenant run access returns 404 run_not_found (not 403 cross_tenant_forbidden) to avoid existence leak. Tenant scoping happens in getRun itself — the events.js handler never sees a foreign row, so a tenant can't probe for existence by trying arbitrary run_ids."
  - "SSE emit loop polls every 500ms (tunable via streamRunEvents opts) rather than DB LISTEN/NOTIFY. Rationale: migration 75 is v1 GA; Phase 207 orchestration will replace with event-driven emit when the AgentRun v2 tables are live. 500ms is cheap enough that the response feels real-time without hammering the DB."
  - "process.exitCode (not process.exit) after streamSSE completes: on Windows, calling process.exit during in-flight undici reader tear-down triggers UV_HANDLE_CLOSING libuv assertion (exit code 3221226505). Setting process.exitCode lets Node unwind handles + exit naturally. This was the last bug on Task 3 Windows test runs."
  - "CLI tests use a subprocess harness (test/cli/_fixtures/run-cli-harness.cjs) rather than in-process process.stdout overrides. Node 22 test runner writes V8-serialized subtest events (type/name/location) to parent process.stdout during test execution — any parent-side capture includes those bytes. Child-process isolation fixes this cleanly."
  - "SIGINT handler is synchronous (sets flag + fire-and-forget cancel). Earlier attempt with `await sendCancel` inside the handler raced with the main flow's post-stream exit logic (which fired 'Stream ended without terminal event' → exit 2). Flag-based pattern ensures the SIGINT path wins: main observes sigintCaught, sets exitCode=0, returns."

patterns-established:
  - "Pattern: durable run with SSE watch — CLI POSTs + receives run_id + events_url → opens SSE stream via shared streamSSE primitive → terminal event sets process.exitCode + returns."
  - "Pattern: subprocess CLI tests — spawn a harness entrypoint that invokes main({ cli }) so Node test runner IPC on stdout doesn't contaminate captures. Harness accepts { cli, briefFile, baseUrl, apiKey, profile, triggerSigintMs } envelope."
  - "Pattern: AgentRun v2 forward-compat table — new tables carry priority/chain_id/correlation_id/trigger_kind/source_surface/estimated_cost_usd_micro columns from day 1 so Phase 207 orchestrator + Phase 205 pricing can land without schema migrations."
  - "Pattern: cross-tenant masking as 404 — handlers never distinguish 'exists but foreign' from 'absent' in error envelopes; tenant guard happens inside the lib primitive (getRun) which returns null in both cases."

requirements-completed:
  - CLI-01
  - QA-01
  - QA-02
  - QA-04
  - QA-09
  - QA-11

validation:
  automated:
    - "node --test test/cli/runs-endpoints.test.js → 14 green (migration shape + submitRun + runStubExecutor + 5 SSE emit paths + list/get/cancel + meta)"
    - "node --test test/cli/sse-parser.test.js → 4 green (single-line data + multi-line concat + Last-Event-ID reconnect + AbortController abort)"
    - "node --test test/cli/runs-create-events.test.js → 11 green (rc-01..04 + ev-01..04 + ca-01..03)"
    - "node --test test/cli/run.test.js → 11 green (run-01..10 + run-meta via subprocess harness)"
    - "node --test test/cli/*.test.js → 168 green (zero regression on Wave 1+2 cli suite)"
    - "grep -c '\"F-103\"' contracts/openapi.json → 5 (source + 4 paths)"
    - "grep -c /api/tenant/runs contracts/F-103-cli-runs-v1.yaml → 9 (each path referenced multiple times)"
  manual:
    - "migration 75 + rollback ready for QA-13 drill; rollback tested hermetically via test mig-02 grep"
    - "T-204-06-01 (cross-tenant EoP): events handler masks cross-tenant as 404 + getRun tenant-guards at lib layer → verified by ev-02 test"
    - "T-204-06-04 (listRuns Info Disclosure): listRuns excludes brief_json + result_json by explicit column list → verified by lr-01 test"

ops:
  migration: 75_markos_cli_runs
  rollback: 75_markos_cli_runs.down
  rollback_verified_by_test: "test/cli/runs-endpoints.test.js mig-02 (grep-asserts rollback file content)"
  deferred_to_205: "real LLM executor replaces runStubExecutor; current stub walks status with 300ms step delays for SSE progress UX"
  deferred_to_207: "migration 75 rows migrate into markos_agent_runs (v2) via Plan 207-06 adoption adapter; schema already v2-compatible"

# Counts
counts:
  migrations_added: 1
  migrations_rollback: 1
  endpoints_added: 3        # POST /runs, GET /runs/{id}/events, POST /runs/{id}/cancel
  commands_added: 1         # markos run
  library_primitives_added: 5 # submitRun, streamRunEvents, listRuns, getRun, cancelRun
  tests_added: 40           # 14 + 11 + 4 + 11 = 40
  contracts_paths_new: 3    # F-103 went from 1 path → 4 paths
  openapi_paths_total: 108  # was 105 post-204-05
  openapi_flows_total: 68
---

# Plan 204-06 — `markos run` with SSE watch (Wave 2 centerpiece)

## What shipped

- **Migration 75 (`markos_cli_runs`)** — durable run table with `status` enum (`pending/running/success/failed/cancelled`), RLS tenant isolation policy, `(tenant_id, created_at desc)` index, and full AgentRun v2 forward-compat column set (priority, chain_id, correlation_id, trigger_kind, source_surface, estimated_cost_usd_micro BIGINT, actual_cost_usd_micro, agent_id, agent_registry_version). Rollback script provided.
- **Library `lib/markos/cli/runs.cjs` + `.ts`** — 5 primitives (`submitRun`, `streamRunEvents`, `listRuns`, `getRun`, `cancelRun`) + internal `runStubExecutor`. The stub walks a run through `running → step_completed++ → success` with 300ms delays; Phase 205 replaces with the real LLM-backed path.
- **3 new endpoints:**
  - `POST /api/tenant/runs` — dual-auth Bearer/legacy-session; validates brief; inserts row; schedules stub executor; returns `201 { run_id, status:'pending', tenant_id, priority, correlation_id, events_url }`.
  - `GET /api/tenant/runs/{id}/events` — SSE stream; 15s heartbeat; terminal close on success/failed/cancelled; honours `Last-Event-ID` resume; cross-tenant masked as 404; request-close aborts the poll loop.
  - `POST /api/tenant/runs/{id}/cancel` — idempotent on terminal runs (`was_terminal:true`); emits `source_domain='cli' action='run.cancelled'` audit row.
- **CLI `bin/commands/run.cjs`** — replaces the 204-01 stub. Flags: `--no-watch` / `--watch=false`, `--json`, `--timeout=<sec>`. Default exit codes: 0 SUCCESS, 1 USER_ERROR (invalid brief / run failed), 2 TRANSIENT (timeout / 5xx / network), 3 AUTH_FAILURE. SIGINT → fire-and-forget cancel + graceful exit 0 with hint.
- **Contract F-103** — renamed `F-103-cli-runs-plan-v1.yaml` → `F-103-cli-runs-v1.yaml`; now describes 4 paths sharing `BriefInput` + `PlanEnvelope` schemas. New schemas: `RunCreateResult`, `RunCancelResult`, `RunStatus`, `RunEventStream`, `CrossTenantForbiddenError`, `RunNotFoundError`.
- **openapi regenerated** — 68 flows / 108 paths (up from 105).
- **Tests** — 40 new tests across 4 files; all green; zero regression on prior 128 CLI tests.

## Exit-code map (run.cjs)

| Scenario                             | Exit |
| ------------------------------------ | ---- |
| watch completes `status=success`     | 0    |
| `--no-watch` and run_id printed      | 0    |
| SIGINT graceful cancel               | 0    |
| missing / invalid brief              | 1    |
| run.completed `status=failed`        | 1    |
| run.completed `status=cancelled`     | 1    |
| `--timeout=<sec>` hit before terminal| 2    |
| Network / 5xx                        | 2    |
| 401 auth / no token in keychain      | 3    |

## Test inventory

- `test/cli/runs-endpoints.test.js` — 14 (mig-01..02, sr-01..03, sre-01..05, lr-01, gr-01, cr-01, meta)
- `test/cli/runs-create-events.test.js` — 11 (rc-01..04, ev-01..04, ca-01..03)
- `test/cli/sse-parser.test.js` — 4 (sse-01..04)
- `test/cli/run.test.js` — 11 (run-01..10, run-meta)

## Wave 2 status after 204-06

- 204-05 shipped pre-execution trio (init/plan/eval).
- 204-06 ships durable run + SSE (centrepiece).
- 204-07 (env pull/push/diff/merge) + 204-08 (status) remain; both inherit patterns from 204-05 + 204-06.

## Unblocks

- **204-07** — mirrors the dual-auth `create.js` pattern for env presets.
- **204-08** — consumes `listRuns` + `getRun` primitives.
- **205** — pricing middleware populates `pricing_engine_context` on rows already carrying `estimated_cost_usd_micro`.
- **207-06** — adoption adapter bridges `markos_cli_runs` rows into `markos_agent_runs` (v2) without schema migration.
