# Phase 203 — Webhook Subscription Engine GA (Discussion)

> v4.0.0 SaaS Readiness milestone. Synthesis: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-17
**Milestone:** v4.0.0 SaaS Readiness
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)
**Depends on:** phase 200 (wave-0)
**Quality baseline applies:** all 15 gates

## Goal

Graduate 200-03 primitive to GA: delivery dashboard UI, DLQ with replay, signing-secret rotation, per-subscription rate-limits, webhook status page.

## Scope (in)

- Operator UI for webhook subscriptions, deliveries, DLQ
- Replay from DLQ with original signature
- Signing-secret rotation (overlap window, 30-day grace)
- Per-subscription RPS cap + circuit breaker
- Webhook health telemetry → Sentry

## Scope (out)

- Custom payload transformations (phase 210 connector framework)

## Threat-model focus

replay attacks · signing-secret leak · endpoint SSRF

## Success criteria

- 99.9% delivery success for subscribers responding 2xx within 5s
- DLQ replay works on first attempt
- Signing-secret rotation survives 30 days with zero downtime

## Migrations (planned)

- `72 extensions: DLQ columns.sql`

## Contracts (planned)

- `F-72 · F-73 updates`

## Pre-locked decisions (2026-04-16)

- Hosting: SaaS cloud first (decision 1).
- Integration order: OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n (decision 4).
- Target ICP: [[Target ICP|seed-to-A B2B SaaS + modern DTC + solopreneurs]] (Q-A).
- Brand stance: [[Brand Stance|developer-native, AI-first, quietly confident]] (Q-B).
- Connector posture: Nango embedded (Q-C).
- Quality gates: all 15 from `QUALITY-BASELINE.md` apply.

## Open questions

_Defer to `/gsd-discuss-phase 203` interactive session before planning._

## References

- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- [Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Target ICP](../../../obsidian/brain/Target%20ICP.md) · [Brand Stance](../../../obsidian/brain/Brand%20Stance.md)
- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)
- [MarkOS Codebase Atlas](../../../obsidian/reference/MarkOS%20Codebase%20Atlas.md)
