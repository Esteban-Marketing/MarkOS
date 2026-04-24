# Phase 215 Research - SaaS Billing, Payments, and Multi-Country Compliance

## Primary research question

How should MarkOS support SaaS billing for US and Colombia launch tenants while preserving Pricing Engine ownership, webhook engine guarantees, legal invoice compliance, and SOC2 evidence?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| US billing | Which Stripe Billing and Stripe Tax objects/events are needed? | Stripe object/event map |
| US accounting | What QuickBooks objects and sync states are required? | Accounting sync model |
| Colombia payments | Which Mercado Pago subscription/payment capabilities are safe for the MVP? | Processor capability map |
| Colombia legal billing | Should MVP use Siigo, Alegra, direct DIAN, or an abstraction? | DIAN provider decision |
| Taxes | Which IVA, retefuente, reteIVA, reteICA, and sales-tax fields are needed? | Tax field model |
| Webhooks | How do processor events map into the existing webhook engine? | Event routing design |
| Approvals | Which invoice/payment/accounting actions need approval? | Billing approval matrix |
| Future payouts | What billing/accounting hooks are needed later for referral rewards, affiliate commissions, partner payouts, and incentive experiments? | Post-217 payout compatibility note |
| Evidence | What SOC2 evidence must be retained for invoice issuance/correction? | Evidence checklist |

## Sources to inspect

- Official Stripe Billing, Stripe Tax, and webhook docs.
- Official QuickBooks API docs.
- Official Mercado Pago subscription/payment docs.
- Siigo and Alegra API docs for DIAN electronic invoicing.
- Existing MarkOS webhook engine code and contracts.
- Existing billing migrations and libs.
- SaaS Marketing OS Strategy Canon for future referral, affiliate, partnership, and incentive surfaces.

## Required research output

- Sources inspected.
- Current-code support.
- Gap.
- Recommended MVP.
- Legal/compliance risks.
- Contract/schema implications.
- Acceptance tests implied.

## Codebase Research Addendum - 2026-04-23

### Current-code support

- Billing usage contracts, provider sync outcome, invoice reconciliation, and hold/recovery evidence already exist.
- Webhook engine can be reused for processor and accounting event ingress.
- Governance evidence packs can capture billing and approval evidence.
- Billing settings UI already displays hold, recovery criteria, impacted workflows, and translated billing labels.

### Gaps

- No Stripe Billing/Tax integration exists as a live processor.
- No Mercado Pago, QuickBooks, Siigo, Alegra, or DIAN abstraction exists.
- No processor event inbox maps external processor events to MarkOS subscription/billing states.
- No legal invoice/correction/credit-note model exists.
- No future referral/affiliate/partner payout hook exists.

### Recommendation

Use a processor-agnostic billing event inbox that routes through the existing webhook guarantees. Stripe/US can be first if official docs confirm event/object choices during execution. Colombia support should be designed behind a provider abstraction so Mercado Pago payment state and DIAN-compliant invoice providers do not fork the core billing model.

### Tests implied

- Processor webhook signature and idempotency tests.
- Invoice reconciliation tests with failed/restored sync attempts.
- Tax/legal invoice field validation tests.
- Approval tests for invoice correction, refund, discount, payout, or provider mutation.
- Evidence export tests for invoice issuance and correction.
