# Phase 215 Context - SaaS Billing, Payments, and Multi-Country Compliance

**Status:** Seeded from the 2026-04-22 SaaS Suite intake.

## Why this phase exists

Phase 215 turns Phase 214 subscription state into compliant SaaS billing for launch countries. It owns invoices, processor routing, accounting sync, dunning, and legal billing posture for the United States and Colombia.

## Canonical inputs

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md` SAS-04..06

## Existing implementation substrate to inspect

- Billing usage ledger, invoice projections, provider sync attempts, and entitlement snapshots.
- Webhook subscription engine, DLQ, replay, signing, rotation, rate limits, and status surfaces.
- Audit log and governance evidence tables.
- Existing Stripe references, if any, in billing or docs.
- Tenant settings and integration UI patterns.

## Required phase shape

1. Define `SaaSInvoice`, `SaaSProcessorConfig`, `SaaSAccountingConfig`, and `SaaSDianConfig`.
2. Map Stripe Billing/Tax and QuickBooks for the US path.
3. Map Mercado Pago, Siigo/Alegra, and DIAN requirements for the Colombia path.
4. Route processor/accounting events through the existing webhook engine guarantees.
5. Define invoice corrections, refunds, credits, write-offs, discounts, and dunning approval gates.
6. Define legal billing failure tasks, especially DIAN rejection P1 tasks.
7. Preserve future compatibility for referral rewards, affiliate commissions, partner payouts, and incentive experiments without implementing those growth modules.

## Non-negotiables

- No processor webhook bypasses webhook engine durability, signing, replay, DLQ, rate limit, and observability.
- No legal invoice issuance without country-specific compliance validation.
- No raw certificates, API keys, or webhook secrets in logs, prompts, tasks, or MCP payloads.
- No discount or save-offer logic bypasses Pricing Engine ownership.
- No referral, affiliate, partner, or incentive payout bypasses Pricing Engine, billing compliance, approval, audit, and tax/legal posture.

## Done means

GSD can plan country-aware billing implementation with legal/compliance gates, processor/accounting abstraction, webhook reuse, and SOC2 evidence posture.
