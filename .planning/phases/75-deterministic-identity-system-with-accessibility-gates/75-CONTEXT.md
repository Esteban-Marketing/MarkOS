# Phase 75: Deterministic Identity System with Accessibility Gates - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 75 compiles strategy artifact outputs into deterministic identity artifacts: semantic color roles, typography hierarchy, and visual language constraints.

Phase 75 must enforce publish-blocking accessibility defaults and diagnostics. If required thresholds fail, publish readiness must be blocked with explicit reasons.

This phase does not emit Tailwind token contracts, shadcn component manifests, or Next.js starter outputs.

</domain>

<decisions>
## Implementation Decisions

### Identity Artifact Contract
- **D-01:** Emit one canonical identity artifact per tenant/version containing semantic color roles, typography scale, spacing intent, and visual constraints.
- **D-02:** Identity artifact fields must be deterministic for fixed strategy input and ruleset version.

### Deterministic Compilation Rules
- **D-03:** Use stable ordering and canonical serialization before fingerprinting identity artifacts.
- **D-04:** Preserve strategy-to-identity lineage links for each generated identity decision.

### Accessibility Gates
- **D-05:** Enforce contrast/readability checks for required semantic role pairs.
- **D-06:** Publish readiness must be blocked when required checks fail, returning explicit diagnostics.
- **D-07:** Accessibility checks must be reproducible and testable in automated phase tests.

### Scope and Integration
- **D-08:** Integrate additively with existing onboarding/branding backend surfaces; do not add new standalone public APIs.
- **D-09:** Reuse tenant-scoped persistence patterns from prior phases for identity artifacts.
- **D-10:** Keep non-deterministic creative variance out of canonical identity outputs for this phase.

### the agent's Discretion
- Internal module boundaries for identity compiler and accessibility checker.
- Exact naming of internal helper functions and diagnostics constants.
- Human-readable formatting for diagnostics payloads.

</decisions>

<specifics>
## Specific Ideas

- Compile semantic roles such as `brand.primary`, `brand.secondary`, `surface.default`, `text.primary`, `text.inverse`, and state accents from strategy intent.
- Include deterministic typography profile outputs (families, scale steps, weights, line-height intent).
- Provide machine-readable gate report for accessibility checks to support downstream governance.

</specifics>

<canonical_refs>
## Canonical References

### Milestone and Requirement Scope
- `.planning/ROADMAP.md` - Phase 75 goal and acceptance intent.
- `.planning/REQUIREMENTS.md` - BRAND-ID-01 and BRAND-ID-02.
- `.planning/PROJECT.md` - Additive milestone boundary.

### Upstream Inputs
- `.planning/phases/74-strategy-artifact-and-messaging-rules-engine/74-CONTEXT.md`
- `.planning/phases/74-strategy-artifact-and-messaging-rules-engine/74-RESEARCH.md`
- `.planning/phases/74-strategy-artifact-and-messaging-rules-engine/74-VERIFICATION.md`
- `onboarding/backend/brand-strategy/strategy-synthesizer.cjs`
- `onboarding/backend/brand-strategy/messaging-rules-compiler.cjs`
- `onboarding/backend/brand-strategy/role-view-projector.cjs`

### Existing Runtime Surfaces
- `onboarding/backend/handlers.cjs`
- `onboarding/backend/runtime-context.cjs`
- `onboarding/backend/vector-store-client.cjs`

### Downstream Alignment Targets
- `lib/markos/theme/brand-pack.ts`

</canonical_refs>

<deferred>
## Deferred Ideas

- Full token compiler output (Phase 76).
- Component contract manifests (Phase 76).
- Publish/rollback governance controls (Phase 78).

</deferred>

---

*Phase: 75-deterministic-identity-system-with-accessibility-gates*
*Context gathered: 2026-04-11 via auto bootstrap*
