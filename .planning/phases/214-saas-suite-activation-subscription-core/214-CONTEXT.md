# Phase 214 Context - SaaS Suite Activation and Subscription Core

**Status:** Seeded from the 2026-04-22 SaaS Suite intake.

## Why this phase exists

Incoming `16-SAAS-SUITE.md` introduces the first tenant-type suite for MarkOS. Phase 214 is the activation and subscription foundation for tenants where `business_type = saas`.

This phase should create the core operating substrate before billing, compliance, churn, support, usage, revenue dashboards, or SAS agents depend on it.

## Canonical inputs

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-marketing-os-strategy-intake.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md` SAS-01..04

## Existing implementation substrate to inspect

- Tenant/org/profile tables and onboarding business-type capture.
- Billing subscriptions, entitlement snapshots, pricing snapshots, and usage ledger.
- CRM customers/accounts/companies/deals/tasks.
- AgentRun lifecycle and approval decision patterns.
- Webhook engine state and processor event handling patterns.

## Required phase shape

1. Decide activation gate and operator wizard requirements.
2. Allocate fresh contract and migration IDs.
3. Define `SaaSSuiteActivation`, `SaaSPlan`, and `SaaSSubscription`.
4. Map SaaS customer/subscription identity to existing CRM/billing objects.
5. Define lifecycle event state machine.
6. Define task/approval behavior for lifecycle mutations.
7. Preserve Pricing Engine ownership for plan prices, packages, discounts, and save offers.
8. Reserve an extension point for future SaaS growth-mode routing without implementing the doc 17 growth modules in this phase.

## Non-negotiables

- No SaaS Suite surface appears for non-SaaS tenants.
- No plan price or package becomes canonical without Pricing Engine context.
- No subscription mutation bypasses AgentRun, task, approval, audit, and rollback posture.
- No parallel customer identity model if CRM/customer/account objects can be reused safely.
- No PLG, ABM, viral/referral, community, event, PR, partnership, developer-marketing, or revenue-alignment module is activated without a future GSD translation.

## Done means

GSD can plan implementation with clear activation, schema, lifecycle, RLS, approval, and Pricing Engine dependency boundaries before billing and compliance work begins.
