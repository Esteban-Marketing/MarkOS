const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  createTestEnvironment,
  createJsonRequest,
  withMockedModule,
} = require('../setup.js');

function createMockResponse() {
  return {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk = '') {
      this.body += chunk || '';
    },
  };
}

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function createPhase76Seed() {
  return {
    company: {
      name: 'Contract Integration Labs',
      stage: 'pre-launch',
      industry: 'Software',
    },
    product: {
      name: 'Design Contract Engine',
      category: 'SaaS',
    },
    audience: {
      segment_name: 'Frontend platform teams',
      pain_points: ['Inconsistent token naming', 'Missing component state docs'],
    },
    market: {
      competitors: [
        { name: 'Token Vendor A', positioning: 'Token-only outputs' },
        { name: 'Theme Vendor B', positioning: 'Manual mapping required' },
      ],
      market_trends: ['Deterministic contracts', 'Design system governance'],
    },
    content: {
      content_maturity: 'basic',
    },
    brand_input: {
      brand_profile: {
        primary_name: 'Contract Integration Labs',
        mission_statement: 'Deliver deterministic design-system contracts for every tenant.',
      },
      audience_segments: [
        {
          segment_id: 'seg-ui-platform',
          segment_name: 'UI platform team',
          pains: [{ pain: 'Unstable tokens', rationale: 'Release confidence drops when names drift.' }],
          needs: [{ need: 'Deterministic contracts', rationale: 'Build tooling requires replay-safe outputs.' }],
          expectations: [{ expectation: 'Lineage metadata', rationale: 'Audits need source links.' }],
          desired_outcomes: ['Predictable rollout'],
        },
        {
          segment_id: 'seg-product-ui',
          segment_name: 'Product UI engineers',
          pains: [{ pain: 'Missing state guidance', rationale: 'Components ship with interaction gaps.' }],
          needs: [{ need: 'Manifest coverage', rationale: 'Teams need explicit required states.' }],
          expectations: [{ expectation: 'Additive API behavior', rationale: 'Existing clients cannot break.' }],
          desired_outcomes: ['No regressions'],
        },
      ],
    },
  };
}

test('76-03-01: submit returns additive token/component contracts and replay-safe artifact write metadata', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
  const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
  const readinessPath = path.join(env.dir, 'onboarding', 'backend', 'literacy', 'activation-readiness.cjs');
  const tokenCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'token-compiler.cjs');
  const componentCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'component-contract-compiler.cjs');

  await withMockedModule(vectorStorePath, {
    configure: () => {},
    upsertSeed: async () => [],
    storeDraft: async () => ({ ok: true }),
  }, async () => {
    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({
        drafts: {
          company_profile: 'Drafted company profile',
          channel_strategy: 'Drafted channel strategy',
        },
        vectorStoreResults: [{ discipline: 'Paid_Media', status: 'ok' }],
        errors: [],
      }),
    }, async () => {
      await withMockedModule(readinessPath, {
        evaluateLiteracyReadiness: async () => ({ readiness: 'ready', disciplines_available: ['Paid_Media'], gaps: [] }),
      }, async () => {
        await withMockedModule(tokenCompilerPath, {
          compileTokenContract: () => ({
            token_contract: {
              categories: {
                color: { 'color.brand.primary': '#0a6cff' },
                typography: { 'type.body': { family: 'IBM Plex Sans' } },
                spacing: { 'space.4': '1rem' },
                radius: { 'radius.md': '0.5rem' },
                shadow: { 'shadow.md': '0 8px 24px rgba(16,24,40,0.18)' },
                motion: { 'duration.base': '180ms' },
              },
              tailwind_v4: {
                css_variables: { '--color-brand-primary': '#0a6cff' },
                theme_extensions: { colors: { brand: { primary: 'var(--color-brand-primary)' } } },
              },
              lineage: {
                ruleset_version: '76.03.0',
                strategy_fingerprint: 'strategy-fp',
                identity_fingerprint: 'identity-fp',
                decisions: [{ decision_id: 'D-08', source_node_ids: ['strategy:1'] }],
              },
            },
            metadata: {
              ruleset_version: '76.03.0',
              deterministic_fingerprint: 'token-fp-001',
            },
            diagnostics: [],
          }),
        }, async () => {
          await withMockedModule(componentCompilerPath, {
            compileComponentContractManifest: () => ({
              component_contract_manifest: {
                primitives: [
                  {
                    component: 'button',
                    required_variants: ['default'],
                    required_states: ['hover', 'focus-visible', 'active', 'disabled', 'loading'],
                    token_bindings: { background: 'color.brand.primary' },
                    mapping_rationale: 'Deterministic mapping',
                    lineage: { decision_id: 'D-08', source_node_ids: ['strategy:1'], source_kind: 'strategy_claim' },
                  },
                ],
                lineage: {
                  ruleset_version: '76.03.0',
                  strategy_fingerprint: 'strategy-fp',
                  identity_fingerprint: 'identity-fp',
                  decisions: ['D-08'],
                },
              },
              metadata: {
                ruleset_version: '76.03.0',
                deterministic_fingerprint: 'manifest-fp-001',
              },
              diagnostics: [],
            }),
          }, async () => {
            const handlers = loadFreshModule(handlersPath);
            const requestBody = {
              seed: createPhase76Seed(),
              project_slug: 'phase-76-contract-integration',
            };

            const firstReq = createJsonRequest(requestBody, '/submit');
            const firstRes = createMockResponse();
            await handlers.handleSubmit(firstReq, firstRes);

            assert.equal(firstRes.statusCode, 200);
            const firstPayload = JSON.parse(firstRes.body);

            assert.equal(firstPayload.success, true);
            assert.ok(firstPayload.slug);
            assert.ok(firstPayload.drafts);
            assert.ok(firstPayload.vector_store);

            assert.ok(firstPayload.token_contract);
            assert.ok(firstPayload.token_contract_metadata);
            assert.ok(firstPayload.component_contract_manifest);
            assert.ok(firstPayload.component_contract_metadata);
            assert.ok(Array.isArray(firstPayload.design_system_diagnostics));
            assert.equal(firstPayload.design_system_diagnostics.length, 0);
            assert.ok(firstPayload.design_system_artifact_write);
            assert.equal(firstPayload.design_system_artifact_write.created, true);
            assert.equal(firstPayload.design_system_artifact_write.upsert_count, 1);

            const secondReq = createJsonRequest(requestBody, '/submit');
            const secondRes = createMockResponse();
            await handlers.handleSubmit(secondReq, secondRes);

            assert.equal(secondRes.statusCode, 200);
            const secondPayload = JSON.parse(secondRes.body);

            assert.ok(secondPayload.design_system_artifact_write);
            assert.equal(secondPayload.design_system_artifact_write.created, false);
            assert.equal(secondPayload.design_system_artifact_write.upsert_count, 2);
            assert.equal(
              secondPayload.design_system_artifact_write.artifact_id,
              firstPayload.design_system_artifact_write.artifact_id
            );

            assert.ok(secondPayload.strategy_artifact);
            assert.ok(secondPayload.identity_artifact);
            assert.ok(secondPayload.publish_readiness);
          });
        });
      });
    });
  });
});
