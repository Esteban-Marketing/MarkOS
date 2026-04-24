# MarkOS (MarkOS Protocol)

## Current State: v4.0.0 SaaS Readiness + v2 Operating Loop Compliance

**Last updated:** 2026-04-22

MarkOS is now planning against two synchronized truths:

1. v4.0.0 SaaS Readiness remains the active engineering milestone.
2. The Obsidian vault now defines the target product as an AI-native, evidence-backed, human-approved Marketing Operating System with Pricing Engine-owned pricing.
3. The SaaS Suite is now the next major tenant-type suite for `business_type = saas`, routed after the core v2 foundation.

The static monetization posture is superseded by `obsidian/brain/Pricing Engine Canon.md`. Use `{{MARKOS_PRICING_ENGINE_PENDING}}` for unresolved public prices, package boundaries, usage inclusion, BYOK treatment, and billing copy until approved PricingRecommendation records exist.

### Source-of-truth precedence (on conflict)

| Layer | Wins for | Canonical locations |
|-------|----------|---------------------|
| 1. Vault brain | Product doctrine (WHAT we build) | `obsidian/brain/{Pricing Engine Canon, SaaS Suite Canon, SaaS Marketing OS Strategy Canon, Marketing Operating System Foundation, MarkOS Canon, Brand Stance, Target ICP}.md` |
| 2. Vault reference | Product spec (HOW objects/flows/contracts shape) | `obsidian/reference/{MarkOS v2 Operating Loop Spec, MarkOS v2 Requirements Traceability Matrix, Contracts Registry, Database Schema, Core Lib, HTTP Layer, UI Components}.md` |
| 3. .planning/ | Engineering execution state (WHEN / which phase / F-IDs / migration numbers) | `.planning/{STATE, ROADMAP, REQUIREMENTS}.md`, `.planning/phases/<N>-*/` |
| 4. .agent/markos/ | Marketing protocol TOKEN_ID registry | `.agent/markos/MARKOS-INDEX.md` |
| 5. obsidian/work/incoming/ | Raw intake (NOT canonical until distilled into brain/reference) | Must be distilled before use |
| 6. .markos-local/ | Client overrides (override layer 4 templates for that client) | Gitignored |

**Drift rule:** If `.planning/` appears to contradict vault brain/reference, STOP and flag. Do not silently reconcile. Canon wins for product shape; plan wins for execution sequencing; both must agree before execution.

## Active Planning References

- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `obsidian/brain/Marketing Operating System Foundation.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/work/active/2026-04-22-markos-codebase-v2-compliance-audit.md`
- `obsidian/work/active/2026-04-22-markos-v2-pricing-engine-intake.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`

## What This Is

MarkOS is a governed marketing and revenue operating system. It combines onboarding, research, brand intelligence, connector intelligence, CRM, content/social execution, Pricing Engine intelligence, tenant-type suites, approvals, measurement, and learning so operators and AI agents can manage real company marketing work from one trustworthy loop.

It is not merely a content generator, passive dashboard, CRM add-on, or agency workflow tool. Those can exist as surfaces; the product contract is the operating loop:

`onboard -> connect -> audit -> plan -> brief -> draft -> audit -> approve -> dispatch -> measure -> learn`

## Core Value

Give a growth-stage marketing team one auditable, agentic system for creating pipeline with evidence-backed decisions, human approval, cost visibility, and compounding learning.

## Current Implementation Reality

Validated foundations:

- Tenant, org, RLS, auth, audit, passkey, session, and lifecycle foundations.
- Webhook Subscription Engine GA with durable delivery, replay, DLQ, rotation, rate-limit, circuit breaker, and evidence surfaces.
- MCP server/tools/session foundations.
- CRM/campaign/outbound/reporting foundations.
- Partial AgentRun lifecycle and approval package patterns.
- Billing usage ledger and reconciliation foundations.

Open compliance gaps:

- Pricing Engine is not yet implemented as a first-class schema/API/MCP/UI system.
- AgentRun v2 lacks DAG chains, priority tiers, durable run APIs, full cost actuals, retry/DLQ, and task handoff.
- Morning Brief, unified Task Board, Approval Inbox, Connector Recovery, and Weekly Narrative are not yet canonical surfaces.
- EvidenceMap, source quality score, claim TTL, and research freshness are not centralized.
- ConnectorInstall, GA4/GSC/social wow loop, and dependent-agent recovery are missing.
- The full content/social/revenue loop is not yet one end-to-end product path.
- Artifact performance, tenant overlays, literacy update candidates, and Tenant 0 dogfood need implementation.
- SaaS Suite activation, subscription lifecycle, billing/legal compliance, churn/support/product usage intelligence, revenue intelligence, SAS agents, and SaaS API/MCP/UI surfaces are planned but not implemented.

## Active Requirements

See `.planning/REQUIREMENTS.md` for the current requirement families:

- API, SDK, MCP, webhooks, CLI, billing, compliance, and QA.
- AgentRun/orchestration.
- Human task and approval system.
- Evidence/research/claim safety.
- Connector intelligence.
- Content/social/revenue loop.
- Pricing Engine.
- Learning/literacy evolution.
- Tenant 0.
- SaaS Suite.

## Active Phase Routing

| Phase | Focus |
|---|---|
| 204 | CLI `markos` v1 GA plus v2 guardrails |
| 205 | Pricing Engine Foundation + Billing Readiness |
| 206 | SOC 2 Type I Foundation for the v2 risk profile |
| 207 | AgentRun v2 Orchestration Substrate |
| 208 | Human Operating Interface |
| 209 | Evidence, Research, and Claim Safety |
| 210 | Connector Wow Loop and Recovery |
| 211 | Content, Social, and Revenue Loop |
| 212 | Learning and Literacy Evolution |
| 213 | Tenant 0 Dogfood and Compliance Validation |
| 214 | SaaS Suite Activation and Subscription Core |
| 215 | SaaS Billing, Payments, and Multi-Country Compliance |
| 216 | SaaS Health, Churn, Support, and Product Usage Intelligence |
| 217 | SaaS Revenue Intelligence, SAS Agents, API/MCP/UI Readiness |

## Non-Negotiables

- No external-world mutation without approval or an explicit low-risk auto-approval policy.
- No customer-facing factual claim without evidence or inference labeling.
- No passive dashboard that does not help an operator decide or act.
- No central literacy promotion without admin review.
- No cross-tenant learning with tenant identifiers or PII.
- No pricing or AI usage workflow without budget estimate, cap handling, and usage visibility.
- No fixed MarkOS public price point without Pricing Engine evidence and approval.
- No SaaS Suite legal billing, support reply, save offer, discount, plan change, or processor mutation without the relevant approval/compliance gate.
- No contract ID reuse when current codebase contracts already occupy an incoming ID range.
- No `.markos-local/` protocol writes during product/protocol updates; it remains tenant override space.

## Constraints

- **Architecture:** Extend the current Node.js, Next.js, Supabase, MCP, billing, CRM, and onboarding stack.
- **Governance:** Preserve tenant-safety, approval, provenance, audit, and review guarantees.
- **Scope:** Build one complete operating loop before expanding the full target agent network.
- **Pricing:** Public prices, plan tables, BYOK discounts, and packaging remain engine-owned.
- **SaaS Suite:** Subscription, billing, support, product usage, and revenue features must reuse MarkOS governance instead of creating parallel unapproved automation.
- **Enterprise:** SOC2 planning must include AI, pricing, connectors, evidence, learning, and Tenant 0 proof.

## Evolution

This document evolves at phase transitions and milestone boundaries.

After each phase transition:

1. Requirements invalidated? Move to Out of Scope with reason.
2. Requirements validated? Move to Validated with phase reference.
3. New requirements emerged? Add to Active.
4. Decisions to log? Add to Key Decisions or active phase discussion.
5. "What This Is" still accurate? Update if drifted.

After each milestone:

1. Review all sections.
2. Check Core Value.
3. Audit Out of Scope.
4. Update Current Implementation Reality.

---

## Metadata

Last updated: 2026-04-22 after MarkOS v2 vault/codebase compliance audit, Pricing Engine intake, SaaS Suite intake, and GSD phase routing for Phases 204-217.
