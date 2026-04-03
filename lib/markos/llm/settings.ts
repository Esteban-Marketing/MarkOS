import { isProviderName, type FallbackTemplate, type ProviderName } from "./types";

export type OperatorLLMSettings = {
  operatorId?: string;
  workspaceId?: string;
  availableProviders: ProviderName[];
  primaryProvider: ProviderName;
  costBudgetMonthlyUsd: number;
  allowFallback: boolean;
  fallbackTemplate: FallbackTemplate;
};

type SettingsRecord = Record<string, unknown>;

type SupabaseLikeClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: SettingsRecord | null; error: { message: string } | null }>;
      };
    };
  };
};

type LoadSettingsDependencies = {
  client?: SupabaseLikeClient | null;
  env?: NodeJS.ProcessEnv;
  workspaceId?: string;
};

const FALLBACK_TEMPLATES: FallbackTemplate[] = ["cost_optimized", "speed_optimized", "reliability_optimized"];

export const DEFAULT_OPERATOR_LLM_SETTINGS: OperatorLLMSettings = {
  availableProviders: ["anthropic", "openai", "gemini"],
  primaryProvider: "anthropic",
  costBudgetMonthlyUsd: 100,
  allowFallback: true,
  fallbackTemplate: "cost_optimized",
};

function isFallbackTemplate(value: unknown): value is FallbackTemplate {
  return typeof value === "string" && FALLBACK_TEMPLATES.includes(value as FallbackTemplate);
}

function parseProviderList(value: unknown): ProviderName[] {
  if (!Array.isArray(value)) {
    throw new Error("INVALID_CONFIG: availableProviders must be an array");
  }

  const providers = value.filter(isProviderName);
  if (providers.length === 0) {
    throw new Error("INVALID_CONFIG: at least one provider must be configured");
  }

  return [...new Set(providers)];
}

function parseBudget(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("INVALID_CONFIG: costBudgetMonthlyUsd must be a non-negative number");
  }

  return numeric;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function mapStoredSettings(record: SettingsRecord, fallback: OperatorLLMSettings): OperatorLLMSettings {
  const availableProviders = parseProviderList(
    record.availableProviders ?? record.available_providers ?? fallback.availableProviders,
  );
  const primaryProvider = record.primaryProvider ?? record.primary_provider ?? fallback.primaryProvider;

  if (!isProviderName(primaryProvider) || !availableProviders.includes(primaryProvider)) {
    throw new Error("INVALID_CONFIG: primaryProvider must be present in availableProviders");
  }

  const fallbackTemplate = record.fallbackTemplate ?? record.fallback_template ?? fallback.fallbackTemplate;

  if (!isFallbackTemplate(fallbackTemplate)) {
    throw new Error("INVALID_CONFIG: unsupported fallback template");
  }

  return {
    operatorId: typeof record.operatorId === "string" ? record.operatorId : typeof record.operator_id === "string" ? record.operator_id : undefined,
    workspaceId:
      typeof record.workspaceId === "string"
        ? record.workspaceId
        : typeof record.workspace_id === "string"
          ? record.workspace_id
          : undefined,
    availableProviders,
    primaryProvider,
    costBudgetMonthlyUsd: parseBudget(
      record.costBudgetMonthlyUsd ?? record.cost_budget_monthly_usd ?? fallback.costBudgetMonthlyUsd,
    ),
    allowFallback: parseBoolean(record.allowFallback ?? record.allow_fallback, fallback.allowFallback),
    fallbackTemplate,
  };
}

function parseEnvProviderList(env: NodeJS.ProcessEnv): ProviderName[] | null {
  const raw = env.MARKOS_LLM_AVAILABLE_PROVIDERS;
  if (!raw) {
    return null;
  }

  const providers = raw
    .split(",")
    .map((value) => value.trim())
    .filter(isProviderName);

  return providers.length > 0 ? [...new Set(providers)] : null;
}

export function validateSettings(value: unknown): OperatorLLMSettings {
  if (!value || typeof value !== "object") {
    throw new Error("INVALID_CONFIG: settings payload must be an object");
  }

  return mapStoredSettings(value as SettingsRecord, DEFAULT_OPERATOR_LLM_SETTINGS);
}

export async function loadOperatorSettings(
  operatorId: string,
  dependencies: LoadSettingsDependencies = {},
): Promise<OperatorLLMSettings> {
  const env = dependencies.env ?? process.env;
  const defaults: OperatorLLMSettings = {
    ...DEFAULT_OPERATOR_LLM_SETTINGS,
    operatorId,
    workspaceId: dependencies.workspaceId,
  };

  if (dependencies.client) {
    const { data, error } = await dependencies.client
      .from("markos_operator_llm_preferences")
      .select("*")
      .eq("operator_id", operatorId)
      .maybeSingle();

    if (error) {
      throw new Error(`SETTINGS_LOAD_FAILED: ${error.message}`);
    }

    if (data) {
      return mapStoredSettings(data, defaults);
    }
  }

  const availableProviders = parseEnvProviderList(env) ?? defaults.availableProviders;
  const primaryProvider = env.MARKOS_LLM_PRIMARY_PROVIDER;
  const fallbackTemplate = env.MARKOS_LLM_FALLBACK_TEMPLATE;

  return validateSettings({
    operatorId,
    workspaceId: dependencies.workspaceId,
    availableProviders,
    primaryProvider: isProviderName(primaryProvider) ? primaryProvider : availableProviders[0],
    costBudgetMonthlyUsd: env.MARKOS_LLM_MONTHLY_BUDGET ?? defaults.costBudgetMonthlyUsd,
    allowFallback: env.MARKOS_LLM_ALLOW_FALLBACK ?? defaults.allowFallback,
    fallbackTemplate: isFallbackTemplate(fallbackTemplate) ? fallbackTemplate : defaults.fallbackTemplate,
  });
}