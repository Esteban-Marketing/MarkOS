---
gsd_state_version: 1.0
milestone: v4.0.0
milestone_name: SaaS Readiness 1.0
status: Ready to execute
last_updated: "2026-04-18T04:08:07.051Z"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 26
  completed_plans: 25
  percent: 96
---

> v4.0.0 "SaaS Readiness 1.0" initialized 2026-04-16 after v3.9.0 closeout and archive.

## Current Position

Phase: 202 (mcp-server-ga-claude-marketplace) — EXECUTING
Plan: 7 of 10

## What just happened (2026-04-18)

- **Plan 202-07 shipped** (parallel executor, Wave 4) — 20 net-new tool handlers + 4 F-contracts + codegen.
  - `lib/markos/mcp/tools/marketing/` +10 LLM handlers: `remix-draft.cjs` (Sonnet variants),
    `rank-draft-variants.cjs` (Haiku scorer), `brief-to-plan.cjs` (Sonnet expander),
    `generate-channel-copy.cjs` (Sonnet blocks), `expand-claim-evidence.cjs` (Sonnet + canon),
    `clone-persona-voice.cjs` (Sonnet), `generate-subject-lines.cjs` (Haiku 10 candidates),
    `optimize-cta.cjs` (Haiku alternatives), `generate-preview-text.cjs` (Haiku 5 candidates),
    `audit-claim-strict.cjs` (Sonnet forces >=1 evidence).
  - `lib/markos/mcp/tools/crm/` +5 handlers (4 simple reads wrapping `lib/markos/crm/*.cjs`
    + 1 LLM `summarize-deal.cjs` Haiku): list_crm_entities / query_crm_timeline /
    snapshot_pipeline / read_segment / summarize_deal. Every handler tenant-scoped (D-15)
    with graceful-degrade fallback when downstream CRM libs unavailable.
  - `lib/markos/mcp/tools/literacy/` +3 simple reads: `query-canon.cjs` (free-text),
    `explain-archetype.cjs` (pack slug lookup), `walk-taxonomy.cjs` (children/parents/siblings).
  - `lib/markos/mcp/tools/tenancy/` +2 READ-ONLY (D-01): `list-members.cjs`
    (markos_tenant_memberships, RLS migration 51), `query-audit.cjs` (markos_audit_log,
    F-88 read surface, RLS migration 82).
  - 4 F-contracts: **F-90** (18 marketing+execution tools — widened from plan's 11
    to include retained run_neuro_audit + research_audience + rank_execution_queue +
    schedule_post so every descriptor has a schema entry; Rule 2 correctness fix),
    **F-91** (5 crm), **F-92** (5 literacy: 2 retained + 3 new; explain_literacy.input
    anyOf reshaped to mirror properties in each branch for AJV strict compatibility —
    Rule 3 blocking fix), **F-93** (2 tenancy).
  - `scripts/openapi/build-mcp-schemas.mjs`: Node ESM codegen that walks F-90..F-93,
    resolves `$ref: "#/shared/..."` pointers, emits flat `{ tool_id: { input, output } }`
    JSON to `lib/markos/mcp/_generated/tool-schemas.json`. Consumed at `ajv.cjs` module
    load so strict AJV validators exist for all 30 tools at runtime (pipeline step 4a + 9).
  - `lib/markos/mcp/tools/index.cjs`: TOOL_DEFINITIONS expanded 10 → 30 (Phase 200 retained
    2 + Plan 202-06 wave-0 8 + Plan 202-07 net-new 20). listTools / invokeTool / getToolByName
    exports unchanged. **Only `schedule_post` remains mutating** — D-01 tenancy minimal.
  - New test suites: `marketing-net-new` (6) + `crm-net-new` (6) + `literacy-net-new` (4) +
    `tenancy-net-new` (4) = 20 parametric assertions. `test/mcp/server.test.js` +5 Plan-202-07
    tests (length===30, expected ids, mutating invariant, llm cost_model, registry coverage)
    with 3 stale `length===10` updated to `===30` (Rule 1 migration from 10-tool snapshot).
  - **Full MCP regression: 326/326 pass; Phase 201: 7/7 pass; all Plan 202-04/05/06 green.**
  - Commits: `7cc1b49` (Task 1 RED) · `e8f6dd3` (Task 1 GREEN marketing+F-90) · `59d72a7`
    (Task 2 RED) · `fd6d9ce` (Task 2 GREEN crm/literacy/tenancy+F-91..F-93) · `c22c729`
    (Task 3 RED) · `50252d2` (Task 3 GREEN codegen+index.cjs+server.test.js).
  - **Decisions:** (1) F-90 scope widened from 11 → 18 tools so every descriptor has a
    compiled validator at module load (Rule 2 — schemas are correctness requirement).
    (2) F-92 explain_literacy.input anyOf branches now carry properties metadata for
    AJV strictRequired compatibility (Rule 3 — blocking fix; without it, ajv.cjs throws
    at boot and every tools/call fails at pipeline step 9).
    (3) Codegen uses `js-yaml` (pre-existing dep) rather than the plan's specified
    `yaml` package — zero new deps added.

- **Plan 202-09 shipped** (parallel executor, Wave 4) — Surface S1 `/settings/mcp` + 4 tenant APIs.
  - 4 `/api/tenant/mcp/*` handlers: `usage.js` (rolling-24h spend vs cap + reset_at + plan_tier),
    `sessions/list.js` (token_hash NEVER echoed), `sessions/revoke.js` (cross_tenant_forbidden
    guard + `revokeSession` delegate with `reason='user_revoked_via_settings'`),
    `cost-breakdown.js` (markos_audit_log aggregation by `payload.tool_id` over last 24h,
    total_cost_cents desc + calls asc tie-break).

  - Surface S1 `app/(markos)/settings/mcp/page.tsx` + `.module.css`: at-cap `role="alert"`
    banner (#fef3c7/#d97706/#78350f), usage card (h1 "MCP server" Sora 28px + `role="meter"`
    cost meter + reset timer + Refresh), top-tools list (clickable filter chips), sessions
    `<table>` with `<caption>` + scope="col" + per-row Revoke, breakdown `<details>`
    (filterable), revoke confirm native `<dialog>` (destructive #9a3412 filled + neutral
    Cancel), toast `role="status" aria-live="polite"` with 200ms slide-in. 30s auto-refresh
    on usage + sessions; breakdown manual. Every CSS class traces to Phase 201 ancestor
    (sessions/members/danger).

  - `contracts/F-95-mcp-cost-budget-v1.yaml`: 4 paths + 402 `budget_exhausted` -32001 envelope;
    cross-references Plan 202-03 cost-meter for enforcement path.

  - New suites: `test/mcp/mcp-usage-api.test.js` (12 handler cases) +
    `test/mcp/mcp-settings-ui-a11y.test.js` (15 UI grep-shape + token cases).
    27/27 green. Full MCP suite (Wave-1 + Wave-2 + Wave-3 + Wave-4) **277/277 green**.

  - Commits: e679c7b (Task 1 RED) · c3857d8 (Task 1 GREEN + F-95) · 15dc6cc (Task 2 RED) ·
    b6fbe2d (Task 2 GREEN).

  - **Decisions:** (1) Secondary sort by calls ASC on cost-breakdown total-cost tie (higher
    cost-per-call is the more informative signal; dictated by plan's own test).
    (2) `/api/tenant/mcp/sessions/revoke` hardens cross-tenant with SELECT before UPDATE →
    403 cross_tenant_forbidden (T-202-09-01 mitigation). (3) org_id optional on /usage with
    fail-safe to plan_tier='free' (lowest cap) — prevents 401 cascade while preserving
    tenant_id as authoritative scope.

- **Plan 202-05 shipped** (parallel executor, Wave 3) — MCP observability + Bearer envelope ready.
  - `lib/markos/mcp/log-drain.cjs` + `.ts` dual-export: `emitLogLine` D-30 shape
    `{ domain:'mcp', req_id, session_id, tenant_id, tool_id, duration_ms, status, cost_cents,
    error_code, timestamp }` with null coercion + JSON.stringify-safe round-trip.

  - `lib/markos/mcp/sentry.cjs` + `.ts` dual-export: `captureToolError` + `setupSentryContext`
    with lazy `@sentry/nextjs` import behind `SENTRY_DSN` gate; triple-safety (env-gated,
    try/catch import, try/catch captureException); dep-injectable via `deps.sentry`;
    `_internalResetForTests` for suite isolation.

  - `sentry.server.config.ts` — `Sentry.init({ dsn, tracesSampleRate: 0.1, environment: VERCEL_ENV, release: VERCEL_GIT_COMMIT_SHA })`.
  - `instrumentation.ts` — `register()` hook dynamic-imports sentry.server.config under
    `NEXT_RUNTIME === 'nodejs' && SENTRY_DSN`; `onRequestError` forwards to `captureRequestError`.

  - `next.config.ts` — `withSentryConfig(nextConfig, { org:'markos', project:'markos-web', silent: !CI })`.
  - `lib/markos/mcp/server.cjs`: `SERVER_INFO.version` bumped 1.0.0 → **2.0.0** (marketplace v2
    alignment); added `runToolCallThroughPipeline` (sole dispatch path into Plan 202-04 pipeline)

    + `buildToolRegistryFromDefinitions` adapter. Additive merge with Plan 202-08's
    `listResources/listResourceTemplates/readResource/subscribeResource/unsubscribeResource`.

  - `api/mcp/session.js`: `mcp-req-<uuid>` (D-29) at every entry; `extractBearer` regex;
    `WWW-Authenticate: Bearer resource_metadata="https://markos.dev/.well-known/oauth-protected-resource"`
    on 401 (MCP 2025-06-18 + Marketplace cert); `tools/call` routed through pipeline;
    `capabilities.resources: { subscribe: true, listChanged: false }` advertised at initialize;
    `safeListResources` falls back to `listResourceTemplates()` for marketplace discovery.

  - `lib/markos/mcp/pipeline.cjs`: finally block calls `emitLogLine` (replaces console.log
    placeholder); catch block calls `captureToolError` on thrown exceptions; finally block also
    fires `captureToolError` for `output_schema_violation` (non-throwing server-error path).

  - `package.json`: `@sentry/nextjs ^10.49.0` (latest stable via `npm view`).
  - New suite: `test/mcp/observability.test.js` (9 tests — D-30 shape, null coercion, graceful
    degrade, tags/extra correctness, config-file greps). `server.test.js` extended +8 Plan 202-05
    tests (v2 bump, req_id echo, Bearer gating, WWW-Authenticate, pipeline delegation).

  - **49/49 green** across observability + server + pipeline; Wave-1 regression **106/106**;
    Phase 201 regression **25/25**; full Phase 202 suite **178/178**.

  - Commits: ebb0440 (RED obs) · bd27f6e (GREEN obs + Sentry init + package.json) · 4aecab5
    (RED server ext) · 8279cb5 (GREEN pipeline + server v2 + session Bearer).

  - **Decisions:** (1) Triple-safety on Sentry (DSN env gate + lazy import try/catch + captureException try/catch)
    — captureToolError never throws. (2) req_id is server-generated via randomUUID; client `_meta.req_id` ignored
    (T-202-05-10). (3) Additive parallel-wave composition — sibling 202-06 (list_pain_points) and 202-08
    (resources + notifications/initialized) merged via targeted Edits, not rewrites.

- **Plan 202-02 shipped** (parallel executor, Wave 2) — OAuth 2.1 + PKCE + Surface S2 ready.
  - `lib/markos/mcp/oauth.cjs` + `.ts` dual-export: `AUTH_CODE_TTL_SECONDS=60`,
    `issueAuthorizationCode` (Redis `SET NX EX60` + `randomBytes(32)` hex),
    `consumeAuthorizationCode` (GETDEL one-time), `verifyPKCE` (RFC 7636 length
    gate + `timingSafeEqual`), `generateDCRClient` (`mcp-cli-<hex32>`),
    `isAllowedRedirect` whitelist (https/loopback/vscode.dev/claude.ai).

  - 7 endpoints: `/.well-known/oauth-protected-resource` (RFC 9728),
    `/.well-known/oauth-authorization-server` (RFC 8414 S256-only), `/oauth/register`
    (RFC 7591 DCR), `/oauth/authorize` (302 /login or /oauth/consent),
    `/oauth/authorize/approve` (listTenantsForUser + D-07 tenant-bind +
    `issueAuthorizationCode`), `/oauth/token` (PKCE + RFC 8707 exact-match +
    `createSession` → Bearer 86400s; zero `refresh_token` per D-06), `/oauth/revoke`
    (RFC 7009 anti-probing always-200 for authenticated actor + `revokeSession`).

  - Surface S2 `app/(markos)/oauth/consent/page.tsx` + `.module.css`: Sora 28px
    heading, scope chips, multi-tenant fieldset/legend picker, Approve/Deny, `What
    is MCP?` details, `role="alert"` errors, 44px tap targets, prefers-reduced-motion.

  - `contracts/F-89-mcp-oauth-v1.yaml`: 7 paths + RFC 7636/7591/8414/9728/8707/7009
    references; mirrors F-71 YAML shape.

  - New suites: `test/mcp/oauth.test.js` (47) + `test/mcp/consent-ui-a11y.test.js` (14).
    61/61 green. Wave-1 regression 66/66 green. Phase 201 regression 25/25 green.

  - Commits: b3a6cfa (RED 1+2) · d58d08a (Task 1 GREEN) · 4021bee (Task 2 GREEN)
    · fc9ff52 (Task 3 RED) · c2ab450 (Task 3 GREEN).

  - **Decisions:** (1) Triple-gate S256 enforcement prevents PKCE downgrade at 3
    independent layers. (2) No refresh tokens (D-06) removes leak surface entirely.
    (3) RFC 7009 anti-probing: 401 anon, 200 auth regardless of token validity.

- **Plan 202-01 shipped** (parallel executor) — MCP session substrate ready.
  - Migration 88 (`markos_mcp_sessions`, opaque-token hash + 24h rolling TTL + RLS) + migration 89
    (`markos_mcp_cost_window` + atomic `check_and_charge_mcp_budget` plpgsql fn) with rollbacks.

  - `lib/markos/mcp/sessions.cjs` + `.ts` dual-export: hashToken, createSession (tenant-status guard),
    lookupSession (timingSafeEqual + token_hash strip), touchSession (24h extend), revokeSession
    (audit emit), listSessionsFor{Tenant,User}.

  - `api/mcp/session/cleanup.js` shared-secret cron + `vercel.ts` 4th cron entry at `0 */6 * * *`
    (preserves 201-02 drain · 201-07 purge · 201-03 signup cleanup).

  - Rule 3 blocking fix: `AUDIT_SOURCE_DOMAINS` extended 11 → 12 entries (`mcp`). writer.cjs +
    writer.ts + hash-chain.test.js locked-list regression updated in lockstep.

  - New suites: `test/mcp/session.test.js` (21) + `test/mcp/rls.test.js` (6) +
    `test/mcp/migration-idempotency.test.js` (4). 30/30 green. Phase 201 regression: 25/25 green.

  - Commits: b7ab22e (migrations) · 9e478c8 (audit whitelist) · 118f559 (sessions library) ·
    77e8d10 (cleanup cron).

## What just happened (2026-04-17)

- **Plan 201-08 shipped** — consolidation wave closed.
  - Cross-domain audit emitters wired: webhooks/engine.cjs + api/approve.js + api/submit.js.
  - F-88 tenant-audit-query contract + `api/tenant/audit/list.js` handler (tenant-admin read-only).
  - `contracts/openapi.json` regenerated (51 flows, 69 paths; all 14 phase-201 paths present).
  - 5 docs pages shipped: routing, admin, tenancy-lifecycle, gdpr-export, llms/phase-201-tenancy.
  - `public/llms.txt` appended with "Phase 201 — Tenancy" section (5 entries).
  - `vercel.ts` cron registry: audit/drain, lifecycle/purge-cron, cleanup-unverified-signups.
  - `@vercel/edge-config` ^1.4.3 added; `lib/markos/tenant/slug-cache.{cjs,ts}` read-through in
    middleware + write-through from `lib/markos/orgs/tenants.{cjs,ts}` and
    `switcher.createTenantInOrg`. Fulfils T-201-05-06 Plan 05 threat-model promise.

  - 4 new test suites: `audit-emitter-wiring`, `openapi-merge`, `docs-mirror`, `slug-cache` (21 tests).
  - Full phase-201 suite: **122/122 pass**. Auth + webhooks regression: **60/60 pass**.
  - Commits: 9f9b58e, aae5467, 1b148b3, cf7c84b, dc820e4, e6bcbf2, 3c5a9fd.

## Next step

Run phase verification for 201:

```bash
/gsd-verify-phase 201
```

After verification clears, proceed to Phase 202 per ROADMAP.

---

## Prior position (2026-04-16 · still-relevant context)

Phase: 201 (saas-tenancy-hardening)
Plan: 1 of 8
**Milestone:** v4.0.0 — SaaS Readiness 1.0 — active
**Phase:** 201
**Quality Baseline:** 15 gates defined in `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md`; inherited by every subsequent phase.

## What just happened (2026-04-16)

- v3.9.0 closure reconciled: phase 110 SUMMARY.md files written for all 4 plans (110-01…110-04), ROADMAP.md checkmarks + milestone status updated to complete, v3.9.0-MILESTONE-AUDIT.md passed.
- v3.9.0 ROADMAP section archived to `.planning/milestones/v3.9.0-ROADMAP.md`.
- v4.0.0 milestone opened with 7 phases (200–206) and 8 atomic plans scoped under phase 200 (wave-0).
- `obsidian/thinking/2026-04-16-markos-saas-roadmap.md` is the authoritative synthesis.

## Next step

Execute remaining plans in phase 200 wave-0 (parallel execution in progress):

**Wave 1 (parallel):** 200-01 (OpenAPI), 200-03 (Webhooks), 200-04 (Presets), 200-05 (llms.txt)

200-01 status: **Files written, awaiting git commit** (git write ops blocked in parallel agent; see SUMMARY.md)

After Wave 1 commits are applied:

- Wave 2: 200-02 (CLI generate), 200-06 (MCP server), 200-07 (SDK CI)
- Wave 3: 200-08 (Claude Marketplace landing)

```bash
/gsd-execute-phase 200
```

## Open questions

None — Q-A / Q-B / Q-C answered on 2026-04-16. See `obsidian/brain/Target ICP.md` + `obsidian/brain/Brand Stance.md` + Nango embedded connector posture.

## Accumulated Context (v4.0.0 theme)

- Mission: public SaaS launch · API-first · MCP-native · agent-marketplace-friendly · Claude Marketplace distribution priority.
- Target ICP: seed-to-A B2B SaaS + modern DTC + solopreneurs (incl. vibe-coders).
- Brand stance: developer-native · AI-first · quietly confident.
- Connector framework: Nango embedded (from phase 210).
- Monetization: platform fee + metered AI + BYOK discount.
- Compliance: SOC 2 Type I 6mo · Type II + ISO 27001 Y2 · HIPAA opt-in.
- Residency: US-East → US + EU → APAC.
- Autonomy: tiered, earn-trust per mutation family.
- Marketplace: plugins + agents with revenue share (70/30); moderated.
- Quality-first day-0 investment ratified — 80% foundations, 20% feature scope for wave-0.

## Carry-over context from v3.9.0

- Plugin runtime (`lib/markos/packs/pack-loader.cjs`) + pack diagnostics are stable and ready to extend.
- 13-connector set locked: Shopify · HubSpot · Stripe · Slack · Google Ads · Meta Ads · GA4 · Segment · Resend · Twilio · PostHog · Linear · Supabase.
- 7 business-model packs + 4 industry overlays shipped v3.9.0.
- Test baseline: 301 tests · 257 pass · 44 fail — preserved; any regression blocks phase close.

## References

- Roadmap (full): `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- Phase 200: `.planning/phases/200-saas-readiness-wave-0/` (DISCUSS.md · PLAN.md · QUALITY-BASELINE.md)
- Phases 201–206: `.planning/phases/201-*/DISCUSS.md` through `.planning/phases/206-*/DISCUSS.md`
- Canon: `obsidian/brain/MarkOS Canon.md` · `Agent Registry.md` · `Target ICP.md` · `Brand Stance.md`
- Quality gates: `.planning/phases/200-saas-readiness-wave-0/QUALITY-BASELINE.md`
