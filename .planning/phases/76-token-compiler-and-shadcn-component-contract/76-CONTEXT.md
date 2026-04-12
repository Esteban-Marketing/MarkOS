# Phase 76: Token Compiler and shadcn Component Contract - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 76 converts Phase 74 strategy and Phase 75 identity artifacts into canonical Tailwind v4 tokens and a deterministic shadcn component-state contract manifest.

Outputs must be directly consumable by branded app surfaces without manual remapping.

This phase does not generate full Next.js starter apps or role handoff packs.

</domain>

<decisions>
## Implementation Decisions

### Token Contract
- **D-01:** Emit one canonical token bundle containing semantic color, typography, spacing, radius, shadow, and motion tokens mapped from strategy + identity artifacts.
- **D-02:** Token naming and ordering must be deterministic for fixed inputs and ruleset versions.
- **D-03:** Tailwind v4 compatibility is required via stable token export shape and CSS variable mappings.

### Component Contract Manifest
- **D-04:** Produce a deterministic shadcn component contract manifest listing required components, variants, and interaction states.
- **D-05:** Component state requirements must be mapped from semantic intent (tone, emphasis, density, feedback states) with explicit rationale.
- **D-06:** Manifest must include required primitives for core app surfaces and critical state coverage.

### Validation and Safety
- **D-07:** Contract generation must fail with explicit diagnostics when required token categories or component states are missing.
- **D-08:** Lineage metadata must link token and manifest entries back to source strategy/identity decisions.

### Integration Constraints
- **D-09:** Integrate additively into existing backend surfaces; no standalone public token API in this phase.
- **D-10:** Preserve tenant-scoped deterministic behavior and avoid stochastic output in canonical contracts.

### the agent's Discretion
- Internal compiler module boundaries.
- Exact constants and helper naming.
- Supplemental metadata fields that do not alter canonical contract semantics.

</decisions>

<specifics>
## Specific Ideas

- Generate Tailwind v4-oriented token JSON and CSS-variable-ready map in one pass.
- Build a manifest schema for shadcn components including required variants (default, destructive, outline, ghost, link, etc.) and interaction states (hover, focus-visible, active, disabled, loading).
- Include deterministic fingerprint/hash for contract snapshots.

</specifics>

<canonical_refs>
## Canonical References

### Scope and Requirements
- `.planning/ROADMAP.md` - Phase 76 scope and acceptance intent.
- `.planning/REQUIREMENTS.md` - BRAND-DS-01 and BRAND-DS-02.
- `.planning/PROJECT.md` - additive architecture boundary.

### Upstream Inputs
- `.planning/phases/74-strategy-artifact-and-messaging-rules-engine/74-VERIFICATION.md`
- `.planning/phases/75-deterministic-identity-system-with-accessibility-gates/75-VERIFICATION.md`
- `onboarding/backend/brand-strategy/messaging-rules-compiler.cjs`
- `onboarding/backend/brand-identity/identity-compiler.cjs`
- `onboarding/backend/brand-identity/semantic-role-model.cjs`

### Existing Theme Surface
- `lib/markos/theme/brand-pack.ts`
- `lib/markos/theme/tokens.ts`
- `onboarding/backend/handlers.cjs`

</canonical_refs>

<deferred>
## Deferred Ideas

- Next.js starter descriptor generation (Phase 77).
- Role-targeted handoff pack production (Phase 77).
- Publish/rollback governance workflows (Phase 78).

</deferred>

---

*Phase: 76-token-compiler-and-shadcn-component-contract*
*Context gathered: 2026-04-11 via auto bootstrap*
