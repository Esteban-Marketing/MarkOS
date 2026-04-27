# Phase 207 Research - AgentRun v2 Orchestration Substrate

## Primary research question

What is the smallest durable AgentRun v2 substrate that unifies existing run-producing systems now, while exposing clean handoff contracts to pricing, compliance, UI, evidence, connector, and learning phases instead of absorbing their ownership?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Ownership | Which requirements belong to Phase 207 directly, and which should stay upstream or downstream? | Ownership boundary |
| Current schema | What do `markos_agent_runs`, `markos_agent_run_events`, and `markos_agent_side_effects` already support? | Reuse and gap map |
| Contract lock | What must be frozen early so downstream plans stop redefining orchestration shapes? | Contract-lock baseline |
| Durable API | What run/event API should every surface share? | Run API contract |
| Scheduler | How should priority, concurrency, starvation, timeout, retry, and DLQ behave? | Scheduler and failure policy |
| Approval handoff | How should dangerous mutations and run-to-task handoff work without claiming the full task system? | Approval and handoff contract |
| Cost bridge | How should estimated/actual run cost feed billing and pricing context safely? | Cost and billing bridge |
| Adoption | How do CRM, MCP, onboarding, and future agent families migrate without breaking legacy call sites? | Compatibility rollout and registry |

## Files inspected

- `supabase/migrations/53_agent_run_lifecycle.sql`
- `onboarding/backend/agents/run-engine.cjs`
- `api/crm/copilot/playbooks.js`
- `lib/markos/crm/playbooks.ts`
- `lib/markos/mcp/server.cjs`
- `lib/markos/mcp/pipeline.cjs`
- `lib/markos/billing/usage-normalizer.ts`
- `lib/markos/crm/agent-actions.ts`
- `app/(markos)/operations/tasks/task-types.ts`
- `app/(markos)/operations/tasks/task-machine.ts`
- `app/(markos)/operations/tasks/task-store.tsx`
- `.planning/phases/205-pricing-engine-foundation-billing-readiness/205-RESEARCH.md`
- `.planning/phases/206-soc2-type1-foundation/206-RESEARCH.md`
- `.planning/phases/208-human-operating-interface/208-RESEARCH.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-REVIEWS.md`

## Ownership boundary

### Direct ownership

- `RUN-01..08`
- `QA-01..15`

### Upstream integrations, not primary ownership

- Phase 201 tenancy, RLS, and auth substrate
- Phase 202 MCP session, approval, and cost-meter posture
- Phase 204 CLI consumers of run/event state
- Phase 205 pricing context and billing usage reconciliation
- Phase 206 dangerous-mutation governance and SOC2 evidence posture

### Downstream consumers, not primary ownership

- Phase 208 task and approval system
- Phase 209 evidence lineage
- Phase 210 connector recovery substrate
- Phase 211 dispatch and measurement loop
- Phase 212 learning and performance-log lineage

## Current-code support

### 1. AgentRun v1 already exists

- `markos_agent_runs`, `markos_agent_run_events`, and `markos_agent_side_effects` already exist with tenant RLS.
- Side effects already have an idempotency uniqueness key that should be preserved, not reinvented.
- That gives Phase 207 a real migration substrate instead of a greenfield obligation.

### 2. CRM playbooks already exercise durable run semantics

- CRM playbooks already use run-like envelopes, transitions, and side effects.
- This makes CRM the most important compatibility migration anchor, not a secondary consumer.

### 3. MCP already has strict middleware discipline

- The MCP pipeline already owns auth, rate-limit, approval, timeout, cost, and audit semantics.
- AgentRun v2 must wrap this pipeline, not flatten it, or later orchestration would silently weaken existing safety.

### 4. Billing normalization already exists

- Billing usage normalization can already emit durable billing usage shapes.
- The gap is not billing structure; it is the lack of a run-level cost bridge and pricing context handoff.

### 5. Task UI already exists, but it is downstream

- The current task UI already models approvals, retries, evidence, and append-only events.
- That means Phase 207 should expose handoff records and APIs that Phase 208 consumes, not claim the whole human task requirement family.

## Gaps

- No current plan set aligns with the latest executable GSD schema.
- No `207-VALIDATION.md` exists.
- No Wave 0.5 preflight currently gates the phase on compliance posture from Phase 206.
- No single run API/event stream is currently the canonical shared surface across CLI, UI, MCP, and onboarding.
- No durable chain engine, priority scheduler, starvation policy, or DLQ substrate exists.
- No explicit billing-bridge contract connects run close, actual cost, and pricing context in a stable way.
- No agent registry contract gates future PRC, SAS, and growth agents by readiness.

## Recommendation

Phase 207 should be replanned as a six-wave executable phase with a Wave 0.5 upstream gate at the front:

1. Hard-gate tenancy, MCP, CLI, pricing, and compliance readiness from Phases 201, 202, 204, 205, and 206.
2. Define contract lock and shared schema baseline before API, scheduler, and adapter work branches out.
3. Ship durable run API/event stream as the one shared substrate.
4. Add scheduler, chain, retry, DLQ, and timeout behavior.
5. Define approval-aware side-effect and run-to-task handoff as orchestration hooks, not full task-system ownership.
6. Add cost/billing bridge and compatibility adapters last, once the substrate is stable.

## Domain 0 - Upstream readiness and architecture lock

Phase 207 depends on Phases 201, 202, 204, 205, and 206 in practice, so Plan 01 should create a Wave 0.5 gate that checks:

- tenancy and RLS posture exists from Phase 201
- MCP approval, cost-meter, and tool pipeline posture exists from Phase 202
- CLI run/status/doctor surfaces can consume a shared run/event substrate from Phase 204
- pricing context and billing reconciliation contracts exist from Phase 205
- dangerous-mutation governance and SOC2 evidence posture exist from Phase 206

The architecture lock should reject unsafe shortcuts such as:

- `second run substrate`
- `client-owned task persistence`
- `approval bypass`
- `unmetered run close`

## Domain 1 - Contract lock and shared schema baseline

Phase 207 already has the right instinct in `207-01-CONTRACT-LOCK.md`, but that content must be normalized into the current GSD plan shape and treated as a shared baseline, not an isolated artifact.

Recommended shared contract objects:

- `AgentRun`
- `AgentRunEvent`
- `AgentChain`
- `AgentChainEdge`
- `AgentSideEffect`
- `AgentFailure`

Recommended locked ranges to preserve:

- `F-106..F-111`
- migrations `101..106`

## Domain 2 - Durable run API and shared event stream

Recommended `RunApiEnvelope` fields:

- `run_id`
- `tenant_id`
- `agent_id`
- `trigger_kind`
- `source_surface`
- `state`
- `priority`
- `approval_policy`
- `estimated_cost_usd_micro`
- `actual_cost_usd_micro`
- `task_link_state`
- `created_at`
- `updated_at`

Recommended shared API surfaces:

- `POST /api/tenant/runs`
- `GET /api/tenant/runs/{run_id}`
- `GET /api/tenant/runs/{run_id}/events`

The event stream should be the one truth source for CLI, UI, MCP, and adapters.

## Domain 3 - Scheduler, chains, retry, timeout, and DLQ

Recommended durable scheduler components:

- `SchedulerPolicy`
- `RetryPolicy`
- `DlqRecord`
- `ChainExecutionRule`

Recommended retained orchestration primitives:

- priority tiers `P0..P4`
- starvation protection
- pause and cancel
- timeout by execution tier
- DLQ movement with recovery evidence

The core decision is to centralize orchestration policy in one place while reusing existing middleware and billing primitives.

## Domain 4 - Approval-aware side effects and run-to-task handoff

Recommended `ApprovalHandoffRecord` fields:

- `run_id`
- `handoff_kind`
- `approval_required`
- `task_ref`
- `reason`
- `side_effect_kind`
- `target_system`
- `created_at`

Recommended `handoff_kind` literals:

- `approval`
- `recovery`
- `follow_up`
- `manual_input`

This should be framed as an orchestration-owned handoff contract. Phase 208 still owns the human task and approval system requirement family and operator UX.

## Domain 5 - Run cost, billing bridge, and pricing context

Recommended `RunCostContext` fields:

- `estimated_cost_usd_micro`
- `actual_cost_usd_micro`
- `cost_currency`
- `model`
- `tokens_input`
- `tokens_output`
- `pricing_engine_context`
- `billing_usage_event_id`

Recommended `pricing_engine_context` posture:

- placeholder-safe when Phase 205 has not yet written approved pricing context
- stable enough for later billing reconciliation and CLI/UI consumers

This is the place where orchestration supports billing and pricing without re-owning the pricing engine.

## Domain 6 - Compatibility adapters and agent registry

Recommended `AgentRegistryRow` fields:

- `agent_id`
- `status`
- `current_version`
- `approval_posture`
- `cost_visibility`
- `test_gates_passed`
- `notes`

Recommended compatibility adapters:

- CRM playbook adapter
- MCP run emitter
- onboarding run-engine shim
- registry-driven runnability gate

Future PRC, SAS, and growth agents should be registered as `planned` until their owning phases make them runnable.

## Validation architecture

The phase needs a `207-VALIDATION.md` that covers:

- Wave 0.5 upstream readiness and architecture lock
- contract lock and schema baseline
- durable run API and event stream
- scheduler, chains, retry, and DLQ
- approval-aware side effects and run-to-task handoff
- cost/billing bridge and pricing context
- compatibility adapters and registry rollout

## Risks

- If Phase 207 keeps partial-schema plans, execution can look precise while still failing the repo’s real planning gates.
- If orchestration claims `TASK-01` ownership directly, later phases can hide unfinished human task-system work behind substrate claims.
- If Phase 206 is omitted from gating, dangerous mutation policies can be normalized before compliance posture exists.
- If CLI, MCP, CRM, and onboarding adapters are not forced onto one run substrate, later evidence and learning phases will inherit fragmented execution truth.

## Phase implications

- Phase 208 should consume run/task handoff and shared run visibility, not build a sibling orchestration store.
- Phase 209 should consume AgentRun lineage for evidence creation, override, and reuse decisions.
- Phase 210 should consume pause/retry/DLQ and recovery lineage for connector safety.
- Phases 211 and 212 should consume execution and measurement lineage rather than invent their own agent state systems.

## Acceptance tests implied

- schema and contract-lock tests
- state-transition and run-event stream tests
- DAG scheduling, starvation, retry, timeout, and DLQ tests
- approval-aware side-effect and run-to-task handoff tests
- cost estimate/actual and billing-bridge tests
- CRM and MCP compatibility integration tests
