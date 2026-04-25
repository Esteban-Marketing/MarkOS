# Phase 225 - Analytics, Attribution, and Narrative Intelligence (Discussion)

**Milestone:** v4.2.0 Commercial Engines 1.0  
**Depends on:** Phases 209, 211, 212, 221-224  
**Quality baseline applies:** all 15 gates

## Goal

Create the semantic layer for attribution, customer journeys, performance narratives, explainable metrics, and decision-grade measurement.

## Scope

- Metric catalog and source precedence across marketing, product, CRM, billing, and ecosystem data.
- Attribution and journey models.
- Narrative intelligence, alerts, and decision surfaces.
- Explainability, freshness, and drill-down semantics.
- Analytics writeback into tasks, launches, pricing, and learning.

## Non-Goals

- CDP event and identity contracts belong to Phase 221.
- CRM commercial memory belongs to Phase 222.
- Conversion and launch execution belongs to Phase 224.

## Discuss Focus

- Metric semantics and source precedence.
- Attribution model boundaries and explainability.
- Narrative generation vs passive dashboard posture.
- How analytics feeds decisions instead of just reporting.

## Proposed Plan Slices

Updated 2026-04-25 to match actual 7-plan, 5-wave file scope after review feedback (RM2). CONTEXT.md `<decisions>` block remains the authoritative source for D-XX boundaries; this table reflects the post-review plan layout.

| Wave | Slice | Plan | Purpose |
|---|---|---|---|
| 1 | Schema foundation + architecture lock + npm deps + upstream-readiness gate + canonical metric view + attribution single-writer | 225-01 | All 11 schema migrations (134-138), 12 fixture factories, 10 contracts F-147..F-156, npm install (json-logic-js + xxhash-wasm + @ai-sdk/gateway), `assertUpstreamReady()` preflight CLI, canonical view migration `134a_analytics_metric_canonical_view.sql`, attribution touch-writer module + trigger |
| 2 | Metric catalog runtime + freshness contract + cron handlers (parallel with 225-03) | 225-02 | Migrations 139 + 141, 9 lib modules under `lib/markos/analytics/{catalog,freshness,render,decision/evaluators}`, 4 cron handlers (hourly/daily/weekly/freshness-audit), AgentRun bridge stub, StaleIndicator, 9 test files |
| 2 | Attribution engine + 6 models + legacy adapter (parallel with 225-02) | 225-03 | Migration 142, 9 lib modules under `lib/markos/analytics/attribution/*` + tombstone primitive, weekly recompute cron, F-157 contract, 11 test files |
| 3 | Anomaly detection + decision rules engine + decision-class audit (parallel with 225-05) | 225-04 | Migration 143 + `143a_analytics_decisions_audit.sql`, 14 lib modules (8 anomaly + 6 decision evaluators), task bridge, decision classifier, anomaly cron, F-158 contract, 11 test files |
| 3 | Narrative intelligence + journey materializer + writeback audit (parallel with 225-04) | 225-05 | Seed `225_narrative_templates.sql` + migration `139a_analytics_writeback_audit.sql`, 13 lib modules (9 narrative + 4 journey), 5 cron handlers (narrative-generation + journey-hourly/daily/weekly + tombstone-scrub), F-159 + F-160 contracts, 14 test files |
| 4 | Experiment winner detection + pricing signal emission + cross-tenant aggregation + full evaluators | 225-06 | Migration 140, 11 lib modules (experiments + pricing-signal + benchmark) + 2 evaluator full implementations replacing 225-04 stubs, 2 cron handlers, F-161 + F-162 contracts, 14 test files |
| 5 | API + 7 MCP tools + 6 UI workspaces + Approval Inbox + Morning Brief + RLS hardening + OpenAPI regen + closeout | 225-07 | Migrations 144 + 145, 26 HTTP route handlers under `api/v1/analytics/*.js` (legacy convention per D-49), 7 MCP tools registered in `lib/markos/mcp/tools/index.cjs`, 7 UI components under `app/(markos)/analytics/*`, P208 entry types + Morning Brief section, OpenAPI regen at `contracts/openapi.json`, Playwright + Chromatic specs, 225-SUMMARY.md + STATE.md + ROADMAP.md updates, human-verify checkpoint |

## Architecture & Boundary Notes (added post-review 2026-04-25)

- All HTTP route handlers ship under legacy `api/v1/analytics/*.js` (NOT App Router `route.ts`) — see CONTEXT.md D-49.
- All MCP tools register in `lib/markos/mcp/tools/index.cjs` (extension `.cjs`).
- All OpenAPI artifacts target `contracts/openapi.json` (NOT `public/openapi.json`).
- Test runner: `npm test` (Node `--test`) only; `vitest` and `playwright` are NOT introduced by P225.
- Auth: `requireHostedSupabaseAuth` from `onboarding/backend/runtime-context.cjs:491` only.
- Service-role client: inline `createClient(...)` per `api/submit.js:39-43` pattern.
- Plugin lookups: `resolvePlugin(registry, pluginId)` from `lib/markos/plugins/registry.js:102` only.
- Upstream phases (P209, P211, P212, P221-P224) are HARD requirements — no soft-skip; `assertUpstreamReady()` preflight blocks if any are absent.
