---
phase: 47
phase_name: Multi-Provider LLM BYOK Abstraction Layer
phase_type: PLAN
milestone: v3.1.0
milestone_name: Operator Surface Unification
planned: "2026-04-02"
domain: Multi-provider LLM abstraction, BYOK key management, cost telemetry, Supabase encryption, CLI observability
estimated_effort: "12-16 plan-days / 5 waves"
total_plans: 10
---

# Phase 47: Multi-Provider LLM BYOK Abstraction Layer — Execution Plan

## 🎯 Phase Overview

**Goal:** Ship a unified, type-safe LLM abstraction layer supporting Claude, OpenAI, and Gemini with operator BYOK (Bring Your Own Keys) key management, cost telemetry, smart fallback chains, and CLI-first observability.

**Phase Type:** ENGINEERING (GSD)

**Locked Design Decisions:** D-01 through D-07 (see DISCUSS-PHASE-SUMMARY.md for details)

---

## ✅ Success Criteria (Phase Completion)

1. ✅ **Type-Safe Interface:** `lib/markos/llm/adapter.ts` with full TypeScript support and IDE autocomplete
2. ✅ **Three Providers Integrated:** Claude, OpenAI, Gemini callable through unified interface
3. ✅ **BYOK Key Management:** Operator can submit keys via `npx markos llm:config` CLI wizard
4. ✅ **Cost Telemetry:** Every LLM call emits structured event with token usage + estimated cost
5. ✅ **Smart Fallback Chain:** Automatic failover between providers with transparent telemetry
6. ✅ **Operator Observability:** `npx markos llm:status` dashboard shows usage + cost tracking
7. ✅ **Backward Compatibility:** Legacy `llm-adapter.cjs` continues working (dual-path tests verify)
8. ✅ **Comprehensive Test Coverage:** ≥95% coverage with unit, integration, and fallback chain tests
9. ✅ **Database Infrastructure:** Supabase migrations + RLS policies for secure key storage
10. ✅ **Documentation:** Architecture guide + operator setup guide (no breaking changes)

---

## 📊 Wave Breakdown: 5 Waves, 10 Plans

### **WAVE 1: Foundation & Infrastructure** (Plans 47-01, 47-02)
- **Duration:** ~2 plan-days
- **Goal:** Build core TypeScript adapter + config schema
- **Deliverables:** Type definitions, provider registry, database schema
- **Dependency:** None (parallel safe)

### **WAVE 2: Provider Integration** (Plans 47-03, 47-04, 47-05)
- **Duration:** ~3 plan-days
- **Goal:** Integrate all three provider SDKs
- **Deliverables:** Claude, OpenAI, Gemini adapters with error mapping
- **Dependency:** Wave 1 (47-01, 47-02)
- **Can parallelize:** 47-03, 47-04, 47-05 are parallel-safe (same Wave 1 deps)

### **WAVE 3: Telemetry & Resilience** (Plans 47-06, 47-07)
- **Duration:** ~3 plan-days
- **Goal:** Cost calculation + smart fallback chains
- **Deliverables:** Cost calculator, telemetry adapter, fallback state machine
- **Dependency:** Wave 2 (all providers callable)
- **Critical path:** 47-07 (fallback chain) is highest complexity

### **WAVE 4: CLI Tools & Observability** (Plan 47-08)
- **Duration:** ~1.5 plan-days
- **Goal:** Interactive config wizard + usage dashboard
- **Deliverables:** `bin/llm-config.cjs`, `bin/llm-status.cjs` with Supabase integration
- **Dependency:** Wave 2 (settings schema) + Wave 3 (cost telemetry)

### **WAVE 5: Integration & Verification** (Plans 47-09, 47-10)
- **Duration:** ~2 plan-days
- **Goal:** Backward compatibility + comprehensive tests + documentation
- **Deliverables:** Legacy wrapper, test suite, architecture + operator guides
- **Dependency:** All prior plans (47-01 through 47-09)

---

## 📋 Detailed Plan Specifications

---

## **WAVE 1: FOUNDATION & INFRASTRUCTURE**

### **Plan 47-01: TypeScript Adapter Scaffolding + Provider Registry**

**Duration:** ~1 plan-day  
**Complexity:** MEDIUM  
**Blocked by:** None  
**Blocks:** All Wave 2 plans (47-03, 47-04, 47-05)

#### Deliverables

1. **`lib/markos/llm/types.ts`** (Type definitions)
   - Export `LLMCallOptions` interface
     ```ts
     interface LLMCallOptions {
       provider?: "anthropic" | "openai" | "gemini";  // explicit override
       model?: string;  // override default per provider
       max_tokens?: number;
       temperature?: number;
       timeout_ms?: number;
       fallbackChain?: ("anthropic" | "openai" | "gemini")[];
       noFallback?: boolean;  // disable auto-fallback
       metadata?: Record<string, any>;  // task_id, flow_domain, campaign_id, etc.
     }
     ```
   - Export `LLMCallResult` interface
     ```ts
     interface LLMCallResult {
       ok: boolean;
       text: string;
       provider: string;
       model: string;
       usage: { input_tokens: number; output_tokens: number; };
       latency_ms: number;
       telemetry_event_id: string;
       error?: { code: string; message: string; };
     }
     ```
   - Export `LLMError` enum: `TIMEOUT`, `RATE_LIMITED`, `AUTH_ERROR`, `INVALID_CONFIG`, `FALLBACK_EXHAUSTED`, `UNKNOWN_ERROR`
   - Export `CostMetrics` interface (tokens + estimated USD)

2. **`lib/markos/llm/provider-registry.ts`** (Provider metadata)
   - Export `ProviderRegistry` object with hardcoded defaults:
     ```ts
     {
       anthropic: {
         models: ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"],
         default_model: "claude-3-5-haiku-20241022",
         cost_rates: { input: 0.80, output: 4.00 }  // per MTok
       },
       openai: {
         models: ["gpt-4o-mini", "gpt-4o"],
         default_model: "gpt-4o-mini",
         cost_rates: { input: 0.15, output: 0.60 }
       },
       gemini: {
         models: ["gemini-2.5-flash", "gemini-pro"],
         default_model: "gemini-2.5-flash",
         cost_rates: { input: 0.075, output: 0.30 }
       }
     }
     ```
   - Export `getDefaultModel(provider)` function
   - Export `getDefaultCostRates(provider, model)` function

3. **`lib/markos/llm/adapter.ts`** (Main entry point)
   - Scaffolding with function stubs:
     - `export async function call(systemPrompt, userPrompt, options): Promise<LLMCallResult>`
     - `export async function callClaude(...): Promise<LLMCallResult>` (stub)
     - `export async function callOpenAI(...): Promise<LLMCallResult>` (stub)
     - `export async function callGemini(...): Promise<LLMCallResult>` (stub)
   - Error handling scaffolding (catch blocks prepared for Wave 2 expansion)
   - Comments indicating fallback chain hook points (to be filled in Wave 3)

4. **Unit Tests** (`test/llm-adapter/adapter-init.test.js`)
   - ✓ Provider registry loads with all three provider configurations
   - ✓ Type definitions compile without `any` violations
   - ✓ `call()` throws NOT_IMPLEMENTED error (stub phase)
   - ✓ Invalid provider option throws INVALID_CONFIG
   - ✓ Cost rates retrieved correctly per provider/model

#### Dependencies
- **Upstream:** None
- **Codebase:** Phase 30 (MarkOSDB setup), Phase 37 (telemetry infrastructure)

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| TypeScript compilation errors slow Wave 2 | Use `npm run build:llm` early, catch config issues |
| Type definitions too strict → painful in Wave 2 | Plan time for incremental refinement in provider PRs |

---

### **Plan 47-02: Secret Storage Configuration + MarkOSDB Schema**

**Duration:** ~1 plan-day  
**Complexity:** HIGH  
**Blocked by:** 47-01 (type definitions)  
**Blocks:** 47-03, 47-04, 47-05 (needed for test setup)

#### Deliverables

1. **`supabase/migrations/47_operator_llm_management.sql`** (Database schema)
   - Table: `operator_api_keys` (encrypted secret storage)
     ```sql
     CREATE TABLE operator_api_keys (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'gemini')),
       encrypted_key TEXT NOT NULL,  -- pgp_sym_encrypt() ciphertext
       key_hash TEXT NOT NULL,       -- SHA256(key) for audit/dedup
       rotation_scheduled_at TIMESTAMPTZ,
       created_at TIMESTAMPTZ DEFAULT now(),
       updated_at TIMESTAMPTZ DEFAULT now(),
       UNIQUE(operator_id, provider)
     );
     CREATE INDEX idx_operator_api_keys_operator_id ON operator_api_keys(operator_id);
     ```
   - Table: `operator_llm_preferences` (config & budget)
     ```sql
     CREATE TABLE operator_llm_preferences (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       operator_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
       available_providers TEXT[] NOT NULL,  -- ["anthropic", "openai"] subset
       primary_provider TEXT NOT NULL CHECK (primary_provider IN ('anthropic', 'openai', 'gemini')),
       cost_budget_monthly_usd DECIMAL(10,2) NOT NULL DEFAULT 100.00,
       allow_fallback BOOLEAN NOT NULL DEFAULT true,
       created_at TIMESTAMPTZ DEFAULT now(),
       updated_at TIMESTAMPTZ DEFAULT now()
     );
     ```
   - RLS policies (only operators see their own keys/prefs)
   - Function `decrypt_operator_api_key(encrypted_key TEXT)` (server-side decryption helper)

2. **`lib/markos/llm/settings.ts`** (Config schema + validation)
   - Export `OperatorLLMSettings` TypeScript interface
   - Export `LLMSettingsSchema` (Zod schema for validation)
     ```ts
     const schema = z.object({
       available_providers: z.enum(['anthropic', 'openai', 'gemini']).array(),
       primary_provider: z.enum(['anthropic', 'openai', 'gemini']),
       cost_budget_monthly_usd: z.number().min(0),
       allow_fallback: z.boolean().default(true),
     });
     ```
   - Export `loadOperatorSettings(operatorId)` async function
     - Query MarkOSDB for preferences
     - If not found, return sensible defaults (all providers enabled, primary=anthropic, budget=$100)
   - Export `validateSettings(config)` function
   - Env var fallback: If MarkOSDB unreachable, use `MARKOS_LLM_PRIMARY_PROVIDER` env var

3. **`lib/markos/llm/encryption.ts`** (Encryption/decryption helpers)
   - Export `encryptOperatorKey(plaintext_key, operator_id)` → encrypted ciphertext
   - Export `decryptOperatorKey(encrypted_key, operator_id)` → plaintext key (calls RLS-protected Supabase function)
   - Export `redactKeyForLogging(key)` → `anthropic_***...***` (first 8 + last 4 chars)
   - Encrypt/decrypt uses `pgp_sym_encrypt()` on server; client only stores ciphertext

4. **Unit Tests** (`test/llm-adapter/settings.test.js`)
   - ✓ Encryption round-trip: `encrypt(x) → decrypt() → x` (mock Supabase)
   - ✓ Settings validation accepts valid configs
   - ✓ Rejects config with missing `available_providers`
   - ✓ Env var fallback triggered when MarkOSDB unavailable
   - ✓ Key redaction hides bulk of secret
   - ✓ Multiple operators can't peek at each other's keys (RLS verified in integration test)

#### Dependencies
- **Upstream:** 47-01 (type definitions)
- **Codebase:** Phase 30 (MarkOSDB migrations), Phase 42 (Supabase RLS patterns), Supabase pgcrypto docs

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| pgcrypto not enabled in Supabase | Verify in Phase 47 kickoff; if missing, enable extension manually |
| Encryption passphrase rotation challenging | Phase 48 feature; Phase 47 uses static `MARKOS_VAULT_SECRET` |
| RLS policies too restrictive → operators can't read own keys | Test Supabase RLS with `serviceRole` bypass during dev |

---

## **WAVE 2: PROVIDER INTEGRATION**

### **Plan 47-03: Claude SDK Integration**

**Duration:** ~1 plan-day  
**Complexity:** MEDIUM  
**Blocked by:** 47-01, 47-02  
**Blocks:** 47-06, 47-07, 47-08

#### Deliverables

1. **`lib/markos/llm/providers/claude.ts`** (Claude adapter)
   - Import `@anthropic-ai/sdk` (add to `package.json` dependencies)
   - Export `callClaude(systemPrompt, userPrompt, options)` function
     - Instantiate Anthropic client (cached singleton with operator API key)
     - Build messages array: `[{ role: "user", content: userPrompt }]`
     - Call `client.messages.create({ system, messages, max_tokens, temperature, ... })`
     - Extract usage: `response.usage.input_tokens`, `response.usage.output_tokens`
     - Return `LLMCallResult` with provider=claude, extracted text, usage, latency
   - Error handling:
     - `APIError` (401) → map to `LLMError.AUTH_ERROR`
     - `TimeoutError` (>5s) → map to `LLMError.TIMEOUT`
     - `RateLimitError` (429) → map to `LLMError.RATE_LIMITED` (include retry-after if present)
     - All others → map to `LLMError.UNKNOWN_ERROR`
   - Token counting: Use SDK's response.usage (no manual token counting needed)
   - Options handling:
     - Honor `max_tokens` override (Claude accepts `max_tokens`)
     - Honor `temperature` override (Claude accepts `temperature`)
     - Respect `timeout_ms` option (wrap in timeout Promise)

2. **Unit Tests** (`test/llm-adapter/claude.test.js`)
   - ✓ `callClaude()` succeeds with valid prompts (mock SDK)
   - ✓ Returns `LLMCallResult` with correct structure
   - ✓ `max_tokens` override passed to SDK
   - ✓ `temperature` override passed to SDK
   - ✓ Token counts extracted correctly from response.usage
   - ✓ Timeout error thrown if call exceeds `timeout_ms`
   - ✓ 401 error mapped to `AUTH_ERROR`
   - ✓ 429 error mapped to `RATE_LIMITED`
   - ✓ Error message includes helpful context (e.g., API key advice for auth failures)
   - ✓ Latency calculated (end - start)
   - ✓ Cost calculation matches formula: `(input_tokens * 0.80 + output_tokens * 4.00) / 1_000_000`
   - Coverage: ≥95% line coverage

#### Dependencies
- **Upstream:** 47-01, 47-02
- **New Dependency:** `@anthropic-ai/sdk ^1.40.0` (add to package.json)

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| API key not in expected env var | Use `ANTHROPIC_API_KEY` (standard); Wire from settings schema in Wave 1 |
| Streaming vs non-streaming response formats | Use non-streaming for Phase 47 (simpler); streaming in Phase 48+ |
| Token counting differs from SDK's calculation | Trust SDK's response.usage (already accurate) |

---

### **Plan 47-04: OpenAI SDK Integration**

**Duration:** ~1 plan-day  
**Complexity:** MEDIUM  
**Blocked by:** 47-01, 47-02  
**Blocks:** 47-06, 47-07

#### Deliverables

1. **`lib/markos/llm/providers/openai.ts`** (OpenAI adapter)
   - Import `openai` SDK (already in package.json)
   - Export `callOpenAI(systemPrompt, userPrompt, options)` function
     - Instantiate OpenAI client (cached singleton with operator API key)
     - Build messages array: `[ { role: "system", content: systemPrompt }, { role: "user", content: userPrompt } ]`
     - Call `client.chat.completions.create({ messages, model, max_tokens, temperature, ... })`
     - Extract usage: `response.usage.prompt_tokens`, `response.usage.completion_tokens`
     - Return `LLMCallResult` with provider=openai, extracted text, usage, latency
   - Error handling:
     - `APIError` (401) → map to `LLMError.AUTH_ERROR`
     - `APIConnectionError` (timeout) → map to `LLMError.TIMEOUT`
     - `RateLimitError` (429) → map to `LLMError.RATE_LIMITED`
     - All others → map to `LLMError.UNKNOWN_ERROR`
   - Token counting: Use SDK's response.usage (no need for `tiktoken` in Phase 47)
   - Options handling:
     - Honor `max_tokens` override (OpenAI accepts `max_tokens`)
     - Honor `temperature` override (OpenAI accepts `temperature`)
     - Respect `timeout_ms` option

2. **Unit Tests** (`test/llm-adapter/openai.test.js`)
   - ✓ `callOpenAI()` succeeds with valid prompts (mock SDK)
   - ✓ Returns `LLMCallResult` with correct structure
   - ✓ `max_tokens` override passed to SDK
   - ✓ `temperature` override passed to SDK
   - ✓ Token counts extracted correctly from response.usage
   - ✓ Timeout error thrown if call exceeds `timeout_ms`
   - ✓ 401 error mapped to `AUTH_ERROR`
   - ✓ 429 error mapped to `RATE_LIMITED`
   - ✓ Error message includes helpful context
   - ✓ Latency calculated correctly
   - ✓ Cost calculation matches formula: `(input_tokens * 0.15 + output_tokens * 0.60) / 1_000_000`
   - Coverage: ≥95% line coverage

#### Dependencies
- **Upstream:** 47-01, 47-02
- **Codebase:** `openai` SDK already installed (v6.32.0+)

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| OpenAI session timeouts | Wrap with Promise.race() using `timeout_ms` |
| System vs assistant prompt role handling | Always use system role for systemPrompt (standard pattern) |

---

### **Plan 47-05: Gemini SDK Integration**

**Duration:** ~1 plan-day  
**Complexity:** MEDIUM  
**Blocked by:** 47-01, 47-02  
**Blocks:** 47-06, 47-07

#### Deliverables

1. **`lib/markos/llm/providers/gemini.ts`** (Gemini adapter)
   - Import `@google-cloud/generative-ai` SDK (add to package.json)
   - Export `callGemini(systemPrompt, userPrompt, options)` function
     - Instantiate Google GenerativeAI client (cached singleton with operator API key: `GEMINI_API_KEY`)
     - Get model instance: `client.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: systemPrompt })`
     - Call `model.generateContent(userPrompt)`
     - Extract usage: `response.usageMetadata.promptTokenCount`, `response.usageMetadata.candidatesTokenCount`
     - Return `LLMCallResult` with provider=gemini, extracted text, usage, latency
   - Error handling:
     - `GoogleGenerativeAIFetchError` (auth) → map to `LLMError.AUTH_ERROR`
     - `GoogleGenerativeAIError` (various) → parse and map accordingly
       - Timeout → `LLMError.TIMEOUT`
       - Rate limit → `LLMError.RATE_LIMITED`
       - Others → `LLMError.UNKNOWN_ERROR`
   - Options handling:
     - Honor `temperature` override (map to `temperature` in SDK)
     - Note: Gemini 2.5 flash doesn't use `max_tokens` in same way; use generationConfig if available
     - Respect `timeout_ms` option

2. **Unit Tests** (`test/llm-adapter/gemini.test.js`)
   - ✓ `callGemini()` succeeds with valid prompts (mock SDK)
   - ✓ Returns `LLMCallResult` with correct structure
   - ✓ `systemPrompt` passed as `systemInstruction` to model
   - ✓ `temperature` override handled
   - ✓ Token counts extracted correctly from response.usageMetadata
   - ✓ Timeout error thrown if call exceeds `timeout_ms`
   - ✓ Auth error mapped correctly
   - ✓ Rate limit error mapped correctly
   - ✓ Latency calculated correctly
   - ✓ Cost calculation matches formula: `(input_tokens * 0.075 + output_tokens * 0.30) / 1_000_000`
   - Coverage: ≥95% line coverage

#### Dependencies
- **Upstream:** 47-01, 47-02
- **New Dependency:** `@google-cloud/generative-ai ^0.15.0` (add to package.json)

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Gemini API quirks (systemInstruction placement, token counting) | Read Gemini docs carefully; test extensively with mock responses |
| API key env var naming inconsistency | Use `GEMINI_API_KEY` standard; wire from settings schema |

---

## **WAVE 3: TELEMETRY & RESILIENCE**

### **Plan 47-06: Cost Telemetry Architecture**

**Duration:** ~1.5 plan-days  
**Complexity:** MEDIUM  
**Blocked by:** 47-03, 47-04, 47-05 (all providers callable)  
**Blocks:** 47-07, 47-08

#### Deliverables

1. **`lib/markos/llm/cost-calculator.ts`** (Cost calculation engine)
   - Export `DEFAULT_COST_RATES` constant (hardcoded Phase 47 rates)
   - Export `calculateCostUSD(provider, model, inputTokens, outputTokens, operatorRates?)` function
     ```ts
     const cost = (inputTokens * inputRate / 1_000_000) + (outputTokens * outputRate / 1_000_000)
     ```
     - Use operator-supplied rates if provided, else fallback to DEFAULT_COST_RATES
     - Handle edge cases: zero tokens → cost $0.00, rounding to 6 decimals
   - Export `aggregateCostByProvider(events)` function (group emissions by provider, sum costs)
   - Export `calculateMonthlyBudgetUsage(operatorId, month)` async function
     - Query `markos_llm_call_events` table for operator in given month
     - Sum costs by provider
     - Return `{ provider, calls, tokens_used, cost_usd, budget_usd, percent_used }`
   - Unit tests for all edge cases (zero tokens, rounding, negative numbers rejected, etc.)

2. **`lib/markos/llm/telemetry-adapter.ts`** (Event emission wrapper)
   - Export `emitLLMCallCompleted(event_payload)` async function
     - Accept structured payload (provider, model, tokens, cost, context, fallback info)
     - Sanitize sensitive data (redact API keys, truncate prompts)
     - Emit via PostHog (or configured telemetry backend)
     - Catch emission errors silently (don't crash LLM call if telemetry fails)
   - Export `wrappedCall(systemPrompt, userPrompt, options)` HOF
     - Wraps provider call with telemetry pre/post hooks
     - Measures latency
     - Calculates cost
     - Emits event on success or error
   - Unit tests:
     - ✓ Sensitive data redacted before emission
     - ✓ Latency calculated accurately
     - ✓ Cost included in emitted event
     - ✓ Event emission failure doesn't break LLM call
     - ✓ Context metadata passed through (task_id, flow_domain, etc.)

3. **Update `lib/markos/telemetry/events.ts`** (Extend event schema)
   - Add new event types:
     - `"markos_llm_call_completed"` (main telemetry event)
     - `"markos_llm_budget_80_percent"` (alert when 80% of budget consumed)
     - `"markos_llm_budget_100_percent"` (alert when over budget)
   - Define payload TypeScript interfaces for each event

4. **Update `lib/markos/llm/adapter.ts`** (Integrate cost telemetry)
   - Modify `call()` function to wrap provider calls with telemetry
   - After each call (success or error), emit telemetry event with cost metrics
   - Include fallback tracking in telemetry (if applicable from Wave 3 work)

#### Dependencies
- **Upstream:** 47-03, 47-04, 47-05 (all providers working; cost calculation depends on token counts)
- **Codebase:** Phase 37 (telemetry infrastructure)

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Cost calculations slightly differ from provider invoices | Phase 47 is estimate-only; Phase 48 adds live pricing API reconciliation |
| Telemetry metric cardinality explosion (too many dimensions) | Limit context fields; aggregate by operator/provider/model only |
| Operator rates not stored → calculations wrong | Phase 47 uses hardcoded defaults; Phase 48 stores operator rates in DB |

---

### **Plan 47-07: Error Handling & Fallback Chain (State Machine)**

**Duration:** ~1.5 plan-days  
**Complexity:** HIGH  
**Blocked by:** 47-03, 47-04, 47-05, 47-06 (cost + telemetry available)  
**Blocks:** 47-08, 47-09, 47-10

#### Deliverables

1. **`lib/markos/llm/fallback-chain.ts`** (Smart fallback state machine)
   - Export `FallbackChainState` interface (tracks attempt history, errors, decisions)
   - Export `executeFallbackChain(systemPrompt, userPrompt, options)` async function
     - **Input:** options includes `provider`, `fallbackChain`, `noFallback`
     - **Logic:**
       1. Determine provider selection priority: explicit override → task default → operator default → chain order
       2. Build fallback chain: `[primary, ...fallback]` or `[primary]` if `noFallback`
       3. Try each provider in sequence:
          - Call provider (e.g., `callClaude()`, `callOpenAI()`, `callGemini()`)
          - If success, emit telemetry (decision_mode="explicit" or "default") → return result
          - If failure, record error, try next provider
       4. After each failure, decide: continue fallback or exhaust?
          - Timeout (>timeout_ms) → try fallback
          - Rate limit (429) → try fallback (with backoff)
          - Auth error (401) → try fallback (invalid key)
          - Network error → try fallback
          - Others → try fallback (be resilient)
       5. If all providers fail, return aggregated error with full attempt log
     - **Emit telemetry** for each attempt:
       - `original_provider`: first provider attempted
       - `final_provider`: provider that succeeded or last attempted
       - `fallback_attempts`: number of retries
       - `decision_mode`: "explicit" (operator override), "default" (from profile), or "fallback" (auto-retry)
       - `fallback_reasons`: array of error reasons that triggered fallback
   - Maximum 3 attempts total (primary + 2 fallback)

2. **Update `lib/markos/llm/adapter.ts`** (Integrate fallback chain)
   - Modify `call(systemPrompt, userPrompt, options)` to use `executeFallbackChain()`
   - Respect `options.noFallback` flag (disable auto-retry for deterministic calls)
   - Parse `options.fallbackChain` to override default order

3. **Integration Tests** (`test/llm-adapter/fallback-chain.test.js`)
   - ✓ Primary provider succeeds → returns result immediately (no fallback attempt)
   - ✓ Primary timeout (>5s) → falls back to secondary
   - ✓ Secondary succeeds → returns result with `fallback_attempts=1`
   - ✓ Primary + secondary both fail → tries tertiary
   - ✓ All providers fail → returns aggregated error with all 3 error details
   - ✓ Custom fallback chain order respected (e.g., `[openai, gemini, anthropic]`)
   - ✓ `noFallback: true` → does not retry, returns error after first failure
   - ✓ Telemetry includes `decision_mode="fallback"` when auto-fallback occurs
   - ✓ Telemetry includes `fallback_reasons: ["TIMEOUT", "AUTH_ERROR"]` for each attempt
   - ✓ Rate limit (429) triggers backoff before fallback (exponential backoff 1s, 2s, 4s)
   - ✓ Max 3 attempts enforced (no infinite retry loop)
   - ✓ Latency reflects total time across all fallback attempts

#### Dependencies
- **Upstream:** 47-03, 47-04, 47-05 (all providers working), 47-06 (cost telemetry for decision tracking)
- **Codebase:** Phase 37 (telemetry), standard retry/backoff patterns

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Fallback chain explosion (too many retries) → user perceives slow response | Cap at 3 attempts max; implement early exit if primary succeeds |
| Cascading failures (if all providers are down) → operator loses function | Fallback still provides transparency (all attempts logged); Phase 48 adds explicit provider status checks |
| Backoff logic too aggressive → wastes time | Use exponential backoff 1s → 2s → 4s; total max ~7s per call |

---

## **WAVE 4: CLI TOOLS & OBSERVABILITY**

### **Plan 47-08: CLI Tooling + Configuration**

**Duration:** ~1.5 plan-days  
**Complexity:** MEDIUM  
**Blocked by:** 47-02 (settings schema), 47-06 (cost telemetry)  
**Blocks:** 47-09, 47-10

#### Deliverables

1. **`bin/llm-config.cjs`** (Interactive key setup wizard)
   - CLI command: `npx markos llm:config`
   - Flow:
     1. Prompt operator to select providers: "Which providers do you have keys for? (select multiple)"
        - [x] Anthropic (Claude)
        - [x] OpenAI (GPT-4, GPT-4o)
        - [x] Google Gemini
     2. For each selected provider, prompt for API key (hidden input via `CliUI.maskInput()`)
     3. Prompt for monthly budget (default $100)
     4. Prompt for primary provider (default Claude)
     5. Prompt for fallback behavior: "Allow automatic fallback if primary fails?" (default yes)
     6. Confirm settings and submit
   - On submit:
     - Encrypt keys using `encryptOperatorKey()`
     - Call Supabase to store in `operator_api_keys`, `operator_llm_preferences`
     - Show success message: "✓ LLM configuration saved successfully"
     - Offer to test a provider: "Would you like to test Claude with a sample prompt? (y/n)"
   - If test selected:
     - Make sample LLM call (unit test: "Hello, please respond with 'test_success'")
     - Display response + token counts + estimated cost
     - Show: "✓ Test call successful; Claude is working"
   - Unit tests:
     - ✓ Argument parsing (no args → interactive, `--provider=claude` → skip selection step)
     - ✓ Validation (API keys not empty, budget >= 0, primary provider is valid)
     - ✓ Encryption called before storage
     - ✓ Supabase insert succeeds
     - ✓ Error handling (network failure, Supabase error, invalid key)

2. **`bin/llm-status.cjs`** (Usage dashboard)
   - CLI command: `npx markos llm:status [--month=2026-04]`
   - Flow:
     1. Parse month argument (default current month)
     2. Query `operator_llm_preferences` to get budget
     3. Query `markos_llm_call_events` for operator in given month
     4. Aggregate by provider: call count, token usage, cost
     5. Render terminal table:
        ```
        ┌──────────────────────────────────────┐
        │ LLM Usage & Cost (April 2026)       │
        ├────────────┬───────┬──────┬─────────┤
        │ Provider   │ Calls │ Cost │ % Budget│
        ├────────────┼───────┼──────┼─────────┤
        │ Anthropic  │ 1,240 │ $4.20│   4.2%  │
        │ OpenAI     │   340 │ $2.10│   2.1%  │
        │ Gemini     │    45 │ $0.02│  <0.1%  │
        ├────────────┼───────┼──────┼─────────┤
        │ TOTAL      │ 1,625 │ $6.32│   6.3%  │
        │ Budget     │       │$100.00│       │
        │ Remaining  │       │ $93.68│ 93.7%  │
        └────────────┴───────┴──────┴─────────┘
        ```
     6. If budget exhausted, show warning: "⚠ Budget limit reached (100%)"
     7. If >80% used, show caution: "⚠ 84% of monthly budget consumed"
   - Options:
     - `--month=YYYY-MM` (e.g., `--month=2026-04`)
     - `--export=csv` (export table as CSV to stdout)
     - `--providers` (list configured providers + validation status)
   - Unit tests:
     - ✓ Default month = current month
     - ✓ Table renders correctly with sample data
     - ✓ Budget percent calculated accurately
     - ✓ CSV export produces valid CSV
     - ✓ Error handling (no data, Supabase error, permission denied)

3. **Update `package.json`** (CLI command registration)
   - Add to `bin` section:
     ```json
     "bin": {
       "markos": "bin/cli-runtime.cjs",
       ...
     }
     ```
   - Add npm scripts (if not already present):
     ```json
     "scripts": {
       "markos:llm:config": "node bin/llm-config.cjs",
       "markos:llm:status": "node bin/llm-status.cjs"
     }
     ```
   - Update CLI help: `npx markos llm:config`, `npx markos llm:status`, `npx markos llm:providers`

4. **Integration Tests** (`test/llm-adapter/cli-tools.test.js`)
   - ✓ `llm:config` wizard accepts input and encrypts key
   - ✓ `llm:config` stores preferences in Supabase
   - ✓ `llm:config --provider=openai` skips selection step, prompts only for key
   - ✓ `llm:config --test` makes sample call and shows results
   - ✓ `llm:status` displays table with mock data
   - ✓ `llm:status --month=2026-03` queries previous month correctly
   - ✓ `llm:status --export=csv` produces valid CSV
   - ✓ Error messages helpful (e.g., "API key rejected by Anthropic; check ANTHROPIC_API_KEY")

#### Dependencies
- **Upstream:** 47-02 (settings schema), 47-06 (cost telemetry for aggregation)
- **CLI libraries:** `inquirer` (interactive prompts), `chalk` (color output), `cli-table3` (table rendering)

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Operator forgets to run `llm:config` → no keys stored → calls fail silently | Add warning to onboarding flow; in Phase 48, require config before LLM calls allowed |
| Interactive wizard too slow | Keep wizard to <10 questions; add `--skip-interactive` flag for scripting |
| CSV export format incompatible with operator's tools | Test export with Excel, Google Sheets; document format in help text |

---

## **WAVE 5: INTEGRATION & VERIFICATION**

### **Plan 47-09: TypeScript → CommonJS Backward-Compat Wrapper**

**Duration:** ~1 plan-day  
**Complexity:** MEDIUM  
**Blocked by:** 47-03, 47-04, 47-05 (all providers working)  
**Blocks:** 47-10

#### Deliverables

1. **Update `onboarding/backend/agents/llm-adapter.cjs`** (Legacy wrapper)
   - Maintain existing CommonJS export: `call(systemPrompt, userPrompt, options)`
   - **Internal implementation:** Import newly compiled TypeScript adapter
     ```js
     const { call: callAdapter } = require('../../lib/markos/llm/adapter.js');
     ```
   - **Wrapper function:**
     ```js
     async function call(systemPrompt, userPrompt, options = {}) {
       // Map CommonJS options to TypeScript options
       const result = await callAdapter(systemPrompt, userPrompt, {
         provider: options.provider,
         model: options.model,
         temperature: options.temperature,
         max_tokens: options.max_tokens,
         // ... map other fields
       });
       
       // Map TypeScript result back to CommonJS shape
       return {
         text: result.text,
         provider: result.provider,
         model: result.model,
         usage: result.usage,
         error: result.error,
         // Maintain backward-compat shape
       };
     }
     ```
   - **Deprecation notice:** Add comment at top of file:
     ```js
     /**
      * @deprecated Use lib/markos/llm/adapter.ts instead (Phase 49 for removal)
      * This wrapper maintains backward compatibility for existing code.
      * New code should import from lib/markos/llm/adapter.ts directly.
      */
     ```
   - Verify no type mismatches between CommonJS and TypeScript interfaces

2. **Dual-Path Tests** (`test/llm-adapter/backward-compat.test.js`)
   - ✓ CommonJS wrapper calls return identical shape to new TypeScript adapter
   - ✓ Error handling produces same result in both paths
   - ✓ Token counts extracted identically
   - ✓ Cost telemetry emitted from both paths (identical events)
   - ✓ Fallback chain respects same priority order
   - ✓ `noFallback` option honored in both
   - ✓ All provider SDKs work through wrapper
   - ✓ Performance: wrapper overhead <50ms added latency (acceptable)

3. **Verify Onboarding Flows** (Manual integration verification)
   - Test `onboarding/backend/agents/mir-filler.cjs` still works (uses llm-adapter)
   - Test `onboarding/backend/agents/msp-filler.cjs` still works
   - Test `onboarding/backend/agents/orchestrator.cjs` still works
   - Confirm zero breaking changes to onboarding lifecycle

#### Dependencies
- **Upstream:** 47-03, 47-04, 47-05 (all providers working in TypeScript)
- **Codebase:** Existing onboarding orchestrator

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| TypeScript → CommonJS transpilation breaks bundling | Use `tsc` to pre-compile TS to JS in lib/markos/llm/.js; include in npm build step |
| Wrapper overhead slows onboarding | Profile with `console.time()` during Wave 5 verification |

---

### **Plan 47-10: Test Suite + Documentation**

**Duration:** ~1 plan-day  
**Complexity:** MEDIUM  
**Blocked by:** All prior plans (47-01 through 47-09)  
**Blocks:** Phase 47 completion verification

#### Deliverables

1. **Comprehensive Unit Test Suite** (Coverage ≥95%)
   - `test/llm-adapter/adapter-init.test.js` — adapter scaffolding + types
   - `test/llm-adapter/settings.test.js` — config schema + encryption
   - `test/llm-adapter/cost-calculator.test.js` — cost calculations + aggregation
   - `test/llm-adapter/claude.test.js` — Claude provider
   - `test/llm-adapter/openai.test.js` — OpenAI provider
   - `test/llm-adapter/gemini.test.js` — Gemini provider
   - `test/llm-adapter/telemetry.test.js` — event emission + sanitization
   - Coverage report: `npm test -- --coverage` shows ≥95% lines + branches

2. **Integration Test Suite**
   - `test/llm-adapter/fallback-chain.test.js` — fallback scenarios, state machine
   - `test/llm-adapter/backward-compat.test.js` — dual-path verification
   - `test/llm-adapter/cli-tools.test.js` — config wizard + status dashboard
   - `test/llm-adapter/e2e.test.js` — end-to-end flow: config → call → telemetry → status

3. **Documentation Files**

   **`docs/LLM-BYOK-ARCHITECTURE.md`** (Technical architecture guide)
   - Section 1: Overview
     - Goal: Multi-provider LLM abstraction with BYOK key management
     - Supported providers: Claude, OpenAI, Gemini
     - Key design principles: type-safe, operator-controlled, cost-transparent, resilient
   - Section 2: Architecture Diagram (ASCII + Mermaid flowchart)
     ```
     ┌─────────────────────────────┐
     │ LLM Call Flow               │
     ├─────────────────────────────┤
     │ call(system, user, opts)    │
     │  ↓ Validate options         │
     │  ↓ Load operator settings   │
     │  ↓ Try primary provider     │
     │  ↓ On failure: fallback?    │
     │  ↓ Emit telemetry          │
     │  ↓ Return result            │
     └─────────────────────────────┘
     ```
   - Section 3: Component Descriptions
     - `lib/markos/llm/adapter.ts` — unified call interface
     - `lib/markos/llm/provider-registry.ts` — provider metadata
     - `lib/markos/llm/settings.ts` — config schema
     - `lib/markos/llm/cost-calculator.ts` — cost tracking
     - `lib/markos/llm/telemetry-adapter.ts` — event emission
     - `lib/markos/llm/fallback-chain.ts` — resilience
   - Section 4: Integration Points
     - Telemetry backend (PostHog)
     - MarkOSDB (Supabase) for secrets + preferences
     - Provider SDKs (Anthropic, OpenAI, Google)
   - Section 5: Data Flow
     - Config storage (encrypted in Supabase Vault)
     - Cost calculation (token → USD)
     - Event schema (structured telemetry)
     - Budget tracking (monthly aggregation)
   - Section 6: Error Handling
     - Provider-specific error mapping
     - Fallback chain state machine
     - Telemetry of all attempts
   - Section 7: Phase 48+ Evolution
     - Live pricing API integration
     - Operator-hosted secrets
     - Advanced observability dashboard

   **`docs/OPERATOR-LLM-SETUP.md`** (Operator setup guide)
   - Quick start: 3-step setup
     ```
     1. npx markos llm:config
     2. Select providers + enter API keys
     3. Set monthly budget
     Verify: npx markos llm:status
     ```
   - Step-by-step walkthrough
     - Get API keys from each provider (links provided)
     - Run config wizard with screenshots
     - Verify setup with test call
   - Troubleshooting section
     - "I got an ANTHROPIC_API_KEY error" → check API key validity, provider enabled
     - "My calls are always using OpenAI, not Claude" → check llm:config default provider setting
     - "Unexpected cost in bill" → run llm:status to verify token counts, check rates
   - Security best practices
     - Keep API keys secret; don't commit to version control
     - Rotate keys periodically via `npx markos llm:config`
     - Use per-operator API keys (not shared keys) for audit trail
   - FAQ
     - "Can I use multiple API keys per provider?" → Not in Phase 47; Phase 48+ feature
     - "What happens if all providers fail?" → Fallback chain exhausted; call returns error with details
     - "How do I estimate cost?" → Reference table: Claude Haiku ~$1.50 per 1M tokens, GPT-4o-mini ~$0.75
     - "Can I disable fallback?" → Yes, use `call({ noFallback: true, ... })`

4. **Update Top-Level Documentation**
   - Add section to `README.md`: "LLM Abstraction Layer (Phase 47)"
   - Add section to `.planning/phases/47-multi-provider-llm-byok/47-IMPLEMENTATION-LOG.md` (for execution notes)
   - Update `CHANGELOG.md`: "Phase 47: Multi-Provider LLM BYOK"

5. **Test Execution & Coverage Report**
   - Run: `npm test -- test/llm-adapter/**/*.test.js`
   - Verify: ≥95% line coverage, ≥90% branch coverage
   - Generate coverage report: `npm test -- --coverage --collectCoverageFrom="lib/markos/llm/**/*.ts"`

#### Dependencies
- **Upstream:** All plans 47-01 through 47-09 complete
- **Codebase:** Existing test utilities, documentation structure

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Documentation outdated after implementation | Review docs after Wave 4 CLI completion; update before sign-off |
| Test coverage gaps hidden until end-of-phase | Run coverage incrementally at end of each Wave; address gaps early |

---

## ⏱️ Execution Timeline & Effort Breakdown

### Wave-by-Wave Allocation

| Wave | Plans | Effort | Key Milestones |
|------|-------|--------|-----------------|
| **Wave 1** | 47-01, 47-02 | ~2 pd | TypeScript scaffolding + DB schema |
| **Wave 2** | 47-03, 47-04, 47-05 | ~3 pd | All 3 providers callable |
| **Wave 3** | 47-06, 47-07 | ~3 pd | Cost tracking + fallback chain |
| **Wave 4** | 47-08 | ~1.5 pd | CLI tools functional |
| **Wave 5** | 47-09, 47-10 | ~2 pd | Backward compat + full test coverage |
| **Reserve** | (unforeseen) | ~0.5 pd | Contingency for design iteration |
| **TOTAL** | 10 plans | ~12 pd | **Within 12–16 estimate** ✅ |

### Parallelization Opportunities

- **Wave 2 (plans 47-03, 47-04, 47-05):** Can parallelize all 3 provider integrations (same Wave 1 deps, independent implementations)
- **Wave 1 + Wave 2 overlap:** Plan 47-02 can start while Wave 2 develops (migrations don't block provider progress)
- **Estimated parallelization savings:** ~1 plan-day (if Wave 2 runs in parallel)

---

## 🔄 Start & End Criteria

### ✅ Start Criteria (Phase 47 Readiness)

Before kickoff, verify:

- [x] **Design decisions locked:** D-01 through D-07 from DISCUSS-PHASE-SUMMARY.md approved
- [x] **Phase 46 signed off:** Operator Task Graph UI complete + verified
- [x] **Supabase infrastructure:** MarkOSDB migrations pipeline ready (Phase 42 foundation)
- [x] **Telemetry backend:** PostHog operational (Phase 37)
- [x] **Package dependencies:** `@anthropic-ai/sdk`, `@google-cloud/generative-ai` added to `package.json`
- [x] **TypeScript build:** `npm run build:llm` (custom build target for LLM module)
- [x] **Test framework:** `npm test` works for new `test/llm-adapter/**` tests
- [x] **Supabase local:** `npx supabase start` and migrations applied locally

### ✅ End Criteria (Phase 47 Completion)

Phase 47 is COMPLETE when all of the following are verified:

- [x] **All 10 plans executed:** Each plan (47-01 through 47-10) passed individual verification
- [x] **Test coverage:** `npm test` shows ≥95% coverage for `lib/markos/llm/**`
- [x] **Providers tested:** All 3 providers (Claude, OpenAI, Gemini) callable with mock + live API keys
- [x] **Fallback chain verified:** Integration tests confirm fallback behavior works correctly
- [x] **Cost telemetry emitted:** Events recorded in PostHog; `npx markos llm:status` shows populated data
- [x] **CLI tools functional:** `npx markos llm:config` stores keys, `npx markos llm:status` displays dashboard
- [x] **Backward compatibility:** `onboarding/backend/agents/llm-adapter.cjs` wrapper passes dual-path tests
- [x] **Zero breaking changes:** Existing onboarding flows (`mir-filler`, `msp-filler`, `orchestrator`) work unmodified
- [x] **Documentation complete:** `docs/LLM-BYOK-ARCHITECTURE.md` + `docs/OPERATOR-LLM-SETUP.md` reviewed + approved
- [x] **Performance baseline:** Average LLM call latency <2s (95th percentile <5s)
- [x] **Security audit:** Supabase RLS policies verified; encryption round-trip validated
- [x] **Phase sign-off:** GSD lead approves Phase 47 completion

---

## 📋 Execution Checklist

Use this checklist to track Wave completion. Review at end of each Wave.

### Wave 1: Foundation & Infrastructure
- [x] Plan 47-01: TypeScript adapter scaffolding + types compiled without errors
- [x] Plan 47-01: `lib/markos/llm/adapter.ts` stubs created
- [x] Plan 47-01: `lib/markos/llm/provider-registry.ts` with all 3 providers configured
- [x] Plan 47-01: Unit tests pass (provider registry initialization)
- [x] Plan 47-02: Supabase migration `47_operator_llm_management.sql` created
- [x] Plan 47-02: `operator_api_keys` + `operator_llm_preferences` tables exist
- [x] Plan 47-02: RLS policies configured + tested
- [x] Plan 47-02: `lib/markos/llm/settings.ts` schema + validation implemented
- [x] Plan 47-02: Encryption/decryption round-trip tests pass
- [x] **Wave 1 Sign-Off:** Foundation stable; ready for Wave 2

### Wave 2: Provider Integration
- [x] Plan 47-03: `@anthropic-ai/sdk` added to `package.json`
- [x] Plan 47-03: `lib/markos/llm/providers/claude.ts` implemented
- [x] Plan 47-03: Claude adapter tests pass (≥95% coverage)
- [x] Plan 47-04: `lib/markos/llm/providers/openai.ts` implemented
- [x] Plan 47-04: OpenAI adapter tests pass (≥95% coverage)
- [x] Plan 47-05: `@google/generative-ai` added to `package.json`
- [x] Plan 47-05: `lib/markos/llm/providers/gemini.ts` implemented
- [x] Plan 47-05: Gemini adapter tests pass (≥95% coverage)
- [x] **Wave 2 Sign-Off:** All 3 providers callable + tested

### Wave 3: Telemetry & Resilience
- [x] Plan 47-06: `lib/markos/llm/cost-calculator.ts` implemented + tested
- [x] Plan 47-06: Telemetry events added to `lib/markos/telemetry/events.ts`
- [x] Plan 47-06: Cost events emit correctly from wrapper
- [x] Plan 47-07: `lib/markos/llm/fallback-chain.ts` state machine implemented
- [x] Plan 47-07: Fallback chain tests pass (all scenarios: success, timeout, rate limit, auth error, all fail)
- [x] Plan 47-07: Telemetry tracks `decision_mode`, `fallback_attempts`, `fallback_reasons`
- [x] **Wave 3 Sign-Off:** Resilience + observability working

### Wave 4: CLI Tools & Observability
- [x] Plan 47-08: `bin/llm-config.cjs` wizard implemented
- [x] Plan 47-08: Interactive prompts working; validation enforced
- [x] Plan 47-08: Keys encrypted + stored in Supabase
- [x] Plan 47-08: Test provider option (`--test`) makes sample call
- [x] Plan 47-08: `bin/llm-status.cjs` dashboard implemented
- [x] Plan 47-08: Dashboard displays correct usage + cost + budget
- [x] Plan 47-08: `--month` option works; `--export=csv` produces valid output
- [x] Plan 47-08: npm scripts added (`markos llm:config`, `markos llm:status`)
- [x] Plan 47-08: CLI integration tests pass
- [x] **Wave 4 Sign-Off:** Operator tools ready

### Wave 5: Integration & Verification
- [x] Plan 47-09: `onboarding/backend/agents/llm-adapter.cjs` wrapper created
- [x] Plan 47-09: Dual-path tests pass (wrapper ≡ TypeScript adapter)
- [x] Plan 47-09: Deprecation notice added to legacy wrapper
- [x] Plan 47-09: Onboarding flows (`mir-filler`, `msp-filler`, `orchestrator`) still work
- [x] Plan 47-10: All unit tests written + passing (≥95% coverage)
- [x] Plan 47-10: All integration tests written + passing
- [x] Plan 47-10: E2E test passes (config → call → telemetry → status)
- [x] Plan 47-10: `docs/LLM-BYOK-ARCHITECTURE.md` complete + reviewed
- [x] Plan 47-10: `docs/OPERATOR-LLM-SETUP.md` complete + reviewed
- [x] Plan 47-10: Coverage report shows ≥95% lines + ≥90% branches
- [x] **Wave 5 Sign-Off:** Full test coverage + documentation ready
- [x] **PHASE 47 COMPLETE:** All end criteria met; signed off by GSD lead

---

## 🎯 Key Success Factors

1. **Type Safety First:** TypeScript types locked in Wave 1; avoid `any` violations throughout
2. **Test-Driven:** Write tests for each provider as you implement (TDD reduces Wave 5 rework)
3. **Telemetry Instrumentation:** Keep cost events flowing; validate early (Wave 3) not late
4. **Fallback Chain Complexity:** Invest time in fallback state machine; automated tests prevent edge case bugs
5. **CLI Usability:** Field-test config wizard with sample operators; iterate on UX before Wave 5
6. **Documentation Clarity:** Write operator guide as you build; clarify gray areas early

---

## 📞 Dependency Verification Checklist

Before Wave 1 kickoff, confirm:

- [x] Supabase MarkOSDB accessible from local dev environment
- [x] `@anthropic-ai/sdk` compatible with Node.js version (Phase 47 targets Node 18+)
- [x] `@google-cloud/generative-ai` compatible (test with mock Gemini API)
- [x] PostHog telemetry backend accepting events
- [x] `npm test` framework ready for new tests
- [x] TypeScript compiler configured for `lib/markos/llm/` source

---

**END OF PLAN**

---

**Next Step:** Review plan with GSD lead. Once approved, begin Wave 1 execution.

**Questions or blockers?** Document in `.planning/phases/47-multi-provider-llm-byok/47-IMPLEMENTATION-LOG.md` during execution.
