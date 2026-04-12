# Phase 79: Governance Lineage Handoff and Runtime Gate Recovery - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Restore runtime governance bundle creation by wiring required lineage fingerprints into the submit handoff and re-enabling closure gates end-to-end.

This phase is limited to governance handoff correctness and gate recovery. It does not add new publish/rollback operational surfaces.

</domain>

<decisions>
## Implementation Decisions

### Lineage Fingerprint Source Contract
- **D-01:** `lineage_fingerprints` must be sourced from canonical artifact writer metadata produced in the existing submit flow.
- **D-02:** Governance handoff must not recompute fingerprints in handlers when canonical metadata already exists.
- **D-03:** Fingerprint lane mapping is fixed to `strategy`, `identity`, `design_system`, and `starter` and must align 1:1 with governance lane validators.

### Missing Lane Failure Policy
- **D-04:** Missing or invalid fingerprint lanes fail the governance lane only; `/submit` remains successful and returns machine-readable governance denial evidence.
- **D-05:** Governance failure payloads must include explicit denial reason codes (no generic fallback for lane-validation failures).
- **D-06:** Silent governance bypass is not allowed for lane-missing conditions.

### Gate Recovery Completion Criteria
- **D-07:** Phase 79 is complete only when submit handoff includes valid `lineage_fingerprints` and governance bundle creation no longer denies for missing lanes.
- **D-08:** Phase 79 completion requires test proof and runtime proof: updated automated suite pass plus submit-path runtime evidence.
- **D-09:** Completion evidence must demonstrate closure-gate execution resumes after successful bundle creation in the submit path.

### Scope Boundary vs Phase 81
- **D-10:** Publish/rollback operational route exposure remains deferred to Phase 81; Phase 79 does not add new runtime publish/rollback endpoints.

### the agent's Discretion
- Exact helper extraction pattern for reading metadata fingerprints from existing artifact write results.
- Internal test partition between Phase 78 governance regression coverage and Phase 79 handoff-specific assertions.
- Logging verbosity for governance handoff diagnostics (must remain redaction-safe).

</decisions>

<specifics>
## Specific Ideas

- Preserve additive submit behavior: governance can fail independently without breaking core submit success path.
- Keep reason-code provenance explicit through `DENY_CODES` for all governance handoff denials.
- Ensure lane names in handoff payload exactly match governance contract expectations to avoid semantic drift.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Requirement Mapping
- `.planning/ROADMAP.md` — Phase 79 goal, dependencies, and explicit separation from Phases 80 and 81.
- `.planning/REQUIREMENTS.md` — BRAND-GOV-01 and BRAND-GOV-02 traceability targets.
- `.planning/v3.4.0-MILESTONE-AUDIT.md` — blocker evidence and remediation requirements for governance handoff failure.

### Existing Governance Contract
- `.planning/phases/78-branding-governance-publish-or-rollback-and-closure-gates/78-CONTEXT.md` — locked governance principles inherited from Phase 78.
- `onboarding/backend/brand-governance/bundle-registry.cjs` — required lineage fields and bundle creation denial behavior.
- `onboarding/backend/brand-governance/closure-gates.cjs` — lane-level contract integrity gate behavior.
- `onboarding/backend/brand-governance/governance-diagnostics.cjs` — canonical denial reason codes and required lane list.

### Submit Integration Surface
- `onboarding/backend/handlers.cjs` — submit flow integration where canonical artifact write metadata and governance handoff are wired.
- `test/phase-75/publish-blocking.test.js` — current regression signal that must remain scoped outside Phase 79 behavior changes.
- `test/phase-78/*.test.js` — governance behavioral regression coverage, especially closure-gates and publish-rollback seams.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createBundle`, `setVerificationEvidence` in `onboarding/backend/brand-governance/bundle-registry.cjs` already provide the required immutable bundle + append-only verification model.
- `runClosureGates` in `onboarding/backend/brand-governance/closure-gates.cjs` already enforces determinism, tenant isolation, and lane completeness.
- `writeGovernanceEvidence` in `onboarding/backend/brand-governance/governance-artifact-writer.cjs` already emits machine-readable governance evidence envelopes.

### Established Patterns
- Submit flow is additive and fail-soft for governance path exceptions while preserving core response contract.
- Governance denials are reason-code driven via `DENY_CODES` and normalized diagnostics.
- Tests use explicit lane and reason-code assertions rather than generic pass/fail checks.

### Integration Points
- Handoff join point is in `onboarding/backend/handlers.cjs` where artifact writer results are available before governance bundle creation.
- Lane schema contract is shared across diagnostics, bundle creation validation, and closure gate checks.
- Phase 79 implementation must preserve Phase 81 boundary by avoiding route-surface expansion.

</code_context>

<deferred>
## Deferred Ideas

- Exposing publish/rollback operational runtime routes remains Phase 81 scope.
- Broad publish-readiness boundary refactor across earlier branding phases remains Phase 80 scope.

</deferred>

---

*Phase: 79-governance-lineage-handoff-and-runtime-gate-recovery*
*Context gathered: 2026-04-12*
