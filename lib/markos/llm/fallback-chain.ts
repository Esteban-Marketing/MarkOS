import { getDefaultModel } from "./provider-registry";
import { buildProviderAttemptMetadata } from "./telemetry-adapter";
import type { LLMCallOptions, LLMCallResult, LLMDecisionMode, ProviderName } from "./types";

type ProviderCallers = Record<ProviderName, (
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions,
) => Promise<LLMCallResult>>;

type FallbackRuntime = {
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
  backoffMs?: number;
};

export type FallbackExecutionResult = {
  result: LLMCallResult;
  originalProvider: ProviderName;
  finalProvider: ProviderName;
  fallbackAttempts: number;
  fallbackReasons: string[];
  decisionMode: LLMDecisionMode;
  providerAttempts: Record<string, unknown>[];
};

const PROVIDER_ORDER: ProviderName[] = ["anthropic", "openai", "gemini"];

function createSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDefaultChain(primary: ProviderName): ProviderName[] {
  return [primary, ...PROVIDER_ORDER.filter((provider) => provider !== primary)];
}

function buildChain(options: LLMCallOptions, primary: ProviderName): ProviderName[] {
  const candidates = options.allowedProviders && options.allowedProviders.length > 0
    ? [primary, ...options.allowedProviders]
    : options.fallbackChain && options.fallbackChain.length > 0
      ? [primary, ...options.fallbackChain]
      : buildDefaultChain(primary);

  return [...new Set(candidates)];
}

function shouldBackoff(result: LLMCallResult): boolean {
  const code = result.error?.code;
  return code === "RATE_LIMITED" || code === "TIMEOUT";
}

export async function executeFallbackChain(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions,
  callers: ProviderCallers,
  runtime: FallbackRuntime = {},
): Promise<FallbackExecutionResult> {
  const primaryProvider = options.primaryProvider ?? options.provider ?? "anthropic";
  const chain = options.noFallback ? [primaryProvider] : buildChain(options, primaryProvider);
  const maxAttempts = Math.max(1, runtime.maxAttempts ?? 3);
  const allowedChain = chain.slice(0, maxAttempts);
  const sleep = runtime.sleep ?? createSleep;
  const fallbackReasons: string[] = [];
  const providerAttempts: Record<string, unknown>[] = [];
  let totalLatencyMs = 0;
  let finalProvider = allowedChain[0];
  let lastError: LLMCallResult["error"];

  for (let index = 0; index < allowedChain.length; index += 1) {
    const provider = allowedChain[index];
    finalProvider = provider;

    const providerResult = await callers[provider](systemPrompt, userPrompt, {
      ...options,
      provider,
      model: options.model ?? getDefaultModel(provider),
    });

    totalLatencyMs += providerResult.latencyMs;
    providerAttempts.push(
      buildProviderAttemptMetadata({
        provider,
        model: providerResult.model,
        attemptNumber: index + 1,
        primaryProvider,
        latencyMs: providerResult.latencyMs,
        fallbackReason: index > 0 ? fallbackReasons[index - 1] : undefined,
        errorCode: providerResult.error?.code,
        estimatedCostUsd: 0,
        metadata: {
          totalTokens: providerResult.usage.totalTokens,
        },
      }),
    );

    if (providerResult.ok) {
      const decisionMode: LLMDecisionMode =
        index === 0
          ? (options.provider ? "explicit" : "default")
          : "fallback";

      return {
        result: {
          ...providerResult,
          latencyMs: totalLatencyMs,
        },
        originalProvider: primaryProvider,
        finalProvider: provider,
        fallbackAttempts: index,
        fallbackReasons,
        decisionMode,
        providerAttempts,
      };
    }

    lastError = providerResult.error;
    if (providerResult.error?.code) {
      fallbackReasons.push(providerResult.error.code);
    }

    const hasNextAttempt = index < allowedChain.length - 1;
    if (hasNextAttempt && shouldBackoff(providerResult)) {
      const base = Math.max(50, runtime.backoffMs ?? 100);
      await sleep(base * Math.pow(2, index));
    }
  }

  const exhaustedResult: LLMCallResult = {
    ok: false,
    text: "",
    provider: finalProvider,
    model: options.model ?? getDefaultModel(finalProvider),
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
    latencyMs: totalLatencyMs,
    telemetryEventId: "pending-wave-3",
    error: {
      code: "FALLBACK_EXHAUSTED",
      message: `All providers failed. Last error: ${lastError?.message ?? "Unknown"}`,
    },
  };

  return {
    result: exhaustedResult,
    originalProvider: primaryProvider,
    finalProvider,
    fallbackAttempts: Math.max(0, allowedChain.length - 1),
    fallbackReasons,
    decisionMode: options.provider ? "explicit" : "default",
    providerAttempts,
  };
}
