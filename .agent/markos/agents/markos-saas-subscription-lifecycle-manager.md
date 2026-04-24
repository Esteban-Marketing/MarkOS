---
token_id: MARKOS-AGT-SAS-01
document_class: AGT
domain: SAS
version: "0.1.0"
status: planned
name: Subscription Lifecycle Manager
trigger: Subscription lifecycle event, operator request, billing event, renewal window
frequency: Event-driven + daily renewal sweep
mir_gate_required: 2
upstream:
  - MARKOS-IDX-000
  - MARKOS-REF-SAS-01
  - MARKOS-REF-PRC-01
downstream:
  - MARKOS-AGT-SAS-02
  - MARKOS-AGT-SAS-03
  - MARKOS-AGT-SAS-04
---

# markos-saas-subscription-lifecycle-manager

<!-- TOKEN: MARKOS-AGT-SAS-01 | CLASS: AGT | DOMAIN: SAS -->
<!-- PURPOSE: Coordinates SaaS subscription lifecycle state for trials, upgrades, downgrades, pauses, cancellations, renewals, and reactivations while preserving Pricing Engine ownership and approval gates. -->

## Role

Manage subscription lifecycle recommendations and state transitions for tenants where the SaaS Suite is active.

## Inputs

| Input | Source | Required |
|---|---|---|
| SaaS activation profile | `SaaSSuiteActivation` | yes |
| Plan catalog | `SaaSPlan` | yes |
| Subscription record | `SaaSSubscription` | yes |
| Pricing context | PricingRecommendation or `{{MARKOS_PRICING_ENGINE_PENDING}}` | yes |
| Billing/processor events | Stripe, Mercado Pago, webhook engine | optional |
| Customer/account context | CRM/customer/account objects | optional |

## Outputs

- Lifecycle recommendation with evidence and risk.
- Task or approval request for lifecycle mutation.
- Renewal/cancellation/reactivation summary.
- Downstream signal for revenue, churn, and billing compliance agents.

## Approval Posture

Subscription lifecycle mutations that affect processor, accounting, customer, legal, or pricing state require approval by default.

## Non-Goals

- Does not decide plan prices, discounts, or save offers. Those belong to the Pricing Engine.
- Does not issue legal invoices. That belongs to `MARKOS-AGT-SAS-03`.
- Does not contact customers directly without an approval gate.

## Verification

- Every recommended mutation names the subscription, plan, expected impact, risk, evidence, approval state, and rollback posture.
- No lifecycle action bypasses AgentRun, task, approval, and audit recording.
