# Phase 77: Next.js Starter Outputs and Role Handoff Packs - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 77 emits implementation-ready Next.js starter descriptors and role-specific handoff packs from the shared branding lineage produced in Phases 73-76.

This phase must provide deterministic starter metadata and actionable role packs for strategist, designer, founder/operator, frontend engineer, and content/marketing.

This phase does not perform publish/rollback governance controls.

</domain>

<decisions>
## Implementation Decisions

### Starter Descriptor Contract
- **D-01:** Emit a canonical starter descriptor artifact including app shell metadata, theme variable mappings, component bindings, and integration instructions.
- **D-02:** Starter descriptor output must be deterministic for fixed lineage inputs and ruleset version.

### Next.js and Frontend Mapping
- **D-03:** Descriptor targets Next.js app-router conventions and references canonical Tailwind v4 token and shadcn contract outputs from Phase 76.
- **D-04:** Component bindings must map semantic intents to required primitives/states without manual reinterpretation.

### Role Handoff Packs
- **D-05:** Generate role-targeted handoff packs from one canonical descriptor source (no independent rewrites).
- **D-06:** Packs must include immediate next actions, constraints, and acceptance checks per role.
- **D-07:** Role packs must preserve lineage pointers to underlying strategy/identity/token artifacts.

### Integration and Scope
- **D-08:** Integrate additively with existing backend submit/response surfaces; no standalone public API route.
- **D-09:** Persist tenant-scoped starter and handoff artifacts with deterministic identifiers.
- **D-10:** Keep outputs contract-driven and implementation-ready; avoid vague prose-only guidance.

### the agent's Discretion
- Internal module decomposition for starter descriptor compiler and role pack projector.
- Exact format of role pack markdown/json payload structure.
- Diagnostic message wording where semantics are unchanged.

</decisions>

<specifics>
## Specific Ideas

- Include descriptor fields for route scaffolding hints, theme variable injection points, and component-state checklist.
- Role packs should include "what to do now" and "what not to change" sections.
- Frontend engineer pack must be directly mappable to tasks in a Next.js codebase.

</specifics>

<canonical_refs>
## Canonical References

- .planning/ROADMAP.md
- .planning/REQUIREMENTS.md
- .planning/PROJECT.md
- .planning/phases/76-token-compiler-and-shadcn-component-contract/76-CONTEXT.md
- .planning/phases/76-token-compiler-and-shadcn-component-contract/76-RESEARCH.md
- .planning/phases/76-token-compiler-and-shadcn-component-contract/76-VERIFICATION.md
- onboarding/backend/handlers.cjs
- onboarding/backend/brand-design-system/token-compiler.cjs
- onboarding/backend/brand-design-system/component-contract-compiler.cjs

</canonical_refs>

<deferred>
## Deferred Ideas

- Bundle publish/rollback controls (Phase 78).
- Governance drift detection and active-pointer promotion logic (Phase 78).

</deferred>

---

*Phase: 77-nextjs-starter-outputs-and-role-handoff-packs*
*Context gathered: 2026-04-12 via auto bootstrap*
