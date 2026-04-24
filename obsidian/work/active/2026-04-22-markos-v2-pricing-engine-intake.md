---
date: 2026-04-22
status: active
description: "Distilled requirements from incoming 15-PRICING-ENGINE.md for MarkOS v2: pricing intelligence architecture, PRC agents, schema/API/MCP/UI, acceptance criteria, and plan changes."
tags:
  - work
  - active
  - pricing
  - requirements
  - incoming-v2
  - gsd
aliases:
  - MarkOS v2 Pricing Engine Intake
---

# MarkOS v2 Pricing Engine Intake

## Purpose

This note distills `obsidian/work/incoming/15-PRICING-ENGINE.md` into vault-ready requirements and GSD planning implications.

The Pricing Engine changes the MarkOS pricing strategy from fixed tier assumptions to a live, tenant-aware intelligence system. All previous fixed MarkOS tier prices are now non-canonical unless the Pricing Engine produces and the operator approves them.

Canonical placeholder: `{{MARKOS_PRICING_ENGINE_PENDING}}`.

## Strategic Finding

Pricing becomes a first-class marketing operating loop:

`cost model -> competitor intelligence -> market signals -> strategy recommendation -> approval -> price test -> measurement -> learning`

The engine is not a calculator. It is a continuous recommendation system for SaaS, eCommerce, and Services pricing decisions.

## Hard Requirements

### Pricing Intelligence

- Maintain a structured Pricing Knowledge Object for own, competitor, market, and strategic pricing data.
- Store all pricing intelligence as versioned, dated, quality-scored records.
- Preserve pricing history instead of overwriting old records.
- Monitor tier-1 competitors daily, tier-2 competitors weekly, and market signal lists monthly.
- Detect major, minor, and cosmetic pricing changes.
- Generate urgent alerts for direct competitor price increases/decreases over threshold, free-tier changes, tier removal, or value-metric changes.

### Cost Model

- Require a tenant cost model before strategic pricing recommendations.
- Support business-specific cost models for SaaS, eCommerce, and Services.
- Compute pricing floor and margin health.
- Treat below-floor pricing as an explicit strategy requiring operator awareness.
- Integrate with financial/revenue connectors where available.

### SaaS Module

- Understand flat-rate, tiered, per-seat, usage-based, per-active-user, hybrid, freemium, trial-only, and credit-based models.
- Analyze value metric fit, annual discount, tier structure, feature gating, conversion, churn, and price page performance.

### eCommerce Module

- Support SKU-level monitoring, competitor SKU matching, dynamic recommendations, bundles, promotions, inventory/margin awareness, and product catalog ingestion.

### Services Module

- Support hourly, project, retainer, value-based, productized, performance-based, and hybrid models.
- Use market rate inference, labor economics, utilization, project margin, and renewal triggers.

### Recommendation Engine

- Produce PricingRecommendation objects with current state, market context, cost context, options, projected impact, risk, confidence, evidence, assumptions, and test design.
- Cite pricing frameworks used.
- Separate evidence from inference.
- Create price test drafts when an accepted recommendation includes test design.

### Agent Network

- Add PRC tier agents:
  - `MARKOS-AGT-PRC-01` SaaS Pricing Strategist.
  - `MARKOS-AGT-PRC-02` eCommerce Pricing Monitor.
  - `MARKOS-AGT-PRC-03` Services Pricing Strategist.
  - `MARKOS-AGT-PRC-04` Pricing Recommendation Agent.
  - `MARKOS-AGT-PRC-05` Pricing Page Optimizer.
  - `MARKOS-AGT-PRC-06` Competitive Price Watcher.
- Pricing recommendation and price-change agents require approval gates before external changes.
- Competitive monitoring can run without approval because it is read-only.

### Schema

Incoming source proposes tables:

- `markos_pricing_knowledge`
- `markos_cost_models`
- `markos_pricing_recommendations`
- `markos_price_tests`
- `markos_pricing_watch_list`

Implementation must allocate fresh migration and contract IDs; do not reuse occupied F-90 through F-100 ranges.

### API

Required endpoint families:

- `/v1/pricing/intelligence`
- `/v1/pricing/matrix`
- `/v1/pricing/cost-model`
- `/v1/pricing/recommendations`
- `/v1/pricing/tests`
- `/v1/pricing/watch-list`
- `/v1/pricing/watch-list/alerts`

### MCP

Required MCP tools:

- `get_competitive_pricing_matrix`
- `get_pricing_position`
- `get_competitor_pricing`
- `get_pricing_floor`
- `get_recent_pricing_alerts`
- `get_pricing_recommendation`

Any agent writing pricing-sensitive content must query the pricing MCP tools or use `{{MARKOS_PRICING_ENGINE_PENDING}}`.

### UI

Required UI surfaces:

- Pricing Engine Dashboard.
- Competitor Matrix.
- Price Change Diff.
- Cost Model Wizard.
- Recommendations.
- Price Tests.
- Watch List.
- Alerts.

Cost Model Wizard target: under 10 minutes.

## Acceptance Criteria

- Raw incoming file exists at `obsidian/work/incoming/15-PRICING-ENGINE.md`.
- Fixed MarkOS price points in active doctrine are replaced with `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- [[Pricing Engine Canon]] is linked from Home, Work Notes, foundation, plans, and traceability.
- GSD plan includes Pricing Engine as a required workstream.
- Requirements traceability includes source 15 and a pricing-engine requirement family.
- Agent Registry includes PRC tier target agents.
- Contracts, schema, core-lib, UI, and protocol notes mention pricing-engine implementation gaps.
- PageIndex includes the new pricing engine notes.

## Planning Implications

The Pricing Engine should not be bolted onto billing only. It intersects:

- Research engine: source quality, evidence, market signals.
- Intelligence layer: competitor crawling, connector data, financial/revenue inputs.
- Agent orchestration: scheduled monitoring, triggered recommendation runs, approval gates.
- Human interface: alerts, pricing recommendation cards, test decisions.
- Content engine: pricing-aware competitive comparison and sales enablement copy.
- GTM: MarkOS's own pricing must be generated by this engine before final public packaging.

## Recommended GSD Workstream

Add a dedicated Pricing Engine workstream to the v2 strategic realignment phase:

1. Decide placeholder policy and remove fixed MarkOS tier prices from active doctrine.
2. Research implementation feasibility for crawler, extraction, source quality, and pricing history.
3. Design schema/contracts with fresh IDs.
4. Design PRC agent tier and MCP tools.
5. Build cost-model wizard and internal MarkOS pricing dogfood path.
6. Only then create public MarkOS pricing recommendations.

## Related

- [[Pricing Engine Canon]]
- [[SaaS Suite Canon]]
- [[MarkOS v2 SaaS Suite Intake]]
- [[MarkOS v2 GSD Master Work Plan]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Operating Loop Spec]]
- [[Target ICP]]
- [[Brand Stance]]
