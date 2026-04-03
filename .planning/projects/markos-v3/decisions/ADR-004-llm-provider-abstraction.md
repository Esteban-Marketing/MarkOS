# ADR-004: LLM Provider Abstraction and Model Governance

Status: Accepted
Date: 2026-04-02
Decision makers: Product and Engineering
Affects: Agent runtime, reliability, cost, compliance

## Context

MarkOS v3 is AI-first and must avoid hard lock-in to one model provider. It needs consistent quality controls, cost management, and deterministic change governance.

## Decision

Implement provider abstraction with policy-driven routing:
- Provider adapter interface for model invocation.
- Policy router for model selection by task risk profile, latency target, and cost budget.
- Version pinning of prompts and models per workflow release.
- Failover policy with safe degradation and retry controls.

## Rationale

1. Abstraction reduces vendor risk and supports resilience.
2. Routing policy optimizes quality, latency, and cost tradeoffs.
3. Pinning and release discipline improve reproducibility.

## Consequences

Positive:
- More reliable agent execution under provider incidents.
- Better cost governance and predictable billing.
- Safer rollout of model changes.

Constraints:
- Every run must capture provider, model, prompt version, and token usage.
- Policy changes must be reviewed and auditable.
- Fallback behavior must avoid silent quality regressions.

## Alternatives considered

Alternative A: Single-provider direct integration.
- Rejected due to lock-in and outage risk.

Alternative B: Dynamic model changes without version pinning.
- Rejected due to reproducibility and audit concerns.

## Success criteria

1. Provider failover path is test-covered.
2. Cost and token telemetry is complete per run.
3. Model and prompt lineage is queryable for every externally visible output.
