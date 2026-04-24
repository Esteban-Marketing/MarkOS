---
date: 2026-04-22
status: canonical
description: "Canonical MarkOS SaaS Suite doctrine: conditional SaaS tenant suite, subscription lifecycle, billing and compliance, churn/support/product usage intelligence, revenue intelligence, SAS agents, API/MCP/UI surfaces, and GSD routing."
tags:
  - brain
  - canon
  - markos
  - saas
  - suite
  - v2
aliases:
  - SaaS Suite Canon
  - MarkOS SaaS Suite
---

# SaaS Suite Canon

> The SaaS Suite is the tenant-type expansion layer for MarkOS customers whose `business_type = saas`. It turns the core Marketing Operating System into a subscription, billing, churn, product usage, support, and revenue intelligence operating system for SaaS companies.

## Source

Canonical intake source:

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/work/incoming/17-SAAS-MARKETING-OS-STRATEGY.md`
- [[MarkOS v2 SaaS Suite Intake]]
- [[SaaS Marketing OS Strategy Canon]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 Operating Loop Spec]]

## Product Role

The SaaS Suite is not a replacement for the core operating loop. It activates after the foundation can already handle AgentRun, tasks, approvals, evidence, connectors, Pricing Engine context, and learning.

The suite adds SaaS-specific operating objects:

- Subscription lifecycle.
- Plan and value-metric management.
- Payment processor and accounting integration.
- Multi-country legal billing.
- Churn risk and health scoring.
- Support intelligence.
- Product usage and product-led growth signals.
- MRR/ARR/NRR/GRR revenue intelligence.

[[SaaS Marketing OS Strategy Canon]] sits on top of this suite. The suite supplies operational facts; the strategy canon turns those facts into PLG, ABM, expansion, viral/referral, in-app, community, event, PR, experiment, partnership, developer-marketing, and revenue-alignment motions.

## Activation Contract

The suite is available only when:

1. Tenant profile has `business_type = saas`.
2. Operator enables the SaaS Suite through an activation wizard.
3. Required country, processor, accounting, and tax/legal-billing configuration is complete for any external billing action.
4. Pricing Engine has either approved relevant recommendations or the UI clearly labels unresolved pricing with `{{MARKOS_PRICING_ENGINE_PENDING}}`.

Activation must record:

- SaaS profile: B2B/B2C, sales motion, value metric, countries, currencies, billing cadence, trial/freemium posture.
- Enabled processors: Stripe for US-first, Mercado Pago for Colombia/LATAM where applicable.
- Accounting systems: QuickBooks for US, Siigo or Alegra for Colombia.
- Legal billing posture: US invoices/sales tax, Colombia DIAN electronic invoicing.
- Enabled modules.
- Approval/autonomy posture for billing, support, discounts, dunning, and save offers.

## Modules

| Module | Responsibility | Approval posture |
|---|---|---|
| Subscription Management | trials, active subscriptions, upgrades, downgrades, pause, cancellation, reactivation, plan history | Mutating lifecycle actions require approval unless tenant config allows low-risk self-serve |
| Billing Engine | invoices, payment attempts, dunning, processor routing, accounting sync | External billing changes, invoice corrections, refunds, discounts, and write-offs require approval |
| Compliance and Legal Billing | US tax/accounting and Colombia DIAN e-invoicing | Legal billing config and rejected invoice recovery are high-priority controlled workflows |
| Churn Intelligence | health score, risk alerts, intervention playbooks, save offers | Save offers and customer-facing interventions require approval |
| Customer Support | ticket ingestion, AI classification, KB lookup, suggested responses | Customer-facing responses require CS review unless tenant explicitly opts into safe auto-response |
| Product Usage and Health | product analytics ingestion, key actions, activation, adoption, PLG signals | Read-only analysis by default |
| Revenue Intelligence | MRR, ARR, NRR, GRR, churn, expansion, cohorts, forecast, waterfall | Read-only analysis; forecast-driven actions require approval |

## Core Objects

| Object | Purpose |
|---|---|
| `SaaSSuiteActivation` | Tenant-level module, country, processor, accounting, tax, autonomy, and health-score configuration |
| `SaaSPlan` | Plan catalog, pricing model, value metric, features, billing cadence, currency, country availability |
| `SaaSSubscription` | Customer subscription lifecycle state, plan, quantity, trial, renewal, cancellation, processor IDs |
| `SaaSInvoice` | Legal/commercial invoice, processor status, tax, accounting sync, DIAN fields where relevant |
| `SaaSHealthScore` | 0-100 health score with usage, support, billing, engagement, and relationship dimensions |
| `SaaSSupportTicket` | Ticket metadata, classification, SLA, sentiment, customer risk, suggested response |
| `SaaSMRRSnapshot` | MRR movement, ARR, NRR, GRR, churn, expansion, contraction, cohort facts |
| `SaaSProcessorConfig` | Stripe, Mercado Pago, webhook secret, routing, and capability posture |
| `SaaSAccountingConfig` | QuickBooks, Siigo, Alegra, chart mapping, sync status |
| `SaaSDianConfig` | Colombia DIAN certificate, test/production mode, numbering, CUFE/QR, transmission state |

All tenant-scoped SaaS Suite tables require RLS, audit events, deletion/export coverage, and no raw credential exposure.

## Billing and Compliance

### United States Launch

US launch must support:

- Stripe Billing and signed Stripe webhooks.
- Stripe Tax or equivalent tax calculation path where needed.
- Invoice records with payment status, taxes, credits, discounts, and processor IDs.
- QuickBooks sync for accounting.
- Dunning and failed-payment recovery.

### Colombia Launch

Colombia launch must support:

- Mercado Pago payment routing where applicable.
- DIAN Facturacion Electronica through Siigo/Alegra first unless a future phase proves direct DIAN integration is worth the complexity.
- UBL XML, XAdES-B signing, CUFE, QR, DIAN transmission state, IVA, retefuente, reteIVA, and reteICA.
- A DIAN setup wizard with certificate, numbering, environment, tax profile, and test invoice validation.

DIAN rejected invoices must create P1 tasks and block dependent accounting completion until resolved.

## Pricing Engine Relationship

The SaaS Suite depends on [[Pricing Engine Canon]].

- SaaS plans, subscriptions, invoices, MRR, churn, usage, support, and expansion data feed the Pricing Engine cost and strategy model.
- SaaS plan prices, packaging, value metrics, annual discounts, save offers, upgrade prompts, and pricing-page changes are Pricing Engine-owned decisions.
- Until a plan or package has an approved PricingRecommendation, public copy and planning docs use `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- `MARKOS-AGT-PRC-01` and `MARKOS-AGT-PRC-04` should consult SaaS Suite health, MRR, churn, and product usage signals before recommendations.
- Save offers and discount strategies require approval because they affect revenue, positioning, and customer expectations.

## SaaS Marketing OS Strategy Relationship

Document 17 extends the SaaS Suite from operational runtime into growth runtime.

Future SaaS Suite planning should preserve these relationships:

| SaaS Suite signal | Growth use in [[SaaS Marketing OS Strategy Canon]] |
|---|---|
| Product usage and key events | Activation milestones, PQL score, upgrade triggers, habit formation, product virality |
| Health score and churn risk | Save playbooks, lifecycle messaging, customer marketing, community health, CS intervention |
| Support tickets and CSAT/NPS | Advocacy candidates, review generation, G2/Capterra requests, feature-confusion content gaps |
| Billing friction and failed payments | Dunning, save offers, lifecycle education, churn prevention |
| MRR/ARR/NRR/GRR and cohorts | Account expansion, revenue alignment, experiments, forecast, GTM narrative |
| Subscription lifecycle | Onboarding, activation, expansion, renewal, win-back, reactivation |

The SaaS Suite should not independently create pricing strategy, discount ladders, or affiliate/referral economics. Those remain Pricing Engine-owned.

## SaaS Health Score

Default health score dimensions:

| Dimension | Default weight |
|---|---|
| Product usage | 30% |
| Support signal | 20% |
| Billing signal | 20% |
| Marketing/customer engagement | 15% |
| Relationship depth | 15% |

Health scores must expose:

- Raw contributing facts.
- Confidence level.
- Trend.
- Suggested intervention.
- Owner.
- Next task or no-action reason.

## SAS Agent Tier

The SaaS Suite introduces the target SAS agent tier:

| Token | Agent | Role | Approval posture |
|---|---|---|---|
| `MARKOS-AGT-SAS-01` | Subscription Lifecycle Manager | lifecycle changes, renewal state, cancellation/reactivation workflows | Approval required for external mutations |
| `MARKOS-AGT-SAS-02` | Revenue Intelligence Analyst | MRR, ARR, NRR, GRR, churn, expansion, forecast, waterfall | Read-only by default |
| `MARKOS-AGT-SAS-03` | Billing Compliance Agent | invoice compliance, DIAN/US billing checks, accounting sync issues | High-priority tasking, approval for corrections |
| `MARKOS-AGT-SAS-04` | Churn Risk Assessor | health score, churn risk, save/playbook recommendations | Approval for interventions/save offers |
| `MARKOS-AGT-SAS-05` | Support Intelligence Agent | ticket triage, suggested responses, KB grounding, support pattern mining | CS review before customer-facing response |
| `MARKOS-AGT-SAS-06` | Expansion Revenue Scout | upgrade, add-seat, expansion, and cross-sell opportunities | Approval before outreach or pricing action |

Planned SAS agent definition files live under `.agent/markos/agents/markos-saas-*.md`. They are registry/documentation artifacts, not runnable implementation truth, until the relevant GSD phases ship.

## API, MCP, and UI Surface

Target API family:

- `/v1/saas/subscriptions`
- `/v1/saas/plans`
- `/v1/saas/invoices`
- `/v1/saas/billing`
- `/v1/saas/revenue`
- `/v1/saas/churn`
- `/v1/saas/support`
- `/v1/saas/compliance`

Inbound webhooks must be routed through the existing webhook engine patterns and fresh contract IDs, not bolted on as ungoverned handlers.

Target MCP server: `markos-saas`.

Target MCP tools:

- `get_subscription_health`
- `get_at_risk_accounts`
- `get_mrr_summary`
- `get_plan_performance`
- `get_expansion_opportunities`
- `get_support_patterns`
- `get_invoice_compliance_status`

Target UI navigation when SaaS Suite is active:

- SaaS Overview.
- Subscriptions.
- Plans.
- Revenue.
- Churn Intelligence.
- Invoices and Billing.
- Customer Support.
- Product Usage.
- Integrations: Stripe, Mercado Pago, QuickBooks, Siigo/Alegra, DIAN.

## GSD Routing

The SaaS Suite should be routed after the core v2 foundation and Pricing Engine planning:

| Phase | Focus |
|---|---|
| 214 | SaaS Suite Activation and Subscription Core |
| 215 | SaaS Billing, Payments, and Multi-Country Compliance |
| 216 | SaaS Health, Churn, Support, and Product Usage Intelligence |
| 217 | SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness |

Dependencies:

- Phase 205 Pricing Engine Foundation.
- Phase 207 AgentRun v2.
- Phase 208 Human Operating Interface.
- Phase 209 Evidence/Research.
- Phase 210 Connector substrate.
- Phase 211 Content/social/revenue loop.
- Phase 206 SOC2 controls for billing, support, privacy, and legal evidence.

## Non-Negotiables

- No SaaS Suite external mutation without approval or explicit low-risk tenant autonomy policy.
- No legal invoice issuance without country-specific compliance validation.
- No raw processor, accounting, or DIAN credentials in logs, tasks, prompts, or MCP payloads.
- No customer-facing support response without CS review unless tenant opts into safe auto-response.
- No save offer, discount, plan change, or packaging change without Pricing Engine context and approval.
- No SaaS data table without RLS, audit, deletion/export coverage, and support-visible failure state.
- No new `/v1/webhooks/*` handler that bypasses the webhook subscription engine's signing, replay, DLQ, rate limit, and observability posture.

## Related

- [[Marketing Operating System Foundation]]
- [[MarkOS v2 SaaS Suite Intake]]
- [[MarkOS v2 Operating Loop Spec]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[Pricing Engine Canon]]
- [[SaaS Marketing OS Strategy Canon]]
- [[Agent Registry]]
- [[Database Schema]]
- [[Contracts Registry]]
