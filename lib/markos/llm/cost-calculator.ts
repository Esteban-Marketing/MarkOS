import { getDefaultCostRates } from "./provider-registry";
import type { CostMetrics, ProviderName } from "./types";

type CostRate = {
  input: number;
  output: number;
};

type CostRateOverrides = Partial<Record<ProviderName, CostRate>>;

type CallCostEvent = {
  provider: ProviderName;
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
};

export function calculateCostUsd(
  provider: ProviderName,
  metrics: Pick<CostMetrics, "inputTokens" | "outputTokens">,
  overrides?: CostRateOverrides,
): number {
  const rates = overrides?.[provider] ?? getDefaultCostRates(provider);
  const input = Math.max(0, Number(metrics.inputTokens || 0));
  const output = Math.max(0, Number(metrics.outputTokens || 0));

  const cost = (input * rates.input) / 1_000_000 + (output * rates.output) / 1_000_000;
  return Number(cost.toFixed(6));
}

export function aggregateCostByProvider(events: CallCostEvent[]): Record<ProviderName, {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}> {
  const initial = {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
  };

  const aggregate: Record<ProviderName, typeof initial> = {
    anthropic: { ...initial },
    openai: { ...initial },
    gemini: { ...initial },
  };

  for (const event of events) {
    const bucket = aggregate[event.provider];
    bucket.calls += 1;
    bucket.inputTokens += Math.max(0, Number(event.inputTokens || 0));
    bucket.outputTokens += Math.max(0, Number(event.outputTokens || 0));
    bucket.totalTokens += Math.max(0, Number(event.totalTokens || event.inputTokens + event.outputTokens || 0));

    const estimated =
      typeof event.estimatedCostUsd === "number"
        ? event.estimatedCostUsd
        : calculateCostUsd(event.provider, {
            inputTokens: event.inputTokens,
            outputTokens: event.outputTokens,
          });

    bucket.estimatedCostUsd = Number((bucket.estimatedCostUsd + estimated).toFixed(6));
  }

  return aggregate;
}

export function calculateMonthlyBudgetUsage(
  events: CallCostEvent[],
  budgetUsd: number,
): {
  budgetUsd: number;
  usedUsd: number;
  remainingUsd: number;
  percentUsed: number;
  byProvider: ReturnType<typeof aggregateCostByProvider>;
} {
  const byProvider = aggregateCostByProvider(events);
  const usedUsd = Number(
    (byProvider.anthropic.estimatedCostUsd + byProvider.openai.estimatedCostUsd + byProvider.gemini.estimatedCostUsd).toFixed(6),
  );
  const safeBudget = Math.max(0, Number(budgetUsd || 0));
  const remainingUsd = Number(Math.max(0, safeBudget - usedUsd).toFixed(6));
  const percentUsed = safeBudget > 0 ? Number(((usedUsd / safeBudget) * 100).toFixed(2)) : 0;

  return {
    budgetUsd: safeBudget,
    usedUsd,
    remainingUsd,
    percentUsed,
    byProvider,
  };
}
