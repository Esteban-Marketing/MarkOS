---
phase: 47
phase_name: Multi-Provider LLM BYOK
document_type: Gray Area Analysis & Recommendations
completed_by: gsd-advisor-researcher
date: "2026-04-02T23:50:00Z"
status: READY FOR PHASE 47 WAVE 1 KICKOFF
---

# Phase 47: Gray Area Decisions — Resolved ✅

## Executive Summary

**5 gray area decisions analyzed and resolved with HIGH confidence recommendations.**

All recommendations are **backward-compatible with Phase 48+** (no blocking decisions; deferrable features marked for future phases).

---

## Decision Matrix (Quick Reference)

| Gray Area | Phase 47 Decision | Confidence | Phase 48+ Path |
|-----------|---|---|---|
| **GA-1: Multi-tenant Budgeting** | ✅ **Per-operator** | HIGH | Per-operator + per-role override (if requested) |
| **GA-2: Pricing Refresh** | ✅ **Static (weekly deferred)** | HIGH | Live pricing APIs (Phase 48 backfill) |
| **GA-3: Fallback Chains** | ✅ **Pre-built templates** (3x) | MEDIUM-HIGH | Free-form override + CLI wizard (Phase 48) |
| **GA-4: Cost Billing** | ✅ **Aggregate w/ 10% margin** | HIGH | Expand margin tiers by operator segment |
| **GA-5: Default Models** | ✅ **Hardcoded (cost-optimized)** | HIGH | Operator-selectable models (Phase 48) |

---

## Detailed Recommendations

### GA-1: Multi-Tenant Operator Budgeting

**Decision:** ✅ **Per-operator budgeting**

**Why:** 
- Aligns with BYOK autonomy philosophy (Phase 47 value prop)
- Each operator gets independent monthly budget; self-serve cost control
- Unlocks per-operator analytics (LTV, churn prediction, upgrade propensity)

**Implementation (Phase 47):**
- `operator_llm_preferences.cost_budget_monthly_usd` tracks per-operator limit
- On each LLM call, check accumulated cost < budget; emit alert at 80%/100%
- Simple SQL: `SELECT SUM(estimated_cost_usd) FROM markos_llm_call_events WHERE operator_id = X AND MONTH = Y`

**Phase 48+ Path:**
- If pilot requests per-role budgeting, add schema field `budget_holder: 'operator' | 'role'`
- No breaking change; operators default to per-operator (existing behavior)

**Confidence:** HIGH

---

### GA-2: Pricing Refresh Frequency

**Decision:** ✅ **Static snapshot (hardcoded) in Phase 47; weekly fetch deferred to Phase 48**

**Why:**
- Phase 47 cost telemetry uses operator-supplied static rates (not live)
- Live pricing API integration was explicitly deferred to Phase 48 in research
- Daily updates = wasted infrastructure cost for unused feature
- Weekly is sufficient for Phase 48+ historical trend analysis

**Implementation (Phase 47):**
- Use hardcoded rates in `lib/markos/llm/provider-registry.ts`:
  ```
  anthropic: input: $0.80/1M, output: $4.00/1M
  openai:    input: $0.15/1M, output: $0.60/1M
  gemini:    input: $0.075/1M, output: $0.30/1M
  ```
- Operator can override via config (manual update path)

**Phase 48+ Path:**
- Implement scheduled weekly job (Lambda/cron) to fetch current rates from APIs
- Populate `provider_pricing_history` table (enables retrospective cost trending)

**Confidence:** HIGH

---

### GA-3: Fallback Chain Templates

**Decision:** ✅ **Pre-built templates for Phase 47; free-form in Phase 48**

**Why:**
- Reduces operator decision paralysis at launch (fewer choices = faster adoption)
- Pre-built templates embed MarkOS domain expertise
- Phase 47 is wave 1 (cost-optimized defaults); Phase 48 adds flexibility

**Implementation (Phase 47):**
- Three templates:
  1. **`cost_optimized`** → `[gemini-2.5-flash, gpt-4o-mini, claude-3-5-haiku]`
  2. **`speed_optimized`** → `[claude-3-5-sonnet, gpt-4o, gemini-pro]`
  3. **`reliability_optimized`** → `[anthropic, openai, gemini]` (default robust order)
- Default: `cost_optimized`
- Config: `operator_llm_preferences.fallback_template` (enum)
- CLI wizard: "Which template? (1) Cost-optimized [default], (2) Speed, (3) Reliability"

**Phase 48+ Path:**
- Add `--custom-chain` CLI flag for free-form ordering
- Add schema field `custom_fallback_chain: ['provider1', 'provider2', ...]`
- Override logic: if `custom_chain` set, use it; else use template

**Confidence:** MEDIUM-HIGH

---

### GA-4: Customer Cost Billing

**Decision:** ✅ **Aggregate billing with 10% margin (platform orchestration fee)**

**Why:**
- Phase 47 orchestration work (fallback chains, cost tracking, key encryption, telemetry) costs MarkOS money
- Pass-through pricing is unsustainable long-term (platform invests, operators pocket savings)
- Aggregate model with transparent margin is SaaS standard (Stripe, AWS, etc.)
- Enables reinvestment in Phase 48+ optimization (ML routing, cost prediction)

**Implementation (Phase 47):**
- Cost telemetry: `markos_llm_call_events.estimated_cost_usd` (base cost from provider rates)
- Billing logic at month-end:
  ```
  base_cost = SUM(estimated_cost_usd) for operator in month
  margin = base_cost * 0.10
  invoice = base_cost + margin
  ```
- Invoice line item: "MarkOS LLM Services (platform orchestration): $XX.XX"
- Transparency: Operator can see breakdown (base cost vs. margin) in `llm:status` dashboard

**Rationale for 10% margin:**
- Covers MarkOS ops cost (Supabase, compute, monitoring)
- Competitive with cloud margins (AWS: 10-15%, Stripe: 2.2% + per-item fee + markup)
- Justifiable via transparent "platform orchestration" messaging

**Phase 48+ Path:**
- Segment operators by tier:
  - **Free tier:** Pass-through (no margin; loss leader)
  - **Pro tier:** 12% margin (premium support, forecasting, routing)
  - **Enterprise:** Negotiated margin (15-20%)

**Confidence:** HIGH

---

### GA-5: Default Model per Provider

**Decision:** ✅ **Hardcoded cost-optimized defaults in Phase 47**

**Why:**
- Phase 47 is "wave 1" (cost-optimized freemium launch); shoot for lowest cost
- Hardcoded defaults (Haiku, gpt-4o-mini, Gemini 2.5 Flash) minimize operator bills → reduce churn
- Aligns with freemium positioning (free tier = cheapest models)
- Backward-compatible with Phase 48 customization

**Implementation (Phase 47):**
- `lib/markos/llm/provider-registry.ts`:
  ```typescript
  default_model: {
    anthropic: "claude-3-5-haiku-20241022",
    openai: "gpt-4o-mini",
    gemini: "gemini-2.5-flash"
  }
  ```
- No config needed; all operators use these defaults
- Cost benefit: Haiku ($0.80/MTok) << Opus ($10/MTok); gpt-4o-mini ($0.15/MTok) << gpt-4 ($3/MTok)

**Phase 48+ Path:**
- Add `operator_llm_preferences.preferred_model_per_provider` (JSON) in migration
- Operator can upgrade to Sonnet/Opus (higher cost = higher margin for MarkOS)
- Intent-based routing (ML model) can recommend model based on task complexity
- Example: "This task requires Claude Opus for accuracy; upgrade to Pro to unlock"

**Confidence:** HIGH

---

## Phase 47 Wave 1 Execution (Locked Decisions)

### Configuration Schema (Updated)

All decisions baked into `operator_llm_preferences` table:

```typescript
operator_llm_preferences {
  operator_id: UUID,
  available_providers: ["anthropic", "openai", "gemini"],   // GA-1 (per-operator)
  primary_provider: "anthropic",
  cost_budget_monthly_usd: 100.00,                           // GA-1
  allow_fallback: true,
  fallback_template: "cost_optimized",                       // GA-3 (pre-built templates)
  // Reserved for Phase 48:
  // custom_fallback_chain?: ["provider1", "provider2"],    // GA-3 free-form defer
  // preferred_model_per_provider?: { anthropic: "claude-opus" }, // GA-5 defer
}
```

### Billing Schema (New Table)

```sql
operator_llm_billing_summary {
  id: UUID,
  operator_id: UUID,
  month: DATE,
  base_cost_usd: DECIMAL,           -- GA-4 (sum of telemetry)
  margin_usd: DECIMAL,              -- GA-4 (10% margin)
  total_cost_usd: DECIMAL,          -- GA-4 (invoice total)
  created_at: TIMESTAMP
}
```

### CLI/UX (Phase 47 Implementation)

**`npx markos llm:config` wizard flow:**

```
1. Select available providers (checkbox): Claude, OpenAI, Gemini
2. Enter API keys (hidden input)
3. Set monthly budget (default $100) ← GA-1
4. Choose fallback strategy:
   (1) Cost-optimized [default]      ← GA-3 template 1
   (2) Speed-optimized
   (3) Reliability-optimized
   → Stores as fallback_template

5. Review & confirm
6. Test LLM call (optional)
```

**`npx markos llm:status` dashboard:**

```
┌────────────────────────────────────────┐
│ LLM Usage & Cost (April 2026)         │
├──────────────┬────────┬──────┬────────┤
│ Provider     │ Calls  │ Cost │ Budget │
├──────────────┼────────┼──────┼────────┤
│ Anthropic    │ 1,240  │ $4.20│ 4.2%   │
│ OpenAI       │   340  │ $2.10│ 2.1%   │
│ Gemini       │    45  │ $0.02│ <0.1%  │
├──────────────┼────────┼──────┼────────┤
│ Subtotal     │ 1,625  │ $6.32│        │
│ Margin (10%) │        │ $0.63│        │  ← GA-4 displayed
├──────────────┼────────┼──────┼────────┤
│ TOTAL COST   │        │ $6.95│        │
│ Budget       │        │$100  │        │  ← GA-1 per-operator
│ Remaining    │        │$93.05│ 93.1%  │
└──────────────┴────────┴──────┴────────┘
```

---

## Risk Mitigation

| Decision | Risk | Mitigation |
|----------|------|-----------|
| GA-1: Per-operator | Operator confusion (no shared budgets) | Clearly document in onboarding; Phase 48 adds per-role if requested |
| GA-2: Static pricing | Rates become stale (provider price changes) | Weekly manual review in Phase 47; weekly auto-fetch in Phase 48 |
| GA-3: Pre-built templates | Operator churn (wants custom chain) | Deferred to Phase 48; add `--alpha-custom-chain` flag for power users in Wave 4 CLI |
| GA-4: Aggregate margin | Operator perception of "MarkOS tax" | Transparent messaging: "Platform orchestration fee"; show breakdown in dashboard |
| GA-5: Hardcoded models | Operator stuck with Haiku (has Opus key) | Phase 48 upgrades unlock model selection; market as "Pro feature" for upsell |

---

## Confidence Baseline

- **HIGH:** GA-1, GA-2, GA-4, GA-5 (all reduce scope, align with freemium positioning, backward-compatible)
- **MEDIUM-HIGH:** GA-3 (pre-built templates; depends on pilot feedback for custom chains)

**Overall Confidence on All 5 Decisions:** **HIGH**

All recommendations support Phase 47 launch goal (wave 1 cost-optimized freemium) while preserving Phase 48+ customization paths.

---

## Phase 48+ Roadmap (Deferred Features)

| GA | Phase 47 Decision | Phase 48 Enhancement | Effort |
|----|---|---|---|
| GA-1 | Per-operator only | Add per-role override (schema-neutral) | MEDIUM |
| GA-2 | Static snapshot | Live pricing API + weekly fetch | MEDIUM |
| GA-3 | Pre-built templates | Free-form chains + CLI wizard | LOW |
| GA-4 | 10% fixed margin | Tiered margins (Free/Pro/Enterprise) | LOW |
| GA-5 | Hardcoded models | Operator-selectable + ML routing recommendations | MEDIUM |

---

## Sign-Off

**Ready for Phase 47 Wave 1 Execution** ✅

All gray area decisions resolved with:
- ✅ Reduced Phase 47 scope (ship wave 1 faster)
- ✅ Backward-compatible Phase 48 paths (no rework needed)
- ✅ Freemium positioning aligned (cost-optimized defaults, transparent margin)
- ✅ Operator autonomy preserved (BYOK philosophy maintained)

Execute `/gsd:execute-phase 47` to begin Wave 1 kickoff.
