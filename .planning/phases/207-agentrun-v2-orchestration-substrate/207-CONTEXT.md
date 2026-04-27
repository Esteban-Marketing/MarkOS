# Phase 207 Context - AgentRun v2 Orchestration Substrate

**Status:** Replanned 2026-04-27 into executable GSD docs after review findings on partial-schema plans, task-ownership drift, missing validation, and omitted compliance dependency gating.

## Why this phase exists

MarkOS already has several run-like systems: CRM playbooks, MCP pipeline invocation, onboarding agent flows, billing normalization, and task handoff hints. If those execution surfaces keep diverging, every later phase will rebuild orchestration from scratch. Phase 207 exists to unify them into one AgentRun v2 substrate before UI, evidence, connectors, learning, SaaS, and growth features depend on conflicting execution semantics.

This phase is not the human task system, not the evidence phase, and not the connector phase. It is the durable orchestration layer those later phases will consume.

## Canonical inputs

- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `obsidian/reference/MarkOS v2 Requirements Traceability Matrix.md`
- `.planning/REQUIREMENTS.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/phases/201-saas-tenancy-hardening/201-RESEARCH.md`
- `.planning/phases/202-mcp-server-and-marketplace/202-RESEARCH.md`
- `.planning/phases/204-cli-markos-v1-ga/204-CONTEXT.md`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `.planning/phases/206-soc2-type1-foundation/206-RESEARCH.md`

## Ownership boundary

### Direct ownership

- `RUN-01..08`
- `QA-01..15`

### Integrates with, but does not re-own

- `API-02` from Phase 201 for tenancy, RLS, auth, audit, and lifecycle safety
- `MCP-01` from Phase 202 for session, approval, cost-meter, and pipeline middleware posture
- `CLI-01` from Phase 204 for `markos run`, SSE watch, status, and doctor consumers
- `PRC-01..09`, `BILL-01`, `BILL-02` from Phase 205 for pricing context and billing-usage reconciliation consumers
- `COMP-01` from Phase 206 for approval posture, dangerous-mutation governance, and SOC2 evidence expectations

### Downstream consumers, not in-scope ownership

- Phase 208 owns the human task and approval system; it consumes run-to-task handoff records and run/event visibility from this phase
- Phase 209 consumes AgentRun lineage for evidence creation, freshness, and reuse decisions
- Phase 210 consumes AgentRun pause/failure/recovery substrate for connector work
- Phases 211 and 212 consume execution, measurement, and learning lineage
- Phases 214-220 and 221-228 consume the agent registry and run substrate for SaaS and Commercial OS agents

## Existing implementation substrate to inspect

- `supabase/migrations/53_agent_run_lifecycle.sql`
- `onboarding/backend/agents/run-engine.cjs`
- `api/crm/copilot/playbooks.js`
- `lib/markos/crm/playbooks.ts`
- `lib/markos/mcp/server.cjs`
- `lib/markos/mcp/pipeline.cjs`
- `lib/markos/billing/usage-normalizer.ts`
- `app/(markos)/operations/tasks/*`

## Required phase shape

1. Add a Wave 0.5 upstream preflight, architecture lock, and validation baseline before contract work branches out.
2. Define the canonical AgentRun v2 contract lock, shared schema baseline, and migration/F-ID allocation.
3. Ship one durable run API and event stream that CLI, UI, MCP, and adapters can all consume.
4. Define chains, scheduler policy, retry/DLQ, timeout, pause, cancel, and starvation protection.
5. Define approval-aware side-effect and run-to-task handoff contracts without re-owning Phase 208’s task system.
6. Bridge estimated and actual cost into billing and pricing context without turning this phase into the pricing engine.
7. Define compatibility adapters and agent registry posture for current and future agent families.

## Non-negotiables

- No new run-producing domain invents a parallel lifecycle after this phase.
- No dangerous mutation path bypasses approval policy and compliance posture.
- No failed, blocked, paused, or DLQ run disappears without durable evidence and handoff hooks.
- No phase after 207 should need to guess which run/event contract is canonical.
- No orchestration plan should claim full ownership of the human task system requirement family.

## Done means

Phase 207 has an executable substrate plan set that produces named orchestration contracts and boundary docs:

- `.planning/orchestration/207-upstream-readiness.md`
- `.planning/orchestration/agentrun-v2-contract.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-01-CONTRACT-LOCK.md`
- `.planning/orchestration/durable-run-api-contract.md`
- `.planning/orchestration/scheduler-and-dlq-policy.md`
- `.planning/orchestration/approval-handoff-contract.md`
- `.planning/orchestration/run-cost-billing-bridge.md`
- `.planning/orchestration/agent-registry-readiness.md`

At that point, GSD can execute AgentRun v2 as the shared runtime spine for later phases without falsely claiming the human task system or skipping compliance posture.
