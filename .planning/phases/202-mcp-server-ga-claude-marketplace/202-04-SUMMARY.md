---
phase: 202-mcp-server-ga-claude-marketplace
plan: 04
subsystem: mcp-pipeline
tags: [mcp, rate-limit, ajv, injection-denylist, approval-token, pipeline, upstash, middleware]
one_liner: "10-step MCP tool-call middleware pipeline + rate-limit + strict AJV registry + approval-token + prompt-injection deny-list"

dependency_graph:
  requires:
    - "lib/markos/mcp/sessions.cjs (Plan 202-01 — lookupSession + touchSession)"
    - "lib/markos/mcp/cost-meter.cjs (Plan 202-03 — checkAndChargeBudget + trueupBudget + buildBudgetExhaustedJsonRpcError)"
    - "lib/markos/mcp/cost-table.cjs (Plan 202-03 — estimateToolCost + computeToolCost)"
    - "lib/markos/audit/writer.cjs (Phase 201 Plan 02 — enqueueAuditStaging + 'mcp' in AUDIT_SOURCE_DOMAINS from Plan 202-01 fix)"
    - "package.json @upstash/redis + @upstash/ratelimit (Plan 202-03 pre-added)"
  provides:
    - "lib/markos/mcp/rate-limit.cjs — Upstash sliding-window 60 rpm/session + 600 rpm/tenant (D-17)"
    - "lib/markos/mcp/injection-denylist.cjs — 12 regex patterns + NFKC normalization + nested walk (D-14 / Pitfall 6)"
    - "lib/markos/mcp/ajv.cjs — strict AJV registry + ajv-formats + lazy-loaded tool-schemas.json (D-13 / D-14)"
    - "lib/markos/mcp/approval.cjs — 5-min Redis token with GETDEL one-time semantics (D-03 / D-16)"
    - "lib/markos/mcp/pipeline.cjs — 10-step middleware chain + per-tier timeouts + finally audit (RESEARCH Pattern 1)"
    - "package.json ajv-formats ^3.0.1 dep"
  affects:
    - "Plan 202-05 (tool pipeline consumes runToolCall — currently satisfied by this plan's pipeline.cjs)"
    - "Plans 202-06 / 202-07 (tools plug into toolRegistry arg — inherit full middleware for free)"

tech_stack:
  added:
    - "ajv-formats ^3.0.1 (for date-time / email / uri / uuid validation)"
  patterns:
    - "Single frozen Ajv instance with strict:true + strictSchema:true + strictTypes:true + coerceTypes:false + removeAdditional:false + useDefaults:false"
    - "Upstash Ratelimit.slidingWindow memoized at module scope; test-injectable via { perSession, perTenant } shape override"
    - "Redis approval-token with SET NX EX 300 + GETDEL consume (atomic one-time) + payload binds session.id + tool_name"
    - "NFKC Unicode normalization before regex test (defeats fullwidth Latin + confusables per Pitfall 6)"
    - "Compute-budget timeout per latency_tier (simple=30s, llm=120s, long=300s) via Promise.race with explicit clearTimeout"
    - "finally-block audit emission with action derived from status — always fires, never blocks response (best-effort .catch)"
    - "Pipeline dep injection via toolRegistry arg — the pipeline is the sole entrypoint to handlers (no bypass)"

key_files:
  created:
    - "lib/markos/mcp/rate-limit.cjs"
    - "lib/markos/mcp/rate-limit.ts"
    - "lib/markos/mcp/injection-denylist.cjs"
    - "lib/markos/mcp/injection-denylist.ts"
    - "lib/markos/mcp/ajv.cjs"
    - "lib/markos/mcp/ajv.ts"
    - "lib/markos/mcp/approval.cjs"
    - "lib/markos/mcp/approval.ts"
    - "lib/markos/mcp/pipeline.cjs"
    - "lib/markos/mcp/pipeline.ts"
    - "test/mcp/rate-limit.test.js"
    - "test/mcp/429-breach.test.js"
    - "test/mcp/injection-denylist.test.js"
    - "test/mcp/ajv-validation.test.js"
    - "test/mcp/approval-token.test.js"
    - "test/mcp/pipeline.test.js"
  modified:
    - "package.json (+ajv-formats ^3.0.1)"
    - "package-lock.json (lockfile resolution)"

decisions:
  - "STEP_NAMES frozen at 10 in RESEARCH order — pipeline.cjs is the contract that tools in 202-06/07 plug into."
  - "Pipeline passes a SINGLE `redis` arg to both checkRateLimit and issueApprovalToken/checkApprovalToken. In production these share one Upstash connection; in tests a combined mock exposes `perSession`/`perTenant` alongside `set`/`get`/`getdel`. Documented as Rule 1 deviation in the test fixture."
  - "Rate-limit module memoizes real-Redis limiters at module scope BUT accepts test-injection via { perSession, perTenant } shape probe before falling back to memoized/env-constructed Redis. Keeps tests hermetic without mocking @upstash/redis."
  - "AJV module lazy-loads `_generated/tool-schemas.json` with try/catch fallback to empty registry — Plan 202-07 generates it. Tests drive compileToolSchemas() directly."
  - "Approval step returns `{ ok: true, result: { preview, approval_token } }` on the FIRST mutating call (not a JSON-RPC error). The MCP client handles this as a two-phase commit: client shows preview → user approves → client sends second call with `args.approval_token` → pipeline commits. Second call with invalid/stale token returns -32602 approval_required (400)."
  - "finally-block audit action derived from status: 'tool.invoked' (ok), 'tool.approval_issued' (approval_pending), 'tool.<status>' otherwise. Every outcome leaves an audit row — including tool handler throws, timeout, budget_exhausted, injection_blocked, etc."

metrics:
  duration: "~9 minutes (558s)"
  started: "2026-04-18T00:35:56Z"
  completed: "2026-04-18T00:45:14Z"
  tasks: 3
  commits: 7
  tests: 59
  files_created: 16
  files_modified: 2

requirements-completed: [MCP-01, QA-02, QA-11, QA-12]
---

# Phase 202 Plan 04: MCP Tool-Call Middleware Pipeline Summary

Shipped the middleware + input-safety layer for MCP tool invocations. `pipeline.cjs` implements the 10-step chain from 202-RESEARCH Pattern 1 — auth → rate_limit → tool_lookup → validate_input → free_tier → approval → cost → invoke → validate_output → trueup — with Upstash sliding-window rate limiting (60 rpm/session + 600 rpm/tenant), strict AJV validation (no coercion, no additionalProperties, no defaults), Redis-backed approval-token one-time consume (GETDEL), NFKC-normalized prompt-injection deny-list (12 patterns covering fullwidth Latin + Llama/ChatML tokens + jailbreak keywords), and per-tier compute budgets (30s / 120s / 300s). The `finally` block always fires a structured log line (D-30) + `source_domain='mcp'` audit row with action derived from status, so every outcome (happy path, timeout, budget breach, injection block, handler throw) leaves a trace in the hash-chain.

## Requirements Fulfilled

- **MCP-01** — Tool dispatch admission control (rate-limit + approval + cost gate all converge here).
- **QA-02** — Typed HTTP boundary: every response is either `{ ok: true, result, req_id, cost_cents }` or `{ ok: false, jsonRpcError, httpStatus, req_id }` (+ optional `headers` for 429 Retry-After).
- **QA-11** — STRIDE prompt-injection defense: AJV strict + 12-pattern deny-list with NFKC normalization.
- **QA-12** — Rate-limit + platform baseline: per-session + per-tenant aggregate caps defeat session-rotation bypass (T-202-04-03).

## Tasks Completed

| # | Task | RED commit | GREEN commit | Tests |
|---|------|------------|--------------|-------|
| 1 | rate-limit + injection-denylist + approval + 4 test suites | `a31ca6a` | `a2d1c95` | 33 pass |
| 2 | AJV strict registry + ajv-formats dep + 1 test suite | `bec41e7` | `0c947cc` | 11 pass |
| 3 | pipeline 10-step middleware + 1 test suite | `2043686` | `c819455` | 15 pass |

**Total: 59 tests / 59 pass.**

## Contract Highlights

### rate-limit.cjs

- `SESSION_RPM = 60`, `TENANT_RPM = 600` (D-17).
- `checkRateLimit(redis, session)` calls both limiters in parallel (`Promise.all`); session-scope failures beat tenant-scope in reporting since per-session is the tighter bound.
- Returns `{ ok: true }` or `{ ok: false, reason, scope, retry_after, limit, error_429: Error { http, headers, body } }`.
- `buildRateLimitedJsonRpcError(id, req_id, { scope, retry_after, limit })` produces the wire envelope:
  ```json
  { "jsonrpc": "2.0", "id": ..., "error": { "code": -32002, "message": "rate_limited", "data": { "error": "rate_limited", "scope", "retry_after", "limit", "req_id" } } }
  ```
- Test-injectable: pass `{ perSession, perTenant }` instead of a Redis instance; real path memoizes `Ratelimit.slidingWindow` at module scope.

### injection-denylist.cjs

- 12 frozen regex patterns — covers instruction-frame resets (`ignore previous instructions`, `disregard above`), system-role injections (`system: you are`), model tokens (`[INST]`, `<|im_start|>`, `<|im_end|>`), mode-escalation (`sudo mode`, `enable developer mode`), jailbreak keywords (`jailbreak`, `you are now dan`), and prompt-leak probes (`reveal your system prompt`).
- `checkInjectionDenylist(args)` uses a generator `walk()` to descend nested objects + arrays, NFKC-normalizes each string via `.normalize('NFKC').toLowerCase()` BEFORE regex test (Pitfall 6 — defeats fullwidth Latin confusables).
- Returns `{ key: 'drafts[1].body', pattern: 'ignore\\s+...' }` on first match; `null` otherwise.
- Non-string values (numbers, booleans, null) skipped explicitly.

### ajv.cjs

- Single shared Ajv instance with `STRICT_OPTS` frozen — strict, strictSchema, strictTypes, allErrors:false, useDefaults:false, removeAdditional:false, coerceTypes:false.
- `addFormats(ajv)` adds date-time / email / uri / uuid format validators.
- `compileToolSchemas({ [tool_id]: { input, output } })` clears cache + registers schemas at `${tool_id}.input` / `${tool_id}.output` + caches compiled validators.
- `getToolValidator(tool_id)` returns `{ validateInput, validateOutput }` or throws `no_validator:<tool_id>`.
- Lazy-loads `_generated/tool-schemas.json` via try/catch — Plan 202-07 generates it; absence falls back to empty registry (module still loadable).

### approval.cjs

- `APPROVAL_TTL_SECONDS = 300` (D-03 5-minute preview→commit window).
- `issueApprovalToken(redis, session, tool_name, args)` generates `randomBytes(16).toString('hex')` (32-char), stores payload `{ session_id, tool_name, args_digest: sha256(canonicalized args), issued_at }` via `SET key value EX 300 NX`. Key = `approval:<session_id>:<token>`.
- `checkApprovalToken(redis, token, session, tool_name)` uses `GETDEL` (native Upstash) — single-round-trip atomic consume (Pitfall 3 one-time). Returns true only if stored payload.session_id AND payload.tool_name match the request. Fallback `GET → DEL` path for test/custom mocks that lack `getdel`.
- Token is bound to both session.id AND tool_name → stolen tokens fail cross-session.

### pipeline.cjs

- `runToolCall({ supabase, redis, bearer_token, tool_name, args, id, _meta, toolRegistry })`.
- `req_id = mcp-req-<uuid>` generated at entry (D-29 prefix).
- `STEP_NAMES` frozen at 10 entries in RESEARCH order.
- `TIMEOUT_MS = { simple: 30_000, llm: 120_000, long: 300_000 }` (D-20).
- Per-step short-circuit codes:
  - Step 1 auth failure → `-32600 invalid_token` / HTTP 401
  - Step 2 rate-limit → `-32002 rate_limited` / HTTP 429 + `Retry-After` header
  - Step 3 tool lookup → `-32601 tool_not_found` / HTTP 404
  - Step 4a input → `-32602 invalid_tool_input` / HTTP 400 (+ AJV errors in data)
  - Step 4b injection → `-32602 injection_detected` / HTTP 400 (+ key + pattern in data)
  - Step 5 free-tier write gate → `-32001 paid_tier_required` / HTTP 402
  - Step 6 approval: FIRST call returns `{ ok: true, result: { preview, approval_token } }` (not an error); SECOND call with invalid token → `-32602 approval_required` / HTTP 400
  - Step 7 cost → `-32001 budget_exhausted` / HTTP 402 (via `buildBudgetExhaustedJsonRpcError`)
  - Step 8 invoke → `-32000 tool_timeout` / HTTP 504 on timeout; any other throw → `-32000 internal_error` / HTTP 500
  - Step 9 output schema violation → `-32000 internal_error` / HTTP 500 (GENERIC to client; details go to audit/Sentry per D-32)
  - Step 10 trueup → charge actual-minus-estimated delta (no-op if ≤ 0)
- `finally` block:
  - `emitLog({ domain: 'mcp', timestamp, req_id, session_id, tenant_id, tool_id, duration_ms, status, cost_cents, error_code })` — D-30 placeholder; Plan 202-05 wires Sentry + log-drain.
  - `enqueueAuditStaging` with `source_domain='mcp'`, action derived from status (`tool.invoked`, `tool.approval_issued`, `tool.<status>`). Wrapped in `.catch(() => {})` so audit failures never leak to caller.

## Verification Log

- `node --test test/mcp/rate-limit.test.js test/mcp/429-breach.test.js test/mcp/injection-denylist.test.js test/mcp/ajv-validation.test.js test/mcp/approval-token.test.js test/mcp/pipeline.test.js` → **59 pass / 0 fail** (exceeds ≥ 56 acceptance floor)
- Regression suites:
  - `test/mcp/session.test.js test/mcp/cost-meter.test.js test/mcp/cost-table.test.js test/mcp/402-breach.test.js test/mcp/rls.test.js test/mcp/migration-idempotency.test.js test/mcp/server.test.js` → **77/77 pass** (plans 202-01/02/03 + prior MCP server)
  - `test/audit/hash-chain.test.js` → **7/7 pass** (Phase 201 audit fabric)
- `grep -c "SESSION_RPM = 60" lib/markos/mcp/rate-limit.cjs` → 1
- `grep -c "TENANT_RPM = 600" lib/markos/mcp/rate-limit.cjs` → 1
- `grep -c "slidingWindow" lib/markos/mcp/rate-limit.cjs` → 2
- `grep -c "code: -32002" lib/markos/mcp/rate-limit.cjs` → 2 (inline envelope + comment annotation)
- `grep -c "normalize('NFKC')" lib/markos/mcp/injection-denylist.cjs` → 1 (Pitfall 6)
- `grep -c "APPROVAL_TTL_SECONDS = 300" lib/markos/mcp/approval.cjs` → 1 (D-03)
- `grep -cE "getdel|GETDEL" lib/markos/mcp/approval.cjs` → 4 (native call + fallback branch + comment + reference)
- `grep -c "strict: true" lib/markos/mcp/ajv.cjs` → 1
- `grep -c "coerceTypes: false" lib/markos/mcp/ajv.cjs` → 1
- `grep -c "removeAdditional: false" lib/markos/mcp/ajv.cjs` → 1
- `grep -c "useDefaults: false" lib/markos/mcp/ajv.cjs` → 1
- `grep -c "addFormats" lib/markos/mcp/ajv.cjs` → 2
- `grep -c "STEP_NAMES" lib/markos/mcp/pipeline.cjs` → 2
- `grep -c "TIMEOUT_MS" lib/markos/mcp/pipeline.cjs` → 3
- `grep -c "mcp-req-" lib/markos/mcp/pipeline.cjs` → 1 (D-29 prefix)
- `grep -c "source_domain: 'mcp'" lib/markos/mcp/cost-meter.cjs lib/markos/mcp/pipeline.cjs` → 2 (audit emission ties across plans)
- `grep -cE "\-32000" lib/markos/mcp/pipeline.cjs` → 3 (internal_error + tool_timeout + output_schema_violation)
- `node -e "const p=require('./package.json'); if (!p.dependencies['ajv-formats']) process.exit(1); console.log(p.dependencies['ajv-formats'])"` → `^3.0.1`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Pipeline test fixture used tool_ids absent from COST_TABLE**

- **Found during:** Task 3 GREEN run (4 of 15 tests failing before fix)
- **Issue:** The PLAN-as-written test fixture defined `safe_tool` and `unsafe_tool` via `compileToolSchemas`, but `COST_TABLE` in `lib/markos/mcp/cost-table.cjs` (Plan 202-03) is `Object.freeze`d and contains no entries for those names. Pipeline step 7 calls `estimateToolCost(tool_name)` which throws `no_cost:safe_tool`; the throw lands in the catch block and returns `-32000 internal_error` / HTTP 500 — masking step-specific assertions (cost test expected 402, got 500; happy-path expected ok:true, got false; approval test couldn't read `r.result.approval_token` because `r.ok` was false).
- **Fix:** Replaced the fixture names with real COST_TABLE entries — `query_canon` (non-mutating, `base_cents: 0`, `model: null`) for all step-1..4 / 7..9 tests, and `schedule_post` (mutating, `base_cents: 2`) available for mutating-specific tests. `mutating` flag is still supplied via the per-test `toolRegistry` entry so step 5 / 6 coverage remains intact.
- **Files modified:** `test/mcp/pipeline.test.js` only — pipeline.cjs behavior unchanged.
- **Verification:** 15/15 pipeline tests green after fix.
- **Committed in:** `c819455` (same commit as pipeline.cjs GREEN — single atomic change).

**2. [Rule 1 — Bug] Pipeline passes a single `redis` arg; test fixture split it into two mocks**

- **Found during:** Task 3 GREEN run (after Fix 1, approval tests still failed)
- **Issue:** The PLAN-as-written fixture produced a `limiters` object (`{ perSession, perTenant }`) for `checkRateLimit` AND a separate `redis` object (`{ set, get, del, getdel }`) for approval — but `runToolCall({ redis: s.limiters, ... })` only received the former. `issueApprovalToken(redis, ...)` then called `redis.set(...)` which was `undefined` and threw, again short-circuiting the happy-path / approval / second-call tests into the 500 catch-block.
- **Fix:** Merged both surfaces into a single `limiters` mock that exposes `perSession`, `perTenant`, `set`, `get`, `del`, `getdel`. Matches production posture (one Upstash Redis connection serves both Ratelimit and KV usage). Pipeline.cjs unchanged.
- **Files modified:** `test/mcp/pipeline.test.js` only.
- **Verification:** 15/15 pipeline tests green after fix.
- **Committed in:** `c819455` (same commit as Fix 1).

### Auth Gates

None encountered.

---

**Total deviations:** 2 auto-fixed (2 Rule 1 test-fixture bugs).
**Impact on plan:** Zero impact on shipped library behavior. The two fixes touch only the test scenario builder; pipeline.cjs is byte-identical to the PLAN specification. No new deps, no threat-model expansion, no additional DB or API changes.

## Issues Encountered

- `supabase/.temp/cli-latest` was pre-modified in working tree (carried from Plan 202-01). Left untouched — outside this plan's scope.
- Fullwidth-Latin NFKC test case for injection deny-list required care: raw CYRILLIC CAPITAL LETTER I (U+0406) does NOT fold to ASCII under NFKC (distinct scripts), so the test uses fullwidth Latin (`Ｉｇｎｏｒｅ`) which DOES fold. Documented in-line in the test case comment.

## User Setup Required

None — this plan is server-side libraries + pipeline. Environment variables `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` MUST be set in Vercel before the real rate-limit + approval paths execute in production (covered by Plan 202-10 operator checklist); cron lazy-constructs via `Redis.fromEnv()`, so absence fails-loud at first tool call (desired fail-closed posture).

## Threat Surface Coverage

All 11 STRIDE threats from the PLAN's `<threat_model>` addressed:

| Threat ID | Disposition | Evidence |
|-----------|-------------|----------|
| T-202-04-01 (prompt injection) | mitigate | `checkInjectionDenylist` w/ NFKC + 12 patterns; `injection-denylist.test.js` validates fullwidth-Latin fold |
| T-202-04-02 (output schema drift) | mitigate | AJV `validateOutput` step 9 — returns generic `internal_error` to client, details to audit |
| T-202-04-03 (rate-limit bypass via session rotation) | mitigate | Per-tenant 600 rpm aggregate; `rate-limit.test.js` covers tenant-scope breach |
| T-202-04-04 (approval-token replay) | mitigate | Redis `GETDEL` atomic consume; `approval-token.test.js` asserts second-use returns false |
| T-202-04-05 (free-tier write elevation) | mitigate | Pipeline step 5 pre-approval + pre-cost gate; `pipeline.test.js` covers free + mutating → 402 |
| T-202-04-06 (session-rotation approval spoof) | mitigate | `approval:<session.id>:<token>` key + payload.session_id cross-check; `approval-token.test.js` covers cross-session reject |
| T-202-04-07 (handler hang past latency budget) | mitigate | `withTimeout(tool.latency_tier, ...)` with explicit clearTimeout on both resolve + reject paths |
| T-202-04-08 (error internals leak) | mitigate | Step 9 returns `{ code: -32000, message: 'internal_error', data: { req_id } }` — no handler exception text |
| T-202-04-09 (tool error without audit) | mitigate | `finally` block `enqueueAuditStaging` fires on every outcome; `pipeline.test.js` covers handler-throw → audit still lands |
| T-202-04-10 (AJV schema-evolution drift) | mitigate | `strict + strictSchema + strictTypes` rejects unknown keywords at compile time; `ajv-validation.test.js` enforces |
| T-202-04-11 (bearer token in rate-limit key) | mitigate | `rl:mcp:session:<session.id>` uses the `mcp-sess-<hex16>` id (NOT the bearer token); token hash stays in DB |

## Known Stubs

**None.** All libraries are fully wired. The two forward-looking placeholders are explicitly documented:

1. `_generated/tool-schemas.json` lazy-load returns `{}` when absent — Plan 202-07 generates it. Behavior: every `getToolValidator` call throws `no_validator:<id>` until that plan ships, which is the desired fail-closed posture during bring-up.
2. `emitLog(...)` uses `console.log(JSON.stringify(...))` per D-30 — Plan 202-05 wires Sentry + structured log-drain formatter. Current path remains Vercel log-safe (newline-delimited JSON).

## Threat Flags

None. Every new trust boundary (rate-limit key scope, approval-token storage, AJV registry, pipeline entrypoint) has an entry in the plan's `<threat_model>` with an explicit mitigation.

## Next Phase Readiness

- **Plan 202-05 (tool pipeline + per-call audit + Sentry):** `runToolCall` is the admission gate; 202-05 wires Sentry + log-drain and replaces `emitLog`'s `console.log` with the structured sink. No API changes needed.
- **Plan 202-06 (/settings/mcp UI):** Exposes approval queue via `listSessionsFor*` (Plan 202-01); pipeline's `source_domain='mcp'` audit trail gives the dashboard its read surface (via Phase 201 F-88 tenant-audit-query).
- **Plan 202-07 (tool registry + schemas):** `compileToolSchemas` hook is the integration point. The build script generates `lib/markos/mcp/_generated/tool-schemas.json`, and each tool's `{ name, latency_tier, mutating, cost_model, handler, preview }` entry plugs into `toolRegistry` passed to `runToolCall`.
- **Plan 202-08 / 202-09 / 202-10 (observability + docs + verifier):** All existing — pipeline structured logs + audit rows give SLO instrumentation for free.

## Self-Check: PASSED

Created files verified on disk:

- `FOUND: lib/markos/mcp/rate-limit.cjs`
- `FOUND: lib/markos/mcp/rate-limit.ts`
- `FOUND: lib/markos/mcp/injection-denylist.cjs`
- `FOUND: lib/markos/mcp/injection-denylist.ts`
- `FOUND: lib/markos/mcp/ajv.cjs`
- `FOUND: lib/markos/mcp/ajv.ts`
- `FOUND: lib/markos/mcp/approval.cjs`
- `FOUND: lib/markos/mcp/approval.ts`
- `FOUND: lib/markos/mcp/pipeline.cjs`
- `FOUND: lib/markos/mcp/pipeline.ts`
- `FOUND: test/mcp/rate-limit.test.js`
- `FOUND: test/mcp/429-breach.test.js`
- `FOUND: test/mcp/injection-denylist.test.js`
- `FOUND: test/mcp/ajv-validation.test.js`
- `FOUND: test/mcp/approval-token.test.js`
- `FOUND: test/mcp/pipeline.test.js`

Commits verified in git log:

- `FOUND: a31ca6a` (Task 1 RED: rate-limit + injection + approval tests)
- `FOUND: a2d1c95` (Task 1 GREEN: rate-limit + injection + approval libraries)
- `FOUND: bec41e7` (Task 2 RED: AJV tests)
- `FOUND: 0c947cc` (Task 2 GREEN: AJV + ajv-formats dep)
- `FOUND: 2043686` (Task 3 RED: pipeline tests)
- `FOUND: c819455` (Task 3 GREEN: pipeline + test fixture fixes)

Test suites green at time of self-check:

- `test/mcp/rate-limit.test.js` — 9/9
- `test/mcp/429-breach.test.js` — 3/3
- `test/mcp/injection-denylist.test.js` — 15/15
- `test/mcp/ajv-validation.test.js` — 11/11
- `test/mcp/approval-token.test.js` — 7/7 (tally: `APPROVAL_TTL` + issue + store-key + GETDEL-once + wrong-tool + wrong-session + unknown-token = 7)
- `test/mcp/pipeline.test.js` — 15/15 (STEP_NAMES + TIMEOUT_MS + 13 step / scenario tests)
- **Full Plan 202-04 suite: 59/59** (exceeds ≥ 56 acceptance floor)
- Regression: Plans 202-01/02/03 suites — **77/77 pass**
- Regression: Phase 201 audit hash-chain — **7/7 pass**

---
*Phase: 202-mcp-server-ga-claude-marketplace*
*Plan: 04*
*Completed: 2026-04-18*
