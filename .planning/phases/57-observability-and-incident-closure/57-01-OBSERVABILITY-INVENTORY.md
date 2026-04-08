---
phase: 57-observability-and-incident-closure
artifact: observability-inventory
completed: 2026-04-04
verification_status: pass
---

# Phase 57 Unified Observability Inventory

## OPS-01 Closure Position

OPS-01 closes from one direct observability artifact that names the MarkOS subsystem families, the live evidence seam for each family, how operators interpret those signals, and which regression proof guards the contract.

## Subsystem Inventory

| Subsystem | Detection seam | Evidence surface | Operator interpretation | Validation proof |
| --- | --- | --- | --- | --- |
| API rollout endpoints | `onboarding/backend/agents/telemetry.cjs` `ROLLOUT_ENDPOINT_SLOS` and `captureRolloutEndpointEvent()` | `rollout_endpoint_observed` for `/submit`, `/approve`, `/linear/sync`, and `/campaign/result` with endpoint tier, target availability, and p95 metadata | Confirms rollout-critical endpoints remain SLO-backed and makes endpoint regressions attributable to a named route family rather than generic server failure | `node --test test/onboarding-server.test.js` |
| Queue-adjacent execution | `onboarding/backend/provisioning/migration-runner.cjs` tenant-principal guard plus orchestrator idempotent redelivery handling | Missing-tenant failure path, duplicate-delivery suppression, and execution checkpoint events such as `execution_readiness_blocked`, `execution_failure`, and `execution_loop_completed` | Confirms MarkOS queue proof is honest: tenant-safe background execution and idempotent queued delivery, not a fictional worker fleet or backlog dashboard | `node --test test/tenant-auth/tenant-background-job-propagation.test.js test/agents/run-idempotency.test.js` |
| Agent runtime | `onboarding/backend/agents/telemetry.cjs` `captureProviderAttempt()` and `captureRunClose()` | `markos_agent_run_provider_attempt`, `markos_agent_run_close_completed`, and incomplete-close rejection evidence | Confirms provider fallback, terminal outcome, tool-event capture, latency, and cost evidence stay intact for every agent run | `node --test test/agents/provider-policy-runtime.test.js test/agents/run-close-telemetry.test.js` |
| Billing recovery | `lib/markos/billing/provider-sync.cjs`, `lib/markos/billing/reconciliation.cjs`, and billing API surfaces | Failed sync attempts, hold history, release events, current snapshots, restored snapshots, and incident context emitted by `api/billing/holds.js`, `api/billing/tenant-summary.js`, and `api/billing/operator-reconciliation.js` | Confirms billing observability is part of the operations control family: operators can see degradation, tenant impact, same-period restoration, and the exact evidence chain without reconstructing Phase 55 manually | `node --test test/billing/provider-sync-failure.test.js` |

## Canonical Telemetry Vocabulary

- API: `rollout_endpoint_observed`
- Queue-adjacent execution: `approval_completed`, `execution_readiness_ready`, `execution_readiness_blocked`, `execution_failure`, `execution_loop_completed`, `execution_loop_abandoned`
- Agent runtime: `markos_agent_run_provider_attempt`, `markos_agent_run_close_completed`, `markos_agent_run_close_incomplete`
- Security support: `markos_tenant_access_denied`
- Billing lifecycle evidence: sync attempts, hold history, release events, and restored snapshots built from `buildBillingLifecycleEvidence()`

## Honest Queue Boundary

MarkOS does not currently expose a standalone durable queue platform with backlog dashboards or worker-fleet metrics. The queue requirement is satisfied by the current background and queued execution model:

1. Background migration execution fails closed without tenant principal context.
2. Duplicate queue delivery is suppressed through idempotent run envelopes and side-effect recording.
3. Execution checkpoints provide the named runtime signals operators use to interpret readiness, failure, and completion.

## Direct Evidence Map

- API monitoring: `onboarding/backend/agents/telemetry.cjs`, `test/onboarding-server.test.js`
- Queue-adjacent execution: `onboarding/backend/provisioning/migration-runner.cjs`, `test/tenant-auth/tenant-background-job-propagation.test.js`, `test/agents/run-idempotency.test.js`
- Agent runtime: `onboarding/backend/agents/telemetry.cjs`, `lib/markos/telemetry/events.ts`, `test/agents/provider-policy-runtime.test.js`, `test/agents/run-close-telemetry.test.js`
- Billing monitoring: `api/billing/holds.js`, `api/billing/tenant-summary.js`, `api/billing/operator-reconciliation.js`, `test/billing/provider-sync-failure.test.js`

## Requirement Closure

OPS-01 now has one direct artifact that explains API, queue-adjacent, agent, and billing monitoring without requiring the reviewer to reconstruct the control family from earlier phases.
