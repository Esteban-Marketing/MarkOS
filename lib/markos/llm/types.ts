export type ProviderName = "anthropic" | "openai" | "gemini";

export type FallbackTemplate = "cost_optimized" | "speed_optimized" | "reliability_optimized";

export type LLMDecisionMode = "explicit" | "default" | "fallback";

export type LLMErrorCode =
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "AUTH_ERROR"
  | "INVALID_CONFIG"
  | "FALLBACK_EXHAUSTED"
  | "NOT_IMPLEMENTED"
  | "UNKNOWN_ERROR";

export type LLMError = {
  code: LLMErrorCode;
  message: string;
};

export type CostMetrics = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

export type ProviderConfig = {
  models: string[];
  defaultModel: string;
  costRates: {
    input: number;
    output: number;
  };
};

export type LLMCallOptions = {
  provider?: ProviderName;
  primaryProvider?: ProviderName;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  allowedProviders?: ProviderName[];
  fallbackChain?: ProviderName[];
  fallbackTemplate?: FallbackTemplate;
  noFallback?: boolean;
  workspaceId?: string;
  role?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

export type LLMCallResult = {
  ok: boolean;
  text: string;
  provider: ProviderName;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  telemetryEventId: string;
  error?: LLMError;
};

const PROVIDERS: ProviderName[] = ["anthropic", "openai", "gemini"];

export function isProviderName(value: unknown): value is ProviderName {
  return typeof value === "string" && PROVIDERS.includes(value as ProviderName);
}

export function assertProviderName(value: unknown): ProviderName {
  if (!isProviderName(value)) {
    throw new Error("INVALID_CONFIG: Unsupported provider");
  }

  return value;
}