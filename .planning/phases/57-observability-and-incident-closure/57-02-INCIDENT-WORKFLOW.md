---
phase: 57-observability-and-incident-closure
artifact: incident-workflow
completed: 2026-04-04
verification_status: pass
---

# Phase 57 Tenant-Aware Incident Workflow

## OPS-02 Closure Position

OPS-02 closes through one tenant-aware incident workflow anchored to the existing billing provider-sync failure lifecycle. The workflow names the detection source, impacted tenants and workflows, communication ownership, mitigation path, and recovery criteria explicitly.

## Primary Incident Scenario

- Incident identifier: `INC-BILLING-SYNC-2026-04-03-001`
- Severity: `SEV-2`
- Detection source: `billing_provider_sync_attempt_failed`
- Primary tenant scope: `tenant-alpha-001`
- Impacted workflows: `execute_task`, `premium_plugin_actions`, `billing_reconciliation_review`
- Communication owner: `billing-admin`
- Communication audiences: tenant billing admins and operator billing admins
- Communication cadence: initial triage update, mitigation update if the hold persists, restoration confirmation after release evidence is recorded

## Workflow

| Step | Required action | MarkOS-owned evidence |
| --- | --- | --- |
| Detect | Identify the failed same-period provider sync and open incident record | `api/billing/operator-reconciliation.js` `incident_context`, `sync_failures`, and `reconciliation_items` |
| Classify | Confirm severity, impacted tenant, and impacted workflows | `incident_context` from `api/billing/operator-reconciliation.js`, tenant-facing `incident_context` from `api/billing/tenant-summary.js` |
| Preserve access | Keep billing, settings, invoice, and evidence rails visible while protected execution remains paused | `api/billing/tenant-summary.js` `current_snapshot`, `recovery_evidence`, and `incident_context` |
| Mitigate | Preserve hold state until the next same-period successful sync restores the tenant | `api/billing/holds.js` `hold_events`, `current_hold`, and `incident_context` |
| Communicate | Notify tenant and operator billing audiences with incident id, impacted workflows, and expected recovery condition | `incident_context.communication_owner`, `incident_context.communication_audiences`, and `incident_context.communication_cadence` across billing evidence APIs |
| Verify recovery | Confirm release evidence and restored active status before closing incident | `api/billing/holds.js` `release_event` and `restored_snapshot`; `api/billing/tenant-summary.js` `recovery_evidence.restored_active_snapshot`; `api/billing/operator-reconciliation.js` `release_events` and `active_snapshots` |
| Follow up | Record corrective actions and preserve the simulation-ready evidence chain | `.planning/phases/57-observability-and-incident-closure/57-03-SIMULATION.md` |

## Recovery Criteria

The incident is not closed until all of the following are true:

1. A same-period provider sync succeeds.
2. Hold-release evidence is recorded.
3. Tenant-facing and operator-facing billing surfaces show restored active state.
4. Impacted workflows are documented as restored.
5. Follow-up action ownership is recorded in the simulation artifact.

## Evidence Surfaces

- Tenant-visible degraded and restored state: `api/billing/tenant-summary.js`
- Operator triage, tenant scope, and reconciliation review: `api/billing/operator-reconciliation.js`
- Hold-open, release, and restored snapshot chain: `api/billing/holds.js`

## Requirement Closure

OPS-02 now has a concrete tenant-aware incident workflow that can be cited directly from the runbook and the phase artifact without relying on generic incident-response prose.
