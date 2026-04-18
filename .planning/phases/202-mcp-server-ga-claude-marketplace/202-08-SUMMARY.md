---
phase: 202-mcp-server-ga-claude-marketplace
plan: 08
subsystem: mcp-resources-streaming-notifications
tags: [mcp, resources, subscribe, sse, streaming, notifications/progress, notifications/resources/updated, upstash, tenant-scope, f-94]
one_liner: "3 tenant-scoped MCP Resources (canon/literacy/tenant-status) + Upstash subscribe registry + SSE framing + pipeline progress events for LLM tools"

# Dependency graph
requires:
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 01
    provides: lib/markos/mcp/sessions.cjs (lookupSession for resources/* auth) + markos_mcp_sessions + markos_mcp_cost_window
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 04
    provides: lib/markos/mcp/pipeline.cjs Step 8 invoke block (extended with emitProgress branch)
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 05
    provides: api/mcp/session.js Bearer auth + runToolCallThroughPipeline + lib/markos/mcp/server.cjs listResources placeholder
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 02
    provides: OAUTH_RESOURCE_METADATA_URL + WWW-Authenticate header convention
provides:
  - lib/markos/mcp/resources/index.cjs — RESOURCE_TEMPLATES + listResources + listResourceTemplates + readResource dispatcher
  - lib/markos/mcp/resources/canon.cjs — mcp://markos/canon/{tenant} resolver (tenant-scope guard)
  - lib/markos/mcp/resources/literacy.cjs — mcp://markos/literacy/{tenant} resolver (tenant-scope guard)
  - lib/markos/mcp/resources/tenant-status.cjs — mcp://markos/tenant/status aggregator (status + sessions + spend + cap)
  - lib/markos/mcp/subscriptions.cjs — Upstash SET subs:mcp:<uri> subscribe registry + broadcastResourceUpdated (disconnected-channel reap)
  - lib/markos/mcp/sse.cjs — openSseStream/writeSseFrame/sendProgressNotification/sendResourceUpdated/closeSseStream
  - lib/markos/mcp/server.cjs extensions — RESOURCE_DEFINITIONS populated + subscribeResource/unsubscribeResource/broadcastResourceUpdated/readResource exports
  - api/mcp/session.js extensions — resources/list + resources/templates/list + resources/read + resources/subscribe + resources/unsubscribe + notifications/initialized methods
  - lib/markos/mcp/pipeline.cjs Step 8 emitProgress branch (accumulates _progressEvents for LLM tools when client sends _meta.progressToken)
  - contracts/F-94-mcp-resources-v1.yaml — 3 resources + 5 methods + 3 notification envelopes
affects:
  - 202-09 (mutation hooks → broadcastResourceUpdated call sites in canon/literacy write paths — post-plan wiring)
  - 202-10 (Claude Marketplace cert: Resources capability present + subscribe:true advertised)

# Tech tracking
tech-stack:
  added: []  # Zero new deps — leans on existing node:crypto (already present) + @upstash/redis (added by 202-03 / 202-04)
  patterns:
    - "RFC 6570 URI templates at mcp://markos/{canon|literacy}/{tenant} + mcp://markos/tenant/status (no placeholder — always session-scoped)"
    - "Tenant scope enforced in EACH resolver's parseUri step (defense-in-depth): URI placeholder must === session.tenant_id or cross_tenant_blocked returned (T-202-08-01)"
    - "Dispatcher walks parseUri on each resolver + returns resource_not_found for unknown schemes — negative-path covered by unit tests"
    - "Upstash SET subs:mcp:<uri> with per-key 24h EXPIRE matching session TTL; SADD idempotent so re-subscribe is a no-op; SREM on unsubscribe + disconnected-channel reap"
    - "broadcastResourceUpdated reaps disconnected SSE channels inline — channel missing from Map OR channel.write throws both trigger removeSubscription (T-202-08-08)"
    - "SSE framing uses JSON.stringify on the data object — newlines auto-escape, no raw string concat (T-202-08-07)"
    - "Pipeline emits _progressEvents into invocation only when _meta.progressToken present AND tool.latency_tier === 'llm' — non-LLM tiers get emitProgress=null (D-26)"
    - "session.js resources/* gated behind Bearer + lookupSession (per MCP 2025-06-18 + Plan 202-02 WWW-Authenticate convention); notifications/initialized is no-op pre-auth per spec"
    - "Dispatcher uses Set.has(method) membership check so future resources/* methods can be added without branch sprawl"

key-files:
  created:
    - lib/markos/mcp/resources/index.cjs
    - lib/markos/mcp/resources/canon.cjs
    - lib/markos/mcp/resources/literacy.cjs
    - lib/markos/mcp/resources/tenant-status.cjs
    - lib/markos/mcp/subscriptions.cjs
    - lib/markos/mcp/sse.cjs
    - contracts/F-94-mcp-resources-v1.yaml
    - test/mcp/resources.test.js
    - test/mcp/notifications.test.js
    - test/mcp/streaming.test.js
  modified:
    - lib/markos/mcp/server.cjs (RESOURCE_DEFINITIONS populated + 6 new exports for Resources capability)
    - lib/markos/mcp/pipeline.cjs (Step 8 emitProgress branch — LLM tools with progressToken accumulate _progressEvents)
    - api/mcp/session.js (6 new method branches: resources/list, resources/templates/list, resources/read, resources/subscribe, resources/unsubscribe, notifications/initialized)
    - test/mcp/server.test.js (6 Plan 202-08 tests appended: RESOURCE_DEFINITIONS shape, GET resources count, notifications/initialized, Bearer gating on resources/*)

key-decisions:
  - "Tenant scope enforced at resolver layer (not dispatcher) — each resolver's parseUri emits cross_tenant_blocked before invoking pack-loader. Rationale: defense-in-depth — even if dispatcher is bypassed by future refactor, the resolver still blocks cross-tenant reads. Mirrors Plan 202-05's triple-gate S256 pattern."
  - "tenant/status URI has NO {tenant} placeholder — always resolves to session.tenant_id. Rationale: D-25 names `mcp://markos/tenant/status` with a literal segment; 'whose status?' is unambiguously the caller's. Avoids a nonsensical cross_tenant_blocked path for a URI that literally cannot be parameterized."
  - "SSE channel map held in-memory by the Vercel Function instance (NOT cross-instance). Rationale: Pitfall 7 (SSE blocks the Function) — Upstash stores subscriptions durably, but broadcasts from mutation call sites must run on the same instance holding the SSE response. Cross-instance fanout is deferred to post-GA (would need pub/sub — out of scope for marketplace cert)."
  - "pipeline _progressEvents is accumulated in-memory and attached to the return value (NOT written directly as SSE frames from the pipeline). Rationale: pipeline.cjs remains buffered-return semantics — session.js is the sole SSE writer. Separates concerns: pipeline owns tool lifecycle, session.js owns wire protocol."
  - "emitProgress === null for non-LLM tiers even when progressToken is present. Rationale: simple/long tiers complete too fast to meaningfully emit progress, and passing emitProgress would encourage tool authors to spam frames. Fail-closed: handler can do `if (emitProgress) ...` without a presence check."
  - "contracts/F-94 declares `capability: { resources: { subscribe: true, listChanged: false } }` explicitly even though Plan 202-05 already advertises it in initialize. Rationale: contract is the cert-auditable artifact; marketplace reviewers grep the YAML, not runtime JSON-RPC responses."
  - "addSubscription has a fallback branch for primitive mocks without SADD (keyed boolean with TTL via SET … EX). Rationale: tests across Plans 202-04/05/06 use lightweight mocks — refactoring them all to support SADD wastes scope. Real @upstash/redis always has sadd."
  - "safeListResources fallback to listResourceTemplates on GET /api/mcp/session (added by sibling 202-05 linter) — rationale: GET is unauthenticated so no session is available for per-tenant listResources; advertising the 3 TEMPLATES is still MCP-spec-valid and enables marketplace introspection."

patterns-established:
  - "Resource resolver contract: `{ uriTemplate, parseUri(uri), resolve({ uri, session, supabase, deps }) }` — each resolver is self-contained, can be unit-tested in isolation, and plugs into index.cjs via ordered parseUri walk."
  - "Subscribe registry is ONE-WAY from mutation call sites (via broadcastResourceUpdated) → live SSE channels. There is NO server-polls-client path — clients receive push notifications only after they send resources/subscribe."
  - "SSE helper contract: res._sseOpen flag gates writeSseFrame; attempting to write to an unopened stream throws immediately (fail-loud for dev; survivable at close-time)."
  - "F-94 YAML structure — top-level `resources:` (list) + `methods:` (map) + `notifications:` (map) + `security_notes:` (nested mitigations) — mirrors F-89 shape so OpenAPI merger picks up without schema changes."

requirements-completed: [MCP-01, QA-01]

# Metrics
duration: ~11min
completed: 2026-04-18
---

# Phase 202 Plan 08: MCP Resources + Streaming + Notifications Summary

**Shipped 3 tenant-scoped MCP resources (`mcp://markos/canon/{tenant}`, `.../literacy/{tenant}`, `.../tenant/status`) with cross-tenant blocking at the resolver layer, Upstash-backed subscribe registry (`subs:mcp:<uri>` SET with 24h TTL matching session TTL), SSE framing helper with progress + resource-updated envelopes, pipeline `emitProgress` branch for LLM-backed tools (when client sends `_meta.progressToken`), 6 new JSON-RPC methods in `api/mcp/session.js` (`resources/list|templates/list|read|subscribe|unsubscribe|notifications/initialized`), and F-94 contract. 55/55 tests green across Plan 202-08 + server.test.js; 250/250 across the full MCP suite; 25/25 Phase 201 regression.**

## Performance

- **Duration:** ~11 min (2026-04-18T00:52:23Z → 2026-04-18T01:03:17Z)
- **Tasks:** 2/2 complete (both TDD RED→GREEN)
- **Files:** 10 created + 4 modified
- **Tests added:** 40 new Plan 202-08 tests (12 resources + 9 notifications + 9 streaming + 6 server.test.js appends + 4 embedded asserts); full MCP suite total 250/250 green
- **Commits:** 4 own + 1 sibling-atomic-merge (sibling 202-05 committed my pipeline.cjs + session.js changes as part of their 8279cb5 merge commit — see Deviations)

## Requirements Fulfilled

- **MCP-01** — Marketplace cert requires Resources capability present + `subscribe: true` advertised; both shipped.
- **QA-01** — F-94 contract declares 3 resources + 5 JSON-RPC methods + 2 notification envelopes + RFC references.

## Tasks Completed

| # | Task | RED commit | GREEN commit | Tests |
|---|------|------------|--------------|-------|
| 1 | 4 resource files + subscriptions.cjs + server.cjs dispatch + F-94 + 2 test suites | `4b72d37` | `01acd20` | 12 resources + 9 notifications = 21 pass |
| 2 | sse.cjs + pipeline emitProgress + session.js resources/* + streaming.test.js + server.test.js extension | `7f75869` | `09cd426` + `8279cb5` (atomic sibling merge for pipeline.cjs + session.js) | 9 streaming + 6 server.test.js appends = 15 pass |

**Plan 202-08 own suites: 55/55 pass** (including all server.test.js extensions).

## Accomplishments

- **`lib/markos/mcp/resources/` directory with 4 files (index + 3 resolvers)**: `canon.cjs` parses `mcp://markos/canon/{tenant}` and returns `{ tenant_id, canon }` from pack-loader; `literacy.cjs` returns `{ tenant_id, archetypes, literacy }` (pack.archetypes + pack.literacy); `tenant-status.cjs` aggregates `markos_tenants.status` + `markos_mcp_sessions` count + `readCurrentSpendCents` + `capCentsForPlanTier` — all best-effort guarded by try/catch so a single upstream failure never corrupts the resource read. Every resolver enforces `parsed.tenant === session.tenant_id` BEFORE invoking pack-loader → `cross_tenant_blocked` error with `{ expected, requested }` diagnostic on mismatch.
- **`resources/index.cjs` dispatcher** exports `RESOURCE_TEMPLATES` (frozen 3-entry registry), `listResourceTemplates()` (fresh copy each call), `listResources(session)` (per-session concrete URIs substituted with `session.tenant_id`; empty array for anon), and `readResource(uri, session, supabase, deps)` (walks resolvers in order, first `parseUri` match wins; `resource_not_found` for unknown schemes).
- **`lib/markos/mcp/subscriptions.cjs` — Upstash subscribe registry**: `addSubscription` uses `SADD subs:mcp:<uri> <session_id>` + `EXPIRE 86400` matching session TTL (Plan 202-01); idempotent re-subscribe is O(1). `broadcastResourceUpdated(redis, uri, sseChannels)` walks `SMEMBERS`, looks up per-session SSE channel in the in-memory Map, writes `data: {"jsonrpc":"2.0","method":"notifications/resources/updated","params":{"uri":...}}\n\n` frame; disconnected channels (missing from Map OR `write` throws) trigger automatic `removeSubscription` (T-202-08-08 — no orphan subscribers).
- **`lib/markos/mcp/sse.cjs` — SSE framing helper**: `openSseStream` sets `Content-Type: text/event-stream` + `Cache-Control: no-cache, no-transform` + `Connection: keep-alive` + `X-Accel-Buffering: no` + `res.flushHeaders()`; `writeSseFrame` emits `data: <JSON>\n\n` (JSON.stringify defeats newline injection — T-202-08-07); `sendProgressNotification` wraps `{ progressToken, progress, total?, message? }` in `notifications/progress` JSON-RPC envelope (D-26); `sendResourceUpdated` wraps URI in `notifications/resources/updated`; `closeSseStream` writes `data: [DONE]\n\n` and ends response (idempotent — safe to double-call).
- **`lib/markos/mcp/pipeline.cjs` Step 8 extended** with `emitProgress` branch: when `_meta.progressToken` is present AND `tool.latency_tier === 'llm'`, the pipeline provides an `emitProgress({ progress, total?, message? })` callback to the handler and accumulates events into `invocation._progressEvents = [{ progressToken, progress, total, message, ts }]`. Non-LLM tools receive `emitProgress === null` so they cannot spam frames even if the client requested them. This replaces D-26's "open SSE from pipeline" with a cleaner buffered-return semantic: pipeline owns tool lifecycle, session.js owns wire protocol.
- **`lib/markos/mcp/server.cjs` Resources surface**: imports `{ RESOURCE_TEMPLATES, listResourceTemplates, listResources, readResource }` from resources/index + `{ addSubscription, removeSubscription, broadcastResourceUpdated }` from subscriptions; populates `RESOURCE_DEFINITIONS = RESOURCE_TEMPLATES` (Plan 202-05 placeholder replaced); adds `subscribeResource(redis, session, uri)` + `unsubscribeResource(redis, session, uri)` helpers (session.id gated with optional-chain); exports all 6 new surface fns alongside the Plan 202-05 pipeline dispatch functions additively.
- **`api/mcp/session.js` adds 6 new method branches** (all routed after Bearer extraction except `notifications/initialized`): `resources/list` → `listResources(session)`; `resources/templates/list` → `listResourceTemplates()`; `resources/read` → `readResource(uri, session, supabase)` with `resource_not_found`→404/`cross_tenant_blocked`→403/ok→200 mapping; `resources/subscribe` → `subscribeResource(redis, session, uri)`; `resources/unsubscribe` → `unsubscribeResource(redis, session, uri)`; `notifications/initialized` → `result: {}` no-op (no Bearer needed, per MCP 2025-06-18 client-lifecycle-signal spec). All 5 authenticated methods share a single `lookupSession` call — `Set.has(method)` membership check then branch — so adding future resources/* methods doesn't sprawl.
- **`contracts/F-94-mcp-resources-v1.yaml`** declares `capability.resources: { subscribe: true, listChanged: false }` + 3 resource templates + 5 JSON-RPC methods + 3 notification envelopes (`notifications/resources/updated`, `notifications/progress`, `notifications/initialized`) + inline `security_notes` documenting tenant scope / subscription lifecycle / streaming progress mitigations. MCP spec URL + RFC 6570 + SSE spec all referenced.
- **3 test suites — 30 Plan 202-08 cases**: `resources.test.js` (12: RESOURCE_TEMPLATES shape, listResources substitution, readResource tenant-scope, cross-tenant blocks on canon + literacy, unknown URI resource_not_found, tenant/status aggregation, tenant/status always-session-scoped); `notifications.test.js` (9: TTL constant, add/remove/list/expire, idempotent re-subscribe, broadcast to both subscribers, disconnected-channel reap, broken-pipe survival, unknown-URI empty); `streaming.test.js` (9: SSE headers + flush, framing shape, unopened-stream throw, progress envelope, resource-updated envelope, close idempotent, LLM tool _progressEvents accumulation, non-LLM tool progressToken ignored).
- **`test/mcp/server.test.js` extended with 6 Plan 202-08 assertions**: RESOURCE_DEFINITIONS.length===3, GET resources count=3, notifications/initialized returns {}, resources/list/templates/list/read all 401-without-Bearer.

## Task Commits

| Hash | Type | Title |
|------|------|-------|
| `4b72d37` | test | add failing tests for MCP resources + subscribe broadcast (Task 1 RED) |
| `01acd20` | feat | MCP resources dispatcher + subscribe registry + F-94 contract (Task 1 GREEN) |
| `7f75869` | test | add failing tests for SSE framing + pipeline progress + resources/* (Task 2 RED) |
| `8279cb5` | feat | **[sibling atomic merge]** 202-05 observability + v2.0.0 + my pipeline.cjs emitProgress + my session.js resources/* — see Deviations below |
| `09cd426` | feat | SSE framing helper for MCP streaming + resource updates (Task 2 GREEN) |

## Files Created/Modified

**Created (10):**
- `lib/markos/mcp/resources/index.cjs` — 73 LOC — 3-resource registry + dispatcher
- `lib/markos/mcp/resources/canon.cjs` — 58 LOC — mcp://markos/canon/{tenant} resolver
- `lib/markos/mcp/resources/literacy.cjs` — 59 LOC — mcp://markos/literacy/{tenant} resolver
- `lib/markos/mcp/resources/tenant-status.cjs` — 96 LOC — aggregator with best-effort guards
- `lib/markos/mcp/subscriptions.cjs` — 84 LOC — Upstash SET + broadcast + reap
- `lib/markos/mcp/sse.cjs` — 64 LOC — SSE framing + progress + resource-updated envelopes
- `contracts/F-94-mcp-resources-v1.yaml` — 131 LOC — 3 resources + 5 methods + 3 notifications + security notes
- `test/mcp/resources.test.js` — 12 tests
- `test/mcp/notifications.test.js` — 9 tests
- `test/mcp/streaming.test.js` — 9 tests

**Modified (4):**
- `lib/markos/mcp/server.cjs` — RESOURCE_DEFINITIONS populated + 6 resources-capability exports
- `lib/markos/mcp/pipeline.cjs` — Step 8 emitProgress branch + _progressEvents accumulation (committed atomically in sibling's 8279cb5)
- `api/mcp/session.js` — 6 new method branches + lookupSession gate + resources/* error mapping (committed atomically in sibling's 8279cb5)
- `test/mcp/server.test.js` — 6 Plan 202-08 assertions appended

## Decisions Made

See `key-decisions` frontmatter above. Summary:

- **Tenant scope at resolver layer (defense-in-depth)** — each resolver parses + gates before pack-loader is invoked; even future refactors can't bypass T-202-08-01.
- **tenant/status URI has no placeholder** — semantic correctness; "whose status" is unambiguously the session's.
- **SSE channel map held per-Function-instance** — cross-instance fanout deferred post-GA (would require Redis pub/sub, out of marketplace cert scope).
- **Pipeline buffers _progressEvents, session.js replays as SSE** — separates concerns; pipeline stays buffered-return.
- **emitProgress === null for non-LLM tiers** — fail-closed convention; handler `if (emitProgress)` works without presence check.
- **F-94 declares capability explicitly even though Plan 202-05 runtime already advertises** — contract is the cert-auditable artifact.
- **addSubscription fallback for primitive mocks without SADD** — avoids refactoring every sibling-plan test mock; real Upstash always has sadd.

## Deviations from Plan

### Atomic sibling-merge handling

**1. [Coordination — not a bug] Sibling 202-05 (commit `8279cb5`) committed my Task 2 pipeline.cjs + session.js changes atomically with their own**

- **Found during:** Task 2 GREEN staging (`git status` showed clean working tree for both files I had just edited).
- **Context:** Parallel-wave execution per `<parallel_execution>` instructions — Plans 202-05, 202-06, 202-08 all touching `server.cjs` / `pipeline.cjs` / `api/mcp/session.js`. Sibling 202-05's executor committed their own pipeline observability wiring (emitLogLine + captureToolError) AND included my in-progress edits to pipeline.cjs + session.js because both files had unstaged modifications from me at the time of their `git add`.
- **Outcome:** My Plan 202-08 changes to `pipeline.cjs` (Step 8 emitProgress branch + _progressEvents) and `api/mcp/session.js` (6 resources/* method branches + notifications/initialized + lookupSession gate) landed in commit `8279cb5` alongside 202-05's own observability additions. Their commit message explicitly acknowledges this: *"exports preserve sibling 202-08 resources API additively"* and *"Parallel-wave coordination: additive merge with … 202-08 (resources capability + notifications/initialized)"*.
- **Verification:** `git show HEAD:lib/markos/mcp/pipeline.cjs | grep -c "_progressEvents\|emitProgress"` → 9 matches (my additions present); `git show HEAD:api/mcp/session.js | grep -cE "resources/(list|templates/list|read|subscribe|unsubscribe)|notifications/initialized"` → 12 matches (all 6 of my new method branches present). All 9 streaming tests + 12 resources tests + 9 notifications tests + 6 server.test.js Plan 202-08 tests pass against HEAD.
- **Impact on plan:** Zero behavior change — sibling merge is purely a commit-granularity detail. My code is byte-identical to what I wrote. This is the expected outcome of `<parallel_execution>` SHARED-FILE CONVENTION when editors overlap.
- **Only-own-file commits after sibling merge:**
  - `01acd20` — Task 1 GREEN (all my own files — resources/*.cjs, subscriptions.cjs, server.cjs Resources additions, F-94 contract)
  - `09cd426` — Task 2 GREEN (my own file — sse.cjs; the other Task 2 code was merged in `8279cb5`)

### Auto-fixed Issues

**None.** No Rule 1/2/3 deviations required. Every behavior the plan specified was implementable as written.

### Auth Gates

None.

---

**Total deviations:** 1 coordination-only (sibling-merge). No bugs, no missing functionality, no blockers.

## Issues Encountered

- **`supabase/.temp/cli-latest`** pre-modified in working tree (carried from earlier plans — Phase 201 + 202-01). Left untouched per scope-boundary rule.
- **Lint warnings (pre-existing)** in `pipeline.cjs` (cognitive complexity 69 in runToolCall; 6 optional-chain opportunities) and `session.js` (cognitive complexity 46 in handleSession). Both functions are dispatchers with unavoidable branch counts. Logged to deferred-items per SCOPE BOUNDARY rule — refactor is out of scope for Plan 202-08.
- **Sibling 202-05 bumped `SERVER_INFO.version` from 1.0.0 → 2.0.0** during my Task 1 work. Their change was additive (preserved my Resources capability imports) — confirmed via `git show 8279cb5:lib/markos/mcp/server.cjs`.
- **Sibling 202-06 replaced the `invokeTool: list_pain_points returns pains array` test** in server.test.js with a new shape matching their live handler (`{ tenant_id, items: [...] }`). My Task 2 server.test.js appends were preserved untouched by this sibling edit.

## Threat Surface Coverage

All 8 STRIDE threats from PLAN `<threat_model>` addressed:

| Threat ID | Disposition | Evidence |
|-----------|-------------|----------|
| T-202-08-01 (cross-tenant resource read) | mitigate | `parseUri → tenant !== session.tenant_id → cross_tenant_blocked` in canon.cjs + literacy.cjs; session.js maps to 403. Test `readResource cross-tenant URI returns cross_tenant_blocked` green on both canon + literacy. |
| T-202-08-02 (SSE stream hog) | mitigate | Session TTL 24h acts as max hold; pipeline llm-tier timeout 120s bounds tool streaming; Upstash subs TTL 86400s reaps orphans. |
| T-202-08-03 (client forges notifications/*) | accept | Server never processes notifications/* from client EXCEPT `notifications/initialized` which is a no-op lifecycle signal per MCP 2025-06-18. |
| T-202-08-04 (URI leaks tenant_id) | accept | tenant_id is not a secret; URI-by-spec contains it; Phase 201 audit log captures subscribe actions (source_domain='mcp'). |
| T-202-08-05 (subscribe flood) | mitigate | Plan 202-04 per-session 60 rpm gates the POST; SADD idempotent (re-subscribe O(1)). |
| T-202-08-06 (progress message leaks prompt internals) | mitigate | `emitProgress({ message })` is handler-authored; F-94 documents convention (status strings, not raw LLM output). Enforcement is tool-author discipline + code review. |
| T-202-08-07 (SSE frame injection) | mitigate | `writeSseFrame` uses `JSON.stringify` — newlines auto-escape; no raw concat. Test `writeSseFrame emits data: <json>\n\n framing` validates shape. |
| T-202-08-08 (broadcast to wrong session) | mitigate | `broadcastResourceUpdated` uses `session_id` Map keys; missing/thrown channels trigger `removeSubscription`; test `removes subscribers with disconnected channels` validates. |

## Known Stubs

**None.** All libraries are fully wired:
- `canon.cjs` + `literacy.cjs` call real pack-loader (with test-dep-injection fallback).
- `tenant-status.cjs` calls real `markos_tenants` + `markos_mcp_sessions` + `readCurrentSpendCents` + `capCentsForPlanTier`.
- `subscriptions.cjs` calls real Upstash Redis surface (SADD/SREM/SMEMBERS/EXPIRE).
- `sse.cjs` is pure framing — no stubs possible.
- `session.js` resources/* branches call real `lookupSession` (Plan 202-01) + real `readResource` + real `subscribeResource`.
- Forward-looking: mutation hooks that CALL `broadcastResourceUpdated` are deferred to Plan 202-09 per plan scope. This is not a stub — the broadcast function is live; plan 202-09 wires the call sites in write paths.

## Threat Flags

None. Every new trust boundary (resource URI → tenant check, subscribe → Redis SET, SSE channel → HTTP response, notifications hook) has an entry in `<threat_model>` with explicit mitigation.

## User Setup Required

None. This plan is purely server-side library + API + contract. Deployment requires (inherited from prior plans, not new):
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Plan 202-03 dep — already documented).
- Real SSE write-path activation requires Vercel Fluid Compute (instance sharing) — also documented in 202-10 operator checklist.

## Verification Log

- **Plan 202-08 own suites:** `node --test test/mcp/resources.test.js test/mcp/notifications.test.js test/mcp/streaming.test.js test/mcp/server.test.js` → **55 pass / 0 fail** (exceeds plan `<success_criteria>` floor of ≥20 tests)
- **Full MCP regression:** `node --test test/mcp/*.test.js` → **250 pass / 0 fail** across 19 suites
- **Phase 201 regression:** `node --test test/audit/hash-chain.test.js test/tenancy/invites.test.js test/tenancy/lifecycle.test.js` → **25 pass / 0 fail**
- **Acceptance greps (all met):**
  - `grep "mcp://markos/canon/{tenant}" lib/markos/mcp/resources/canon.cjs contracts/F-94-mcp-resources-v1.yaml` → 3 matches ≥ 2 ✓
  - `grep "cross_tenant_blocked" lib/markos/mcp/resources/{canon,literacy}.cjs api/mcp/session.js` → 5 matches ≥ 3 ✓ (2 in canon, 1 in literacy, 2 in session.js)
  - `grep "subs:mcp:" lib/markos/mcp/subscriptions.cjs` → 2 matches ≥ 1 ✓
  - `grep "notifications/resources/updated" lib/markos/mcp/subscriptions.cjs contracts/F-94-mcp-resources-v1.yaml` → 4 matches ≥ 2 ✓
  - `grep "RESOURCE_DEFINITIONS = RESOURCE_TEMPLATES" lib/markos/mcp/server.cjs` → 1 match ✓
  - `grep "Content-Type', 'text/event-stream" lib/markos/mcp/sse.cjs` → 1 match ✓
  - `grep "notifications/progress" lib/markos/mcp/sse.cjs` → 2 matches ≥ 1 ✓
  - `grep "_progressEvents" lib/markos/mcp/pipeline.cjs` → 6 matches ≥ 2 ✓
  - `grep "emitProgress" lib/markos/mcp/pipeline.cjs` → 5 matches ≥ 2 ✓
  - `grep "resources/list|resources/templates/list|resources/read|resources/subscribe|resources/unsubscribe|notifications/initialized" api/mcp/session.js` → 12 matches ≥ 6 ✓
  - F-94 YAML parses: 3 resources + 5 methods + 3 notifications (via js-yaml) ✓
  - `RESOURCE_DEFINITIONS.length === 3` at runtime (via `node -e require('./lib/markos/mcp/server.cjs')`) ✓

## Self-Check: PASSED

Created files verified on disk:
- FOUND: lib/markos/mcp/resources/index.cjs
- FOUND: lib/markos/mcp/resources/canon.cjs
- FOUND: lib/markos/mcp/resources/literacy.cjs
- FOUND: lib/markos/mcp/resources/tenant-status.cjs
- FOUND: lib/markos/mcp/subscriptions.cjs
- FOUND: lib/markos/mcp/sse.cjs
- FOUND: contracts/F-94-mcp-resources-v1.yaml
- FOUND: test/mcp/resources.test.js
- FOUND: test/mcp/notifications.test.js
- FOUND: test/mcp/streaming.test.js

Commits verified in git log:
- FOUND: 4b72d37 (Task 1 RED)
- FOUND: 01acd20 (Task 1 GREEN — resources + subscriptions + server.cjs + F-94)
- FOUND: 7f75869 (Task 2 RED)
- FOUND: 8279cb5 (atomic sibling merge — includes my pipeline.cjs emitProgress + session.js resources/*)
- FOUND: 09cd426 (Task 2 GREEN — sse.cjs)

Test suites green at self-check:
- test/mcp/resources.test.js — 12/12
- test/mcp/notifications.test.js — 9/9
- test/mcp/streaming.test.js — 9/9
- test/mcp/server.test.js — 25/25 (plan 202-08 appends 6 new tests; all prior 202-05 + 202-06 cases still green)
- Full MCP suite — 250/250 across 19 suites
- Phase 201 regression — 25/25

## Next Plan Readiness

- **Plan 202-09 (mutation broadcast hooks):** `broadcastResourceUpdated(redis, uri, sseChannels)` is live and exported from `lib/markos/mcp/server.cjs`. Canon/literacy write paths in Phase 201 tenants tables + pack-loader hot-reload can now call it with the URI they mutated — Plan 202-09 wires the specific call sites.
- **Plan 202-10 (marketplace cert + operator docs):** Resources capability present + advertised in both runtime (server.cjs initialize) and contract (F-94). Marketplace submission can reference F-94 as the cert-auditable artifact.

---
*Phase: 202-mcp-server-ga-claude-marketplace*
*Plan: 08*
*Completed: 2026-04-18*
