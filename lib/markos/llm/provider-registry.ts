import type { ProviderConfig, ProviderName } from "./types";

export const PROVIDER_REGISTRY: Record<ProviderName, ProviderConfig> = {
  anthropic: {
    models: ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"],
    defaultModel: "claude-3-5-haiku-20241022",
    costRates: {
      input: 0.8,
      output: 4,
    },
  },
  openai: {
    models: ["gpt-4o-mini", "gpt-4o"],
    defaultModel: "gpt-4o-mini",
    costRates: {
      input: 0.15,
      output: 0.6,
    },
  },
  gemini: {
    models: ["gemini-2.5-flash", "gemini-pro"],
    defaultModel: "gemini-2.5-flash",
    costRates: {
      input: 0.075,
      output: 0.3,
    },
  },
};

export function getDefaultModel(provider: ProviderName): string {
  return PROVIDER_REGISTRY[provider].defaultModel;
}

export function getDefaultCostRates(provider: ProviderName): ProviderConfig["costRates"] {
  return PROVIDER_REGISTRY[provider].costRates;
}

export function isSupportedModel(provider: ProviderName, model: string): boolean {
  return PROVIDER_REGISTRY[provider].models.includes(model);
}