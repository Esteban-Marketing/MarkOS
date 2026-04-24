# Phase 200 — SaaS Readiness Wave 0 (Discussion)

> Phase 200 is the 2-week "0-day shortlist" wave from the MarkOS SaaS Roadmap (2026-04-16). It ships the 8 lowest-friction changes that unlock API-first + MCP + SDK + CLI + agent-marketplace distribution without architectural shift.

## Parent roadmap

- `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- Milestone: v4.0.0 "SaaS Readiness 1.0"
- Wave: 0 (0-day shortlist · precedes phases 201–206)

## Goal

Ship in 2 weeks: public OpenAPI, MCP server with Claude Marketplace listing, webhook primitive, presetted onboarding, `llms.txt` + doc mirror, CLI `generate`, SDK auto-gen pipeline, Claude Marketplace launch bundle.

## Scope (in)

- **A1** Public OpenAPI 3.1 served at `/api/openapi.json` + `/api/openapi.yaml` (merged from existing 39 F-NN contracts).
- **A2** MCP server (HTTP+SSE on Vercel Fluid Compute) exposing 10 initial MarkOS skills as MCP tools.
- **A3** Webhook subscription engine — `POST /api/webhooks/subscribe`, HMAC-SHA256 signed deliveries, retry via Vercel Queues.
- **A4** `npx markos init --preset=<bucket>` for 5 presets: `b2b-saas` · `dtc` · `agency` · `local-services` · `solopreneur`.
- **A5** `llms.txt` + markdown doc mirror + AI-crawler allow-list.
- **A6** CLI `markos generate <brief>` one-shot draft mode (reuses Message Crafting Pipeline).
- **A7** SDK auto-gen CI (`@markos/sdk` TypeScript, `markos` Python) published on OpenAPI change.
- **A8** Claude Marketplace listing bundle + `/integrations/claude` landing + demo sandbox.

## Out of scope

- Public signup flow (phase 200 mainline → full tenancy hardening).
- Pricing Engine-backed billing readiness (phase 205).
- Agent marketplace (phase 213 alpha, phase 224 GA).
- 13-connector framework (phase 210/211).
- Zapier/Make/n8n apps (phase 212).
- EU residency (phase 222).
- UI v2 (phase 220).

## Constraints

- Two-week calendar.
- No new migrations that require downtime on existing tenants.
- All new endpoints JWT-protected via `requireHostedSupabaseAuth` (see [HTTP Layer](../../../obsidian/reference/HTTP%20Layer.md)).
- Every new contract follows F-NN OpenAPI 3.1 + `x-markos-meta` pattern.
- Vercel Fluid Compute for MCP (instance reuse + graceful shutdown).
- OpenAPI source of truth — SDKs + Zapier/Make/n8n derive from it, no drift.
- Claim library + brand pack reused unchanged — no UX redesign.

## Decisions pre-locked (roadmap 2026-04-16)

| # | Decision | Value |
|---|---|---|
| 1 | Hosting | SaaS cloud first |
| 2 | Onboarding | guided AI interview + presets (this phase delivers presets) |
| 4 | Integration order | OpenAPI → SDKs → MCP → Webhooks → … (this phase covers first 4) |
| 9 | Autonomy | tiered; this phase is read-only + propose-only — no autonomy upgrade |
| 11 | Claude Marketplace priority | yes (A8) |
| 12 | API-first + great UI | API-first in this phase; UI comes later |

## Questions remaining

- Q-A first target ICP — default **seed-to-A B2B SaaS + modern DTC + solopreneurs**; confirm before designing preset copy in A4.
- Q-B brand stance — default **developer-native, AI-first, quietly confident**; confirm before A5 + A8 marketing assets.
- Q-C connector posture — **Nango embedded**; confirms before phase 210 (not this phase).

## Success criteria for Wave 0

- OpenAPI 3.1 published + validated against Spectral lint.
- MCP server reachable by Claude Desktop / Cursor / Windsurf — 10 tools callable.
- Webhook subscribe → test-fire → delivery → signed HMAC verified.
- `npx markos init --preset=b2b-saas` produces a runnable MarkOS instance with seed data in < 90 seconds.
- `llms.txt` live at markos.dev; `GPTBot` + `ClaudeBot` + `PerplexityBot` allowed.
- CLI `markos generate` produces audit-passing draft from a YAML brief.
- npm publishes `@markos/sdk@x.y.z` and PyPI publishes `markos` on OpenAPI change (CI).
- Claude Marketplace listing submitted (review queue entry).

## Risks

| Risk | Mitigation |
|---|---|
| MCP protocol version churn | pin to spec 2025-03 stable; isolate transport from tool adapters |
| SDK publish credential rotation | use trusted publishers on npm + PyPI |
| Webhook retry storm on customer outage | max 24 retries with exp backoff + DLQ + circuit breaker per subscription |
| Claude Marketplace submission delay | start review concurrently with build |
| Preset scope creep | cap presets at 5 listed; any new preset = phase 201+ |

## Agents involved

- `MARKOS-AGT-STR-02` Planner — decomposition
- `MARKOS-AGT-EXE-01` Executor — atomic-commit execution
- `MARKOS-AGT-EXE-03` Plan Checker — verification before execution
- `MARKOS-AGT-NEU-01` — not required this phase (no external copy ships)
- **New agent registrations in this phase**: none (agents introduced in phase 201+)

## References

- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- [Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Agent Registry](../../../obsidian/brain/Agent%20Registry.md)
- [MarkOS Codebase Atlas](../../../obsidian/reference/MarkOS%20Codebase%20Atlas.md)
- [HTTP Layer](../../../obsidian/reference/HTTP%20Layer.md) · [Core Lib](../../../obsidian/reference/Core%20Lib.md)
- [Contracts Registry](../../../obsidian/reference/Contracts%20Registry.md) · [Database Schema](../../../obsidian/reference/Database%20Schema.md)
