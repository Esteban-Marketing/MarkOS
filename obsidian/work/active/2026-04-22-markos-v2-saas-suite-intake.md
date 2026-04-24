---
date: 2026-04-22
status: active
description: "Distilled requirements from incoming 16-SAAS-SUITE.md for MarkOS SaaS Suite planning across Obsidian, PageIndex, and GSD."
tags:
  - work
  - active
  - intake
  - markos
  - saas
  - gsd
aliases:
  - MarkOS v2 SaaS Suite Intake
  - SaaS Suite Intake
---

# MarkOS v2 SaaS Suite Intake

## Source

Raw incoming document: `obsidian/work/incoming/16-SAAS-SUITE.md`

This intake turns the SaaS Suite blueprint into vault and GSD requirements. The canonical doctrine lives in [[SaaS Suite Canon]].

## Executive Summary

The new document introduces a major tenant-type feature: when `business_type = saas`, MarkOS should activate a SaaS-specific operating suite across subscriptions, billing, country compliance, churn intelligence, support intelligence, product usage, and revenue intelligence.

This is a post-foundation expansion. It depends on the core MarkOS operating loop, Pricing Engine, AgentRun, approvals, evidence, connectors, and SOC2 controls. It should not displace Phase 204-213; it should become the next planned GSD arc through Phases 214-217.

## Requirement Groups

| Group | Requirement |
|---|---|
| Activation | `SaaSSuiteActivation` records business type, enabled modules, processors, accounting, legal billing, countries, autonomy posture, and health-score configuration |
| Subscription Core | Plans, subscriptions, trials, upgrades, downgrades, pauses, cancellations, reactivations, status history, and cancellation reasons |
| Billing Engine | Invoices, payment attempts, failed-payment recovery, refunds/credits, dunning, processor routing, accounting sync |
| Compliance | US invoice/sales-tax/QuickBooks path and Colombia DIAN/UBL/XAdES-B/CUFE/IVA/retentions/Siigo/Alegra path |
| Churn Intelligence | Health score with product usage, support, billing, engagement, and relationship dimensions plus intervention playbooks |
| Support Intelligence | Ticket ingestion, classification, SLA, sentiment, KB-grounded draft responses, CS approval |
| Product Usage | Product analytics ingestion, activation/adoption signals, product-led growth events, account health contributions |
| Revenue Intelligence | MRR, ARR, NRR, GRR, churn, expansion, contraction, cohort, forecast, and waterfall views |
| Agents | SAS-01 through SAS-06 target tier for subscription, revenue, billing compliance, churn, support, and expansion |
| API/MCP/UI | `/v1/saas/*`, `markos-saas` MCP tools, SaaS-specific navigation and integration setup |

## Planning Decisions

| Decision | Status | Rule |
|---|---|---|
| Placement | Selected | Route SaaS Suite into Phases 214-217 after v4.0 foundation phases, with dependencies on 205/207/208/209/210/211 |
| Pricing ownership | Selected | SaaS plan/package/pricing/discount/save-offer decisions are Pricing Engine-owned |
| Colombia compliance posture | Selected as default | Prefer Siigo/Alegra for DIAN issuance first; direct DIAN integration is future research |
| Webhook posture | Selected | Stripe, Mercado Pago, and DIAN inbound events must use existing webhook engine guarantees and fresh contract IDs |
| Support autonomy | Selected | Customer-facing responses require CS review unless tenant explicitly configures safe auto-response |

## GSD Phase Routing

| Phase | Name | Main output |
|---|---|---|
| 214 | SaaS Suite Activation and Subscription Core | Activation wizard, SaaS profile, plan/subscription lifecycle, RLS schema, lifecycle tasks |
| 215 | SaaS Billing, Payments, and Multi-Country Compliance | Stripe/US billing, Mercado Pago/Colombia billing, QuickBooks/Siigo/Alegra, DIAN wizard, invoice compliance |
| 216 | SaaS Health, Churn, Support, and Product Usage Intelligence | Health score, churn alerts, support triage, product analytics ingestion, intervention tasks |
| 217 | SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness | MRR/ARR/NRR/GRR dashboards, SAS agents, `/v1/saas/*`, `markos-saas`, suite navigation |

## Research Questions

- What existing billing tables can be reused versus replaced by SaaS-specific tables?
- How should Stripe Billing objects map to MarkOS SaaS plans/subscriptions without losing Pricing Engine ownership?
- What is the safest MVP path for DIAN compliance in Colombia: direct DIAN, Siigo, Alegra, or provider abstraction?
- How should product usage connectors such as PostHog feed health scoring without turning MarkOS into a passive dashboard?
- Which support systems should be first-class connectors for the support module?
- What fresh contract ID range should be reserved for SaaS Suite APIs and webhooks?
- What RLS, audit, SOC2, deletion/export, and data-retention controls are required before legal billing launches?

## Acceptance Criteria

- Incoming document 16 is listed in the incoming index and traceability matrix.
- [[SaaS Suite Canon]] is the vault-level doctrine owner.
- [[Marketing Operating System Foundation]], [[MarkOS v2 Operating Loop Spec]], [[Pricing Engine Canon]], [[Agent Registry]], [[Database Schema]], and [[Contracts Registry]] all mention the SaaS Suite where their doctrine is affected.
- `.planning/REQUIREMENTS.md` includes SAS requirements and maps them to phases.
- `.planning/ROADMAP.md` and `.planning/v4.0.0-ROADMAP.md` reserve Phases 214-217.
- Phase discussion artifacts exist for 214-217.
- PageIndex is regenerated after ingestion.

## Related

- [[SaaS Suite Canon]]
- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[MarkOS v2 Operating Loop Spec]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 GSD Master Work Plan]]
