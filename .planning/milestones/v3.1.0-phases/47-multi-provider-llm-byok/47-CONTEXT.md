# Phase 47: Multi-Provider LLM BYOK Abstraction Layer - Context

**Gathered:** 2026-04-02  
**Status:** Discuss phase complete; frozen for planning

---

## Phase Boundary

Ship production-grade, multi-provider LLM abstraction layer enabling operators to seamlessly use Claude (Anthropic), OpenAI, or Gemini within MarkOS via bring-your-own-key (BYOK) configuration. Operators retain provider choice, cost control, and audit trails without code changes to task runners.

This phase DOES own:
- Unified LLM call interface (TypeScript contract)
- Operator-specific key management (MarkOSDB + Supabase vault)
- Cost attribution telemetry (per-call tracking)
- Provider fallback strategy (graceful degradation)
- CLI tooling for provider/key management
- Operator budget tracking & alerts
- Comprehensive test coverage (all providers + fallback paths)

This phase DOES NOT own:
- OpenAPI spec generation (deferred to Phase 47b)
- Live provider pricing API integration (deferred to Phase 48)
- Operator-hosted secret management (deferred to Phase 48+ as enterprise option)
- Advanced cost optimization (e.g., ML-based provider routing by workload type)

---

## Locked Design Decisions

### D-01: Provider Selection Strategy
**Decision:** Operator-specified per-call with intelligent fallback chain.
**Details:**
- Priority: explicit override → task-level config → operator preference → tenant default → system default
- Fallback enabled by default; operators can disable via flag for deterministic behavior
- Telemetry tracks original provider, final provider, and fallback attempts

### D-02: Secret Storage Model
**Decision:** Hybrid approach for Phase 47/48+ progression.
**Phase 47:**
- MarkOSDB (Supabase) with encrypted vault storage
- Operator submits keys via `npx markos llm:config` CLI
- Keys never exposed in UI, logs, or APIs
**Phase 48+ (Enterprise option):**
- Operator-hosted credentials (e.g., AWS Secrets Manager)
- MarkOS fetches temporary credentials on-demand
- Operator retains full key control

### D-03: Cost Telemetry Architecture
**Decision:** Structured events with token-level granularity; operator-supplied cost rates in Phase 47, live pricing in Phase 48+.
**Telemetry event schema:**
```json
{
  "event_name": "markos_llm_call_completed",
  "provider": "anthropic" | "openai" | "gemini",
  "model": "claude-3-5-haiku-20241022",
  "input_tokens": 450,
  "output_tokens": 320,
  "estimated_cost_usd": 0.0042,
  "context": { "operator_id", "task_id", "flow_domain" }
}
```

### D-04: Error Handling & Resilience
**Decision:** Smart fallback with operator override + detailed error attribution.
**Behavior:**
- Default: Try primary provider; on timeout/rate limit/auth error → try fallback chain
- Override: Operators can set `no_fallback: true` for strict provider preference
- Telemetry: Emit all attempts with provider-specific error codes for analysis

### D-05: API Contract & Type Safety
**Decision:** TypeScript interface migration with backward compatibility for existing llm-adapter.cjs.
**New:** `lib/markos/llm/adapter.ts` (TypeScript, strict types, recommended)
**Legacy:** `onboarding/backend/agents/llm-adapter.cjs` (CommonJS, maintained for transition period)
**Dual-path tests:** Ensure both paths work identically during migration window (2 phases)

### D-06: Configuration Storage
**Decision:** Operator profile in MarkOSDB with environment variable fallback for local development.
**Schema:** `operator_llm_preferences` table with available_providers, primary_provider, cost_budget_monthly_usd
**Fallback:** If profile not set, check OPENAI_API_KEY → ANTHROPIC_API_KEY → GEMINI_API_KEY (old behavior)
**Migration:** Phase 47 includes migration script; existing env var configs auto-promoted to profiles

### D-07: Monitoring & Observability
**Decision:** CLI-first observability with dashboard integration as secondary.
**Phase 47 CLI:**
- `npx markos llm:status [--month=2026-04]` — Cost/usage dashboard
- `npx markos llm:providers` — List configured providers & keys
- `npx markos llm:config` — Interactive setup wizard
**Dashboard:** Read from same telemetry backend; no separate UI layer needed in Phase 47

---

## Requirements Mapping

| REQ-ID | Description | Success Criteria |
|---|---|---|
| **LLM-01** | Unified multi-provider interface | All agents use `call()` from `/llm/adapter`; zero provider-specific code in task runners |
| **LLM-02** | BYOK for Claude, OpenAI, Gemini | Operators can supply keys via CLI; secrets not exposed in logs/telemetry |
| **LLM-03** | Cost attribution per call | All calls telemetered with provider, model, tokens, cost; ≥99% call tracking |
| **LLM-04** | Provider fallback & resilience | Configurable fallback chain; automatic retry; telemetry of all attempts |
| **LLM-05** | Budget tracking & alerts | Per-operator monthly budget; alerts at 80%, 100%; `npx markos llm:status` CLI reports |
| **LLM-06** | Audit trail | All provider decisions logged; telemetry includes why provider was selected |
| **LLM-07** | Type safety | TypeScript adapter with no `any` violations; runtime validation of options |

---

## Deliverables Inventory

### Core Infrastructure
- `lib/markos/llm/adapter.ts` — TypeScript multi-provider abstraction
- `lib/markos/llm/provider-registry.ts` — Provider enum + metadata (default models, cost rates)
- `lib/markos/llm/settings.ts` — Configuration schema & defaults
- `lib/markos/llm/telemetry-adapter.ts` — Wraps calls with telemetry emission
- `lib/markos/llm/cost-calculator.ts` — Token→cost conversion

### Data Layer
- Database migration: `supabase/migrations/add_operator_llm_preferences.sql`
  - `operator_llm_preferences` table
  - `operator_api_keys` table (encrypted vault storage)

### Operator Tooling
- `bin/llm-config.cjs` — Interactive CLI for key setup + provider selection
- `bin/llm-status.cjs` — Dashboard: cost/usage by provider, monthly budget tracking
- `bin/llm:providers.cjs` — List configured providers + validation

### Testing
- `test/llm/adapter.test.js` — Unit tests for all providers + fallback logic
- `test/llm/telemetry.test.js` — Telemetry emission + cost calculation
- `test/llm/secret-storage.test.js` — Key encryption/decryption + vault integration

### Documentation
- `.planning/codebase/LLM-ARCHITECTURE.md` — Design + migration path documentation
- `.planning/codebase/LLM-OPERATOR-GUIDE.md` — How to configure BYOK keys
- `CHANGELOG.md` updated with migration notes

### Integration Points
- Update `onboarding/backend/agents/orchestrator.cjs` → use new `/llm/adapter` (Phase 47-06)
- Update `onboarding/backend/agents/mir-filler.cjs` → use new `/llm/adapter` (Phase 47-06)
- Update `onboarding/backend/agents/msp-filler.cjs` → use new `/llm/adapter` (Phase 47-06)
- Telemetry events: Add 3 new events to `lib/markos/telemetry/events.ts` (D-03)

---

## Wave Breakdown (8–10 Plans Estimated)

### Wave 1: TypeScript Adapter & Provider Registry (Plans 47-01 to 47-02)
- 47-01: Adapter interface + OpenAI provider implementation
- 47-02: Anthropic + Gemini providers + registry

### Wave 2: Configuration & Secret Storage (Plans 47-03 to 47-04)
- 47-03: MarkOSDB schema migration + BYOK encryption
- 47-04: Configuration loading + fallback logic

### Wave 3: Telemetry Integration (Plans 47-05 to 47-06)
- 47-05: Telemetry event emission + cost calculation
- 47-06: Update existing agents to use new adapter

### Wave 4: Operator Tooling & Monitoring (Plans 47-07 to 47-08)
- 47-07: CLI commands (llm:config, llm:status, llm:providers)
- 47-08: Budget alerts + cost dashboard

### Wave 5: Testing & Verification (Plans 47-09 to 47-10)
- 47-09: Unit test coverage (all providers + fallback)
- 47-10: Integration tests + E2E verification

---

## Success Criteria

1. **Unified Interface:** All agents use `call()` from `/llm/adapter.ts`; zero provider-specific code in task runners; ≥95% of agent code refactored to new adapter
2. **BYOK Support:** Operators can configure Claude, OpenAI, or Gemini via `npx markos llm:config`; all keys encrypted in vault; no keys in logs
3. **Cost Tracking:** Every LLM call emitted with provider, model, input/output tokens, estimated cost; telemetry shows monthly cost per operator; CLI reports accurate totals
4. **Resilience:** Fallback chain works end-to-end; if primary provider fails, call succeeds via secondary; telemetry shows all attempts; 100% success rate with 2+ providers configured
5. **Budget Control:** Operators can set monthly budget; alerts emitted at 80% and 100% consumption; CLI display accurate budget remaining
6. **Type Safety:** TypeScript adapter has zero `any` violations; runtime validation of all options; IDEs show full type hints for all calls
7. **Backward Compatibility:** Existing `llm-adapter.cjs` code continues to work (legacy wrapper); no breaking changes to downstream agents during migration period

---

## Canonical References (For Planners)

### Related Context
- Phase 46 verification: `.planning/phases/46-operator-task-graph-ui-mvp/PHASE-46-VERIFICATION-SIGN-OFF.md` — Established operator context (operator_id available)
- Existing LLM adapter: `onboarding/backend/agents/llm-adapter.cjs` — Current multi-provider implementation (can be refactored as Phase 47-01)
- Telemetry contract: `lib/markos/telemetry/events.ts` — Union type for events (extend with 3 LLM events in Phase 47-05)
- MarkOSDB schema: `lib/markos/contracts/schema.ts` — Entity contract patterns (reference for new tables)

### Decision Rationale
- See `.planning/phases/47-multi-provider-llm-byok/47-DISCUSSION-LOG.md` for full design discussion & gray areas
- Gray areas requiring stakeholder input: Multi-tenant budgeting model, pricing refresh frequency, fallback chain templates

---

## Deferred to Later Phases

| Item | Reason | Target Phase |
|---|---|---|
| OpenAPI spec generation | Scope reframe; moved to new Phase 47b | 47b (parallel with 48) |
| Live provider pricing API | Adds complexity; operator-supplied rates sufficient for MVP | Phase 48 |
| Operator-hosted secret management | Enterprise feature; adds infrastructure dependency | Phase 48+ |
| ML-based provider routing by workload | Nice-to-have optimization; out-of-scope for MVP | Future phase |
| Advanced cost optimization (e.g., prompt caching) | Advanced feature; not essential for launch | Phase 48+ |

---

## Roadmap Impact

**Original Phase 47:** OpenAPI Generation  
**New Phase 47:** Multi-Provider LLM BYOK  
**New Phase 47b:** OpenAPI Generation (inserted after Phase 47, before Phase 48)

**Rationale:**
- LLM BYOK infrastructure is a leverage point for all downstream phases (operator autonomy, cost control, audit)
- OpenAPI generation can proceed in parallel with Phase 48 (contract testing) without blocking
- No critical path impact; overall milestone v3.1.0 timeline unchanged

---

## Ready for Planning?

**Status:** ✅ Discuss phase complete; all 7 design decisions locked; ready to proceed to plan-phase

**Approvals required:**
- [ ] Product leadership: Scope pivot approved (LLM BYOK vs. OpenAPI)
- [ ] Stakeholders: Gray areas (multi-tenant budgeting, pricing refresh) addressed
- [ ] Platform team: Feasibility assessment complete

**Next command:** `/gsd:plan-phase 47`

---

*Phase: 47-multi-provider-llm-byok*  
*Context finalized: 2026-04-02*
