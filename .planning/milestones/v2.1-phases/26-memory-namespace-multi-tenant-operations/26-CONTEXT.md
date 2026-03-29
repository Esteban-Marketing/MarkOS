# Phase 26 Context â€” Memory, Namespace & Multi-Tenant Operations

## Objective

Formalize the product's memory layer so Vector Store namespace rules, local versus cloud operating modes, migration-safe compatibility behavior, and cross-project isolation guarantees are explicit, testable, and safe for future multi-tenant usage.

Phase 26 follows the earlier hardening sequence on purpose. Phase 23 established the compatibility contract, Phase 24 clarified runtime behavior across local and hosted paths, and Phase 25 improved onboarding reliability. This phase turns the remaining Vector Store and project-slug assumptions into an operational contract instead of leaving them spread across code comments, environment variables, and historical docs.

## Phase Scope

### In Scope
- Document and codify Vector Store collection naming, project-slug usage, and compatibility-read behavior.
- Define migration-safe handling for legacy `markos-*` namespaces and future MarkOS-prefixed namespaces.
- Expand health checks and failure reporting for local daemon versus cloud Vector Store backends.
- Add test coverage or simulation that proves cross-project isolation and prevents slug-based data contamination.

### Out of Scope
- Broad onboarding UX or merge-quality work already scoped to Phase 25.
- Full execution-loop or telemetry expansion reserved for Phase 27.
- Destructive repo-wide identity migration work from the older rename phases.
- Replacing Vector Store with a different memory backend.

## Locked Decisions

1. **Slug is the namespace root:** project-level memory isolation continues to start from the persisted project slug contract.
2. **Compatibility before migration:** legacy `markos-*` collections must remain discoverable before any destructive namespace migration is considered safe.
3. **Mode awareness is required:** local daemon and cloud Vector Store operation must be surfaced as explicit runtime modes, not incidental environment behavior.
4. **Isolation must be testable:** multi-project safety cannot rely on conventions alone; it needs deterministic coverage or simulation.
5. **Memory contract precedes execution expansion:** Phase 27 should inherit an explicit memory model instead of building on implied storage behavior.

## Requirements Mapped

- **MMO-01**: Namespace rules for project slugs, draft collections, metadata collections, and compatibility reads are explicit and enforced.
- **MMO-02**: Local and cloud Vector Store operating modes are documented, health-checked, and reflected in failure reporting.
- **MMO-03**: Cross-project isolation and migration safety are validated so existing data stays discoverable without tenant contamination.

## Key Files and Surfaces

| Surface | Why It Matters | Likely Outputs |
|---------|----------------|----------------|
| `onboarding/backend/vector-store-client.cjs` | Current namespace logic, draft storage, and project clearing live here | Centralized namespace helpers, compatibility-read logic, clearer collection rules |
| `bin/ensure-vector.cjs` | Local/cloud operating mode is decided here for CLI and server boot | Explicit mode reporting and better health/failure semantics |
| `onboarding/backend/handlers.cjs` | Runtime config and health surfaces expose Vector Store mode to operators | Clearer health payloads and mode-aware behavior |
| `.markos-project.json` | Persisted slug remains the tenant boundary root | Documented canonical source and collision/compatibility rules |
| `.protocol-lore/MEMORY.md`, `.protocol-lore/WORKFLOWS.md` | Existing memory docs still describe an older simplified model | Updated operational contract for namespaces and modes |
| `README.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md` | Operator and planner-facing source of truth for residual memory risks | Explicit deployment and namespace expectations |
| `test/` runtime and future Vector Store-focused tests | There is currently no dedicated Vector Store isolation suite | New coverage for compatibility reads, health logic, and multi-project isolation |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Namespace changes hide existing data during identity transition | High | Add compatibility-read rules before any canonical namespace shift |
| Fallback slug behavior contaminates data across projects | High | Define slug sourcing rules explicitly and add isolation tests or simulation |
| Local and cloud Vector Store modes diverge silently | High | Surface mode and health state in one contract, then encode it in tests and docs |
| Memory planning drifts into backend replacement work | Medium | Keep the phase focused on contract, compatibility, health, and isolation |

## Deliverables

1. `26-CONTEXT.md` â€” this document.
2. `26-01-PLAN.md` â€” document and codify namespace rules plus compatibility-read behavior.
3. `26-02-PLAN.md` â€” add migration-safe handling for legacy and MarkOS-prefixed namespaces.
4. `26-03-PLAN.md` â€” expand health checks and failure reporting for local versus cloud vector backends.
5. `26-04-PLAN.md` â€” add multi-project isolation coverage or simulation around slug boundaries.

## Exit Criteria

Phase 26 is complete when the Vector Store memory layer has one explicit namespace contract, legacy collections remain discoverable through documented compatibility behavior, local and cloud operating modes are visible in health and failure reporting, and multi-project isolation is proven by tests or simulation instead of convention.

