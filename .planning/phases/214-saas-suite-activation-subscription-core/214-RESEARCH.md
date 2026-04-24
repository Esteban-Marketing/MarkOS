# Phase 214 Research - SaaS Suite Activation and Subscription Core

## Primary research question

How should MarkOS activate a SaaS-specific tenant suite and model SaaS plans/subscriptions while reusing current tenant, CRM, billing, AgentRun, and approval foundations?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Activation | Where is `business_type` captured today, and how should `business_type = saas` gate the suite? | Activation contract and UI entry point |
| Schema | Which current tenant/billing/CRM tables can be reused? | Schema reuse map |
| Plan catalog | How should `SaaSPlan` reference Pricing Engine recommendations? | Plan-pricing dependency model |
| Growth mode | Should `b2b`, `b2c`, `plg_b2b`, `plg_b2c`, and `b2b2c` live in activation now, a future `SaaSGrowthProfile`, or an extension point only? | Doc 17 compatibility recommendation |
| Subscription lifecycle | What states and events are required for trial, active, past_due, pause, cancel, reactivate, upgrade, downgrade? | State machine |
| Customer identity | Should subscriptions link to CRM customers, accounts, companies, or a bridge table? | Identity mapping |
| Approval | Which lifecycle changes require approval by default? | Approval matrix |
| Contracts | What fresh F-ID and migration ranges are available? | ID reservation proposal |

## Sources to inspect

- Supabase migrations for tenant, billing, CRM, AgentRun, and approvals.
- `lib/markos/billing/*`
- API routes for billing, tenant profile/status, CRM customers/accounts/tasks.
- Existing UI settings/onboarding/business profile components.
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/brain/SaaS Marketing OS Strategy Canon.md`

## Required research output

- Current-code support.
- Gaps.
- Recommendation.
- Risks.
- Phase implications.
- Acceptance tests implied.

## Codebase Research Addendum - 2026-04-23

### Current-code support

- Tenant/org/RLS and membership foundations exist from Phase 201.
- Billing contracts and entitlements provide reusable quota, usage, and enforcement language.
- CRM entity/activity models can link SaaS customers, accounts, and tasks later.
- Onboarding/literacy code already reasons over business model/discipline context, but not as a durable SaaS profile.

### Gaps

- No durable `SaaSProfile`, `SaaSPlan`, `SaaSSubscription`, `SaaSSubscriptionEvent`, or activation state exists.
- No `business_type = saas` suite-gating surface exists.
- No subscription lifecycle state machine exists.
- No plan catalog references Pricing Engine recommendations.
- No SaaS customer identity bridge exists between subscriptions, CRM, billing, and product usage.

### Recommendation

Phase 214 should create activation and subscription core only. It should define `SaaSGrowthProfile` fields as future extension points, but not implement PLG/ABM/referral/community/event/developer growth modules from doc 17. `SaaSPlan` must reference approved PricingRecommendation records or stay pending.

### Tests implied

- SaaS activation RLS and business-type gate tests.
- Subscription lifecycle transition tests.
- Pricing dependency tests: SaaS plan cannot publish active pricing without Pricing Engine approval.
- CRM identity bridge tests for company/customer/subscription linking.
