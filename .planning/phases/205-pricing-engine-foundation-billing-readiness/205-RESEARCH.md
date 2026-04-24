# Phase 205 Research Scaffold - Pricing Engine

**Purpose:** guide `/gsd-research-phase 205` before implementation planning.

## Research questions

### Current code fit

- Which existing tables/libraries already capture usage cost, BYOK state, tenant billing periods, and invoice-grade usage?
- Can existing approval packages support price-change, packaging-change, and price-test decisions, or does Pricing Engine need a new approval package type?
- Does the current MCP server support tenant-scoped pricing tools with auth, audit, and cost visibility?
- Which UI shells and settings routes are best suited for Pricing Engine surfaces?

### Data model

- What is the minimum viable `markos_pricing_knowledge` shape that handles own, competitor, market, and strategic pricing records?
- How should pricing history be stored without overwriting evidence?
- Which fields are required for source quality, extraction confidence, and change detection?
- How should PricingRecommendation records link to cost model snapshots, evidence records, and approval decisions?

### Cost model

- Which cost fields are mandatory for SaaS, eCommerce, and Services?
- What gross margin defaults are safe for MarkOS Tenant 0 before operator override?
- How should LLM/API cost, support, payment fees, and connector usage flow into pricing floor calculations?
- Should BYOK reduce price, reduce margin risk, raise reliability, or simply become a recommendation input?

### Competitive intelligence

- Which competitor pricing data can be collected safely through public page fetches, manual entry, screenshots, or operator-provided links?
- What crawler rate limits, robots/terms posture, and extraction confidence gates are required?
- What threshold defines major, minor, and cosmetic price changes?
- How should tier-1 daily and tier-2 weekly monitoring be scheduled?

### Recommendation and tests

- What frameworks should the first recommendation engine support: value metric fit, cost floor, competitive position, annual discount, packaging clarity, or price-test design?
- What risk labels and reversibility scores make price decisions reviewable?
- What stop conditions are required for price tests by business type?
- What metrics prove a price test helped: conversion, ARPU, LTV/CAC, gross margin, churn, pipeline, or win rate?
- Which future SaaS Marketing OS signals must be represented now so PLG upgrade prompts, feature gates, usage-limit nudges, annual-plan prompts, referral rewards, affiliate commissions, pricing-page experiments, and G2/Capterra pricing sync can use the engine later?

### Billing handoff

- What is the safe boundary between Pricing Engine recommendations and Stripe product/price creation?
- Should Stripe products/prices be generated only after accepted recommendation decisions?
- How should invoices show engine-backed cost/usage without exposing raw competitor intelligence?
- What manual override path is needed for enterprise contracts?

## Required source classes

- Existing MarkOS code and tests.
- Current billing, usage, audit, MCP, approval, and tenant-isolation docs.
- Pricing Engine source docs in Obsidian.
- SaaS Suite and SaaS Marketing OS Strategy source docs in Obsidian.
- Official Stripe docs if Stripe product/price/tax behavior is touched during implementation.
- Official docs for any crawler/scheduler/runtime dependency introduced.

## Research output format

Each research note should include:

- Question answered.
- Files inspected.
- Existing capability.
- Gap.
- Recommended implementation path.
- Risk.
- Tests implied.
- Phase-plan impact.

## Recommended decision gates

- First business-type slice selected.
- Fresh migration and F-ID range reserved.
- Cost model minimum viable fields approved.
- Evidence/source quality threshold approved.
- Approval package shape approved.
- Billing handoff boundary approved.
- Tenant 0 dogfood posture approved.

## Codebase Research Addendum - 2026-04-23

### Files inspected

- `lib/markos/billing/contracts.ts`
- `lib/markos/billing/usage-normalizer.ts`
- `lib/markos/billing/entitlements.ts`
- `api/billing/tenant-summary.js`
- `app/(markos)/settings/billing/page-shell.tsx`
- `lib/markos/mcp/cost-table.cjs`
- `lib/markos/mcp/pipeline.cjs`
- `lib/markos/mcp/approval.cjs`
- `lib/markos/governance/evidence-pack.ts`
- `.agent/markos/references/pricing-engine.md`

### Existing capability

MarkOS already has useful billing and cost substrate:

- Invoice-grade usage events exist for `agent_run`, token input/output, plugin operations, and storage snapshots.
- `normalizeAgentRunUsageEvent()` already captures provider/model context, run id, token usage, latency, cost, outcome, and prompt version for billing ledger handoff.
- MCP has cost admission, daily caps, free-tier gating, approval tokens for mutating tools, and true-up semantics.
- Billing settings and tenant summary surfaces demonstrate invoice/hold/recovery evidence, but use static sample values.
- Governance evidence packs already collect billing usage, approval, identity, audit, and provider sync evidence.

### Gaps

- No first-class `markos_pricing_*` schema exists yet.
- No `PricingKnowledge`, `TenantCostModel`, `PricingRecommendation`, `PriceTest`, `PricingWatchList`, or `PricingAlert` object exists in app code.
- No Pricing Engine API, MCP tool, UI, CLI, or AgentRun integration exists.
- Static plan names, allowances, invoice amounts, and included usage still appear in billing UI/API examples.
- BYOK, discounts, annual plans, save offers, referral rewards, affiliate commissions, and packaging choices are not engine-owned.
- Competitor pricing evidence has no source quality, TTL, crawl/extraction method, change diff, or approval linkage.

### Recommended implementation path

1. Reserve a new contract family for Pricing Engine API/MCP contracts and a fresh migration range for pricing tables.
2. Model the minimum durable objects: `PricingKnowledge`, `TenantCostModel`, `PricingRecommendation`, `PriceTest`, `PricingWatchList`, and `PricingAlert`.
3. Link every recommendation to `EvidenceMap` records once Phase 209 lands; until then, require explicit source URL, capture timestamp, extraction method, confidence, and known gaps directly on pricing records.
4. Reuse billing usage normalizers for cost floors, but keep pricing strategy decisions separate from billing enforcement.
5. Route price/package/page/discount/test mutations through approval packages and MCP approval tokens.
6. Replace active hard-coded public prices and package copy with `{{MARKOS_PRICING_ENGINE_PENDING}}` or an approved `PricingRecommendation` reference.
7. Expose read-only Pricing MCP tools before mutating tools; mutating billing-provider sync must remain Phase 205-07 or later.

### Tests implied

- Unit tests for pricing floor math, source confidence thresholds, recommendation risk labels, and price-test stop conditions.
- RLS tests proving tenant-scoped pricing objects cannot cross tenants.
- Approval tests proving price/package/billing-provider writes fail without an approval decision.
- Billing compatibility tests proving static `Growth Monthly` sample output is no longer treated as canonical public pricing.
- MCP tests for read-only pricing tools, budget enforcement, and approval-required mutation attempts.

### Phase-plan impact

The existing 205-01 through 205-08 plan split remains correct. The only hard requirement before execution is to make 205-01 contract/schema work explicitly reserve evidence hooks for Phase 209 and SaaS Suite hooks for Phases 214-217.

## Discuss/Research Refresh - 2026-04-23

### Additional files inspected

- `lib/markos/billing/pricing-catalog.ts`
- `lib/markos/billing/invoice-line-items.ts`
- `api/billing/operator-reconciliation.js`
- `app/(markos)/admin/billing/page.tsx`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`

### Additional codebase findings

- `pricing-catalog.ts` is a useful pricing snapshot helper, but it is not a Pricing Engine. It should be treated as a compatibility layer or adapter candidate, not as the final strategy model.
- Billing UI and API surfaces already speak in a confident pricing voice even when their data is sample/static. This is exactly the kind of residue Phase 205 must clean up.
- Operator billing/admin pages already have strong evidence/recovery language that should be preserved and fed by engine-owned pricing objects later.

### Refreshed research decisions

- Phase 205 must explicitly include runtime residue cleanup in lib/API/UI surfaces; that work is not optional after the deep audit.
- Read-only pricing intelligence and recommendation review should precede provider-facing mutations.
- Phase 205 should leave evidence hooks for Phase 209 and control hooks for Phase 206 from day one.
- No new top-level phase is justified; the missing work still belongs inside the existing 205 plan stack.

### Additional tests implied

- Compatibility tests proving pricing-related surfaces no longer imply static public truth.
- Regression tests that billing evidence/reconciliation behavior survives the pricing-model migration.
- MCP/API tests that pricing reads are tenant-safe before any mutation path is enabled.
