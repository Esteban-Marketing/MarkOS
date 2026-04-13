# Phase 89: Runtime Governance Wiring and Closure Emission - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Close governance runtime integration gaps by wiring telemetry capture and closure-bundle emission into live role-view and milestone-closeout paths. This phase hardens runtime wiring and closure evidence emission only; it does not add net-new product capabilities.

</domain>

<decisions>
## Implementation Decisions

### Closure Trigger Surface
- **D-01:** Closure bundle emission stays additive to existing governance runtime flow; no new public route is introduced.
- **D-02:** Trigger ownership is system-actor after verification gates pass, not user-triggered by default.
- **D-03:** Manual recovery may exist later, but the baseline path is automated runtime emission after successful verification.

### Persistence and Auditability
- **D-04:** Closure bundle persistence is dual-write: durable disk artifact plus Supabase governance persistence.
- **D-05:** Runtime responses should include deterministic closure bundle references (hash and locator), not only in-memory payloads.
- **D-06:** Closure records must remain queryable for milestone audit traceability and post-closeout forensics.

### Governance Telemetry Wiring
- **D-07:** Governance telemetry must be runtime-invoked from live role-view/retrieval and closure paths, not test-only helper surfaces.
- **D-08:** Telemetry payloads remain schema-normalized through the existing governance normalization contract.
- **D-09:** Missing/invalid telemetry required fields should fail governance wiring checks for closure readiness.

### Carry-Forward Constraints
- **D-10:** Preserve Phase 78 additive-governance integration pattern (no standalone public governance route for closure operations).
- **D-11:** Preserve Phase 88 strict non-regression posture; closure remains blocked when governance verification requirements are not met.

### the agent's Discretion
- Exact module split for runtime wiring (handler boundary vs delegated service modules) as long as D-01 through D-11 are preserved.
- Exact storage schema/table names for Supabase persistence.
- File naming and folder structure for closure bundle disk artifacts.

</decisions>

<specifics>
## Specific Ideas

- Chosen strategy is explicit: additive existing governance flow + system-actor trigger + dual-write persistence (disk and Supabase).
- Phase should prioritize auditable closure determinism over convenience surfaces.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Audit Inputs
- `.planning/ROADMAP.md` - Phase 89 scope, dependency, and requirement mapping.
- `.planning/REQUIREMENTS.md` - GOVV-02, GOVV-03, GOVV-05 pending closure requirements.
- `.planning/PROJECT.md` - milestone strategy and non-regression intent.
- `.planning/STATE.md` - current milestone state and sequencing context.
- `.planning/v3.5.0-MILESTONE-AUDIT.md` - critical integration/flow findings that Phase 89 must close.

### Prior Locked Governance Context
- `.planning/phases/78-branding-governance-publish-or-rollback-and-closure-gates/78-CONTEXT.md` - additive governance and closure-gate baseline decisions.
- `.planning/phases/87-dual-role-views-operator-agent/87-CONTEXT.md` - role-view and unified lineage baseline.
- `.planning/phases/88-governance-verification-and-milestone-closure/88-CONTEXT.md` - strict telemetry and closure evidence posture.

### Runtime Surfaces to Wire
- `onboarding/backend/handlers.cjs` - live role-view handlers and governance integration surfaces.
- `onboarding/backend/vault/vault-retriever.cjs` - runtime retrieval path where agent events are emitted.
- `onboarding/backend/agents/telemetry.cjs` - governance telemetry capture and normalization entrypoint.
- `onboarding/backend/brand-governance/governance-artifact-writer.cjs` - closure bundle writer and mandatory section contract.
- `onboarding/backend/brand-governance/closure-gates.cjs` - non-regression and gate evaluation baseline.
- `api/governance/evidence.js` - existing governance API style and authorization pattern reference.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `captureGovernanceEvent` already exists in telemetry module and normalizes governance payloads.
- `writeMilestoneClosureBundle` exists with mandatory section enforcement and deterministic bundle hashing.
- Role-view runtime handlers already route reason/apply/iterate and operator management paths.

### Established Patterns
- Additive governance integration in existing runtime handlers.
- Fail-closed checks before protected operations.
- Deterministic hash-first evidence contracts in governance writers.

### Integration Points
- Wire governance telemetry invocation from role-view/retrieval runtime paths.
- Wire closure bundle emission into existing governance closeout path with system-actor trigger.
- Persist closure artifacts to both disk and Supabase with references returned to runtime callers.

</code_context>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 89-runtime-governance-wiring-and-closure-emission*
*Context gathered: 2026-04-13*
