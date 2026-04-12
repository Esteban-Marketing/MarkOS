# Phase 78: Branding Governance, Publish or Rollback, and Closure Gates - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 78 adds governance controls over the full branding lineage bundle: versioning, publish promotion, rollback, drift evidence, and mandatory closure gates.

This phase enforces deterministic, tenant-safe verification before active bundle changes.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Branding artifacts are versioned as a single lineage bundle with immutable bundle IDs.
- **D-02:** Publish promotes only fully verified bundles via active-pointer switching.
- **D-03:** Rollback restores previously verified bundles with full traceability logs.
- **D-04:** Drift evidence must detect divergence between active pointer and recomputed expected lineage.
- **D-05:** Closure gates must include determinism, tenant isolation, and contract integrity checks.
- **D-06:** Governance operations are tenant-scoped and fail-closed on missing prerequisites.
- **D-07:** No standalone public API route; governance integrates additively into existing backend surfaces.
- **D-08:** Verification artifacts are machine-readable and auditable.
- **D-09:** Governance changes must not mutate historical bundle content.
- **D-10:** Diagnostics must be explicit for publish/rollback denials.

### the agent's Discretion
- Internal module separation for bundle registry, pointer management, and drift auditor.
- Exact names for governance diagnostics codes.

</decisions>

<canonical_refs>
## Canonical References

- .planning/ROADMAP.md
- .planning/REQUIREMENTS.md
- .planning/PROJECT.md
- .planning/phases/77-nextjs-starter-outputs-and-role-handoff-packs/77-VERIFICATION.md
- onboarding/backend/handlers.cjs

</canonical_refs>

<deferred>
## Deferred Ideas

- Autonomous deployment orchestration outside branding governance.

</deferred>

---

*Phase: 78-branding-governance-publish-or-rollback-and-closure-gates*
*Context gathered: 2026-04-12 via auto bootstrap*
