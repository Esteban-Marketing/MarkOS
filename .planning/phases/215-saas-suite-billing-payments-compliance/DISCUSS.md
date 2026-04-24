# Phase 215 Discuss: SaaS Billing, Payments, and Multi-Country Compliance

## Goal

Implement SaaS billing and legal compliance for the launch countries: United States and Colombia. This phase owns invoices, payment processors, tax/legal billing, dunning, accounting sync, DIAN setup, and compliance tasks.

## Source Doctrine

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md` SAS-04..06

## Phase Artifacts

- `215-CONTEXT.md` - implementation context and launch-country compliance scope.
- `215-RESEARCH.md` - research agenda for Stripe, Mercado Pago, QuickBooks, DIAN, Siigo/Alegra, taxes, webhooks, and approvals.

## Discuss Decisions

| Decision | Options | Recommended default |
|---|---|---|
| US processor | Stripe Billing direct, abstraction-first | Stripe Billing direct behind MarkOS processor config |
| Colombia processor | Mercado Pago, Stripe LATAM, provider abstraction | Mercado Pago support plus provider abstraction |
| DIAN path | Direct DIAN, Siigo, Alegra, provider interface | Siigo/Alegra first; direct DIAN future research |
| Accounting sync | QuickBooks only, QuickBooks+Siigo/Alegra, delayed | QuickBooks for US, Siigo/Alegra for Colombia |
| Webhook path | new `/v1/webhooks/*`, reuse webhook engine | Reuse webhook engine guarantees and allocate fresh contracts |
| Future incentive payouts | ignore, implement now, reserve compliant hooks | Reserve compliant hooks; referral/affiliate/partner payouts belong post-217 |

## Research Needed

- Stripe Billing/Tax objects and webhook event mapping.
- Mercado Pago subscription/payment events and Colombia availability.
- Siigo/Alegra DIAN API capabilities, certificate handling, CUFE/QR support, and sandbox flow.
- Tax fields for US sales tax and Colombia IVA/retentions.
- Failure handling for rejected invoices, failed payments, partial sync, and dunning.
- SOC2 evidence requirements for legal invoice actions.
- Future referral reward, affiliate commission, partner payout, and incentive experiment billing hooks.

## Acceptance Gate

- `SaaSInvoice`, `SaaSProcessorConfig`, `SaaSAccountingConfig`, and `SaaSDianConfig` contracts are designed.
- Processor webhook events route through existing durable webhook patterns.
- DIAN setup wizard and rejected-invoice P1 task behavior are specified.
- Refunds, credits, discounts, write-offs, and invoice corrections require approval.
- No raw credentials appear in logs, prompts, tasks, or MCP payloads.
- Referral, affiliate, partner, and incentive payouts cannot bypass Pricing Engine, approval, audit, and tax/legal posture.
