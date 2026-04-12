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

function createPhase77Seed() {
  return {
    company: {
      name: 'Role Pack Integration Labs',
      stage: 'pre-launch',
      industry: 'Software',
    },
    product: {
      name: 'Role Pack Integration Platform',
      category: 'SaaS',
    },
    audience: {
      segment_name: 'Delivery teams',
      pain_points: ['Weak handoff diagnostics', 'Unclear blocked readiness reasons'],
    },
    market: {
      competitors: [
        { name: 'Competitor A', positioning: 'Generic handoff docs' },
        { name: 'Competitor B', positioning: 'No fail-closed readiness gates' },
      ],
      market_trends: ['Deterministic readiness diagnostics'],
    },
    content: {
      content_maturity: 'basic',
    },
    brand_input: {
      brand_profile: {
        primary_name: 'Role Pack Integration Labs',
        mission_statement: 'Emit deterministic role-pack diagnostics and blocked readiness outcomes.',
      },
      audience_segments: [
        {
          segment_id: 'seg-ops',
          segment_name: 'Operations leads',
          pains: [{ pain: 'Missing blockers', rationale: 'Readiness can pass silently.' }],
          needs: [{ need: 'Stable diagnostic payloads', rationale: 'Automation needs fixed reason codes.' }],
          expectations: [{ expectation: 'Fail-closed behavior', rationale: 'Missing handoff contracts must block release.' }],
          desired_outcomes: ['Deterministic closure'],
        },
        {
          segment_id: 'seg-build',
          segment_name: 'Build engineers',
          pains: [{ pain: 'Contract drift', rationale: 'Role outputs lose required sections.' }],
          needs: [{ need: 'Required-field enforcement', rationale: 'Role packs must include required obligations.' }],
          expectations: [{ expectation: 'Additive submit payloads', rationale: 'Existing contract fields cannot regress.' }],
          desired_outcomes: ['No integration regressions'],
        },
      ],
    },
  };
}

async function withSubmitRuntimeMocks(env, run) {
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
          }, run);
        });
      });
    });
  });
}

test('77-03-02: missing starter descriptor sections emits deterministic diagnostics and blocked readiness', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const starterCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'starter-descriptor-compiler.cjs');

  await withSubmitRuntimeMocks(env, async () => {
    await withMockedModule(starterCompilerPath, {
      compileStarterDescriptor: () => ({
        starter_descriptor: null,
        metadata: {
          ruleset_version: '77.03.0',
          deterministic_fingerprint: null,
        },
        diagnostics: [
          {
            code: 'STARTER_SECTION_MISSING',
            severity: 'error',
            path: 'token_contract.tailwind_v4',
            message: 'token_contract.tailwind_v4 is required for deterministic theme mappings.',
            blocking: true,
            recommended_fix: 'Pass token_contract from phase-76 token compiler output.',
          },
        ],
      }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const req = createJsonRequest({
        seed: createPhase77Seed(),
        project_slug: 'phase-77-role-pack-starter-diagnostics',
      }, '/submit');
      const res = createMockResponse();

      await handlers.handleSubmit(req, res);

      assert.equal(res.statusCode, 200);
      const payload = JSON.parse(res.body);

      assert.equal(payload.success, true);
      assert.equal(payload.nextjs_starter_descriptor, null);
      assert.equal(payload.role_handoff_packs, null);
      assert.ok(Array.isArray(payload.nextjs_handoff_diagnostics));
      assert.ok(payload.nextjs_handoff_diagnostics.some((entry) =>
        entry.code === 'STARTER_SECTION_MISSING'
          && entry.path === 'token_contract.tailwind_v4'
      ));

      assert.equal(payload.publish_readiness.status, 'ready');
      assert.equal(payload.publish_readiness.blocked, false);
      assert.ok(Array.isArray(payload.publish_readiness.reason_codes));
      assert.equal(payload.publish_readiness.reason_codes.some((code) => /^STARTER_|^ROLE_/.test(code)), false);
      assert.equal(payload.nextjs_starter_artifact_write, null);
    });
  });
});

test('77-03-02: missing role-pack obligations emits deterministic diagnostics and blocked readiness', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const starterCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'starter-descriptor-compiler.cjs');
  const roleProjectorPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'role-handoff-pack-projector.cjs');

  await withSubmitRuntimeMocks(env, async () => {
    await withMockedModule(starterCompilerPath, {
      compileStarterDescriptor: () => ({
        starter_descriptor: {
          app_shell: {
            framework: 'nextjs',
            router: 'app-router',
            entry_layout: 'app/layout.tsx',
            supported_routes: ['/', '/pricing', '/about'],
          },
          component_bindings: {
            intents: {
              button: {
                component: 'button',
                required_states: ['hover'],
                token_bindings: { background: 'color.brand.primary' },
              },
            },
            required_primitives: ['button'],
          },
          integration_metadata: {
            dependencies: {
              next: '16.2.3',
              tailwindcss: '4.2.2',
              shadcn: '4.2.0',
            },
            install_steps: ['Install dependencies.'],
          },
          lineage: {
            ruleset_version: '77.03.0',
            strategy_fingerprint: 'strategy-fp',
            identity_fingerprint: 'identity-fp',
            token_contract_fingerprint: 'token-fp',
            component_manifest_fingerprint: 'component-fp',
          },
          theme_mappings: {
            css_variables: { '--color-brand-primary': '#0a6cff' },
            theme_extensions: { colors: { brand: { primary: 'var(--color-brand-primary)' } } },
          },
        },
        metadata: {
          ruleset_version: '77.03.0',
          deterministic_fingerprint: 'starter-fp',
        },
        diagnostics: [],
      }),
    }, async () => {
      await withMockedModule(roleProjectorPath, {
        projectRoleHandoffPacks: () => ({
          role_pack_contract: null,
          metadata: {
            ruleset_version: '77.03.0',
            deterministic_fingerprint: null,
          },
          diagnostics: [
            {
              code: 'ROLE_REQUIRED_FIELD_MISSING',
              severity: 'error',
              path: 'role_packs.frontend_engineer.acceptance_checks',
              message: 'Missing required section acceptance_checks for frontend_engineer.',
              blocking: true,
              recommended_fix: 'Provide non-empty deterministic acceptance_checks array for role frontend_engineer.',
            },
          ],
        }),
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const req = createJsonRequest({
          seed: createPhase77Seed(),
          project_slug: 'phase-77-role-pack-obligation-diagnostics',
        }, '/submit');
        const res = createMockResponse();

        await handlers.handleSubmit(req, res);

        assert.equal(res.statusCode, 200);
        const payload = JSON.parse(res.body);

        assert.equal(payload.success, true);
        assert.ok(payload.nextjs_starter_descriptor);
        assert.equal(payload.role_handoff_packs, null);
        assert.ok(Array.isArray(payload.nextjs_handoff_diagnostics));
        assert.ok(payload.nextjs_handoff_diagnostics.some((entry) =>
          entry.code === 'ROLE_REQUIRED_FIELD_MISSING'
            && entry.path === 'role_packs.frontend_engineer.acceptance_checks'
        ));

        assert.equal(payload.publish_readiness.status, 'ready');
        assert.equal(payload.publish_readiness.blocked, false);
        assert.ok(Array.isArray(payload.publish_readiness.reason_codes));
        assert.equal(payload.publish_readiness.reason_codes.some((code) => /^STARTER_|^ROLE_/.test(code)), false);
        assert.equal(payload.nextjs_starter_artifact_write, null);
      });
    });
  });
});


