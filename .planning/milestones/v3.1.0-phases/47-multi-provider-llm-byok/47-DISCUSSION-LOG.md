# Phase 47 Discuss Phase: Multi-Provider LLM BYOK Abstraction Layer

**Date:** 2026-04-02  
**Facilitator:** GitHub Copilot (GSD discuss-phase)  
**Scope Pivot:** Original roadmap Phase 47 (OpenAPI generation) → Multi-provider LLM BYOK infrastructure  
**Stakeholders:** Platform engineers, product leadership

---

## I. Phase Boundary & Scope Reframe

### Original Phase 47 (from v3.1.0 Roadmap)
```
Goal: Auto-generate authoritative OpenAPI spec from contract files
Deliverables: bin/generate-openapi.cjs, api/openapi.yaml per-flow contracts,
              API-VERSIONING-POLICY.md, CI enforcement
Success Criteria: Spec valid against OpenAPI 3.0, 100% flow coverage
```

### Proposed Phase 47 (Multi-Provider LLM BYOK)
```
Goal: Ship production-grade, multi-provider LLM abstraction layer with 
      bring-your-own-key (BYOK) support, enabling operators to use Claude, 
      OpenAI, or Gemini seamlessly within the MarkOS platform

Deliverables: Provider abstraction API, BYOK configuration system, 
              cost & usage telemetry, CLI tooling for provider management,
              comprehensive test coverage

Success Criteria: Single interface for all LLM calls; zero code changes needed 
                  to switch providers; per-operator key management; cost tracking
```

### Strategic Rationale
- **Existing Foundation:** `onboarding/backend/agents/llm-adapter.cjs` already has basic multi-provider support (OpenAI, Anthropic, Gemini)
- **Market Advantage:** BYOK flexibility is a competitive differentiator vs. single-provider platforms
- **Operator Choice:** Enables operators to use their preferred provider + API keys without needing engineering infrastructure changes
- **Cost Optimization:** Enables cost comparison and provider switching based on workload patterns
- **Roadmap Timing:** Phase 46 established operator-facing task graph UI; Phase 47 BYOK makes operators autonomous in LLM choices

---

## II. Design Decision Discussion

### D-01: Provider Selection Strategy (BYOK Hierarchy)

**Question:** Which provider takes precedence when an operator has multiple keys configured?

**Option A: Operator-specified per-call (Recommended)**
```
Priority order per call:
1. Explicit override: call({ provider: 'claude', ... })
2. Task/flow-level config: operator selects at task creation time
3. Operator default preference: stored in operator profile
4. Tenant default: organization-level fallback
5. System default: Platform default (first available)
```
- **Pros:** Maximum flexibility; operator retains control per action
- **Cons:** Requires explicit config at multiple levels; decision paralysis risk
- **Best for:** Heterogeneous use cases (cost optimization, feature switching)

**Option B: Stateless fallback (Simpler)**
```
Auto-detect from available keys in priority order:
1. ANTHROPIC_API_KEY (if set, use Claude)
2. OPENAI_API_KEY (if set, use OpenAI)
3. GEMINI_API_KEY (if set, use Gemini)
```
- **Pros:** Simple; first-use is automatic; no config friction
- **Cons:** No operator control; can lead to unexpected provider switches
- **Best for:** Single-provider operators

**Option C: Operator intent-based routing (Most sophisticated)**
```
Route based on task intent:
- "Generate campaign names" → Use smallest/fastest model (Gemini)
- "Map content strategy" → Use most capable (Claude 3.5 Sonnet)
- "Summarize user feedback" → Use most cost-effective (OpenAI gpt-4o-mini)
```
- **Pros:** Automatic optimization; best outcome per workload type
- **Cons:** Requires ML routing model; high implementation complexity
- **Best for:** Enterprise deployments with cost/performance SLAs

**Recommendation:** **Option A (Operator-specified with thoughtful fallback)** — balances flexibility and simplicity.

---

### D-02: BYOK Secret Storage & Rotation

**Question:** Where and how do we store operator-provided API keys without introducing security risk?

**Option A: Encrypted in MarkOSDB (Supabase)**
```
Schema:
  operator_api_keys (
    id UUID PK,
    operator_id UUID FK,
    provider ENUM ('openai' | 'anthropic' | 'gemini'),
    encrypted_api_key VAULT_ENCRYPTED TEXT,
    rotated_at TIMESTAMP,
    label VARCHAR (friendly name)
  )

Encryption: Supabase vault (server-side, key material never leaves DB server)
TTL policy: Refresh/rotate every 90 days (warning at 75 days)
```
- **Pros:** Centralized; Supabase vault handles encryption; audit trail built-in
- **Cons:** Keys leave operator's infrastructure; trust model depends on Supabase security
- **Best for:** SaaS deployment; operators accept shared infrastructure

**Option B: Operator-hosted secret reference (Maximum autonomy)**
```
Operator provides:
  - Service account credentials (e.g., AWS Secrets Manager ARN)
  - Generates temporary credentials on-demand
  - MarkOS never stores the actual key

At call time:
  1. MarkOS calls operator's credential endpoint
  2. Operator's IAM system validates the request
  3. Operator returns temporary credentials (5 min TTL)
  4. MarkOS calls LLM provider with temp credentials
```
- **Pros:** Operator retains full key control; MarkOS has zero persistent secrets
- **Cons:** Operator infrastructure dependency; network latency on each call; high implementation complexity
- **Best for:** Enterprise with SOC 2 compliance or self-hosted deployments

**Option C: Hybrid (Progressive enrollment)**
```
Phase 47: Accept encrypted keys in MarkOSDB (Option A)
Phase 48+: Support operator-hosted secrets (Option B add-on)
          Allow operators to toggle between modes per provider
```
- **Pros:** Ship Phase 47 with Option A; defer complexity; operators can upgrade
- **Cons:** Two code paths; double maintenance
- **Best for:** Iterative rollout; risk-averse platform team

**Recommendation:** **Option C (Hybrid)** — Ship with Option A in Phase 47; make Option B possible in Phase 48+ without breaking existing operators.

---

### D-03: Cost Attribution & Metering (Telemetry Integration)

**Question:** How do we track LLM usage costs per operator without vendor lock-in?

**Approach: Structured telemetry event with provider-agnostic metrics**
```typescript
// Emitted after every LLM call
{
  event_name: 'markos_llm_call_completed',
  timestamp: ISO8601,
  payload: {
    operator_id: 'op-abc123',
    task_id: 'task-xyz',
    provider: 'anthropic' | 'openai' | 'gemini',
    model_name: 'claude-3-5-haiku-20241022',
    
    // Normalized metrics (independent of provider)
    input_tokens: 450,
    output_tokens: 320,
    total_tokens: 770,
    
    // Provider-specific cost calculation (done at telemetry ingest time)
    estimated_cost_usd?: 0.0042,
    estimated_cost_currency?: 'USD',
    
    // Context for attribution
    context: {
      flow_domain: 'content',
      flow_type: 'mir-generation',
      campaign_id?: 'camp-123'
    },
    
    // Outcome for quality tracking
    outcome: 'success' | 'error' | 'rate_limited',
    latency_ms: 1240,
    error_code?: 'ERR_RATE_LIMITED'
  }
}
```

**Cost Calculation Strategy:**
- **Phase 47:** Operator must supply cost-per-token rates (via config)
  ```json
  {
    "anthropic": {
      "claude-3-5-haiku-20241022": {
        "input_cost_per_mtok": 0.80,
        "output_cost_per_mtok": 4.00
      }
    },
    "openai": { ... },
    "gemini": { ... }
  }
  ```
- **Phase 48+:** Query live pricing from provider APIs (OpenAI, Anthropic, Google APIs)
- **Fallback:** If no pricing configured, skip cost attribute (telemetry still emitted for usage tracking)

**Recommendation:** Emit normalized telemetry in Phase 47; defer live pricing API integration to Phase 48.

---

### D-04: Error Handling & Provider Fallback Strategy

**Question:** If Claude times out, should we automatically retry with OpenAI? Or fail fast?

**Option A: Fail-fast (Strict provider preference)**
```
call({ provider: 'claude', ... })
  → If Claude fails, throw error immediately
  → Operator must handle retry / provider switch
  → Clear feedback about provider-specific issues
```
- **Pros:** Predictable behavior; operator accountability; easy debugging
- **Cons:** User-facing failures if operator's key is empty; friction
- **Best for:** Debugging; expert users

**Option B: Smart fallback (Graceful degradation)**
```
call({ provider: 'claude', fallbackChain: ['openai', 'gemini'], ... })
  → Try Claude
  → If timeout or rate limit → Try OpenAI
  → If OpenAI fails → Try Gemini
  → If all fail → Throw aggregated error

Telemetry emits: original_provider + final_provider + attempts (for analysis)
```
- **Pros:** Resilience; reduced user-facing failures; transparent chain
- **Cons:** Harder to debug; multiple API calls on failure; cost implications
- **Best for:** Production resilience; cost-conscious deployments

**Option C: Operator-configured policies (Declarative)**
```
Config:
  {
    "llm_policy": {
      "primary": "claude",
      "fallback_strategy": "cost_optimized",  // or "speed_optimized"
      "failover_chain": ["openai", "gemini"],
      "max_retries": 2,
      "retry_delay_ms": 500
    }
  }
```
- **Pros:** Flexible; can match operator risk tolerance
- **Cons:** High config complexity; potential for misconfiguration
- **Best for:** Enterprise deployments

**Recommendation:** **Option B with operator override** — Default to smart fallback; allow operators to disable via config for specific high-stakes calls.

---

### D-05: API Contract & Type Safety

**Question:** What should the unified LLM call interface look like?

**Proposed Contract (TypeScript):**
```typescript
// llm/adapter.ts — Public interface
export interface LLMCallOptions {
  provider?: 'openai' | 'anthropic' | 'gemini';  // Override default
  model?: string;                                 // Override default model for this provider
  max_tokens?: number;                            // Default: 1200
  temperature?: number;                           // Default: 0.4
  top_p?: number;                                 // Default: 1.0
  timeout_ms?: number;                            // Default: 30000
  fallbackChain?: string[];                        // If primary fails, try these providers
  metadata?: {
    task_id?: string;
    operator_id?: string;
    campaign_id?: string;
  };
}

export interface LLMCallResult {
  ok: boolean;
  text?: string;           // The LLM's response
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;           // Actual model used
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
  error?: {
    code: string;          // 'ERR_TIMEOUT', 'ERR_RATE_LIMIT', 'ERR_INVALID_KEY', etc.
    message: string;
    provider_error?: unknown;
  };
  telemetry_event_id?: string;  // For tracing in telemetry backend
}

export async function call(
  systemPrompt: string,
  userPrompt: string,
  options?: LLMCallOptions
): Promise<LLMCallResult>;

// Also expose per-provider calls for explicit migration paths
export async function callClaude(...): Promise<LLMCallResult>;
export async function callOpenAI(...): Promise<LLMCallResult>;
export async function callGemini(...): Promise<LLMCallResult>;
```

**Backwards Compatibility:**
- Existing code using `llm-adapter.cjs` continues to work (adapter.cjs remains as legacy wrapper)
- New code uses TypeScript `/llm/adapter.ts` (recommended)
- CI ensures no regressions by running both paths in tests

---

### D-06: Provider Configuration Storage & Runtime Initialization

**Question:** How do operators specify which providers they have keys for?

**Option A: Environment variables (Current state)**
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```
- **Pros:** Simple; DevOps-friendly
- **Cons:** Not operator-specific; not auditable; sharing API keys in .env is a risk
- **Best for:** Local development; single-operator deployments

**Option B: Operator profile in MarkOSDB**
```sql
operator_llm_preferences (
  operator_id UUID PK FK,
  available_providers JsonB,  -- { "anthropic": true, "openai": true, "gemini": false }
  primary_provider ENUM,
  cost_budget_monthly_usd DECIMAL,
  access_keys TABLE (foreign key to operator_api_keys table)
)
```
- **Pros:** Per-operator config; auditable; enables multi-team setups
- **Cons:** DB schema change; requires migration from .env
- **Best for:** Multi-tenant deployments; operators with different budgets

**Option C: Hybrid config file (operators/config.yaml)**
```yaml
operators:
  op-abc123:
    name: "Alice (MarkOS Demo)"
    llm:
      primary: anthropic
      available:
        - anthropic
        - openai
      budget_monthly: 500.00
    
  op-xyz789:
    name: "Bob (Enterprise)"
    llm:
      primary: openai
      available:
        - openai
      budget_monthly: 2000.00
```
- **Pros:** Observable; version-controlled; can be gitignored for keys
- **Cons:** Maintainability; still requires key management elsewhere
- **Best for:** Small teams; early-stage deployments

**Recommendation:** **Option B (Operator profile in DB)** — Phase 47 writes schema migration; environment variables supported as temporary fallback during transition.

---

### D-07: Monitoring & Cost Alerts

**Question:** How do operators know if they're exceeding budget or running into issues?

**Proposed Observability:**
```typescript
// CLI command for operators
npx markos llm:status
// Output:
// ┌─────────────────────────────────────────┐
// │ LLM Provider Status (This Month)        │
// ├─────────────────────────────────────────┤
// │ Provider     │ Calls │ Cost   │ Tokens │
// │ Anthropic   │ 1,240 │ $4.20  │ 850K  │
// │ OpenAI      │  340  │ $2.10  │ 420K  │
// │ Gemini      │   45  │ $0.02  │  15K  │
// ├─────────────────────────────────────────┤
// │ Total Cost: $6.32                      │
// │ Budget: $100.00 (93.7% remaining)      │
// └─────────────────────────────────────────┘

// API endpoint for dashboard
GET /api/operators/{operatorId}/llm/usage?month=2026-04
// Returns: aggregated usage, cost, errors, provider breakdown
```

**Alerts:**
- **Cost threshold:** Emit `markos_llm_budget_80_percent` telemetry event when reaching 80% of monthly budget
- **Provider-specific errors:** Surface rate limits, quota exceeded, invalid key errors in operator UI
- **Latency tracking:** Track p50/p95/p99 latency per provider for performance trending

---

## III. Requirements Analysis

### New Requirements for Phase 47

| REQ-ID | Pillar | Description | Success Criteria |
|---|---|---|---|
| **LLM-01** | Infrastructure | Unified multi-provider LLM call interface | Single `call()` function used by all agents; zero provider-specific code in task runners |
| **LLM-02** | BYOK | Operator bring-your-own-key support | Operators can supply Claude, OpenAI, or Gemini keys via config; secrets not leaked in logs |
| **LLM-03** | Telemetry | Cost & usage attribution | Every call emitted with provider, model, tokens, estimated cost to telemetry; no call untracked |
| **LLM-04** | Resilience | Provider fallback strategy | Configurable fallback chain; automatic retry with degradation; telemetry of provider switches |
| **LLM-05** | Cost Control | Budget tracking & alerts | Per-operator monthly budget; alerts at 80% consumption; CLI and API reporting |
| **LLM-06** | Audit | Provider decision logging | Telemetry includes which provider was selected, why (explicit/default/fallback), total attempts |
| **LLM-07** | Type Safety | Full TypeScript contract | `/llm/adapter.ts` exports typed interfaces; no `any` types; runtime validation of options |

---

## IV. Scope & Sizing

### Planned Deliverables (Phase 47 MVP)

| Artifact | Purpose | Complexity |
|---|---|---|
| **`lib/markos/llm/adapter.ts`** | TypeScript interface + provider abstraction | HIGH |
| **`lib/markos/llm/settings.ts`** | Configuration schema & defaults | MEDIUM |
| **`lib/markos/llm/cost-calculator.ts`** | Cost estimation per call | MEDIUM |
| **`lib/markos/llm/telemetry-adapter.ts`** | Wrap all calls with telemetry emission | MEDIUM |
| **`bin/llm-config.cjs`** | CLI for operator key management | MEDIUM |
| **`bin/llm-status.cjs`** | CLI dashboard for cost/usage | MEDIUM |
| **Database migration** | Add operator_api_keys + preferences schema | MEDIUM |
| **`test/llm/adapter.test.js`** | Unit tests for all providers + fallback logic | HIGH |
| **`test/llm/telemetry.test.js`** | Telemetry emission verification | MEDIUM |
| **`.planning/codebase/LLM-ARCHITECTURE.md`** | Design documentation for Phase 48+ | LOW |
| **Storybook component** | LLM provider selector UI (dashboard integration) | LOW |

### Estimated Effort
- **8–10 plans** (higher than OpenAPI because multi-provider adds complexity)
- **Wave 1:** Adapter + TypeScript contract (plans 47-01 to 47-02)
- **Wave 2:** BYOK secret storage + operator profile schema (plans 47-03 to 47-04)
- **Wave 3:** Telemetry integration + cost tracking (plans 47-05 to 47-06)
- **Wave 4:** CLI tooling + dashboards (plans 47-07 to 47-08)
- **Wave 5:** Test coverage + verification (plans 47-09 to 47-10)

---

## V. Dependencies & Blockers

### ✅ Unblocked By — Existing Foundation
- `onboarding/backend/agents/llm-adapter.cjs` has working multi-provider support (can be refactored)
- MarkOSDB schema (`lib/markos/contracts/schema.ts`) ready for new tables
- Telemetry event union (`lib/markos/telemetry/events.ts`) extensible
- Phase 46 establishes operator context (operator_id available in all task contexts)

### 🟡 Lightweight Dependency — Phase 45 Outputs
- Flow registry + task context (already leveraged by Phase 46)
- Operator RBAC context (leverage to assign budget per operator role)

### ❌ Dead end (Original Phase 47) — What to do with OpenAPI generation?
**Options:**
1. **Defer OpenAPI to dedicated Phase 47b** — Create separate "OpenAPI Generation" phase after current Phase 47
2. **Move to Phase 48 as companion task** — Include as part of contract test framework setup
3. **Delegate to Phase 50+ scope** — Consider for v3.2.0 roadmap as lower priority

**Recommendation:** **Option 1 — Create Phase 47b (OpenAPI Generation)** — Keep roadmap intact; insert new LLM phase before OpenAPI; becomes Phase 47, OpenAPI becomes Phase 47b.

---

## VI. Decisions Summary & Next Steps

### Locked Design Decisions (Proposed for Phase 47)

| Decision | Choice | Rationale |
|---|---|---|
| **D-01** Provider Selection | Operator-specified with smart fallback | Maximum flexibility + reasonable defaults |
| **D-02** Secret Storage | Hybrid (MarkOSDB encrypted + operator-hosted option) | Ship Phase 47 with basic; enable enterprise path in Phase 48 |
| **D-03** Cost Telemetry | Structured events with operator-supplied rates | Vendor-agnostic; upgradeable to live pricing later |
| **D-04** Error Handling | Smart fallback with operator override | Production resilience without forcing complexity |
| **D-05** API Contract | Full TypeScript (new /llm/adapter.ts + legacy support) | Type safety for new code; backward compatibility |
| **D-06** Config Storage | Operator profile in MarkOSDB + env var fallback | Per-operator isolation; production-ready |
| **D-07** Monitoring | Telemetry-driven CLI + API dashboards | Observable; operator autonomy |

### Gray Area Decisions (To Discuss Further)

| Gray Area | Options to Explore | Stakeholder Input Needed |
|---|---|---|
| **Multi-tenant operator budgeting** | Is it per-operator or per-organization role? | Product leadership |
| **Provider pricing refresh frequency** | Daily? Weekly? Operator-triggered? | Finance/ops |
| **Fallback chain complexity** | Should there be templates (e.g., "cost-optimized") or free-form? | UX designer |
| **Customer-facing cost attribution** | Should we bill through our own APIs or pass through to provider? | Product/business dev |

---

## VII. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| **Key material exposure** — API keys leaked in logs/errors | HIGH | Sanitize all logs; use Supabase vault; disable echo on key input |
| **Provider API changes** — Anthropic/OpenAI/Google change their APIs | HIGH | Create provider-specific adapter layer; easy to patch one provider without affecting others |
| **Cost explosion** — Operator misconfigures fallback chain, hits all providers | MEDIUM | Default to single provider; flag in telemetry if >2 attempts per call; cost alerts |
| **Compatibility break** — Existing llm-adapter.cjs usage breaks | MEDIUM | Maintain cjs file as legacy wrapper; new code uses TypeScript; dual-run tests |
| **Telemetry overhead** — Emitting cost events on every call is noisy | MEDIUM | Batch telemetry; sample at 10% during high load; operator can configure sampling |

---

## VIII. Open Discussion Points

**For stakeholder review:**

1. **Scope pivot justified?** Is multi-provider LLM BYOK more valuable than OpenAPI generation for Phase 47?
   - *Current thinking:* Yes — LLM infra is leverage point for all downstream phases; BYOK is competitive edge.

2. **Hybrid secret management (D-02) in scope?** Can Phase 47 ship with MarkOSDB encryption only, deferring operator-hosted to Phase 48?
   - *Current thinking:* Yes — reduces Phase 47 complexity; Phase 48 can add enterprise path.

3. **Cost tracking detail level?** Track at per-call or per-task level? Per-task is higher overhead.
   - *Current thinking:* Per-call in telemetry (immutable); aggregate to per-task in analytics dashboard.

4. **Fallback strategy for operators?** Should it be opt-in or opt-out (default on)?
   - *Current thinking:* Opt-out (enabled by default for resilience); can disable via config for determinism on sensitive tasks.

5. **Timing for Phase 47b (OpenAPI)?** How does deferring API contract generation affect Phase 48/49 timeline?
   - *Current thinking:* Phase 47b can run in parallel with Phase 48 or serially after; no blocking dependency.

---

## IX. Recommended Next Action

**If stakeholders approve this scope pivot:**
1. Formalize these 7 design decisions as D-01 through D-07
2. Create `.planning/phases/47-multi-provider-llm-byok/47-CONTEXT.md` with full decision log
3. Proceed to **plan-phase 47** with 8–10 plans (Wave 1–5 breakdown)
4. Schedule decision review with product leadership on gray areas (multi-tenant budgeting, pricing refresh, etc.)

**If stakeholders prefer original OpenAPI scope:**
1. Keep Phase 47 as "OpenAPI Generation Pipeline"
2. Create new Phase 47b (inserted after Phase 47) for "Multi-Provider LLM BYOK"
3. Adjust overall roadmap sequencing (likely pushes Phase 48–50 by 1 phase)

---

**This discussion is ready for stakeholder input. Please confirm:**
- [ ] Scope pivot approved (LLM BYOK vs. OpenAPI)
- [ ] Design decisions D-01 through D-07 accepted
- [ ] Proceed to plan-phase 47?
- [ ] Any gray areas that need immediate decision?
