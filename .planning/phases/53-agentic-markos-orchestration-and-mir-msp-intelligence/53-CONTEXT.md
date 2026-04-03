# Phase 53: Agentic MarkOS Orchestration and MIR/MSP Intelligence - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 53 delivers tenant-bound agent orchestration and MIR/MSP intelligence contracts for MarkOS v3.2: deterministic run lifecycle and idempotency, policy-routed provider failover, approval-gated high-impact actions, run-close telemetry completeness, and append-only MIR/MSP regeneration lineage.

This phase owns AGT-01, AGT-02, AGT-03, AGT-04, MIR-01, MIR-02, MIR-03, MIR-04, and IAM-03.

This phase does not own tenant identity and baseline IAM model rollout (Phase 51), plugin runtime and Digital Agency packaging (Phase 52), or billing/compliance enterprise readiness (Phase 54).

</domain>

<decisions>
## Implementation Decisions

### Run Lifecycle Contract and Idempotency
- **D-01:** Use the full canonical AGT-02 state machine for all agent runs: `requested -> accepted -> context_loaded -> executing -> awaiting_approval -> approved/rejected -> completed/failed -> archived`.
- **D-02:** Enforce strict transition validation; illegal transitions must be blocked and audit-logged.
- **D-03:** Require idempotency at both envelope and side-effect layers: duplicate delivery may not create duplicate plan mutations or duplicate externally visible actions.

### Approval Gate Boundaries and IAM Enforcement
- **D-04:** All externally visible high-impact mutations must pause at `awaiting_approval` and resume only via explicit authorized `approved` or `rejected` action.
- **D-05:** Approval/rejection actions are restricted to IAM-03 reviewer-authorized roles (`plan:approve` capability) and must be immutable once written.
- **D-06:** Non-authorized approval attempts are deny-logged as security events with actor, tenant, action, and correlation id.

### Provider Routing and Failover Policy
- **D-07:** Provider selection is policy-routed (per-tenant/per-run profile), with a designated primary provider.
- **D-08:** Automatic fallback is bounded and reason-coded: fallback is allowed for timeout/rate/auth-class failures with capped retry/fallback attempts and explicit terminal failure when budget is exhausted.
- **D-09:** Every provider attempt and failover decision must be captured in run telemetry as structured tool/provider events.

### MIR/MSP Activation and Regeneration Rules
- **D-10:** MIR Gate 1 completeness is a hard precondition for MSP activation (MIR-01 -> MIR-02); activation attempts before completeness are blocked.
- **D-11:** Discipline activation must derive from MIR + purchased-service context and persist explainable rationale/evidence per discipline.
- **D-12:** Regeneration/versioned update reports are mandatory for critical Gate 1 and discipline-affecting edits; each accepted edit writes an append-only regeneration record with rationale and dependency impact.
- **D-13:** Historical plan/version chains remain append-only and queryable by tenant/date range; deletion/mutation of prior versions is blocked.

### Telemetry and Metering Granularity
- **D-14:** No run may enter terminal `completed` or `failed` state without a complete run-close telemetry record containing model, prompt version, tool events, latency, cost, and outcome (AGT-04).
- **D-15:** Telemetry granularity must include run-level summary plus step/provider attempt events so downstream BIL-02 metering can map cost deterministically.

### the agent's Discretion
- The planner/researcher may choose exact queue/storage schema and module boundaries as long as lifecycle, idempotency, and approval contracts remain intact.
- The planner/researcher may tune retry/fallback thresholds by policy profile if bounded behavior and full telemetry evidence are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Scope Contracts
- `.planning/ROADMAP.md` - Phase 53 boundary and requirement mapping
- `.planning/REQUIREMENTS.md` - AGT/MIR/IAM-03 requirement definitions and acceptance criteria
- `.planning/PROJECT.md` - milestone-level constraints and scope expectations
- `.planning/STATE.md` - active milestone/state contract

### Runtime, Auth, and Telemetry Surfaces
- `onboarding/backend/runtime-context.cjs` - hosted auth and tenant context boundary
- `onboarding/backend/agents/orchestrator.cjs` - existing orchestrator baseline to evolve into deterministic run lifecycle
- `onboarding/backend/agents/llm-adapter.cjs` - provider abstraction and adapter behavior baseline
- `onboarding/backend/agents/telemetry.cjs` - run instrumentation baseline
- `lib/markos/telemetry/events.ts` - telemetry event envelope and sanitization contracts
- `lib/markos/rbac/policies.ts` - role/permission policy baseline for IAM-03 approval enforcement

### MIR/MSP and Planning Lineage Surfaces
- `onboarding/backend/write-mir.cjs` - MIR write lifecycle and persistence touchpoint
- `onboarding/backend/literacy/discipline-selection.cjs` - discipline activation baseline logic
- `onboarding/backend/literacy/activation-readiness.cjs` - readiness checks for discipline activation
- `onboarding/backend/markosdb-contracts.cjs` - persistence contract anchors for append-only lineage

### Phase Dependencies
- `.planning/phases/51-multi-tenant-foundation-and-authorization/51-CONTEXT.md` - tenant/IAM contracts that Phase 53 must enforce
- `.planning/phases/52-plugin-runtime-and-digital-agency-plugin-v1/52-CONTEXT.md` - plugin telemetry and policy-hook integration assumptions
- `.planning/phases/52-plugin-runtime-and-digital-agency-plugin-v1/52-01-SUMMARY.md` - delivered plugin runtime surfaces available to Phase 53

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `onboarding/backend/agents/orchestrator.cjs` and `onboarding/backend/agents/llm-adapter.cjs` provide a practical seed for policy-routed execution and provider abstraction.
- `onboarding/backend/agents/telemetry.cjs` plus `lib/markos/telemetry/events.ts` offer existing event-shaping patterns to enforce AGT-04 run-close completeness.
- `onboarding/backend/runtime-context.cjs` and `lib/markos/rbac/policies.ts` provide established enforcement boundaries for tenant scoping and approval authorization.
- MIR/MSP modules under `onboarding/backend/write-mir.cjs` and `onboarding/backend/literacy/` are the natural integration points for MIR-01 through MIR-04 contracts.

### Established Patterns
- Hosted wrappers and runtime context resolution are fail-closed by default and should remain the authoritative boundary.
- Audit and telemetry payload sanitization is centralized and should be reused for run/approval decision logging.
- Requirement-driven validation and deterministic denial semantics are favored over implicit fallback behavior.

### Integration Points
- Agent orchestration modules: `onboarding/backend/agents/*`.
- Approval and role enforcement: `lib/markos/rbac/policies.ts` + protected API/handler surfaces.
- MIR/MSP persistence and activation: `onboarding/backend/write-mir.cjs`, `onboarding/backend/literacy/*`, and persistence contracts.

</code_context>

<specifics>
## Specific Ideas

- Treat `awaiting_approval` as a first-class state, not a side flag, to keep AGT-02/AGT-03 behavior testable.
- Record provider failover causes in normalized reason codes to support diagnostics and metering reconciliation.
- Make regeneration records append-only with explicit parent version references to satisfy MIR-04 history requirements.

</specifics>

<deferred>
## Deferred Ideas

- Billing policy optimization and invoice-grade cost reconciliation UX (Phase 54, BIL series).
- Enterprise compliance packaging and SSO/identity governance extensions beyond IAM-03 (Phase 54).

</deferred>

---

*Phase: 53-agentic-markos-orchestration-and-mir-msp-intelligence*
*Context gathered: 2026-04-03*
