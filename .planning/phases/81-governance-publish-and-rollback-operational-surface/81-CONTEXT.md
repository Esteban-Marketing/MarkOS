# Phase 81: Governance Publish and Rollback Operational Surface - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 81 exposes the already-implemented `publishBundle()` and `rollbackBundle()` functions (in
`onboarding/backend/brand-governance/active-pointer.cjs`) through actual operational API routes
with proper auth guardrails, a read-status surface, and explicit traceability.

This phase is about routing and operational surfacing only. It does not re-implement or extend the
core publish/rollback logic — those functions already run closure gates, enforce tenant isolation,
and write traceability entries. No new runtime governance logic is added here.

</domain>

<decisions>
## Implementation Decisions

### Route Structure
- **D-01:** Separate route files per operation — `api/governance/brand-publish.js` and
  `api/governance/brand-rollback.js`. Follows the established `api/governance/evidence.js` pattern.
  Clean test isolation and per-operation auth override capability.

### Authorization Model
- **D-02:** Both publish and rollback routes require `manage_billing OR manage_users` permission via
  `canPerformAction` — same authorization check used in `api/governance/evidence.js`.
  No new RBAC action needed for Phase 81.

### Read Surface
- **D-03:** A third route file `api/governance/brand-status.js` (GET) surfaces the current active
  bundle and full traceability log for a tenant. Wraps `getActiveBundle()` and `getTraceabilityLog()`
  from `active-pointer.cjs`. Same auth requirement as publish/rollback (D-02).

### Denial Feedback
- **D-04:** API responses pass through the full structured denial payload from `active-pointer.cjs`
  verbatim — `reason_code` + `diagnostics` + `gates` (where present). No sanitization or stripping.
  Consistent with Phase 78 D-08 (machine-readable) and D-10 (explicit diagnostics).

### Inherited Constraints (Phase 78)
- **D-05:** All operations remain tenant-scoped and fail-closed (Phase 78 D-06 inherited).
- **D-06:** Historical bundle content must not be mutated (Phase 78 D-09 inherited).
- **D-07:** Governance errors do not break the core submit flow (Phase 78 D-07 additive pattern
  inherited — routes are additive surfaces, not required for submit success).

### the agent's Discretion
- Exact request body field names for `bundle_id`, `actor_id`, `reason` in POST payloads.
- HTTP status codes for specific denial cases (422 vs 409 for gate failure vs not-found).
- Whether brand-status returns the full bundle object or a summary view.

</decisions>

<specifics>
## Specific Notes

- Route files should follow the thin-handler pattern: auth check → call governance function → respond.
  No inline business logic. The governance functions already own the policy.
- The `actor_id` in publish/rollback requests should default to the authenticated user's identity
  from the auth context when not explicitly provided.
- Tests must prove: success path (publish + pointer switch), denial path (gate failure + full
  diagnostics through to API response), and cross-tenant denial.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` — Phase 81 goal, Gap Closure note, dependency on Phase 79.
- `.planning/REQUIREMENTS.md` — BRAND-GOV-01 acceptance criteria.
- `.planning/v3.4.0-MILESTONE-AUDIT.md` — audit gap being closed (publish/rollback are test-only).

### Existing Governance Contract
- `onboarding/backend/brand-governance/active-pointer.cjs` — `publishBundle`, `rollbackBundle`,
  `getActiveBundle`, `getTraceabilityLog` (functions to be exposed).
- `onboarding/backend/brand-governance/governance-diagnostics.cjs` — denial reason codes.
- `.planning/phases/78-branding-governance-publish-or-rollback-and-closure-gates/78-CONTEXT.md`
  — locked governance principles (D-01 through D-10) inherited by this phase.
- `.planning/phases/79-governance-lineage-handoff-and-runtime-gate-recovery/79-CONTEXT.md`
  — D-10 explicit scope boundary deferring routes to Phase 81.

### Auth and Route Pattern
- `api/governance/evidence.js` — canonical auth pattern: `requireHostedSupabaseAuth` +
  `canPerformAction` RBAC check. Phase 81 routes must follow this exact pattern.
- `lib/markos/rbac/iam-v32.js` — RBAC `canPerformAction` function.
- `onboarding/backend/runtime-context.cjs` — `requireHostedSupabaseAuth`.

### Regression Context
- `test/phase-78/*.test.js` — existing governance behavioral tests (must not regress).

</canonical_refs>

<deferred>
## Deferred Ideas

- New RBAC action `manage_brand` for finer-grained brand governance authorization (future phase).
- UI surface for publish/rollback (operator dashboard integration, future phase).
- Automated deployment pipeline triggered by publish (out of scope per REQUIREMENTS.md 13.1).

</deferred>

---

*Phase: 81-governance-publish-and-rollback-operational-surface*
*Context gathered: 2026-04-12*
