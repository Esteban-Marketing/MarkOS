---
phase: 204-cli-markos-v1-ga
plan: 08
subsystem: cli
tags: [cli, status, dashboard, F-105, quota, rotations, recent-runs, watch-mode, safe-require]

# Dependency graph
requires:
  - phase: 204-01 (Plan 01)
    provides: "bin/lib/cli/{http,keychain,output,errors,config}.cjs primitives + EXIT_CODES + ANSI palette"
  - phase: 204-04 (Plan 04)
    provides: "lib/markos/cli/whoami.cjs — resolveWhoami + resolveSessionWhoami dual-auth Bearer-to-tenant resolver + F-105 scaffold (with x-markos-phase: 204-08-PLAN placeholder marker — this plan fills it)"
  - phase: 204-06 (Plan 06)
    provides: "lib/markos/cli/runs.cjs::listRuns + markos_cli_runs table (migration 75) consumed by the recent_runs panel; /api/tenant/runs/{run_id}/events SSE endpoint consumed by `markos status run <id>`"
  - phase: 203 (Plan 05)
    provides: "lib/markos/webhooks/rotation.cjs::listActiveRotations + computeStage — imported via safe-require + [] default so Plan 08 never blocks on Phase 203 presence"
  - phase: 203 (Plan 09)
    provides: "lib/markos/webhooks/metrics.cjs::aggregateFleetMetrics — imported via safe-require + neutral metrics default; used to derive deliveries_this_month"
  - phase: 201 (Plan 01)
    provides: "markos_tenants.org_id + markos_orgs — best-effort LEFT JOIN for plan_tier + billing_status (falls back to free/active when Phase 205 billing columns haven't landed)"

provides:
  - "lib/markos/cli/status.cjs + .ts — aggregateStatus primitive (4-panel cross-domain envelope) + 4 internal fetchers"
  - "api/tenant/status.js — GET /api/tenant/status (authenticated any-member read; 4-panel envelope)"
  - "bin/commands/status.cjs — full `markos status` CLI replacing Plan 01 stub (default dashboard + --watch + `status run <id>` subcommand)"
  - "contracts/F-105-cli-whoami-status-v1.yaml — COMPLETED (x-markos-phase: 204-08-PLAN marker removed; StatusEnvelope + 4 sub-panel schemas + example + error envelopes)"
  - "openapi regen: 69 flows / 112 paths (flow count unchanged — F-105 was counted when Plan 04 scaffold landed; path count unchanged — /api/tenant/status placeholder was already present)"
  - "Wave 3 lead closed — unblocks 204-09 (distribution) + 204-10 (doctor)"

affects:
  - "204-10 (markos doctor) — doctor can now shell out to `markos status` for quota/rotation health surface"
  - "205 (Pricing engine) — plan_tier + billing_status fields on StatusSubscriptionPanel are the canonical wire contract; Phase 205 will populate real values into markos_orgs and aggregateStatus will pick them up with zero code change"
  - "206 (SOC 2) — status endpoint is read-only + tenant-scoped; audit events are NOT emitted (accepted per T-204-08-05)"
  - "207 (AgentRun v2 substrate) — recent_runs projection is stable; the underlying table can migrate from markos_cli_runs to the v2 substrate without breaking the wire contract"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "safe-require cross-phase import pattern (inherited verbatim from 203-09 subscriptions/list.js): `function safeRequire(path, fallback){try{return require(path);}catch{return fallback;}}` plus a neutral default export (empty array / zero-metrics object). Guarantees the status envelope degrades gracefully when sibling modules are absent, partially deployed, or broken — critical for operator-self-serve UX that must never 500 on a single panel."
    - "Per-panel error isolation: each fetcher (fetchSubscription, fetchQuota, fetchRotations, fetchRecentRuns) runs in its own try/catch with a neutral zero/empty default. The envelope as a whole always returns 200; individual panels degrade rather than propagating the failure. Four failure modes tested (ep-03 subscription defaults, ep-04 rotation throw, cross-tenant filter, T-204-06-04 result_json strip)."
    - "Client-side quota color thresholds (70/90) declared ONCE in a frozen constant (QUOTA_THRESHOLDS) at the top of status.cjs; consumed by progressBar() for the render and by the CLI test (st-meta-2) as the source of truth. The server envelope carries raw numbers only — color mapping is a pure client concern to avoid drift between dashboards."
    - "Rotation-stage color mapping mirrors Phase 203 Surface 4 banner: t-0 + t-1 → red, t-7 → yellow, normal → green. Reuses the same stage strings emitted by listActiveRotations so the CLI renders the same traffic-light scheme operators see in the dashboard."
    - "`markos status run <id>` reuses the existing SSE `/events` endpoint by reading the first frame + closing — no new server path needed. parseFirstSseEvent is a 15-line MDN-compliant parser that extracts the initial run.snapshot frame and renders a single-run card. Avoids building a redundant GET /runs/{id} endpoint for v1 GA."
    - "--watch loop uses a 5s cadence + 60-min safety cap + small-tick sleep (100ms slices) so SIGINT can interrupt within one tick. TTY-gated at entry; non-TTY + --watch → exit 1 watch_requires_tty. SIGINT exits 0 cleanly via process.exitCode (no hard process.exit mid-fetch)."

key-files:
  created:
    - "lib/markos/cli/status.cjs — aggregateStatus + 4 fetchers + constants (QUOTA_WINDOW_DAYS, DEFAULT_SUBSCRIPTION)"
    - "lib/markos/cli/status.ts — TypeScript twin with full StatusEnvelope / QuotaPanel / ActiveRotationRow / RecentRunRow interfaces"
    - "api/tenant/status.js — GET /api/tenant/status (Bearer OR legacy session; ?runs=N; no role gate)"
    - "test/cli/status-endpoint.test.js — 9 endpoint + library tests (safe-require fallback + tenant isolation + T-204-06-04 strip + F-105 shape)"
    - "test/cli/status.test.js — 10 CLI tests (TTY render + JSON passthrough + --watch guard + status run + progress-bar thresholds)"
  modified:
    - "contracts/F-105-cli-whoami-status-v1.yaml — StatusEnvelope placeholder replaced with 5 full schemas (StatusEnvelope + StatusSubscriptionPanel + StatusQuotaPanel + StatusRotationRow + StatusRecentRunRow) + example + error envelopes; x-markos-phase: 204-08-PLAN marker removed"
    - "contracts/openapi.json — regenerated (69 flows / 112 paths; F_105_StatusEnvelope + 4 sub-panels now resolved)"
    - "contracts/openapi.yaml — regenerated"
    - "bin/commands/status.cjs — 'not yet implemented' stub replaced with full dispatcher (default + run + --watch)"
    - "test/cli/whoami-endpoint.test.js — ep-07 assertion updated: placeholder marker removed post-Plan-08; now asserts StatusEnvelope schema presence instead"
  removed: []

key-decisions:
  - "Client-side plan limits (PLAN_LIMITS constant) ship in status.cjs as a stopgap because Phase 205 has not yet surfaced authoritative quota numbers via markos_orgs. Progress bars need a denominator to render meaningfully; once Phase 205 lands, the wire envelope will carry limits and the CLI will switch over with no schema break. Documented as a Phase 205 follow-up; CLI tests do not assert specific limit values so the numbers can evolve without churn."
  - "deliveries_this_month is projected as `aggregateFleetMetrics.total_24h × 30` rather than a real 30d aggregate. The fleet-metrics view (migration 72) rolls up on 48h windows; a true 30d rollup is deferred to Phase 205 / gap-closure. The approximation is acceptable for v1 GA because the field is advisory — operators use it to sense-check their webhook load, not to trigger billing. Documented in StatusQuotaPanel schema description."
  - "No role gate on /api/tenant/status. Any authenticated member of the tenant can view their own status; the plan (constraint #2) explicitly called this out as read-only cross-domain. Tenant isolation is enforced by every underlying query scoping on tenant_id from resolveWhoami (T-204-08-01 mitigation)."
  - "`markos status run <run_id>` reuses the existing SSE `/events` endpoint (reads ONE frame + closes) rather than shipping a new `GET /api/tenant/runs/{id}` single-run detail endpoint. v1 GA scope: minimum surface area, maximum reuse. Phase 207 substrate migration can introduce a dedicated single-run endpoint if needed."
  - "Safe-require fallbacks emit neutral zero/empty values rather than throwing upstream. This lets the status command ship BEFORE Phase 203 rotation or Phase 205 billing — each panel independently degrades. Precedent: 203-09's subscriptions/list.js safe-requires the webhook breaker + DLQ modules the same way."
  - "Quota color thresholds are 70 (yellow) and 90 (red) — declared in QUOTA_THRESHOLDS constant. Test st-meta-2 asserts these values exactly, so any future widening/tightening must update the test. This prevents drift between the CLI render and any dashboard UI that mirrors the thresholds."
  - "The --watch interval is 5s with a 60-min safety cap. Operators asked for near-real-time feedback (on-call debugging UX); 5s balances freshness against server load. 60-min cap ensures no runaway dashboards left open overnight (T-204-08-02 DoS mitigation)."
  - "Default recent_runs limit is 5. Matches --watch's visible-rows budget (terminals are 24-row tall by default; 5 runs + 3 other panels + headers fits with room for --watch redraws). Overridable via ?runs=N (clamped 1..50 on the server) + --runs=N (clamped 1..50 on the CLI — single source of validation lives in parseRunsLimit + resolveRunsLimit)."

patterns-established:
  - "Pattern: safe-require cross-phase imports with neutral defaults. When a library needs sibling modules that may or may not exist yet (partial deploys, incremental phase rollout, test isolation), wrap require() in try/catch + export a module whose shape matches the real export's signature but returns zero/empty values. The consumer's code path is identical in both cases."
  - "Pattern: per-panel try/catch degradation. Cross-domain aggregation endpoints that compose N sibling queries should isolate each query's failure in its own try/catch so one slow/broken panel never poisons the whole envelope. Default to neutral values; the UI can show '(none)' or zero and the overall response remains 200."
  - "Pattern: client-side color thresholds as frozen module constants. CLI render semantics (warning colors, progress-bar bins, stage traffic lights) belong in the CLI — the server ships raw numbers. Constants live at module scope + Object.freeze so tests can import them and assert the exact values; drift between dashboards and CLI is caught at test time."
  - "Pattern: single-frame SSE consumption for one-shot endpoints. When a CLI subcommand needs a snapshot of a streaming resource (not a live feed), GET the SSE path, read the body once, parse the first data frame, close. Avoids building a parallel GET-detail endpoint for every list/stream pair."

requirements-completed: [CLI-01, QA-01, QA-02, QA-04, QA-10, QA-11]

# Metrics
duration: 60min
completed: 2026-04-24
---

# Phase 204 Plan 08: `markos status` — Cross-Domain Dashboard CLI Summary

**Wave 3 lead closes with a 4-panel operator-self-serve status dashboard, a completed F-105 contract, and resilient cross-phase safe-require imports — operators now have one command for subscription + quota + rotations + recent runs, and a `--watch` live view for on-call debugging.**

## Performance

- **Duration:** ~60 min
- **Tasks:** 2 completed
- **Files created:** 5 (library + TS twin + endpoint + 2 test files)
- **Files modified:** 5 (F-105 contract + openapi regen x2 + status.cjs stub replaced + whoami-endpoint test assertion update)

## Accomplishments

- `lib/markos/cli/status.cjs` ships `aggregateStatus()` + 4 panel fetchers. Cross-phase deps (webhook rotation, webhook fleet metrics, runs listRuns) imported via `safeRequire` with neutral defaults — status endpoint stays green even if a sibling module is missing or throws.
- `GET /api/tenant/status` authenticates via Bearer OR legacy session (mirrors Wave 2 endpoints). No role gate (any authenticated member can view their tenant's status). `?runs=N` overrides the recent_runs panel (clamped 1..50). Safe-require fallback covers missing markos_orgs billing columns, missing rotation.cjs module, and throwing aggregateFleetMetrics.
- `bin/commands/status.cjs` replaces the Plan 01 stub with a full dispatcher:
  - **Default**: 4 unicode box panels (Subscription / Quota / Active rotations / Recent runs) with hand-rolled progress bars + green/yellow/red thresholds (70 / 90).
  - **`markos status run <id>`**: reuses the existing `/events` SSE endpoint — reads one frame, parses, renders a run-detail card. No new server path.
  - **`markos status --watch`**: TTY-gated 5s refresh loop with ANSI clear-screen (`\x1b[2J\x1b[H`), 60-min safety cap, SIGINT → exit 0 clean. Non-TTY + --watch → exit 1 `watch_requires_tty`.
- F-105 contract completed — `x-markos-phase: 204-08-PLAN` placeholder removed; StatusEnvelope + 4 sub-panel schemas fully specified with descriptions, examples, and error envelopes. openapi regen → **69 flows / 112 paths** (flow count unchanged; path count unchanged since scaffold already had the path). The `F_105_StatusEnvelope` + 4 panel schemas now resolve in the generated openapi.
- **19 new tests** green (9 endpoint + 10 CLI). Full CLI suite (222 tests) green → **zero regression on 204-01..07**.

## Task Commits

Each task was committed atomically with hooks ON:

1. **Task 1: aggregateStatus library + endpoint + F-105 completion + openapi regen** — `2228cb2` (feat)
2. **Task 2: markos status CLI dashboard + --watch + status run subcommand** — `40791f1` (feat)

## Files Created/Modified

### Library
- `lib/markos/cli/status.cjs` — aggregateStatus + 4 fetchers + constants
- `lib/markos/cli/status.ts` — TS twin with StatusEnvelope / QuotaPanel / ActiveRotationRow / RecentRunRow types

### Endpoint
- `api/tenant/status.js` — GET /api/tenant/status (Bearer OR legacy; `?runs=N`; no role gate)

### CLI
- `bin/commands/status.cjs` — full dispatcher (default + `run <id>` + `--watch`) replacing Plan 01 stub

### Contract + Regen
- `contracts/F-105-cli-whoami-status-v1.yaml` — StatusEnvelope placeholder replaced; 5 schemas added; marker removed
- `contracts/openapi.json` — regen (69 flows / 112 paths)
- `contracts/openapi.yaml` — regen

### Tests
- `test/cli/status-endpoint.test.js` — 9 tests (401 / 200 happy / subscription default / rotation throw / cross-tenant / quota accuracy / F-105 shape / ?runs= clamp / T-204-06-04 strip)
- `test/cli/status.test.js` — 10 tests (no token / TTY render / --json / status run / missing run_id / --watch non-TTY / 401 / --runs= wiring / not-a-stub / threshold constants)
- `test/cli/whoami-endpoint.test.js` — ep-07 assertion rewired from placeholder to StatusEnvelope (one-line swap; all 8 whoami tests still green)

## Decisions Made

See frontmatter `key-decisions`. Primary drivers:

1. **Safe-require cross-phase imports** keep Plan 08 fully independent of Phase 205 billing landing; each panel degrades in isolation.
2. **Client-side PLAN_LIMITS + color thresholds** declared as frozen constants so tests assert them directly; Phase 205 migration is a wire-level add, not a CLI rewrite.
3. **deliveries_this_month approximated as `total_24h × 30`** — real 30d aggregate deferred; approximation documented in the schema.
4. **No role gate** on /api/tenant/status — read-only cross-domain; tenant isolation via resolveWhoami.
5. **`markos status run <id>` reuses SSE `/events`** — one-frame read + parse; avoids a new GET-detail endpoint for v1 GA.
6. **--watch = 5s cadence + 60-min cap + 100ms sleep slices** — balances freshness, server load, SIGINT responsiveness.

## Deviations from Plan

- **Path count target 113 vs 112 delivered.** Plan constraint #7 mentioned "113 paths" but the plan body (line 182) stated "+1 to 112". The scaffold's `/api/tenant/status` path was already present (Plan 04 Plan scaffold), so filling its schema does NOT add a path. Actual openapi: **69 flows / 112 paths** — matches the plan body's math (104 → 105 → 111 → 112).
- **No `GET /api/tenant/runs/{run_id}` detail endpoint.** The plan's Task 2 behavior said `status run <id>` "fetches single run detail via getRun library" but acknowledged "stream ONE event frame then close" as the alternative. Shipped as the SSE one-frame approach to avoid expanding the server surface. Tests cover both the happy path (st-04) and error paths (st-05).
- **F-105 StatusEnvelope schemas split into 5 components** (StatusEnvelope + 4 sub-panels) for reusability + OpenAPI clarity. Plan originally showed one inline object; splitting into named sub-panels matches F-101..F-104 style and enables per-schema examples without bloating the top-level.

## Validation Evidence

- `node --test test/cli/status-endpoint.test.js` → **9/9 pass** (ep-01..ep-09)
- `node --test test/cli/status.test.js` → **10/10 pass** (st-01..st-08, st-meta-1, st-meta-2)
- `node --test test/cli/*.test.js` → **222/222 pass** (full CLI suite, zero regression)
- `grep -c "aggregateStatus" lib/markos/cli/status.cjs` = 3 (≥1 required)
- `grep -c "safeRequire\|try.*require\|catch" lib/markos/cli/status.cjs` = 10 (≥3 required)
- `grep -c "listActiveRotations\|aggregateFleetMetrics\|listRuns" lib/markos/cli/status.cjs` = 4 (≥3 required)
- `grep -c "StatusEnvelope" contracts/F-105-cli-whoami-status-v1.yaml` ≥ 1 ✓
- `grep -c "x-markos-phase: 204-08-PLAN" contracts/F-105-cli-whoami-status-v1.yaml` = 0 ✓ (placeholder removed)
- `grep -c "/api/tenant/status" contracts/openapi.json` ≥ 1 ✓
- openapi: **69 flows / 112 paths** (flow count matches plan expectation; path count matches plan body math)

## Unblocks

- **204-09 (distribution):** `markos status` is a flagship command for the release notes + install-verification copy.
- **204-10 (doctor):** doctor can shell out to `markos status` for quota/rotation health surface.
- **Phase 205 (Pricing):** StatusSubscriptionPanel + StatusQuotaPanel are the canonical wire contracts; Phase 205 populates real values into markos_orgs + the CLI picks them up without code change.

## STRIDE Mitigations (from plan threat_model)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-204-08-01 | Info Disclosure | mitigate | Every fetcher scopes queries on `tenant_id` from resolveWhoami (ep-05 cross-tenant run test). |
| T-204-08-02 | DoS | mitigate | --watch 5s cadence + 60-min cap + per-tenant rate-limit (Phase 201 middleware) + SIGINT clean exit (st-06). |
| T-204-08-03 | Info Disclosure | accept | recent_runs inherits Plan 06's listRuns column allow-list — brief_json/result_json never travel (ep-09 asserts secret bytes absent). |
| T-204-08-04 | Tampering | accept | --watch refreshes every 5s; stale rotation display bounded at 5s. |
| T-204-08-05 | Repudiation | accept | Status reads are read-only; resolveWhoami's last_used_at touch provides minimal observability. |
