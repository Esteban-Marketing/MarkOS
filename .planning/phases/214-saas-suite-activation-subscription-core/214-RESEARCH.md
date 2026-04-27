# Phase 214 Research - SaaS Suite Activation and Subscription Core

## Primary research question

How should MarkOS activate a SaaS-specific tenant suite and model SaaS plans, subscriptions, lifecycle governance, and customer identity while reusing current tenant, CRM, billing, AgentRun, approval, and evidence substrate?

## Canonical inputs

- `obsidian/work/incoming/16-SAAS-SUITE.md`
- `obsidian/brain/SaaS Suite Canon.md`
- `obsidian/work/active/2026-04-22-markos-v2-saas-suite-intake.md`
- `obsidian/brain/Pricing Engine Canon.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/214-saas-suite-activation-subscription-core/DISCUSS.md`
- `.planning/phases/214-saas-suite-activation-subscription-core/214-REVIEWS.md`

## Current-code support

### Activation and business-type capture

- `onboarding/index.html` already exposes a SaaS business-model choice.
- `onboarding/onboarding-seed.schema.json` requires `company.business_model`.
- `onboarding/onboarding.js` persists `seed.company.business_model`.
- `supabase/migrations/51_multi_tenant_foundation.sql` and `81_markos_orgs.sql` provide durable tenant/org ownership and RLS foundations, but they do not yet expose a canonical `markos_orgs.business_type` field for downstream suite gating.

### Tenant auth and hosted handler reuse

- `onboarding/backend/runtime-context.cjs` exports `requireHostedSupabaseAuth`, which is the preferred auth helper for future SaaS handlers.
- Existing repo patterns favor legacy `api/*.js` or `api/.../*.js` handlers plus CommonJS twins for shared libraries.

### CRM identity reuse

- `supabase/migrations/58_crm_core_entities.sql` already provides `crm_companies`, `crm_accounts`, `crm_customers`, `crm_tasks`, and related RLS policies.
- This is sufficient to avoid inventing a parallel SaaS customer system. A bridge table is lower risk than mutating CRM tables or creating duplicate customer rows.

### AgentRun, approval, and evidence reuse

- `supabase/migrations/53_agent_run_lifecycle.sql` already contains partial run/event/side-effect substrate.
- `supabase/migrations/53_agent_approval_immutability.sql` and `54_governance_evidence.sql` already provide approval/evidence direction, even though the planned v2 ownership for these capabilities lives in later phases.
- `lib/markos/crm/agent-actions.ts` already exports `buildApprovalPackage`, which later phase plans consistently treat as the correct approval-package helper.

### Billing and pricing reuse

- `lib/markos/billing/contracts.ts` and `api/tenant/status.js` show an existing billing/entitlement vocabulary that P214 should reuse rather than replace.
- Pricing ownership remains with Phase 205. P214 should only store `pricing_recommendation_id` references or the literal placeholder `{{MARKOS_PRICING_ENGINE_PENDING}}`.

## Gaps

- No durable SaaS activation gate exists today.
- No canonical `business_type` field is persisted on tenant/org records.
- No `SaaSSuiteActivation`, `SaaSProfile`, `SaaSPlan`, `SaaSSubscription`, or `SaaSSubscriptionEvent` tables exist.
- No explicit subscription lifecycle state machine or approval matrix exists.
- No SaaS-to-CRM identity bridge exists.
- No SaaS-specific API, MCP, or operator routing surface exists.
- No Phase 214 validation architecture exists yet, even though downstream phases assume `saas_suite_activations` and `saas_subscriptions` are already present.

## Recommendation

Phase 214 should ship the SaaS Suite foundation only:

- Normalize onboarding `company.business_model` into a durable tenant-level `business_type`.
- Create the activation, profile, plan, subscription, event, transition-request, bridge, and governance tables needed for downstream billing, health, revenue, and growth phases.
- Preserve Pricing Engine ownership by storing only approved `pricing_recommendation_id` references or the exact placeholder `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Use CRM bridge records instead of parallel SaaS customer tables.
- Treat growth mode as an extension point only. P214 may store hints for later routing, but it must not activate PLG, ABM, referral, community, events, PR, partnerships, developer marketing, or revenue-alignment modules.

## Domain 0 - Allocation and preflight

### Migration slot allocation

Recommended Phase 214 reservation:

- `124` - activation foundation
- `125` - core SaaS profile/plan/subscription/event schema
- `126` - lifecycle transition and idempotency enforcement
- `127` - CRM identity bridge
- `128` - lifecycle governance, audit, and evidence linkage
- `129` - surface gating and growth extension point

This intentionally keeps Phase 214 first in execution order for v4.1.0 while remaining last in migration-slot order. The coordination note should explicitly say:

- Phase 214 executes before Phases 215-220.
- Phases 215-220 may read Phase 214 tables.
- Phase 214 must not hold reverse FKs into Phases 215-220.
- Execution gating is via `assertUpstreamReady`, not slot numbers.

### F-ID allocation

Recommended reservation: `F-287..F-300`

Suggested ownership:

- `F-287` - `saas-activation-v1`
- `F-288` - `saas-profile-v1`
- `F-289` - `saas-plan-v1`
- `F-290` - `saas-subscription-v1`
- `F-291` - `saas-subscription-event-v1`
- `F-292` - `saas-lifecycle-transition-v1`
- `F-293` - `saas-customer-bridge-v1`
- `F-294` - `saas-mutation-request-v1`
- `F-295` - `saas-lifecycle-audit-v1`
- `F-296` - `saas-core-api-v1`
- `F-297` - `saas-growth-extension-v1`
- `F-298` - `saas-214-architecture-lock-v1`
- `F-299` - `saas-activation-wizard-v1`
- `F-300` - `saas-surface-gating-v1`

### Preflight recommendation

Plan 01 should ship the Wave 0.5 preflight surface:

- `.planning/V4.1.0-MIGRATION-SLOT-COORDINATION.md` created by P214 because P214 is the first execution phase in the lane.
- `scripts/preconditions/214-01-check-upstream.cjs`
- `lib/markos/saas/core/preflight/{upstream-gate,architecture-lock,errors}.ts`
- `lib/markos/saas/core/preflight/index.cjs`

Recommended upstream posture:

- HARD: `markos_orgs`, `pricing_recommendations`, `markos_agent_runs`, `agent_approval_packages`, `crm_customers`, `crm_accounts`, `crm_tasks`
- SOFT: `evidence_map_records`, `governance_evidence_packs`

The architecture lock should fail on:

- `createApprovalPackage`
- `requireSupabaseAuth`
- `requireTenantContext`
- `serviceRoleClient`
- `lookupPlugin`
- `public/openapi.json`
- `app/(saas)`
- `api/v1/.../route.ts`
- `app/api/.../route.ts`
- `vitest`
- `playwright`
- `.test.ts`

## Domain 1 - Activation gate and operator wizard

### Recommended substrate

Migration `124_saas_activation_foundation.sql` should:

- add `business_type text` to `markos_orgs`
- backfill from onboarding seed `company.business_model` when possible
- create `saas_suite_activations`

Recommended `saas_suite_activations` fields:

- `activation_id uuid primary key`
- `tenant_id uuid not null references markos_orgs(org_id)`
- `business_type_snapshot text not null`
- `activation_status text not null check ('draft','active','disabled')`
- `profile_name text`
- `enabled_modules jsonb not null default '[]'`
- `country_codes text[] not null default '{}'`
- `processor_codes text[] not null default '{}'`
- `accounting_system_codes text[] not null default '{}'`
- `legal_billing jsonb not null default '{}'`
- `autonomy_posture text not null`
- `health_score_config jsonb not null default '{}'`
- `growth_extension jsonb not null default '{}'`
- `activated_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### Wizard requirements

The activation wizard should explicitly collect or confirm:

- normalized `business_type`
- operator confirmation that SaaS Suite should be enabled
- launch countries
- payment processors
- accounting systems
- legal billing configuration
- enabled SaaS modules
- autonomy posture
- health-score defaults
- growth-extension hint, stored only as non-runnable metadata

### Enforcement

Recommended database trigger exception:

- `SAAS_ACTIVATION_REQUIRES_BUSINESS_TYPE`

It should block activation when:

- `markos_orgs.business_type != 'saas'`
- the operator has not completed required module configuration

## Domain 2 - Core profile, plan, subscription, and event schema

Migration `125_saas_subscription_core.sql` should create:

- `saas_profiles`
- `saas_plans`
- `saas_plan_versions`
- `saas_subscriptions`
- `saas_subscription_events`

### Recommended modeling rules

- `saas_profiles` stores the tenant's SaaS-specific defaults and value-metric vocabulary.
- `saas_plans` stores the operational catalog; `saas_plan_versions` stores history and pricing references.
- `saas_subscriptions` stores the current state, plan link, customer link, trial dates, billing anchors, and value metrics.
- `saas_subscription_events` is append-only and tenant-scoped.

### Pricing ownership rule

Plan and package records may store:

- `pricing_recommendation_id uuid`
- or the literal sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}`

They may not store arbitrary hard-coded canonical pricing.

Recommended database trigger exception:

- `SAAS_PLAN_REQUIRES_PRICING_RECOMMENDATION_OR_SENTINEL`

## Domain 3 - Subscription lifecycle state machine

Phase 214 needs an explicit eight-state model because the requirement bundle includes trial, past due, pause, cancellation, upgrade, downgrade, and reactivation behavior.

### Recommended canonical states

- `draft`
- `trialing`
- `active`
- `past_due`
- `paused`
- `canceled`
- `upgrade_pending`
- `downgrade_pending`

### Recommended event vocabulary

- `activation_started`
- `trial_started`
- `trial_converted`
- `payment_failed`
- `payment_recovered`
- `pause_requested`
- `pause_applied`
- `reactivation_requested`
- `reactivated`
- `upgrade_requested`
- `upgrade_applied`
- `downgrade_requested`
- `downgrade_applied`
- `cancellation_requested`
- `canceled`
- `rollback_applied`

### Transition table

| From | To | Approval | Notes |
|---|---|---|---|
| `draft` | `trialing` | no | operator activation path |
| `draft` | `active` | no | direct paid activation when billing context already exists |
| `trialing` | `active` | no | successful conversion |
| `trialing` | `canceled` | no | abandoned or expired without conversion |
| `active` | `past_due` | no | payment failure or non-payment |
| `active` | `paused` | yes | operator-risk action |
| `active` | `canceled` | yes | operator-risk action |
| `active` | `upgrade_pending` | yes | external pricing/packaging mutation |
| `active` | `downgrade_pending` | yes | external pricing/packaging mutation |
| `past_due` | `active` | no | payment recovered |
| `past_due` | `paused` | yes | operator grace hold |
| `past_due` | `canceled` | yes | write-off or termination |
| `paused` | `active` | yes | reactivation |
| `paused` | `canceled` | yes | terminate paused subscription |
| `upgrade_pending` | `active` | no | approved change applied |
| `downgrade_pending` | `active` | no | approved change applied |

### Lifecycle safeguards

- `saas_subscription_events` should require append-only writes.
- `saas_subscription_transition_requests` should carry `idempotency_key`.
- unique key recommendation: `(tenant_id, subscription_id, idempotency_key)`
- direct `saas_subscriptions.current_state` updates should only be possible through the transition function or trigger pair.

Recommended database trigger exceptions:

- `SAAS_SUBSCRIPTION_TRANSITION_REQUIRES_APPROVAL`
- `SAAS_SUBSCRIPTION_INVALID_TRANSITION`

## Domain 4 - CRM identity bridge

Recommendation: create `saas_customer_bridges` in migration `127_saas_customer_identity_bridge.sql`.

### Why bridge-table over CRM-table mutation

- CRM tables already exist and are shared substrate.
- A bridge preserves CRM ownership while allowing multiple subscription records per customer/account.
- Merge and conflict flows stay explicit instead of being hidden inside CRM row edits.

### Recommended bridge shape

- `bridge_id uuid primary key`
- `tenant_id uuid not null`
- `activation_id uuid not null`
- `subscription_id uuid not null`
- `crm_customer_id uuid`
- `crm_account_id uuid`
- `crm_company_id uuid`
- `processor_customer_refs jsonb not null default '{}'`
- `resolution_status text not null check ('linked','needs_review','orphaned','merged')`
- `conflict_reason text`
- `last_verified_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended constraint posture:

- unique `(tenant_id, subscription_id)`
- at least one of `crm_customer_id` or `crm_account_id` required
- `crm_company_id` optional but preferred when available

Recommended database trigger exception:

- `SAAS_CUSTOMER_BRIDGE_REQUIRES_CRM_IDENTITY`

## Domain 5 - Lifecycle governance, audit, and evidence

P214 should not own AgentRun, task, approval, or evidence substrate. It should own the SaaS-side linkage tables that integrate with those phases.

Recommended migration `128_saas_lifecycle_governance.sql` should create:

- `saas_subscription_mutation_requests`
- `saas_subscription_audit_links`

### Recommended request fields

- `mutation_request_id uuid primary key`
- `tenant_id uuid not null`
- `subscription_id uuid not null`
- `requested_transition text not null`
- `requested_payload jsonb not null default '{}'`
- `agent_run_id uuid`
- `approval_package_id uuid`
- `task_id uuid`
- `evidence_pack_id uuid`
- `rollback_event_id uuid`
- `status text not null check ('requested','approved','rejected','applied','rolled_back')`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### Governance rule

Every risky transition should create or link:

- one AgentRun
- one task or approval package
- one audit linkage row
- one evidence reference

Recommended database trigger exception:

- `SAAS_LIFECYCLE_AUDIT_REQUIRES_EVIDENCE_PACK`

This should block `approved`, `applied`, or `rolled_back` request states when audit/evidence linkage is missing.

## Domain 6 - Surfaces and growth extension point

Migration `129_saas_surface_gating.sql` should create:

- `saas_growth_extension_points`
- a helper function or view for SaaS surface gating, such as `is_saas_surface_enabled(tenant_id)` or `saas_surface_readiness`

### Recommended extension-point posture

Store only:

- `growth_mode_hint` in `('b2b','b2c','plg_b2b','plg_b2c','b2b2c')`
- `translation_phase` default `'P218'`
- `is_runnable boolean default false`
- `blocked_reason text default 'requires_phase_218'`

No growth-mode agent, cron, or surface may become runnable in Phase 214.

### Recommended surface scope

Plan 06 should gate and expose:

- `api/v1/saas/activation.js`
- `api/v1/saas/plans.js`
- `api/v1/saas/subscriptions.js`
- `api/v1/saas/mutations.js`
- `lib/markos/mcp/tools/saas-core.cjs`
- `app/(markos)/settings/saas/page.tsx`
- `components/markos/tenant/SaaSActivationPanel.tsx`
- `components/markos/tenant/SaaSSubscriptionsTable.tsx`

### Growth translation gate

P214 should document `translation_gate_for: [P218]` on the growth-extension plan. That captures the ownership flip without pretending SG-01 is fully implemented here.

## Validation architecture

### Test runner

Use Node `--test`, matching the newer SaaS suite planning docs and the current repo pattern.

### Per-domain verification shape

- `test/saas-214/preflight/` - architecture lock, helper presence, upstream gate, baseline guard
- `test/saas-214/domain-1/` - activation gate, business-type normalization, activation trigger, RLS
- `test/saas-214/domain-2/` - plan/subscription/event contracts, pricing sentinel enforcement, append-only event behavior
- `test/saas-214/domain-3/` - valid/invalid transitions, approval-required transitions, idempotency, rollback behavior
- `test/saas-214/domain-4/` - bridge creation, multi-match conflict, orphan handling, merge-review routing
- `test/saas-214/domain-5/` - mutation request lifecycle, approval linkage, evidence-pack enforcement, audit visibility
- `test/saas-214/domain-6/` - API/MCP/UI gating, growth-extension non-activation regression
- `test/saas-214/rls/` - cross-tenant denial across activation, subscription, bridge, and governance tables

### Architecture-lock regression

The lock should assert:

- correct helpers exist: `buildApprovalPackage`, `requireHostedSupabaseAuth`, `resolvePlugin`, `lib/markos/mcp/tools/index.cjs`, `contracts/openapi.json`
- forbidden aliases do not appear
- no `vitest`, `playwright`, `.test.ts`, or `route.ts` surfaces are introduced for this phase

## Risks

- Backfilling `markos_orgs.business_type` must be deterministic; ambiguous onboarding data should fail closed into activation draft state.
- Subscription transitions are easy to make implicit; the state machine must stay table-driven and test-backed.
- P214 now owns the v4.1.0 slot-coordination document create step. Existing later phase plans that say they create it first will need follow-up alignment before execution.
- The bridge-table model avoids CRM duplication, but poor conflict rules could still create operator confusion. Plan 04 needs explicit merge-review behavior.

## Phase implications

- Phase 215 should read `saas_suite_activations`, `saas_subscriptions`, and pricing-sentinel rules rather than redefining them.
- Phase 216 should gate health/churn surfaces on `saas_suite_activations.active`.
- Phase 217 should read subscription state/history for revenue and lifecycle analytics.
- Phase 218 should treat growth mode as a translation gate, not as already-runnable functionality.
- Phases 219 and 220 should read activation state only; they must not bypass the Phase 214 gate.

## Acceptance tests implied

- Non-SaaS tenant activation attempts are blocked.
- Pricing-sensitive plan publication fails without approved recommendation or exact sentinel.
- Invalid lifecycle transitions fail closed.
- Approval-required transitions cannot bypass mutation-request linkage.
- Bridge rows without CRM identity are blocked.
- Approved/applied lifecycle mutations without evidence linkage are blocked.
- SaaS surfaces remain hidden for non-SaaS or inactive tenants.
- Growth extension records remain non-runnable until the later translated phase lands.
