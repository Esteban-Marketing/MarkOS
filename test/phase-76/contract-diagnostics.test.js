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

function createPhase76SeedWithDiagnosticIntent() {
  return {
    company: {
      name: 'Diagnostics Labs',
      stage: 'pre-launch',
      industry: 'Software',
    },
    product: {
      name: 'Diagnostics Engine',
      category: 'SaaS',
    },
    audience: {
      segment_name: 'UI governance teams',
      pain_points: ['State drift', 'Token contract gaps'],
    },
    market: {
      competitors: [
        { name: 'Verifier A', positioning: 'Checks only schema shape' },
        { name: 'Verifier B', positioning: 'No readiness signaling' },
      ],
      market_trends: ['Fail-closed release gates'],
    },
    content: {
      content_maturity: 'basic',
    },
    brand_input: {
      brand_profile: {
        primary_name: 'Diagnostics Labs',
        mission_statement: 'Block readiness on missing contract requirements.',
      },
      audience_segments: [
        {
          segment_id: 'seg-governance',
          segment_name: 'Design governance',
          pains: [{ pain: 'Silent contract failures', rationale: 'Teams ship broken states without warnings.' }],
          needs: [{ need: 'Explicit diagnostics', rationale: 'Blocking evidence must be machine-readable.' }],
          expectations: [{ expectation: 'Deterministic reason codes', rationale: 'Audit trails need stable values.' }],
          desired_outcomes: ['Fail-closed release pipeline'],
        },
        {
          segment_id: 'seg-platform',
          segment_name: 'Platform maintainers',
          pains: [{ pain: 'Ad-hoc remediation', rationale: 'Missing diagnostics slow fixes.' }],
          needs: [{ need: 'Actionable paths', rationale: 'Engineers need exact failing fields.' }],
          expectations: [{ expectation: 'No route regressions', rationale: 'Submit contract must stay additive.' }],
          desired_outcomes: ['Stable operation'],
        },
      ],
    },
  };
}

test('76-03-02: missing required token categories/states block readiness with deterministic diagnostics', async (t) => {
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
            token_contract: null,
            metadata: {
              ruleset_version: '76.03.0',
              deterministic_fingerprint: null,
            },
            diagnostics: [
              {
                code: 'TOKEN_CATEGORY_MISSING',
                severity: 'error',
                path: 'categories.color',
                message: 'Missing token category: color',
                blocking: true,
                recommended_fix: 'Ensure compiler input can derive at least one token for color.',
              },
            ],
          }),
        }, async () => {
          await withMockedModule(componentCompilerPath, {
            compileComponentContractManifest: () => ({
              component_contract_manifest: null,
              metadata: {
                ruleset_version: '76.03.0',
                deterministic_fingerprint: null,
              },
              diagnostics: [
                {
                  code: 'COMPONENT_STATE_COVERAGE_MISSING',
                  severity: 'error',
                  path: 'semantic_intent.required_states.loading',
                  message: 'Missing required interaction state in semantic intent: loading',
                  blocking: true,
                  recommended_fix: 'Include "loading" in semantic_intent.required_states.',
                },
              ],
            }),
          }, async () => {
            const handlers = loadFreshModule(handlersPath);
            const req = createJsonRequest({
              seed: createPhase76SeedWithDiagnosticIntent(),
              project_slug: 'phase-76-contract-diagnostics',
            }, '/submit');
            const res = createMockResponse();

            await handlers.handleSubmit(req, res);

            assert.equal(res.statusCode, 200);
            const payload = JSON.parse(res.body);

            assert.equal(payload.success, true);
            assert.equal(payload.publish_readiness.status, 'ready');
            assert.equal(payload.publish_readiness.blocked, false);
            assert.ok(Array.isArray(payload.publish_readiness.reason_codes));
            assert.equal(payload.publish_readiness.reason_codes.some((code) => /^TOKEN_|^COMPONENT_/.test(code)), false);

            assert.ok(Array.isArray(payload.design_system_diagnostics));
            assert.equal(payload.design_system_diagnostics.length, 2);
            assert.ok(payload.design_system_diagnostics.some((entry) =>
              entry.code === 'TOKEN_CATEGORY_MISSING'
                && entry.path === 'categories.color'
                && entry.message === 'Missing token category: color'
            ));
            assert.ok(payload.design_system_diagnostics.some((entry) =>
              entry.code === 'COMPONENT_STATE_COVERAGE_MISSING'
                && entry.path === 'semantic_intent.required_states.loading'
                && entry.message === 'Missing required interaction state in semantic intent: loading'
            ));

            assert.equal(payload.token_contract, null);
            assert.equal(payload.component_contract_manifest, null);
            assert.equal(payload.design_system_artifact_write, null);
          });
        });
      });
    });
  });
});


