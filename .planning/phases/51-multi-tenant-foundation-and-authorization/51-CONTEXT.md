# Phase 51: Multi-Tenant Foundation and Authorization - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 51 delivers the core multi-tenant and authorization foundation for MarkOS by enforcing strict tenant isolation and deterministic tenant context propagation across UI, API, jobs, and agent runtime entrypoints, while upgrading role boundaries from the current RBAC baseline to the v3.2 IAM model.

This phase owns TEN-01, TEN-02, TEN-03, IAM-01, and IAM-02.

This phase does not own plugin runtime and Digital Agency packaging (Phase 52), approval-governed plan lineage (Phase 53), or enterprise billing/compliance/SSO readiness (Phase 54).

</domain>

<decisions>
## Implementation Decisions

### Tenant Identity and Data Isolation
- **D-01:** Adopt `tenant_id` as the canonical data-partition key for all tenant-scoped records and policies, while preserving temporary compatibility reads from legacy `workspaceId/workspace_id` fields where needed during migration.
- **D-02:** Enforce deny-by-default RLS posture for tenant-scoped tables: access is granted only when actor tenant membership is resolved and explicitly authorized for the target tenant.
- **D-03:** Multi-tenant memberships are modeled explicitly (`user` -> `tenant_membership` -> `role`) so one user can operate in multiple tenants without implicit cross-tenant trust.

### Tenant Context Propagation
- **D-04:** Tenant context must be resolved once at authenticated boundary (token + membership + requested tenant) and propagated as a required runtime context object through API handlers, queued jobs, and agent runs.
- **D-05:** Missing or ambiguous tenant context is fail-closed across all protected flows (deterministic auth/tenant errors, no best-effort fallback to global context).
- **D-06:** Hosted wrappers remain the first-class enforcement gate for tenant-scoped access checks, extending existing auth checks to include tenant scope verification.

### IAM and RBAC Transition
- **D-07:** Introduce v3.2 role set (`owner`, `tenant-admin`, `manager`, `contributor`, `reviewer`, `billing-admin`, `readonly`) as canonical IAM roles while maintaining an explicit compatibility mapping from existing UI roles during transition.
- **D-08:** Permission evaluation becomes action-scoped and route-scoped with default deny semantics; every protected operation must resolve actor role within tenant context before execution.

### Security Events and Auditability
- **D-09:** Every cross-tenant denial path emits a structured immutable security event with actor, tenant, requested resource, decision reason, and correlation/request id.
- **D-10:** Security/audit telemetry continues to use centralized payload sanitization to guarantee no secrets/tokens are leaked in denial logs or auth traces.

### the agent's Discretion
- The planner/researcher may choose exact table names and helper-module boundaries as long as the decision contract above remains intact.
- The planner/researcher may sequence compatibility migration in waves (schema first vs middleware first) if fail-closed behavior is preserved at every step.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Scope Contracts
- `.planning/ROADMAP.md` - Phase 51 boundary and requirement mapping (TEN-01/02/03, IAM-01/02)
- `.planning/REQUIREMENTS.md` - v3.2 requirement definitions and acceptance criteria
- `.planning/PROJECT.md` - milestone-level non-negotiables and plugin-first context
- `.planning/STATE.md` - current project state and milestone transition status

### Auth and Flow Enforcement Surfaces
- `.planning/FLOW-INVENTORY.md` - canonical hosted/local flow map and existing auth-bearing endpoints
- `onboarding/backend/runtime-context.cjs` - `requireHostedSupabaseAuth` boundary and scoped principal resolution
- `api/config.js` - hosted wrapper auth enforcement integration point
- `api/status.js` - hosted wrapper auth enforcement integration point
- `api/migrate.js` - hosted wrapper auth enforcement integration point

### RBAC and Telemetry Baseline
- `lib/markos/rbac/policies.ts` - current route-level role policy baseline to evolve toward IAM v3.2 roles
- `lib/markos/telemetry/events.ts` - telemetry event schema and payload sanitization contract
- `lib/markos/llm/settings.ts` - workspace/tenant compatibility field handling patterns

### Data Model and Migration Baseline
- `supabase/migrations/37_markos_ui_control_plane.sql` - control-plane schema foundation
- `supabase/migrations/42_markos_migrations.sql` - migration and persistence baseline
- `supabase/migrations/47_operator_llm_management.sql` - recent migration patterns for secure operational tables

### Prior Phase Constraints
- `.planning/phases/49-hardening-layer-rbac-diagnostics-preflight-rollback-safety/49-01-SUMMARY.md` - RBAC and operational hardening baseline to preserve
- `.planning/phases/50-guided-operator-onboarding-end-to-end-activation-verification/50-01-SUMMARY.md` - operator onboarding and role-activation UX constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `onboarding/backend/runtime-context.cjs`: Existing hosted auth gate and project-scope checks can be extended to tenant scope enforcement.
- `lib/markos/rbac/policies.ts`: Existing route permission matrix provides a concrete starting point for IAM role expansion.
- `lib/markos/telemetry/events.ts`: Existing security-safe telemetry construction (`buildEvent` + `sanitizePayload`) should be reused for tenant denial auditing.
- `lib/markos/llm/settings.ts`: Current `workspaceId`/`workspace_id` normalization pattern can guide compatibility handling for tenant migration.

### Established Patterns
- Hosted wrappers enforce auth before handler execution and should remain the primary boundary for tenant checks.
- Route-level authorization already follows explicit allowlists; Phase 51 should keep this explicit style while broadening role model.
- Sensitive data redaction is centralized and must remain mandatory for all new security events.

### Integration Points
- API wrappers under `api/` and runtime auth context helpers in `onboarding/backend/runtime-context.cjs`.
- Supabase migration files under `supabase/migrations/` for tenant and membership schema/RLS rollout.
- UI/operation role checks currently anchored in `lib/markos/rbac/policies.ts` and downstream consumers.

</code_context>

<specifics>
## Specific Ideas

- Keep existing `workspace` identifiers as transitional compatibility aliases only; all new tenant isolation contracts should anchor on `tenant_id`.
- Preserve current hosted auth ergonomics while tightening scope resolution (no permissive fallback behavior for ambiguous tenant context).
- Prefer deterministic, testable denial semantics over implicit convenience paths.

</specifics>

<deferred>
## Deferred Ideas

- Fine-grained plugin role overlays and plugin capability permissions are deferred to Phase 52/53.
- SSO/SAML-specific role bootstrap and identity federation edge cases are deferred to Phase 54.

</deferred>

---

*Phase: 51-multi-tenant-foundation-and-authorization*
*Context gathered: 2026-04-03*