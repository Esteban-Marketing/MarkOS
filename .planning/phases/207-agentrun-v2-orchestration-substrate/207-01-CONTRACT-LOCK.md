---
artifact: 207-01-CONTRACT-LOCK
status: draft
phase: 207
produced_by: 207-01-PLAN.md (Task 1)
requires_acceptance_before: [207-02, 207-03, 207-04, 207-05, 207-06]
last_updated: 2026-04-23
---

# Phase 207 Contract Lock — AgentRun v2 Orchestration Substrate

This artifact is produced by **Plan 207-01 Task 1** and is the hard-gate input for all other 207 plans. It enumerates every schema, F-ID, migration number, state enum, retry-policy constant, and canonical file path that downstream plans (207-02..06) MUST consume verbatim. Any drift forces a 207-01 re-plan, not an ad-hoc fix.

## 1. Canonical file path

**Contracts module:** `lib/markos/contracts/agent-run-v2.ts`
**Test module:** `test/contracts/agent-run-v2.test.js`
**Legacy shim:** `onboarding/backend/agents/run-engine.cjs` (stays; becomes adapter after 207-06)

## 2. F-ID allocation (fresh range)

Current highest allocated F-ID = **F-105** (Phase 204 `cli-whoami-status`). Phase 205 will allocate F-112+. Phase 207 claims **F-106..F-111** (6 contracts).

| F-ID | File | Purpose | Owning Plan |
|---|---|---|---|
| F-106 | `contracts/F-106-agent-run-v2.yaml` | AgentRun + AgentRunEvent + state machine | 207-01 (scaffold), 207-02 (complete) |
| F-107 | `contracts/F-107-agent-chain-v2.yaml` | AgentChain + AgentChainEdge DAG | 207-01 (scaffold), 207-03 (complete) |
| F-108 | `contracts/F-108-agent-retry-dlq-v2.yaml` | AgentFailure, retry policy, DLQ | 207-03 |
| F-109 | `contracts/F-109-agent-approval-task-v2.yaml` | ApprovalGate + TaskHandoff envelope | 207-04 |
| F-110 | `contracts/F-110-agent-cost-v2.yaml` | Cost estimate/actual + billing emit | 207-05 |
| F-111 | `contracts/F-111-agent-run-adoption-v2.yaml` | Adoption adapters (CRM/MCP/onboarding) + readiness registry | 207-06 |

Rule: No 207 plan may introduce an F-ID outside this range. Downstream phases (208+) allocate F-112+ after 205.

## 3. Migration allocation

Current highest migration on disk = **`100_crm_schema_identity_graph_hardening.sql`**. Phase 204 already allocates 73-76 (non-contiguous holes 77-80, 90-95 are reserved for 204 gap-closure). Phase 207 claims **101-106** (6 migrations, contiguous).

| Migration | File | Owning Plan |
|---|---|---|
| 101 | `supabase/migrations/101_markos_agent_run_v2_extend.sql` | 207-01 (stub) → 207-02 (complete) |
| 102 | `supabase/migrations/102_markos_agent_chain.sql` | 207-01 (stub) → 207-03 (complete) |
| 103 | `supabase/migrations/103_markos_agent_failure_dlq.sql` | 207-01 (stub) → 207-03 (complete) |
| 104 | `supabase/migrations/104_markos_agent_task_link.sql` | 207-01 (stub) → 207-04 (complete) |
| 105 | `supabase/migrations/105_markos_agent_run_cost.sql` | 207-01 (stub) → 207-05 (complete) |
| 106 | `supabase/migrations/106_markos_agent_run_adoption.sql` | 207-01 (stub) → 207-06 (complete) |

Every migration has a rollback at `supabase/migrations/rollback/<N>_*.down.sql`.

## 4. AgentRun v2 Zod + TypeScript schemas (locked)

All downstream code MUST import from `lib/markos/contracts/agent-run-v2.ts`. The following Zod schemas are the canonical source:

```ts
// lib/markos/contracts/agent-run-v2.ts — locked 207-01
import { z } from 'zod';

export const AgentRunStateV2 = z.enum([
  // v1 preserved (backward compat)
  'requested', 'accepted', 'context_loaded', 'executing',
  'awaiting_approval', 'approved', 'rejected', 'completed', 'failed', 'archived',
  // v2 net-new
  'queued', 'paused', 'retry_wait', 'canceled', 'dlq',
]);
export type AgentRunStateV2 = z.infer<typeof AgentRunStateV2>;

export const AgentRunPriority = z.enum(['P0', 'P1', 'P2', 'P3', 'P4']);

export const AgentRunTriggerKind = z.enum([
  'cli', 'ui', 'mcp', 'webhook', 'cron', 'chain', 'system',
]);

export const AgentRun = z.object({
  run_id: z.string().min(1),
  tenant_id: z.string().min(1),
  actor_id: z.string().min(1),
  correlation_id: z.string().min(1),
  idempotency_key: z.string().nullable(),
  agent_id: z.string().min(1),                  // e.g. "crm.playbook.v1"
  agent_registry_version: z.string().min(1),    // e.g. "2026-04-23-r1"
  trigger_kind: AgentRunTriggerKind,
  source_surface: z.string().min(1),            // e.g. "cli:markos run"
  state: AgentRunStateV2,
  priority: AgentRunPriority.default('P2'),
  chain_id: z.string().nullable(),              // FK markos_agent_chains
  parent_run_id: z.string().nullable(),         // FK self (for chain edges)
  provider_policy: z.record(z.unknown()),
  tool_policy: z.record(z.unknown()),
  approval_policy: z.object({
    mode: z.enum(['always', 'risk_gated', 'autonomous']).default('always'),
    required_roles: z.array(z.string()).default([]),
  }),
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).nullable(),
  model: z.string().nullable(),
  tokens_input: z.number().int().nonnegative().default(0),
  tokens_output: z.number().int().nonnegative().default(0),
  estimated_cost_usd_micro: z.number().int().nonnegative().default(0),
  actual_cost_usd_micro: z.number().int().nonnegative().default(0),
  retry_count: z.number().int().nonnegative().default(0),
  retry_after: z.string().datetime().nullable(),
  last_error_code: z.string().nullable(),
  task_id: z.string().nullable(),               // FK markos_agent_tasks
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  closed_at: z.string().datetime().nullable(),
});
export type AgentRun = z.infer<typeof AgentRun>;

export const AgentRunEventType = z.enum([
  // v1 preserved
  'agent_run_transitioned', 'agent_run_transition_denied',
  'agent_run_provider_attempt', 'agent_run_awaiting_approval',
  'agent_run_close_completed', 'agent_run_close_incomplete',
  // v2 net-new
  'agent_run_queued', 'agent_run_paused', 'agent_run_resumed',
  'agent_run_canceled', 'agent_run_retry_scheduled', 'agent_run_dlq_moved',
  'agent_run_cost_estimated', 'agent_run_cost_actual',
  'agent_run_task_linked', 'agent_run_chain_edge_satisfied',
]);

export const AgentRunEvent = z.object({
  event_id: z.string(),
  run_id: z.string(),
  tenant_id: z.string(),
  seq: z.number().int().positive(),             // monotonic per-run
  event_type: AgentRunEventType,
  from_state: AgentRunStateV2.nullable(),
  to_state: AgentRunStateV2.nullable(),
  actor_id: z.string().nullable(),
  correlation_id: z.string().nullable(),
  reason: z.string().nullable(),
  payload: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
});

export const AgentChainStrategy = z.enum([
  'sequential', 'parallel_fan_out', 'conditional', 'dag',
]);

export const AgentChain = z.object({
  chain_id: z.string(),
  tenant_id: z.string(),
  actor_id: z.string(),
  chain_name: z.string(),
  strategy: AgentChainStrategy,
  state: z.enum(['pending', 'running', 'paused', 'completed', 'failed', 'canceled']),
  root_run_id: z.string().nullable(),
  priority: AgentRunPriority,
  pause_reason: z.string().nullable(),
  cancel_reason: z.string().nullable(),
  aggregate_progress: z.number().min(0).max(1).default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const AgentChainEdge = z.object({
  edge_id: z.string(),
  chain_id: z.string(),
  tenant_id: z.string(),
  from_run_id: z.string(),
  to_run_id: z.string(),
  dependency_type: z.enum(['sequential', 'all_of', 'any_of', 'conditional']),
  fan_in_requirement: z.number().int().positive().default(1),
  failure_policy: z.enum(['abort_chain', 'skip_downstream', 'retry_branch', 'continue']),
});

export const AgentSideEffect = z.object({
  effect_id: z.string(),
  run_id: z.string(),
  tenant_id: z.string(),
  step_key: z.string(),
  effect_hash: z.string(),
  effect_type: z.string(),                      // 'external.send' | 'data.write' | 'billing.charge' | 'connector.mutate' | 'price.change'
  target_system: z.string(),
  approval_id: z.string().nullable(),
  provider_receipt: z.record(z.unknown()).nullable(),
  rollback_hint: z.string().nullable(),
  payload: z.record(z.unknown()).default({}),
  committed_at: z.string().datetime(),
});

export const AgentFailureClass = z.enum([
  'transient',   // retry
  'policy',      // surface to task, no retry
  'user_input',  // surface to task, no retry
  'quota',       // retry_wait with backoff
  'upstream',    // retry if upstream recovers
  'poison',      // DLQ immediately
  'cancel',      // user-initiated, no retry
]);

export const AgentFailure = z.object({
  failure_id: z.string(),
  run_id: z.string(),
  tenant_id: z.string(),
  failure_class: AgentFailureClass,
  error_code: z.string(),
  error_message: z.string(),
  retry_count: z.number().int().nonnegative(),
  retry_after: z.string().datetime().nullable(),
  dlq_reason: z.string().nullable(),
  recovery_task_id: z.string().nullable(),
  created_at: z.string().datetime(),
});
```

## 5. State machine (locked)

Canonical transitions the v2 runtime MUST enforce. Backward-compatible v1 transitions are preserved.

| From | Allowed To |
|---|---|
| `requested` | `queued`, `accepted` (v1 compat) |
| `queued` | `accepted`, `canceled` |
| `accepted` | `context_loaded` |
| `context_loaded` | `executing` |
| `executing` | `awaiting_approval`, `completed`, `failed`, `paused`, `retry_wait` |
| `awaiting_approval` | `approved`, `rejected`, `paused`, `canceled` |
| `approved` | `executing` |
| `rejected` | `archived` |
| `paused` | `executing`, `canceled` |
| `retry_wait` | `queued`, `dlq`, `canceled` |
| `failed` | `retry_wait`, `dlq`, `archived` |
| `canceled` | `archived` |
| `dlq` | `archived` (after recovery task closed) |
| `completed` | `archived` |
| `archived` | (terminal) |

## 6. Retry / DLQ policy constants (locked)

```ts
export const RETRY_POLICY = Object.freeze({
  MAX_RETRIES_DEFAULT: 5,
  BACKOFF_BASE_MS: 2_000,          // 2s
  BACKOFF_CAP_MS: 600_000,         // 10min
  BACKOFF_JITTER_FRACTION: 0.2,
  DLQ_AFTER_POISON_HITS: 1,        // poison -> DLQ immediately
  DLQ_AFTER_QUOTA_EXHAUSTION_HITS: 10,
  TIMEOUT_MS: { simple: 30_000, llm: 120_000, long: 300_000 },
});

export const PRIORITY_CONCURRENCY_DEFAULTS = Object.freeze({
  P0: { tenant_max_concurrent: 1, emergency: true, starvation_floor_seconds: 0 },
  P1: { tenant_max_concurrent: 2, emergency: false, starvation_floor_seconds: 30 },
  P2: { tenant_max_concurrent: 5, emergency: false, starvation_floor_seconds: 120 },
  P3: { tenant_max_concurrent: 10, emergency: false, starvation_floor_seconds: 600 },
  P4: { tenant_max_concurrent: 20, emergency: false, starvation_floor_seconds: 3600 },
});
```

## 7. Side-effect idempotency key (locked)

Unique constraint preserved from v1 migration 53:
```
UNIQUE (tenant_id, run_id, step_key, effect_hash)
```
v2 adds `target_system` and `approval_id` columns but does NOT alter the uniqueness key.

## 8. Cost model (locked)

Cost fields on `markos_agent_runs` (added by migration 105):
- `estimated_cost_usd_micro BIGINT NOT NULL DEFAULT 0`
- `actual_cost_usd_micro BIGINT NOT NULL DEFAULT 0`
- `cost_currency TEXT NOT NULL DEFAULT 'USD'`
- `pricing_engine_context JSONB NOT NULL DEFAULT '{}'::jsonb` (placeholder-safe; accepts `{{MARKOS_PRICING_ENGINE_PENDING}}`)

Billing event emit: `lib/markos/billing/usage-normalizer.ts` gets new `normalizeAgentRunCost(run)` export that emits `BillingUsageEvent` with `event_name: 'agent_run_cost'`. Run close MUST call this; compensating event on failure/retry.

## 9. Approval + Task handoff (locked)

Task FK is added to `markos_agent_runs` as nullable `task_id TEXT REFERENCES markos_agent_tasks(task_id)` in migration 104. Table `markos_agent_tasks` is the orchestration-owned handoff record; UI store at `app/(markos)/operations/tasks/task-store.tsx` becomes a read-only consumer of this table.

Rule: every `rejected`, `failed` (non-retry), `dlq`, `paused`, and `awaiting_approval` run MUST have `task_id IS NOT NULL` or a `agent_run_task_linked` event.

## 10. Adoption adapters (locked)

Plan 207-06 delivers these compatibility adapters without breaking existing call sites:

- `lib/markos/crm/playbook-run-adapter.ts` — wraps `lib/markos/crm/playbooks.ts` to emit v2 events.
- `lib/markos/mcp/run-emitter.cjs` — bridges MCP pipeline invocation to v2 `AgentRun` + `AgentRunEvent`.
- `onboarding/backend/agents/run-engine.cjs` — becomes shim that re-exports v2 primitives.
- `lib/markos/billing/agent-run-cost-bridge.ts` — routes `normalizeAgentRunCost` into billing.
- `lib/markos/agents/registry-v2.ts` — agent readiness registry (`status: planned | experimental | ga`, cost visibility, approval posture, test gates).

## 11. Downstream dependency contract

Plan 204 (CLI) MUST consume F-106 for `markos run`, `markos status`, `markos doctor`. Plan 204-13 (v2 compliance gap-closure) is where CLI aligns. See field `notes_for_phase_204` on Plan 207-06.

Plan 205 (Pricing) MUST write `pricing_engine_context` into `markos_agent_runs.pricing_engine_context` via its approved recommendation emit path. See field `notes_for_phase_205` on Plan 207-05.

Plan 208 (Human Operating Interface) MUST read from `markos_agent_tasks` (owned by 207) and is a consumer, not a sibling store.

## 12. Acceptance gate

Downstream plans 207-02..06 may reference this artifact by path only. They may NOT redefine schemas, enums, or constants locally. Any change to this lock requires overwriting this file and re-running 207-01.

## 13. Open questions (non-blocking)

- Chain scheduler ownership (Vercel Queues vs pg_cron) — resolved inside Plan 207-03 Task 2.
- Whether `onboarding/backend/agents/run-engine.cjs` is retired or kept as a thin shim — resolved inside Plan 207-06 Task 3.
