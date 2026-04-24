---
token_id: MARKOS-REF-PRC-01
document_class: reference
domain: prc
version: 0.1
status: planned
upstream:
  - obsidian/brain/Pricing Engine Canon.md
  - obsidian/work/active/2026-04-22-markos-v2-pricing-engine-intake.md
downstream:
  - token_id: MARKOS-AGT-PRC-01
    relationship: target_agent_not_yet_implemented
  - token_id: MARKOS-AGT-PRC-02
    relationship: target_agent_not_yet_implemented
  - token_id: MARKOS-AGT-PRC-03
    relationship: target_agent_not_yet_implemented
  - token_id: MARKOS-AGT-PRC-04
    relationship: target_agent_not_yet_implemented
  - token_id: MARKOS-AGT-PRC-05
    relationship: target_agent_not_yet_implemented
  - token_id: MARKOS-AGT-PRC-06
    relationship: target_agent_not_yet_implemented
mir_gate_required: gate_2
---

# Pricing Engine Protocol Reference

This reference makes the Pricing Engine discoverable from the MarkOS protocol registry. It does not claim that PRC agents are implemented yet; Phase 205 must create or explicitly defer the runtime agent definitions.

Canonical doctrine lives in:

- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-pricing-engine-intake.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/DISCUSS.md`

## Placeholder Policy

Use `{{MARKOS_PRICING_ENGINE_PENDING}}` anywhere MarkOS would otherwise publish or document unresolved public prices, package boundaries, usage inclusion, BYOK discount treatment, discount strategy, or billing copy.

Hard-coded public MarkOS prices are allowed only in raw historical source documents or test fixtures. Active product, GTM, billing, and agent output must call the Pricing Engine or link to an approved PricingRecommendation record.

## Target PRC Agent Tier

| Token | Target agent | Role | Runtime status |
|---|---|---|---|
| `MARKOS-AGT-PRC-01` | SaaS Pricing Strategist | SaaS value metric, packaging, tier, usage, annual/monthly, trial/freemium analysis | planned |
| `MARKOS-AGT-PRC-02` | eCommerce Pricing Monitor | SKU matching, competitor price monitoring, promos, bundles, margin-aware suggestions | planned |
| `MARKOS-AGT-PRC-03` | Services Pricing Strategist | rates, retainers, value-based pricing, productized services, utilization economics | planned |
| `MARKOS-AGT-PRC-04` | Pricing Recommendation Agent | synthesizes pricing knowledge, cost model, market context, and test design | planned |
| `MARKOS-AGT-PRC-05` | Pricing Page Optimizer | pricing page copy, packaging explanation, proof, A/B test briefs | planned |
| `MARKOS-AGT-PRC-06` | Competitive Price Watcher | watch lists, crawler/extraction orchestration, change alerts, weekly digest | planned |

## Required Data Objects

- Pricing Knowledge Object.
- Tenant Cost Model.
- PricingRecommendation.
- PriceTest.
- PricingWatchList.
- PricingAlert.

Every tenant-scoped object must have RLS, audit lineage, and evidence/source metadata where applicable.

## Approval Rules

Allowed without approval:

- Cost model updates.
- Read-only competitor monitoring.
- Internal alert generation.

Requires approval:

- Price changes.
- Packaging changes.
- Public pricing page changes.
- Discount strategy.
- Price test activation.
- Any billing-provider product/price creation derived from a PricingRecommendation.

## MCP Requirements

Phase 205 should expose or plan these tools:

- `get_competitive_pricing_matrix`
- `get_pricing_position`
- `get_competitor_pricing`
- `get_pricing_floor`
- `get_recent_pricing_alerts`
- `get_pricing_recommendation`

Any pricing-sensitive content, strategy, sales enablement, or competitive comparison agent must use these tools or emit `{{MARKOS_PRICING_ENGINE_PENDING}}`.
