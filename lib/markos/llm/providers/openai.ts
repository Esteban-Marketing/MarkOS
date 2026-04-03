import OpenAI from "openai";
import { getDefaultModel } from "../provider-registry";
import type { LLMCallOptions, LLMCallResult } from "../types";
import { buildErrorResult, getTimeoutMs, mapProviderError, withTimeout } from "./shared";

type OpenAIClient = {
  chat: {
    completions: {
      create(request: {
        model: string;
        messages: Array<{ role: "system" | "user"; content: string }>;
        max_tokens?: number;
        temperature?: number;
      }): Promise<{
        choices?: Array<{ message?: { content?: string | null } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      }>;
    };
  };
};

type OpenAIRuntime = {
  client?: OpenAIClient;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
};

function getClient(apiKey: string): OpenAIClient {
  return new OpenAI({ apiKey });
}

export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {},
  runtime: OpenAIRuntime = {},
): Promise<LLMCallResult> {
  const now = runtime.now ?? Date.now;
  const startedAt = now();
  const env = runtime.env ?? process.env;
  const apiKey = env.OPENAI_API_KEY;
  const model = options.model ?? getDefaultModel("openai");

  if (!apiKey && !runtime.client) {
    return buildErrorResult(
      "openai",
      model,
      { code: "AUTH_ERROR", message: "Missing OPENAI_API_KEY" },
      now() - startedAt,
    );
  }

  try {
    const client = runtime.client ?? getClient(apiKey as string);
    const response = await withTimeout(
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
      getTimeoutMs(options),
    );

    const text = response.choices?.[0]?.message?.content ?? "";
    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const latencyMs = now() - startedAt;

    return {
      ok: true,
      text,
      provider: "openai",
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
    return buildErrorResult("openai", model, mapProviderError(error), now() - startedAt);
  }
}
