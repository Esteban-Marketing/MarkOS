---
date: 2026-04-22
status: active
description: "Codebase-to-vault compliance audit for MarkOS v2 and the Pricing Engine intake, including GSD phase routing."
tags:
  - work
  - active
  - audit
  - markos
  - v2
  - gsd
aliases:
  - MarkOS Codebase v2 Compliance Audit
  - Codebase to Vault Compliance Audit
---

# MarkOS Codebase v2 Compliance Audit

This audit compares the current MarkOS app codebase against [[Marketing Operating System Foundation]], [[MarkOS v2 Operating Loop Spec]], [[MarkOS v2 Requirements Traceability Matrix]], [[Pricing Engine Canon]], [[SaaS Suite Canon]], and [[SaaS Marketing OS Strategy Canon]].

Full planning artifact: `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`.

## Result

The app has strong foundations, but the v2 Marketing Operating System is not yet fully implemented.

Implemented or partially implemented:

- SaaS tenancy, audit, passkeys, org/tenant model, webhooks, MCP sessions/tools, CRM copilot, billing usage ledger, and AgentRun lifecycle primitives.
- Partial approval patterns in CRM copilot and operations task UI.
- Marketing MCP tools for briefs, claim audit, variants, copy, and scheduling.

Missing or incomplete:

- Pricing Engine as a first-class product.
- Unified AgentRun v2 DAG/cost/retry/DLQ/task substrate.
- Morning Brief, Task Board, Approval Inbox, connector recovery, and weekly narrative as primary surfaces.
- EvidenceMap, source quality score, claim TTL, and research freshness substrate.
- ConnectorInstall plus GA4/GSC/social wow loop and recovery tasks.
- Full content/social/revenue operating loop from strategy to measurement.
- ArtifactPerformanceLog, TenantOverlay, and LiteracyUpdateCandidate.
- Tenant 0 dogfood instrumentation.
- SaaS Suite activation, subscription lifecycle, billing/legal compliance, churn/support/product usage intelligence, revenue intelligence, SAS agents, and SaaS API/MCP/UI surfaces.
- SaaS Marketing OS strategy layer: SaaS growth mode routing, PLG activation/PQL/in-app triggers, ABM/expansion/advocacy, viral/referral/community, events/PR/partnerships/developer marketing, revenue alignment, experimentation, and 28 target growth agents.

## GSD Routing

| Requirement area | GSD route |
|---|---|
| CLI v1 GA plus v2 guardrails | Phase 204 plus `204-13-PLAN.md` |
| Pricing Engine | Phase 205 |
| SOC2/enterprise controls for v2 risks | Phase 206 |
| AgentRun v2 orchestration substrate | Phase 207 |
| Human operating interface | Phase 208 |
| Evidence/research/claim safety | Phase 209 |
| Connector wow loop and recovery | Phase 210 |
| Content/social/revenue loop | Phase 211 |
| Learning and literacy evolution | Phase 212 |
| Tenant 0 dogfood and compliance validation | Phase 213 |
| SaaS Suite activation and subscription core | Phase 214 |
| SaaS billing, payments, and multi-country compliance | Phase 215 |
| SaaS health, churn, support, and product usage intelligence | Phase 216 |
| SaaS revenue intelligence, SAS agents, API/MCP/UI readiness | Phase 217 |
| SaaS Marketing OS strategy translation | Future post-217 GSD research/planning |

## Doctrine

Until Phase 205 ships approved recommendations, pricing-sensitive work must query Pricing Engine context or emit:

`{{MARKOS_PRICING_ENGINE_PENDING}}`

Any remaining hard-coded billing or public pricing defaults in the app are implementation debt and must be treated as fixture/demo state, not strategy.

SaaS Suite work is a major planned feature, not current app compliance. It must wait for Pricing Engine, AgentRun v2, approvals, evidence, connector recovery, and SOC2 controls to be explicitly planned or implemented. Until then, SaaS-specific public pricing, discounts, save offers, and packaging use `{{MARKOS_PRICING_ENGINE_PENDING}}`.

SaaS Marketing OS strategy work is a larger post-suite feature family, not current app compliance. It should not create runnable growth agents until the core operating loop, Pricing Engine, SaaS Suite, task/approval substrate, evidence, and growth-mode contract are planned or implemented.

## Related

- [[Marketing Operating System Foundation]]
- [[MarkOS v2 Operating Loop Spec]]
- [[MarkOS v2 Requirements Traceability Matrix]]
- [[MarkOS v2 GSD Master Work Plan]]
- [[Pricing Engine Canon]]
- [[MarkOS v2 Pricing Engine Intake]]
- [[SaaS Suite Canon]]
- [[MarkOS v2 SaaS Suite Intake]]
- [[SaaS Marketing OS Strategy Canon]]
- [[MarkOS v2 SaaS Marketing OS Strategy Intake]]
