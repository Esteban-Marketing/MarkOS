# LLM BYOK Architecture

## Overview

Phase 47 introduces a unified LLM adapter that supports Anthropic, OpenAI, and Gemini behind a single contract.

Goals:
- Keep onboarding agents provider-agnostic.
- Support workspace/operator-scoped BYOK key storage.
- Emit deterministic usage and cost telemetry per call.
- Preserve backward compatibility for existing CommonJS onboarding surfaces.

## Call Flow

```text
call(systemPrompt, userPrompt, options)
  -> validate options
  -> resolve provider order (explicit/default/fallback)
  -> execute provider call(s)
  -> normalize result contract
  -> emit telemetry event (cost + decision metadata)
  -> return result with telemetryEventId
```

## Components

- `lib/markos/llm/adapter.ts`
- `lib/markos/llm/fallback-chain.ts`
- `lib/markos/llm/provider-registry.ts`
- `lib/markos/llm/settings.ts`
- `lib/markos/llm/encryption.ts`
- `lib/markos/llm/cost-calculator.ts`
- `lib/markos/llm/telemetry-adapter.ts`
- `lib/markos/llm/providers/claude.ts`
- `lib/markos/llm/providers/openai.ts`
- `lib/markos/llm/providers/gemini.ts`
- `onboarding/backend/agents/llm-adapter.cjs` (legacy compatibility wrapper)

## Data and Security

Secret and preference storage is workspace-scoped:
- `markos_operator_api_keys`
- `markos_operator_llm_preferences`
- `markos_llm_call_events`

Migration:
- `supabase/migrations/47_operator_llm_management.sql`

Keys are encrypted before persistence and never logged in plaintext.

## Telemetry Contract

Primary event:
- `markos_llm_call_completed`

Payload includes:
- provider, model
- input/output/total tokens
- estimated cost
- latency
- original/final provider
- fallback attempts and reasons
- decision mode (`explicit`, `default`, `fallback`)

## Fallback and Error Strategy

- Default behavior allows fallback across providers.
- `noFallback` disables automatic failover.
- Max-attempt cap prevents runaway retries.
- Timeout and rate-limit failures apply bounded backoff.
- Exhaustion returns `FALLBACK_EXHAUSTED` with attempt context.

## Compatibility Strategy

Legacy onboarding code remains on CommonJS API:
- `onboarding/backend/agents/llm-adapter.cjs`

Wrapper behavior:
- Prefers modern adapter if a compiled bridge is available.
- Preserves fallback-safe behavior expected by onboarding consumers.
- Includes explicit deprecation note to migrate new integrations to `lib/markos/llm/adapter.ts`.

## Verification Scope

Phase 47 Wave 5 verifies:
- dual-path wrapper behavior
- CLI config/status integration
- end-to-end config -> usage -> status reporting
- build and test stability in `test/llm-adapter/**`
