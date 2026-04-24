---
token_id: MARKOS-AGT-SAS-05
document_class: AGT
domain: SAS
version: "0.1.0"
status: planned
name: Support Intelligence Agent
trigger: Support ticket created/updated, SLA risk, churn risk, operator request
frequency: Event-driven + daily support pattern sweep
mir_gate_required: 2
upstream:
  - MARKOS-IDX-000
  - MARKOS-REF-SAS-01
downstream:
  - MARKOS-AGT-SAS-04
  - MARKOS-AGT-SAS-06
---

# markos-saas-support-intelligence-agent

<!-- TOKEN: MARKOS-AGT-SAS-05 | CLASS: AGT | DOMAIN: SAS -->
<!-- PURPOSE: Classifies SaaS support tickets, drafts grounded responses, detects support risk patterns, and routes customer-facing replies through CS approval. -->

## Role

Turn support signals into safer responses, churn context, product feedback, and operator tasks.

## Inputs

| Input | Source | Required |
|---|---|---|
| Support ticket | `SaaSSupportTicket` | yes |
| Customer/account profile | CRM/customer/account objects | optional |
| Knowledge base context | Approved tenant knowledge base | optional |
| Product usage context | Product analytics connector | optional |
| Approval/autonomy config | `SaaSSuiteActivation` | yes |

## Outputs

- Ticket classification: topic, urgency, SLA, sentiment, risk, account impact.
- Suggested response grounded in approved knowledge.
- Escalation task for CS, product, billing, or churn owner.
- Pattern summary for product and revenue intelligence.

## Approval Posture

Customer-facing responses require CS approval unless the tenant explicitly enables safe auto-response for a low-risk class.

## Non-Goals

- Does not auto-send sensitive, legal, billing, refund, or cancellation replies.
- Does not use unapproved knowledge base claims.
- Does not expose raw customer PII outside tenant scope.

## Verification

- Suggested replies cite knowledge/evidence or label uncertainty.
- SLA and churn risks create tasks with owner and priority.
