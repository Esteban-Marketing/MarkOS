# MarkOS Orchestration Contract
## Agent Queue · Cost Accounting · Approval Gates · Retry Policies · Failure Escalation

---

## Why this document exists

Every architecture document before this one describes what agents *do*.
This one describes how the system *runs them* — reliably, at cost, with humans in
the loop at the right moments and not at the wrong ones.

The orchestration layer is invisible when it works. It is catastrophic when it doesn't.
A missed approval gate publishes content that wasn't ready. A runaway agent chain
burns $800 of AI budget on a weekend. A silent failure means a client's weekly report
never generates and nobody knows. A priority misconfiguration means a social crisis
sits undetected while a low-urgency content brief runs instead.

This document is the contract every agent, every workflow, and every engineer must honor.

---

## Part 1: The Agent Run Model

### What an "agent run" is

An agent run is the atomic unit of MarkOS execution. Every time an agent is invoked,
a run record is created. The run has a defined lifecycle. Nothing executes outside a run.

```typescript
interface AgentRun {
  run_id: string                  // uuid
  tenant_id: string               // uuid
  agent_token: string             // e.g. MARKOS-AGT-STR-01
  triggered_by: TriggerSource     // schedule | webhook | manual | parent_run | approval
  parent_run_id: string | null    // if spawned by another agent
  campaign_id: string | null      // if part of a campaign chain
  priority: RunPriority           // critical | high | normal | low | background
  status: RunStatus               // queued | running | awaiting_approval | completed | failed | cancelled
  input_payload: Record<string, unknown>
  output_artifact_id: string | null
  approval_gate: ApprovalGate | null
  cost_estimate_usd: number       // pre-run estimate
  cost_actual_usd: number | null  // post-run actual
  tokens_in: number | null
  tokens_out: number | null
  model_used: string | null       // which LLM was invoked
  started_at: string | null       // ISO8601
  completed_at: string | null
  error: RunError | null
  retry_count: number
  created_at: string              // ISO8601
}

type RunPriority = 'critical' | 'high' | 'normal' | 'low' | 'background'
type RunStatus = 'queued' | 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled'
type TriggerSource = 'schedule' | 'webhook' | 'manual' | 'parent_run' | 'approval_granted'
```

### Run lifecycle

```
QUEUED
  ↓ (queue worker picks up based on priority)
RUNNING
  ↓ (agent executes — calls LLM, tools, external APIs)
  ├─ no approval gate → COMPLETED
  └─ approval gate required → AWAITING_APPROVAL
                                ↓ (human approves)
                              COMPLETED
                                ↓ (human rejects)
                              CANCELLED (with rejection reason logged)

Any stage → FAILED (on unrecoverable error, after retries exhausted)
Any stage → CANCELLED (manual operator action)
```

### Run chaining

When Agent A's output is the input to Agent B, a chain is formed.
The orchestrator manages chains as a directed acyclic graph (DAG).

```typescript
interface RunChain {
  chain_id: string
  tenant_id: string
  campaign_id: string | null
  name: string                    // e.g. "June Content Calendar Generation"
  status: ChainStatus             // running | completed | failed | paused
  nodes: ChainNode[]
  created_by: string              // user_id or 'schedule'
  created_at: string
}

interface ChainNode {
  node_id: string
  agent_token: string
  run_id: string | null           // null until this node starts
  depends_on: string[]            // node_ids that must complete first
  status: RunStatus
  can_run_parallel: boolean       // if true, runs concurrently with siblings
}
```

**Chain execution rules:**
- Nodes with satisfied dependencies start immediately
- Parallel-eligible nodes run concurrently (subject to tenant concurrency limits)
- A single node failure pauses the entire chain unless the node is marked `optional: true`
- Chains can be paused by operator at any node boundary
- Chain progress is visible in the UI as a live DAG view

---

## Part 2: The Priority System

### Five priority tiers

Every run enters the queue with a priority. The queue is a priority queue —
higher priority runs preempt lower priority runs for available workers.

| Priority | Label | Use cases | Max queue wait | Examples |
|----------|-------|-----------|----------------|---------|
| P0 | Critical | Crisis detection, security events | 0 — runs immediately, preempts all | SOC-10 crisis alert, compliance violation detected |
| P1 | High | Human-triggered, time-sensitive | < 2 min | Operator manually triggers a run, DM from high-value lead, daily OKR check |
| P2 | Normal | Standard scheduled tasks | < 15 min | Weekly content brief, daily social publish, lead scoring |
| P3 | Low | Background intelligence tasks | < 2 hours | Competitive monitoring, benchmark refresh, literacy scout |
| P4 | Background | Batch processing, analytics | < 8 hours | Monthly market analysis, cross-tenant performance synthesis, content audit |

**Priority assignment rules:**
- All scheduled runs: default P3
- All human-triggered runs: default P2, upgradable to P1 by operator
- Crisis detector fires: always P0
- DM from lead with score > 80: P1
- Campaign launch chain: P2 for content creation, P1 for first publish
- Approval-gated runs that are unblocked by human: inherit original priority

### Tenant concurrency limits

Per tier, per tenant, at any given moment:

| Plan tier | Concurrent P0 | Concurrent P1 | Concurrent P2 | Concurrent P3/P4 |
|-----------|-------------|-------------|-------------|----------------|
| Starter | 1 | 2 | 3 | 5 |
| Professional | 1 | 4 | 8 | 15 |
| Agency | 2 | 8 | 20 | unlimited (budget-capped) |

P0 runs are never queued — they execute on a dedicated worker pool shared across
all tenants, with a hard limit of 1 per tenant active at any time.

---

## Part 3: The Approval Gate Contract

This is the most important contract in MarkOS. Anything that touches the external
world — published content, sent emails, live ad changes, CRM mutations, social
responses — must pass through an approval gate before execution.

### The gate types

```typescript
interface ApprovalGate {
  gate_id: string
  run_id: string
  gate_type: GateType
  artifact_id: string             // what is being approved
  artifact_type: string           // content | campaign | ad_change | email | social_post | crm_mutation
  artifact_preview_url: string    // rendered preview for the approver
  requested_at: string
  expires_at: string | null       // null = no expiry; some gates auto-expire
  auto_approve_after_hours: number | null   // for low-risk gates on configured tenants
  assigned_to: string[]           // user_ids who can approve
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved'
  decision_by: string | null      // user_id
  decision_at: string | null
  rejection_reason: string | null
  brand_voice_score: number | null  // 0–100, pre-computed
  compliance_check: ComplianceResult | null
}

type GateType =
  | 'content_publish'       // blog post, long-form content going live
  | 'social_post'           // any social publish
  | 'social_response'       // reply to DM or comment
  | 'email_send'            // any outbound email (campaign or cold)
  | 'ad_campaign_change'    // bid change, budget change, new campaign
  | 'crm_mutation'          // stage change, contact update, deal creation
  | 'data_export'           // any data leaving the tenant boundary
  | 'strategy_activation'   // activating a new strategy or major campaign plan
  | 'literacy_promotion'    // promoting a literacy update to active (from 08-SELF-EVOLVING)
```

### Gate routing logic

Not all approvals go to the same person. The gate router determines who reviews what.

```
incoming gate request
  ↓
1. artifact_type → role mapping:
   content_publish → content_approver role
   ad_campaign_change → paid_media_approver role
   strategy_activation → admin role only
   social_response (DM from lead score > 80) → sales_approver role

2. value threshold → escalation:
   ad_campaign_change with spend delta > $500/day → admin role required
   email_send to list > 5,000 → admin role required

3. time-of-day → notification channel:
   business hours → in-app + notification
   after hours → push notification + email
   after hours AND P0 → push + email + SMS (if configured)

4. auto-approval eligibility check:
   - is tenant configured for auto-approval of this gate type?
   - is brand voice score >= tenant threshold (default: 85)?
   - is compliance check passed?
   - is the artifact in a class the tenant has whitelisted for auto-approval?
   → all yes: auto-approve after configured delay (default: 0h for none, configurable per type)
   → any no: route to human
```

### Auto-approval configuration

Tenants can configure auto-approval per gate type after a trust-building period.
Default: all gates require human approval.

Recommended unlock sequence (by tenure and volume):
- Month 1–2: all gates manual
- Month 3+: auto-approve social_response to comments under 50 words in positive sentiment
- Month 6+: auto-approve content publish if voice score ≥ 90 and compliance passes
- Operator discretion: email campaigns above a subscriber threshold always manual, regardless

Every auto-approved artifact is logged with:
- Voice score at time of approval
- Compliance result
- The fact that it was auto-approved (not human-approved)
- A 24h review window where the operator can retroactively flag it

### The approval inbox

Every pending gate creates a task in the operator's approval inbox (see `10-HUMAN-INTERFACE-LAYER.md`).
The approval inbox is the highest-priority view in the MarkOS UI.

Each item shows:
- The artifact preview (rendered, not raw)
- The agent that produced it and why
- The brand voice score with dimension breakdown
- Any compliance flags (advisory or blocking)
- One-click approve / approve with edits / reject
- "Edit and approve" opens a rich-text editor with the draft pre-loaded
- Rejection requires a brief reason (feeds literacy system)

---

## Part 4: Cost Accounting

### The cost model

Every agent run has a cost. MarkOS tracks this to the run level.

```typescript
interface RunCost {
  run_id: string
  tenant_id: string
  agent_token: string
  model_provider: 'anthropic' | 'openai' | 'google' | 'other'
  model_id: string
  tokens_in: number
  tokens_out: number
  tool_calls: number
  cost_usd_tokens: number           // (tokens_in × input_rate) + (tokens_out × output_rate)
  cost_usd_tools: number            // web search calls, external API calls billed per-use
  cost_usd_compute: number          // server-side compute for non-LLM work (crawling, etc.)
  cost_usd_total: number
  billed_to_tenant: boolean
  markup_factor: number             // platform margin applied on resale; 1.0 = cost pass-through
  tenant_charged_usd: number
  recorded_at: string
}
```

### Budget enforcement

Every tenant has a budget configuration:

```typescript
interface TenantBudget {
  tenant_id: string
  monthly_limit_usd: number         // hard cap; all non-critical runs pause when hit
  daily_soft_limit_usd: number      // alert threshold; no pause, just notification
  byok_provider: string | null      // if BYOK, LLM calls route through their key
  byok_monthly_limit_usd: number | null
  current_month_spend_usd: number   // running total, updated per run
  current_day_spend_usd: number     // running daily total, resets at midnight tenant TZ
}
```

**Budget enforcement rules:**

1. Pre-run cost estimate is computed before every run using model pricing × estimated tokens
2. If `current_month_spend + estimate > monthly_limit`: run is blocked, operator notified
3. P0 (critical) runs are exempt from budget blocks — they always execute
4. If `current_day_spend > daily_soft_limit`: operator receives a budget alert notification
5. When monthly limit is hit, a budget-exceeded banner appears in the UI with options to:
   - Add budget (upgrade or one-time top-up)
   - Review and cancel queued runs to stay within limit
   - Pause all non-critical runs until next billing period

### BYOK (Bring Your Own Key) routing

When a tenant has BYOK configured, LLM calls route through their own API key.
MarkOS charges only the compute + tooling margin, not the token cost.

BYOK routing logic:
```
run starts
  ↓
is tenant BYOK configured?
  → yes: use tenant's key, select model from their configured preference list
  → no: use MarkOS managed key, charge at metered rate

BYOK failure fallback:
  → if tenant's key returns 401/429/500 → retry once after 30s
  → if second failure → P1 alert to operator + fallback to MarkOS managed key if operator has configured this
  → run cost billed at managed rate for fallback runs (operator notified)
```

### Cost reporting

Per tenant, available in the settings UI:
- Current month spend by day (chart)
- Spend breakdown by agent (which agents cost the most)
- Spend breakdown by campaign (which campaigns drove spend)
- Average cost per artifact type (cost per blog post, cost per social post, etc.)
- Projected month-end spend at current run rate
- All run-level cost records available for export

---

## Part 5: Retry Policy and Failure Handling

### Retry tiers

Not all failures are equal. The retry policy is determined by the failure type.

```typescript
interface RetryPolicy {
  failure_type: FailureType
  max_retries: number
  backoff: BackoffStrategy
  escalate_after_retries: boolean
  escalation_action: EscalationAction
}

type FailureType =
  | 'llm_timeout'           // LLM API did not respond in time
  | 'llm_rate_limit'        // LLM API returned 429
  | 'llm_content_refusal'   // LLM refused to generate (safety)
  | 'tool_failure'          // external tool (web search, API) failed
  | 'external_api_error'    // connector API returned error
  | 'output_validation'     // agent output failed schema validation
  | 'brand_voice_fail'      // output failed voice classifier (hard fail threshold)
  | 'compliance_block'      // compliance checker returned blocking violation
  | 'approval_timeout'      // approval gate expired without decision
  | 'budget_exceeded'       // run blocked by budget cap
  | 'context_overflow'      // input exceeded model context window
```

**Default retry policies by failure type:**

| Failure type | Max retries | Backoff | Escalate? |
|-------------|-------------|---------|-----------|
| llm_timeout | 3 | Exponential (30s, 2m, 8m) | Yes — after 3 |
| llm_rate_limit | 5 | Exponential (15s, 1m, 4m, 10m, 30m) | No |
| llm_content_refusal | 1 (with modified prompt) | Immediate | Yes — if second refusal |
| tool_failure | 3 | Linear (30s) | Yes — after 3 |
| external_api_error | 3 | Exponential | Yes — if critical connector |
| output_validation | 2 (with correction prompt) | Immediate | Yes — if persists |
| brand_voice_fail | 2 (with voice coaching prompt) | Immediate | Yes — always logged |
| compliance_block | 0 | — | Yes — always |
| approval_timeout | 0 | — | Yes — resurfaces in inbox |
| budget_exceeded | 0 | — | Yes — budget alert |
| context_overflow | 1 (with input truncation) | Immediate | Yes — if persists |

### Escalation actions

When retries are exhausted, the escalation action fires:

```typescript
type EscalationAction =
  | 'create_task'           // creates a human task in the task board
  | 'notify_admin'          // push + email to admin role users
  | 'pause_chain'           // pauses the parent chain at this node
  | 'cancel_chain'          // cancels the parent chain entirely
  | 'substitute_fallback'   // uses a pre-defined fallback output (e.g. empty draft)
```

Most failures → `create_task` + `pause_chain`
Compliance blocks → `create_task` + `cancel_chain` + `notify_admin`
Budget exceeded → `create_task` + `notify_admin` (chain continues for critical nodes)

### The dead letter queue

All permanently failed runs (retries exhausted, no recovery) enter the dead letter queue.

Dead letter queue items:
- Visible in the operator's system health view
- Auto-expiry after 30 days
- Can be manually re-queued by operator
- Feed into the platform reliability dashboard (p99 run success rate per agent)

---

## Part 6: Schedule Management

### Schedule types

```typescript
interface AgentSchedule {
  schedule_id: string
  tenant_id: string
  agent_token: string
  schedule_type: 'cron' | 'interval' | 'event_driven' | 'campaign_phase'
  cron_expression: string | null   // for cron type
  interval_minutes: number | null  // for interval type
  trigger_event: string | null     // for event_driven type
  campaign_phase: string | null    // for campaign_phase type
  priority: RunPriority
  input_template: Record<string, unknown>  // static inputs for this schedule
  active: boolean
  last_run_at: string | null
  next_run_at: string | null
  timezone: string                 // tenant's configured timezone
}
```

### Canonical MarkOS schedule table

The default schedule for a fully-configured tenant:

| Frequency | Agent | Priority | Notes |
|-----------|-------|----------|-------|
| Every 5 min | SOC-04 Social Listener | P1 | Only processes new signals; very lightweight |
| Every 15 min | ANA-05 Anomaly Detector | P1 | Scans all live metrics streams |
| Hourly | OPS-04 Budget Monitor | P2 | Checks spend vs pacing |
| Daily 7am | STR-05 OKR Monitor | P2 | Morning OKR health check |
| Daily 8am | SOC-07 Social Analytics Reporter | P3 | Prior day performance |
| Daily (per platform timing) | SOC-02 Social Publisher | P2 | Publishes scheduled content |
| Weekly Sunday 11pm | RES-02 Competitive Monitor | P3 | Weekly competitive digest |
| Weekly Sunday 11pm | RES-03 Market Scanner | P3 | Weekly trend report |
| Weekly Monday 6am | ANA-01 Performance Analyst | P2 | Weekly narrative ready by start of day |
| Weekly | LIT-01 Literacy Scout | P4 | Background literacy crawl |
| Monthly 1st | CONT-01 Content Strategist | P2 | Next month's content plan |
| Monthly 1st | STR-03 Channel Allocator | P2 | Monthly budget reallocation recommendation |
| Quarterly | STR-01 Grand Strategist | P1 | Quarterly strategy review |
| Quarterly | RES-06 SEO Auditor | P2 | Full SEO health report |
| Quarterly | RES-07 Paid Media Auditor | P2 | Full paid media audit |
| On new lead | AUD-03 Lead Scorer | P1 | Triggered by form fill or DM |
| On new DM | SOC-03 Community Manager | P1 | Draft response to DM |
| On new comment (high urgency) | SOC-03 Community Manager | P1 | |
| On new comment (normal) | SOC-03 Community Manager | P3 | Batched every 30 min |
| On meeting booked | OPS-02 Meeting Intelligence | P2 | Pre-meeting brief 24h before |

---

## Part 7: Multi-Tenant Isolation

Every agent run is strictly isolated per tenant. Isolation is enforced at four levels:

**1. Data isolation:** All Supabase queries include `tenant_id` in the WHERE clause, enforced by RLS policy. An agent running for Tenant A cannot access Tenant B's data by any path.

**2. Credential isolation:** Connector credentials are encrypted per tenant with a tenant-specific encryption key. Agent runs receive a short-lived, scoped credential for the duration of the run — not the master credential.

**3. Queue isolation:** Tenant runs are namespaced in the queue. A high-volume tenant's queue cannot starve another tenant's P0 runs.

**4. LLM context isolation:** No cross-tenant data is ever included in a prompt. The system prompt for every agent run includes the tenant_id as a boundary assertion. Prompt construction is audited quarterly for leakage vectors.

**Cross-tenant aggregation (for benchmarks and literacy):** Only happens through the anonymization pipeline documented in `08-SELF-EVOLVING-ARCHITECTURE.md`. Raw tenant data never leaves the tenant partition. Only statistical aggregates — with k-anonymity floor of 50 tenants per data point — are used for cross-tenant intelligence.
