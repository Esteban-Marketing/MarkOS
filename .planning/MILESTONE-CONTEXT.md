# Milestone Context - v3.1.0+ (Discussed)

Date: 2026-04-02
Source: /gsd:discuss-milestone seed
Status: Ready for /gsd-new-milestone consumption

## Proposed Milestone

- Version: v3.1.0
- Working Name: Operator Surface Unification

## Product North Star

Unify marketing, sales, and customer communications execution in one operational surface with auditable workflows and measurable activation outcomes.

## Objectives (Locked)

1. Integrated Task UI Flow for non-technical operators
2. Complete API coverage for all MarkOS operational flows
3. Platform hardening, upgrade safety, and operator enablement

## In Scope (Locked)

### 1) Integrated Task UI Flow (Operator GUI)

- Live task graph with current state and execution path visibility
- Step-by-step action runner with explicit state transitions
- Embedded approval points (human checkpoints) and retry controls
- Evidence panel per step (inputs, outputs, logs, timestamps, actor)
- Protocol-linked guardrails surfaced inline before risky actions

### 2) Complete API Coverage

- Full flow inventory mapped to explicit API contracts
- Contract versioning strategy and compatibility policy
- OpenAPI generation for all public/operational endpoints
- Contract tests to assert request/response shape and lifecycle behavior
- Backward compatibility guarantees with clear deprecation windows

### 3) Hardening + Upgrade + Enablement

- Role-based operations UI (permissions visible in-product)
- Migration assistants and preflight checks
- Health diagnostics surface for operator and admin views
- Rollback safety mechanisms for migrations and flow changes
- Guided onboarding for operators (first-run and recovery flows)

## Out of Scope (for this milestone)

- Net-new channel strategy or campaign framework redesign
- Major MIR/MSP schema redesign unrelated to execution surface
- Replacing existing vector providers or rewriting storage architecture
- Full rebrand-only work with no operational impact

## Milestone Acceptance Criteria

1. Operators can execute an end-to-end task chain from UI with approvals, retries, and evidence capture.
2. Every production MarkOS flow is represented by a versioned API contract and included in OpenAPI output.
3. Contract test suite enforces API compatibility and catches breaking changes in CI.
4. Role-based access in the operations surface is enforced and test-covered.
5. Upgrade and migration flows have diagnostics, preflight checks, and rollback-safe execution paths.
6. Operator onboarding path is documented and executable without direct engineering intervention.

## Measurable Outcomes (Initial Targets)

- Flow Contract Coverage: 100% of active MarkOS flows mapped to contracts
- OpenAPI Coverage: 100% of contract-owned endpoints documented
- Contract Test Gate: required CI check, no unapproved breaking changes
- Task Evidence Completeness: >= 95% of executed task steps contain evidence payloads
- Operator Activation: reduced time-to-first-successful-flow (baseline to be captured at milestone start)

## Recommended Phase Frame (Draft)

Use these as candidate phases for roadmap synthesis:

1. Phase 45 - Operations flow inventory and canonical contract map
2. Phase 46 - Operator task graph UI with approvals, retries, and evidence panel
3. Phase 47 - OpenAPI generation pipeline + compatibility/version policy
4. Phase 48 - Contract testing framework and CI compatibility gates
5. Phase 49 - Hardening layer (RBAC ops UI, diagnostics, migration assistants, rollback safety)
6. Phase 50 - Guided operator onboarding + end-to-end activation verification

## Key Risks

- Scope explosion from trying to ship all UX and API parity in one pass
- Inconsistent contract ownership across legacy handlers/routes
- Hidden operational edge cases in migration and rollback workflows
- UI complexity for non-technical operators if evidence and guardrail surfaces are overloaded

## Risk Controls

- Freeze a canonical flow registry before UI/API implementation starts
- Treat contracts as source-of-truth and generate docs/tests from contract artifacts
- Introduce staged compatibility policies (warn -> deprecate -> remove)
- Apply operator-first UX reviews focused on clarity and error recovery

## Dependencies

- v3.0 literacy lifecycle baseline remains green in CI
- Existing RBAC and telemetry contracts from phases 37-38 are reused, not bypassed
- Migration runner and diagnostics surfaces from prior phases are extended, not forked

## Open Questions (To confirm at /gsd-new-milestone)

1. Should v3.1.0 include external API consumers, or remain internal/operator-first?
2. What is the exact compatibility window (for example, 1 minor version overlap)?
3. Which operator personas are priority for onboarding (admin, strategist, coordinator)?
4. What baseline metric should define activation success for milestone closeout?

## Next Command

/gsd-new-milestone v3.1.0 Operator Surface Unification