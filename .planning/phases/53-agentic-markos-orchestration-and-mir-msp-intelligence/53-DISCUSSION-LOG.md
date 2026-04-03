# Phase 53: Agentic MarkOS Orchestration and MIR/MSP Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `53-CONTEXT.md`.

**Date:** 2026-04-03
**Phase:** 53-agentic-markos-orchestration-and-mir-msp-intelligence
**Mode:** Interactive (user-selected decisions)
**Areas discussed:** Run lifecycle contract, idempotency scope, approval gate boundaries, provider routing/failover, MIR/MSP regeneration rules, telemetry completeness

---

## Run Lifecycle Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Strict full state machine | `requested -> accepted -> context_loaded -> executing -> awaiting_approval -> approved/rejected -> completed/failed -> archived` | Yes |
| Simplified lifecycle | `requested -> executing -> completed/failed` with optional approval flag | |
| Hybrid lifecycle | Full machine only for high-impact workflows | |

**User's choice:** Strict full state machine
**Notes:** Aligns directly with AGT-02 success criteria and keeps approval transitions explicit for AGT-03.

---

## Idempotency Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Envelope + side-effect idempotency | Idempotency key required for run start and all mutating actions; duplicate delivery is no-op | Yes |
| Envelope only | Deduplicate run creation only; downstream mutation paths self-manage | |
| Best effort | Queue retry behavior only; no strict side-effect guarantees | |

**User's choice:** Envelope + side-effect idempotency
**Notes:** Required to satisfy AGT-02 duplicate-redelivery safety for plan mutations.

---

## Approval Gate Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| All externally visible high-impact mutations | Publish/approve/schedule and other irreversible tenant-visible actions require approval | Yes |
| Only publish actions | Narrow approval to publication only | |
| Workflow-specific opt-in | Each workflow may decide whether approval is required | |

**User's choice:** All externally visible high-impact mutations
**Notes:** Strongest fit for AGT-03 and IAM-03 auditability.

---

## Provider Routing and Failover

| Option | Description | Selected |
|--------|-------------|----------|
| Policy-routed primary + bounded fallback | Policy selects primary; timeout/rate/auth-class failures can fallback with capped attempts and reason-coded telemetry | Yes |
| Single provider fail-fast | No automatic fallback; caller handles retry/failover | |
| Always fallback chain | Iterate through all configured providers before failing | |

**User's choice:** Policy-routed primary + bounded fallback
**Notes:** Balances reliability with deterministic behavior and clear telemetry evidence.

---

## MIR/MSP Regeneration Trigger Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Critical Gate 1 and discipline-affecting edits only | Critical MIR edits and purchased-service-affecting changes require update report + append-only regeneration | Yes |
| Any edit | Every edit generates update report and regeneration chain step | |
| Manual only | Regeneration only when explicitly requested by operator | |

**User's choice:** Critical Gate 1 and discipline-affecting edits only
**Notes:** Meets MIR-03 requirements while limiting unnecessary regeneration churn.

---

## Telemetry Completeness Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Run-close required | No run can reach terminal state without complete model/prompt/tool/latency/cost/outcome record | Yes |
| Best-effort async | Run may complete while telemetry arrives later or partially | |
| Partial required | Only model, prompt, and outcome required at run close | |

**User's choice:** Run-close required
**Notes:** Directly enforces AGT-04 success criteria and supports downstream billing mapping.

---

## the agent's Discretion

- Planner may choose exact implementation modules and data-store schema if decision contracts remain unchanged.
- Planner may define bounded retry/fallback numbers via policy profiles.

## Deferred Ideas

- Billing-grade reconciliation UX and finance workflows (Phase 54).
- Extended enterprise identity/compliance capabilities beyond IAM-03 (Phase 54).
