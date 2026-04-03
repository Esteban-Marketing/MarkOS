import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDefaultModel } from "../provider-registry";
import type { LLMCallOptions, LLMCallResult } from "../types";
import { buildErrorResult, getTimeoutMs, mapProviderError, withTimeout } from "./shared";

type GeminiModel = {
  generateContent(prompt: string): Promise<{
    response?: {
      text?: () => string;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
  }>;
};

type GeminiClient = {
  getGenerativeModel(request: {
    model: string;
    systemInstruction?: string;
    generationConfig?: { temperature?: number; maxOutputTokens?: number };
  }): GeminiModel;
};

type GeminiRuntime = {
  client?: GeminiClient;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
};

function getClient(apiKey: string): GeminiClient {
  return new GoogleGenerativeAI(apiKey);
}

export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {},
  runtime: GeminiRuntime = {},
): Promise<LLMCallResult> {
  const now = runtime.now ?? Date.now;
  const startedAt = now();
  const env = runtime.env ?? process.env;
  const apiKey = env.GEMINI_API_KEY;
  const model = options.model ?? getDefaultModel("gemini");

  if (!apiKey && !runtime.client) {
    return buildErrorResult(
      "gemini",
      model,
      { code: "AUTH_ERROR", message: "Missing GEMINI_API_KEY" },
      now() - startedAt,
    );
  }

  try {
    const client = runtime.client ?? getClient(apiKey as string);
    const geminiModel = client.getGenerativeModel({
      model,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    });

    const result = await withTimeout(geminiModel.generateContent(userPrompt), getTimeoutMs(options));
    const text = result.response?.text?.() ?? "";
    const inputTokens = result.response?.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = result.response?.usageMetadata?.candidatesTokenCount ?? 0;
    const latencyMs = now() - startedAt;

    return {
      ok: true,
      text,
      provider: "gemini",
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
    return buildErrorResult("gemini", model, mapProviderError(error), now() - startedAt);
  }
}
