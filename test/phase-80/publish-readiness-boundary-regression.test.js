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

function createSeed() {
  return {
    company: { name: 'Boundary Labs', stage: 'pre-launch', industry: 'Software' },
    product: { name: 'Boundary Guard', category: 'SaaS' },
    audience: { segment_name: 'Brand operators', pain_points: ['Diagnostic bleed', 'Ambiguous publish readiness'] },
    market: {
      competitors: [
        { name: 'Competitor A', positioning: 'Generic checks' },
        { name: 'Competitor B', positioning: 'Manual QA' },
      ],
      market_trends: ['Deterministic publish gates'],
    },
    content: { content_maturity: 'basic' },
    brand_input: {
      brand_profile: { primary_name: 'Boundary Labs', mission_statement: 'Keep diagnostic boundaries strict.' },
      audience_segments: [
        {
          segment_id: 'seg-1',
          segment_name: 'Brand operators',
          pains: [{ pain: 'Readiness confusion', rationale: 'Different diagnostics mix together.' }],
          needs: [{ need: 'Separated diagnostics', rationale: 'Publish and governance need distinct channels.' }],
          expectations: [{ expectation: 'Stable reason code contracts', rationale: 'Regression-safe pipelines.' }],
          desired_outcomes: ['No boundary drift'],
        },
        {
          segment_id: 'seg-2',
          segment_name: 'Release managers',
          pains: [{ pain: 'Noisy readiness payloads', rationale: 'Signals are mixed.' }],
          needs: [{ need: 'Accessibility-only readiness codes', rationale: 'Predictable policy.' }],
          expectations: [{ expectation: 'Governance in dedicated envelope', rationale: 'Machine-readable traces.' }],
          desired_outcomes: ['Deterministic releases'],
        },
      ],
    },
  };
}
test('80-01: publish_readiness remains accessibility-only when downstream diagnostic lanes and governance denial are present', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
  const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
  const readinessPath = path.join(env.dir, 'onboarding', 'backend', 'literacy', 'activation-readiness.cjs');
  const normalizePath = path.join(env.dir, 'onboarding', 'backend', 'brand-inputs', 'normalize-brand-input.cjs');
  const graphPath = path.join(env.dir, 'onboarding', 'backend', 'brand-inputs', 'evidence-graph-writer.cjs');
  const strategySynthPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'strategy-synthesizer.cjs');
  const contradictionPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'contradiction-detector.cjs');
  const messagingPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'messaging-rules-compiler.cjs');
  const roleViewsPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'role-view-projector.cjs');
  const strategyWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'strategy-artifact-writer.cjs');
  const identityCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'identity-compiler.cjs');
  const accessibilityPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'accessibility-gates.cjs');
  const identityWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'identity-artifact-writer.cjs');
  const tokenPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'token-compiler.cjs');
  const componentPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'component-contract-compiler.cjs');
  const designWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'design-system-artifact-writer.cjs');
  const starterCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'starter-descriptor-compiler.cjs');
  const rolePacksPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'role-handoff-pack-projector.cjs');
  const starterWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'starter-artifact-writer.cjs');
  const bundlePath = path.join(env.dir, 'onboarding', 'backend', 'brand-governance', 'bundle-registry.cjs');

  await withMockedModule(vectorStorePath, {
    configure: () => {},
    upsertSeed: async () => [],
    storeDraft: async () => ({ ok: true }),
  }, async () => {
    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({ drafts: {}, vectorStoreResults: [], errors: [] }),
    }, async () => {
      await withMockedModule(readinessPath, {
        evaluateLiteracyReadiness: async () => ({ readiness: 'ready', disciplines_available: [], gaps: [] }),
      }, async () => {
        await withMockedModule(normalizePath, {
          normalizeBrandInput: () => ({ content_fingerprint: 'brand-fp', normalized_segments: [] }),
          verifyDeterminism: () => ({ match: true }),
        }, async () => {
          await withMockedModule(graphPath, {
            upsertNormalizedSegments: async () => ({ profile_upserted: true, segments_upserted: [], edges_created: [] }),
            queryEvidenceByTenant: async () => [],
          }, async () => {
            await withMockedModule(strategySynthPath, {
              synthesizeStrategyArtifact: () => ({ artifact: { pillars: [] }, metadata: { ruleset_version: '80.01.0' } }),
            }, async () => {
              await withMockedModule(contradictionPath, {
                detectContradictions: () => [],
              }, async () => {
                await withMockedModule(messagingPath, {
                  compileMessagingRules: () => ({ compiled: true }),
                }, async () => {
                  await withMockedModule(roleViewsPath, {
                    projectRoleViews: () => ({ strategy: {} }),
                  }, async () => {
                    await withMockedModule(strategyWriterPath, {
                      persistStrategyArtifact: () => ({ artifact_id: 'tenant:strategy:80', artifact_fingerprint: 'fp-strategy-80' }),
                    }, async () => {
                      await withMockedModule(identityCompilerPath, {
                        compileIdentityArtifact: () => ({ artifact: {}, metadata: {} }),
                      }, async () => {
                        await withMockedModule(accessibilityPath, {
                          evaluateAccessibilityGates: () => ({
                            gate_status: 'blocked',
                            diagnostics: [
                              {
                                blocking: true,
                                check_id: 'contrast.text.primary_on_surface.default',
                                reason_code: 'ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD',
                                message: 'contrast below threshold',
                              },
                            ],
                          }),
                        }, async () => {
                          await withMockedModule(identityWriterPath, {
                            persistIdentityArtifact: () => ({ artifact_id: 'tenant:identity:80', artifact_fingerprint: 'fp-identity-80' }),
                          }, async () => {
                            await withMockedModule(tokenPath, {
                              compileTokenContract: () => ({
                                token_contract: { categories: { color: { 'color.brand.primary': '#0a6cff' } } },
                                metadata: { ruleset_version: '80.01.0', deterministic_fingerprint: 'token-fp-80' },
                                diagnostics: [
                                  {
                                    code: 'TOKEN_CATEGORY_MISSING',
                                    severity: 'error',
                                    path: 'categories.typography',
                                    message: 'Missing token category: typography',
                                    blocking: true,
                                  },
                                ],
                              }),
                            }, async () => {
                              await withMockedModule(componentPath, {
                                compileComponentContractManifest: () => ({
                                  component_contract_manifest: { primitives: [] },
                                  metadata: { ruleset_version: '80.01.0', deterministic_fingerprint: 'component-fp-80' },
                                  diagnostics: [
                                    {
                                      code: 'COMPONENT_STATE_COVERAGE_MISSING',
                                      severity: 'error',
                                      path: 'semantic_intent.required_states.loading',
                                      message: 'Missing required interaction state in semantic intent: loading',
                                      blocking: true,
                                    },
                                  ],
                                }),
                              }, async () => {
                                await withMockedModule(designWriterPath, {
                                  persistDesignSystemArtifacts: () => ({ artifact_id: 'tenant:design-system:80' }),
                                }, async () => {
                                  await withMockedModule(starterCompilerPath, {
                                    compileStarterDescriptor: () => ({
                                      starter_descriptor: { app_shell: {} },
                                      metadata: { ruleset_version: '80.01.0', deterministic_fingerprint: 'starter-fp-80' },
                                      diagnostics: [
                                        {
                                          code: 'STARTER_SECTION_MISSING',
                                          severity: 'error',
                                          path: 'starter_descriptor.integration_metadata',
                                          message: 'starter_descriptor.integration_metadata is required.',
                                          blocking: true,
                                        },
                                      ],
                                    }),
                                  }, async () => {
                                    await withMockedModule(rolePacksPath, {
                                      projectRoleHandoffPacks: () => ({
                                        role_pack_contract: { role_packs: {} },
                                        metadata: { ruleset_version: '80.01.0', deterministic_fingerprint: 'role-pack-fp-80' },
                                        diagnostics: [
                                          {
                                            code: 'ROLE_REQUIRED_FIELD_MISSING',
                                            severity: 'error',
                                            path: 'role_packs.frontend_engineer.acceptance_checks',
                                            message: 'Missing required section acceptance_checks for frontend_engineer.',
                                            blocking: true,
                                          },
                                        ],
                                      }),
                                    }, async () => {
                                      await withMockedModule(starterWriterPath, {
                                        persistStarterArtifacts: () => ({ artifact_id: 'tenant:starter:80' }),
                                      }, async () => {
                                        await withMockedModule(bundlePath, {
                                          createBundle: () => ({ denied: true, reason_code: 'BRAND_GOV_MISSING_LANE' }),
                                          getBundle: () => null,
                                          setVerificationEvidence: () => ({}),
                                        }, async () => {
                                          const handlers = loadFreshModule(handlersPath);
                                          const req = createJsonRequest({ seed: createSeed(), project_slug: 'phase-80-boundary-regression' }, '/submit');
                                          const res = createMockResponse();

                                          await handlers.handleSubmit(req, res);

                                          assert.equal(res.statusCode, 200);
                                          const payload = JSON.parse(res.body);
                                          assert.equal(payload.success, true);

                                          assert.equal(payload.publish_readiness.status, 'blocked');
                                          assert.equal(payload.publish_readiness.blocked, true);
                                          assert.deepEqual(payload.publish_readiness.reason_codes, ['ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD']);
                                          assert.equal(payload.publish_readiness.reason_codes.some((code) => /^TOKEN_|^COMPONENT_|^STARTER_|^ROLE_|^LINEAGE_|^BRAND_GOV_/.test(code)), false);

                                          assert.ok(Array.isArray(payload.design_system_diagnostics));
                                          assert.equal(payload.design_system_diagnostics.some((entry) => entry.code === 'TOKEN_CATEGORY_MISSING'), true);
                                          assert.equal(payload.design_system_diagnostics.some((entry) => entry.code === 'COMPONENT_STATE_COVERAGE_MISSING'), true);

                                          assert.ok(Array.isArray(payload.nextjs_handoff_diagnostics));
                                          assert.equal(payload.nextjs_handoff_diagnostics.some((entry) => entry.code === 'STARTER_SECTION_MISSING'), true);
                                          assert.equal(payload.nextjs_handoff_diagnostics.some((entry) => entry.code === 'ROLE_REQUIRED_FIELD_MISSING'), true);

                                          assert.equal(payload.branding_governance.error, 'bundle_creation_denied');
                                          assert.equal(payload.branding_governance.reason_code, 'BRAND_GOV_MISSING_LANE');
                                          assert.equal(payload.branding_governance.machine_readable, true);
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

