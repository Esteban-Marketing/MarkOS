# Phase 205 — Billing Self-Serve + BYOK (Discussion)

> v4.0.0 SaaS Readiness milestone. Synthesis: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-17
**Milestone:** v4.0.0 SaaS Readiness
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)
**Depends on:** phase 200 (wave-0)
**Quality baseline applies:** all 15 gates

## Goal

Stripe-backed self-serve billing portal. Platform fee + metered AI + BYOK discount. Transparent invoices. Tax handling.

## Scope (in)

- Stripe Checkout + Billing Portal for plan upgrades/downgrades
- Usage-based metered AI via `billing_usage_events` → Stripe usage records
- BYOK discount calc — detect BYOK flag, waive AI markup per call
- Invoice UI with per-tenant cost breakdown
- Stripe Tax for global tax handling
- Dunning + failed-payment flows

## Scope (out)

- Enterprise custom contracts (post-v4.0.0)
- Multi-currency beyond Stripe defaults

## Threat-model focus

pricing manipulation · BYOK key exfil · race conditions on upgrade

## Success criteria

- Tenant can self-serve upgrade → downgrade → cancel without support
- Invoice breakdown matches telemetry to cent
- BYOK discount applied correctly; reconciliation passes

## Migrations (planned)

- `55 extensions: self-serve fields.sql`

## Contracts (planned)

- `existing F-54 billing contracts · new F-86-self-serve-v1`

## Pre-locked decisions (2026-04-16)

- Hosting: SaaS cloud first (decision 1).
- Integration order: OpenAPI → SDKs → MCP → Webhooks → Zapier → Make → n8n (decision 4).
- Target ICP: [[Target ICP|seed-to-A B2B SaaS + modern DTC + solopreneurs]] (Q-A).
- Brand stance: [[Brand Stance|developer-native, AI-first, quietly confident]] (Q-B).
- Connector posture: Nango embedded (Q-C).
- Quality gates: all 15 from `QUALITY-BASELINE.md` apply.

## Open questions

_Defer to `/gsd-discuss-phase 205` interactive session before planning._

## References

- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
- [Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Target ICP](../../../obsidian/brain/Target%20ICP.md) · [Brand Stance](../../../obsidian/brain/Brand%20Stance.md)
- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)
- [MarkOS Codebase Atlas](../../../obsidian/reference/MarkOS%20Codebase%20Atlas.md)
