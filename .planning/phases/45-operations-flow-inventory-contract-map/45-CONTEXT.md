# Phase 45: Operations Flow Inventory & Canonical Contract Map - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit all production MarkOS flows, create a canonical flow registry, and establish API contract mapping as the foundation for Phases 46-50. This phase defines and verifies inventory/contracts only; it does not implement operator UI execution features, contract test gates, or hardening controls from later phases.

</domain>

<decisions>
## Implementation Decisions

### Flow Classification Model
- **D-01:** Use a hybrid classification model: `domain + flow_type` (not single-axis only).
- **D-02:** Lock controlled enums for Phase 45 to prevent taxonomy drift.
- **D-03:** Treat unknown/novel labels as invalid in CI until explicitly approved.

### Flow Granularity
- **D-04:** Use hybrid journey-level grouping as the canonical registry unit.
- **D-05:** Every journey node must map to concrete endpoint IDs/handlers to preserve technical traceability.
- **D-06:** Constrain journey size to practical planning bounds (target 3-12 steps per journey) to avoid function-level micro-mapping.

### Contract Schema Format
- **D-07:** OpenAPI 3.0 is the canonical contract artifact format for Phase 45 and onward.
- **D-08:** Do not introduce a parallel custom contract system in Phase 45.
- **D-09:** For non-HTTP/internal semantics, use extension fields and defer full async/event-contract formalization to later phases.

### Flow Verification Method
- **D-10:** Use a hybrid verification path: automated extraction + manual semantic review + CI validation.
- **D-11:** Extraction is coverage-oriented and read-only; it must not mutate runtime behavior.
- **D-12:** First baseline requires explicit reviewer sign-off before CI enforcement is treated as stable.

### Baseline KPI Capture Method
- **D-13:** Baseline source is instrumentation plus fixed aggregate window (not single-run manual timing or rough estimates).
- **D-14:** Capture T0 metrics using existing telemetry channels; no new analytics platform rollout in Phase 45.
- **D-15:** Freeze the baseline only after explicit sign-off and outlier handling is applied.

### Scope Guardrails (Locked)
- **D-16:** No taxonomy expansion beyond initial controlled enum set in this phase.
- **D-17:** No full event-contract framework migration in this phase.
- **D-18:** No autonomous verification-only gate without human review in this phase.
- **D-19:** No scope pull-in from Phases 46-50 (UI execution, full contract CI gate, RBAC hardening, onboarding wizard).

### the agent's Discretion
- Extraction script architecture and parser layout, as long as it stays read-only.
- Exact naming convention details for enum constants and report sections.
- Reviewer workflow mechanics (checklist format, approval metadata fields).
- KPI aggregation query implementation details, provided metric definitions remain unchanged.

</decisions>

<specifics>
## Specific Ideas

- Classification should be operator-meaningful first (domain), with operational behavior layering (type).
- Registry should be readable by operators and directly consumable by engineers/planners through endpoint mappings.
- "Robust by default" means CI-enforceable rules with human governance, not fully manual or fully autonomous extremes.
- Baseline quality is critical: Phase 50 success comparison must be auditable against a credible T0 window.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Phase Contracts
- `.planning/v3.1.0-ROADMAP.md` — Phase 45 goal, deliverables, dependencies, and required success criteria.
- `.planning/REQUIREMENTS.md` — API-01 and partial API-02 mapping, KPI baseline definitions, and scope boundaries.
- `.planning/MILESTONE-CONTEXT.md` — Milestone north star, accepted scope, and risk controls.

### Runtime Surface Inventory Inputs
- `onboarding/backend/server.cjs` — Canonical local backend route wiring for submit/approve/status/regenerate/linear/campaign/literacy/admin flows.
- `api/submit.js` — API wrapper/runtime entry for submit flow.
- `api/approve.js` — API wrapper/runtime entry for approve flow.
- `api/status.js` — API wrapper/runtime entry for status and readiness telemetry surface.
- `api/regenerate.js` — API wrapper/runtime entry for regenerate flow.
- `api/migrate.js` — API wrapper/runtime entry for migration flow.
- `api/linear/sync.js` — Linear sync endpoint contract surface.
- `api/campaign/result.js` — Campaign result endpoint contract surface.
- `api/literacy/coverage.js` — Literacy coverage surface relevant to reporting/admin flow inventory.

### Prior Contract/Architecture Baselines
- `.planning/phases/37-markos-ui-control-plane/37-01-SUMMARY.md` — RBAC/telemetry/data-model baseline referenced by later phases.
- `.planning/phases/44-end-to-end-literacy-integration-verification/44-VERIFICATION.md` — Latest lifecycle verification baseline and regression guard expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `onboarding/backend/server.cjs`: Central route map for local runtime; strongest starting source for flow discovery.
- `onboarding/backend/handlers.cjs`: Consolidated handler layer for business flow operations.
- `onboarding/backend/runtime-context.cjs`: Runtime mode/context handling useful for classifying local vs hosted behavior.
- `onboarding/backend/vector-store-client.cjs`: Readiness/health surfaces relevant to reporting/admin flow categorization.

### Established Patterns
- Dual entrypoint model exists (local onboarding server + `api/*` wrappers).
- Endpoint surfaces already split across onboarding, admin, literacy, migration, and campaign/linear flows.
- Existing tests emphasize contract-like assertions and regression gates; Phase 45 should align with this posture.

### Integration Points
- Flow extraction should cover both `onboarding/backend/server.cjs` route map and `api/*` wrappers.
- Canonical flow IDs should be reused downstream by OpenAPI generation (Phase 47) and contract tests (Phase 48).
- KPI baseline capture must align with telemetry fields already used for activation/readiness reporting.

</code_context>

<deferred>
## Deferred Ideas

- OpenAPI 3.1 migration and advanced async/event contract model.
- Fully autonomous flow verification without reviewer checkpoint.
- Expanded taxonomy beyond locked enum set for Phase 45.
- New analytics vendor/platform rollout for KPI baseline instrumentation.

</deferred>

---

*Phase: 45-operations-flow-inventory-contract-map*
*Context gathered: 2026-04-02*
