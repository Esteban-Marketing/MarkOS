import Anthropic from "@anthropic-ai/sdk";
import { getDefaultModel } from "../provider-registry";
import type { LLMCallOptions, LLMCallResult } from "../types";
import { buildErrorResult, getTimeoutMs, mapProviderError, withTimeout } from "./shared";

type ClaudeClient = {
  messages: {
    create(request: unknown): Promise<{
      content?: Array<{ type?: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    }>;
  };
};

type ClaudeRuntime = {
  client?: ClaudeClient;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
};

function getClient(apiKey: string): ClaudeClient {
  return new Anthropic({ apiKey }) as unknown as ClaudeClient;
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {},
  runtime: ClaudeRuntime = {},
): Promise<LLMCallResult> {
  const now = runtime.now ?? Date.now;
  const startedAt = now();
  const env = runtime.env ?? process.env;
  const apiKey = env.ANTHROPIC_API_KEY;
  const model = options.model ?? getDefaultModel("anthropic");

  if (!apiKey && !runtime.client) {
    return buildErrorResult(
      "anthropic",
      model,
      { code: "AUTH_ERROR", message: "Missing ANTHROPIC_API_KEY" },
      now() - startedAt,
    );
  }

  try {
    const client = runtime.client ?? getClient(apiKey ?? "");
    const response = await withTimeout(
      client.messages.create({
        model,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
      getTimeoutMs(options),
    );

    const text =
      response.content
        ?.filter((item) => item.type === "text" || typeof item.text === "string")
        .map((item) => item.text ?? "")
        .join("\n") ?? "";

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    const latencyMs = now() - startedAt;

    return {
      ok: true,
      text,
      provider: "anthropic",
      model,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      latencyMs,
      telemetryEventId: "pending-wave-3",
    };
  } catch (error) {
    return buildErrorResult("anthropic", model, mapProviderError(error), now() - startedAt);
  }
}
