const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { withMockedModule } = require('./setup.js');

const orchestratorPath = path.resolve(__dirname, '../onboarding/backend/agents/orchestrator.cjs');
const mirFillerPath = path.resolve(__dirname, '../onboarding/backend/agents/mir-filler.cjs');
const mspFillerPath = path.resolve(__dirname, '../onboarding/backend/agents/msp-filler.cjs');
const vectorStorePath = path.resolve(__dirname, '../onboarding/backend/vector-store-client.cjs');
const telemetryPath = path.resolve(__dirname, '../onboarding/backend/agents/telemetry.cjs');
const llmPath = path.resolve(__dirname, '../onboarding/backend/agents/llm-adapter.cjs');
const routerPath = path.resolve(__dirname, '../onboarding/backend/agents/discipline-router.cjs');
const configPath = path.resolve(__dirname, '../.planning/config.json');

function loadFreshOrchestrator() {
  delete require.cache[require.resolve(orchestratorPath)];
  return require(orchestratorPath);
}

function createSeed() {
  return {
    company: { business_model: 'SaaS' },
    product: { name: 'MarkOS' },
    audience: {
      segment_name: 'Marketing teams',
      pain_points: ['high acquisition cost', 'low conversions'],
    },
    content: { active_channels: ['Google Ads', 'Email', 'LinkedIn'] },
  };
}

function createFillerMocks() {
  return {
    mir: {
      generateCompanyProfile: async () => ({ ok: true, text: 'company' }),
      generateMissionVisionValues: async () => ({ ok: true, text: 'mission' }),
      generateAudienceProfile: async () => ({ ok: true, text: 'audience' }),
      generateCompetitiveLandscape: async () => ({ ok: true, text: 'competitive' }),
    },
    msp: {
      generateBrandVoice: async () => ({ ok: true, text: 'voice' }),
      generateChannelStrategy: async () => ({ ok: true, text: 'channel' }),
    },
  };
}

async function withOrchestratorHarness(options, runAssertions) {
  const calls = [];
  const telemetryEvents = [];
  const fillers = createFillerMocks();

  const vectorStoreMock = {
    configure: () => {},
    upsertSeed: async () => [],
    storeDraft: async () => ({ ok: true }),
    getLiteracyContext: async (discipline, query, filters) => {
      calls.push({ discipline, query, filters });
      return options.getHits({ discipline, query, filters, callsCount: calls.length });
    },
  };

  await withMockedModule(mirFillerPath, fillers.mir, async () => {
    await withMockedModule(mspFillerPath, fillers.msp, async () => {
      await withMockedModule(llmPath, { call: async () => ({ ok: true, text: 'ok' }) }, async () => {
        await withMockedModule(routerPath, {
          rankDisciplines: () => ['Paid_Media', 'Content_SEO', 'Lifecycle_Email', 'Social'],
        }, async () => {
          await withMockedModule(telemetryPath, {
            capture: (eventName, properties) => telemetryEvents.push({ eventName, properties }),
            captureProviderAttempt: (properties) => properties,
            captureRunClose: (properties) => properties,
          }, async () => {
            await withMockedModule(vectorStorePath, vectorStoreMock, async () => {
              if (options.configOverride) {
                await withMockedModule(configPath, options.configOverride, async () => {
                  const orchestrator = loadFreshOrchestrator();
                  const result = await orchestrator.orchestrate(createSeed(), 'acme-slug');
                  await runAssertions({ result, calls, telemetryEvents });
                });
              } else {
                const orchestrator = loadFreshOrchestrator();
                const result = await orchestrator.orchestrate(createSeed(), 'acme-slug');
                await runAssertions({ result, calls, telemetryEvents });
              }
            });
          });
        });
      });
    });
  });
}

test('orchestrate queries top three ranked disciplines with dual-query merge and doc_id dedupe', async () => {
  await withOrchestratorHarness(
    {
      getHits: ({ discipline, filters }) => {
        const isFiltered = Boolean(filters && Object.prototype.hasOwnProperty.call(filters, 'business_model'));
        if (discipline === 'Paid_Media') {
          return isFiltered
            ? [{ id: 'pm-f-1', text: 'doc1 filtered', metadata: { doc_id: 'DOC-001', pain_point_tags: ['high_acquisition_cost'] }, score: 0.4 }]
            : [{ id: 'pm-u-1', text: 'doc1 universal', metadata: { doc_id: 'DOC-001', pain_point_tags: ['high_acquisition_cost'] }, score: 0.9 }];
        }
        if (discipline === 'Content_SEO') {
          return [{ id: 'seo-1', text: 'doc2 seo', metadata: { doc_id: 'DOC-002', pain_point_tags: ['low_conversions'] }, score: 0.8 }];
        }
        return [{ id: 'life-1', text: 'doc3 email', metadata: { doc_id: 'DOC-003' }, score: 0.7 }];
      },
    },
    async ({ result, calls, telemetryEvents }) => {
      assert.equal(calls.length, 6);
      assert.ok(calls.some((entry) => entry.discipline === 'Paid_Media' && entry.filters && entry.filters.business_model === 'SaaS'));
      assert.ok(calls.some((entry) => entry.discipline === 'Paid_Media' && entry.filters && !Object.prototype.hasOwnProperty.call(entry.filters, 'business_model')));
      assert.ok(calls.some((entry) => entry.discipline === 'Content_SEO' && entry.filters && entry.filters.business_model === 'SaaS'));
      assert.ok(calls.some((entry) => entry.discipline === 'Content_SEO' && entry.filters && !Object.prototype.hasOwnProperty.call(entry.filters, 'business_model')));
      assert.ok(calls.some((entry) => entry.discipline === 'Lifecycle_Email' && entry.filters && entry.filters.business_model === 'SaaS'));
      assert.ok(calls.some((entry) => entry.discipline === 'Lifecycle_Email' && entry.filters && !Object.prototype.hasOwnProperty.call(entry.filters, 'business_model')));

      assert.equal(typeof result.drafts.standards_context, 'string');
      assert.ok(result.drafts.standards_context.includes('doc1 universal'));
      assert.equal(result.drafts.standards_context.includes('doc1 filtered'), false);

      const telemetryEvent = telemetryEvents.find((entry) => entry.eventName === 'literacy_retrieval_observed');
      assert.ok(telemetryEvent);
      assert.ok(Array.isArray(telemetryEvent.properties.disciplines_queried));
      assert.ok(Object.prototype.hasOwnProperty.call(telemetryEvent.properties, 'total_hits'));
      assert.ok(Object.prototype.hasOwnProperty.call(telemetryEvent.properties, 'pain_point_match_count'));
      assert.ok(Object.prototype.hasOwnProperty.call(telemetryEvent.properties, 'context_tokens'));
    }
  );
});

test('orchestrate caps standards_context by literacy.max_context_chunks with default 6', async () => {
  await withOrchestratorHarness(
    {
      getHits: ({ discipline, callsCount }) => {
        return [
          { id: `${discipline}-${callsCount}-a`, text: `${discipline}-chunk-a-${callsCount}`, metadata: { doc_id: `${discipline}-A-${callsCount}` }, score: 0.9 },
          { id: `${discipline}-${callsCount}-b`, text: `${discipline}-chunk-b-${callsCount}`, metadata: { doc_id: `${discipline}-B-${callsCount}` }, score: 0.8 },
        ];
      },
    },
    async ({ result }) => {
      const chunks = result.drafts.standards_context.split('\n\n');
      assert.equal(chunks.length, 6);
    }
  );

  await withOrchestratorHarness(
    {
      configOverride: { literacy: { max_context_chunks: 4 } },
      getHits: ({ discipline, callsCount }) => {
        return [
          { id: `${discipline}-${callsCount}-x`, text: `${discipline}-chunk-x-${callsCount}`, metadata: { doc_id: `${discipline}-X-${callsCount}` }, score: 0.95 },
          { id: `${discipline}-${callsCount}-y`, text: `${discipline}-chunk-y-${callsCount}`, metadata: { doc_id: `${discipline}-Y-${callsCount}` }, score: 0.85 },
        ];
      },
    },
    async ({ result }) => {
      const chunks = result.drafts.standards_context.split('\n\n');
      assert.equal(chunks.length, 4);
    }
  );
});

test('orchestrate leaves standards_context empty when literacy retrieval returns zero hits', async () => {
  await withOrchestratorHarness(
    {
      getHits: () => [],
    },
    async ({ result, telemetryEvents }) => {
      assert.equal(result.drafts.standards_context, undefined);

      const telemetryEvent = telemetryEvents.find((entry) => entry.eventName === 'literacy_retrieval_observed');
      assert.ok(telemetryEvent);
      assert.equal(telemetryEvent.properties.total_hits, 0);
      assert.equal(telemetryEvent.properties.pain_point_match_count, 0);
      assert.equal(telemetryEvent.properties.context_tokens, 0);
    }
  );
});