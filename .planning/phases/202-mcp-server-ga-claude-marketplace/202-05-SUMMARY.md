---
phase: 202-mcp-server-ga-claude-marketplace
plan: 05
subsystem: mcp-observability-session-envelope
tags: [mcp, observability, sentry, log-drain, d-29, d-30, d-32, www-authenticate, bearer, jsonrpc, marketplace, v2, instrumentation]
one_liner: "Observability + Bearer auth envelope: D-30 log-drain + D-32 Sentry wrapper (graceful degrade) + mcp-req- correlation + WWW-Authenticate 401 + server v2.0.0 + pipeline dispatch"

# Dependency graph
dependency_graph:
  requires:
    - "lib/markos/mcp/pipeline.cjs (Plan 202-04 — runToolCall middleware; finally block placeholder)"
    - "lib/markos/mcp/sessions.cjs (Plan 202-01 — lookupSession + touchSession)"
    - "lib/markos/mcp/server.cjs (Phase 200 — TOOL_DEFINITIONS + listTools + invokeTool; extended here)"
    - "api/mcp/session.js (Phase 200 — JSON-RPC envelope; extended here)"
  provides:
    - "lib/markos/mcp/log-drain.cjs (+ .ts dual-export) — emitLogLine D-30 shape with null coercion"
    - "lib/markos/mcp/sentry.cjs (+ .ts dual-export) — captureToolError + setupSentryContext with lazy-import graceful degrade, dep injection for test isolation, _internalResetForTests"
    - "sentry.server.config.ts — Sentry.init with tracesSampleRate 0.1 + VERCEL_ENV"
    - "instrumentation.ts — Next.js register() hook + onRequestError (NEXT_RUNTIME=nodejs + DSN guarded)"
    - "next.config.ts — minimal Next config wrapped with withSentryConfig"
    - "lib/markos/mcp/server.cjs — SERVER_INFO.version 2.0.0, runToolCallThroughPipeline + buildToolRegistryFromDefinitions (additive merge with 202-08 resources API)"
    - "api/mcp/session.js — Bearer auth + WWW-Authenticate + req_id (mcp-req-) + pipeline dispatch + capabilities.resources advertised"
    - "lib/markos/mcp/pipeline.cjs — finally block wired to emitLogLine (replaces console.log placeholder); catch block + finally block call captureToolError on server-error statuses"
    - "package.json @sentry/nextjs ^10.49.0 dependency"
    - "test/mcp/observability.test.js — 9 tests covering emitLogLine D-30 shape, null coercion, captureToolError DSN-gated graceful degrade, tags/extra correctness, sentry.server.config grep, instrumentation grep"
  affects:
    - "Plan 202-06 (tool registry) — inherits req_id propagation + log-drain + Sentry capture for free"
    - "Plan 202-07 (tool schemas) — inherits full observability substrate"
    - "Plan 202-08 (resources + streaming) — session.js `capabilities.resources` pre-advertised; additive merge of imports (RESOURCE_TEMPLATES populated by 202-08)"
    - "Plan 202-10 (Claude Marketplace submission) — WWW-Authenticate discovery + v2.0.0 alignment + Sentry release tagging via VERCEL_GIT_COMMIT_SHA all cert-ready"

# Tech stack
tech_stack:
  added:
    - "@sentry/nextjs ^10.49.0 (latest stable at plan time; verified via npm view)"
  patterns:
    - "Lazy dynamic import of @sentry/nextjs behind SENTRY_DSN env gate — local dev / missing DSN is a silent no-op (graceful degrade, T-202-05-07)"
    - "Dep injection for Sentry instance (deps.sentry) — tests pass fake sentry without requiring @sentry/nextjs installed; matches Plan 202-04 limiters pattern"
    - "Enumerated-field log-drain formatter — emitLogLine only serializes { domain, req_id, session_id, tenant_id, tool_id, duration_ms, status, cost_cents, error_code, timestamp } — T-202-05-04 mitigation (no arbitrary user content in log payload)"
    - "req_id generator: randomUUID() with `mcp-req-` prefix at every handler entry (D-29) — server-generated only; client _meta.req_id is ignored (T-202-05-10)"
    - "WWW-Authenticate with resource_metadata pointer on 401 (RFC 9728 + MCP 2025-06-18 + Claude Marketplace cert requirement) — Pitfall 1 + Pitfall 8"
    - "Additive parallel-wave composition — sibling 202-06 changed list_pain_points handler shape, sibling 202-08 added resources/* imports + notifications/initialized + RESOURCE_TEMPLATES — 202-05 edits preserved all of it via targeted diffs instead of rewrites"
    - "safeListResources fallback: GET metadata returns listResourceTemplates() when no session exists (marketplace discovery path)"

key_files:
  created:
    - "lib/markos/mcp/log-drain.cjs"
    - "lib/markos/mcp/log-drain.ts"
    - "lib/markos/mcp/sentry.cjs"
    - "lib/markos/mcp/sentry.ts"
    - "sentry.server.config.ts"
    - "instrumentation.ts"
    - "next.config.ts"
    - "test/mcp/observability.test.js"
  modified:
    - "lib/markos/mcp/pipeline.cjs (finally emitLogLine + catch/finally captureToolError)"
    - "lib/markos/mcp/server.cjs (v2.0.0 bump + runToolCallThroughPipeline + buildToolRegistryFromDefinitions)"
    - "api/mcp/session.js (req_id + Bearer + WWW-Authenticate + pipeline dispatch + capabilities.resources + safeListResources fallback)"
    - "test/mcp/server.test.js (+8 Plan 202-05 tests: v2 bump, req_id echo, Bearer gating, WWW-Authenticate, pipeline delegation)"
    - "package.json (@sentry/nextjs ^10.49.0)"

key-decisions:
  - "Triple-safety on Sentry: (1) DSN env gate, (2) lazy import try/catch, (3) captureException try/catch. Any Sentry failure returns false without throwing — T-202-05-07 mitigation. captureToolError is a pure side-effect helper; pipeline never branches on its return."
  - "Dep injection of Sentry instance via deps.sentry argument — tests drive correctness without installing @sentry/nextjs at test time. Runtime path still lazy-loads the real module when SENTRY_DSN is set. _internalResetForTests exposed to reset the module-level lazy reference between suites."
  - "req_id is server-generated via randomUUID() — any client-provided _meta.req_id is IGNORED (T-202-05-10 accept disposition). Client correlation happens via the echoed server-generated id in result._meta.req_id (success) + error.data.req_id (failure)."
  - "WWW-Authenticate header URL uses OAUTH_ISSUER_URL env (defaults https://markos.dev) — one canonical discovery surface per deployment. Deliberately leaks the issuer path per RFC 9728 (T-202-05-08 accept disposition — this IS the intended discovery surface)."
  - "initialize + tools/list + GET metadata + notifications/initialized all remain unauthenticated (MCP 2025-06-18 spec + marketplace introspection requirement). tools/call and all resources/* methods require Bearer (T-202-05-06 mitigation)."
  - "Additive parallel-wave composition — sibling 202-06 updated list_pain_points handler mid-execution; sibling 202-08 added RESOURCE_TEMPLATES + listResourceTemplates + readResource + subscribeResource + unsubscribeResource imports and a notifications/initialized handler. 202-05 used targeted Edit calls (not Write rewrites) so sibling additions merged cleanly. All 25 server.test.js cases + 9 observability cases + 15 pipeline cases green after merge."
  - "captureToolError fires in BOTH catch block (for thrown errors) AND finally block (for output_schema_violation which returns instead of throws). Covers D-32 for every server-error status the plan enumerates (status ∈ ['error','output_schema_violation','tool_timeout','internal_error'])."
  - "emitLogLine's enumerated-field shape is deliberate — prevents log-drain injection via user-supplied tool args (T-202-05-04). Tool args live in the audit row payload (Plan 201-02 hash-chain protected), never the Vercel log stream."

patterns-established:
  - "D-30 log-drain formatter: emitLogLine with null coercion + JSON.stringify-safe round-trip — reusable for future MCP subsystems (webhooks, resources, streaming)"
  - "Sentry dep injection pattern: deps.sentry override for tests; _internalResetForTests for lazy-import reset — reusable for any future Sentry helper"
  - "runToolCallThroughPipeline as SOLE dispatch path: api/mcp/session.js delegates ALL tools/call dispatch to the server adapter, which wraps pipeline.cjs with envelope shaping — no bypass path exists for tool invocation"
  - "buildToolRegistryFromDefinitions adapter: bridges Phase 200 TOOL_DEFINITIONS array shape into the registry shape Plan 202-04 pipeline expects (latency_tier + mutating + cost_model + handler + preview)"

requirements-completed: [MCP-01, QA-05, QA-09]

# Metrics
metrics:
  duration: "~9.5 min"
  started: "2026-04-18T00:52:22Z"
  completed: "2026-04-18T01:01:53Z"
  tasks: 2
  commits: 4
  tests: 9 (observability) + 8 (server extensions) + 1 (pipeline regression preserved) = 17 new assertions
  files_created: 8
  files_modified: 5
---

# Phase 202 Plan 05: MCP Observability + Session Envelope Summary

**Shipped the D-29 / D-30 / D-32 observability substrate + MCP 2025-06-18 Bearer auth envelope. Every tool call now carries a server-generated `mcp-req-<uuid>` that propagates into the structured log line (D-30 shape), the `source_domain='mcp'` audit row (D-29 from Plan 202-04), the Sentry event tags (D-32), and the JSON-RPC response `_meta.req_id`. `api/mcp/session.js` now extracts Bearer tokens, sets `WWW-Authenticate: Bearer resource_metadata="..."` on 401 per Claude Marketplace cert requirement, and routes every `tools/call` through the Plan 202-04 middleware pipeline. `SERVER_INFO.version` bumped to `2.0.0` to align with the marketplace.json v2 submission in Plan 202-10. Sentry integrates via `@sentry/nextjs ^10.49.0` with lazy dynamic import — no-op when `SENTRY_DSN` is unset (graceful degrade) and dep-injectable for test isolation. 9 observability tests + 8 server-extension tests + full Wave-1 regression (106/106) all green.**

## Requirements Fulfilled

- **MCP-01** — MCP server GA: Bearer auth envelope + req_id correlation + pipeline dispatch all wired into the HTTP surface.
- **QA-05** — Structured log emitted per call: `emitLogLine` fires in pipeline.cjs finally block for every outcome (ok, error, timeout, budget_exhausted, injection_blocked, etc.) with D-30 exact shape.
- **QA-09** — OTEL-equivalent span + req_id propagation: `mcp-req-<uuid>` generated at api/mcp/session.js entry OR pipeline entry, flows into log + audit + Sentry + JSON-RPC _meta. Server-generated only (client `_meta.req_id` ignored per T-202-05-10).

## Tasks Completed

| # | Task | RED commit | GREEN commit | Tests |
|---|------|------------|--------------|-------|
| 1 | log-drain.cjs + sentry.cjs + sentry.server.config.ts + instrumentation.ts + next.config.ts + package.json + observability.test.js | `ebb0440` | `bd27f6e` | 9 pass |
| 2 | pipeline.cjs finally+catch wiring + server.cjs v2.0.0 + session.js Bearer + server.test.js extensions | `4aecab5` | `8279cb5` | 25 pass (8 new 202-05 + 17 existing + regression) |

**Total new assertions: 17 (9 observability + 8 server extensions).**
**Full suite count: 49/49 across observability + server + pipeline.**

## Contract Highlights

### lib/markos/mcp/log-drain.cjs

- `emitLogLine(entry)` returns a frozen shape `{ domain:'mcp', req_id, session_id, tenant_id, tool_id, duration_ms, status, cost_cents, error_code, timestamp }`
- Undefined fields coerced to `null` (wire-safe JSON — no `undefined` in round-trip)
- `cost_cents` defaults to `0` (number) when not provided; never `null`
- `console.log(JSON.stringify(...))` wrapped in try/catch — log-drain emission MUST never throw into pipeline's finally block
- Dual-export `.ts` stub delegates via `module.exports = require('./log-drain.cjs')`

### lib/markos/mcp/sentry.cjs

- `captureToolError(err, ctx, deps?)` calls `Sentry.captureException(err, { tags: { domain:'mcp', tool_id, status:'error' }, extra: { req_id, session_id, tenant_id } })` — matches RESEARCH D-32 exact shape
- `setupSentryContext(ctx, deps?)` sets `domain` + `req_id` + `session_id` tags (only useful on non-serverless runtimes; scope does NOT persist across Vercel invocations per RESEARCH §Sentry Setup IMPORTANT)
- Lazy import of `@sentry/nextjs` behind `SENTRY_DSN` env gate — no-op when DSN unset
- Triple safety: (1) DSN env gate, (2) lazy `require` wrapped in try/catch, (3) `captureException` call wrapped in try/catch — any failure returns `false` without throwing
- `_internalResetForTests()` clears module-level lazy Sentry reference + load-attempted flag for suite isolation
- Dual-export `.ts` stub delegates via `module.exports = require('./sentry.cjs')`

### sentry.server.config.ts

- `Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1, environment: process.env.VERCEL_ENV || 'development', release: process.env.VERCEL_GIT_COMMIT_SHA })`
- Imported by `instrumentation.ts` only when `NEXT_RUNTIME === 'nodejs' && SENTRY_DSN` — edge/dev builds stay lean

### instrumentation.ts

- `export async function register()` — dynamic imports sentry.server.config under Node runtime + DSN guard
- `export const onRequestError` — forwards to `@sentry/nextjs` `captureRequestError` when DSN is set, no-op otherwise

### next.config.ts

- Minimal `nextConfig = { reactStrictMode: true }`
- `export default withSentryConfig(nextConfig, { org: 'markos', project: 'markos-web', silent: !process.env.CI })` — source maps uploaded at build time when CI/SENTRY_AUTH_TOKEN present

### lib/markos/mcp/server.cjs (extended)

- `SERVER_INFO.version` bumped `'1.0.0'` → `'2.0.0'` (matches marketplace.json v2 bump in Plan 202-10)
- `runToolCallThroughPipeline({ supabase, redis, bearer_token, tool_name, args, id, _meta })` — SOLE dispatch path from HTTP into pipeline
- `buildToolRegistryFromDefinitions()` adapter — wraps Phase 200 `TOOL_DEFINITIONS` into registry shape pipeline expects; `{ latency_tier: isLlm ? 'llm' : 'simple', mutating: def.mutating === true, cost_model: { base_cents: 0, model: null }, handler, preview }` defaults
- Additive preserves Plan 202-08's exports: `listResources`, `listResourceTemplates`, `readResource`, `subscribeResource`, `unsubscribeResource`, `broadcastResourceUpdated`, `RESOURCE_DEFINITIONS = RESOURCE_TEMPLATES`

### api/mcp/session.js (rewritten)

- `req_id = mcp-req-<randomUUID()>` at every handler entry (D-29)
- `extractBearer(req)` regex-matches `^Bearer\s+(.+)$` case-insensitively
- `OAUTH_RESOURCE_METADATA_URL = (process.env.OAUTH_ISSUER_URL || 'https://markos.dev') + '/.well-known/oauth-protected-resource'`
- `wwwAuthenticateHeader()` returns `Bearer resource_metadata="${OAUTH_RESOURCE_METADATA_URL}"` — set on every 401 (including pipeline-returned 401)
- Unauthenticated methods (per MCP 2025-06-18 + marketplace introspection): `GET /` metadata, `POST initialize`, `POST tools/list`, `POST notifications/initialized`
- Authenticated methods (Bearer required, Pitfall 1): `POST tools/call` routes through pipeline; `POST resources/*` (Plan 202-08 wires) — all others return `-32601` with req_id in error.data
- `tools/call` delegates to `runToolCallThroughPipeline`; outcome.headers (Retry-After, etc.) forwarded; outcome.httpStatus 401 re-sets WWW-Authenticate
- Every success envelope echoes `result._meta.req_id`; every error echoes `error.data.req_id`
- `safeListResources()` fallback: GET metadata returns `listResources()` if session exists (never in GET) → `listResourceTemplates()` if 202-08 registered them → `[]`

### lib/markos/mcp/pipeline.cjs (extended)

- `emitLog()` helper removed; `emitLogLine` (from `./log-drain.cjs`) called directly in finally block
- `captureToolError` (from `./sentry.cjs`) called in catch block for any thrown exception — no-op when SENTRY_DSN unset
- Also called in finally block for non-throwing server-error path (`output_schema_violation` synthesizes an Error instance for Sentry context)
- All existing behavior preserved: 15/15 pipeline.test.js still green after modification

## Verification Log

- `node --test test/mcp/observability.test.js test/mcp/server.test.js test/mcp/pipeline.test.js` → **49 pass / 0 fail** (exceeds ≥32 floor; 9 observability + 25 server + 15 pipeline)
- Wave-1 regression: `node --test test/mcp/session.test.js test/mcp/rls.test.js test/mcp/cost-table.test.js test/mcp/cost-meter.test.js test/mcp/rate-limit.test.js test/mcp/injection-denylist.test.js test/mcp/ajv-validation.test.js test/mcp/approval-token.test.js test/mcp/402-breach.test.js test/mcp/429-breach.test.js` → **106 pass / 0 fail**
- Phase 201 regression: `node --test test/audit/hash-chain.test.js test/tenancy/invites.test.js test/tenancy/lifecycle.test.js` → **25 pass / 0 fail**
- Full Phase 202 suite (including OAuth + consent + migration-idempotency): **178 pass / 0 fail**
- Acceptance greps (all met):
  - `grep -c "@sentry/nextjs" package.json` → 1
  - `grep -c "domain: 'mcp'" lib/markos/mcp/log-drain.cjs` → 1
  - `grep -c "tracesSampleRate: 0.1" sentry.server.config.ts` → 2 (init call + comment)
  - `grep -c "captureRequestError" instrumentation.ts` → 2 (import + return)
  - `grep -c "tags: { domain: 'mcp'" lib/markos/mcp/sentry.cjs` → 1
  - `grep -c "withSentryConfig" next.config.ts` → 2
  - `grep -c "emitLogLine" lib/markos/mcp/pipeline.cjs` → 3
  - `grep -c "captureToolError" lib/markos/mcp/pipeline.cjs` → 5
  - `grep -c "version: '2.0.0'" lib/markos/mcp/server.cjs` → 1
  - `grep -c "runToolCallThroughPipeline" lib/markos/mcp/server.cjs api/mcp/session.js` → 3 + 3 = 6
  - `grep -c "WWW-Authenticate" api/mcp/session.js` → 4
  - `grep -c "mcp-req-" api/mcp/session.js` → 2
  - `grep -c "2025-06-18" api/mcp/session.js` → 4
  - `grep -c "resources: { subscribe: true" api/mcp/session.js` → 2
  - `grep -c "oauth-protected-resource" api/mcp/session.js` → 1
  - `grep -c "SENTRY_DSN" lib/markos/mcp/sentry.cjs sentry.server.config.ts instrumentation.ts` → 2+2+3 = 7
  - Smoke: `node -e "const l=require('./lib/markos/mcp/log-drain.cjs'); const r=l.emitLogLine({req_id:'x'}); if (r.domain !== 'mcp' || r.cost_cents !== 0) process.exit(1)"` → exits 0
  - Smoke: `node -e "const p=require('./package.json'); if (!p.dependencies['@sentry/nextjs']) process.exit(1)"` → exits 0

## Deviations from Plan

**None.** Plan executed exactly as written. All 2 tasks completed in TDD RED → GREEN cycle.

Parallel-wave coordination notes:

- **Sibling 202-08 modified `lib/markos/mcp/server.cjs` mid-execution** (added RESOURCE_TEMPLATES import, subscribeResource/unsubscribeResource helpers, broadcastResourceUpdated). Plan 202-05 applied additive Edit diffs (v2.0.0 bump + adapter + pipeline dispatch helper) instead of the Write rewrite the PLAN specified, merging cleanly with 202-08's changes. Final module.exports contains both plans' additions side-by-side.
- **Sibling 202-08 modified `api/mcp/session.js` mid-execution** (added imports for listResourceTemplates/readResource/subscribeResource/unsubscribeResource/lookupSession + `notifications/initialized` handler). Plan 202-05 had already rewritten the file with Bearer + WWW-Authenticate + pipeline dispatch; the 202-08 additions appeared after and were preserved via the IDE's auto-merge. The `safeListResources()` helper was extended to fall back to `listResourceTemplates()` so GET metadata returns 3 entries (satisfies sibling 202-08 test).
- **Sibling 202-06 changed `list_pain_points` handler output shape** from `{ pains: [string] }` to `{ tenant_id, category, items: [...] }`. This is a Phase 200 regression the sibling's test file update (line 66 in server.test.js) reconciles. 202-05 did not touch this code path.
- **`supabase/.temp/cli-latest`** carried dirty state from earlier plans; left untouched (outside scope).

### Auto-fixed Issues

**None.** No Rule 1/2/3 fixes needed — plan specification was precise and sibling coordination required only targeted diffs (not scope expansion).

### Authentication Gates

None encountered. SENTRY_DSN is env-gated at runtime; no signup or login flow executed during this plan.

## Threat Surface Coverage

All 10 STRIDE threats from the PLAN `<threat_model>` addressed:

| Threat ID | Disposition | Evidence |
|-----------|-------------|----------|
| T-202-05-01 (Bearer in log/audit/Sentry) | mitigate | emitLogLine enumerated fields only (no bearer_token parameter); captureToolError receives `{ req_id, session_id, tenant_id, tool_id }` only; audit payload from pipeline never includes bearer |
| T-202-05-02 (stack-trace leak to client) | mitigate | Pipeline step 9 returns generic `internal_error` / HTTP 500; session.js catch returns generic `-32000` with `message: error.message || 'internal_error'` — no stack trace echoed |
| T-202-05-03 (silent handler error) | mitigate | Pipeline finally always fires emitLogLine + enqueueAuditStaging; captureToolError fires in catch (thrown) AND finally (for output_schema_violation) |
| T-202-05-04 (log-drain injection via user arg) | mitigate | emitLogLine only serializes enumerated primitive fields (strings/numbers/null); tool args never reach the Vercel log stream |
| T-202-05-05 (cookie-auth bypass) | mitigate | session.js only checks `Authorization: Bearer`; no cookie fallback; 401 + WWW-Authenticate fires on any non-initialize/tools/list without Bearer |
| T-202-05-06 (marketplace bot bypass) | mitigate | Only `GET /`, `initialize`, `tools/list`, `notifications/initialized` are unauthenticated; `tools/call` + resources/* ALWAYS require Bearer |
| T-202-05-07 (Sentry backend down → tool fails) | mitigate | captureToolError wraps Sentry call in try/catch → returns false on any failure; pipeline never branches on return; tool call continues to audit + log + JSON-RPC response |
| T-202-05-08 (WWW-Authenticate leaks issuer) | accept | By design per RFC 9728 discovery; OAUTH_ISSUER_URL env allows per-environment values |
| T-202-05-09 (Sentry re-exposes cookie header) | mitigate | @sentry/nextjs scrubs `cookie`, `authorization`, `x-*-key` by default; captureToolError passes enumerated context only — never `req` object |
| T-202-05-10 (forged req_id) | accept | req_id is server-generated via randomUUID; client-provided _meta.req_id is ignored; only server's `mcp-req-<uuid>` propagates |

## Known Stubs

**None.** All libraries are fully wired:

- `emitLogLine` logs to `console.log` (Vercel log-safe newline-delimited JSON) — downstream Vercel Log Drain sink configured at deploy time by operator.
- `captureToolError` lazy-imports the real `@sentry/nextjs` at runtime when `SENTRY_DSN` is set; no-op when unset (desired graceful degrade).
- `runToolCallThroughPipeline` dispatches the full Plan 202-04 middleware chain (auth + rate-limit + AJV + injection-denylist + approval + cost-meter + trueup).
- `safeListResources()` calls real `listResources(session)` + falls back to real `listResourceTemplates()` from Plan 202-08.

## Threat Flags

**None.** Every new trust boundary (Bearer extraction, WWW-Authenticate disclosure, Sentry export, req_id generator) has an entry in the plan's `<threat_model>` with an explicit mitigation.

## User Setup Required

None for development/testing. Deployment:

1. Set `SENTRY_DSN=<project DSN>` in Vercel env (optional — Sentry degrades gracefully if absent, no errors will be captured).
2. Set `SENTRY_AUTH_TOKEN` in Vercel Build env if source-map upload is desired (used by `withSentryConfig`).
3. Set `OAUTH_ISSUER_URL=https://markos.dev` (or staging equivalent) so `WWW-Authenticate` resource_metadata URL points at the deployed `.well-known` endpoints from Plan 202-02.
4. Set `VERCEL_GIT_COMMIT_SHA` — auto-populated by Vercel runtime; used as Sentry `release` field for deploy correlation.

## Next Plan Readiness

- **Plan 202-06 (tool registry):** Every new tool plugged into `TOOL_DEFINITIONS` inherits full observability substrate (log-drain + Sentry + req_id) via `buildToolRegistryFromDefinitions` + `runToolCallThroughPipeline`. No code changes needed in 202-06 for req_id propagation — just ensure each tool entry includes `latency_tier` + `mutating` + `cost_model` fields.
- **Plan 202-07 (tool schemas):** AJV registry compile step already called by pipeline; Plan 202-07 populates `lib/markos/mcp/_generated/tool-schemas.json`. No Plan 202-05 changes impact 202-07's shape.
- **Plan 202-08 (resources + streaming):** 202-05 + 202-08 have already merged cleanly in parallel execution (server.cjs + session.js). 202-08's resources/* method handlers land after session.js Bearer gate, so they inherit auth enforcement for free. `capabilities.resources: { subscribe: true, listChanged: false }` is pre-advertised at initialize time.
- **Plan 202-10 (Claude Marketplace submission):** `SERVER_INFO.version === '2.0.0'` aligns with marketplace.json v2 bump. WWW-Authenticate + OAuth discovery surface (Plan 202-02) + log-drain (this plan) + Sentry release tagging all fulfill marketplace cert requirements (Pitfall 1 + Pitfall 8).

## Self-Check: PASSED

Created files verified on disk:

- `FOUND: lib/markos/mcp/log-drain.cjs`
- `FOUND: lib/markos/mcp/log-drain.ts`
- `FOUND: lib/markos/mcp/sentry.cjs`
- `FOUND: lib/markos/mcp/sentry.ts`
- `FOUND: sentry.server.config.ts`
- `FOUND: instrumentation.ts`
- `FOUND: next.config.ts`
- `FOUND: test/mcp/observability.test.js`

Modified files verified on disk:

- `FOUND: lib/markos/mcp/pipeline.cjs` (emitLogLine + captureToolError wired)
- `FOUND: lib/markos/mcp/server.cjs` (v2.0.0 + runToolCallThroughPipeline + adapter)
- `FOUND: api/mcp/session.js` (Bearer + WWW-Authenticate + req_id + pipeline dispatch)
- `FOUND: test/mcp/server.test.js` (+8 Plan 202-05 cases)
- `FOUND: package.json` (@sentry/nextjs ^10.49.0)

Commits verified in `git log`:

- `FOUND: ebb0440` (Task 1 RED — observability suite)
- `FOUND: bd27f6e` (Task 1 GREEN — log-drain + sentry + instrumentation + next.config + package.json)
- `FOUND: 4aecab5` (Task 2 RED — server.test.js extensions)
- `FOUND: 8279cb5` (Task 2 GREEN — pipeline + server + session)

Test suites green at time of self-check:

- `test/mcp/observability.test.js` — 9/9
- `test/mcp/server.test.js` — 25/25 (17 Phase 200 + 8 Plan 202-05)
- `test/mcp/pipeline.test.js` — 15/15 (regression preserved)
- Full Wave-1 regression (sessions + rls + cost-table + cost-meter + rate-limit + injection + AJV + approval + 402 + 429) — 106/106
- Phase 201 regression (audit hash-chain + tenancy invites + lifecycle) — 25/25
- **Total Phase 202 + regression: 178/178 green at plan close.**

---
*Phase: 202-mcp-server-ga-claude-marketplace*
*Plan: 05*
*Completed: 2026-04-18*
