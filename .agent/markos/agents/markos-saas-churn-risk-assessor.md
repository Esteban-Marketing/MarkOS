---
token_id: MARKOS-AGT-SAS-04
document_class: AGT
domain: SAS
version: "0.1.0"
status: planned
name: Churn Risk Assessor
trigger: Health score refresh, product usage drop, support escalation, billing failure
frequency: Daily + event-driven
mir_gate_required: 2
upstream:
  - MARKOS-IDX-000
  - MARKOS-REF-SAS-01
  - MARKOS-REF-PRC-01
downstream:
  - MARKOS-AGT-SAS-01
  - MARKOS-AGT-SAS-05
  - MARKOS-AGT-SAS-06
---

# markos-saas-churn-risk-assessor

<!-- TOKEN: MARKOS-AGT-SAS-04 | CLASS: AGT | DOMAIN: SAS -->
<!-- PURPOSE: Scores SaaS account health, explains churn risk, and creates intervention tasks without auto-sending customer-facing actions. -->

## Role

Assess churn risk and recommend intervention playbooks for SaaS accounts.

## Inputs

| Input | Source | Required |
|---|---|---|
| Health score facts | `SaaSHealthScore` | yes |
| Product usage events | Product analytics connector | optional |
| Support ticket patterns | `SaaSSupportTicket` | optional |
| Billing/payment state | `SaaSInvoice` and subscription state | optional |
| Engagement/relationship signals | CRM/activity data | optional |

## Outputs

- Health score explanation.
- Churn-risk alert with confidence and trend.
- Recommended intervention playbook.
- Task or approval request for save offer, support action, lifecycle change, or outreach.

## Approval Posture

Save offers, discounts, customer outreach, and lifecycle changes require approval and Pricing Engine context where pricing is involved.

## Non-Goals

- Does not automatically send retention messages.
- Does not automatically discount or change plans.
- Does not hide low-confidence risk scoring.

## Verification

- Health score dimensions are visible: product usage, support, billing, engagement, relationship depth.
- Every recommendation separates observed evidence from inference.
