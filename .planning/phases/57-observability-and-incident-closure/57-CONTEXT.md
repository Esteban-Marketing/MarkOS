# Phase 57: Observability and Incident Closure - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

## Boundary

Phase 57 closes the remaining MarkOS v3 operational evidence gaps for observability and incident response.

This phase owns:
- OPS-01
- OPS-02

This phase consumes:
- Phase 31 API SLO telemetry and rollout-hardening controls
- Phase 53 agent runtime and provider-attempt telemetry
- Phase 54 billing and governance evidence surfaces

## Why this phase exists

The repo already contains observability and runbook fragments, but the v3 package still lacks one unified closure chain for:

- API, queue, agent, and billing subsystem monitoring under a single OPS-01 story
- tenant-aware incident triage and communication workflow proof for OPS-02

## Objectives

1. Turn scattered subsystem telemetry into one coherent observability proof set.
2. Produce an explicit tenant-aware incident workflow that can be simulated and evidenced.
3. Bind OPS-01 and OPS-02 directly to executable or documented proof.

## Discuss-phase decisions locked on 2026-04-04

### 1. OPS-01 closure will use one subsystem observability inventory, not scattered telemetry mentions

Phase 57 should treat unified observability as an evidence-packaging problem first.

Locked implementation direction:
- Keep `onboarding/backend/agents/telemetry.cjs` and `lib/markos/telemetry/events.ts` as the canonical telemetry vocabulary seams.
- Build one requirement-facing observability inventory that names the live subsystem evidence sources for API, queue-adjacent execution, agent runtime, and billing recovery.
- The closure artifact may extend the runbook or create a directly linked phase artifact, but OPS-01 must be citeable from one named document instead of forcing reviewers to reconstruct the story from prior phases.

Minimum subsystem families that must be named:
- API: `ROLLOUT_ENDPOINT_SLOS` and `captureRolloutEndpointEvent()` for `/submit`, `/approve`, `/linear/sync`, and `/campaign/result`
- queue-adjacent execution: tenant-bound background migration execution plus duplicate queue redelivery protection and execution checkpoint telemetry
- agent runtime: provider-attempt and run-close telemetry from the orchestrator path
- billing: billing reconciliation, hold, release, and restored-state evidence from the billing APIs and reconciliation builders

### 2. Queue proof must stay honest about the current repo surface

The repo does not currently expose a separate durable queue platform with first-class backlog dashboards.

Locked proof direction:
- Phase 57 should model the queue requirement as the existing background and queued execution paths already present in MarkOS, not invent a new worker stack.
- The relevant proof seams are `onboarding/backend/provisioning/migration-runner.cjs`, the tenant-propagation contract tests, orchestrator idempotent redelivery handling, and execution checkpoint telemetry.
- If additional requirement-facing telemetry is needed, add it to the existing telemetry contract rather than introducing a parallel observability abstraction.

Important scope boundary:
- Do not claim infra signals that do not exist.
- Do not expand Phase 57 into a hosted queue service, worker autoscaling layer, or third-party monitoring deployment.

### 3. OPS-02 should close on a tenant-aware incident artifact anchored to billing degradation and protected execution

The strongest representative incident already present in the repo is a tenant-scoped billing reconciliation or provider-sync failure that degrades access, preserves evidence visibility, and later restores service.

Locked incident direction:
- Use a tenant-aware incident workflow that starts from a concrete MarkOS-owned detection signal and follows triage, impacted-tenant identification, mitigation or rollback, communication, and recovery verification.
- The primary tabletop or simulated incident should be anchored to the billing hold and release lifecycle because it already carries tenant scope, billing evidence, and runtime impact.
- The workflow must still explain how API and agent signals participate in incident classification, but Phase 57 should avoid generic outage prose detached from the current billing and execution architecture.

Minimum incident fields that must be explicit:
- incident identifier and severity
- impacted tenant or tenants
- impacted workflows or subsystem families
- detection source and timestamps
- mitigation or rollback path
- communication owner, audience, and update cadence
- recovery criteria and follow-up corrective actions

### 4. Simulation evidence should be documented and MarkOS-owned, not dependent on live paging infrastructure

Phase 57 does not need a real outage or external status-page integration to close OPS-02.

Locked evidence direction:
- A documented tabletop or deterministic simulation artifact is sufficient if it uses named repo evidence such as rollout endpoint telemetry, provider-attempt telemetry, billing lifecycle evidence, and tenant-aware deny or recovery states.
- The simulation should prove that an operator can identify the tenant impact, preserve evidence access, communicate status, and confirm restoration.
- Closure artifacts must reference the simulation directly rather than only updating the runbook prose.

### 5. Scope guardrails

This phase is not allowed to expand into:
- a new observability platform or dashboard product
- distributed tracing rollout across every subsystem
- external on-call, paging, or status-page integrations
- new queue infrastructure beyond the current background and orchestrator execution paths
- generic incident-management documentation unrelated to OPS-01 and OPS-02

The goal is direct requirement closure with honest subsystem inventory, a tenant-aware incident workflow, and one defensible simulation artifact.

## Open planning questions

- Should the unified OPS-01 inventory live directly inside `OBSERVABILITY-RUNBOOK.md`, or should the runbook link to a dedicated Phase 57 observability artifact?
- Does the current telemetry vocabulary need explicit subsystem-level helpers for billing reconciliation and background job health, or is the closure gap strictly packaging and evidence linkage?
- Is the billing reconciliation failure lifecycle enough as the primary OPS-02 simulation, or should planning add a second lighter-weight agent or approval incident scenario as supporting evidence?

## Canonical references

- `.planning/projects/markos-v3/CLOSURE-MATRIX.md`
- `.planning/projects/markos-v3/REQUIREMENTS.md`
- `.planning/projects/markos-v3/technical-specs/OBSERVABILITY-RUNBOOK.md`
- `.planning/phases/31-rollout-hardening/31-01-PLAN.md`
- `.planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-VERIFICATION.md`
- `.planning/phases/54-billing-metering-and-enterprise-governance/54-VERIFICATION.md`
- `api/billing/holds.js`
- `onboarding/backend/agents/telemetry.cjs`
- `onboarding/backend/provisioning/migration-runner.cjs`
- `lib/markos/telemetry/events.ts`
- `api/billing/operator-reconciliation.js`
- `test/tenant-auth/tenant-background-job-propagation.test.js`
- `test/agents/run-idempotency.test.js`

## Deliverables expected from this phase

- Unified observability inventory covering API, queue, agent, and billing paths.
- Tenant-aware incident runbook with triage, impact analysis, rollback/mitigation, and communication steps.
- Simulation or tabletop evidence proving the runbook is usable.
- Closure-matrix and verification updates for OPS-01 and OPS-02.
