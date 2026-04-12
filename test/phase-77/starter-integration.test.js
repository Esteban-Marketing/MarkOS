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
      name: 'Starter Integration Labs',
      stage: 'pre-launch',
      industry: 'Software',
    },
    product: {
      name: 'Starter Integration Platform',
      category: 'SaaS',
    },
    audience: {
      segment_name: 'Frontend platform teams',
      pain_points: ['Slow setup handoffs', 'Unclear role responsibilities'],
    },
    market: {
      competitors: [
        { name: 'Competitor A', positioning: 'Template-only approach' },
        { name: 'Competitor B', positioning: 'Manual handoff docs' },
      ],
      market_trends: ['Deterministic starter contracts'],
    },
    content: {
      content_maturity: 'basic',
    },
    brand_input: {
      brand_profile: {
        primary_name: 'Starter Integration Labs',
        mission_statement: 'Deliver deterministic Next.js starter and role-pack artifacts.',
      },
      audience_segments: [
        {
          segment_id: 'seg-platform',
          segment_name: 'Platform engineers',
          pains: [{ pain: 'Starter drift', rationale: 'Scaffolds diverge across teams.' }],
          needs: [{ need: 'Replay-safe starter output', rationale: 'Pipelines need deterministic artifacts.' }],
          expectations: [{ expectation: 'Role handoff precision', rationale: 'Each role needs concrete actions.' }],
          desired_outcomes: ['Faster implementation kickoff'],
        },
        {
          segment_id: 'seg-ops',
          segment_name: 'Founder operators',
          pains: [{ pain: 'Ambiguous handoff ownership', rationale: 'Cross-role sequencing breaks.' }],
          needs: [{ need: 'Deterministic acceptance checks', rationale: 'Gates need explicit evidence.' }],
          expectations: [{ expectation: 'Additive API payloads', rationale: 'Existing clients must keep working.' }],
          desired_outcomes: ['No response regressions'],
        },
      ],
    },
  };
}

test('77-03-01: submit returns additive nextjs starter outputs with replay-safe persistence metadata', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
  const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
  const readinessPath = path.join(env.dir, 'onboarding', 'backend', 'literacy', 'activation-readiness.cjs');
  const tokenCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'token-compiler.cjs');
  const componentCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'component-contract-compiler.cjs');
  const starterCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'starter-descriptor-compiler.cjs');
  const roleProjectorPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'role-handoff-pack-projector.cjs');

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
                        required_states: ['hover', 'focus-visible'],
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
                  role_pack_contract: {
                    descriptor_reference: 'starter:starter-fp',
                    role_packs: {
                      strategist: {
                        immediate_next_actions: [{ id: 'a-1', action: 'Validate route-story fit.', lineage: { descriptor_fingerprint: 'starter-fp', source_artifacts: ['strategy'] } }],
                        immutable_constraints: [{ id: 'c-1', constraint: 'Do not drift canonical claims.', lineage: { descriptor_fingerprint: 'starter-fp', source_artifacts: ['strategy'] } }],
                        acceptance_checks: [{ id: 'k-1', check: 'Route claims are aligned.', lineage: { descriptor_fingerprint: 'starter-fp', source_artifacts: ['strategy'] } }],
                        lineage: { descriptor_fingerprint: 'starter-fp', source_artifacts: ['strategy'] },
                      },
                    },
                  },
                  metadata: {
                    ruleset_version: '77.03.0',
                    descriptor_fingerprint: 'starter-fp',
                    deterministic_fingerprint: 'role-pack-fp',
                  },
                  diagnostics: [],
                }),
              }, async () => {
            const handlers = loadFreshModule(handlersPath);
            const requestBody = {
              seed: createPhase77Seed(),
              project_slug: 'phase-77-starter-integration',
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
            assert.ok(firstPayload.publish_readiness);

            assert.ok(firstPayload.nextjs_starter_descriptor);
            assert.ok(firstPayload.nextjs_starter_descriptor_metadata);
            assert.ok(firstPayload.role_handoff_packs);
            assert.ok(firstPayload.role_handoff_packs_metadata);
            assert.ok(Array.isArray(firstPayload.nextjs_handoff_diagnostics));
            assert.equal(firstPayload.nextjs_handoff_diagnostics.length, 0);

            assert.ok(firstPayload.nextjs_starter_artifact_write);
            assert.equal(firstPayload.nextjs_starter_artifact_write.created, true);
            assert.equal(firstPayload.nextjs_starter_artifact_write.upsert_count, 1);

            const secondReq = createJsonRequest(requestBody, '/submit');
            const secondRes = createMockResponse();
            await handlers.handleSubmit(secondReq, secondRes);

            assert.equal(secondRes.statusCode, 200);
            const secondPayload = JSON.parse(secondRes.body);

            assert.ok(secondPayload.nextjs_starter_artifact_write);
            assert.equal(secondPayload.nextjs_starter_artifact_write.created, false);
            assert.equal(secondPayload.nextjs_starter_artifact_write.upsert_count, 2);
            assert.equal(
              secondPayload.nextjs_starter_artifact_write.artifact_id,
              firstPayload.nextjs_starter_artifact_write.artifact_id
            );

            assert.ok(secondPayload.nextjs_starter_descriptor);
            assert.ok(secondPayload.role_handoff_packs);
              });
            });
          });
        });
      });
    });
  });
});
