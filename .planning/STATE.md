---
gsd_state_version: 1.0
milestone: v4.0.0
milestone_name: SaaS Readiness 1.0
status: Ready to execute
last_updated: "2026-04-18T01:06:15.762Z"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 26
  completed_plans: 22
  percent: 85
---

> v4.0.0 "SaaS Readiness 1.0" initialized 2026-04-16 after v3.9.0 closeout and archive.

## Current Position

Phase: 202 (mcp-server-ga-claude-marketplace) — EXECUTING
Plan: 6 of 10

## What just happened (2026-04-18)

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
