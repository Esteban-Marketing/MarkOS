# Phase 214 Discuss: SaaS Suite Activation and Subscription Core

## Goal

Create the foundation for the SaaS Suite as a conditional tenant-type module for `business_type = saas`: activation, SaaS profile, plan catalog, subscription lifecycle, tenant-safe schema, and operator tasks.

## Source Doctrine

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `.planning/REQUIREMENTS.md` SAS-01..03

## Phase Artifacts

- `214-CONTEXT.md` - implementation context and substrate to inspect.
- `214-RESEARCH.md` - research agenda for activation, schema, lifecycle, identity, approvals, and ID allocation.

## Discuss Decisions

| Decision | Options | Recommended default |
|---|---|---|
| Activation model | auto-enable by business type, operator wizard, admin-only flag | Operator wizard after `business_type = saas` detection |
| Plan ownership | billing-owned plans, Pricing Engine-owned plans, hybrid | Pricing Engine owns price/package recommendations; SaaS Suite owns operational plan catalog |
| Lifecycle scope | active/cancel only, full trial/upgrade/downgrade/pause/reactivate | Full lifecycle, with external mutations approval-gated |
| Customer object mapping | reuse CRM customers, create parallel SaaS customers, bridge table | Reuse CRM/customer identity where possible; add SaaS bridge records |
| First country config | US only, Colombia only, US+Colombia metadata | US+Colombia metadata, with billing execution in Phase 215 |
| SaaS growth mode | store full doc 17 mode now, extension point only, defer completely | Reserve extension point only; full SaaS Growth Profile belongs post-217 |

## Research Needed

- Existing subscription/billing tables that can be reused without breaking Pricing Engine ownership.
- Fresh migration and contract ID ranges for SaaS Suite objects.
- RLS patterns for plan, subscription, activation, and lifecycle event tables.
- Existing CRM customer/account/deal fields that can anchor subscription identity.
- Approval gate shape for upgrade, downgrade, pause, cancellation, and reactivation.
- Whether activation should reserve future SaaS mode routing for `b2b`, `b2c`, `plg_b2b`, `plg_b2c`, and `b2b2c`.

## Acceptance Gate

- `SaaSSuiteActivation`, `SaaSPlan`, and `SaaSSubscription` contracts are designed.
- Activation wizard requirements are written.
- Lifecycle actions create tasks/approval gates where needed.
- Plan pricing fields defer to Pricing Engine when unresolved.
- RLS, audit, deletion/export, and support visibility are specified.
- Doc 17 growth modules are explicitly out of phase except for future-compatible activation metadata.
