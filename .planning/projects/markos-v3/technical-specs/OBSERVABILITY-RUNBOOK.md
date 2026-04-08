# Technical Spec: Observability Runbook

## Objective

Provide actionable monitoring and incident handling for tenant-safe operations, queued execution safeguards, agent runtime behavior, and billing recovery.

## Canonical Closure Artifacts

- Unified subsystem inventory: `.planning/phases/57-observability-and-incident-closure/57-01-OBSERVABILITY-INVENTORY.md`
- Tenant-aware incident workflow: `.planning/phases/57-observability-and-incident-closure/57-02-INCIDENT-WORKFLOW.md`
- Deterministic incident simulation: `.planning/phases/57-observability-and-incident-closure/57-03-SIMULATION.md`

## SLO baseline

| Subsystem | Baseline | Source seam |
| --- | --- | --- |
| API rollout endpoints | `/submit` 99.5% availability, `/approve` 99.9%, `/linear/sync` 99.0%, `/campaign/result` 99.5% with endpoint-specific p95 targets | `onboarding/backend/agents/telemetry.cjs` `ROLLOUT_ENDPOINT_SLOS` |
| Queue-adjacent execution | Tenant-scoped background and queued execution must fail closed on missing tenant principal and must suppress duplicate delivery side effects | `onboarding/backend/provisioning/migration-runner.cjs`, `test/tenant-auth/tenant-background-job-propagation.test.js`, `test/agents/run-idempotency.test.js` |
| Agent runtime | Provider attempts and terminal run-close evidence must be recorded for every run | `onboarding/backend/agents/telemetry.cjs`, `test/agents/provider-policy-runtime.test.js`, `test/agents/run-close-telemetry.test.js` |
| Billing recovery | Failed sync, hold interval, release evidence, and restored active snapshots must remain visible to operator and tenant billing surfaces | `api/billing/holds.js`, `api/billing/tenant-summary.js`, `api/billing/operator-reconciliation.js`, `test/billing/provider-sync-failure.test.js` |

## Required telemetry

1. Structured runtime payloads with `tenant_id`, `request_id`, `correlation_id`, and redacted sensitive fields.
2. API rollout telemetry via `rollout_endpoint_observed` plus endpoint-tier SLO metadata.
3. Queue-adjacent execution evidence via migration principal enforcement, duplicate-delivery idempotency, and execution checkpoint events.
4. Agent runtime telemetry via `markos_agent_run_provider_attempt` and `markos_agent_run_close_completed`.
5. Billing lifecycle evidence via sync attempts, hold history, release events, and restored snapshots.
6. Security event stream for tenant-access denial and policy failures.

## Alerting priorities

P1:
- Cross-tenant leakage indicators or `markos_tenant_access_denied` anomalies that suggest policy drift.
- Billing recovery failures where hold evidence exists without same-period restoration.
- Approval or execution checkpoint bypass signals.

P2:
- Sustained agent provider-attempt failure rates or incomplete run-close payloads.
- Queue-adjacent execution failures: missing tenant principal, repeated duplicate delivery, or repeated `execution_failure` checkpoints.
- Elevated auth failures or denial spikes on hosted surfaces.

P3:
- Non-critical rollout endpoint latency degradation.
- Minor feature error spikes that do not threaten tenant safety or recovery visibility.

## Unified Observability Inventory

The canonical OPS-01 inventory lives in `.planning/phases/57-observability-and-incident-closure/57-01-OBSERVABILITY-INVENTORY.md`. Treat that artifact as the single requirement-facing map for API, queue-adjacent, agent, and billing monitoring proof.

## Tenant-Aware Incident Workflow

The canonical OPS-02 workflow lives in `.planning/phases/57-observability-and-incident-closure/57-02-INCIDENT-WORKFLOW.md` and is anchored to billing provider-sync failure.

Default operator sequence:

1. Detect the incident from a concrete MarkOS-owned signal.
2. Classify severity and identify impacted tenants and workflows.
3. Preserve evidence visibility while mitigation or rollback is in progress.
4. Communicate status to tenant and operator audiences on the documented cadence.
5. Verify recovery from release evidence and restored active state.
6. Record corrective actions and close the incident with the simulation-ready evidence chain.

## Evidence and reporting

- Incident identifier and severity
- Detection source and timestamps
- Impacted tenants and workflows
- Communication owner, audience, and cadence
- Mitigation or rollback actions
- Recovery criteria and restoration proof
- Root cause, contributing factors, and corrective action ownership
