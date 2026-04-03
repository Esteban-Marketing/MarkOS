import type { LLMCallOptions, LLMError, LLMErrorCode, LLMCallResult, ProviderName } from "../types";

const DEFAULT_TIMEOUT_MS = 30000;

export function getTimeoutMs(options: LLMCallOptions): number {
  if (!options.timeoutMs || options.timeoutMs <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return options.timeoutMs;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error("TIMEOUT"));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

export function mapProviderError(error: unknown): LLMError {
  const anyError = error as { message?: string; status?: number; code?: string; name?: string };
  const message = (anyError?.message ?? "Unknown provider error").toString();
  const status = typeof anyError?.status === "number" ? anyError.status : undefined;
  const lowered = message.toLowerCase();

  let code: LLMErrorCode = "UNKNOWN_ERROR";
  if (status === 401 || status === 403 || lowered.includes("auth") || lowered.includes("api key")) {
    code = "AUTH_ERROR";
  } else if (status === 429 || lowered.includes("rate limit") || lowered.includes("too many requests")) {
    code = "RATE_LIMITED";
  } else if (anyError?.name === "AbortError" || lowered.includes("timeout") || message === "TIMEOUT") {
    code = "TIMEOUT";
  }

  return {
    code,
    message,
  };
}

export function buildErrorResult(
  provider: ProviderName,
  model: string,
  error: LLMError,
  latencyMs: number,
): LLMCallResult {
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
    latencyMs,
    telemetryEventId: "pending-wave-3",
    error,
  };
}
