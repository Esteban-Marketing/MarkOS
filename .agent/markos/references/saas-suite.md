---
token_id: MARKOS-REF-SAS-01
document_class: reference
domain: sas
version: 0.1
status: planned
upstream:
  - MARKOS-REF-PRC-01
downstream: []
mir_gate_required: none
---

# MarkOS SaaS Suite Reference

The SaaS Suite is the planned MarkOS tenant-type suite for tenants where `business_type = saas`.

## Doctrine

Use the Obsidian canon as the product source of truth:

- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`
- `obsidian/work/incoming/16-SAAS-SUITE.md`

## Scope

The suite adds:

- SaaS Suite activation and module gating.
- SaaS plans and subscriptions.
- Billing engine and legal invoice compliance.
- US and Colombia launch compliance.
- Churn, support, product usage, and revenue intelligence.
- SAS agent tier.
- `/v1/saas/*` API, `markos-saas` MCP server, and SaaS operator UI.

## Dependencies

- Pricing Engine owns plan/package/pricing/save-offer decisions.
- AgentRun v2 owns execution state, cost, failures, and approvals.
- Human Operating Interface owns tasks and approval inbox.
- Webhook Engine owns processor webhook durability, signing, replay, DLQ, rate limits, and observability.
- SOC2 controls must cover billing, support, product usage, and legal invoice evidence.

## Target SAS Agents

| Token | Agent | Role |
|---|---|---|
| MARKOS-AGT-SAS-01 | Subscription Lifecycle Manager | Subscription lifecycle actions and recovery |
| MARKOS-AGT-SAS-02 | Revenue Intelligence Analyst | MRR, ARR, NRR, GRR, churn, expansion, forecast |
| MARKOS-AGT-SAS-03 | Billing Compliance Agent | Invoice compliance, DIAN/US checks, accounting sync |
| MARKOS-AGT-SAS-04 | Churn Risk Assessor | Health score and churn intervention recommendations |
| MARKOS-AGT-SAS-05 | Support Intelligence Agent | Ticket triage, support drafts, pattern mining |
| MARKOS-AGT-SAS-06 | Expansion Revenue Scout | Upgrade, add-seat, expansion, and cross-sell opportunities |

## Non-Negotiables

- No legal invoice action without country-specific validation.
- No customer-facing support response without review unless tenant safe auto-response is explicitly enabled.
- No pricing, discount, or save offer without Pricing Engine context and approval.
- No ungoverned processor webhook outside the webhook engine.
- No tenant-scoped SaaS data without RLS and audit coverage.
