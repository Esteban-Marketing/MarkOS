# Phase 202: MCP Server GA + Claude Marketplace Launch — Context

**Gathered:** 2026-04-27
**Status:** Verified for Claude Marketplace + VS Code cert-ready scope

<domain>
## Phase Boundary

Graduate the 0-day MCP server shipped in Plan 200-06 to full GA on the Claude
Marketplace: persistent sessions with OAuth 2.1, a 30-tool surface (all live —
the 2 existing live tools + 8 wave-0 stubs wired + 20 new tools), public
marketplace listing live, certified multi-client support (Claude Marketplace
first, then VS Code), per-tenant cost metering with hard kill-switch, and the
MCP threat model (prompt injection · tool confusion · session hijack · data
exfil) mitigated end-to-end.

**In scope:**
- `markos_mcp_sessions` table + OAuth 2.1 + PKCE session-create flow, tenant bound at consent
- 30-tool live surface (marketing-weighted, CRM + literacy, minimal tenancy)
- All mutating tools gated behind an inline `approval_token` round-trip
- 3 MCP Resources (`mcp://markos/canon/{tenant}`, `.../literacy/{tenant}`, `.../tenant/status`) + `notifications/resources/updated`
- Server-sent progress events for LLM-backed tools (`draft_message`, `plan_campaign`, `audit_claim`)
- Per-tenant 24h rolling cost budget in **cents** (cost-table per tool/model), hard 402 kill-switch on breach
- Rate-limits: 60 rpm/session + 600 rpm/tenant via Upstash Redis
- Latency SLO: non-LLM read tools p95 ≤ 300ms (Vercel Observability enforced)
- Tool-safety: strict AJV validation on both input and output, injection deny-list, tenant-scoped outputs only
- `/settings/mcp` page: usage gauge, top-tool list, recent sessions, revoke session CTA
- Claude Marketplace listing: free tier (read-only tools + $1/day cap) + paid tier (full surface)
- Structured logging to Vercel Log Drains + `source_domain='mcp'` audit rows + `@sentry/nextjs` exception wrapping
- KPI instrumentation for the "≥ 50 installs in 30 days" roadmap target
- VS Code certification path (second-client cert) — test matrix + published config snippets

**Out of scope (belongs elsewhere):**
- Stripe-backed metered billing & seat upgrade flow → Phase 205 (QA-10 cost telemetry graduates there)
- Computer-use / browser-agent tools → Phase 235
- 3rd-party agent marketplace (users publishing agents) → Phase 213 alpha
- Cursor · Windsurf · Warp · ChatGPT certification → 202.1 / follow-up phases (VS Code is the one cert target in 202)
- SOC 2 Type I evidence collection → Phase 206 (phase 202 emits the logs + audit rows that 206 will collect)

**Current closeout posture:**
- Phase 202 is verified for the scope it actually executed: Claude Marketplace launch package plus VS Code cert-ready support.
- Marketplace approval itself is an external operational workflow, not a code-verification gate inside this phase.
- Cursor / Windsurf / Warp / ChatGPT certs remain explicitly deferred to `202.1` or follow-up client-cert work.

</domain>

<decisions>
## Implementation Decisions

### Tool slate (D-01 … D-04)
- **D-01:** +20 new tools land weighted marketing-first. Target shape:
  - **Marketing (~10):** write/audit/remix/rank draft variants, brief-to-plan, channel-copy blocks, claim verification expansion, persona-voice cloning, subject-line generators, call-to-action optimiser.
  - **CRM (~4-5):** list entities, timeline query, pipeline snapshot, segment read.
  - **Literacy / Canon (~3-4):** query canon, explain archetype, taxonomy walk, evidence lookup.
  - **Tenancy (~2):** list members (read), audit query (read). Kept minimal — deep tenancy ops stay on the HTTP surface.
  - Remainder absorbed into execution/approvals helpers (1-2 tools) as needed during planning.
- **D-02:** All 8 wave-0 stubs get full backend wiring in 202 (`plan_campaign`, `research_audience`, `generate_brief`, `audit_claim`, `list_pain_points`, `rank_execution_queue`, `schedule_post`, `explain_literacy`). Marketplace pitch is "30 tools, all live, zero stubs."
- **D-03:** **Every mutating tool is gated.** First call returns `{ preview, approval_token }` + HTTP 202 equivalent; client must re-call with the token within 5 minutes to commit. No operator email / push escalation in 202 (inline round-trip only). Destructive-op queue UI deferred.
- **D-04:** Hero demo tool for the marketplace listing = `plan_campaign` (stub → live). The marketplace screencast + docs center on this agent-plans-a-campaign flow.

### Session + auth (D-05 … D-08)
- **D-05:** Auth = **OAuth 2.1 + PKCE**. `GET /oauth/authorize` → consent page (pick target tenant, review scopes) → `POST /oauth/token`. Conforms to MCP 2025-06-18 spec; required for Claude Marketplace cert.
- **D-06:** Session token = **opaque 32-byte random + DB lookup** (`markos_mcp_sessions` row). **24h rolling TTL** — every successful tool call extends `last_used_at` + expiry. No JWTs; no edge-config cache in 202 (can be added later if latency demands it).
- **D-07:** **Tenant bound at session creation.** During OAuth consent the user selects the target tenant (from their `listTenantsForUser` set); `markos_mcp_sessions.tenant_id` is fixed for the life of the session. Cross-tenant tool calls return 403.
- **D-08:** Second certified client **after Claude Marketplace = VS Code** (Cursor / Windsurf / Warp / ChatGPT deferred to 202.1).

### Cost metering + hard budget (D-09 … D-12)
- **D-09:** Metering unit = **cents (real cost per call)**. Ship a cost-table (`lib/markos/mcp/cost-table.cjs`) keyed by `{ tool_id, model_id }` with per-call base cost + per-LLM-token rates. Updated whenever provider prices change.
- **D-10:** Enforcement scope = **per tenant, rolling 24h** (not per session, not per org). Aligns with seat-pooled billing model (D-06 from Phase 201). Matches Phase 205 billing shape.
- **D-11:** Breach action = **hard 402 Payment Required kill-switch**. Session rejects the next tool call with a structured `{ error: 'budget_exhausted', reset_at, spent_cents, cap_cents }`. Audit row emitted on every 402. No grace window.
- **D-12:** Visibility surface = `/settings/mcp` page (new): usage gauge, top-tool-by-cost list, active sessions list with revoke CTA. Plus every tool call emits `source_domain='mcp'` audit row carrying `cost_cents` in the payload (reuses Phase 201 audit fabric). No dedicated MCP-resource for real-time usage in 202.

### Tool safety (D-13 … D-16)
- **D-13:** **Strict AJV validation on every tool output.** Every tool's F-contract declares a JSON Schema; handler response is validated before the JSON-RPC envelope is sent. Non-conforming response returns `internal_error` to the client + Sentry capture + `source_domain='mcp'` audit row with `action='tool.output_schema_violation'`.
- **D-14:** **Strict input schema + injection deny-list.** AJV validates input types + required fields; additional string deny-list filter (`ignore previous`, `system:`, common instruction tokens, Unicode-lookalike attempts). Violation returns `400 invalid_tool_input`. No LLM classifier in 202.
- **D-15:** **Tenant-scoped output only.** Every read tool's F-contract declares a mandatory `tenant_id` filter at the query layer; handler rejects cross-tenant reads at schema-validation time. Matches RLS from Phase 201. No PII redaction layer on top (would break marketing draft personalization).
- **D-16:** **HITL gate = inline `approval_token` round-trip only.** No operator email / push / queue UI in 202. Agent reasoning loop handles the two-call pattern autonomously. Destructive-op dashboard deferred to 202.1.

### Rate-limits + latency SLO (D-17 … D-20)
- **D-17:** Rate-limits via Upstash Redis (reuses `lib/markos/auth/rate-limit.cjs` pattern from Phase 201): **60 rpm per session + 600 rpm per tenant (aggregate across sessions)**. 429 with `Retry-After` header on breach.
- **D-18:** Latency SLO = **p95 ≤ 300ms for non-LLM read tools**. LLM-backed tools get a separate p95 ≤ 5s target. "Long" tools (bulk operations) ≤ 30s p95. Implicitly declared via `latency_tier: simple|llm|long` field on each F-contract.
- **D-19:** Latency enforced via **Vercel Observability**. Per-tool + per-session p50/p95/p99 spans emitted; alert fires if simple-tier p95 > 300ms over a 15-minute window. No synthetic cron probe in 202.
- **D-20:** Tool handler compute budgets = **30s simple / 120s llm / 300s long** (matches Vercel Function default ceiling). Enforced by handler timeout wrapper; 504 with `{ error: 'tool_timeout', tool_id, tier }` on breach.

### Marketplace + pricing (D-21 … D-24)
- **D-21:** **Free tier** = read-only tools + **$1/day per tenant hard cap**. Write tools require a paid MarkOS account (gated at handler level with 402 on first write attempt). Drives installs + Phase 205 upgrade path.
- **D-22:** Marketplace category = **Marketing + Content Generation** (primary: Marketing). Matches existing `.claude-plugin/marketplace.json`.
- **D-23:** Install tracking = **both built-in marketplace analytics + OAuth-grant counter via audit row** (`source_domain='mcp'` + `action='session.created'`) + **weekly KPI digest email** to founders. KPI target: ≥ 50 installs in 30 days post-launch.
- **D-24:** Listing copy tone = **developer-native + quietly confident**. Headline: "MCP-native marketing workbench. 30 tools. Claude-native by design." Description leans spec-heavy — protocols, auth, contracts — matching brand-stance Q-B.

### MCP Resources + streaming (D-25 … D-28)
- **D-25:** Ship **3 MCP Resources in 202:** `mcp://markos/canon/{tenant}`, `mcp://markos/literacy/{tenant}`, `mcp://markos/tenant/status`. Read-only; reduce repeat polling via tool calls. Bonus for marketplace cert.
- **D-26:** **Streaming / progress events for LLM-backed tools only** (`draft_message`, `plan_campaign`, `audit_claim`, any other LLM-backed tool shipped in 202). SSE progress notifications per MCP 2025-06-18 spec; buffered JSON-RPC for everything else.
- **D-27:** **Resource change notifications via `notifications/resources/updated`** — server pushes to every subscribed session whenever the underlying canon or literacy or tenant-status row changes (hooks into existing write paths). Applies to all 3 resources (not just canon).
- **D-28:** Tool compute budget tiers as in D-20.

### Observability + release channel (D-29 … D-32)
- **D-29:** **Per-JSON-RPC-call UUID (`mcp-req-<uuid>`)** generated at handler entry, echoed into: the JSON-RPC response envelope, every Vercel log line, every audit row, and every Sentry event. Full trace correlation.
- **D-30:** **Structured logs → Vercel Log Drains** as one JSON line per event: `{ req_id, session_id, tenant_id, tool_id, duration_ms, status, cost_cents, error_code? }`. Sets SOC 2 (Phase 206) evidence pipeline up for fan-out.
- **D-31:** **Single GA listing only** on Claude Marketplace (no canary endpoint). Version bumps via `marketplace.json.version` field. Progressive roll-out via **Vercel Rolling Releases** (server-side, invisible to marketplace) — provides rollback safety net without a second endpoint.
- **D-32:** **Sentry wraps every tool handler** via `@sentry/nextjs`. Uncaught exception → Sentry issue with `req_id + session_id + tenant_id` context + `source_domain='mcp'` audit row with `action='tool.error'`. JSON-RPC response returns generic `internal_error` + `req_id` (client uses req_id for support).

### Claude's Discretion
Downstream agents (researcher, planner) decide:
- Concrete SQL for `markos_mcp_sessions` (columns confirmed in decisions; exact types + indexes + RLS).
- Cost-table initial values and bootstrapping (research Claude / OpenAI current rates at plan time).
- Exact `/oauth/authorize` + `/oauth/token` endpoint shape and consent-page UI (reuse Phase 201 CSS tokens).
- Plan structure — single plan vs decomposition. Target is ≤ 10 plans; Wave 1 foundations (schema + OAuth + base session + cost-table + audit wiring), Wave 2 tool expansion + resources, Wave 3 marketplace listing + VS Code cert + docs.
- Which `@sentry/nextjs` version + setup matches existing project conventions.

### Folded Todos
None — no backlog todos matched the phase 202 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + milestone
- `.planning/ROADMAP.md` §"Phase 202: MCP Server GA + Claude Marketplace Launch" — phase goal, requirements, dependencies
- `.planning/phases/202-mcp-server-ga-claude-marketplace/202-VERIFICATION.md` — code-verified truth table and scope clarification
- `.planning/phases/202-mcp-server-ga-claude-marketplace/202-REVIEWS.md` — metadata/scope drift review findings
- `.planning/phases/202-mcp-server-ga-claude-marketplace/deferred-items.md` — explicit non-blocking leftovers
- `obsidian/thinking/2026-04-16-markos-saas-roadmap.md` — full v4.0.0 SaaS Readiness synthesis (decisions 1 + 4; Q-A, Q-B, Q-C answers)

### Phase 200 (MCP 0-day)
- `.planning/phases/200-saas-readiness-wave-0/200-06-mcp-server-PLAN.md` — original JSON-RPC 2.0 server design
- `.planning/phases/200-saas-readiness-wave-0/200-06-mcp-server-SUMMARY.md` — current state (10 tools: 2 live, 8 stubs; `.claude-plugin/marketplace.json` v1.0.0)
- `lib/markos/mcp/server.cjs` — current 28-line server core
- `lib/markos/mcp/tools/index.cjs` — 277-line tool registry + `invokeTool` + `listTools`
- `api/mcp/session.js` — current 69-line JSON-RPC envelope handler
- `api/mcp/tools/[toolName].js` — per-tool dispatch route
- `.claude-plugin/marketplace.json` — existing Marketplace manifest (bump `version` field in 202)
- `contracts/F-71-mcp-session-v1.yaml` — existing MCP session contract (extend for session persistence + cost metering)

### Phase 201 (tenancy fabric 202 depends on)
- `.planning/phases/201-saas-tenancy-hardening/201-CONTEXT.md` — tenancy decisions D-01..D-16 (magic-link auth, 30-day rolling session, org↔tenant model, audit fabric)
- `.planning/phases/201-saas-tenancy-hardening/201-VERIFICATION.md` — verified implementation of audit fabric + middleware + slug cache
- `lib/markos/audit/writer.cjs` — `enqueueAuditStaging` (every MCP event hooks here; `source_domain='mcp'` joins the existing enum)
- `lib/markos/auth/rate-limit.cjs` — Upstash Redis rate-limit helper (reuse for MCP rpm caps)
- `middleware.ts` — edge-config-backed tenant resolution (MCP session auth will not route through middleware but must not conflict)
- `lib/markos/tenant/switcher.cjs` `listTenantsForUser` — powers OAuth consent tenant picker

### Quality + governance
- `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md` — 15 gates; all apply to 202 (QA-10 is scoped here, not deferred like 201)
- `obsidian/brain/Target ICP.md` + `obsidian/brain/Brand Stance.md` — informs D-24 listing copy tone + D-08 client priority

### MCP spec + marketplace
- MCP 2025-06-18 specification — OAuth 2.1 / PKCE session flow, Resources + `notifications/resources/updated`, streaming/progress notifications, JSON-RPC 2.0 envelope. Researcher should verify against latest spec via `mcp__plugin_context7_context7` if needed.
- Claude Marketplace listing policy + rate-limit expectations — researcher to confirm current policy + cert requirements before planning.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`lib/markos/mcp/server.cjs` + `lib/markos/mcp/tools/index.cjs` + `api/mcp/session.js` + `api/mcp/tools/[toolName].js`** — working JSON-RPC 2.0 pipeline. Don't rewrite; extend. Session state currently in-memory stub; Phase 202 replaces with `markos_mcp_sessions` DB lookup.
- **`lib/markos/auth/rate-limit.cjs`** — Upstash-backed rate-limit helper from Phase 201 signup flow. D-17 rpm caps reuse this verbatim (different key prefix).
- **`lib/markos/audit/writer.cjs`** — `enqueueAuditStaging` for audit rows. D-12 + D-32 + every mutation in 202 plugs into this. `source_domain='mcp'` is a new value that the audit drain + `api/tenant/audit/list.js` (F-88) already support because the enum is open.
- **`lib/markos/tenant/switcher.cjs`** `listTenantsForUser` — powers the OAuth consent tenant-picker UI (D-07).
- **`@vercel/edge-config`** (Phase 201 dep) — *not* used for MCP sessions (D-06 opaque DB lookup) but available if a later revision wants tier-1 latency.
- **App CSS tokens from Phase 201** (`app/(markos)/settings/sessions/page.module.css`) — `/settings/mcp` page reuses 28px card radius, Sora 28px headings, `#0d9488` focus rings.

### Established Patterns
- **Dual-export libraries (`.cjs` + `.ts`)** — every `lib/markos/*` module. MCP additions follow the same pattern.
- **`contracts/F-NN-*.yaml` as schema source of truth** — F-71 already exists for MCP session; Phase 202 adds `F-71` rev (session persistence + cost metering) + new F-NN contracts for every new tool's input/output + OAuth endpoints. `scripts/merge-openapi.mjs` will pick them up automatically via glob.
- **Audit writer helper called on every mutation** — Phase 201 enforces this for tenancy. MCP follows the same rule (D-12 + D-32).
- **Streaming archiver + presigned URL pattern (Phase 201 GDPR export)** — *not* reused in 202 but informs the SSE progress-notification pattern for D-26.
- **Vercel Functions default 300s timeout** matches D-20 long-tool budget. Fluid Compute reuses function instances → cold starts rarely hurt simple-tier p95 ≤ 300ms (D-18).

### Integration Points
- `markos_audit_log` schema (Phase 201, migration 82) — `source_domain='mcp'` enters the existing enum with no schema change needed.
- `app/(markos)/settings/` — `/settings/mcp` page lands alongside `/settings/members`, `/settings/danger`, `/settings/domain` from Phase 201.
- `contracts/openapi.json` — `scripts/merge-openapi.mjs` regenerates on every F-contract add. MCP session + tool contracts surface as paths alongside F-85..F-88.
- `vercel.ts` (Phase 201) — already registers crons; if MCP needs a cron (e.g., session cleanup of expired `markos_mcp_sessions`), add there.
- `.claude-plugin/marketplace.json` — version bump + tool array update lives here (not regenerated, manually maintained).
- `lib/markos/webhooks/engine.cjs` — not a dependency but a good reference for how Phase 201 wired audit emissions across a subsystem (`source_domain='webhooks'` pattern mirrors what MCP will do).
- `test/mcp/server.test.js` + `test/openapi/openapi-build.test.js` — 11 + 13 tests green as of 200-06; Phase 202 extends both (expect ~40 tests at plan level, target 100+ suite-wide by phase end).

</code_context>

<specifics>
## Specific Ideas

- Listing copy headline the user will see on Claude Marketplace (per D-24): "**MCP-native marketing workbench. 30 tools. Claude-native by design.**" Description copy leans spec-heavy (tool count, OAuth 2.1, JSON Schema contracts, cost transparency).
- Hero demo (D-04) for the marketplace screencast = `plan_campaign` — an agent receives an objective + audience, calls `research_audience`, then `list_pain_points`, then `plan_campaign`, then `draft_message` on each output block. Full chain must work flawlessly on launch day.
- VS Code is the named second-client cert target (D-08) — not Cursor, Windsurf, Warp, or ChatGPT. Plan should include a `docs/vscode-mcp-setup.md` page with copy-paste config snippet.
- Free tier (D-21) = anyone with a magic-link account can install, run read-only tools, and hit a $1/day per-tenant cap. Writes require a paid MarkOS account (the billing portal itself lands in Phase 205; in Phase 202, "paid" = `markos_orgs.plan_tier != 'free'` check).
- Cost table (D-09) entry example: `draft_message` → `{ base_cents: 2, llm: { claude-sonnet-4-6: { input_per_1k: 0.3, output_per_1k: 1.5 } } }`. Researcher confirms current pricing at plan time.

</specifics>

<deferred>
## Deferred Ideas

- **Cursor / Windsurf / Warp / ChatGPT certifications** — 202.1 or a dedicated client-cert phase. VS Code is the one second-client target in 202.
- **Per-session cost view as an MCP Resource** (`mcp://markos/usage`) — novel but adds client-behaviour risk. Deferred; users see usage in `/settings/mcp` for 202.
- **PII redaction layer on tool outputs** — would break marketing draft personalization. Revisit when SOC 2 Type II (Phase 206+) prescribes it.
- **LLM-based input classifier for injection defense** — strict schema + deny-list is the 202 choice (D-14). Classifier layer reopens if real traffic shows adversarial pressure.
- **Operator email / push / queue UI for destructive-op confirmation** — inline `approval_token` is the 202 HITL mechanism (D-16). Queue UI surfaces in a later tenancy phase if agency / team users ask for oversight view.
- **Canary marketplace endpoint** — single GA listing in 202 (D-31). Rolling-release rollback covers most needs; second endpoint revisited if launch hits incident.
- **Computer-use / browser-agent tools** — Phase 235.
- **3rd-party agent marketplace** — Phase 213 alpha.
- **Marketplace paid tier as Stripe subscription** — Phase 205 ships the billing portal; 202 just checks `plan_tier != 'free'` on write tools.
- **SIEM fan-out + SOC 2 evidence collection** — Phase 206; 202's structured Vercel Log Drains (D-30) are the upstream source.

### Reviewed Todos (not folded)
None — no backlog todos were surfaced for this phase.

</deferred>

---

*Phase: 202-mcp-server-ga-claude-marketplace*
*Context gathered: 2026-04-17*
