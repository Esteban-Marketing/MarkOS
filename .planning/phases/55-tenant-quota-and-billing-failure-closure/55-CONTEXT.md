# Phase 55: Tenant Quota and Billing Failure Closure - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

## Boundary

Phase 55 closes the remaining product-control gaps identified in the MarkOS v3 closure matrix for tenant quota/rate-limit enforcement and billing-failure remediation.

This phase owns:
- TEN-04
- BIL-04

This phase consumes:
- Phase 51 tenant isolation and IAM foundations
- Phase 52 plugin enablement and tenant-scoped plugin routing
- Phase 53 agent execution policy surfaces
- Phase 54 entitlement snapshots, billing holds, reconciliation, and billing UX surfaces

## Why this phase exists

The current repo state already enforces entitlement-safe degradation, but the v3 package still lacks explicit closure for:

- tenant quota and per-plan rate-limit enforcement
- dunning workflow proof from billing failure through degraded state and recovery

## Objectives

1. Make plan-tier quota and rate-limit behavior explicit, testable, and requirement-mapped.
2. Make billing-failure handling auditable from hold placement through restoration.
3. Bind all new evidence directly to TEN-04 and BIL-04 in the closure matrix and verification artifacts.

## Discuss-phase decisions locked on 2026-04-03

### 1. Quota model direction

Phase 55 will treat TEN-04 as a hybrid plan-control problem rather than a single hard cap.

Locked product direction:
- Plan pricing should combine prepaid consumption with explicit project capacity.
- Consumption should be tied primarily to token usage and secondarily to agent-run volume.
- Project count remains a first-class plan allowance and a requirement-facing control, not just an internal metric.

Implementation guidance for research and planning:
- Use `allowances.projects` as the hard capacity control for project creation or expansion paths.
- Use `allowances.token_budget` versus `usage_to_date.token_budget` as the primary prepaid consumption budget.
- Keep `agent_runs` as an explicit tracked allowance and enforcement seam, but treat it as a supporting control unless research shows it should become the dominant prepaid limiter.

### 2. Over-limit behavior

When a tenant is over limit, MarkOS should preserve:
- read surfaces
- evidence and invoice visibility
- billing and settings surfaces required for recovery

MarkOS should block:
- protected write actions
- protected execution actions
- premium plugin capabilities that depend on prepaid consumption headroom

This means Phase 55 should extend the current read-safe degradation model into an admin-recoverable over-limit model, rather than a full lockout model.

### 3. Billing failure recovery

Billing-failure holds should restore automatically after successful provider sync.

Guardrail:
- Recovery must still be explicit and auditable in evidence surfaces.
- Automatic restore should not be silent; the hold lifecycle must show failure, degraded or held interval, and restoration event.

### 4. Pricing and margin guidance

Current repository fixture prices are contract placeholders and must not be treated as market-ready public pricing.

Pricing direction locked for downstream research:
- Tie plan economics to a blended gross-margin target of roughly 80% to 90%, not raw pass-through billing.
- Treat project count as the structural platform fee component.
- Treat prepaid token budget as the primary consumption reserve.
- Treat agent-run volume as a supporting fairness or abuse guardrail and possible secondary overage dimension.

Research requirement:
- Derive exact Starter, Growth, and Enterprise quotas from actual provider cost assumptions and observed run shapes before public pricing or overage math is finalized.
- Do not reuse the sample `agent_run.base` fixture value as the customer-facing pricing anchor.

Suggested planning baseline:
- Starter: low project allowance, modest prepaid token budget, strict execution ceiling.
- Growth: higher project allowance, materially larger prepaid token budget, normal production agent usage.
- Enterprise: negotiated project allowance, negotiated prepaid budget, custom overage or top-up policy.

### 5. What Phase 55 must prove

To close TEN-04 and BIL-04, the phase must leave named evidence for:
- project-cap enforcement
- prepaid token-budget exhaustion semantics
- agent or plugin denial semantics under over-limit conditions
- automatic but auditable restoration after provider recovery

## Open research questions for planning

- Which action family should consume the first explicit prepaid budget: all agent executions, only token-producing executions, or both with different evidence rules?
- Should project-cap exhaustion block only new project creation, or also project reactivation or duplication flows?
- Should over-limit recovery be immediate on first successful sync, or only after a stable success window is recorded?
- What exact internal cost reserve per project is needed to maintain the chosen margin target across Starter, Growth, and Enterprise plans?

## Canonical references

- `.planning/projects/markos-v3/CLOSURE-MATRIX.md`
- `.planning/projects/markos-v3/REQUIREMENTS.md`
- `.planning/projects/markos-v3/technical-specs/BILLING-METERING.md`
- `.planning/phases/51-multi-tenant-foundation-and-authorization/51-VERIFICATION.md`
- `.planning/phases/52-plugin-runtime-and-digital-agency-plugin-v1/52-VERIFICATION.md`
- `.planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-VERIFICATION.md`
- `.planning/phases/54-billing-metering-and-enterprise-governance/54-VERIFICATION.md`
- `lib/markos/billing/entitlements.cjs`
- `lib/markos/billing/reconciliation.cjs`
- `api/billing/holds.js`
- `api/tenant-plugin-settings.js`
- `onboarding/backend/agents/orchestrator.cjs`

## Deliverables expected from this phase

- Requirement-specific quota and rate-limit contract.
- Automated proof for tenant limit exhaustion across protected actions.
- Explicit dunning workflow evidence from failure to recovery.
- Verification ledger updates promoting TEN-04 and BIL-04 when closure is complete.