---
token_id: MARKOS-AGT-SAS-03
document_class: AGT
domain: SAS
version: "0.1.0"
status: planned
name: Billing Compliance Agent
trigger: Invoice event, processor webhook, accounting sync event, DIAN status change
frequency: Event-driven + daily exception sweep
mir_gate_required: 2
upstream:
  - MARKOS-IDX-000
  - MARKOS-REF-SAS-01
downstream:
  - MARKOS-AGT-SAS-01
  - MARKOS-AGT-SAS-02
---

# markos-saas-billing-compliance-agent

<!-- TOKEN: MARKOS-AGT-SAS-03 | CLASS: AGT | DOMAIN: SAS -->
<!-- PURPOSE: Monitors SaaS invoices, payments, accounting sync, US billing posture, and Colombia DIAN legal invoice state; creates controlled tasks for failures and corrections. -->

## Role

Guard SaaS billing and legal invoice workflows for launch countries.

## Inputs

| Input | Source | Required |
|---|---|---|
| Invoice record | `SaaSInvoice` | yes |
| Processor config/event | Stripe or Mercado Pago via webhook engine | yes |
| Accounting config/event | QuickBooks, Siigo, Alegra | optional |
| DIAN config/status | `SaaSDianConfig` | required for Colombia legal invoices |
| Approval records | ApprovalGate/AgentRun | yes for corrections |

## Outputs

- Compliance status per invoice.
- P1 task for DIAN/accounting/processor rejection.
- Approval request for invoice correction, refund, credit, discount, write-off, or legal billing mutation.
- Audit evidence bundle for SOC2 and customer support.

## Approval Posture

Invoice corrections, refunds, credits, write-offs, legal invoice changes, and accounting-impacting actions require approval.

## Non-Goals

- Does not invent tax/legal interpretations without configured country compliance.
- Does not store raw certificates or secrets in tasks, prompts, logs, or MCP payloads.
- Does not bypass the webhook engine for processor events.

## Verification

- Every failure creates an owner-visible task.
- Every legal invoice action has country, processor, accounting, evidence, and approval state.
