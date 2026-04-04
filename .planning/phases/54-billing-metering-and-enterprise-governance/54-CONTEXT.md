# Phase 54: Billing, Metering, and Enterprise Governance - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 54 delivers invoice-grade tenant billing and enterprise governance for MarkOS v3.2 by converting Phase 52 and Phase 53 telemetry into reconciled usage records, enforcing subscription entitlements safely, generating operator and tenant billing evidence, and extending IAM v3.2 with enterprise identity federation and compliance-ready audit controls.

This phase owns BIL-01, BIL-02, BIL-03, IAM-04, and GOV-01.

This phase does not own tenant isolation foundations (Phase 51), first-party plugin runtime packaging (Phase 52), or core agent lifecycle/orchestration telemetry collection (Phase 53). It consumes those delivered contracts.

</domain>

<decisions>
## Implementation Decisions

## Billing Model and Metering Contract
- **D-01:** Use a hybrid billing model: base subscription plus metered overages for tokens, agent runs, and premium feature units.
- **D-02:** Preserve raw telemetry lineage and aggregate it into billable units rather than billing directly from raw event streams.
- **D-03:** Every billed unit must reconcile back to immutable Phase 52/53 telemetry so finance and operators can explain charges without manual stitching.
- **D-03a:** Phase 54 must preserve one billing-term vocabulary for monthly and annual plans across entitlement snapshots, ledger rows, invoice evidence, and tenant/operator billing surfaces. Advanced proration, credits, disputes, and mid-cycle migration mechanics may remain deferred if they do not weaken that shared term model.

## Entitlement and Billing Failure Behavior
- **D-04:** Enforce entitlement-safe degradation when a tenant exceeds allowance or billing state is unhealthy.
- **D-05:** Restricted write, execute, and premium operations fail closed with explicit operator-facing reason codes; core read access and evidence visibility should remain available.
- **D-06:** Billing failures may not silently over-provision restricted capabilities; holds, degradation, and recovery state must be auditable.

## Billing Surfaces and User Experience Scope
- **D-07:** Phase 54 includes a balanced internal plus tenant-facing billing surface.
- **D-08:** Operators need reconciliation, hold/dunning, and invoice-evidence workflows; tenants also need a meaningful usage and billing view in the same phase.
- **D-09:** Tenant-facing billing views should reflect the same reconciled ledger used by operators, not a separate approximate reporting path.

## Enterprise Identity and Governance Scope
- **D-10:** Prioritize SSO/SAML federation, external-role to canonical-role mapping, and audit evidence for identity-bound privilege changes.
- **D-11:** External identity claims map onto existing IAM v3.2 canonical roles rather than introducing a second permission model.
- **D-12:** Full provisioning lifecycle automation beyond deterministic mapping and governed access changes is deferred unless required by locked scope later.

## Governance Evidence and Compliance Readiness
- **D-13:** Governance outputs must cover privileged billing actions, privileged identity changes, retention/export evidence, and vendor/subprocessor traceability for AI and billing providers.
- **D-14:** Compliance-ready evidence should be generated from existing immutable logs and ledgers, not from ad hoc operator notes.

## the agent's Discretion
- The planner/researcher may choose exact billing-provider integration boundaries, storage schema, and job cadence as long as reconciliation lineage and entitlement-safe behavior remain intact.
- The planner/researcher may choose whether usage aggregation is near-real-time or batched so long as invoice evidence, tenant views, and operator reconciliation stay consistent.

## Required Human Checkpoints
- **HC-01:** Live tenant/operator billing UX review is required before full phase closeout so translated billing vocabulary and evidence readability are confirmed in a running app session.
- **HC-02:** Live enterprise IdP SSO callback verification is required before full phase closeout so canonical-role mapping and escalation-denial behavior are confirmed against a non-production Supabase enterprise setup.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Requirement Contracts
- `.planning/ROADMAP.md` - Phase 54 boundary and requirement mapping
- `.planning/REQUIREMENTS.md` - BIL-01, BIL-02, BIL-03, IAM-04, GOV-01 definitions
- `.planning/STATE.md` - current v3.2 milestone position
- `.planning/MILESTONES.md` - milestone intent for billing/compliance operations

### Upstream Dependency Context
- `.planning/phases/51-multi-tenant-foundation-and-authorization/51-CONTEXT.md` - IAM v3.2 and tenant-bound enforcement assumptions
- `.planning/phases/52-plugin-runtime-and-digital-agency-plugin-v1/52-CONTEXT.md` - plugin telemetry and entitlement hooks handed to Phase 54
- `.planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-CONTEXT.md` - run-close telemetry, provider-attempt evidence, and billing/compliance deferments
- `.planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-VERIFICATION.md` - verified runtime guarantees Phase 54 can rely on

### Product and Governance Specs
- `.planning/projects/markos-v3/technical-specs/BILLING-METERING.md` - billing model, metering pipeline, failure handling, required outputs
- `.planning/projects/markos-v3/technical-specs/SECURITY-COMPLIANCE.md` - enterprise-ready control areas and compliance evidence targets
- `.planning/projects/markos-v3/technical-specs/AUTHORIZATION-MODEL.md` - canonical roles, billing actions, security action boundaries, audit fields
- `.planning/projects/markos-v3/technical-specs/OBSERVABILITY-RUNBOOK.md` - reconciliation and alerting expectations

### Runtime and Telemetry Surfaces
- `onboarding/backend/agents/telemetry.cjs` - current provider-attempt and run-close emitters
- `lib/markos/telemetry/events.ts` - canonical event schema and sanitization behavior
- `onboarding/backend/runtime-context.cjs` - tenant/runtime policy metadata and deny-event behavior
- `onboarding/backend/agents/orchestrator.cjs` - verified agent closeout data Phase 54 will meter

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 52 already emits plugin telemetry intended for Phase 54 metering and plan-tier enforcement.
- Phase 53 now emits complete run-close and provider-attempt telemetry with bounded failover evidence suitable for billing reconciliation.
- IAM v3.2 canonical roles already include `billing-admin`; enterprise federation should map into that existing permission model.

### Established Patterns
- Tenant and role enforcement are fail-closed by default and should remain the authoritative billing/governance boundary.
- Audit and telemetry payload sanitization is centralized; governance outputs should reuse those envelopes rather than create parallel formats.
- Append-only evidence and immutable ledgers are the preferred pattern for anything tied to billing or privileged identity changes.

### Integration Points
- Tenant entitlement checks should hook into existing Phase 52 plugin enablement and Phase 53 runtime policy boundaries.
- Billing reconciliation surfaces will likely touch app/operator UI, backend handlers, and persistence contracts.
- Identity federation and mapping should anchor to existing handler/service enforcement points rather than bypass them.

</code_context>

<specifics>
## Specific Ideas

- Tenant billing views should explain usage in the same vocabulary finance and operators use, not raw internal event names.
- Metering lineage should preserve `tenant_id`, `correlation_id`, provider/model context where relevant, and billing-period boundaries.
- Role-mapping evidence should show source IdP claim, mapped canonical role, actor/tenant context, and denial reason when mapping is rejected.

</specifics>

<deferred>
## Deferred Ideas

- Full SCIM or broader provisioning/deprovisioning automation beyond the initial federation and mapping boundary.
- Compliance workflows that require a separate privacy-lifecycle product surface rather than evidence/reporting from existing controls.
- Pricing-packaging optimization beyond the hybrid billing contract locked here.

</deferred>

---

*Phase: 54-billing-metering-and-enterprise-governance*
*Context gathered: 2026-04-03*
*Decisions locked: 15 (D-01 through D-14 plus D-03a)*
