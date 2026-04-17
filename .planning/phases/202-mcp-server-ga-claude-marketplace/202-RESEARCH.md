# Phase 202: MCP Server GA + Claude Marketplace Launch — Research

**Researched:** 2026-04-17
**Domain:** MCP 2025-06-18 specification (OAuth 2.1 + PKCE + Resources + streaming), Vercel Functions / Log Drains / Rolling Releases, Upstash Ratelimit, @sentry/nextjs, AJV strict validation, Claude Marketplace, VS Code MCP client.
**Confidence:** HIGH for MCP spec + Vercel Log Drain schema + Upstash + AJV + MCP pattern; MEDIUM for Claude Marketplace listing criteria (no public policy doc surfaced, derived from community + mcp-handler pattern); MEDIUM-HIGH for Claude API pricing (verified against April 2026 pricing page).

## Summary

Phase 202 graduates the in-tree MCP server from a 10-tool JSON-RPC stub to a production MCP 2025-06-18 GA deployment: 30 live tools, OAuth 2.1 + PKCE session management with DB-backed opaque tokens and tenant-binding at consent, per-tenant 24h cost metering in cents with a hard 402 kill-switch, per-session / per-tenant rate-limits via Upstash sliding-window, strict AJV input + output validation, Resources + streaming + notifications, structured JSON logs → Vercel Log Drains, `@sentry/nextjs` exception wrapping, and VS Code as the second certified client.

The existing 28-line `lib/markos/mcp/server.cjs` JSON-RPC core is preserved (D-06 decision from Plan 200-06: do NOT adopt the SDK's Zod-based `McpServer` class — contracts remain YAML-sourced). Phase 202 extends the envelope to handle `resources/*`, `notifications/*`, and OAuth-gated session cookies, and replaces the in-memory session stub with the new `markos_mcp_sessions` Postgres table keyed by 32-byte opaque tokens.

**Primary recommendation:** Keep the hand-rolled JSON-RPC envelope — it already works, tests exist, and the Vercel `mcp-handler` adapter would force a Zod rewrite of all F-contracts. Layer OAuth/Resources/streaming into the existing `api/mcp/session.js` by extending the method dispatcher, add a new `api/oauth/*` route tree for PKCE, and wire all 30 tools through the preserved `TOOL_DEFINITIONS` registry shape. Audit + Sentry + cost + rate-limit hooks go into a new `lib/markos/mcp/pipeline.cjs` middleware chain that every handler passes through.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tool slate (D-01 … D-04):**
- **D-01** +20 new tools land weighted marketing-first (~10 Marketing, ~4–5 CRM, ~3–4 Literacy/Canon, ~2 Tenancy, 1–2 execution/approvals helpers).
- **D-02** All 8 wave-0 stubs get full backend wiring in 202 (`plan_campaign`, `research_audience`, `generate_brief`, `audit_claim`, `list_pain_points`, `rank_execution_queue`, `schedule_post`, `explain_literacy`). Marketplace pitch: "30 tools, all live, zero stubs."
- **D-03** Every mutating tool gated behind an inline `approval_token` round-trip. First call returns `{ preview, approval_token }`; client re-calls within 5 minutes to commit. No email/push escalation; inline only.
- **D-04** Hero demo = `plan_campaign` (marketplace screencast centers on agent-plans-a-campaign flow).

**Session + auth (D-05 … D-08):**
- **D-05** OAuth 2.1 + PKCE. `GET /oauth/authorize` → consent page → `POST /oauth/token`. Conforms to MCP 2025-06-18 spec.
- **D-06** Session token = opaque 32-byte random + DB lookup (`markos_mcp_sessions` row). 24h rolling TTL (every successful tool call extends `last_used_at`). No JWTs; no edge-config cache in 202.
- **D-07** Tenant bound at session creation via consent picker (`listTenantsForUser`); `tenant_id` fixed for session life. Cross-tenant tool calls return 403.
- **D-08** Second certified client = VS Code (Cursor/Windsurf/Warp/ChatGPT deferred to 202.1).

**Cost metering + hard budget (D-09 … D-12):**
- **D-09** Unit = cents (real cost). Cost-table at `lib/markos/mcp/cost-table.cjs` keyed by `{ tool_id, model_id }` with per-call base + per-LLM-token rates.
- **D-10** Enforcement = per tenant, rolling 24h window (not per session, not per org).
- **D-11** Breach action = hard 402 Payment Required kill-switch. Structured `{ error: 'budget_exhausted', reset_at, spent_cents, cap_cents }`. Audit row on every 402. No grace window.
- **D-12** Visibility = `/settings/mcp` page (usage gauge, top-tool-by-cost, active sessions + revoke CTA). Every tool call emits `source_domain='mcp'` audit row with `cost_cents`. No real-time usage MCP-resource in 202.

**Tool safety (D-13 … D-16):**
- **D-13** Strict AJV validation on every tool OUTPUT. Non-conforming response → `internal_error` to client + Sentry capture + `action='tool.output_schema_violation'` audit row.
- **D-14** Strict input schema + injection deny-list (`ignore previous`, `system:`, common tokens, Unicode lookalikes). Violation → `400 invalid_tool_input`. No LLM classifier.
- **D-15** Tenant-scoped output only. Every read tool's F-contract declares mandatory `tenant_id` filter at query layer. No PII redaction (would break marketing personalization).
- **D-16** HITL gate = inline `approval_token` round-trip only. Destructive-op dashboard deferred to 202.1.

**Rate-limits + latency SLO (D-17 … D-20):**
- **D-17** Upstash Redis: 60 rpm per session + 600 rpm per tenant (aggregate). 429 with `Retry-After` on breach.
- **D-18** SLO: simple-tier p95 ≤ 300ms / llm-tier p95 ≤ 5s / long-tier p95 ≤ 30s. Declared via `latency_tier: simple|llm|long` on each F-contract.
- **D-19** Enforced via Vercel Observability. Per-tool + per-session p50/p95/p99 spans. Alert when simple-tier p95 > 300ms over 15-minute window.
- **D-20** Timeouts: 30s simple / 120s llm / 300s long. 504 with `{ error: 'tool_timeout', tool_id, tier }` on breach.

**Marketplace + pricing (D-21 … D-24):**
- **D-21** Free tier = read-only tools + $1/day per-tenant hard cap. Write tools require `plan_tier != 'free'`; 402 otherwise.
- **D-22** Category = Marketing + Content Generation (primary: Marketing).
- **D-23** Install tracking = marketplace analytics + `source_domain='mcp' action='session.created'` audit + weekly KPI digest email. Target: ≥ 50 installs in 30 days.
- **D-24** Listing copy tone = developer-native + quietly confident. Headline: "MCP-native marketing workbench. 30 tools. Claude-native by design."

**MCP Resources + streaming (D-25 … D-28):**
- **D-25** 3 MCP Resources: `mcp://markos/canon/{tenant}`, `mcp://markos/literacy/{tenant}`, `mcp://markos/tenant/status`. Read-only.
- **D-26** Streaming / progress events for LLM-backed tools only (`draft_message`, `plan_campaign`, `audit_claim`, any other LLM-backed tool).
- **D-27** `notifications/resources/updated` pushed to every subscribed session when underlying canon/literacy/tenant-status changes. Hooks into existing write paths.
- **D-28** Compute tiers as D-20.

**Observability + release channel (D-29 … D-32):**
- **D-29** Per-JSON-RPC-call UUID `mcp-req-<uuid>` generated at handler entry. Echoed into JSON-RPC envelope, every Vercel log line, every audit row, every Sentry event.
- **D-30** Structured logs → Vercel Log Drains as one JSON line per event: `{ req_id, session_id, tenant_id, tool_id, duration_ms, status, cost_cents, error_code? }`.
- **D-31** Single GA listing (no canary endpoint). Version bumps via `marketplace.json.version`. Rolling Releases for server-side progressive rollout.
- **D-32** Sentry wraps every tool handler via `@sentry/nextjs`. Uncaught → Sentry issue + `source_domain='mcp' action='tool.error'` audit. JSON-RPC returns generic `internal_error` + `req_id`.

### Claude's Discretion
- Concrete SQL for `markos_mcp_sessions` (columns confirmed; types + indexes + RLS are researcher/planner call).
- Cost-table initial values (research Claude rates at plan time).
- Exact `/oauth/authorize` + `/oauth/token` endpoint shape and consent-page UI (reuse Phase 201 CSS tokens).
- Plan structure — single plan vs decomposition. Target ≤ 10 plans: Wave 1 foundations, Wave 2 tool expansion + resources, Wave 3 marketplace listing + VS Code cert + docs.
- `@sentry/nextjs` version + setup matching existing project conventions.

### Deferred Ideas (OUT OF SCOPE)
- Cursor / Windsurf / Warp / ChatGPT certifications → 202.1.
- Per-session cost view as an MCP Resource (`mcp://markos/usage`) → deferred.
- PII redaction layer on tool outputs → deferred (would break marketing personalization).
- LLM-based input classifier for injection defense → deferred; schema + deny-list for 202.
- Operator email / push / queue UI for destructive-op confirmation → 202.1.
- Canary marketplace endpoint → single GA listing covers needs.
- Computer-use / browser-agent tools → Phase 235.
- 3rd-party agent marketplace → Phase 213 alpha.
- Stripe-backed metered billing and paid tier enforcement → Phase 205 (202 checks `plan_tier != 'free'` only).
- SOC 2 Type I evidence collection → Phase 206 (202 emits the logs 206 collects).
</user_constraints>

<phase_requirements>
## Phase Requirements

Phase 202 addresses these IDs from `.planning/REQUIREMENTS.md` + `QUALITY-BASELINE.md`:

| ID | Description | Research Support |
|----|-------------|------------------|
| **MCP-01** | MCP server with ≥30 tools, marketplace listing, session persistence, OAuth 2.1, certified second client | Tool inventory §3; OAuth flow §4; session table §5; VS Code cert §11; marketplace checklist §12 |
| **QA-01** | Contract-first — every endpoint has F-NN YAML merged into OpenAPI before code | F-71 already exists; extend + add F-89…F-NN per new tool + OAuth endpoints (§13) |
| **QA-02** | Typed HTTP boundary — request + response validated | AJV strict validation (§7); input + output schemas per tool |
| **QA-03** | Semver-on-contract — contract versions drive SDK + docs | F-71 bumps to v2; new tool contracts start at v1 |
| **QA-04** | Coverage floor ≥80% lib/markos/**; 100% on auth/cost/RLS paths | Test inventory §17 (~100+ new tests target) |
| **QA-05** | Integration-real — real Supabase for tenancy boundary tests | Session persistence tests hit real Supabase; cost meter tests hit Upstash + Postgres |
| **QA-06** | E2E smoke — Playwright critical path | Deferred carry-over from Phase 201; acknowledge but not-blocking unless Playwright lands in 202 |
| **QA-07** | Load tests before GA — k6/Artillery on MCP | MUST ship: k6 smoke script targeting session create + tools/list + tools/call at 60 rpm |
| **QA-08** | Eval-as-test for agents — deterministic eval suite | LLM-backed tools (`draft_message`, `plan_campaign`, `audit_claim`) need `lib/markos/evals/mcp-*` fixtures |
| **QA-09** | OTEL day-0 — tenant_id + session_id + req_id on every trace | D-29 UUID shared across log + audit + Sentry; Vercel Observability spans |
| **QA-10** | Per-tenant cost telemetry + kill-switch | **IN SCOPE for 202** (deferred from 201). D-09..D-12 cost-table + 24h rolling window + 402 |
| **QA-11** | STRIDE threat model | §16 threat model (prompt injection, tool confusion, session hijack, data exfil) |
| **QA-12** | Platform baseline — rate-limit + BotID + signed cookies | Upstash rate-limit (D-17); session cookies SameSite=Lax per Phase 201 pattern |
| **QA-13** | Idempotent migrations + rollback | `88_markos_mcp_sessions.sql` + matching `.down.sql` |
| **QA-14** | WCAG 2.2 AA — /settings/mcp page + consent UI | Reuse Phase 201 CSS tokens; axe-playwright |
| **QA-15** | Docs-as-code + llms.txt live | `docs/mcp-tools.md`, `docs/vscode-mcp-setup.md`, `docs/llms/phase-202-mcp.md` + llms.txt append |
</phase_requirements>

## Standard Stack

### Core (already installed — verified in `package.json` lines 59-84)

| Library | Version (verified) | Purpose | Why Standard |
|---------|-------------|---------|--------------|
| `@modelcontextprotocol/sdk` | `^1.29.0` ✓ [VERIFIED: node_modules/@modelcontextprotocol/sdk/package.json] | MCP types/schemas + optional `McpServer` class. We only use types; envelope stays hand-rolled. | Official Anthropic SDK. 1.26+ required (prior had security vuln). |
| `ajv` | `^8.18.0` ✓ [VERIFIED: node_modules/ajv/package.json] | JSON Schema Draft 2020-12 compiler; strict mode by default. | Fastest JSON validator for Node; reuses same YAML contracts. |
| `@upstash/redis` + `@upstash/ratelimit` | **New dep needed** | Rate-limit per-session + per-tenant (D-17). | Phase 201 already uses Upstash pattern (`lib/markos/auth/rate-limit.cjs`). |
| `@sentry/nextjs` | **New dep needed** — current `10.48.0` [CITED: npmjs.com/package/@sentry/nextjs] | Exception capture + request context (D-32). | Auto-wires `captureRequestError` via `instrumentation.ts`. |
| `@supabase/supabase-js` | `^2.58.0` ✓ | `markos_mcp_sessions` CRUD + cost-counter upserts. | Already wired across Phase 201. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ajv-formats` | `^3.x` ([CITED: ajv.js.org/guide/formats.html] — need add) | `date-time`, `email`, `uri` format validators. | Input schemas using `format: date-time` (e.g. `schedule_post.scheduled_at`). |
| `@anthropic-ai/sdk` | `^0.82.0` ✓ | LLM calls for `draft_message` / `plan_campaign` / `audit_claim` (cost-metered). | Existing LLM-backed tools. |
| `@vercel/edge-config` | `^1.4.3` ✓ | NOT used for MCP sessions (D-06 locks opaque DB lookup). Do NOT use here. | — |

### Alternatives Considered (and rejected)

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled JSON-RPC envelope | Vercel `mcp-handler` package [CITED: github.com/vercel/mcp-handler] | `mcp-handler` forces Zod schemas for every tool, forking F-contract source of truth. **Rejected** — aligns with Plan 200-06 decision. |
| DB-backed opaque tokens | Signed JWTs with short TTL + refresh rotation | JWTs complicate revocation; opaque + DB lookup gives instant revoke via `revoked_at`. D-06 locked. |
| Edge-config slug cache for session lookup | Postgres-only | 24h TTL is long enough that cold-lookup latency is acceptable; Supabase sub-10ms read keeps p95 ≤ 300ms. Can graduate to edge-config in 202.1 if Vercel Observability shows need. |
| LLM-based injection classifier | Deny-list + schema (D-14) | Deny-list is cheap + deterministic; classifier adds another LLM call (cost + latency). Revisit if adversarial pressure surfaces. |

**Installation:**
```bash
npm install @upstash/redis @upstash/ratelimit @sentry/nextjs ajv-formats
```

**Version verification commands (planner should run at plan time):**
```bash
npm view @sentry/nextjs version
npm view @upstash/ratelimit version
npm view @upstash/redis version
npm view ajv-formats version
npm view @modelcontextprotocol/sdk version   # confirm still 1.29+ at plan time
```

**Why no `mcp-handler`:** Vercel's `mcp-handler` ([CITED: vercel.com/docs/mcp/deploy-mcp-servers-to-vercel]) wraps `createMcpHandler((server) => { server.tool(name, desc, { zod }, handler); })`. This requires Zod schemas inline for every tool. MarkOS's source of truth is JSON Schema in `contracts/F-NN-*.yaml` (glob-merged into `openapi.json` by `scripts/openapi/build-openapi.cjs`). Adopting `mcp-handler` would fork the contract source, break the SDK codegen pipeline (`openapi-typescript`), and require re-writing every F-contract. The hand-rolled envelope in `api/mcp/session.js` is 69 lines + passes 11 tests — extend it, don't replace it.

---

## Architecture Patterns

### Recommended Project Structure

```
api/
├── mcp/
│   ├── session.js              (extend — add OAuth cookie + req_id + pipeline)
│   ├── tools/[toolName].js     (extend — wrap with middleware chain)
│   ├── resources.js            (NEW — resources/list + resources/read + subscribe)
│   └── notifications.js        (NEW — internal broadcast for notifications/resources/updated)
├── oauth/
│   ├── authorize.js            (NEW — GET consent page; POST PKCE authorization_code issuance)
│   ├── token.js                (NEW — POST exchange code + PKCE verifier → opaque token)
│   ├── register.js             (NEW — RFC 7591 Dynamic Client Registration)
│   └── revoke.js               (NEW — POST revoke a session)
└── .well-known/
    ├── oauth-protected-resource.js (NEW — RFC 9728 metadata; points at our own /oauth)
    └── oauth-authorization-server.js (NEW — RFC 8414 metadata; issuer + endpoints)

lib/markos/mcp/
├── server.cjs                  (extend — add resources + notifications registries)
├── tools/
│   ├── index.cjs               (extend — 30-tool registry; each exports: handler, inputSchema, outputSchema, latency_tier, mutating, cost_model)
│   ├── marketing/              (NEW — 10 marketing handlers)
│   ├── crm/                    (NEW — 4-5 CRM handlers)
│   ├── literacy/               (NEW — 3-4 literacy handlers)
│   ├── tenancy/                (NEW — 2 tenancy read handlers)
│   └── execution/              (NEW — 1-2 execution/approval helpers)
├── resources/
│   ├── index.cjs               (NEW — 3 Resource handlers + subscribe registry)
│   ├── canon.cjs
│   ├── literacy.cjs
│   └── tenant-status.cjs
├── sessions.cjs                (NEW — opaque token create/lookup/extend/revoke; wraps markos_mcp_sessions)
├── oauth.cjs                   (NEW — PKCE verifier/challenge, code issuance + exchange, DCR)
├── cost-table.cjs              (NEW — static table: { tool_id, model_id } → { base_cents, input_per_1k, output_per_1k })
├── cost-meter.cjs              (NEW — read/add to 24h rolling window; 402 when over cap)
├── rate-limit.cjs              (NEW — Upstash sliding window: rl:mcp:session:{id}, rl:mcp:tenant:{id})
├── ajv.cjs                     (NEW — compiled AJV instance + schema registry by tool_id)
├── injection-denylist.cjs      (NEW — regex + Unicode confusables list)
├── pipeline.cjs                (NEW — request pipeline: req_id → auth → rate-limit → validate-input → cost-check → approval → invoke → validate-output → log → audit)
├── sse.cjs                     (NEW — SSE helper for streaming progress events)
└── sentry.cjs                  (NEW — wrap handler with Sentry capture + req_id tag)

app/(markos)/settings/mcp/
├── page.tsx                    (NEW — usage gauge, top-tool, sessions list + revoke CTA)
└── page.module.css             (NEW — inherits 28px radius + Sora 28px headings)

app/(markos)/oauth/consent/
├── page.tsx                    (NEW — tenant picker via listTenantsForUser + scope list + approve/deny)
└── page.module.css

contracts/
├── F-71-mcp-session-v1.yaml    (rev to v2: add OAuth + session-persistence + cost-budget fields)
├── F-89-mcp-oauth-v1.yaml      (NEW — /oauth/authorize, /oauth/token, /oauth/register, /oauth/revoke)
├── F-90-mcp-tools-marketing-v1.yaml (NEW — 10 marketing tools)
├── F-91-mcp-tools-crm-v1.yaml  (NEW — 4-5 CRM tools)
├── F-92-mcp-tools-literacy-v1.yaml (NEW — 3-4 literacy tools)
├── F-93-mcp-tools-tenancy-v1.yaml  (NEW — 2 tenancy tools)
├── F-94-mcp-resources-v1.yaml  (NEW — 3 resources: canon, literacy, tenant/status)
└── F-95-mcp-cost-budget-v1.yaml (NEW — /api/tenant/mcp/usage + session revoke + 402 shape)

supabase/migrations/
├── 88_markos_mcp_sessions.sql  (NEW — session table + rolling TTL index + RLS)
├── 89_markos_mcp_cost_window.sql (NEW — 24h rolling cost counter table)
└── rollback/
    ├── 88_markos_mcp_sessions.down.sql
    └── 89_markos_mcp_cost_window.down.sql

vercel.ts                       (extend — add 1 cron: /api/mcp/session/cleanup at 0 */6 * * *)

docs/
├── mcp-tools.md                (NEW — 30 tools reference with inputs/outputs)
├── vscode-mcp-setup.md         (NEW — copy-paste .vscode/mcp.json snippet + OAuth consent walkthrough)
├── oauth.md                    (NEW — OAuth 2.1 + PKCE flow with examples)
└── llms/phase-202-mcp.md       (NEW — llms.txt append entry per QA-15)

test/mcp/
├── server.test.js              (extend from 11 to ~30 tests)
├── oauth.test.js               (NEW)
├── session.test.js             (NEW)
├── cost-table.test.js          (NEW)
├── cost-meter.test.js          (NEW)
├── rate-limit.test.js          (NEW)
├── ajv-validation.test.js      (NEW)
├── injection-denylist.test.js  (NEW)
├── pipeline.test.js            (NEW)
├── resources.test.js           (NEW)
├── notifications.test.js       (NEW)
├── streaming.test.js           (NEW)
├── approval-token.test.js      (NEW)
├── 402-breach.test.js          (NEW)
├── 429-breach.test.js          (NEW)
└── tools/
    ├── draft_message.test.js   (extend — live LLM + cost meter)
    ├── plan_campaign.test.js   (extend — stub → live)
    ├── research_audience.test.js
    ├── audit_claim.test.js
    ├── generate_brief.test.js
    ├── list_pain_points.test.js
    ├── rank_execution_queue.test.js
    ├── schedule_post.test.js
    ├── explain_literacy.test.js
    └── <each of 12 net-new tools>.test.js

.claude-plugin/marketplace.json (update — bump version to 2.0.0; refresh tools array to 30; update description + OAuth URL)
```

### Pattern 1: Middleware Pipeline per Tool Call (CRITICAL — the central pattern)

**What:** Every JSON-RPC `tools/call` passes through a deterministic middleware chain. Each step can short-circuit with a structured error.

**When to use:** Every single MCP tool invocation. No bypass.

**Example:**
```javascript
// lib/markos/mcp/pipeline.cjs — source of truth for "one tool call"
// Source: derived from Phase 201 webhook pipeline shape (lib/markos/webhooks/engine.cjs)
'use strict';

const { randomUUID } = require('node:crypto');
const { lookupSession, touchSession } = require('./sessions.cjs');
const { checkInjectionDenylist } = require('./injection-denylist.cjs');
const { getToolValidator } = require('./ajv.cjs');
const { checkRateLimit } = require('./rate-limit.cjs');
const { checkAndChargeBudget } = require('./cost-meter.cjs');
const { TOOLS_BY_NAME } = require('./tools/index.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');
const { emitLogLine } = require('./log-drain.cjs');
const { withSentry } = require('./sentry.cjs');
const { checkApprovalToken, issueApprovalToken } = require('./approval.cjs');

async function runToolCall({ supabase, redis, bearer_token, tool_name, args }) {
  const req_id = `mcp-req-${randomUUID()}`;
  const started_at = Date.now();
  let session, tool, status = 'ok', error_code = null, cost_cents = 0;

  try {
    // 1. Auth — opaque token → session row (extends last_used_at on every call per D-06)
    session = await lookupSession(supabase, bearer_token);
    if (!session) { status = 'unauthorized'; error_code = 'invalid_token'; throw new Error('invalid_token'); }
    await touchSession(supabase, session.id);

    // 2. Rate-limit — per-session then per-tenant (D-17)
    const rl = await checkRateLimit(redis, session);
    if (!rl.ok) { status = 'rate_limited'; error_code = rl.reason; throw rl.error_429; }

    // 3. Tool lookup — 404 if unknown
    tool = TOOLS_BY_NAME[tool_name];
    if (!tool) { status = 'unknown_tool'; error_code = 'tool_not_found'; throw new Error(`unknown_tool:${tool_name}`); }

    // 4. Input validation — AJV strict + injection deny-list (D-14)
    const { validateInput, validateOutput } = getToolValidator(tool_name);
    if (!validateInput(args)) {
      status = 'invalid_input'; error_code = 'invalid_tool_input';
      throw new Error(JSON.stringify(validateInput.errors));
    }
    const bad = checkInjectionDenylist(args);
    if (bad) { status = 'injection_blocked'; error_code = 'injection_detected'; throw new Error(`injection:${bad}`); }

    // 5. Free-tier write gate (D-21) — if mutating + plan_tier === 'free' → 402
    if (tool.mutating && session.plan_tier === 'free') {
      status = 'paid_tier_required'; error_code = 'paid_tier_required';
      throw Object.assign(new Error('paid_tier_required'), { http: 402 });
    }

    // 6. Approval gate (D-03, D-16) — mutating tools require approval_token
    if (tool.mutating) {
      if (!args.approval_token) {
        return { preview: tool.preview(args), approval_token: await issueApprovalToken(redis, session, tool_name, args) };
      }
      const approved = await checkApprovalToken(redis, args.approval_token, session, tool_name);
      if (!approved) { status = 'approval_invalid'; error_code = 'approval_required'; throw new Error('approval_invalid'); }
    }

    // 7. Cost gate (D-09..D-11) — atomic check-and-charge
    const budget = await checkAndChargeBudget(supabase, redis, session.tenant_id, tool_name, { estimated_cents: tool.cost_model.base_cents });
    if (!budget.ok) {
      status = 'budget_exhausted'; error_code = 'budget_exhausted';
      throw Object.assign(new Error('budget_exhausted'), { http: 402, body: { reset_at: budget.reset_at, spent_cents: budget.spent_cents, cap_cents: budget.cap_cents } });
    }

    // 8. Invoke with compute budget (D-20) — 30s/120s/300s per latency_tier
    const invocation = await withTimeout(tool.latency_tier, tool.handler({ args, session, req_id }));

    // 9. Output validation — D-13 strict schema check
    if (!validateOutput(invocation)) {
      status = 'output_schema_violation'; error_code = 'output_schema_violation';
      throw new Error('tool.output_schema_violation');
    }

    // 10. Compute actual cost + trueup budget
    cost_cents = tool.cost_model.actualCost(invocation);
    await trueupBudget(supabase, redis, session.tenant_id, tool_name, cost_cents, budget.reservation_id);

    return invocation;
  } finally {
    // Always log + audit, regardless of success/failure
    const duration_ms = Date.now() - started_at;
    emitLogLine({ req_id, session_id: session?.id, tenant_id: session?.tenant_id, tool_id: tool_name, duration_ms, status, cost_cents, error_code });
    if (session) {
      enqueueAuditStaging(supabase, {
        tenant_id: session.tenant_id, org_id: session.org_id,
        source_domain: 'mcp', action: status === 'ok' ? 'tool.invoked' : `tool.${status}`,
        actor_id: session.user_id, actor_role: session.iam_role || 'mcp-client',
        payload: { req_id, tool_id: tool_name, duration_ms, cost_cents, error_code }
      }).catch(() => {});
    }
  }
}

module.exports = { runToolCall };
```

### Pattern 2: Opaque Session Tokens with DB Lookup

**What:** Client stores a 32-byte random hex string. Every request includes `Authorization: Bearer <token>`. Server looks up session row; if `now() > last_used_at + interval '24 hours'` OR `revoked_at IS NOT NULL` → 401.

**When to use:** All MCP JSON-RPC calls after OAuth token issuance.

**Example:**
```sql
-- supabase/migrations/88_markos_mcp_sessions.sql — Source: derived from MCP 2025-06-18 + D-06 + D-07 + D-11
create table if not exists markos_mcp_sessions (
  id             text primary key,                   -- 'mcp-sess-' + hex(16)
  token_hash     text not null unique,               -- sha256(opaque_token); NEVER store plaintext token
  user_id        text not null,
  tenant_id      text not null references markos_tenants(id) on delete cascade,
  org_id         text not null references markos_orgs(id)   on delete cascade,
  client_id      text not null,                      -- OAuth client (DCR-issued or hardcoded marketplace client)
  scopes         text[] not null default '{}',       -- requested + approved scopes from /oauth/authorize
  plan_tier      text not null default 'free',       -- snapshot of org.plan_tier at consent-time (D-21)
  created_at     timestamptz not null default now(),
  last_used_at   timestamptz not null default now(), -- extended on every successful tool call (D-06)
  expires_at     timestamptz not null default (now() + interval '24 hours'),
  revoked_at     timestamptz                         -- null = active; set on revoke (D-12 + user action)
);

-- Critical: session lookup must be O(1). Composite index on (tenant_id) for the /settings/mcp list.
create index if not exists idx_mmsess_token_hash on markos_mcp_sessions(token_hash) where revoked_at is null;
create index if not exists idx_mmsess_tenant_id on markos_mcp_sessions(tenant_id);
create index if not exists idx_mmsess_user_tenant on markos_mcp_sessions(user_id, tenant_id) where revoked_at is null;
-- Rolling TTL reaper uses this index for the cleanup cron (D-22)
create index if not exists idx_mmsess_expires on markos_mcp_sessions(expires_at) where revoked_at is null;

alter table markos_mcp_sessions enable row level security;

-- Users see their own sessions for revoke UI
create policy if not exists mmsess_read_own on markos_mcp_sessions
  for select using (user_id = auth.jwt()->>'sub');

-- Tenant admins see all sessions in their tenant for /settings/mcp
create policy if not exists mmsess_read_tenant_admin on markos_mcp_sessions
  for select using (
    exists (
      select 1 from markos_tenant_memberships
      where tenant_id = markos_mcp_sessions.tenant_id
        and user_id = auth.jwt()->>'sub'
        and iam_role in ('owner','admin')
    )
  );

-- Users revoke their own; tenant owners revoke any in their tenant
create policy if not exists mmsess_revoke_own on markos_mcp_sessions
  for update using (user_id = auth.jwt()->>'sub');
create policy if not exists mmsess_revoke_tenant_owner on markos_mcp_sessions
  for update using (
    exists (
      select 1 from markos_tenant_memberships
      where tenant_id = markos_mcp_sessions.tenant_id
        and user_id = auth.jwt()->>'sub'
        and iam_role = 'owner'
    )
  );

comment on table markos_mcp_sessions is 'Phase 202 D-06: opaque OAuth 2.1 token → session. 24h rolling TTL via last_used_at+24h. No JWT, no refresh token (public client).';
```

### Pattern 3: Per-Tenant 24h Rolling Cost Window

**What:** A single Postgres row per tenant per rolling day tracks spend in cents. Every tool call reserves estimated cost atomically, then trues up with actual cost after invocation.

**When to use:** Every billable tool call (all 30).

**Example:**
```sql
-- supabase/migrations/89_markos_mcp_cost_window.sql
create table if not exists markos_mcp_cost_window (
  tenant_id      text not null references markos_tenants(id) on delete cascade,
  window_start   timestamptz not null,                      -- floor(now(), 1 hour) bucket; 24 rows per tenant per day
  spent_cents    integer not null default 0 check (spent_cents >= 0),
  updated_at     timestamptz not null default now(),
  primary key (tenant_id, window_start)
);

create index if not exists idx_mmcw_tenant_window on markos_mcp_cost_window(tenant_id, window_start desc);

-- Atomic check-and-charge: return false if charge would exceed 24h cap.
create or replace function check_and_charge_mcp_budget(
  p_tenant_id text,
  p_charge_cents integer,
  p_cap_cents integer
) returns table(ok boolean, spent_cents integer, cap_cents integer, reset_at timestamptz) as $$
declare
  v_now timestamptz := now();
  v_bucket timestamptz := date_trunc('hour', v_now);
  v_window_start timestamptz := v_now - interval '24 hours';
  v_total integer;
begin
  -- Sum last 24 hourly buckets
  select coalesce(sum(spent_cents), 0) into v_total
  from markos_mcp_cost_window
  where tenant_id = p_tenant_id and window_start > v_window_start;

  if v_total + p_charge_cents > p_cap_cents then
    return query select false, v_total, p_cap_cents, v_now + interval '1 hour';
    return;
  end if;

  insert into markos_mcp_cost_window(tenant_id, window_start, spent_cents)
  values (p_tenant_id, v_bucket, p_charge_cents)
  on conflict (tenant_id, window_start) do update set spent_cents = markos_mcp_cost_window.spent_cents + p_charge_cents, updated_at = v_now;

  return query select true, v_total + p_charge_cents, p_cap_cents, v_now + interval '1 hour';
end;
$$ language plpgsql security definer;
```

Store the cap per tenant separately — planner can decide: either a `markos_orgs.mcp_cap_cents_per_24h` column (with default = 100 for free tier per D-21's $1/day) or a static cost-table lookup at call time.

### Pattern 4: Upstash Sliding-Window Rate Limit

**What:** Two limiters per call. Block if either budget is exhausted.

**Example:**
```javascript
// lib/markos/mcp/rate-limit.cjs
// Source: [CITED: upstash.com/docs/redis/sdks/ratelimit-ts/algorithms]
'use strict';
const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');

const redis = Redis.fromEnv(); // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

const perSession = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(60, '60 s'), prefix: 'rl:mcp:session'
});
const perTenant = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(600, '60 s'), prefix: 'rl:mcp:tenant'
});

async function checkRateLimit(_redis, session) {
  const [s, t] = await Promise.all([
    perSession.limit(session.id),
    perTenant.limit(session.tenant_id),
  ]);
  if (!s.success || !t.success) {
    const reset = Math.max(s.reset, t.reset);
    const retry_after = Math.ceil((reset - Date.now()) / 1000);
    return {
      ok: false,
      reason: !s.success ? 'session_rpm' : 'tenant_rpm',
      error_429: Object.assign(new Error('rate_limited'), {
        http: 429,
        headers: { 'Retry-After': String(retry_after) },
        body: { error: 'rate_limited', scope: !s.success ? 'session' : 'tenant', retry_after, limit: !s.success ? 60 : 600 }
      })
    };
  }
  return { ok: true };
}
module.exports = { checkRateLimit };
```

### Anti-Patterns to Avoid

- **JWT access tokens** — D-06 explicitly picks opaque + DB. JWT makes revocation (D-12 revoke CTA) a distributed-cache-invalidation problem.
- **Storing raw tokens** — token in DB must be `sha256(token)`, plaintext only lives briefly in the client. (Matches Phase 201 passkey-credential pattern.)
- **Rate-limit check AFTER tool invoke** — must be step 2 in pipeline. Otherwise attackers exhaust LLM cost before 429.
- **Output validation = soft warning** — D-13 says strict; a tool that emits a bad shape is a bug + Sentry capture + audit row, not a log.
- **Skipping req_id on errors** — D-29 requires correlation. Every log + audit + Sentry event needs `mcp-req-<uuid>`.
- **Mixing OAuth /oauth routes with /api/mcp routes at the same cookie scope** — OAuth consent uses the normal Phase-201 user session (`markos_sessions_devices` cookie); MCP session Bearer is separate. Don't accept Bearer on /oauth or cookie on /api/mcp.
- **Using the SDK's `McpServer.registerTool()`** — forces Zod. Keep the JSON-RPC dispatcher in `api/mcp/session.js`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PKCE code challenge SHA-256 + base64url | Custom crypto | `node:crypto`'s `createHash('sha256').update(verifier).digest('base64url')` | Builtin, constant-time. RFC 7636 specifies base64url; do NOT use base64. |
| OAuth 2.1 spec compliance | Your own flow | Reference RFC 8414 (AS metadata), RFC 9728 (RS metadata), RFC 8707 (resource indicator), RFC 7591 (DCR) — [CITED: modelcontextprotocol.io/specification/2025-06-18/basic/authorization] | Claude Marketplace cert checks well-known endpoints; missing any one = rejection. |
| Rate limiting algorithm | Your own sliding-window in Redis | `@upstash/ratelimit.slidingWindow(n, window)` | Algorithm bugs at boundary crossings are real (fixed-window stampede). Upstash's algo is proven. |
| JSON Schema validation | Handwritten type guards | AJV 8 with `strict: true` + `ajv-formats` | AJV compiles schemas to optimized JS. Handwritten = drift from F-contracts. |
| SSE framing | `res.write` manual loop | `res.setHeader('content-type', 'text/event-stream')` + `res.flushHeaders()` + properly framed `data: <json>\n\n` | One wrong framing char and clients drop the connection. Pattern is narrow; wrap in `lib/markos/mcp/sse.cjs`. |
| Audit emission | Custom INSERT | `enqueueAuditStaging(client, entry)` from `lib/markos/audit/writer.cjs` | Already validates `source_domain` enum, computes payload canonicalization, hooks into hash chain via drain cron. |
| LLM cost calculation | Hand arithmetic on tokens | `lib/markos/llm/cost-calculator.ts` exists — wrap, don't reimplement | Phase 201 cost pipeline — stay consistent. |
| UUID | `Math.random` | `node:crypto.randomUUID()` | Built-in. Never use Math.random for identifiers. |
| Unicode confusables normalization (injection denylist) | Custom mapping | Node's `str.normalize('NFKC')` + a curated confusables regex | Handles lookalike attacks (e.g., Cyrillic `а` for Latin `a`). |
| Session timeout extension | Triggers + timers | Plain `update markos_mcp_sessions set last_used_at = now(), expires_at = now() + interval '24 hours' where id = $1` | Keep it in the DB; no cache coherence problem. |
| Marketplace manifest schema | Guessing | Schema referenced in manifest itself: `https://schemas.anthropic.com/claude-marketplace/v1.json` (see existing `.claude-plugin/marketplace.json:1`) | Official schema; validate locally before submission. |

**Key insight:** Every item in the "don't hand-roll" list has at least one known production failure mode that a custom implementation would have to re-discover. The phase 202 cost budget is the single area where we *do* hand-roll (the 24h rolling window SQL fn), because there is no off-the-shelf "per-tenant cents-based 24h rolling budget with atomic check-and-charge" library. Keep that code narrow + test-heavy.

---

## Runtime State Inventory

**Phase 202 is primarily additive (new tables + new routes + new tools)** — but session state + marketplace state must be accounted for.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | `markos_mcp_sessions` (NEW), `markos_mcp_cost_window` (NEW) — no pre-existing data to migrate. In-memory session stub in Plan 200-06 has no production state because 200-06 shipped the server locally-only; marketplace listing pending. | Ship migrations 88 + 89 (forward + rollback). No data migration. |
| **Live service config** | **Claude Marketplace listing at `.claude-plugin/marketplace.json`** — currently v1.0.0, 10 tools, submission_status: pending. Any marketplace review is cancelled/refiled with v2.0.0 + 30 tools. | Update `marketplace.json` version, tools array, description, add OAuth discovery URL. Re-submit to Claude Marketplace via their submission portal. |
| **OS-registered state** | None. No Windows Task Scheduler / pm2 / systemd references for MCP. Vercel crons are config-as-code in `vercel.ts` — adding one (session cleanup) is a deploy-time change. | Add `/api/mcp/session/cleanup` cron entry to `vercel.ts`. |
| **Secrets / env vars** | New env vars required: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (MAY already exist for Phase 201 — confirm at plan time), `SENTRY_DSN`, `OAUTH_ISSUER_URL` (set to `https://markos.dev`), `MCP_FREE_TIER_CAP_CENTS` (default 100). No existing SOPS keys renamed. | Add to Vercel project env. Document in `docs/oauth.md`. |
| **Build artifacts / installed packages** | `openapi.json` regenerates via `npm run openapi:build` when new F-contracts are added — picks them up by glob. No stale egg-info / binary analogue in Node. | Run `npm run openapi:build` after adding F-89..F-95 contracts. CI should enforce it's committed. |

**Nothing found in "OS-registered state":** Confirmed — MCP's only process manager is Vercel Fluid Compute (managed). No local daemons.

---

## Common Pitfalls

### Pitfall 1: MCP spec requires `Authorization` on EVERY request, not just init
**What goes wrong:** Implementer remembers to include token on `tools/call` but omits on `resources/read` or `notifications/*` side-channel. Server 401s; client retries; session gets locked out.
**Why it happens:** HTTP session habits (cookie once, done). MCP is stateless per JSON-RPC request per [CITED: modelcontextprotocol.io/specification/2025-06-18/basic/authorization §Access Token Usage].
**How to avoid:** Server treats every JSON-RPC method equally — Bearer token check is step 1 for every method except `initialize` (unauthenticated — but it doesn't leak).
**Warning signs:** Clients work for first few calls then silently stop. Logs show bursts of 401s with correct client IPs.

### Pitfall 2: Output validation violation → wrong error code
**What goes wrong:** AJV says output doesn't match → handler returns `invalid_output` to client. But D-13 specifies `internal_error` + Sentry capture + audit row — user-facing error should be generic (don't leak server bug details).
**Why it happens:** Conflating input validation (client's fault → 400) with output validation (server's fault → 500).
**How to avoid:** `validateInput` → 400 with error details. `validateOutput` → 500 (`internal_error`) + Sentry + audit.

### Pitfall 3: Approval token replayable
**What goes wrong:** Same `approval_token` accepted twice → double-spend of a destructive action.
**Why it happens:** Designers store approval_token as a key without marking it used.
**How to avoid:** `approval_token` is one-time. Stored in Upstash Redis with `SET key value EX 300 NX` (5-minute TTL + fail if exists). Consume with `GETDEL`; second `GETDEL` returns null.

### Pitfall 4: 24h rolling cost window gets stampeded
**What goes wrong:** 10 parallel tool calls at the budget ceiling all read "you have $0.01 left" in parallel → each commits $0.10 → overspend by 10x.
**Why it happens:** Check-then-insert isn't atomic.
**How to avoid:** Use the `check_and_charge_mcp_budget` SQL function (Pattern 3 above) as a single transaction. Postgres row lock per tenant prevents stampede.

### Pitfall 5: Session hijacking via timing-attack on token comparison
**What goes wrong:** Attacker enumerates token space via timing differences in `token_hash == provided_hash` JS string comparison.
**Why it happens:** `===` short-circuits on first differing byte.
**How to avoid:** Never compare raw tokens. Compute `sha256(provided)` locally, THEN compare hashes with `crypto.timingSafeEqual(Buffer.from(hashA, 'hex'), Buffer.from(hashB, 'hex'))`.

### Pitfall 6: Injection deny-list only checks ASCII
**What goes wrong:** Attacker sends `Ignore previoυs instructions:` (with Greek upsilon) — regex `/ignore previous/i` misses.
**Why it happens:** No Unicode normalization.
**How to avoid:** Normalize all string inputs with `str.normalize('NFKC')` before deny-list check. Keep a curated confusables regex (homoglyph attack surface is finite — see `unicode-confusables` list).

### Pitfall 7: SSE streaming blocks the Vercel Function
**What goes wrong:** LLM streams for 30s; Vercel Function instance is held; concurrency exhausts; later requests queue + time out.
**Why it happens:** Streaming SSE consumes a function instance for the duration.
**How to avoid:** Fluid Compute instance-sharing mitigates, but still cap streaming duration at the tool's latency tier (`llm` = 120s hard cap). Set `res.socket.setTimeout()` and break the loop. Per [CITED: vercel.com/docs/mcp/deploy-mcp-servers-to-vercel] Fluid Compute is the recommended pattern.

### Pitfall 8: Claude Marketplace rejection for missing `/.well-known/oauth-protected-resource`
**What goes wrong:** Listing submitted; Anthropic review bot can't find auth discovery → rejected.
**Why it happens:** MCP 2025-06-18 MANDATES RFC 9728 metadata (§Authorization Server Discovery).
**How to avoid:** Ship `api/.well-known/oauth-protected-resource.js` + `api/.well-known/oauth-authorization-server.js` BEFORE submitting. Test with `curl https://markos.dev/.well-known/oauth-protected-resource`.

### Pitfall 9: Tenant-binding doesn't survive tenant deletion
**What goes wrong:** Session bound to tenant T. T gets offboarded → purged (Phase 201 D-14). Session still valid; tool calls 500 (`tenant not found`).
**Why it happens:** `markos_mcp_sessions.tenant_id` cascades on tenant delete — but session row disappears silently; tests don't catch it.
**How to avoid:** `tenant_id text not null references markos_tenants(id) on delete cascade` (already in migration 88 pattern). Add a test: offboard a tenant → confirm MCP session lookup returns null → 401 returned to client.

### Pitfall 10: Docs-as-code skew — marketplace.json updated but docs/mcp-tools.md out of date
**What goes wrong:** Marketplace lists 30 tools, docs list 10. Users file "broken docs" bugs.
**Why it happens:** Two sources of truth.
**How to avoid:** Generate `docs/mcp-tools.md` from `lib/markos/mcp/tools/index.cjs` via a codegen script (similar to `scripts/openapi/build-openapi.cjs`). CI fails if drift.

---

## Code Examples

### Example 1: Opaque token issuance at OAuth /token endpoint

```javascript
// api/oauth/token.js — POST exchanges authorization_code + PKCE verifier → opaque bearer token
// Source: [CITED: modelcontextprotocol.io/specification/2025-06-18/basic/authorization]
'use strict';

const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const { getSupabase } = require('../../lib/markos/auth/session.ts');
const { consumeAuthorizationCode } = require('../../lib/markos/mcp/oauth.cjs');
const { writeJson } = require('../../lib/markos/crm/api.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const { grant_type, code, code_verifier, client_id, resource, redirect_uri } = await readForm(req);
  if (grant_type !== 'authorization_code') return writeJson(res, 400, { error: 'unsupported_grant_type' });

  // 1. Look up + consume the authorization code (one-time use, 60s TTL, redis-backed)
  const codeRow = await consumeAuthorizationCode(code);
  if (!codeRow) return writeJson(res, 400, { error: 'invalid_grant' });

  // 2. Verify PKCE — S256 challenge ONLY (no 'plain' allowed per MCP spec)
  const computed_challenge = createHash('sha256').update(code_verifier).digest('base64url');
  const stored_challenge = Buffer.from(codeRow.code_challenge);
  const computed = Buffer.from(computed_challenge);
  if (stored_challenge.length !== computed.length || !timingSafeEqual(stored_challenge, computed)) {
    return writeJson(res, 400, { error: 'invalid_grant', error_description: 'PKCE verifier mismatch' });
  }

  // 3. Verify client_id + redirect_uri + resource (RFC 8707 audience binding)
  if (codeRow.client_id !== client_id) return writeJson(res, 400, { error: 'invalid_client' });
  if (codeRow.redirect_uri !== redirect_uri) return writeJson(res, 400, { error: 'invalid_grant' });
  if (codeRow.resource !== resource) return writeJson(res, 400, { error: 'invalid_target' });

  // 4. Mint opaque token + store session row
  const opaque_token = randomBytes(32).toString('hex');
  const token_hash = createHash('sha256').update(opaque_token).digest('hex');
  const supabase = getSupabase();
  const { error } = await supabase.from('markos_mcp_sessions').insert({
    id: `mcp-sess-${randomBytes(8).toString('hex')}`,
    token_hash,
    user_id: codeRow.user_id,
    tenant_id: codeRow.tenant_id,
    org_id: codeRow.org_id,
    client_id,
    scopes: codeRow.scopes,
    plan_tier: codeRow.plan_tier,
  });
  if (error) return writeJson(res, 500, { error: 'internal_error' });

  // 5. Respond per OAuth 2.1 Section 5.1 — no refresh token for this public client
  res.setHeader('Cache-Control', 'no-store');
  return writeJson(res, 200, {
    access_token: opaque_token,
    token_type: 'Bearer',
    expires_in: 86400, // 24h — but rolling, extended on every call
    scope: codeRow.scopes.join(' ')
  });
};
```

### Example 2: Compiled AJV registry

```javascript
// lib/markos/mcp/ajv.cjs — one Ajv instance compiled once at module load
'use strict';
const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;

const ajv = new Ajv({ strict: true, strictSchema: true, allErrors: false, useDefaults: false, removeAdditional: false });
addFormats(ajv);

// Schemas are inlined by codegen from contracts/F-90..F-95 at build time; keyed by tool_id
const SCHEMAS = require('./_generated/tool-schemas.json'); // { tool_id: { input, output } }

const compiled = new Map();
for (const [tool_id, schemas] of Object.entries(SCHEMAS)) {
  ajv.addSchema(schemas.input, `${tool_id}.input`);
  ajv.addSchema(schemas.output, `${tool_id}.output`);
  compiled.set(tool_id, {
    validateInput: ajv.getSchema(`${tool_id}.input`),
    validateOutput: ajv.getSchema(`${tool_id}.output`),
  });
}

function getToolValidator(tool_id) {
  const v = compiled.get(tool_id);
  if (!v) throw new Error(`no_validator:${tool_id}`);
  return v;
}

module.exports = { getToolValidator };
```

### Example 3: Resources list + subscribe

```javascript
// lib/markos/mcp/resources/index.cjs — 3 resources per D-25
// Source: [CITED: modelcontextprotocol.io/specification/2025-06-18/server/resources]
'use strict';
const RESOURCE_TEMPLATES = [
  { uriTemplate: 'mcp://markos/canon/{tenant}', name: 'canon', title: 'Brand canon for tenant', mimeType: 'application/json' },
  { uriTemplate: 'mcp://markos/literacy/{tenant}', name: 'literacy', title: 'Literacy library for tenant', mimeType: 'application/json' },
  { uriTemplate: 'mcp://markos/tenant/status', name: 'tenant-status', title: 'Current tenant health', mimeType: 'application/json' },
];
// ... resolveResource(uri, session) returns { contents: [{ uri, mimeType, text }] }

// Subscribe list lives in Upstash Redis: key = sub:resource:<uri>, value = SET of session_ids.
// When a tenant canon mutates, hook in copilot / literacy writer calls broadcastResourceUpdated(uri).
```

### Example 4: Structured log line per D-30

```javascript
// lib/markos/mcp/log-drain.cjs
// Source: [CITED: vercel.com/docs/drains/reference/logs] — Vercel parses console.log JSON into message field
'use strict';
function emitLogLine({ req_id, session_id, tenant_id, tool_id, duration_ms, status, cost_cents, error_code }) {
  // Vercel Log Drains picks up console.log as source='lambda', puts payload in `message`.
  // Third-party sinks (Datadog, Logflare) auto-parse JSON `message` into structured fields.
  console.log(JSON.stringify({
    domain: 'mcp',
    req_id, session_id, tenant_id, tool_id,
    duration_ms, status, cost_cents,
    error_code: error_code || null,
    timestamp: new Date().toISOString(),
  }));
}
module.exports = { emitLogLine };
```

### Example 5: Sentry wrapping

```javascript
// lib/markos/mcp/sentry.cjs
// Source: [CITED: docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup]
'use strict';
const Sentry = require('@sentry/nextjs');

function captureToolError(error, { req_id, session_id, tenant_id, tool_id }) {
  Sentry.captureException(error, {
    tags: { domain: 'mcp', tool_id, status: 'error' },
    extra: { req_id, session_id, tenant_id }
  });
}
module.exports = { captureToolError };
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MCP stdio transport + API keys in env | HTTP transport + OAuth 2.1 + PKCE (RFC 9728 + 8414 + 8707) | MCP spec 2025-06-18 | HTTP is now the default for remote servers; stdio is local-only. All marketplace clients expect OAuth discovery. |
| Custom auth flows per vendor | MCP-standard OAuth metadata endpoints | Same release | A single MCP client (Claude, Cursor, VS Code) can auth with any MCP server without vendor-specific flows. |
| Tool-by-tool rate-limiting | Sliding-window rate-limit at the session + tenant layer | Post-Cloudflare-Workers era | Rate-limit-per-tool breaks under agentic use (agent makes 6 calls in a row); per-session + per-tenant works. |
| Shipped-then-tested MCP servers | Contract-first + AJV strict validation + deterministic eval suite | MarkOS QA-01..QA-08 discipline | Phase 202 has deterministic tests for every tool BEFORE handlers ship. |
| Console.log monitoring | Structured JSON to Vercel Log Drains + OTEL traces to Vercel Observability + Sentry capture | Vercel + Sentry 2025 | Correlation via `req_id` across log + trace + error is table-stakes for SOC 2 prep (Phase 206). |
| Single-endpoint marketplace | Vercel Rolling Releases for progressive rollout [CITED: vercel.com/changelog/rolling-releases-are-now-generally-available] | June 2025 GA | No canary endpoint needed; server-side rollout + instant rollback invisible to marketplace. |

**Deprecated/outdated (don't do):**
- **Auth via headers only (no OAuth)** — Claude Marketplace cert requires MCP 2025-06-18 compliance.
- **PKCE `plain` challenge method** — S256 only.
- **Shared secret / API-key auth for remote MCP** — deprecated in favor of OAuth.
- **`vercel.json` for cron config** — migrated to `vercel.ts` in Phase 201.
- **`@modelcontextprotocol/sdk` < 1.26.0** — [CITED: npmjs] has a known security vulnerability; current install is 1.29.0 (safe).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@upstash/ratelimit` + `@upstash/redis` not yet in `package.json` | Standard Stack | [VERIFIED: package.json lines 59-84 — not listed; need to add]. If already present via phase 201 under a different key name, dedup. |
| A2 | `@sentry/nextjs` not in `package.json` | Standard Stack | [VERIFIED: package.json — not listed]. Confirm no existing Sentry setup elsewhere before adding instrumentation.ts (which is a Next.js conventional file). |
| A3 | Free-tier cap of 100 cents/day ($1/day) aligns with D-21 | Cost table | [ASSUMED] — D-21 says "$1/day per tenant" verbatim. Confirmed. |
| A4 | Claude API pricing snapshot: Sonnet 4.6 $3/$15 per million tokens; Opus 4.7 pricing to confirm | Cost table | [CITED: platform.claude.com/docs/en/about-claude/pricing via WebSearch 2026-04-17]. Opus 4.7 at planning time — planner MUST re-verify rates from `platform.claude.com/docs/en/about-claude/pricing`. |
| A5 | Vercel Log Drains parses `message` JSON into structured fields | Observability | [CITED: vercel.com/docs/drains/reference/logs + vercel.com/docs/functions/logs] — Vercel's doc says JSON is the default format; third-party receivers do structured parsing. Sentry / Datadog / Logflare all parse `message`. |
| A6 | Vercel Rolling Releases supports `api/mcp/*` route-level progressive rollout without breaking session stickiness | Release channel | [CITED: vercel.com/docs/rolling-releases] — works at deployment level. But MCP sessions are DB-backed, so both candidates can serve any session. No stickiness needed. |
| A7 | VS Code MCP config uses `.vscode/mcp.json` with `"servers"` key (NOT `"mcpServers"`) | VS Code cert | [CITED: code.visualstudio.com/docs/copilot/reference/mcp-configuration]. Verified. |
| A8 | Claude Marketplace review criteria not publicly documented | Marketplace checklist | [ASSUMED — critical risk]. No formal policy doc found. Derived from: (a) spec compliance (MCP 2025-06-18 endpoints present), (b) `.claude-plugin/marketplace.json` existing schema, (c) community mcp-handler + Descope + Stytch example repos. Planner MUST check Anthropic's current submission portal for policy updates at plan time. |
| A9 | Cost-table base rates (e.g., `draft_message` base = 2 cents) | Cost table | [ASSUMED] — placeholder per CONTEXT.md `<specifics>` example. Planner picks final values per Claude's Discretion. |
| A10 | 24h rolling cost window stored hourly-bucketed in Postgres | Pattern 3 | [ASSUMED but reasonable] — could also use Upstash sliding-window counter. Postgres gives audit trail + RLS + consistency with `markos_mcp_sessions.tenant_id`. Planner may choose Upstash if latency-sensitive. |
| A11 | Hero demo `plan_campaign` is LLM-backed (cost-metered, streaming) | Tool inventory | [INFERRED from D-26 + D-04]. Confirmed by D-26 listing it in "LLM-backed tools only" for streaming. |
| A12 | `markos_orgs.plan_tier` column exists (for free-tier gate) | Free-tier gate | [ASSUMED] — D-21 references it verbatim. Grep `lib/markos/orgs/*` at plan time to confirm column exists; if not, add in migration 88. |

**Planner action:** Claims A4, A8, A9, A10 need verification or user input before becoming plan-level decisions.

---

## Open Questions

### Q1: Does the Claude Marketplace review API accept OAuth `/register` via Dynamic Client Registration, or does the marketplace need a static client_id?
**What we know:** MCP 2025-06-18 says SHOULD support DCR (RFC 7591). `mcp-handler` supports DCR endpoints. Claude Marketplace submission URL is not public.
**What's unclear:** Whether marketplace submission requires a pre-registered client_id or uses DCR like any other client.
**Recommendation:** Ship BOTH — DCR endpoint for open MCP clients (VS Code) + a static `client_id` specifically for marketplace cert (stored in `.claude-plugin/marketplace.json` or a new `client_id` field).

### Q2: Should session cookies (/oauth pages) and bearer tokens (/api/mcp) share any crypto material?
**What we know:** They should NOT — different scopes, different audience claims, different revoke surfaces. But convenient to bind them (e.g., revoke session cookie → revoke all MCP sessions for that user).
**What's unclear:** Whether user-facing `/settings/sessions` (Phase 201) should list MCP sessions alongside device sessions, or whether `/settings/mcp` is wholly separate.
**Recommendation:** `/settings/mcp` is separate (D-12 locks it). Revoking a web session does NOT revoke MCP sessions; MCP sessions are separately revoked via the new list.

### Q3: For free-tier `$1/day` cap — what is the cap denomination if `plan_tier != 'free'`?
**What we know:** D-21 says "$1/day for free". D-10 says per-tenant 24h rolling cap in cents. Nothing about paid cap amount.
**What's unclear:** Paid tier has what cap — $10/day? Unlimited? Stripe-metered (Phase 205)?
**Recommendation:** Set paid-tier cap to a high internal default ($100/day = 10000 cents) in 202 as a safety net. Phase 205 Stripe metered billing replaces the cap with an invoice-based flow.

### Q4: What `model_id` values go in the cost-table?
**What we know:** D-09 says `{ tool_id, model_id }`. `<specifics>` example uses `claude-sonnet-4-6`.
**What's unclear:** Do we key by Anthropic's model alias (`claude-sonnet-4-6`) or the full model string (`claude-sonnet-4-6-20240229`)?
**Recommendation:** Use the version-anchored model string (`claude-opus-4-7-20260301`). Aliases change silently; version-anchored costs audit correctly. Pair with `lib/markos/llm/provider-registry.ts` which already tracks this.

### Q5: Does Phase 205 (billing) need a 202 migration hook?
**What we know:** 205 ships Stripe billing. 202 emits `cost_cents` in audit rows + a cost window table.
**What's unclear:** Whether 202 should emit to `markos_llm_call_events` (Phase 201 table, confirmed in QA-15) for reconciliation.
**Recommendation:** Yes — every LLM-backed MCP tool invocation writes to `markos_llm_call_events` with `source='mcp'` + `session_id` + `tenant_id`. Reuses existing phase-201 telemetry; 205 doesn't need another source to reconcile.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@modelcontextprotocol/sdk` | Server types + Resource types | ✓ | 1.29.0 | — |
| `ajv` | Input + output validation | ✓ | 8.18.0 | — |
| `@supabase/supabase-js` | Session + cost + audit storage | ✓ | 2.58.0 | — |
| `@anthropic-ai/sdk` | LLM-backed tools | ✓ | 0.82.0 | — |
| `@upstash/ratelimit` + `@upstash/redis` | Rate-limit + approval token + resource subscribers | ✗ | — | Would need SQL-based sliding-window — much slower + stampede risk. **BLOCKING without Upstash.** |
| `@sentry/nextjs` | Exception capture per D-32 | ✗ | — | Could use `console.error` alone, but D-32 explicitly names Sentry. **BLOCKING without Sentry.** |
| `ajv-formats` | `format: date-time / email` on schemas | ✗ | — | Strip format validators from F-contracts (not acceptable). **BLOCKING.** |
| Vercel Observability | Latency SLO enforcement (D-19) | ✓ (assumed project has it enabled) | — | Fall back to custom `console.log` timing, alert via Sentry — degraded but functional |
| Vercel Log Drains | Structured logs for SOC 2 (D-30) | ✓ (Pro plan feature; assumed MarkOS has Pro) | — | Fall back to Vercel Function logs in-dashboard only — no offsite drain. Degraded. |
| Vercel Rolling Releases | Progressive rollout (D-31) | ✓ (GA June 2025) | — | Fall back to instant rollback via `vercel rollback` — less gradual but functional |
| Upstash Redis (service) | Rate-limit + approval + pub/sub | ✓ (already in project via Phase 201 — confirm `UPSTASH_REDIS_REST_URL` env present) | — | Spin up new Upstash instance; negligible cost |
| Supabase Postgres | Session + cost window | ✓ | — | — |

**Missing dependencies with no fallback:**
- `@upstash/ratelimit` + `@upstash/redis` + `@sentry/nextjs` + `ajv-formats` are npm install, no blocker.

**Missing dependencies with fallback:**
- Vercel Log Drains / Observability degrade gracefully if Pro-tier not active.

---

## Tool Inventory (30 tools)

### Live at start of Phase 202 (2, retained)
| # | Tool | Wire | Source Library | Latency tier | Mutating | Free-tier |
|---|------|------|----------------|--------------|----------|-----------|
| 1 | `draft_message` | LLM copilot | `bin/lib/generate-runner.cjs#runDraft` | llm | no | NO (paid — write-heavy LLM) |
| 2 | `run_neuro_audit` | LLM copilot | `bin/lib/generate-runner.cjs#auditDraft` | llm | no | YES (read-only) |

### Wave-0 stubs → live (8, from D-02)
| # | Tool | Wire target | Source Library | Latency tier | Mutating | Free-tier |
|---|------|------|----------------|--------------|----------|-----------|
| 3 | `plan_campaign` | LLM copilot (hero) | new `lib/markos/mcp/tools/marketing/plan-campaign.cjs` → `lib/markos/crm/copilot.ts` + LLM | llm | no | NO |
| 4 | `research_audience` | canon/literacy read | `lib/markos/packs/pack-loader.cjs` + literacy reader (to build) | simple | no | YES |
| 5 | `generate_brief` | LLM brief parser | `bin/lib/brief-parser.cjs` + LLM completion | llm | no | YES |
| 6 | `audit_claim` | LLM + evidence lookup | new handler wrapping canon evidence lookup + LLM classifier | llm | no | YES |
| 7 | `list_pain_points` | canon read | `lib/markos/packs/pack-loader.cjs` pain-point taxonomy | simple | no | YES |
| 8 | `rank_execution_queue` | CRM read | `lib/markos/crm/execution.ts` (ranking logic) | simple | no | YES |
| 9 | `schedule_post` | CRM write (MUTATING) | `lib/markos/crm/outbound/*` channel-queue write | simple | YES | NO |
| 10 | `explain_literacy` | literacy read | literacy reader + pack archetypes | simple | no | YES |

### Net-new (20 tools, marketing-weighted per D-01)

**Marketing (10) — all marketing tools leverage copilot / audit / pack stacks:**
| # | Tool | 1-2 sentence summary | Wires to |
|---|------|----------------------|----------|
| 11 | `remix_draft` | Take an existing draft + variant directive (shorter / more formal / different angle); return N remixed variants. LLM-backed. | `bin/lib/generate-runner.cjs` + pack voice guide |
| 12 | `rank_draft_variants` | Score N drafts against brand voice + neuro-audit + claim-check; return ranked list. | `bin/lib/generate-runner.cjs#auditDraft` looped + score aggregation |
| 13 | `brief_to_plan` | Expand a brief into a 5-step execution plan (research → pain → promise → drafts → schedule). LLM-backed. | LLM planner + `plan_campaign` shape |
| 14 | `generate_channel_copy` | Produce channel-ready blocks (subject line + preview + body + CTA) for email / X / LinkedIn / SMS. LLM-backed. | `bin/lib/generate-runner.cjs` + channel preset |
| 15 | `expand_claim_evidence` | Given a marketing claim, return supporting canon evidence + suggested strengthening variants. LLM + canon read. | canon lookup + LLM scoring |
| 16 | `clone_persona_voice` | Given brand canon + persona archetype, return a voice-cloned draft. LLM-backed. | pack `voice` + `persona` fields + LLM |
| 17 | `generate_subject_lines` | Input: draft body → output: 10 ranked subject-line candidates. LLM + ranker. | LLM + `run_neuro_audit` scoring |
| 18 | `optimize_cta` | Input: draft → output: alternative CTA options ranked by historical click-weight heuristic. LLM + CRM reporting. | `lib/markos/crm/reporting.ts` + LLM |
| 19 | `generate_preview_text` | Email-specific — given subject + body → 5 preview-text candidates. LLM-backed. | LLM |
| 20 | `audit_claim_strict` | Deeper version of `audit_claim` — forces canon cite + confidence score. | canon + evidence-pack pattern |

**CRM (5):**
| # | Tool | Summary | Wires to |
|---|------|---------|----------|
| 21 | `list_crm_entities` | List CRM entities (contacts/accounts) filtered by tenant + kind + simple filter. Read-only. | `lib/markos/crm/entities.cjs#listCrmEntities` |
| 22 | `query_crm_timeline` | Get activity timeline for an entity. Read-only. | `lib/markos/crm/timeline.cjs#buildCrmTimeline` |
| 23 | `snapshot_pipeline` | Return pipeline-stage aggregate counts. Read-only. | `lib/markos/crm/api.cjs#listPipelineConfigs` + aggregation |
| 24 | `read_segment` | Resolve a segment key → list of matching entity IDs. Read-only. | entities + segment resolver |
| 25 | `summarize_deal` | LLM summary of a CRM deal (activities + open tasks + next step). | CRM read + LLM |

**Literacy / Canon (3):**
| # | Tool | Summary | Wires to |
|---|------|---------|----------|
| 26 | `query_canon` | Given tenant + query → canon entries. Read-only. | canon reader |
| 27 | `explain_archetype` | Given archetype slug → canonical definition + examples. Read-only. | pack archetype data |
| 28 | `walk_taxonomy` | Walk literacy tree from node → children/neighbors. Read-only. | literacy reader |

**Tenancy (2, per D-01 "kept minimal"):**
| # | Tool | Summary | Wires to |
|---|------|---------|----------|
| 29 | `list_members` | List tenant members + roles. Read-only. | `api/tenant/members/list.js` equivalent |
| 30 | `query_audit` | Query the tenant audit log (last N events). Read-only. | `api/tenant/audit/list.js` equivalent |

**Allocation:** 2 + 8 + 20 = 30. Matches CONTEXT.md D-01.

---

## OAuth 2.1 + PKCE Flow (full)

Per [CITED: modelcontextprotocol.io/specification/2025-06-18/basic/authorization]:

**Endpoints MarkOS must ship:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /.well-known/oauth-protected-resource` | GET | RFC 9728 metadata — returns `{ authorization_servers: ["https://markos.dev/.well-known/oauth-authorization-server"], resource: "https://markos.dev/api/mcp", bearer_methods_supported: ["header"] }` |
| `GET /.well-known/oauth-authorization-server` | GET | RFC 8414 metadata — returns `{ issuer: "https://markos.dev", authorization_endpoint, token_endpoint, registration_endpoint, code_challenge_methods_supported: ["S256"], grant_types_supported: ["authorization_code"], response_types_supported: ["code"], scopes_supported: [...] }` |
| `POST /oauth/register` | POST | RFC 7591 Dynamic Client Registration. Returns `{ client_id, client_name, redirect_uris }`. Auth: none (open DCR). |
| `GET /oauth/authorize` | GET | Consent page — requires Phase-201 web session (magic-link). Query params: `client_id`, `redirect_uri`, `response_type=code`, `code_challenge`, `code_challenge_method=S256`, `scope`, `state`, `resource=https://markos.dev/api/mcp`. Renders the tenant picker (D-07) + scope list. |
| `POST /oauth/authorize/approve` | POST | Consent approve — body: `{ target_tenant_id }`. Server generates authorization_code, stores `{ code, code_challenge, user_id, tenant_id, org_id, client_id, redirect_uri, resource, scopes, plan_tier, ttl:60s }` in Upstash, redirects browser to `redirect_uri?code=...&state=...`. |
| `POST /oauth/token` | POST | Token exchange. Body: `grant_type=authorization_code&code=...&code_verifier=...&client_id=...&redirect_uri=...&resource=...`. Verifies PKCE S256, stores session in `markos_mcp_sessions`, returns `{ access_token, token_type: "Bearer", expires_in: 86400, scope }`. |
| `POST /oauth/revoke` | POST | User (or tenant admin) revokes a session by id or token. Sets `revoked_at = now()`. |

**Redirect URI pattern:**
- Claude Marketplace client uses `https://claude.ai/mcp/oauth/callback` (assume; verify at plan time).
- VS Code uses `http://127.0.0.1:33418` OR `https://vscode.dev/redirect` [CITED: microsoft/vscode issue + VS Code docs].
- During DCR, the client registers its redirect_uri(s); server stores + validates exact-match on `/oauth/authorize`.

**Refresh token behavior:** None in 202. Opaque token + 24h rolling TTL replaces refresh. Per [CITED: MCP spec] — auth servers SHOULD issue short-lived tokens + rotate refresh tokens for public clients; our rolling-TTL opaque is functionally equivalent (every call extends expiry, revocation is instant). If a client goes idle for 24h, they re-authorize.

**Consent page UX (D-07):**
1. User clicks "Install MarkOS MCP" in Claude/VS Code.
2. Client opens `GET /oauth/authorize?...` in browser.
3. If no Phase-201 web session, redirect to `/login?return_to=...`.
4. On return, render consent page:
   - Header: "MarkOS wants to connect via MCP"
   - Sub: "Choose workspace + review access scopes"
   - Tenant picker: dropdown from `listTenantsForUser` (only `status != 'purged'` shown)
   - Scopes list: human-readable ("Read marketing content", "Generate drafts", "Schedule posts")
   - Buttons: [Approve] [Deny]
5. On Approve → `POST /oauth/authorize/approve { target_tenant_id }` → 302 to `redirect_uri?code=...&state=...`.

---

## `markos_mcp_sessions` Schema

Full DDL already shown in Pattern 2. Columns + purpose:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | text PK | `mcp-sess-{hex(16)}`; referenced by audit + log rows |
| `token_hash` | text unique | `sha256(opaque_token)` hex — never plaintext |
| `user_id` | text | Phase-201 auth user who consented |
| `tenant_id` | text FK (cascade) | Bound at consent (D-07); 403 for cross-tenant tool calls |
| `org_id` | text FK (cascade) | For org-level revoke + billing correlation |
| `client_id` | text | OAuth client (marketplace, VS Code, or DCR-issued) |
| `scopes` | text[] | Granted scopes from consent |
| `plan_tier` | text | Snapshot of `markos_orgs.plan_tier` at consent time — used for D-21 free-tier write gate |
| `created_at` | timestamptz | Session birth |
| `last_used_at` | timestamptz | Extended on every successful tool call (D-06) |
| `expires_at` | timestamptz | `last_used_at + 24h`; reaper cron deletes rows where `now() > expires_at` |
| `revoked_at` | timestamptz? | Null = active; set on revoke (D-12 user action) |

**Indexes:**
- `idx_mmsess_token_hash` (partial `where revoked_at is null`) — hot path for auth lookups
- `idx_mmsess_tenant_id` — `/settings/mcp` list, revoke-by-tenant
- `idx_mmsess_user_tenant` — per-user session list
- `idx_mmsess_expires` — cleanup cron

**RLS:** Read own + read tenant-admin + update own + update tenant-owner (details above).

**Cleanup cron:** `vercel.ts` registers `/api/mcp/session/cleanup` at `0 */6 * * *` (every 6h) — deletes rows where `expires_at < now() - interval '7 days'` (hard-purge after 7 days post-expiry for audit replay window).

---

## Cost-Table Shape

```javascript
// lib/markos/mcp/cost-table.cjs — re-verify rates at plan time via platform.claude.com
// Source: [CITED: Anthropic pricing April 2026 — Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5, Opus 4.7 at plan time]
'use strict';

const MODEL_RATES = Object.freeze({
  // rates in cents per 1K tokens (input / output)
  'claude-sonnet-4-6-20260301':  { input_per_1k: 0.30, output_per_1k: 1.50 },  // $3/$15 per M = 0.3¢/1.5¢ per 1k
  'claude-opus-4-7-20260301':    { input_per_1k: 1.50, output_per_1k: 7.50 },  // placeholder — verify at plan time
  'claude-haiku-4-5-20260301':   { input_per_1k: 0.10, output_per_1k: 0.50 },  // $1/$5 per M
});

const COST_TABLE = Object.freeze({
  // Marketing LLM-backed
  'draft_message':      { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 800, out: 600 } },
  'plan_campaign':      { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1200, out: 1400 } },
  'audit_claim':        { base_cents: 1, model: 'claude-haiku-4-5-20260301', avg_tokens: { in: 600, out: 400 } },
  'audit_claim_strict': { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 800, out: 600 } },
  'run_neuro_audit':    { base_cents: 1, model: 'claude-haiku-4-5-20260301', avg_tokens: { in: 500, out: 200 } },
  'generate_brief':     { base_cents: 1, model: 'claude-haiku-4-5-20260301', avg_tokens: { in: 300, out: 800 } },
  'remix_draft':        { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1000, out: 1200 } },
  'rank_draft_variants':{ base_cents: 1, model: 'claude-haiku-4-5-20260301', avg_tokens: { in: 2000, out: 400 } },
  'brief_to_plan':      { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1000, out: 1500 } },
  'generate_channel_copy': { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 800, out: 1000 } },
  'expand_claim_evidence': { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1500, out: 800 } },
  'clone_persona_voice':   { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1500, out: 1000 } },
  'generate_subject_lines':{ base_cents: 1, model: 'claude-haiku-4-5-20260301', avg_tokens: { in: 500, out: 300 } },
  'optimize_cta':       { base_cents: 1, model: 'claude-haiku-4-5-20260301', avg_tokens: { in: 500, out: 300 } },
  'generate_preview_text':{ base_cents: 1, model: 'claude-haiku-4-5-20260301', avg_tokens: { in: 300, out: 200 } },
  'summarize_deal':     { base_cents: 1, model: 'claude-haiku-4-5-20260301', avg_tokens: { in: 1000, out: 400 } },

  // Non-LLM (simple-tier) — flat cents
  'research_audience':  { base_cents: 1, model: null },
  'list_pain_points':   { base_cents: 0, model: null }, // free — pure read
  'rank_execution_queue':{ base_cents: 1, model: null },
  'schedule_post':      { base_cents: 2, model: null }, // mutating; small penalty for write
  'explain_literacy':   { base_cents: 0, model: null },
  'query_canon':        { base_cents: 0, model: null },
  'explain_archetype':  { base_cents: 0, model: null },
  'walk_taxonomy':      { base_cents: 0, model: null },
  'list_crm_entities':  { base_cents: 0, model: null },
  'query_crm_timeline': { base_cents: 0, model: null },
  'snapshot_pipeline':  { base_cents: 0, model: null },
  'read_segment':       { base_cents: 0, model: null },
  'list_members':       { base_cents: 0, model: null },
  'query_audit':        { base_cents: 0, model: null },
});

function computeToolCost(tool_id, { input_tokens = 0, output_tokens = 0 } = {}) {
  const t = COST_TABLE[tool_id];
  if (!t) throw new Error(`no_cost:${tool_id}`);
  let cents = t.base_cents;
  if (t.model) {
    const r = MODEL_RATES[t.model];
    cents += Math.ceil(r.input_per_1k * (input_tokens / 1000) + r.output_per_1k * (output_tokens / 1000));
  }
  return cents;
}

function estimateToolCost(tool_id) {
  const t = COST_TABLE[tool_id];
  if (!t || !t.model) return t?.base_cents || 0;
  return computeToolCost(tool_id, { input_tokens: t.avg_tokens.in, output_tokens: t.avg_tokens.out });
}

module.exports = { COST_TABLE, MODEL_RATES, computeToolCost, estimateToolCost };
```

**Handler flow (cost):**
1. Pipeline step 7 calls `estimateToolCost(tool_id)` → reserves that many cents via `check_and_charge_mcp_budget`.
2. Handler invokes LLM; Anthropic SDK returns `usage.input_tokens` + `usage.output_tokens` in response.
3. Pipeline step 9/10 calls `computeToolCost(tool_id, usage)` → true-up (delta = actual - estimated). If delta > 0, charge again (can push over cap — user already committed to the tool; we accept the overage; next call gets blocked).
4. Log line + audit row carry `cost_cents = actual`.

**Free-tier cap:** 100 cents/24h per tenant (D-21 $1/day). Paid-tier default 10000 cents/24h (open question Q3 — planner picks).

---

## 402 Response Shape (budget exhausted)

```json
{
  "jsonrpc": "2.0",
  "id": <request_id>,
  "error": {
    "code": -32001,
    "message": "budget_exhausted",
    "data": {
      "error": "budget_exhausted",
      "reset_at": "2026-04-18T14:00:00Z",
      "spent_cents": 100,
      "cap_cents": 100,
      "req_id": "mcp-req-<uuid>"
    }
  }
}
```

Over-HTTP response: `HTTP/1.1 402 Payment Required` with `Content-Type: application/json`.
MCP client (Claude Desktop / VS Code) interprets JSON-RPC error code `-32001` as a custom MarkOS domain error (per [CITED: JSON-RPC 2.0 spec] — `-32000` to `-32099` reserved for server-defined codes).

## 429 Response Shape (rate-limited)

```json
{
  "jsonrpc": "2.0",
  "id": <request_id>,
  "error": {
    "code": -32002,
    "message": "rate_limited",
    "data": {
      "error": "rate_limited",
      "scope": "session|tenant",
      "retry_after": 37,
      "limit": 60,
      "req_id": "mcp-req-<uuid>"
    }
  }
}
```

HTTP response: `HTTP/1.1 429 Too Many Requests` with header `Retry-After: 37` (seconds).

---

## Strict AJV Validation

**Compile-time vs runtime:**
- **Build step:** `scripts/openapi/build-mcp-schemas.mjs` (NEW) reads `contracts/F-90..F-95-*.yaml` + extracts per-tool `input` + `output` schemas → emits `lib/markos/mcp/_generated/tool-schemas.json`.
- **Runtime:** `lib/markos/mcp/ajv.cjs` loads the generated JSON, creates ONE Ajv instance, compiles every schema at module load (≤ 5ms for 30 tools × 2 schemas).

**Strict mode flags:**
```javascript
new Ajv({
  strict: true,               // reject unknown keywords + ambiguous schemas
  strictSchema: true,          // flag unknown keywords
  strictTypes: true,           // require explicit type
  allErrors: false,            // short-circuit on first error — performance
  removeAdditional: false,     // NEVER remove — we want strict rejection per D-14
  useDefaults: false,          // inputs must be explicit
  coerceTypes: false,          // no silent type coercion — e.g. string "5" NOT accepted for number
});
addFormats(ajv);               // date-time, email, uri
```

**$ref resolution:** F-contracts reference shared shapes (e.g. `components/schemas/TenantId`). Build script inlines all refs OR uses AJV's `addSchema` for each shared schema + `$id` URLs. Inline is simpler for 30 tools; keep schemas flat.

**Prompt-injection deny-list (D-14):**
```javascript
// lib/markos/mcp/injection-denylist.cjs
'use strict';
const PATTERNS = [
  /ignore\s+(all\s+)?previous\s+(instructions|messages|rules)/i,
  /system\s*:\s*you\s+are/i,
  /\[INST\]/i,                            // Llama instruction token
  /<\|im_start\|>/i,                      // ChatML-style injection
  /sudo\s+mode/i,
  /enable\s+(dev|developer|admin)\s+mode/i,
  /forget\s+(everything|all)/i,
  /you\s+are\s+now\s+(dan|the|a\s+free)/i,
];

function checkInjectionDenylist(args) {
  for (const [key, val] of walk(args)) {
    if (typeof val !== 'string') continue;
    const normalized = val.normalize('NFKC').toLowerCase();
    for (const p of PATTERNS) if (p.test(normalized)) return { key, pattern: p.source };
  }
  return null;
}

function* walk(obj, path = '') {
  if (obj == null) return;
  if (typeof obj !== 'object') { yield [path, obj]; return; }
  for (const [k, v] of Object.entries(obj)) yield* walk(v, path ? `${path}.${k}` : k);
}

module.exports = { checkInjectionDenylist, PATTERNS };
```

Test plan: for each pattern, plus a Unicode confusable test (`Іgnore` with Cyrillic I), deny-list must catch it.

---

## MCP Resources + Streaming

### Resources (D-25)
Per the spec, `capabilities: { resources: { subscribe: true, listChanged: false } }` (we don't dynamically add/remove resources, so listChanged stays false). Protocol methods:
- `resources/list` — return 3 static resource templates
- `resources/templates/list` — return the 3 parameterized URIs
- `resources/read` — fetch content for a URI, tenant-scoped via session
- `resources/subscribe` — register session to be notified of a specific URI change
- `resources/unsubscribe` — deregister

**Storage of subscriptions:** Upstash Redis set `subs:mcp:<uri>` (members = session_ids). TTL matches session TTL (24h). On notification broadcast, server iterates set and pushes via SSE. SSE channel for subscriptions = same `api/mcp/session` endpoint, but held open (Vercel Fluid Compute handles this).

### Streaming Progress Events (D-26)
Per [CITED: modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle#notifications/progress], use `notifications/progress` during a `tools/call`:

```javascript
// SSE frame format over tools/call streaming response
data: {"jsonrpc":"2.0","method":"notifications/progress","params":{"progressToken":"<from_request_meta>","progress":0.3,"total":1.0,"message":"drafting block 2 of 5"}}\n\n
```

**Implementation:** LLM-backed tools inspect `_meta.progressToken` in request params. If present → response type = `text/event-stream`, write progress notifications periodically, end with final JSON-RPC result. If absent → buffered response (normal tools/call).

### notifications/resources/updated (D-27)
Hook points in existing write paths:
- Canon mutations → `api/canon/*.js` → after write, call `broadcastResourceUpdated('mcp://markos/canon/{tenant}')`
- Literacy mutations → `lib/markos/packs/pack-loader.cjs` write path → call broadcast
- Tenant status changes → `lib/markos/tenant/lifecycle.cjs` → on status flip → call broadcast

`broadcastResourceUpdated(uri)` iterates `subs:mcp:<uri>` set in Redis, pushes to each subscribed SSE channel. Missing SSE channel (client disconnected) → remove subscription.

---

## Vercel Observability + Log Drains (D-29 + D-30)

**Log Drain payload (per [CITED: vercel.com/docs/drains/reference/logs]):** Vercel wraps each `console.log` line as `{ source: 'lambda', message: '<stdout>', requestId, projectId, deploymentId, timestamp, ... }`. Our `emitLogLine` writes JSON into `message`; downstream sinks (Sentry Logs, Datadog, Logflare) parse `message` as JSON and surface the nested fields.

**Our log line shape (D-30):**
```json
{
  "domain": "mcp",
  "req_id": "mcp-req-01HXYZ...",
  "session_id": "mcp-sess-abc123",
  "tenant_id": "tenant-uuid",
  "tool_id": "draft_message",
  "duration_ms": 238,
  "status": "ok",
  "cost_cents": 3,
  "error_code": null,
  "timestamp": "2026-04-17T12:00:00Z"
}
```

**Correlation:** `req_id` is the glue. Same UUID appears in:
1. JSON-RPC response envelope (`result._meta.req_id`)
2. Log Drain entry above
3. `markos_audit_log.payload.req_id`
4. Sentry event `extra.req_id` + `tag.req_id`

Support team debugs by grep'ing `mcp-req-<uuid>`.

**Vercel Observability spans:**
```javascript
// Per-handler — wrap invocation in a named span
// Source: Vercel Observability auto-instruments via @vercel/otel
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('mcp-tools');
const span = tracer.startSpan(`tool.${tool_id}`);
span.setAttributes({ tenant_id, session_id, tool_id, latency_tier, req_id });
try { /* handler */ } finally { span.end(); }
```

**Latency SLO alerts (D-19):** Configured in Vercel Observability UI (or via Terraform). Alert: `p95(tool.draft_message.duration_ms) over 15m > 300` (simple tools) — fires → Slack webhook. Alert is declarative; no code change needed.

---

## @sentry/nextjs Setup

**Files to add:**
```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,    // 10% sampling for traces; errors always captured
  environment: process.env.VERCEL_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}
export const onRequestError = (await import('@sentry/nextjs')).captureRequestError;
```

```typescript
// next.config.ts — wrap existing config (careful: Phase 201 may have set this already)
import { withSentryConfig } from '@sentry/nextjs';
export default withSentryConfig(nextConfig, {
  org: 'markos',
  project: 'markos-web',
  silent: !process.env.CI,
});
```

**Per-request capture (our pipeline):**
```javascript
// lib/markos/mcp/sentry.cjs
const Sentry = require('@sentry/nextjs');

function captureToolError(err, { req_id, session_id, tenant_id, tool_id }) {
  Sentry.captureException(err, {
    tags: { domain: 'mcp', tool_id, status: 'error' },
    extra: { req_id, session_id, tenant_id },   // NB: per github.com/getsentry/sentry-javascript/issues/9003, pass directly — scope doesn't persist on Vercel
  });
}

module.exports = { captureToolError };
```

**IMPORTANT:** [CITED: github.com/getsentry/sentry-javascript/issues/9003] — Scope does NOT persist between requests in Vercel serverless. Always pass tags + extra directly in `captureException` — don't rely on `Sentry.setContext` earlier in the call. Our `captureToolError` function handles this correctly.

**Response internals masking:** Per D-32, JSON-RPC response to client returns generic `internal_error` + `req_id`. Handler NEVER leaks stack trace or internal field names to client.

---

## VS Code MCP Setup (second cert per D-08)

**Config file:** `.vscode/mcp.json` in user project (or user-profile level). Per [CITED: code.visualstudio.com/docs/copilot/reference/mcp-configuration].

```json
{
  "servers": {
    "markos": {
      "type": "http",
      "url": "https://markos.dev/api/mcp"
    }
  }
}
```

**OAuth flow in VS Code:**
VS Code natively supports OAuth 2.1 discovery per [CITED: code.visualstudio.com/api/extension-guides/ai/mcp]. First connection:
1. VS Code fetches `/api/mcp` → receives 401 with `WWW-Authenticate` header.
2. VS Code reads `resource_metadata` → `/.well-known/oauth-protected-resource` → authorization_server URL.
3. VS Code attempts Dynamic Client Registration (`POST /oauth/register`) — gets client_id.
4. VS Code opens system browser to `/oauth/authorize?client_id=...&redirect_uri=http://127.0.0.1:33418&code_challenge=...&resource=https://markos.dev/api/mcp&...`.
5. User (in browser) signs in via magic-link (Phase 201), picks tenant, approves.
6. Browser redirects to `http://127.0.0.1:33418?code=...` — VS Code's local listener captures.
7. VS Code POSTs to `/oauth/token` with code + verifier → receives opaque bearer.
8. Subsequent calls send `Authorization: Bearer <token>`.

**Required redirect URIs:** `http://127.0.0.1:33418` + `https://vscode.dev/redirect` [CITED: microsoft/vscode issue #273655].

**Cert matrix (planner):**
| Check | Method | Expected |
|-------|--------|----------|
| Server metadata discovery | `curl https://markos.dev/.well-known/oauth-protected-resource` | 200 + valid RFC 9728 JSON |
| AS metadata discovery | `curl https://markos.dev/.well-known/oauth-authorization-server` | 200 + valid RFC 8414 JSON |
| DCR | `POST /oauth/register` with minimal body | 201 + `client_id` |
| 401 → WWW-Authenticate | `curl https://markos.dev/api/mcp` | 401 + header with `resource_metadata` URL |
| VS Code e2e | Install `.vscode/mcp.json` snippet → ask Copilot "list tools" | 30 tools listed |
| Tool call via VS Code | Call `list_pain_points` from chat | Returns pains array |
| Token expiry | Wait 24h idle → try call | 401 + client re-authorizes automatically |

---

## Claude Marketplace Cert Checklist

**[ASSUMED — see Q1] — Derived from MCP 2025-06-18 spec + existing `.claude-plugin/marketplace.json` schema + mcp-handler example patterns. Planner must re-verify with Anthropic's current submission docs.**

| Requirement | Evidence |
|-------------|----------|
| 1. Valid `.claude-plugin/marketplace.json` against `schemas.anthropic.com/claude-marketplace/v1.json` | Version 2.0.0, 30 tools, category `marketing`, `server.type: http`, `server.url: https://markos.dev/api/mcp`, `server.protocolVersion: 2025-06-18` |
| 2. HTTP endpoint is publicly reachable + returns valid MCP JSON-RPC | `POST /api/mcp { "jsonrpc":"2.0","id":1,"method":"initialize" }` returns 200 |
| 3. OAuth 2.1 + PKCE per MCP 2025-06-18 | `/.well-known/oauth-protected-resource` + `/.well-known/oauth-authorization-server` + `/oauth/authorize` + `/oauth/token` all live |
| 4. `tools/list` returns 30 tools with valid JSON Schema | AJV-compiled schemas in every descriptor |
| 5. At least one non-trivial working tool in free tier | `list_pain_points`, `query_canon`, `research_audience` — all free-tier read-only |
| 6. Logo/icon + README homepage | `marketplace.json.homepage: https://markos.dev`, icon 512x512 PNG at `public/mcp-icon.png` |
| 7. Clear description of what the server does | Matches D-24 listing copy |
| 8. Free + paid tier disclosure | `marketplace.json` gains `pricing: { tiers: [{ name: free, caps: "...$1/day..." }, { name: paid, caps: "..." }] }` — planner verifies schema supports this field |
| 9. Response to 401 includes RFC 9728 `WWW-Authenticate` | Confirmed in code pattern |
| 10. PKCE S256 only (no `plain`) | Token endpoint rejects `code_challenge_method=plain` |
| 11. No open-redirect in `/oauth/authorize` | Redirect URIs exact-match against pre-registered list |
| 12. HTTPS-only (all endpoints) | Vercel enforces TLS; `http://` redirected to `https://` (except `http://127.0.0.1:33418` for VS Code per spec exception) |

**Free vs paid tier declaration in manifest:** Assumed to go in `marketplace.json.pricing` — verify schema + use `$schema: .../v1.json` to lint locally.

**Submission pipeline:**
1. Local: `node scripts/marketplace/validate-manifest.mjs` (NEW script — AJV against Anthropic's schema URL)
2. Staging: deploy to `preview.markos.dev`, run marketplace review bot locally if available, confirm all well-known endpoints
3. Production: deploy to `markos.dev`, submit via Anthropic's marketplace dashboard (URL + contact)
4. Weekly KPI digest cron (D-23) queries `markos_audit_log where source_domain='mcp' and action='session.created'` → emails to founders

---

## File Inventory

Total new/modified files: **~80**. Planner will decompose across 3 waves + up to 10 plans.

### Migrations (2 new + 2 rollbacks)
- `supabase/migrations/88_markos_mcp_sessions.sql`
- `supabase/migrations/89_markos_mcp_cost_window.sql`
- `supabase/migrations/rollback/88_markos_mcp_sessions.down.sql`
- `supabase/migrations/rollback/89_markos_mcp_cost_window.down.sql`

### `lib/markos/mcp/**` (~25 files)
- `server.cjs` (extend)
- `tools/index.cjs` (rewrite — 30 tools)
- `tools/marketing/` (10 new)
- `tools/crm/` (5 new)
- `tools/literacy/` (3 new)
- `tools/tenancy/` (2 new)
- `tools/execution/` (1-2 new)
- `sessions.cjs` + `sessions.ts`
- `oauth.cjs` + `oauth.ts`
- `cost-table.cjs` + `cost-table.ts`
- `cost-meter.cjs` + `cost-meter.ts`
- `rate-limit.cjs` + `rate-limit.ts`
- `ajv.cjs` + `ajv.ts`
- `injection-denylist.cjs` + `injection-denylist.ts`
- `pipeline.cjs` + `pipeline.ts`
- `approval.cjs` + `approval.ts`
- `sse.cjs` + `sse.ts`
- `sentry.cjs` + `sentry.ts`
- `log-drain.cjs` + `log-drain.ts`
- `resources/index.cjs` + 3 resource files (canon / literacy / tenant-status)
- `_generated/tool-schemas.json` (codegen output)

### `api/**` (~10 routes)
- `api/mcp/session.js` (extend)
- `api/mcp/tools/[toolName].js` (extend)
- `api/mcp/resources.js` (NEW — if not folded into session.js)
- `api/mcp/session/cleanup.js` (NEW cron)
- `api/oauth/authorize.js`
- `api/oauth/authorize/approve.js`
- `api/oauth/token.js`
- `api/oauth/register.js`
- `api/oauth/revoke.js`
- `api/.well-known/oauth-protected-resource.js`
- `api/.well-known/oauth-authorization-server.js`
- `api/tenant/mcp/usage.js` (NEW — /settings/mcp backing)
- `api/tenant/mcp/sessions/list.js`
- `api/tenant/mcp/sessions/revoke.js`

### App surfaces (~4 files)
- `app/(markos)/settings/mcp/page.tsx` + `page.module.css`
- `app/(markos)/oauth/consent/page.tsx` + `page.module.css`

### Contracts (~7 new + 1 extended)
- `contracts/F-71-mcp-session-v2.yaml` (rev)
- `contracts/F-89-mcp-oauth-v1.yaml`
- `contracts/F-90-mcp-tools-marketing-v1.yaml`
- `contracts/F-91-mcp-tools-crm-v1.yaml`
- `contracts/F-92-mcp-tools-literacy-v1.yaml`
- `contracts/F-93-mcp-tools-tenancy-v1.yaml`
- `contracts/F-94-mcp-resources-v1.yaml`
- `contracts/F-95-mcp-cost-budget-v1.yaml`

### Docs (~4 new)
- `docs/mcp-tools.md`
- `docs/vscode-mcp-setup.md`
- `docs/oauth.md`
- `docs/llms/phase-202-mcp.md`
- `public/llms.txt` (extend)

### Marketplace
- `.claude-plugin/marketplace.json` (version 2.0.0, 30 tools)
- `public/mcp-icon.png` (NEW — 512×512)

### Tests (~20 suites, ~100+ tests total)
Listed under Test Inventory below.

### Config
- `vercel.ts` (add cron)
- `package.json` (deps)
- `sentry.server.config.ts` (NEW)
- `instrumentation.ts` (NEW or extend)
- `next.config.ts` (wrap with Sentry)

### Scripts
- `scripts/openapi/build-mcp-schemas.mjs` (NEW — generates `_generated/tool-schemas.json`)
- `scripts/marketplace/validate-manifest.mjs` (NEW — AJV lint)

---

## Validation Architecture

*(Required per phase config — `workflow.nyquist_validation` is not explicitly `false`.)*

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node --test` (built-in), configured via `package.json:"test": "node --test test/**/*.test.js"` |
| Config file | None — uses node test runner defaults |
| Quick run command | `node --test test/mcp/**/*.test.js` |
| Full suite command | `npm test` |
| Coverage tool | `node --test --experimental-test-coverage` (already used for LLM adapter) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| MCP-01 | 30 tools registered with valid schemas | unit | `node --test test/mcp/server.test.js` | extend |
| MCP-01 | Each of 30 tools has live backend (no stubs) | integration | `node --test test/mcp/tools/*.test.js` | Wave 0 (for 20 new) |
| MCP-01 | OAuth 2.1 + PKCE flow round-trips | integration | `node --test test/mcp/oauth.test.js` | Wave 0 |
| MCP-01 | Session token opaque + rolling TTL extends on tool call | integration (Supabase) | `node --test test/mcp/session.test.js` | Wave 0 |
| MCP-01 | Resources list + read + subscribe + notification push | integration | `node --test test/mcp/resources.test.js` + `notifications.test.js` | Wave 0 |
| MCP-01 | VS Code cert — `.vscode/mcp.json` snippet works | manual + docs smoke | `node scripts/marketplace/validate-manifest.mjs` | Wave 0 |
| MCP-01 | Claude Marketplace manifest valid | unit | `node --test test/mcp/marketplace-manifest.test.js` | Wave 0 |
| QA-01 | Every new endpoint has F-contract | grep + openapi-build | `npm run openapi:build && node --test test/openapi/openapi-build.test.js` | existing |
| QA-02 | Every tool input + output validated | unit (AJV harness) | `node --test test/mcp/ajv-validation.test.js` | Wave 0 |
| QA-04 | Coverage ≥ 80% lib/markos/mcp + 100% auth/cost | coverage | `node --test --experimental-test-coverage test/mcp/**/*.test.js` | Wave 0 |
| QA-07 | Load test MCP endpoint | k6/Artillery smoke | `node scripts/load/mcp-smoke.mjs` OR `k6 run scripts/load/mcp.k6.js` | Wave 0 |
| QA-08 | LLM-backed tool eval suite | eval | `node --test test/mcp/evals/*.test.js` | Wave 0 |
| QA-09 | OTEL span per handler + req_id correlation | integration | `node --test test/mcp/observability.test.js` | Wave 0 |
| QA-10 | Cost meter enforces 402 on breach | integration | `node --test test/mcp/cost-meter.test.js` + `402-breach.test.js` | Wave 0 |
| QA-11 | Prompt injection deny-list catches 10+ patterns | unit | `node --test test/mcp/injection-denylist.test.js` | Wave 0 |
| QA-12 | Rate-limit blocks after 60 rpm / 600 rpm | integration | `node --test test/mcp/rate-limit.test.js` + `429-breach.test.js` | Wave 0 |
| QA-13 | Migrations idempotent + rollback | SQL smoke | `node --test test/mcp/migration-idempotency.test.js` | Wave 0 |
| QA-14 | /settings/mcp WCAG 2.2 AA | axe-playwright (or grep-shape if Playwright not in 202) | `npm run test:ui-a11y` | existing framework |
| QA-15 | Docs + llms.txt updated | grep | `node --test test/mcp/docs-mirror.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/mcp/**/*.test.js`
- **Per wave merge:** `npm test` + `npm run openapi:build`
- **Phase gate:** Full suite green + coverage report + manual marketplace manifest submission confirmation

### Wave 0 Gaps
- [ ] `test/mcp/oauth.test.js` — PKCE round-trip, DCR, token-endpoint, revoke
- [ ] `test/mcp/session.test.js` — opaque token hash, rolling TTL extend, revoke, cross-tenant 403
- [ ] `test/mcp/cost-table.test.js` — pricing arithmetic, avg-token estimates
- [ ] `test/mcp/cost-meter.test.js` — atomic check-and-charge, 24h window
- [ ] `test/mcp/402-breach.test.js` — budget exhaustion produces correct JSON-RPC error
- [ ] `test/mcp/rate-limit.test.js` — sliding window at session + tenant scope
- [ ] `test/mcp/429-breach.test.js` — 429 with Retry-After header
- [ ] `test/mcp/ajv-validation.test.js` — input + output validation edges
- [ ] `test/mcp/injection-denylist.test.js` — ASCII + Unicode lookalike patterns
- [ ] `test/mcp/pipeline.test.js` — end-to-end middleware chain
- [ ] `test/mcp/resources.test.js` — resources/list, resources/read, subscribe/unsubscribe
- [ ] `test/mcp/notifications.test.js` — notifications/resources/updated broadcast
- [ ] `test/mcp/streaming.test.js` — SSE progress events for LLM tools
- [ ] `test/mcp/approval-token.test.js` — mutating tools require approval_token round-trip
- [ ] `test/mcp/marketplace-manifest.test.js` — marketplace.json AJV against Anthropic schema
- [ ] `test/mcp/tools/*.test.js` — one fixture test per new tool (20 files)
- [ ] `test/mcp/evals/*.test.js` — LLM eval fixtures for `plan_campaign`, `draft_message`, `audit_claim`
- [ ] `test/mcp/observability.test.js` — req_id propagation into log + audit + Sentry
- [ ] `test/mcp/migration-idempotency.test.js` — 88 + 89 forward + rollback
- [ ] `test/mcp/docs-mirror.test.js` — docs/mcp-tools.md references all 30 tools; llms.txt appended

**Total: ~20 test suites, ~100–120 tests new. Tracks CONTEXT "~40 tests at plan level, target 100+ suite-wide by phase end".**

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | OAuth 2.1 + PKCE (S256 only); opaque token sha256 in DB; timing-safe comparison |
| V3 Session Management | yes | 24h rolling TTL; RLS on sessions table; revoke via `revoked_at` |
| V4 Access Control | yes | Tenant-binding at consent (D-07); cross-tenant 403; mutating tools + free-tier gate (D-21) |
| V5 Input Validation | yes | AJV strict + injection deny-list + Unicode NFKC normalization |
| V6 Cryptography | yes | `node:crypto` only; `randomBytes(32)` for tokens; `createHash('sha256')` for hashes; `timingSafeEqual` for compare |
| V8 Data Protection | yes | Tenant-scoped outputs (D-15); secrets in Vercel env (no leak in logs) |
| V9 Communication | yes | HTTPS enforced by Vercel; redirect_uri whitelist |
| V11 Business Logic | yes | Approval-token round-trip for mutating tools (D-03); hard 402 budget (D-11) |
| V12 Files and Resources | partial | Resources are URL-namespaced; path-traversal not possible since URIs come from static template list |
| V14 Configuration | yes | Rolling Releases for progressive deploy; Sentry DSN from env |

### Known Threat Patterns for MCP + stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via tool input text | Tampering + Info Disclosure | AJV schema + injection deny-list + Unicode NFKC (D-14) |
| Tool confusion / tool poisoning [CITED: arxiv.org/abs/2603.22489] | Spoofing + Elevation | Tools registered in static server-side registry; tool descriptions server-authored (client cannot add tools); rug-pull protection via version bumps in `marketplace.json` |
| Session hijack via token leak | Elevation | Opaque token; sha256 hash-only in DB; timing-safe compare; revoke via `revoked_at`; 24h rolling TTL limits replay window; logs NEVER write `token` field |
| Data exfil via cross-tenant tool call | Info Disclosure | Session tenant-binding at consent (D-07); 403 on cross-tenant; `tenant_id` filter on every read query (D-15); RLS on CRM / canon / literacy tables |
| Confused-deputy via upstream API call | Elevation | MCP tokens MUST NOT pass through to downstream APIs (MCP spec). Downstream calls use separate service credentials. |
| SQL injection via tool arg | Tampering | Parameterized queries via `@supabase/supabase-js` (every query) + AJV schema strips non-string inputs |
| Rate-limit bypass via session rotation | DoS | Per-tenant rpm cap aggregates across sessions (D-17) — attacker can't scale by opening many sessions |
| Cost-budget stampede | DoS + Financial | Atomic `check_and_charge_mcp_budget` SQL function with row lock |
| Open-redirect on OAuth `/authorize` | Spoofing | Exact-match redirect_uri against pre-registered list per RFC 8252 + MCP spec |
| CSRF on `/oauth/authorize/approve` | Tampering | Phase-201 SameSite=Lax cookie + `state` param verification |
| Approval-token replay | Tampering | Redis GETDEL with 5-min TTL — one-time use |
| Timing attack on token compare | Info Disclosure | `crypto.timingSafeEqual` |
| PKCE downgrade to `plain` | Tampering | Server refuses `code_challenge_method=plain`; only S256 accepted |
| OAuth authorization code leak | Elevation | 60s TTL + one-time use; stored in Upstash with NX + GETDEL consume |

### Audit log emission (every event)

Every security-relevant event emits a `source_domain='mcp'` audit row:

| Event | action | payload |
|-------|--------|---------|
| Session created | `session.created` | `{ req_id, client_id, scopes }` |
| Session revoked | `session.revoked` | `{ req_id, revoked_by, reason }` |
| Tool invoked (ok) | `tool.invoked` | `{ req_id, tool_id, duration_ms, cost_cents }` |
| Tool invocation failed | `tool.error` | `{ req_id, tool_id, error_code, duration_ms }` |
| Input validation failed | `tool.invalid_input` | `{ req_id, tool_id, errors }` |
| Output schema violation | `tool.output_schema_violation` | `{ req_id, tool_id }` |
| Injection detected | `tool.injection_blocked` | `{ req_id, tool_id, pattern }` |
| Budget exhausted | `tool.budget_exhausted` | `{ req_id, tenant_id, spent_cents, cap_cents }` |
| Rate limited | `tool.rate_limited` | `{ req_id, scope, retry_after }` |
| Approval token issued | `tool.approval_issued` | `{ req_id, tool_id, preview_keys }` |
| Approval token consumed | `tool.approval_consumed` | `{ req_id, tool_id }` |
| Cross-tenant 403 | `tool.cross_tenant_blocked` | `{ req_id, expected_tenant, requested_tenant }` |

All 12 emission paths tested in `test/mcp/audit-emission.test.js`.

---

## Wave Grouping Recommendation (for orchestrator)

### Wave 1 — Foundations (parallel-safe)

| Plan | Scope | Parallelizable |
|------|-------|----------------|
| 202-01 | Migrations 88 + 89 (schema), RLS, rollback scripts, `lib/markos/mcp/sessions.cjs` | ✓ |
| 202-02 | OAuth layer: `/oauth/*` + `/.well-known/*` + DCR + consent page + `lib/markos/mcp/oauth.cjs` | ✓ (needs 202-01 session table to exist before deploy, but plan code parallelizable with mock session) |
| 202-03 | Cost-table + cost-meter + 24h window (builds on 202-01) | ✓ |
| 202-04 | Rate-limit + AJV wiring + injection deny-list + pipeline.cjs middleware | ✓ |
| 202-05 | Sentry setup (`sentry.server.config.ts` + `instrumentation.ts`) + structured log emitter + req_id correlation | ✓ |

Wave 1 delivers: session persistence, OAuth, cost guard, rate-limit, validation, observability. At the end of Wave 1 the existing 10 tools are gated + metered + OAuth'd — marketplace listing COULD ship with 10 live tools + better infra, but we wait for Wave 2.

### Wave 2 — Tool Expansion (parallel-safe)

| Plan | Scope | Parallelizable |
|------|-------|----------------|
| 202-06 | 8 wave-0 stubs → live (D-02): wire `plan_campaign`, `research_audience`, `generate_brief`, `audit_claim`, `list_pain_points`, `rank_execution_queue`, `schedule_post`, `explain_literacy` | ✓ |
| 202-07 | 12 net-new tools (marketing 8 + CRM 5 + literacy 3 + tenancy 2, minus the 6 already covered elsewhere — total 12). Plus F-90..F-93 contracts. | ✓ |
| 202-08 | Resources + streaming + notifications (F-94). 3 resources + SSE progress + subscribe registry. | ✓ |

### Wave 3 — Consolidation (sequential)

| Plan | Scope | Depends on |
|------|-------|-----------|
| 202-09 | `/settings/mcp` UI + `/oauth/consent` UI + F-95 cost contract + `vercel.ts` cron + marketplace.json v2.0.0 + VS Code config docs + openapi regen + docs pages + llms.txt + k6 load script | Wave 1 + Wave 2 merged |
| 202-10 | Marketplace submission + VS Code e2e cert + KPI digest email cron + scorecard | 202-09 merged + deployed to production |

**Total: 10 plans.** Matches CONTEXT.md "≤ 10 plans" target.

---

## Threat Model Focus

Concrete mitigations per D-13..D-16:

| Threat | D-ref | Mitigation + detection |
|--------|-------|----------------------|
| **Prompt injection** | D-14 | **Mitigation:** AJV strict schema + regex deny-list + NFKC normalization before pattern match. All inputs that pass deny-list logged. **Detection:** `source_domain='mcp' action='tool.injection_blocked'` audit rows with the matched pattern; Sentry event with tag `threat=prompt_injection`. |
| **Tool confusion / poisoning** | D-13 | **Mitigation:** Tools registered in static server-side `TOOL_DEFINITIONS` — clients can't add tools. Tool descriptions server-authored (not LLM-generated). AJV output validation (D-13) catches handler bugs that drift into client-exploitable shapes. **Detection:** `action='tool.output_schema_violation'` audit + Sentry. |
| **Session hijack** | D-06, D-07 | **Mitigation:** Opaque 32-byte token (no JWT to forge); sha256(token) stored; timing-safe compare; 24h rolling TTL; instant revoke via `revoked_at`; logs + audit NEVER contain raw `token` field. **Detection:** Rate-limit breach from unusual IP triggers `action='session.anomaly'` audit + Sentry (nice-to-have; add to 202.1 if traffic signal warrants). |
| **Data exfil** | D-07, D-15 | **Mitigation:** (1) Tenant-binding at consent — `markos_mcp_sessions.tenant_id` fixed. (2) Every read tool's query includes `WHERE tenant_id = <session.tenant_id>`. (3) RLS on CRM / canon / literacy tables enforces even if query forgets. (4) AJV output schema rejects any output containing `tenant_id` field not matching session (e.g. if a tool accidentally joins cross-tenant). **Detection:** `action='tool.cross_tenant_blocked'` audit + Sentry. |

Add a dedicated `<threat_model>` block to the phase DISCUSS/VERIFICATION artifact matching the STRIDE template from Phase 201 plans 04-06.

---

## Test Inventory (~100+ new tests)

Grouped by suite; ≥ 1 fixture test per tool. Target ~110 new tests.

| Suite | Test count | Critical tests |
|-------|-----------|----------------|
| `test/mcp/server.test.js` (extend from 11) | ~25 | listTools returns 30; initialize returns protocolVersion 2025-06-18 + OAuth capability; resources capability advertised; notifications/resources/updated wire; tool-not-found 404 |
| `test/mcp/oauth.test.js` | 12 | PKCE round-trip success; PKCE S256 mismatch → 400; PKCE plain rejected; DCR returns client_id; /oauth/token enforces exact redirect_uri; authorization_code one-time use; authorization_code 60s TTL; /oauth/revoke flips revoked_at; consent page requires web session; tenant picker omits purged tenants; scope enforcement; WWW-Authenticate header on 401 |
| `test/mcp/session.test.js` | 10 | opaque token hash matches; rolling TTL extends; expired session 401; revoked session 401; cross-tenant tool call 403; cleanup cron purges post-7-day rows; RLS read own / admin read tenant; token not logged; cascade on tenant delete |
| `test/mcp/cost-table.test.js` | 8 | base_cents applied; LLM math correct for Sonnet 4.6; LLM math correct for Haiku 4.5; unknown model throws; estimateToolCost returns avg; computeToolCost rounds up; free-cost tools return 0; integer arithmetic (no floats in cents) |
| `test/mcp/cost-meter.test.js` | 8 | check-and-charge atomic (parallel race test); 402 on breach; breach includes reset_at; hourly bucket aggregation; truue-up delta; free-tier cap $1/day = 100 cents; paid-tier cap higher; audit emitted on 402 |
| `test/mcp/402-breach.test.js` | 4 | JSON-RPC error code -32001; HTTP 402; body includes reset/spent/cap; audit row present |
| `test/mcp/rate-limit.test.js` | 8 | sliding window correct at boundary; 60 rpm per session; 600 rpm per tenant; per-tenant aggregates across sessions; Retry-After calculated from reset; Upstash failure degrades (fail-open? fail-closed?); rate-limit key prefix distinct |
| `test/mcp/429-breach.test.js` | 3 | JSON-RPC error code -32002; HTTP 429; Retry-After header present |
| `test/mcp/ajv-validation.test.js` | 10 | input strict rejects additionalProperties; input rejects type coercion (string "5" for number); format date-time honored; $ref resolves; missing required 400; output schema rejects unknown tenant_id; compile happens once (module load); strict mode catches typos in schemas |
| `test/mcp/injection-denylist.test.js` | 12 | "ignore previous instructions" caught; Cyrillic I variant caught; system:you are caught; [INST] caught; <|im_start|> caught; DAN caught; sudo mode caught; NFKC normalization applied; walk into nested objects; arrays walked; non-string values skipped; 10+ fixture patterns all caught |
| `test/mcp/pipeline.test.js` | 8 | happy path end-to-end; each step short-circuits cleanly; finally block emits log + audit on error; req_id propagates through |
| `test/mcp/resources.test.js` | 8 | resources/list returns 3; resources/templates/list returns 3; resources/read returns tenant-scoped data; cross-tenant URI read 403; URI scheme validated; subscribe adds to Redis set; unsubscribe removes; resource not found -32002 |
| `test/mcp/notifications.test.js` | 6 | notifications/resources/updated sent on canon mutation; sent on literacy mutation; sent on tenant-status change; only to subscribed sessions; disconnected session removed from set; never sent for unsubscribed URI |
| `test/mcp/streaming.test.js` | 6 | LLM tool honors progressToken → SSE; non-LLM tool ignores progressToken; SSE frames properly terminated with \n\n; cancel + disconnect cleanup; Vercel timeout enforced; buffered response when no progressToken |
| `test/mcp/approval-token.test.js` | 6 | mutating tool 1st call returns preview + token; 2nd call with token commits; 2nd call without token 400; token expires after 5 min; token replayed (GETDEL) 400; non-mutating tools don't require token |
| `test/mcp/marketplace-manifest.test.js` | 4 | AJV against Anthropic schema; 30 tools present; version bumped; pricing tiers declared |
| `test/mcp/tools/marketing/*.test.js` | 10 (1 per tool) | each tool fixture returns schema-valid output; each marks mutating correctly; each writes audit |
| `test/mcp/tools/crm/*.test.js` | 5 | tenant_id filter enforced; RLS respected; read-only |
| `test/mcp/tools/literacy/*.test.js` | 3 | pack loader integration; tenant scoped |
| `test/mcp/tools/tenancy/*.test.js` | 2 | read-only members; read-only audit |
| `test/mcp/tools/execution/*.test.js` | 1-2 | schedule_post mutating flow |
| `test/mcp/evals/plan_campaign.test.js` | 3 | brand voice drift < 0.1; claim-check pass rate ≥ 0.9; deterministic on fixture |
| `test/mcp/evals/draft_message.test.js` | 3 | same |
| `test/mcp/evals/audit_claim.test.js` | 3 | same |
| `test/mcp/observability.test.js` | 5 | req_id in JSON-RPC response; req_id in log line; req_id in audit row; req_id in Sentry tags; UUID uniqueness |
| `test/mcp/migration-idempotency.test.js` | 4 | 88 runs twice idempotently; 88 rollback clean; 89 runs twice; 89 rollback clean |
| `test/mcp/docs-mirror.test.js` | 3 | docs/mcp-tools.md mentions all 30 tools; llms.txt has phase-202 entry; openapi.json merged |
| `test/mcp/audit-emission.test.js` | 12 | one test per audit action from the security domain table |

**Grand total: ~110 new tests.** Above target "40 at plan level, 100+ suite-wide by phase end."

---

## Sources

### Primary (HIGH confidence)

- [Model Context Protocol 2025-06-18 spec — Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) — OAuth 2.1 + PKCE + discovery + RFC 8707 resource indicator
- [Model Context Protocol 2025-06-18 spec — Resources](https://modelcontextprotocol.io/specification/2025-06-18/server/resources) — resources/list, /read, /subscribe, notifications/resources/updated
- [Vercel — Deploy MCP servers](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel) — Fluid Compute + mcp-handler pattern (reference, not adopted)
- [Vercel Log Drains reference](https://vercel.com/docs/drains/reference/logs) — JSON schema + format options
- [Vercel Rolling Releases GA](https://vercel.com/changelog/rolling-releases-are-now-generally-available) — progressive rollout pattern
- [Upstash Ratelimit — Algorithms](https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms) — slidingWindow + tokenBucket signatures
- [AJV 8 — API reference](https://ajv.js.org/api.html) — strict mode + addSchema + compile
- [Sentry Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/) — instrumentation.ts + captureRequestError
- [VS Code MCP configuration reference](https://code.visualstudio.com/docs/copilot/reference/mcp-configuration) — `.vscode/mcp.json` format
- [Anthropic Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5 per million tokens (April 2026)
- `@modelcontextprotocol/sdk` installed locally — version 1.29.0 [VERIFIED: node_modules package.json]
- `ajv` installed locally — version 8.18.0 [VERIFIED: node_modules package.json]
- `.planning/phases/200-saas-readiness-wave-0/200-06-mcp-server-PLAN.md` + `SUMMARY.md` — existing 0-day MCP plan
- `.planning/phases/201-saas-tenancy-hardening/201-VERIFICATION.md` — verified tenancy fabric available for use
- `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` — 15 gates inherited

### Secondary (MEDIUM confidence)

- [Vercel mcp-handler authorization doc](https://github.com/vercel/mcp-handler/blob/main/docs/AUTHORIZATION.md) — OAuth pattern reference (not adopted but informs our pattern)
- [Ajv strict mode](https://ajv.js.org/strict-mode.html) — strict-mode documentation
- [MCP threat-modeling paper (arxiv 2603.22489)](https://arxiv.org/abs/2603.22489) — tool-poisoning analysis
- [Elastic Security Labs — MCP Tools Attack Vectors](https://www.elastic.co/security-labs/mcp-tools-attack-defense-recommendations) — defense recommendations

### Tertiary (LOW confidence — verify at plan time)

- Claude Marketplace review criteria — [ASSUMED] — no public policy page found; derived from spec compliance + existing manifest schema
- Opus 4.7 token pricing — [ASSUMED] — placeholder in cost-table; planner verifies from Anthropic pricing page before finalizing
- Free-tier marketplace manifest `pricing` field schema — [ASSUMED] — verify with Anthropic schema URL at plan time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in `package.json`; Upstash + Sentry + ajv-formats new but well-known
- OAuth flow: HIGH — MCP spec fetched directly from modelcontextprotocol.io
- Session schema + cost meter + rate-limit: HIGH — proven patterns (sha256 tokens, atomic SQL functions, sliding-window Redis)
- Resources + streaming: HIGH — spec fetched
- Observability + Sentry: MEDIUM-HIGH — docs fetched; Vercel scope caveat noted
- Claude Marketplace cert checklist: MEDIUM — inferred from spec + community examples; no public policy doc
- VS Code cert config: HIGH — docs fetched; config snippet verified
- Cost-table values: MEDIUM — Sonnet/Haiku rates verified; Opus 4.7 and avg-token estimates are placeholders
- Tool inventory: HIGH — 30 allocated matching D-01 split
- Test inventory: HIGH — 110+ tests specified with concrete assertions

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (30 days — fast-moving MCP spec + Claude pricing warrant re-verification then; shorter if Anthropic changes marketplace policy)
