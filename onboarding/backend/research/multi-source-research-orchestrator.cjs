'use strict';

const { assessEvidenceSufficiency, buildAdaptiveResearchRoute } = require('./adaptive-research-policy.cjs');
const { createResearchOrchestrationResponse, normalizeProviderAttempt } = require('./research-orchestration-contract.cjs');
const { createInternalEvidenceAdapter } = require('./providers/internal-evidence-adapter.cjs');
const { createTavilyResearchAdapter } = require('./providers/tavily-research-adapter.cjs');
const { createFirecrawlResearchAdapter } = require('./providers/firecrawl-research-adapter.cjs');
const { createOpenAIResearchAdapter } = require('./providers/openai-research-adapter.cjs');
const { mergeEvidenceItems } = require('./evidence-merge-ranker.cjs');
const { detectEvidenceContradictions } = require('./contradiction-reporter.cjs');
const { assembleContextPack } = require('./context-pack-assembler.cjs');

async function buildResearchPack(request = {}, runtime = {}) {
  const adapters = runtime.adapters || {};
  const internalAdapter = adapters.internal || createInternalEvidenceAdapter();
  const tavilyAdapter = adapters.tavily || createTavilyResearchAdapter();
  const firecrawlAdapter = adapters.firecrawl || createFirecrawlResearchAdapter();
  const openaiAdapter = adapters.openai || createOpenAIResearchAdapter();

  const internalResult = await internalAdapter.collect(request, runtime.internal || runtime);
  const sufficiency = assessEvidenceSufficiency({
    internalEvidenceCount: internalResult.evidence.length,
    contradictions: [],
    requiresFreshness: request.requires_freshness === true,
  });

  const route = buildAdaptiveResearchRoute(request, {
    internalEvidenceCount: internalResult.evidence.length,
    evidenceSufficient: sufficiency.sufficient,
  });

  const stageByName = Object.fromEntries(route.stage_plan.map((entry) => [entry.stage, entry]));

  const tavilyResult = await tavilyAdapter.collect({
    ...request,
    routeStage: stageByName.tavily,
  }, runtime.tavily || runtime);

  const firecrawlResult = await firecrawlAdapter.collect({
    ...request,
    routeStage: stageByName.firecrawl,
  }, runtime.firecrawl || runtime);

  const openaiResult = await openaiAdapter.collect({
    ...request,
    routeStage: stageByName.openai_research,
    deepResearch: route.should_use_deep_research,
  }, runtime.openai || runtime);

  const providerAttempts = [
    ...(internalResult.attempts || []),
    normalizeProviderAttempt({
      provider: 'markos_mcp',
      stage: 'markos_mcp',
      status: stageByName.markos_mcp.status,
      reason: stageByName.markos_mcp.reason || null,
    }),
    ...(tavilyResult.attempts || []),
    ...(firecrawlResult.attempts || []),
    ...(openaiResult.attempts || []),
  ];

  const warnings = [
    ...(internalResult.warnings || []),
    ...(tavilyResult.warnings || []),
    ...(firecrawlResult.warnings || []),
    ...(openaiResult.warnings || []),
  ];

  const mergedEvidence = mergeEvidenceItems([
    ...(internalResult.evidence || []),
    ...(tavilyResult.evidence || []),
    ...(firecrawlResult.evidence || []),
    ...(openaiResult.evidence || []),
  ]);

  const contradictions = detectEvidenceContradictions(mergedEvidence);
  const assembled = assembleContextPack({
    request,
    evidence: mergedEvidence,
    contradictions,
    routeTrace: route.stage_plan,
    providerAttempts,
    warnings,
  });

  return createResearchOrchestrationResponse({
    short_summary: assembled.short_summary,
    context_pack: assembled.context_pack,
    warnings: assembled.warnings,
    route_trace: route.stage_plan,
    provider_attempts: providerAttempts,
    degraded: providerAttempts.some((entry) => entry.status === 'degraded'),
  });
}

module.exports = {
  buildResearchPack,
};
