import { randomUUID } from "node:crypto";
import { calculateCostUsd } from "./cost-calculator";
import type { LLMDecisionMode, ProviderName } from "./types";

type MarkOSTelemetryEvent = {
  name: "markos_llm_call_completed" | "markos_agent_run_provider_attempt";
  workspaceId: string;
  role: string;
  requestId: string;
  payload: Record<string, unknown>;
};

type LLMCallTelemetryPayload = {
  workspaceId?: string;
  role?: string;
  requestId?: string;
  operatorId?: string;
  provider: ProviderName;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  originalProvider: ProviderName;
  finalProvider: ProviderName;
  fallbackAttempts: number;
  fallbackReasons: string[];
  decisionMode: LLMDecisionMode;
  metadata?: Record<string, unknown>;
  estimatedCostUsd?: number;
  errorCode?: string;
  errorMessage?: string;
};

type TelemetryDependencies = {
  emit?: (event: MarkOSTelemetryEvent) => Promise<void> | void;
  idFactory?: () => string;
};

type ProviderAttemptTelemetryPayload = {
  workspaceId?: string;
  role?: string;
  requestId?: string;
  provider: ProviderName;
  model: string;
  attemptNumber: number;
  primaryProvider: ProviderName;
  latencyMs: number;
  fallbackReason?: string;
  errorCode?: string;
  estimatedCostUsd?: number;
  metadata?: Record<string, unknown>;
};

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  const blocked = ["token", "password", "secret", "service_role_key"];

  for (const [key, value] of Object.entries(payload)) {
    const lowered = key.toLowerCase();
    output[key] = blocked.some((needle) => lowered.includes(needle)) ? "[REDACTED]" : value;
  }

  return output;
}

export function buildProviderAttemptMetadata(
  payload: ProviderAttemptTelemetryPayload,
): Record<string, unknown> {
  return sanitizePayload({
    provider: payload.provider,
    model: payload.model,
    attemptNumber: payload.attemptNumber,
    primaryProvider: payload.primaryProvider,
    latencyMs: payload.latencyMs,
    fallbackReason: payload.fallbackReason,
    errorCode: payload.errorCode,
    estimatedCostUsd: payload.estimatedCostUsd ?? 0,
    ...payload.metadata,
  });
}

export function buildProviderAttemptEvent(
  payload: ProviderAttemptTelemetryPayload,
  dependencies: TelemetryDependencies = {},
): MarkOSTelemetryEvent {
  const eventId = dependencies.idFactory ? dependencies.idFactory() : randomUUID();

  return {
    name: "markos_agent_run_provider_attempt",
    workspaceId: payload.workspaceId ?? "unknown-workspace",
    role: payload.role ?? "operator",
    requestId: payload.requestId ?? eventId,
    payload: buildProviderAttemptMetadata({
      ...payload,
      metadata: {
        eventId,
        ...payload.metadata,
      },
    }),
  };
}

export function buildLLMCallCompletedEvent(
  payload: LLMCallTelemetryPayload,
  dependencies: TelemetryDependencies = {},
): MarkOSTelemetryEvent {
  const eventId = dependencies.idFactory ? dependencies.idFactory() : randomUUID();
  const estimatedCostUsd =
    typeof payload.estimatedCostUsd === "number"
      ? payload.estimatedCostUsd
      : calculateCostUsd(payload.provider, {
          inputTokens: payload.inputTokens,
          outputTokens: payload.outputTokens,
        });

  return {
    name: "markos_llm_call_completed",
    workspaceId: payload.workspaceId ?? "unknown-workspace",
    role: payload.role ?? "operator",
    requestId: payload.requestId ?? eventId,
    payload: sanitizePayload({
      eventId,
      operatorId: payload.operatorId,
      provider: payload.provider,
      model: payload.model,
      inputTokens: payload.inputTokens,
      outputTokens: payload.outputTokens,
      totalTokens: payload.totalTokens,
      estimatedCostUsd,
      latencyMs: payload.latencyMs,
      originalProvider: payload.originalProvider,
      finalProvider: payload.finalProvider,
      fallbackAttempts: payload.fallbackAttempts,
      fallbackReasons: payload.fallbackReasons,
      decisionMode: payload.decisionMode,
      errorCode: payload.errorCode,
      errorMessage: payload.errorMessage,
      ...payload.metadata,
    }),
  };
}

export async function emitLLMCallCompleted(
  payload: LLMCallTelemetryPayload,
  dependencies: TelemetryDependencies = {},
): Promise<string> {
  const event = buildLLMCallCompletedEvent(payload, dependencies);

  try {
    if (dependencies.emit) {
      await dependencies.emit(event);
    }
  } catch {
    // Telemetry failures should never fail the LLM call path.
  }

  return String(event.payload.eventId ?? event.requestId);
}
