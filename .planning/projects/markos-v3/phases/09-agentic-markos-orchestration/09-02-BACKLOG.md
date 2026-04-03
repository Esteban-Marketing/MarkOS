# Phase 09 Detailed Backlog

## Scope

Implements requirements: AGT-01, AGT-02, AGT-03, AGT-04, MIR-01, MIR-02, MIR-03, MIR-04, IAM-03.

## Workstream A: Agent runtime foundation

### A1. Run envelope schema and contracts
- Create run envelope contract with run_id, tenant_id, workspace_id, project_id, actor_id, workflow_id.
- Include model policy, prompt version, tool policy profile, and correlation_id.
- Dependency: Phase 07 tenant and auth baseline.
- Exit criteria: run creation fails when scope or policy metadata is missing.

### A2. Run state machine
- Implement deterministic lifecycle states: requested -> accepted -> context_loaded -> executing -> awaiting_approval -> approved/rejected -> completed/failed -> archived.
- Enforce legal transition matrix and terminal state protection.
- Dependency: A1.
- Exit criteria: illegal transitions are blocked and logged.

### A3. Idempotent run orchestration
- Add idempotency keys for retry-safe run start and side-effect operations.
- Guard against duplicate execution on queue redelivery.
- Dependency: A2.
- Exit criteria: duplicate triggers do not create duplicate plan mutations.

## Workstream B: Model/provider governance

### B1. Provider adapter abstraction
- Implement provider adapter interface and concrete provider connectors.
- Normalize token usage, latency, and error shape across providers.
- Dependency: A1.
- Exit criteria: workflow can switch provider without contract changes.

### B2. Policy-based model routing
- Route model selection by task class, risk profile, latency target, and budget.
- Support pinned model versions per workflow release.
- Dependency: B1.
- Exit criteria: routing decisions are deterministic and audit-visible.

### B3. Failover and degradation strategy
- Add failover path with bounded retries and fallback model policy.
- Block silent quality degradation via policy thresholds.
- Dependency: B2.
- Exit criteria: provider outage simulation preserves workflow continuity with explicit status events.

## Workstream C: MIR/MSP lifecycle and plan lineage

### C1. MIR Gate 1 initialization hardening
- Ensure Gate 1 entities initialize deterministically per project from onboarding and order data.
- Add validation for missing strategic inputs.
- Dependency: A1.
- Exit criteria: all required MIR entities exist before MSP planning starts.

### C2. MSP activation and discipline contracts
- Encode discipline activation rules from MIR + purchased services context.
- Store discipline-level activation evidence and rationale.
- Dependency: C1.
- Exit criteria: MSP discipline activation is explainable and traceable.

### C3. Versioned regeneration linkage
- Persist append-only plan versions and link regeneration to update_report_id and prior_version_id.
- Preserve rejected and superseded versions for forensics.
- Dependency: C2.
- Exit criteria: full lineage chain is queryable from initial draft to current approved version.

## Workstream D: Approval gates and safety controls

### D1. Policy-gated action classification
- Classify workflow actions by risk; mark high-impact actions as approval-required.
- Block execution for approval-required actions without reviewer decision.
- Dependency: A2, B2.
- Exit criteria: approval-required actions cannot execute in autonomous mode.

### D2. Reviewer workflow enforcement
- Integrate reviewer queue, decision capture, rejection rationale, and rework loop.
- Restrict approval capability to reviewer/manager/admin/owner roles.
- Dependency: D1, Phase 07 IAM enforcement.
- Exit criteria: unauthorized review actions are denied and logged.

### D3. Approval audit completeness
- Emit immutable events for submit, approve, reject, and regenerate transitions.
- Include actor_id, tenant_id, plan_id, decision payload, timestamp, and correlation_id.
- Dependency: D2.
- Exit criteria: approval timeline can be reconstructed without gaps.

## Workstream E: Tool policy and execution safety

### E1. Workflow tool allowlists
- Define tool allowlist by workflow type and role class.
- Enforce deny-by-default policy.
- Dependency: A2.
- Exit criteria: unauthorized tool calls are blocked and security-logged.

### E2. Compensating action framework
- Add compensating actions for partial side effects when runs fail after mutating operations.
- Track compensation outcomes as run events.
- Dependency: E1.
- Exit criteria: partial failures do not leave unrecoverable inconsistent state.

### E3. Timeout and retry governance
- Configure workflow-specific timeout and retry policies.
- Emit explicit reason codes on timeout, exhaustion, and cancellation.
- Dependency: A2.
- Exit criteria: long-running failures exit predictably with actionable diagnostics.

## Workstream F: Telemetry, cost, and release gating

### F1. Run telemetry and metering events
- Emit per-run metrics: token usage, model latency, tool latency, total runtime, cost estimate.
- Map events to billing metering pipeline.
- Dependency: B1, A2.
- Exit criteria: every run has complete telemetry and billing linkage.

### F2. Reliability and safety test suite
- Unit tests: state transitions, policy checks, routing logic.
- Integration tests: provider failover, approval gate enforcement, lineage persistence.
- Security negative tests: cross-tenant context misuse, policy bypass attempts.
- Dependency: all workstreams.
- Exit criteria: all mandatory tests pass for agent-critical paths.

### F3. Operational runbook and rollback
- Document rollback for workflow/prompt/model policy releases.
- Add incident playbook for provider outage, stuck queues, and approval deadlock.
- Dependency: F2.
- Exit criteria: operational team can execute rollback and recovery in staging drill.

## Definition of done for Phase 09

1. Agent runs are tenant-safe, deterministic, and auditable.
2. High-impact actions are approval-gated and role-enforced.
3. MIR/MSP and plan histories are append-only with full lineage.
4. Provider routing, failover, and telemetry satisfy governance requirements.
5. Reliability, security, and rollback evidence is complete.
