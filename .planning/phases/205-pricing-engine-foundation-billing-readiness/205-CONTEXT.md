# Phase 205 Context - Pricing Engine Foundation + Billing Readiness

**Status:** refreshed from the 2026-04-23 deep codebase-vault audit

## Why this phase changed

Phase 205 is no longer only about future pricing architecture. The codebase audit proved there are active billing/pricing surfaces that still speak with static assumptions. So this phase must both create the Pricing Engine and migrate those surfaces away from pseudo-canonical pricing.

## Canonical inputs

- `obsidian/work/incoming/15-PRICING-ENGINE.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

## Existing implementation substrate to inspect

- `lib/markos/billing/contracts.ts`
- `lib/markos/billing/usage-normalizer.ts`
- `lib/markos/billing/entitlements.ts`
- `lib/markos/billing/pricing-catalog.ts`
- `lib/markos/billing/invoice-line-items.ts`
- `api/billing/tenant-summary.js`
- `api/billing/operator-reconciliation.js`
- `app/(markos)/settings/billing/page-shell.tsx`
- `app/(markos)/admin/billing/page.tsx`
- `lib/markos/mcp/approval.cjs`
- `lib/markos/governance/evidence-pack.ts`

## Required phase shape

1. Reserve a clean pricing contract and schema family.
2. Model durable pricing objects with tenant-safe storage.
3. Reuse existing usage/billing evidence to support cost-floor and margin logic.
4. Add source-quality, capture-time, and evidence metadata on pricing records.
5. Route recommendation and test activation through approval posture.
6. Expose pricing through API and MCP before high-risk mutations.
7. Replace active static pricing assumptions in runtime surfaces with engine-backed read models or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
8. Preserve stable hooks for Phase 206 controls, Phase 209 evidence normalization, and Phases 214-220 SaaS/growth pricing use cases.

## Codebase-specific constraints

- Existing billing code is valuable and should not be thrown away.
- Existing billing UI/API examples must stop reading like product truth.
- Pricing Engine cannot assume Phase 209 is already implemented, so Phase 205 must carry temporary evidence fields directly.
- Future SaaS Suite and growth phases will depend on this phase for discounts, save offers, annual plans, in-app prompts, referral rewards, affiliate commissions, and pricing-sensitive messaging.

## Decision gates planners must lock

- first execution slice
- fresh contract and migration allocation
- minimum cost-model fields
- minimum source-quality and freshness thresholds
- recommendation/test approval model
- compatibility strategy for current billing surfaces

## Non-negotiables

- No hard-coded public pricing truth after this phase lands.
- No pricing-sensitive mutation without approval.
- No competitor pricing evidence without source and capture metadata.
- No SaaS Suite or growth discounting path that bypasses Phase 205 objects.

## Done means

Pricing becomes an explicit subsystem that billing, content, sales, SaaS, and growth can safely depend on, and the old static pricing residue is no longer masquerading as active truth.
