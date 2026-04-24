---
date: 2026-04-22
status: canonical
description: "Canonical MarkOS Pricing Engine doctrine: competitive pricing intelligence, tenant cost modeling, strategy recommendations, price tests, PRC agents, API/MCP/UI surfaces, and pricing placeholder policy."
tags:
  - brain
  - canon
  - pricing
  - markos
  - v2
aliases:
  - Pricing Engine Canon
  - MarkOS Pricing Engine
---

# Pricing Engine Canon

> Pricing is now an intelligence loop in MarkOS, not a static packaging page. No fixed MarkOS price point should be treated as canonical until the Pricing Engine has modeled costs, competitive position, buyer psychology, and operator-approved tests.

## Canonical Placeholder

Use this placeholder anywhere the old docs previously asserted a fixed MarkOS tier price:

`{{MARKOS_PRICING_ENGINE_PENDING}}`

Meaning:

- Pricing is intentionally unresolved until the Pricing Engine produces a recommendation.
- Static tier values from earlier docs are historical assumptions, not strategy.
- Any future MarkOS pricing page, plan table, billing copy, or GTM deck must either call the Pricing Engine or link to an approved PricingRecommendation record.
- Hard-coded prices are allowed only as examples inside raw incoming source documents or test fixtures.

## Product Role

The Pricing Engine is a continuous intelligence and recommendation system that:

1. Monitors competitor pricing pages, packaging, feature gates, discounts, and value metrics.
2. Builds a tenant-specific cost model so every recommendation is margin-aware.
3. Synthesizes market position, value metrics, buyer psychology, and business model context.
4. Alerts operators to competitor changes, market shifts, margin pressure, and pricing anomalies.
5. Designs price tests with projected impact, risk, reversibility, and approval gates.

It is exposed through:

- MarkOS UI for operators.
- MarkOS API for programmatic pricing intelligence.
- MarkOS MCP tools so agents can query live pricing context during strategy, content, sales enablement, and competitive analysis.

## Four Data Layers

| Layer | Source | Freshness | Role |
|---|---|---|---|
| Own pricing and cost data | tenant cost model, current pricing, historical price changes, conversion/churn by price point | real time for model, daily for performance | most authoritative |
| Competitor pricing intelligence | pricing page crawler, web search, structured extraction | daily for tier-1, weekly for tier-2+ | market position |
| Market pricing signals | G2, Capterra, pricing databases, community discussions, job listings | weekly | buyer sensitivity and category ranges |
| Strategic pricing intelligence | research engine, pricing literature, analyst reports, case studies | monthly and on strategy change | advisory framework context |

## Pricing Knowledge Object

Every pricing insight is a structured, versioned record. Raw web scrape output is never the product surface.

Core fields:

- Tenant and subject: own, competitor, market, or strategic.
- Business type: SaaS, eCommerce, or Services.
- Pricing model, tiers, value metric, free/freemium structure, discounts, feature matrix.
- Source URL, source quality score, extraction method, confidence, extraction timestamp.
- Change detection fields: previous record, changed fields, magnitude, and history.

The Pricing Knowledge Object should use the research Source Quality Score doctrine from [[MarkOS v2 Operating Loop Spec]].

## Cost Model

The Pricing Engine refuses strategic pricing recommendations without cost context.

Required cost-model families:

| Business type | Cost model focus |
|---|---|
| SaaS | infrastructure, LLM/API costs, support, payment processing, gross margin, break-even ARPU |
| eCommerce | COGS, fulfillment, returns, payment/platform fees, storage, AOV, inventory pressure |
| Services | fully loaded labor, subcontractors, tools, project duration, utilization, overhead multiplier |

The engine computes a pricing floor: the minimum viable price needed to avoid destroying margin under the target gross margin. Pricing below the floor must be an explicit strategy, not an accident.

## Business-Type Modules

### SaaS

Understands flat-rate, tiered, per-seat, usage-based, per-active-user, hybrid, freemium, trial-only, and credit-based models.

SaaS-specific intelligence includes:

- Value metric fit.
- Annual versus monthly discount.
- Tier structure.
- Feature gating.
- Churn and conversion by price point.
- Pricing page conversion.

When [[SaaS Suite Canon]] is active, SaaS pricing recommendations must also consider:

- SaaS plan catalog and subscription lifecycle data.
- MRR, ARR, NRR, GRR, churn, expansion, contraction, and cohort movement.
- Product usage, activation, adoption, and health score signals.
- Support load, billing friction, failed payments, and retention risk.
- Approved save-offer and discount history.

The SaaS Suite supplies operational subscription and revenue facts; the Pricing Engine owns strategic plan, package, discount, value-metric, and price-test decisions.

When [[SaaS Marketing OS Strategy Canon]] is active, SaaS pricing recommendations must also consider:

- PLG upgrade triggers, feature gates, usage-limit prompts, and annual-plan conversion offers.
- Referral incentives, affiliate commissions, partner payouts, and reward economics.
- Customer expansion campaigns, save offers, discount history, and advocacy or review incentives.
- Pricing-page, in-app, G2/Capterra, ABM, event, and sales enablement copy that mentions pricing.
- Experiment guardrails for pricing pages, trials, upgrade prompts, discounts, and packaging.

### eCommerce

Understands cost-plus, competitive parity, premium, dynamic, bundle, promo, psychological, and subscription pricing.

eCommerce-specific intelligence includes:

- SKU matching.
- Competitor product monitoring.
- COGS and inventory-aware recommendations.
- Promo calendar and bundle strategy.
- Margin protection under discounting.

### Services

Understands hourly, project-based, retainer, value-based, productized service, performance-based, and hybrid pricing.

Services-specific intelligence includes:

- Market rate benchmarking.
- Utilization and delivery margin.
- Contract renewal triggers.
- Productization opportunities.
- Value-based pricing evidence.

## Pricing Recommendation Contract

Each recommendation must include:

- Recommendation type: price change, packaging change, strategy shift, test design, or monitoring alert.
- Current state.
- Market context.
- Cost/margin context.
- Recommended options.
- Projected impact.
- Risk level.
- Confidence.
- Evidence and assumptions.
- Price test design when appropriate.
- Human decision state: accepted, rejected, deferred, or modified.

Price test activation always requires approval.

## PRC Agent Tier

The Pricing Engine introduces a new agent tier:

| Token | Agent | Role | Approval posture |
|---|---|---|---|
| `MARKOS-AGT-PRC-01` | SaaS Pricing Strategist | tier structure, value metrics, annual/monthly optimization, freemium/trial evaluation | approval required |
| `MARKOS-AGT-PRC-02` | eCommerce Pricing Monitor | SKU-level competitive pricing, bundles, promos, margin-aware price suggestions | approval for price changes; bounded auto-approve only later |
| `MARKOS-AGT-PRC-03` | Services Pricing Strategist | rate benchmarks, value-based pricing, service packaging | approval required |
| `MARKOS-AGT-PRC-04` | Pricing Recommendation Agent | synthesis across data layers into PricingRecommendation objects | approval always |
| `MARKOS-AGT-PRC-05` | Pricing Page Optimizer | pricing page copy, layout, proof, A/B test briefs | approval required |
| `MARKOS-AGT-PRC-06` | Competitive Price Watcher | crawler orchestration, change detection, alerts, weekly digest | monitoring only |

## API Surface

The v2 pricing API family should cover:

- Pricing intelligence list/detail/history.
- Competitive pricing matrix.
- Competitor refresh job and polling.
- Cost model read/update and pricing floor.
- Pricing recommendation list/detail/decision/generate.
- Price tests list/detail/create/start/stop/decision/results.
- Watch list CRUD and pricing alert acknowledgement.

All tenant data must be RLS-isolated.

## MCP Surface

Pricing MCP tools should include:

- `get_competitive_pricing_matrix`
- `get_pricing_position`
- `get_competitor_pricing`
- `get_pricing_floor`
- `get_recent_pricing_alerts`
- `get_pricing_recommendation`

Agents must use these tools whenever writing pricing-sensitive content, sales enablement, competitive comparison pages, strategy docs, outreach, or pricing page recommendations.

## UI Surface

Pricing Engine navigation should include:

- Dashboard.
- Competitor Matrix.
- Cost Model.
- Recommendations.
- Price Tests.
- Watch List.
- Alerts.

Required decision surfaces:

- Pricing health overview.
- Competitive pricing matrix with evidence.
- Price change diff view.
- Cost model setup wizard under 10 minutes.
- Recommendation cards with options, projected impact, risk, reversibility, supporting data, frameworks, assumptions, and approval decisions.

## Approval and Safety Rules

- Cost model updates are internal and do not require approval.
- Monitoring alerts do not require approval.
- Price changes, price test activation, public pricing page changes, discount strategies, and packaging changes require approval.
- Any agent-generated content mentioning pricing must pull live pricing context or use `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Scraped competitor data must be source-linked, timestamped, and quality-scored.
- Price recommendations must separate evidence from inference.

## Related

- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Operating Loop Spec]]
- [[MarkOS v2 Pricing Engine Intake]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[SaaS Suite Canon]]
- [[SaaS Marketing OS Strategy Canon]]
- [[Target ICP]]
- [[Brand Stance]]
- [[Pricing & Packaging]]
