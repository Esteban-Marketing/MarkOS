import { executeFallbackChain } from "./fallback-chain";
import { getDefaultModel } from "./provider-registry";
import { callClaude as callClaudeProvider } from "./providers/claude";
import { callGemini as callGeminiProvider } from "./providers/gemini";
import { callOpenAI as callOpenAIProvider } from "./providers/openai";
import { emitLLMCallCompleted } from "./telemetry-adapter";
import {
  assertProviderName,
  type LLMCallOptions,
  type LLMCallResult,
  type ProviderName,
} from "./types";

function resolveProvider(options?: LLMCallOptions): ProviderName {
  if (options?.provider) {
    return assertProviderName(options.provider);
  }

  return "anthropic";
}

function buildInvalidConfigResult(provider: ProviderName, model: string, message: string): LLMCallResult {
  return {
    ok: false,
    text: "",
    provider,
    model,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
    latencyMs: 0,
    telemetryEventId: "pending-wave-3",
    error: {
      code: "INVALID_CONFIG",
      message,
    },
  };
}

export async function call(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {},
): Promise<LLMCallResult> {
  if (!systemPrompt.trim() || !userPrompt.trim()) {
    throw new Error("INVALID_CONFIG: systemPrompt and userPrompt are required");
  }

  const provider = resolveProvider(options);
  const model = options.model ?? getDefaultModel(provider);

  if (options.model && !options.model.trim()) {
    return buildInvalidConfigResult(provider, model, "INVALID_CONFIG: model cannot be empty");
  }

  if (options.maxTokens !== undefined && options.maxTokens <= 0) {
    return buildInvalidConfigResult(provider, model, "INVALID_CONFIG: maxTokens must be positive");
  }

  if (options.temperature !== undefined && (options.temperature < 0 || options.temperature > 2)) {
    return buildInvalidConfigResult(provider, model, "INVALID_CONFIG: temperature must be between 0 and 2");
  }

  const execution = await executeFallbackChain(
    systemPrompt,
    userPrompt,
    { ...options, provider, model },
    {
      anthropic: callClaude,
      openai: callOpenAI,
      gemini: callGemini,
    },
  );

  const telemetryEventId = await emitLLMCallCompleted({
    workspaceId: options.workspaceId,
    role: options.role,
    requestId: options.requestId,
    operatorId:
      typeof options.metadata?.operatorId === "string" ? options.metadata.operatorId : undefined,
    provider: execution.result.provider,
    model: execution.result.model,
    inputTokens: execution.result.usage.inputTokens,
    outputTokens: execution.result.usage.outputTokens,
    totalTokens: execution.result.usage.totalTokens,
    latencyMs: execution.result.latencyMs,
    originalProvider: execution.originalProvider,
    finalProvider: execution.finalProvider,
    fallbackAttempts: execution.fallbackAttempts,
    fallbackReasons: execution.fallbackReasons,
    decisionMode: execution.decisionMode,
    metadata: options.metadata,
    errorCode: execution.result.error?.code,
    errorMessage: execution.result.error?.message,
  });

  return {
    ...execution.result,
    telemetryEventId,
  };
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {},
): Promise<LLMCallResult> {
  return callClaudeProvider(systemPrompt, userPrompt, options);
}

export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {},
): Promise<LLMCallResult> {
  return callOpenAIProvider(systemPrompt, userPrompt, options);
}

export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {},
): Promise<LLMCallResult> {
  return callGeminiProvider(systemPrompt, userPrompt, options);
}