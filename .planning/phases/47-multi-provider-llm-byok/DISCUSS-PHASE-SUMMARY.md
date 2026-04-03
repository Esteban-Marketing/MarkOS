# Phase 47 Discuss-Phase Decision Summary

**Date:** 2026-04-02  
**Facilitation Outcome:** ✅ Discuss phase complete; 7 design decisions locked; ready for planning

---

## 🎯 Scope Reframe

| Dimension | Original Phase 47 | **Proposed Phase 47** |
|---|---|---|
| **Goal** | Auto-generate OpenAPI spec from contracts | Ship multi-provider LLM BYOK abstraction layer |
| **Focus** | API documentation & contract versioning | Operator autonomy + cost control in LLM selection |
| **Key Deliverable** | `api/openapi.yaml` + versioning policy | `/llm/adapter.ts` + BYOK key management |
| **Why Now** | Contracts stable from Phase 45 | Removes bottleneck; enables downstream phases |
| **Competitive Edge** | Standard (expected for v3.1.0) | Differentiator (BYOK flexibility vs. single-provider) |

**Rationale:** LLM BYOK infrastructure is a leverage point for Phase 47–50. Operators autonomy (choose Claude, OpenAI, or Gemini) is a market differentiator. OpenAPI generation can proceed as Phase 47b without blocking Phase 48+.

---

## 🔒 7 Locked Design Decisions

### **D-01: Provider Selection Strategy**
```
When an operator has multiple keys configured, which provider wins?

✅ CHOSEN: Operator-specified per-call with intelligent fallback

Priority order:
1. Explicit override: call({ provider: 'claude', ... })
2. Task/flow-level config: operator selects at task time
3. Operator preference: default in profile
4. Tenant default: org-level fallback
5. System default: first available

Benefits:
  • Operator retains control
  • Graceful fallback on failure (resilience)
  • Telemetry tracks all decisions for analysis
```

---

### **D-02: Secret Storage (Hybrid Progressive Model)**
```
How do we store operator-provided API keys without security risk?

✅ CHOSEN: Hybrid approach for Phase 47 → 48+ progression

Phase 47: MarkOSDB with Supabase Vault encryption
  • Keys submitted via CLI: npx markos llm:config
  • Stored encrypted; never exposed in logs
  • Simple for initial deployment

Phase 48+: Operator-hosted secrets (optional upgrade)
  • Operator provides credential endpoint (e.g., AWS Secrets Manager)
  • MarkOS fetches temporary credentials on-demand (5 min TTL)
  • Operator retains full key control (enterprise requirement)

Benefits:
  • Ship Phase 47 without complexity
  • Enterprise path available later
  • No breaking changes to operators choosing MarkOSDB
```

---

### **D-03: Cost Telemetry Architecture**
```
How do we track LLM usage costs per operator?

✅ CHOSEN: Structured telemetry events with token-level metrics
           Operator-supplied cost rates in Phase 47 → live pricing API Phase 48+

Event schema (emitted after every call):
{
  "event_name": "markos_llm_call_completed",
  "provider": "anthropic" | "openai" | "gemini",
  "model": "claude-3-5-haiku-20241022",
  "input_tokens": 450,
  "output_tokens": 320,
  "total_tokens": 770,
  "estimated_cost_usd": 0.0042,
  "context": { "operator_id", "task_id", "flow_domain", "campaign_id" }
}

Cost calculation:
  Phase 47: Operator provides cost-per-token in config
    {
      "anthropic": {
        "claude-3-5-haiku": { "input": 0.80, "output": 4.00 per MTok }
      }
    }
  
  Phase 48+: Query live pricing from provider APIs

Benefits:
  • Vendor-agnostic; easy to add providers
  • Operator can compare costs before switching
  • Costs tracked even if no pricing configured
```

---

### **D-04: Error Handling & Resilience**
```
If Claude times out, should we auto-retry with OpenAI?

✅ CHOSEN: Smart fallback with operator override

Default behavior:
  • Try primary provider
  • If timeout / rate limited / auth error → try fallback chain
  • Telemetry tracks all attempts + reason for switch

Operator can disable per-call: call({ noFallback: true, ... })
  • Ensures deterministic behavior for high-stakes calls
  • Trades resilience for predictability

Telemetry includes:
  • original_provider, final_provider, fallback_attempts
  • error codes per provider
  • decision reason (explicit/default/fallback)

Benefits:
  • Production resilience by default
  • Transparency (all attempts visible)
  • Operator choice when needed
```

---

### **D-05: API Contract & Type Safety**
```
What should the unified LLM call interface look like?

✅ CHOSEN: Full TypeScript migration with backward compatibility

New (recommended):
  lib/markos/llm/adapter.ts (TypeScript)
    → call(systemPrompt, userPrompt, options): Promise<LLMCallResult>
    → callClaude(...), callOpenAI(...), callGemini(...)
    → Strict types; no `any` violations
    → Full IDE autocomplete

Legacy (supported for transition):
  onboarding/backend/agents/llm-adapter.cjs (CommonJS)
    → Maintained as wrapper for backward compatibility
    → Dual-path tests ensure identical behavior
    → Deprecated by Phase 49

Interfaces exported:
  • LLMCallOptions (provider, model, max_tokens, temperature, timeout_ms, fallbackChain, metadata)
  • LLMCallResult (ok, text, provider, model, usage, latency_ms, error, telemetry_event_id)

Benefits:
  • New code is type-safe (catches misconfig at dev time)
  • Old code keeps working (no mid-phase breaking changes)
  • Clear deprecation path for legacy wrapper
```

---

### **D-06: Configuration Storage**
```
How do operators specify which providers they have keys for?

✅ CHOSEN: Operator profile in MarkOSDB + env var fallback

MarkOSDB schema (new table):
  operator_llm_preferences {
    operator_id: UUID (FK),
    available_providers: JSON (e.g., {"anthropic": true, "openai": true}),
    primary_provider: ENUM ('anthropic' | 'openai' | 'gemini'),
    cost_budget_monthly_usd: DECIMAL,
    allow_fallback: BOOLEAN (default: true)
  }

Setup flow:
  Phase 47 includes migration script
  Operator runs: npx markos llm:config
    → Interactive wizard asks for keys, budget, preferences
    → Keys encrypted and stored in vault
    → Preferences persisted to profile table

Fallback for local development:
  If profile not found, check env vars (old behavior)
  ANTHROPIC_API_KEY → OPENAI_API_KEY → GEMINI_API_KEY

Benefits:
  • Per-operator isolation (multi-tenant ready)
  • Deterministic config (no surprise env var picks)
  • Easy operator onboarding with wizard
```

---

### **D-07: Monitoring & Observability**
```
How do operators know cost, usage, and status?

✅ CHOSEN: CLI-first observability; dashboard as secondary

Phase 47 CLI commands:
  npx markos llm:status [--month=2026-04]
    Displays dashboard in terminal:
    ┌─────────────────────────────────┐
    │ LLM Usage (April 2026)          │
    ├─────────────────────────────────┤
    │ Provider   │ Calls │ Cost   │   │
    │ Anthropic │ 1,240 │ $4.20  │   │
    │ OpenAI    │   340 │ $2.10  │   │
    │ Gemini    │    45 │ $0.02  │   │
    ├─────────────────────────────────┤
    │ Total: $6.32 / $100.00 budget   │
    └─────────────────────────────────┘

  npx markos llm:providers
    Lists configured providers + validation status

  npx markos llm:config
    Interactive setup wizard (rerun to update)

Alerts:
  • markos_llm_budget_80_percent event (80% of monthly budget)
  • markos_llm_budget_100_percent event (over budget)
  • Provider-specific errors in telemetry (rate limits, auth failures)

Dashboard integration (Phase 48+):
  Same telemetry backend feeds analytics dashboard
  No separate UI layer needed in Phase 47

Benefits:
  • Operators have immediate visibility
  • CLI is vendor-neutral (doesn't depend on UI server)
  • Easy to troubleshoot (CLI shows full chain of attempts)
```

---

## 📊 Summary: What Gets Built

| Component | What It Does | Complexity |
|---|---|---|
| **`lib/markos/llm/adapter.ts`** | Unified TypeScript interface for all LLM calls | HIGH |
| **`lib/markos/llm/provider-registry.ts`** | Provider metadata (default models, cost rates) | MEDIUM |
| **`lib/markos/llm/settings.ts`** | Config schema & validation | MEDIUM |
| **`lib/markos/llm/telemetry-adapter.ts`** | Wraps all calls with telemetry emission | MEDIUM |
| **`lib/markos/llm/cost-calculator.ts`** | Token → cost conversion | MEDIUM |
| **`bin/llm-config.cjs`** | Interactive CLI for key setup | MEDIUM |
| **`bin/llm-status.cjs`** | CLI dashboard for cost/usage | MEDIUM |
| **Database migration** | Add operator_llm_preferences + operator_api_keys | MEDIUM |
| **Test suite** | Unit + integration tests (all providers + fallback) | HIGH |
| **Documentation** | LLM architecture guide + operator guide | MEDIUM |

**Estimated Effort:** 8–10 plans across 5 waves

---

## ⚠️ Gray Areas (Stakeholder Input Needed)

| Gray Area | Options | Recommendation |
|---|---|---|
| **Multi-tenant operator budgeting** | Per-operator or per-role? | Suggest: Per-operator (more flexible); per-role can be on top |
| **Provider pricing refresh frequency** | Daily? Weekly? On-demand? | Suggest: Daily (Phase 47 hardcoded pricing); weekly (Phase 48) |
| **Fallback chain templates** | Free-form or pre-built (cost_optimized, speed_optimized)? | Suggest: Free-form (less code); templates in Phase 48 |
| **Customer cost billing** | Pass through to customer? Or aggregate? | Suggest: Track separately per operator; billing model TBD |
| **Default model per provider** | Hardcode or let operator pick? | Suggest: Hardcode in Phase 47 (Claude Haiku, GPT-4o-mini, Gemini 2.5); Phase 48 allows picking |

---

## 📋 Roadmap Impact

**Current Situation:**
```
Phase 45: Flow Inventory (COMPLETE ✅)
↓
Phase 46: Operator Task Graph UI (COMPLETE ✅)
↓
Phase 47: OpenAPI Generation (original plan)
↓
Phase 48–50: Contract testing, RBAC, Operator onboarding
```

**After This Pivot:**
```
Phase 45: Flow Inventory (COMPLETE ✅)
↓
Phase 46: Operator Task Graph UI (COMPLETE ✅)
↓
Phase 47: Multi-Provider LLM BYOK (NEW! replaces OpenAPI)
↓
Phase 47b: OpenAPI Generation (NEW! deferred, can run in parallel with Phase 48)
↓
Phase 48: Contract Testing + Live Pricing Integration
↓
Phase 49: RBAC Hardening
↓
Phase 50: Operator Onboarding
```

**Timeline Impact:**
- ✅ No impact to overall v3.1.0 milestone (OpenAPI moves from 47 → 47b, non-blocking)
- ✅ Phase 47 LLM work enables Phase 48+ (foundation layer)
- ✅ Phase 47b can proceed in parallel with Phase 48 without dependency

---

## ✅ Ready for Next Step?

**Discuss phase complete.** All 7 design decisions locked; 8–10 plan estimates; roadmap impact analyzed.

**To proceed to plan-phase 47:**

```bash
/gsd:plan-phase 47
```

**This will:**
1. Create `.planning/phases/47-multi-provider-llm-byok/47-PLAN.md` with detailed Wave 1–5 breakdown
2. Assign specific tasks to each plan (47-01 through 47-10)
3. Lock start/end criteria for each plan
4. Provide execution checklist for Wave 1 onward

---

## 🎯 Your Choice

**Option A: Proceed with LLM BYOK pivot**
- Approve the 7 design decisions (D-01 through D-07)
- Move gray areas to stakeholder review (or defer to planning phase)
- Execute: `/gsd:plan-phase 47`

**Option B: Reconsider & discuss further**
- Flag specific gray areas above for deeper discussion
- Revise design decisions (e.g., change D-02 from hybrid to MarkOSDB-only)
- Re-run discuss-phase with updated parameters

**Option C: Keep original OpenAPI scope for Phase 47**
- Decline the scope pivot
- Keep Phase 47 as "OpenAPI Generation"
- Create Phase 47b for "Multi-Provider LLM BYOK"
- Adjust roadmap milestone (Phase 47b becomes phase 48, shifts downstream)

---

**What's your direction?**
