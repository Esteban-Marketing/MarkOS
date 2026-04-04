const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { withMockedModule } = require('../setup.js');

const orchestratorPath = path.resolve(__dirname, '../../onboarding/backend/agents/orchestrator.cjs');
const vectorStorePath = path.resolve(__dirname, '../../onboarding/backend/vector-store-client.cjs');
const telemetryPath = path.resolve(__dirname, '../../onboarding/backend/agents/telemetry.cjs');
const llmPath = path.resolve(__dirname, '../../onboarding/backend/agents/llm-adapter.cjs');
const routerPath = path.resolve(__dirname, '../../onboarding/backend/agents/discipline-router.cjs');

function loadFreshOrchestrator() {
  delete require.cache[require.resolve(orchestratorPath)];
  return require(orchestratorPath);
}

function createSeed() {
  return {
    company: {
      name: 'Acme',
      industry: 'SaaS',
      business_model: 'SaaS',
      brand_values: ['clarity'],
      tone_of_voice: 'Direct',
      mission: 'Help teams move faster',
    },
    product: {
      name: 'MarkOS',
      primary_benefit: 'Automated marketing operations',
      top_features: ['automation'],
    },
    audience: {
      segment_name: 'Marketing operators',
      job_title: 'Growth lead',
      pain_points: ['high acquisition cost'],
      online_hangouts: 'LinkedIn',
    },
    market: {
      maturity: 'Growing',
      biggest_trend: 'AI automation',
    },
    content: {
      active_channels: ['LinkedIn'],
      monthly_output: '4 posts',
    },
  };
}

test('Phase 53: orchestrator forwards provider policy into live backend LLM calls', async () => {
  const llmCalls = [];

  await withMockedModule(llmPath, {
    call: async (_systemPrompt, _userPrompt, options = {}) => {
      llmCalls.push(options);
      return {
        ok: true,
        text: 'draft',
        provider: options.primaryProvider || options.provider || 'openai',
        model: 'gpt-4o-mini',
        usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        providerAttempts: [
          {
            provider: options.primaryProvider || 'openai',
            model: 'gpt-4o-mini',
            attempt_number: 1,
            primary_provider: options.primaryProvider || 'openai',
            outcome_state: 'success',
            latency_ms: 10,
            token_usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
          },
        ],
      };
    },
  }, async () => {
    await withMockedModule(routerPath, {
      rankDisciplines: () => ['Paid_Media', 'Content_SEO', 'Lifecycle_Email'],
    }, async () => {
      await withMockedModule(telemetryPath, {
        capture: () => {},
        captureProviderAttempt: (payload) => payload,
        captureRunClose: (payload) => payload,
      }, async () => {
        await withMockedModule(vectorStorePath, {
          upsertSeed: async () => [],
          storeDraft: async () => ({ ok: true }),
          getLiteracyContext: async () => [],
          getWinningCampaignPatterns: async () => [],
        }, async () => {
          const orchestrator = loadFreshOrchestrator();
          await orchestrator.orchestrate(createSeed(), 'acme', {
            tenant_id: 'tenant-1',
            actor_id: 'operator-1',
            role: 'reviewer',
            request_id: 'req-1',
            correlation_id: 'corr-1',
            prompt_version: 'phase53-v2',
            provider_policy: {
              primary_provider: 'openai',
              allowed_providers: ['openai', 'gemini'],
              allow_fallback: true,
              max_fallback_attempts: 2,
            },
            tool_policy: {
              profile: 'default',
              allow_external_mutations: false,
            },
          });
        });
      });
    });
  });

  assert.ok(llmCalls.length >= 6);
  for (const options of llmCalls) {
    assert.equal(options.primaryProvider, 'openai');
    assert.deepEqual(options.allowedProviders, ['gemini']);
    assert.equal(options.max_fallback_attempts, 2);
    assert.equal(options.no_fallback, false);
    assert.equal(options.request_id, 'req-1');
  }
});
