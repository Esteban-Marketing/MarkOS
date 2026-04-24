# Phase 207 Research - AgentRun v2 Orchestration Substrate

## Primary research question

What is the smallest durable AgentRun v2 substrate that can safely support MarkOS agents, chains, approvals, costs, retries, tasks, CLI/UI/MCP visibility, and future SaaS growth agents?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Current schema | What do `markos_agent_runs`, `markos_agent_run_events`, and `markos_agent_side_effects` already support? | Reuse and gap map |
| Chains | How should AgentChain DAG dependencies, fan-out/fan-in, cancellation, pause, and resume be represented? | Chain contract proposal |
| State machine | Which run states are canonical across CLI, UI, MCP, and agents? | Run state machine |
| Priority | How should P0-P4 priority, tenant concurrency, starvation protection, and emergency work behave? | Scheduling policy |
| Retry/DLQ | Which failures retry, which create tasks, and which go directly to DLQ? | Failure policy |
| Side effects | How are external sends, data writes, billing actions, connector calls, and price changes made idempotent? | Side-effect model |
| Cost | How are estimated and actual costs captured and linked to budget/billing/Pricing Engine context? | Cost model |
| Adoption | Which existing CRM, MCP, marketing, and onboarding agents must migrate first? | Adoption sequence |
| Future agents | What registry fields are required before PRC/SAS/PLG/ABM/etc. agents become runnable? | Agent readiness checklist |

## Sources to inspect

- Supabase migrations and generated types for AgentRun, audit, task, billing, and approvals.
- Existing agent runtime code under `onboarding/backend/agents/`.
- MCP server/session implementation and cost-budget controls.
- CLI Phase 204 `run/status/doctor` plans.
- Pricing Engine and SaaS Suite planning docs.
- MarkOS v2 Operating Loop Spec.

## Required research output

- Current-code support.
- Schema/contract proposal.
- State machine and retry policy.
- Cost and approval integration.
- Migration/adoption plan.
- Risks and tests implied.

## Codebase Research Addendum - 2026-04-23

### Files inspected

- `supabase/migrations/53_agent_run_lifecycle.sql`
- `onboarding/backend/agents/run-engine.cjs`
- `app/(markos)/operations/tasks/task-types.ts`
- `app/(markos)/operations/tasks/task-machine.ts`
- `app/(markos)/operations/tasks/task-store.tsx`
- `lib/markos/mcp/pipeline.cjs`
- `lib/markos/billing/usage-normalizer.ts`
- `lib/markos/crm/agent-actions.ts`

### Existing support

The current system already has a usable AgentRun v1 foundation:

- `markos_agent_runs`, `markos_agent_run_events`, and `markos_agent_side_effects` exist with tenant RLS.
- Side effects are idempotent through `(tenant_id, run_id, step_key, effect_hash)`.
- The runtime state machine supports requested, accepted, context loaded, executing, awaiting approval, approved/rejected, completed, failed, and archived.
- The task surface has append-only task events, approval state, retry attempts, evidence capture, and a pure reducer.
- MCP and billing can already meter tool/cost usage and normalize agent run close/provider attempt events.

### Missing v2 capabilities

- No AgentChain DAG table, dependency edges, fan-out/fan-in, pause/resume, cancellation, or chain-level progress.
- No P0-P4 scheduler, tenant concurrency policy, starvation protection, or emergency override.
- No durable run API accepted by CLI/UI/MCP as a single source of truth.
- No retry policy table, retry-after state, DLQ, poison-message handling, or recovery task generation.
- No cost estimate before execution and no normalized actual cost after execution on the run itself.
- No canonical handoff from failed/blocked runs to the Human Operating Interface.
- No registry fields that mark future PRC, SAS, PLG, ABM, and other growth agents as executable versus planned.

### Proposed contract direction

Minimum AgentRun v2 objects:

- `AgentRun`: tenant, actor, agent id, registry version, state, priority, source surface, estimated cost, actual cost, approval policy, task link, idempotency key.
- `AgentRunEvent`: append-only state/tool/context/approval/cost events with monotonic sequence.
- `AgentChain`: chain id, strategy, state, root run, aggregate progress, priority, pause/cancel reason.
- `AgentChainEdge`: from run, to run, dependency type, fan-in requirement, failure policy.
- `AgentSideEffect`: external effect key, effect hash, target system, approval id, provider receipt, rollback hint.
- `AgentFailure`: retry classification, retry count, retry-after, DLQ reason, recovery task id.

Canonical states should add `queued`, `paused`, `retry_wait`, `canceled`, and `dlq` while preserving existing states for compatibility.

### Recommended adoption sequence

1. Extend schema and contracts without migrating existing code paths.
2. Add a durable run API that emits the current v1 lifecycle through the v2 event stream.
3. Integrate MCP cost and billing usage normalizers into run close/provider attempt.
4. Connect rejected, failed, waiting, and connector-blocked runs to Phase 208 tasks.
5. Migrate CRM copilot and existing marketing MCP tools first because they already carry approval/evidence patterns.
6. Mark PRC and SAS agents as planned until their phase contracts, costs, evidence gates, and UI surfaces exist.

### Tests implied

- State-transition tests for allowed and forbidden v2 transitions.
- DAG scheduling tests for fan-out, fan-in, cancellation, pause, and dependency failure.
- Idempotency tests for repeated side-effect registration.
- Cost tests for estimate/actual reconciliation and billing event emission.
- Recovery tests proving failed/rejected/blocked runs create visible tasks.

## Discuss/Research Refresh - 2026-04-23

### Additional files inspected

- `api/crm/copilot/playbooks.js`
- `lib/markos/crm/playbooks.ts`
- `lib/markos/mcp/server.cjs`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`

### Additional codebase findings

- CRM playbooks already exercise durable run semantics across approval and replay-safe step application; this is the clearest migration anchor.
- MCP already has a strict middleware pipeline with cost, approval, timeout, and audit semantics that Phase 207 should preserve rather than flatten.
- The current repo already has enough orchestration fragments that "rewrite everything" would be higher risk than additive unification.

### Refreshed research decisions

- AgentRun v2 should preserve backward-compatible state mapping where possible and only introduce net-new states (`queued`, `paused`, `retry_wait`, `canceled`, `dlq`) where they unlock missing behavior.
- Phase 204 CLI work should consume the run/event substrate shaped here.
- Phase 208 task/approval surfaces should be treated as downstream consumers of this phase, not sibling truth stores.
- No new top-level phase is needed; the orchestration debt is best handled inside the current 207 scope.

### Additional tests implied

- Compatibility tests proving CRM playbooks continue to work during substrate migration.
- Pipeline integration tests proving MCP invocation can emit or map into canonical run semantics without losing cost/approval behavior.
- Cross-surface tests proving CLI/UI/MCP can observe the same run identifiers and event stream.
