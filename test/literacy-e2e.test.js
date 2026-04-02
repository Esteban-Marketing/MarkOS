const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestEnvironment, withMockedModule } = require('./setup');

const FIXTURE_ROOT = path.join(__dirname, 'fixtures', 'literacy');
const PHASE44_FIXTURE_FILES = [
  path.join(FIXTURE_ROOT, 'paid_media', 'pm-attribution-baseline.md'),
  path.join(FIXTURE_ROOT, 'content_seo', 'seo-visibility-baseline.md'),
  path.join(FIXTURE_ROOT, 'lifecycle_email', 'email-retention-baseline.md'),
];

function parseFixtureFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(frontmatterMatch, `fixture missing frontmatter: ${filePath}`);
  const frontmatter = frontmatterMatch[1];

  const disciplineMatch = frontmatter.match(/^discipline:\s*(.+)$/m);
  const docIdMatch = frontmatter.match(/^doc_id:\s*(.+)$/m);
  const lastUpdatedMatch = frontmatter.match(/^last_updated:\s*(.+)$/m);

  const businessModels = [];
  const painPointTags = [];
  let activeList = null;
  for (const line of frontmatter.split(/\r?\n/)) {
    if (/^business_model:\s*$/.test(line)) {
      activeList = businessModels;
      continue;
    }
    if (/^pain_point_tags:\s*$/.test(line)) {
      activeList = painPointTags;
      continue;
    }
    const listMatch = line.match(/^\s*-\s*(.+)$/);
    if (listMatch && activeList) {
      activeList.push(listMatch[1].trim());
      continue;
    }
    activeList = null;
  }

  return {
    discipline: disciplineMatch ? disciplineMatch[1].trim() : '',
    doc_id: docIdMatch ? docIdMatch[1].trim() : '',
    last_updated: lastUpdatedMatch ? lastUpdatedMatch[1].trim() : '',
    business_models: businessModels,
    pain_point_tags: painPointTags,
  };
}

function loadFixtureCorpus() {
  return PHASE44_FIXTURE_FILES.map((filePath) => {
    assert.ok(fs.existsSync(filePath), `missing required fixture: ${filePath}`);
    return parseFixtureFrontmatter(filePath);
  });
}

function createPhase44ValidSeed(overrides = {}) {
  const base = {
    company: { name: 'Phase44 Corp', stage: 'pre-launch' },
    product: { name: 'Phase44 Product', category: 'Software' },
    audience: {
      segment_name: 'Growth leaders',
      pain_points: ['attribution_measurement', 'poor_retention_churn'],
    },
    market: {
      competitors: [
        { name: 'Comp A', positioning: 'Enterprise' },
        { name: 'Comp B', positioning: 'SMB' },
      ],
      market_trends: ['AI attribution'],
    },
    content: { content_maturity: 'basic' },
  };

  return {
    ...base,
    ...overrides,
    company: { ...base.company, ...(overrides.company || {}) },
    product: { ...base.product, ...(overrides.product || {}) },
    audience: { ...base.audience, ...(overrides.audience || {}) },
    market: { ...base.market, ...(overrides.market || {}) },
    content: { ...base.content, ...(overrides.content || {}) },
  };
}

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function createMockResponse() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    writeHead(code, headers = {}) {
      this.statusCode = code;
      this.headers = headers;
    },
    end(payload = '') {
      this.body = payload;
    },
  };
}

function getFixtureDisciplineSet(fixtures) {
  return [...new Set(fixtures.map((doc) => doc.discipline))].sort();
}

function assertNoZeroHitRegression(disciplines, expectedDisciplines) {
  const missing = [];

  for (const discipline of expectedDisciplines) {
    const entry = disciplines && disciplines[discipline];
    if (!entry || Number(entry.doc_count || 0) === 0 || Number(entry.chunk_count || 0) === 0) {
      missing.push(discipline);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `LIT-18 regression: populated corpus produced zero retrieval hits for disciplines: ${missing.join(', ')}. ` +
      'Expected fixture-backed coverage from test/fixtures/literacy/.'
    );
  }
}

test('Phase 44 literacy e2e contracts (Wave 0 stubs)', async (t) => {
  const fixtures = loadFixtureCorpus();

  await t.test('[44-01-03] fixture corpus includes deterministic docs for 3 disciplines', () => {
    assert.ok(fixtures.length >= 3, 'expected at least 3 literacy fixtures');
    const disciplines = new Set(fixtures.map((doc) => doc.discipline));
    assert.ok(disciplines.has('Paid_Media'));
    assert.ok(disciplines.has('Content_SEO'));
    assert.ok(disciplines.has('Lifecycle_Email'));
    for (const doc of fixtures) {
      assert.ok(doc.doc_id.length > 0);
      assert.ok(doc.last_updated.length > 0);
      assert.ok(doc.business_models.length > 0);
      assert.ok(doc.pain_point_tags.length > 0);
    }
  });

  await t.test('[44-01-01 LIT-16] lifecycle contract: ingest -> submit -> orchestrate -> standards_context', async () => {
    const env = createTestEnvironment();
    env.seedOnboarding();

    try {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
      const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
      const indexedByDiscipline = new Map(fixtures.map((doc) => [doc.discipline, doc]));

      await withMockedModule(vectorStorePath, {
        configure: () => {},
        healthCheck: async () => ({ ok: true, mode: 'cloud', status: 'providers_ready' }),
        getLiteracyContext: async (discipline) => {
          const fixture = indexedByDiscipline.get(discipline);
          if (!fixture) return [];
          return [{
            id: fixture.doc_id,
            text: `fixture for ${discipline}`,
            metadata: {
              discipline,
              pain_point_tags: fixture.pain_point_tags,
              business_model: fixture.business_models,
            },
            score: 0.91,
          }];
        },
      }, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({
            drafts: {
              standards_context: [
                `${fixtures[0].doc_id}:${fixtures[0].pain_point_tags.join(',')}`,
                `${fixtures[1].doc_id}:${fixtures[1].pain_point_tags.join(',')}`,
                `${fixtures[2].doc_id}:${fixtures[2].pain_point_tags.join(',')}`,
              ].join('\n'),
              company_profile: 'ok',
            },
            vectorStoreResults: [{ ok: true, section: 'standards_context' }],
            errors: [],
          }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const res = createMockResponse();
          await handlers.handleSubmit(
            {
              method: 'POST',
              url: '/submit',
              headers: { 'content-type': 'application/json' },
              body: createPhase44ValidSeed(),
            },
            res
          );

          assert.equal(res.statusCode, 200);
          const payload = JSON.parse(res.body);
          assert.equal(payload.success, true);
          assert.ok(['ready', 'partial', 'unconfigured'].includes(payload.literacy.readiness));
          assert.ok(Array.isArray(payload.literacy.gaps));
          assert.equal(typeof payload.drafts.standards_context, 'string');
          assert.ok(payload.drafts.standards_context.includes('pm-attribution-baseline'));
          assert.ok(payload.drafts.standards_context.includes('seo-visibility-baseline'));
          assert.ok(payload.drafts.standards_context.includes('email-retention-baseline'));
          assert.ok(payload.drafts.standards_context.includes('attribution_measurement'));
          assert.ok(payload.drafts.standards_context.includes('poor_retention_churn'));
        });
      });
    } finally {
      env.cleanup();
    }
  });

  await t.test('[44-01-02 LIT-17] coverage contract: GET /api/literacy/coverage returns shape and unconfigured branch', async () => {
    const env = createTestEnvironment();
    env.seedOnboarding();

    try {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
      const wrapperPath = path.join(env.dir, 'api', 'literacy', 'coverage.js');
      const runtimeContextPath = path.join(env.dir, 'onboarding', 'backend', 'runtime-context.cjs');

      const configuredCoverage = {
        ok: true,
        status: 'providers_ready',
        disciplines: {
          Paid_Media: {
            doc_count: 1,
            chunk_count: 2,
            last_updated: '2026-04-02T00:00:00.000Z',
            business_models: ['SaaS'],
          },
          Content_SEO: {
            doc_count: 1,
            chunk_count: 1,
            last_updated: '2026-04-02T00:00:00.000Z',
            business_models: ['B2B', 'SaaS'],
          },
          Lifecycle_Email: {
            doc_count: 1,
            chunk_count: 1,
            last_updated: '2026-04-02T00:00:00.000Z',
            business_models: ['SaaS'],
          },
        },
        providers: {
          supabase: { configured: true, ok: true },
          upstash_vector: { configured: true, ok: true },
        },
      };

      const unconfiguredCoverage = {
        ok: false,
        status: 'providers_unconfigured',
        disciplines: {
          Paid_Media: { doc_count: 0, chunk_count: 0, last_updated: null, business_models: [] },
          Content_SEO: { doc_count: 0, chunk_count: 0, last_updated: null, business_models: [] },
          Lifecycle_Email: { doc_count: 0, chunk_count: 0, last_updated: null, business_models: [] },
          Social: { doc_count: 0, chunk_count: 0, last_updated: null, business_models: [] },
          Landing_Pages: { doc_count: 0, chunk_count: 0, last_updated: null, business_models: [] },
        },
        providers: {
          supabase: { configured: false, ok: false },
          upstash_vector: { configured: false, ok: false },
        },
      };

      await withMockedModule(vectorStorePath, {
        configure: () => {},
        getLiteracyCoverageSummary: async () => configuredCoverage,
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const res = createMockResponse();
        await handlers.handleLiteracyCoverage({ method: 'GET', url: '/api/literacy/coverage' }, res);

        assert.equal(res.statusCode, 200);
        const payload = JSON.parse(res.body);
        assert.equal(payload.success, true);
        assert.equal(payload.status, 'providers_ready');
        assert.equal(payload.disciplines.Paid_Media.doc_count, 1);
        assert.equal(payload.disciplines.Paid_Media.chunk_count, 2);
        assert.ok(Array.isArray(payload.disciplines.Paid_Media.business_models));
        assert.equal(Object.prototype.hasOwnProperty.call(payload.disciplines.Paid_Media, 'text'), false, 'coverage payload must not include raw corpus text');
      });

      await withMockedModule(vectorStorePath, {
        configure: () => {},
        getLiteracyCoverageSummary: async () => unconfiguredCoverage,
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const res = createMockResponse();
        await handlers.handleLiteracyCoverage({ method: 'GET', url: '/api/literacy/coverage' }, res);
        assert.equal(res.statusCode, 200);
        const payload = JSON.parse(res.body);
        assert.equal(payload.status, 'providers_unconfigured');
        assert.equal(payload.disciplines.Paid_Media.doc_count, 0);
      });

      await withMockedModule(runtimeContextPath, {
        createRuntimeContext: () => ({ mode: 'hosted', config: {} }),
        requireHostedSupabaseAuth: () => ({ ok: true, principal: { type: 'service-role', id: 'svc' } }),
        resolveRequestedProjectSlugFromRequest: () => 'phase44-hosted',
      }, async () => {
        await withMockedModule(vectorStorePath, {
          configure: () => {},
          getLiteracyCoverageSummary: async () => configuredCoverage,
        }, async () => {
          const wrapper = loadFreshModule(wrapperPath);
          const res = createMockResponse();
          await wrapper({ method: 'GET', url: '/api/literacy/coverage?project_slug=phase44-hosted', headers: {} }, res);
          assert.equal(res.statusCode, 200);
          const payload = JSON.parse(res.body);
          assert.equal(payload.disciplines.Content_SEO.doc_count, 1);
        });
      });
    } finally {
      env.cleanup();
    }
  });

  await t.test('[44-02-03 LIT-17] vector coverage helper returns deterministic unconfigured structure', async () => {
    const vectorStore = loadFreshModule(path.join(__dirname, '..', 'onboarding', 'backend', 'vector-store-client.cjs'));
    vectorStore.configure({});

    const previous = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
      UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
    };

    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.UPSTASH_VECTOR_REST_URL;
    delete process.env.UPSTASH_VECTOR_REST_TOKEN;

    try {
      const summary = await vectorStore.getLiteracyCoverageSummary();
      assert.equal(summary.ok, false);
      assert.equal(summary.status, 'providers_unconfigured');
      assert.ok(summary.disciplines.Paid_Media);
      assert.equal(summary.disciplines.Paid_Media.doc_count, 0);
      assert.equal(summary.disciplines.Paid_Media.chunk_count, 0);
      assert.equal(summary.disciplines.Paid_Media.last_updated, null);
      assert.deepEqual(summary.disciplines.Paid_Media.business_models, []);
    } finally {
      if (previous.SUPABASE_URL === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = previous.SUPABASE_URL;

      if (previous.SUPABASE_SERVICE_ROLE_KEY === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.SUPABASE_SERVICE_ROLE_KEY;

      if (previous.UPSTASH_VECTOR_REST_URL === undefined) delete process.env.UPSTASH_VECTOR_REST_URL;
      else process.env.UPSTASH_VECTOR_REST_URL = previous.UPSTASH_VECTOR_REST_URL;

      if (previous.UPSTASH_VECTOR_REST_TOKEN === undefined) delete process.env.UPSTASH_VECTOR_REST_TOKEN;
      else process.env.UPSTASH_VECTOR_REST_TOKEN = previous.UPSTASH_VECTOR_REST_TOKEN;
    }
  });

  await t.test('[44-03-03 LIT-17] coverage endpoint reflects fixture corpus counts for ingested disciplines', async () => {
    const env = createTestEnvironment();
    env.seedOnboarding();

    try {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');

      const expectedByDiscipline = {};
      for (const doc of fixtures) {
        expectedByDiscipline[doc.discipline] = {
          doc_count: 1,
          chunk_count: 1,
          last_updated: `${doc.last_updated}T00:00:00.000Z`,
          business_models: [...doc.business_models],
        };
      }

      await withMockedModule(vectorStorePath, {
        configure: () => {},
        getLiteracyCoverageSummary: async () => ({
          ok: true,
          status: 'providers_ready',
          disciplines: expectedByDiscipline,
          providers: {
            supabase: { configured: true, ok: true },
            upstash_vector: { configured: true, ok: true },
          },
        }),
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const res = createMockResponse();
        await handlers.handleLiteracyCoverage({ method: 'GET', url: '/api/literacy/coverage' }, res);
        assert.equal(res.statusCode, 200);
        const payload = JSON.parse(res.body);
        assert.equal(payload.success, true);
        assert.equal(payload.disciplines.Paid_Media.doc_count, 1);
        assert.equal(payload.disciplines.Content_SEO.doc_count, 1);
        assert.equal(payload.disciplines.Lifecycle_Email.doc_count, 1);
        assert.equal(payload.disciplines.Paid_Media.chunk_count, 1);
      });
    } finally {
      env.cleanup();
    }
  });

  await t.test('[44-04-01 LIT-18] populated corpus must not produce zero retrieval hits', async () => {
    const expectedDisciplines = getFixtureDisciplineSet(fixtures);
    const goodCoverage = {
      Paid_Media: { doc_count: 1, chunk_count: 2 },
      Content_SEO: { doc_count: 1, chunk_count: 1 },
      Lifecycle_Email: { doc_count: 1, chunk_count: 1 },
    };

    assert.doesNotThrow(() => {
      assertNoZeroHitRegression(goodCoverage, expectedDisciplines);
    });
  });

  await t.test('[44-04-03 LIT-18] zero-hit diagnostics include missing disciplines and fixture expectation', async () => {
    const expectedDisciplines = getFixtureDisciplineSet(fixtures);
    const badCoverage = {
      Paid_Media: { doc_count: 0, chunk_count: 0 },
      Content_SEO: { doc_count: 1, chunk_count: 1 },
      Lifecycle_Email: { doc_count: 0, chunk_count: 0 },
    };

    let error;
    try {
      assertNoZeroHitRegression(badCoverage, expectedDisciplines);
    } catch (err) {
      error = err;
    }

    assert.ok(error, 'expected diagnostics error for zero-hit regression');
    assert.ok(error.message.includes('LIT-18 regression: populated corpus produced zero retrieval hits for disciplines:'));
    assert.ok(error.message.includes('Paid_Media'));
    assert.ok(error.message.includes('Lifecycle_Email'));
    assert.ok(error.message.includes('test/fixtures/literacy/'));
  });
});
