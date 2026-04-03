---
phase: 47
phase_name: Multi-Provider LLM BYOK Abstraction Layer
milestone: v3.1.0
milestone_name: Operator Surface Unification
researched: "2026-04-02"
domain: Multi-provider LLM abstraction, BYOK key management, cost telemetry, Supabase encryption, CLI observability
confidence: HIGH
---

# Phase 47: Multi-Provider LLM BYOK Abstraction Layer — Research

## Executive Summary

Phase 47 ships a unified, type-safe LLM call interface supporting Claude, OpenAI, and Gemini with operator BYOK (Bring Your Own Keys) key management. The design separates execution from approval state, implements smart fallback chains with telemetry tracking, and provides CLI-first observability for cost/usage monitoring. The implementation path maintains backward compatibility with the existing CommonJS `llm-adapter.cjs` while establishing TypeScript as the new standard for LLM calls.

**Locked design decisions (7):** Provider selection strategy, secret storage (hybrid model), cost telemetry architecture, error handling & resilience, API contract & type safety, configuration storage, monitoring & observability.

---

## 1. Implementation Path Analysis

### 1.1 TypeScript vs CommonJS Migration Strategy

#### Current State
- **Legacy:** `onboarding/backend/agents/llm-adapter.cjs` (CommonJS, 250+ lines)
  - Supports Anthropic, OpenAI, Gemini, Ollama (fallback)
  - No type safety; options are loose object shapes
  - Provider priority hardcoded: `ANTHROPIC_API_KEY` → `OPENAI_API_KEY` → `GEMINI_API_KEY`
  - Returns `{ text, usage, provider, error? }` shape

#### Migration Strategy: Dual-Path (Recommended)

**Phase 47 approach:** Build new TypeScript adapter at `lib/markos/llm/adapter.ts` as the primary implementation path. Keep legacy CJS wrapper as thin compatibility shim.

```
New Architecture:

lib/markos/llm/adapter.ts (TypeScript - PRIMARY)
  ├─ LLMCallOptions (strict types)
  ├─ LLMCallResult (struct type)
  ├─ call(systemPrompt, userPrompt, options)
  ├─ callClaude(...), callOpenAI(...), callGemini(...)
  ├─ Provider-specific error mapping
  └─ Cost calculation hooks

lib/markos/llm/provider-registry.ts
  ├─ Default models per provider
  ├─ Cost rates (Token/MTok)
  └─ Provider metadata

lib/markos/llm/settings.ts
  ├─ Config schema validation
  ├─ Operator defaults loading
  └─ Env var fallback

lib/markos/llm/cost-calculator.ts
  ├─ Token → USD conversion
  ├─ Multi-provider rate support
  └─ Monthly aggregation helpers

lib/markos/llm/telemetry-adapter.ts
  ├─ Event wrapping
  ├─ Usage tracking
  └─ Redaction/sanitization

onboarding/backend/agents/llm-adapter.cjs (CommonJS - COMPATIBILITY SHIM)
  ├─ Requires TypeScript adapter (via transpiled JS)
  ├─ Maintains old function signature: call(sys, user, opts)
  ├─ Returns identical result shape
  └─ DEPRECATED BY PHASE 49 (explicit sunset message)

bin/llm-config.cjs
  └─ Interactive CLI wizard for operator key setup

bin/llm-status.cjs
  └─ CLI dashboard for cost/usage reporting
```

**Backward Compatibility Contract:**
- Old code calling `llm-adapter.cjs` continues working
- New code uses TypeScript wrapper directly
- Shared test suite ensures dual-path returns identical results
- Deprecation timeline: Phase 49+ (6-week notice in CHANGELOG)

#### Why This Approach
- **Zero breaking changes:** Existing onboarding orchestrator continues working
- **Type safety ramp:** New flows (Phase 48+) get IDE autocomplete; old code unaffected
- **Clear migration path:** Developers know exactly when to cut over
- **Testability:** Dual-path tests catch any behavior drift

---

### 1.2 Provider SDK Integration Path

#### SDK Dependencies Required

| Provider | Package | Version | Notes |
|----------|---------|---------|-------|
| Anthropic | `@anthropic-ai/sdk` | `^1.40.0` (latest) | Already uses native fetch internally |
| OpenAI | `openai` | `^6.32.0` (in package.json) | Already installed |
| Google Gemini | `@google-cloud/generative-ai` | `^0.15.0` | Native REST API; SDK optional but recommended |

**Action Items:**
1. Add `@anthropic-ai/sdk` to dependencies (currently using fetch)
2. Keep `openai` at current version
3. Add `@google-cloud/generative-ai` (replaces current fetch-based approach)
4. Update `.env.example` with new env var keys: `CLAUDE_API_KEY` (alias for `ANTHROPIC_API_KEY`), keep existing keys

#### Provider Adapter Structure

Each provider gets a dedicated module with consistent interface:

```ts
// lib/markos/llm/providers/claude.ts
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions
): Promise<LLMCallResult> {
  // Instantiate Anthropic client (cached singleton)
  // Build messages array
  // Call client.messages.create()
  // Extract usage metrics
  // Return structured result
}

// Similar structure for openai.ts, gemini.ts
```

**Error Handling per Provider:**
- Anthropic: `APIError`, `TimeoutError`, `RateLimitError` → map to unified `LLMError` enum
- OpenAI: `OpenAIError`, `APIConnectionError`, `RateLimitError` → map to unified type
- Gemini: `GoogleGenerativeAIFetchError`, `GoogleGenerativeAIError` → map to unified type

---

### 1.3 Cost Calculation Approach

#### Token-Based Pricing Model (Phase 47)

**Cost data structure:**
```ts
interface ProviderCostRates {
  claudeHaiku: { input: 0.80, output: 4.00 } // per Million tokens
  gpt4oMini: { input: 0.15, output: 0.60 }
  gemini2_5Flash: { input: 0.075, output: 0.30 }
}
```

**Calculation formula:**
```
cost_usd = (input_tokens * input_rate_per_mtok / 1_000_000) + 
           (output_tokens * output_rate_per_mtok / 1_000_000)
```

**Implementation location:** `lib/markos/llm/cost-calculator.ts`

```ts
export function calculateCostUSD(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  operatorCostRates?: ProviderCostRates
): number {
  // Use operator-provided rates, or fallback to defaults
  const rates = operatorCostRates ?? DEFAULT_RATES;
  const providerRates = rates[provider][model];
  
  return (inputTokens * providerRates.input / 1_000_000) +
         (outputTokens * providerRates.output / 1_000_000);
}
```

**Phase 47 limitations & Phase 48+ evolution:**
- **Phase 47:** Hardcoded default rates + operator config override (static file upload or env var) → No pricing API calls
- **Phase 48:** Live pricing API integration (fetch latest from provider APIs on-demand)
- **Monthly aggregation:** Query `markos_llm_call_events` table and sum per operator/provider/model

---

### 1.4 Secret Storage & Encryption Options

#### Phase 47: MarkOSDB + Supabase Vault

**Implementation Flow:**
1. Operator runs `npx markos llm:config`
2. Interactive wizard prompts for API keys (Anthropic, OpenAI, Gemini)
3. Entire input is encrypted before transport using Supabase encryption (pgsql pgcrypto extension)
4. Encrypted blob stored in `operator_api_keys` table
5. At runtime, operator query retrieves encrypted blob from DB and decrypts it

**Database schema:**
```sql
CREATE TABLE operator_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'gemini')),
  encrypted_key TEXT NOT NULL,  -- pgcrypto encrypted
  key_hash TEXT NOT NULL,       -- SHA256 hash for deduping/audit
  rotation_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(operator_id, provider)
);
```

**Encryption method:**
- Use Supabase's `pgp_sym_encrypt()` with operator-specific passphrase
- Passphrase = `sha256(operator_id + MARKOS_VAULT_SECRET)` (secret in env)
- Rotate keys: operator re-runs `llm:config`, new key is stored, old marked for deletion

#### Phase 48+: Operator-Hosted Secrets (Optional Upgrade)

**Enterprise path:** Operator provides credential endpoint (e.g., AWS Secrets Manager, HashiCorp Vault)

```ts
interface OperatorHostedCredentialSource {
  type: "aws_secrets_manager" | "hashicorp_vault" | "custom_https"
  endpoint: string
  // Optional auth (varies per vendor)
}
```

- MarkOS fetches temporary credentials on-demand (5 min TTL cache)
- Operator retains full key control
- No breaking changes to Phase 47 operators who choose Vault

---

## 2. Technical Dependencies

### 2.1 Current LLM Adapter Location & Legacy State

**File:** `onboarding/backend/agents/llm-adapter.cjs`  
**Size:** ~250 lines  
**Exports:** `call(systemPrompt, userPrompt, options)`  
**Used by:**
- `onboarding/backend/agents/mir-filler.cjs` (drafts MIR sections)
- `onboarding/backend/agents/msp-filler.cjs` (drafts MSP sections)
- `onboarding/backend/agents/orchestrator.cjs` (main coordination)

**Current weaknesses:**
- No TypeScript types
- No cost tracking
- No telemetry hooks
- No operator preferences (always env-var driven)
- Fallback chain hardcoded; not overridable

### 2.2 New Location & Structure

**Primary file:** `lib/markos/llm/adapter.ts`  
**Module structure:**
```
lib/markos/llm/
├─ adapter.ts              # Main export: call(), provider-specific functions
├─ types.ts                # LLMCallOptions, LLMCallResult, LLMError enum, etc.
├─ provider-registry.ts    # Default models, cost tracking metadata
├─ settings.ts             # Config schema, operator defaults, env fallback
├─ cost-calculator.ts      # Token → USD, aggregation
├─ telemetry-adapter.ts    # Event wrapping, payload sanitization
├─ providers/
│  ├─ claude.ts            # callClaude implementation
│  ├─ openai.ts            # callOpenAI implementation
│  └─ gemini.ts            # callGemini implementation
└─ __tests__/              # Full coverage (unit + integration)
```

### 2.3 Supabase Integration for Encryption

**New table:** `operator_llm_preferences` (config) + `operator_api_keys` (encrypted secrets)

**Migration needed:**
```
supabase/migrations/47_operator_llm_management.sql
```

**Schema sections:**
1. Create `operator_api_keys` table (encrypted key storage)
2. Create `operator_llm_preferences` table (budget, primary provider, fallback config)
3. Create function `decrypt_operator_api_key()` (callable from runtime)
4. Add RLS policies (operators see only their own keys/prefs)

**Runtime queries:**
```ts
// Get operator's configured providers
const { data: prefs } = await supabase
  .from('operator_llm_preferences')
  .select('*')
  .eq('operator_id', operatorId)
  .single();

// Get encrypted key for provider
const { data: keyRow } = await supabase
  .from('operator_api_keys')
  .select('encrypted_key')
  .eq('operator_id', operatorId)
  .eq('provider', 'anthropic')
  .single();

// Decrypt (happens server-side or via stored function)
const decrypted = await decryptOperatorKey(keyRow.encrypted_key);
```

### 2.4 Telemetry Event Schema Alignment

**New event type:** `markos_llm_call_completed`

**Add to `lib/markos/telemetry/events.ts`:**
```ts
export type MarkOSTelemetryEvent = {
  name:
    | ...existing events...
    | "markos_llm_call_completed"  // ← NEW
    | "markos_llm_budget_80_percent" // ← NEW (alert)
    | "markos_llm_budget_100_percent"; // ← NEW (alert)
  // ... rest of event shape
};
```

**Payload structure for `markos_llm_call_completed`:**
```ts
interface LLMCallCompletedPayload {
  operator_id: string;
  provider: "anthropic" | "openai" | "gemini";
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  latency_ms: number;
  
  // Context
  task_id?: string;
  flow_domain?: string;
  campaign_id?: string;
  
  // Fallback tracking
  original_provider?: string;
  final_provider: string;
  fallback_attempts: number;
  fallback_reasons?: string[];
  
  // Decision tracking
  decision_mode: "explicit" | "default" | "fallback";
  
  // Error if applicable
  error?: string;
  error_code?: string;
}
```

---

## 3. Testing Strategy

### 3.1 Unit Tests (Per Provider)

**File:** `test/llm-adapter/providers.test.js`

**Test suite structure:**
```
✓ callClaude()
  ✓ succeeds with valid system/user prompts
  ✓ returns correct usage token counts
  ✓ throws on ANTHROPIC_API_KEY missing
  ✓ handles timeout (>5s) by throwing TimeoutError
  ✓ handles rate limit (429) with exponential backoff retry logic
  ✓ handles auth error (401) with clear error message
  ✓ parses streaming vs non-streaming responses correctly
  ✓ cost calculation matches expected formula

✓ callOpenAI()
  ✓ succeeds with SDK client
  ✓ returns correct usage token counts
  ✓ handles connection errors gracefully
  ✓ max_tokens override works
  ✓ temperature override works

✓ callGemini()
  ✓ succeeds with native SDK
  ✓ returns correct usage token counts
  ✓ handles session/model-specific quirks (e.g., system_instruction placement)
```

**Coverage minimum:** ≥95% line coverage for all provider adapters

### 3.2 Integration Tests (Fallback Chain)

**File:** `test/llm-adapter/fallback-chain.test.js`

**Test scenarios:**
```
✓ Primary provider success → returns result from primary
✓ Primary provider timeout → falls back to secondary
✓ Primary + secondary both fail → tries tertiary
✓ All providers fail → returns aggregated error with all attempt details
✓ noFallback: true → does not retry on timeout (respects override)
✓ Fallback chain respects operator-configured order (not hardcoded)
✓ Each fallback attempt is logged to telemetry
✓ Fallback decision_mode in telemetry = "fallback" (not "explicit")
```

### 3.3 Cost Calculation Validation

**File:** `test/llm-adapter/cost-calculator.test.js`

**Test cases:**
```
✓ calculateCostUSD() with default rates
  ✓ 1M input tokens @ $0.80 = $0.80
  ✓ 1M output tokens @ $4.00 = $4.00
  ✓ Mixed input/output matches formula
  ✓ Zero tokens = $0.00

✓ calculateCostUSD() with operator-provided rates
  ✓ Operator rates override defaults
  ✓ Per-provider rates respected (Claude vs OpenAI)
  ✓ Model variants respected (Claude Haiku vs Opus)

✓ Monthly aggregation
  ✓ Sum of daily costs matches expected total
  ✓ Per-operator isolation (no cost leakage)
  ✓ Budget threshold detection (80%, 100%)
```

### 3.4 Secret Storage & Rotation

**File:** `test/llm-adapter/secret-storage.test.js`

**Test environment:** Uses Supabase test DB (seeded with test data)

**Test cases:**
```
✓ Store encrypted API key in DB
  ✓ Key is encrypted before storage
  ✓ Plain-text key never logs
  ✓ Key hash is computed and stored separate

✓ Retrieve & decrypt API key
  ✓ Decrypted key matches original (roundtrip)
  ✓ Wrong operator_id cannot access another's key

✓ Key rotation
  ✓ New key stored; old key marked for deletion
  ✓ Rotation timestamp recorded
  ✓ Active key resolved deterministically (by updated_at)

✓ Multi-tenant isolation
  ✓ Operator A's keys not visible to Operator B
  ✓ RLS policies enforced
```

### 3.5 CLI Tool Tests

**File:** `test/llm-config.test.js`, `test/llm-status.test.js`

**CLI tool: `npx markos llm:config`**
```
✓ Interactive prompts for each provider key
✓ Validates API key format before saving
✓ Encrypts key before DB write
✓ Sets operator_llm_preferences (default provider, budget)
✓ Stores config in .env if running locally
✓ Stores config in MarkOSDB if running hosted
✓ Handles re-run (updates existing config)
✓ Asks for confirmation on key overwrite
```

**CLI tool: `npx markos llm:status [--month=2026-04]`**
```
✓ Displays formatted table (Anthropic, OpenAI, Gemini rows)
✓ Shows calls count per provider
✓ Shows cost per provider
✓ Shows total cost vs. budget
✓ Shows budget remaining
✓ Respects --month flag for different months
✓ Returns JSON format with --format=json flag
✓ Shows "No data" if nothing in date range
```

**CLI tool: `npx markos llm:providers`**
```
✓ Lists configured providers (✓ anthrpic, ✗ openai, ✓ gemini)
✓ Shows validation status (valid key/expired/invalid)
✓ Shows primary provider selected
✓ Indicates fallback order
```

---

## 4. Complexity Hotspots

### HIGH Complexity (Require Detailed Plan Steps)

#### 4.1 Fallback Chain State Machine
**Why HIGH:**
- Must track state across multiple provider attemps while preserving telemetry traceability
- Operator override (noFallback) must not conflict with default retry logic
- Decision tracking: which attempt succeeded? Was it explicit or fallback?
- Error aggregation: need to capture ALL errors from all attempts for diagnostics

**Decisions needed:**
- Should fallback attempts be sequential (try all) or stop-at-first-success?
- What's the timeout between fallback attempts? (Recommended: 500ms exponential backoff)
- Can operator configure per-call fallback chains, or only global preference?
- How deep can the fallback chain go? (Recommended: max 3 attempts to prevent runaway latency)

#### 4.2 Supabase Encryption Integration
**Why HIGH:**
- Encryption must be transparent to consuming code (key decryption happens at DB layer or in trusted context)
- Operator must never see other operators' keys (RLS + encryption together)
- Key rotation must be atomic and auditable
- Dev environment must work without full Vault infrastructure (fallback to env vars)

**Decisions needed:**
- Where does decryption happen? Best is server-side stored function vs. client-side after fetch
- What's the TTL for cached decrypted keys in-memory? (Recommend: 15 min, then re-fetch)
- How to handle key expiration alerts without leaking operator info to logs?
- Backward compatibility: what if operator has no key configured? (Fallback to env vars)

#### 4.3 Cost Telemetry Emission & Aggregation
**Why HIGH:**
- Cost events must be emitted after EVERY call (success or failure), accurately capturing consumption
- Token counting must match provider's accounting (not approximate)
- Operator-provided rate override must be validated and normalized
- Monthly billing/budgeting requires precise aggregation and alerting

**Decisions needed:**
- When is telemetry emitted in failure case? (Before or after error returned?) → After (cleanest)
- Should cost be included in error result? (Recommend: yes, even if call failed, tokens were consumed)
- How to handle fractional tokens? (Recommend: round up for safety)
- What's the SLA for telemetry event durability? (Recommend: async queue with at-least-once guarantees)

### MEDIUM Complexity (Fewer Steps, Clearer Patterns)

#### 4.4 Provider-Specific Error Mapping
**Why MEDIUM:**
- Each provider's SDK throws different error types (Anthropic `APIError` vs OpenAI `OpenAIError`)
- Pattern is clear: catch provider-specific, re-throw as unified `LLMError` enum
- Covers ~15 error scenarios total across 3 providers
- Analogous to Phase 45 flow contract taxonomy (controlled enum)

**Integration pattern:**
```ts
try {
  result = await callClaude(...);
} catch (err) {
  throw mapAnthropicErrorToLLMError(err);
}
```

#### 4.5 Type Safety Contract (TypeScript Migration)
**Why MEDIUM:**
- Pattern established in Phase 37–38 (RBAC types, telemetry types)
- Strict `LLMCallOptions` and `LLMCallResult` interfaces prevent misconfig at compile time
- Dual-path test approach is proven (Phase 46 task state machine had similar tests)
- No new testing frameworks or patterns needed

#### 4.6 CLI Configuration Wizard
**Why MEDIUM:**
- Pattern similar to existing onboarding UI (Phase 13: `smart-onboarding`)
- CJS-based CLI tools already exist (e.g., `bin/db-setup.cjs`)
- Prompts are standard: `prompt.question()` or `inquirer` library
- Validation is straightforward (regex for API key format, numeric for budget)

---

## 5. Risk Analysis

### 5.1 API Key Exposure Risks & Mitigations

**Risk:** API keys leaked in logs, error messages, or network traffic

**Mitigations:**
1. **In-memory:** Use `sanitizePayload()` function (already in Phase 46) to redact keys from telemetry
2. **In transit:** Store encrypted in DB; never send keys via API unencrypted
3. **In error messages:** Custom error class that never includes raw keys in `.message`
4. **In logs:** Common pattern: `[REDACTED]` for all env var values in startup diagnostics
5. **In fallback chain:** Telemetry records attempt but never includes key material

**Test:** Explicitly test that error scenarios don't leak keys
```ts
const fakeKey = "sk-test-123456789";
const error = new APIError("...", fakeKey);
expect(error.toString()).not.toContain(fakeKey);
expect(JSON.stringify(error)).not.toContain(fakeKey);
```

### 5.2 Fallback Chain Failures

**Risk:** All providers fail; operator is left hanging without diagnostic info

**Mitigations:**
1. **Aggregated error:** Return error object with all attempt details:
   ```ts
   {
     ok: false,
     error: "All LLM providers exhausted",
     attempts: [
       { provider: 'anthropic', error: 'TIMEOUT', latency_ms: 5001 },
       { provider: 'openai', error: 'RATE_LIMITED', latency_ms: 2100 },
       { provider: 'gemini', error: 'AUTH_FAILED', latency_ms: 300 }
     ]
   }
   ```
2. **Telemetry:** Record every attempt in telemetry events for root-cause analysis
3. **Alert:** Emit `markos_llm_all_providers_failed` event to trigger dashboard alert
4. **CLI:** `npx markos llm:status` shows last 10 errors and health per provider

**Worst case:** Operator must manually switch to a single provider via `llm:config`

### 5.3 Cost Calculation Accuracy

**Risk:** Operator grossly overcharged due to token-counting discrepancies

**Mitigations:**
1. **Provider-native counts:** Always use token counts returned by provider (not estimated)
2. **Reconciliation:** Weekly job compares our calculated costs vs. provider invoice (future Phase 48)
3. **Operator transparency:** Cost shown immediately in CLI after each call
4. **Budget alerts:** 80% threshold triggers advisory; 100% threshold blocks further calls
5. **Audit log:** All cost calculations stored in `markos_llm_call_events` table with provider response

**Acceptable variance:** ±2% (provider rate fluctuations, rounding).

### 5.4 Multi-Tenant Isolation in MarkOSDB

**Risk:** Operator B can query Operator A's LLM usage/cost data

**Mitigations:**
1. **RLS policies:** All tables (`operator_llm_preferences`, `operator_api_keys`, cost events) scoped to `auth.users(id)`
2. **Query guards:** Every query includes `WHERE operator_id = current_user_id()`
3. **Test coverage:** `test/llm-adapter/multi-tenant.test.js` explicitly verifies isolation
4. **Audit:** Cost telemetry events tagged with operator_id; no cross-operator aggregation in default queries

---

## 6. Reusable Patterns from Prior Phases

### 6.1 Contract Patterns (Phase 45)

**Phase 45 achievement:** 17 flows mapped to YAML contracts + JSON schema validation

**Reuse for Phase 47:**
- **Contract for LLM adapter:** Create `contracts/F-LLM-multi-provider-abstraction-v1.yaml`
  ```yaml
  flow_id: "F-LLM-01"
  flow_name: "multi-provider-llm-call"
  domain: "core"  # (new domain for utility flows)
  flow_type: "adapter"  # (new type)
  version: "v1"
  openapi: "3.0.3"
  
  info:
    title: "Multi-Provider LLM Call Abstraction"
    version: "1.0.0"
  
  x-markos-meta:
    providers: ["anthropic", "openai", "gemini"]
    input_tokens: "measured"
    output_tokens: "measured"
    cost_tracking: true
  ```

- **Add enums:** Locked contracts include fallback modes, provider names, error types
- **Validation:** CI validates that adapter implementation matches contract (e.g., telemetry fields always present)

### 6.2 Configuration Patterns (Phase 46)

**Phase 46 achievement:** Task state machine + React Context + in-memory fixtures

**Reuse for Phase 47:**
- **Config schema:** Operator preferences stored exactly like task state (immutable snapshots + event log)
  ```ts
  interface OperatorLLMPreferences {
    operator_id: UUID;
    available_providers: Record<string, boolean>; // { "anthropic": true, "openai": false, ... }
    primary_provider: "anthropic" | "openai" | "gemini";
    cost_budget_monthly_usd: number;
    allow_fallback: boolean;
    fallback_order: string[]; // ["anthropic", "openai", "gemini"]
    config_updated_at: timestamp;
    config_updated_by: UUID;
  }
  ```

- **In-memory store pattern:** CLI tools load config into memory (similar to `TaskStoreProvider`)
- **Event sourcing:** Config changes recorded with timestamp + actor ID (audit trail)

### 6.3 Telemetry Patterns (Phases 37–46)

**Phase 45–46 pattern:** `buildEvent()` + `sanitizePayload()` + PostHog emission

**Reuse structure for LLM telemetry:**
```ts
// From lib/markos/telemetry/events.ts
const event: MarkOSTelemetryEvent = {
  name: 'markos_llm_call_completed',
  workspaceId: operator.workspaceId,
  role: operator.role,
  requestId: uuid(),
  payload: {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    input_tokens: 450,
    output_tokens: 320,
    estimated_cost_usd: 0.0042,
    latency_ms: 1200
  }
};

// buildEvent() applies sanitization & returns safe shape
const safeEvent = buildEvent(event);

// Emit to PostHog
capture('markos_llm_call_completed', safeEvent.payload);
```

- **Redaction rules:** Existing `sanitizePayload()` blocks `secret`, `token`, `password` → reuses Phase 38 logic
- **Event routing:** PostHog already configured in `.env`; no new analytics vendor needed
- **Dashboard integration:** Phase 48 builds LLM dashboard using same PostHog events

### 6.4 RBAC Integration (Phase 38)

**Phase 38 pattern:** Strict route-level access control + role enum

**Reuse for Phase 47:**
- Add new route: `"operations:llm"` in `lib/markos/rbac/policies.ts`
  ```ts
  type RouteKey = ... | "operations:llm";
  const routePermissions: Record<RouteKey, MarkOSRole[]> = {
    "operations:llm": ["owner", "operator"],  // Only owner/operator can configure
    ...
  };
  ```
- CLI tools check role before allowing `llm:config` execution
- `llm:status` available to all roles (read-only)

### 6.5 Database Migration Patterns (Phases 30, 42)

**Pattern:** Numbered SQL migrations in `supabase/migrations/` + checksum tracking

**For Phase 47:**
1. Create migration file: `supabase/migrations/47_operator_llm_management.sql`
2. Use `markos_migrations` table (from Phase 42) to track applied migrations
3. Migration includes:
   - `operator_api_keys` table creation
   - `operator_llm_preferences` table creation
   - Helper function `decrypt_operator_api_key()`
   - RLS policies
   - Indexes on `(operator_id, provider)`

4. CLI tool `npx markos llm:config` runs migration before storing keys

---

## 7. Estimated Complexity per Component

### Component Breakdown

| Component | Complexity | Effort (Days) | State Mgmt | Deps | Test Suite |
|-----------|------------|---|-----------|------|-----------|
| **lib/markos/llm/adapter.ts** | HIGH | 2–3 | Provider selection + fallback | @anthropic/sdk, openai, @google-cloud/generative-ai | 25+ tests |
| **lib/markos/llm/providers/claude.ts** | MEDIUM | 1 | Error mapping | @anthropic/sdk | 8 tests |
| **lib/markos/llm/providers/openai.ts** | MEDIUM | 1 | Error mapping | openai | 8 tests |
| **lib/markos/llm/providers/gemini.ts** | MEDIUM | 1 | Error mapping | @google-cloud/generative-ai | 8 tests |
| **lib/markos/llm/cost-calculator.ts** | MEDIUM | 1 | Rate lookup + precision | none | 12 tests |
| **lib/markos/llm/telemetry-adapter.ts** | MEDIUM | 1 | Event wrapping | lib/markos/telemetry | 8 tests |
| **lib/markos/llm/settings.ts** | MEDIUM | 1 | Config schema | joi/zod (or built-in) | 10 tests |
| **Database migration 47_*.sql** | MEDIUM | 1–2 | Schema + RLS + functions | Supabase | 6 tests |
| **bin/llm-config.cjs** | MEDIUM | 1–2 | Interactive CLI | inquirer | 6 tests |
| **bin/llm-status.cjs** | MEDIUM | 1 | Report rendering | cli-table3 | 4 tests |
| **Compatibility wrapper (onboarding/.../llm-adapter.cjs)** | LOW | 0.5 | Slim shim | TypeScript adapter | 5 dual-path tests |
| **RBAC integration** | LOW | 0.5 | Route policy update | existing types | 2 tests |
| **Telemetry integration** | LOW | 0.5 | Event schema addition | existing funcs | 3 tests |

**Total Estimated Effort:** 12–16 plan-days (or 5–7 waves)

---

## 8. Key Unknowns Requiring Planner Decisions

### 8.1 Multi-Tenant Operator Budgeting: Scope?

**Gray Area:** Should cost budgets be per-operator or per-role within an operator's workspace?

**Option A (Recommended):** Per-operator (simpler, more flexible)
- Each operator has independent `cost_budget_monthly_usd`
- Operationally clearer: no cross-operator budget conflicts
- Role-based budgeting layered on top in Phase 48

**Option B:** Per-role per-operator (more complex, delayed)
- Admin can cap budget per role (e.g., "strategists get $10/mo, operators get $100/mo")
- Requires role-scoped telemetry aggregation
- Deferred to Phase 48+

**Recommendation:** Phase 47 implements Option A. Phase 48 adds Option B if needed.

### 8.2 Provider Pricing Refresh Frequency?

**Gray Area:** How often should cost rates be updated?

**Option A (Recommended for Phase 47):** Hardcoded + operator override
- Default rates built into `provider-registry.ts` (no API calls)
- Operator can provide custom rates via `llm:config` (static file or env var)
- No pricing API dependency

**Option B (Phase 48+):** Daily refresh via provider APIs
- Fetch latest rates from each provider's billing API
- Cache locally (1-day TTL)
- More accurate but adds external dependency

**Recommendation:** Phase 47 uses Option A. Phase 48 upgrades to Option B.

### 8.3 Fallback Chain Templates?

**Gray Area:** Should operators have pre-built fallback chain templates or free-form config?

**Option A (Recommended):** Free-form (simpler, more flexible)
- Operator specifies array: `["anthropic", "openai", "gemini"]`
- MarkOS tries each in order on failure
- No templates, no pre-computed chains

**Option B (Phase 48+):** Pre-built templates (less flexibility, faster onboarding)
- Templates: `cost_optimized` (try cheapest first), `speed_optimized` (try fastest), `quality_optimized` (try best)
- Operator selects template; order is deterministic

**Recommendation:** Phase 47 uses Option A. Phase 48 adds templates if operators request them.

### 8.4 Customer Cost Billing: Model?

**Gray Area:** How should LLM costs be billed to end customers?

**Option A:** Pass-through billing (recommended for Phase 47)
- Operator absorbs cost; no customer billing
- Simpler; aligns with "bring your own keys" model

**Option B (Phase 48+):** Operator-to-customer cost pass-through
- MarkOS tracks operator's costs; operator marks them up (±x%) and bills customer
- Requires separate cost aggregation per campaign/customer

**Recommendation:** Phase 47 assumes pass-through (no customer billing). Phase 48 revisits if MarkOS starts managing operator costs directly.

### 8.5 Default Model Per Provider?

**Gray Area:** Should operators pick specific model versions, or should MarkOS choose defaults?

**Option A (Recommended):** Hardcoded defaults (simpler for Phase 47)
- Claude: `claude-3-5-haiku-20241022` (fastest, cheapest)
- OpenAI: `gpt-4o-mini` (multimodal, reasonable cost)
- Gemini: `gemini-2.5-flash` (latest, fast)
- Operator can override via `llm:config` or call options

**Option B (Later):** Operator-selectable models
- Operator chooses model during `llm:config`: "Which Claude model?" → dropdown
- More flexibility but more configuration burden

**Recommendation:** Phase 47 uses Option A. Phase 48 adds model selection UI if operators request specific models.

---

## 9. Integration Points & Potential Issues

### 9.1 High-Risk Integration Points

#### **Point 1: Backward Compatibility Shim**
- **Risk:** Old code calling CJS adapter breaks if TypeScript adapter has bugs
- **Mitigation:** Comprehensive dual-path test suite; byte-for-byte identical results
- **Test:** `test/llm-adapter/compat-shim.test.js` compares old vs new for 100 calls

#### **Point 2: Supabase Encryption Round-Trip**
- **Risk:** Decryption fails silently or returns garbage data
- **Mitigation:** Roundtrip test + audit logging of all decrypt attempts
- **Test:** `test/llm-adapter/encryption.test.js` tests with real Supabase test DB

#### **Point 3: Fallback Chain Latency**
- **Risk:** Operator's call times out because fallback retries take too long (total > 30s)
- **Mitigation:** Per-attempt timeout cap (5s per provider × 3 providers = 15s max)
- **Config:** `LLMCallOptions.fallback_timeout_per_provider_ms` (default: 5000)

#### **Point 4: Cost Calculation Rounding**
- **Risk:** Fractional token amounts cause billing discrepancies
- **Mitigation:** Always round UP (to be conservative); document policy in `RESEARCH.md`
- **Test:** `test/llm-adapter/cost-calc-precision.test.js` tests edge cases

### 9.2 Operational Integration Checkpoints

#### **Before shipping Phase 47:**
1. ✅ All provider SDKs installed and tested for latest versions
2. ✅ Supabase migration runs in CI/CD pipeline
3. ✅ CLI tools (`npx markos llm:config`, `llm:status`) work in both local + hosted
4. ✅ Telemetry events flow to PostHog (or diagnostic output in local mode)
5. ✅ RLS policies verified to prevent cross-operator access
6. ✅ Backward-compat wrapper passes 100% of legacy tests

---

## 10. Recommended Execution Approach

### Phase 47 Waves (5–7 total)

1. **Wave 1:** Core adapter + provider integration (Claude, OpenAI, Gemini SDKs)
2. **Wave 2:** Supabase encryption + secret storage
3. **Wave 3:** Cost calculation + telemetry integration
4. **Wave 4:** Configuration management + CLI tools
5. **Wave 5:** Backward-compat wrapper + dual-path tests
6. **Wave 6:** RBAC + deployment readiness
7. **Wave 7:** Documentation + handbook entries

**Parallel tracks:** Waves 1 & 2 can overlap (SDK setup doesn't block encryption schema design).

---

## 11. Risk Mitigation Summary

| Risk | Mitigation | Complexity | Owner |
|------|-----------|-----------|-------|
| API keys leaked in logs | `sanitizePayload()` redaction; plaintext never stored | MED | Phase 47 Executor |
| Fallback chain exhaustion | Aggregated error reporting + alert events | MED | Phase 47 Executor |
| Cost calculation inaccuracy | Provider-native token counts + reconciliation job Phase 48 | HIGH | Phase 47 + 48 |
| Multi-tenant leakage | RLS policies + query guards + test coverage | HIGH | Phase 47 Executor |
| Backward-compat bit-rot | Comprehensive dual-path test suite | MED | Phase 47 Executor |
| Encryption key rotation chaos | Atomic updates + audit logging | MED | Phase 47 Executor |

---

## 12. Success Criteria for Phase 47

1. ✅ **Adapter:** `lib/markos/llm/adapter.ts` exports `call()` with full type safety
2. ✅ **Providers:** All 3 providers (Claude, OpenAI, Gemini) working with fallback chain
3. ✅ **Secret Storage:** Keys encrypted in Supabase; no plaintext in logs or .env
4. ✅ **Cost Tracking:** Every LLM call emits `markos_llm_call_completed` event with token counts + cost
5. ✅ **CLI Tools:** `npx markos llm:config` interactive wizard; `npx markos llm:status` shows usage
6. ✅ **Tests:** ≥95% line coverage; all scenarios (success, timeout, rate limit, all-fail) tested
7. ✅ **Compat:** Legacy CJS code continues working without modification
8. ✅ **Docs:** Implementation guide + operator handbook + troubleshooting guide


---

**Research completed:** 2026-04-02  
**Research confidence:** HIGH — all decisions locked, existing patterns identified, integration points mapped  
**Ready for planner:** ✅ All unknowns documented; decision matrix provided
