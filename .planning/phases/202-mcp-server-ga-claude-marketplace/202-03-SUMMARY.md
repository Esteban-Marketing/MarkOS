---
phase: 202-mcp-server-ga-claude-marketplace
plan: 03
subsystem: mcp-cost-guard
tags: [mcp, cost-guard, budget, pricing, 402, upstash]
one_liner: "Cost-guard layer: 30-tool pricing table + 24h rolling budget RPC + JSON-RPC -32001 envelope + Upstash deps"
dependency_graph:
  requires:
    - "supabase/migrations/89_markos_mcp_cost_window.sql (Plan 202-01 — RPC signature)"
    - "lib/markos/audit/writer.cjs (Phase 201 Plan 02 — enqueueAuditStaging + source_domain='mcp' additive)"
  provides:
    - "lib/markos/mcp/cost-table.cjs (MODEL_RATES, COST_TABLE, caps, computeToolCost, estimateToolCost)"
    - "lib/markos/mcp/cost-meter.cjs (checkAndChargeBudget, trueupBudget, readCurrentSpendCents, buildBudgetExhaustedJsonRpcError)"
    - "package.json @upstash/redis + @upstash/ratelimit"
  affects:
    - "Plan 202-05 (tool pipeline — consumes cost-meter as admission gate)"
    - "Plan 202-06 (/settings/mcp dashboard — consumes readCurrentSpendCents + cap)"
tech_stack:
  added:
    - "@upstash/redis@^1.37.0"
    - "@upstash/ratelimit@^2.0.8"
  patterns:
    - "Static frozen cost-table keyed by tool_id + model_id (Object.freeze + integer cents)"
    - "Atomic RPC pattern (check_and_charge_mcp_budget) — admission gate with fail-closed on errors"
    - "Post-invocation trueup with effective-unbounded cap (accepts overage, next call blocked)"
    - "JSON-RPC server-defined error code -32001 for budget exhaustion (D-11)"
key_files:
  created:
    - "lib/markos/mcp/cost-table.cjs"
    - "lib/markos/mcp/cost-table.ts"
    - "lib/markos/mcp/cost-meter.cjs"
    - "lib/markos/mcp/cost-meter.ts"
    - "test/mcp/cost-table.test.js"
    - "test/mcp/cost-meter.test.js"
    - "test/mcp/402-breach.test.js"
  modified:
    - "package.json"
decisions:
  - "Free tier cap 100¢/day (D-21); paid tier cap 10000¢/day ($100 safety net until Phase 205 Stripe metering)"
  - "Opus 4.7 rates shipped as placeholder with explicit TODO: re-verify source comment (RESEARCH A4)"
  - "Trueup uses TRUEUP_CAP_CENTS = 2B cents — effectively unbounded; accepts post-invocation overage, next call blocked (per RESEARCH §cost Handler flow step 3)"
  - "checkAndChargeBudget rethrows on RPC error (fail-closed) — pipeline returns -32000 internal_error instead of silently admitting"
  - "All LLM math uses Math.ceil to guarantee integer cents (Number.isInteger enforced in test)"
metrics:
  duration: "~30 minutes"
  completed: "2026-04-17"
  tasks: 3
  commits: 5
  tests: 36
  files_created: 7
  files_modified: 1
---

# Phase 202 Plan 03: MCP Cost-Guard Summary

Ship the cost-guard layer for the MCP server: a static 30-tool pricing table (Sonnet 4.6 / Opus 4.7 / Haiku 4.5 per-1k cents), plan-tier caps (free 100¢ / paid 10000¢), a cost-meter library that calls the atomic `check_and_charge_mcp_budget` Postgres RPC and emits the `source_domain='mcp' action='tool.budget_exhausted'` audit on breach, and the JSON-RPC `-32001` envelope for structured 402 responses. Upstash dependencies installed so Plans 202-02 and 202-05 can import Redis + Ratelimit in parallel.

## Requirements Fulfilled

- **MCP-01** — MCP server GA scoped cost control (30-tool pricing + plan-tier caps + atomic RPC enforcement).
- **QA-10** — Cost telemetry + kill-switch (24h rolling budget + fail-closed + structured 402).

## Tasks Completed

| # | Task | Commit(s) | Tests |
|---|------|-----------|-------|
| 1 | cost-table.cjs + dual export + pricing test suite | f11718b (test) + 088a0c1 (impl) | 17 pass |
| 2 | cost-meter.cjs + dual export + RPC + audit test suite | de5a6b3 (test) + 51af0c3 (impl) | 11 pass |
| 3 | package.json Upstash deps + 402 envelope test suite | 758f2a1 | 8 pass |

**Total: 36 tests / 36 pass.**

## Contract Highlights

### cost-table.cjs

- `MODEL_RATES` (frozen): 3 Anthropic models in cents per 1K tokens
  - Sonnet 4.6: 0.30¢ / 1.50¢ in/out ($3/$15 per M)
  - Haiku 4.5: 0.10¢ / 0.50¢ in/out ($1/$5 per M)
  - Opus 4.7: 1.50¢ / 7.50¢ in/out — flagged `TODO: re-verify at plan time` per RESEARCH A4
- `COST_TABLE` (frozen): 30 entries — 16 LLM-backed + 14 non-LLM
- `FREE_TIER_CAP_CENTS = 100` (D-21 $1/day)
- `PAID_TIER_CAP_CENTS = 10000` ($100/day safety net per Q3)
- `computeToolCost(tool_id, usage)` uses `Math.ceil` → integer cents only
- `estimateToolCost(tool_id)` — base_cents for non-LLM; avg_tokens extrapolation for LLM
- `capCentsForPlanTier(plan_tier)` — 100 for 'free', 10000 otherwise

### cost-meter.cjs

- `checkAndChargeBudget(client, { tenant_id, tool_id, plan_tier, estimated_cents, ... })`
  - Resolves cap via `capCentsForPlanTier(plan_tier)`
  - Calls `supabase.rpc('check_and_charge_mcp_budget', { p_tenant_id, p_charge_cents, p_cap_cents })`
  - On `ok=false`: emits `enqueueAuditStaging` with `source_domain='mcp' action='tool.budget_exhausted'` + `{ tool_id, req_id, spent_cents, cap_cents, reset_at }` payload
  - Rethrows on RPC error (fail-closed)
- `trueupBudget(client, { tenant_id, tool_id, delta_cents })`
  - No-op when `delta_cents <= 0`
  - Otherwise charges delta via same RPC with `TRUEUP_CAP_CENTS` (2B cents) — accepts post-invocation overage
- `readCurrentSpendCents(client, tenant_id)` — sums `markos_mcp_cost_window.spent_cents` where `window_start > now() - interval '24h'`
- `buildBudgetExhaustedJsonRpcError(id, req_id, budget)` returns the exact wire envelope:
  ```json
  {
    "jsonrpc": "2.0",
    "id": <any>,
    "error": {
      "code": -32001,
      "message": "budget_exhausted",
      "data": { "error": "budget_exhausted", "reset_at": "...", "spent_cents": 100, "cap_cents": 100, "req_id": "..." }
    }
  }
  ```

### package.json

Added to `dependencies` (preserved alphabetical ordering + all Phase 201 entries untouched):
- `@upstash/ratelimit@^2.0.8`
- `@upstash/redis@^1.37.0`

Versions pinned from latest stable via `npm view <pkg> version` at plan execution time.

## Deviations from Plan

**None.** Plan executed exactly as written.

Notes on parallel Wave-1 coordination:
- Plan 202-01 landed its `fix(202-01): add 'mcp' to AUDIT_SOURCE_DOMAINS whitelist` commit (9e478c8) while this plan was mid-execution. That change is required for `enqueueAuditStaging({ source_domain: 'mcp' })` to pass `validateEntry` — both plans depended on it and Plan 202-01 owned the authoritative edit. No conflict occurred.
- Test mock for `enqueueAuditStaging` matches the real writer's staging table (`markos_audit_log_staging`) and the `.select().single()` chain — ensures tests exercise the real validator path.

## Verification Log

- `node --test test/mcp/cost-table.test.js test/mcp/cost-meter.test.js test/mcp/402-breach.test.js` → **36 pass / 0 fail**
- `node -e "const c=require('./lib/markos/mcp/cost-table.cjs'); console.log(Object.keys(c.COST_TABLE).length, c.FREE_TIER_CAP_CENTS, c.PAID_TIER_CAP_CENTS, c.capCentsForPlanTier('free'), c.capCentsForPlanTier('team'))"` → `30 100 10000 100 10000`
- `grep Object.freeze lib/markos/mcp/cost-table.cjs` → 2 matches (MODEL_RATES + COST_TABLE)
- `grep Math.ceil lib/markos/mcp/cost-table.cjs` → 1 match (integer-only cents)
- `grep "TODO: re-verify" lib/markos/mcp/cost-table.cjs` → 1 match (Opus 4.7 flag)
- `grep check_and_charge_mcp_budget lib/markos/mcp/cost-meter.cjs` → 2 matches (checkAndCharge + trueup)
- `grep "source_domain: 'mcp'" lib/markos/mcp/cost-meter.cjs` → 1 match
- `grep "code: -32001" lib/markos/mcp/cost-meter.cjs` → 1 match
- `grep TRUEUP_CAP_CENTS lib/markos/mcp/cost-meter.cjs` → 4 matches
- Regression: 202-01 session + rls + migration-idempotency suites → 25/25 pass
- Regression: pre-existing `test/mcp/server.test.js` → 11/11 pass
- `node -e "const p=require('./package.json'); if (!p.dependencies['@upstash/redis']||!p.dependencies['@upstash/ratelimit']||!p.dependencies['archiver']||!p.dependencies['@anthropic-ai/sdk']||!p.dependencies['@supabase/supabase-js']) process.exit(1); console.log('ok')"` → `ok`

## Threat Surface Coverage

All STRIDE threats from PLAN `<threat_model>` addressed:

| Threat ID | Disposition | Evidence |
|-----------|-------------|----------|
| T-202-03-01 (cost stampede) | mitigate | RPC `check_and_charge_mcp_budget` provides atomic row lock (Plan 202-01 migration 89) |
| T-202-03-02 (tampering via direct insert) | mitigate | RLS in migration 89 blocks direct writes; service-role fn is only path |
| T-202-03-03 (no audit on breach) | mitigate | cost-meter emits `tool.budget_exhausted` audit on every ok=false |
| T-202-03-04 (cross-tenant cache leak) | accept | RPC is per-call; readCurrentSpendCents filters by tenant_id |
| T-202-03-05 (float rounding → free tokens) | mitigate | `Math.ceil` enforced; `Number.isInteger(c)` test |
| T-202-03-06 (trueup bypasses cap) | accept | By design — next call blocked by post-trueup cap check in SQL fn |
| T-202-03-07 (outdated cost-table) | mitigate | Opus 4.7 `TODO: re-verify` source marker; Plan 202-10 verify script tracks |
| T-202-03-08 (RPC fails → unbounded admission) | mitigate | `checkAndChargeBudget` rethrows; pipeline catches and returns -32000 |

## Known Stubs

**None.** All functions are fully wired; cost-meter calls the real RPC and emits real audits. Opus 4.7 rates are a **placeholder value** (not a stub) flagged with an in-source `TODO: re-verify at plan time` comment that Plan 202-10 will verify via `scripts/mcp/verify-cost-table.mjs`.

## Self-Check: PASSED

- All 7 created files present on disk.
- All 5 commits present in `git log`.
- Full plan test suite (36 tests) green.
- Regression suites (session, rls, migration-idempotency, server) green.
- All 30 tool entries keyed correctly.
- All 3 Anthropic model rates present.
- Upstash deps installed + resolvable via package.json.
