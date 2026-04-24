# Phase 205 - Pricing Engine Foundation + Billing Readiness (Discussion)

> v4.0.0 SaaS Readiness milestone. Refreshed on 2026-04-23 with `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` as mandatory input. Pricing doctrine comes from `obsidian/brain/Pricing Engine Canon.md`. Quality baseline: `../200-saas-readiness-wave-0/QUALITY-BASELINE.md`.

**Date:** 2026-04-23  
**Milestone:** v4.0.0 SaaS Readiness  
**Parent:** [ROADMAP](../../v4.0.0-ROADMAP.md)  
**Depends on:** Phases 201 and 202, with compatibility to Phases 206, 207, 209, and 214-220  
**Quality baseline applies:** all 15 gates

## Goal

Make pricing a first-class, evidence-backed subsystem before MarkOS claims any public pricing certainty, package certainty, or self-serve billing certainty.

Phase 205 now has two jobs:

1. create the Pricing Engine foundation
2. clean up the active billing/pricing residue in the current app so pricing truth comes from the engine or from the doctrine-approved placeholder

## Mandatory inputs

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-CONTEXT.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `lib/markos/billing/entitlements.ts`
- `lib/markos/billing/pricing-catalog.ts`
- `api/billing/tenant-summary.js`
- `app/(markos)/settings/billing/page-shell.tsx`

## Current code evidence

- Billing enforcement, usage normalization, invoice line items, and provider sync already exist.
- Static pricing assumptions still survive in active UI/API/lib code.
- Pricing-sensitive doctrine now says those assumptions are historical candidates, not active truth.
- No `PricingRecommendation`, `PriceTest`, `TenantCostModel`, or pricing watch-list runtime object exists yet.

## Codebase-specific gap

The repo already has billing foundations, but they are not Pricing Engine-owned. That means Phase 205 is not just new feature work. It is also a migration of existing pricing and billing language out of static assumptions.

## Scope (in)

- Pricing objects and schema
- Cost model and pricing floor
- Pricing knowledge and competitor watch list
- Recommendation and price-test approval model
- Pricing API, MCP, and operator UI
- Compatibility hooks for SaaS Suite and growth-mode work
- Removal or neutralization of active hard-coded pricing assumptions in runtime surfaces

## Scope (out)

- Autonomous external price changes
- Full SaaS Suite implementation
- Full post-217 growth-engine implementation
- Unreviewed competitor scraping or terms-risky collection

## Refreshed decisions

### D-205-01: Placeholder sweep is part of this phase

Replacing active hard-coded public pricing assumptions is not optional cleanup. It is part of Phase 205 completion.

### D-205-02: Reuse billing substrate, do not fork it

`usage-normalizer`, invoice line item, reconciliation, and hold/evidence foundations should be reused. Pricing Engine should become the strategic truth that feeds billing, not a second billing stack.

### D-205-03: Read before write

Read-only pricing intelligence, recommendation review, and matrix surfaces should land before any provider-facing mutation path.

### D-205-04: Pricing-sensitive outputs must centralize

Pricing page copy, billing copy, save offers, discounts, annual nudges, referral rewards, affiliate commissions, and future growth prompts must eventually consume the same pricing objects or placeholder policy.

### D-205-05: Evidence compatibility with Phase 209 is mandatory

Even if Phase 209 lands later, Phase 205 must reserve space for source quality, freshness, extraction method, and known-gap metadata on pricing records.

## Threat-model focus

pricing manipulation, stale competitor data, unsupported pricing claims, cross-tenant leakage, approval bypass, margin-destroying recommendations, and drift between billing substrate and pricing doctrine

## Success criteria

- No active runtime surface presents static public pricing as canonical truth.
- Pricing Engine objects exist with tenant-safe storage and approval posture.
- Billing surfaces can point to engine-owned records or doctrine placeholders.
- Future SaaS and growth phases can consume pricing context without bypassing the engine.

## Open questions

- What is the first execution slice: MarkOS Tenant 0, SaaS, eCommerce, or Services?
- Should `pricing-catalog.ts` survive as a compatibility adapter, or should engine-backed read models replace it outright?
- What exact source-quality threshold makes competitor pricing admissible as recommendation evidence?
- What exact fresh contract and migration range is best reserved for this phase?

## Planning note

No new top-level phase is needed. The deep audit confirms that Phase 205 is still the correct home for Pricing Engine plus billing-residue cleanup.

## References

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- [Quality Baseline](../200-saas-readiness-wave-0/QUALITY-BASELINE.md)
